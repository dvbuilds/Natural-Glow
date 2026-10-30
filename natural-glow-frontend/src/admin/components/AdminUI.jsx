import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce.js';
import Icon from '../../components/ui/Icon.jsx';

export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search', className = '' }) {
  const [text, setText] = useState(value || '');
  const debounced = useDebounce(text.trim(), 350);
  useEffect(() => {
    if (debounced !== (value || '')) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
      <input className="input pl-9" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={placeholder} maxLength={100} />
    </div>
  );
}

export function FilterBar({ children }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}

export function TableCard({ children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">{children}</table>
      </div>
    </div>
  );
}

export const RowActions = ({ children }) => <div className="flex items-center justify-end gap-1">{children}</div>;

export function IconButton({ icon, label, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 transition disabled:opacity-40 ${danger ? 'text-red-700 hover:bg-red-100' : 'text-olive-800 hover:bg-olive-700/10'}`}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

export function FormSection({ title, children }) {
  return (
    <fieldset className="rounded-xl border border-gold-300/70 p-4">
      <legend className="px-2 text-sm font-medium text-olive-800">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
