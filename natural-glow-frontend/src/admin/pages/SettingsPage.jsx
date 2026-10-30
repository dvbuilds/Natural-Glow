import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { Switch, TextArea, TextField } from '../../components/ui/Form.jsx';
import { ErrorState, Spinner } from '../../components/ui/Feedback.jsx';
import { useApi } from '../../hooks/useApi.js';
import { WEEKDAYS, dayLabel } from '../../lib/constants.js';
import { EMAIL_RE, PHONE_RE, hasErrors, isHttpsUrl, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FormSection } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const emptyHours = () => Object.fromEntries(WEEKDAYS.map((d) => [d, { isClosed: false, open: '', close: '' }]));

const toForm = (s) => {
  const hours = emptyHours();
  for (const h of s.workingHours || []) hours[h.day] = { isClosed: Boolean(h.isClosed), open: h.open || '', close: h.close || '' };
  return {
    salonName: s.salonName || '',
    tagline: s.tagline || '',
    phone: s.phone || '',
    whatsappNumber: s.whatsappNumber || '',
    email: s.email || '',
    address: { line1: '', area: '', city: '', state: '', postalCode: '', landmark: '', ...(s.address || {}) },
    mapUrl: s.mapUrl || '',
    social: { facebook: '', instagram: '', youtube: '', ...(s.social || {}) },
    bookingNotice: s.bookingNotice || '',
    seoTitle: s.seoTitle || '',
    seoDescription: s.seoDescription || '',
    hours,
  };
};

function validate(f) {
  const e = {};
  if (f.salonName.trim().length < 2) e.salonName = 'Salon name must be at least 2 characters.';
  if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (f.whatsappNumber.trim() && !PHONE_RE.test(f.whatsappNumber.trim())) e.whatsappNumber = 'Enter a valid number (with country code, e.g. 91…).';
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.mapUrl.trim() && !isHttpsUrl(f.mapUrl.trim())) e.mapUrl = 'Must be a full https:// URL.';
  for (const k of ['facebook', 'instagram', 'youtube']) {
    if (f.social[k].trim() && !isHttpsUrl(f.social[k].trim())) e[`social.${k}`] = 'Must be a full https:// URL.';
  }
  for (const d of WEEKDAYS) {
    const h = f.hours[d];
    if (h.isClosed) continue;
    if ((h.open && !h.close) || (!h.open && h.close)) e[`hours.${d}`] = 'Enter both opening and closing times.';
    else if (h.open && h.close && h.close <= h.open) e[`hours.${d}`] = 'Closing time must be after opening time.';
  }
  return e;
}

const toPayload = (f) => ({
  salonName: f.salonName.trim(),
  tagline: f.tagline.trim(),
  phone: f.phone.trim(),
  whatsappNumber: f.whatsappNumber.trim(),
  email: f.email.trim(),
  address: Object.fromEntries(Object.entries(f.address).map(([k, v]) => [k, String(v).trim()])),
  mapUrl: f.mapUrl.trim(),
  // Only days with times (or marked closed) are saved. Days left blank have no restriction.
  workingHours: WEEKDAYS.filter((d) => f.hours[d].isClosed || (f.hours[d].open && f.hours[d].close)).map((d) =>
    f.hours[d].isClosed ? { day: d, isClosed: true } : { day: d, open: f.hours[d].open, close: f.hours[d].close, isClosed: false }
  ),
  social: Object.fromEntries(Object.entries(f.social).map(([k, v]) => [k, v.trim()])),
  bookingNotice: f.bookingNotice.trim(),
  seoTitle: f.seoTitle.trim(),
  seoDescription: f.seoDescription.trim(),
});

