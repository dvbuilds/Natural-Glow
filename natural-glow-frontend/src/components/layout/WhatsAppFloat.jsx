import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';

// Floating WhatsApp button, pinned to the bottom-right corner on every public page (mobile and desktop).
// Opens a chat with the admin's WhatsApp number (Admin → Settings → WhatsApp number, or the salon phone as a
// fallback) with a ready-made message.
export default function WhatsAppFloat() {
  const { settings, whatsapp } = useSettings();
  const href = whatsapp(
    `Hello ${settings.salonName}! I found you on your website and would like to book an appointment. Could you please help me?`
  );
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        right: 'max(1rem, env(safe-area-inset-right))',
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
      className="group fixed z-[60] flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-[#1ebe5a] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50 sm:px-5 sm:py-3.5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 motion-reduce:hidden" aria-hidden="true" />
      <Icon name="whatsapp" size={26} strokeWidth={1.8} />
      <span className="hidden text-sm font-medium sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
