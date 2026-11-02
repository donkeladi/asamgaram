// 10 mini-game untuk memecahkan rutin. Setiap satu memulangkan skor 0..1.
import { avatar } from './avatar';
import { belanjaBulanan, hantaranAsas, rm } from './engine';
import { hash, Rng } from './rng';
import type { Content, Game } from './types';

export interface MiniCtx { g: Game; c: Content }

export const MINI_INFO: Record<string, { tajuk: string; cara: string }> = {
  tawar_hantaran: { tajuk: 'Tawar hantaran', cara: 'Ketuk “Tawar!” tepat bila penunjuk berada dalam zon hijau. 3 pusingan. Makin tepat, makin baik hasil rundingan.' },
  teka_mood: { tajuk: 'Teka mood pasangan', cara: 'Lihat ekspresi dan mesej, pilih emoji mood yang betul dalam 5 saat. 3 pusingan.' },
  pujuk_merajuk: { tajuk: 'Pujuk merajuk', cara: 'Susun langkah pujuk dalam urutan yang betul. Ketuk langkah pertama dahulu, dan seterusnya.' },
  bajet_bulan: { tajuk: 'Bajet hujung bulan', cara: 'Duit tinggal sedikit. Pilih komitmen yang dibayar sebelum baki habis. Wajib dahulu, kemudian pilihan.' },
  rombongan_raya: { tajuk: 'Rombongan Raya', cara: 'Rancang laluan rumah saudara dengan masa 8 jam dan minyak RM70. Rumah bertanda ❤ wajib dikunjungi.' },
  tidurkan_bayi: { tajuk: 'Tidurkan bayi', cara: 'Ketuk “Dodoh” mengikut rentak (bulatan membesar). Jangan sampai bayi menangis!' },
  kuiz_pasangan: { tajuk: 'Kuiz kenal pasangan', cara: 'Jawab soalan tentang pasangan berdasarkan apa yang awak perhatikan sejak awal.' },
  parking_kenduri: { tajuk: 'Parking kenduri', cara: 'Pandu kereta 🚗 ke petak parkir 🅿️ tanpa melanggar kereta lain. Langkah terhad. Guna butang atau kekunci anak panah.' },
  masak_mertua: { tajuk: 'Masak untuk mertua', cara: 'Pilih 3 bahan dan tahap masak. Mertua mempunyai citarasa tersendiri; perhatikan petunjuk.' },
  hantar_anak: { tajuk: 'Hantar anak ke sekolah', cara: 'Elak halangan di setiap lorong. Pilih lorong yang kosong sebelum masa tamat. Sampai sebelum loceng!' },
};

type Pembersih = () => void;

export function mainMini(id: string, host: HTMLElement, ctx: MiniCtx): Promise<number> {
  host.innerHTML = '';
  return new Promise((resolve) => {
    const bersih: Pembersih[] = [];
    let selesai = false;
    const tamat = (skor: number) => {
      if (selesai) return;
      selesai = true;
      bersih.forEach((f) => f());
      resolve(Math.max(0, Math.min(1, skor)));
    };
    const langkau = document.createElement('button');
    langkau.className = 'btn kecil sekunder mg-langkau';
    langkau.textContent = 'Langkau (hasil sederhana)';
    langkau.addEventListener('click', () => tamat(0.5));
    const kotak = document.createElement('div');
    kotak.className = 'mg-kotak';
    host.append(kotak, langkau);
    const fn = JOGO[id];
    if (!fn) return tamat(0.5);
    fn(kotak, ctx, tamat, bersih);
  });
}

type Jogo = (k: HTMLElement, ctx: MiniCtx, tamat: (s: number) => void, bersih: Pembersih[]) => void;
const R = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pilihR = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const tunda = (f: () => void, ms: number, bersih: Pembersih[]) => {
  const t = window.setTimeout(f, ms);
  bersih.push(() => clearTimeout(t));
};

