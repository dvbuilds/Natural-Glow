import { forwardRef, useId } from 'react';

export function Field({ label, error, hint, required, children, className = '', htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink/55">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Convenience wrappers: label + control + error in one.
export const TextField = forwardRef(function TextField(
  { label, error, hint, required, className = '', inputClassName = '', ...props },
  ref
) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <input
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`input ${error ? 'input-invalid' : ''} ${inputClassName}`}
        {...props}
      />
    </Field>
  );
});

export function TextArea({ label, error, hint, required, className = '', rows = 4, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <textarea id={id} rows={rows} aria-invalid={Boolean(error)} className={`input resize-y ${error ? 'input-invalid' : ''}`} {...props} />
    </Field>
  );
}

export function SelectField({ label, error, hint, required, className = '', children, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <select id={id} aria-invalid={Boolean(error)} className={`input ${error ? 'input-invalid' : ''}`} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={`inline-flex items-center gap-2.5 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-olive-700' : 'bg-gold-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      {label}
    </label>
  );
}

// Visually hidden anti-spam field. Real users never see or fill it; bots usually do (backend then rejects the request).
export function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
