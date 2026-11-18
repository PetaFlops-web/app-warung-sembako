import type { StockStatus } from '../utils/stock-status.ts';

export type JenisPersediaan = 'TRACKED' | 'NOT_TRACKED';
export type Direction = 'asc' | 'desc';

export interface CategoryResponse {
  id: string;
  nama: string;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface ProductCategoryRef {
  id: string;
  nama: string;
}

export interface ProductResponse {
  id: string;
  nama: string;
  kategori: ProductCategoryRef;
  satuan: string;
  harga_jual: number;
  jumlah_stok: number;
  stok_minimum: number;
  status_stok: StockStatus;
  status_stok_label: string | null;
  jenis_persediaan: JenisPersediaan;
  gambar_id: string | null;
  gambar_url: string | null;
  aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface ListMetadata {
  halaman: number;
  limit: number;
  total_data: number;
  total_halaman: number;
}

export interface ListResult<T> {
  items: T[];
  metadata: ListMetadata;
}

export interface ListProductQuery {
  q?: string | undefined;
  id_kategori?: string | undefined;
  status_stok?: string | undefined;
  aktif?: string | undefined;
  sort?: string | undefined;
  halaman?: string | undefined;
  limit?: string | undefined;
}

export interface ProductWhere {
  isDeleted?: boolean;
  categoryId?: string;
  name?: { contains: string; mode: 'insensitive' };
}