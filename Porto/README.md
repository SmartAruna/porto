# NARA

## Publikasikan website

Website ini dapat dipublikasikan secara gratis melalui GitHub Pages. Workflow di `.github/workflows/deploy-pages.yml` hanya mengirim `index.html`, `script.js`, dan `style.css`; backend dan file database tidak dipublikasikan.

1. Push repository ini ke GitHub pada branch `main`.
2. Pastikan repository bersifat publik (atau paket GitHub Anda mendukung Pages untuk repository privat).
3. Buka **Settings → Pages**, lalu pilih **GitHub Actions** sebagai sumber deployment.
4. Jalankan workflow **Deploy website to GitHub Pages** pada tab **Actions**, atau push perubahan ke `main`.
5. Setelah workflow berhasil, alamat website tersedia di **Settings → Pages**.

Halaman katalog dan keranjang saat ini berjalan di browser dengan data contoh. Backend API belum dihubungkan ke frontend, sehingga fitur akun dan keranjang tersimpan belum tersedia di website publik.
