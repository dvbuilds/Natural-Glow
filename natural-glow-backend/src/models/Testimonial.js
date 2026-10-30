import mongoose from 'mongoose';
import { baseOptions } from './_options.js';

const testimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    serviceName: { type: String, trim: true, maxlength: 100, default: '' },
    // Unpublished by default: admin must explicitly publish a review.
    isPublished: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  baseOptions
);

testimonialSchema.index({ isPublished: 1, displayOrder: 1, createdAt: -1 });

export const Testimonial =
  mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
