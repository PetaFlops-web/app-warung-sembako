export interface  UserResponse {
  name: string;
  email: string;
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