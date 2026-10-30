import { z } from 'zod';
import { plainText, boolish, boolQuery, paginationShape, searchParam, nonEmptyObject } from './common.js';

const SORTS = ['displayOrder', '-displayOrder', '-createdAt', 'createdAt', '-rating', 'rating'];

const base = z.object({
  customerName: plainText(2, 80),
  rating: z.number().int().min(1).max(5),
  message: plainText(10, 1000),
  serviceName: plainText(0, 100),
  isPublished: boolish,
  displayOrder: z.number().int().min(-10000).max(10000),
});

// Only customerName, rating and message are required on create (new testimonials default to unpublished).
export const createTestimonialBody = base.partial().required({ customerName: true, rating: true, message: true });
export const updateTestimonialBody = nonEmptyObject(base.partial());

export const publicTestimonialQuery = z.object({
  ...paginationShape,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(SORTS).default('displayOrder'),
});

export const adminTestimonialQuery = publicTestimonialQuery.extend({
  isPublished: boolQuery.optional(),
  search: searchParam,
});
