import { useEffect, useState } from 'react';
import { applyPalette, DEFAULT_PALETTE, isPalette, savePalette, watchPalette, type Palette } from '@/src/ui/palette';

/** The current palette and a setter that applies and saves it. */
export function usePalette(): [Palette, (palette: Palette) => void] {
  const [palette, setState] = useState<Palette>(() => {
    const current = document.documentElement.dataset.palette;
    return isPalette(current) ? current : DEFAULT_PALETTE;
  });
  useEffect(() => watchPalette(setState), []);
  return [
    palette,
    (next) => {
      setState(next);
      applyPalette(next);
      void savePalette(next);
    },
  ];
}
