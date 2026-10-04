import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, Monitor } from 'lucide-react';
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
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1c1f29] hover:bg-[#262a34] text-[#dfe2ef] border border-[#262a34] text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00c2ff]/40 cursor-pointer"
      >
        <Palette className="w-3.5 h-3.5 text-[#00c2ff] shrink-0" />
        <span className="hidden sm:inline font-semibold">{activeTheme.name}</span>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeTheme.color }}></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#181b25] border border-[#262a34] shadow-2xl z-50 py-2 divide-y divide-[#262a34]/60 animate-scaleIn">
          <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-mono font-semibold text-[#86929a] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#00c2ff]" />
              Theme
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
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-[#262a34] text-[#dfe2ef] font-semibold'
                      : 'text-[#bcc8d1] hover:bg-[#1c1f29] hover:text-[#dfe2ef]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-4 text-center">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#00c2ff]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full inline-block bg-[#86929a]/40"></span>
                      )}
                    </span>
                    <span className="leading-tight">{t.name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {t.id.includes('desktop') ? (
                      <Monitor className="w-3.5 h-3.5 text-[#89ceff]" />
                    ) : t.type === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-[#86929a]" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    )}
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
