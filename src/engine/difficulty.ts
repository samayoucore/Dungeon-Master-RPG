// ============================================================================
// Difficulty setting, persisted in localStorage. Pure helpers — no React.
// ============================================================================

export type Difficulty = 'easy' | 'normal' | 'hardcore';

const STORAGE_KEY = 'dm_difficulty';
const DEFAULT: Difficulty = 'normal';

const VALID: ReadonlySet<Difficulty> = new Set<Difficulty>(['easy', 'normal', 'hardcore']);

/** Read the saved difficulty, defaulting to "normal". */
export function getDifficulty(): Difficulty {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && VALID.has(raw as Difficulty) ? (raw as Difficulty) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setDifficulty(value: Difficulty): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}
