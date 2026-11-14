import { ClientError } from './client-error.ts';

export class AuthenticationError extends ClientError {
  constructor(message = 'Autentikasi gagal') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export { AuthenticationError as UnauthorizedError };
