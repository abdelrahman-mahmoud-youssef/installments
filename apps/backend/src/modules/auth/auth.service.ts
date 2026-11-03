import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import {
  APP_NAME,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  SUBSCRIPTION_MONTHLY_PRICE,
  SUBSCRIPTION_PAYMENT_ADDRESS,
  SUBSCRIPTION_PAYMENT_PHONE,
} from '../../common/constants';
import { decrypt, encrypt } from '../../common/crypto';
import { getUtcToday } from '../../common/date/utc-date';
import { getFrontendOrigin } from '../../common/frontend-url';
import {
  calculateFailedLoginState,
  formatLockoutMessage,
  secondsUntilUnlock,
} from '../../common/login-lockout';
import { hashPassword, verifyPassword } from '../../common/password';
import { slugify } from '../../common/slugify';
import {
  calculateTrialExpiry,
  SubscriptionSummary,
  summarizeSubscription,
} from '../../common/subscription/subscription';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { buildPasswordChangedEmail } from '../mail/templates/password-changed-email';
import { buildPasswordResetEmail } from '../mail/templates/password-reset-email';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { EnableTwoFactorDto } from './dto/enable-two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

export interface CurrentUserTenant {
  slug: string;
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
}

export interface CurrentUserSubscription extends SubscriptionSummary {
  monthlyPrice: number;
  paymentAddress: string;
  paymentPhone: string;
}

export interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: User['role'];
  twoFactorEnabled: boolean;
  tenant: CurrentUserTenant;
  subscription: CurrentUserSubscription;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async getCurrentUser(user: {
    userId: string;
    name: string;
    email: string;
    tenantId: string;
    role: User['role'];
  }): Promise<CurrentUserResponse> {
    const { twoFactorEnabled, tenant } = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: {
        twoFactorEnabled: true,
        tenant: {
          select: {
            slug: true,
            name: true,
            displayName: true,
            brandColor: true,
            logoUrl: true,
            subscriptionExpiresOn: true,
            _count: { select: { subscriptions: true } },
          },
        },
      },
    });
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      twoFactorEnabled,
      tenant: {
        slug: tenant.slug,
        displayName: tenant.displayName ?? tenant.name,
        brandColor: tenant.brandColor,
        logoUrl: tenant.logoUrl,
      },
      subscription: {
        ...summarizeSubscription(
          { expiresOn: tenant.subscriptionExpiresOn, hasPaidPeriod: tenant._count.subscriptions > 0 },
          getUtcToday(),
        ),
        monthlyPrice: SUBSCRIPTION_MONTHLY_PRICE,
        paymentAddress: SUBSCRIPTION_PAYMENT_ADDRESS,
        paymentPhone: SUBSCRIPTION_PAYMENT_PHONE,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const secondsRemaining = secondsUntilUnlock(user.lockedUntil, new Date());
    if (secondsRemaining > 0) {
      throw new HttpException(formatLockoutMessage(secondsRemaining), HttpStatus.TOO_MANY_REQUESTS);
    }

    const isPasswordValid = await verifyPassword(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.registerFailedLogin(user);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
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
        tenant: {
          create: {
            name: registerDto.businessName,
            slug,
            subscriptionExpiresOn: calculateTrialExpiry(getUtcToday()),
          },
        },
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return;
    }

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashResetToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    });

    const email = buildPasswordResetEmail({
      name: user.name,
      resetUrl: `${getFrontendOrigin(this.config)}/reset-password?token=${rawToken}`,
      logoUrl: this.logoUrl(),
      appName: APP_NAME,
      expiryMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
    });
    await this.sendEmailQuietly(user.email, email);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<LoginSuccess> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashResetToken(dto.token) },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    const [, , user] = await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
    ]);

    const email = buildPasswordChangedEmail({ name: user.name, logoUrl: this.logoUrl(), appName: APP_NAME });
    await this.sendEmailQuietly(user.email, email);

    return this.issueToken(user);
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

  private async registerFailedLogin(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: calculateFailedLoginState(user.failedLoginAttempts, new Date()),
    });
  }

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private logoUrl(): string {
    return `${getFrontendOrigin(this.config)}/qistak-512.png`;
  }

  private async sendEmailQuietly(to: string, email: { subject: string; html: string }): Promise<void> {
    try {
      await this.mail.sendEmail({ to, subject: email.subject, html: email.html });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
