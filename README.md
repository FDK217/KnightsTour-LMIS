# Knight's Tour & LMIS Visualization 🏰♟️📈

**Ringkasan singkat**

Aplikasi web kecil untuk visualisasi Knight's Tour (papan catur) dan demonstrasi algoritma LMIS (Longest Monotonically Increasing Subsequence). Dibangun sebagai halaman statis (HTML/CSS/JS) buka `index.html` di browser atau jalankan dengan development server seperti Live Server.

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

### LMIS
1. Pilih tab **LMIS**.
2. Masukkan deret angka di input (contoh: `4, 1, 13, 7, 0, 2, 8, 11, 3`).
3. Klik **Cek LMIS** → hasil dan highlight subsequence akan muncul di panel hasil.

Contoh keluaran untuk input di atas: `4, 7, 8, 11` (salah satu LMIS, sesuai aturan tie-breaker).

### Knight's Tour ♟️
1. Pilih tab **Knight's Tour**.
2. Klik satu kotak di papan untuk memilih posisi awal kuda (atau biarkan posisi default).
3. Pilih tipe tour: **Open** (bukan harus kembali ke awal) atau **Closed** (harus kembali ke posisi awal).
4. Atur kecepatan animasi dengan slider **Kecepatan Animasi**.
5. Klik **Mulai Tour** untuk menjalankan solver; animasi langkah akan terlihat di papan.
6. Jika solver tidak menemukan solusi (mis. untuk beberapa posisi awal pada tipe Closed), akan muncul pesan `Gagal menemukan solusi (Coba posisi lain)` — coba ubah posisi awal atau ubah tipe tour.
7. Gunakan **Reset** untuk membatalkan تشغيل atau mengatur ulang papan.

Catatan teknis: solver menggunakan heuristik Warnsdorff (pencarian berbasis derajat valid move) dan meng-animate jalur bila ditemukan.
---

## Menjalankan & Mengembangkan 🔧

- Tech: Vanilla HTML/CSS/JS (tidak ada build step).
- Untuk mengedit: buka `script.js` dan lihat bagian `TASK 2: LMIS (TREE APPLICATION)` untuk logika rekursif dan `visualizeLMIS` untuk output.
- Jika ingin menambahkan fitur: menambahkan opsi "show all LMIS" atau mengembalikan/ekstensi klaim berdasarkan indeks/penjelasan validasi adalah perubahan lokal yang langsung dapat diuji di browser.

---

## Testing singkat ✅

- Uji input: `4, 1, 13, 7, 0, 2, 8, 11, 3` → periksa bahwa hasil menunjukkan subsequence panjang maksimum (mis. `4,7,8,11` atau variasi setara).
- Uji edge: input kosong/format invalid → aplikasi menampilkan pesan validasi.

---