// ---------- 1. Tawar hantaran ----------
const tawar: Jogo = (k, { g, c }, tamat, bersih) => {
  const asas = hantaranAsas(g, c);
  let ronde = 0;
  const skor: number[] = [];
  let pusat = 0.5;
  let lebar = 0.22;
  let kunci = false;
  k.innerHTML = `<div class="mg-info">Ronda <b id="r">1</b>/3 · Tawaran: <b id="tw">${rm(asas)}</b></div>
    <div class="mg-bar"><div class="mg-zon" id="zon"></div><div class="mg-pen" id="pen"></div></div>
    <button class="btn besar" id="tawar">Tawar!</button><p class="mg-msg" id="msg" aria-live="polite"></p>`;
  const zon = k.querySelector<HTMLElement>('#zon')!;
  const pen = k.querySelector<HTMLElement>('#pen')!;
  const msg = k.querySelector<HTMLElement>('#msg')!;
  const mulaRonde = () => {
    pusat = 0.25 + Math.random() * 0.5;
    lebar = 0.24 - ronde * 0.04;
    zon.style.left = `${(pusat - lebar / 2) * 100}%`;
    zon.style.width = `${lebar * 100}%`;
    k.querySelector('#r')!.textContent = String(ronde + 1);
    kunci = false;
  };
  const t0 = performance.now();
  let pos = 0;
  let raf = 0;
  const anim = (t: number) => {
    const s = 0.0018 + ronde * 0.0008;
    pos = 0.5 + 0.5 * Math.sin((t - t0) * s * 2);
    pen.style.left = `${pos * 100}%`;
    raf = requestAnimationFrame(anim);
  };
  raf = requestAnimationFrame(anim);
  bersih.push(() => cancelAnimationFrame(raf));
  let tawaran = asas;
  k.querySelector('#tawar')!.addEventListener('click', () => {
    if (kunci) return;
    kunci = true;
    const ralat = Math.abs(pos - pusat);
    const tepat = Math.max(0, 1 - Math.max(0, ralat - lebar / 2) / 0.3);
    skor.push(tepat);
    const arah = g.w.jantina === 'lelaki' ? -1 : 1;
    tawaran = Math.round((tawaran * (1 + arah * (tepat - 0.4) * 0.12)) / 100) * 100;
    k.querySelector('#tw')!.textContent = rm(tawaran);
    msg.textContent = tepat > 0.8 ? 'Tepat! Wakil keluarga angguk setuju.' : tepat > 0.4 ? 'Boleh tahan. Ada yang berbisik.' : 'Tersasar. Makcik di dapur menggeleng.';
    ronde++;
    if (ronde >= 3) tunda(() => tamat(skor.reduce((a, b) => a + b, 0) / 3), 900, bersih);
    else tunda(mulaRonde, 800, bersih);
  });
  mulaRonde();
};

// ---------- 2. Teka mood ----------
const MOOD: { id: 'gembira' | 'biasa' | 'sedih' | 'marah' | 'cemas'; e: string; n: string; msg: string[] }[] = [
  { id: 'gembira', e: '😄', n: 'Gembira', msg: ['“Eh, tahu tak apa jadi hari ni?!”', '“Saya belikan awak kuih!”'] },
  { id: 'biasa', e: '😐', n: 'Biasa', msg: ['“Hm.”', '“Nasi dah masak.”'] },
  { id: 'sedih', e: '😢', n: 'Sedih', msg: ['“Takpa… saya okay.”', '“Mak tak sihat tadi…”'] },
  { id: 'marah', e: '😠', n: 'Marah', msg: ['“Awak lambat. Lagi.”', '“Tak payah cakap apa-apa.”'] },
  { id: 'cemas', e: '😰', n: 'Cemas', msg: ['“Bos nak report esok pagi!”', '“Saya tak sempat siap semua…”'] },
];
const teka: Jogo = (k, { g }, tamat, bersih) => {
  let ronde = 0;
  let betul = 0;
  const p = g.p;
  const babak = () => {
    const m = pilihR(MOOD);
    const rupa = p?.rupa ?? g.w.rupa;
    const jantina = p?.jantina ?? g.w.jantina;
    k.innerHTML = `<div class="mg-info">Pusingan <b>${ronde + 1}</b>/3</div>
      <div class="mg-wajah">${avatar(rupa, jantina, m.id, 120, 'Pasangan')}<div class="gelembung">${pilihR(m.msg)}</div></div>
      <div class="mg-masa"><i></i></div>
      <div class="mg-pilih">${MOOD.map((x) => `<button class="btn kecil" data-m="${x.id}" aria-label="${x.n}">${x.e}</button>`).join('')}</div>`;
    const bar = k.querySelector<HTMLElement>('.mg-masa i')!;
    bar.style.transition = 'width 5s linear';
    requestAnimationFrame(() => (bar.style.width = '0%'));
    let tutup = false;
    const jawab = (idM: string | null) => {
      if (tutup) return;
      tutup = true;
      if (idM === m.id) betul++;
      ronde++;
      if (ronde >= 3) tamat(betul / 3);
      else tunda(babak, 350, bersih);
    };
    k.querySelectorAll<HTMLElement>('[data-m]').forEach((b) => b.addEventListener('click', () => jawab(b.dataset.m!)));
    tunda(() => jawab(null), 5000, bersih);
  };
  babak();
};

