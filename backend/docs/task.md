# Tracker Task Backend — Warung Sembako (Mbak Hesti)

Sumber kebenaran: [`prd.md`](prd.md), [`srs.md`](srs.md), [`kontrak_api.md`](kontrak_api.md).
File ini adalah satu-satunya tempat tracking task teknis backend (lihat `AGENT.md`).
Aturan: task berikutnya dikerjakan mengikuti urutan dependency; setiap task ditutup dengan verifikasi.

Terakhir diperbarui: 2026-11-18 (WIB)

---

## Fase 1 — Autentikasi: Refresh Token (berlaku 7 hari)

Rujukan: `kontrak_api.md` §3 (access token 900 detik + refresh token), §5 (POST /login, POST /refresh, POST /logout); `srs.md` FR-AUTH-05 (refresh token default 7 hari).

Keputusan owner pada sesi ini:

1. Penamaan field respons mengikuti `kontrak_api.md` (snake_case): `pengguna`, `id_pengguna`, `token_akses`, `token_penyegaran`.
2. Refresh token disimpan di tabel DB (`RefreshToken`) dengan rotasi: token lama dicabut saat `/refresh`, dan dicabut saat `/logout`.
3. Ruang lingkup: `/refresh` + `/login` mengeluarkan refresh token + penyesuaian `/logout`. `GET /me` belum dikerjakan.

Rincian task:

- [x] `REFRESH_TOKEN_AGE` (7d) di `.env` + validasi format fail-fast di `src/config/env.ts`
- [x] `src/utils/token-manager.ts`: umur token dari config, pin algoritma `HS256`, klaim `typ` (`access` / `refresh`)
- [x] `src/middlewares/auth.middleware.ts`: verifikasi payload runtime (`sub` number, `role` string, `typ` = access)
- [x] Prisma: model `RefreshToken` (`tokenHash` unik, `userId`, `expiresAt`, `revokedAt`) + migrasi `20261118045415_add_refresh_token`
- [x] `src/services/refresh-token.service.ts`: terbitkan sesi, rotasi, dan pencabutan (hash sha256, bukan token mentah)
- [x] `POST /login` mengembalikan `{ pengguna: { id_pengguna, token_akses, token_penyegaran } }`
- [x] `POST /refresh` menukar refresh token (rotasi; token lama dicabut) — 401 bila invalid/kedaluwarsa/dicabut
- [x] `POST /logout` mencabut refresh token dan membalas 204 tanpa body (tetap butuh access token)
- [x] Verifikasi: `npx tsc --noEmit` hijau; alur curl di `PORT=3002` (login → refresh → reuse lama 401 → logout 204 → refresh setelah logout 401 → `/refresh` body kosong 400 → access token di `/refresh` 401); cek DB `RefreshToken` (hash 64 hex, `expiresAt` = +7 hari, `revokedAt` terisi)

Verifikasi mentah (ringkas):

| Uji | Hasil |
|---|---|
| `POST /login` valid | 200 `{"pengguna":{"id_pengguna":9,"token_akses":"...","token_penyegaran":"..."}}` |
| `POST /refresh` (token valid) | 200 pasangan token baru |
| `POST /refresh` (token lama dipakai ulang) | 401 `Token penyegaran tidak valid atau sudah kedaluwarsa` |
| `POST /refresh` (mengirim access token) | 401 (klaim `typ` berbeda) |
| `POST /refresh` (body kosong) | 400 `{"errors":{"token_penyegaran":"Token penyegaran wajib dikirim"}}` |
| `POST /logout` tanpa access token | 401 |
| `POST /logout` (access + refresh token) | 204 tanpa body |
| `POST /refresh` setelah logout | 401 |
| Klaim token | access: `exp-iat` 10800 dtk, `sub`, `role`, `typ=access`; refresh: `exp-iat` 7 hari, `typ=refresh` |
| Baris DB `RefreshToken` | `tokenHash` 64 hex sha256, `expiresAt` = +7 hari, `revokedAt` terisi setelah rotasi/logout |

Data uji (user `uji.refresh@example.com` + 2 baris `RefreshToken`) sudah dihapus setelah verifikasi.

### Temuan yang perlu keputusan owner (belum dikerjakan)

