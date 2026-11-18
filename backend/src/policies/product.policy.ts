import { ForbiddenError } from '../expectation/index.ts';
import type { ListProductQuery } from '../types/product.type.ts';

export function isOwner(role: string | undefined): boolean {
  return role === 'OWNER';
}

export function resolveAktifFilter(query: ListProductQuery, requesterRole: string): string {
  const aktif = query.aktif ?? 'true';

  if ((aktif === 'false' || aktif === 'all') && !isOwner(requesterRole)) {
    throw new ForbiddenError('Hanya Pemilik Warung yang dapat melihat produk nonaktif');
  }

  return aktif;
}