// ---------- 3. Pujuk merajuk ----------
const SET_PUJUK = [
  ['Beri dia ruang 10 minit', 'Minta maaf dengan ikhlas', 'Dengar tanpa menyampuk', 'Beri coklat kegemarannya'],
  ['Hantar mesej “Saya sayang awak”', 'Datang dengan teh panas', 'Mengaku di mana silap awak', 'Ajak keluar makan esok'],
];
const pujuk: Jogo = (k, _ctx, tamat) => {
  const betul = pilihR(SET_PUJUK);
  const susun = [...betul].sort(() => Math.random() - 0.5);
  let lang = 0;
  let salah = 0;
  const lukis = () => {
    k.innerHTML = `<div class="mg-info">Susun langkah (1 → 4). Salah: <b>${salah}</b></div>
      <ol class="mg-senarai">${betul.map((s, i) => `<li class="${i < lang ? 'siap' : ''}">${i < lang ? s : '…'}</li>`).join('')}</ol>
      <div class="mg-pilih lajur">${susun.map((s) => `<button class="btn" data-s="${s}" ${betul.indexOf(s) < lang ? 'disabled' : ''}>${s}</button>`).join('')}</div>`;
    k.querySelectorAll<HTMLElement>('[data-s]').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.s === betul[lang]) lang++;
        else salah++;
        if (lang >= 4) tamat(1 - salah * 0.25);
        else lukis();
      }),
    );
  };
  lukis();
};

// ---------- 4. Bajet hujung bulan ----------
const bajet: Jogo = (k, { g, c }, tamat) => {
  const b = belanjaBulanan(g, c);
  const wajib = b.baris.filter((x) => x.wajib).map((x) => ({ n: x.nama, a: Math.round(x.jumlah / 10) * 10, w: true, simpan: false }));
  const jumlahWajib = wajib.reduce((s, x) => s + x.a, 0);
  const extra = [
    { n: 'Simpanan', a: 200, w: false, simpan: true },
    { n: 'Makan luar', a: 120, w: false, simpan: false },
    { n: 'Langganan streaming', a: 45, w: false, simpan: false },
    { n: 'Beli-belah', a: 250, w: false, simpan: false },
    { n: 'Hadiah kecil', a: 80, w: false, simpan: false },
  ];
  const semua = [...wajib, ...extra];
  const pool = Math.round(jumlahWajib * 1.02 + 200);
  const pilih = new Set<number>();
  const lukis = () => {
    const guna = [...pilih].reduce((s, i) => s + semua[i].a, 0);
    const baki = pool - guna;
    k.innerHTML = `<div class="mg-info">Baki: <b class="${baki < 0 ? 'merah' : ''}">${rm(baki)}</b> / ${rm(pool)}</div>
      <div class="mg-pilih lajur">${semua.map((x, i) => `<button class="btn ${pilih.has(i) ? 'aktif' : 'sekunder'}" data-i="${i}" ${!pilih.has(i) && x.a > baki ? 'disabled' : ''}>${pilih.has(i) ? '✔ ' : ''}${x.n}${x.w ? ' <small>(wajib)</small>' : ''} · ${rm(x.a)}</button>`).join('')}</div>
      <button class="btn besar" id="ok">Sahkan bajet</button>`;
    k.querySelectorAll<HTMLElement>('[data-i]').forEach((el) =>
      el.addEventListener('click', () => {
        const i = Number(el.dataset.i);
        if (pilih.has(i)) pilih.delete(i);
        else pilih.add(i);
        lukis();
      }),
    );
    k.querySelector('#ok')!.addEventListener('click', () => {
      const w = wajib.filter((_, i) => pilih.has(i)).length / Math.max(1, wajib.length);
      const e = extra.filter((_, i) => pilih.has(wajib.length + i));
      const bonus = (e.some((x) => x.simpan) ? 0.2 : 0) + Math.min(0.2, e.filter((x) => !x.simpan).length * 0.1);
      tamat(w * 0.6 + bonus);
    });
  };
  lukis();
};

