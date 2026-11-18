import { describe, expect, it } from 'vitest';
import { getStockStatus, STOCK_STATUS_LABEL } from '../../src/utils/stock-status.ts';

describe('getStockStatus (FR-STAT-01..03, kontrak §6)', () => {
  it('stok di atas batas minimum adalah NORMAL', () => {
    expect(getStockStatus(10, 3)).toBe('NORMAL');
  });

  it('stok sama dengan batas minimum adalah LOW', () => {
    expect(getStockStatus(3, 3)).toBe('LOW');
  });

  it('stok di bawah batas minimum (tetapi > 0) adalah LOW', () => {
    expect(getStockStatus(1, 3)).toBe('LOW');
  });

  it('stok 0 adalah OUT_OF_STOCK', () => {
    expect(getStockStatus(0, 3)).toBe('OUT_OF_STOCK');
  });

  it('stok 0 dengan batas minimum 0 tetap OUT_OF_STOCK', () => {
    expect(getStockStatus(0, 0)).toBe('OUT_OF_STOCK');
  });

  it('FR-STAT-03: batas minimum 0 hanya menghasilkan OUT_OF_STOCK atau NORMAL', () => {
    expect(getStockStatus(5, 0)).toBe('NORMAL');
    expect(getStockStatus(0.001, 0)).toBe('NORMAL');
  });

  it('mendukung kuantitas desimal (maks 3 desimal)', () => {
    expect(getStockStatus(2.5, 2.5)).toBe('LOW');
    expect(getStockStatus(2.501, 2.5)).toBe('NORMAL');
  });

  it('NOT_TRACKED menghasilkan null (tidak dipantau)', () => {
    expect(getStockStatus(0, 5, 'NOT_TRACKED')).toBeNull();
    expect(getStockStatus(50, 5, 'NOT_TRACKED')).toBeNull();
  });

  it('FR-STAT-02: label tampilan Indonesia', () => {
    expect(STOCK_STATUS_LABEL.NORMAL).toBe('Normal');
    expect(STOCK_STATUS_LABEL.LOW).toBe('Menipis');
    expect(STOCK_STATUS_LABEL.OUT_OF_STOCK).toBe('Habis');
  });
});
