'use client';

import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type Theme = 'light' | 'dark';
const KEY = 'theme';

/** Applies the stored theme before first paint; inlined by the root layout so there is no flash of the wrong theme. */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`;

/** Light by default; the choice is kept per browser in localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    setTheme(next);
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={apply} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
