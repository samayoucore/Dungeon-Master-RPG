import { useCallback } from 'react';
import { soundEngine } from '../engine/audio/soundEngine';
import type { SoundType } from '../engine/audio/soundEngine';

const STORAGE_KEY = 'dm_sound_enabled';

/** Whether sound is enabled (persisted; defaults to on). */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignore storage failures
  }
}

/** Play procedural sound effects, respecting the user's mute setting. */
export function useSound() {
  const play = useCallback((sound: SoundType) => {
    if (isSoundEnabled()) soundEngine.play(sound);
  }, []);
  return { play };
}
