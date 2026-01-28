'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'black' | 'blue';

const THEME_KEY = 'pilot-theme';
const THEME_CLASS = {
  default: 'theme-default',
  black: 'theme-black',
  blue: 'theme-blue',
} as const;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'black' || stored === 'blue' || stored === 'default') return stored;
  return 'default';
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove(THEME_CLASS.default, THEME_CLASS.black, THEME_CLASS.blue);
  html.classList.add(THEME_CLASS[theme]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    const next = getStoredTheme();
    setThemeState(next);
    applyTheme(next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem(THEME_KEY, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