- [ ] `GET /me` (FR-AUTH-08) dan `GET /health` (FR-SYS-01) belum ada di backend.
- [ ] Pesan error login membedakan "Email tidak ditemukan" vs "Kata sandi salah"; `srs.md` FR-AUTH-03 meminta pesan generik agar tidak membocorkan mana yang salah.
- [ ] `ACCESS_TOKEN_AGE=10800` (3 jam) di `.env`, sedangkan `kontrak_api.md` §3 menyebut access token berlaku 900 detik.
- [ ] `.env` belum punya pasangan `.env.example`; `REFRESH_TOKEN_AGE` wajib ada di setiap environment (server gagal start bila kosong/format salah).

---

## Fase 2 — `kode` pada respons error (kontrak §4)

Rujukan: `kontrak_api.md` §4 (format error `status` + `kode` + `kesalahan[]`, plus tabel kode per status).

Keputusan owner pada sesi ini:

1. Nilai `kode` dari konstanta per kelas (`ERROR_CODE`), tetap bisa di-override saat `throw` untuk kode spesifik (mis. `INSUFFICIENT_STOCK`).
2. Payload mengikuti contoh kontrak penuh: `kode` + `kesalahan[]`; field `message` dihapus (breaking, konsumen lama harus menyesuaikan).
3. Cakupan: semua error termasuk `InternalServerError`, plus penyesuaian respons 400 dari `validation.middleware`.

Rincian task:

- [x] `src/expectation/client-error.ts`: konstanta `ERROR_CODE`, tipe `ErrorCode`, properti `kode` pada `ClientError`
- [x] Subclass menerima `kode` opsional dengan default sesuai tabel kontrak: `ValidationError`/`InvariantError` = BAD_REQUEST (400), `AuthenticationError` = UNAUTHORIZED (401), `ForbiddenError` = FORBIDDEN (403), `NotFoundError` = NOT_FOUND (404), `ConflictError` = DUPLICATE (409)
- [x] `src/expectation/internal-server-error.ts`: properti `kode` default INTERNAL_SERVER_ERROR
- [x] `src/middlewares/error.middleware.ts`: emit `{ status, kode, kesalahan[] }`; `kesalahan` berisi per field bila `details` ada, selain itu `[{ message }]`; error tak dikenal tetap 500 + pesan generik (tanpa stack trace)
- [x] `InternalServerError` ditangani khusus di errorHandler sehingga pesan kustomnya tidak lagi hilang
- [x] `src/middlewares/validation.middleware.ts`: 400 → `{ status, kode: 'BAD_REQUEST', kesalahan: [{ field: pesan }] }`
- [x] Verifikasi: `npx tsc --noEmit` hijau; simulasi `errorHandler` (tsx) untuk 8 kelas error + override kode + `Error` tak dikenal; curl di `PORT=3002`

Verifikasi mentah:

| Uji | Respons |
|---|---|
| Simulasi `AuthenticationError` | 401 `{"status":"error","kode":"UNAUTHORIZED","kesalahan":[{"message":"..."}]}` |
| Simulasi `ConflictError` | 409 `{"kode":"DUPLICATE",...}` |
| Simulasi `NotFoundError` / `ForbiddenError` | 404 `NOT_FOUND` / 403 `FORBIDDEN` |
| Simulasi `ValidationError` + `details` | 400 `{"kode":"BAD_REQUEST","kesalahan":[{"email":"Email tidak valid"}]}` |
| Simulasi `InternalServerError('Gagal menghubungi layanan model')` | 500 `{"kode":"INTERNAL_SERVER_ERROR","kesalahan":[{"message":"Gagal menghubungi layanan model"}]}` |
| Override kode (`new ConflictError('Stok tidak mencukupi', 'INSUFFICIENT_STOCK')`) | 409 `{"kode":"INSUFFICIENT_STOCK",...}` |
| `Error` biasa | 500 `INTERNAL_SERVER_ERROR` + pesan generik (isi asli tidak bocor) |
| `POST /login` body kosong | 400 `{"kode":"BAD_REQUEST","kesalahan":[{"email":"Email tidak valid"},{"password":"..."}]}` |
| `POST /login` kredensial salah | 401 `{"kode":"UNAUTHORIZED","kesalahan":[{"message":"Kata sandi salah"}]}` |
| `POST /register` email sudah ada | 409 `{"kode":"DUPLICATE","kesalahan":[{"message":"Email sudah digunakan"}]}` |
| `POST /refresh` body kosong | 400 `{"kode":"BAD_REQUEST","kesalahan":[{"token_penyegaran":"Token penyegaran wajib dikirim"}]}` |
| `POST /refresh` token ngawur | 401 `{"kode":"UNAUTHORIZED","kesalahan":[{"message":"Token penyegaran tidak valid atau sudah kedaluwarsa"}]}` |

