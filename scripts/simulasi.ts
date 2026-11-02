// Simulasi tanpa kepala: main ribuan permainan rawak untuk mencari jalan buntu, ralat dan ketidakseimbangan.
import { muatKandungan } from './muat';
import {
  baruGame, catatLihat, janaCalon, kesanMini, pilihCalon, pilihNext, pilihSoalan, selesaikan, pilihanBolehDipilih,
  apply, tick, kiraTamat, umur, fmt, rawak, tarikh,
} from '../src/engine';
import { hasilPergaduhan, kesanBaikan, mulaPergaduhan, pilihBaikan, pusinganPergaduhan } from '../src/pergaduhan';
import { Rng } from '../src/rng';
import type { Game, Mod } from '../src/types';

const c = muatKandungan();
const N = Number(process.argv[2] ?? 200);
const negeri = Object.keys(c.harga.negeri);
const stat = { tamat: 0, buntu: 0, pengisi: 0, umurAkhir: [] as number[], skor: [] as number[], bercerai: 0, bujang: 0, kahwin: 0, langkah: [] as number[], hutangMax: 0, tersangkut: 0, gelaran: {} as Record<string, number> };
const rasio: number[] = []; const harta: number[] = [];
const lihatSemua: Record<string, number> = {};
const fasaCount: Record<number, number> = {};

function main(i: number): Game | null {
  const r = new Rng(i * 7919 + 13);
  const mods: Mod[] = ['santai', 'realistik', 'cabaran'];
  const g = baruGame(c, {
    seed: 'SIM-' + i, mod: r.pick(mods), dewasa: r.chance(0.7), sensitif: r.chance(0.8),
    w: {
      nama: 'Pemain', jantina: r.pick(['lelaki', 'perempuan'] as const), asal: r.pick(['bandar', 'kampung'] as const), negeri: r.pick(negeri),
      pendidikan: r.pick(['spm', 'diploma', 'ijazah'] as const), kerjaya: r.pick(['kerajaan', 'swasta', 'gig', 'niaga'] as const),
      susunan: r.pick(['sulung', 'tengah', 'bongsu'] as const), ibuBapa: r.pick(['sihat', 'uzur'] as const), adikBeradik: r.pick(['sikit', 'ramai'] as const),
      sifat: r.shuffle(c.sifat.semua).slice(0, 2),
    },
  });
  let langkah = 0;
  while (!g.tamat && langkah < 800) {
    langkah++;
    const ev = pilihNext(g, c);
    catatLihat(g, ev);
    lihatSemua[ev.id] = (lihatSemua[ev.id] || 0) + 1;
    fasaCount[g.fasa] = (fasaCount[g.fasa] || 0) + 1;
    if (ev.id === 'pengisi') stat.pengisi++;
    const jenis = ev.jenis ?? 'biasa';
    try {
      if (jenis === 'pilihPasangan') {
        const calon = janaCalon(g, c);
        if (r.chance(0.8)) { pilihCalon(g, c, r.pick(calon)); tick(g, c, 1); }
        else { selesaikan(g, c, ev, { t: '', k: { fasa: 5, bulan: 48, flag: { pilihBujang: true } } }); }
      } else if (jenis === 'pergaduhan') {
        const pg = mulaPergaduhan(g, c);
        for (let k = 0; k < 3; k++) pusinganPergaduhan(g, c, pg, r.pick(pg.pilihan));
        hasilPergaduhan(g, c, pg);
        const b = r.pick(pilihBaikan(g, pg));
        const { k } = kesanBaikan(g, b.id, rawak(g));
        apply(g, c, k);
        tick(g, c, 1);
      } else if (jenis === 'ujian') {
        const q = pilihSoalan(g, c);
        const ok = q.pilihan.filter((p) => pilihanBolehDipilih(g, p));
        selesaikan(g, c, ev, r.pick(ok.length ? ok : q.pilihan));
      } else if (jenis === 'mini') {
        const skor = r.next();
        const ks = kesanMini(g, c, ev.mini!, skor);
        apply(g, c, ks);
        const tier = skor > 0.66 ? 'tinggi' : skor > 0.33 ? 'sederhana' : 'rendah';
        selesaikan(g, c, ev, ev.miniHasil![tier]);
      } else if (jenis === 'penilaian') {
        g.tamat = kiraTamat(g, c);
      } else {
        const ok = (ev.pilihan ?? []).filter((p) => pilihanBolehDipilih(g, p));
        if (!ok.length) throw new Error(`tiada pilihan boleh dipilih: ${ev.id}`);
        selesaikan(g, c, ev, r.pick(ok));
      }
      fmt(g, c, ev.teks[0]);
    } catch (e: any) {
      console.error(`SIM ${i} ralat pada ${ev.id} (fasa ${g.fasa}, rel ${g.rel}):`, e.message);
      return null;
    }
    stat.hutangMax = Math.max(stat.hutangMax, g.duit.hutang);
    if (umur(g) > 110) break;
  }
  stat.langkah.push(langkah);
  return g;
}

