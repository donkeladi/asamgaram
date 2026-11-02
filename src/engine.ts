// Enjin teras Asam Garam. Tiada kebergantungan pada DOM supaya boleh diuji dan disimulasi.
import { Rng, hash } from './rng';
import type {
  Anak, BahasaKasih, Content, Ending, Game, Gaya, Jantina, Kesan, Mod, Pasangan, Peristiwa,
  Pencetus, Pilihan, Rupa, Soalan, Syarat, Watak,
} from './types';

export const UMUR_MULA = 22;
export const TAHUN_MULA = 2026;
export const BULAN_NAMA = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
export const FASA_NAMA = ['', 'Bujang', 'Bercinta', 'Merisik & Bertunang', 'Persiapan & Nikah', 'Awal Kahwin', 'Membina Keluarga', 'Pertengahan', 'Hari Tua'];

// ---------------- Rawak pada Game ----------------
export function rawak(g: Game): number {
  const r = new Rng(g.rs);
  const v = r.next();
  g.rs = r.s;
  return v;
}
function rInt(g: Game, a: number, b: number) {
  return Math.floor(rawak(g) * (b - a + 1)) + a;
}
function rPick<T>(g: Game, a: readonly T[]): T {
  return a[Math.floor(rawak(g) * a.length)];
}
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

// ---------------- Pembantu ----------------
export const umur = (g: Game) => UMUR_MULA + g.bulan / 12;
export const tahun = (g: Game) => TAHUN_MULA + Math.floor(g.bulan / 12);
export const tarikh = (g: Game) => `${BULAN_NAMA[g.bulan % 12]} ${tahun(g)}`;
export const inflasi = (g: Game, c: Content) => Math.pow(1 + c.harga.inflasi, g.bulan / 12);
export const rm = (n: number) => 'RM' + Math.round(n).toLocaleString('en-US');
const bulat = (n: number, k = 50) => Math.round(n / k) * k;

export function gelarPasangan(g: Game): string {
  if (!g.p) return 'pasangan';
  switch (g.rel) {
    case 'bercinta': return 'kekasih';
    case 'bertunang': return 'tunang';
    case 'berkahwin': return g.w.jantina === 'lelaki' ? 'isteri' : 'suami';
    case 'bercerai': return g.w.jantina === 'lelaki' ? 'bekas isteri' : 'bekas suami';
    default: return 'pasangan';
  }
}

export function labelFasa(g: Game): string {
  if (g.rel === 'bujang' && g.fasa >= 5) return ['', '', '', '', '', 'Dewasa Muda', 'Kerjaya & Keluarga', 'Pertengahan', 'Hari Tua'][g.fasa] || FASA_NAMA[g.fasa];
  if (g.rel === 'bercerai' && g.fasa >= 6) return ['', '', '', '', '', '', 'Bermula Semula', 'Pertengahan', 'Hari Tua'][g.fasa] || FASA_NAMA[g.fasa];
  return FASA_NAMA[g.fasa] || '';
}

export function hantaranAsas(g: Game, c: Content): number {
  if (g.flag.hantaran) return g.flag.hantaran;
  const negeriPengantin = g.w.jantina === 'lelaki' ? g.p?.negeri ?? g.w.negeri : g.w.negeri;
  const h = c.harga.negeri[negeriPengantin] ?? c.harga.negeri['Selangor'];
  const ped = g.w.jantina === 'lelaki' ? g.p : g.w;
  const edu = (ped as any)?.pendidikan === 'ijazah' ? 1.2 : (ped as any)?.pendidikan === 'spm' ? 0.85 : 1;
  return bulat(h.hantaran * edu * inflasi(g, c), 500);
}

export function vars(g: Game, c: Content): Record<string, number> {
  const f = inflasi(g, c);
  const bridge = c.harga.negeri[g.w.jantina === 'lelaki' ? g.p?.negeri ?? g.w.negeri : g.w.negeri] ?? c.harga.negeri['Selangor'];
  const share = 0.6;
  return {
    gaji: g.gaji,
    tunai: g.duit.tunai,
    hutang: g.duit.hutang,
    simpanan: g.duit.simpanan,
    kwsp: g.duit.kwsp,
    ptptn: g.duit.ptptn,
    hantaran: hantaranAsas(g, c),
    kenduriBesar: bulat(bridge.kenduriBesar * f * share, 500),
    kenduriSederhana: bulat(bridge.kenduriSederhana * f * share, 500),
    ivf: bulat(12000 * f, 500),
    rawatan: bulat(3000 * f, 100),
    hospital: bulat(2500 * f, 100),
    bersalin: bulat(4500 * f, 100),
    kereta: bulat(2800 * f, 100),
    depositRumah: bulat(25000 * f, 500),
    rumah: bulat(300000 * f, 1000),
    kerjaP: g.p?.gaji ?? 0,
    umur: Math.floor(umur(g)),
    anakBil: g.anak.length,
    umrah: bulat(11000 * f, 500),
    bisnes: bulat(30000 * f, 500),
    cuti: bulat(4500 * f, 100),
    sekolah: bulat(1800 * f, 100),
    raya: bulat(1200 * f, 100),
  };
}

export function ungkap(g: Game, c: Content, n: number | string | undefined): number {
  if (n === undefined) return 0;
  if (typeof n === 'number') return n;
  const v = vars(g, c);
  const s = n.replace(/^=/, '').replace(/\$(\w+)/g, (_, k) => String(v[k] ?? 0));
  if (!/^[\d\s+\-*/().]+$/.test(s)) return 0;
  try {
    const r = Function(`"use strict";return (${s})`)();
    return Number.isFinite(r) ? Math.round(r) : 0;
  } catch {
    return 0;
  }
}

export function fmt(g: Game, c: Content, text: string): string {
  const v = vars(g, c);
  const kerjaS: Record<string, string> = { kerajaan: 'kerja kerajaan', swasta: 'syarikat swasta', gig: 'kerja gig', niaga: 'perniagaan' };
  const m: Record<string, string> = {
    nama: g.p?.nama ?? 'dia',
    saya: g.w.nama,
    negeri: g.w.negeri,
    negeriP: g.p?.negeri ?? '',
    pasGelar: gelarPasangan(g),
    mak: g.p ? `Mak ${g.p.mertuaNama}` : 'Mak',
    anak: g.anak.length ? g.anak[g.anak.length - 1].nama : 'anak',
    kerjaP: g.p?.kerjaLabel ?? 'kerja',
    kerjaS: kerjaS[g.w.kerjaya],
    makanan: g.p?.makanan ?? 'nasi lemak',
    hantaran: rm(v.hantaran),
    kenduriBesar: rm(v.kenduriBesar),
    kenduriSederhana: rm(v.kenduriSederhana),
    gaji: rm(g.gaji),
    tunai: rm(g.duit.tunai),
    hutang: rm(g.duit.hutang),
    umur: String(Math.floor(umur(g))),
    tahun: String(tahun(g)),
    ex: g.flag.exNama ?? 'bekas kekasih',
    ivf: rm(v.ivf),
    rawatan: rm(v.rawatan),
    hospital: rm(v.hospital),
    bersalin: rm(v.bersalin),
    kereta: rm(v.kereta),
    depositRumah: rm(v.depositRumah),
    rumah: rm(v.rumah),
    umrah: rm(v.umrah),
    bisnes: rm(v.bisnes),
    cuti: rm(v.cuti),
    sekolah: rm(v.sekolah),
    raya: rm(v.raya),
    bilAnak: String(g.anak.length),
    mertuaSifat: g.p?.mertuaSifat ?? '',
    ingatan: g.memori.length ? g.memori[g.memori.length - 1].teks : 'dulu-dulu',
  };
  return text.replace(/\{(\w+)\}/g, (all, k) => (k in m ? m[k] : all));
}

