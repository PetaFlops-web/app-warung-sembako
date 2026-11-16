export interface UserRegisterResponse {
  username: string;
  email: string;
  role: string;
}

export interface UserLoginResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
