import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import ServiceCard from '../services/ServiceCard.jsx';
import { EmptyState, ErrorState, Skeleton } from '../ui/Feedback.jsx';

export default function ServicesPreview() {
  const { services, loading, error, reload } = useServices();
  // Featured services first (set in the admin panel), then the rest, 4 in total.
  const picks = [...services].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)).slice(0, 4);

  return (
    <section className="bg-sage-200/70 section">
      <div className="container-x">
        <h2 className="section-title text-center">Services</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !services.length && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
          {picks.map((s) => (
            <ServiceCard key={s._id} service={s} showPrice={false} />
          ))}
        </div>
        {error && !services.length && <ErrorState error={error} onRetry={reload} className="mt-6" />}
        {!loading && !error && !services.length && (
          <EmptyState title="Services coming soon">Our service menu will appear here shortly.</EmptyState>
        )}
        <div className="mt-10 text-center">
          <Link to="/services" className="btn btn-primary">
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
