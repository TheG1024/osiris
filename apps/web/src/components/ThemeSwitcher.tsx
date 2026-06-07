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
    <div className="flex items-center gap-2">
      <Palette size={14} className="text-theme-text-secondary" />
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={clsx(
              'px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-all duration-200',
              theme === t.id
                ? 'bg-theme-accent text-theme-bg-primary font-medium'
                : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-accent/10'
            )}
            style={{
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