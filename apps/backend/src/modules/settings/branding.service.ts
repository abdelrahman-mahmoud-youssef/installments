import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { MAX_ABOUT_IMAGE_UPLOAD_BYTES, MAX_LOGO_UPLOAD_BYTES } from '../../common/constants';
import { sanitizeRichText } from '../../common/sanitize-html';
import { TenantBranding, toTenantBranding } from '../../common/tenant-branding';
import { PrismaService } from '../../prisma/prisma.service';
import { detectImageExtension, ImageExtension } from '../storage/image-signature';
import { StorageService } from '../storage/storage.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UploadAboutImageDto } from './dto/upload-about-image.dto';
import { UploadLogoDto } from './dto/upload-logo.dto';

const SLUG_TAKEN_ERROR = 'This link is already taken. Try a different one.';
const LOGO_MAX_DIMENSION = 512;
const ABOUT_IMAGE_MAX_WIDTH = 1600;

function resizeLogo(buffer: Buffer, extension: ImageExtension): Promise<Buffer> {
  const pipeline = sharp(buffer).resize(LOGO_MAX_DIMENSION, LOGO_MAX_DIMENSION, {
    fit: 'inside',
    withoutEnlargement: true,
  });
  return extension === 'png' ? pipeline.png().toBuffer() : pipeline.jpeg().toBuffer();
}

function resizeAboutImage(buffer: Buffer, extension: ImageExtension): Promise<Buffer> {
  const pipeline = sharp(buffer).resize(ABOUT_IMAGE_MAX_WIDTH, undefined, {
    fit: 'inside',
    withoutEnlargement: true,
  });
  return extension === 'png' ? pipeline.png().toBuffer() : pipeline.jpeg().toBuffer();
}

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
          about: dto.about === undefined ? undefined : sanitizeRichText(dto.about),
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
    const rawBuffer = Buffer.from(dto.image, 'base64');
    if (rawBuffer.byteLength > MAX_LOGO_UPLOAD_BYTES) {
      throw new BadRequestException('Logo is too large. The maximum size is 2 MB.');
    }

    const extension = detectImageExtension(rawBuffer);
    if (!extension) {
      throw new BadRequestException('Logo must be a PNG or JPEG image.');
    }

    const buffer = await resizeLogo(rawBuffer, extension);
    const logoUrl = await this.storage.saveLogo(tenantId, buffer, extension);
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl } });
    return toTenantBranding(tenant);
  }

  async removeLogo(tenantId: string): Promise<TenantBranding> {
    await this.storage.deleteLogo(tenantId);
    const tenant = await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl: null } });
    return toTenantBranding(tenant);
  }

  async uploadAboutImage(tenantId: string, dto: UploadAboutImageDto): Promise<{ url: string }> {
    const rawBuffer = Buffer.from(dto.image, 'base64');
    if (rawBuffer.byteLength > MAX_ABOUT_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException('Image is too large. The maximum size is 2 MB.');
    }

    const extension = detectImageExtension(rawBuffer);
    if (!extension) {
      throw new BadRequestException('Image must be a PNG or JPEG image.');
    }

    const buffer = await resizeAboutImage(rawBuffer, extension);
    const url = await this.storage.saveKeyedImage(`about-images/${tenantId}/${randomUUID()}.${extension}`, buffer);
    return { url };
  }
}
