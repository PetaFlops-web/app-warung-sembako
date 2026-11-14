import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodObject, type ZodRawShape } from 'zod';

export const validate = <T extends ZodRawShape>(schema: ZodObject<T>) => 
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.reduce((acc, issue) => {
          const key = issue.path.slice(1).join('.'); 
          acc[key] = issue.message;
          return acc;
        }, {} as Record<string, string>);
        res.status(400).json({
          status: 'error',
          errors: formattedErrors
        });
        return;
      }
      next(error);
    }
  };