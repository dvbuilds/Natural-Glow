import { request } from './client.js';

// Public, read-only content + the two public form submissions. Mirrors backend routes/public.routes.js.
export const publicApi = {
  services: (params, signal) => request('/services', { params, signal }),
  service: (id, signal) => request(`/services/${id}`, { signal }),
  gallery: (params, signal) => request('/gallery', { params, signal }),
  testimonials: (params, signal) => request('/testimonials', { params, signal }),
  offers: (params, signal) => request('/offers', { params, signal }),
  offer: (id, signal) => request(`/offers/${id}`, { signal }),
  settings: (signal) => request('/settings', { signal }),
  createAppointment: (body) => request('/appointments', { method: 'POST', body }),
  createEnquiry: (body) => request('/contact', { method: 'POST', body }),
};
