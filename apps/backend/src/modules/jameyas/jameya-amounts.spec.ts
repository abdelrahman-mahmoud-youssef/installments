import { calculateCoveredAmount, calculateExposure } from './jameya-amounts';

describe('calculateCoveredAmount', () => {
  it('covers nothing when the payout stays under what was collected', () => {
    expect(calculateCoveredAmount({ collected: 10_000, paidOutBefore: 0, amount: 8_000 })).toBe(0);
  });

  it('covers nothing when the payout reaches exactly what was collected', () => {
    expect(calculateCoveredAmount({ collected: 10_000, paidOutBefore: 2_000, amount: 8_000 })).toBe(0);
  });

  it('covers the part of the payout above what was collected', () => {
    expect(calculateCoveredAmount({ collected: 6_000, paidOutBefore: 0, amount: 8_000 })).toBe(2_000);
  });

  it('covers only the new gap on a second partial payout after more money was collected', () => {
    const first = calculateCoveredAmount({ collected: 6_000, paidOutBefore: 0, amount: 8_000 });
    const second = calculateCoveredAmount({ collected: 9_000, paidOutBefore: 8_000, amount: 2_000 });

    expect(first).toBe(2_000);
    expect(second).toBe(1_000);
  });

  it('covers the whole payout when earlier payouts already exceed what was collected', () => {
    expect(calculateCoveredAmount({ collected: 5_000, paidOutBefore: 8_000, amount: 2_000 })).toBe(2_000);
  });
});

describe('calculateExposure', () => {
  it('shrinks as late members pay and never goes below zero', () => {
    expect(calculateExposure(10_000, 6_000)).toBe(4_000);
    expect(calculateExposure(10_000, 9_000)).toBe(1_000);
    expect(calculateExposure(10_000, 12_000)).toBe(0);
  });
});
