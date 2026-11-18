import { ERROR_CODE, type ErrorCode } from './client-error.ts';

export class InternalServerError extends Error {
  readonly statusCode: number = 500;
  readonly kode: ErrorCode;

  constructor(message = 'Terjadi kesalahan pada server', kode: ErrorCode = ERROR_CODE.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = 'InternalServerError';
    this.kode = kode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
