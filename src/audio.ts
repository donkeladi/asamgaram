// Bunyi dan muzik dijana dengan WebAudio (tiada aset). Dimulakan hanya selepas gesaan pengguna.
let ctx: AudioContext | null = null;
let aktifBunyi = true;
let muzikTimer: number | null = null;
let langkah = 0;

function dapatCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function nota(freq: number, mula: number, dur: number, jenis: OscillatorType = 'sine', vol = 0.06) {
  const c = dapatCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = jenis;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + mula);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + mula + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + mula + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + mula);
  o.stop(c.currentTime + mula + dur + 0.05);
}

export function setBunyi(b: boolean) { aktifBunyi = b; }

export function bunyi(jenis: 'notif' | 'pilih' | 'baik' | 'buruk' | 'tamat' | 'klik') {
  if (!aktifBunyi) return;
  switch (jenis) {
    case 'notif': nota(880, 0, 0.12, 'triangle'); nota(1175, 0.1, 0.16, 'triangle'); break;
    case 'pilih': nota(520, 0, 0.08, 'sine', 0.05); break;
    case 'klik': nota(440, 0, 0.05, 'square', 0.025); break;
    case 'baik': nota(523, 0, 0.12); nota(659, 0.1, 0.12); nota(784, 0.2, 0.2); break;
    case 'buruk': nota(220, 0, 0.18, 'sawtooth', 0.04); nota(165, 0.14, 0.25, 'sawtooth', 0.04); break;
    case 'tamat': [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.14, 0.3)); break;
  }
}

const MELODI = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 440, 392, 330, 294];
export function setMuzik(on: boolean) {
  if (muzikTimer !== null) { clearInterval(muzikTimer); muzikTimer = null; }
  if (!on) return;
  dapatCtx();
  muzikTimer = window.setInterval(() => {
    const f = MELODI[langkah % MELODI.length];
    nota(f, 0, 0.5, 'triangle', 0.018);
    if (langkah % 4 === 0) nota(f / 2, 0, 0.9, 'sine', 0.02);
    langkah++;
  }, 480);
}
