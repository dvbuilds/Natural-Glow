import { useSettings } from '../../context/SettingsContext.jsx';
import { WEEKDAYS, dayLabel } from '../../lib/constants.js';
import { to12h } from '../../lib/format.js';
import Icon from '../ui/Icon.jsx';

const MAP_QUERY = 'Abdul Samad Ln, Garulia, Kolkata, West Bengal 743133';
const DEFAULT_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

const isEmbed = (url) => /google\.[a-z.]+\/maps\/embed|output=embed/i.test(url || '');

// Location, contact details and opening hours — details come from GET /settings; empty fields are hidden.
export default function LocationCard({ withMap = true }) {
  const { settings, addressLine } = useSettings();
  const hours = WEEKDAYS.map((d) => settings.workingHours.find((h) => h.day === d)).filter(Boolean);
  const hasAny = addressLine || settings.phone || settings.email || hours.length;
  const embedSrc = isEmbed(settings.mapUrl) ? settings.mapUrl : DEFAULT_EMBED;

  return (
    <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-gold-300/80 bg-cream-50 shadow-soft">
      {withMap && (
        <div className="relative min-h-[220px] flex-1">
          <iframe
            title="Salon location map"
            src={embedSrc}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}

      <div className="border-t border-gold-300/80 p-5 text-sm">
        {!hasAny && <p className="text-ink/65">Location and contact details will appear here once the salon adds them.</p>}
        {addressLine && (
          <div>
            <p className="font-medium">Location</p>
            <p className="mt-1 flex gap-2 text-ink/75">
              <Icon name="pin" size={16} className="mt-0.5 text-olive-700" />
              <span>
                {addressLine}
                {settings.address.landmark && <span className="block text-xs text-ink/55">Near {settings.address.landmark}</span>}
              </span>
            </p>
          </div>
        )}
        {(settings.phone || settings.email) && (
          <div className="mt-4 space-y-1.5 text-ink/75">
            {settings.phone && (
              <p className="flex gap-2"><Icon name="phone" size={16} className="mt-0.5 text-olive-700" /><a href={`tel:${settings.phone}`} className="hover:text-olive-900">{settings.phone}</a></p>
            )}
            {settings.email && (
              <p className="flex gap-2"><Icon name="mail" size={16} className="mt-0.5 text-olive-700" /><a href={`mailto:${settings.email}`} className="break-all hover:text-olive-900">{settings.email}</a></p>
            )}
          </div>
        )}
        {hours.length > 0 && (
          <div className="mt-4">
            <p className="font-medium">Opening Hours</p>
            <ul className="mt-1 space-y-0.5 text-ink/75">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span>{dayLabel(h.day)}</span>
                  <span>{h.isClosed ? 'Closed' : `${to12h(h.open)} – ${to12h(h.close)}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-4">
          Get directions <Icon name="external" size={14} />
        </a>
      </div>
    </div>
  );
}