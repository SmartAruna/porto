# NARA API

Backend REST sederhana untuk autentikasi pelanggan, katalog produk, dan keranjang. API memakai Node.js 22, Express, PostgreSQL, dan Redis.

## Menjalankan dengan Docker Compose

1. Salin `backend/.env.example` ke `.env` di folder proyek.
2. Ganti `POSTGRES_PASSWORD` dengan kata sandi kuat yang hanya memakai karakter URL-safe (`A-Z`, `a-z`, `0-9`, `.`, `_`, `~`, `-`) dan buat `JWT_SECRET` acak minimal 32 karakter. Jangan gunakan nilai contoh pada deployment.
3. Jalankan `docker compose up --build`.
4. Cek `http://localhost:3000/health/ready`.

Compose menyiapkan tabel dan data contoh hanya saat volume PostgreSQL baru dibuat. Untuk deployment yang sudah berjalan, gunakan sistem migrasi terkelola—jangan menghapus volume database untuk mengulang skema.

## Menghubungkan frontend

Secara default frontend memakai `http://localhost:3000/api`, dikonfigurasi lewat atribut `data-api-base` pada tag `script` di `index.html`. Ubah ke alamat API HTTPS setelah backend di-deploy. Atur `CORS_ORIGIN` ke origin frontend persis (contoh lokal: `http://localhost:5500`; GitHub Pages: `https://USERNAME.github.io`). Origin tidak mencakup path repo.

Sajikan frontend melalui HTTP/HTTPS; browser dapat memblokir request API dari halaman yang dibuka dengan `file://`. Akun memakai access token JWT di `sessionStorage` tab browser. Token berlaku 15 menit dan pengguna dapat login kembali setelah kedaluwarsa.

## Endpoint

Semua respons sukses memakai `{ "data": ... }`; error memakai `{ "error": { "code": ..., "message": ... } }`.

| Method | Path | Keterangan |
| --- | --- | --- |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Memeriksa koneksi PostgreSQL dan Redis |
| `POST` | `/api/auth/register` | Daftar dengan `name`, `email`, `password` |
| `POST` | `/api/auth/login` | Masuk dengan `email`, `password` |
| `GET` | `/api/auth/me` | Profil pengguna (Bearer token) |
| `GET` | `/api/products?category=Fashion&q=linen&page=1&limit=20` | Katalog terfilter dan berpaginasi |
| `GET` | `/api/cart` | Lihat keranjang (Bearer token) |
| `PUT` | `/api/cart/items/:productId` | Atur `quantity` (Bearer token) |
| `DELETE` | `/api/cart/items/:productId` | Hapus item (Bearer token) |

Password minimal 10 karakter. Token akses JWT berlaku 15 menit; kirim sebagai `Authorization: Bearer <accessToken>`. Keranjang tersimpan di PostgreSQL dan hanya tersedia setelah login.

Contoh daftar:

```http
POST /api/auth/register
Content-Type: application/json

{"name":"Ayu","email":"ayu@example.com","password":"kata-sandi-kuat-123"}
```

## Kesiapan traffic dan produksi

- Rate limiting dibagi antar-replika melalui Redis; jika Redis tidak tersedia, request API gagal tertutup dengan `503` agar endpoint autentikasi tidak terbuka tanpa batas.
- Katalog memakai cache Redis singkat dan dapat kembali membaca PostgreSQL bila cache gagal.
- Koneksi PostgreSQL memakai pool terbatas; ubah `DB_POOL_MAX` berdasarkan kapasitas database dan jumlah replika.
- Pakai load balancer/reverse proxy, TLS, firewall, backup database, pemantauan, dan alert. Atur `TRUST_PROXY_HOPS` hanya sesuai jumlah proxy tepercaya.
- Compose ini untuk pengembangan atau satu instance. Untuk lonjakan besar, skalakan API di platform orkestrasi dan gunakan PostgreSQL/Redis terkelola dengan kapasitas serta failover yang sesuai.
- Checkout dan pembayaran belum disediakan; integrasikan payment gateway dan alur idempotensi sebelum menerima transaksi nyata.
