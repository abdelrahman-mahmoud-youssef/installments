import { SetMetadata } from '@nestjs/common';

export const ALLOW_WITHOUT_SUBSCRIPTION_KEY = 'allowWithoutSubscription';

export const AllowWithoutSubscription = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_WITHOUT_SUBSCRIPTION_KEY, true);
