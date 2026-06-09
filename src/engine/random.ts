// ============================================================================
// Seeded pseudo-random utilities. Pure, deterministic given a seed — used by
// dungeon generation, loot and (later) combat/events so runs are reproducible.
// ============================================================================

/** A seeded generator returning floats in [0, 1). */
export type Rng = () => number;

/** mulberry32 — small, fast, deterministic PRNG seeded by a 32-bit integer. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh, non-deterministic 32-bit seed. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/** Inclusive integer in [min, max]. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Random element of a non-empty array. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** True with the given probability (0..1). */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

/** Weighted random choice across {value, weight} entries. */
export function weightedPick<T>(rng: Rng, entries: readonly { value: T; weight: number }[]): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

/** Fisher-Yates shuffle returning a new array (input untouched). */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
