import { OFFLINE_AFTER_MIN } from './config';
import { categoryOf } from './aqi';

function sample(arr, n) {
  if (arr.length <= n) return arr;
  return Array.from({ length: n }, (_, i) => arr[Math.round((i * (arr.length - 1)) / (n - 1))]);
}

// Gabungkan konfigurasi station + data terbaru + riwayat 24 jam
export function enrich(cfg, row, hist = []) {
  const now = Date.now();
  const ts = row?.ts || 0;
  const ageMin = ts ? (now - ts) / 60000 : Infinity;
  const offline = !row || !ts || ageMin > OFFLINE_AFTER_MIN || row.status === 'offline';
  const issues = [];
  if (row) {
    if (row.pm25 < 0 || row.pm25 > 1000 || row.pm10 < 0 || row.pm10 > 1500 || row.humidity < 0 || row.humidity > 100 || row.temperature < -10 || row.temperature > 60) issues.push('Sensor value outside plausible range');
    if (row.pm25 != null && row.pm10 != null && row.pm25 > row.pm10 * 1.05) issues.push('PM2.5 reads higher than PM10');
  }
  const aqi = row ? row.aqi : null;
  const first = hist.find((p) => p.aqi != null);
  return {
    ...cfg, ...(row || {}), id: cfg.id, location: cfg.location === 'Lokasi 08 (TBD)' && row?.location ? row.location : cfg.location,
    aqi, cat: categoryOf(aqi), offline, ageMin, issues, abnormal: issues.length > 0,
    delta: aqi != null && first ? aqi - first.aqi : null,
    spark: sample(hist.map((p) => p.aqi).filter((v) => v != null), 16),
  };
}

// Alert diturunkan dari kondisi data (bukan disimpan di server)
export function buildAlerts(stations) {
  const out = [];
  for (const s of stations) {
    const base = { stationId: s.id, location: s.location, ts: s.ts || Date.now() };
    if (s.offline) {
      out.push({ ...base, id: `${s.id}:offline`, level: 'warning', title: s.location,
        detail: `Device ${s.id} stopped reporting`, value: s.ts ? `${Math.round(s.ageMin)} min offline` : 'No data yet' });
      continue;
    }
    if (s.status === 'error') out.push({ ...base, id: `${s.id}:error`, level: 'critical', title: s.location, detail: `Device ${s.id} reports an error`, value: 'Device error' });
    else if (s.status === 'warning') out.push({ ...base, id: `${s.id}:warn`, level: 'warning', title: s.location, detail: `Device ${s.id} reports a warning`, value: 'Check device' });
    if (s.abnormal) out.push({ ...base, id: `${s.id}:abnormal`, level: 'warning', title: s.location, detail: s.issues.join('; '), value: 'Check sensor' });
    if (s.aqi > 150) out.push({ ...base, id: `${s.id}:aqi-crit`, level: 'critical', title: s.location, detail: `AQI exceeded 150 · PM2.5 ${s.pm25.toFixed(1)} µg/m³`, value: `${s.aqi} AQI` });
    else if (s.aqi > 100) out.push({ ...base, id: `${s.id}:aqi-warn`, level: 'warning', title: s.location, detail: 'AQI exceeded the 100 threshold', value: `${s.aqi} AQI` });
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'critical' ? -1 : 1));
}

// Rata-rata beberapa deret per "bucket" waktu
export function averageSeries(histories, key, bucketMs = 30 * 60e3) {
  const m = new Map();
  for (const h of histories) for (const p of h) {
    if (p[key] == null) continue;
    const b = Math.round(p.ts / bucketMs) * bucketMs;
    const e = m.get(b) || { s: 0, n: 0 };
    e.s += p[key]; e.n++; m.set(b, e);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, e]) => ({ t, v: e.s / e.n }));
}