// ---------------- Syarat ----------------
function nilaiKunci(g: Game, k: string): number {
  if (k in g.meter) return (g.meter as any)[k];
  if (k in g.sembunyi) return (g.sembunyi as any)[k];
  if (k in g.duit) return (g.duit as any)[k];
  if (k === 'gaji') return g.gaji;
  if (k === 'umur') return umur(g);
  if (k === 'anak') return g.anak.length;
  if (k in g.stat) return (g.stat as any)[k];
  return 0;
}
function cocokKunci(g: Game, kunci: string): boolean {
  const [t, v] = [kunci.slice(0, 1), kunci.slice(2)];
  switch (t) {
    case 'p': return !!g.p && (g.p.sifat.includes(v) || g.p.tersembunyi.includes(v));
    case 's': return g.w.sifat.includes(v);
    case 'm': return !!g.p && g.p.mertuaSifat === v;
    case 'j': return g.w.jantina === v;
    case 'r': return g.rel === v;
    case 'f': return !!g.flag[v];
    default: return false;
  }
}

export function syaratOK(g: Game, s?: Syarat): boolean {
  if (!s) return true;
  if (s.rel && !s.rel.includes(g.rel)) return false;
  if (s.jantina && g.w.jantina !== s.jantina) return false;
  if (s.asal && g.w.asal !== s.asal) return false;
  if (s.negeri && !s.negeri.includes(g.w.negeri)) return false;
  if (s.kerjaya && !s.kerjaya.includes(g.w.kerjaya)) return false;
  if (s.pendidikan && !s.pendidikan.includes(g.w.pendidikan)) return false;
  if (s.sifat && !s.sifat.some((x) => g.w.sifat.includes(x))) return false;
  if (s.sifatP && !(g.p && s.sifatP.some((x) => g.p!.sifat.includes(x) || g.p!.tersembunyi.includes(x)))) return false;
  if (s.mertua && !(g.p && s.mertua.includes(g.p.mertuaSifat))) return false;
  if (s.ibuBapa && g.w.ibuBapa !== s.ibuBapa) return false;
  const u = umur(g);
  if (s.umurMin !== undefined && u < s.umurMin) return false;
  if (s.umurMax !== undefined && u > s.umurMax) return false;
  if (s.flag) {
    for (const [k, v] of Object.entries(s.flag)) {
      const cur = g.flag[k];
      if (v === true && !cur) return false;
      if (v === false && cur) return false;
      if (typeof v === 'number' && !((Number(cur) || 0) >= v)) return false;
      if (typeof v === 'string' && cur !== v) return false;
    }
  }
  if (s.tiada && s.tiada.some((k) => g.flag[k])) return false;
  if (s.min) for (const [k, v] of Object.entries(s.min)) if (nilaiKunci(g, k) < v) return false;
  if (s.max) for (const [k, v] of Object.entries(s.max)) if (nilaiKunci(g, k) > v) return false;
  if (s.anakMin !== undefined && g.anak.length < s.anakMin) return false;
  if (s.anakMax !== undefined && g.anak.length > s.anakMax) return false;
  if (s.fasaMin !== undefined && g.fasaCount < s.fasaMin) return false;
  if (s.tunaiMin !== undefined && g.duit.tunai < s.tunaiMin) return false;
  if (s.mod && !s.mod.includes(g.mod)) return false;
  if (s.bezaNegeri !== undefined && (!!g.p && g.p.negeri !== g.w.negeri) !== s.bezaNegeri) return false;
  return true;
}

// ---------------- Penjanaan ----------------
function janaRupa(r: Rng, jantina: Jantina): Rupa {
  return {
    kulit: r.int(0, 4),
    rambut: r.int(0, 3),
    warnaRambut: r.int(0, 2),
    baju: r.int(0, 7),
    tudung: jantina === 'perempuan' && r.chance(0.8),
    songkok: false,
  };
}

const NEGERI_LIST = (c: Content) => Object.keys(c.harga.negeri);

export function janaPasangan(g: Game, c: Content, idx: number): Pasangan {
  const r = new Rng(hash(`${g.seed}:p:${idx}`));
  const jantina: Jantina = g.w.jantina === 'lelaki' ? 'perempuan' : 'lelaki';
  const nama = r.pick(c.nama[jantina]);
  const kerjaya = r.weighted(['kerajaan', 'swasta', 'gig', 'niaga'] as const, (k) => ({ kerajaan: 3, swasta: 5, gig: 2, niaga: 2 }[k]))!;
  const edu = r.pick(['spm', 'diploma', 'diploma', 'ijazah', 'ijazah'] as const);
  const asal = r.chance(0.55) ? 'bandar' : 'kampung';
  const gaji = bulat((c.harga.gajiMula[edu][kerjaya] ?? 2000) * c.harga.faktorLokasi[asal] * (0.9 + r.next() * 0.3), 50);
  const semua = r.shuffle(c.sifat.semua);
  const sifat = semua.slice(0, 2);
  const tersembunyi: string[] = [];
  if (r.chance(sifat.includes('cemburu') ? 0.18 : 0.08)) tersembunyi.push('mengawal');
  if (r.chance(sifat.includes('boros') ? 0.45 : 0.18)) tersembunyi.push('rahsiaHutang');
  if (jantina === 'lelaki' && r.chance(0.1)) tersembunyi.push('mahuPoligami');
  if (r.chance(0.07)) tersembunyi.push('curang');
  const agama = r.chance(0.18) ? r.pick(['kristian', 'buddha', 'hindu'] as const) : 'islam';
  const mertuaSifat = r.weighted(['penyayang', 'suka campur', 'pilih kasih', 'uzur'] as const, (k) => ({ penyayang: 3, 'suka campur': 3, 'pilih kasih': 2, uzur: 2 }[k]))!;
  return {
    nama, jantina, agama, negeri: r.pick(NEGERI_LIST(c)), asal, kerjaya,
    kerjaLabel: r.pick(c.sifat.kerjaLabel[kerjaya]),
    gaji, usia: Math.max(20, 22 + r.int(-2, 3)),
    sifat, tersembunyi,
    bk: r.pick(['masa', 'hadiah', 'kata', 'khidmat', 'sentuhan'] as BahasaKasih[]),
    suka: r.pick(['jujur', 'lembut', 'humor'] as Gaya[]),
    makanan: r.pick(c.sifat.makanan),
    mertuaSifat,
    mertuaNama: r.pick(c.nama.mertua),
    rupa: janaRupa(r, jantina),
  };
}

