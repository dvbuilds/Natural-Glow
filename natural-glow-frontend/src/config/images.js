// Static image slots. Put your files in /public/images with these names (or change the paths here).
// A missing file simply shows a labelled placeholder, so nothing breaks while you gather photos.
export const IMAGES = {
  hero: '/images/hero.webp',
  heroSlides: [
    
    '/images/hair.webp',
    '/images/skin-care.webp',
    '/images/hero.webp',
  ],
  aboutMain: '/images/about.webp',
  aboutSecondary: '/images/about-secondary.jpg',
  map: '/images/map.jpg',
};

// The hero text sits directly on the banner (no text background). This light gradient is applied to the
// IMAGE only so dark text stays readable. Set to '' to remove it, or make it darker for very light photos.
export const HERO_OVERLAY = 'linear-gradient(90deg, rgba(248,244,234,0.88) 0%, rgba(248,244,234,0.55) 38%, rgba(248,244,234,0) 70%)';
