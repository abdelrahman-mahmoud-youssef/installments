export interface SubscriptionOfferTerms {
  price: number;
  regularPrice: number;
  startsOn: Date;
  endsOn: Date;
}

export function findOfferTermsProblem(terms: SubscriptionOfferTerms): string | null {
  if (terms.endsOn.getTime() < terms.startsOn.getTime()) {
    return 'The offer must end on or after its start date.';
  }
  if (terms.price > terms.regularPrice) {
    return 'The offer price must not be higher than the regular price.';
  }
  return null;
}
