export const ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE] | (string & {});

export class ClientError extends Error {
  readonly statusCode: number;
  readonly kode: ErrorCode;
  readonly details?: unknown;

  constructor(message: string, statusCode = 400, kode: ErrorCode = ERROR_CODE.BAD_REQUEST, details?: unknown) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
    this.kode = kode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
