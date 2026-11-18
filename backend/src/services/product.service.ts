import { prisma } from '../config/prisma.ts';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../expectation/index.ts';
import { toNumber, toProductResponse } from '../utils/product-mapper.ts';
import { buildMetadata, parseLimit, parsePage } from '../utils/query.ts';
import type { ListResult, ProductResponse } from '../types/product.type.ts';
import type { createProductInput, updateProductInput } from '../schemas/product.schema.ts';

const PRODUCT_INCLUDE = { category: true } as const;

const SORT_FIELDS = {
  nama: 'name',
  jumlah_stok: 'stock',
  harga_jual: 'price',
  diperbarui_pada: 'updatedAt',
} as const;

type SortKey = keyof typeof SORT_FIELDS;

type Direction = 'asc' | 'desc';

interface ListProductQuery {
  q?: string | undefined;
  id_kategori?: string | undefined;
  status_stok?: string | undefined;
  aktif?: string | undefined;
  sort?: string | undefined;
  halaman?: string | undefined;
  limit?: string | undefined;
}

interface ProductWhere {
  isDeleted?: boolean;
  categoryId?: string;
  name?: { contains: string; mode: 'insensitive' };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

function parseSort(raw?: string): { key: SortKey; direction: Direction } {
  const value = raw ?? 'nama';
  const direction: Direction = value.startsWith('-') ? 'desc' : 'asc';
  const key = (direction === 'desc' ? value.slice(1) : value) as SortKey;

  if (!(key in SORT_FIELDS)) {
    throw new ValidationError(`sort harus salah satu dari ${Object.keys(SORT_FIELDS).join(', ')} (awalan - untuk descending)`);
  }

  return { key, direction };
}

function orderByFor(key: SortKey, direction: Direction) {
  if (key === 'nama') {
    return { name: direction } as const;
  }

  if (key === 'jumlah_stok') {
    return { stock: direction } as const;
  }

  if (key === 'harga_jual') {
    return { price: direction } as const;
  }

  return { updatedAt: direction } as const;
}

function buildWhere(query: ListProductQuery, aktif: string): ProductWhere {
  return {
    ...(aktif === 'true' ? { isDeleted: false } : aktif === 'false' ? { isDeleted: true } : {}),
    ...(query.id_kategori === undefined ? {} : { categoryId: query.id_kategori }),
    ...(query.q === undefined ? {} : { name: { contains: query.q, mode: 'insensitive' as const } }),
  };
}

function resolveAktifFilter(query: ListProductQuery, requesterRole: string): string {
  const aktif = query.aktif ?? 'true';

  if ((aktif === 'false' || aktif === 'all') && requesterRole !== 'OWNER') {
    throw new ForbiddenError('Hanya Pemilik Warung yang dapat melihat produk nonaktif');
  }

  return aktif;
}

async function findProductOrFail(id: string, requesterRole: string): Promise<ProductResponse> {
  const row = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });

  if (!row || (row.isDeleted && requesterRole !== 'OWNER')) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  return toProductResponse(row);
}

async function assertNameAvailable(nama: string, satuan: string, exceptId?: string): Promise<void> {
  const duplicate = await prisma.product.findFirst({
    where: {
      unit: satuan,
      name: { equals: nama, mode: 'insensitive' },
      ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
    },
  });

  if (duplicate) {
    throw new ConflictError('Nama produk sudah ada pada satuan yang sama');
  }
}

export async function listProducts(query: ListProductQuery, requesterRole: string): Promise<ListResult<ProductResponse>> {
  const halaman = parsePage(query.halaman);
  const limit = parseLimit(query.limit);
  const aktif = resolveAktifFilter(query, requesterRole);
  const { key, direction } = parseSort(query.sort);
  const where = buildWhere(query, aktif);
  const orderBy = [orderByFor(key, direction), { id: 'asc' } as const];
  const statusFilter = query.status_stok;

  if (statusFilter !== undefined) {
    const rows = await prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy });
    const filtered = rows.map((row) => toProductResponse(row)).filter((item) => item.status_stok === statusFilter);
    const offset = (halaman - 1) * limit;

    return {
      items: filtered.slice(offset, offset + limit),
      metadata: buildMetadata(halaman, limit, filtered.length),
    };
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip: (halaman - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: rows.map((row) => toProductResponse(row)), metadata: buildMetadata(halaman, limit, total) };
}

export async function getProductById(id: string, requesterRole: string): Promise<ProductResponse> {
  return findProductOrFail(id, requesterRole);
}

export async function createProduct(input: createProductInput, actorId: number): Promise<ProductResponse> {
  const nama = input.nama.trim();
  const satuan = input.satuan.trim();

  const category = await prisma.category.findUnique({ where: { id: input.id_kategori } });

  if (!category) {
    throw new NotFoundError('Kategori tidak ditemukan');
  }

  await assertNameAvailable(nama, satuan);

  const stokAwal = input.jumlah_stok_awal ?? 0;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: nama,
          categoryId: input.id_kategori,
          unit: satuan,
          price: input.harga_jual,
          stock: stokAwal,
          minStock: input.stok_minimum,
          inventoryType: input.jenis_persediaan ?? 'TRACKED',
          createdById: actorId,
        },
        include: PRODUCT_INCLUDE,
      });

      if (stokAwal > 0) {
        await tx.stockMovement.create({
          data: {
            type: 'INITIAL',
            quantity: stokAwal,
            stockBefore: 0,
            stockAfter: stokAwal,
            note: 'Stok awal saat produk dibuat',
            productId: product.id,
            userId: actorId,
          },
        });
      }

      return product;
    });

    return toProductResponse(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Nama produk sudah ada pada satuan yang sama');
    }

    throw error;
  }
}

export async function updateProduct(id: string, input: updateProductInput): Promise<ProductResponse> {
  const existing = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });

  if (!existing) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (input.id_kategori !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: input.id_kategori } });

    if (!category) {
      throw new NotFoundError('Kategori tidak ditemukan');
    }
  }

  const nama = input.nama?.trim() ?? existing.name;
  const satuan = input.satuan?.trim() ?? existing.unit;

  if (nama !== existing.name || satuan !== existing.unit) {
    await assertNameAvailable(nama, satuan, id);
  }

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(input.nama === undefined ? {} : { name: nama }),
        ...(input.satuan === undefined ? {} : { unit: satuan }),
        ...(input.id_kategori === undefined ? {} : { categoryId: input.id_kategori }),
        ...(input.harga_jual === undefined ? {} : { price: input.harga_jual }),
        ...(input.stok_minimum === undefined ? {} : { minStock: input.stok_minimum }),
        ...(input.jenis_persediaan === undefined ? {} : { inventoryType: input.jenis_persediaan }),
        ...(input.aktif === undefined ? {} : { isDeleted: !input.aktif }),
      },
      include: PRODUCT_INCLUDE,
    });

    return toProductResponse(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Nama produk sudah ada pada satuan yang sama');
    }

    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('Produk tidak ditemukan');
  }

  if (existing.isDeleted) {
    return;
  }

  await prisma.product.update({ where: { id }, data: { isDeleted: true } });
}
