# NARA

## Website publik

GitHub Pages menerbitkan frontend statis; backend Node.js, PostgreSQL, dan Redis harus dijalankan pada layanan hosting terpisah.

1. Deploy backend mengikuti langkah di [`backend/README.md`](./backend/README.md) ke hosting yang menyediakan Node.js, PostgreSQL, dan Redis.
2. Salin alamat HTTPS API publik, misalnya `https://api.example.com/api`.
3. Ubah nilai `data-api-base` pada tag `script` di `index.html` dari alamat lokal menjadi alamat API publik.
4. Atur `CORS_ORIGIN` backend ke origin website GitHub Pages yang tepat, misalnya `https://USERNAME.github.io`. Jangan menambahkan path repo pada origin.
5. Push frontend ke branch `main`, lalu pilih **Settings → Pages → GitHub Actions**. Workflow `.github/workflows/deploy-pages.yml` hanya menerbitkan file frontend, bukan backend atau rahasia konfigurasi.

Frontend mengambil katalog dari API. Pendaftaran/login memakai bearer token berumur 15 menit; keranjang tamu hanya tersimpan selama halaman terbuka, sedangkan keranjang pengguna yang login tersimpan di PostgreSQL. Jika API katalog tidak dapat dijangkau, website menampilkan katalog demo. Fitur checkout dan pembayaran belum diimplementasikan.

Untuk pengujian lokal, jalankan backend dan layanan database sesuai panduan backend, lalu sajikan folder frontend melalui HTTP (jangan membuka `index.html` langsung dengan `file://`). Pastikan nilai `CORS_ORIGIN` sesuai origin server frontend lokal.
