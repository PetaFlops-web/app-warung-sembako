import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.ts';
import { authHeader, categoryName, cleanupFixtures, prisma, productName, setupFixtures, type Fixtures } from '../helpers/db.ts';

let fixtures: Fixtures;
let categoryId: string;

function owner() {
  return authHeader('OWNER', fixtures.ownerId);
}

function keeper() {
  return authHeader('KEEPER', fixtures.keeperId);
}

async function getProductFixture(nama: string) {
  const produk = await prisma.product.findFirst({ where: { name: nama } });

  if (!produk) {
    throw new Error(`fixture produk tidak ditemukan: ${nama}`);
  }

  return produk;
}

async function createProduct(body: Record<string, unknown>) {
  return request(app).post('/api/products').set('Authorization', owner()).send(body);
}

beforeAll(async () => {
  fixtures = await setupFixtures();

  const category = await prisma.category.create({ data: { name: categoryName('Sembako') } });
  categoryId = category.id;
});

afterAll(async () => {
  await cleanupFixtures();
});

describe('POST /api/products', () => {
  it('OWNER dapat menambah produk dengan stok awal (201) dan status NORMAL', async () => {
    const response = await createProduct({
      nama: productName('Beras Premium 5 kg'),
      id_kategori: categoryId,
      satuan: 'sak',
      harga_jual: 72000,
      stok_minimum: 3,
      jumlah_stok_awal: 12,
    });

    expect(response.status).toBe(201);
    expect(response.body.produk).toMatchObject({
      nama: productName('Beras Premium 5 kg'),
      satuan: 'sak',
      harga_jual: 72000,
      jumlah_stok: 12,
      stok_minimum: 3,
      status_stok: 'NORMAL',
      status_stok_label: 'Normal',
      jenis_persediaan: 'TRACKED',
      aktif: true,
    });
    expect(response.body.produk.kategori.nama).toBe(categoryName('Sembako'));
  });

  it('membuat riwayat pergerakan INITIAL dalam transaksi yang sama', async () => {
    const produk = await getProductFixture(productName('Beras Premium 5 kg'));
    const movements = await prisma.stockMovement.findMany({ where: { productId: produk.id } });

    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: 'INITIAL' });
    expect(Number(movements[0]?.stockBefore)).toBe(0);
    expect(Number(movements[0]?.stockAfter)).toBe(12);
  });

  it('menolak nama duplikat tanpa peduli huruf besar-kecil (409 DUPLICATE)', async () => {
    const response = await createProduct({
      nama: productName('beras premium 5 KG'),
      id_kategori: categoryId,
      satuan: 'sak',
      harga_jual: 70000,
      stok_minimum: 3,
    });

    expect(response.status).toBe(409);
    expect(response.body.kode).toBe('DUPLICATE');
  });

  it('menolak kategori yang tidak ada (404 NOT_FOUND)', async () => {
    const response = await createProduct({
      nama: productName('Produk Tanpa Kategori'),
      id_kategori: '11111111-1111-4111-8111-111111111111',
      satuan: 'pcs',
      harga_jual: 1000,
      stok_minimum: 1,
    });

    expect(response.status).toBe(404);
    expect(response.body.kode).toBe('NOT_FOUND');
  });

  it('menolak harga jual negatif (400 BAD_REQUEST)', async () => {
    const response = await createProduct({
      nama: productName('Harga Negatif'),
      id_kategori: categoryId,
      satuan: 'pcs',
      harga_jual: -500,
      stok_minimum: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.kode).toBe('BAD_REQUEST');
  });

  it('KEEPER tidak berhak menambah produk (403)', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', keeper())
      .send({
        nama: productName('Produk Keeper'),
        id_kategori: categoryId,
        satuan: 'pcs',
        harga_jual: 1000,
        stok_minimum: 1,
      });

    expect(response.status).toBe(403);
  });

  it('produk tanpa stok awal berstatus OUT_OF_STOCK', async () => {
    const response = await createProduct({
      nama: productName('Minyak Goreng 1L'),
      id_kategori: categoryId,
      satuan: 'pouch',
      harga_jual: 18000,
      stok_minimum: 5,
    });

    expect(response.status).toBe(201);
    expect(response.body.produk.status_stok).toBe('OUT_OF_STOCK');
  });
});

