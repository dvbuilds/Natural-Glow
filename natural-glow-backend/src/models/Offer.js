import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { OFFER_TYPES } from './constants.js';

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: OFFER_TYPES, default: 'offer' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    inclusions: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    originalPrice: { type: Number, min: 0 },
    offerPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 }, // computed
    validFrom: { type: Date },
    validUntil: { type: Date },
    applicableServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 160, default: '' },
  },
  baseOptions
);

offerSchema.pre('validate', function computeDiscount() {
  if (this.originalPrice && this.originalPrice > 0 && this.offerPrice <= this.originalPrice) {
    this.discountPercent = Math.round((1 - this.offerPrice / this.originalPrice) * 100);
  } else {
    this.discountPercent = 0;
  }
  if (this.validFrom && this.validUntil && this.validUntil < this.validFrom) {
    this.invalidate('validUntil', 'validUntil must be after validFrom');
  }
});

offerSchema.index({ isActive: 1, type: 1, displayOrder: 1 });
offerSchema.index({ validUntil: 1 });

export const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
