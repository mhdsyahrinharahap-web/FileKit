# FileKit

Aplikasi web statis untuk mengompres, menggabungkan, dan mengonversi file PDF serta gambar langsung di browser tanpa batas kuota harian dan tanpa unggah file ke server.

## Fitur Utama

* **Kompres**: Mengompres gambar (JPG, PNG, WebP) menggunakan Canvas API dengan pengatur kualitas (10%–100%) serta mengompres file PDF di browser menggunakan `pdf.js` dan `pdf-lib`.
* **Gabung PDF**: Menggabungkan beberapa file PDF atau gambar menjadi satu dokumen PDF menggunakan `pdf-lib`, dilengkapi pengaturan urutan lewat *drag and drop* atau tombol Naik/Turun.
* **Konversi**: Mengonversi gambar ke PDF, PDF ke gambar (JPG/PNG, otomatis dibungkus ke file ZIP bila lebih dari satu halaman memakai `JSZip`), serta konversi antarformat gambar (JPG, PNG, WebP).

