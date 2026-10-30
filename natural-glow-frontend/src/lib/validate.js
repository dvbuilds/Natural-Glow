// Client-side checks mirroring the backend Zod rules, so users get instant feedback.
// The backend remains the source of truth; its field errors are mapped back with mapApiErrors().
export const PHONE_RE = /^\+?[0-9][0-9\s-]{7,16}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isHttpsUrl = (v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};

// Backend validation errors look like { field: 'body.address.city', message }. Returns { 'address.city': message }.
export const mapApiErrors = (err) => {
  const out = {};
  for (const e of err?.errors || []) {
    const key = String(e.field || '').replace(/^(body|query|params)\./, '');
    if (key && !out[key]) out[key] = e.message;
  }
  return out;
};

export const hasErrors = (errors) => Object.keys(errors).length > 0;
