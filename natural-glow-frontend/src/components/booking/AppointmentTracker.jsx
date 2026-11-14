import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatDateTime, formatPrice } from '../../lib/format.js';
import { StatusBadge } from '../ui/Feedback.jsx';
import Icon from '../ui/Icon.jsx';

const STORAGE_KEY = 'ng_appointment_token';
const POLL_MS = 20000;

// The tracking token lives only in this browser. Storage can be blocked, so every access is guarded.
export const trackedToken = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },
  set(token) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* storage unavailable: the card still shows for this visit */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

// What the customer sees for each status the salon can set in the admin panel.
const COPY = {
  pending: {
    tone: 'bg-amber-50 border-amber-200 text-amber-900',
    title: 'Request received',
    text: 'Your request is pending. The salon will review it and confirm your time. This page updates by itself once it does.',
  },
  confirmed: {
    tone: 'bg-green-50 border-green-200 text-green-900',
    title: 'Your appointment is confirmed',
    text: 'The salon has confirmed your appointment. We look forward to seeing you!',
  },
  rescheduled: {
    tone: 'bg-blue-50 border-blue-200 text-blue-900',
    title: 'Your appointment was rescheduled',
    text: 'The salon has moved your appointment to the time below. If it does not suit you, please message us.',
  },
  completed: {
    tone: 'bg-stone-50 border-stone-200 text-stone-800',
    title: 'Appointment completed',
    text: 'Thank you for visiting us. We hope you loved it!',
  },
  cancelled: {
    tone: 'bg-red-50 border-red-200 text-red-900',
    title: 'Appointment cancelled',
    text: 'This appointment was cancelled. You are welcome to request a new time.',
  },
};

// Shows the customer's own request and keeps its status up to date (polls while the tab is visible).
// `initial` is the response of the booking call, so the card appears instantly with no loading flash.
export default function AppointmentTracker({ token, initial, onNew }) {
  const { settings, whatsapp } = useSettings();
  const [appt, setAppt] = useState(initial || null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(
    async (signal) => {
      try {
        const { data } = await publicApi.trackAppointment(token, signal);
        setAppt(data);
        setFailed(false);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (err.status === 404) onNew(); // unknown/removed request: forget it and show the form again
        else setFailed(true); // offline etc.: keep what we have
      }
    },
    [token, onNew]
  );

  useEffect(() => {
    if (!token) return undefined; // no tracking code (e.g. older backend): just show what the booking call returned
    const ctrl = new AbortController();
    refresh(ctrl.signal);
    const tick = () => {
      if (document.visibilityState === 'visible') refresh(ctrl.signal);
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      ctrl.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  if (!appt) {
    return (
      <div className="card p-6 sm:p-8" role="status" aria-busy="true">
        <p className="text-sm text-ink/65">Checking your appointment…</p>
      </div>
    );
  }

  const copy = COPY[appt.status] || COPY.pending;
  const waHref = whatsapp(
    `Hello ${settings.salonName}, this is regarding my ${appt.serviceName} appointment on ${formatDateTime(appt.preferredAt)}.`
  );
  const timeLabel = appt.status === 'pending' ? 'Requested time' : 'Appointment time';

  return (
    <div className="card p-6 sm:p-8" role="status" aria-live="polite">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-200 text-olive-800">
        <Icon name="check" size={22} />
      </span>
      <p className="mt-4 text-xs text-ink/55">Your appointment{appt.customerName ? ` · ${appt.customerName}` : ''}</p>
      <h3 className="font-serif text-2xl">{copy.title}</h3>
      <p className={`mt-3 rounded-xl border px-4 py-3 text-sm ${copy.tone}`}>{copy.text}</p>

      <dl className="mt-5 space-y-2 rounded-xl bg-cream-100 p-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-ink/60">Service</dt><dd className="text-right font-medium">{appt.serviceName}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-ink/60">Price</dt><dd className="font-medium">{formatPrice(appt.servicePrice)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-ink/60">{timeLabel}</dt><dd className="text-right font-medium">{formatDateTime(appt.preferredAt)}</dd></div>
        <div className="flex items-center justify-between gap-4"><dt className="text-ink/60">Status</dt><dd><StatusBadge status={appt.status} /></dd></div>
      </dl>
      {failed && <p className="mt-3 text-xs text-ink/55">Could not refresh just now. We will keep trying.</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Icon name="whatsapp" size={18} /> Message us on WhatsApp
          </a>
        )}
        <button className="btn btn-outline" onClick={onNew}>
          Book another appointment
        </button>
      </div>
    </div>
  );
}
