import type { Request, Response, NextFunction } from 'express';
import type { BodyRequest, IdBodyRequest, QueryRequest } from '../types/http.type.ts';
import type { createProductInput, updateProductInput } from '../schemas/product.schema.ts';
import type { ListQuery, IdParams } from '../types/product.type.ts';
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from '../services/product.service.ts';

export async function index(
  req: QueryRequest<ListQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { items, metadata } = await listProducts(req.query, req.user?.role ?? '');
    res.status(200).json({ produk: items, metadata });
  } catch (error) {
    next(error);
  }
}

export async function show(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const produk = await getProductById(id, req.user?.role ?? '');
    res.status(200).json({ produk });
  } catch (error) {
    next(error);
  }
}

export async function store(
  req: BodyRequest<createProductInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const produk = await createProduct(req.body, req.user?.sub ?? 0);
    res.status(201).json({ produk });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: IdBodyRequest<updateProductInput>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    const produk = await updateProduct(id, req.body);
    res.status(200).json({ produk });
  } catch (error) {
    next(error);
  }
}

export async function destroy(
  req: Request<IdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    await deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
