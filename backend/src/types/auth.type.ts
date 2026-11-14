export interface  UserRegisterResponse {
  name: string;
  email: string;
  role: string;
}

export interface UserLoginResponse {

}

export interface JwtPayload {
  id: number
  name: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}