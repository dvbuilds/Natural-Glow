import { useServices } from '../../context/ServicesContext.jsx';
import Icon from '../ui/Icon.jsx';

/*
 * Trust strip under the hero buttons.
 * The defaults below only state things the website itself provides, so they are always true.
 * To show your own claims (for example "500+ Happy Customers" or "Doorstep Service"), edit ITEMS,
 * but only use figures and promises that are real. Icons available: leaf, users, truck, tag, calendar,
 * scissors, whatsapp, star, clock, check, sparkle (see components/ui/Icon.jsx).
 */
export default function HeroHighlights() {
  const { services } = useServices();

  const ITEMS = [
    {
      icon: 'scissors',
      title: services.length ? `${services.length}+` : 'Full menu',
      text: 'Services offered',
    },
    { icon: 'tag', title: 'Clear', text: 'Prices shown online' },
    { icon: 'calendar', title: 'Easy', text: 'Online booking' },
  ];

  return (
    <ul className="hero-in mt-10 grid w-full max-w-2xl gap-4 rounded-2xl border border-amber-100 bg-[#DEE2CC] px-5 py-4 shadow-sm backdrop-blur sm:grid-cols-3 sm:gap-0" style={{ animationDelay: '.38s' }}>
      {ITEMS.map((it, i) => (
        <li key={it.text} className={`flex items-center gap-3 sm:px-4 ${i > 0 ? 'sm:border-l sm:border-ink/10' : 'sm:pl-0'}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-olive-600 shadow-md">
            <Icon name={it.icon} size={20} />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-lg leading-tight text-ink">{it.title}</span>
            <span className="block text-xs leading-snug text-ink/55">{it.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}