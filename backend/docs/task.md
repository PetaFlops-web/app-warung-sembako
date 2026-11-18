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
