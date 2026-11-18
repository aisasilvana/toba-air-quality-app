export const METRICS = {
  aqi:         { label: 'AQI',               unit: '',      dec: 0, threshold: { value: 100,  label: 'Sensitive threshold' } },
  pm25:        { label: 'PM2.5',             unit: 'µg/m³', dec: 1, threshold: { value: 35.4, label: 'Sensitive threshold' } },
  pm10:        { label: 'PM10',              unit: 'µg/m³', dec: 0, threshold: { value: 154,  label: 'Sensitive threshold' } },
  temperature: { label: 'Temperature',       unit: '°C',    dec: 1, threshold: null },
  humidity:    { label: 'Humidity',          unit: '%',     dec: 0, threshold: null },
};
// warna seri (urut tetap, mengikuti station)
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#e34948', '#008300'];
