'use client';

import { useThemeStore } from '@/stores/themeStore';
import clsx from 'clsx';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { id: 'cyberpunk' as const, label: 'Cyberpunk', color: '#00f5ff' },
    { id: 'glass' as const, label: 'Glass', color: '#22d3ee' },
    { id: 'industrial' as const, label: 'Industrial', color: '#f97316' },
  ];

  return (
    <div 
      className="flex items-center gap-2 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--osiris-border)' }}
    >
      <Palette size={14} className="text-osiris-text-muted" />
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={clsx(
              'px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-all duration-200 font-mono',
              theme === t.id
                ? 'font-medium'
                : 'text-osiris-text-muted hover:text-osiris-text'
            )}
            style={{
              background: theme === t.id ? `${t.color}20` : 'transparent',
              color: theme === t.id ? t.color : undefined,
              border: `1px solid ${theme === t.id ? t.color : 'transparent'}`,
              boxShadow: theme === t.id ? `0 0 10px ${t.color}40` : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}