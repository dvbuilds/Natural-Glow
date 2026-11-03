import Hero from '../components/home/Hero.jsx';
import AboutPreview from '../components/home/AboutPreview.jsx';
import ServicesPreview from '../components/home/ServicesPreview.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import GalleryPreview from '../components/home/GalleryPreview.jsx';
import MakeupShowcase from '../components/home/MakeupShowcase.jsx';
import TestimonialsSection from '../components/home/TestimonialsSection.jsx';
import OffersSection from '../components/offers/OffersSection.jsx';
import BookingSection from '../components/booking/BookingSection.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

export default function Home() {
  const { settings } = useSettings();
  usePageMeta({
    title: settings.seoTitle || `${settings.salonName} – Hair, Skin, Makeup & Bridal`,
    description:
      settings.seoDescription ||
      `${settings.salonName}${settings.address.city ? `, ${settings.address.city}` : ''}. Browse services and prices and request an appointment online.`,
    path: '/',
  });

  return (
    <>
      <Hero />
      <AboutPreview />
      <ServicesPreview />
      <MakeupShowcase />
      <HowItWorks />
      <OffersSection compact hideWhenEmpty />
      <GalleryPreview />
      <TestimonialsSection />
      <BookingSection />
    </>
  );
}
