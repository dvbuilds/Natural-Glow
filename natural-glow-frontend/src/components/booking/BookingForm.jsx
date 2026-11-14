import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/public.js';
import { BOOKING_WINDOW_DAYS, MIN_LEAD_MINUTES } from '../../config/env.js';
import { useServices } from '../../context/ServicesContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { label } from '../../lib/constants.js';
import {
  addDaysIst,
  buildSlots,
  formatPrice,
  istDateString,
  istInstant,
  to12h,
  weekdayOfDateString,
} from '../../lib/format.js';
import { PHONE_RE, hasErrors, mapApiErrors } from '../../lib/validate.js';
import { Honeypot, SelectField, TextField, Field } from '../ui/Form.jsx';
import AppointmentTracker, { trackedToken } from './AppointmentTracker.jsx';

const EMPTY = { customerName: '', phone: '', serviceId: '', preferredDate: '', preferredTime: '', website: '' };

// Human messages for backend error codes (POST /appointments)
const CODE_MESSAGES = {
  DUPLICATE_APPOINTMENT: 'You have already sent a request for this service at this time. We will be in touch to confirm it.',
  TOO_MANY_PENDING_REQUESTS: 'You already have several pending requests. Please wait for the salon to respond before sending more.',
  SERVICE_NOT_AVAILABLE: 'That service is no longer available. Please choose another one.',
  RATE_LIMITED: 'Too many submissions from this device. Please try again in a while.',
};
const CODE_FIELD = {
  PREFERRED_TIME_TOO_SOON: 'preferredTime',
  PREFERRED_TIME_TOO_FAR: 'preferredDate',
  SALON_CLOSED: 'preferredDate',
  OUTSIDE_WORKING_HOURS: 'preferredTime',
  INVALID_DATE: 'preferredDate',
  SERVICE_NOT_AVAILABLE: 'serviceId',
};

