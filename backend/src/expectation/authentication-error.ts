import { ClientError, ERROR_CODE, type ErrorCode } from './client-error.ts';

export class AuthenticationError extends ClientError {
  constructor(message = 'Autentikasi gagal', kode: ErrorCode = ERROR_CODE.UNAUTHORIZED) {
    super(message, 401, kode);
    this.name = 'AuthenticationError';
  }
}

export { AuthenticationError as UnauthorizedError };
