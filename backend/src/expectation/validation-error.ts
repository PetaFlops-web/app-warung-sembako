import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class ValidationError extends ClientError {
  constructor(message = 'Validasi data gagal', kode: ErrorCode = ERROR_CODE.BAD_REQUEST, details?: unknown) {
    super(message, 400, kode, details);
    this.name = 'ValidationError';
  }
}

export { ValidationError as UnprocessableEntityError };
