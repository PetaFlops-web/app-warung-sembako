import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware.js';
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';
import { index, store, update } from '../controllers/category.controller.js';
import { requireAuth, requireOwner } from '../middlewares/auth.middleware.js';

export const categoryRouter = Router();

categoryRouter.get('/categories', requireAuth, index);
categoryRouter.post('/categories', requireAuth, requireOwner, validate(createCategorySchema), store);
categoryRouter.patch('/categories/:id', requireAuth, requireOwner, validate(categoryIdParamSchema), validate(updateCategorySchema), update);
