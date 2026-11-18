'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/components/DataProvider';
import { PageHead, Pill, Battery, SignalBars } from '@/components/ui';
import { SCENARIOS } from '@/lib/data';
import { clockSec, clock, ago } from '@/lib/format';

export default function Devices() {
  const { stations, alerts, acked, acknowledge, source, scenario, setScenario, updatedAt } = useData();
  const [statusF, setStatusF] = useState('all');
  const [sevF, setSevF] = useState('all');
  const [tab, setTab] = useState('active');

  const online = stations.filter((s) => !s.offline);
  const offline = stations.filter((s) => s.offline);
  const batts = stations.map((s) => s.battery).filter((b) => b != null);
  const avgBatt = batts.length ? Math.round(batts.reduce((a, b) => a + b, 0) / batts.length) : null;
  const lowBatt = batts.filter((b) => b < 30).length;
  const active = alerts.filter((a) => !acked[a.id]);
  const done = alerts.filter((a) => acked[a.id]);
  const shownAlerts = (tab === 'active' ? active : done).filter((a) => sevF === 'all' || a.level === sevF);
  const rows = stations.filter((s) => statusF === 'all' || (statusF === 'offline') === s.offline);
  const crit = active.filter((a) => a.level === 'critical').length;
  const healthy = offline.length === 0 && crit === 0;

  return (
    <>
      <PageHead title={healthy ? 'A healthy network. Cleaner air.' : 'Your network needs a little attention.'} sub="Keep your stations connected and act on the signals that matter.">
        {source === 'mock' && (
          <label className="muted" style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>Demo scenario
            <select value={scenario} onChange={(e) => setScenario(e.target.value)}>{Object.entries(SCENARIOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
        )}
      </PageHead>

      <div className="grid4">
        <div className="card stat"><div className="l">Online devices</div><div className="v" style={{ color: 'var(--aqi-good)' }}>{online.length} / {stations.length}</div><div className="s">Reporting normally</div></div>
        <div className="card stat"><div className="l">Offline devices</div><div className="v" style={{ color: offline.length ? 'var(--aqi-moderate)' : undefined }}>{offline.length}</div><div className="s">{offline.length ? offline.map((s) => `${s.location} · ${s.ts ? Math.round(s.ageMin) + ' min' : 'no data'}`).join(', ') : 'None'}</div></div>
        <div className="card stat"><div className="l">Average battery</div><div className="v" style={{ color: 'var(--brand)' }}>{avgBatt == null ? '—' : `${avgBatt}%`}</div><div className="s">{avgBatt == null ? 'Not reported by nodes' : `${lowBatt} device${lowBatt === 1 ? '' : 's'} below 30%`}</div></div>
        <div className="card stat"><div className="l">Active alerts</div><div className="v" style={{ color: active.length ? 'var(--aqi-unhealthy)' : undefined }}>{active.length}</div><div className="s">{crit} critical · {active.length - crit} warning{active.length - crit === 1 ? '' : 's'}</div></div>
      </div>

      <div className="split" style={{ marginTop: 14, gridTemplateColumns: '1.6fr 1fr' }}>
        <div>
          <div className="card">
            <div className="card-h"><div><h2>Monitoring devices</h2><p className="muted">{stations.length} devices · Last sync {updatedAt ? clockSec(updatedAt) : '—'} WIB</p></div>
              <select value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="all">All statuses</option><option value="online">Online</option><option value="offline">Offline</option></select></div>
            <div className="tablewrap"><table>
              <thead><tr><th>Device ID</th><th>Location</th><th>Status</th><th>Battery</th><th>Signal</th><th>Last data</th></tr></thead>
              <tbody>{rows.map((s) => (
                <tr key={s.id} className={s.offline ? 'off' : ''}>
                  <td>{s.id}</td><td>{s.location}</td>
                  <td><span className={`pill pill-${s.offline ? 'offline' : s.status === 'warning' || s.status === 'error' ? 'moderate' : 'online'} dotted`}><i />{s.offline ? 'Offline' : s.status === 'warning' ? 'Warning' : s.status === 'error' ? 'Error' : 'Online'}</span></td>
                  <td><Battery pct={s.battery} /></td><td><SignalBars rssi={s.rssi} offline={s.offline} /></td>
                  <td>{s.ts ? clockSec(s.ts) : '—'}<div style={{ fontSize: 11, color: s.offline ? 'var(--aqi-moderate)' : 'var(--muted)' }}>{s.ts ? ago(s.ts) : 'Never'}</div></td>
                </tr>))}</tbody>
            </table></div>
            <div className="footnote" style={{ marginTop: 10 }}><span>Auto-refresh every 30 seconds</span><span>Showing {rows.length} of {stations.length} devices</span></div>
          </div>
          <div className="banner"><span><b>{offline.length ? `${offline.length === 1 ? 'One station needs' : offline.length + ' stations need'} a check-in.` : 'All stations are reporting.'}</b>{offline.length ? `${offline[0].location} is offline. Its last readings stay visible with a stale-data label.` : 'No device has missed its reporting window.'}</span>
            {offline.length > 0 && <Link href="/map" className="btn">View station →</Link>}</div>
        </div>

        <aside className="card">
          <div className="card-h"><h2>Alert center</h2>
            <select value={sevF} onChange={(e) => setSevF(e.target.value)}><option value="all">All severity</option><option value="critical">Critical</option><option value="warning">Warning</option></select></div>
          <div className="tabs">
            <button className={'btn ' + (tab === 'active' ? 'on' : '')} onClick={() => setTab('active')}>Active {active.length}</button>
            <button className={'btn ' + (tab === 'acked' ? 'on' : '')} onClick={() => setTab('acked')}>Acknowledged {done.length}</button>
          </div>
          {shownAlerts.length === 0 && <p className="muted">{tab === 'active' ? '● No active alerts.' : 'Nothing acknowledged yet.'}</p>}
          {shownAlerts.map((a) => tab === 'active' ? (
            <div key={a.id} className={'acard ' + a.level}>
              <div className="top"><span className={`pill pill-${a.level === 'critical' ? 'unhealthy' : 'moderate'}`}>{a.level === 'critical' ? 'Critical' : 'Warning'}</span><span>{clock(a.ts)} WIB · {ago(a.ts)}</span></div>
              <h3>{a.title}</h3><div className="det">{a.detail}</div>
              <div className="bot"><span className="val" style={{ color: a.level === 'critical' ? 'var(--aqi-unhealthy)' : 'var(--aqi-moderate)' }}>{a.value}</span><button className="btn" onClick={() => acknowledge(a.id)}>Acknowledge</button></div>
            </div>
          ) : (
            <div key={a.id} className="acked"><b>✓ Acknowledged · {a.title}</b>{a.detail}<br />Reviewed at {clock(acked[a.id])} WIB</div>
          ))}
        </aside>
      </div>
      <div className="footnote"><span>Devices use local time (WIB, UTC+7). Offline after 5 minutes without data.</span><span>{source === 'mock' ? 'Demo data' : 'Live data'}</span></div>
    </>
  );
}
