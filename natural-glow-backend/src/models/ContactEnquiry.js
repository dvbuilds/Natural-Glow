import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { ENQUIRY_STATUSES } from './constants.js';

const contactEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    subject: { type: String, trim: true, maxlength: 120, default: '' },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
  },
  baseOptions
);

contactEnquirySchema.index({ status: 1, createdAt: -1 });

export const ContactEnquiry =
  mongoose.models.ContactEnquiry || mongoose.model('ContactEnquiry', contactEnquirySchema);
