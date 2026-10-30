import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ensureConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, 'Image storage is not configured', { code: 'STORAGE_NOT_CONFIGURED' });
  }
};

export function uploadImageBuffer(buffer, { subfolder = 'gallery' } = {}) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_FOLDER}/${subfolder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(new ApiError(502, 'Image upload failed', { code: 'UPLOAD_FAILED' }));
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId) {
  ensureConfigured();
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return res.result; // 'ok' | 'not found'
  } catch {
    throw new ApiError(502, 'Could not delete the image from storage', { code: 'STORAGE_DELETE_FAILED' });
  }
}
