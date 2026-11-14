import { ClientError } from './client-error.ts';

export class ValidationError extends ClientError {
  constructor(message = 'Validasi data gagal', details?: unknown) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export { ValidationError as UnprocessableEntityError };
