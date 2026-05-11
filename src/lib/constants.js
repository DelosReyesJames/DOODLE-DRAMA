// ── Constants ────────────────────────────────────────────
export const COLORS = [
  '#FF6B6B','#FF6B9D','#FFD93D','#69F0AE','#4FC3F7',
  '#CE93D8','#FFB347','#3D2C8D','#FFFFFF','#222222'
];

export const PROMPTS = [
  { emoji:'🦁', text:'You are a brave lion protecting your pride!', hint:'Roar loudly and walk with your chest up!' },
  { emoji:'🌊', text:'You are an ocean wave crashing on the beach!', hint:'Move your arms like flowing water.' },
  { emoji:'🤖', text:'You are a robot who just learned to dance!', hint:'Move stiff and jerky — beep boop!' },
  { emoji:'🦋', text:'You just hatched from your cocoon as a butterfly!', hint:'Slowly spread your wings for the first time.' },
  { emoji:'🌋', text:'You are a volcano about to erupt!', hint:'Build up slowly… then EXPLODE with energy!' },
  { emoji:'🧙', text:'You are a wizard casting a powerful spell!', hint:'Wave your wand and say the magic words!' },
  { emoji:'🐢', text:'You are a turtle in a hurry!', hint:'Move as fast as you can… slowly!' },
  { emoji:'🌺', text:'You are a flower blooming in the morning sun!', hint:'Start curled up, then slowly open up tall.' },
  { emoji:'🎪', text:'You are a circus juggler who keeps dropping things!', hint:'Mime juggling — and act surprised each drop!' },
  { emoji:'🌩️', text:'You are a thunderstorm rolling over mountains!', hint:'Be the wind, the lightning, and the rain!' },
  { emoji:'🐬', text:'You are a dolphin leaping through the waves!', hint:'Jump, spin, and make happy dolphin sounds!' },
  { emoji:'🦸', text:'You are a superhero who just discovered their power!', hint:'React with surprise, then try your power out!' },
  { emoji:'🧸', text:'You are a teddy bear who comes to life at night!', hint:'Slowly wake up and look around in amazement!' },
  { emoji:'🎵', text:'You are a song that gets faster and faster!', hint:'Start slow and quiet, speed up to the end!' },
];

// ── Storage helpers ──────────────────────────────────────
export async function sget(key, shared = true) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

export async function sset(key, val, shared = true) {
  try { await window.storage.set(key, JSON.stringify(val), shared); } catch {}
}

export async function sdel(key, shared = true) {
  try { await window.storage.delete(key, shared); } catch {}
}

// ── Misc ─────────────────────────────────────────────────
export function makeCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function fmtTimer(sec) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
