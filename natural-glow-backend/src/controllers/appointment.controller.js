import * as appointmentService from '../services/appointment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const data = await appointmentService.createAppointment(req.body);
  sendSuccess(res, data, {
    status: 201,
    message:
      'Appointment request received. It is pending and not yet confirmed — the salon will contact you to confirm.',
  });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await appointmentService.listAppointments(req.query);
  sendSuccess(res, items, { meta });
});

export const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, await appointmentService.getAppointment(req.params.id));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await appointmentService.updateAppointmentStatus(req.params.id, req.body);
  sendSuccess(res, data, { message: 'Appointment updated' });
});
