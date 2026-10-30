import { testimonialService } from '../services/testimonial.service.js';
import { createCrudController } from './crud.controller.js';

export const testimonialController = createCrudController(testimonialService, 'Testimonial');
