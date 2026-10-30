import { API_URL } from '../config/env.js';

// The admin JWT is kept in sessionStorage (cleared when the tab closes) with an in-memory fallback.
// It is sent as a Bearer header, never a cookie, so there is no CSRF exposure.
const TOKEN_KEY = 'ng_admin_token';
let memoryToken = null;
let onUnauthorized = null;

export const tokenStore = {
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || memoryToken;
    } catch {
      return memoryToken;
    }
  },
  set(token) {
    memoryToken = token;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: memory only */
    }
  },
  clear() {
    memoryToken = null;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, { status = 0, code, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const buildQuery = (params) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export async function request(path, { method = 'GET', params, body, form, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let payload;
  if (form) {
    payload = form; // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(params)}`, { method, headers, body: payload, signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok || json?.success === false) {
    const err = new ApiError(json?.message || `Request failed (${res.status})`, {
      status: res.status,
      code: json?.code,
      errors: json?.errors,
    });
    // An expired/invalid token on an authenticated call ends the admin session.
    if (res.status === 401 && auth) onUnauthorized?.();
    throw err;
  }
  return { data: json?.data ?? null, meta: json?.meta ?? null, message: json?.message };
}
