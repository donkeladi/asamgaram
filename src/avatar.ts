// Watak kartun flat berlapis (badan, wajah, baju, ekspresi) dijana dalam SVG.
import type { Jantina, Rupa } from './types';

const KULIT = ['#f7d9c0', '#eebd97', '#d9a070', '#b9794a', '#8a5634'];
const RAMBUT = ['#2a1b15', '#4b2e20', '#141010'];
const BAJU = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#8e6bbf', '#f4a261', '#457b9d', '#c9485b'];
const TUDUNG = ['#f3c6d0', '#b9d6c8', '#cdbbe8', '#f6e0a5', '#a9c4e8', '#e8b9a0', '#d6e3a5', '#f4a6a6'];

export type Mood = 'gembira' | 'biasa' | 'sedih' | 'marah' | 'cemas';

function mata(mood: Mood): string {
  const w = '#2b2230';
  switch (mood) {
    case 'marah':
      return `<circle cx="42" cy="44" r="2.2" fill="${w}"/><circle cx="58" cy="44" r="2.2" fill="${w}"/><path d="M36 38 L46 41" stroke="${w}" stroke-width="2.2" stroke-linecap="round"/><path d="M64 38 L54 41" stroke="${w}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'sedih':
      return `<circle cx="42" cy="45" r="2.2" fill="${w}"/><circle cx="58" cy="45" r="2.2" fill="${w}"/><path d="M37 40 L46 38" stroke="${w}" stroke-width="2" stroke-linecap="round"/><path d="M63 40 L54 38" stroke="${w}" stroke-width="2" stroke-linecap="round"/><path d="M42 49 q-1 5 0 7" stroke="#6bb6ff" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'cemas':
      return `<circle cx="42" cy="44" r="3.4" fill="#fff" stroke="${w}" stroke-width="1.4"/><circle cx="58" cy="44" r="3.4" fill="#fff" stroke="${w}" stroke-width="1.4"/><circle cx="42" cy="44.4" r="1.4" fill="${w}"/><circle cx="58" cy="44.4" r="1.4" fill="${w}"/><path d="M66 32 q3 5 0 8 q-3-3 0-8z" fill="#7cc4ff"/>`;
    case 'gembira':
      return `<path d="M38 45 q4-5 8 0" stroke="${w}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M54 45 q4-5 8 0" stroke="${w}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    default:
      return `<circle cx="42" cy="44" r="2.2" fill="${w}"/><circle cx="58" cy="44" r="2.2" fill="${w}"/>`;
  }
}
function mulut(mood: Mood): string {
  const w = '#7a2e3a';
  switch (mood) {
    case 'gembira': return `<path d="M42 54 q8 8 16 0" stroke="${w}" stroke-width="2.4" fill="#fff" stroke-linecap="round"/><ellipse cx="38" cy="52" rx="3" ry="2" fill="#ff9aa5" opacity=".5"/><ellipse cx="62" cy="52" rx="3" ry="2" fill="#ff9aa5" opacity=".5"/>`;
    case 'sedih': return `<path d="M43 58 q7-6 14 0" stroke="${w}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'marah': return `<path d="M43 58 q7-4 14 0" stroke="${w}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'cemas': return `<ellipse cx="50" cy="57" rx="4" ry="3.4" fill="${w}"/>`;
    default: return `<path d="M44 56 q6 3 12 0" stroke="${w}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
}

function rambutLelaki(gaya: number, c: string): string {
  switch (gaya % 4) {
    case 0: return `<path d="M29 40 Q28 20 50 19 Q72 20 71 40 Q64 28 50 28 Q36 28 29 40Z" fill="${c}"/>`;
    case 1: return `<path d="M29 42 Q26 18 52 18 Q74 20 71 42 Q66 26 44 28 Q34 30 29 42Z" fill="${c}"/>`;
    case 2: return `<path d="M30 38 L33 22 L40 28 L46 17 L52 27 L60 18 L64 29 L71 24 L70 40 Q62 28 50 28 Q38 28 30 38Z" fill="${c}"/>`;
    default: return `<path d="M30 38 Q32 22 50 22 Q68 22 70 38 Q62 31 50 31 Q38 31 30 38Z" fill="${c}"/>`;
  }
}
function rambutPerempuan(gaya: number, c: string): { belakang: string; depan: string } {
  switch (gaya % 4) {
    case 0: return { belakang: `<path d="M26 40 Q24 14 50 14 Q76 14 74 40 L76 78 L24 78Z" fill="${c}"/>`, depan: `<path d="M30 40 Q34 24 50 24 Q66 24 70 40 Q60 31 50 31 Q40 31 30 40Z" fill="${c}"/>` };
    case 1: return { belakang: `<path d="M27 42 Q26 16 50 16 Q74 16 73 42 L72 62 L28 62Z" fill="${c}"/>`, depan: `<path d="M30 40 Q34 24 50 24 Q66 24 70 40 Q58 32 50 32 Q42 32 30 40Z" fill="${c}"/>` };
    case 2: return { belakang: `<path d="M70 36 Q84 44 76 70 Q72 58 68 46Z" fill="${c}"/>`, depan: `<path d="M29 40 Q28 18 50 18 Q72 18 71 40 Q60 28 50 28 Q40 28 29 40Z" fill="${c}"/>` };
    default: return { belakang: `<circle cx="50" cy="15" r="9" fill="${c}"/>`, depan: `<path d="M29 40 Q28 20 50 20 Q72 20 71 40 Q60 29 50 29 Q40 29 29 40Z" fill="${c}"/>` };
  }
}

export function avatar(r: Rupa, jantina: Jantina, mood: Mood = 'biasa', saiz = 96, label = ''): string {
  const kulit = KULIT[r.kulit % KULIT.length];
  const rambut = RAMBUT[r.warnaRambut % RAMBUT.length];
  const baju = BAJU[r.baju % BAJU.length];
  const tudung = TUDUNG[r.baju % TUDUNG.length];
  let belakang = '';
  let depan = '';
  if (jantina === 'perempuan' && r.tudung) {
    belakang = `<path d="M24 46 Q24 14 50 14 Q76 14 76 46 Q76 70 64 80 L36 80 Q24 70 24 46Z" fill="${tudung}"/>`;
    depan = `<path d="M33 32 Q50 22 67 32 Q58 30 50 30 Q42 30 33 32Z" fill="${tudung}"/>`;
  } else if (jantina === 'perempuan') {
    const h = rambutPerempuan(r.rambut, rambut);
    belakang = h.belakang;
    depan = h.depan;
  } else {
    depan = rambutLelaki(r.rambut, rambut);
    if (r.songkok) depan += `<path d="M30 30 Q50 14 70 30 L70 36 L30 36Z" fill="#1f1f24"/>`;
  }
  const leher = `<rect x="43" y="58" width="14" height="14" rx="4" fill="${kulit}"/>`;
  const badan = `<path d="M12 100 Q12 74 50 70 Q88 74 88 100Z" fill="${baju}"/>${jantina === 'perempuan' && r.tudung ? `<path d="M36 70 Q50 82 64 70 L70 80 L30 80Z" fill="${tudung}"/>` : ''}`;
  const muka = `<ellipse cx="50" cy="45" rx="19" ry="20" fill="${kulit}"/>`;
  return `<svg class="avatar" role="img" aria-label="${label || 'Watak'}" viewBox="0 0 100 100" width="${saiz}" height="${saiz}" xmlns="http://www.w3.org/2000/svg">${belakang}${leher}${badan}${muka}${mata(mood)}${mulut(mood)}${depan}</svg>`;
}

export function rupaPantas(n: number, jantina: Jantina): Rupa {
  return { kulit: n % 5, rambut: (n >> 2) % 4, warnaRambut: (n >> 4) % 3, baju: (n >> 1) % 8, tudung: jantina === 'perempuan' && n % 3 !== 0, songkok: false };
}
