import { useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useApi } from '../../hooks/useApi.js';
import { OFFER_TYPES } from '../../lib/constants.js';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../ui/Feedback.jsx';
import OfferCard from './OfferCard.jsx';

// Active offers and bridal packages (the API already limits results to those inside their validity window).
// `compact` = Home preview (featured, no filters); otherwise full list with type filter + pagination (Pricing).
export default function OffersSection({ compact = false, title = 'Offers & Bridal Packages', hideWhenEmpty = false }) {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const params = compact ? { limit: 3, sort: 'displayOrder' } : { limit: 9, page, type: type || undefined, sort: 'displayOrder' };
  const { data, meta, loading, error, reload } = useApi((signal) => publicApi.offers(params, signal), [JSON.stringify(params)]);
  const offers = data || [];

  if (hideWhenEmpty && !loading && !error && !offers.length) return null;

  return (
    <section className={compact ? 'section' : ''} id="offers">
      <div className={compact ? 'container-x' : ''}>
        <h2 className="section-title text-center">{title}</h2>
        {!compact && (
          <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter offers">
            {[{ value: '', label: 'All' }, ...OFFER_TYPES].map((t) => (
              <button
                key={t.value}
                className={`chip ${type === t.value ? 'chip-active' : ''}`}
                onClick={() => {
                  setType(t.value);
                  setPage(1);
                }}
              >
                {t.label}s
              </button>
            ))}
          </div>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && !offers.length && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          {offers.map((o) => (
            <OfferCard key={o._id} offer={o} />
          ))}
        </div>
        {error && <ErrorState error={error} onRetry={reload} className="mt-6" />}
        {!loading && !error && !offers.length && (
          <EmptyState title="No offers right now">Check back soon, or ask us about current packages.</EmptyState>
        )}
        {!compact && <Pagination meta={meta} onPage={setPage} className="mt-8" />}
      </div>
    </section>
  );
}
