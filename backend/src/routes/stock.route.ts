import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware.ts';
import { requireAuth, requireOwner } from '../middlewares/auth.middleware.ts';
import {
  createStockMovementSchema,
  stockAdjustmentSchema,
  listStockMovementQuerySchema,
  listRestockQuerySchema,
} from '../schemas/stock.schema.ts';
import {
  storeMovement,
  storeAdjustment,
  indexMovements,
  summary,
  restockList,
} from '../controllers/stock.controller.ts';

export const stockRouter = Router();

stockRouter.post('/stock-movements', requireAuth, validate(createStockMovementSchema), storeMovement);
stockRouter.post('/stock-adjustments', requireAuth, requireOwner, validate(stockAdjustmentSchema), storeAdjustment);
stockRouter.get('/stock-movements', requireAuth, validate(listStockMovementQuerySchema), indexMovements);
stockRouter.get('/stock/summary', requireAuth, summary);
stockRouter.get('/restock-list', requireAuth, validate(listRestockQuerySchema), restockList);
