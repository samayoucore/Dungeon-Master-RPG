// ============================================================================
// Procedural sound effects via the Web Audio API — no audio files.
// Every path is guarded so a missing/blocked AudioContext never throws.
// ============================================================================

export type SoundType =
  | 'dice_roll'
  | 'attack_hit'
  | 'attack_miss'
  | 'critical_hit'
  | 'player_hurt'
  | 'enemy_death'
  | 'level_up'
  | 'item_pickup'
  | 'menu_click'
  | 'footstep';

type Wave = OscillatorType;

class SoundEngine {
  private ctx: AudioContext | null = null;

  /** Eagerly create the context (call from a user gesture). Safe to call often. */
  init(): void {
    this.getCtx();
  }

  private getCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(ctx: AudioContext, wave: Wave, from: number, to: number, dur: number, gain: number, delay = 0): void {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.linearRampToValueAtTime(to, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  private noise(ctx: AudioContext, dur: number, gain: number, delay = 0): void {
    const t0 = ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(amp).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  play(sound: SoundType): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      switch (sound) {
        case 'dice_roll':
          this.tone(ctx, 'triangle', 300, 100, 0.15, 0.3);
          break;
        case 'attack_hit':
          this.noise(ctx, 0.08, 0.25);
          this.tone(ctx, 'sine', 80, 80, 0.1, 0.4);
          break;
        case 'attack_miss':
          this.tone(ctx, 'sawtooth', 200, 150, 0.08, 0.15);
          break;
        case 'critical_hit':
          this.noise(ctx, 0.1, 0.4);
          this.tone(ctx, 'sine', 800, 400, 0.3, 0.5, 0.05);
          break;
        case 'player_hurt':
          this.tone(ctx, 'sine', 60, 60, 0.2, 0.4);
          this.noise(ctx, 0.06, 0.2);
          break;
        case 'enemy_death':
          this.tone(ctx, 'sine', 400, 50, 0.4, 0.4);
          break;
        case 'level_up':
          this.tone(ctx, 'triangle', 261, 261, 0.15, 0.3, 0);
          this.tone(ctx, 'triangle', 329, 329, 0.15, 0.3, 0.15);
          this.tone(ctx, 'triangle', 392, 392, 0.25, 0.35, 0.3);
          break;
        case 'item_pickup':
          this.tone(ctx, 'sine', 880, 880, 0.1, 0.3);
          break;
        case 'menu_click':
          this.tone(ctx, 'sine', 440, 440, 0.03, 0.1);
          break;
        case 'footstep':
          this.noise(ctx, 0.05, 0.08);
          break;
        default:
          break;
      }
    } catch {
      // Audio is best-effort; never break gameplay.
    }
  }
}

export const soundEngine = new SoundEngine();
