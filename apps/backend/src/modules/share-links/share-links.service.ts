import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_CODE_ATTEMPTS = 5;

export interface ResolvedShareLink {
  tenantSlug: string;
  targetPath: string;
}

function generateCode(): string {
  return randomBytes(6).toString('base64url');
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class ShareLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(tenantId: string, targetPath: string): Promise<{ code: string }> {
    const existing = await this.prisma.shareLink.findUnique({
      where: { tenantId_targetPath: { tenantId, targetPath } },
    });
    if (existing) {
      return { code: existing.code };
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      try {
        const created = await this.prisma.shareLink.create({
          data: { tenantId, targetPath, code: generateCode() },
        });
        return { code: created.code };
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
        const target = (error.meta?.target as string[] | undefined) ?? [];
        if (target.includes('tenantId') || target.includes('targetPath')) {
          const winner = await this.prisma.shareLink.findUniqueOrThrow({
            where: { tenantId_targetPath: { tenantId, targetPath } },
          });
          return { code: winner.code };
        }
        // Otherwise it was a `code` collision — retry with a fresh one.
      }
    }
    throw new Error('Could not generate a unique share link code.');
  }

  async resolve(code: string): Promise<ResolvedShareLink | null> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { code },
      select: { targetPath: true, tenant: { select: { slug: true } } },
    });
    if (!shareLink) {
      return null;
    }
    return { tenantSlug: shareLink.tenant.slug, targetPath: shareLink.targetPath };
  }
}
