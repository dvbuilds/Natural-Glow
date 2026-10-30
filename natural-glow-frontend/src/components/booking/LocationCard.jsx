import { IMAGES } from '../../config/images.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { WEEKDAYS, dayLabel } from '../../lib/constants.js';
import { to12h } from '../../lib/format.js';
import ImageSlot from '../ui/ImageSlot.jsx';
import Icon from '../ui/Icon.jsx';

const isEmbed = (url) => /google\.[a-z.]+\/maps\/embed|output=embed/i.test(url);

// Location, contact details and opening hours — everything comes from GET /settings; empty fields are hidden.
export default function LocationCard({ withMap = true }) {
  const { settings, addressLine } = useSettings();
  const hours = WEEKDAYS.map((d) => settings.workingHours.find((h) => h.day === d)).filter(Boolean);
  const hasAny = addressLine || settings.phone || settings.email || hours.length;

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-gold-300/80 shadow-soft">
      {withMap &&
        (isEmbed(settings.mapUrl) ? (
          <iframe title="Map" src={settings.mapUrl} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <ImageSlot src={IMAGES.map} alt="Map" label="Map image" hint="public/images/map.jpg · or paste a Google Maps embed URL in Admin → Settings" className="absolute inset-0" labelAlign="right" />
        ))}

      <div className={`${withMap ? 'relative m-4 ml-auto max-w-sm' : ''} rounded-xl border border-gold-300/80 bg-cream-50/95 p-5 text-sm backdrop-blur`}>
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
        {settings.mapUrl && (
          <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-4">
            Get directions <Icon name="external" size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
