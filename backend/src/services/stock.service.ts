import { NotFoundError, ConflictError, ClientError, ERROR_CODE } from '../expectation/index.ts';
import { stockRepository } from '../repositories/stock.repository.ts';
import { toNumber } from '../utils/helpers/product-mapper.ts';
import { toRestockListItem, toStockMovementResponse } from '../utils/helpers/stock-mapper.ts';
import type {
  CreateStockMovementInput,
  StockAdjustmentInput,
  StockMovementQuery,
  RestockListQuery,
} from '../types/stock.type.ts';

function parsePositiveInt(val: string | undefined, defaultVal: number): number {
  if (!val) return defaultVal;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) || parsed < 1 ? defaultVal : parsed;
}

export async function createStockMovement(input: CreateStockMovementInput, userId: number) {
  const product = await stockRepository.findProductById(input.id_produk);

  if (!product || product.isDeleted) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (product.inventoryType === 'NOT_TRACKED') {
    throw new ClientError('Produk tidak melacak persediaan stok', 400, ERROR_CODE.BAD_REQUEST);
  }

  const currentStock = toNumber(product.stock);
  const quantity = input.jumlah;
  let stockAfter = currentStock;

  if (input.jenis_pergerakan === 'OUT') {
    if (quantity > currentStock) {
      throw new ConflictError('Stok tidak mencukupi untuk pergerakan keluar', 'INSUFFICIENT_STOCK');
    }
    stockAfter = currentStock - quantity;
  } else {
    stockAfter = currentStock + quantity;
  }

  const movementRow = await stockRepository.recordMovementTx({
    productId: product.id,
    type: input.jenis_pergerakan,
    quantity,
    stockBefore: currentStock,
    stockAfter,
    note: input.catatan?.trim() || null,
    userId,
    minStock: toNumber(product.minStock),
    inventoryType: product.inventoryType,
  });

  return toStockMovementResponse(movementRow);
}

export async function createStockAdjustment(input: StockAdjustmentInput, userId: number) {
  const product = await stockRepository.findProductById(input.id_produk);

  if (!product || product.isDeleted) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (product.inventoryType === 'NOT_TRACKED') {
    throw new ClientError('Produk tidak melacak persediaan stok', 400, ERROR_CODE.BAD_REQUEST);
  }

  const currentStock = toNumber(product.stock);
  const newStock = input.jumlah_baru;
  const quantity = Math.abs(newStock - currentStock);

  const movementRow = await stockRepository.recordMovementTx({
    productId: product.id,
    type: 'ADJUSTMENT',
    quantity,
    stockBefore: currentStock,
    stockAfter: newStock,
    note: input.alasan.trim(),
    userId,
    minStock: toNumber(product.minStock),
    inventoryType: product.inventoryType,
  });

  return toStockMovementResponse(movementRow);
}

export async function listStockMovements(query: StockMovementQuery) {
  const halaman = parsePositiveInt(query.halaman, 1);
  const rawLimit = query.batasan ?? query.limit;
  const batasan = Math.min(100, parsePositiveInt(rawLimit, 20));

  const filter = {
    ...(query.id_produk ? { id_produk: query.id_produk } : {}),
    ...(query.jenis_pergerakan ? { jenis_pergerakan: query.jenis_pergerakan } : {}),
    ...(query.dibuat_oleh ? { dibuat_oleh: parseInt(query.dibuat_oleh, 10) } : {}),
    ...(query.from ? { from: new Date(query.from) } : {}),
    ...(query.to ? { to: new Date(query.to) } : {}),
    halaman,
    batasan,
  };

  const { items, totalData } = await stockRepository.findMovements(filter);
  const totalHalaman = Math.max(1, Math.ceil(totalData / batasan));

  return {
    pergerakan_stok: items.map(toStockMovementResponse),
    metadata: {
      halaman,
      batas: batasan,
      batasan,
      limit: batasan,
      total_data: totalData,
      total_halaman: totalHalaman,
    },
  };
}

export async function getStockSummary() {
  const summary = await stockRepository.getSummary();
  return { ringkasan_stok: summary };
}

export async function getRestockList(query: RestockListQuery) {
  const halaman = parsePositiveInt(query.halaman, 1);
  const rawLimit = query.batasan ?? query.limit;
  const batasan = Math.min(100, parsePositiveInt(rawLimit, 20));

  const filter = {
    ...(query.id_kategori ? { categoryId: query.id_kategori } : {}),
    ...(query.status_stok ? { status: query.status_stok as 'LOW' | 'OUT_OF_STOCK' } : {}),
    halaman,
    batasan,
  };

  const { items, totalData } = await stockRepository.findRestockList(filter);
  const totalHalaman = Math.max(1, Math.ceil(totalData / batasan));

  return {
    daftar_pengisian_ulang_stok: items.map(toRestockListItem),
    metadata: {
      halaman,
      batas: batasan,
      batasan,
      limit: batasan,
      total_data: totalData,
      total_halaman: totalHalaman,
    },
  };
}
