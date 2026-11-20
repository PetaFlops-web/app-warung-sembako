import { z } from 'zod';
import type * as z4 from 'zod/v4/core';

const coerceNumber = <T extends z4.$ZodType>(schema: T) =>
  z.preprocess((val) => {
    if (val === undefined || val === null) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return undefined;
      const n = Number(trimmed);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, schema);

const MOVEMENT_TYPE_MAPPING: Record<string, 'IN' | 'OUT'> = {
  IN: 'IN',
  MASUK: 'IN',
  OUT: 'OUT',
  KELUAR: 'OUT',
};

const ALL_MOVEMENT_TYPE_MAPPING: Record<string, 'INITIAL' | 'IN' | 'OUT' | 'ADJUSTMENT'> = {
  INITIAL: 'INITIAL',
  AWAL: 'INITIAL',
  IN: 'IN',
  MASUK: 'IN',
  OUT: 'OUT',
  KELUAR: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  PENYESUAIAN: 'ADJUSTMENT',
};

const RESTOCK_STATUS_MAPPING: Record<string, 'LOW' | 'OUT_OF_STOCK'> = {
  LOW: 'LOW',
  MENIPIS: 'LOW',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  HABIS: 'OUT_OF_STOCK',
};

const KUANTITAS_POSITIF = z
  .number('Kuantitas harus berupa angka')
  .gt(0, 'Kuantitas harus lebih besar dari 0')
  .refine((value) => Number.isInteger(value * 1000), 'Kuantitas maksimal 3 angka desimal');

const KUANTITAS_NON_NEGATIF = z
  .number('Kuantitas harus berupa angka')
  .min(0, 'Kuantitas tidak boleh negatif')
  .refine((value) => Number.isInteger(value * 1000), 'Kuantitas maksimal 3 angka desimal');

export const createStockMovementSchema = z.object({
  body: z.object({
    id_produk: z.uuid('id_produk harus UUID yang valid'),
    jenis_pergerakan: z
      .string('jenis_pergerakan wajib dikirim')
      .trim()
      .transform((val, ctx) => {
        const normalized = MOVEMENT_TYPE_MAPPING[val.toUpperCase()];
        if (!normalized) {
          ctx.addIssue({
            code: 'custom',
            message: 'jenis_pergerakan harus IN atau OUT',
          });
          return z.NEVER;
        }
        return normalized;
      }),
    jumlah: coerceNumber(KUANTITAS_POSITIF),
    catatan: z.string().trim().max(255, 'Catatan maksimal 255 karakter').optional(),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    id_produk: z.uuid('id_produk harus UUID yang valid'),
    jumlah_baru: coerceNumber(KUANTITAS_NON_NEGATIF),
    alasan: z
      .string('alasan wajib diisi')
      .trim()
      .min(1, 'alasan wajib diisi')
      .max(255, 'alasan maksimal 255 karakter'),
  }),
});

export const listStockMovementQuerySchema = z.object({
  query: z.object({
    id_produk: z.uuid('id_produk harus UUID yang valid').optional(),
    jenis_pergerakan: z
      .string()
      .trim()
      .transform((val, ctx) => {
        const normalized = ALL_MOVEMENT_TYPE_MAPPING[val.toUpperCase()];
        if (!normalized) {
          ctx.addIssue({
            code: "custom",
            message: 'jenis_pergerakan harus INITIAL, IN, OUT, atau ADJUSTMENT',
          });
          return z.NEVER;
        }
        return normalized;
      })
      .optional(),
    dibuat_oleh: z.string().regex(/^\d+$/, 'dibuat_oleh harus berupa angka').optional(),
    from: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), 'Format tanggal from tidak valid')
      .optional(),
    to: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), 'Format tanggal to tidak valid')
      .optional(),
    halaman: z.string().regex(/^\d+$/, 'halaman harus bilangan bulat positif').optional(),
    batasan: z.string().regex(/^\d+$/, 'batasan harus bilangan bulat positif').optional(),
    limit: z.string().regex(/^\d+$/, 'limit harus bilangan bulat positif').optional(),
  }),
});

export const listRestockQuerySchema = z.object({
  query: z.object({
    id_kategori: z.uuid('id_kategori harus UUID yang valid').optional(),
    status_stok: z
      .string()
      .trim()
      .transform((val, ctx) => {
        const normalized = RESTOCK_STATUS_MAPPING[val.toUpperCase()];
        if (!normalized) {
          ctx.addIssue({
            code: "custom",
            message: 'status_stok harus LOW atau OUT_OF_STOCK',
          });
          return z.NEVER;
        }
        return normalized;
      })
      .optional(),
    halaman: z.string().regex(/^\d+$/, 'halaman harus bilangan bulat positif').optional(),
    batasan: z.string().regex(/^\d+$/, 'batasan harus bilangan bulat positif').optional(),
    limit: z.string().regex(/^\d+$/, 'limit harus bilangan bulat positif').optional(),
  }),
});

export type CreateStockMovementBody = z.infer<typeof createStockMovementSchema>['body'];
export type StockAdjustmentBody = z.infer<typeof stockAdjustmentSchema>['body'];
export type ListStockMovementQuery = z.infer<typeof listStockMovementQuerySchema>['query'];
export type ListRestockQuery = z.infer<typeof listRestockQuerySchema>['query'];
