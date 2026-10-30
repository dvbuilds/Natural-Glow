export const SERVICE_CATEGORIES = ['hair', 'skin', 'makeup', 'bridal', 'nails', 'waxing', 'spa', 'other'];
export const GALLERY_CATEGORIES = [...SERVICE_CATEGORIES, 'salon', 'events'];
export const PRICE_TYPES = ['fixed', 'starting_from'];

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'];
// Statuses that still "hold" a request (used for duplicate detection)
export const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'rescheduled'];
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'rescheduled', 'cancelled'],
  confirmed: ['rescheduled', 'completed', 'cancelled'],
  rescheduled: ['confirmed', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const OFFER_TYPES = ['offer', 'bridal_package'];
export const ENQUIRY_STATUSES = ['new', 'read', 'replied', 'archived'];
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
