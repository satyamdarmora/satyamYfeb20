// ---------------------------------------------------------------------------
// Wiom CSP App -- Audio + Haptic Feedback Utilities
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a pleasant two-tone chime for new connection / offer notifications.
 * Uses Web Audio API -- no external files needed.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone (C5 = 523 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (E5 = 659 Hz) - slight delay for chime effect
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.15);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);

    // Third tone (G5 = 784 Hz) - completes the major chord
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(784, now + 0.3);
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.2, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 0.7);
  } catch {
    // Audio not available -- silently ignore
  }
}

/**
 * Plays a short urgent alert sound for HIGH priority tasks.
 */
export function playUrgentSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two quick descending tones
    for (let i = 0; i < 2; i++) {
      const offset = i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.exponentialRampToValueAtTime(440, now + offset + 0.15);
      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    }
  } catch {
    // Audio not available
  }
}

/**
 * Triggers haptic feedback on supported devices.
 * pattern: array of vibrate/pause durations in ms
 */
export function hapticFeedback(pattern: number | number[] = 50): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptic not available
  }
}

/**
 * Combined: play notification chime + gentle haptic for new connections/offers.
 */
export function notifyNewConnection(): void {
  playNotificationSound();
  hapticFeedback([50, 30, 50]); // two short pulses
}

/**
 * Combined: play urgent sound + strong haptic for HIGH priority alerts.
 */
export function notifyUrgentAlert(): void {
  playUrgentSound();
  hapticFeedback([100, 50, 100, 50, 100]); // three strong pulses
}
