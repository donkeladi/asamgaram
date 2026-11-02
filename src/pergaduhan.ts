// Sistem pergaduhan: pusingan dengan Meter Panas, kemudian pembaikan.
import { apply, fmt, gabung, pilihPencetus, rawak, tambahChat } from './engine';
import type { Content, Game, Kesan, Pencetus } from './types';

export interface Respons {
  id: string;
  t: string;
  panas: number;
  k: Kesan;
}

const SEMUA: Respons[] = [
  { id: 'maaf', t: 'Minta maaf', panas: -18, k: { kasih: 1 } },
  { id: 'jelas', t: 'Jelaskan dengan tenang', panas: -9, k: { percaya: 1 } },
  { id: 'bela', t: 'Pertahankan diri', panas: 10, k: {} },
  { id: 'ungkit', t: 'Ungkit isu lama', panas: 20, k: { luka: 3 } },
  { id: 'diam', t: 'Diam sahaja', panas: 4, k: {} },
  { id: 'keluar', t: 'Keluar rumah sekejap', panas: -6, k: { percaya: -1 } },
];

export interface Pergaduhan {
  pencetus: Pencetus;
  teks: string;
  panas: number;
  pusingan: number;
  maks: number;
  pilihan: Respons[];
  log: string[];
  guna: string[];
}

export function mulaPergaduhan(g: Game, c: Content): Pergaduhan {
  const pencetus = pilihPencetus(g, c);
  const p = g.p;
  let panas = 20 + g.meter.stres / 4 + g.sembunyi.luka / 5 + (pencetus.jenis === 'besar' ? 15 : 0);
  if (p?.sifat.includes('sabar')) panas -= 8;
  if (p?.sifat.includes('cemburu') && pencetus.id === 'balas_mesej') panas += 6;
  const pg: Pergaduhan = { pencetus, teks: fmt(g, c, pencetus.teks), panas: Math.round(panas), pusingan: 0, maks: 3, pilihan: [], log: [], guna: [] };
  pg.pilihan = tarikPilihan(g);
  return pg;
}

function tarikPilihan(g: Game): Respons[] {
  const baik = SEMUA.filter((r) => r.panas < 0);
  const lain = SEMUA.filter((r) => r.panas >= 0);
  const a = baik[Math.floor(rawak(g) * baik.length)];
  const rest = [...baik.filter((x) => x !== a), ...lain];
  const out = [a];
  while (out.length < 4) {
    const r = rest.splice(Math.floor(rawak(g) * rest.length), 1)[0];
    out.push(r);
  }
  // susun rawak
  return out.sort(() => rawak(g) - 0.5);
}

export function kesanPanas(g: Game, r: Respons): number {
  let d = r.panas;
  const p = g.p;
  if (!p) return d;
  if (p.sifat.includes('sabar') && d > 0) d *= 0.7;
  if (p.sifat.includes('suka bercakap') && r.id === 'diam') d += 8;
  if (p.sifat.includes('pendiam') && r.id === 'diam') d -= 4;
  if (p.sifat.includes('manja') && r.id === 'keluar') d += 8;
  if (p.sifat.includes('berdikari') && r.id === 'keluar') d -= 3;
  if (p.suka === 'jujur' && r.id === 'jelas') d -= 4;
  if (p.suka === 'lembut' && r.id === 'maaf') d -= 4;
  return Math.round(d);
}

export function pusinganPergaduhan(g: Game, c: Content, pg: Pergaduhan, r: Respons): string[] {
  const lines: string[] = [];
  const d = kesanPanas(g, r);
  pg.panas = Math.max(0, Math.min(100, pg.panas + d));
  pg.guna.push(r.id);
  apply(g, c, r.k);
  if (r.id === 'maaf') g.stat.maaf++;
  pg.pusingan++;
  // ingatan pasangan mengungkit
  if (g.memori.length && pg.panas > 45 && rawak(g) < 0.55) {
    const m = g.memori[Math.floor(rawak(g) * g.memori.length)];
    pg.panas = Math.min(100, pg.panas + 8);
    lines.push(`${g.p?.nama}: “${m.teks}”`);
  }
  lines.push(
    pg.panas < 35 ? `${g.p?.nama} menarik nafas. Nada suara makin reda.` : pg.panas < 65 ? `${g.p?.nama} masih tegang, tetapi mendengar.` : `${g.p?.nama} meninggikan suara. Dapur jadi sempit.`,
  );
  if (pg.pusingan < pg.maks) pg.pilihan = tarikPilihan(g);
  pg.log.push(...lines);
  return lines;
}

