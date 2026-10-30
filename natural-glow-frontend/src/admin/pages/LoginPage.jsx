import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TextField } from '../../components/ui/Form.jsx';
import { FullPageSpinner } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { EMAIL_RE, mapApiErrors } from '../../lib/validate.js';

// There is no sign-up here on purpose: the single admin account is created with `npm run seed:admin` on the backend.
export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  usePageMeta({ title: 'Admin sign in', noindex: true });

  if (status === 'checking') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to={location.state?.from || '/admin'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!EMAIL_RE.test(values.email.trim())) er.email = 'Enter a valid email address.';
    if (!values.password) er.password = 'Enter your password.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setFormError('');
    try {
      await login(values.email.trim(), values.password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(mapApiErrors(err));
      // Covers INVALID_CREDENTIALS, ACCOUNT_LOCKED (429 after 5 failures) and RATE_LIMITED
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sage-100 to-cream-100 px-4">
      <form onSubmit={onSubmit} noValidate className="card w-full max-w-sm p-7">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 font-serif text-3xl">Sign in</h1>
        <div className="mt-6 space-y-4">
          <TextField label="Email" type="email" autoComplete="username" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} error={errors.email} />
          <TextField label="Password" type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))} error={errors.password} />
        </div>
        {formError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
        <button className="btn btn-primary mt-6 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/" className="mt-4 block text-center text-sm text-olive-700 hover:underline">← Back to website</Link>
      </form>
    </div>
  );
}
