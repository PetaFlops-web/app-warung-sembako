# 📘 Frontend Dev Guide — app-warung-sembako

> Panduan lengkap untuk frontend developer: dari abis clone repo sampai bisa testing semua API backend.

---

## Daftar Isi

1. [Prerequisites](#1-prerequisites)
2. [Setup Backend (agar API bisa dipakai)](#2-setup-backend)
3. [Setup Frontend](#3-setup-frontend)
4. [Testing API — Auth](#4-testing-api--auth)
5. [Testing API — Category](#5-testing-api--category)
6. [Testing API — Product](#6-testing-api--product)
7. [Testing API — Stock](#7-testing-api--stock)
8. [Referensi Cepat](#8-referensi-cepat)

---

## 1. Prerequisites

Pastikan tools ini sudah terinstall sebelum mulai:

| Tool | Cek | Minimal |
|---|---|---|
| Node.js | `node -v` | v18+ |
| npm | `npm -v` | v9+ |
| PostgreSQL | `psql --version` | v14+ |
| Git | `git --version` | - |

Untuk testing API, install salah satu:
- **[Postman](https://www.postman.com/downloads/)** ← Rekomendasi
- **Thunder Client** (extension VS Code — lebih simpel)

---

## 2. Setup Backend

> Backend harus jalan dulu sebelum frontend bisa hit API. Ini job sementara kamu selama development lokal.

### Step 1 — Clone & masuk folder backend

```bash
git clone https://github.com/PetaFlops-web/app-warung-sembako.git
cd app-warung-sembako/backend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Buat file `.env`

Buat file baru bernama `.env` di dalam folder `backend/`. File ini **tidak ikut ke Git** (sudah di-gitignore), jadi harus dibuat manual.

```env
# Server
HOST=localhost
PORT=3000

# PostgreSQL — koneksi individual
PGHOST=localhost
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=password_postgres_kamu

# PostgreSQL — connection string (harus sinkron dengan PG* di atas)
DATABASE_URL=postgresql://postgres:password_postgres_kamu@localhost:5432/postgres

# JWT — minta nilainya dari tim backend
ACCESS_TOKEN_KEY=isi_dari_tim_backend
REFRESH_TOKEN_KEY=isi_dari_tim_backend
ACCESS_TOKEN_AGE=900
REFRESH_TOKEN_AGE=7d

# CORS — URL tempat frontend jalan
FRONTEND_URL=http://localhost:5173
```

> **Catatan:**
> - `PGUSER=postgres` dan `PGDATABASE=postgres` adalah default bawaan PostgreSQL, pakai ini kalau malas buat user/database baru.
> - `DATABASE_URL` harus sinkron dengan nilai `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.
> - `ACCESS_TOKEN_AGE` satuannya **detik** (900 = 15 menit).
> - `REFRESH_TOKEN_AGE` format `<angka><s|m|h|d|w>` contoh: `7d` = 7 hari.
> - Minta `ACCESS_TOKEN_KEY` dan `REFRESH_TOKEN_KEY` dari tim backend agar sinkron.

### Step 4 — Generate Prisma Client

```bash
npm run generate
```

Ini akan buat file yang dibutuhkan Prisma ke `src/generated/prisma/`. Wajib dijalankan setelah clone atau setelah ada perubahan schema.

### Step 5 — Jalankan migrasi database

```bash
npm run migrate:deploy
```

Ini akan buat semua tabel di database (User, Product, Category, StockMovement, dll). Kalau sukses, tidak ada error merah di terminal.

> Kalau error koneksi DB → cek kembali nilai `DATABASE_URL` dan pastikan service PostgreSQL sedang running.

Cek status migrasi (opsional):
```bash
npm run migrate:status
```

### Step 6 — Jalankan backend

```bash
npm run dev
```

Kalau berhasil, terminal akan menampilkan:
```
Server berjalan di http://localhost:3000
```

Backend sudah jalan! Nodemon akan otomatis restart setiap ada perubahan file.

> **Alternatif command:**
> ```bash
> npm run dev:tsx   # tanpa nodemon
> npm run start     # tanpa hot reload
> ```

### (Opsional) Buka Prisma Studio — GUI Database

```bash
npm run studio
```

Buka di browser: `http://localhost:5555` — bisa lihat dan edit data langsung tanpa SQL.

---

## 3. Setup Frontend

### Step 1 — Install dependencies

```bash
cd ../frontend
npm install
```

### Step 2 — Buat file `.env`

Buat file `.env` di folder `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

> Di Vite, env variable harus diawali `VITE_`. Akses di kode: `import.meta.env.VITE_API_URL`

### Step 3 — Jalankan frontend

```bash
npm run dev
```

Frontend jalan di: `http://localhost:5173`

---

## 4. Testing API — Auth

> Base URL: `http://localhost:3000/api`
>
> **Tips Postman:** Setelah login, simpan `access_token` di Environment Variable Postman supaya tidak perlu copy-paste terus.

---

### `POST /api/register` — Daftar Akun Baru

Tidak butuh token.

**Request Body (JSON):**
```json
{
  "name": "Budi Santoso",
  "email": "budi@warung.com",
  "password": "password123",
  "role": "OWNER"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | ✅ | Nama pengguna |
| `email` | string | ✅ | Format email valid |
| `password` | string | ✅ | Minimal 6 karakter |
| `role` | string | ✅ | `"OWNER"` atau `"KEEPER"` |

**Expected Response `201`:**
```json
{
  "message": "Registrasi berhasil",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@warung.com",
    "role": "OWNER"
  }
}
```

---

### `POST /api/login` — Login

Tidak butuh token.

**Request Body (JSON):**
```json
{
  "email": "budi@warung.com",
  "password": "password123"
}
```

**Expected Response `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "token_penyegaran": "eyJhbGci..."
}
```

> Simpan nilai `access_token` — ini dipakai sebagai `Authorization: Bearer <token>` di semua endpoint yang butuh auth.
> `token_penyegaran` juga bisa disimpan untuk keperluan refresh token nanti.

---

### `GET /api/me` — Lihat Data Diri

Butuh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response `200`:**
```json
{
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@warung.com",
    "role": "OWNER"
  }
}
```

> Kalau endpoint ini berhasil → sistem auth bekerja dengan benar ✅

---

### `POST /api/refresh` — Refresh Access Token

Tidak butuh auth header, tapi butuh `token_penyegaran`.

**Request Body (JSON):**
```json
{
  "token_penyegaran": "eyJhbGci..."
}
```

---

### `POST /api/logout` — Logout

Butuh token + `token_penyegaran`.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (JSON):**
```json
{
  "token_penyegaran": "eyJhbGci..."
}
```

---

## 5. Testing API — Category

> Semua endpoint category butuh `Authorization: Bearer <access_token>`.
> Endpoint `POST` dan `PATCH` hanya bisa diakses oleh role `OWNER`.

---

### `GET /api/categories` — Daftar Semua Kategori

**Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid-kategori",
      "name": "Minuman",
      "createdAt": "2026-11-13T..."
    }
  ]
}
```

---

### `POST /api/categories` — Tambah Kategori Baru

Hanya **OWNER**.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "nama": "Minuman"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `nama` | string | ✅ | Nama kategori, maks 60 karakter |

---

### `PATCH /api/categories/:id` — Update Kategori

Hanya **OWNER**. Ganti `:id` dengan UUID kategori.

**Request Body (JSON):**
```json
{
  "nama": "Minuman Dingin"
}
```

---

## 6. Testing API — Product

> Semua endpoint product butuh `Authorization: Bearer <access_token>`.

---

### `GET /api/products` — Daftar Produk

**Query Parameters (semua opsional):**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `q` | string | Kata kunci pencarian nama produk |
| `id_kategori` | UUID | Filter berdasarkan kategori |
| `status_stok` | string | `NORMAL`, `LOW`, `OUT_OF_STOCK` |
| `aktif` | string | `true`, `false`, `all` |
| `halaman` | number | Nomor halaman (pagination) |
| `limit` | number | Jumlah item per halaman |

**Contoh:**
```
GET /api/products?q=indomie&status_stok=LOW&halaman=1&limit=10
```

---

### `POST /api/products` — Tambah Produk Baru

Hanya **OWNER**. Gunakan `multipart/form-data` karena ada upload gambar.

**Form Data:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `nama` | string | ✅ | Nama produk, maks 120 karakter |
| `id_kategori` | UUID | ✅ | UUID kategori yang valid |
| `satuan` | string | ✅ | Contoh: `pcs`, `kg`, `liter` |
| `harga_jual` | number | ✅ | Harga dalam Rupiah, bilangan bulat |
| `stok_minimum` | number | ✅ | Stok minimum sebelum notif restock |
| `jumlah_stok_awal` | number | ❌ | Stok awal saat produk dibuat |
| `jenis_persediaan` | string | ❌ | `TRACKED` (default) atau `NOT_TRACKED` |
| `gambar` | file | ❌ | Upload gambar produk |

> **Catatan:** `harga_jual` harus integer (tidak boleh desimal). `stok_minimum` dan `jumlah_stok_awal` boleh desimal hingga 3 angka di belakang koma.

---

### `GET /api/products/:id` — Detail Produk

Ganti `:id` dengan UUID produk.

```
GET /api/products/uuid-produk-di-sini
```

---

### `PATCH /api/products/:id` — Update Produk

Hanya **OWNER**. Kirim field yang ingin diubah saja.

**Request Body (JSON):**
```json
{
  "nama": "Indomie Goreng Spesial",
  "harga_jual": 3500
}
```

> `jumlah_stok` tidak bisa diubah lewat endpoint ini. Gunakan `/api/stock-movements` untuk update stok.

---

### `DELETE /api/products/:id` — Hapus Produk

Hanya **OWNER**. Soft delete (data tidak benar-benar hilang dari DB).

```
DELETE /api/products/uuid-produk-di-sini
```

---

## 7. Testing API — Stock

> Semua endpoint stock butuh `Authorization: Bearer <access_token>`.

---

### `POST /api/stock-movements` — Catat Pergerakan Stok (Masuk/Keluar)

Semua role bisa akses.

**Request Body (JSON):**
```json
{
  "id_produk": "uuid-produk",
  "jenis_pergerakan": "IN",
  "jumlah": 10,
  "catatan": "Restock dari supplier"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id_produk` | UUID | ✅ | UUID produk yang valid |
| `jenis_pergerakan` | string | ✅ | `IN` / `MASUK` atau `OUT` / `KELUAR` |
| `jumlah` | number | ✅ | Harus lebih dari 0, maks 3 desimal |
| `catatan` | string | ❌ | Catatan tambahan, maks 255 karakter |

---

### `POST /api/stock-adjustments` — Penyesuaian Stok Manual

Hanya **OWNER**. Untuk koreksi stok (misal setelah stock opname).

**Request Body (JSON):**
```json
{
  "id_produk": "uuid-produk",
  "jumlah_baru": 50,
  "alasan": "Hasil stock opname bulanan"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id_produk` | UUID | ✅ | UUID produk yang valid |
| `jumlah_baru` | number | ✅ | Jumlah stok yang benar (bukan delta!) |
| `alasan` | string | ✅ | Alasan penyesuaian, maks 255 karakter |

---

### `GET /api/stock-movements` — Riwayat Pergerakan Stok

**Query Parameters (semua opsional):**

| Parameter | Nilai | Keterangan |
|---|---|---|
| `id_produk` | UUID | Filter per produk |
| `jenis_pergerakan` | `INITIAL`/`AWAL`, `IN`/`MASUK`, `OUT`/`KELUAR`, `ADJUSTMENT`/`PENYESUAIAN` | Filter jenis |
| `dibuat_oleh` | number (ID user) | Filter per user |
| `from` | tanggal | Filter dari tanggal (format ISO: `2026-11-01`) |
| `to` | tanggal | Filter sampai tanggal |
| `halaman` | number | Nomor halaman |
| `limit` | number | Item per halaman |

---

### `GET /api/stock/summary` — Ringkasan Stok

```
GET /api/stock/summary
Authorization: Bearer <access_token>
```

---

### `GET /api/restock-list` — Daftar Produk yang Perlu Restock

**Query Parameters (semua opsional):**

| Parameter | Nilai | Keterangan |
|---|---|---|
| `id_kategori` | UUID | Filter per kategori |
| `status_stok` | `LOW`/`MENIPIS`, `OUT_OF_STOCK`/`HABIS` | Filter status |
| `halaman` | number | Nomor halaman |
| `limit` | number | Item per halaman |

---

## 8. Referensi Cepat

### Semua Endpoint Sekilas

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `POST` | `/api/register` | ❌ | - |
| `POST` | `/api/login` | ❌ | - |
| `POST` | `/api/refresh` | ❌ | - |
| `POST` | `/api/logout` | ✅ | - |
| `GET` | `/api/me` | ✅ | - |
| `GET` | `/api/categories` | ✅ | - |
| `POST` | `/api/categories` | ✅ | OWNER |
| `PATCH` | `/api/categories/:id` | ✅ | OWNER |
| `GET` | `/api/products` | ✅ | - |
| `POST` | `/api/products` | ✅ | OWNER |
| `GET` | `/api/products/:id` | ✅ | - |
| `PATCH` | `/api/products/:id` | ✅ | OWNER |
| `DELETE` | `/api/products/:id` | ✅ | OWNER |
| `POST` | `/api/stock-movements` | ✅ | - |
| `POST` | `/api/stock-adjustments` | ✅ | OWNER |
| `GET` | `/api/stock-movements` | ✅ | - |
| `GET` | `/api/stock/summary` | ✅ | - |
| `GET` | `/api/restock-list` | ✅ | - |

---

### Alur Testing yang Disarankan

```
1. POST /register      → buat akun OWNER
2. POST /login         → dapat access_token & token_penyegaran
3. GET  /me            → verifikasi token jalan ✅
4. POST /categories    → buat 1-2 kategori
5. GET  /categories    → ambil id kategori untuk step berikutnya
6. POST /products      → buat produk (pakai id_kategori dari step 5)
7. GET  /products      → lihat daftar produk
8. POST /stock-movements → catat stok masuk
9. GET  /stock/summary → lihat ringkasan stok
10. GET /restock-list  → lihat produk yang perlu restock
```

---

### Tips Postman

1. **Environment Variable** — Simpan `base_url` dan `access_token` di Postman Environment:
   - `base_url` = `http://localhost:3000/api`
   - `access_token` = isi setelah login

2. **Auto-save token setelah login** — Di tab "Tests" request login, tambahkan:
   ```javascript
   const res = pm.response.json();
   pm.environment.set("access_token", res.access_token);
   pm.environment.set("refresh_token", res.token_penyegaran);
   ```

3. **Pakai `{{base_url}}` di URL** — Contoh: `{{base_url}}/products`

4. **Auth header otomatis** — Di folder/collection Postman, set Auth ke `Bearer Token` dengan value `{{access_token}}`, dan semua request di dalam folder akan otomatis pakai token itu.

---

### Troubleshooting Umum

| Error | Kemungkinan Penyebab | Solusi |
|---|---|---|
| `ECONNREFUSED` | Backend belum jalan | Jalankan `npm run dev` di folder backend |
| `401 Unauthorized` | Token tidak dikirim / expired | Re-login dan pakai token baru |
| `403 Forbidden` | Role tidak cukup (bukan OWNER) | Pakai akun yang rolenya OWNER |
| `400 Bad Request` | Field salah / kurang | Cek pesan error di response body |
| `Error: REFRESH_TOKEN_AGE` | .env tidak lengkap | Tambahkan `REFRESH_TOKEN_AGE=7d` di .env |
| Gambar tidak muncul | URL gambar salah | Akses via `http://localhost:3000/uploads/<filename>` |
| DB error saat migrate | PostgreSQL tidak running | Start service PostgreSQL |