export default function BookingForm() {
  const { settings } = useSettings();
  const { services, loading: servicesLoading, error: servicesError } = useServices();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ ...EMPTY, serviceId: params.get('service') || '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // The customer's last request (kept in this browser) so they still see its status after a refresh.
  const [token, setToken] = useState(() => trackedToken.get());
  const [done, setDone] = useState(null);

  const startNew = useCallback(() => {
    trackedToken.clear();
    setToken('');
    setDone(null);
    setValues({ ...EMPTY });
  }, []);

  // Preselect when arriving from "Book" links (e.g. /contact?service=<id>#booking)
  const serviceParam = params.get('service');
  useEffect(() => {
    if (serviceParam) setValues((v) => ({ ...v, serviceId: serviceParam }));
  }, [serviceParam]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [k]: val }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setFormError('');
  };

  const today = istDateString();
  const maxDate = addDaysIst(BOOKING_WINDOW_DAYS);
  const selectedService = services.find((s) => s._id === values.serviceId);

  // Working-hours aware time choices. Once the salon has saved hours (Admin → Settings), the backend rejects times
  // outside them, so we only offer valid 30-minute slots. Days without saved hours fall back to a free time input.
  const timeOptions = useMemo(() => {
    if (!values.preferredDate) return { mode: 'pick-date' };
    const hours = settings.workingHours.find((h) => h.day === weekdayOfDateString(values.preferredDate));
    if (!hours) return { mode: 'free' };
    if (hours.isClosed) return { mode: 'closed' };
    const earliest = Date.now() + (MIN_LEAD_MINUTES + 1) * 60000;
    const slots = buildSlots(hours.open, hours.close).filter((t) => istInstant(values.preferredDate, t).getTime() >= earliest);
    return { mode: 'slots', slots, hours };
  }, [values.preferredDate, settings.workingHours]);

  useEffect(() => {
    if (timeOptions.mode === 'slots' && values.preferredTime && !timeOptions.slots.includes(values.preferredTime)) {
      setValues((v) => ({ ...v, preferredTime: '' }));
    }
  }, [timeOptions, values.preferredTime]);

  const validate = () => {
    const e = {};
    const v = values;
    if (v.customerName.trim().length < 2) e.customerName = 'Please enter your name (at least 2 characters).';
    if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a valid phone number (8–17 digits, optional +).';
    if (!v.serviceId) e.serviceId = 'Please choose a service.';
    if (!v.preferredDate) e.preferredDate = 'Please choose a date.';
    else if (v.preferredDate < today) e.preferredDate = 'Please choose today or a later date.';
    else if (v.preferredDate > maxDate) e.preferredDate = `Requests can be made up to ${BOOKING_WINDOW_DAYS} days ahead.`;
    if (!v.preferredTime) e.preferredTime = 'Please choose a time.';
    else if (!e.preferredDate && istInstant(v.preferredDate, v.preferredTime).getTime() < Date.now() + MIN_LEAD_MINUTES * 60000) {
      e.preferredTime = `Please choose a time at least ${MIN_LEAD_MINUTES} minutes from now.`;
    }
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (hasErrors(e)) return;

    setSubmitting(true);
    setFormError('');
    try {
      // Only user-entered fields are sent. Status and price are decided by the server.
      const { data } = await publicApi.createAppointment({
        customerName: values.customerName.trim(),
        phone: values.phone.trim(),
        serviceId: values.serviceId,
        preferredDate: values.preferredDate,
        preferredTime: values.preferredTime,
        website: values.website,
      });
      if (data.trackingToken) trackedToken.set(data.trackingToken);
      setDone(data);
      setToken(data.trackingToken || '');
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        setErrors(mapApiErrors(err));
        setFormError('Please correct the highlighted fields.');
      } else {
        const field = CODE_FIELD[err.code];
        if (field) setErrors({ [field]: err.message });
        setFormError(CODE_MESSAGES[err.code] || err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (token || done) {
    return <AppointmentTracker token={token} initial={done} onNew={startNew} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8" aria-labelledby="booking-title">
      <p className="text-xs text-ink/55">Booking form</p>
      <h3 id="booking-title" className="font-serif text-2xl sm:text-3xl">Let’s Get You Glowing</h3>
      <p className="mt-2 text-sm text-ink/65">{settings.bookingNotice}</p>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
        <Honeypot value={values.website} onChange={(v) => setValues((s) => ({ ...s, website: v }))} />

        <TextField label="Full name" required value={values.customerName} onChange={set('customerName')} error={errors.customerName} autoComplete="name" maxLength={80} />
        <TextField label="Phone" required type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" placeholder="+91 …" />

        <div className="sm:col-span-2">
          <SelectField label="Service" required value={values.serviceId} onChange={set('serviceId')} error={errors.serviceId} disabled={servicesLoading}>
            <option value="">{servicesLoading ? 'Loading services…' : 'Select a service'}</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({label(s.category)}) – {formatPrice(s.price, s.priceType)}
              </option>
            ))}
          </SelectField>
          {servicesError && <p className="mt-1 text-xs text-red-700">Could not load services. Please refresh the page.</p>}
          {selectedService && (
            <p className="mt-1 text-xs text-ink/55">
              Listed price {formatPrice(selectedService.price, selectedService.priceType)}
              {selectedService.durationMinutes ? ` · about ${selectedService.durationMinutes} min` : ''}. The salon confirms the final details.
            </p>
          )}
        </div>

        <TextField
          label="Preferred date"
          required
          type="date"
          min={today}
          max={maxDate}
          value={values.preferredDate}
          onChange={set('preferredDate')}
          error={errors.preferredDate}
        />

        {timeOptions.mode === 'slots' ? (
          <SelectField label="Preferred time" required value={values.preferredTime} onChange={set('preferredTime')} error={errors.preferredTime} disabled={!timeOptions.slots.length}>
            <option value="">{timeOptions.slots.length ? 'Select a time' : 'No times left on this day'}</option>
            {timeOptions.slots.map((t) => (
              <option key={t} value={t}>{to12h(t)}</option>
            ))}
          </SelectField>
        ) : (
          <Field label="Preferred time" required error={errors.preferredTime}>
            <input
              type="time"
              className={`input ${errors.preferredTime ? 'input-invalid' : ''}`}
              value={values.preferredTime}
              onChange={set('preferredTime')}
              disabled={timeOptions.mode === 'closed' || timeOptions.mode === 'pick-date'}
              aria-label="Preferred time"
            />
          </Field>
        )}
        {timeOptions.mode === 'closed' && (
          <p className="text-sm text-red-700 sm:col-span-2" role="alert">The salon is closed on the selected day. Please pick another date.</p>
        )}
        {timeOptions.mode === 'slots' && (
          <p className="text-xs text-ink/55 sm:col-span-2">Open {to12h(timeOptions.hours.open)} – {to12h(timeOptions.hours.close)} on this day. Times are IST.</p>
        )}
      </div>

      {formError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>
      )}

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Request Appointment'}
      </button>
      <p className="mt-3 text-center text-xs text-ink/55">This sends a request only. Your time is not reserved until the salon confirms.</p>
    </form>
  );
}