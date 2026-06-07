'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'cyberpunk' | 'glass' | 'industrial';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'cyberpunk',
      setTheme: (theme) => {
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
        set({ theme });
      },
    }),
    {
      name: 'osiris-theme',
    }
  )
);

// Apply theme on initial load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('osiris-theme');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        document.documentElement.setAttribute('data-theme', state.theme);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}