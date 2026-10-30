import { Offer } from '../models/Offer.js';
import { createCrudService } from './crud.service.js';

// Public = active AND currently inside its validity window (open-ended dates allowed).
const publicConditions = () => {
  const now = new Date();
  return [
    { isActive: true },
    { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
    { $or: [{ validUntil: null }, { validUntil: { $gte: now } }] },
  ];
};

export const offerService = createCrudService(Offer, {
  label: 'Offer',
  publicConditions,
  filterMap: { type: 'type', featured: 'isFeatured', isActive: 'isActive' },
  searchFields: ['title', 'description'],
  slugFrom: 'title',
});
