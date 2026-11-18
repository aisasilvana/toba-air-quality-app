'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/components/DataProvider';
import { PageHead, Pill, aqiColor } from '@/components/ui';
import { categoryOf } from '@/lib/aqi';
import { fix } from '@/lib/format';

const PARAMS = { pm25: ['PM2.5', 'µg/m³', 1], pm10: ['PM10', 'µg/m³', 0], temperature: ['Temperature', '°C', 1], humidity: ['Humidity', '%', 0] };
const avgOf = (h, k) => { const a = (h || []).filter((p) => p[k] != null); return a.length ? a.reduce((s, p) => s + p[k], 0) / a.length : null; };

export default function Ranking() {
  const { stations, hist, alerts, acked } = useData();
  const [dir, setDir] = useState('asc');
  const [view, setView] = useState('current');
  const [param, setParam] = useState('pm25');

  const rows = stations.map((s) => {
    const aqi = view === 'current' ? s.aqi : Math.round(avgOf(hist[s.id], 'aqi') ?? NaN);
    const val = (k) => (view === 'current' ? s[k] : avgOf(hist[s.id], k));
    return { ...s, rAqi: Number.isNaN(aqi) ? null : aqi, rCat: categoryOf(Number.isNaN(aqi) ? null : aqi), rPm25: val('pm25'), val };
  });
  const ok = rows.filter((r) => r.rAqi != null && !r.offline);
  const sorted = [...rows].sort((a, b) => (a.rAqi ?? 1e9) - (b.rAqi ?? 1e9));
  if (dir === 'desc') sorted.reverse();
  const best = [...ok].sort((a, b) => a.rAqi - b.rAqi)[0], worst = [...ok].sort((a, b) => b.rAqi - a.rAqi)[0];
  const netAvg = ok.length ? Math.round(ok.reduce((s, r) => s + r.rAqi, 0) / ok.length) : null;
  const netCat = categoryOf(netAvg);
  const bars = rows.filter((r) => r.val(param) != null).sort((a, b) => a.val(param) - b.val(param));
  const maxV = Math.max(...bars.map((r) => r.val(param)), 1);
  const critical = worst && alerts.some((a) => a.stationId === worst.id && a.level === 'critical' && !acked[a.id]);
  const [pl, pu, pd] = PARAMS[param];
  const isPm = param === 'pm25' || param === 'pm10';

  return (
    <>
      <PageHead title="A clearer comparison" sub="See which locations are breathing easier, and which need a closer look.">
        <select value={view} onChange={(e) => setView(e.target.value)} aria-label="View"><option value="current">Current readings</option><option value="avg">24-hour average</option></select>
      </PageHead>

      <div className="grid3">
        <div className="card rk-top"><div><div className="muted" style={{ fontSize: 12 }}>Cleanest air</div><div className="big-name">{best?.location ?? '—'}</div></div>{best && <Pill cat={best.rCat}>{best.rAqi} AQI</Pill>}</div>
        <div className="card rk-top"><div><div className="muted" style={{ fontSize: 12 }}>Network average</div><div className="big-name">{netAvg ?? '—'} AQI</div></div><Pill cat={netCat} /></div>
        <div className="card rk-top"><div><div className="muted" style={{ fontSize: 12 }}>Needs attention</div><div className="big-name">{worst?.location ?? '—'}</div></div>{worst && <Pill cat={worst.rCat}>{worst.rAqi} AQI</Pill>}</div>
      </div>

      <div className="split" style={{ marginTop: 14, gridTemplateColumns: '1.35fr 1fr' }}>
        <div className="card">
          <div className="card-h"><div><h2>Location ranking</h2><p className="muted">Best to worst · US AQI</p></div>
            <button className="btn" onClick={() => setDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>Sort: AQI {dir === 'asc' ? '↑' : '↓'}</button></div>
          <div className="tablewrap"><table>
            <thead><tr><th>#</th><th>Location</th><th>AQI</th><th>Status</th><th>PM2.5</th><th>24h change</th></tr></thead>
            <tbody>{sorted.map((r, i) => (
              <tr key={r.id}>
                <td className="muted">{String(i + 1).padStart(2, '0')}</td>
                <td><b style={{ fontWeight: 500 }}>{r.location}</b>{r.offline && <div style={{ fontSize: 11, color: 'var(--aqi-moderate)' }}>Stale data</div>}</td>
                <td><div className="aqibar"><b style={{ color: aqiColor(r.rCat) }}>{r.rAqi ?? '—'}</b><span><i style={{ width: `${Math.min(100, ((r.rAqi || 0) / 200) * 100)}%`, background: aqiColor(r.rCat) }} /></span></div></td>
                <td><Pill cat={r.rCat} /></td>
                <td>{fix(r.rPm25, 1)}</td>
                <td style={{ color: r.delta == null ? undefined : r.delta > 0 ? 'var(--aqi-sensitive)' : 'var(--aqi-good)' }}>{r.delta == null ? '—' : `${r.delta > 0 ? '↑' : '↓'} ${Math.abs(r.delta)}`}</td>
              </tr>))}</tbody>
          </table></div>
          <div className="footnote" style={{ marginTop: 10 }}><span>{rows.length} locations</span><span>↓ Lower AQI = improving · ↑ Higher AQI = worsening</span></div>
        </div>

        <div className="card">
          <div className="card-h"><div><h2>Compare locations</h2><p className="muted">{view === 'current' ? 'Current concentration' : '24-hour average'} by monitoring station</p></div>
            <select value={param} onChange={(e) => setParam(e.target.value)}>{Object.entries(PARAMS).map(([k, v]) => <option key={k} value={k}>{v[0]} ({v[1]})</option>)}</select></div>
          <div className="hb">{bars.map((r) => (
            <div className="hb-r" key={r.id}><span>{r.location}</span>
              <div className="hb-t"><i style={{ width: `${(r.val(param) / maxV) * 85}%`, background: isPm ? aqiColor(r.rCat) : 'var(--brand)' }} /><b style={{ left: `${(r.val(param) / maxV) * 85}%`, color: isPm ? aqiColor(r.rCat) : 'var(--brand-ink)' }}>{fix(r.val(param), pd)}</b></div></div>))}</div>
          <div className="muted" style={{ textAlign: 'right', fontSize: 11, marginTop: 10 }}>{pu}</div>
        </div>
      </div>

      {best && worst && (
        <div className="banner">
          <span><b>The cleanest air is in {best.location}.</b>{best.location} has the lowest AQI at {best.rAqi}. {worst.id === best.id ? '' : `${worst.location} is ${worst.rAqi - best.rAqi} points higher${critical ? ' and has an active critical alert' : ''}.`}</span>
          <Link href="/map" className="btn">View on map →</Link>
        </div>
      )}
      <div className="footnote"><span>AQI uses the highest pollutant sub-index. PM2.5 values shown in µg/m³.</span><span>Offline stations are excluded from the summary cards.</span></div>
    </>
  );
}
