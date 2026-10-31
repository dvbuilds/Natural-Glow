import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../../config/images.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import ImageSlot from '../ui/ImageSlot.jsx';
import Icon from '../ui/Icon.jsx';
import HeroHighlights from './Highlights.jsx';

const SLIDE_MS = 4500;

// Add more images to IMAGES.heroSlides (array of paths) in config/images.js; falls back to IMAGES.hero.
const SLIDES = [
  {
    key: 'hair',
    tag: 'Hair',
    title: 'Your Natural Beauty, Elevated',
    text: 'Cuts, colour and styling shaped around you, in a calm and welcoming space.',
    cta: { to: '/services', label: 'Explore Hair Services' },
  },
  {
    key: 'skin',
    tag: 'Skin & Makeup',
    title: 'Glow That Feels Like You',
    text: 'Facials, skin rituals and makeup that bring out your natural radiance.',
    cta: { to: '/services', label: 'Explore Skin Care' },
  },
  {
    key: 'bridal',
    tag: 'Bridal',
    title: 'Your Day, Beautifully Planned',
    text: 'Complete bridal care from trial to the final touch, with a team that listens.',
    cta: { to: '/services', label: 'See Bridal Packages' },
  },
];

const imageFor = (i) => IMAGES.heroSlides?.[i] || (i === 0 ? IMAGES.hero : IMAGES.heroSlides?.[0] || IMAGES.hero);

export default function Hero() {
  const { settings, whatsapp } = useSettings();
  const waHref = whatsapp(`Hello ${settings.salonName}, I would like to book an appointment.`);

  const [index, setIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const startX = useRef(null);
  const total = SLIDES.length;
  const next = SLIDES[(index + 1) % total];

  const go = useCallback((i) => setIndex((i + total) % total), [total]);

  // Autoplay. The timer restarts whenever the slide changes (also after a manual change).
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, go]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  const onPointerDown = (e) => {
    startX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-[#faf5ef] outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label={`${settings.salonName} highlights`}
    >
      <style>{`
        @keyframes heroUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @keyframes heroZoom{from{transform:scale(1.12)}to{transform:scale(1)}}
        @keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .hero-in{animation:heroUp .8s cubic-bezier(.2,.7,.2,1) both}
        @media (prefers-reduced-motion:reduce){.hero-in,.hero-zoom,.hero-float{animation:none!important}}
      `}</style>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-amber-200/50 blur-3xl" aria-hidden="true" />

      {/* Texts of all slides share one grid cell, so the block never changes height between slides. */}
      <div className="container-x grid items-center gap-12 pb-16 pt-28 lg:min-h-[700px] lg:gap-16 lg:pt-32 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Copy */}
        <div className="relative z-10 order-2 lg:order-1 pt-20">
          <div className="grid" aria-live="polite">
            {SLIDES.map((s, i) => {
              const active = i === index;
              const Title = active ? 'h1' : 'div'; // only one <h1> at a time
              return (
                <div
                  key={s.key}
                  className={`col-start-1 row-start-1 ${active ? '' : 'invisible'}`}
                  aria-hidden={!active}
                >
                  <p className={`eyebrow ${active ? 'hero-in' : ''}`}>
                    Experience {settings.salonName} · {s.tag}
                  </p>
                  <Title
                    className={`mt-5 font-serif text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-5xl xl:text-6xl ${active ? 'hero-in' : ''}`}
                    style={{ animationDelay: '.08s' }}
                  >
                    {s.title}
                  </Title>
                  <p
                    className={`mt-6 max-w-md text-base leading-relaxed text-ink/75 ${active ? 'hero-in' : ''}`}
                    style={{ animationDelay: '.18s' }}
                  >
                    {s.text}
                  </p>
                  <div className={`mt-8 flex flex-wrap gap-3 ${active ? 'hero-in' : ''}`} style={{ animationDelay: '.28s' }}>
                    <Link to="/contact#booking" className="btn btn-primary">
                      Book an Appointment
                    </Link>
                    <Link to={s.cta.to} className="btn btn-outline">
                      {s.cta.label}
                    </Link>
                    {waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                        <Icon name="whatsapp" size={18} /> WhatsApp us
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <HeroHighlights />
        </div>

        {/* Visual */}
        <div
          className="relative order-1 mx-auto w-full max-w-md touch-pan-y select-none lg:order-2 lg:max-w-lg lg:self-center"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={onMove}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          {/* Offset outline arch */}
          <div
            className="absolute inset-0 translate-x-5 translate-y-5 rounded-t-[999px] rounded-b-[2.5rem] border border-ink/25 transition-transform duration-500"
            style={{ transform: `translate(${20 + tilt.x * -8}px, ${20 + tilt.y * -8}px)` }}
            aria-hidden="true"
          />

          {/* Main arch with crossfading slides */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] bg-neutral-200 shadow-2xl">
            {SLIDES.map((s, i) => (
              <div
                key={s.key}
                className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden={i !== index}
              >
                <div
                  className={i === index ? 'hero-zoom h-full w-full' : 'h-full w-full'}
                  style={{
                    animation: i === index ? `heroZoom ${SLIDE_MS + 1500}ms ease-out forwards` : undefined,
                  }}
                >
                  <div
                    className="h-full w-full transition-transform duration-300 ease-out"
                    style={{ transform: `translate(${tilt.x * 10}px, ${tilt.y * 10}px) scale(1.06)` }}
                  >
                    <ImageSlot
                      src={imageFor(i)}
                      alt={`${settings.salonName} ${s.tag}`}
                      label={`Hero slide ${i + 1}`}
                      hint="IMAGES.heroSlides in config/images.js · 1200×1500"
                      eager={i === 0}
                      className="!absolute inset-0"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* Floating "Next up" card */}
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="hero-float absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl bg-white/90 p-2 pr-4 shadow-xl backdrop-blur transition-transform hover:-translate-y-1 sm:-left-10"
            style={{ animation: 'heroFloat 5s ease-in-out infinite' }}
            aria-label={`Next: ${next.tag}`}
          >
            <span className="relative h-14 w-14 overflow-hidden rounded-xl bg-neutral-200">
              <ImageSlot src={imageFor((index + 1) % total)} alt="" label="" className="!absolute inset-0" />
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-ink/50">Next up</span>
              <span className="block text-sm font-semibold text-ink">{next.tag} →</span>
            </span>
          </button>

          {/* Slide counter + arrows */}
          <div className="absolute -right-2 top-6 flex flex-col items-center gap-2 sm:-right-5">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg transition hover:scale-110"
            >
              ‹
            </button>
            <span className="rounded-full bg-ink px-2 py-1 text-[11px] font-semibold tabular-nums text-white">
              {index + 1}/{total}
            </span>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-lg transition hover:scale-110"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}