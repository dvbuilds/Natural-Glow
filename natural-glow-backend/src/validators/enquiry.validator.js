import { z } from 'zod';
import { ENQUIRY_STATUSES } from '../models/constants.js';
import { plainText, phone, optionalEmail, paginationShape, searchParam } from './common.js';

export const createEnquiryBody = z
  .object({
    name: plainText(2, 80),
    email: optionalEmail.optional(),
    phone: phone.optional(),
    subject: plainText(0, 120).optional(),
    message: plainText(10, 2000),
    website: z.string().max(0, 'Invalid submission').optional(), // honeypot
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: 'Provide an email address or a phone number so the salon can reply',
    path: ['email'],
  });

export const updateEnquiryStatusBody = z.object({ status: z.enum(ENQUIRY_STATUSES) });

export const adminEnquiryQuery = z.object({
  ...paginationShape,
  status: z.enum(ENQUIRY_STATUSES).optional(),
  search: searchParam,
  sort: z.enum(['-createdAt', 'createdAt']).default('-createdAt'),
});
