import { BadRequestException, Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { MAX_LOGO_UPLOAD_BYTES } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { detectImageExtension } from '../storage/image-signature';
import { StorageService } from '../storage/storage.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UploadLogoDto } from './dto/upload-logo.dto';

export interface TenantBranding {
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
}

function toBranding(tenant: Tenant): TenantBranding {
  return {
    displayName: tenant.displayName ?? tenant.name,
    brandColor: tenant.brandColor,
    logoUrl: tenant.logoUrl,
  };
}

@Injectable()
export class BrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getBranding(tenantId: string): Promise<TenantBranding> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    return toBranding(tenant);
  }

  async updateBranding(tenantId: string, dto: UpdateBrandingDto): Promise<TenantBranding> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { displayName: dto.displayName, brandColor: dto.brandColor },
    });
    return toBranding(tenant);
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
    return toBranding(tenant);
  }

  async removeLogo(tenantId: string): Promise<TenantBranding> {
    await this.storage.deleteLogo(tenantId);
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl: null } });
    return toBranding(tenant);
  }
}
