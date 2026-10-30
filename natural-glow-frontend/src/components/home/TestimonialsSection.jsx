import { publicApi } from '../../api/public.js';
import { useApi } from '../../hooks/useApi.js';

// Renders only published testimonials from the API. With none published, the whole section is hidden
// (no placeholder reviews are ever shown).
export default function TestimonialsSection({ limit = 6 }) {
  const { data } = useApi((signal) => publicApi.testimonials({ limit, sort: 'displayOrder' }, signal), [limit]);
  const items = data || [];
  if (!items.length) return null;

  return (
    <section className="bg-sage-100/70 section">
      <div className="container-x">
        <h2 className="section-title text-center">What Our Clients Say</h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t._id} className="card flex flex-col p-6">
              <p className="text-lg tracking-widest text-gold-500" aria-label={`${t.rating} out of 5 stars`}>
                {'★'.repeat(t.rating)}
                <span className="text-gold-300">{'★'.repeat(5 - t.rating)}</span>
              </p>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">“{t.message}”</blockquote>
              <p className="mt-4 text-sm font-medium">{t.customerName}</p>
              {t.serviceName && <p className="text-xs text-ink/55">{t.serviceName}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
