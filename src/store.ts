// Simpanan setempat (localStorage) + eksport/import fail simpanan.
import type { Game, Mod } from './types';

const KEY_SIMPAN = 'asamgaram:simpan:v1';
const KEY_SET = 'asamgaram:tetapan:v1';

export interface Tetapan {
  teks: 0 | 1 | 2;
  gelap: boolean | null; // null = ikut sistem
  bunyi: boolean;
  muzik: boolean;
  dewasa: boolean;
  sensitif: boolean;
  mod: Mod;
  umurSah: boolean;
}

export const TETAPAN_ASAL: Tetapan = { teks: 1, gelap: null, bunyi: true, muzik: false, dewasa: true, sensitif: true, mod: 'realistik', umurSah: false };

export function muatTetapan(): Tetapan {
  try {
    const s = localStorage.getItem(KEY_SET);
    if (s) return { ...TETAPAN_ASAL, ...JSON.parse(s) };
  } catch { /* abaikan */ }
  return { ...TETAPAN_ASAL };
}
export function simpanTetapan(t: Tetapan) {
  try { localStorage.setItem(KEY_SET, JSON.stringify(t)); } catch { /* abaikan */ }
}

export function simpanGame(g: Game): boolean {
  try {
    localStorage.setItem(KEY_SIMPAN, JSON.stringify(g));
    return true;
  } catch {
    return false;
  }
}
export function muatGame(): Game | null {
  try {
    const s = localStorage.getItem(KEY_SIMPAN);
    if (!s) return null;
    const g = JSON.parse(s) as Game;
    return g && g.v === 1 ? g : null;
  } catch {
    return null;
  }
}
export function padamGame() {
  try { localStorage.removeItem(KEY_SIMPAN); } catch { /* abaikan */ }
}

export function eksportFail(g: Game) {
  const blob = new Blob([JSON.stringify(g)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `asam-garam-${g.seed}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function importFail(file: File): Promise<Game | null> {
  try {
    const g = JSON.parse(await file.text()) as Game;
    if (g && g.v === 1 && g.w && g.meter && g.duit) return g;
  } catch { /* abaikan */ }
  return null;
}
