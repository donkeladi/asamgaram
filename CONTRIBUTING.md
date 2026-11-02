# Menyumbang kepada Asam Garam

Terima kasih! Cerita dan data ialah bahagian paling penting, dan anda tak perlu menulis kod untuk menyumbang.

## 1. Tambah peristiwa

1. Salin `content/templat-peristiwa.json` ke dalam fail dalam `content/peristiwa/` (atau tambah dalam fail fasa sedia ada).
2. Tulis peristiwa. Medan utama:

| Medan | Maksud |
|---|---|
| `id` | unik, cth. `p5_remote_tv` (awalan fasa) |
| `fasa` | senarai fasa 1 hingga 8; `[0]` = mana-mana fasa |
| `syarat` | bila boleh muncul: `rel`, `jantina`, `asal`, `negeri`, `kerjaya`, `pendidikan`, `sifat` (pemain), `sifatP` (pasangan), `mertua`, `umurMin/Max`, `flag`, `tiada`, `min`/`max` (meter, duit), `anakMin/Max`, `fasaMin`, `mod`, `bezaNegeri` |
| `berat` | kekerapan relatif (default 5; kejadian jarang 0.5) |
| `ulang` | `true` atau bilangan kali; `cd` = jarak minimum (bilangan peristiwa) |
| `wajib` + `urut` | mesti muncul dahulu dalam fasa |
| `besar` + `fasaNext` | keputusan besar yang menutup fasa |
| `bulan` | masa berlalu (nombor atau `[min,maks]`) |
| `tag` | `lucu`, `berat`, `sensitif`, `dewasa`, `keganasan`, `kematian` (menentukan penapis mod/tetapan) |
| `teks` | 3 hingga 5 versi tulisan; guna `{nama}`, `{saya}`, `{hantaran}`, `{kenduriBesar}`, `{mak}`, `{negeri}`, `{pasGelar}` … |
| `pilihan` | 2 hingga **4** pilihan: `t` (teks), `h` (hasil), `k` (kesan), `gaya`/`bk` (padanan citarasa pasangan), `ikut` (kesan tambahan ikut sifat), `rawak` (dadu), `syarat` |
| `jenis` | `biasa`, `ujian`, `pergaduhan`, `mini`, `pilihPasangan`, `penilaian` |

Kesan (`k`) menerima angka atau ungkapan: `"tunai": "-$kenduriBesar"`, `"hutang": "$gaji*2"`. Pembolehubah: `$gaji`, `$tunai`, `$hutang`, `$simpanan`, `$kwsp`, `$hantaran`, `$kenduriBesar`, `$kenduriSederhana`, `$ivf`, `$rawatan`, `$hospital`, `$bersalin`, `$kereta`, `$depositRumah`, `$rumah`, `$umrah`, `$bisnes`, `$cuti`, `$sekolah`, `$raya`.

3. Jalankan:

```bash
npm run sahkan          # mesti lulus
npm run simulasi -- 200 # tiada fasa tersekat
```

## 2. Peraturan penulisan (daripada pelan reka bentuk)

* **Maksimum 4 pilihan** (satu ibu jari) dan **tiada jawapan "salah" yang jelas**: tulis neutral, biar kesan diketahui kemudian.
* Sekurang-kurangnya **satu pilihan lucu** setiap peristiwa biasa.
* Lawak datang daripada situasi yang semua orang Malaysia kenal, **bukan menghina** mana-mana pihak.
* **Adil kepada kedua-dua jantina**: kesalahan boleh datang daripada mana-mana pihak. Elak "perempuan selalu merajuk, lelaki selalu salah".
* **Tiada pengakhiran "kalah"**: cerai, bujang, tanpa anak ialah pengakhiran yang sah.
* Tema berat (keguguran, ketidaksuburan, keganasan rumah tangga, kematian): nada serius dan lembut, letak `tag` `berat`/`sensitif`/`keganasan`, tambah `amaran`, tiada adegan fizikal, tiada ganjaran untuk pelaku, dan sertakan `"bantuan": true` jika berkaitan keganasan.
* Kandungan dewasa: **tidak eksplisit**; layar gelap atau lompat ke pagi, tag `dewasa`; mesej komunikasi dan persetujuan.
* Agama dan adat: semak dengan perunding/pembaca latar; jangan promosi atau persenda. Sertakan sumber dalam PR untuk fakta undang-undang atau angka.
* **Tiada nama sebenar** individu, syarikat atau jenama peribadi. Agensi kerajaan (cth. PTPTN, KWSP) dirujuk secara umum.
* Bahasa Melayu sahaja, nada santai Malaysia.

## 3. Tambah soalan "ujian" atau pencetus pergaduhan

* `content/soalan.json`: soalan + `maksud` tersirat + pilihan dengan `gaya` (`jujur`, `lembut`, `humor`, `diam`, `tegas`). Gaya yang dimahukan pasangan dijana rawak setiap dunia, jadi "cheat" tak sentiasa berkesan.
* `content/pergaduhan.json`: `jenis` `kecil` atau `besar`.

## 4. Kod

PR kod dialu-alukan: logik dalam `src/engine.ts` (tanpa DOM), UI dalam `src/ui.ts`. Jalankan `npm run build` dan `npm run sahkan` sebelum PR.

Dengan menyumbang, anda bersetuju sumbangan anda dilesenkan di bawah MIT.