### Temuan tambahan (belum dikerjakan)

- [ ] JSON malformed (SyntaxError dari body-parser) masih dibalas 500 INTERNAL_SERVER_ERROR; `kontrak_api.md` §4 menyebut malformed = 400 BAD_REQUEST.
- [ ] 401/403 yang ditulis langsung oleh `auth.middleware.ts` (`{ message }` tanpa `status`/`kode`) belum ikut format kontrak — di luar cakupan yang dipilih untuk fase ini.
- [ ] Pesan default Zod masih berbahasa Inggris untuk tipe yang salah (mis. `Invalid input: expected string, received undefined`) karena schema tidak menulis pesan untuk kasus tipe.

---

## Fase 3 — Respons `POST /register` memakai `nama`/`email`/`peran`

Rujukan: `kontrak_api.md` §2 (respons tunggal berbentuk `{ "[nama]": { ... } }`, tanpa field `message`) dan §5 untuk gaya respons `pengguna` yang sudah dipakai `/login`.

Keputusan owner: respons dibungkus `{ pengguna: { nama, email, peran } }` tanpa `message`; field mengikuti penamaan snake_case kontrak.

- [x] `src/types/auth.type.ts`: `UserRegisterResponse` menjadi `{ nama, email, peran }`
- [x] `src/services/auth.service.ts`: `registerUser` mengembalikan `{ nama, email, peran }`
- [x] `src/controllers/auth.controller.ts`: `register` membalas 201 `{ pengguna: { nama, email, peran } }` (field `message` dihapus)
- [x] Verifikasi: `npx tsc --noEmit` hijau; curl di `PORT=3002` (register 201, email duplikat 409 DUPLICATE, role tidak valid 400 BAD_REQUEST); user uji `uji.register@example.com` sudah dihapus dari DB

Verifikasi mentah:

| Uji | Respons |
|---|---|
| `POST /register` (data valid, role KEEPER) | 201 `{"pengguna":{"nama":"Uji Register","email":"uji.register@example.com","peran":"KEEPER"}}` |
| `POST /register` email duplikat | 409 `{"status":"error","kode":"DUPLICATE","kesalahan":[{"message":"Email sudah digunakan"}]}` |
| `POST /register` role `ADMIN` | 400 `{"status":"error","kode":"BAD_REQUEST","kesalahan":[{"role":"Role harus OWNER atau KEEPER"}]}` |

---

## Fase 4 — Rekonsiliasi dengan `origin/main` + perbaikan rotasi refresh token

Konteks: `origin/main` maju ke `c1c88c1` (fondasi skema paralel: `User.id` UUID, tabel `users`/`refresh_tokens`/`categories`/`products`, kolom `username`, migrasi `20261116163741_init_core_tables` yang DROP tabel lama) — bentrok langsung dengan 4 berkas lokal (`schema.prisma`, `auth.service.ts`, `auth.type.ts`, `user.schema.ts`).

Keputusan owner: versi lokal dipertahankan sebagai sumber kebenaran.

- [x] Merge commit `af2dd3b`: konflik diselesaikan memakai versi lokal; pohon hasil merge identik dengan versi lokal (`git diff HEAD --cached` kosong)
- [x] Migrasi `20261116163741_init_core_tables` dikeluarkan dari pohon: `init` → `init_core_tables` (DROP `"User"`) → `add_refresh_token` (FK ke `"User"`) selalu gagal saat `migrate deploy`; urutan yang berlaku sekarang `20261113181601_init` → `20261118045415_add_refresh_token`. Pekerjaan skema dari `c1c88c1` tetap utuh di riwayat git
- [x] Bug ditemukan saat verifikasi ulang tree hasil merge: refresh token JWT yang diterbitkan dalam **detik yang sama** menghasilkan string identik (klaim `iat`/`exp` berpresisi detik), sehingga `prisma.refreshToken.create` gagal `P2002` pada `RefreshToken_tokenHash_key` dan `POST /refresh` membalas 500. Uji Fase 1 lolos hanya karena kebetulan lintas detik
- [x] Perbaikan: klaim `jti` acak (`randomUUID()`) pada refresh token di `src/utils/token-manager.ts`
- [x] Verifikasi: `npx tsc --noEmit` hijau; uji service (2 sesi + 5 rotasi dalam detik yang sama → semua token berbeda, token lama & token setelah revoke ditolak `AuthenticationError`); curl di `PORT=3002` (login 200, 5 rotasi beruntun 200, token lama 401, logout 204, refresh setelah logout 401, kredensial salah 401)

