
import { Link } from 'react-router-dom';
import { IMAGES } from '../../config/images.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import ImageSlot from '../ui/ImageSlot.jsx';
import Icon from '../ui/Icon.jsx';

// Only statements that are true of this website (no years, awards or staff claims).
const POINTS = [
  {
    icon: 'scissors',
    title: 'Hair, skin, makeup & bridal',
    text: 'Everything you need, in one calm and welcoming place.',
  },
  {
    icon: 'tag',
    title: 'Clear prices, shown online',
    text: 'Browse every service and its price before you visit.',
  },
  {
    icon: 'calendar',
    title: 'Request in a minute',
    text: 'Send an appointment request and our team confirms the time.',
  },
];

export default function AboutPreview() {
  const { settings } = useSettings();
  const city = settings.address?.city || 'town';

  return (
    <section className="section relative overflow-hidden">

      {/* Soft decorative background */}
      <div
        className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-x grid items-center gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">

        {/* Images: Asymmetric editorial layout */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">

          <div className="relative grid grid-cols-[1.1fr_0.9fr] items-start gap-4 sm:gap-6">

            {/* Main image */}
            <div className="relative mt-12">
              <div
                className="absolute -bottom-3 -left-3 -z-10 h-full w-full rounded-2xl border border-olive-700/30"
                aria-hidden="true"
              />

              <ImageSlot
                src={IMAGES.aboutMain}
                alt={`Inside ${settings.salonName}`}
                label="About image"
                hint="public/images/about-main.jpg · 4:5"
                className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-xl"
              />
            </div>

            {/* Secondary image and caption */}
            <div className="flex flex-col gap-5">

              <ImageSlot
                src={IMAGES.aboutSecondary}
                alt={`${settings.salonName} details`}
                label="Second image"
                hint="public/images/about-secondary.jpg · 4:5"
                className="aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg"
              />

              {/* Editorial caption */}
              <div className="border-l-2 border-olive-700 py-2 pl-4">
                <p className="font-serif text-xl italic leading-snug text-ink">
                  Beauty in every detail.
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">
                  Your moment of care
                </p>
              </div>

            </div>
          </div>

          {/* Appointment badge */}
          <div className="absolute left-0 top-0 z-10 flex items-center gap-3 rounded-xl border border-amber-100 bg-white/95 p-3 pr-5 shadow-lg backdrop-blur sm:-left-3">

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-olive-800 text-white">
              <Icon name="sparkle" size={20} />
            </span>

            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-ink/50">
                Appointments
              </span>
              <span className="block text-sm font-semibold text-ink">
                Confirmed by our team
              </span>
            </span>

          </div>

        </div>

        {/* About content */}
        <div>

          <p className="eyebrow">About us</p>

          <h2 className="section-title mt-3">
            Where Beauty Meets{' '}
            <span className="italic text-olive-700">
              Expertise
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/75">
            {settings.salonName} offers hair, skin, makeup and bridal services in {city}.
            Browse our services and prices, send an appointment request, and we will
            get back to you to confirm the time.
          </p>

          {/* Highlights */}
          <ul className="mt-8 space-y-3">

            {POINTS.map((p) => (
              <li
                key={p.title}
                className="group flex items-start gap-4 rounded-2xl border border-amber-100 bg-white/70 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-100 text-olive-800 transition group-hover:bg-olive-800 group-hover:text-white">
                  <Icon name={p.icon} size={20} />
                </span>

                <span>
                  <span className="block font-serif text-lg leading-tight text-ink">
                    {p.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink/65">
                    {p.text}
                  </span>
                </span>

              </li>
            ))}

          </ul>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">

            <Link to="/about" className="btn btn-primary">
              Discover Our Story
            </Link>

            <Link to="/services" className="btn btn-outline">
              View Services
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}
