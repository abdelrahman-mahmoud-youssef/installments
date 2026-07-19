import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { slugify } from '../../common/slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt-payload.interface';

export interface LoginResult {
  accessToken: string;
}

const PASSWORD_HASH_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueToken(user.id, user.tenantId);
  }

  async register(registerDto: RegisterDto): Promise<LoginResult> {
    const passwordHash = await bcrypt.hash(registerDto.password, PASSWORD_HASH_ROUNDS);
    const slug = await this.generateUniqueSlug(registerDto.businessName);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        tenant: { create: { name: registerDto.businessName, slug } },
      },
    });

    return this.issueToken(user.id, user.tenantId);
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

  private async issueToken(userId: string, tenantId: string): Promise<LoginResult> {
    const payload: JwtPayload = { sub: userId, tenantId };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