Verifikasi mentah (curl, tree hasil merge + perbaikan `jti`):

| Uji | Respons |
|---|---|
| `POST /login` | 200 `{"pengguna":{"id_pengguna":11,"token_akses":"...","token_penyegaran":"..."}}` |
| `POST /refresh` rotasi 1–5 (beruntun, detik yang sama) | 200 semua, token penyegaran baru berbeda tiap kali |
| `POST /refresh` token lama (R1) dipakai ulang | 401 `{"kode":"UNAUTHORIZED","kesalahan":[{"message":"Token penyegaran tidak valid atau sudah kedaluwarsa"}]}` |
| `POST /logout` (access + refresh token) | 204 tanpa body |
| `POST /refresh` setelah logout | 401 `UNAUTHORIZED` |
| `POST /login` kredensial salah | 401 `UNAUTHORIZED` |

Catatan: kode error tak terduga (500) belum dilogging di `errorHandler`, sehingga bug P2002 di atas awalnya tidak muncul di log server — perlu ditambahkan saat memutuskan penanganan 500.

### Temuan tambahan Fase 4

- [ ] Versi `origin/main` sudah memakai pesan login generik (`Email atau kata sandi salah`, FR-AUTH-03) dan skema UUID sesuai kontrak §2; keduanya tidak diambil karena keputusan "lokal menang". Bisa diporting terpisah bila diinginkan.
- [ ] Data dev: tabel lama (`User`, 8 baris) masih dipakai; bila kelak pindah ke fondasi skema `c1c88c1`, `migrate deploy` akan DROP tabel tersebut (kehilangan data dev).

---

## Fase 5 — Modul Produk (kategori + produk) sesuai kontrak §6

Rencana lengkap: `docs/planning/2026-11-18_plan-modul-produk.md`. Rujukan: `kontrak_api.md` §2/§3/§4/§6/§7, `srs.md` §4.1/§4.2/§5.2 FR-PROD-01..09/§5.4 FR-STAT-01..05, `prd.md` P-03/P-04.

Keputusan owner (final): K1 tulis ulang skema mengikuti SRS §4.1 (UUID, tabel `categories`/`products`), K2 `Decimal(10,3)`, K3 status stok dihitung saat baca (tidak disimpan), K4 enum kontrak (`NORMAL`/`LOW`/`OUT_OF_STOCK`, `TRACKED`/`NOT_TRACKED`), K5 ikut kontrak (`/api`, amplop nama sumber daya, `metadata`), K6 `halaman`+`limit` (maks 100), K7 gambar **ditunda** (`gambar_url` nullable), K8 movement `INITIAL`/`IN`/`OUT`/`ADJUSTMENT`, K9 kolom `isDeleted` diekspos `aktif`, K10 nama maks 120.

Rincian task:

- [x] Infrastruktur uji: `vitest.config.ts`, script `npm test`, `tests/helpers/{env,db}.ts` dengan fixture + cleanup tetap (`UJI-` prefix, user `uji-*@example.com`)
- [x] `src/utils/stock-status.ts` — fungsi murni `getStockStatus` + label FR-STAT-02 (+ 9 unit test)
- [x] `prisma/schema.prisma` — `Category`, `Product` (UUID, `stock`/`minStock` `Decimal(10,3)`, `inventoryType`, `imageId`/`imageUrl`, `isDeleted`), `StockMovement` (tipe `INITIAL`, `stockBefore`/`stockAfter`), `RestockItem` UUID; enum `StockStatus` dihapus, `InventoryType` ditambah, `MovementType` + `INITIAL`
- [x] Migrasi `20261118061329_product_module` (lewat `migrate diff` + `migrate deploy`, karena `migrate dev` gagal P3014): DROP tabel lama (0 baris) + CHECK `stock/minStock/price >= 0`, `quantity > 0` (SRS §4.2) + unique index `products_name_unit_lower_key` (FR-PROD-03)
- [x] `src/utils/{query,product-mapper}.ts`, `src/types/product.type.ts`, `src/schemas/{category,product}.schema.ts`
- [x] `src/services/{category,product}.service.ts`, `src/controllers/{category,product}.controller.ts`, `src/routes/{category,product}.route.ts`, dipasang di `src/app.ts`
- [x] `GET/POST/PATCH /categories` (OWNER menulis), `GET /products`, `GET /products/{id}`, `POST /products` (stok awal + pergerakan `INITIAL` dalam satu transaksi), `PATCH /products/{id}` (partial, `jumlah_stok` ditolak, `aktif` untuk aktif/nonaktif), `DELETE /products/{id}` (soft delete 204)
- [x] `src/middlewares/auth.middleware.ts` — 401/403 kini dilempar sebagai `AuthenticationError`/`ForbiddenError` sehingga berformat kontrak §4 (`status`/`kode`/`kesalahan`); menutup temuan Fase 2
- [x] Verifikasi: `npx tsc --noEmit` hijau; `npm test` **66 uji lulus** (5 berkas, dijalankan 2x berturut-turut untuk membuktikan cleanup idempoten); matriks curl end-to-end di `PORT=3002`; baris `INITIAL` terverifikasi di DB; data uji dibersihkan (0 produk, 0 kategori, 0 pergerakan, 8 pengguna asli utuh)

