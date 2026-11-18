import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class InvariantError extends ClientError {
  constructor(message = 'Permintaan tidak valid', kode: ErrorCode = ERROR_CODE.BAD_REQUEST, details?: unknown) {
    super(message, 400, kode, details);
    this.name = 'InvariantError';
  }
}

export { InvariantError as BadRequestError };