// ---------- 5. Rombongan raya ----------
const raya: Jogo = (k, _ctx, tamat) => {
  const rumah = [
    { n: 'Rumah Tok', j: 2, m: 15 }, { n: 'Rumah Mak Ngah', j: 1.5, m: 10 }, { n: 'Rumah Pak Long', j: 2, m: 18 },
    { n: 'Rumah kawan lama', j: 1, m: 8 }, { n: 'Rumah Makcik Kiah', j: 1.5, m: 12 }, { n: 'Rumah sepupu jauh', j: 3, m: 25 },
    { n: 'Rumah jiran', j: 0.5, m: 3 }, { n: 'Rumah saudara mertua', j: 2, m: 16 },
  ].map((x) => ({ ...x, p: false }));
  const idx = rumah.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 3);
  idx.forEach((i) => (rumah[i].p = true));
  const sel = new Set<number>();
  const lukis = () => {
    const j = [...sel].reduce((s, i) => s + rumah[i].j, 0);
    const m = [...sel].reduce((s, i) => s + rumah[i].m, 0);
    k.innerHTML = `<div class="mg-info">Masa: <b class="${j > 8 ? 'merah' : ''}">${j}/8 jam</b> · Minyak: <b class="${m > 70 ? 'merah' : ''}">RM${m}/70</b></div>
      <div class="mg-pilih lajur">${rumah.map((x, i) => `<button class="btn ${sel.has(i) ? 'aktif' : 'sekunder'}" data-i="${i}" ${!sel.has(i) && (j + x.j > 8 || m + x.m > 70) ? 'disabled' : ''}>${x.p ? '❤ ' : ''}${x.n} · ${x.j}j · RM${x.m}</button>`).join('')}</div>
      <button class="btn besar" id="ok">Gerak!</button>`;
    k.querySelectorAll<HTMLElement>('[data-i]').forEach((el) =>
      el.addEventListener('click', () => {
        const i = Number(el.dataset.i);
        if (sel.has(i)) sel.delete(i);
        else sel.add(i);
        lukis();
      }),
    );
    k.querySelector('#ok')!.addEventListener('click', () => {
      const pen = idx.filter((i) => sel.has(i)).length;
      tamat((pen / 3) * 0.7 + Math.min(1, sel.size / 5) * 0.3);
    });
  };
  lukis();
};

