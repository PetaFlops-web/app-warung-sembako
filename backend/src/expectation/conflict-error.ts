import { ClientError } from './client-error.ts';

export class ConflictError extends ClientError {
  constructor(message = 'Data sudah ada atau terjadi konflik') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
