import { useEffect, useState } from 'react';
import { applyTheme, DEFAULT_THEME, isTheme, saveTheme, watchTheme, type Theme } from '@/src/ui/theme';

/** The current theme and a setter that applies and saves it. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setState] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme;
    return isTheme(current) ? current : DEFAULT_THEME;
  });
  useEffect(() => watchTheme(setState), []);
  return [
    theme,
    (next) => {
      setState(next);
      applyTheme(next);
      void saveTheme(next);
    },
  ];
}
