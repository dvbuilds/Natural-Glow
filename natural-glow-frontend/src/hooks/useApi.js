import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fetcher(signal)` and tracks { data, meta, loading, error }.
 * Re-runs when `deps` change or reload() is called; stale/aborted requests are ignored.
 * Previous data is kept while a refetch is in flight (no flicker when paging/filtering).
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, meta: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current(ctrl.signal)
      .then((r) => setState({ data: r.data, meta: r.meta, loading: false, error: null }))
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setState((s) => ({ ...s, loading: false, error: e }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
