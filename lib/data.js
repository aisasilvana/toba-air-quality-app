// Lapisan data: REST API Data Platform + fallback data dummy.
// Bentuk payload mengikuti Data Contract di modul proyek (bagian 7.2):
// { station_id, location, timestamp, data:{pm25,pm10,temperature,humidity}, status }
// Field opsional (jika node/platform menyediakan): battery (%), rssi (dBm).
import { API_BASE, FORCE_MOCK, ENDPOINTS, STATIONS } from './config';
import { aqiFrom } from './aqi';

const num = (v) => { if (v == null || v === '') return null; const n = Number(v); return Number.isNaN(n) ? null : n; };

export function normalize(p) {
  const d = p.data || {};
  const pm25 = num(d.pm25), pm10 = num(d.pm10);
  return {
    id: p.station_id,
    location: p.location,
    ts: Date.parse(p.timestamp),
    pm25, pm10,
    temperature: num(d.temperature),
    humidity: num(d.humidity),
    status: p.status || 'online',
    battery: num(p.battery ?? p.device?.battery),
    rssi: num(p.rssi ?? p.device?.rssi),
    aqi: aqiFrom(pm25, pm10),
  };
}

async function apiGet(path) {
  const r = await fetch(API_BASE + path, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : j.data || j.items || j.results || [];
}

/* ---------------- DUMMY (deterministik) ---------------- */
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const BASE = [5, 4, 18, 5, 6, 40, 22, 4];
const BATT = [92, 86, 78, 81, 68, 24, 94, 85];
const RSSI = [-55, -60, -70, -58, -68, -82, -52, -95];
const idx = (id) => STATIONS.findIndex((s) => s.id === id);

export const SCENARIOS = {
  normal: 'Normal',
  offline: 'Node offline (TOBA-05 Laguboti)',
  spike: 'PM tinggi (TOBA-03 Porsea)',
  abnormal: 'Data abnormal (TOBA-06 Siantar Narumonda)',
};

function mockPoint(id, t, now, sc) {
  const i = idx(id);
  const dt = new Date(t + 7 * 3.6e6);
  const h = dt.getUTCHours() + dt.getUTCMinutes() / 60;
  const rush = Math.exp(-((h - 7.5) ** 2) / 4) + Math.exp(-((h - 19.5) ** 2) / 5);
  let pm25 = BASE[i] + 9 * rush + 3 * Math.sin(t / 3.6e6 + i) + 2.5 * hash(t / 6e5 + i * 7);
  let pm10 = pm25 * 1.45 + 3 * hash(t / 6e5 + i * 13);
  let temp = 23 + 5.5 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + i * 0.25 + 0.4 * hash(t / 6e5 + i);
  let hum = 76 - 16 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + 2 * hash(t / 6e5 + i * 3);
  let status = 'online';
  if (sc === 'spike' && id === 'TOBA-03') { const k = Math.max(0, Math.min(1, (t - (now - 3 * 3.6e6)) / (2 * 3.6e6))); pm25 += 95 * k; pm10 += 150 * k; }
  if (sc === 'abnormal' && id === 'TOBA-06' && t > now - 2 * 3.6e6) { pm10 = pm25 * 0.45; hum = 128; status = 'warning'; }
  pm25 = Math.max(1, pm25); pm10 = Math.max(2, pm10);
  return { id, location: STATIONS[i].location, ts: t, pm25, pm10, temperature: temp, humidity: Math.min(hum, 150), status,
    battery: BATT[i] - Math.floor((now - t) / 3.6e6 / 24), rssi: RSSI[i], aqi: aqiFrom(pm25, pm10) };
}
const offlineAt = (id, now, sc) => (sc === 'offline' && id === 'TOBA-05' ? now - 40 * 60e3 : null);

function mockLatest(sc) {
  const now = Date.now();
  return STATIONS.map((s) => { const off = offlineAt(s.id, now, sc); const p = mockPoint(s.id, off || now, now, sc); return off ? { ...p, status: 'offline' } : p; });
}
function mockHistory(id, hours, sc) {
  const now = Date.now();
  const step = (hours <= 48 ? 30 : hours <= 336 ? 180 : 720) * 60e3;
  const end = offlineAt(id, now, sc) || now;
  const out = [];
  for (let t = Math.floor((now - hours * 3.6e6) / step) * step; t <= end; t += step) out.push(mockPoint(id, t, now, sc));
  return out;
}

/* ---------------- API publik ---------------- */
export async function fetchLatest(scenario = 'normal') {
  if (API_BASE && !FORCE_MOCK) {
    try {
      const rows = (await apiGet(ENDPOINTS.latest())).map(normalize);
      return { source: 'api', rows };
    } catch (e) { console.warn('[Toba] API tidak dapat dijangkau, memakai data dummy:', e); }
  }
  return { source: 'mock', rows: mockLatest(scenario) };
}

export async function fetchHistory(id, hours, source, scenario = 'normal') {
  if (source === 'api') {
    try { return (await apiGet(ENDPOINTS.history(id, hours))).map(normalize).filter((p) => p.ts).sort((a, b) => a.ts - b.ts); }
    catch (e) { console.warn('[Toba] riwayat gagal:', id, e); return []; }
  }
  return mockHistory(id, hours, scenario);
}
