// Regression: the create schemas must accept a body with ONLY the documented required fields.
// No database needed (schema-level tests).
import { describe, it, expect } from 'vitest';
import { createServiceBody } from '../src/validators/service.validator.js';
import { createTestimonialBody } from '../src/validators/testimonial.validator.js';
import { createOfferBody } from '../src/validators/offer.validator.js';

describe('admin create schemas accept minimal bodies', () => {
  it('service: name + category + price', () => {
    expect(createServiceBody.safeParse({ name: 'Facial', category: 'skin', price: 500 }).success).toBe(true);
  });
  it('service: still requires each required field', () => {
    expect(createServiceBody.safeParse({ category: 'skin', price: 500 }).success).toBe(false);
    expect(createServiceBody.safeParse({ name: 'Facial', price: 500 }).success).toBe(false);
    expect(createServiceBody.safeParse({ name: 'Facial', category: 'skin' }).success).toBe(false);
  });
  it('testimonial: customerName + rating + message', () => {
    expect(createTestimonialBody.safeParse({ customerName: 'Asha', rating: 5, message: 'Lovely service here.' }).success).toBe(true);
    expect(createTestimonialBody.safeParse({ customerName: 'Asha', rating: 5 }).success).toBe(false);
  });
  it('offer: title + offerPrice, and cross-field rules still apply', () => {
    expect(createOfferBody.safeParse({ title: 'Bridal', offerPrice: 7500 }).success).toBe(true);
    expect(createOfferBody.safeParse({ title: 'Bridal', offerPrice: 500, originalPrice: 100 }).success).toBe(false);
    expect(createOfferBody.safeParse({ offerPrice: 100 }).success).toBe(false);
  });
});