export function janaCalon(g: Game, c: Content): Pasangan[] {
  return [janaPasangan(g, c, g.pasanganBil), janaPasangan(g, c, g.pasanganBil + 1)];
}

export interface OpsMain {
  seed: string;
  mod: Mod;
  dewasa: boolean;
  sensitif: boolean;
  w: Omit<Watak, 'rupa' | 'agama'> & { rupa?: Rupa };
}

export function baruGame(c: Content, o: OpsMain): Game {
  const r = new Rng(hash(o.seed + ':watak'));
  const w: Watak = { ...o.w, agama: 'islam', rupa: o.w.rupa ?? janaRupa(r, o.w.jantina) };
  let gaji = bulat(c.harga.gajiMula[w.pendidikan][w.kerjaya] * c.harga.faktorLokasi[w.asal], 50);
  const cab = o.mod === 'cabaran';
  if (cab) gaji = bulat(gaji * 0.8, 50);
  const ptptn = c.harga.ptptn.baki[w.pendidikan] ?? 0;
  const g: Game = {
    v: 1, seed: o.seed, mod: o.mod, dewasa: o.dewasa, sensitif: o.sensitif,
    w, p: null, rel: 'bujang', fasa: 1, fasaCount: 0, bulan: 0,
    meter: { kasih: 50, percaya: 50, stres: cab ? 40 : 25 },
    sembunyi: { mertua: 50, ibubapa: w.ibuBapa === 'uzur' ? 45 : 60, anak: 50, kesihatan: 85, reputasi: 50, luka: 0, keintiman: 50, kawan: 55 },
    duit: { tunai: cab ? 300 : 900, hutang: cab ? 6000 : 0, simpanan: cab ? 200 : 600, kwsp: w.kerjaya === 'kerajaan' || w.kerjaya === 'swasta' ? 2500 : 0, ptptn },
    gaji,
    rancang: { gaya: 1, simpan: 10, ibuBapa: 200, fokus: 'kerja' },
    rumah: w.asal === 'kampung' ? 'keluarga' : 'sewa',
    kereta: w.kerjaya === 'gig' || w.asal === 'kampung' ? 'motor' : 'tiada',
    flag: {}, anak: [], lihat: {}, lihatIdx: {}, bil: 0, queue: [], next: null, memori: [],
    chat: { pasangan: [], group: [], mak: [], kawan: [] },
    album: [],
    stat: { gaduh: 0, gaduhBesar: 0, hantaran: 0, kenduri: 0, anak: 0, cucu: 0, maaf: 0, sesal: 0, rawatan: 0 },
    nada: [], bkTepat: 0, pasanganBil: 0, rs: hash(o.seed + ':main'),
    snapshot: null, undurGuna: false, tamat: null, log: [],
  };
  g.chat.group.push({ d: 'ayah', t: 'a', b: 0 }, { d: 'mak', t: 'Dah makan?', b: 0 });
  g.snapshot = JSON.stringify({ ...g, snapshot: null });
  return g;
}

// ---------------- Kesan ----------------
export interface Perubahan {
  kasih: number; percaya: number; stres: number; duit: number; lain: number;
}

const SEMBUNYI_KEYS = ['mertua', 'ibubapa', 'anak', 'kesihatan', 'reputasi', 'luka', 'keintiman', 'kawan'] as const;

export function gabung(a: Kesan, b: Kesan | undefined): Kesan {
  if (!b) return a;
  const o: any = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (k === 'flag') o.flag = { ...(o.flag || {}), ...(v as object) };
    else if (k === 'stat') {
      o.stat = { ...(o.stat || {}) };
      for (const [sk, sv] of Object.entries(v as object)) o.stat[sk] = typeof sv === 'number' && typeof o.stat[sk] !== 'string' ? (o.stat[sk] || 0) + sv : `(${o.stat[sk] ?? 0})+(${sv})`;
    } else if (['kasih', 'percaya', 'stres', 'tunai', 'hutang', 'simpanan', 'kwsp', 'gaji', 'bulan', ...SEMBUNYI_KEYS].includes(k)) {
      const x = o[k];
      if (x === undefined) o[k] = v;
      else if (typeof x === 'number' && typeof v === 'number') o[k] = x + v;
      else o[k] = `(${x})+(${v})`;
    } else o[k] = v;
  }
  return o;
}

export function tambahChat(g: Game, utas: string, d: string, t: string) {
  (g.chat[utas] ||= []).push({ d, t, b: g.bulan });
  if (g.chat[utas].length > 80) g.chat[utas].shift();
}

export function catatAlbum(g: Game, c: Content, teks: string, emoji = '📸') {
  g.album.push({ teks: fmt(g, c, teks), umur: Math.floor(umur(g)), fasa: g.fasa, emoji });
}

export function gantiFasa(g: Game, n: number) {
  if (g.fasa === n) return;
  g.fasa = n;
  g.fasaCount = 0;
  g.undurGuna = false;
  g.snapshot = JSON.stringify({ ...g, snapshot: null });
}

export function lahirkanAnak(g: Game, c: Content, n: number) {
  for (let i = 0; i < n; i++) {
    const jantina: Jantina = rawak(g) < 0.5 ? 'lelaki' : 'perempuan';
    const sifat = rPick(g, ['periang', 'degil', 'penyayang', 'pemalu', 'kuat makan', 'cerdik', 'aktif', 'suka melukis']);
    g.anak.push({ nama: rPick(g, c.nama.anak), jantina, lahir: g.bulan, sifat });
    g.stat.anak++;
  }
  g.sembunyi.anak = clamp(Math.max(g.sembunyi.anak, 60));
}

