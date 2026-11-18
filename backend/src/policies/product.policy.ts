import { ForbiddenError } from '../expectation/index.ts';
import type { ListProductQuery } from '../types/product.type.ts';

export const DEACTIVATED_VISIBILITY_MESSAGE = 'Hanya Pemilik Warung yang dapat melihat produk nonaktif';

export function isOwner(role: string | undefined): boolean {
  return role === 'OWNER';
}

export function resolveAktifFilter(query: ListProductQuery, requesterRole: string): string {
  const aktif = query.aktif ?? 'true';

  if ((aktif === 'false' || aktif === 'all') && !isOwner(requesterRole)) {
    throw new ForbiddenError(DEACTIVATED_VISIBILITY_MESSAGE);
  }

  return aktif;
}
