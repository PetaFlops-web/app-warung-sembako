import type { StockStatus } from '../utils/helpers/stock-status.ts';

export type MovementType = 'INITIAL' | 'IN' | 'OUT' | 'ADJUSTMENT';


export interface RestockProductRow {
  id: string;
  name: string;
  unit: string;
  stock: unknown;
  minStock: unknown;
  category: {
    id: string;
    name: string;
  };
}

export interface RecordMovementParams {
  productId: string;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  userId: number;
  minStock: number;
  inventoryType: 'TRACKED' | 'NOT_TRACKED';
}

export interface StockMovementProduct {
  id: string;
  nama: string;
  satuan: string;
}

export interface StockMovementActor {
  id: number;
  nama_pengguna: string;
  peran: string;
}

export interface StockMovementResponse {
  id: string;
  produk: StockMovementProduct;
  jenis_pergerakan: string;
  tipe: MovementType;
  jumlah: number;
  jumlah_sebelum: number;
  jumlah_sesudah: number;
  status_stok_setelah: StockStatus;
  catatan: string | null;
  dibuat_oleh: StockMovementActor;
  dibuat_pada: string;
  tanggal_dibuat: string;
}

export interface CreateStockMovementInput {
  id_produk: string;
  jenis_pergerakan: 'IN' | 'OUT';
  jumlah: number;
  catatan?: string | undefined;
}

export interface StockAdjustmentInput {
  id_produk: string;
  jumlah_baru: number;
  alasan: string;
}

export interface StockMovementFilter {
  id_produk?: string | undefined;
  jenis_pergerakan?: MovementType | undefined;
  dibuat_oleh?: number | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  halaman?: number | undefined;
  batasan?: number | undefined;
}

export interface StockMovementQuery {
  id_produk?: string | undefined;
  jenis_pergerakan?: MovementType | undefined;
  dibuat_oleh?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  halaman?: string | undefined;
  batasan?: string | undefined;
  limit?: string | undefined;
}

export interface StockSummary {
  total_produk: number;
  jumlah_normal: number;
  jumlah_stok_rendah: number;
  jumlah_stok_habis: number;
  waktu_dibuat: string;
}

export interface RestockListItem {
  id_produk: string;
  nama: string;
  kategori: {
    id: string;
    nama: string;
  };
  satuan: string;
  jumlah_stok: number;
  stok_minimum: number;
  selisih_ke_stok_minimum: number;
  status_stok: 'HABIS' | 'MENIPIS';
  status_stok_kode: 'OUT_OF_STOCK' | 'LOW';
}

export interface RestockListQuery {
  id_kategori?: string | undefined;
  status_stok?: string | undefined;
  halaman?: string | undefined;
  batasan?: string | undefined;
  limit?: string | undefined;
}

export interface StockListMetadata {
  halaman: number;
  batas: number;
  batasan: number;
  limit: number;
  total_data: number;
  total_halaman: number;
}

export interface StockMovementRow {
  id: string;
  type: MovementType;
  quantity: unknown;
  stockBefore: unknown;
  stockAfter: unknown;
  note: string | null;
  createdAt: Date;
  productId: string;
  product: {
    id: string;
    name: string;
    unit: string;
    minStock: unknown;
    inventoryType: 'TRACKED' | 'NOT_TRACKED';
  };
  userId: number;
  user: {
    id: number;
    name: string;
    role: string;
  };
}
