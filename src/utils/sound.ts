/**
 * Tiny Web Audio synthesizer: no audio files, no dependencies.
 * The AudioContext is created lazily on the first sound, which always
 * follows a user gesture, so browser autoplay policies are satisfied.
 */

type AudioContextConstructor = typeof AudioContext;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

interface AudioEngine {
  ctx: AudioContext;
  out: GainNode;
}

interface ToneOptions {
  freq: number;
  duration: number;
  start?: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  glideTo?: number;
}

let engine: AudioEngine | null = null;
let muted = false;

function getEngine(): AudioEngine | null {
  if (muted || typeof window === 'undefined') return null;

  if (engine === null) {
    const Ctor: AudioContextConstructor | undefined =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (Ctor === undefined) return null;

    const ctx = new Ctor();
    const out = ctx.createGain();
    out.gain.value = 0.2;
    out.connect(ctx.destination);
    engine = { ctx, out };
  }

  if (engine.ctx.state === 'suspended') {
    void engine.ctx.resume();
  }
  return engine;
}

function tone({ ctx, out }: AudioEngine, opts: ToneOptions): void {
  const t0 = ctx.currentTime + (opts.start ?? 0);
  const peak = opts.gain ?? 0.5;
  const attack = opts.attack ?? 0.006;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.glideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(opts.glideTo, t0 + opts.duration);
  }

  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);

  osc.connect(env);
  env.connect(out);
  osc.start(t0);
  osc.stop(t0 + opts.duration + 0.05);
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/** Soft wooden tick. Pass a pitch multiplier to vary it (e.g. 0.7 for "remove"). */
export function playClick(pitch = 1): void {
  const e = getEngine();
  if (e === null) return;
  tone(e, { freq: 540 * pitch, glideTo: 380 * pitch, duration: 0.07, type: 'triangle', gain: 0.45 });
  tone(e, { freq: 1080 * pitch, duration: 0.03, type: 'sine', gain: 0.12 });
}

/** Two rising notes: two nodes just snapped together. */
export function playConnect(): void {
  const e = getEngine();
  if (e === null) return;
  tone(e, { freq: 660, duration: 0.1, type: 'sine', gain: 0.4 });
  tone(e, { freq: 880, duration: 0.16, start: 0.07, type: 'sine', gain: 0.4 });
}

/** Two low, rounded blips. Gentle, not alarming. */
export function playError(): void {
  const e = getEngine();
  if (e === null) return;
  tone(e, { freq: 240, glideTo: 170, duration: 0.18, type: 'triangle', gain: 0.5 });
  tone(e, { freq: 220, glideTo: 150, duration: 0.24, start: 0.15, type: 'triangle', gain: 0.5 });
}

/** Cmaj7 arpeggio that blooms into a chord, with a sparkle on top. */
export function playSuccess(): void {
  const e = getEngine();
  if (e === null) return;
  const chord: readonly number[] = [523.25, 659.25, 783.99, 987.77];
  chord.forEach((freq, i) => {
    tone(e, { freq, duration: 1.1, start: i * 0.07, type: 'sine', gain: 0.3, attack: 0.015 });
    tone(e, { freq: freq / 2, duration: 1.2, start: i * 0.07, type: 'triangle', gain: 0.08, attack: 0.02 });
  });
  tone(e, { freq: 1318.5, duration: 0.6, start: 0.34, type: 'sine', gain: 0.18 });
}