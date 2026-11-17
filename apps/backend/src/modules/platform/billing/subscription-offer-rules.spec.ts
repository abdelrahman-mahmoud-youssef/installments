import { findOfferTermsProblem } from './subscription-offer-rules';

const validTerms = {
  price: 40_000,
  regularPrice: 60_000,
  startsOn: new Date('2026-12-25T00:00:00.000Z'),
  endsOn: new Date('2027-01-07T00:00:00.000Z'),
};

describe('findOfferTermsProblem', () => {
  it('accepts a discounted offer that runs for at least one day', () => {
    expect(findOfferTermsProblem(validTerms)).toBeNull();
    expect(findOfferTermsProblem({ ...validTerms, endsOn: validTerms.startsOn })).toBeNull();
  });

  it('rejects an offer that ends before it starts', () => {
    expect(findOfferTermsProblem({ ...validTerms, endsOn: new Date('2026-12-24T00:00:00.000Z') })).toBe(
      'The offer must end on or after its start date.',
    );
  });

  it('rejects an offer priced above its regular price', () => {
    expect(findOfferTermsProblem({ ...validTerms, price: 70_000 })).toBe(
      'The offer price must not be higher than the regular price.',
    );
  });
});
