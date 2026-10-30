import { Gallery } from '../models/Gallery.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, toSort } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';
import { destroyImage, uploadImageBuffer } from './cloudinary.service.js';

const toDoc = ({ serviceId, ...rest }) => (serviceId ? { ...rest, service: serviceId } : rest);

async function assertServiceExists(serviceId) {
  if (serviceId && !(await Service.exists({ _id: serviceId }))) {
    throw ApiError.badRequest('serviceId does not match an existing service', { code: 'SERVICE_NOT_FOUND' });
  }
}

export async function listGallery(q, { isPublic = false } = {}) {
  const filter = {};
  if (isPublic) filter.isPublished = true;
  else if (q.isPublished !== undefined) filter.isPublished = q.isPublished;
  if (q.category) filter.category = q.category;
  if (q.serviceId) filter.service = q.serviceId;

  return paginate(Gallery, filter, {
    page: q.page,
    limit: q.limit,
    sort: toSort(q.sort),
    select: isPublic ? '-__v -image.publicId' : '-__v',
  });
}

export async function createGalleryItem(file, input) {
  if (!file) throw ApiError.badRequest('An image file is required (field name: "image")', { code: 'FILE_REQUIRED' });
  await assertServiceExists(input.serviceId);

  const up = await uploadImageBuffer(file.buffer);
  try {
    const doc = await Gallery.create({
      ...toDoc(input),
      image: {
        url: up.secure_url,
        publicId: up.public_id,
        width: up.width,
        height: up.height,
        format: up.format,
        bytes: up.bytes,
      },
    });
    return doc.toJSON();
  } catch (err) {
    // Do not leave an orphaned file in Cloudinary if the DB write fails.
    await destroyImage(up.public_id).catch((e) => logger.warn('Orphan cleanup failed', { message: e.message }));
    throw err;
  }
}

export async function updateGalleryItem(id, input) {
  await assertServiceExists(input.serviceId);
  const doc = await Gallery.findByIdAndUpdate(id, { $set: toDoc(input) }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('Gallery item not found');
  return doc.toJSON();
}

export async function deleteGalleryItem(id) {
  const doc = await Gallery.findById(id);
  if (!doc) throw ApiError.notFound('Gallery item not found');
  // Remove the remote file first; if that fails, keep the DB record so the delete can be retried.
  await destroyImage(doc.image.publicId);
  await doc.deleteOne();
}
