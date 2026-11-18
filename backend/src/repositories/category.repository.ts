import { prisma } from '../config/prisma.ts';

export const categoryRepository = {
  findById: (id: string) => prisma.category.findUnique({ where: { id } }),
};
