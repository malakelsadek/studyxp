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

export function playClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;

  // Filtered noise burst: the sharp "tick" of the click.
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 2800;
  bandpass.Q.value = 0.9;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.025);

  // Low "thock" underneath: gives the click body/weight.
  const thock = ctx.createOscillator();
  thock.type = "sine";
  thock.frequency.setValueAtTime(180, now);
  thock.frequency.exponentialRampToValueAtTime(90, now + 0.03);

  const thockGain = ctx.createGain();
  thockGain.gain.setValueAtTime(0.25, now);
  thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  thock.connect(thockGain);
  thockGain.connect(ctx.destination);
  thock.start(now);
  thock.stop(now + 0.045);
}

function isDisabledButton(el: HTMLButtonElement): boolean {
  return el.disabled || el.getAttribute("aria-disabled") === "true";
}

function handleGlobalClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const button = target?.closest("button");
  if (!button || isDisabledButton(button)) return;
  playClickSound();
}

let installed = false;

export function installGlobalClickSound(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("click", handleGlobalClick, { capture: true });
}
