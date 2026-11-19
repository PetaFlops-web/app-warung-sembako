import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/env.ts';
import type { JwtPayload } from '../types/auth.type.ts';

const { accessTokenKey, refreshTokenKey, accessTokenAge, refreshTokenAge } = config.jwt;

const ALGORITHM = 'HS256';

const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

const TokenManager = {

  generateAccessToken: (payload: JwtPayload) =>
    jwt.sign({ ...payload, typ: ACCESS_TOKEN_TYPE }, accessTokenKey, {
      expiresIn: accessTokenAge,
      algorithm: ALGORITHM,
    }),

  generateRefreshToken: (payload: JwtPayload) =>
    jwt.sign({ ...payload, typ: REFRESH_TOKEN_TYPE, jti: randomUUID() }, refreshTokenKey, {
      expiresIn: refreshTokenAge,
      algorithm: ALGORITHM,
    }),

  verifyAccessToken: (token: string) =>
    jwt.verify(token, accessTokenKey, { algorithms: [ALGORITHM] }),

  verifyRefreshToken: (token: string) =>
    jwt.verify(token, refreshTokenKey, { algorithms: [ALGORITHM] }),
};

export { ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE };

export default TokenManager;
