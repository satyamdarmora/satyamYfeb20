'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export type ThemeName = 'dark' | 'state-color-check';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('wiom_theme') as ThemeName) || 'dark';
    }
    return 'dark';
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wiom_theme', newTheme);
    }
    // Also push to server so other devices pick it up
    fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {});
  }, []);

  // Apply data-theme attribute on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'state-color-check') {
      root.setAttribute('data-theme', 'state-color-check');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  // Poll server for theme changes (cross-device sync)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/theme');
        const data = await res.json();
        if (data.theme && data.theme !== theme) {
          setThemeState(data.theme as ThemeName);
          localStorage.setItem('wiom_theme', data.theme);
        }
      } catch {
        // API not available, skip
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [theme]);

  // Also listen for localStorage changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'wiom_theme' && e.newValue) {
        setThemeState(e.newValue as ThemeName);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
