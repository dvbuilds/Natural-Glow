import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import ServiceCard from '../components/services/ServiceCard.jsx';
import { EmptyState, ErrorState, Pagination, Skeleton } from '../components/ui/Feedback.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { SERVICE_CATEGORIES, SERVICE_SORTS, label } from '../lib/constants.js';

export default function Services() {
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const category = SERVICE_CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const [sort, setSort] = useState('displayOrder');
  const [page, setPage] = useState(1);

  usePageMeta({
    title: `Services | ${settings.salonName}`,
    description: `Hair, skin, makeup, bridal and more at ${settings.salonName}. Browse our services and book online.`,
    path: '/services',
  });

  useEffect(() => setPage(1), [category, debounced, sort]);

  const query = { page, limit: 9, category: category || undefined, search: debounced || undefined, sort };
  const { data, meta, loading, error, reload } = useApi((signal) => publicApi.services(query, signal), [JSON.stringify(query)]);
  const items = data || [];

  const setCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c) next.set('category', c);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="What we do" title="Our Services">Find the treatment that suits you, then request an appointment.</PageHeader>

      <section className="section pt-4">
        <div className="container-x">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {[{ value: '', label: 'All' }, ...SERVICE_CATEGORIES.map((c) => ({ value: c, label: label(c) }))].map((c) => (
                <button key={c.value} className={`chip ${category === c.value ? 'chip-active' : ''}`} onClick={() => setCategory(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input className="input pl-9 sm:w-60" placeholder="Search services" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search services" maxLength={100} />
              </div>
              <select className="input sm:w-52" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort services">
                {SERVICE_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading && !items.length && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
            {items.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>

          {error && <ErrorState error={error} onRetry={reload} className="mt-6" />}
          {!loading && !error && !items.length && (
            <EmptyState title="No services found">
              {debounced || category ? 'Try a different category or search term.' : 'Our service menu will appear here shortly.'}
            </EmptyState>
          )}
          <Pagination meta={meta} onPage={setPage} className="mt-8" />
        </div>
      </section>
    </>
  );
}
