import { useSettings } from '../../context/SettingsContext.jsx';
import Icon from '../ui/Icon.jsx';

// Floating WhatsApp button, pinned to the bottom-right corner on every public page (mobile and desktop).
// It is a plain round icon everywhere; on desktop, hovering (or keyboard focus) smoothly expands it into the
// "Chat on WhatsApp" pill.
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
      className="group fixed z-[60] flex items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-[background-color,box-shadow,transform] duration-300 hover:bg-[#1ebe5a] hover:shadow-[0_10px_28px_rgba(0,0,0,0.32)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/50"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 motion-reduce:hidden" aria-hidden="true" />
      <Icon name="whatsapp" size={26} strokeWidth={1.8} className="shrink-0" />
      {/* Collapsed to zero width until hover/focus (desktop only), then slides open with a fade. */}
      <span
        className="hidden overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out sm:ml-0 sm:block sm:max-w-0 sm:group-hover:ml-1 sm:group-hover:max-w-[12rem] sm:group-hover:opacity-100 sm:group-focus-visible:ml-1 sm:group-focus-visible:max-w-[12rem] sm:group-focus-visible:opacity-100 motion-reduce:transition-none"
        aria-hidden="true"
      >
        Chat on WhatsApp
      </span>
    </a>
  );
}
