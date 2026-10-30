import { z } from 'zod';
import { SERVICE_CATEGORIES, PRICE_TYPES } from '../models/constants.js';
import {
  plainText,
  optionalUrl,
  boolish,
  boolQuery,
  paginationShape,
  searchParam,
  nonEmptyObject,
} from './common.js';

const SORTS = ['displayOrder', '-displayOrder', 'price', '-price', 'name', '-name', '-createdAt', 'createdAt'];

const base = z.object({
  name: plainText(2, 100),
  category: z.enum(SERVICE_CATEGORIES),
  description: plainText(0, 1000),
  price: z.number().min(0).max(1_000_000),
  priceType: z.enum(PRICE_TYPES),
  durationMinutes: z.number().int().min(5).max(720),
  imageUrl: optionalUrl,
  isActive: boolish,
  isFeatured: boolish,
  displayOrder: z.number().int().min(-10000).max(10000),
  seoTitle: plainText(0, 70),
  seoDescription: plainText(0, 160),
});

// Only name, category and price are required on create; everything else is optional (model defaults apply).
export const createServiceBody = base.partial().required({ name: true, category: true, price: true });
export const updateServiceBody = nonEmptyObject(base.partial());

export const publicServiceQuery = z.object({
  ...paginationShape,
  category: z.enum(SERVICE_CATEGORIES).optional(),
  featured: boolQuery.optional(),
  search: searchParam,
  sort: z.enum(SORTS).default('displayOrder'),
});

export const adminServiceQuery = publicServiceQuery.extend({ isActive: boolQuery.optional() });