export function apply(g: Game, c: Content, k: Kesan): Perubahan {
  const before = { ...g.meter, tunai: g.duit.tunai, hutang: g.duit.hutang, simp: g.duit.simpanan, sm: { ...g.sembunyi } };
  const n = (x: any) => ungkap(g, c, x);
  if (k.kasih !== undefined) g.meter.kasih = clamp(g.meter.kasih + n(k.kasih));
  if (k.percaya !== undefined) g.meter.percaya = clamp(g.meter.percaya + n(k.percaya));
  if (k.stres !== undefined) g.meter.stres = clamp(g.meter.stres + n(k.stres));
  for (const s of SEMBUNYI_KEYS) if (k[s] !== undefined) g.sembunyi[s] = clamp(g.sembunyi[s] + n(k[s]));
  if (k.tunai !== undefined) g.duit.tunai += n(k.tunai);
  if (k.hutang !== undefined) g.duit.hutang = Math.max(0, g.duit.hutang + n(k.hutang));
  if (k.simpanan !== undefined) g.duit.simpanan = Math.max(0, g.duit.simpanan + n(k.simpanan));
  if (k.kwsp !== undefined) g.duit.kwsp = Math.max(0, g.duit.kwsp + n(k.kwsp));
  if (k.gaji !== undefined) g.gaji = Math.max(0, g.gaji + n(k.gaji));
  if (g.duit.tunai < 0) {
    // tak cukup tunai: guna simpanan dahulu, baki jadi hutang
    const kurang = -g.duit.tunai;
    const guna = Math.min(g.duit.simpanan, kurang);
    g.duit.simpanan -= guna;
    const baki = kurang - guna;
    if (baki > 0) {
      g.duit.hutang += baki;
      g.meter.stres = clamp(g.meter.stres + 3);
    }
    g.duit.tunai = 0;
  }
  if (k.flag) {
    for (const [fk, fv] of Object.entries(k.flag)) {
      if (fv === null) delete g.flag[fk];
      else if (typeof fv === 'string' && /^[+-]\d+$/.test(fv)) g.flag[fk] = (Number(g.flag[fk]) || 0) + Number(fv);
      else g.flag[fk] = fv;
    }
  }
  if (k.stat) for (const [sk, sv] of Object.entries(k.stat)) (g.stat as any)[sk] += n(sv);
  if (k.ptptn !== undefined) g.duit.ptptn = Math.max(0, g.duit.ptptn + n(k.ptptn));
  if (k.pasanganIslam && g.p) g.p.agama = 'islam';
  if (k.rumah) g.rumah = k.rumah;
  if (k.kereta) g.kereta = k.kereta;
  if (k.kerja) g.w.kerjaya = k.kerja;
  if (k.rel) {
    g.rel = k.rel;
    if (k.rel === 'berkahwin' && g.flag.kahwinBulan === undefined) g.flag.kahwinBulan = g.bulan;
    if (k.rel === 'bercerai') {
      g.flag.ceraiBulan = g.bulan;
      delete g.flag.ceraiMula;
      if (g.fasa < 6) gantiFasa(g, 6);
    }
  }
  if (k.putus && g.p) {
    if (g.fasa < 5) gantiFasa(g, 1);
    g.flag.exNama = g.p.nama;
    g.flag.putus = (Number(g.flag.putus) || 0) + 1;
    g.p = null;
    g.rel = 'bujang';
    g.meter.kasih = 50;
    g.meter.percaya = 50;
    g.sembunyi.luka = Math.round(g.sembunyi.luka * 0.3);
    g.sembunyi.mertua = 50;
    g.memori = [];
  }
  if (k.pasanganBaru) {
    g.p = janaPasangan(g, c, g.pasanganBil);
    g.pasanganBil++;
    g.rel = 'berkahwin';
    g.meter.kasih = 58;
    g.meter.percaya = 52;
    g.sembunyi.luka = 0;
    g.sembunyi.mertua = 50;
    g.memori = [];
    g.flag.kahwinBulan = g.bulan;
  }
  if (k.ingat) g.memori.push({ teks: fmt(g, c, k.ingat), bulan: g.bulan });
  if (k.anakLahir) lahirkanAnak(g, c, k.anakLahir);
  if (k.catat) catatAlbum(g, c, k.catat, k.emoji);
  if (k.fasa) gantiFasa(g, k.fasa);
  const dm = (a: number, b: number) => b - a;
  let lain = 0;
  for (const s of SEMBUNYI_KEYS) lain += Math.abs(dm(before.sm[s], g.sembunyi[s])) >= 3 ? 1 : 0;
  return {
    kasih: dm(before.kasih, g.meter.kasih),
    percaya: dm(before.percaya, g.meter.percaya),
    stres: dm(before.stres, g.meter.stres),
    duit: (g.duit.tunai + g.duit.simpanan - g.duit.hutang) - (before.tunai + before.simp - before.hutang),
    lain,
  };
}

// ---------------- Pilih peristiwa ----------------
function adaPasangan(g: Game) {
  return !!g.p && (g.rel === 'bercinta' || g.rel === 'bertunang' || g.rel === 'berkahwin');
}

function tapisTag(g: Game, ev: { tag?: string[] }): boolean {
  const t = ev.tag || [];
  if (t.includes('dewasa') && !g.dewasa) return false;
  if ((t.includes('sensitif') || t.includes('keganasan')) && !g.sensitif) return false;
  if (g.mod === 'santai' && (t.includes('berat') || t.includes('keganasan') || t.includes('kematian'))) return false;
  if (g.mod !== 'cabaran' && t.includes('cabaran')) return false;
  return true;
}

export function layak(g: Game, ev: Peristiwa, longgar: boolean | 'penuh' = false): boolean {
  if (!(ev.fasa.includes(0) || ev.fasa.includes(g.fasa))) return false;
  const seen = g.lihat[ev.id] || 0;
  const maks = ev.ulang === true ? 99 : typeof ev.ulang === 'number' ? ev.ulang : 1;
  if (seen >= maks) return false;
  if (seen > 0) {
    const cd = ev.cd ?? 8;
    if (g.bil - (g.lihatIdx[ev.id] ?? -99) < cd) return false;
  }
  if (!tapisTag(g, ev)) return false;
  if (longgar) {
    // hanya rel dan jantina diambil kira supaya fasa tidak tersekat
    const s: Syarat = {};
    if (ev.syarat?.rel) s.rel = ev.syarat.rel;
    if (ev.syarat?.jantina) s.jantina = ev.syarat.jantina;
    if (longgar !== 'penuh' && ev.syarat?.tiada) s.tiada = ev.syarat.tiada;
    return syaratOK(g, s);
  }
  return syaratOK(g, ev.syarat);
}

function beratPelarasan(g: Game, ev: Peristiwa): number {
  let b = ev.berat ?? 5;
  if (ev.jenis === 'pergaduhan') {
    if (!adaPasangan(g) || g.fasaCount < 2) return 0;
    if (g.bil - (g.lihatIdx['__pg'] ?? -99) < 3) return 0;
    b *= 0.5 + g.meter.stres / 35 + (100 - g.meter.kasih) / 45 + g.sembunyi.luka / 60;
  }
  if (ev.jenis === 'ujian') {
    if (!adaPasangan(g)) return 0;
    if (g.bil - (g.lihatIdx['__uj'] ?? -99) < 4) return 0;
  }
  // pengarah cerita: seimbangkan nada
  const tag = ev.tag || [];
  const berat = tag.includes('berat') || tag.includes('sensitif');
  const lucu = tag.includes('lucu');
  const n = g.nada.slice(-2);
  if (n.length === 2 && n.every((x) => x === 'berat')) b *= berat ? 0.25 : 2.5;
  if (n.length === 2 && n.every((x) => x === 'lucu')) b *= berat ? 1.6 : 0.8;
  if (lucu && g.mod === 'santai') b *= 1.4;
  return b;
}

