import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { isMakeupService, label } from '../../lib/constants.js';
import { optimizeImage } from '../../lib/format.js';
import ImageSlot from '../ui/ImageSlot.jsx';

// ✏️ Fallback list: shown only while no makeup/bridal service has been added in Admin → Services.
// Once the admin adds makeup services, those are shown here instead (name, description, photo, "Book" link).
// Edit this list. Put the image URL in `image` (Cloudinary URL or a path like '/images/bridal.jpg').
// Leave `image` empty to show a placeholder until you have the photo.
const LOOKS = [
  {
    id: 'bridal',
    title: 'Bridal Makeup',
    tag: 'Bridal',
    description: 'Long-wear, camera-ready bridal looks customised to complement your outfit, skin tone and personal style, keeping you radiant throughout your special day..',
    image: 'https://res.cloudinary.com/dx15zryfj/image/upload/v1793727043/bride_cgaagi.webp',
  },
  {
    id: 'party',
    title: 'Party Makeup',
    tag: 'Party',
    description: 'Glamorous makeup looks for parties, engagements and special celebrations, designed to complement your style and keep you looking flawless all day and night.',
    image: 'https://res.cloudinary.com/dx15zryfj/image/upload/v1793727162/party_ayfgjc.webp',
  },
  {
    id: 'reception',
    title: 'Reception Makeup',
    tag: 'Reception',
    description: 'Elegant, long-lasting evening makeup that enhances your features and looks flawless in every photograph, keeping you radiant throughout your reception celebrations.',
    image: 'https://res.cloudinary.com/dx15zryfj/image/upload/v1793724393/Reception_cxadbb.webp',
  },
  {
    id: '3d',
    title: '3D Makeup',
    tag: '3D',
    description: 'Beautifully sculpted makeup with seamless contouring, soft highlights and balanced definition to enhance your natural features and create a radiant, lifted finish.',
    image: 'https://res.cloudinary.com/dx15zryfj/image/upload/v1793727136/3d_kptxzb.webp',
  },
];

const img = (url, t) => (url && url.includes('/upload/') ? optimizeImage(url, t) : url);

function Photo({ look, transform, className = '' }) {
  return look.image ? (
    <img
      src={img(look.image, transform)}
      alt={look.title}
      loading="lazy"
      draggable="false"
      className={`h-full w-full object-cover object-top ${className}`}
    />
  ) : (
    <ImageSlot src="" alt={look.title} label={look.title} hint={look.serviceId ? 'Add imageUrl in Admin → Services' : 'Add an image in MakeupShowcase.jsx'} className="h-full w-full" />
  );
}

const MAX_LOOKS = 4;

export default function MakeupShowcase({ looks: fallbackLooks = LOOKS }) {
  const { services, loading } = useServices();
  // Makeup services from the admin panel (makeup first, then bridal; admin display order kept within each).
  const fromAdmin = services
    .filter(isMakeupService)
    .sort((a, b) => Number(b.category === 'makeup') - Number(a.category === 'makeup'))
    .slice(0, MAX_LOOKS)
    .map((s) => ({
      id: s._id,
      title: s.name,
      tag: label(s.category),
      description: s.description || '',
      image: s.imageUrl || '',
      serviceId: s._id,
    }));
  const looks = fromAdmin.length ? fromAdmin : fallbackLooks;

  const [activeId, setActiveId] = useState(null);
  const active = looks.find((l) => l.id === activeId) || looks[0];
  const others = looks.filter((l) => l.id !== active?.id);

  // Wait for the services request so the fallback looks don't flash before the admin's makeup services arrive.
  if (!active || (loading && !services.length)) return null;

  return (
    <section className="section pt-20">
      <style>{`@keyframes showcaseIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="container-x">
        <h2 className="section-title text-center">Bridal &amp; Occasion Makeup</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          Tap a look to see it up close.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {/* Featured card (left): vertical, image on top, text + button below */}
          <article className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm md:col-span-2">
            <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
              <div key={active.id} className="h-full w-full animate-[showcaseIn_.5s_ease-out] motion-reduce:animate-none">
                <Photo look={active} transform="f_auto,q_auto,w_1000,h_1000,c_fill,g_auto" />
              </div>
            </div>
            <div key={`${active.id}-text`} className="flex flex-1 flex-col items-start p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{active.tag}</span>
              <h3 className="mt-0.5 font-serif text-xl sm:text-2xl">{active.title}</h3>
              {active.description && <p className="mt-1 line-clamp-2 max-w-md text-sm text-neutral-600">{active.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link to={active.serviceId ? `/contact?service=${active.serviceId}#booking` : '/contact#booking'} className="btn btn-primary inline-flex">
                  Book this look
                </Link>
                <Link to="/services" className="text-sm font-medium text-olive-800 hover:text-olive-900">
                  View all makeup services
                </Link>
              </div>
            </div>
          </article>

          {/* Smaller horizontal rows (right): image left, heading + description right */}
          <div className="grid gap-3 md:col-span-3 md:grid-rows-3">
            {others.map((look) => (
              <button
                key={look.id}
                type="button"
                onClick={() => setActiveId(look.id)}
                aria-label={`Show ${look.title}`}
                className="group flex overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
              >
                <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-neutral-100 sm:w-36 md:h-full md:w-auto">
                  <div className="absolute inset-0">
                    <Photo
                      look={look}
                      transform="f_auto,q_auto,w_600,h_600,c_fill,g_auto"
                      className="transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{look.tag}</span>
                  <h4 className="font-serif text-base sm:text-lg">{look.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-neutral-600">{look.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}