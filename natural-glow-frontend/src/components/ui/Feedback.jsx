import Icon from './Icon.jsx';

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-olive-700/25 border-t-olive-700 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-sage-100 ${className}`} />;
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center ${className}`} role="alert">
      <p className="text-sm text-red-900">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-sm mt-3">
          <Icon name="refresh" size={14} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-dashed border-gold-400/70 bg-cream-50/60 px-6 py-12 text-center ${className}`}>
      <p className="font-serif text-xl text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink/65">{children}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sage-200 text-olive-900',
  rescheduled: 'bg-sky-100 text-sky-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-900',
  new: 'bg-amber-100 text-amber-900',
  read: 'bg-sky-100 text-sky-900',
  replied: 'bg-emerald-100 text-emerald-900',
  archived: 'bg-stone-200 text-stone-700',
  active: 'bg-sage-200 text-olive-900',
  inactive: 'bg-stone-200 text-stone-700',
  published: 'bg-sage-200 text-olive-900',
  draft: 'bg-stone-200 text-stone-700',
};

export function StatusBadge({ status, children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || 'bg-stone-200 text-stone-700'}`}>
      {children || status}
    </span>
  );
}

export function Pagination({ meta, onPage, className = '' }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total } = meta;
  return (
    <nav className={`flex items-center justify-between gap-3 text-sm ${className}`} aria-label="Pagination">
      <span className="text-ink/60">
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevron-left" size={14} /> Prev
        </button>
        <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </nav>
  );
}
