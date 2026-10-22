import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { iconPath, PALETTES, type Palette } from '../../src/ui/palette';

describe('palette icons', () => {
  it('exist for every palette and size (run scripts/make-icons.mjs after adding a palette)', () => {
    for (const palette of Object.keys(PALETTES) as Palette[]) {
      for (const size of [16, 32, 48, 96, 128] as const) {
        expect(
          existsSync(resolve(__dirname, '../../public', `.${iconPath(palette, size)}`)),
          iconPath(palette, size),
        ).toBe(true);
      }
    }
  });

  it("use the extension's own icon for the default palette", () => {
    expect(iconPath('forest', 48)).toBe('/icon/48.png');
    expect(iconPath('plum', 16)).toBe('/icon/plum/16.png');
  });
});
