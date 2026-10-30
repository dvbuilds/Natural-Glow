import { z } from 'zod';
import { GALLERY_CATEGORIES } from '../models/constants.js';
import { plainText, objectId, boolish, boolQuery, paginationShape, nonEmptyObject } from './common.js';

const SORTS = ['displayOrder', '-displayOrder', '-createdAt', 'createdAt'];

// Multipart fields arrive as strings, hence coerce for numbers.
const base = z.object({
  title: plainText(0, 100),
  caption: plainText(0, 300),
  category: z.enum(GALLERY_CATEGORIES),
  serviceId: objectId,
  isPublished: boolish,
  displayOrder: z.coerce.number().int().min(-10000).max(10000),
});

export const uploadGalleryBody = base.partial();
export const updateGalleryBody = nonEmptyObject(base.partial());

export const publicGalleryQuery = z.object({
  ...paginationShape,
  category: z.enum(GALLERY_CATEGORIES).optional(),
  serviceId: objectId.optional(),
  sort: z.enum(SORTS).default('displayOrder'),
});

export const adminGalleryQuery = publicGalleryQuery.extend({ isPublished: boolQuery.optional() });
