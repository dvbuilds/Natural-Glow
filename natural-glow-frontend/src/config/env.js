const env = import.meta.env;

export const API_URL = (env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');
export const SITE_URL = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
export const BOOKING_WINDOW_DAYS = Number(env.VITE_BOOKING_WINDOW_DAYS) || 60;
export const MAX_UPLOAD_MB = Number(env.VITE_MAX_UPLOAD_MB) || 5;
// Backend rule: a request must be at least 60 minutes in the future.
export const MIN_LEAD_MINUTES = 60;
