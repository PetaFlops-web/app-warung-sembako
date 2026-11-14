import jwt from 'jsonwebtoken';
import config from '../config/env.ts';

const { accessTokenKey, refreshTokenKey, accessTokenAge } = config.jwt;

const TokenManager = {
  generateAccessToken: (payload: jwt.JwtPayload) =>
    jwt.sign(payload, accessTokenKey as string, {
      expiresIn: accessTokenAge,
    }),

  generateRefreshToken: (payload: jwt.JwtPayload) =>
    jwt.sign(payload, refreshTokenKey as string, {
      expiresIn: '7d',
    }),

  verifyAccessToken: (token: string) => jwt.verify(token, accessTokenKey as string  ),

  verifyRefreshToken: (token: string) => jwt.verify(token, refreshTokenKey as string),
};

export default TokenManager;