export function pilihNext(g: Game, c: Content): Peristiwa {
  const byId = (id: string) => c.peristiwa.find((e) => e.id === id);
  while (g.queue.length) {
    const ev = byId(g.queue.shift()!);
    if (ev && tapisTag(g, ev) && syaratOK(g, ev.syarat)) return ev;
  }
  const semua = c.peristiwa;
  // 1) ujian cerai
  const cerai = byId('ujian_cerai');
  if (cerai && layak(g, cerai)) return cerai;
  // 1b) rantaian yang mesti diselesaikan
  for (const id of ['cerai_proses', 'cerai_selepas', 'kv_perlindungan', 'poligami_mahkamah']) {
    const e = byId(id);
    if (e && layak(g, e)) return e;
  }
  // 2) wajib (ikut urutan)
  const wajib = semua.filter((e) => e.wajib && layak(g, e)).sort((a, b) => (a.urut ?? 99) - (b.urut ?? 99));
  if (wajib.length) return wajib[0];
  // 3) besar
  const besar = semua.filter((e) => e.besar && layak(g, e));
  if (besar.length) return besar[0];
  if (g.fasaCount >= 18) {
    const paksa = semua.filter((e) => e.besar && layak(g, e, true));
    if (paksa.length) return paksa[0];
  }
  if (g.fasaCount >= 30) {
    // jaring keselamatan terakhir: fasa tidak boleh tersekat selama-lamanya
    const paksa = semua.filter((e) => e.besar && layak(g, e, 'penuh'));
    if (paksa.length) return paksa[0];
  }
  // 4) berwajaran
  const calon = semua.filter((e) => !e.wajib && !e.besar && e.id !== 'ujian_cerai' && layak(g, e));
  const r = new Rng(g.rs);
  const pilih = r.weighted(calon, (e) => beratPelarasan(g, e));
  g.rs = r.s;
  if (pilih) return pilih;
  const pengisi = byId('pengisi')!;
  return pengisi;
}

export function catatLihat(g: Game, ev: Peristiwa) {
  g.lihat[ev.id] = (g.lihat[ev.id] || 0) + 1;
  g.lihatIdx[ev.id] = g.bil;
  if (ev.jenis === 'pergaduhan') g.lihatIdx['__pg'] = g.bil;
  if (ev.jenis === 'ujian') g.lihatIdx['__uj'] = g.bil;
  g.bil++;
  g.fasaCount++;
  const tag = ev.tag || [];
  g.nada.push(tag.includes('berat') || tag.includes('sensitif') ? 'berat' : tag.includes('lucu') ? 'lucu' : 'tenang');
  if (g.nada.length > 4) g.nada.shift();
}

export function pilihSoalan(g: Game, c: Content): Soalan {
  const calon = c.soalan.filter((q) => (q.untuk === 'semua' || q.untuk === g.w.jantina) && tapisTag(g, { tag: q.tag }));
  const baru = calon.filter((q) => !g.lihat['q:' + q.id]);
  const dari = baru.length ? baru : calon;
  const q = rPick(g, dari);
  g.lihat['q:' + q.id] = (g.lihat['q:' + q.id] || 0) + 1;
  return q;
}

export function pilihPencetus(g: Game, c: Content): Pencetus {
  const besar = g.sembunyi.luka > 55 || g.meter.stres > 75 ? rawak(g) < 0.6 : rawak(g) < 0.1;
  const jenis = besar ? 'besar' : 'kecil';
  let calon = c.pergaduhan.filter((p) => p.jenis === jenis && syaratOK(g, p.syarat));
  if (!calon.length) calon = c.pergaduhan.filter((p) => syaratOK(g, p.syarat));
  const baru = calon.filter((p) => !g.lihat['pg:' + p.id]);
  const p = rPick(g, baru.length ? baru : calon);
  g.lihat['pg:' + p.id] = (g.lihat['pg:' + p.id] || 0) + 1;
  return p;
}

// ---------------- Guna pilihan ----------------
export interface HasilPilihan {
  h: string;
  ubah: Perubahan;
  mini?: string;
}

export function pilihanBolehDipilih(g: Game, p: Pilihan): boolean {
  return syaratOK(g, p.syarat);
}

export function kesanPilihan(g: Game, c: Content, ev: Peristiwa | null, pil: Pilihan): { k: Kesan; h: string } {
  let k: Kesan = { ...(pil.k || {}) };
  let h = pil.h || '';
  if (pil.ikut) for (const [key, kk] of Object.entries(pil.ikut)) if (cocokKunci(g, key)) k = gabung(k, kk);
  if (g.p && adaPasangan(g)) {
    if (pil.gaya) {
      if (pil.gaya === g.p.suka) k = gabung(k, { kasih: 3, percaya: 1 });
      else if (pil.gaya === 'diam') k = gabung(k, { kasih: -2 });
      else k = gabung(k, { kasih: -1 });
    }
    if (pil.bk) {
      if (pil.bk === g.p.bk) {
        k = gabung(k, { kasih: 4 });
        g.bkTepat++;
      } else k = gabung(k, { kasih: 1 });
    }
  }
  if (pil.rawak) {
    const p = ungkap(g, c, pil.rawak.p); // peratus 0..100
    const kena = rawak(g) * 100 < p;
    const cab = kena ? pil.rawak.ya : pil.rawak.tidak;
    const { h: hh, ...rest } = cab as any;
    k = gabung(k, rest);
    if (hh) h = (h ? h + ' ' : '') + hh;
  }
  return { k, h };
}

// Peristiwa awal diberi masa lebih panjang supaya kehidupan terasa menurut umur sebenar.
const TEMPO: Record<number, number> = { 1: 3, 2: 2.5, 3: 1.5, 4: 1.5, 5: 3, 6: 3, 7: 10, 8: 12 };
export function resolveBulan(g: Game, b: Peristiwa['bulan']): number {
  if (b === undefined) return Math.round(1 * (TEMPO[g.fasa] ?? 1));
  if (Array.isArray(b)) return rInt(g, b[0], b[1]);
  const n = Math.max(0, ungkap(g, {} as Content, b as any));
  return n > 0 && n < 6 ? Math.round(n * (TEMPO[g.fasa] ?? 1)) : n;
}

export function selesaikan(g: Game, c: Content, ev: Peristiwa | null, pil: Pilihan, bulanAsal?: number): HasilPilihan {
  const { k, h } = kesanPilihan(g, c, ev, pil);
  const ubah = apply(g, c, k);
  const bln = (ev ? resolveBulan(g, ev.bulan) : 0) + (typeof k.bulan === 'number' ? k.bulan : 0) + (bulanAsal ?? 0);
  if (bln > 0) tick(g, c, bln);
  if (k.lompat) lompat(g, c, k.lompat);
  if (ev?.fasaNext && !k.fasa) gantiFasa(g, ev.fasaNext);
  if (ev?.seterusnya) g.queue.push(ev.seterusnya);
  if (k.tamat) g.tamat = kiraTamat(g, c);
  autoFasa(g);
  return { h: fmt(g, c, h), ubah, mini: k.mini };
}

function autoFasa(g: Game) {
  const u = umur(g);
  if (u >= 55 && g.fasa < 8) {
    if (g.rel === 'bercinta' || g.rel === 'bertunang') { g.rel = 'bujang'; g.p = null; }
    gantiFasa(g, 8);
  }
  else if (u >= 32 && g.fasa === 1 && g.rel === 'bujang') gantiFasa(g, 5);
}

// ---------------- Masa & belanjawan ----------------
export interface Belanja {
  pendapatan: number;
  baris: { nama: string; jumlah: number; wajib: boolean }[];
  jumlah: number;
  simpan: number;
  bersih: number;
}

