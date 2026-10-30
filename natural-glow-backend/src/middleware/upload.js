import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    return cb(
      ApiError.badRequest('Only JPEG, PNG or WebP images are allowed', { code: 'INVALID_FILE_TYPE' })
    );
  },
});

// The declared Content-Type is client-controlled, so also check the real file signature.
const hasImageSignature = (buf) => {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
};

const verifySignature = (req, _res, next) => {
  if (req.file && !hasImageSignature(req.file.buffer)) {
    return next(
      ApiError.badRequest('Uploaded file is not a valid image', { code: 'INVALID_FILE_CONTENT' })
    );
  }
  return next();
};

export const uploadSingleImage = (field = 'image') => [upload.single(field), verifySignature];
