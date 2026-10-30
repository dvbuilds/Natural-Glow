import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../api/public.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import ImageSlot from '../components/ui/ImageSlot.jsx';
import Modal from '../components/ui/Modal.jsx';
import Icon from '../components/ui/Icon.jsx';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../components/ui/Feedback.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { GALLERY_CATEGORIES, label } from '../lib/constants.js';
import { optimizeImage } from '../lib/format.js';

export default function Gallery() {
  const { settings } = useSettings();
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null); // index of the open image
  usePageMeta({
    title: `Gallery | ${settings.salonName}`,
    description: `A look at the work and space at ${settings.salonName}.`,
    path: '/gallery',
  });

  const query = { page, limit: 12, category: category || undefined, sort: 'displayOrder' };
  const { data, meta, loading, error, reload } = useApi((signal) => publicApi.gallery(query, signal), [JSON.stringify(query)]);
  const items = data || [];

  const step = useCallback((d) => setActive((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);
  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, step]);

  const current = active !== null ? items[active] : null;

  return (
    <>
      <PageHeader eyebrow="Our work" title="Gallery">A look at our space and our work.</PageHeader>
      <section className="section pt-4">
        <div className="container-x">
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by category">
            {[{ value: '', label: 'All' }, ...GALLERY_CATEGORIES.map((c) => ({ value: c, label: label(c) }))].map((c) => (
              <button
                key={c.value}
                className={`chip ${category === c.value ? 'chip-active' : ''}`}
                onClick={() => {
                  setCategory(c.value);
                  setPage(1);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {loading && !items.length && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            {items.map((it, i) => (
              <button key={it._id} onClick={() => setActive(i)} className="group relative block aspect-square overflow-hidden rounded-2xl" aria-label={`Open image${it.title ? `: ${it.title}` : ''}`}>
                <ImageSlot src={optimizeImage(it.image.url, 'f_auto,q_auto,w_600,c_fill,ar_1:1')} alt={it.title || it.caption || 'Gallery image'} label="Image" className="absolute inset-0 transition duration-300 group-hover:scale-105" />
                {it.title && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">{it.title}</span>
                )}
              </button>
            ))}
          </div>

          {error && <ErrorState error={error} onRetry={reload} className="mt-6" />}
          {!loading && !error && !items.length && (
            <EmptyState title="No images yet">
              {category ? 'There are no images in this category yet.' : 'Photos will appear here once the salon uploads them from the admin panel.'}
            </EmptyState>
          )}
          <Pagination meta={meta} onPage={setPage} className="mt-8" />
        </div>
      </section>

      <Modal open={Boolean(current)} onClose={() => setActive(null)} title={current?.title || 'Gallery'} size="xl" dark>
        {current && (
          <div className="relative">
            <img src={optimizeImage(current.image.url, 'f_auto,q_auto,w_1600')} alt={current.title || current.caption || 'Gallery image'} className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain" />
            {current.caption && <p className="mt-3 text-center text-sm text-ink/70">{current.caption}</p>}
            {items.length > 1 && (
              <div className="mt-3 flex justify-center gap-3">
                <button className="btn btn-outline btn-sm" onClick={() => step(-1)}><Icon name="chevron-left" size={14} /> Previous</button>
                <button className="btn btn-outline btn-sm" onClick={() => step(1)}>Next <Icon name="chevron-right" size={14} /></button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
