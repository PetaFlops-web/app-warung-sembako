export class InternalServerError extends Error {
  readonly statusCode: number = 500;

  constructor(message = 'Terjadi kesalahan pada server') {
    super(message);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
