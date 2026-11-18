// ===== Konfigurasi aplikasi =====
// Semua yang perlu disesuaikan dengan kelompok Data Platform ada di file ini.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
export const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1';
export const REFRESH_MS = 30000;      // auto-refresh
export const OFFLINE_AFTER_MIN = 5;   // data lebih tua dari ini => node dianggap offline

// Endpoint REST API (relatif terhadap API_BASE). SESUAIKAN dengan dokumen API Data Platform.
export const ENDPOINTS = {
  latest: () => '/stations/latest',                                   // -> [payload, ...] data terbaru tiap station
  history: (id, hours) => `/stations/${id}/history?hours=${hours}`,   // -> [payload, ...]
};

// Daftar station. lat/lon = koordinat PERKIRAAN pusat kecamatan.
// Ganti dengan titik pemasangan node yang sebenarnya (Google Maps: klik kanan lokasi -> salin koordinat).
export const STATIONS = [
  { id: 'TOBA-01', location: 'Sigumpar',          lat: 2.4100, lon: 99.2000 },
  { id: 'TOBA-02', location: 'Balige',            lat: 2.3333, lon: 99.0667 },
  { id: 'TOBA-03', location: 'Porsea',            lat: 2.4700, lon: 99.2600 },
  { id: 'TOBA-04', location: 'Tampahan',          lat: 2.3000, lon: 99.0000 },
  { id: 'TOBA-05', location: 'Laguboti',          lat: 2.3730, lon: 99.1300 },
  { id: 'TOBA-06', location: 'Siantar Narumonda', lat: 2.5000, lon: 99.3300 },
  { id: 'TOBA-07', location: 'Silaen',            lat: 2.2700, lon: 99.1700 },
];