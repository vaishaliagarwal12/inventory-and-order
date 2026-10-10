import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeSelector = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTheme = themes.find((t) => t.id === theme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select application theme"
        aria-expanded={isOpen}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
      >
        <Palette className="w-4 h-4 shrink-0 text-blue-600" style={{ color: activeTheme.color }} />
        <span className="hidden sm:inline">{activeTheme.name}</span>
        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: activeTheme.color }}></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-2 divide-y divide-slate-100 animate-scaleIn">
          <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              Theme Palette
            </span>
          </div>

          <div className="py-1">
            {themes.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-4 text-center">
                      {isSelected ? (
                        <Check className="w-4 h-4" style={{ color: t.color }} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full inline-block bg-slate-300"></span>
                      )}
                    </span>
                    <span className="leading-tight">{t.name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