export type Hasil = 'selesai' | 'tergantung' | 'meletup';

export function hasilPergaduhan(g: Game, c: Content, pg: Pergaduhan): { hasil: Hasil; teks: string } {
  g.stat.gaduh++;
  const l = pg.pencetus.luka ?? 0;
  if (pg.panas < 40) {
    apply(g, c, { luka: -3, kasih: 1, percaya: 1 });
    return { hasil: 'selesai', teks: `Selesai. Kedua-duanya reda dan, secara jujur, sedikit malu. Panas akhir: rendah.` };
  }
  if (pg.panas <= 70) {
    apply(g, c, { luka: 8 + l, kasih: -2, stres: 2 });
    return { hasil: 'tergantung', teks: `Tergantung. Tiada yang menang, dan sesuatu masih tak habis. Luka lama bertambah sedikit.` };
  }
  g.stat.gaduhBesar++;
  apply(g, c, { luka: 15 + l, kasih: -8, percaya: -5, stres: 10, ingat: undefined });
  g.memori.push({ teks: `Dulu awak jerit pasal ${pg.pencetus.id.replace(/_/g, ' ')}.`, bulan: g.bulan });
  return { hasil: 'meletup', teks: `Meletup. Pintu dihempas, kata-kata yang tak boleh ditarik balik. Rumah sunyi semalaman.` };
}

export interface Baikan {
  id: string;
  t: string;
  bk?: string;
  syarat?: (g: Game, pg: Pergaduhan) => boolean;
}

export const BAIKAN: Baikan[] = [
  { id: 'pujuk', t: 'Pujuk dengan kata-kata manis', bk: 'kata' },
  { id: 'hadiah', t: 'Beli hadiah kecil (RM80)', bk: 'hadiah' },
  { id: 'masa', t: 'Luang masa bersama malam ni', bk: 'masa' },
  { id: 'bincang', t: 'Bincang esok bila dah tenang' },
  { id: 'tengah', t: 'Minta orang tengah (ibu bapa, ustaz, kaunselor)', syarat: (_g, pg) => pg.panas > 55 },
  { id: 'mini', t: 'Main: Pujuk merajuk', syarat: (_g, pg) => pg.panas >= 40 },
];

export function pilihBaikan(g: Game, pg: Pergaduhan): Baikan[] {
  const ok = BAIKAN.filter((b) => !b.syarat || b.syarat(g, pg));
  // maksimum 4 pilihan
  const wajib = ok.filter((b) => b.id === 'mini' || b.id === 'tengah');
  const rest = ok.filter((b) => !wajib.includes(b));
  return [...wajib, ...rest].slice(0, 4);
}

export function kesanBaikan(g: Game, id: string, skor?: number): { k: Kesan; teks: string } {
  let k: Kesan = {};
  let teks = '';
  const bk = BAIKAN.find((b) => b.id === id)?.bk;
  const padan = !!bk && g.p?.bk === bk;
  switch (id) {
    case 'pujuk': k = { kasih: 2, luka: -3 }; teks = 'Kata-kata awak lembut dan jujur.'; break;
    case 'hadiah': k = { tunai: -80, kasih: 2, luka: -2 }; teks = 'Satu hadiah kecil, satu senyum kecil.'; break;
    case 'masa': k = { kasih: 3, luka: -4, stres: -2 }; teks = 'Telefon diketepikan. Kalian hanya berbual.'; break;
    case 'bincang': k = { luka: -2, stres: 1 }; teks = 'Esok pagi, dengan kopi, semuanya kedengaran lebih kecil.'; break;
    case 'tengah': k = { luka: -7, stres: 1, flag: { orangTengah: true } }; teks = 'Seseorang yang adil membantu kalian melihat dari sisi masing-masing.'; break;
    case 'mini': {
      const s = skor ?? 0;
      k = { luka: -Math.round(4 + 8 * s), kasih: Math.round(1 + 4 * s) };
      teks = s > 0.66 ? 'Langkah demi langkah, awak pujuk dengan tepat. Dia senyum.' : s > 0.33 ? 'Hampir. Dia melembut sedikit.' : 'Urutan salah. Dia makin masam.';
      break;
    }
  }
  if (padan) {
    k = gabung(k, { kasih: 3 });
    g.bkTepat++;
    teks += ' Tepat dengan bahasa kasih dia.';
  }
  return { k, teks };
}

export function sentuhChat(g: Game, d: string, t: string) {
  tambahChat(g, 'pasangan', d, t);
}
