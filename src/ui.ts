// Antara muka Asam Garam: menu, pencipta watak, skrin permainan, chat, dompet, kalendar, salasilah, album, penilaian.
import { setBunyi, setMuzik, bunyi } from './audio';
import { avatar, rupaPantas, type Mood } from './avatar';
import { kandungan as C } from './data';
import {
  apply, baruGame, belanjaBulanan, catatLihat, fmt, gelarPasangan, janaCalon, kesanMini, kiraTamat, labelFasa, lompat,
  moodPasangan, moodPemain, pilihCalon, pilihNext, pilihSoalan, pilihanBolehDipilih, pulihSnapshot, rm, selesaikan, tarikh, tick, umur,
  umurAnak, type HasilPilihan,
} from './engine';
import { BAIKAN, hasilPergaduhan, kesanBaikan, kesanPanas, mulaPergaduhan, pilihBaikan, pusinganPergaduhan, type Pergaduhan, type Respons } from './pergaduhan';
import { kodDunia, hash } from './rng';
import { kadAkhir, kadFasa, kongsiGambar } from './share';
import { eksportFail, importFail, muatGame, muatTetapan, padamGame, simpanGame, simpanTetapan, type Tetapan } from './store';
import { MINI_INFO, mainMini } from './minigames';
import type { Game, Jantina, Mod, Pasangan, Peristiwa, Pilihan, Soalan } from './types';

// ---------- Keadaan UI ----------
type Layar = 'umur' | 'menu' | 'wizard' | 'main';
type Skrin = 'rumah' | 'chat' | 'dompet' | 'kalendar' | 'salasilah' | 'album';

interface Sesi {
  ev: Peristiwa;
  ti: number;
  langkah: 'amaran' | 'pilih' | 'hasil' | 'mini' | 'miniMain' | 'pg' | 'calon';
  pil?: Pilihan[];
  hasil?: HasilPilihan & { tambah?: string[]; fasaTamat?: number };
  soalan?: Soalan;
  calon?: Pasangan[];
  pg?: Pergaduhan;
  pgFasa?: 'respons' | 'hasil' | 'baikan';
  pgHasilTeks?: string;
  pgRespons?: string[];
  pgBaikan?: ReturnType<typeof pilihBaikan>;
  fasaLama: number;
  maksud?: string;
  miniKhas?: string;
}

interface Wiz {
  nama: string; jantina: Jantina; asal: 'bandar' | 'kampung'; negeri: string; pendidikan: 'spm' | 'diploma' | 'ijazah';
  kerjaya: 'kerajaan' | 'swasta' | 'gig' | 'niaga'; susunan: 'sulung' | 'tengah' | 'bongsu'; ibuBapa: 'sihat' | 'uzur';
  adikBeradik: 'sikit' | 'ramai'; sifat: string[]; kod: string; mod: Mod; rupaN: number;
}

