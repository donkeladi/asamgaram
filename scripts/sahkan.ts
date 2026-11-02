// Pengesah kandungan: jalankan dengan `npm run sahkan`. Gagal (exit 1) jika ada ralat.
import { muatKandungan } from './muat';
import { vars, ungkap } from '../src/engine';
import type { Kesan, Pilihan, Peristiwa } from '../src/types';

const c = muatKandungan();
const ralat: string[] = [];
const amaran: string[] = [];
const ids = new Set<string>();
const TOKEN = new Set(['nama','saya','negeri','negeriP','pasGelar','mak','anak','kerjaP','kerjaS','makanan','hantaran','kenduriBesar','kenduriSederhana','gaji','tunai','hutang','umur','tahun','ex','ivf','rawatan','hospital','bersalin','kereta','depositRumah','rumah','umrah','bisnes','cuti','sekolah','raya','bilAnak','mertuaSifat','ingatan','mertuaNama']);
const KESAN_KUNCI = new Set(['kasih','percaya','stres','mertua','ibubapa','anak','kesihatan','reputasi','luka','keintiman','kawan','tunai','hutang','simpanan','kwsp','gaji','flag','rel','fasa','mini','stat','catat','emoji','ingat','rumah','kereta','anakLahir','bulan','lompat','kerja','putus','pasanganBaru','tamat','ptptn','pasanganIslam']);
const SYARAT_KUNCI = new Set(['rel','jantina','asal','negeri','kerjaya','pendidikan','sifat','sifatP','mertua','umurMin','umurMax','flag','tiada','min','max','anakMin','anakMax','fasaMin','ibuBapa','tunaiMin','mod','bezaNegeri']);
const MINI = new Set(['tawar_hantaran','teka_mood','pujuk_merajuk','bajet_bulan','rombongan_raya','tidurkan_bayi','kuiz_pasangan','parking_kenduri','masak_mertua','hantar_anak']);
const UTAS = new Set(['pasangan','group','mak','kawan']);
const DUMMY: any = { w: { jantina: 'lelaki', negeri: 'Selangor' }, p: null, bulan: 0, gaji: 3000, duit: { tunai: 1, hutang: 1, simpanan: 1, kwsp: 1, ptptn: 1 }, flag: {}, anak: [], stat: {}, meter: {}, sembunyi: {} };

function teks(id: string, s: string | undefined) {
  if (!s) return;
  for (const m of s.matchAll(/\{(\w+)\}/g)) if (!TOKEN.has(m[1])) ralat.push(`${id}: token tak dikenali {${m[1]}}`);
}
function kesan(id: string, k: Kesan | undefined) {
  if (!k) return;
  for (const [key, v] of Object.entries(k)) {
    if (!KESAN_KUNCI.has(key)) ralat.push(`${id}: kunci kesan tak sah "${key}"`);
    if (typeof v === 'string' && !['rel','rumah','kereta','kerja','catat','emoji','ingat','mini'].includes(key) && !/^[+-]\d+$/.test(v)) {
      const s = v.replace(/^=/, '').replace(/\$(\w+)/g, (_, n) => ((vars(DUMMY, c) as any)[n] === undefined ? 'XX' : '1'));
      if (!/^[\d\s+\-*/().]+$/.test(s)) ralat.push(`${id}: ungkapan tak sah "${v}" pada ${key}`);
    }
    if (key === 'stat' && v) for (const [sk, sv] of Object.entries(v as any)) if (typeof sv === 'string') { const s = (sv as string).replace(/\$(\w+)/g, '1'); if (!/^[\d\s+\-*/().]+$/.test(s)) ralat.push(`${id}: stat ungkapan tak sah`); }
  }
  teks(id, k.catat); teks(id, k.ingat);
}
function syarat(id: string, s: any) {
  if (!s) return;
  for (const key of Object.keys(s)) if (!SYARAT_KUNCI.has(key)) ralat.push(`${id}: kunci syarat tak sah "${key}"`);
}
function pilihan(id: string, p: Pilihan) {
  if (!p.t && p.t !== '') ralat.push(`${id}: pilihan tanpa teks`);
  teks(id, p.t); teks(id, p.h);
  kesan(id, p.k);
  syarat(id, p.syarat);
  if (p.ikut) for (const [k, kk] of Object.entries(p.ikut)) { if (!/^[psmjrf]:/.test(k)) ralat.push(`${id}: kunci ikut tak sah ${k}`); kesan(id, kk); }
  if (p.rawak) { for (const b of [p.rawak.ya, p.rawak.tidak] as any[]) { const { h, ...r } = b; teks(id, h); kesan(id, r); } }
}

