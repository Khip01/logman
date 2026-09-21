# Metrik referensi template Log Book

Hasil ekstraksi dari `Log-Book-Template.docx`. Sumber ini menggantikan kebutuhan membedah
ulang docx. Acuan aturan: AGENTS.md bagian 11 dan 12.

## Halaman

- Ukuran: A4, 210 x 297 mm (twips 11906 x 16838).
- Margin: 2.54 cm semua sisi (twips 1440).
- Header jarak: 720 twips (1.27 cm). Footer jarak: 720 twips.

## Tipografi

- Font dokumen: Times New Roman.
- Ukuran teks isi: 12 pt (half-points 24).
- Spasi baris: 1.08 (line 259, auto).

## Kop surat (letterhead)

- Logo: `public/letterhead-polinema.png` (24.5 KB), diekstrak dari `word/media/image1.png`.
- Teks kop:
  - KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
  - POLITEKNIK NEGERI MALANG
  - JURUSAN TEKNOLOGI INFORMASI
  - Jalan Soekarno Hatta Nomor 9, Jatimulyo, Lowokwaru, Malang 65141
  - Telepon (0341) 404424, 404425, Faksimile (0341) 404420
  - Laman www.polinema.ac.id
- Kop ditampilkan pada halaman pertama dan halaman berikutnya.

## Tabel identitas (tabel 1)

- 2 kolom, lebar total 9150 twips (16.14 cm).
- Baris: Nama, NIM, Program Studi, Nama Mitra Industri.
- Nilai default dari template:
  - Program Studi: Sarjana Terapan Teknik Informatika
  - Nama Mitra Industri: PT Naraya Telematika

## Tabel kegiatan (tabel 2)

- 4 kolom, lebar total 9225 twips (16.27 cm).
- Lebar kolom (twips): Hari, Tanggal 1545 | Jam Masuk 1289 | Jam Pulang 1351 |
  Kegiatan 5040.
- Tinggi baris minimum: 1020 twips (1.80 cm), aturan `atLeast` (tumbuh mengikuti isi).
- Jumlah baris kegiatan: 6 (Senin sampai Sabtu).
- Header baris: Hari, Tanggal | Jam Masuk | Jam Pulang | Kegiatan.
- Shading header: `#D0CECE`.
- Nilai default jam: 08.00 masuk, 16.00 pulang.

## Blok tanda tangan

- Baris pertama: "Mahasiswa," dengan ruang tanda tangan.
- Baris kedua: "Mengetahui," diikuti "Dosen Pembimbing," dan "Pembimbing Lapangan".
- Garis titik-titik untuk nama terang.