// ---------- 6. Tidurkan bayi ----------
const bayi: Jogo = (k, _ctx, tamat, bersih) => {
  const JUMLAH = 8;
  const SELANG = 950;
  let hit = 0;
  let digunakan = 0;
  const mula = performance.now() + 900;
  const dipakai = new Set<number>();
  k.innerHTML = `<div class="mg-info">Rentak: <b id="h">0</b>/${JUMLAH}</div>
    <div class="mg-bayi"><div class="mg-denyut" id="d"></div><div class="emoji" id="e">👶</div></div>
    <button class="btn besar" id="ketuk">Dodoh 🎵</button><p class="mg-msg" id="m" aria-live="polite"></p>`;
  const d = k.querySelector<HTMLElement>('#d')!;
  let raf = 0;
  const anim = (t: number) => {
    const fasa = (((t - mula) % SELANG) + SELANG) % SELANG;
    const dekat = Math.min(fasa, SELANG - fasa);
    d.style.transform = `scale(${0.6 + (1 - dekat / (SELANG / 2)) * 0.9})`;
    d.style.opacity = String(0.3 + (1 - dekat / (SELANG / 2)) * 0.7);
    raf = requestAnimationFrame(anim);
  };
  raf = requestAnimationFrame(anim);
  bersih.push(() => cancelAnimationFrame(raf));
  const ketuk = () => {
    const t = performance.now();
    const n = Math.round((t - mula) / SELANG);
    if (n < 0 || n >= JUMLAH || dipakai.has(n)) return;
    dipakai.add(n);
    digunakan++;
    const dt = Math.abs(t - (mula + n * SELANG));
    const m = k.querySelector('#m')!;
    if (dt < 230) {
      hit++;
      m.textContent = 'Lena…';
      k.querySelector('#e')!.textContent = '😴';
    } else {
      m.textContent = 'Hampir menangis!';
      k.querySelector('#e')!.textContent = '😭';
    }
    k.querySelector('#h')!.textContent = String(hit);
  };
  k.querySelector('#ketuk')!.addEventListener('click', ketuk);
  const kb = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); ketuk(); } };
  window.addEventListener('keydown', kb);
  bersih.push(() => window.removeEventListener('keydown', kb));
  tunda(() => tamat(hit / JUMLAH), 900 + SELANG * JUMLAH + 300, bersih);
  void digunakan;
};

// ---------- 7. Kuiz kenal pasangan ----------
const kuiz: Jogo = (k, { g, c }, tamat) => {
  const p = g.p;
  if (!p) return tamat(0.5);
  const lain = <T,>(a: T[], betul: T, n = 2): T[] => a.filter((x) => x !== betul).sort(() => Math.random() - 0.5).slice(0, n);
  const bkL: Record<string, string> = c.sifat.bk;
  const semuaKerja = Object.values(c.sifat.kerjaLabel).flat();
  const soalan = [
    { q: `Apa makanan kegemaran ${p.nama}?`, b: p.makanan, o: lain(c.sifat.makanan, p.makanan) },
    { q: `Apa “bahasa kasih sayang” ${p.nama}?`, b: bkL[p.bk], o: lain(Object.values(bkL), bkL[p.bk]) },
    { q: `Apa kerja ${p.nama}?`, b: p.kerjaLabel, o: lain(semuaKerja, p.kerjaLabel) },
    { q: `${p.nama} berasal dari negeri mana?`, b: p.negeri, o: lain(Object.keys(c.harga.negeri), p.negeri) },
    { q: `Siapa nama mak ${p.nama}?`, b: `Mak ${p.mertuaNama}`, o: lain(c.nama.mertua, p.mertuaNama).map((x) => `Mak ${x}`) },
  ].sort(() => Math.random() - 0.5).slice(0, 3);
  let i = 0;
  let betul = 0;
  const lukis = () => {
    const s = soalan[i];
    const opsyen = [s.b, ...s.o].sort(() => Math.random() - 0.5);
    k.innerHTML = `<div class="mg-info">Soalan <b>${i + 1}</b>/3</div><p class="mg-soal">${s.q}</p><div class="mg-pilih lajur">${opsyen.map((o) => `<button class="btn sekunder" data-o="${o}">${o}</button>`).join('')}</div>`;
    k.querySelectorAll<HTMLElement>('[data-o]').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.o === s.b) betul++;
        i++;
        if (i >= 3) tamat(betul / 3);
        else lukis();
      }),
    );
  };
  lukis();
};

