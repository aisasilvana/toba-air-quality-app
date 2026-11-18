'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { STATIONS } from '@/lib/config';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Peta sungguhan (Leaflet + OpenStreetMap). Leaflet hanya bisa jalan di browser,
// makanya library-nya di-import di dalam useEffect.
export default function LeafletMap({ stations, selected, onSelect, theme }) {
  const el = useRef(null);      // div tempat peta digambar
  const map = useRef(null);     // objek peta Leaflet
  const layer = useRef(null);   // wadah marker
  const LRef = useRef(null);    // library Leaflet
  const [ready, setReady] = useState(false);

  // 1) Buat peta sekali saja + gambar peta dasar OpenStreetMap (gratis, tanpa API key)
  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (dead || map.current || !el.current) return;
      LRef.current = L;
      const m = L.map(el.current, { scrollWheelZoom: false });
      m.fitBounds(STATIONS.map((s) => [s.lat, s.lon]), { padding: [60, 60] }); // pas menampilkan semua station
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    })();
    return () => {
      dead = true;
      if (map.current) { map.current.remove(); map.current = null; }
      setReady(false);
    };
  }, []);

  // 2) Gambar marker station (diulang tiap data berubah)
  useEffect(() => {
    if (!ready) return;
    const L = LRef.current;
    layer.current.clearLayers();
    stations.forEach((s) => {
      const icon = L.divIcon({
        className: 'aqi-pin', iconSize: [44, 44], iconAnchor: [22, 22],
        html: `<div class="aqi-bubble${s.id === selected ? ' sel' : ''}${s.offline ? ' off' : ''}" style="background:var(--aqi-${s.cat.key})">${s.aqi ?? '—'}</div><div class="aqi-label">${esc(s.location)}</div>`,
      });
      L.marker([s.lat, s.lon], { icon, title: s.location, zIndexOffset: s.id === selected ? 1000 : 0 })
        .on('click', () => onSelect(s.id)).addTo(layer.current);
    });
  }, [ready, stations, selected, onSelect]);

  // 3) Geser peta ke station yang dipilih
  useEffect(() => {
    if (!ready || !selected) return;
    const s = STATIONS.find((x) => x.id === selected);
    if (s) map.current.panTo([s.lat, s.lon]);
  }, [ready, selected]);

  return <div ref={el} className={'leaflet-host' + (theme === 'dark' ? ' map-dark' : '')} />;
}