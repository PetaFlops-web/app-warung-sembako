export type StockStatus = 'NORMAL' | 'LOW' | 'OUT_OF_STOCK' | null;

export type InventoryType = 'TRACKED' | 'NOT_TRACKED';

export const STOCK_STATUS_LABEL: Record<Exclude<StockStatus, null>, string> = {
  NORMAL: 'Normal',
  LOW: 'Menipis',
  OUT_OF_STOCK: 'Habis',
};

export function getStockStatus(
  stock: number,
  minStock: number,
  inventoryType: InventoryType = 'TRACKED',
): StockStatus {
  if (inventoryType === 'NOT_TRACKED') {
    return null;
  }

  if (stock <= 0) {
    return 'OUT_OF_STOCK';
  }

  if (stock <= minStock) {
    return 'LOW';
  }

  return 'NORMAL';
}