// ---------- 8. Parking kenduri ----------
const parking: Jogo = (k, _ctx, tamat, bersih) => {
  const L = 5;
  const T = 6;
  const sasaranC = R(0, L - 1);
  const mulaC = R(0, L - 1);
  const laluan = new Set<string>();
  let [r, c] = [T - 1, mulaC];
  laluan.add(`${r},${c}`);
  const tengah = R(1, T - 2);
  while (r > tengah) { r--; laluan.add(`${r},${c}`); }
  while (c !== sasaranC) { c += c < sasaranC ? 1 : -1; laluan.add(`${r},${c}`); }
  while (r > 0) { r--; laluan.add(`${r},${c}`); }
  const optimum = laluan.size - 1;
  const halang = new Set<string>();
  for (let rr = 0; rr < T; rr++) for (let cc = 0; cc < L; cc++) if (!laluan.has(`${rr},${cc}`) && Math.random() < 0.45) halang.add(`${rr},${cc}`);
  let [pr, pc] = [T - 1, mulaC];
  let langkah = 0;
  const MAKS = optimum + 5;
  let langgar = 0;
  const lukis = (mesej = '') => {
    let g = '';
    for (let rr = 0; rr < T; rr++) for (let cc = 0; cc < L; cc++) {
      const kunci = `${rr},${cc}`;
      const isi = rr === pr && cc === pc ? '🚗' : rr === 0 && cc === sasaranC ? '🅿️' : halang.has(kunci) ? pilihR(['🚙', '🚐', '🛵']) : '';
      g += `<div class="mg-sel ${rr === 0 && cc === sasaranC ? 'sasaran' : ''}">${isi}</div>`;
    }
    k.innerHTML = `<div class="mg-info">Langkah: <b>${langkah}</b>/${MAKS} · Langgar: <b>${langgar}</b></div>
      <div class="mg-grid" style="grid-template-columns:repeat(${L},1fr)">${g}</div>
      <div class="mg-dpad"><button class="btn kecil" data-d="u" aria-label="Atas">▲</button><div><button class="btn kecil" data-d="l" aria-label="Kiri">◀</button><button class="btn kecil" data-d="d" aria-label="Bawah">▼</button><button class="btn kecil" data-d="r" aria-label="Kanan">▶</button></div></div>
      <p class="mg-msg" aria-live="polite">${mesej}</p>`;
    k.querySelectorAll<HTMLElement>('[data-d]').forEach((b) => b.addEventListener('click', () => gerak(b.dataset.d!)));
  };
  const gerak = (d: string) => {
    let [nr, nc] = [pr, pc];
    if (d === 'u') nr--; else if (d === 'd') nr++; else if (d === 'l') nc--; else nc++;
    langkah++;
    if (nr < 0 || nr >= T || nc < 0 || nc >= L) { lukis('Dinding!'); } else if (halang.has(`${nr},${nc}`)) { langgar++; lukis('Hampir langgar! Pak cik menjerit.'); } else {
      [pr, pc] = [nr, nc];
      if (pr === 0 && pc === sasaranC) {
        k.querySelector('.mg-msg');
        return tamat(Math.max(0.3, 1 - (langkah - optimum) * 0.12 - langgar * 0.15));
      }
      lukis();
    }
    if (langkah >= MAKS) tamat(0.1);
  };
  const kb = (e: KeyboardEvent) => {
    const m: Record<string, string> = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' };
    if (m[e.key]) { e.preventDefault(); gerak(m[e.key]); }
  };
  window.addEventListener('keydown', kb);
  bersih.push(() => window.removeEventListener('keydown', kb));
  lukis();
};

