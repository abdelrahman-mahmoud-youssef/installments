import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: Role;
  email: string;
  name: string;
}

export interface TwoFactorChallengePayload {
  sub: string;
  purpose: 'two_factor_challenge';
}