export function umurAnak(a: Anak, g: Game): number {
  return Math.max(0, (g.bulan - a.lahir) / 12);
}

export function belanjaBulanan(g: Game, c: Content): Belanja {
  const f = inflasi(g, c);
  const kh = c.harga.kosHidup[g.w.asal];
  const berkongsi = g.p && (g.rel === 'berkahwin');
  const baris: Belanja['baris'] = [];
  const gayaM = [0.8, 1, 1.25][g.rancang.gaya];
  let pendapatan = g.gaji * (g.flag.berhentiKerja ? 0 : 1);
  const formal = g.w.kerjaya === 'kerajaan' || g.w.kerjaya === 'swasta';
  let bersih = formal ? pendapatan * 0.89 : pendapatan;
  if (g.rancang.fokus === 'kerja') bersih *= 1.02;
  if (berkongsi && g.p && !g.flag.pasanganBerhenti) {
    const sumbang = g.flag.kewanganAsing ? 0.45 : 0.9;
    const pf = g.p.kerjaya === 'kerajaan' || g.p.kerjaya === 'swasta';
    bersih += g.p.gaji * (pf ? 0.89 : 1) * sumbang;
  }
  pendapatan = bersih;
  baris.push({ nama: 'Makan & barang dapur', jumlah: kh.makan * f * gayaM * (berkongsi ? 1.5 : 1) + g.anak.filter((a) => umurAnak(a, g) < 13).length * kh.makan * 0.25 * f, wajib: true });
  baris.push({ nama: 'Bil (api, air, internet, telefon)', jumlah: kh.bil * f * (berkongsi ? 1.2 : 1), wajib: true });
  if (g.rumah === 'keluarga') baris.push({ nama: 'Sumbangan rumah keluarga', jumlah: 250 * f, wajib: true });
  else if (g.rumah === 'sewa') baris.push({ nama: 'Sewa rumah', jumlah: (berkongsi ? kh.sewaRumah : kh.sewaBilik) * f, wajib: true });
  else baris.push({ nama: 'Ansuran rumah', jumlah: kh.ansuranRumah * f, wajib: true });
  if (g.kereta === 'kereta') baris.push({ nama: 'Ansuran kereta + minyak/tol', jumlah: (c.harga.kereta.ansuran + c.harga.kereta.minyakTol) * f, wajib: true });
  else if (g.kereta === 'motor') baris.push({ nama: 'Motor (ansuran & minyak)', jumlah: c.harga.kereta.motor * f, wajib: true });
  if (g.duit.ptptn > 0) baris.push({ nama: 'PTPTN', jumlah: Math.min(g.duit.ptptn, c.harga.ptptn.ansuran[g.w.pendidikan] ?? 0), wajib: true });
  if (g.duit.hutang > 0) baris.push({ nama: 'Bayaran hutang (min. 3%)', jumlah: g.duit.hutang * 0.03 + g.duit.hutang * c.harga.kadarBunga, wajib: true });
  for (const a of g.anak) {
    const u = umurAnak(a, g);
    if (u < 2) baris.push({ nama: `${a.nama}: lampin, susu`, jumlah: c.harga.anak.bayi * f, wajib: true });
    else if (u < 5 && !g.flag.berhentiKerja && !g.flag.pasanganBerhenti && g.p) baris.push({ nama: `${a.nama}: taska/pengasuh`, jumlah: c.harga.anak.taska * f, wajib: true });
    else if (u < 13) baris.push({ nama: `${a.nama}: sekolah`, jumlah: c.harga.anak.sekolah * f, wajib: true });
    else if (u < 19) baris.push({ nama: `${a.nama}: sekolah & tuisyen`, jumlah: c.harga.anak.remaja * f, wajib: true });
  }
  if (g.flag.poligami && g.w.jantina === 'lelaki') baris.push({ nama: 'Rumah kedua & nafkah', jumlah: 1500 * f, wajib: true });
  if (g.rancang.ibuBapa > 0) baris.push({ nama: 'Duit belanja ibu bapa', jumlah: g.rancang.ibuBapa * f, wajib: false });
  const jumlah = baris.reduce((s, b) => s + b.jumlah, 0);
  const simpan = Math.max(0, pendapatan * (g.rancang.simpan / 100));
  return { pendapatan, baris, jumlah, simpan, bersih: pendapatan - jumlah - simpan };
}

export interface RekapTick {
  bersih: number;
  naikGaji: number;
  lines: string[];
}

