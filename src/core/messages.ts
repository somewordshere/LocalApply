import type { Job } from '../engine/job';
import type { FillResult } from '../engine/types';
import type { UndoResult } from '../engine/undo';

export type Message =
  /** Popup or background -> every frame of a tab: fill now. */
  | { type: 'fill'; overwrite?: boolean; job?: Job }
  /** Popup or background -> the top frame: which company and job is this page about? Answers with a Job. */
  | { type: 'read-job' }
  /** Frame -> background: ask all frames of my tab to fill (floating button). */
  | { type: 'relay-fill' }
  /** Frame -> popup: this frame received the command. */
  | { type: 'fill-start' }
  /** Frame -> popup: this frame is done. */
  | { type: 'fill-result'; result: FillResult }
  /** Popup or background -> every frame of a tab: take back the last fill. */
  | { type: 'undo' }
  /** Frame -> background: ask all frames of my tab to undo (Undo in the on-page notice). */
  | { type: 'relay-undo' }
  /** Frame -> popup: what this frame put back. */
  | { type: 'undo-result'; result: UndoResult };
