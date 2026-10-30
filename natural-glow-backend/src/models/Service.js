import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { SERVICE_CATEGORIES, PRICE_TYPES } from './constants.js';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    price: { type: Number, required: true, min: 0 },
    priceType: { type: String, enum: PRICE_TYPES, default: 'fixed' },
    durationMinutes: { type: Number, min: 5, max: 720 },
    imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    // Editable SEO fields (frontend decides how to render them)
    seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 160, default: '' },
  },
  baseOptions
);

serviceSchema.index({ isActive: 1, category: 1, displayOrder: 1 });
serviceSchema.index({ isActive: 1, isFeatured: 1 });

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
