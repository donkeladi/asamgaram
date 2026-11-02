// Memuat content/ untuk skrip Node (pengesah dan simulasi).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Content, Peristiwa } from '../src/types';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const j = (f: string) => JSON.parse(readFileSync(join(akar, f), 'utf8'));

export function muatKandungan(): Content {
  const peristiwa: Peristiwa[] = [];
  for (const f of readdirSync(join(akar, 'peristiwa')).sort()) if (f.endsWith('.json')) peristiwa.push(...j('peristiwa/' + f));
  return {
    peristiwa,
    soalan: j('soalan.json'),
    pergaduhan: j('pergaduhan.json'),
    nama: j('nama.json'),
    harga: j('harga.json'),
    sifat: j('sifat.json'),
  };
}