export function tick(g: Game, c: Content, bulan: number): RekapTick {
  const rekap: RekapTick = { bersih: 0, naikGaji: 0, lines: [] };
  const mula = { tunai: g.duit.tunai + g.duit.simpanan - g.duit.hutang };
  for (let i = 0; i < Math.round(bulan); i++) {
    g.bulan++;
    const b = belanjaBulanan(g, c);
    let masuk = b.pendapatan;
    if (g.w.kerjaya === 'gig' || g.w.kerjaya === 'niaga') masuk *= 0.85 + rawak(g) * 0.3 + (g.rancang.fokus === 'kerja' ? 0.05 : 0);
    const formal = g.w.kerjaya === 'kerajaan' || g.w.kerjaya === 'swasta';
    if (formal && !g.flag.berhentiKerja) g.duit.kwsp += g.gaji * 0.11 + g.gaji * 0.12 * 0.5; // sebahagian caruman majikan
    g.duit.kwsp *= 1 + 0.045 / 12;
    g.duit.hutang += g.duit.hutang * c.harga.kadarBunga;
    const baris = b.baris;
    const ptptnBayar = baris.find((x) => x.nama === 'PTPTN');
    if (ptptnBayar) g.duit.ptptn = Math.max(0, g.duit.ptptn - ptptnBayar.jumlah);
    const hutangBayar = baris.find((x) => x.nama.startsWith('Bayaran hutang'));
    if (hutangBayar) g.duit.hutang = Math.max(0, g.duit.hutang - g.duit.hutang * 0.03);
    g.duit.simpanan += b.simpan;
    g.duit.tunai += masuk - b.jumlah - b.simpan;
    if (g.duit.tunai < 0) {
      const kurang = -g.duit.tunai;
      const guna = Math.min(g.duit.simpanan, kurang);
      g.duit.simpanan -= guna;
      const baki = kurang - guna;
      if (baki > 0) {
        // had hutang: selebihnya ditanggung keluarga/kawan, bukan menimbun tanpa had
        const ruang = Math.max(0, g.gaji * 24 - g.duit.hutang);
        g.duit.hutang += Math.min(baki, ruang);
        if (baki > ruang) g.sembunyi.ibubapa = clamp(g.sembunyi.ibubapa - 0.3);
      }
      g.duit.tunai = 0;
      g.meter.stres = clamp(g.meter.stres + 1.2);
    } else if (g.duit.tunai > g.gaji * 1.5 + 2000) {
      // tunai berlebihan masuk simpanan
      const lebih = g.duit.tunai - (g.gaji + 1000);
      g.duit.tunai -= lebih;
      g.duit.simpanan += lebih;
    }
    // fokus
    const f = g.rancang.fokus;
    if (f === 'kerja') g.meter.stres = clamp(g.meter.stres + 0.35);
    if (f === 'pasangan' && adaPasangan(g)) g.meter.kasih = clamp(g.meter.kasih + 0.5);
    if (f === 'keluarga') {
      g.sembunyi.ibubapa = clamp(g.sembunyi.ibubapa + 0.4);
      if (g.p) g.sembunyi.mertua = clamp(g.sembunyi.mertua + 0.3);
      if (g.anak.length) g.sembunyi.anak = clamp(g.sembunyi.anak + 0.3);
    }
    if (f === 'diri') {
      g.meter.stres = clamp(g.meter.stres - 0.6);
      g.sembunyi.kesihatan = clamp(g.sembunyi.kesihatan + 0.3);
    }
    // hanyut semula jadi
    if (adaPasangan(g) && f !== 'pasangan') g.meter.kasih = clamp(g.meter.kasih - 0.12);
    if (f !== 'keluarga' && g.anak.length) g.sembunyi.anak = clamp(g.sembunyi.anak - 0.08);
    const sasaran = 28 + (g.duit.hutang > g.gaji * 6 ? 25 : 0) + g.anak.filter((a) => umurAnak(a, g) < 3).length * 8 + (g.mod === 'cabaran' ? 10 : 0) + (g.flag.berhentiKerja ? 0 : 4);
    g.meter.stres = clamp(g.meter.stres + (sasaran - g.meter.stres) * 0.03);
    const u = umur(g);
    g.sembunyi.kesihatan = clamp(g.sembunyi.kesihatan - Math.max(0, u - 40) * 0.004 - Math.max(0, g.meter.stres - 60) * 0.012 + (g.meter.stres < 30 ? 0.03 : 0));
    if (adaPasangan(g)) {
      g.sembunyi.keintiman = clamp(g.sembunyi.keintiman + (g.meter.kasih - 50) * 0.004 - (g.meter.stres - 40) * 0.004 - g.anak.filter((a) => umurAnak(a, g) < 2).length * 0.2);
      if (g.sembunyi.luka > 0) g.sembunyi.luka = clamp(g.sembunyi.luka - 0.1);
    }
    // kenaikan gaji tahunan
    if (g.bulan % 12 === 0 && !g.flag.berhentiKerja) {
      const kerja = g.w.kerjaya;
      const asas = { kerajaan: 0.3, swasta: 0.22, gig: 0.08, niaga: 0.2 }[kerja];
      if (rawak(g) < asas + (g.rancang.fokus === 'kerja' ? 0.25 : 0) - (g.meter.stres > 80 ? 0.1 : 0)) {
        const naik = Math.round((g.gaji * (0.08 + rawak(g) * 0.1)) / 50) * 50;
        g.gaji += naik;
        rekap.naikGaji += naik;
      }
    }
  }
  rekap.bersih = g.duit.tunai + g.duit.simpanan - g.duit.hutang - mula.tunai;
  if (rekap.naikGaji) rekap.lines.push(`📈 Gaji naik ${rm(rekap.naikGaji)}`);
  return rekap;
}

export function lompat(g: Game, c: Content, tahunN: number): string[] {
  const lines: string[] = [];
  const mula = { u: Math.floor(umur(g)), d: g.duit.tunai + g.duit.simpanan - g.duit.hutang, hut: g.duit.hutang, kwsp: g.duit.kwsp, gaji: g.gaji, anak: g.anak.length };
  const r = tick(g, c, tahunN * 12);
  g.fasaCount += 2;
  lines.push(`⏩ ${tahunN} tahun kemudian. Umur awak ${Math.floor(umur(g))}.`);
  const d = g.duit.tunai + g.duit.simpanan - g.duit.hutang - mula.d;
  lines.push(d >= 0 ? `💰 Kewangan bersih bertambah ${rm(d)}.` : `💸 Kewangan bersih berkurang ${rm(-d)}.`);
  if (r.naikGaji) lines.push(`📈 Gaji naik ${rm(g.gaji - mula.gaji)} sepanjang tempoh ini.`);
  if (g.duit.hutang > mula.hut + 5000) lines.push('📉 Hutang menimbun.');
  g.anak.forEach((a) => lines.push(`🧒 ${a.nama} kini ${Math.floor(umurAnak(a, g))} tahun.`));
  if (g.p && adaPasangan(g)) {
    // pasangan dan anak membesar bersama; hubungan hanyut ke tengah
    g.meter.kasih = clamp(g.meter.kasih + (55 - g.meter.kasih) * 0.2);
    g.meter.percaya = clamp(g.meter.percaya + (55 - g.meter.percaya) * 0.1);
  }
  autoFasa(g);
  g.log = lines;
  return lines;
}

