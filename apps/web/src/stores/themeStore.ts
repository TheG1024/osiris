import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeName = 'cyberpunk' | 'glass' | 'industrial';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'cyberpunk',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const themes: ThemeName[] = ['cyberpunk', 'glass', 'industrial'];
        const current = themes.indexOf(get().theme);
        const next = themes[(current + 1) % themes.length];
        set({ theme: next });
      },
    }),
    {
      name: 'osiris-theme',
    }
  )
);