const U = {
  layar: 'umur' as Layar,
  skrin: 'rumah' as Skrin,
  g: null as Game | null,
  set: muatTetapan(),
  sesi: null as Sesi | null,
  lapis: '' as '' | 'tetapan' | 'bantuan' | 'rekap' | 'kredit',
  utas: 'pasangan',
  flash: null as null | { kasih: number; percaya: number; stres: number; duit: number },
  wiz: null as Wiz | null,
  rekap: null as null | { tajuk: string; baris: string[]; fasa?: number },
  mesej: '',
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
const T = (g: Game, s: string) => esc(fmt(g, C, s));

export function terapkanTetapan() {
  const r = document.documentElement;
  r.dataset.teks = String(U.set.teks);
  if (U.set.gelap === null) delete r.dataset.tema;
  else r.dataset.tema = U.set.gelap ? 'gelap' : 'cerah';
  setBunyi(U.set.bunyi);
}

// ---------- Mula ----------
export function mulaUi() {
  terapkanTetapan();
  U.layar = U.set.umurSah ? 'menu' : 'umur';
  document.addEventListener('click', onKlik);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  render();
}

function simpan() {
  if (U.g && !simpanGame(U.g)) U.mesej = 'Simpanan automatik gagal (storan penuh/ditolak). Gunakan Eksport simpanan di Tetapan.';
}

// ---------- Render induk ----------
function render() {
  const app = $('#app')!;
  let html = '';
  switch (U.layar) {
    case 'umur': html = layarUmur(); break;
    case 'menu': html = layarMenu(); break;
    case 'wizard': html = layarWizard(); break;
    case 'main': html = layarMain(); break;
  }
  app.innerHTML = html + lapisHTML();
  if (U.layar === 'main') pascaRender();
}

function layarUmur(): string {
  return `<div class="tengah kad-besar"><div class="logo">🌶️</div><h1>Asam Garam</h1>
    <p class="sub">Simulator rumah tangga Malaysia</p>
    <p>Game ini mengandungi tema dewasa: perkahwinan, keintiman (tidak eksplisit), poligami, keguguran, perceraian dan keganasan rumah tangga (sebagai kisah amaran). Ia ditujukan untuk umur <b>18 tahun ke atas</b>.</p>
    <button class="btn besar" data-act="umurSah">Saya berumur 18 tahun ke atas</button>
    <p class="kecil"><a href="https://www.google.com" rel="noreferrer">Saya belum 18 tahun, keluar</a></p></div>`;
}

function layarMenu(): string {
  const ada = !!muatGame();
  return `<div class="tengah kad-besar"><div class="logo">🌶️</div><h1>Asam Garam</h1>
    <p class="sub">Hidup bujang hingga hari tua. Setiap keputusan kecil membentuk rumah tangga awak.</p>
    <div class="menu-btn">
      ${ada ? '<button class="btn besar" data-act="sambung">▶ Sambung</button>' : ''}
      <button class="btn ${ada ? 'sekunder' : 'besar'}" data-act="baru">✨ Permainan baharu</button>
      <label class="btn sekunder fail">📂 Import simpanan<input type="file" accept="application/json" data-act-fail="import" hidden></label>
      <button class="btn sekunder" data-act="tetapan">⚙️ Tetapan</button>
      <button class="btn sekunder" data-act="bantuan">🆘 Bantuan & talian kasih</button>
      <button class="btn sekunder" data-act="kredit">ℹ️ Tentang</button>
    </div>
    <p class="kecil">Sumber terbuka · percuma · tiada iklan · simpanan dalam peranti anda sahaja</p></div>`;
}

// ---------- Wizard watak ----------
const NEGERI = Object.keys(C.harga.negeri);
function wizAsal(): Wiz {
  const n = Math.floor(Math.random() * 1000);
  return { nama: '', jantina: 'perempuan', asal: 'bandar', negeri: 'Selangor', pendidikan: 'diploma', kerjaya: 'swasta', susunan: 'tengah', ibuBapa: 'sihat', adikBeradik: 'sikit', sifat: [], kod: kodDunia(), mod: U.set.mod, rupaN: n };
}
const chip = (act: string, k: string, v: string, label: string, aktif: boolean, mati = false) =>
  `<button type="button" class="chip ${aktif ? 'aktif' : ''}" data-act="${act}" data-k="${k}" data-v="${v}" ${mati ? 'disabled' : ''} aria-pressed="${aktif}">${label}</button>`;

function layarWizard(): string {
  const w = U.wiz!;
  const sifat = C.sifat.semua;
  return `<div class="wizard"><button class="btn kecil sekunder" data-act="menu">← Kembali</button>
    <h2>Cipta watak</h2>
    <div class="pratonton">${avatar(rupaPantas(w.rupaN, w.jantina), w.jantina, 'gembira', 120, 'Pratonton')}<button class="btn kecil sekunder" data-act="rupa">🎲 Tukar rupa</button></div>
    <label class="f">Nama<input id="wNama" value="${esc(w.nama)}" maxlength="16" placeholder="${w.jantina === 'lelaki' ? 'cth. Aiman' : 'cth. Aisyah'}"></label>
    <div class="f">Jantina<div class="chips">${chip('w', 'jantina', 'lelaki', 'Lelaki', w.jantina === 'lelaki')}${chip('w', 'jantina', 'perempuan', 'Perempuan', w.jantina === 'perempuan')}</div></div>
    <div class="f">Agama<div class="chips">${chip('w', 'agama', 'islam', 'Islam', true)}<button class="chip" disabled>Lain-lain (akan datang)</button></div>
      <small>Versi pertama: laluan Melayu-Muslim dengan adat Melayu sahaja.</small></div>
    <div class="f">Asal<div class="chips">${chip('w', 'asal', 'bandar', 'Bandar (Klang Valley)', w.asal === 'bandar')}${chip('w', 'asal', 'kampung', 'Pekan / kampung', w.asal === 'kampung')}</div></div>
    <label class="f">Negeri<select id="wNegeri">${NEGERI.map((n) => `<option ${n === w.negeri ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="f">Pendidikan<div class="chips">${(['spm', 'diploma', 'ijazah'] as const).map((p) => chip('w', 'pendidikan', p, p.toUpperCase() === 'SPM' ? 'SPM' : p[0].toUpperCase() + p.slice(1), w.pendidikan === p)).join('')}</div></div>
    <div class="f">Kerjaya<div class="chips">${chip('w', 'kerjaya', 'kerajaan', 'Kerajaan', w.kerjaya === 'kerajaan')}${chip('w', 'kerjaya', 'swasta', 'Swasta', w.kerjaya === 'swasta')}${chip('w', 'kerjaya', 'gig', 'Gig (rider/e-hailing)', w.kerjaya === 'gig')}${chip('w', 'kerjaya', 'niaga', 'Niaga sendiri', w.kerjaya === 'niaga')}</div></div>
    <div class="f">Keluarga<div class="chips">${chip('w', 'susunan', 'sulung', 'Anak sulung', w.susunan === 'sulung')}${chip('w', 'susunan', 'tengah', 'Anak tengah', w.susunan === 'tengah')}${chip('w', 'susunan', 'bongsu', 'Anak bongsu', w.susunan === 'bongsu')}</div>
      <div class="chips">${chip('w', 'ibuBapa', 'sihat', 'Ibu bapa sihat', w.ibuBapa === 'sihat')}${chip('w', 'ibuBapa', 'uzur', 'Ibu bapa uzur', w.ibuBapa === 'uzur')}</div>
      <div class="chips">${chip('w', 'adikBeradik', 'sikit', 'Adik-beradik sikit', w.adikBeradik === 'sikit')}${chip('w', 'adikBeradik', 'ramai', 'Adik-beradik ramai', w.adikBeradik === 'ramai')}</div></div>
    <div class="f">Pilih 2 sifat<div class="chips">${sifat.map((s) => chip('wsifat', 'sifat', s, s, w.sifat.includes(s), !w.sifat.includes(s) && w.sifat.length >= 2)).join('')}</div></div>
    <div class="f">Mod permainan<div class="chips">${chip('w', 'mod', 'santai', 'Santai', w.mod === 'santai')}${chip('w', 'mod', 'realistik', 'Realistik', w.mod === 'realistik')}${chip('w', 'mod', 'cabaran', 'Cabaran', w.mod === 'cabaran')}</div>
      <small>${w.mod === 'santai' ? 'Tiada kematian atau tragedi berat; boleh undur sekali setiap fasa.' : w.mod === 'realistik' ? 'Semua kemungkinan hidup boleh berlaku.' : 'Gaji rendah, hutang tinggi, stres bermula tinggi.'}</small></div>
    <label class="f">Kod dunia <small>(kongsi supaya kawan main dunia yang sama)</small><span class="baris"><input id="wKod" value="${esc(w.kod)}" maxlength="12"><button type="button" class="btn kecil sekunder" data-act="kodBaru">🎲</button></span></label>
    <label class="f semak"><input type="checkbox" id="wDewasa" ${U.set.dewasa ? 'checked' : ''}> Benarkan kandungan dewasa (18+, tidak eksplisit)</label>
    <label class="f semak"><input type="checkbox" id="wSensitif" ${U.set.sensitif ? 'checked' : ''}> Benarkan tema sensitif (keguguran, keganasan rumah tangga sebagai kisah amaran)</label>
    <button class="btn besar" data-act="mulaMain" ${w.sifat.length === 2 && w.nama.trim() ? '' : 'disabled'}>Mulakan hidup! 🌶️</button>
    ${w.sifat.length === 2 && w.nama.trim() ? '' : '<small class="amaran-teks">Isi nama dan pilih tepat 2 sifat untuk bermula.</small>'}</div>`;
}

// ---------- Skrin permainan ----------
const NAV: { id: Skrin; ikon: string; n: string }[] = [
  { id: 'rumah', ikon: '🏠', n: 'Rumah' }, { id: 'chat', ikon: '💬', n: 'Chat' }, { id: 'dompet', ikon: '👛', n: 'Dompet' },
  { id: 'kalendar', ikon: '📅', n: 'Kalendar' }, { id: 'salasilah', ikon: '👪', n: 'Salasilah' }, { id: 'album', ikon: '🖼️', n: 'Album' },
];

function pips(n: number, buruk = false) {
  return `<span class="pips ${buruk ? 'buruk' : ''}" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}
function tahap(v: number) { return Math.max(1, Math.min(5, Math.ceil(v / 20))); }
function tahapDuit(g: Game) {
  const net = g.duit.tunai + g.duit.simpanan - g.duit.hutang;
  const r = net / Math.max(1500, g.gaji * 3);
  return r < 0 ? 1 : r < 0.5 ? 2 : r < 1.5 ? 3 : r < 3 ? 4 : 5;
}

function meterHTML(g: Game): string {
  const f = U.flash;
  const tanda = (d: number, baik: boolean) => (Math.abs(d) < 2 ? '' : `<span class="flash ${(d > 0) === baik ? 'baik' : 'buruk'}" aria-hidden="true">${d > 0 ? '▲' : '▼'}</span>`);
  const dis = adaPasangan(g);
  return `<div class="meter" role="group" aria-label="Meter">
    ${dis ? `<div class="m" title="Kasih sayang"><span class="ik">❤️</span>${pips(tahap(g.meter.kasih))}${f ? tanda(f.kasih, true) : ''}<span class="sr">Kasih sayang ${tahap(g.meter.kasih)} daripada 5</span></div>
    <div class="m" title="Kepercayaan"><span class="ik">🤝</span>${pips(tahap(g.meter.percaya))}${f ? tanda(f.percaya, true) : ''}<span class="sr">Kepercayaan ${tahap(g.meter.percaya)} daripada 5</span></div>` : ''}
    <div class="m" title="Kewangan"><span class="ik">💰</span>${pips(tahapDuit(g))}${f ? tanda(f.duit / 100, true) : ''}<span class="sr">Kewangan ${tahapDuit(g)} daripada 5</span></div>
    <div class="m" title="Stres"><span class="ik">😵‍💫</span>${pips(tahap(g.meter.stres), true)}${f ? tanda(f.stres, false) : ''}<span class="sr">Stres ${tahap(g.meter.stres)} daripada 5</span></div></div>`;
}

function adaPasangan(g: Game) { return !!g.p && (g.rel === 'bercinta' || g.rel === 'bertunang' || g.rel === 'berkahwin'); }

function layarMain(): string {
  const g = U.g!;
  if (g.tamat && U.skrin === 'rumah' && !U.sesi) return layarTamat(g);
  return `<div class="rangka">
    <nav class="nav" aria-label="Menu utama">${NAV.map((n) => `<button class="nav-b ${U.skrin === n.id ? 'aktif' : ''}" data-act="skrin" data-v="${n.id}" aria-label="${n.n}" ${U.skrin === n.id ? 'aria-current="page"' : ''}><span>${n.ikon}</span><small>${n.n}</small></button>`).join('')}</nav>
    <div class="isi"><header class="atas"><div><b>${tarikh(g)}</b> · ${Math.floor(umur(g))} tahun<br><small>Fasa ${g.fasa}: ${labelFasa(g)}${g.p ? ' · ' + esc(g.p.nama) + ' (' + gelarPasangan(g) + ')' : ''}</small></div>
      <div class="atas-btn"><button class="ikon-btn" data-act="bantuan" aria-label="Bantuan">🆘</button><button class="ikon-btn" data-act="tetapan" aria-label="Tetapan">⚙️</button></div></header>
      ${meterHTML(g)}
      ${U.mesej ? `<div class="amaran-kotak" role="alert">${esc(U.mesej)}</div>` : ''}
      <main id="paparan" class="paparan">${skrinHTML(g)}</main></div></div>`;
}

function skrinHTML(g: Game): string {
  switch (U.skrin) {
    case 'rumah': return U.sesi ? sesiHTML(g, U.sesi) : hubHTML(g);
    case 'chat': return chatHTML(g);
    case 'dompet': return dompetHTML(g);
    case 'kalendar': return kalendarHTML(g);
    case 'salasilah': return salasilahHTML(g);
    case 'album': return albumHTML(g);
  }
}

// ---------- Hub ----------
const FOKUS: { id: string; ikon: string; n: string; d: string }[] = [
  { id: 'kerja', ikon: '💼', n: 'Kerja', d: 'Peluang naik gaji, stres naik' },
  { id: 'pasangan', ikon: '💞', n: 'Pasangan', d: 'Kasih sayang naik' },
  { id: 'keluarga', ikon: '👪', n: 'Keluarga', d: 'Ibu bapa, mertua, anak' },
  { id: 'diri', ikon: '🧘', n: 'Diri sendiri', d: 'Stres turun, sihat' },
];

function hubHTML(g: Game): string {
  if (!g.next) g.next = pilihNext(g, C).id;
  const ev = C.peristiwa.find((e) => e.id === g.next)!;
  const tajuk = ev.jenis === 'pergaduhan' ? 'Ada sesuatu tak kena…' : ev.jenis === 'ujian' ? `${g.p ? esc(g.p.nama) : 'Seseorang'} nak tanya sesuatu` : esc(fmt(g, C, ev.tajuk));
  return `<section class="hub"><div class="adegan latar-${ev.latar ?? 'rumah'}">${deco(ev.latar)}<div class="watak">${avatar(g.w.rupa, g.w.jantina, moodPemain(g), 110, g.w.nama)}${adaPasangan(g) ? avatar(g.p!.rupa, g.p!.jantina, moodPasangan(g), 110, g.p!.nama) : ''}</div></div>
    <div class="kad minggu"><small>Peristiwa minggu ini</small><h2>${tajuk}</h2>
    <button class="btn besar" data-act="teruskan">Teruskan ▶</button></div>
    <div class="kad"><b>Fokus utama bulan-bulan ini</b><div class="fokus">${FOKUS.map((f) => `<button class="chip ${g.rancang.fokus === f.id ? 'aktif' : ''}" data-act="fokus" data-v="${f.id}" aria-pressed="${g.rancang.fokus === f.id}">${f.ikon} ${f.n}</button>`).join('')}</div>
    <small>${FOKUS.find((f) => f.id === g.rancang.fokus)!.d}. Masa tak cukup untuk semua; awak mesti memilih.</small></div>
    ${g.fasa >= 6 && g.fasaCount >= 3 && !g.tamat ? '<button class="btn sekunder" data-act="lompat">⏩ Langkau 5 tahun (ringkasan automatik)</button>' : ''}
    ${U.set.mod === 'santai' || g.mod === 'santai' ? `<small class="sub">Mod santai: tiada tragedi berat. Undur satu fasa boleh dibuat dalam Tetapan.</small>` : ''}</section>`;
}

const DECO: Record<string, string> = { pejabat: '🏢', rumah: '🏠', kafe: '☕', kenduri: '🎪', kampung: '🌴', dapur: '🍳', hospital: '🏥', mahkamah: '⚖️', masjid: '🕌', jalan: '🛣️', kedai: '🛍️', chat: '💬' };
const deco = (l?: string) => `<div class="deco" aria-hidden="true">${DECO[l ?? 'rumah'] ?? '🏠'}</div>`;

// ---------- Sesi peristiwa ----------
function adeganHTML(g: Game, ev: Peristiwa, mood?: Mood, moodSaya?: Mood): string {
  const mp = moodSaya ?? moodPemain(g);
  const tunjukP = g.p && (adaPasangan(g) || g.rel === 'bercerai');
  return `<div class="adegan latar-${ev.latar ?? 'rumah'}">${deco(ev.latar)}<div class="watak">${avatar(g.w.rupa, g.w.jantina, mp, 110, g.w.nama)}${tunjukP ? avatar(g.p!.rupa, g.p!.jantina, mood ?? moodPasangan(g), 110, g.p!.nama) : ''}</div></div>`;
}

function chatBubbles(g: Game, ev: Peristiwa): string {
  if (!ev.chat) return '';
  return `<div class="chat-mini">${ev.chat.map((m) => `<div class="gel ${m.d === 'saya' ? 'saya' : 'dia'}">${m.d !== 'saya' ? `<small>${esc(namaPengirim(g, m.d))}</small>` : ''}${T(g, m.t)}</div>`).join('')}</div>`;
}

function namaPengirim(g: Game, d: string) {
  return ({ pasangan: g.p?.nama ?? 'Pasangan', mak: 'Mak', ayah: 'Ayah', group: 'Saudara', kawan: 'Kawan', ex: g.flag.exNama ?? 'Seseorang', sistem: '' } as Record<string, string>)[d] ?? d;
}

function deltaHTML(): string {
  const f = U.flash;
  if (!f) return '';
  const it: string[] = [];
  const add = (ikon: string, d: number, baik: boolean, t: string, min = 2) => {
    if (Math.abs(d) >= min) it.push(`<span class="dlt ${(d > 0) === baik ? 'baik' : 'buruk'}">${ikon}${d > 0 ? '▲' : '▼'}<span class="sr"> ${t} ${d > 0 ? 'naik' : 'turun'}</span></span>`);
  };
  add('❤️', f.kasih, true, 'Kasih sayang');
  add('🤝', f.percaya, true, 'Kepercayaan');
  add('💰', f.duit, true, 'Kewangan', 100);
  add('😵‍💫', f.stres, false, 'Stres');
  return it.length ? `<div class="delta" aria-label="Kesan">${it.join('')}</div>` : '';
}

function sesiHTML(g: Game, s: Sesi): string {
  const ev = s.ev;
  const jenis = ev.jenis ?? 'biasa';
  if (s.langkah === 'amaran') {
    return `<section class="kad amaran-kad"><h3>⚠️ Amaran kandungan</h3><p>${esc(ev.amaran ?? '')}</p>
      <p>Awak boleh melangkau babak ini tanpa kesan besar, dan bantuan sebenar sentiasa ada di menu 🆘 (Talian Kasih 15999).</p>
      <div class="pilihan"><button class="btn" data-act="amaranTeruskan">Teruskan</button><button class="btn sekunder" data-act="amaranLangkau">Langkau babak ini</button><button class="btn sekunder" data-act="bantuan">🆘 Bantuan</button></div></section>`;
  }
  if (s.langkah === 'hasil') {
    const h = s.hasil!;
    return `${adeganHTML(g, ev)}<div class="kad"><h2>${esc(fmt(g, C, ev.tajuk))}</h2>
      ${s.maksud ? `<p class="maksud">Rupanya maksud dia: <i>${esc(s.maksud)}</i></p>` : ''}
      <div class="hasil-teks">${esc(h.h)}</div>${(h.tambah ?? []).map((t) => `<p class="tambah">${esc(t)}</p>`).join('')}${deltaHTML()}</div>
      ${g.tamat ? '' : ''}
      <div class="pilihan"><button class="btn besar" data-act="seterusnya">Teruskan ▶</button></div>`;
  }
  if (s.langkah === 'calon') {
    const [a, b] = s.calon!;
    const kad = (p: Pasangan, i: number) => `<div class="kad calon">${avatar(p.rupa, p.jantina, 'gembira', 96, p.nama)}<h3>${esc(p.nama)}, ${p.usia}</h3>
      <small>${esc(p.kerjaLabel)} · ${esc(p.negeri)} · ${p.asal}</small><p>Nampak ${esc(p.sifat[0])}.${p.agama !== 'islam' ? ` <b>Agama: ${p.agama[0].toUpperCase() + p.agama.slice(1)}</b>` : ''}</p>
      <button class="btn" data-act="calon" data-v="${i}">Kejar ${esc(p.nama)}</button></div>`;
    return `${adeganHTML(g, ev)}<div class="kad"><h2>${esc(fmt(g, C, ev.tajuk))}</h2><p>${T(g, ev.teks[s.ti] ?? ev.teks[0])}</p></div><div class="calon-baris">${kad(a, 0)}${kad(b, 1)}</div>
      <div class="pilihan"><button class="btn sekunder" data-act="calon" data-v="-1">Terus bujang. Hidup sendiri pun boleh bahagia.</button></div>`;
  }
  if (s.langkah === 'mini') {
    const mi = MINI_INFO[ev.mini!];
    return `${adeganHTML(g, ev)}<div class="kad"><h2>${esc(fmt(g, C, ev.tajuk))}</h2><p>${T(g, ev.teks[s.ti] ?? ev.teks[0])}</p>
      <div class="mini-info"><b>🎮 Mini-game: ${mi.tajuk}</b><p>${mi.cara}</p></div></div>
      <div class="pilihan"><button class="btn besar" data-act="miniMula">Main!</button></div>`;
  }
  if (s.langkah === 'miniMain') {
    return `<div class="kad mini-kad"><h3>🎮 ${MINI_INFO[s.miniKhas ?? ev.mini!].tajuk}</h3><p class="kecil">${MINI_INFO[s.miniKhas ?? ev.mini!].cara}</p><div id="miniHost"></div></div>`;
  }
  if (s.langkah === 'pg' && s.pg) return pgHTML(g, s);
  // pilih (biasa / ujian)
  const pil = s.pil ?? [];
  const teksUtama = jenis === 'ujian' && s.soalan ? esc(fmt(g, C, s.soalan.soalan)) : T(g, ev.teks[s.ti] ?? ev.teks[0]);
  return `${adeganHTML(g, ev)}<div class="kad"><h2>${jenis === 'ujian' ? esc((g.p?.nama ?? '') + ' bertanya') : esc(fmt(g, C, ev.tajuk))}</h2>
    ${jenis === 'ujian' ? '' : ''}<p class="teks-utama">${teksUtama}</p>${chatBubbles(g, ev)}${ev.bantuan ? '<p class="kecil">🆘 Bantuan sebenar: Talian Kasih 15999 (menu 🆘).</p>' : ''}</div>
    <div class="pilihan" role="group" aria-label="Pilihan">${pil.map((p, i) => `<button class="btn ${p.lucu ? 'lucu' : ''}" data-act="pilih" data-v="${i}">${esc(fmt(g, C, p.t))}</button>`).join('')}</div>`;
}

function pgHTML(g: Game, s: Sesi): string {
  const pg = s.pg!;
  const nama = esc(g.p?.nama ?? 'Dia');
  const gaugeLevel = pg.panas < 35 ? 'sejuk' : pg.panas < 65 ? 'hangat' : 'panas';
  const gauge = `<div class="panas p-${gaugeLevel}" role="img" aria-label="Meter panas: ${gaugeLevel}"><span>🌡️</span><div><i style="width:${Math.max(6, pg.panas)}%"></i></div><small>${gaugeLevel === 'sejuk' ? 'Reda' : gaugeLevel === 'hangat' ? 'Tegang' : 'Meletup!'}</small></div>`;
  const mood: Mood = pg.panas > 65 ? 'marah' : pg.panas > 40 ? 'cemas' : pg.panas < 25 ? 'biasa' : 'sedih';
  const moodSaya: Mood = pg.panas > 65 ? 'marah' : pg.panas > 40 ? 'cemas' : 'biasa';
  const log = (s.pgRespons ?? []).slice(-3).map((l) => `<p class="log">${esc(l)}</p>`).join('');
  if (s.pgFasa === 'respons') {
    return `${adeganHTML(g, s.ev, mood, moodSaya)}<div class="kad"><h2>Pergaduhan · pusingan ${pg.pusingan + 1}/${pg.maks}</h2><p class="teks-utama">${esc(pg.teks)}</p>${gauge}${log}</div>
      <div class="pilihan" role="group" aria-label="Respons">${pg.pilihan.map((r, i) => `<button class="btn" data-act="respons" data-v="${i}">${esc(r.t)}</button>`).join('')}</div>`;
  }
  if (s.pgFasa === 'hasil' || s.pgFasa === 'baikan') {
    return `${adeganHTML(g, s.ev, mood, moodSaya)}<div class="kad"><h2>Selepas pergaduhan</h2>${gauge}<p>${esc(s.pgHasilTeks ?? '')}</p><p class="teks-utama">Bagaimana awak nak baiki keadaan dengan ${nama}?</p></div>
      <div class="pilihan">${(s.pgBaikan ?? []).map((b) => `<button class="btn" data-act="baikan" data-v="${b.id}">${esc(b.t)}</button>`).join('')}</div>`;
  }
  return '';
}

// ---------- Chat ----------
const UTAS = [{ id: 'pasangan', n: 'Pasangan' }, { id: 'group', n: 'Group Famili' }, { id: 'mak', n: 'Mak' }, { id: 'kawan', n: 'Kawan' }];
function chatHTML(g: Game): string {
  const nama = (id: string) => (id === 'pasangan' ? g.p?.nama ?? 'Pasangan' : id === 'group' ? 'Group Famili 👨‍👩‍👧' : id === 'mak' ? 'Mak' : 'Kawan');
  const msg = g.chat[U.utas] ?? [];
  const online = U.utas === 'pasangan' && g.p ? (g.meter.stres > 60 ? 'typing…' : 'online') : U.utas === 'mak' ? 'online' : 'last seen hari ini';
  return `<section class="chat"><div class="utas-tab">${UTAS.map((u) => `<button class="chip ${U.utas === u.id ? 'aktif' : ''}" data-act="utas" data-v="${u.id}">${esc(nama(u.id))}</button>`).join('')}</div>
    <div class="chat-kepala"><b>${esc(nama(U.utas))}</b><small>${online}</small></div>
    <div class="chat-isi">${msg.length ? msg.map((m) => `<div class="gel ${m.d === 'saya' ? 'saya' : 'dia'}">${m.d !== 'saya' && U.utas === 'group' ? `<small>${esc(namaPengirim(g, m.d))}</small>` : ''}${esc(m.t)}<span class="tik">${m.d === 'saya' ? '✓✓' : ''}</span></div>`).join('') : '<p class="kosong">Belum ada mesej di sini.</p>'}</div></section>`;
}

// ---------- Dompet ----------
function dompetHTML(g: Game): string {
  const b = belanjaBulanan(g, C);
  const d = g.duit;
  const r = g.rancang;
  const rad = (k: string, v: number | string, l: string, aktif: boolean) => `<button class="chip ${aktif ? 'aktif' : ''}" data-act="rancang" data-k="${k}" data-v="${v}" aria-pressed="${aktif}">${l}</button>`;
  return `<section class="dompet"><div class="kad bank"><small>Baki tunai</small><div class="besar-angka">${rm(d.tunai)}</div>
    <div class="grid2"><div><small>Simpanan</small><b>${rm(d.simpanan)}</b></div><div><small>KWSP</small><b>${rm(d.kwsp)}</b></div><div><small>Hutang</small><b class="${d.hutang > 0 ? 'merah' : ''}">${rm(d.hutang)}</b></div><div><small>PTPTN</small><b>${rm(d.ptptn)}</b></div></div></div>
    <div class="kad"><b>Setiap bulan</b><table class="jadual"><tr><td>Pendapatan bersih</td><td class="kanan baik">+${rm(b.pendapatan)}</td></tr>${b.baris.map((x) => `<tr><td>${esc(x.nama)}</td><td class="kanan">-${rm(x.jumlah)}</td></tr>`).join('')}${b.simpan ? `<tr><td>Ke simpanan</td><td class="kanan">-${rm(b.simpan)}</td></tr>` : ''}
      <tr class="jum"><td>Baki bulanan</td><td class="kanan ${b.bersih < 0 ? 'merah' : 'baik'}">${b.bersih < 0 ? '-' : '+'}${rm(Math.abs(b.bersih))}</td></tr></table>
      <small>Defisit menimbun menjadi hutang dan mencetuskan peristiwa hutang.</small></div>
    <div class="kad"><b>Agihan belanjawan</b>
      <div class="f">Gaya hidup<div class="chips">${rad('gaya', 0, 'Jimat', r.gaya === 0)}${rad('gaya', 1, 'Biasa', r.gaya === 1)}${rad('gaya', 2, 'Selesa', r.gaya === 2)}</div></div>
      <div class="f">Simpanan bulanan<div class="chips">${rad('simpan', 0, '0%', r.simpan === 0)}${rad('simpan', 10, '10%', r.simpan === 10)}${rad('simpan', 20, '20%', r.simpan === 20)}</div></div>
      <div class="f">Duit belanja ibu bapa<div class="chips">${rad('ibuBapa', 0, 'RM0', r.ibuBapa === 0)}${rad('ibuBapa', 200, 'RM200', r.ibuBapa === 200)}${rad('ibuBapa', 400, 'RM400', r.ibuBapa === 400)}</div></div></div></section>`;
}

// ---------- Kalendar ----------
function kalendarHTML(g: Game): string {
  const bulanSkr = g.bulan % 12;
  const baris: { m: number; t: string; i: string }[] = [];
  if (g.p) baris.push({ m: hash(g.p.nama) % 12, t: `Ulang tahun ${g.p.nama}`, i: '🎂' });
  if (g.rel === 'berkahwin' && g.flag.kahwinBulan !== undefined) baris.push({ m: g.flag.kahwinBulan % 12, t: 'Ulang tahun perkahwinan', i: '💍' });
  g.anak.forEach((a) => baris.push({ m: a.lahir % 12, t: `Ulang tahun ${a.nama} (${Math.floor(umurAnak(a, g))} tahun)`, i: '🎈' }));
  if (g.anak.some((a) => umurAnak(a, g) >= 5)) baris.push({ m: 0, t: 'Yuran sekolah & baju sekolah', i: '🎒' });
  if (g.flag.hamil || g.flag.hamilSah) baris.push({ m: bulanSkr, t: 'Pemeriksaan kehamilan', i: '🩺' });
  if (g.duit.ptptn > 0) baris.push({ m: bulanSkr, t: `Ansuran PTPTN setiap bulan (baki ${rm(g.duit.ptptn)})`, i: '🎓' });
  baris.push({ m: bulanSkr, t: 'Hari Raya: giliran rumah siapa? (kalendar Hijrah bergerak setiap tahun)', i: '🌙' });
  baris.sort((a, b) => ((a.m - bulanSkr + 12) % 12) - ((b.m - bulanSkr + 12) % 12));
  return `<section><div class="kad"><b>${tarikh(g)}</b><ul class="senarai-kal">${baris.map((b) => `<li><span class="bln">${['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'][b.m]}</span><span>${b.i} ${esc(b.t)}</span></li>`).join('')}</ul></div></section>`;
}

// ---------- Salasilah ----------
function kartu(nama: string, peranan: string, rupa: ReturnType<typeof rupaPantas>, jantina: Jantina, mood: Mood, pipN?: number, nota = ''): string {
  return `<div class="salasilah-k">${avatar(rupa, jantina, mood, 72, nama)}<div><b>${esc(nama)}</b><br><small>${peranan}</small>${pipN ? `<br>${pips(pipN)}<span class="sr">Hubungan ${pipN} daripada 5</span>` : ''}${nota ? `<br><small>${esc(nota)}</small>` : ''}</div></div>`;
}
function salasilahHTML(g: Game): string {
  const w = g.w;
  const bk = g.bkTepat >= 2 && g.p ? `Nampak gembira bila: ${C.sifat.bk[g.p.bk]}.` : '';
  const sifat2 = g.p ? (g.bil >= 10 ? g.p.sifat.join(', ') : g.p.sifat[0]) : '';
  const bapa = rupaPantas(hash(g.seed + 'bapa'), 'lelaki');
  const mak = rupaPantas(hash(g.seed + 'mak'), 'perempuan');
  return `<section class="salasilah"><div class="kad">${kartu(w.nama, `Awak · ${w.sifat.join(', ')}`, w.rupa, w.jantina, moodPemain(g))}</div>
    ${g.p ? `<div class="kad"><b>${g.rel === 'bercerai' ? 'Bekas pasangan' : 'Pasangan'}</b>${kartu(g.p.nama, `${g.p.kerjaLabel} · ${g.p.negeri} · ${sifat2}`, g.p.rupa, g.p.jantina, moodPasangan(g), tahap((g.meter.kasih + g.meter.percaya) / 2), bk)}
      ${kartu(`Mak ${g.p.mertuaNama}`, `Mertua (${g.p.mertuaSifat})`, rupaPantas(hash(g.p.nama), 'perempuan'), 'perempuan', 'biasa', tahap(g.sembunyi.mertua))}</div>` : ''}
    ${g.anak.length ? `<div class="kad"><b>Anak</b>${g.anak.map((a) => kartu(a.nama, `${Math.floor(umurAnak(a, g))} tahun · ${a.sifat}`, rupaPantas(hash(a.nama + a.lahir), a.jantina), a.jantina, 'gembira', tahap(g.sembunyi.anak))).join('')}</div>` : ''}
    <div class="kad"><b>Ibu bapa & adik-beradik</b>${kartu('Ayah', `Ibu bapa ${w.ibuBapa}`, bapa, 'lelaki', 'biasa', tahap(g.sembunyi.ibubapa))}${kartu('Mak', w.adikBeradik === 'ramai' ? 'Adik-beradik ramai' : 'Adik-beradik sikit', mak, 'perempuan', 'biasa', tahap(g.sembunyi.ibubapa))}</div>
    <div class="kad"><small>Titik kecil menunjukkan hubungan secara halus. Awak perlu belajar membaca pasangan, bukan mengira nombor.</small></div></section>`;
}

// ---------- Album ----------
function albumHTML(g: Game): string {
  if (!g.album.length) return `<section><div class="kad"><p class="kosong">Belum ada detik penting. Mereka akan dirakam secara automatik.</p></div></section>`;
  return `<section><div class="kad"><div class="album">${[...g.album].reverse().map((a) => `<figure class="foto"><span class="foto-e">${a.emoji}</span><figcaption>${esc(a.teks)}<br><small>Umur ${a.umur} · Fasa ${a.fasa}</small></figcaption></figure>`).join('')}</div>
    <button class="btn sekunder" data-act="kongsiFasa">📤 Kongsi kad ringkasan semasa</button></div></section>`;
}

// ---------- Kad akhir ----------
function layarTamat(g: Game): string {
  const t = g.tamat!;
  const tl = g.album.slice(0, 8);
  return `<div class="tamat"><div class="kad skor"><small>Kad Kebahagiaan</small><div class="skor-n">${t.skor}<span>/100</span></div><h2>“${esc(t.gelaran)}”</h2></div>
    <div class="kad"><b>Pecahan</b>${t.komponen.map((k) => `<div class="bar-baris"><span>${esc(k.nama)} <small>(${k.berat}%)</small></span><div class="bar" role="img" aria-label="${k.nilai} daripada 100"><i style="width:${k.nilai}%"></i></div><b>${k.nilai}</b></div>`).join('')}</div>
    <div class="kad"><b>Garis masa kenangan</b><ul class="garis">${tl.map((a) => `<li><span>${a.emoji}</span> <small>Umur ${a.umur}</small> ${esc(a.teks)}</li>`).join('')}</ul></div>
    <div class="kad"><b>Statistik</b><div class="grid2"><div><small>Bergaduh</small><b>${g.stat.gaduh} kali</b></div><div><small>Minta maaf</small><b>${g.stat.maaf} kali</b></div><div><small>Hantaran</small><b>${g.stat.hantaran ? rm(g.stat.hantaran) : '-'}</b></div><div><small>Kenduri</small><b>${g.stat.kenduri ? rm(g.stat.kenduri) : '-'}</b></div><div><small>Anak / cucu</small><b>${g.stat.anak} / ${g.stat.cucu}</b></div><div><small>Kod dunia</small><b>${esc(g.seed)}</b></div></div></div>
    <div class="kad nasihat"><b>Nasihat watak tua kepada dirinya yang muda</b><p>“${esc(t.nasihat)}”</p></div>
    <div class="pilihan"><button class="btn besar" data-act="kongsiAkhir">📤 Kongsi kad (gambar)</button><button class="btn" data-act="mainLagiSama">🔁 Main semula dunia ini (${esc(g.seed)})</button><button class="btn sekunder" data-act="mainLagiBaru">✨ Dunia baharu</button><button class="btn sekunder" data-act="menu">Menu utama</button></div></div>`;
}

// ---------- Lapisan (tetapan / bantuan / rekap) ----------
function lapisHTML(): string {
  if (!U.lapis) return '';
  const g = U.g;
  let isi = '';
  if (U.lapis === 'tetapan') {
    const s = U.set;
    isi = `<h2>Tetapan</h2>
      <div class="f">Saiz teks<div class="chips">${[0, 1, 2].map((i) => `<button class="chip ${s.teks === i ? 'aktif' : ''}" data-act="set" data-k="teks" data-v="${i}">${['Kecil', 'Biasa', 'Besar'][i]}</button>`).join('')}</div></div>
      <div class="f">Tema<div class="chips"><button class="chip ${s.gelap === null ? 'aktif' : ''}" data-act="set" data-k="gelap" data-v="auto">Ikut sistem</button><button class="chip ${s.gelap === false ? 'aktif' : ''}" data-act="set" data-k="gelap" data-v="cerah">Cerah</button><button class="chip ${s.gelap === true ? 'aktif' : ''}" data-act="set" data-k="gelap" data-v="gelap">Gelap</button></div></div>
      <label class="f semak"><input type="checkbox" data-act="setChk" data-k="bunyi" ${s.bunyi ? 'checked' : ''}> Bunyi kesan</label>
      <label class="f semak"><input type="checkbox" data-act="setChk" data-k="muzik" ${s.muzik ? 'checked' : ''}> Muzik latar santai</label>
      <label class="f semak"><input type="checkbox" data-act="setChk" data-k="dewasa" ${s.dewasa ? 'checked' : ''}> Kandungan dewasa 18+ (tidak eksplisit)</label>
      <label class="f semak"><input type="checkbox" data-act="setChk" data-k="sensitif" ${s.sensitif ? 'checked' : ''}> Tema sensitif (keguguran, keganasan rumah tangga)</label>
      ${g ? `<hr><p>Kod dunia: <b>${esc(g.seed)}</b> · Mod: <b>${g.mod}</b></p>
        <div class="pilihan"><button class="btn sekunder" data-act="eksport">⬇️ Eksport simpanan</button>
        ${g.mod === 'santai' && !g.undurGuna && g.snapshot ? '<button class="btn sekunder" data-act="undur">↩️ Undur ke awal fasa (sekali)</button>' : ''}
        <button class="btn sekunder" data-act="menu">Menu utama</button></div>` : ''}
      <div class="pilihan"><button class="btn" data-act="tutup">Selesai</button></div>`;
  } else if (U.lapis === 'bantuan') {
    isi = `<h2>🆘 Bantuan sebenar</h2>
      <p>Jika awak atau seseorang yang awak kenal mengalami keganasan rumah tangga, atau berasa tidak selamat:</p>
      <ul><li><b>Talian Kasih 15999</b>: sokongan dan nasihat, hubungi bila-bila masa.</li><li><b>999</b>: kecemasan, polis dan ambulans.</li><li>Cerita kepada keluarga atau kawan yang dipercayai. Awak tidak bersalah.</li><li>Pilihan sebenar termasuk laporan polis, perintah perlindungan, dan rumah perlindungan.</li></ul>
      <p>Jika awak sedang bersedih berpanjangan atau memikirkan untuk menyakiti diri sendiri, tolong dapatkan bantuan profesional kesihatan mental atau hubungi talian kecemasan segera.</p>
      <p class="kecil">Game ini ialah hiburan dan tidak menggantikan nasihat guaman atau perubatan.</p><div class="pilihan"><button class="btn" data-act="tutup">Tutup</button></div>`;
  } else if (U.lapis === 'kredit') {
    isi = `<h2>Tentang Asam Garam</h2><p>Simulator rumah tangga Malaysia. Sumber terbuka (kod MIT). Cerita dan data dalam folder <code>content/</code> boleh disumbangkan melalui pull request; lihat <code>CONTRIBUTING.md</code>.</p>
      <p>Angka harga dan adat negeri ialah anggaran untuk permainan dan <b>belum disahkan oleh pakar</b>. Fakta undang-undang perlu disemak dengan pakar agama/undang-undang sebelum diterbitkan secara rasmi.</p>
      <p>Grafik: watak kartun SVG dijana dalam kod. Bunyi: dijana dengan WebAudio. Tiada aset luar.</p><div class="pilihan"><button class="btn" data-act="tutup">Tutup</button></div>`;
  } else if (U.lapis === 'rekap' && U.rekap) {
    isi = `<h2>${esc(U.rekap.tajuk)}</h2><ul class="garis">${U.rekap.baris.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="pilihan">${U.rekap.fasa ? '<button class="btn" data-act="kongsiFasaLama">📤 Kongsi kad ringkasan</button>' : ''}<button class="btn sekunder" data-act="tutup">Teruskan</button></div>`;
  }
  return `<div class="lapis" role="dialog" aria-modal="true"><div class="lapis-isi">${isi}</div></div>`;
}

// ---------- Selepas render ----------
function pascaRender() {
  const s = U.sesi;
  if (s && s.langkah === 'miniMain') {
    const host = $('#miniHost');
    if (host && !host.dataset.jalan) {
      host.dataset.jalan = '1';
      const g = U.g!;
      void mainMini(s.miniKhas ?? s.ev.mini!, host, { g, c: C }).then((skor) => selesaiMini(skor));
    }
  }
}

// ---------- Logik alur peristiwa ----------
function teruskan() {
  const g = U.g!;
  if (!g.next) g.next = pilihNext(g, C).id;
  const ev = C.peristiwa.find((e) => e.id === g.next)!;
  g.next = null;
  mulaPeristiwa(ev);
}

function mulaPeristiwa(ev: Peristiwa) {
  const g = U.g!;
  catatLihat(g, ev);
  U.flash = null;
  U.mesej = '';
  const jenis = ev.jenis ?? 'biasa';
  const sesi: Sesi = { ev, ti: Math.floor(((hash(g.seed + ev.id + g.bil) % 1000) / 1000) * ev.teks.length), langkah: 'pilih', fasaLama: g.fasa };
  U.sesi = sesi;
  if (ev.chat && ev.utas) for (const m of ev.chat) (g.chat[ev.utas] ||= []).push({ d: m.d, t: fmt(g, C, m.t), b: g.bulan });
  if (ev.amaran && U.set.sensitif) sesi.langkah = 'amaran';
  siapkanSesi(sesi);
  bunyi('notif');
  U.skrin = 'rumah';
  render();
  window.scrollTo({ top: 0 });
  void jenis;
}

function siapkanSesi(sesi: Sesi) {
  const g = U.g!;
  const ev = sesi.ev;
  const jenis = ev.jenis ?? 'biasa';
  if (jenis === 'biasa') sesi.pil = (ev.pilihan ?? []).filter((p) => pilihanBolehDipilih(g, p));
  else if (jenis === 'ujian') {
    sesi.soalan = pilihSoalan(g, C);
    sesi.pil = sesi.soalan.pilihan.filter((p) => pilihanBolehDipilih(g, p));
    if (g.p) (g.chat.pasangan ||= []).push({ d: 'pasangan', t: fmt(g, C, sesi.soalan.soalan), b: g.bulan });
  } else if (jenis === 'pergaduhan') {
    if (sesi.langkah !== 'amaran') { sesi.pg = mulaPergaduhan(g, C); sesi.pgFasa = 'respons'; sesi.pgRespons = []; sesi.langkah = 'pg'; }
  } else if (jenis === 'pilihPasangan') {
    sesi.calon = janaCalon(g, C);
    sesi.langkah = sesi.langkah === 'amaran' ? 'amaran' : 'calon';
  } else if (jenis === 'mini') {
    sesi.langkah = sesi.langkah === 'amaran' ? 'amaran' : 'mini';
  } else if (jenis === 'penilaian') {
    g.tamat = kiraTamat(g, C);
    bunyi('tamat');
    U.sesi = null;
    simpan();
  }
}

function selesaiPilihan(p: Pilihan, extra?: { maksud?: string }) {
  const g = U.g!;
  const s = U.sesi!;
  const sebelum = { d: g.duit.tunai + g.duit.simpanan - g.duit.hutang };
  const hasil = selesaikan(g, C, s.ev, p);
  paparHasil(s, hasil, sebelum.d, extra?.maksud);
}

function paparHasil(s: Sesi, hasil: HasilPilihan, duitSebelum: number, maksud?: string) {
  const g = U.g!;
  U.flash = { kasih: hasil.ubah.kasih, percaya: hasil.ubah.percaya, stres: hasil.ubah.stres, duit: hasil.ubah.duit };
  s.hasil = { ...hasil, tambah: g.log.length ? g.log : undefined };
  g.log = [];
  s.maksud = maksud;
  s.langkah = 'hasil';
  const baik = hasil.ubah.kasih + hasil.ubah.percaya - hasil.ubah.stres;
  bunyi(baik >= 3 ? 'baik' : baik <= -3 ? 'buruk' : 'pilih');
  void duitSebelum;
  if (g.fasa !== s.fasaLama) {
    s.hasil.fasaTamat = s.fasaLama;
    U.rekap = { tajuk: `Fasa ${s.fasaLama} selesai: ${['', 'Bujang', 'Bercinta', 'Merisik & Bertunang', 'Persiapan & Nikah', 'Awal Kahwin', 'Membina Keluarga', 'Pertengahan', 'Hari Tua'][s.fasaLama]}`, fasa: s.fasaLama, baris: ringkasFasa(g, s.fasaLama) };
  }
  simpan();
  render();
}

function ringkasFasa(g: Game, f: number): string[] {
  const o = [`Umur ${Math.floor(umur(g))} · ${tarikh(g)}`, `Bergaduh ${g.stat.gaduh} kali, minta maaf ${g.stat.maaf} kali`];
  if (g.stat.hantaran) o.push(`Hantaran ${rm(g.stat.hantaran)}`);
  if (g.stat.kenduri) o.push(`Belanja kenduri ${rm(g.stat.kenduri)}`);
  if (g.anak.length) o.push(`${g.anak.length} anak`);
  o.push(`Hutang ${rm(g.duit.hutang)} · Simpanan ${rm(g.duit.simpanan)}`);
  const ak = g.album.filter((a) => a.fasa === f).pop();
  if (ak) o.push(`Detik: ${ak.teks}`);
  return o;
}

function selesaiMini(skor: number) {
  const g = U.g!;
  const s = U.sesi!;
  if (s.miniKhas === 'pujuk_merajuk' && s.pg) {
    s.miniKhas = undefined;
    akhiriPergaduhan(kesanBaikan(g, 'mini', skor));
    return;
  }
  const ks = kesanMini(g, C, s.ev.mini!, skor);
  apply(g, C, ks);
  const tier = skor > 0.66 ? 'tinggi' : skor > 0.33 ? 'sederhana' : 'rendah';
  selesaiPilihan(s.ev.miniHasil![tier]);
}

function akhiriPergaduhan(b?: { k: any; teks: string }) {
  const g = U.g!;
  const s = U.sesi!;
  const pg = s.pg!;
  if (b) apply(g, C, b.k);
  tick(g, C, 1);
  const hasil: HasilPilihan = { h: `${s.pgHasilTeks ?? ''} ${b?.teks ?? ''}`.trim(), ubah: { kasih: 0, percaya: 0, stres: 0, duit: 0, lain: 0 } };
  U.flash = null;
  s.hasil = hasil;
  s.langkah = 'hasil';
  s.pgFasa = undefined;
  s.pg = undefined;
  void pg;
  simpan();
  render();
}

// ---------- Pengendali klik ----------
function onKlik(e: Event) {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  bunyi('klik');
  act(el.dataset.act!, el.dataset as any, el);
}

function onInput(e: Event) {
  const t = e.target as HTMLInputElement;
  if (t.dataset.actFail === 'import' && t.files?.[0]) {
    void importFail(t.files[0]).then((g) => {
      if (!g) { alert('Fail simpanan tidak sah.'); return; }
      U.g = g; simpan(); U.layar = 'main'; U.skrin = 'rumah'; U.sesi = null; render();
    });
    return;
  }
  if (t.id === 'wNama' && U.wiz) { U.wiz.nama = t.value; const btn = $<HTMLButtonElement>('[data-act="mulaMain"]'); if (btn) btn.disabled = !(U.wiz.sifat.length === 2 && U.wiz.nama.trim()); return; }
  if (t.id === 'wNegeri' && U.wiz) { U.wiz.negeri = t.value; return; }
  if (t.id === 'wKod' && U.wiz) { U.wiz.kod = t.value.toUpperCase(); return; }
  if (t.id === 'wDewasa') { U.set.dewasa = t.checked; simpanTetapan(U.set); return; }
  if (t.id === 'wSensitif') { U.set.sensitif = t.checked; simpanTetapan(U.set); return; }
  if (t.dataset.act === 'setChk') {
    const k = t.dataset.k as 'bunyi' | 'muzik' | 'dewasa' | 'sensitif';
    (U.set as any)[k] = t.checked;
    simpanTetapan(U.set);
    if (U.g) { U.g.dewasa = U.set.dewasa; U.g.sensitif = U.set.sensitif; simpan(); }
    terapkanTetapan();
    if (k === 'muzik') setMuzik(t.checked);
  }
}

function act(a: string, d: Record<string, string>, _el: HTMLElement) {
  const g = U.g;
  switch (a) {
    case 'umurSah': U.set.umurSah = true; simpanTetapan(U.set); U.layar = 'menu'; break;
    case 'menu': U.lapis = ''; U.layar = 'menu'; break;
    case 'baru': U.wiz = wizAsal(); U.layar = 'wizard'; break;
    case 'sambung': { const s = muatGame(); if (s) { U.g = s; U.layar = 'main'; U.skrin = 'rumah'; U.sesi = null; U.flash = null; } break; }
    case 'tetapan': case 'bantuan': case 'kredit': U.lapis = a as any; break;
    case 'tutup': U.lapis = ''; break;
    case 'rupa': U.wiz!.rupaN = Math.floor(Math.random() * 1000); break;
    case 'kodBaru': U.wiz!.kod = kodDunia(); break;
    case 'w': (U.wiz as any)[d.k] = d.v; break;
    case 'wsifat': { const w = U.wiz!; w.sifat = w.sifat.includes(d.v) ? w.sifat.filter((x) => x !== d.v) : w.sifat.length < 2 ? [...w.sifat, d.v] : w.sifat; break; }
    case 'mulaMain': mulaPermainan(); return;
    case 'skrin': U.skrin = d.v as Skrin; U.mesej = ''; break;
    case 'fokus': if (g) { g.rancang.fokus = d.v as any; simpan(); } break;
    case 'rancang': if (g) { (g.rancang as any)[d.k] = Number(d.v); simpan(); } break;
    case 'utas': U.utas = d.v; break;
    case 'teruskan': teruskan(); return;
    case 'lompat': if (g) { const l = lompat(g, C, 5); g.next = null; U.rekap = { tajuk: '⏩ 5 tahun kemudian', baris: l }; U.lapis = 'rekap'; simpan(); } break;
    case 'amaranTeruskan': if (U.sesi) { U.sesi.langkah = 'pilih'; siapkanSesi(U.sesi); } break;
    case 'amaranLangkau': if (U.sesi && g) { const s = U.sesi; s.langkah = 'pilih'; selesaiPilihan({ t: '', h: 'Awak memilih melangkau babak ini. Masa terus berjalan.', k: { stres: -1 } }); return; } break;
    case 'pilih': if (U.sesi && U.sesi.pil) { const s = U.sesi; selesaiPilihan(s.pil![Number(d.v)], { maksud: s.soalan?.maksud }); return; } break;
    case 'seterusnya': {
      const s = U.sesi;
      U.sesi = null; U.flash = null;
      if (g?.tamat) { render(); return; }
      if (s?.hasil?.fasaTamat && U.rekap) { U.lapis = 'rekap'; }
      break;
    }
    case 'calon': if (g && U.sesi) {
      const s = U.sesi;
      const i = Number(d.v);
      if (i >= 0) {
        const p = s.calon![i];
        pilihCalon(g, C, p);
        const hasil: HasilPilihan = { h: `Awak mula berbual dengan ${p.nama}. ${p.agama !== 'islam' ? 'Perbezaan agama akan menjadi persoalan besar nanti.' : 'Ada sesuatu yang terasa betul.'}`, ubah: { kasih: 0, percaya: 0, stres: 0, duit: 0, lain: 0 } };
        tick(g, C, 1);
        s.hasil = hasil; s.langkah = 'hasil'; U.flash = null; simpan();
      } else {
        selesaiPilihan({ t: '', h: 'Awak memilih untuk meneruskan hidup sendiri. Itu satu pilihan yang sah, dan bukan kegagalan.', k: { fasa: 5, bulan: 48, flag: { pilihBujang: true }, stres: -3, catat: 'Memilih hidup bujang dengan tenang.', emoji: '🌿' } });
        return;
      }
    } break;
    case 'miniMula': if (U.sesi) U.sesi.langkah = 'miniMain'; break;
    case 'respons': if (g && U.sesi?.pg) {
      const s = U.sesi;
      const pg = s.pg!;
      const r: Respons = pg.pilihan[Number(d.v)];
      const lines = pusinganPergaduhan(g, C, pg, r);
      s.pgRespons = [...(s.pgRespons ?? []), ...lines];
      bunyi(kesanPanas(g, r) < 0 ? 'baik' : 'buruk');
      if (pg.pusingan >= pg.maks) {
        const h = hasilPergaduhan(g, C, pg);
        s.pgHasilTeks = h.teks;
        s.pgFasa = 'baikan';
        s.pgBaikan = pilihBaikan(g, pg);
      }
    } break;
    case 'baikan': if (g && U.sesi?.pg) {
      const s = U.sesi;
      if (d.v === 'mini') {
        s.miniKhas = 'pujuk_merajuk'; // pembaikan melalui mini-game
        s.langkah = 'miniMain';
        break;
      }
      const b = kesanBaikan(g, d.v);
      akhiriPergaduhan(b);
      return;
    } break;
    case 'eksport': if (g) eksportFail(g); break;
    case 'undur': if (g) { const s = pulihSnapshot(g); if (s) { U.g = s; U.sesi = null; U.lapis = ''; U.flash = null; simpan(); } } break;
    case 'kongsiFasa': if (g) void kadFasa(g, g.fasa).then((b) => kongsiGambar(b, `asam-garam-fasa${g.fasa}.png`)); return;
    case 'kongsiFasaLama': if (g && U.rekap?.fasa) { const f = U.rekap.fasa; void kadFasa(g, f).then((b) => kongsiGambar(b, `asam-garam-fasa${f}.png`)); } return;
    case 'kongsiAkhir': if (g?.tamat) void kadAkhir(g).then((b) => kongsiGambar(b, 'asam-garam-kad-akhir.png')); return;
    case 'mainLagiSama': if (g) { const w = g.w; U.wiz = { ...wizAsal(), nama: w.nama, jantina: w.jantina, asal: w.asal, negeri: w.negeri, pendidikan: w.pendidikan, kerjaya: w.kerjaya, susunan: w.susunan, ibuBapa: w.ibuBapa, adikBeradik: w.adikBeradik, sifat: w.sifat, kod: g.seed, mod: g.mod }; U.layar = 'wizard'; } break;
    case 'mainLagiBaru': U.wiz = wizAsal(); U.layar = 'wizard'; break;
    case 'set': {
      if (d.k === 'teks') U.set.teks = Number(d.v) as 0 | 1 | 2;
      if (d.k === 'gelap') U.set.gelap = d.v === 'auto' ? null : d.v === 'gelap';
      simpanTetapan(U.set);
      terapkanTetapan();
      break;
    }
  }
  render();
}

function mulaPermainan() {
  const w = U.wiz!;
  U.set.mod = w.mod;
  simpanTetapan(U.set);
  const g = baruGame(C, {
    seed: w.kod || kodDunia(), mod: w.mod, dewasa: U.set.dewasa, sensitif: U.set.sensitif,
    w: { nama: w.nama.trim(), jantina: w.jantina, asal: w.asal, negeri: w.negeri, pendidikan: w.pendidikan, kerjaya: w.kerjaya, susunan: w.susunan, ibuBapa: w.ibuBapa, adikBeradik: w.adikBeradik, sifat: w.sifat, rupa: rupaPantas(w.rupaN, w.jantina) },
  });
  U.g = g; U.sesi = null; U.skrin = 'rumah'; U.layar = 'main'; U.flash = null; U.mesej = '';
  simpan();
  if (U.set.muzik) setMuzik(true);
  render();
}

void padamGame;
