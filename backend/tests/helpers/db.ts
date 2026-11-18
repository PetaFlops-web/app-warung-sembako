import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma.ts';
import TokenManager from '../../src/utils/token-manager.ts';

const OWNER_EMAIL = 'uji-owner@example.com';
const KEEPER_EMAIL = 'uji-keeper@example.com';
const FIXTURE_PREFIX = 'UJI-';

export { prisma };

export interface Fixtures {
  ownerId: number;
  keeperId: number;
}

export async function setupFixtures(): Promise<Fixtures> {
  await cleanupFixtures();

  const password = await bcrypt.hash('rahasia123', 10);

  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { role: 'OWNER' },
    create: { name: 'Uji Owner', email: OWNER_EMAIL, password, role: 'OWNER' },
  });

  const keeper = await prisma.user.upsert({
    where: { email: KEEPER_EMAIL },
    update: { role: 'KEEPER' },
    create: { name: 'Uji Keeper', email: KEEPER_EMAIL, password, role: 'KEEPER' },
  });

  return { ownerId: owner.id, keeperId: keeper.id };
}

export function authHeader(role: 'OWNER' | 'KEEPER', userId: number): string {
  return `Bearer ${TokenManager.generateAccessToken({ sub: userId, role })}`;
}

export function productName(nama: string): string {
  return `${FIXTURE_PREFIX}${nama}`;
}

export function categoryName(nama: string): string {
  return `${FIXTURE_PREFIX}${nama}`;
}

export async function cleanupFixtures(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { in: [OWNER_EMAIL, KEEPER_EMAIL] } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  const products = await prisma.product.findMany({
    where: {
      OR: [{ name: { startsWith: FIXTURE_PREFIX } }, { createdById: { in: userIds } }],
    },
    select: { id: true },
  });
  const productIds = products.map((product) => product.id);

  await prisma.stockMovement.deleteMany({
    where: { OR: [{ productId: { in: productIds } }, { userId: { in: userIds } }] },
  });
  await prisma.restockItem.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: FIXTURE_PREFIX } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.aIUsageHistory.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
