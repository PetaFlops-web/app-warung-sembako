import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.ts';
import { authHeader, categoryName, cleanupFixtures, setupFixtures, type Fixtures } from '../helpers/db.ts';

let fixtures: Fixtures;
const NAMA = categoryName('Beras');

beforeAll(async () => {
  fixtures = await setupFixtures();
});

afterAll(async () => {
  await cleanupFixtures();
});

describe('POST /api/categories', () => {
  it('OWNER dapat menambah kategori (201)', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: NAMA });

    expect(response.status).toBe(201);
    expect(response.body.kategori).toMatchObject({ nama: NAMA });
    expect(typeof response.body.kategori.id).toBe('string');
    expect(response.body.kategori.dibuat_pada).toBeTruthy();
  });

  it('menolak nama kategori duplikat dengan 409 DUPLICATE', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: NAMA });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ status: 'error', kode: 'DUPLICATE' });
  });

  it('KEEPER tidak berhak menambah kategori (403)', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader('KEEPER', fixtures.keeperId))
      .send({ nama: categoryName('Minyak') });

    expect(response.status).toBe(403);
    expect(response.body.kode).toBe('FORBIDDEN');
  });

  it('tanpa access token menghasilkan 401', async () => {
    const response = await request(app).post('/api/categories').send({ nama: categoryName('Gula') });

    expect(response.status).toBe(401);
  });

  it('nama kosong ditolak 400 BAD_REQUEST dengan kesalahan per field', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.kode).toBe('BAD_REQUEST');
    expect(response.body.kesalahan[0]).toHaveProperty('nama');
  });
});

describe('GET /api/categories', () => {
  it('KEEPER dapat membaca daftar kategori dengan meta paginasi', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', authHeader('KEEPER', fixtures.keeperId));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.kategori)).toBe(true);
    expect(response.body.meta).toMatchObject({ halaman: 1, limit: 20 });
    expect(response.body.kategori.map((item: { nama: string }) => item.nama)).toContain(NAMA);
  });

  it('limit di atas 100 ditolak 400', async () => {
    const response = await request(app)
      .get('/api/categories?limit=101')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId));

    expect(response.status).toBe(400);
    expect(response.body.kode).toBe('BAD_REQUEST');
  });
});

describe('PATCH /api/categories/:id', () => {
  it('OWNER dapat mengubah nama kategori', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: categoryName('Gula') });

    const response = await request(app)
      .patch(`/api/categories/${created.body.kategori.id}`)
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: categoryName('Gula Pasir') });

    expect(response.status).toBe(200);
    expect(response.body.kategori.nama).toBe(categoryName('Gula Pasir'));
  });

  it('id tidak dikenal menghasilkan 404 NOT_FOUND', async () => {
    const response = await request(app)
      .patch('/api/categories/11111111-1111-4111-8111-111111111111')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: categoryName('Tepung') });

    expect(response.status).toBe(404);
    expect(response.body.kode).toBe('NOT_FOUND');
  });

  it('id bukan UUID ditolak 400', async () => {
    const response = await request(app)
      .patch('/api/categories/bukan-uuid')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({ nama: categoryName('Tepung') });

    expect(response.status).toBe(400);
  });

  it('body kosong ditolak 400', async () => {
    const response = await request(app)
      .patch('/api/categories/11111111-1111-4111-8111-111111111111')
      .set('Authorization', authHeader('OWNER', fixtures.ownerId))
      .send({});

    expect(response.status).toBe(400);
  });
});
