import { env } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';
import { SalonSettings } from '../models/SalonSettings.js';
import { Service } from '../models/Service.js';
import { ACTIVE_APPOINTMENT_STATUSES, STATUS_TRANSITIONS } from '../models/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, toSort } from '../utils/pagination.js';
import { escapeRegex } from '../utils/text.js';
import { fromIst, istTimeString, istWeekday } from '../utils/time.js';

const MIN_LEAD_MINUTES = 60;
const MAX_PENDING_PER_PHONE = 3;

const makeDedupeKey = (phone, serviceId, date) => `${phone}:${serviceId}:${date.getTime()}`;

async function assertWithinBookingRules(preferredAt, { enforceWindow = true } = {}) {
  const now = Date.now();
  if (preferredAt.getTime() < now + MIN_LEAD_MINUTES * 60 * 1000) {
    throw ApiError.badRequest(`Preferred time must be at least ${MIN_LEAD_MINUTES} minutes from now`, {
      code: 'PREFERRED_TIME_TOO_SOON',
    });
  }
  if (enforceWindow && preferredAt.getTime() > now + env.BOOKING_WINDOW_DAYS * 86400000) {
    throw ApiError.badRequest(`Requests can be made up to ${env.BOOKING_WINDOW_DAYS} days ahead`, {
      code: 'PREFERRED_TIME_TOO_FAR',
    });
  }

  // Only enforced once the salon has configured its working hours.
  const settings = await SalonSettings.findOne({ key: 'main' }).select('workingHours').lean();
  const hours = settings?.workingHours?.find((h) => h.day === istWeekday(preferredAt));
  if (hours) {
    if (hours.isClosed) {
      throw ApiError.badRequest('The salon is closed on the selected day', { code: 'SALON_CLOSED' });
    }
    const t = istTimeString(preferredAt);
    if (t < hours.open || t >= hours.close) {
      throw ApiError.badRequest(`Please choose a time between ${hours.open} and ${hours.close}`, {
        code: 'OUTSIDE_WORKING_HOURS',
      });
    }
  }
}

const duplicateError = () =>
  ApiError.conflict('A request for this service at this time has already been submitted', {
    code: 'DUPLICATE_APPOINTMENT',
  });

// NOTE: this creates a *request*. It does not reserve a slot or check availability.
export async function createAppointment(input) {
  const preferredAt = fromIst(input.preferredDate, input.preferredTime);
  if (!preferredAt) throw ApiError.badRequest('Invalid preferred date or time', { code: 'INVALID_DATE' });

  // Name and price always come from the database, never from the client.
  const service = await Service.findOne({ _id: input.serviceId, isActive: true }).select('name price').lean();
  if (!service) throw ApiError.notFound('Selected service is not available', { code: 'SERVICE_NOT_AVAILABLE' });

  await assertWithinBookingRules(preferredAt);

  const dedupeKey = makeDedupeKey(input.phone, service._id, preferredAt);
  if (await Appointment.exists({ dedupeKey })) throw duplicateError();

  const pending = await Appointment.countDocuments({ phone: input.phone, status: 'pending' });
  if (pending >= MAX_PENDING_PER_PHONE) {
    throw new ApiError(429, 'You already have several pending requests. Please wait for the salon to respond.', {
      code: 'TOO_MANY_PENDING_REQUESTS',
    });
  }

  try {
    const doc = await Appointment.create({
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || '',
      service: service._id,
      serviceName: service.name,
      servicePrice: service.price,
      preferredAt,
      notes: input.notes || '',
      status: 'pending',
      statusHistory: [{ status: 'pending', preferredAt }],
      dedupeKey,
    });
    return {
      _id: doc._id,
      serviceName: doc.serviceName,
      servicePrice: doc.servicePrice,
      preferredAt: doc.preferredAt,
      status: doc.status,
    };
  } catch (err) {
    if (err?.code === 11000) throw duplicateError(); // concurrent duplicate caught by the unique index
    throw err;
  }
}

export async function listAppointments(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.serviceId) filter.service = q.serviceId;
  if (q.from || q.to) {
    filter.preferredAt = {};
    if (q.from) filter.preferredAt.$gte = fromIst(q.from, '00:00') ?? new Date(NaN);
    if (q.to) filter.preferredAt.$lte = fromIst(q.to, '23:59') ?? new Date(NaN);
    if (Object.values(filter.preferredAt).some((d) => Number.isNaN(d.getTime()))) {
      throw ApiError.badRequest('Invalid from/to date', { code: 'INVALID_DATE' });
    }
  }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ customerName: rx }, { phone: rx }, { serviceName: rx }];
  }
  return paginate(Appointment, filter, {
    page: q.page,
    limit: q.limit,
    sort: toSort(q.sort),
    select: '-__v -dedupeKey',
  });
}

export async function getAppointment(id) {
  const doc = await Appointment.findById(id).select('-__v -dedupeKey').lean();
  if (!doc) throw ApiError.notFound('Appointment not found');
  return doc;
}

export async function updateAppointmentStatus(id, input) {
  const doc = await Appointment.findById(id);
  if (!doc) throw ApiError.notFound('Appointment not found');

  const allowed = STATUS_TRANSITIONS[doc.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw ApiError.conflict(`Cannot change status from "${doc.status}" to "${input.status}"`, {
      code: 'INVALID_STATUS_TRANSITION',
    });
  }

  let { preferredAt } = doc;
  if (input.status === 'rescheduled') {
    const newAt = fromIst(input.newDate, input.newTime);
    if (!newAt) throw ApiError.badRequest('Invalid newDate or newTime', { code: 'INVALID_DATE' });
    await assertWithinBookingRules(newAt, { enforceWindow: false });
    preferredAt = newAt;
  }

  doc.status = input.status;
  doc.preferredAt = preferredAt;
  if (input.adminNotes !== undefined) doc.adminNotes = input.adminNotes;
  doc.statusHistory.push({ status: input.status, note: input.note || '', preferredAt });
  // Only active requests hold a dedupe key; completed/cancelled ones release it.
  doc.dedupeKey = ACTIVE_APPOINTMENT_STATUSES.includes(input.status)
    ? makeDedupeKey(doc.phone, doc.service, preferredAt)
    : undefined;

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) throw duplicateError();
    throw err;
  }
  return doc.toJSON();
}
