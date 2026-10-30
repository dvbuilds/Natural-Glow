import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { WEEKDAYS } from './constants.js';

const hoursSchema = new mongoose.Schema(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    open: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '' },
    close: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

// Singleton document (key = "main"). Unknown business details are left EMPTY on purpose:
// nothing is invented. Fill them in through PUT /api/v1/admin/settings.
const salonSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    salonName: { type: String, trim: true, maxlength: 120, default: 'Natural Glow Beauty Parlour' },
    tagline: { type: String, trim: true, maxlength: 160, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    whatsappNumber: { type: String, trim: true, maxlength: 20, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    address: {
      line1: { type: String, trim: true, maxlength: 160, default: '' },
      area: { type: String, trim: true, maxlength: 100, default: '' },
      city: { type: String, trim: true, maxlength: 80, default: 'Shyamnagar' },
      state: { type: String, trim: true, maxlength: 80, default: '' },
      postalCode: { type: String, trim: true, maxlength: 12, default: '' },
      landmark: { type: String, trim: true, maxlength: 160, default: '' },
    },
    mapUrl: { type: String, trim: true, maxlength: 500, default: '' },
    workingHours: { type: [hoursSchema], default: [] },
    social: {
      facebook: { type: String, trim: true, maxlength: 300, default: '' },
      instagram: { type: String, trim: true, maxlength: 300, default: '' },
      youtube: { type: String, trim: true, maxlength: 300, default: '' },
    },
    bookingNotice: {
      type: String,
      trim: true,
      maxlength: 300,
      default: 'Appointment requests are confirmed by the salon. Submitting a request does not reserve a slot.',
    },
    seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 160, default: '' },
  },
  baseOptions
);

export const SalonSettings =
  mongoose.models.SalonSettings || mongoose.model('SalonSettings', salonSettingsSchema);
