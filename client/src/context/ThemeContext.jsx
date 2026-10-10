import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  {
    id: 'sapphire',
    name: 'Navy & Teal',
    type: 'light',
    color: '#2F4156',
    badge: 'Default',
  },
  {
    id: 'coral',
    name: 'Warm Coral',
    type: 'light',
    color: '#f97316',
    badge: 'Warm',
  },
  {
    id: 'violet',
    name: 'Soft Violet',
    type: 'light',
    color: '#7c3aed',
    badge: 'Purple',
  },
  {
    id: 'softblue',
    name: 'Sky Blue',
    type: 'light',
    color: '#0ea5e9',
    badge: 'Sky',
  },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('theme') || localStorage.getItem('nexus_theme');
      if (['sapphire', 'coral', 'violet', 'softblue'].includes(saved)) {
        return saved;
      }
      return 'sapphire';
    } catch (e) {
      return 'sapphire';
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
    root.classList.remove('dark');
    root.classList.add('light');
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

