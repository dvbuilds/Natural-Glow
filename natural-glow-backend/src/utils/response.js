// Every successful response: { success: true, message, data, meta? }
export const sendSuccess = (res, data = null, { status = 200, message = 'OK', meta } = {}) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
