import { prisma } from '../config/prisma.ts';
import { toNumber } from '../utils/helpers/product-mapper.ts';
import { getStockStatus } from '../utils/helpers/stock-status.ts';
import type { Prisma } from '../generated/prisma/client.ts';
import type {
  StockMovementFilter,
  StockMovementRow,
  StockSummary,
  RecordMovementParams
} from '../types/stock.type.ts';

export const STOCK_MOVEMENT_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      unit: true,
      minStock: true,
      inventoryType: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

export const stockRepository = {
  findProductById: (id: string) =>
    prisma.product.findUnique({
      where: { id },
      include: { category: true },
    }),

  recordMovementTx: async (params: RecordMovementParams): Promise<StockMovementRow> => {
    return prisma.$transaction(async (tx) => {
      // 1. Update product stock
      await tx.product.update({
        where: { id: params.productId },
        data: { stock: params.stockAfter },
      });

      // 2. Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          type: params.type,
          quantity: params.quantity,
          stockBefore: params.stockBefore,
          stockAfter: params.stockAfter,
          note: params.note,
          productId: params.productId,
          userId: params.userId,
        },
        include: STOCK_MOVEMENT_INCLUDE,
      });

      // 3. Auto-sync restock items
      const status = getStockStatus(params.stockAfter, params.minStock, params.inventoryType);
      if (status === 'LOW' || status === 'OUT_OF_STOCK') {
        const suggestedQty = Math.max(1, params.minStock * 2 - params.stockAfter);
        await tx.restockItem.upsert({
          where: { productId: params.productId },
          create: {
            productId: params.productId,
            suggestedQty,
          },
          update: {
            suggestedQty,
          },
        });
      } else if (status === 'NORMAL') {
        await tx.restockItem.deleteMany({
          where: { productId: params.productId },
        });
      }

      return movement;
    });
  },

  findMovements: async (filter: StockMovementFilter) => {
    const where: Prisma.StockMovementWhereInput = {};

    if (filter.id_produk) {
      where.productId = filter.id_produk;
    }

    if (filter.jenis_pergerakan) {
      where.type = filter.jenis_pergerakan;
    }

    if (filter.dibuat_oleh !== undefined) {
      where.userId = filter.dibuat_oleh;
    }

    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) {
        where.createdAt.gte = filter.from;
      }
      if (filter.to) {
        where.createdAt.lt = filter.to;
      }
    }

    const halaman = filter.halaman ?? 1;
    const batasan = filter.batasan ?? 20;
    const skip = (halaman - 1) * batasan;

    const [items, totalData] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: STOCK_MOVEMENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: batasan,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      items,
      totalData,
    };
  },

  getSummary: async (): Promise<StockSummary> => {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        stock: true,
        minStock: true,
        inventoryType: true,
      },
    });

    let normal = 0;
    let rendah = 0;
    let habis = 0;

    for (const p of products) {
      if (p.inventoryType === 'NOT_TRACKED') {
        continue;
      }
      const stock = toNumber(p.stock);
      const minStock = toNumber(p.minStock);

      if (stock <= 0) {
        habis += 1;
      } else if (stock <= minStock) {
        rendah += 1;
      } else {
        normal += 1;
      }
    }

    return {
      total_produk: products.length,
      jumlah_normal: normal,
      jumlah_stok_rendah: rendah,
      jumlah_stok_habis: habis,
      waktu_dibuat: new Date().toISOString(),
    };
  },

  findRestockList: async (filter: {
    categoryId?: string | undefined;
    status?: 'LOW' | 'OUT_OF_STOCK' | undefined;
    halaman?: number | undefined;
    batasan?: number | undefined;
  }) => {
    const where: Prisma.ProductWhereInput = {
      isDeleted: false,
      inventoryType: 'TRACKED',
    };

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter products with stock <= minStock
    const restockCandidates = products
      .map((p) => {
        const stock = toNumber(p.stock);
        const minStock = toNumber(p.minStock);
        const status: 'LOW' | 'OUT_OF_STOCK' | null =
          stock <= 0 ? 'OUT_OF_STOCK' : stock <= minStock ? 'LOW' : null;
        return {
          row: p,
          stock,
          minStock,
          status,
        };
      })
      .filter((item): item is typeof item & { status: 'LOW' | 'OUT_OF_STOCK' } => {
        if (!item.status) return false;
        if (filter.status && item.status !== filter.status) return false;
        return true;
      });

    restockCandidates.sort((a, b) => {
      if (a.status === 'OUT_OF_STOCK' && b.status !== 'OUT_OF_STOCK') return -1;
      if (a.status !== 'OUT_OF_STOCK' && b.status === 'OUT_OF_STOCK') return 1;
      return a.row.name.localeCompare(b.row.name, 'id');
    });

    const halaman = filter.halaman ?? 1;
    const batasan = filter.batasan ?? 20;
    const totalData = restockCandidates.length;
    const skip = (halaman - 1) * batasan;
    const paged = restockCandidates.slice(skip, skip + batasan);

    return {
      items: paged.map((item) => item.row),
      totalData,
    };
  },
};
