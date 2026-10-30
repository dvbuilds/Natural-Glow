import { Link } from 'react-router-dom';
import { IMAGES } from '../../config/images.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import ImageSlot from '../ui/ImageSlot.jsx';

export default function AboutPreview() {
  const { settings } = useSettings();
  return (
    <section className="section">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <ImageSlot
            src={IMAGES.aboutMain}
            alt={`Inside ${settings.salonName}`}
            label="About image"
            hint="public/images/about-main.jpg · 4:3"
            className="aspect-[4/3] rounded-3xl shadow-soft"
          />
          <div className="card absolute -bottom-5 right-4 px-5 py-3 text-center sm:right-8">
            <p className="text-xs text-ink/60">Appointments</p>
            <p className="font-serif text-lg leading-tight">Confirmed by<br />our team</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">About us</p>
          <h2 className="section-title mt-3">Where Beauty Meets Expertise</h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/75">
            {settings.salonName} offers hair, skin, makeup and bridal services in {settings.address.city || 'town'}. Browse our
            services and prices, send an appointment request in a minute, and we will get back to you to confirm the time.
          </p>
          <Link to="/about" className="btn btn-primary mt-8">
            Discover Our Story
          </Link>
        </div>
      </div>
    </section>
  );
}
