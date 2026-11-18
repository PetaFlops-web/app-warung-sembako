import { getStockStatus, STOCK_STATUS_LABEL, type InventoryType } from './stock-status.ts';
import type { ProductResponse } from '../types/product.type.ts';

type DecimalLike = { toString(): string };

export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value !== null && value !== undefined && typeof (value as DecimalLike).toString === 'function') {
    const parsed = Number((value as DecimalLike).toString());

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export interface ProductRow {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: unknown;
  minStock: unknown;
  inventoryType: InventoryType;
  imageId: string | null;
  imageUrl: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string };
}

export function toProductResponse(row: ProductRow): ProductResponse {
  const stock = toNumber(row.stock);
  const minStock = toNumber(row.minStock);
  const status = getStockStatus(stock, minStock, row.inventoryType);

  return {
    id: row.id,
    nama: row.name,
    kategori: { id: row.category.id, nama: row.category.name },
    satuan: row.unit,
    harga_jual: row.price,
    jumlah_stok: stock,
    stok_minimum: minStock,
    status_stok: status,
    status_stok_label: status === null ? null : STOCK_STATUS_LABEL[status],
    jenis_persediaan: row.inventoryType,
    gambar_id: row.imageId,
    gambar_url: row.imageUrl,
    aktif: !row.isDeleted,
    dibuat_pada: row.createdAt.toISOString(),
    diperbarui_pada: row.updatedAt.toISOString(),
  };
}
