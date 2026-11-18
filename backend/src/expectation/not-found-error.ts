import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class NotFoundError extends ClientError {
  constructor(message = 'Resource tidak ditemukan', kode: ErrorCode = ERROR_CODE.NOT_FOUND) {
    super(message, 404, kode);
    this.name = 'NotFoundError';
  }
}
