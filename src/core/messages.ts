import type { FillResult } from '../engine/types';

export type Message =
  /** Popup or background -> every frame of a tab: fill now. */
  | { type: 'fill'; overwrite?: boolean }
  /** Frame -> background: ask all frames of my tab to fill (floating button). */
  | { type: 'relay-fill' }
  /** Frame -> popup: this frame received the command. */
  | { type: 'fill-start' }
  /** Frame -> popup: this frame is done. */
  | { type: 'fill-result'; result: FillResult };
