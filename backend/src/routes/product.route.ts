import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware.js';
import { createProductSchema, listProductQuerySchema, productIdParamSchema, updateProductSchema } from '../schemas/product.schema.js';
import { destroy, index, show, store, update } from '../controllers/product.controller.js';
import { requireAuth, requireOwner } from '../middlewares/auth.middleware.js';

export const productRouter = Router();

productRouter.get('/products', requireAuth, validate(listProductQuerySchema), index);
productRouter.post('/products', requireAuth, requireOwner, validate(createProductSchema), store);
productRouter.get('/products/:id', requireAuth, validate(productIdParamSchema), show);
productRouter.patch('/products/:id', requireAuth, requireOwner, validate(productIdParamSchema), validate(updateProductSchema), update);
productRouter.delete('/products/:id', requireAuth, requireOwner, validate(productIdParamSchema), destroy);
