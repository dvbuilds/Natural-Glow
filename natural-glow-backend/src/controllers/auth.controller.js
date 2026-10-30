import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const login = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.login(req.body), { message: 'Login successful' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, req.admin.toJSON());
});
