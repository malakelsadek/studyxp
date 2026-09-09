export interface MessageSoundOption {
  id: string;
  name: string;
}

export const MESSAGE_SOUND_OPTIONS: MessageSoundOption[] = [
  { id: "pop", name: "Pop" },
  { id: "dink", name: "Dink" },
  { id: "tap", name: "Tap" },
  { id: "chirp", name: "Chirp" },
  { id: "glass", name: "Glass" },
];

export const DEFAULT_MESSAGE_SOUND_ID = MESSAGE_SOUND_OPTIONS[0].id;

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const durationSec = 0.05;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

// A soft sine tone, low-pass filtered to shave off the harsh upper harmonics that make a
// plain oscillator read as "electronic". Optionally glides from freq to endFreq for a
// natural pitch-drop or whistle-up character instead of a flat synth blip.
function playTone(
  ctx: AudioContext,
  now: number,
  opts: { freq: number; endFreq?: number; start: number; duration: number; gain?: number; filterFreq?: number },
): void {
  const { freq, endFreq, start, duration, gain = 0.28, filterFreq = 3000 } = opts;
  const startTime = now + start;
  const endTime = startTime + duration;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, endTime);
  }

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.6;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(endTime + 0.02);
}

// A short burst of band-filtered noise — the same texture a real tap or pop has that a
// pure oscillator can't produce on its own.
function playNoiseBurst(
  ctx: AudioContext,
  now: number,
  opts: { start: number; duration: number; freq: number; q?: number; gain?: number },
): void {
  const { start, duration, freq, q = 1, gain = 0.3 } = opts;
  const startTime = now + start;
  const endTime = startTime + duration;

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = freq;
  bandpass.Q.value = q;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

  noise.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(ctx.destination);
  noise.start(startTime);
  noise.stop(endTime + 0.02);
}

const SOUND_PRESETS: Record<string, (ctx: AudioContext, now: number) => void> = {
  pop: (ctx, now) => {
    playTone(ctx, now, { freq: 900, endFreq: 320, start: 0, duration: 0.09, gain: 0.32, filterFreq: 2400 });
    playNoiseBurst(ctx, now, { start: 0, duration: 0.02, freq: 1800, q: 1.4, gain: 0.12 });
  },
  dink: (ctx, now) => {
    playTone(ctx, now, { freq: 784, start: 0, duration: 0.22, gain: 0.26, filterFreq: 2000 });
    playTone(ctx, now, { freq: 659.25, start: 0.09, duration: 0.28, gain: 0.22, filterFreq: 1800 });
  },
  tap: (ctx, now) => {
    playNoiseBurst(ctx, now, { start: 0, duration: 0.035, freq: 2200, q: 0.9, gain: 0.3 });
    playTone(ctx, now, { freq: 160, endFreq: 90, start: 0, duration: 0.06, gain: 0.2, filterFreq: 500 });
  },
  chirp: (ctx, now) => {
    playTone(ctx, now, { freq: 520, endFreq: 980, start: 0, duration: 0.11, gain: 0.24, filterFreq: 2600 });
  },
  glass: (ctx, now) => {
    playTone(ctx, now, { freq: 1046.5, start: 0, duration: 0.3, gain: 0.2, filterFreq: 3200 });
    playTone(ctx, now, { freq: 1568, start: 0, duration: 0.22, gain: 0.08, filterFreq: 3600 });
  },
};

export function playMessageSound(id: string): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  const preset = SOUND_PRESETS[id] ?? SOUND_PRESETS[DEFAULT_MESSAGE_SOUND_ID];
  preset(ctx, now);
}
