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
