# 🌶️ Asam Garam: Simulator Rumah Tangga Malaysia

Hidupkan seorang lelaki atau perempuan bujang di Malaysia, dari umur 22 hingga hari tua. Setiap keputusan kecil membentuk jenis rumah tangga yang terhasil: merisik, hantaran, kursus pra-perkahwinan, kenduri, mertua, PTPTN, KWSP, rumah pertama, ikhtiar anak, mahkamah syariah, dan banyak lagi.

> **18+**, tidak eksplisit. Sumber terbuka (MIT), percuma, tiada iklan, tiada server. Simpanan disimpan dalam pelayar anda sahaja.

Ini pelaksanaan **MVP** daripada dokumen *Pelan Reka Bentuk: Simulator Rumah Tangga Malaysia*.

## Cara main

1. Cipta watak (jantina, asal, negeri, pendidikan, kerjaya, keluarga, 2 sifat) dan pilih mod: **Santai**, **Realistik** atau **Cabaran**.
2. Tekan **Teruskan** untuk peristiwa seterusnya. Setiap peristiwa ada maksimum 4 pilihan dan tiada jawapan "salah" yang jelas; kesan sebenar diketahui kemudian.
3. Perhatikan ikon ❤️ kasih sayang, 🤝 kepercayaan, 💰 kewangan dan 😵‍💫 stres. Ia sengaja tidak menunjukkan nombor tepat supaya anda belajar *membaca* pasangan.
4. Urus **Dompet** (gaya hidup, simpanan, duit ibu bapa) dan **Fokus** bulanan (kerja, pasangan, keluarga atau diri sendiri). Masa tak cukup untuk semua.
5. Di akhir hidup, anda dapat **Kad Kebahagiaan** (0 hingga 100, tujuh komponen berwajaran), gelaran lucu, garis masa dan nasihat watak tua kepada dirinya yang muda. Kad boleh dikongsi sebagai gambar.

Tiada pengakhiran "kalah": bercerai, kekal bujang atau tanpa anak ialah pengakhiran yang sah.

## Apa yang ada dalam MVP ini

| Bahagian pelan | Status |
|---|---|
| 8 fasa hidup (bujang → hari tua) dengan peristiwa wajib, rawak dan satu keputusan besar setiap fasa | ✅ |
| Meter kasih sayang, kepercayaan, kewangan, stres + meter tersembunyi (mertua, anak, kesihatan, reputasi, luka lama, keintiman…) | ✅ |
| Belanjawan bulanan, hutang berfaedah, inflasi, KWSP, PTPTN, kos anak, kos mengikut lokasi (`content/harga.json`) | ✅ |
| ~125 peristiwa, 22 soalan "ujian", 18 pencetus pergaduhan, semua dalam fail JSON | ✅ (sasaran pelan: 60 untuk MVP, 150 kemudian; soalan 300) |
| Sistem pergaduhan berpusingan (Meter Panas) + pembaikan + "ingatan pasangan" yang mengungkit pilihan lama | ✅ |
| Rawak berwajaran dengan **kod dunia** (seed): pasangan, sifat tersembunyi, bahasa kasih dan "jawapan yang dia mahu" dijana semula | ✅ |
| 10 mini-game: tawar hantaran, teka mood, pujuk merajuk, bajet hujung bulan, rombongan raya, tidurkan bayi, kuiz kenal pasangan, parking kenduri, masak untuk mertua, hantar anak | ✅ |
| Laluan Melayu-Muslim, adat Melayu; pasangan bukan Muslim → hanya memeluk Islam atau berpisah | ✅ |
| Poligami (syarat mahkamah syariah, penilaian keadilan), perceraian (talak, fasakh, khuluk), rujuk | ✅ |
| Keganasan rumah tangga sebagai laluan amaran (bukan hiburan), Talian Kasih 15999 sentiasa di menu 🆘 | ✅ |
| Rating 18+: pagar umur, kandungan dewasa dan tema sensitif boleh dimatikan, babak dewasa dipotong | ✅ |
| UI: Rumah, Chat, Dompet, Kalendar, Salasilah, Album kenangan | ✅ |
| Simpan automatik, undur sekali setiap fasa (mod Santai), eksport/import simpanan, kongsi kad (PNG) | ✅ |
| Mobile-first + desktop, mod gelap, saiz teks, PWA (boleh dipasang, main luar talian) | ✅ |
| Kaum lain, lebih banyak negeri/adat, peristiwa musiman (CNY, Deepavali), Lottie, ilustrasi tangan | ⏳ roadmap tahap 4 |

