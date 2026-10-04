import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    color: '#00c2ff',
    badge: 'Standard',
  },
  {
    id: 'light',
    name: 'Light',
    type: 'light',
    color: '#0284c7',
    badge: 'Standard',
  },
  {
    id: 'desktop-dark',
    name: 'Desktop Dark',
    type: 'dark',
    color: '#6366f1',
    badge: 'Enterprise',
  },
  {
    id: 'desktop-light',
    name: 'Desktop Light',
    type: 'light',
    color: '#4f46e5',
    badge: 'Enterprise',
  },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('theme') || localStorage.getItem('nexus_theme');
      if (['dark', 'light', 'desktop-dark', 'desktop-light'].includes(saved)) {
        return saved;
      }
      return 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('nexus_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme in localStorage', e);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    const activeThemeObj = THEMES.find((t) => t.id === theme);
    if (activeThemeObj?.type === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
