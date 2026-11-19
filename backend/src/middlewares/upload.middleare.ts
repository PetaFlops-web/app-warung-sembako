import multer from 'multer';
import type { FileFilterCallback } from 'multer'; 
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ERROR_CODE, ValidationError } from '../expectation/index.ts';

const uploadDir = path.resolve(process.cwd(), 'src/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimes = ['image/jpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Format file tidak didukung. Hanya JPEG dan PNG yang diperbolehkan.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

const multerFields = upload.fields([
  { name: 'gambar', maxCount: 1 },
  { name: 'gambar_produk', maxCount: 1 },
]);

export function uploadProductImage(req: Request, res: Response, next: NextFunction): void {
  multerFields(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(
            new ValidationError('Ukuran gambar maksimal 5 MB', ERROR_CODE.BAD_REQUEST, {
              gambar: 'Ukuran gambar maksimal 5 MB',
            }),
          );
          return;
        }
        next(
          new ValidationError(err.message, ERROR_CODE.BAD_REQUEST, {
            gambar: err.message,
          }),
        );
        return;
      }
      if (err instanceof Error) {
        next(
          new ValidationError(err.message, ERROR_CODE.BAD_REQUEST, {
            gambar: err.message,
          }),
        );
        return;
      }
      next(err);
      return;
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.['gambar']?.[0] ?? files?.['gambar_produk']?.[0];
    if (file) {
      req.file = file;
    }

    next();
  });
}

export default uploadProductImage;
