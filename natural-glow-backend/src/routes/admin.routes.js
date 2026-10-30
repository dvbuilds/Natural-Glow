import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { loginBody } from '../validators/auth.validator.js';
import {
  adminServiceQuery,
  createServiceBody,
  updateServiceBody,
} from '../validators/service.validator.js';
import {
  adminTestimonialQuery,
  createTestimonialBody,
  updateTestimonialBody,
} from '../validators/testimonial.validator.js';
import { adminOfferQuery, createOfferBody, updateOfferBody } from '../validators/offer.validator.js';
import {
  adminGalleryQuery,
  updateGalleryBody,
  uploadGalleryBody,
} from '../validators/gallery.validator.js';
import { adminAppointmentQuery, updateStatusBody } from '../validators/appointment.validator.js';
import { adminEnquiryQuery, updateEnquiryStatusBody } from '../validators/enquiry.validator.js';
import { updateSettingsBody } from '../validators/settings.validator.js';
import * as authController from '../controllers/auth.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { serviceController } from '../controllers/service.controller.js';
import { testimonialController } from '../controllers/testimonial.controller.js';
import { offerController } from '../controllers/offer.controller.js';
import * as galleryController from '../controllers/gallery.controller.js';
import * as appointmentController from '../controllers/appointment.controller.js';
import * as enquiryController from '../controllers/enquiry.controller.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = Router();

// ---- Auth (login is the only unauthenticated admin route; there is NO register endpoint) ----
router.post('/auth/login', authLimiter, validate({ body: loginBody }), authController.login);
router.get('/auth/me', requireAdmin, authController.me);

// ---- Everything below requires a valid admin token ----
router.use(requireAdmin);

router.get('/dashboard', dashboardController.stats);

// list / create / get / update / delete for the simple resources
function mountCrud(path, controller, v) {
  router
    .route(path)
    .get(validate({ query: v.listQuery }), controller.listAdmin)
    .post(validate({ body: v.create }), controller.create);
  router
    .route(`${path}/:id`)
    .get(validate({ params: idParams }), controller.getOne)
    .patch(validate({ params: idParams, body: v.update }), controller.update)
    .delete(validate({ params: idParams }), controller.remove);
}

mountCrud('/services', serviceController, {
  listQuery: adminServiceQuery,
  create: createServiceBody,
  update: updateServiceBody,
});
mountCrud('/testimonials', testimonialController, {
  listQuery: adminTestimonialQuery,
  create: createTestimonialBody,
  update: updateTestimonialBody,
});
mountCrud('/offers', offerController, {
  listQuery: adminOfferQuery,
  create: createOfferBody,
  update: updateOfferBody,
});

// ---- Appointments ----
router.get('/appointments', validate({ query: adminAppointmentQuery }), appointmentController.list);
router.get('/appointments/:id', validate({ params: idParams }), appointmentController.getOne);
router.patch(
  '/appointments/:id/status',
  validate({ params: idParams, body: updateStatusBody }),
  appointmentController.updateStatus
);

// ---- Gallery (multipart upload; Cloudinary is only reachable from these admin routes) ----
router.get('/gallery', validate({ query: adminGalleryQuery }), galleryController.listAdmin);
router.post(
  '/gallery',
  ...uploadSingleImage('image'),
  validate({ body: uploadGalleryBody }),
  galleryController.create
);
router.patch(
  '/gallery/:id',
  validate({ params: idParams, body: updateGalleryBody }),
  galleryController.update
);
router.delete('/gallery/:id', validate({ params: idParams }), galleryController.remove);

// ---- Contact enquiries ----
router.get('/enquiries', validate({ query: adminEnquiryQuery }), enquiryController.list);
router.get('/enquiries/:id', validate({ params: idParams }), enquiryController.getOne);
router.patch(
  '/enquiries/:id/status',
  validate({ params: idParams, body: updateEnquiryStatusBody }),
  enquiryController.updateStatus
);
router.delete('/enquiries/:id', validate({ params: idParams }), enquiryController.remove);

// ---- Salon settings ----
router.get('/settings', settingsController.getAdmin);
router.put('/settings', validate({ body: updateSettingsBody }), settingsController.update);

export default router;
