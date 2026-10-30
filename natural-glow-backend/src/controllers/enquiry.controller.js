import * as enquiryService from '../services/enquiry.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const data = await enquiryService.createEnquiry(req.body);
  sendSuccess(res, data, { status: 201, message: 'Thank you! Your message has been received.' });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await enquiryService.listEnquiries(req.query);
  sendSuccess(res, items, { meta });
});

export const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, await enquiryService.getEnquiry(req.params.id));
});

export const updateStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, await enquiryService.updateEnquiryStatus(req.params.id, req.body.status), {
    message: 'Enquiry updated',
  });
});

export const remove = asyncHandler(async (req, res) => {
  await enquiryService.deleteEnquiry(req.params.id);
  sendSuccess(res, null, { message: 'Enquiry deleted' });
});
