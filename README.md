# Knight's Tour & LMIS Visualization 🏰♟️📈

**Ringkasan singkat**

Aplikasi web kecil untuk visualisasi Knight's Tour (papan catur) dan demonstrasi algoritma LMIS (Longest Monotonically Increasing Subsequence). Dibangun sebagai halaman statis (HTML/CSS/JS) — buka `index.html` di browser atau jalankan dengan development server seperti Live Server.

---

## Fitur utama ✅

- Visualisasi Knight's Tour dengan langkah animasi dan kontrol kecepatan.
- Kalkulasi LMIS untuk sebuah input sequence (nilai dipisah koma).
- Visualisasi node LMIS dan highlight subsequence hasil.
- Sederhana untuk di-extend: pilihan untuk menampilkan semua solusi LMIS atau menambahkan klaim jawaban.

---

## LMIS — Perilaku & Implementasi 🔍

- Algoritma: *exhaustive tree search (include/exclude)* yang berjalan rekursif pada setiap indeks.
- Tie-breaker: fungsi rekursif sekarang mengeksplor *include* terlebih dahulu; hasil yang dipilih adalah subsequence pertama yang ditemukan dengan panjang maksimum menurut urutan pencarian.
- Fallback: jika tidak ada subsequence lebih dari 0 (jarang), aplikasi memilih elemen maksimum tunggal.

Catatan: fitur "Klaim LMIS" awalnya disediakan untuk latihan (user dapat memeriksa jawaban), namun telah **dihapus** dari UI pada commit terakhir. Logika klaim dan parsing dihapus guna menyederhanakan antarmuka.

---

## Cara pakai (Quick Start) ▶️

1. Buka `index.html` di browser (atau jalankan Live Server di VS Code).
2. Pilih tab **LMIS**.
3. Masukkan deret angka di input (contoh: `4, 1, 13, 7, 0, 2, 8, 11, 3`).
4. Klik **Cek LMIS** → hasil dan highlight subsequence akan muncul di panel hasil.

Contoh keluaran untuk input di atas: `4, 7, 8, 11` (salah satu LMIS, sesuai aturan tie-breaker).

---

## Testing singkat ✅

- Uji input: `4, 1, 13, 7, 0, 2, 8, 11, 3` → periksa bahwa hasil menunjukkan subsequence panjang maksimum (mis. `4,7,8,11` atau variasi setara).
- Uji edge: input kosong/format invalid → aplikasi menampilkan pesan validasi.

---
