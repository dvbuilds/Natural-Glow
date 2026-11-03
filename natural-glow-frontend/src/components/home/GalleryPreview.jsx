import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/public.js';
import { useApi } from '../../hooks/useApi.js';
import { optimizeImage } from '../../lib/format.js';
import ImageSlot from '../ui/ImageSlot.jsx';

const COUNT = 6; // tiles shown on the home page
const FETCH = 12; // candidates fetched so orientation matching has choices

// 12-col grid with square units. p = 3:4 portrait, l = 3:2 landscape.
// Desktop rows: P P L / L P P.   Mobile: P P / L / L / P P.
const SHAPES = ['p', 'p', 'l', 'l', 'p', 'p'];

const SHAPE_CLASS = {
  p: 'col-span-6 row-span-8 md:col-span-3 md:row-span-4',
  l: 'col-span-12 row-span-8 md:col-span-6 md:row-span-4',
};

// Cloudinary crops to the tile's own ratio (g_auto keeps faces/hair in frame)
const SHAPE_CROP = {
  p: 'f_auto,q_auto,w_800,h_1067,c_fill,g_auto',
  l: 'f_auto,q_auto,w_1200,h_800,c_fill,g_auto',
};

// Needs item.image.width/height (Cloudinary returns them on upload). If missing -> 'u' (unknown).
const orient = (it) =>
  it?.image?.width && it?.image?.height ? (it.image.width >= it.image.height ? 'l' : 'p') : 'u';

// Fill each slot with a photo of the matching orientation, falling back to whatever is left.
function arrange(items) {
  const pool = { l: [], p: [], u: [] };
  items.forEach((it) => pool[orient(it)].push(it));
  return SHAPES.map(
    (s) => pool[s].shift() || pool.u.shift() || pool.l.shift() || pool.p.shift() || null
  );
}

function Tile({ item, index, active, anyActive, onHover, onOpen, isLast }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const shape = SHAPES[index];

  // Scroll-reveal, staggered by index
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Subtle 3D tilt following the pointer
  const onMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    onHover(null);
  };

  const label = item?.title || item?.caption || 'Salon gallery';

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={reset}
      style={{ transitionDelay: visible ? `${index * 60}ms` : '0ms' }}
      className={`group relative overflow-hidden rounded-3xl bg-neutral-100 shadow-sm
        transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none
        ${SHAPE_CLASS[shape]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        ${anyActive && !active ? 'scale-[0.97] opacity-60 saturate-50' : ''}
        ${active ? 'z-10 shadow-2xl' : ''}`}
    >
      <div
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: 'perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
      >
        {item ? (
          <button
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`Open ${label}`}
            className="block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
          >
            <img
              src={optimizeImage(item.image.url, SHAPE_CROP[shape])}
              alt={label}
              loading="lazy"
              draggable="false"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-4 text-left text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {label}
            </span>
          </button>
        ) : (
          <ImageSlot
            src=""
            alt="Salon gallery"
            label={`Gallery image ${index + 1}`}
            hint="Upload in Admin → Gallery"
            className="h-full w-full"
          />
        )}
      </div>

      {/* Floating "view all" pill on the last tile */}
      {isLast && (
        <Link
          to="/gallery"
          aria-label="View full gallery"
          className="group/pill absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition-all duration-300 hover:w-36 hover:bg-white"
        >
          <span className="w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover/pill:mr-2 group-hover/pill:w-auto group-hover/pill:opacity-100">
            View all
          </span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// Exported so the /gallery page can reuse it.
export function Lightbox({ items, index, onClose, onChange }) {
  const item = items[index];
  const go = useCallback(
    (d) => onChange((index + d + items.length) % items.length),
    [index, items.length, onChange]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  if (!item) return null;
  const label = item.title || item.caption || 'Salon gallery';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30"
      >
        ×
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30 md:left-6"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(1); }}
        aria-label="Next image"
        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30 md:right-6"
      >
        ›
      </button>

      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          key={item._id || index}
          src={optimizeImage(item.image.url, 'f_auto,q_auto,w_1600,c_limit')}
          alt={label}
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl animate-[fadeIn_.25s_ease-out]"
        />
        <figcaption className="mt-3 text-center text-sm text-white/80">
          {label} <span className="text-white/50">· {index + 1}/{items.length}</span>
        </figcaption>
      </figure>
    </div>
  );
}

// Home-page gallery: a fixed, curated 6-tile bento. Extra uploads live on /gallery.
export default function GalleryPreview() {
  const { data } = useApi(
    (signal) => publicApi.gallery({ limit: FETCH, sort: 'displayOrder' }, signal),
    []
  );

  const tiles = arrange(data || []); // always COUNT entries (null = empty slot)
  const shown = tiles.filter(Boolean); // lightbox only cycles through real images

  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(null);

  return (
    <section className="section pt-0">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="container-x">
        <h2 className="section-title text-center">Gallery</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          A peek at our latest work. Tap any photo to explore.
        </p>

        <div className="mt-10 [container-type:inline-size]" onPointerLeave={() => setHovered(null)}>
          <div
            className="grid grid-cols-12 grid-flow-dense [--g:10px] sm:[--g:16px]"
            style={{ gap: 'var(--g)', gridAutoRows: 'calc((100cqw - 11 * var(--g)) / 12)' }}
          >
            {tiles.map((item, i) => (
              <Tile
                key={item?._id || `slot-${i}`}
                item={item}
                index={i}
                active={hovered === i}
                anyActive={hovered !== null && !!tiles[hovered]}
                onHover={setHovered}
                onOpen={(idx) => setOpen(shown.indexOf(tiles[idx]))}
                isLast={i === COUNT - 1}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/gallery" className="btn btn-primary">
            View Full Gallery
          </Link>
        </div>
      </div>

      {open !== null && shown.length > 0 && (
        <Lightbox
          items={shown}
          index={Math.min(open, shown.length - 1)}
          onClose={() => setOpen(null)}
          onChange={setOpen}
        />
      )}
    </section>
  );
}