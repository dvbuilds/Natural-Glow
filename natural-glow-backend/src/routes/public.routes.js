import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../middleware/rateLimiters.js';
import { idParams } from '../validators/common.js';
import { publicServiceQuery } from '../validators/service.validator.js';
import { publicTestimonialQuery } from '../validators/testimonial.validator.js';
import { publicOfferQuery } from '../validators/offer.validator.js';
import { publicGalleryQuery } from '../validators/gallery.validator.js';
import { createAppointmentBody } from '../validators/appointment.validator.js';
import { createEnquiryBody } from '../validators/enquiry.validator.js';
import { serviceController } from '../controllers/service.controller.js';
import { testimonialController } from '../controllers/testimonial.controller.js';
import { offerController } from '../controllers/offer.controller.js';
import * as galleryController from '../controllers/gallery.controller.js';
import * as settingsController from '../controllers/settings.controller.js';
import * as appointmentController from '../controllers/appointment.controller.js';
import * as enquiryController from '../controllers/enquiry.controller.js';

const router = Router();

// Read-only content: only published/active records are ever returned.
router.get('/services', validate({ query: publicServiceQuery }), serviceController.listPublic);
router.get('/services/:id', validate({ params: idParams }), serviceController.getPublic);

router.get('/gallery', validate({ query: publicGalleryQuery }), galleryController.listPublic);

router.get('/testimonials', validate({ query: publicTestimonialQuery }), testimonialController.listPublic);

router.get('/offers', validate({ query: publicOfferQuery }), offerController.listPublic);
router.get('/offers/:id', validate({ params: idParams }), offerController.getPublic);

router.get('/settings', settingsController.getPublic);

// Public form submissions (rate limited)
router.post(
  '/appointments',
  formLimiter,
  validate({ body: createAppointmentBody }),
  appointmentController.create
);
router.post('/contact', formLimiter, validate({ body: createEnquiryBody }), enquiryController.create);

export default router;