describe('GET /api/products', () => {
  it('KEEPER dapat membaca daftar produk dengan metadata paginasi', async () => {
    const response = await request(app).get('/api/products').set('Authorization', keeper());

    expect(response.status).toBe(200);
    expect(response.body.metadata).toMatchObject({ halaman: 1, limit: 20 });
    expect(response.body.produk.length).toBeGreaterThan(0);
  });

  it('pencarian tanpa hasil mengembalikan 200 dengan array kosong (FR-PROD-09)', async () => {
    const response = await request(app).get('/api/products?q=tidakada-xyz').set('Authorization', owner());

    expect(response.status).toBe(200);
    expect(response.body.produk).toEqual([]);
    expect(response.body.metadata.total_data).toBe(0);
  });

  it('pencarian tidak peka huruf besar-kecil dan cocok sebagian', async () => {
    const response = await request(app).get(`/api/products?q=${encodeURIComponent(productName('beras'))}`).set('Authorization', owner());

    expect(response.status).toBe(200);
    expect(response.body.produk).toHaveLength(1);
  });

  it('filter status_stok hanya mengembalikan produk dengan status tersebut', async () => {
    const response = await request(app).get('/api/products?status_stok=OUT_OF_STOCK').set('Authorization', owner());

    expect(response.status).toBe(200);
    expect(response.body.produk.every((item: { status_stok: string }) => item.status_stok === 'OUT_OF_STOCK')).toBe(true);
  });

  it('filter id_kategori bekerja', async () => {
    const response = await request(app).get(`/api/products?id_kategori=${categoryId}`).set('Authorization', owner());

    expect(response.status).toBe(200);
    expect(response.body.produk.every((item: { kategori: { id: string } }) => item.kategori.id === categoryId)).toBe(true);
  });

  it('sort=-harga_jual mengurutkan menurun', async () => {
    const response = await request(app).get('/api/products?sort=-harga_jual').set('Authorization', owner());
    const harga = response.body.produk.map((item: { harga_jual: number }) => item.harga_jual);

    expect(harga).toEqual([...harga].sort((a, b) => b - a));
  });

  it('sort tidak dikenal ditolak 400', async () => {
    const response = await request(app).get('/api/products?sort=stok').set('Authorization', owner());

    expect(response.status).toBe(400);
  });

  it('limit di atas 100 ditolak 400', async () => {
    const response = await request(app).get('/api/products?limit=999').set('Authorization', owner());

    expect(response.status).toBe(400);
  });

  it('KEEPER tidak boleh meminta produk nonaktif (403)', async () => {
    const response = await request(app).get('/api/products?aktif=all').set('Authorization', keeper());

    expect(response.status).toBe(403);
    expect(response.body.kode).toBe('FORBIDDEN');
  });
});

describe('GET /api/products/:id', () => {
  it('mengembalikan detail produk', async () => {
    const produk = await getProductFixture(productName('Beras Premium 5 kg'));
    const response = await request(app).get(`/api/products/${produk.id}`).set('Authorization', keeper());

    expect(response.status).toBe(200);
    expect(response.body.produk.id).toBe(produk.id);
  });

  it('id tidak dikenal menghasilkan 404', async () => {
    const response = await request(app).get('/api/products/11111111-1111-4111-8111-111111111111').set('Authorization', owner());

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/products/:id', () => {
  it('mengubah stok_minimum menghitung ulang status stok', async () => {
    const produk = await getProductFixture(productName('Beras Premium 5 kg'));
    const response = await request(app)
      .patch(`/api/products/${produk.id}`)
      .set('Authorization', owner())
      .send({ stok_minimum: 20 });

    expect(response.status).toBe(200);
    expect(response.body.produk.status_stok).toBe('LOW');
    expect(response.body.produk.status_stok_label).toBe('Menipis');
  });

  it('menolak perubahan jumlah_stok (400)', async () => {
    const produk = await getProductFixture(productName('Beras Premium 5 kg'));
    const response = await request(app)
      .patch(`/api/products/${produk.id}`)
      .set('Authorization', owner())
      .send({ jumlah_stok: 99 });

    expect(response.status).toBe(400);
    expect(response.body.kode).toBe('BAD_REQUEST');
  });

  it('KEEPER tidak berhak mengubah produk (403)', async () => {
    const produk = await getProductFixture(productName('Beras Premium 5 kg'));
    const response = await request(app)
      .patch(`/api/products/${produk.id}`)
      .set('Authorization', keeper())
      .send({ stok_minimum: 1 });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/products/:id', () => {
  it('soft delete membalas 204 dan menyembunyikan produk dari daftar default', async () => {
    const produk = await getProductFixture(productName('Minyak Goreng 1L'));

    const response = await request(app).delete(`/api/products/${produk.id}`).set('Authorization', owner());
    expect(response.status).toBe(204);

    const list = await request(app).get('/api/products').set('Authorization', owner());
    expect(list.body.produk.map((item: { id: string }) => item.id)).not.toContain(produk.id);

    const all = await request(app).get('/api/products?aktif=all').set('Authorization', owner());
    const nonaktif = all.body.produk.find((item: { id: string }) => item.id === produk.id);
    expect(nonaktif.aktif).toBe(false);
  });

  it('KEEPER tidak dapat melihat produk nonaktif secara detail (404)', async () => {
    const produk = await getProductFixture(productName('Minyak Goreng 1L'));
    const response = await request(app).get(`/api/products/${produk.id}`).set('Authorization', keeper());

    expect(response.status).toBe(404);
  });

  it('aktif: true mengaktifkan kembali produk', async () => {
    const produk = await getProductFixture(productName('Minyak Goreng 1L'));
    const response = await request(app)
      .patch(`/api/products/${produk.id}`)
      .set('Authorization', owner())
      .send({ aktif: true });

    expect(response.status).toBe(200);
    expect(response.body.produk.aktif).toBe(true);
  });
});
