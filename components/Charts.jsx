'use client';
import { useEffect, useRef, useState } from 'react';
import { clock, dayMonth, dayClock } from '@/lib/format';

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(Math.max(260, e[0].contentRect.width)));
    ro.observe(ref.current);
    setW(Math.max(260, ref.current.clientWidth));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceTicks(lo, hi, n = 4) {
  const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw);
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.001; v += step) out.push(+v.toFixed(6));
  return out;
}

export function Sparkline({ values, color, w = 112, h = 34 }) {
  if (!values || values.length < 2) return <svg width={w} height={h} />;
  const lo = Math.min(...values), hi = Math.max(...values), pad = 3;
  const x = (i) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v) => h - pad - ((v - lo) / (hi - lo || 1)) * (h - 2 * pad);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} aria-hidden="true"><path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

// series: [{ name, color, points:[{t,v}] }]
export function LineChart({ series, height = 280, decimals = 1, unit = '', threshold, hours = 24, zeroBase = true }) {
  const [ref, W] = useWidth();
  const [hover, setHover] = useState(null);
  const m = { l: 40, r: 12, t: 10, b: 26 }, iw = W - m.l - m.r, ih = height - m.t - m.b;
  const all = series.flatMap((s) => s.points);
  const tMax = Date.now(), tMin = tMax - hours * 3.6e6;
  let body = null;
  if (!all.length) body = <div className="empty" style={{ height }}>No history available yet.</div>;
  else {
    let lo = Math.min(...all.map((p) => p.v)), hi = Math.max(...all.map((p) => p.v));
    if (threshold && threshold.value < hi * 1.4) hi = Math.max(hi, threshold.value * 1.05);
    if (zeroBase) lo = 0; else { const pd = (hi - lo) * 0.15 || 1; lo -= pd; hi += pd; }
    hi *= zeroBase ? 1.08 : 1;
    const ticks = niceTicks(lo, hi); lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
    const x = (t) => m.l + ((t - tMin) / (tMax - tMin)) * iw, y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    const nx = Math.min(6, Math.floor(iw / 95));
    const fmtX = (t) => (hours > 36 ? dayMonth(t) : clock(t));
    const near = (pts, t) => { let b = null, bd = Infinity; for (const p of pts) { const d = Math.abs(p.t - t); if (d < bd) { bd = d; b = p; } } return b; };
    const onMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const t = tMin + ((e.clientX - r.left) / r.width) * (tMax - tMin);
      const rows = series.map((s) => ({ s, p: near(s.points, t) })).filter((o) => o.p);
      if (!rows.length) return setHover(null);
      rows.sort((a, b) => b.p.v - a.p.v);
      setHover({ rows, t: rows[0].p.t, px: e.clientX - r.left + m.l });
    };
    body = (
      <svg viewBox={`0 0 ${W} ${height}`} width={W} height={height} role="img">
        {ticks.map((v) => <g key={v}><line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="grid" /><text x={m.l - 8} y={y(v) + 4} textAnchor="end" className="axis">{v}</text></g>)}
        {Array.from({ length: nx + 1 }, (_, i) => { const t = tMin + ((tMax - tMin) * i) / nx; return <text key={i} x={x(t)} y={height - 8} className="axis" textAnchor={i === 0 ? 'start' : i === nx ? 'end' : 'middle'}>{fmtX(t)}</text>; })}
        {threshold && threshold.value <= hi && <g><line x1={m.l} x2={W - m.r} y1={y(threshold.value)} y2={y(threshold.value)} stroke="var(--aqi-sensitive)" strokeDasharray="5 4" opacity=".8" /><text x={W - m.r - 4} y={y(threshold.value) - 5} textAnchor="end" className="axis" style={{ fill: 'var(--aqi-sensitive)' }}>{threshold.label} · {threshold.value}</text></g>}
        {series.map((s) => s.points.length > 0 && <path key={s.name} d={s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
        {hover && <g><line x1={x(hover.t)} x2={x(hover.t)} y1={m.t} y2={m.t + ih} stroke="var(--muted)" strokeDasharray="3 3" />{hover.rows.map((o) => <circle key={o.s.name} cx={x(o.p.t)} cy={y(o.p.v)} r="4.5" fill={o.s.color} stroke="var(--card)" strokeWidth="2" />)}</g>}
        <rect x={m.l} y={m.t} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
    );
  }
  return (
    <div className="chart" ref={ref} style={{ position: 'relative' }}>
      {body}
      {hover && (
        <div className="tip" style={{ left: Math.min(hover.px + 14, W - 190), top: 20 }}>
          <div className="tip-t">{dayClock(hover.t)} WIB</div>
          {hover.rows.map((o) => <div className="tip-r" key={o.s.name}><span><i style={{ background: o.s.color }} />{o.s.name}</span><b>{o.p.v.toFixed(decimals)} {unit}</b></div>)}
        </div>
      )}
    </div>
  );
}
