import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../models/constants.js';
import {
  plainText,
  phone,
  optionalEmail,
  objectId,
  ymd,
  hhmm,
  paginationShape,
  searchParam,
} from './common.js';

// Unknown keys (e.g. a client-sent "status", "price" or "servicePrice") are stripped by Zod.
// The server decides status = pending and takes the price from the Service document.
export const createAppointmentBody = z.object({
  customerName: plainText(2, 80),
  phone,
  email: optionalEmail.optional(),
  serviceId: objectId,
  preferredDate: ymd, // interpreted as Asia/Kolkata
  preferredTime: hhmm, // interpreted as Asia/Kolkata
  notes: plainText(0, 500).optional(),
  // Honeypot: real users never fill this hidden field, bots usually do.
  website: z.string().max(0, 'Invalid submission').optional(),
});

export const updateStatusBody = z
  .object({
    status: z.enum(APPOINTMENT_STATUSES.filter((s) => s !== 'pending')),
    note: plainText(0, 300).optional(),
    adminNotes: plainText(0, 500).optional(),
    newDate: ymd.optional(),
    newTime: hhmm.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === 'rescheduled' && (!v.newDate || !v.newTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['newDate'],
        message: 'newDate and newTime are required when rescheduling',
      });
    }
    if (v.status !== 'rescheduled' && (v.newDate || v.newTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['newDate'],
        message: 'newDate/newTime are only allowed when status is "rescheduled"',
      });
    }
  });

const SORTS = ['-createdAt', 'createdAt', 'preferredAt', '-preferredAt'];

export const adminAppointmentQuery = z.object({
  ...paginationShape,
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  serviceId: objectId.optional(),
  from: ymd.optional(), // filters preferredAt >= start of this IST day
  to: ymd.optional(), // filters preferredAt <= end of this IST day
  search: searchParam, // customer name or phone
  sort: z.enum(SORTS).default('-createdAt'),
});
