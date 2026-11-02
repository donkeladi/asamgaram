// Jenis data teras Asam Garam. Kandungan cerita (content/*.json) mengikut jenis ini.

export type Jantina = 'lelaki' | 'perempuan';
export type Rel = 'bujang' | 'bercinta' | 'bertunang' | 'berkahwin' | 'bercerai' | 'kehilangan';
export type Mod = 'santai' | 'realistik' | 'cabaran';
export type BahasaKasih = 'masa' | 'hadiah' | 'kata' | 'khidmat' | 'sentuhan';
export type Gaya = 'jujur' | 'lembut' | 'humor' | 'diam' | 'tegas';

export interface Rupa {
  kulit: number; // 0..4
  rambut: number; // 0..3 gaya
  warnaRambut: number;
  baju: number; // warna
  tudung: boolean;
  songkok: boolean;
}

export interface Watak {
  nama: string;
  jantina: Jantina;
  agama: 'islam';
  asal: 'bandar' | 'kampung';
  negeri: string;
  pendidikan: 'spm' | 'diploma' | 'ijazah';
  kerjaya: 'kerajaan' | 'swasta' | 'gig' | 'niaga';
  susunan: 'sulung' | 'tengah' | 'bongsu';
  ibuBapa: 'sihat' | 'uzur';
  adikBeradik: 'sikit' | 'ramai';
  sifat: string[];
  rupa: Rupa;
}

export interface Pasangan {
  nama: string;
  jantina: Jantina;
  agama: 'islam' | 'kristian' | 'buddha' | 'hindu';
  negeri: string;
  asal: 'bandar' | 'kampung';
  kerjaya: 'kerajaan' | 'swasta' | 'gig' | 'niaga';
  kerjaLabel: string;
  gaji: number;
  usia: number; // umur semasa jumpa
  sifat: string[]; // 2 sifat; satu dipaparkan, satu ditemui
  tersembunyi: string[]; // mengawal, rahsiaHutang, mahuPoligami, curang ...
  bk: BahasaKasih;
  suka: Gaya; // gaya jawapan yang dia mahu (rawak setiap dunia)
  makanan: string;
  mertuaSifat: 'penyayang' | 'suka campur' | 'pilih kasih' | 'uzur';
  mertuaNama: string;
  rupa: Rupa;
}

export interface Anak {
  nama: string;
  jantina: Jantina;
  lahir: number; // indeks bulan permainan
  sifat: string;
}

export interface Meter {
  kasih: number;
  percaya: number;
  stres: number;
}

export interface Sembunyi {
  mertua: number;
  ibubapa: number;
  anak: number;
  kesihatan: number;
  reputasi: number;
  luka: number;
  keintiman: number;
  kawan: number;
}

export interface Duit {
  tunai: number;
  hutang: number;
  simpanan: number;
  kwsp: number;
  ptptn: number;
}

export interface Mesej {
  d: string; // pengirim: pasangan | saya | mak | ayah | group | kawan | ex | sistem
  t: string;
  b: number; // bulan permainan
}

export interface Album {
  teks: string;
  umur: number;
  fasa: number;
  emoji: string;
}

export interface Rancang {
  gaya: 0 | 1 | 2; // jimat, biasa, selesa
  simpan: 0 | 10 | 20;
  ibuBapa: 0 | 200 | 400;
  fokus: 'kerja' | 'pasangan' | 'keluarga' | 'diri';
}

export interface Stat {
  gaduh: number;
  gaduhBesar: number;
  hantaran: number;
  kenduri: number;
  anak: number;
  cucu: number;
  maaf: number;
  sesal: number;
  rawatan: number;
}

export interface Game {
  v: 1;
  seed: string;
  mod: Mod;
  dewasa: boolean;
  sensitif: boolean;
  w: Watak;
  p: Pasangan | null;
  rel: Rel;
  fasa: number;
  fasaCount: number;
  bulan: number; // bulan sejak mula (umur 22)
  meter: Meter;
  sembunyi: Sembunyi;
  duit: Duit;
  gaji: number;
  rancang: Rancang;
  rumah: 'keluarga' | 'sewa' | 'beli';
  kereta: 'tiada' | 'motor' | 'kereta';
  flag: Record<string, any>;
  anak: Anak[];
  lihat: Record<string, number>;
  lihatIdx: Record<string, number>;
  bil: number; // bilangan peristiwa dilalui
  queue: string[];
  next: string | null;
  memori: { teks: string; bulan: number }[];
  chat: Record<string, Mesej[]>;
  album: Album[];
  stat: Stat;
  nada: string[];
  bkTepat: number;
  pasanganBil: number; // berapa pasangan pernah dijana
  rs: number; // keadaan rawak
  snapshot: string | null; // untuk undur (mod santai) sekali setiap fasa
  undurGuna: boolean;
  tamat: Ending | null;
  log: string[]; // ringkasan kesan peristiwa terakhir
}

export interface Ending {
  skor: number;
  komponen: { nama: string; berat: number; nilai: number }[];
  gelaran: string;
  nasihat: string;
}