export default function SettingsPage() {
  const { data, loading, error, reload } = useApi((signal) => adminApi.settings.get(signal), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  if (error && !form) return <ErrorState error={error} onRetry={reload} />;
  if (!form) return <Spinner className="h-7 w-7" />;

  const clear = (k) => setErrors((er) => ({ ...er, [k]: undefined }));
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    clear(k);
  };
  const setNested = (group, k) => (e) => {
    setForm((f) => ({ ...f, [group]: { ...f[group], [k]: e.target.value } }));
    clear(`${group}.${k}`);
  };
  const setHours = (d, patch) => {
    setForm((f) => ({ ...f, hours: { ...f.hours, [d]: { ...f.hours[d], ...patch } } }));
    clear(`hours.${d}`);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = validate(form);
    setErrors(er);
    if (hasErrors(er)) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setFormError('');
    const res = await run(() => adminApi.settings.update(toPayload(form)), {
      success: 'Settings saved. The website now shows the updated details.',
      onError: (e) => {
        if (e.code === 'VALIDATION_ERROR') {
          const mapped = mapApiErrors(e);
          // workingHours.N.* -> show on the matching day row
          for (const [k, v] of Object.entries(mapped)) {
            const m = k.match(/^workingHours\.(\d+)/);
            if (m) mapped[`hours.general`] = v;
          }
          setErrors(mapped);
        }
        setFormError(e.message);
      },
    });
    if (res.ok) setForm(toForm(res.result.data));
  };

  return (
    <>
      <AdminPageHeader title="Salon settings" subtitle="Contact details, hours, social links and SEO. The public website reads these live." />
      <form onSubmit={submit} noValidate className="max-w-4xl space-y-6">
        <FormSection title="Salon">
          <TextField label="Salon name" required value={form.salonName} onChange={set('salonName')} error={errors.salonName} maxLength={120} />
          <TextField label="Tagline" value={form.tagline} onChange={set('tagline')} error={errors.tagline} maxLength={160} hint="Shown under the hero heading and in the footer." />
        </FormSection>

        <FormSection title="Contact">
          <TextField label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <TextField label="WhatsApp number" type="tel" value={form.whatsappNumber} onChange={set('whatsappNumber')} error={errors.whatsappNumber} hint="Include the country code. Turns on the WhatsApp booking buttons." />
          <TextField label="Email" type="email" className="sm:col-span-2" value={form.email} onChange={set('email')} error={errors.email} />
        </FormSection>

        <FormSection title="Address">
          <TextField label="Address line" className="sm:col-span-2" value={form.address.line1} onChange={setNested('address', 'line1')} error={errors['address.line1']} maxLength={160} />
          <TextField label="Area" value={form.address.area} onChange={setNested('address', 'area')} error={errors['address.area']} maxLength={100} />
          <TextField label="City" value={form.address.city} onChange={setNested('address', 'city')} error={errors['address.city']} maxLength={80} />
          <TextField label="State" value={form.address.state} onChange={setNested('address', 'state')} error={errors['address.state']} maxLength={80} />
          <TextField label="PIN code" value={form.address.postalCode} onChange={setNested('address', 'postalCode')} error={errors['address.postalCode']} maxLength={12} />
          <TextField label="Landmark" className="sm:col-span-2" value={form.address.landmark} onChange={setNested('address', 'landmark')} error={errors['address.landmark']} maxLength={160} />
          <TextField label="Google Maps link" className="sm:col-span-2" placeholder="https://maps.google.com/…" value={form.mapUrl} onChange={set('mapUrl')} error={errors.mapUrl} hint="Powers the “Get directions” button. A Google Maps *embed* URL (…/maps/embed?…) also shows the map on the site." />
        </FormSection>

        <fieldset className="rounded-xl border border-gold-300/70 p-4">
          <legend className="px-2 text-sm font-medium text-olive-800">Working hours (IST)</legend>
          <p className="mb-3 text-xs text-ink/60">Booking requests outside these hours are rejected, and customers only see valid times. Leave a day blank for no restriction.</p>
          {errors['hours.general'] && <p className="mb-2 text-xs text-red-700">{errors['hours.general']}</p>}
          <ul className="space-y-2">
            {WEEKDAYS.map((d) => {
              const h = form.hours[d];
              return (
                <li key={d}>
                  <div className="grid items-center gap-2 sm:grid-cols-[110px_auto_1fr_1fr]">
                    <span className="text-sm font-medium">{dayLabel(d)}</span>
                    <Switch checked={h.isClosed} onChange={(v) => setHours(d, { isClosed: v })} label="Closed" />
                    <input type="time" className="input" value={h.open} disabled={h.isClosed} onChange={(e) => setHours(d, { open: e.target.value })} aria-label={`${dayLabel(d)} opens`} />
                    <input type="time" className="input" value={h.close} disabled={h.isClosed} onChange={(e) => setHours(d, { close: e.target.value })} aria-label={`${dayLabel(d)} closes`} />
                  </div>
                  {errors[`hours.${d}`] && <p className="mt-1 text-xs text-red-700">{errors[`hours.${d}`]}</p>}
                </li>
              );
            })}
          </ul>
        </fieldset>

        <FormSection title="Social links">
          <TextField label="Facebook" placeholder="https://facebook.com/…" value={form.social.facebook} onChange={setNested('social', 'facebook')} error={errors['social.facebook']} />
          <TextField label="Instagram" placeholder="https://instagram.com/…" value={form.social.instagram} onChange={setNested('social', 'instagram')} error={errors['social.instagram']} />
          <TextField label="YouTube" className="sm:col-span-2" placeholder="https://youtube.com/…" value={form.social.youtube} onChange={setNested('social', 'youtube')} error={errors['social.youtube']} />
        </FormSection>

        <FormSection title="Booking & SEO">
          <TextArea label="Booking notice" className="sm:col-span-2" rows={2} value={form.bookingNotice} onChange={set('bookingNotice')} error={errors.bookingNotice} maxLength={300} hint="Shown above the booking form. Keep it clear that a request is not a confirmed booking." />
          <TextField label="SEO title" className="sm:col-span-2" value={form.seoTitle} onChange={set('seoTitle')} error={errors.seoTitle} maxLength={70} hint={`${form.seoTitle.length}/70 · used as the Home page title`} />
          <TextArea label="SEO description" className="sm:col-span-2" rows={2} value={form.seoDescription} onChange={set('seoDescription')} error={errors.seoDescription} maxLength={160} hint={`${form.seoDescription.length}/160 · used as the Home page meta description`} />
        </FormSection>

        {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
        <div className="sticky bottom-4 flex justify-end">
          <button className="btn btn-primary shadow-soft" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
        </div>
      </form>
    </>
  );
}
