'use client';
import { categoryOf } from '@/lib/aqi';

export function Pill({ cat, children }) {
  return <span className={`pill pill-${cat.key}`}><i />{children || cat.label}</span>;
}
export const aqiColor = (cat) => `var(--aqi-${cat.key})`;

export function PageHead({ title, sub, children }) {
  return (
    <div className="pagehead">
      <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      <div className="pagehead-actions">{children}</div>
    </div>
  );
}

export function SignalBars({ rssi, offline }) {
  const lvl = offline || rssi == null ? 0 : rssi > -60 ? 4 : rssi > -75 ? 3 : rssi > -90 ? 2 : 1;
  const label = offline ? 'Lost' : rssi == null ? '—' : ['', 'Weak', 'Fair', 'Good', 'Strong'][lvl];
  return (
    <span className="signal">
      <span className="sbars">{[1, 2, 3, 4].map((n) => <i key={n} className={n <= lvl ? 'on' : ''} style={{ height: 4 + n * 3 }} />)}</span>
      {label}
    </span>
  );
}

export function Battery({ pct }) {
  if (pct == null) return <span className="muted">—</span>;
  const low = pct < 30;
  return (
    <span className="battery">
      <span className="bat"><b style={{ width: `${Math.max(4, pct)}%`, background: low ? 'var(--aqi-unhealthy)' : 'var(--aqi-good)' }} /></span>
      <span style={{ color: low ? 'var(--aqi-unhealthy)' : undefined }}>{Math.round(pct)}%</span>
    </span>
  );
}

export function Legend({ items }) {
  return <div className="legend">{items.map((i) => <span key={i.name}><i style={{ background: i.color }} />{i.name}</span>)}</div>;
}

export { categoryOf };
