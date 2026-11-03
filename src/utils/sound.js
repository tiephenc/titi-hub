/**
 * Interface sounds, synthesised with WebAudio — no audio files, nothing
 * ever autoplays. The AudioContext is only created after the visitor
 * turns sound on (a user gesture), and every call is a no-op while off.
 */
let ctx = null;
let enabled = false;

const PATTERNS = {
  open: [[660, 0.05], [990, 0.06]],
  close: [[740, 0.05], [440, 0.07]],
  click: [[1320, 0.025]],
  select: [[880, 0.03]],
  notify: [[784, 0.05], [1046, 0.08]],
  error: [[220, 0.09]],
};

export function setSoundEnabled(on) {
  enabled = Boolean(on);
  if (enabled && !ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = AC ? new AC() : null;
    } catch {
      ctx = null;
    }
  }
  if (ctx && enabled && ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function play(name) {
  if (!enabled || !ctx) return;
  const notes = PATTERNS[name];
  if (!notes) return;
  try {
    let t = ctx.currentTime + 0.005;
    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.035, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* audio is decoration; never let it break the interface */
  }
}
