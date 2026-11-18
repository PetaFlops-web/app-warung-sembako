import type { CategoryResponse } from '../../types/product.type.ts';

export function toCategoryResponse(row: { id: string; name: string; createdAt: Date; updatedAt: Date }): CategoryResponse {
  return {
    id: row.id,
    nama: row.name,
    dibuat_pada: row.createdAt.toISOString(),
    diperbarui_pada: row.updatedAt.toISOString(),
  };
}