import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
  { to: '/gallery', label: 'Gallery' },
];

export default function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const linkClass = ({ isActive }) =>
    `relative py-1 text-sm transition ${isActive ? 'text-olive-900 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-olive-800' : 'text-ink/70 hover:text-olive-900'}`;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4 rounded-full border border-gold-300/60 bg-cream-100/90 px-5 py-2.5 shadow-nav backdrop-blur-md sm:px-7">
          <Link to="/" className="font-serif text-xl leading-none tracking-tight text-olive-900 sm:text-2xl" aria-label={`${settings.salonName} home`}>
            {settings.salonName}
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/contact#booking" className="btn btn-primary hidden sm:inline-flex">
              Book an Appointment
            </Link>
            <button
              className="rounded-full p-2 text-olive-900 hover:bg-olive-700/10 lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <Icon name={open ? 'x' : 'menu'} size={22} />
            </button>
          </div>
        </div>

        {open && (
          <nav className="mt-2 rounded-3xl border border-gold-300/60 bg-cream-50 p-4 shadow-nav lg:hidden" aria-label="Mobile">
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-sage-100 text-olive-900' : 'text-ink/75'}`}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/contact#booking" className="btn btn-primary mt-3 w-full">
              Book an Appointment
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