### Beza dengan pelan (keputusan teknikal)

* **Vanilla TypeScript + Vite** digunakan, bukan Svelte/React: lebih ringan dan tiada rangka kerja untuk dipelajari penyumbang. Pelan menyebut "atau"; menukar kemudian mudah kerana logik berada dalam `src/engine.ts` tanpa DOM.
* **Grafik**: watak kartun flat berlapis dijana sebagai SVG dalam kod (badan, wajah, baju, ekspresi mengikut mood). Tiada aset luar. PixiJS/Phaser dan Lottie belum digunakan.
* **Muzik/bunyi**: dijana dengan WebAudio (tiada fail audio).
* Bahasa: Bahasa Melayu sahaja.

## ⚠️ Perkara yang mesti disemak sebelum "rasmi"

Pelan sendiri menyatakan bahawa fakta undang-undang perlu disemak oleh pakar. Dalam repositori ini:

* Semua **angka harga, gaji, hantaran dan kenduri mengikut negeri** dalam `content/harga.json` ialah **anggaran untuk permainan**, bukan data rasmi.
* Prosedur mahkamah syariah, syarat poligami, edah, mut'ah, harta sepencarian, hak jagaan dan tatacara nikah diringkaskan dan **belum disemak oleh perunding agama/undang-undang** (item "Masih perlu diputuskan" dalam pelan). Cipta isu atau PR dengan sumber rasmi untuk membetulkan.
* Game ini hiburan, bukan nasihat guaman, kewangan atau perubatan.

## Jalankan secara setempat

```bash
npm install
npm run dev        # pelayan pembangunan
npm run build      # bina ke dist/
npm run preview    # uji binaan
npm run sahkan     # sahkan semua kandungan JSON (id, rujukan, token, ungkapan, bilangan pilihan)
npm run simulasi -- 500   # main 500 permainan rawak tanpa kepala: cari jalan buntu dan ralat
```

## Hos di GitHub Pages

`.github/workflows/deploy.yml` mengesahkan kandungan, menjalankan simulasi, membina dan menerbitkan setiap kali `main` dikemas kini. Di Settings → Pages, pilih **Source: GitHub Actions**. Laluan asas ialah relatif (`./`), jadi ia berfungsi di `username.github.io/nama-repo/`.

## Struktur

```
content/
  peristiwa/*.json    cerita mengikut fasa (+ silang.json: ujian, gaduh, cerai, poligami…)
  soalan.json         soalan "ujian" pasangan (maksud tersirat)
  pergaduhan.json     pencetus pergaduhan kecil/besar
  harga.json          harga, gaji, hantaran & kenduri mengikut negeri
  nama.json, sifat.json
src/
  engine.ts           enjin teras (tanpa DOM): meter, belanjaan, syarat, pemilihan peristiwa, penilaian
  pergaduhan.ts       sistem pergaduhan
  minigames.ts        10 mini-game
  ui.ts, avatar.ts, style.css, audio.ts, share.ts, store.ts
scripts/              pengesah kandungan + simulasi
```

## Menyumbang cerita

Penyumbang tak perlu sentuh kod: tambah fail dalam `content/peristiwa/`. Lihat [CONTRIBUTING.md](CONTRIBUTING.md) dan `content/templat-peristiwa.json`.

## Bantuan sebenar

Jika anda atau seseorang yang anda kenal mengalami keganasan rumah tangga: **Talian Kasih 15999**; kecemasan **999**.

## Lesen

Kod: MIT (lihat `LICENSE`). Semua aset visual dan bunyi dijana dalam kod, jadi tiada aset berlesen berasingan. Sumbangan cerita dianggap di bawah lesen yang sama.
