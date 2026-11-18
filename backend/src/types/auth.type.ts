export interface  UserRegisterResponse {
  nama: string;
  email: string;
  peran: string;
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

export type RefreshTokenOwner = {
  id: number;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
