import type { CreateUserInput} from '../schemas/user.schema.ts';
import { ConflictError } from '../expectation/index.ts';
import type { UserResponse } from '../types/auth.type.ts';
import { prisma } from '../config/prisma.ts';
import bcrypt from 'bcryptjs';

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
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