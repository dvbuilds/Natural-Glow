import { request } from './client.js';

// Protected admin endpoints. Mirrors backend routes/admin.routes.js (Bearer token attached by the client).
const a = { auth: true };

const crud = (base) => ({
  list: (params, signal) => request(base, { ...a, params, signal }),
  get: (id, signal) => request(`${base}/${id}`, { ...a, signal }),
  create: (body) => request(base, { ...a, method: 'POST', body }),
  update: (id, body) => request(`${base}/${id}`, { ...a, method: 'PATCH', body }),
  remove: (id) => request(`${base}/${id}`, { ...a, method: 'DELETE' }),
});

export const adminApi = {
  login: (body) => request('/admin/auth/login', { method: 'POST', body }), // not "auth": no token yet
  me: (signal) => request('/admin/auth/me', { ...a, signal }),
  dashboard: (signal) => request('/admin/dashboard', { ...a, signal }),

  services: crud('/admin/services'),
  testimonials: crud('/admin/testimonials'),
  offers: crud('/admin/offers'),

  appointments: {
    list: (params, signal) => request('/admin/appointments', { ...a, params, signal }),
    get: (id, signal) => request(`/admin/appointments/${id}`, { ...a, signal }),
    updateStatus: (id, body) => request(`/admin/appointments/${id}/status`, { ...a, method: 'PATCH', body }),
  },

  gallery: {
    list: (params, signal) => request('/admin/gallery', { ...a, params, signal }),
    upload: (formData) => request('/admin/gallery', { ...a, method: 'POST', form: formData }),
    update: (id, body) => request(`/admin/gallery/${id}`, { ...a, method: 'PATCH', body }),
    remove: (id) => request(`/admin/gallery/${id}`, { ...a, method: 'DELETE' }),
  },

  enquiries: {
    list: (params, signal) => request('/admin/enquiries', { ...a, params, signal }),
    get: (id, signal) => request(`/admin/enquiries/${id}`, { ...a, signal }),
    updateStatus: (id, status) => request(`/admin/enquiries/${id}/status`, { ...a, method: 'PATCH', body: { status } }),
    remove: (id) => request(`/admin/enquiries/${id}`, { ...a, method: 'DELETE' }),
  },

  settings: {
    get: (signal) => request('/admin/settings', { ...a, signal }),
    update: (body) => request('/admin/settings', { ...a, method: 'PUT', body }),
  },
};
