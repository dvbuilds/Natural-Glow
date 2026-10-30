import { createContext, useContext, useMemo } from 'react';
import { publicApi } from '../api/public.js';
import { useApi } from '../hooks/useApi.js';

const ServicesContext = createContext(null);

// One shared fetch of all active services (backend max page size is 100). Used by the booking form,
// Pricing page, Home previews and the About page, so they never hard-code services or prices.
export function ServicesProvider({ children }) {
  const { data, loading, error, reload } = useApi(
    (signal) => publicApi.services({ limit: 100, sort: 'displayOrder' }, signal),
    []
  );

  const value = useMemo(() => {
    const services = data || [];
    const byId = Object.fromEntries(services.map((s) => [s._id, s]));
    const categories = [...new Set(services.map((s) => s.category))];
    return { services, byId, categories, loading, error, reload };
  }, [data, loading, error, reload]);

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export const useServices = () => useContext(ServicesContext);
