import { createContext, useContext, useMemo } from 'react';
import { publicApi } from '../api/public.js';
import { useApi } from '../hooks/useApi.js';
import { formatAddress, whatsappLink } from '../lib/format.js';

const SettingsContext = createContext(null);

// Used until/unless GET /settings answers. Contact details are intentionally empty: nothing is invented.
const DEFAULTS = {
  salonName: 'Natural Glow Beauty Parlour',
  tagline: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  address: { line1: '', area: '', city: 'Shyamnagar', state: '', postalCode: '', landmark: '' },
  mapUrl: '',
  workingHours: [],
  social: { facebook: '', instagram: '', youtube: '' },
  bookingNotice: 'Appointment requests are confirmed by the salon. Submitting a request does not reserve a slot.',
  seoTitle: '',
  seoDescription: '',
};

export function SettingsProvider({ children }) {
  const { data, loading, error, reload } = useApi((signal) => publicApi.settings(signal), []);

  const value = useMemo(() => {
    const settings = {
      ...DEFAULTS,
      ...(data || {}),
      address: { ...DEFAULTS.address, ...(data?.address || {}) },
      social: { ...DEFAULTS.social, ...(data?.social || {}) },
    };
    return {
      settings,
      loading,
      error,
      reload,
      addressLine: formatAddress(settings.address),
      whatsapp: (text) => whatsappLink(settings.whatsappNumber, text),
    };
  }, [data, loading, error, reload]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
