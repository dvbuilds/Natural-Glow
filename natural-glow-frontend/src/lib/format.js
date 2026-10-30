const TZ = 'Asia/Kolkata'; // the salon operates in IST; the backend interprets booking dates as IST
const IST_OFFSET = '+05:30';

export const formatPrice = (n, type) => {
  const s = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
  return type === 'starting_from' ? `From ${s}` : s;
};

export const formatDateTime = (iso) =>
  iso ? new Intl.DateTimeFormat('en-IN', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '';

export const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('en-IN', { timeZone: TZ, dateStyle: 'medium' }).format(new Date(iso)) : '';

export const istDateString = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD

export const istTimeString = (d = new Date()) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d); // HH:mm

export const istWeekday = (d) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(d).toLowerCase();

export const addDaysIst = (n) => istDateString(new Date(Date.now() + n * 86400000));

export const weekdayOfDateString = (dateStr) => istWeekday(new Date(`${dateStr}T12:00:00${IST_OFFSET}`));

export const istInstant = (date, time) => new Date(`${date}T${time}:00${IST_OFFSET}`);

// <input type="datetime-local"> <-> ISO with explicit IST offset (what the backend's Zod datetime() requires)
export const toIstInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${istDateString(d)}T${istTimeString(d)}`;
};
export const fromIstInput = (v) => (v ? `${v}:00${IST_OFFSET}` : null);

export const to12h = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const buildSlots = (open, close, stepMin = 30) => {
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const out = [];
  for (let m = oh * 60 + om; m < ch * 60 + cm; m += stepMin) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
};

export const formatAddress = (a = {}) =>
  [a.line1, a.area, a.city, a.state, a.postalCode].filter(Boolean).join(', ');

export const digitsOnly = (s = '') => String(s).replace(/\D/g, '');

export const whatsappLink = (number, text) => {
  const d = digitsOnly(number);
  if (!d) return '';
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

// Apply Cloudinary delivery transformations (format/quality/width) to a Cloudinary URL; other URLs pass through.
export const optimizeImage = (url, transform = 'f_auto,q_auto,w_800') => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
};

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
