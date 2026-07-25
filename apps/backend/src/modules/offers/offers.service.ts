import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Offer, Prisma } from '@prisma/client';
import { MAX_OFFER_IMAGE_UPLOAD_BYTES, MAX_OFFER_IMAGES, MAX_OFFERS } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { SetOffersVisibilityDto } from './dto/set-offers-visibility.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

const TOO_MANY_OFFERS_ERROR = `You can have at most ${MAX_OFFERS} offers. Delete one before adding another.`;
const NO_IMAGES_ERROR = 'At least one image is required.';
const TOO_MANY_IMAGES_ERROR = `You can have at most ${MAX_OFFER_IMAGES} images per offer.`;

export interface PublicOffer {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  images: string[];
}

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(tenantId: string, query: OfferQueryDto): Promise<PaginatedResult<Offer>> {
    const where: Prisma.OfferWhereInput = {
      tenantId,
      ...(query.q && { title: { contains: query.q, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.offer.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async create(tenantId: string, dto: CreateOfferDto): Promise<Offer> {
    const count = await this.prisma.offer.count({ where: { tenantId } });
    if (count >= MAX_OFFERS) {
      throw new BadRequestException(TOO_MANY_OFFERS_ERROR);
    }

    const images = await this.resolveImages(tenantId, dto.images ?? [], dto.newImages ?? []);

    return this.prisma.offer.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        tag: dto.tag,
        isActive: dto.isActive ?? true,
        images,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateOfferDto): Promise<Offer> {
    await this.findOwned(tenantId, id);

    const imagesProvided = dto.images !== undefined || dto.newImages !== undefined;
    const images = imagesProvided ? await this.resolveImages(tenantId, dto.images ?? [], dto.newImages ?? []) : undefined;

    return this.prisma.offer.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        tag: dto.tag,
        isActive: dto.isActive,
        ...(images !== undefined && { images }),
      },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.offer.delete({ where: { id } });
  }

  async setPublicVisibility(tenantId: string, dto: SetOffersVisibilityDto): Promise<{ showOffersOnPublicPage: boolean }> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { showOffersOnPublicPage: dto.showOffersOnPublicPage },
      select: { showOffersOnPublicPage: true },
    });
    return tenant;
  }

  findPublicActive(slug: string): Promise<PublicOffer[]> {
    return this.prisma.offer.findMany({
      where: { isActive: true, tenant: { slug, showOffersOnPublicPage: true } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, description: true, tag: true, images: true },
    });
  }

  private async resolveImages(tenantId: string, keptImages: string[], newImages: string[]): Promise<string[]> {
    const uploaded = await Promise.all(newImages.map((image) => this.saveOfferImage(tenantId, image)));
    const images = [...keptImages, ...uploaded];

    if (images.length === 0) {
      throw new BadRequestException(NO_IMAGES_ERROR);
    }
    if (images.length > MAX_OFFER_IMAGES) {
      throw new BadRequestException(TOO_MANY_IMAGES_ERROR);
    }

    return images;
  }

  private async saveOfferImage(tenantId: string, image: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(image, MAX_OFFER_IMAGE_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`offer-images/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }

  private async findOwned(tenantId: string, id: string): Promise<Offer> {
    const offer = await this.prisma.offer.findFirst({ where: { id, tenantId } });
    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }
    return offer;
  }
}
