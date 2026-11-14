import { ClientError } from './client-error.ts';

export class NotFoundError extends ClientError {
  constructor(message = 'Resource tidak ditemukan') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}
