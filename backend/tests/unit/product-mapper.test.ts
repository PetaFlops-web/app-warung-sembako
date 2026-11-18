import { describe, expect, it } from 'vitest';
import { toNumber, toProductResponse } from '../../src/utils/product-mapper.ts';

const BASE_ROW = {
  id: '6f0c1c1e-3a1e-4c65-9f1c-2f3a4b5c6d7e',
  name: 'Beras Premium 5 kg',
  unit: 'sak',
  price: 72000,
  stock: '12.500',
  minStock: '5.000',
  inventoryType: 'TRACKED' as const,
  imageId: null,
  imageUrl: null,
  isDeleted: false,
  createdAt: new Date('2026-12-01T08:30:00.000Z'),
  updatedAt: new Date('2026-12-01T09:00:00.000Z'),
  category: { id: '7c0f6a0e-2f58-4c36-9a9b-1b8d6e0a8a11', name: 'Beras' },
};

describe('toNumber', () => {
  it('mengubah string Decimal PostgreSQL menjadi number', () => {
    expect(toNumber('10.000')).toBe(10);
    expect(toNumber('0.250')).toBe(0.25);
  });

  it('meneruskan number apa adanya dan menjaga nilai tidak valid menjadi 0', () => {
    expect(toNumber(7)).toBe(7);
    expect(toNumber('bukan angka')).toBe(0);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('mengubah objek Decimal Prisma (punya toString) menjadi number', () => {
    expect(toNumber({ toString: () => '3.125' })).toBe(3.125);
  });
});

describe('toProductResponse (kontrak §6)', () => {
  it('memetakan baris database ke objek produk kontrak', () => {
    const result = toProductResponse(BASE_ROW);

    expect(result).toMatchObject({
      nama: 'Beras Premium 5 kg',
      kategori: { id: BASE_ROW.category.id, nama: 'Beras' },
      satuan: 'sak',
      harga_jual: 72000,
      jumlah_stok: 12.5,
      stok_minimum: 5,
      status_stok: 'NORMAL',
      status_stok_label: 'Normal',
      jenis_persediaan: 'TRACKED',
      gambar_id: null,
      gambar_url: null,
      aktif: true,
      dibuat_pada: '2026-12-01T08:30:00.000Z',
      diperbarui_pada: '2026-12-01T09:00:00.000Z',
    });
  });

  it('stok sama dengan minimum menjadi LOW dengan label Menipis', () => {
    const result = toProductResponse({ ...BASE_ROW, stock: '5.000' });

    expect(result.status_stok).toBe('LOW');
    expect(result.status_stok_label).toBe('Menipis');
  });

  it('stok 0 menjadi OUT_OF_STOCK dengan label Habis', () => {
    const result = toProductResponse({ ...BASE_ROW, stock: 0 });

    expect(result.status_stok).toBe('OUT_OF_STOCK');
    expect(result.status_stok_label).toBe('Habis');
  });

  it('NOT_TRACKED menghasilkan status null tanpa label', () => {
    const result = toProductResponse({ ...BASE_ROW, inventoryType: 'NOT_TRACKED' });

    expect(result.status_stok).toBeNull();
    expect(result.status_stok_label).toBeNull();
  });

  it('isDeleted true diekspos sebagai aktif false', () => {
    expect(toProductResponse({ ...BASE_ROW, isDeleted: true }).aktif).toBe(false);
  });
});
