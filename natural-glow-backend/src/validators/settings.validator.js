import { z } from 'zod';
import { WEEKDAYS } from '../models/constants.js';
import { plainText, optionalEmail, optionalUrl, hhmm, nonEmptyObject } from './common.js';

const optionalPhone = z.union([
  z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{7,16}$/, 'Invalid phone number')
    .transform((v) => v.replace(/[\s-]/g, '')),
  z.literal(''),
]);

const hours = z
  .object({
    day: z.enum(WEEKDAYS),
    open: hhmm.optional(),
    close: hhmm.optional(),
    isClosed: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (!v.isClosed) {
      if (!v.open || !v.close) {
        ctx.addIssue({ code: 'custom', path: ['open'], message: 'open and close are required unless isClosed' });
      } else if (v.close <= v.open) {
        ctx.addIssue({ code: 'custom', path: ['close'], message: 'close must be after open' });
      }
    }
  });

// PUT is partial: omitted top-level fields are left unchanged.
// Nested objects (address, social) and workingHours are replaced as a whole when supplied.
export const updateSettingsBody = nonEmptyObject(
  z.object({
    salonName: plainText(2, 120),
    tagline: plainText(0, 160),
    phone: optionalPhone,
    whatsappNumber: optionalPhone,
    email: optionalEmail,
    address: z.object({
      line1: plainText(0, 160).optional(),
      area: plainText(0, 100).optional(),
      city: plainText(0, 80).optional(),
      state: plainText(0, 80).optional(),
      postalCode: plainText(0, 12).optional(),
      landmark: plainText(0, 160).optional(),
    }),
    mapUrl: optionalUrl,
    workingHours: z
      .array(hours)
      .max(7)
      .refine((a) => new Set(a.map((h) => h.day)).size === a.length, 'Each day may appear only once'),
    social: z.object({
      facebook: optionalUrl.optional(),
      instagram: optionalUrl.optional(),
      youtube: optionalUrl.optional(),
    }),
    bookingNotice: plainText(0, 300),
    seoTitle: plainText(0, 70),
    seoDescription: plainText(0, 160),
  }).partial()
);
