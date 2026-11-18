import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.ts';
import { AuthenticationError } from '../expectation/index.ts';
import TokenManager, { REFRESH_TOKEN_TYPE } from '../utils/token-manager.ts';
import type { JwtPayload, TokenPairResponse, RefreshTokenOwner } from '../types/auth.type.ts';

const INVALID_REFRESH_TOKEN_MESSAGE = 'Token penyegaran tidak valid atau sudah kedaluwarsa';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function expiryDateFromToken(token: string): Date {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  return new Date(decoded.exp * 1000);
}

function decodeRefreshToken(token: string): JwtPayload {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = TokenManager.verifyRefreshToken(token);
  } catch {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  if (typeof decoded === 'string') {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const payload = decoded as Record<string, unknown>;
  const sub = payload['sub'];
  const role = payload['role'];

  if (typeof sub !== 'number' || typeof role !== 'string' || payload['typ'] !== REFRESH_TOKEN_TYPE) {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  return { sub, role };
}

function generateTokenPair(owner: RefreshTokenOwner): { tokenAkses: string; tokenPenyegaran: string } {
  return {
    tokenAkses: TokenManager.generateAccessToken({ sub: owner.id, role: owner.role }),
    tokenPenyegaran: TokenManager.generateRefreshToken({ sub: owner.id, role: owner.role }),
  };
}

export async function issueRefreshToken(token: string, owner: RefreshTokenOwner): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: owner.id,
      expiresAt: expiryDateFromToken(token),
    },
  });
}

export async function createSession(owner: RefreshTokenOwner): Promise<{ tokenAkses: string; tokenPenyegaran: string }> {
  const tokens = generateTokenPair(owner);
  await issueRefreshToken(tokens.tokenPenyegaran, owner);

  return tokens;
}

export async function rotateRefreshToken(rawToken: string): Promise<TokenPairResponse> {
  const payload = decodeRefreshToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!stored || stored.revokedAt !== null || stored.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || user.id !== stored.userId) {
    throw new AuthenticationError(INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const tokens = generateTokenPair({ id: user.id, role: user.role });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(tokens.tokenPenyegaran),
        userId: user.id,
        expiresAt: expiryDateFromToken(tokens.tokenPenyegaran),
      },
    }),
  ]);

  return {
    token_akses: tokens.tokenAkses,
    token_penyegaran: tokens.tokenPenyegaran,
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  decodeRefreshToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
