# Toba Air Quality Monitor – Aplikasi (Frontend + API Integration)

Next.js (App Router, JavaScript) – tampilan: Overview, Map, History, Ranking, Devices.

## Menjalankan
```bash
npm install
cp .env.example .env.local      # isi NEXT_PUBLIC_API_BASE bila API Data Platform sudah siap
npm run dev                     # http://localhost:3000
```
Tanpa `NEXT_PUBLIC_API_BASE` (atau jika API tidak terjangkau) aplikasi otomatis memakai **data dummy**
dan menampilkan label "Demo data" di header. Di halaman *Devices* ada pilihan skenario demo
(node offline, PM tinggi, data abnormal) untuk latihan Week 16.

## Integrasi dengan Data Platform
Semua pengaturan ada di `lib/config.js` dan `lib/data.js`:
- `ENDPOINTS.latest` → mengembalikan array payload terbaru tiap station.
- `ENDPOINTS.history(id, hours)` → mengembalikan array payload riwayat.
- Bentuk payload mengikuti Data Contract modul (bagian 7.2):
  `{ station_id, location, timestamp, data:{pm25,pm10,temperature,humidity}, status }`.
  Field opsional `battery` (%) dan `rssi` (dBm) dipakai halaman Devices bila tersedia.
- Jika bentuk respons API berbeda, ubah `normalize()` di `lib/data.js`.
- Pastikan API mengaktifkan CORS (atau pakai rewrites di `next.config.mjs`).

## Struktur
```
app/            halaman (page.jsx = Overview, map/, history/, ranking/, devices/)
components/     DataProvider (polling 30 dtk), Shell (header), Charts (SVG), ui
lib/            config (station & endpoint), data (API + dummy), aqi, analysis, format
```
Station dan posisi peta skematis diatur di `lib/config.js` (`STATIONS`). TOBA-08 masih placeholder.

## Catatan
- Perhitungan AQI memakai breakpoint US AQI (sesuai desain). Ganti `lib/aqi.js` bila dosen meminta ISPU.
- Node dianggap offline bila data > 5 menit (`OFFLINE_AFTER_MIN`).
- Peta bersifat skematis (SVG), bukan peta geografis sebenarnya.
