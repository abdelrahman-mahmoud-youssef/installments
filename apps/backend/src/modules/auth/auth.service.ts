import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { decrypt, encrypt } from '../../common/crypto';
import { hashPassword, verifyPassword } from '../../common/password';
import { slugify } from '../../common/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { EnableTwoFactorDto } from './dto/enable-two-factor.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { JwtPayload, TwoFactorChallengePayload } from './jwt-payload.interface';
import {
  buildOtpauthUrl,
  generateBackupCodes,
  generateTotpSecret,
  verifyTotpCode,
} from './two-factor';

const TWO_FACTOR_ISSUER = 'Installments';
const TWO_FACTOR_CHALLENGE_EXPIRY = '5m';

export interface LoginSuccess {
  accessToken: string;
}

export interface LoginRequiresTwoFactor {
  requiresTwoFactor: true;
  challengeToken: string;
}

export type LoginResult = LoginSuccess | LoginRequiresTwoFactor;

export interface SetupTwoFactorResult {
  secret: string;
  otpauthUrl: string;
}

export interface EnableTwoFactorResult {
  backupCodes: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async getCurrentUser(user: {
    userId: string;
    name: string;
    email: string;
    tenantId: string;
    role: User['role'];
  }): Promise<{
    id: string;
    name: string;
    email: string;
    tenantId: string;
    role: User['role'];
    twoFactorEnabled: boolean;
  }> {
    const { twoFactorEnabled } = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { twoFactorEnabled: true },
    });
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      twoFactorEnabled,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await verifyPassword(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    if (user.twoFactorEnabled) {
      const payload: TwoFactorChallengePayload = { sub: user.id, purpose: 'two_factor_challenge' };
      const challengeToken = await this.jwtService.signAsync(payload, {
        expiresIn: TWO_FACTOR_CHALLENGE_EXPIRY,
      });
      return { requiresTwoFactor: true, challengeToken };
    }

    return this.issueToken(user);
  }

  async verifyTwoFactorChallenge(dto: VerifyTwoFactorDto): Promise<LoginSuccess> {
    let payload: TwoFactorChallengePayload;
    try {
      payload = await this.jwtService.verifyAsync<TwoFactorChallengePayload>(dto.challengeToken);
    } catch {
      throw new UnauthorizedException('This login attempt has expired. Please sign in again.');
    }
    if (payload.purpose !== 'two_factor_challenge') {
      throw new UnauthorizedException('Invalid token.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid token.');
    }

    const resolution = await this.resolveTwoFactorCode(user, dto.code);
    if (!resolution.valid) {
      throw new BadRequestException('Invalid or expired code.');
    }

    return this.issueToken(user);
  }

  async register(registerDto: RegisterDto): Promise<LoginResult> {
    const passwordHash = await hashPassword(registerDto.password);
    const slug = await this.generateUniqueSlug(registerDto.businessName);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        passwordHash,
        tenant: { create: { name: registerDto.businessName, slug } },
      },
    });

    return this.issueToken(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const isCurrentPasswordValid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async setupTwoFactor(userId: string, email: string): Promise<SetupTwoFactorResult> {
    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encrypt(secret, this.twoFactorEncryptionKey()) },
    });
    return { secret, otpauthUrl: buildOtpauthUrl(secret, email, TWO_FACTOR_ISSUER) };
  }

  async enableTwoFactor(userId: string, dto: EnableTwoFactorDto): Promise<EnableTwoFactorResult> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Start setup before confirming a code.');
    }

    const secret = decrypt(user.twoFactorSecret, this.twoFactorEncryptionKey());
    if (!verifyTotpCode(secret, dto.code)) {
      throw new BadRequestException('Invalid code. Please try again.');
    }

    const backupCodes = generateBackupCodes();
    const backupCodeHashes = await Promise.all(backupCodes.map((code) => hashPassword(code)));
    await this.prisma.$transaction([
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
      this.prisma.twoFactorBackupCode.createMany({
        data: backupCodeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
      this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } }),
    ]);

    return { backupCodes };
  }

  async disableTwoFactor(userId: string, dto: DisableTwoFactorDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled.');
    }

    const resolution = await this.resolveTwoFactorCode(user, dto.code);
    if (!resolution.valid) {
      throw new BadRequestException('Invalid or expired code.');
    }

    await this.prisma.$transaction([
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      }),
    ]);
  }

  private async resolveTwoFactorCode(user: User, code: string): Promise<{ valid: boolean }> {
    if (user.twoFactorSecret) {
      const secret = decrypt(user.twoFactorSecret, this.twoFactorEncryptionKey());
      if (verifyTotpCode(secret, code)) {
        return { valid: true };
      }
    }

    const normalizedCode = code.trim().toUpperCase();
    const backupCodes = await this.prisma.twoFactorBackupCode.findMany({
      where: { userId: user.id, usedAt: null },
    });
    const matches = await Promise.all(
      backupCodes.map((backupCode) => verifyPassword(normalizedCode, backupCode.codeHash)),
    );
    const matchIndex = matches.indexOf(true);
    if (matchIndex === -1) {
      return { valid: false };
    }

    await this.prisma.twoFactorBackupCode.update({
      where: { id: backupCodes[matchIndex].id },
      data: { usedAt: new Date() },
    });
    return { valid: true };
  }

  private twoFactorEncryptionKey(): string {
    return this.config.getOrThrow<string>('TWO_FACTOR_ENCRYPTION_KEY');
  }

  private async generateUniqueSlug(businessName: string): Promise<string> {
    const base = slugify(businessName);
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  private async issueToken(user: User): Promise<LoginSuccess> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