Verifikasi mentah (curl, server uji dimatikan setelahnya):

| Uji | Respons |
|---|---|
| `POST /categories` | 201 `{"kategori":{"id":"c1bc91b3-...","nama":"UJI-Sembako","dibuat_pada":"...","diperbarui_pada":"..."}}` |
| `POST /products` stok awal 12.5 | 201 `{"produk":{...,"jumlah_stok":12.5,"status_stok":"NORMAL","status_stok_label":"Normal","jenis_persediaan":"TRACKED","aktif":true}}` |
| `POST /products` nama duplikat beda huruf | 409 `{"kode":"DUPLICATE","kesalahan":[{"message":"Nama produk sudah ada pada satuan yang sama"}]}` |
| `GET /products?q=beras&sort=-harga_jual` | 200 `{"produk":[...],"metadata":{"halaman":1,"limit":20,"total_data":1,"total_halaman":1}}` |
| `GET /products?q=tidakada` | 200 `{"produk":[],"metadata":{"total_data":0}}` (FR-PROD-09) |
| `GET /products?limit=500` | 400 `BAD_REQUEST` — `limit harus bilangan bulat antara 1 dan 100` |
| `PATCH /products/{id}` `stok_minimum: 20` | 200 `status_stok:"LOW"`, `status_stok_label:"Menipis"` |
| `PATCH /products/{id}` `jumlah_stok: 99` | 400 `BAD_REQUEST` — `jumlah_stok tidak dapat diubah lewat endpoint ini` (FR-PROD-08) |
| `DELETE /products/{id}` | 204 tanpa body; hilang dari daftar default; `GET ?aktif=all` menampilkan `aktif:false` (OWNER) |
| Baris `stock_movements` | `INITIAL, 12.500, stockBefore 0, stockAfter 12.500, "Stok awal saat produk dibuat"` |

Uji otomatis (66): unit `stock-status` (9), `product-mapper` (8), `product-schema` (13); integrasi `categories` (11) dan `products` (25) memakai supertest + JWT fixture.

### Temuan tambahan Fase 5

- [ ] Tabel `User` masih `Int` + `email` (belum `username`/`is_active`/UUID seperti SRS §4.1) — konversi sengaja ditunda agar 8 baris data dev tidak hilang dan payload JWT `sub` tidak berubah tipe.
- [ ] Unggah gambar produk (`gambar` wajib di POST menurut kontrak §6) belum dikerjakan; `gambar_id`/`gambar_url` masih `null`.
- [ ] Field `status_stok_label` adalah tambahan di luar objek kontrak §6, diambil dari FR-STAT-02/04.
- [ ] `GET /categories` memakai `meta` dan `GET /products` memakai `metadata` — mengikuti kontrak apa adanya (§6 tidak konsisten).
- [ ] Unique index fungsional `products_name_unit_lower_key` tidak dapat dinyatakan di `schema.prisma`; hasil `migrate diff` berikutnya harus diperiksa agar baris ini tidak terhapus.
- [ ] Modul restock/pergerakan stok (kontrak §7) belum ada; kolom `status`/`reason`/`closed_at` pada `restock_items` (SRS §4.1) menyusul di fase itu.
- [ ] `errorHandler` masih belum melogging error 500, dan rate limit (kontrak §2 `429`/`Retry-After`) belum ada di repo.
