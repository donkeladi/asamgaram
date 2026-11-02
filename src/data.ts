// Memuat semua kandungan cerita dari folder content/ semasa build.
import type { Content, Peristiwa } from './types';
import nama from '../content/nama.json';
import harga from '../content/harga.json';
import sifat from '../content/sifat.json';
import soalan from '../content/soalan.json';
import pergaduhan from '../content/pergaduhan.json';

const modul = import.meta.glob('../content/peristiwa/*.json', { eager: true, import: 'default' }) as Record<string, Peristiwa[]>;

export const kandungan: Content = {
  peristiwa: Object.keys(modul).sort().flatMap((k) => modul[k]),
  soalan: soalan as any,
  pergaduhan: pergaduhan as any,
  nama: nama as any,
  harga: harga as any,
  sifat: sifat as any,
};