// ---------- 9. Masak untuk mertua ----------
const BAHAN = [
  { n: 'Cili api', t: ['pedas'] }, { n: 'Santan', t: ['santan'] }, { n: 'Kangkung', t: ['sayur'] }, { n: 'Ayam kampung', t: ['ayam'] },
  { n: 'Gula merah', t: ['manis'] }, { n: 'Garam lebih', t: ['masin'] }, { n: 'Serai & kunyit', t: ['herba'] }, { n: 'Ikan bilis', t: ['masin', 'ikan'] },
];
const masak: Jogo = (k, { g }, tamat) => {
  const r = new Rng(hash(g.seed + (g.p?.mertuaNama ?? 'mak')));
  const tags = ['pedas', 'santan', 'sayur', 'ayam', 'manis', 'masin', 'herba'];
  const susun = r.shuffle(tags);
  const suka = susun.slice(0, 2);
  const benci = susun[2];
  const masaPilih = r.int(2, 4);
  const sel = new Set<number>();
  let masa = 3;
  const petunjuk = `${g.p ? 'Mak ' + g.p.mertuaNama : 'Mertua'} selalu minta tambah yang ${suka[0]}, dan tak berapa gemar ${benci}.`;
  const lukis = () => {
    k.innerHTML = `<p class="mg-soal">${petunjuk}</p>
      <div class="mg-pilih">${BAHAN.map((b, i) => `<button class="btn kecil ${sel.has(i) ? 'aktif' : 'sekunder'}" data-i="${i}" ${!sel.has(i) && sel.size >= 3 ? 'disabled' : ''}>${b.n}</button>`).join('')}</div>
      <label class="mg-slider">Tahap masak: <input type="range" min="1" max="5" value="${masa}" id="masa"><span>${['mentah', 'separuh', 'sederhana', 'masak', 'garing'][masa - 1]}</span></label>
      <button class="btn besar" id="ok" ${sel.size === 3 ? '' : 'disabled'}>Hidang!</button>`;
    k.querySelectorAll<HTMLElement>('[data-i]').forEach((el) =>
      el.addEventListener('click', () => {
        const i = Number(el.dataset.i);
        if (sel.has(i)) sel.delete(i); else sel.add(i);
        lukis();
      }),
    );
    k.querySelector<HTMLInputElement>('#masa')!.addEventListener('input', (e) => { masa = Number((e.target as HTMLInputElement).value); (k.querySelector('.mg-slider span') as HTMLElement).textContent = ['mentah', 'separuh', 'sederhana', 'masak', 'garing'][masa - 1]; });
    k.querySelector('#ok')?.addEventListener('click', () => {
      let s = 0.3;
      const dipilih = [...sel].flatMap((i) => BAHAN[i].t);
      suka.forEach((t) => { if (dipilih.includes(t)) s += 0.25; });
      if (dipilih.includes(benci)) s -= 0.25;
      s += [0.2, 0.1, 0][Math.min(2, Math.abs(masa - masaPilih))];
      tamat(s);
    });
  };
  lukis();
};

// ---------- 10. Hantar anak ke sekolah ----------
const hantar: Jogo = (k, _ctx, tamat, bersih) => {
  const JUM = 8;
  let i = 0;
  let lulus = 0;
  const OBS = ['🕳️', '🚗', '🐕', '🚧'];
  const baris = () => {
    const blok = R(0, 2);
    const ob = pilihR(OBS);
    k.innerHTML = `<div class="mg-info">Jalan: <b>${i + 1}</b>/${JUM} 🏫</div>
      <div class="mg-masa"><i></i></div>
      <div class="mg-lorong">${[0, 1, 2].map((l) => `<button class="btn besar sekunder" data-l="${l}" aria-label="Lorong ${l + 1}">${l === blok ? ob : '⬆️'}</button>`).join('')}</div>`;
    const bar = k.querySelector<HTMLElement>('.mg-masa i')!;
    bar.style.transition = 'width 1.6s linear';
    requestAnimationFrame(() => (bar.style.width = '0%'));
    let tutup = false;
    const lalu = (l: number | null) => {
      if (tutup) return;
      tutup = true;
      if (l !== null && l !== blok) lulus++;
      i++;
      if (i >= JUM) tamat(lulus / JUM);
      else tunda(baris, 150, bersih);
    };
    k.querySelectorAll<HTMLElement>('[data-l]').forEach((b) => b.addEventListener('click', () => lalu(Number(b.dataset.l))));
    tunda(() => lalu(null), 1600, bersih);
  };
  baris();
};

const JOGO: Record<string, Jogo> = {
  tawar_hantaran: tawar, teka_mood: teka, pujuk_merajuk: pujuk, bajet_bulan: bajet, rombongan_raya: raya,
  tidurkan_bayi: bayi, kuiz_pasangan: kuiz, parking_kenduri: parking, masak_mertua: masak, hantar_anak: hantar,
};
