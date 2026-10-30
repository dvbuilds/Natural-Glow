import * as settingsService from '../services/settings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getPublic = asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getPublicSettings());
});

export const getAdmin = asyncHandler(async (_req, res) => {
  sendSuccess(res, await settingsService.getSettings());
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, await settingsService.updateSettings(req.body), { message: 'Settings updated' });
});
