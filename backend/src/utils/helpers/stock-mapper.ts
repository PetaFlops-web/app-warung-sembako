import { getStockStatus } from './stock-status.ts';
import { toNumber } from './product-mapper.ts';
import type {
  MovementType,
  StockMovementResponse,
  StockMovementRow,
  RestockListItem,
  RestockProductRow,
} from '../../types/stock.type.ts';

export function mapMovementTypeToContract(type: MovementType): string {
  switch (type) {
    case 'IN':
      return 'MASUK';
    case 'OUT':
      return 'KELUAR';
    case 'ADJUSTMENT':
      return 'PENYESUAIAN';
    case 'INITIAL':
      return 'AWAL';
    default:
      return type;
  }
}

export function toStockMovementResponse(row: StockMovementRow): StockMovementResponse {
  const stockAfter = toNumber(row.stockAfter);
  const minStock = toNumber(row.product.minStock);
  const statusSetelah = getStockStatus(stockAfter, minStock, row.product.inventoryType);

  const isoTime = row.createdAt.toISOString();

  return {
    id: row.id,
    produk: {
      id: row.product.id,
      nama: row.product.name,
      satuan: row.product.unit,
    },
    jenis_pergerakan: mapMovementTypeToContract(row.type),
    tipe: row.type,
    jumlah: toNumber(row.quantity),
    jumlah_sebelum: toNumber(row.stockBefore),
    jumlah_sesudah: stockAfter,
    status_stok_setelah: statusSetelah,
    catatan: row.note,
    dibuat_oleh: {
      id: row.user.id,
      nama_pengguna: row.user.name,
      peran: row.user.role,
    },
    dibuat_pada: isoTime,
    tanggal_dibuat: isoTime,
  };
}

export function toRestockListItem(row: RestockProductRow): RestockListItem {
  const stock = toNumber(row.stock);
  const minStock = toNumber(row.minStock);
  const status = stock <= 0 ? 'OUT_OF_STOCK' : 'LOW';

  return {
    id_produk: row.id,
    nama: row.name,
    kategori: {
      id: row.category.id,
      nama: row.category.name,
    },
    satuan: row.unit,
    jumlah_stok: stock,
    stok_minimum: minStock,
    selisih_ke_stok_minimum: stock - minStock,
    status_stok: status === 'OUT_OF_STOCK' ? 'HABIS' : 'MENIPIS',
    status_stok_kode: status,
  };
}