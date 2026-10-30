import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * An image placeholder you fill in yourself.
 * - If `src` loads, it is shown (object-cover, fills the parent).
 * - If `src` is empty or the file is missing, a labelled placeholder is shown instead.
 * Give it a size through className (e.g. "aspect-[4/3]" or "absolute inset-0").
 */
export default function ImageSlot({
  src,
  alt = '',
  label = 'Image',
  hint,
  className = '',
  eager = false,
  labelAlign = 'center',
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const show = Boolean(src) && !failed;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-sage-100 via-cream-200 to-sage-200 ${className}`}>
      {show ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className={`absolute inset-2 flex rounded-xl border border-dashed border-olive-600/30 text-olive-700/70 ${
            labelAlign === 'right' ? 'items-end justify-end p-3' : 'flex-col items-center justify-center gap-1 p-3 text-center'
          }`}
          role="img"
          aria-label={alt || label}
        >
          {labelAlign === 'right' ? (
            <span className="rounded-full bg-cream-50/80 px-3 py-1 text-[11px] font-medium">
              {label}
              {hint ? ` · ${hint}` : ''}
            </span>
          ) : (
            <>
              <Icon name="image" size={22} />
              <span className="text-xs font-medium">{label}</span>
              {hint && <span className="text-[10px] leading-tight opacity-80">{hint}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
