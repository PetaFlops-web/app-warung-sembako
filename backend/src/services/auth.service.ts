import type { registerUserInput, loginUserInput } from '../schemas/user.schema.ts';
import { ConflictError, AuthenticationError } from '../expectation/index.ts';
import type { UserRegisterResponse, UserLoginResponse, TokenPairResponse } from '../types/auth.type.ts';
import { createSession, rotateRefreshToken, revokeRefreshToken } from './refresh-token.service.ts';
import { prisma } from '../config/prisma.ts';
import bcrypt from 'bcryptjs';

export async function registerUser(input: registerUserInput): Promise<UserRegisterResponse> {
  const { name, email, password, role } = input;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email sudah digunakan');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  const newUser = {
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return newUser;
}

export async function loginUser(input: loginUserInput): Promise<UserLoginResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthenticationError('Email tidak ditemukan');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Kata sandi salah');
  }

  const session = await createSession({ id: user.id, role: user.role });

  return {
    id_pengguna: user.id,
    token_akses: session.tokenAkses,
    token_penyegaran: session.tokenPenyegaran,
  };
}

export async function refreshSession(tokenPenyegaran: string): Promise<TokenPairResponse> {
  return rotateRefreshToken(tokenPenyegaran);
}

export async function logoutSession(tokenPenyegaran: string): Promise<void> {
  await revokeRefreshToken(tokenPenyegaran);
}
