import { Prisma, Role, WalletAccess } from '@prisma/client';

export interface WalletViewer {
  userId: string;
  tenantId: string;
  role: Role;
  walletAccess: WalletAccess;
}

export function resolveEffectiveWalletAccess(viewer: Pick<WalletViewer, 'role' | 'walletAccess'>): WalletAccess {
  return viewer.role === Role.ADMIN ? WalletAccess.ALL : viewer.walletAccess;
}

export function canViewWallets(viewer: Pick<WalletViewer, 'role' | 'walletAccess'>): boolean {
  return resolveEffectiveWalletAccess(viewer) !== WalletAccess.NONE;
}

export function buildViewablePaymentMethodWhere(viewer: WalletViewer): Prisma.PaymentMethodWhereInput {
  const access = resolveEffectiveWalletAccess(viewer);
  if (access === WalletAccess.ALL) {
    return { tenantId: viewer.tenantId };
  }
  if (access === WalletAccess.SELECTED) {
    return { tenantId: viewer.tenantId, staffGrants: { some: { userId: viewer.userId } } };
  }
  return { tenantId: viewer.tenantId, id: { in: [] } };
}
