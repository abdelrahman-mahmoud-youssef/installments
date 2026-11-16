import { Prisma } from '@prisma/client';
import { DemoHistory } from './build-demo-history';
import { DemoShopProfile } from './demo-types';
import { RandomSource } from './random';

export interface DemoShopContext {
  transaction: Prisma.TransactionClient;
  profile: DemoShopProfile;
  today: Date;
  random: RandomSource;
  tenantId: string;
  tenantCreatedAt: Date;
  staffIds: string[];
  customerIds: string[];
  walletIds: string[];
  activeWalletIds: string[];
  history: DemoHistory;
}
