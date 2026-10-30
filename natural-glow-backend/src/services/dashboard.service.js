import { Appointment } from '../models/Appointment.js';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { Gallery } from '../models/Gallery.js';
import { Offer } from '../models/Offer.js';
import { Service } from '../models/Service.js';
import { Testimonial } from '../models/Testimonial.js';
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_STATUSES } from '../models/constants.js';
import { fromIst, istDateString } from '../utils/time.js';

export async function getDashboardStats() {
  const now = new Date();
  const today = istDateString(now);
  const dayStart = fromIst(today, '00:00');
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    byStatusRaw,
    upcoming,
    today_,
    services,
    offers,
    testimonials,
    gallery,
    enquiriesNew,
    recentAppointments,
    recentEnquiries,
  ] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.countDocuments({ status: { $in: ACTIVE_APPOINTMENT_STATUSES }, preferredAt: { $gte: now } }),
    Appointment.countDocuments({
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
      preferredAt: { $gte: dayStart, $lt: dayEnd },
    }),
    Service.aggregate([{ $group: { _id: '$isActive', count: { $sum: 1 } } }]),
    Offer.aggregate([{ $group: { _id: '$isActive', count: { $sum: 1 } } }]),
    Testimonial.aggregate([{ $group: { _id: '$isPublished', count: { $sum: 1 } } }]),
    Gallery.countDocuments({}),
    ContactEnquiry.countDocuments({ status: 'new' }),
    Appointment.find().sort({ createdAt: -1 }).limit(5).select('customerName serviceName preferredAt status createdAt').lean(),
    ContactEnquiry.find().sort({ createdAt: -1 }).limit(5).select('name subject status createdAt').lean(),
  ]);

  const byStatus = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]));
  for (const r of byStatusRaw) byStatus[r._id] = r.count;

  const split = (rows) => ({
    active: rows.find((r) => r._id === true)?.count ?? 0,
    inactive: rows.find((r) => r._id === false)?.count ?? 0,
  });
  const t = testimonials;

  return {
    appointments: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      byStatus,
      pendingRequests: byStatus.pending,
      upcoming,
      today: today_,
    },
    services: split(services),
    offers: split(offers),
    testimonials: {
      published: t.find((r) => r._id === true)?.count ?? 0,
      unpublished: t.find((r) => r._id === false)?.count ?? 0,
    },
    gallery: { total: gallery },
    enquiries: { new: enquiriesNew },
    recent: { appointments: recentAppointments, enquiries: recentEnquiries },
  };
}
