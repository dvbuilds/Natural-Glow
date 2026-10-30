import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

const SIZES = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

export default function Modal({ open, onClose, title, size = 'md', children, footer, dark = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 ${dark ? 'bg-black/80' : 'bg-olive-900/50'}`} onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-2xl bg-cream-50 shadow-soft outline-none sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-gold-300/70 px-5 py-4">
          <h2 className="font-serif text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink/60 hover:bg-olive-700/10">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gold-300/70 bg-cream-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink/75">{message}</p>
    </Modal>
  );
}
