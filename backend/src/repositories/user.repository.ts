import { prisma } from '../config/prisma.ts';

export const userRepository = {
  findById: (id: number) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
};
