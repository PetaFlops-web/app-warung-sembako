import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class ConflictError extends ClientError {
  constructor(message = 'Data sudah ada atau terjadi konflik', kode: ErrorCode = ERROR_CODE.DUPLICATE) {
    super(message, 409, kode);
    this.name = 'ConflictError';
  }
}
