// Mirrors backend src/models/constants.js — keep in sync.
export const SERVICE_CATEGORIES = ['hair', 'skin', 'makeup', 'bridal', 'nails', 'waxing', 'spa', 'other'];
export const GALLERY_CATEGORIES = [...SERVICE_CATEGORIES, 'salon', 'events'];
export const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'starting_from', label: 'Starting from' },
];
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'];
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'rescheduled', 'cancelled'],
  confirmed: ['rescheduled', 'completed', 'cancelled'],
  rescheduled: ['confirmed', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
export const OFFER_TYPES = [
  { value: 'offer', label: 'Offer' },
  { value: 'bridal_package', label: 'Bridal package' },
];
export const ENQUIRY_STATUSES = ['new', 'read', 'replied', 'archived'];
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const LABELS = {
  hair: 'Hair',
  skin: 'Skin & Facials',
  makeup: 'Makeup',
  bridal: 'Bridal',
  nails: 'Nails',
  waxing: 'Waxing',
  spa: 'Spa',
  other: 'Other',
  salon: 'Salon',
  events: 'Events',
  bridal_package: 'Bridal package',
  offer: 'Offer',
  starting_from: 'Starting from',
  fixed: 'Fixed price',
};

export const label = (v) => LABELS[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1) : '');
export const dayLabel = (d) => label(d);

export const SERVICE_SORTS = [
  { value: 'displayOrder', label: 'Featured order' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-createdAt', label: 'Newest' },
];
