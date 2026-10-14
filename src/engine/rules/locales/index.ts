import type { Locale } from '../types';
import { common } from './common';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { nl } from './nl';
import { pl } from './pl';
import { pt } from './pt';

/** Every language whose labels are recognised. To add one, create a file like ./de.ts and list it here. */
export const LOCALES: Locale[] = [common, en, de, fr, es, it, nl, pt, pl];
