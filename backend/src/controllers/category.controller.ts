import type { Response, NextFunction } from 'express';
import type { createCategoryInput, updateCategoryInput } from '../schemas/category.schema.ts';
import { createCategory, listCategories, updateCategory } from '../services/category.service.ts';
import type { BodyRequest, IdBodyRequest, QueryRequest } from '../types/http.type.ts';

export async function index(
  req: QueryRequest<{ halaman?: string; limit?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {

    const page = typeof req.query.halaman === 'string' ? req.query.halaman : undefined;
    const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;

    const { items, metadata } = await listCategories(page, limit);
    res.status(200).json({ kategori: items, meta: metadata });
  } catch (error) {
    next(error);
  }
}

export async function store(
  req: BodyRequest<createCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const kategori = await createCategory(req.body);
    res.status(201).json({ kategori });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: IdBodyRequest<updateCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const kategori = await updateCategory(id, req.body);
    res.status(200).json({ kategori });
  } catch (error) {
    next(error);
  }
}
