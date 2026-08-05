interface ToneStep {
  freq: number;
  start: number;
  duration: number;
  type: OscillatorType;
  gain?: number;
}

const SOUND_PRESETS: Record<string, ToneStep[]> = {
  chime: [
    { freq: 880, start: 0, duration: 0.2, type: "sine" },
    { freq: 1174.66, start: 0.16, duration: 0.4, type: "sine" },
  ],
  bell: [
    { freq: 987.77, start: 0, duration: 0.7, type: "triangle" },
    { freq: 1975.53, start: 0, duration: 0.5, type: "sine", gain: 0.08 },
  ],
  digital: [
    { freq: 660, start: 0, duration: 0.1, type: "square" },
    { freq: 660, start: 0.16, duration: 0.1, type: "square" },
    { freq: 660, start: 0.32, duration: 0.16, type: "square" },
  ],
  marimba: [
    { freq: 523.25, start: 0, duration: 0.25, type: "sine" },
    { freq: 659.25, start: 0.12, duration: 0.25, type: "sine" },
    { freq: 783.99, start: 0.24, duration: 0.4, type: "sine" },
  ],
  alarm: [
    { freq: 700, start: 0, duration: 0.12, type: "sawtooth" },
    { freq: 500, start: 0.15, duration: 0.12, type: "sawtooth" },
    { freq: 700, start: 0.3, duration: 0.12, type: "sawtooth" },
    { freq: 500, start: 0.45, duration: 0.16, type: "sawtooth" },
  ],
  party: [
    { freq: 523.25, start: 0, duration: 0.15, type: "square" },
    { freq: 659.25, start: 0.1, duration: 0.15, type: "square" },
    { freq: 783.99, start: 0.2, duration: 0.15, type: "square" },
    { freq: 1046.5, start: 0.3, duration: 0.45, type: "square" },
    { freq: 1318.51, start: 0.32, duration: 0.4, type: "sine", gain: 0.15 },
  ],
};

export interface TimerSoundOption {
  id: string;
  name: string;
}

export const TIMER_SOUND_OPTIONS: TimerSoundOption[] = [
  { id: "chime", name: "Chime" },
  { id: "bell", name: "Bell" },
  { id: "digital", name: "Digital" },
  { id: "marimba", name: "Marimba" },
  { id: "alarm", name: "Alarm" },
];

export const DEFAULT_TIMER_SOUND_ID = TIMER_SOUND_OPTIONS[0].id;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function playSteps(steps: ToneStep[]): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;

  for (const step of steps) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = step.type;
    osc.frequency.value = step.freq;

    const startTime = now + step.start;
    const endTime = startTime + step.duration;
    const peakGain = step.gain ?? 0.3;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(endTime + 0.02);
  }
}

export function playTimerSound(id: string): void {
  playSteps(SOUND_PRESETS[id] ?? SOUND_PRESETS[DEFAULT_TIMER_SOUND_ID]);
}

export function playPartySound(): void {
  playSteps(SOUND_PRESETS.party);
}
