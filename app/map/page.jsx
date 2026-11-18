'use client';
import { useState } from 'react';
import { useData } from '@/components/DataProvider';
import { PageHead, Pill, aqiColor } from '@/components/ui';
import { CATEGORIES } from '@/lib/aqi';
import { fix, ago } from '@/lib/format';

const FILTERS = [['all', 'All stations', () => true], ['good', 'Good', (s) => s.aqi <= 50], ['moderate', 'Moderate', (s) => s.aqi > 50 && s.aqi <= 100], ['elevated', 'Elevated', (s) => s.aqi > 100]];

function LakeMap({ stations, selected, onSelect, zoom }) {
  return (
    <svg viewBox="0 0 1000 640" role="img" aria-label="Schematic map of Lake Toba with monitoring stations">
      <g style={{ transform: `scale(${zoom})`, transformOrigin: '430px 320px', transition: 'transform .25s' }}>
        <rect x="-300" y="-200" width="1600" height="1040" fill="var(--land)" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-100,${130 + i * 150} C200,${60 + i * 150} 500,${220 + i * 140} 1100,${100 + i * 150}`} fill="none" stroke="var(--land2)" strokeWidth="2" />)}
        <path d="M120,590 C300,600 500,590 700,550 S920,430 980,300" fill="none" stroke="var(--card)" strokeWidth="9" strokeLinecap="round" opacity=".9" />
        <path d="M230,300 C230,170 330,100 450,105 C580,110 660,190 650,310 C645,420 560,500 440,505 C320,505 230,430 230,300 Z" fill="var(--water)" stroke="var(--brand)" strokeOpacity=".25" strokeWidth="2" />
        <path d="M330,260 C340,200 420,170 470,190 C500,230 490,300 460,350 C430,390 360,370 330,330 Z" fill="var(--land)" stroke="var(--brand)" strokeOpacity=".18" strokeWidth="2" />
        <text x="372" y="285" className="axis" style={{ fill: 'var(--muted)', fontSize: 13, letterSpacing: 2 }}>SAMOSIR</text>
        <text x="500" y="330" style={{ fill: 'var(--muted)', fontSize: 15, letterSpacing: 2 }}>LAKE TOBA</text>
        <text x="515" y="350" style={{ fill: 'var(--muted)', fontSize: 10, letterSpacing: 1 }}>DANAU TOBA</text>
        {stations.map((s) => {
          const sel = s.id === selected;
          return (
            <g key={s.id} className="marker" tabIndex={0} role="button" aria-label={`${s.location}, AQI ${s.aqi ?? 'no data'}`}
               onClick={() => onSelect(s.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(s.id)}>
              <circle className="m" cx={s.x} cy={s.y} r={sel ? 22 : 19} fill={aqiColor(s.cat)} stroke="var(--card)" strokeWidth="3" opacity={s.offline ? 0.6 : 1} />
              <text x={s.x} y={s.y + 5} textAnchor="middle" style={{ fill: '#fff', fontSize: 14, fontWeight: 700 }}>{s.aqi ?? '—'}</text>
              <rect x={s.x - 6 - s.location.length * 3.6} y={s.y + 25} width={12 + s.location.length * 7.2} height="20" rx="4" fill="var(--card)" stroke="var(--line)" />
              <text x={s.x} y={s.y + 39} textAnchor="middle" style={{ fill: 'var(--ink)', fontSize: 11.5, fontWeight: 600 }}>{s.location}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function MapPage() {
  const { stations } = useData();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
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
          <LakeMap stations={shown} selected={selected} onSelect={setSelected} zoom={zoom} />
          <div className="zoom"><button onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} aria-label="Zoom in">+</button><button onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))} aria-label="Zoom out">−</button></div>
          {sel && (
            <div className="mapinfo">
              <b>{sel.location}</b> <Pill cat={sel.cat} />
              <div className="row"><span>AQI<br /><b>{sel.aqi ?? '—'}</b></span><span>PM2.5<br /><b>{fix(sel.pm25, 1)}</b></span><span>PM10<br /><b>{fix(sel.pm10, 0)}</b></span><span>Temp<br /><b>{fix(sel.temperature, 1)}°</b></span></div>
              <div style={{ marginTop: 6 }} className="muted">{sel.offline ? `Offline · last data ${sel.ts ? ago(sel.ts) : 'never'}` : `Updated ${ago(sel.ts)}`}</div>
            </div>
          )}
          <div className="muted" style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 11 }}>Schematic map · illustrative station positions</div>
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
      <div className="footnote"><span>Select a station marker to inspect its latest readings.</span><span>Positions are illustrative, not to scale</span></div>
    </>
  );
}
