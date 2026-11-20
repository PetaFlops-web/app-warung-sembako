import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodObject, type ZodRawShape } from "zod";
import { ERROR_CODE } from "../expectation/index.ts";

export const validate =
  <T extends ZodRawShape>(schema: ZodObject<T>) =>
  (req: Request<unknown, unknown, unknown, unknown>, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: Record<string, unknown>; params?: Record<string, unknown> };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        Object.assign(req.query as Record<string, unknown>, parsed.query);
      }
      if (parsed.params !== undefined) {
        Object.assign(req.params as Record<string, unknown>, parsed.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.reduce(
          (acc, issue) => {
            const key = issue.path.slice(1).join(".");
            acc[key] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        );
        res.status(400).json({
          status: "error",
          kode: ERROR_CODE.BAD_REQUEST,
          kesalahan: Object.entries(formattedErrors).map(([field, message]) => ({ [field]: message })),
        });
        return;
      }
      next(error);
    }
  };
