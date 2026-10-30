// The salon operates in India Standard Time (no DST), so a fixed offset is safe.
export const IST_TZ = 'Asia/Kolkata';
export const IST_OFFSET = '+05:30';

export const istDateString = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: IST_TZ }).format(d); // YYYY-MM-DD

export const istWeekday = (d) =>
  new Intl.DateTimeFormat('en-US', { timeZone: IST_TZ, weekday: 'long' }).format(d).toLowerCase();

export const istTimeString = (d) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d); // HH:mm

// Builds a Date from IST date (YYYY-MM-DD) + time (HH:mm). Returns null for impossible dates (e.g. 2026-02-31).
export const fromIst = (date, time = '00:00') => {
  const d = new Date(`${date}T${time}:00${IST_OFFSET}`);
  if (Number.isNaN(d.getTime()) || istDateString(d) !== date) return null;
  return d;
};
