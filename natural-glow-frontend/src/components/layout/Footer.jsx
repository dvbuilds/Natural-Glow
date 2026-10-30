import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';
import { NAV_LINKS } from './Navbar.jsx';

const SOCIALS = [
  { key: 'facebook', icon: 'facebook', label: 'Facebook' },
  { key: 'instagram', icon: 'instagram', label: 'Instagram' },
  { key: 'youtube', icon: 'youtube', label: 'YouTube' },
];

export default function Footer() {
  const { settings, addressLine } = useSettings();
  const socials = SOCIALS.filter((s) => settings.social[s.key]);

  return (
    <footer className="bg-olive-800 text-cream-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-3xl">{settings.salonName}</p>
          <p className="mt-3 max-w-xs text-sm text-cream-200/80">
            {settings.tagline || 'A welcoming beauty parlour for hair, skin, makeup and bridal care.'}
          </p>
        </div>

        <div>
          <h3 className="font-sans text-sm font-medium text-cream-50">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-200/80">
            {NAV_LINKS.filter((l) => l.to !== '/').map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-sm font-medium text-cream-50">Visit & Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream-200/80">
            {addressLine && <li className="flex gap-2"><Icon name="pin" size={16} className="mt-0.5" /> {addressLine}</li>}
            {settings.phone && (
              <li className="flex gap-2">
                <Icon name="phone" size={16} className="mt-0.5" />
                <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-2">
                <Icon name="mail" size={16} className="mt-0.5" />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-white">{settings.email}</a>
              </li>
            )}
            {!addressLine && !settings.phone && !settings.email && <li>Contact details coming soon.</li>}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-sm font-medium text-cream-50">Social Media</h3>
          {socials.length > 0 ? (
            <ul className="mt-4 flex gap-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={settings.social[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200/30 hover:bg-cream-100/10"
                  >
                    <Icon name={s.icon} size={18} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-cream-200/60">Links coming soon.</p>
          )}
        </div>
      </div>
      <div className="border-t border-cream-200/15 py-5 text-center text-xs text-cream-200/65">
        © {new Date().getFullYear()} {settings.salonName}. All rights reserved.
      </div>
    </footer>
  );
}
