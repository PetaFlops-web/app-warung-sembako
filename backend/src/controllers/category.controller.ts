import type { Request, Response, NextFunction } from 'express';
import type { createCategoryInput, updateCategoryInput } from '../schemas/category.schema.ts';
import { createCategory, listCategories, updateCategory } from '../services/category.service.ts';

type IdParams = { id: string };

export async function index(
  req: Request<{}, {}, {}, { halaman?: string; limit?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { items, metadata } = await listCategories(req.query.halaman, req.query.limit);
    res.status(200).json({ kategori: items, meta: metadata });
  } catch (error) {
    next(error);
  }
}

export async function store(
  req: Request<{}, {}, createCategoryInput>,
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
  req: Request<IdParams, {}, updateCategoryInput>,
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
