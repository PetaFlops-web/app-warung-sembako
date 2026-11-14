export interface UserResponse {
  name: string;
  email: string;
  createdAt: Date;
}

export interface JwtPayload {
  id: number
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}