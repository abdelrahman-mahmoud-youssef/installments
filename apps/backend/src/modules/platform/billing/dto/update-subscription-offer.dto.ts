import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionOfferDto } from './create-subscription-offer.dto';

export class UpdateSubscriptionOfferDto extends PartialType(CreateSubscriptionOfferDto) {}
