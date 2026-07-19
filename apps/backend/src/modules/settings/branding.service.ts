import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MAX_LOGO_UPLOAD_BYTES } from '../../common/constants';
import { TenantBranding, toTenantBranding } from '../../common/tenant-branding';
import { PrismaService } from '../../prisma/prisma.service';
import { detectImageExtension } from '../storage/image-signature';
import { StorageService } from '../storage/storage.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UploadLogoDto } from './dto/upload-logo.dto';

const SLUG_TAKEN_ERROR = 'This link is already taken. Try a different one.';

export type { TenantBranding };

@Injectable()
export class BrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getBranding(tenantId: string): Promise<TenantBranding> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return toTenantBranding(tenant);
  }

  async updateBranding(tenantId: string, dto: UpdateBrandingDto): Promise<TenantBranding> {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          displayName: dto.displayName,
          slug: dto.slug,
          brandColor: dto.brandColor,
          showPublicPricing: dto.showPublicPricing,
          phone: dto.phone,
          about: dto.about,
          instagramUrl: dto.instagramUrl,
          facebookUrl: dto.facebookUrl,
          tiktokUrl: dto.tiktokUrl,
          showInstallmentCalculator: dto.showInstallmentCalculator,
          ...(dto.calculatorPlans && {
            calculatorPlans: dto.calculatorPlans as unknown as Prisma.InputJsonValue,
          }),
        },
      });
      return toTenantBranding(tenant);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(SLUG_TAKEN_ERROR);
      }
      throw error;
    }
  }

  async uploadLogo(tenantId: string, dto: UploadLogoDto): Promise<TenantBranding> {
    const buffer = Buffer.from(dto.image, 'base64');
    if (buffer.byteLength > MAX_LOGO_UPLOAD_BYTES) {
      throw new BadRequestException('Logo is too large. The maximum size is 2 MB.');
    }

    const extension = detectImageExtension(buffer);
    if (!extension) {
      throw new BadRequestException('Logo must be a PNG or JPEG image.');
    }

    const logoUrl = await this.storage.saveLogo(tenantId, buffer, extension);
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl } });
    return toTenantBranding(tenant);
  }

  async removeLogo(tenantId: string): Promise<TenantBranding> {
    await this.storage.deleteLogo(tenantId);
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl: null } });
    return toTenantBranding(tenant);
  }
}
