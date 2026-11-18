import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class ForbiddenError extends ClientError {
  constructor(message = 'Akses ditolak', kode: ErrorCode = ERROR_CODE.FORBIDDEN) {
    super(message, 403, kode);
    this.name = 'ForbiddenError';
  }
}

export { ForbiddenError as AuthorizationError };
