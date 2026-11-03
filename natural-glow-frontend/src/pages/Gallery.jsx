import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../api/public.js';
import { useApi } from '../hooks/useApi.js';
import { optimizeImage } from '../lib/format.js';
import { Lightbox } from '../components/home/GalleryPreview.jsx';

// Same 6-tile pattern as the home page, repeated for every block of 6 photos.
// p = 3:4 portrait, l = 3:2 landscape.  Desktop rows: P P L / L P P.  Mobile: P P / L / L / P P.
const SHAPES = ['p', 'p', 'l', 'l', 'p', 'p'];

const SHAPE_CLASS = {
  p: 'col-span-6 row-span-8 md:col-span-3 md:row-span-4',
  l: 'col-span-12 row-span-8 md:col-span-6 md:row-span-4',
};

const SHAPE_CROP = {
  p: 'f_auto,q_auto,w_800,h_1067,c_fill,g_auto',
  l: 'f_auto,q_auto,w_1200,h_800,c_fill,g_auto',
};

// Needs item.image.width/height. If missing -> 'u' (unknown).
const orient = (it) =>
  it?.image?.width && it?.image?.height ? (it.image.width >= it.image.height ? 'l' : 'p') : 'u';

// Walks the slots block by block and puts a photo of the matching orientation into each one.
// Falls back to an unknown-orientation photo, then to the next photo in order.
function arrange(items) {
  const pool = [...items];
  const out = [];
  while (pool.length) {
    const shape = SHAPES[out.length % SHAPES.length];
    let i = pool.findIndex((it) => orient(it) === shape);
    if (i === -1) i = pool.findIndex((it) => orient(it) === 'u');
    if (i === -1) i = 0;
    out.push({ item: pool.splice(i, 1)[0], shape });
  }
  return out;
}

function Tile({ item, shape, index, active, anyActive, onHover, onOpen }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  // Scroll-reveal, staggered within each block of 6
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

  const label = item.title || item.caption || 'Salon gallery';

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={reset}
      style={{ transitionDelay: visible ? `${(index % SHAPES.length) * 60}ms` : '0ms' }}
      className={`group relative overflow-hidden rounded-3xl bg-neutral-100 shadow-sm
        transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none
        ${SHAPE_CLASS[shape]}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        ${anyActive && !active ? 'scale-[0.97] opacity-60 saturate-50' : ''}
        ${active ? 'z-10 shadow-2xl' : ''}`}
    >
      <div
        className="h-full w-full transition-transform duration-300 ease-out "
        style={{ transform: 'perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
      >
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
      </div>
    </div>
  );
}

export default function Gallery() {
  const { data, loading } = useApi(
    (signal) => publicApi.gallery({ limit: 50, sort: 'displayOrder' }, signal),
    []
  );

  const tiles = arrange((data || []).filter((it) => it?.image?.url));
  const ordered = tiles.map((t) => t.item); // lightbox order = display order

  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(null);

  return (
    <section className="section">
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>
      <div className="container-x pt-20">
        <h1 className="section-title text-center">Our Gallery</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          A look at our work. Tap any photo to explore.
        </p>

        {!loading && tiles.length === 0 && (
          <p className="mt-12 text-center text-neutral-500">No photos yet. Check back soon.</p>
        )}

        <div className="mt-10 [container-type:inline-size]" onPointerLeave={() => setHovered(null)}>
          <div
            className="grid grid-cols-12 grid-flow-dense [--g:10px] sm:[--g:16px]"
            style={{ gap: 'var(--g)', gridAutoRows: 'calc((100cqw - 11 * var(--g)) / 12)' }}
          >
            {tiles.map(({ item, shape }, i) => (
              <Tile
                key={item._id || i}
                item={item}
                shape={shape}
                index={i}
                active={hovered === i}
                anyActive={hovered !== null}
                onHover={setHovered}
                onOpen={setOpen}
              />
            ))}
          </div>
        </div>
      </div>

      {open !== null && ordered.length > 0 && (
        <Lightbox
          items={ordered}
          index={Math.min(open, ordered.length - 1)}
          onClose={() => setOpen(null)}
          onChange={setOpen}
        />
      )}
    </section>
  );
}