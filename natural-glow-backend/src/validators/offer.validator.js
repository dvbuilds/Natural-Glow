import { z } from 'zod';
import { OFFER_TYPES } from '../models/constants.js';
import {
  plainText,
  objectId,
  optionalUrl,
  boolish,
  boolQuery,
  isoDateTime,
  paginationShape,
  searchParam,
  nonEmptyObject,
} from './common.js';

const SORTS = ['displayOrder', '-displayOrder', 'offerPrice', '-offerPrice', '-createdAt', 'createdAt', 'validUntil'];

const base = z.object({
  title: plainText(2, 120),
  type: z.enum(OFFER_TYPES),
  description: plainText(0, 1000),
  inclusions: z.array(plainText(1, 120)).max(20),
  originalPrice: z.number().min(0).max(10_000_000).nullable(),
  offerPrice: z.number().min(0).max(10_000_000),
  validFrom: isoDateTime.nullable(),
  validUntil: isoDateTime.nullable(),
  applicableServices: z.array(objectId).max(30),
  imageUrl: optionalUrl,
  isActive: boolish,
  isFeatured: boolish,
  displayOrder: z.number().int().min(-10000).max(10000),
  seoTitle: plainText(0, 70),
  seoDescription: plainText(0, 160),
});

const crossChecks = (v, ctx) => {
  if (v.validFrom && v.validUntil && v.validUntil < v.validFrom) {
    ctx.addIssue({ code: 'custom', path: ['validUntil'], message: 'validUntil must be after validFrom' });
  }
  if (v.originalPrice != null && v.offerPrice != null && v.offerPrice > v.originalPrice) {
    ctx.addIssue({
      code: 'custom',
      path: ['offerPrice'],
      message: 'offerPrice cannot be higher than originalPrice',
    });
  }
};

// Only title and offerPrice are required on create.
export const createOfferBody = base.partial().required({ title: true, offerPrice: true }).superRefine(crossChecks);
export const updateOfferBody = nonEmptyObject(base.partial()).superRefine(crossChecks);

export const publicOfferQuery = z.object({
  ...paginationShape,
  type: z.enum(OFFER_TYPES).optional(),
  featured: boolQuery.optional(),
  sort: z.enum(SORTS).default('displayOrder'),
});

export const adminOfferQuery = publicOfferQuery.extend({
  isActive: boolQuery.optional(),
  search: searchParam,
});
