export interface  UserRegisterResponse {
  name: string;
  email: string;
  role: string;
}

export interface UserLoginResponse {
  id_pengguna: number;
  token_akses: string;
  token_penyegaran: string;
}

export interface TokenPairResponse {
  token_akses: string;
  token_penyegaran: string;
}

export interface JwtPayload {
  sub: number
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
