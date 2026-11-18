'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STATIONS, REFRESH_MS } from '@/lib/config';
import { fetchLatest, fetchHistory } from '@/lib/data';
import { enrich, buildAlerts } from '@/lib/analysis';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

export default function DataProvider({ children }) {
  const [source, setSource] = useState('mock');
  const [rows, setRows] = useState(null);
  const [hist, setHist] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [scenario, setScenario] = useState('normal');
  const [theme, setTheme] = useState('light');
  const [acked, setAcked] = useState({}); // { alertId: timestamp }

  // tema + alert yang sudah di-acknowledge (disimpan di browser)
  useEffect(() => {
    try {
      const t = localStorage.getItem('toba-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(t);
      setAcked(JSON.parse(localStorage.getItem('toba-acked') || '{}'));
    } catch {}
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggleTheme = () => setTheme((t) => { const n = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('toba-theme', n); } catch {} return n; });
  const acknowledge = (id) => setAcked((a) => { const n = { ...a, [id]: Date.now() }; try { localStorage.setItem('toba-acked', JSON.stringify(n)); } catch {} return n; });

  const load = useCallback(async (sc) => {
    const { source: src, rows: r } = await fetchLatest(sc);
    const hs = await Promise.all(STATIONS.map((s) => fetchHistory(s.id, 24, src, sc)));
    setHist(Object.fromEntries(STATIONS.map((s, i) => [s.id, hs[i]])));
    setRows(r); setSource(src); setUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    load(scenario);
    const t = setInterval(() => load(scenario), REFRESH_MS);
    return () => clearInterval(t);
  }, [scenario, load]);

  const stations = useMemo(
    () => (rows ? STATIONS.map((cfg) => enrich(cfg, rows.find((r) => r.id === cfg.id), hist[cfg.id] || [])) : []),
    [rows, hist, updatedAt] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const alerts = useMemo(() => buildAlerts(stations), [stations]);

  const value = { ready: !!rows, source, stations, hist, alerts, updatedAt, scenario, setScenario, theme, toggleTheme, acked, acknowledge, refresh: () => load(scenario) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
