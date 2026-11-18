import { prisma } from '../config/prisma.ts';
import { ConflictError, NotFoundError } from '../expectation/index.ts';
import { buildMetadata, parseLimit, parsePage } from '../utils/query.ts';
import type { CategoryResponse, ListResult } from '../types/product.type.ts';
import type { createCategoryInput, updateCategoryInput } from '../schemas/category.schema.ts';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

function toCategoryResponse(row: { id: string; name: string; createdAt: Date; updatedAt: Date }): CategoryResponse {
  return {
    id: row.id,
    nama: row.name,
    dibuat_pada: row.createdAt.toISOString(),
    diperbarui_pada: row.updatedAt.toISOString(),
  };
}

export async function listCategories(halamanRaw?: string, limitRaw?: string): Promise<ListResult<CategoryResponse>> {
  const halaman = parsePage(halamanRaw);
  const limit = parseLimit(limitRaw);

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      skip: (halaman - 1) * limit,
      take: limit,
    }),
    prisma.category.count(),
  ]);

  return { items: rows.map(toCategoryResponse), metadata: buildMetadata(halaman, limit, total) };
}

export async function createCategory(input: createCategoryInput): Promise<CategoryResponse> {
  const nama = input.nama.trim();

  const existing = await prisma.category.findUnique({ where: { name: nama } });

  if (existing) {
    throw new ConflictError('Nama kategori sudah ada');
  }

  try {
    const created = await prisma.category.create({ data: { name: nama } });

    return toCategoryResponse(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Nama kategori sudah ada');
    }

    throw error;
  }
}

export async function updateCategory(id: string, input: updateCategoryInput): Promise<CategoryResponse> {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Kategori tidak ditemukan');
  }

  const nama = input.nama?.trim();

  if (nama !== undefined && nama !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name: nama } });

    if (duplicate) {
      throw new ConflictError('Nama kategori sudah ada');
    }
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: { ...(nama === undefined ? {} : { name: nama }) },
    });

    return toCategoryResponse(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Nama kategori sudah ada');
    }

    throw error;
  }
}
