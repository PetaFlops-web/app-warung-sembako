import { prisma } from '../config/prisma.ts';
import { toNumber } from '../utils/helpers/product-mapper.ts';
import type { Prisma } from '../generated/prisma/client.ts';
import type { ProductWhere, FindManyArgs } from '../types/product.type.ts';

export const PRODUCT_INCLUDE = { category: true } as const;

export const productRepository = {
  findById: (id: string) => prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE }),

  findDuplicate: (nama: string, satuan: string, exceptId?: string) =>
    prisma.product.findFirst({
      where: {
        unit: satuan,
        name: { equals: nama, mode: 'insensitive' },
        ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
      },
    }),

  findMany: (args: FindManyArgs) =>
    prisma.product.findMany({
      where: args.where,
      orderBy: args.orderBy,
      include: PRODUCT_INCLUDE,
      ...(args.skip === undefined ? {} : { skip: args.skip }),
      ...(args.take === undefined ? {} : { take: args.take }),
    }),

  count: (where: ProductWhere) => prisma.product.count({ where }),

  createWithInitialStock: (data: Prisma.ProductUncheckedCreateInput, actorId: number) =>
    prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data, include: PRODUCT_INCLUDE });
      const stokAwal = toNumber(data.stock);

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
    }),

  update: (id: string, data: Prisma.ProductUncheckedUpdateInput) =>
    prisma.product.update({ where: { id }, data, include: PRODUCT_INCLUDE }),

  softDelete: (id: string) => prisma.product.update({ where: { id }, data: { isDeleted: true } }),
};