for (const e of c.peristiwa as Peristiwa[]) {
  if (ids.has(e.id)) ralat.push(`id berganda: ${e.id}`);
  ids.add(e.id);
  if (!e.fasa?.length) ralat.push(`${e.id}: tiada fasa`);
  if (!e.teks?.length) ralat.push(`${e.id}: tiada teks`);
  e.teks.forEach((t) => teks(e.id, t));
  teks(e.id, e.tajuk);
  syarat(e.id, e.syarat);
  const jenis = e.jenis ?? 'biasa';
  const pil = e.pilihan ?? [];
  if (jenis === 'biasa') {
    if (!pil.length) ralat.push(`${e.id}: peristiwa biasa perlu pilihan`);
    if (pil.length > 4) ralat.push(`${e.id}: lebih 4 pilihan (${pil.length}); prinsip satu ibu jari`);
  }
  if (jenis === 'mini') {
    if (!e.mini || !MINI.has(e.mini)) ralat.push(`${e.id}: mini tak sah`);
    if (!e.miniHasil) ralat.push(`${e.id}: miniHasil tiada`);
    else for (const t of ['tinggi', 'sederhana', 'rendah'] as const) { teks(e.id, e.miniHasil[t]?.h); kesan(e.id, e.miniHasil[t]?.k); }
  }
  if (e.utas && !UTAS.has(e.utas)) ralat.push(`${e.id}: utas tak sah ${e.utas}`);
  for (const ch of e.chat ?? []) teks(e.id, ch.t);
  pil.forEach((p) => pilihan(e.id, p));
  if (e.pilihan?.some((p) => (p as any).seterusnya)) ralat.push(`${e.id}: seterusnya mesti di peringkat peristiwa`);
}
for (const e of c.peristiwa) {
  if (e.seterusnya && !ids.has(e.seterusnya)) ralat.push(`${e.id}: seterusnya "${e.seterusnya}" tidak wujud`);
}
for (const q of c.soalan) { q.pilihan.forEach((p) => pilihan('soalan:' + q.id, p)); if (q.pilihan.length > 4) ralat.push(`soalan:${q.id}: >4 pilihan`); syarat('soalan:' + q.id, (q as any).syarat); }
for (const p of c.pergaduhan) { teks('pg:' + p.id, p.teks); syarat('pg:' + p.id, p.syarat); }
for (const need of ['pengisi', 'ujian_cerai', 'p8_penilaian', 'p1_besar']) if (!ids.has(need)) ralat.push(`peristiwa wajib tiada: ${need}`);

// liputan fasa
const per: Record<number, number> = {};
for (const e of c.peristiwa) for (const f of e.fasa) per[f] = (per[f] || 0) + 1;
console.log('Jumlah peristiwa:', c.peristiwa.length, '| soalan:', c.soalan.length, '| pencetus gaduh:', c.pergaduhan.length);
console.log('Mengikut fasa:', per);
amaran.forEach((a) => console.warn('AMARAN', a));
if (ralat.length) {
  ralat.forEach((r) => console.error('RALAT', r));
  console.error(`\n${ralat.length} ralat.`);
  process.exit(1);
}
void ungkap;
console.log('Kandungan sah.');
