import { ValidationError } from '../expectation/index.ts';
import type { ListMetadata } from '../types/product.type.ts';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePage(raw?: string): number {
  if (raw === undefined) {
    return 1;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError('halaman harus bilangan bulat minimal 1');
  }

  return value;
}

export function parseLimit(raw?: string): number {
  if (raw === undefined) {
    return DEFAULT_LIMIT;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new ValidationError(`limit harus bilangan bulat antara 1 dan ${MAX_LIMIT}`);
  }

  return value;
}

export function buildMetadata(halaman: number, limit: number, totalData: number): ListMetadata {
  return {
    halaman,
    limit,
    total_data: totalData,
    total_halaman: Math.max(1, Math.ceil(totalData / limit)),
  };
}
