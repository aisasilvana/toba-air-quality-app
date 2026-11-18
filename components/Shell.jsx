'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DataProvider, { useData } from './DataProvider';
import { clockSec } from '@/lib/format';

const NAV = [['/', 'Overview'], ['/map', 'Map'], ['/history', 'History'], ['/ranking', 'Ranking'], ['/devices', 'Devices']];

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="var(--brand)" />
      <path d="M8 12h12a3 3 0 1 0-3-3M8 17h17a3 3 0 1 1-3 3M8 22h9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Header() {
  const path = usePathname();
  const { updatedAt, source, theme, toggleTheme } = useData();
  return (
    <header className="topbar">
      <Link href="/" className="brand"><Logo /><span><b>toba</b><small>AIR QUALITY MONITOR</small></span></Link>
      <nav aria-label="Main">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'active' : ''}>{label}</Link>
        ))}
      </nav>
      <div className="top-right">
        <span className="updated">
          <i className={'dot ' + (source === 'api' ? 'live' : 'demo')} />
          {updatedAt ? `Last updated ${clockSec(updatedAt)} WIB` : 'Loading…'}
        </span>
        {source === 'mock' && <span className="chip demo-chip" title="Data bukan dari sensor">Demo data</span>}
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
      </div>
    </header>
  );
}

function Body({ children }) {
  const { ready } = useData();
  return <main className="page">{ready ? children : <p className="muted" style={{ padding: 40 }}>Loading station data…</p>}</main>;
}

export default function Shell({ children }) {
  return (
    <DataProvider>
      <Header />
      <Body>{children}</Body>
    </DataProvider>
  );
}
