import { z } from 'zod';

const NAMA_PRODUK = z
  .string('Nama produk wajib dikirim')
  .trim()
  .min(1, 'Nama produk wajib dikirim')
  .max(120, 'Nama produk maksimal 120 karakter');

const SATUAN = z
  .string('Satuan wajib dikirim')
  .trim()
  .min(1, 'Satuan wajib dikirim')
  .max(20, 'Satuan maksimal 20 karakter');

const KUANTITAS = z
  .number('Kuantitas harus berupa angka')
  .min(0, 'Kuantitas tidak boleh negatif')
  .refine((value) => Number.isInteger(value * 1000), 'Kuantitas maksimal 3 angka desimal');

export const createProductSchema = z.object({
  body: z.object({
    nama: NAMA_PRODUK,
    id_kategori: z.uuid('id_kategori harus UUID yang valid'),
    satuan: SATUAN,
    harga_jual: z
      .number('Harga jual harus berupa angka')
      .int('Harga jual harus bilangan bulat')
      .min(0, 'Harga jual tidak boleh negatif'),
    stok_minimum: KUANTITAS,
    jumlah_stok_awal: KUANTITAS.optional(),
    jenis_persediaan: z.enum(['TRACKED', 'NOT_TRACKED'], 'jenis_persediaan harus TRACKED atau NOT_TRACKED').optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z
    .object({
      nama: NAMA_PRODUK.optional(),
      id_kategori: z.uuid('id_kategori harus UUID yang valid').optional(),
      satuan: SATUAN.optional(),
      harga_jual: z.number('Harga jual harus berupa angka').int('Harga jual harus bilangan bulat').min(0, 'Harga jual tidak boleh negatif').optional(),
      stok_minimum: KUANTITAS.optional(),
      jenis_persediaan: z.enum(['TRACKED', 'NOT_TRACKED'], 'jenis_persediaan harus TRACKED atau NOT_TRACKED').optional(),
      jumlah_stok: z
        .unknown()
        .refine((value) => value === undefined, 'jumlah_stok tidak dapat diubah lewat endpoint ini; gunakan /stock-movements')
        .optional(),
      aktif: z.boolean('aktif harus boolean').optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Minimal satu field harus dikirim'),
});

export const productIdParamSchema = z.object({
  params: z.object({ id: z.uuid('ID produk tidak valid') }),
});

export const listProductQuerySchema = z.object({
  query: z.object({
    q: z.string().max(100, 'Kata kunci maksimal 100 karakter').optional(),
    id_kategori: z.uuid('id_kategori harus UUID yang valid').optional(),
    status_stok: z.enum(['NORMAL', 'LOW', 'OUT_OF_STOCK'], 'status_stok harus NORMAL, LOW, atau OUT_OF_STOCK').optional(),
    aktif: z.enum(['true', 'false', 'all'], 'aktif harus true, false, atau all').optional(),
    sort: z.string().optional(),
    halaman: z.string().regex(/^\d+$/, 'halaman harus bilangan bulat positif').optional(),
    limit: z.string().regex(/^\d+$/, 'limit harus bilangan bulat positif').optional(),
  }),
});

export type createProductInput = z.infer<typeof createProductSchema>['body'];
export type updateProductInput = z.infer<typeof updateProductSchema>['body'];
