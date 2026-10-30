import { useEffect } from 'react';
import { SITE_URL } from '../../config/env.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { dayLabel } from '../../lib/constants.js';

// Injects schema.org BeautySalon JSON-LD built ONLY from details the admin has saved in Settings.
export default function JsonLd() {
  const { settings, addressLine } = useSettings();

  useEffect(() => {
    const id = 'ld-business';
    const existing = document.getElementById(id);
    const a = settings.address;
    if (!settings.phone && !addressLine) {
      existing?.remove();
      return;
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: settings.salonName,
      url: SITE_URL || window.location.origin,
      ...(settings.tagline ? { description: settings.tagline } : {}),
      ...(settings.phone ? { telephone: settings.phone } : {}),
      ...(settings.email ? { email: settings.email } : {}),
      ...(addressLine
        ? {
            address: {
              '@type': 'PostalAddress',
              ...(a.line1 || a.area ? { streetAddress: [a.line1, a.area].filter(Boolean).join(', ') } : {}),
              ...(a.city ? { addressLocality: a.city } : {}),
              ...(a.state ? { addressRegion: a.state } : {}),
              ...(a.postalCode ? { postalCode: a.postalCode } : {}),
              addressCountry: 'IN',
            },
          }
        : {}),
      ...(settings.workingHours.filter((h) => !h.isClosed && h.open && h.close).length
        ? {
            openingHoursSpecification: settings.workingHours
              .filter((h) => !h.isClosed && h.open && h.close)
              .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayLabel(h.day), opens: h.open, closes: h.close })),
          }
        : {}),
      ...(Object.values(settings.social).some(Boolean) ? { sameAs: Object.values(settings.social).filter(Boolean) } : {}),
    };
    const el = existing || Object.assign(document.createElement('script'), { id, type: 'application/ld+json' });
    el.textContent = JSON.stringify(data);
    if (!existing) document.head.appendChild(el);
  }, [settings, addressLine]);

  return null;
}
