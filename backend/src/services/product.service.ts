import { ConflictError, NotFoundError } from '../expectation/index.ts';
import * as categoryService from './category.service.ts';
import { productRepository } from '../repositories/product.repository.ts';
import { isOwner, resolveAktifFilter } from '../policies/product.policy.ts';
import { buildWhere, orderByFor, parseSort } from '../utils/helpers/product-query.ts';
import { buildMetadata, parseLimit, parsePage } from '../utils/query.ts';
import { isUniqueViolation } from '../utils/prisma-error.ts';
import { toProductResponse } from '../utils/helpers/product-mapper.ts';
import type { Prisma } from '../generated/prisma/client.ts';
import type { ListResult, ProductResponse, ListProductQuery } from '../types/product.type.ts';
import type { createProductInput, updateProductInput } from '../schemas/product.schema.ts';

const DUPLICATE_NAME_MESSAGE = 'Nama produk sudah ada pada satuan yang sama';

export async function listProducts(query: ListProductQuery, requesterRole: string): Promise<ListResult<ProductResponse>> {
  const halaman = parsePage(query.halaman);
  const limit = parseLimit(query.limit);
  const aktif = resolveAktifFilter(query, requesterRole);
  const { key, direction } = parseSort(query.sort);
  const where = buildWhere(query, aktif);
  const orderBy = [orderByFor(key, direction), { id: 'asc' } as const];
  const statusFilter = query.status_stok;

  if (statusFilter !== undefined) {
    const rows = await productRepository.findMany({ where, orderBy });
    const filtered = rows.map((row) => toProductResponse(row)).filter((item) => item.status_stok === statusFilter);
    const offset = (halaman - 1) * limit;

    return {
      items: filtered.slice(offset, offset + limit),
      metadata: buildMetadata(halaman, limit, filtered.length),
    };
  }

  const [rows, total] = await Promise.all([
    productRepository.findMany({ where, orderBy, skip: (halaman - 1) * limit, take: limit }),
    productRepository.count(where),
  ]);

  return { items: rows.map((row) => toProductResponse(row)), metadata: buildMetadata(halaman, limit, total) };
}

export async function getProductById(id: string, requesterRole: string): Promise<ProductResponse> {
  const row = await productRepository.findById(id);

  if (!row || (row.isDeleted && !isOwner(requesterRole))) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  return toProductResponse(row);
}

export async function createProduct(input: createProductInput, actorId: number): Promise<ProductResponse> {
  const nama = input.nama.trim();
  const satuan = input.satuan.trim();
  const duplicate = await productRepository.findDuplicate(nama, satuan);

  if (duplicate) {
    throw new ConflictError(DUPLICATE_NAME_MESSAGE);
  }

  await categoryService.assertExists(input.id_kategori);
  
  const stokAwal = input.jumlah_stok_awal ?? 0;
  const data: Prisma.ProductUncheckedCreateInput = {
    name: nama,
    categoryId: input.id_kategori,
    unit: satuan,
    price: input.harga_jual,
    stock: stokAwal,
    minStock: input.stok_minimum,
    inventoryType: input.jenis_persediaan ?? 'TRACKED',
    createdById: actorId,
  };

  try {
    const created = await productRepository.createWithInitialStock(data, actorId);

    return toProductResponse(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(DUPLICATE_NAME_MESSAGE);
    }

    throw error;
  }
}

export async function updateProduct(id: string, input: updateProductInput): Promise<ProductResponse> {
  const existing = await productRepository.findById(id);

  if (!existing) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (input.id_kategori !== undefined) {
    await categoryService.assertExists(input.id_kategori);
  }

  const nama = input.nama?.trim() ?? existing.name;
  const satuan = input.satuan?.trim() ?? existing.unit;

  if (nama !== existing.name || satuan !== existing.unit) {
      const duplicate = await productRepository.findDuplicate(nama, satuan, id);

      if (duplicate) {
        throw new ConflictError(DUPLICATE_NAME_MESSAGE);
      }
    }

  const data: Prisma.ProductUncheckedUpdateInput = {
    ...(input.nama === undefined ? {} : { name: nama }),
    ...(input.satuan === undefined ? {} : { unit: satuan }),
    ...(input.id_kategori === undefined ? {} : { categoryId: input.id_kategori }),
    ...(input.harga_jual === undefined ? {} : { price: input.harga_jual }),
    ...(input.stok_minimum === undefined ? {} : { minStock: input.stok_minimum }),
    ...(input.jenis_persediaan === undefined ? {} : { inventoryType: input.jenis_persediaan }),
    ...(input.aktif === undefined ? {} : { isDeleted: !input.aktif }),
  };

  try {
    const updated = await productRepository.update(id, data);

    return toProductResponse(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError(DUPLICATE_NAME_MESSAGE);
    }

    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await productRepository.findById(id);

  if (!existing) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (existing.isDeleted) {
    return;
  }

  await productRepository.softDelete(id);
}