// ---------- Kandungan ----------

export type Num = number | string; // string = ungkapan, cth "-$hantaran" atau "$gaji*3"

export interface Kesan {
  kasih?: Num;
  percaya?: Num;
  stres?: Num;
  mertua?: Num;
  ibubapa?: Num;
  anak?: Num;
  kesihatan?: Num;
  reputasi?: Num;
  luka?: Num;
  keintiman?: Num;
  kawan?: Num;
  tunai?: Num;
  hutang?: Num;
  simpanan?: Num;
  kwsp?: Num;
  gaji?: Num;
  flag?: Record<string, any>;
  rel?: Rel;
  fasa?: number;
  mini?: string;
  stat?: Partial<Record<keyof Stat, Num>>;
  ptptn?: Num;
  pasanganIslam?: boolean;
  catat?: string; // masuk ke album kenangan
  emoji?: string;
  ingat?: string; // pasangan akan ingat dan ungkit nanti
  rumah?: 'keluarga' | 'sewa' | 'beli';
  kereta?: 'tiada' | 'motor' | 'kereta';
  anakLahir?: number; // bilangan anak lahir
  bulan?: number; // tambah masa (bulan)
  lompat?: number; // langkau tahun
  kerja?: Watak['kerjaya'];
  putus?: boolean; // putus hubungan dengan pasangan semasa
  pasanganBaru?: boolean;
  tamat?: boolean;
}

export interface Syarat {
  rel?: Rel[];
  jantina?: Jantina;
  asal?: 'bandar' | 'kampung';
  negeri?: string[];
  kerjaya?: string[];
  pendidikan?: string[];
  sifat?: string[]; // pemain ada salah satu
  sifatP?: string[]; // pasangan ada salah satu (nampak atau tersembunyi)
  mertua?: string[];
  umurMin?: number;
  umurMax?: number;
  flag?: Record<string, any>; // nilai true / false / nombor / teks
  tiada?: string[]; // flag tidak ditetapkan
  min?: Record<string, number>; // meter, sembunyi atau duit
  max?: Record<string, number>;
  anakMin?: number;
  anakMax?: number;
  fasaMin?: number; // bilangan peristiwa dalam fasa ini
  ibuBapa?: 'sihat' | 'uzur';
  tunaiMin?: number;
  mod?: Mod[];
  bezaNegeri?: boolean;
}

export interface Rawak {
  p: Num;
  ya: Kesan & { h?: string };
  tidak: Kesan & { h?: string };
}

export interface Pilihan {
  t: string;
  h?: string;
  k?: Kesan;
  gaya?: Gaya;
  bk?: BahasaKasih;
  ikut?: Record<string, Kesan>; // "p:cemburu", "s:boros", "m:suka campur"
  rawak?: Rawak;
  syarat?: Syarat;
  lucu?: boolean;
}

export type Jenis = 'biasa' | 'pilihPasangan' | 'pergaduhan' | 'ujian' | 'mini' | 'penilaian';

export interface Peristiwa {
  id: string;
  tajuk: string;
  fasa: number[]; // [0] = mana-mana fasa
  jenis?: Jenis;
  syarat?: Syarat;
  berat?: number;
  ulang?: boolean | number;
  wajib?: boolean;
  urut?: number;
  besar?: boolean;
  fasaNext?: number;
  bulan?: Num | [number, number];
  tag?: string[];
  latar?: string;
  teks: string[];
  chat?: { d: string; t: string }[];
  utas?: string;
  pilihan?: Pilihan[];
  mini?: string;
  miniHasil?: { tinggi: Pilihan; sederhana: Pilihan; rendah: Pilihan };
  seterusnya?: string;
  cd?: number;
  amaran?: string; // amaran kandungan
  bantuan?: boolean;
}

export interface Soalan {
  id: string;
  untuk: Jantina | 'semua';
  soalan: string;
  maksud: string;
  tag: string[];
  pilihan: Pilihan[];
}

export interface Pencetus {
  id: string;
  jenis: 'kecil' | 'besar';
  teks: string;
  syarat?: Syarat;
  luka?: number; // tambah luka jika tidak selesai
}

export interface Harga {
  gajiMula: Record<string, Record<string, number>>;
  faktorLokasi: Record<string, number>;
  kosHidup: Record<string, Record<string, number>>;
  kereta: Record<string, number>;
  ptptn: { baki: Record<string, number>; ansuran: Record<string, number> };
  anak: Record<string, number>;
  negeri: Record<string, { hantaran: number; kenduriBesar: number; kenduriSederhana: number }>;
  inflasi: number;
  kadarBunga: number;
  nota: string;
}

export interface Content {
  peristiwa: Peristiwa[];
  soalan: Soalan[];
  pergaduhan: Pencetus[];
  nama: { lelaki: string[]; perempuan: string[]; mertua: string[]; anak: string[] };
  harga: Harga;
  sifat: { semua: string[]; bk: Record<BahasaKasih, string>; makanan: string[]; kerjaLabel: Record<string, string[]> };
}
