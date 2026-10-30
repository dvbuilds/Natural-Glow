import { useCallback, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';

// Wraps a mutation: tracks `busy`, shows a success toast, and reports errors (as a toast, or via onError).
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (fn, { success, onError } = {}) => {
      setBusy(true);
      try {
        const result = await fn();
        if (success) toast.success(success);
        return { ok: true, result };
      } catch (e) {
        if (onError) onError(e);
        else toast.error(e.message);
        return { ok: false, error: e };
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );
  return { run, busy };
}
