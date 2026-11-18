// US AQI (EPA, breakpoint 2024). Ambang dapat diganti jika dosen meminta ISPU Indonesia.
// [Clo, Chi, Ilo, Ihi]
const PM25 = [[0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 500, 301, 500]];
const PM10 = [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500]];

function sub(c, bands, digits) {
  if (c == null || Number.isNaN(c) || c < 0) return null;
  const k = Math.pow(10, digits);
  const v = Math.floor(c * k) / k; // pemotongan sesuai aturan EPA
  for (const [clo, chi, ilo, ihi] of bands) {
    if (v <= chi) return Math.round(((ihi - ilo) / (chi - clo)) * (Math.max(v, clo) - clo) + ilo);
  }
  return 500;
}

export function aqiFrom(pm25, pm10) {
  const a = [sub(pm25, PM25, 1), sub(pm10, PM10, 0)].filter((x) => x != null);
  return a.length ? Math.max(...a) : null;
}

export const CATEGORIES = [
  { max: 50,       key: 'good',          label: 'Good',           desc: 'Good air quality',           range: '0–50' },
  { max: 100,      key: 'moderate',      label: 'Moderate',       desc: 'Moderate air quality',       range: '51–100' },
  { max: 150,      key: 'sensitive',     label: 'Sensitive',      desc: 'Sensitive air quality',      range: '101–150' },
  { max: 200,      key: 'unhealthy',     label: 'Unhealthy',      desc: 'Unhealthy air quality',      range: '151–200' },
  { max: 300,      key: 'veryunhealthy', label: 'Very unhealthy', desc: 'Very unhealthy air quality', range: '201–300' },
  { max: Infinity, key: 'hazardous',     label: 'Hazardous',      desc: 'Hazardous air quality',      range: '301+' },
];

export function categoryOf(aqi) {
  if (aqi == null) return { key: 'nodata', label: 'No data', desc: 'No data', range: '' };
  return CATEGORIES.find((c) => aqi <= c.max);
}
