import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionOffer } from '@prisma/client';
import { getUtcToday, toUtcMidnight } from '../../../common/date/utc-date';
import { resolveOfferStatus, SubscriptionOfferStatus } from '../../../common/subscription/subscription';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubscriptionOfferDto } from './dto/create-subscription-offer.dto';
import { UpdateSubscriptionOfferDto } from './dto/update-subscription-offer.dto';
import { findOfferTermsProblem, SubscriptionOfferTerms } from './subscription-offer-rules';

export type SubscriptionOfferSummary = SubscriptionOffer & {
  status: SubscriptionOfferStatus;
  timesUsed: number;
};

function toDate(isoDate: string): Date {
  return toUtcMidnight(new Date(isoDate));
}

function assertValidTerms(terms: SubscriptionOfferTerms): void {
  const problem = findOfferTermsProblem(terms);
  if (problem) {
    throw new BadRequestException(problem);
  }
}

@Injectable()
export class SubscriptionOffersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SubscriptionOfferSummary[]> {
    const today = getUtcToday();
    const offers = await this.prisma.subscriptionOffer.findMany({
      orderBy: [{ startsOn: 'desc' }, { createdAt: 'desc' }],
      include: { _count: { select: { subscriptions: true } } },
    });
    return offers.map(({ _count, ...offer }) => ({
      ...offer,
      status: resolveOfferStatus(offer, today),
      timesUsed: _count.subscriptions,
    }));
  }

  async create(dto: CreateSubscriptionOfferDto): Promise<SubscriptionOffer> {
    const data = { ...dto, startsOn: toDate(dto.startsOn), endsOn: toDate(dto.endsOn) };
    assertValidTerms(data);
    return this.prisma.subscriptionOffer.create({ data });
  }

  async update(id: string, dto: UpdateSubscriptionOfferDto): Promise<SubscriptionOffer> {
    const offer = await this.findOwned(id);
    const data = {
      ...dto,
      startsOn: dto.startsOn ? toDate(dto.startsOn) : undefined,
      endsOn: dto.endsOn ? toDate(dto.endsOn) : undefined,
    };
    assertValidTerms({
      price: data.price ?? offer.price,
      regularPrice: data.regularPrice ?? offer.regularPrice,
      startsOn: data.startsOn ?? offer.startsOn,
      endsOn: data.endsOn ?? offer.endsOn,
    });
    return this.prisma.subscriptionOffer.update({ where: { id }, data });
  }

  private async findOwned(id: string): Promise<SubscriptionOffer> {
    const offer = await this.prisma.subscriptionOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found.');
    }
    return offer;
  }
}
