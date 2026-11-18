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

// Daftar station. x,y = posisi pada peta skematis (viewBox 1000x640), bukan koordinat GPS.
export const STATIONS = [
  { id: 'TOBA-01', location: 'Sigumpar',          x: 665, y: 555 },
  { id: 'TOBA-02', location: 'Balige',            x: 430, y: 550 },
  { id: 'TOBA-03', location: 'Porsea',            x: 735, y: 440 },
  { id: 'TOBA-04', location: 'Tampahan',          x: 300, y: 500 },
  { id: 'TOBA-05', location: 'Laguboti',          x: 555, y: 535 },
  { id: 'TOBA-06', location: 'Siantar Narumonda', x: 790, y: 330 },
  { id: 'TOBA-07', location: 'Silaen',            x: 800, y: 540 },
  { id: 'TOBA-08', location: 'Lokasi 08 (TBD)',   x: 215, y: 270 },
];
