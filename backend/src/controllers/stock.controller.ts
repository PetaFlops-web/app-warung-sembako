import type { Request, Response, NextFunction } from 'express';
import type { BodyRequest, QueryRequest } from '../types/http.type.ts';
import type {
  CreateStockMovementBody,
  StockAdjustmentBody,
  ListStockMovementQuery,
  ListRestockQuery,
} from '../schemas/stock.schema.ts';
import {
  createStockMovement,
  createStockAdjustment,
  listStockMovements,
  getStockSummary,
  getRestockList,
} from '../services/stock.service.ts';

export async function storeMovement(
  req: BodyRequest<CreateStockMovementBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.sub ?? 0;
    const movement = await createStockMovement(req.body, userId);
    res.status(201).json({ pergerakan_stok: movement });
  } catch (error) {
    next(error);
  }
}

export async function storeAdjustment(
  req: BodyRequest<StockAdjustmentBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.sub ?? 0;
    const movement = await createStockAdjustment(req.body, userId);
    res.status(201).json({ pergerakan_stok: movement });
  } catch (error) {
    next(error);
  }
}

export async function indexMovements(
  req: QueryRequest<ListStockMovementQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listStockMovements(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function summary(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getStockSummary();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function restockList(
  req: QueryRequest<ListRestockQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getRestockList(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
