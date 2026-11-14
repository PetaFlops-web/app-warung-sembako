import { ClientError } from './client-error.ts';

export class ForbiddenError extends ClientError {
  constructor(message = 'Akses ditolak') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export { ForbiddenError as AuthorizationError };
