// Moteur d'indices : trois niveaux, proposés après 60 s sans progrès ou 3 erreurs.

import { HINTS } from '../data/facts.js';
import { eraStats, hasNote, save } from './state.js';

const IDLE_MS = 60_000;
const ERRORS_BEFORE_HINT = 3;

// quiet : aucun rappel automatique (écran final, sans épreuve)
export function createHints(era, { onSuggest, onChange, touch, quiet = false }) {
  const texts = HINTS[era.id] ?? [];
  const listeners = new Set();
  let level = 0;
  let errors = 0;
  let timer = 0;
  let stopped = false;

  const suggest = () => {
    if (!stopped && !quiet && level < texts.length) onSuggest?.();
  };
  const arm = () => {
    clearTimeout(timer);
    if (!stopped && !quiet) timer = setTimeout(suggest, IDLE_MS);
  };

  const text = (i) => {
    const entry = texts[i];
    return typeof entry === 'function' ? entry({ hasNote, touch: touch() }) : entry;
  };

  arm();

  return {
    get level() {
      return level;
    },
    get max() {
      return texts.length;
    },
    text,
    revealed() {
      return Array.from({ length: level }, (_, i) => text(i));
    },
    reveal() {
      if (level >= texts.length) return level;
      level += 1;
      eraStats(era.id).hints += 1;
      save();
      arm();
      for (const fn of listeners) fn(level);
      onChange?.(level);
      return level;
    },
    onReveal(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    progress() {
      errors = 0;
      arm();
    },
    error() {
      errors += 1;
      eraStats(era.id).errors += 1;
      save();
      if (errors >= ERRORS_BEFORE_HINT) {
        errors = 0;
        suggest();
      }
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      listeners.clear();
    },
  };
}
