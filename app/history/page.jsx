'use client';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '@/components/DataProvider';
import { PageHead, Legend } from '@/components/ui';
import { LineChart, Sparkline } from '@/components/Charts';
import { STATIONS } from '@/lib/config';
import { METRICS, SERIES_COLORS } from '@/lib/metrics';
import { fetchHistory } from '@/lib/data';
import { averageSeries } from '@/lib/analysis';
import { dayClock, dayMonth, clock, fix } from '@/lib/format';

const RANGES = [[24, '24h'], [168, '7d'], [720, '30d']];

export default function History() {
  const { source, scenario, updatedAt } = useData();
  const [sel, setSel] = useState(STATIONS.slice(0, 4).map((s) => s.id));
  const [param, setParam] = useState('pm25');
  const [hours, setHours] = useState(24);
  const [data, setData] = useState({}); // id -> titik (2x rentang, untuk membandingkan dengan periode sebelumnya)

  useEffect(() => {
    let alive = true;
    Promise.all(sel.map((id) => fetchHistory(id, hours * 2, source, scenario))).then((r) => {
      if (alive) setData(Object.fromEntries(sel.map((id, i) => [id, r[i]])));
    });
    return () => { alive = false; };
  }, [sel, hours, source, scenario, updatedAt]);

  const now = Date.now(), cut = now - hours * 3.6e6;
  const M = METRICS[param];
  const colorOf = (id) => SERIES_COLORS[STATIONS.findIndex((s) => s.id === id) % 8];
  const cur = useMemo(() => Object.fromEntries(sel.map((id) => [id, (data[id] || []).filter((p) => p.ts >= cut)])), [data, sel, cut]); // eslint-disable-line
  const prev = useMemo(() => sel.flatMap((id) => (data[id] || []).filter((p) => p.ts < cut)), [data, sel, cut]); // eslint-disable-line

  const series = sel.map((id) => ({ name: STATIONS.find((s) => s.id === id).location, color: colorOf(id),
    points: (cur[id] || []).filter((p) => p[param] != null).map((p) => ({ t: p.ts, v: p[param] })) }));
  const flat = sel.flatMap((id) => (cur[id] || []).filter((p) => p[param] != null).map((p) => ({ ...p, loc: STATIONS.find((s) => s.id === id).location })));
  const lastVals = sel.map((id) => { const a = (cur[id] || []).filter((p) => p[param] != null); return a.length ? a[a.length - 1][param] : null; }).filter((v) => v != null);
  const avgNow = lastVals.length ? lastVals.reduce((a, b) => a + b, 0) / lastVals.length : null;
  const peak = flat.reduce((b, p) => (!b || p[param] > b[param] ? p : b), null);
  const low = flat.reduce((b, p) => (!b || p[param] < b[param] ? p : b), null);
  const mean = (a) => (a.length ? a.reduce((s, p) => s + p[param], 0) / a.length : null);
  const pa = mean(flat), pb = mean(prev.filter((p) => p[param] != null));
  const change = pa != null && pb ? ((pa - pb) / pb) * 100 : null;
  const isPol = param === 'pm25' || param === 'pm10' || param === 'aqi';

  const histories = sel.map((id) => cur[id] || []);
  const mini = (k) => averageSeries(histories, k, hours <= 24 ? 1800e3 : 6 * 3.6e6);
  const lastOf = (k) => { const a = mini(k); return a.length ? a[a.length - 1].v : null; };
  const toggle = (id) => setSel((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]));
  const rangeLabel = `${dayClock(cut)} — ${dayClock(now)} WIB`;

  function exportCsv() {
    const head = 'station_id,location,timestamp,pm25,pm10,temperature,humidity,aqi';
    const lines = sel.flatMap((id) => (cur[id] || []).map((p) => [id, STATIONS.find((s) => s.id === id).location, new Date(p.ts).toISOString(), p.pm25, p.pm10, p.temperature, p.humidity, p.aqi].join(',')));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join('\n')], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `toba-air-quality-${hours}h.csv` });
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHead title="Understand the patterns" sub="Go beyond the moment. Track changes across locations and pollutants.">
        <button className="btn primary" onClick={exportCsv}>↓ Export data</button>
      </PageHead>

      <div className="card ctrl">
        <label>Locations
          <details className="dd"><summary>{sel.length} locations selected ⌄</summary>
            <div className="menu">{STATIONS.map((s) => <label key={s.id}><input type="checkbox" checked={sel.includes(s.id)} onChange={() => toggle(s.id)} /><i className="d" style={{ width: 8, height: 8, borderRadius: '50%', background: colorOf(s.id) }} />{s.location}</label>)}</div>
          </details>
        </label>
        <label>Parameter
          <select value={param} onChange={(e) => setParam(e.target.value)}>{Object.entries(METRICS).map(([k, m]) => <option key={k} value={k}>{m.label}{m.unit ? ` (${m.unit})` : ''}</option>)}</select>
        </label>
        <label>Time range
          <span style={{ display: 'flex', gap: 8 }}>{RANGES.map(([h, l]) => <button key={h} className={'btn ' + (hours === h ? 'on' : '')} onClick={() => setHours(h)}>{l}</button>)}</span>
        </label>
        <span className="range">{rangeLabel}</span>
      </div>

      <div className="grid4" style={{ margin: '14px 0' }}>
        <div className="card stat"><div className="l">Current average</div><div className="v">{fix(avgNow, M.dec)} <small>{M.unit}</small></div><div className="s">Across {sel.length} selected locations</div></div>
        <div className="card stat"><div className="l">{hours === 24 ? '24-hour' : 'Period'} peak</div><div className="v">{peak ? fix(peak[param], M.dec) : '—'} <small>{M.unit}</small></div><div className="s">{peak ? `${peak.loc} · ${hours > 36 ? dayMonth(peak.ts) : clock(peak.ts)} WIB` : ''}</div></div>
        <div className="card stat"><div className="l">{hours === 24 ? '24-hour' : 'Period'} low</div><div className="v">{low ? fix(low[param], M.dec) : '—'} <small>{M.unit}</small></div><div className="s">{low ? `${low.loc} · ${hours > 36 ? dayMonth(low.ts) : clock(low.ts)} WIB` : ''}</div></div>
        <div className="card stat"><div className="l">Change vs. previous period</div>
          <div className="v" style={{ color: change == null || !isPol ? undefined : change <= 0 ? 'var(--aqi-good)' : 'var(--aqi-unhealthy)' }}>{change == null ? '—' : `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}`} <small>%</small></div>
          <div className="s">{change == null ? 'Not enough data' : !isPol ? 'Average value' : change <= 0 ? '↓ Air quality is improving' : '↑ Air quality is worsening'}</div></div>
      </div>

      <div className="card">
        <div className="card-h"><div><h2>{M.label} {param === 'aqi' ? 'index' : 'concentration'}</h2><p className="muted">{M.unit || 'US AQI'} · {hours <= 24 ? '30-minute' : hours <= 168 ? '3-hour' : '12-hour'} intervals</p></div>
          <Legend items={series.map((s) => ({ name: s.name, color: s.color }))} /></div>
        <LineChart series={series} height={300} decimals={M.dec} unit={M.unit} threshold={M.threshold} hours={hours} zeroBase={param !== 'temperature' && param !== 'humidity'} />
      </div>

      <div className="grid3" style={{ marginTop: 14 }}>
        {[['pm10', 'PM10', 'µg/m³', 0], ['aqi', 'AQI', 'US AQI', 0]].map(([k, l, u, d]) => (
          <div className="card spark-card" key={k}>
            <h3>{l}</h3><p className="muted" style={{ margin: '2px 0 8px', fontSize: 12 }}>Selected-location average</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span className="big">{fix(lastOf(k), d)} <small>{u}</small></span><Sparkline values={mini(k).map((p) => p.v)} color="var(--brand)" w={170} h={44} /></div>
            <div className="foot"><span>{hours === 24 ? 'Last 24 hours' : `Last ${hours / 24} days`}</span><button className="link" onClick={() => setParam(k)}>View parameter →</button></div>
          </div>
        ))}
        <div className="card spark-card">
          <h3>Temperature &amp; humidity</h3><p className="muted" style={{ margin: '2px 0 8px', fontSize: 12 }}>Selected-location average</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span className="big">{fix(lastOf('temperature'), 1)}° <small>{fix(lastOf('humidity'), 0)}% RH</small></span><Sparkline values={mini('temperature').map((p) => p.v)} color="var(--aqi-sensitive)" w={170} h={44} /></div>
          <div className="foot"><span>{hours === 24 ? 'Last 24 hours' : `Last ${hours / 24} days`}</span><button className="link" onClick={() => setParam('temperature')}>View parameter →</button></div>
        </div>
      </div>
      <div className="footnote"><span>All timestamps use Western Indonesia Time (WIB, UTC+7).</span><span>{source === 'mock' ? 'Demo data' : 'Live data'}</span></div>
    </>
  );
}
