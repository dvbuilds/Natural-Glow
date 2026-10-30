import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/public.js';
import { EMAIL_RE, PHONE_RE, hasErrors, mapApiErrors } from '../../lib/validate.js';
import { Honeypot, TextArea, TextField } from '../ui/Form.jsx';
import Icon from '../ui/Icon.jsx';

export default function EnquiryForm() {
  const [params] = useSearchParams();
  const [values, setValues] = useState({ name: '', email: '', phone: '', subject: params.get('subject') || '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const e = {};
    if (values.name.trim().length < 2) e.name = 'Please enter your name.';
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) e.email = 'Enter a valid email address.';
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) e.phone = 'Enter a valid phone number.';
    // Backend rule: an email or a phone is required so the salon can reply.
    if (!values.email.trim() && !values.phone.trim()) e.email = 'Provide an email address or a phone number so we can reply.';
    if (values.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
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
      await publicApi.createEnquiry({
        name: values.name.trim(),
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        ...(values.subject.trim() ? { subject: values.subject.trim() } : {}),
        message: values.message.trim(),
        website: values.website,
      });
      setSent(true);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        setErrors(mapApiErrors(err));
        setFormError('Please correct the highlighted fields.');
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-6 sm:p-8" role="status">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-200 text-olive-800">
          <Icon name="check" size={22} />
        </span>
        <h3 className="mt-4 font-serif text-2xl">Message sent</h3>
        <p className="mt-2 text-sm text-ink/75">Thank you! We have received your message and will reply soon.</p>
        <button
          className="btn btn-outline mt-5"
          onClick={() => {
            setSent(false);
            setValues({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card p-6 sm:p-8" aria-labelledby="enquiry-title">
      <h3 id="enquiry-title" className="font-serif text-2xl sm:text-3xl">Send Us a Message</h3>
      <p className="mt-2 text-sm text-ink/65">Questions about services, bridal packages or offers? Write to us.</p>
      <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
        <Honeypot value={values.website} onChange={(v) => setValues((s) => ({ ...s, website: v }))} />
        <TextField label="Your name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={80} />
        <TextField label="Subject (optional)" value={values.subject} onChange={set('subject')} error={errors.subject} maxLength={120} />
        <TextField label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <TextField label="Phone" type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
        <TextArea label="Message" required className="sm:col-span-2" rows={5} value={values.message} onChange={set('message')} error={errors.message} maxLength={2000} hint={`${values.message.length}/2000 · email or phone is required`} />
      </div>
      {formError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
