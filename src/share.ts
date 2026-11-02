// Kad kongsi (gambar PNG) dilukis pada canvas: ringkasan fasa dan kad akhir.
import { labelFasa, rm, tarikh, umur } from './engine';
import type { Game } from './types';

function bungkus(ctx: CanvasRenderingContext2D, teks: string, x: number, y: number, lebar: number, tinggi: number): number {
  const kata = teks.split(' ');
  let baris = '';
  let yy = y;
  for (const k of kata) {
    const uji = baris ? baris + ' ' + k : k;
    if (ctx.measureText(uji).width > lebar && baris) {
      ctx.fillText(baris, x, yy);
      baris = k;
      yy += tinggi;
    } else baris = uji;
  }
  if (baris) ctx.fillText(baris, x, yy);
  return yy + tinggi;
}

function dasar(): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const x = c.getContext('2d')!;
  const gr = x.createLinearGradient(0, 0, 1080, 1350);
  gr.addColorStop(0, '#ffb86b');
  gr.addColorStop(0.55, '#ff6f6f');
  gr.addColorStop(1, '#8a4fff');
  x.fillStyle = gr;
  x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = 'rgba(255,255,255,.92)';
  x.beginPath();
  x.roundRect(60, 120, 960, 1110, 48);
  x.fill();
  x.fillStyle = '#fff';
  x.font = '700 54px system-ui, sans-serif';
  x.fillText('🌶️ Asam Garam', 60, 90);
  return { c, x };
}

function tamatKad(c: HTMLCanvasElement, x: CanvasRenderingContext2D): Promise<Blob> {
  x.fillStyle = '#fff';
  x.font = '500 30px system-ui, sans-serif';
  x.fillText('Simulator rumah tangga Malaysia · percuma · sumber terbuka', 60, 1290);
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
}

export function kadFasa(g: Game, fasaTamat: number): Promise<Blob> {
  const { c, x } = dasar();
  x.fillStyle = '#2b2230';
  x.font = '700 64px system-ui, sans-serif';
  const tajuk = ['', 'Bujang', 'Bercinta', 'Merisik & Bertunang', 'Persiapan & Nikah', 'Awal Kahwin', 'Membina Keluarga', 'Pertengahan', 'Hari Tua'][fasaTamat] || labelFasa(g);
  bungkus(x, `Fasa ${fasaTamat}: ${tajuk}`, 110, 220, 860, 76);
  x.font = '500 40px system-ui, sans-serif';
  x.fillStyle = '#6a5a73';
  x.fillText(`${g.w.nama} · umur ${Math.floor(umur(g))} · ${tarikh(g)}`, 110, 330);
  const baris: string[] = [];
  if (g.rel === 'berkahwin' && g.flag.kahwinBulan !== undefined) baris.push(`💍 Kahwin umur ${Math.floor(22 + g.flag.kahwinBulan / 12)}`);
  if (g.stat.hantaran) baris.push(`💰 Hantaran ${rm(g.stat.hantaran)}`);
  if (g.stat.kenduri) baris.push(`🎪 Belanja kenduri ${rm(g.stat.kenduri)}`);
  baris.push(`😤 Bergaduh ${g.stat.gaduh} kali (${g.stat.gaduhBesar} meletup)`);
  baris.push(`🕊️ Minta maaf ${g.stat.maaf} kali`);
  if (g.anak.length) baris.push(`👶 ${g.anak.length} anak`);
  baris.push(`💸 Hutang ${rm(g.duit.hutang)} · Simpanan ${rm(g.duit.simpanan)}`);
  x.fillStyle = '#2b2230';
  x.font = '600 48px system-ui, sans-serif';
  let y = 450;
  for (const b of baris) { x.fillText(b, 110, y); y += 84; }
  x.font = 'italic 38px system-ui, sans-serif';
  x.fillStyle = '#6a5a73';
  const ak = g.album[g.album.length - 1];
  if (ak) bungkus(x, `“${ak.teks}”`, 110, y + 40, 860, 52);
  return tamatKad(c, x);
}

export function kadAkhir(g: Game): Promise<Blob> {
  const { c, x } = dasar();
  const t = g.tamat!;
  x.fillStyle = '#2b2230';
  x.font = '600 40px system-ui, sans-serif';
  x.fillText('Kad Kebahagiaan', 110, 200);
  x.font = '800 150px system-ui, sans-serif';
  x.fillStyle = '#e4572e';
  x.fillText(`${t.skor}`, 110, 350);
  x.font = '600 40px system-ui, sans-serif';
  x.fillStyle = '#6a5a73';
  x.fillText('/ 100', 110 + x.measureText(`${t.skor}`).width * 0 + 330, 350);
  x.font = '800 62px system-ui, sans-serif';
  x.fillStyle = '#2b2230';
  bungkus(x, `“${t.gelaran}”`, 110, 450, 860, 72);
  let y = 560;
  x.font = '500 32px system-ui, sans-serif';
  for (const k of t.komponen) {
    x.fillStyle = '#2b2230';
    x.fillText(`${k.nama} (${k.berat}%)`, 110, y);
    x.fillStyle = '#eadff2';
    x.fillRect(110, y + 14, 860, 20);
    x.fillStyle = '#8a4fff';
    x.fillRect(110, y + 14, (860 * k.nilai) / 100, 20);
    y += 74;
  }
  x.fillStyle = '#6a5a73';
  x.font = 'italic 34px system-ui, sans-serif';
  bungkus(x, `Nasihat: ${t.nasihat}`, 110, y + 30, 860, 46);
  return tamatKad(c, x);
}

export async function kongsiGambar(blob: Blob, nama: string) {
  const fail = new File([blob], nama, { type: 'image/png' });
  const nav = navigator as any;
  try {
    if (nav.canShare && nav.canShare({ files: [fail] })) {
      await nav.share({ files: [fail], title: 'Asam Garam', text: 'Kad dari Asam Garam, simulator rumah tangga Malaysia' });
      return;
    }
  } catch { /* pengguna batal atau tidak disokong */ }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
