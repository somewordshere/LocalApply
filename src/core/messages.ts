import type { BlockKind } from '../engine/blocks';
import type { Job } from '../engine/job';
import type { Learned } from '../engine/learn';
import type { FillResult } from '../engine/types';
import type { UndoResult } from '../engine/undo';

export type Message =
  /** Popup or background -> every frame of a tab: fill now. `auto`: the next step of an application, filled unasked. */
  | { type: 'fill'; overwrite?: boolean; job?: Job; auto?: boolean }
  /** Popup or background -> the top frame: which company and job is this page about? Answers with a Job. */
  | { type: 'read-job' }
  /** Frame -> background: ask all frames of my tab to fill (floating button). */
  | { type: 'relay-fill' }
  /** Frame -> popup: this frame received the command. */
  | { type: 'fill-start' }
  /** Frame -> popup and background: this frame is done. */
  | { type: 'fill-result'; result: FillResult; job?: Job; auto?: boolean }
  /** Popup -> every frame of a tab: press the form's "add" button for jobs or schools, then fill. */
  | { type: 'add-blocks'; kind: BlockKind; count: number; job?: Job }
  /** Popup -> every frame of a tab: send back a copy of your form, values removed, for a bug report. */
  | { type: 'snapshot' }
  /** Frame -> popup: this frame's form copy. */
  | { type: 'snapshot-part'; html: string; url: string }
  /** Top frame -> background, as each page loads: the site it is on, for carrying a fill on to the next step. */
  | { type: 'page-loaded'; host: string }
  /** Background -> the frame that was right-clicked: save what is in the field under the menu as an answer. */
  | { type: 'save-field'; job?: Job }
  /** Popup or background -> every frame of a tab: take back the last fill. */
  | { type: 'undo' }
  /** Frame -> background: ask all frames of my tab to undo (Undo in the on-page notice). */
  | { type: 'relay-undo' }
  /** Frame -> popup: what this frame put back. */
  | { type: 'undo-result'; result: UndoResult }
  /** Frame -> background: save answers the applicant typed into the form and chose to keep. */
  | { type: 'save-answers'; answers: Learned[] }
  /** Background -> the frame that was right-clicked: put this text into the field under the menu. */
  | { type: 'fill-field'; value: string; job?: Job };
