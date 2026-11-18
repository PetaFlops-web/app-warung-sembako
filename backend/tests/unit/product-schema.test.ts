import { describe, expect, it } from 'vitest';
import { createProductSchema, listProductQuerySchema, updateProductSchema } from '../../src/schemas/product.schema.ts';

const VALID_BODY = {
  nama: 'Beras Premium 5 kg',
  id_kategori: '7c0f6a0e-2f58-4c36-9a9b-1b8d6e0a8a11',
  satuan: 'sak',
  harga_jual: 72000,
  stok_minimum: 3,
};

describe('createProductSchema', () => {
  it('menerima payload lengkap yang valid', () => {
    expect(createProductSchema.safeParse({ body: VALID_BODY }).success).toBe(true);
  });

  it('menerima stok awal dan jenis persediaan opsional', () => {
    const body = { ...VALID_BODY, jumlah_stok_awal: 12.5, jenis_persediaan: 'NOT_TRACKED' };

    expect(createProductSchema.safeParse({ body }).success).toBe(true);
  });

  it('menolak harga jual negatif', () => {
    const result = createProductSchema.safeParse({ body: { ...VALID_BODY, harga_jual: -1 } });

    expect(result.success).toBe(false);
  });

  it('menolak harga jual pecahan (rupiah integer)', () => {
    expect(createProductSchema.safeParse({ body: { ...VALID_BODY, harga_jual: 1000.5 } }).success).toBe(false);
  });

  it('menolak nama lebih dari 120 karakter', () => {
    const result = createProductSchema.safeParse({ body: { ...VALID_BODY, nama: 'a'.repeat(121) } });

    expect(result.success).toBe(false);
  });

  it('menolak kuantitas dengan lebih dari 3 angka desimal', () => {
    expect(createProductSchema.safeParse({ body: { ...VALID_BODY, stok_minimum: 1.2345 } }).success).toBe(false);
  });

  it('menolak id_kategori yang bukan UUID', () => {
    expect(createProductSchema.safeParse({ body: { ...VALID_BODY, id_kategori: 'abc' } }).success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('menerima perubahan sebagian', () => {
    expect(updateProductSchema.safeParse({ body: { stok_minimum: 10 } }).success).toBe(true);
  });

  it('menerima perubahan aktif', () => {
    expect(updateProductSchema.safeParse({ body: { aktif: true } }).success).toBe(true);
  });

  it('menolak body kosong', () => {
    expect(updateProductSchema.safeParse({ body: {} }).success).toBe(false);
  });

  it('menolak jumlah_stok (FR-PROD-08: stok hanya lewat pergerakan)', () => {
    const result = updateProductSchema.safeParse({ body: { jumlah_stok: 5 } });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('jumlah_stok tidak dapat diubah');
  });
});

describe('listProductQuerySchema', () => {
  it('menerima query valid', () => {
    expect(listProductQuerySchema.safeParse({ query: { q: 'minyak', status_stok: 'LOW', aktif: 'all', sort: '-harga_jual', halaman: '1', limit: '20' } }).success).toBe(true);
  });

  it('menolak status_stok di luar enum kontrak', () => {
    expect(listProductQuerySchema.safeParse({ query: { status_stok: 'HABIS' } }).success).toBe(false);
  });

  it('menolak halaman bukan angka', () => {
    expect(listProductQuerySchema.safeParse({ query: { halaman: 'dua' } }).success).toBe(false);
  });
});
