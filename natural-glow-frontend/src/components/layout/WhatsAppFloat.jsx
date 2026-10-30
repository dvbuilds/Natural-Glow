import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';

// Floating WhatsApp booking CTA. Only rendered once the admin has saved a WhatsApp number in Settings.
export default function WhatsAppFloat() {
  const { settings, whatsapp } = useSettings();
  const href = whatsapp(`Hello ${settings.salonName}, I would like to book an appointment.`);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#1f8f4f] px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-[#177a42]"
    >
      <Icon name="whatsapp" size={20} />
      <span className="hidden sm:inline">Book on WhatsApp</span>
    </a>
  );
}
