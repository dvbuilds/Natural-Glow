import { getDashboardStats } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const stats = asyncHandler(async (_req, res) => {
  sendSuccess(res, await getDashboardStats());
});
