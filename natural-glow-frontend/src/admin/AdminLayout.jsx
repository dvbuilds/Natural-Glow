import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/admin/services', label: 'Services', icon: 'scissors' },
  { to: '/admin/offers', label: 'Offers & Packages', icon: 'tag' },
  { to: '/admin/gallery', label: 'Gallery', icon: 'image' },
  { to: '/admin/testimonials', label: 'Testimonials', icon: 'star' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: 'message' },
  { to: '/admin/settings', label: 'Salon Settings', icon: 'sliders' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  usePageMeta({ title: 'Admin | Natural Glow', noindex: true });
  useEffect(() => setOpen(false), [location.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-olive-800 text-cream-100">
      <div className="px-5 py-6">
        <p className="font-serif text-2xl">Natural Glow</p>
        <p className="text-xs text-cream-200/60">Admin panel</p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-cream-100/15 text-white' : 'text-cream-200/75 hover:bg-cream-100/10'}`}
          >
            <Icon name={n.icon} size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-cream-200/15 p-4 text-sm">
        <p className="truncate font-medium">{admin?.name}</p>
        <p className="truncate text-xs text-cream-200/60">{admin?.email}</p>
        <div className="mt-3 flex gap-2">
          <Link to="/" target="_blank" className="btn btn-sm flex-1 border border-cream-200/30 text-cream-100 hover:bg-cream-100/10">
            <Icon name="external" size={14} /> View site
          </Link>
          <button onClick={logout} className="btn btn-sm flex-1 border border-cream-200/30 text-cream-100 hover:bg-cream-100/10">
            <Icon name="logout" size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      <div className="flex items-center justify-between bg-olive-800 px-4 py-3 text-cream-100 lg:hidden">
        <p className="font-serif text-xl">Natural Glow · Admin</p>
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={22} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
