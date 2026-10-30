import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { GALLERY_CATEGORIES } from './constants.js';

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 100, default: '' },
    caption: { type: String, trim: true, maxlength: 300, default: '' },
    category: { type: String, enum: GALLERY_CATEGORIES, default: 'salon' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      width: Number,
      height: Number,
      format: String,
      bytes: Number,
    },
    isPublished: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  baseOptions
);

gallerySchema.index({ isPublished: 1, category: 1, displayOrder: 1 });
gallerySchema.index({ createdAt: -1 });

export const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