for (let i = 0; i < N; i++) {
  const g = main(i);
  if (!g) { stat.buntu++; continue; }
  if (g.tamat) {
    stat.tamat++;
    stat.skor.push(g.tamat.skor);
    stat.gelaran[g.tamat.gelaran] = (stat.gelaran[g.tamat.gelaran] || 0) + 1;
  } else stat.buntu++;
  stat.umurAkhir.push(umur(g)); rasio.push(g.duit.hutang / g.gaji); harta.push(g.duit.kwsp + g.duit.simpanan - g.duit.hutang);
  if (g.rel === 'bercinta' || g.rel === 'bertunang') { stat.tersangkut = (stat.tersangkut || 0) + 1; console.log('TERSANGKUT', i, g.rel, g.fasa, JSON.stringify(g.flag)); }
  if (g.rel === 'bercerai') stat.bercerai++;
  else if (g.rel === 'bujang') stat.bujang++;
  else stat.kahwin++;
}
const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / (a.length || 1)).toFixed(1);
console.log(`Permainan: ${N} | tamat: ${stat.tamat} | tersekat/ralat: ${stat.buntu}`);
console.log(`Langkah purata: ${avg(stat.langkah)} | umur akhir purata: ${avg(stat.umurAkhir)} | skor purata: ${avg(stat.skor)} (min ${Math.min(...stat.skor)}, maks ${Math.max(...stat.skor)})`);
console.log(`Akhir rel: berkahwin/lain ${stat.kahwin}, bercerai ${stat.bercerai}, bujang ${stat.bujang}`);
console.log('Tersangkut (rel bercinta/bertunang di akhir):', stat.tersangkut);
console.log(`Peristiwa pengisi digunakan: ${stat.pengisi} | hutang maks: ${Math.round(stat.hutangMax)}`);
const pc = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)];
console.log('hutang/gaji p10,p50,p90:', [0.1, 0.5, 0.9].map((p) => pc(rasio, p).toFixed(1)).join(' '), '| harta bersih p10,p50,p90:', [0.1, 0.5, 0.9].map((p) => Math.round(pc(harta, p))).join(' '));
console.log('Gelaran:', stat.gelaran);
console.log('Langkah per fasa:', fasaCount);
const tak = Object.keys(c.peristiwa.map((e) => e.id).reduce((o, id) => ({ ...o, [id]: 1 }), {})).filter((id) => !lihatSemua[id]);
console.log('Kekerapan:', ['p6_ikhtiar_anak','p6_cuba','p6_hamil','p6_bersalin','p6_pantang','p6_cuti_bersalin','p6_rawatan','ujian_cerai','cerai_proses','cerai_selepas','rujuk','p7_besar','p8_besar','p8_penilaian','pergaduhan_auto','ujian_soalan','p5_besar','p7_ibubapa_uzur'].map(k=>k+'='+(lihatSemua[k]||0)).join(' '));
console.log(`Peristiwa tidak pernah muncul (${tak.length}):`, tak.join(', '));
void tarikh;