// ---------------- Pengakhiran ----------------
export function kiraTamat(g: Game, c: Content): Ending {
  const s = g.sembunyi;
  const berkahwin = g.rel === 'berkahwin' && g.p;
  const damai = clamp(72 - g.meter.stres * 0.4 + s.reputasi * 0.1 + (g.flag.kaunseling ? 10 : 0) + (g.flag.terapi ? 8 : 0) - g.stat.sesal * 3);
  const pasangan = berkahwin ? clamp((g.meter.kasih + g.meter.percaya) / 2 - s.luka * 0.3 + 8) : damai;
  const anakCucu = g.anak.length ? clamp(s.anak * 0.8 + Math.min(20, g.stat.cucu * 5) + (g.flag.dekatAnak ? 8 : 0)) : clamp((s.ibubapa + s.kawan) / 2 + (g.flag.anakSaudara ? 12 : 0));
  const hartanya = g.duit.kwsp + g.duit.simpanan - g.duit.hutang;
  const kewangan = clamp((hartanya / (300000 * inflasi(g, c))) * 100 + (g.rumah === 'beli' ? 12 : 0) + (g.flag.pencen ? 6 : 0));
  const kesihatan = clamp(s.kesihatan);
  const keluarga = clamp((s.ibubapa + (berkahwin ? s.mertua : 55) + s.reputasi + s.kawan) / 4);
  const impian = g.flag.impian ? (g.flag.impianTercapai ? 100 : g.flag.impianSebahagian ? 55 : 20) : 40;
  const penyesalan = clamp(100 - g.stat.sesal * 13);
  const komponen = [
    { nama: berkahwin ? 'Hubungan dengan pasangan' : 'Damai dengan diri', berat: 25, nilai: Math.round(pasangan) },
    { nama: g.anak.length ? 'Anak dan cucu' : 'Keluarga dan anak saudara', berat: 15, nilai: Math.round(anakCucu) },
    { nama: 'Kewangan hari tua', berat: 15, nilai: Math.round(kewangan) },
    { nama: 'Kesihatan', berat: 15, nilai: Math.round(kesihatan) },
    { nama: 'Keluarga besar dan kawan', berat: 10, nilai: Math.round(keluarga) },
    { nama: 'Impian tercapai', berat: 10, nilai: Math.round(impian) },
    { nama: 'Penyesalan', berat: 10, nilai: Math.round(penyesalan) },
  ];
  if (g.flag.adilGagal) {
    komponen[0].nilai = Math.max(0, komponen[0].nilai - 20);
    komponen[1].nilai = Math.max(0, komponen[1].nilai - 12);
  }
  const skor = Math.round(komponen.reduce((a, k) => a + (k.nilai * k.berat) / 100, 0));
  // gelaran lucu
  let gelaran = 'Pejuang Hari Tua';
  const st = g.stat;
  if (g.rel === 'bujang' && skor >= 60) gelaran = 'Bujang Senang Hati';
  else if (berkahwin && st.maaf >= 7 && g.meter.kasih >= 65) gelaran = 'Pasangan Rendang Abadi';
  else if (st.gaduh >= 25) gelaran = 'Pakar Perang Dingin';
  else if (st.kenduri >= 25000) gelaran = 'Maharaja Kenduri';
  else if (g.flag.bajetHujung >= 6 || g.duit.hutang > g.gaji * 18) gelaran = 'Raja Bajet Akhir Bulan';
  else if (st.maaf >= 5) gelaran = 'Tukang Pujuk Bertauliah';
  else if (g.rel === 'bercerai' && skor >= 55) gelaran = 'Penyintas Berdikari';
  else if (g.flag.orangTengah) gelaran = 'Penyelamat Rumah Tangga';
  else if (s.reputasi >= 75) gelaran = 'Ketua Group WhatsApp Keluarga';
  else if (g.anak.length >= 3) gelaran = 'Ketua Pasukan Bola Sepak Sendiri';
  else if (skor >= 75) gelaran = 'Hidup Sederhana, Hati Kaya';
  const rendah = [...komponen].sort((a, b) => a.nilai - b.nilai)[0].nama;
  const nasihatMap: Record<string, string> = {
    'Hubungan dengan pasangan': 'Dengar dulu sebelum menjawab. Pasangan awak bukan lawan; masalah tu lawan korang berdua.',
    'Damai dengan diri': 'Maafkan diri sendiri. Awak buat yang terbaik dengan apa yang awak tahu masa tu.',
    'Anak dan cucu': 'Masa dengan anak tak boleh dibeli semula. Tutup laptop tu lebih awal.',
    'Keluarga dan anak saudara': 'Tak ada anak pun, awak masih boleh jadi tempat orang pulang. Hubungi mereka.',
    'Kewangan hari tua': 'Simpan awal-awal. KWSP bukan duit raya. Jangan terlalu bergantung pada nasib.',
    'Kesihatan': 'Badan awak bukan kereta sewa. Tidur cukup, jalan kaki, dan pergi buat pemeriksaan.',
    'Keluarga besar dan kawan': 'Telefon mak, telefon kawan lama. Group WhatsApp tak cukup.',
    'Impian tercapai': 'Impian tak datang sendiri. Mulakan dengan satu langkah kecil, hari ini.',
    'Penyesalan': 'Janji yang awak buat, tunaikan. Peluang yang lalu jangan dikenang lama, ambil yang depan mata.',
  };
  const nasihat = nasihatMap[rendah] ?? 'Terima kasih atas perjalanan ini. Hidup tak sempurna, tapi masih manis.';
  return { skor, komponen, gelaran, nasihat };
}

// ---------------- Mood & kemajuan ----------------
export function moodPasangan(g: Game): 'gembira' | 'biasa' | 'sedih' | 'marah' | 'cemas' {
  if (g.sembunyi.luka > 60 && g.meter.kasih < 45) return 'marah';
  if (g.meter.stres > 70) return 'cemas';
  if (g.meter.kasih < 35) return 'sedih';
  if (g.meter.kasih > 65 && g.meter.stres < 50) return 'gembira';
  return 'biasa';
}

export function moodPemain(g: Game): 'gembira' | 'biasa' | 'sedih' | 'marah' | 'cemas' {
  if (g.meter.stres > 75) return 'cemas';
  if (g.meter.stres < 35) return 'gembira';
  if (g.meter.kasih < 30 && adaPasangan(g)) return 'sedih';
  return 'biasa';
}

// ---------------- Hook mini-game ----------------
export function kesanMini(g: Game, c: Content, id: string, skor: number): Kesan {
  if (id === 'tawar_hantaran') {
    const asas = hantaranAsas(g, c);
    // skor 1 = baik untuk pemain
    const hantar = g.w.jantina === 'lelaki' ? asas * (1.3 - 0.5 * skor) : asas * (0.8 + 0.5 * skor);
    const hf = bulat(hantar, 100);
    g.flag.hantaran = hf;
    g.stat.hantaran = hf;
    if (g.w.jantina === 'lelaki') return { tunai: -hf, flag: { hantaranDiputuskan: true } };
    return { tunai: Math.round(hf * 0.6), flag: { hantaranDiputuskan: true } };
  }
  if (id === 'bajet_bulan') {
    return skor >= 0.66 ? { simpanan: Math.round(g.gaji * 0.15), stres: -4 } : skor >= 0.33 ? { stres: 1 } : { hutang: Math.round(g.gaji * 0.2), stres: 6, flag: { bajetHujung: '+1' } };
  }
  return {};
}

export function serialize(g: Game): string {
  return JSON.stringify(g);
}

export function pulihSnapshot(g: Game): Game | null {
  if (!g.snapshot || g.undurGuna) return null;
  const s = JSON.parse(g.snapshot) as Game;
  s.snapshot = g.snapshot;
  s.undurGuna = true;
  return s;
}

export function pilihCalon(g: Game, c: Content, calon: Pasangan) {
  // pasangan baharu bermakna peristiwa hubungan (fasa 2 hingga 4) boleh berulang dengan orang lain
  for (const id of Object.keys(g.lihat)) if (/^p[234]_/.test(id)) { delete g.lihat[id]; delete g.lihatIdx[id]; }
  for (const f of ['hantaran', 'hantaranDiputuskan', 'kenduriBesar', 'kenduriJenis', 'pinjamanKenduri', 'seriusDipilih', 'mintaMasa', 'tarikh', 'hutangPDedah', 'kawal1', 'kawal2', 'kawal3', 'kawal4', 'kawal5', 'tandaAmaran', 'tinggalDecide', 'pagiPertama', 'kahwinBulan', 'pembawa']) delete g.flag[f];
  g.stat.hantaran = 0;
  g.p = calon;
  g.pasanganBil += 2;
  g.rel = 'bercinta';
  g.meter.kasih = 55;
  g.meter.percaya = 50;
  g.sembunyi.luka = 0;
  g.sembunyi.mertua = 50;
  g.memori = [];
  g.chat.pasangan = [];
  if (calon.agama !== 'islam') {
    g.flag.bezaAgama = true;
    delete g.flag.bezaSelesai;
    delete g.flag.mintaMasaAgama;
    delete g.flag.bezaTertunggak;
  } else {
    delete g.flag.bezaAgama;
  }
  tambahChat(g, 'pasangan', 'pasangan', `Hai ${g.w.nama} 😊 Terima kasih sudi berkenalan.`);
  catatAlbum(g, c, `Mula berkenalan dengan ${calon.nama}.`, '💞');
  gantiFasa(g, 2);
}
