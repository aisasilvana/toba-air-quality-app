const TZ = 'Asia/Jakarta';
const mk = (o) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', ...o });
const hm = mk({ hour: '2-digit', minute: '2-digit' });
const hms = mk({ hour: '2-digit', minute: '2-digit', second: '2-digit' });
const dm = mk({ day: 'numeric', month: 'short' });
const dmy = mk({ day: 'numeric', month: 'short', year: 'numeric' });

export const clock = (t) => hm.format(t);
export const clockSec = (t) => hms.format(t);
export const dayMonth = (t) => dm.format(t);
export const dateFull = (t) => dmy.format(t);
export const dayClock = (t) => `${dm.format(t)}, ${hm.format(t)}`;

export function ago(t, now = Date.now()) {
  const m = Math.round((now - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}
export const fix = (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : Number(v).toFixed(d));
