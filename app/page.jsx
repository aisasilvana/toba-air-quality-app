'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/components/DataProvider';
import { PageHead, Pill, aqiColor } from '@/components/ui';
import { Sparkline, LineChart } from '@/components/Charts';
import { Legend } from '@/components/ui';
import { averageSeries } from '@/lib/analysis';
import { dateFull, ago, clock } from '@/lib/format';
import { fix } from '@/lib/format';

export default function Overview() {
  const { stations, hist, alerts, acked } = useData();
  const [loc, setLoc] = useState('all');
  const list = loc === 'all' ? stations : stations.filter((s) => s.id === loc);
  const live = list.filter((s) => !s.offline);
  const n = (f) => live.filter(f).length;
  const active = alerts.filter((a) => !acked[a.id] && (loc === 'all' || a.stationId === loc));
  const avg = averageSeries(list.map((s) => hist[s.id] || []), 'pm25');
  const top = active.slice(0, 3);

  return (
    <>
      <PageHead title="Air quality at a glance" sub="A live pulse of the air around Lake Toba. Every location, in one place.">
        <span className="chip-static">{dateFull(Date.now())}</span>
        <select value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location">
          <option value="all">All locations</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.location}</option>)}
        </select>
      </PageHead>

      <section className="strip">
        <div><i className="d" style={{ background: 'var(--aqi-good)' }} /><span className="n">{n((s) => s.aqi <= 50)}</span><span>Good<small>AQI 0–50</small></span></div>
        <div><i className="d" style={{ background: 'var(--aqi-moderate)' }} /><span className="n">{n((s) => s.aqi > 50 && s.aqi <= 100)}</span><span>Moderate<small>AQI 51–100</small></span></div>
        <div><i className="d" style={{ background: 'var(--aqi-sensitive)' }} /><span className="n">{n((s) => s.aqi > 100)}</span><span>Elevated<small>AQI above 100</small></span></div>
        <div><i className="d" style={{ background: 'var(--aqi-unhealthy)' }} /><span className="n">{active.length}</span><span>Active alerts<small>{active.filter((a) => a.level === 'critical').length} critical · {active.filter((a) => a.level === 'warning').length} warning{active.filter((a) => a.level === 'warning').length === 1 ? '' : 's'}</small></span></div>
      </section>

      <section className="grid4">
        {list.map((s) => (
          <article key={s.id} className={'card sc' + (s.offline ? ' stale' : '')}>
            <div className="sc-head"><h3>{s.location}</h3><Pill cat={s.cat} /></div>
            <div className="sc-main">
              <span className="aqi" style={{ color: aqiColor(s.cat) }}>{s.aqi ?? '—'}</span><small>AQI</small>
              <Sparkline values={s.spark} color={aqiColor(s.cat)} />
            </div>
            <div className="sc-metrics">
              <span>PM2.5<b>{fix(s.pm25, 1)}</b></span><span>PM10<b>{fix(s.pm10, 0)}</b></span><span>Humidity<b>{fix(s.humidity, 0)}%</b></span>
            </div>
            <div className="sc-foot">
              <span>{fix(s.temperature, 1)}°</span>·
              {s.offline
                ? <span style={{ color: 'var(--aqi-moderate)', fontWeight: 600 }}>{s.ts ? ago(s.ts) : 'No data'}</span>
                : s.delta != null && <span style={{ color: s.delta > 0 ? aqiColor(s.cat) : 'var(--aqi-good)' }}>{s.delta === 0 ? '→ no change' : `${s.delta > 0 ? '↑' : '↓'} ${Math.abs(s.delta)} points`}</span>}
            </div>
          </article>
        ))}
      </section>
      <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 14px' }}>PM2.5 / PM10 in µg/m³ · Temperature in °C · Sensitive = unhealthy for sensitive groups · Arrow = change vs. 24 h ago</p>

      <section className="split" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card-h"><div><h2>The region, over time</h2><p className="muted">Average PM2.5 · Last 24 hours</p></div><Legend items={[{ name: 'Network average', color: 'var(--brand)' }]} /></div>
          <LineChart series={[{ name: 'Network average', color: 'var(--brand)', points: avg }]} height={210} unit="µg/m³" />
        </div>
        <div className="card">
          <div className="card-h"><h2>Needs your attention</h2><Link href="/devices" className="link">View all alerts →</Link></div>
          {top.length === 0 ? <p className="muted">● All stations are normal.</p> : (
            <div className="attn">
              {top.map((a) => (
                <div className="attn-item" key={a.id}>
                  <i className="d" style={{ background: a.level === 'critical' ? 'var(--aqi-unhealthy)' : 'var(--aqi-moderate)' }} />
                  <div><b>{a.title} · {a.detail}</b><small>{a.level === 'critical' ? 'Critical' : 'Warning'} · {ago(a.ts)}</small></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="footnote"><span>Lake Toba, North Sumatra / {stations.length} monitoring stations</span><span>Updates every 30 seconds</span></div>
    </>
  );
}
