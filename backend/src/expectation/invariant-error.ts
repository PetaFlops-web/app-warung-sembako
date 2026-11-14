import { ClientError } from './client-error.ts';

export class InvariantError extends ClientError {
  constructor(message = 'Permintaan tidak valid', details?: unknown) {
    super(message, 400, details);
    this.name = 'InvariantError';
  }
}

export { InvariantError as BadRequestError };
