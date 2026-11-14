import type { registerUserInput, loginUserInput } from '../schemas/user.schema.ts';
import { ConflictError, AuthenticationError } from '../expectation/index.ts';
import type { UserRegisterResponse, UserLoginResponse } from '../types/auth.type.ts';
import TokenManager from '../utils/token-manager.ts';
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

  const token = TokenManager.generateAccessToken({
    user_id: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user_id: user.id,
    accessToken: token,
  };
}