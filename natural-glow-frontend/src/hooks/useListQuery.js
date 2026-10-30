import { useCallback, useState } from 'react';

// Filter/pagination state for list screens. Changing any filter resets to page 1.
export function useListQuery(defaults = {}) {
  const [query, setQuery] = useState({ page: 1, limit: 10, ...defaults });
  const setFilter = useCallback((key, value) => setQuery((q) => ({ ...q, [key]: value, page: 1 })), []);
  const setPage = useCallback((page) => setQuery((q) => ({ ...q, page })), []);
  return { query, setFilter, setPage };
}
