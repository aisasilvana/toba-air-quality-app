'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useData } from '@/components/DataProvider';
import { PageHead, Pill, aqiColor } from '@/components/ui';
import { CATEGORIES } from '@/lib/aqi';
import { fix, ago } from '@/lib/format';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false, loading: () => <div className="empty" style={{ height: 560 }}>Loading map…</div> });

const FILTERS = [['all', 'All stations', () => true], ['good', 'Good', (s) => s.aqi <= 50], ['moderate', 'Moderate', (s) => s.aqi > 50 && s.aqi <= 100], ['elevated', 'Elevated', (s) => s.aqi > 100]];

export default function MapPage() {
  const { stations, theme } = useData();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const f = FILTERS.find((x) => x[0] === filter)[2];
  const shown = stations.filter(f);
  const sel = stations.find((s) => s.id === selected);
  const count = (fn) => stations.filter((s) => !s.offline && fn(s)).length;

  return (
    <>
      <PageHead title="Air quality, on the map" sub="Explore the network and see where air quality is changing." />
      <div className="card filters" style={{ padding: '12px 18px' }}>
        <span className="lbl">SHOW</span>
        {FILTERS.map(([k, label, fn]) => (
          <button key={k} className={'btn ' + (filter === k ? 'soft' : '')} onClick={() => setFilter(k)}>{label} <span className="muted">{k === 'all' ? stations.length : count(fn)}</span></button>
        ))}
      </div>

      <div className="mapwrap">
        <div className="mapbox">
          <LeafletMap stations={shown} selected={selected} onSelect={setSelected} theme={theme} />
          {sel && (
            <div className="mapinfo">
              <b>{sel.location}</b> <Pill cat={sel.cat} />
              <div className="row"><span>AQI<br /><b>{sel.aqi ?? '—'}</b></span><span>PM2.5<br /><b>{fix(sel.pm25, 1)}</b></span><span>PM10<br /><b>{fix(sel.pm10, 0)}</b></span><span>Temp<br /><b>{fix(sel.temperature, 1)}°</b></span></div>
              <div style={{ marginTop: 6 }} className="muted">{sel.offline ? `Offline · last data ${sel.ts ? ago(sel.ts) : 'never'}` : `Updated ${ago(sel.ts)}`}</div>
            </div>
          )}
          <div className="muted" style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 11 }}>Map data © OpenStreetMap contributors © CARTO</div>
        </div>

        <aside className="card">
          <h2>Monitoring locations</h2>
          <p className="muted" style={{ margin: '2px 0 8px', fontSize: 12 }}>{shown.length} stations · Network order</p>
          <div className="loclist">
            {shown.map((s) => (
              <button key={s.id} className={'loc' + (s.id === selected ? ' sel' : '')} onClick={() => setSelected(s.id)}>
                <i className="d" style={{ background: aqiColor(s.cat) }} />
                <span>{s.location}<small>{s.offline ? `Last seen ${s.ts ? ago(s.ts) : 'never'}` : s.cat.desc}</small></span>
                <span className="v" style={{ color: aqiColor(s.cat) }}>{s.aqi ?? '—'}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="card scale" style={{ padding: '14px 20px' }}>
        <span className="muted" style={{ fontSize: 10.5, letterSpacing: '.1em', fontWeight: 600, alignItems: 'center' }}>US AQI SCALE</span>
        {CATEGORIES.slice(0, 5).map((c) => <span key={c.key}><i className="d" style={{ background: `var(--aqi-${c.key})` }} /><span>{c.label}<small>{c.range}</small></span></span>)}
      </div>
      <div className="footnote"><span>Select a station marker to inspect its latest readings.</span><span>Station positions are approximate</span></div>
    </>
  );
}