/**
 * High-quality synthesized Notification Bell Sound & Vibration Utility
 * Uses Web Audio API for zero-dependency, ultra-fast, realistic chime playback
 */

let audioCtx: AudioContext | null = null;

// Initialize / unlock AudioContext on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Play an elegant, realistic ringing bell chime with harmonics and trigger device vibration
 */
export function playNotificationBell(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Helper to generate a single bell harmonic
    const createTone = (freq: number, start: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Fast attack & natural exponential decay like a brass/crystal bell
      gainNode.gain.setValueAtTime(0.0001, now + start);
      gainNode.gain.linearRampToValueAtTime(gainVal, now + start + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    // First Ding (High chime bell)
    createTone(880, 0, 0.75, 0.45);        // A5
    createTone(1760, 0, 0.45, 0.2);        // A6 harmonic
    createTone(2640, 0, 0.25, 0.1);        // A7 sparkle

    // Second Dong (Higher crystalline resonance)
    createTone(1318.51, 0.14, 0.9, 0.55);  // E6
    createTone(2637.02, 0.14, 0.5, 0.25);  // E7 harmonic
    createTone(3955.53, 0.14, 0.3, 0.12);  // E8 shimmer

    // Device vibration (ສັ່ນ) if supported on mobile/tablet
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180, 90, 220]);
    }
  } catch (err) {
    console.warn('Notification audio playback was suppressed or unsupported:', err);
  }
}
