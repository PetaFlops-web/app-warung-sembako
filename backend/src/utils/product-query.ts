import { ValidationError } from '../expectation/index.ts';
import type { Prisma } from '../generated/prisma/client.ts';
import type { Direction, ListProductQuery, ProductWhere } from '../types/product.type.ts';

export const SORT_FIELDS = {
  nama: 'name',
  jumlah_stok: 'stock',
  harga_jual: 'price',
  diperbarui_pada: 'updatedAt',
} as const;

export type SortKey = keyof typeof SORT_FIELDS;

export function parseSort(raw?: string): { key: SortKey; direction: Direction } {
  const value = raw ?? 'nama';
  const direction: Direction = value.startsWith('-') ? 'desc' : 'asc';
  const key = (direction === 'desc' ? value.slice(1) : value) as SortKey;

  if (!(key in SORT_FIELDS)) {
    throw new ValidationError(`sort harus salah satu dari ${Object.keys(SORT_FIELDS).join(', ')} (awalan - untuk descending)`);
  }

  return { key, direction };
}

export function orderByFor(key: SortKey, direction: Direction): Prisma.ProductOrderByWithRelationInput {
  if (key === 'nama') {
    return { name: direction };
  }

  if (key === 'jumlah_stok') {
    return { stock: direction };
  }

  if (key === 'harga_jual') {
    return { price: direction };
  }

  return { updatedAt: direction };
}

export function buildWhere(query: ListProductQuery, aktif: string): ProductWhere {
  return {
    ...(aktif === 'true' ? { isDeleted: false } : aktif === 'false' ? { isDeleted: true } : {}),
    ...(query.id_kategori === undefined ? {} : { categoryId: query.id_kategori }),
    ...(query.q === undefined ? {} : { name: { contains: query.q, mode: 'insensitive' as const } }),
  };
}
