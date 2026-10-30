import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import OffersSection from '../components/offers/OffersSection.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useServices } from '../context/ServicesContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { SERVICE_CATEGORIES, label } from '../lib/constants.js';
import { formatPrice } from '../lib/format.js';

export default function Pricing() {
  const { settings } = useSettings();
  const { services, loading, error, reload } = useServices();
  usePageMeta({
    title: `Pricing | ${settings.salonName}`,
    description: `Service prices at ${settings.salonName}, plus current offers and bridal packages.`,
    path: '/pricing',
  });

  const groups = SERVICE_CATEGORIES.map((c) => ({ category: c, items: services.filter((s) => s.category === c) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader eyebrow="Transparent pricing" title="Pricing">
        Prices shown are the salon’s current listed prices. “From” means the price starts at that amount.
      </PageHeader>

      <section className="section pt-4">
        <div className="container-x">
          {loading && !services.length && <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>}
          {error && !services.length && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !services.length && <EmptyState title="Prices coming soon">Our price list will appear here shortly.</EmptyState>}

          <div className="grid gap-6 lg:grid-cols-2">
            {groups.map((g) => (
              <div key={g.category} className="card p-6">
                <h2 className="font-serif text-2xl">{label(g.category)}</h2>
                <ul className="mt-4 divide-y divide-gold-300/60">
                  {g.items.map((s) => (
                    <li key={s._id} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink/60">{s.description}</p>}
                        {s.durationMinutes && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink/50"><Icon name="clock" size={12} /> {s.durationMinutes} min</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-serif text-lg text-olive-900">{formatPrice(s.price, s.priceType)}</p>
                        <Link to={`/contact?service=${s._id}#booking`} className="text-xs font-medium text-olive-700 hover:underline">Book</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sage-100/70 section">
        <div className="container-x">
          <OffersSection />
        </div>
      </section>
    </>
  );
}
