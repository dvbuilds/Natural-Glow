import * as galleryService from '../services/gallery.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listPublic = asyncHandler(async (req, res) => {
  const { items, meta } = await galleryService.listGallery(req.query, { isPublic: true });
  sendSuccess(res, items, { meta });
});

export const listAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await galleryService.listGallery(req.query);
  sendSuccess(res, items, { meta });
});

export const create = asyncHandler(async (req, res) => {
  const data = await galleryService.createGalleryItem(req.file, req.body);
  sendSuccess(res, data, { status: 201, message: 'Image uploaded' });
});

export const update = asyncHandler(async (req, res) => {
  sendSuccess(res, await galleryService.updateGalleryItem(req.params.id, req.body), {
    message: 'Gallery item updated',
  });
});

export const remove = asyncHandler(async (req, res) => {
  await galleryService.deleteGalleryItem(req.params.id);
  sendSuccess(res, null, { message: 'Gallery item deleted' });
});
