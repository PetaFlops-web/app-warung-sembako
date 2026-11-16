import type { registerUserInput, loginUserInput } from '../schemas/user.schema.ts';
import { ConflictError, AuthenticationError } from '../expectation/index.ts';
import type { UserRegisterResponse, UserLoginResponse } from '../types/auth.type.ts';
import TokenManager from '../utils/token-manager.ts';
import { prisma } from '../config/prisma.ts';
import bcrypt from 'bcryptjs';

export async function registerUser(input: registerUserInput): Promise<UserRegisterResponse> {
  const { username, email, password, role } = input;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email sudah digunakan');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, role },
  });

  return {
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export async function loginUser(input: loginUserInput): Promise<UserLoginResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthenticationError('Email atau kata sandi salah');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Email atau kata sandi salah');
  }

  const payload = { sub: user.id, role: user.role };
  const accessToken = TokenManager.generateAccessToken(payload);
  const refreshToken = TokenManager.generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user_id: user.id,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}
