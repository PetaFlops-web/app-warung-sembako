import { z } from 'zod';

const NAMA_KATEGORI = z
  .string('Nama kategori wajib dikirim')
  .trim()
  .min(1, 'Nama kategori wajib dikirim')
  .max(60, 'Nama kategori maksimal 60 karakter');

export const createCategorySchema = z.object({
  body: z.object({ nama: NAMA_KATEGORI }),
});

export const updateCategorySchema = z.object({
  body: z
    .object({ nama: NAMA_KATEGORI.optional() })
    .refine((body) => Object.keys(body).length > 0, 'Minimal satu field harus dikirim'),
});

export const categoryIdParamSchema = z.object({
  params: z.object({ id: z.uuid('ID kategori tidak valid') }),
});

export type createCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type updateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
