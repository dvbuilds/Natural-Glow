import { Testimonial } from '../models/Testimonial.js';
import { createCrudService } from './crud.service.js';

export const testimonialService = createCrudService(Testimonial, {
  label: 'Testimonial',
  publicConditions: () => [{ isPublished: true }],
  filterMap: { rating: 'rating', isPublished: 'isPublished' },
  searchFields: ['customerName', 'message', 'serviceName'],
});
