import { allocateManually, allocateOldestFirst } from './allocation';

describe('allocateOldestFirst', () => {
  it('records a partial payment against a single installment', () => {
    const result = allocateOldestFirst(1_000, [{ id: 'i1', amount: 1_500, paidAmount: 0 }]);

    expect(result.allocations).toEqual([{ installmentId: 'i1', amount: 1_000 }]);
    expect(result.unallocatedAmount).toBe(0);
  });

  it('completes a partially paid installment with a follow-up payment', () => {
    const result = allocateOldestFirst(500, [{ id: 'i1', amount: 1_500, paidAmount: 1_000 }]);

    expect(result.allocations).toEqual([{ installmentId: 'i1', amount: 500 }]);
  });

  it('applies to the oldest unpaid installment first, then the current one', () => {
    const result = allocateOldestFirst(1_000, [
      { id: 'overdue', amount: 500, paidAmount: 0 },
      { id: 'current', amount: 1_500, paidAmount: 0 },
    ]);

    expect(result.allocations).toEqual([
      { installmentId: 'overdue', amount: 500 },
      { installmentId: 'current', amount: 500 },
    ]);
    expect(result.unallocatedAmount).toBe(0);
  });

  it('cascades an overpayment to the next installment', () => {
    const result = allocateOldestFirst(2_000, [
      { id: 'current', amount: 1_500, paidAmount: 0 },
      { id: 'next', amount: 1_000, paidAmount: 0 },
    ]);

    expect(result.allocations).toEqual([
      { installmentId: 'current', amount: 1_500 },
      { installmentId: 'next', amount: 500 },
    ]);
  });

  it('leaves the excess unallocated when the payment exceeds every outstanding installment', () => {
    const result = allocateOldestFirst(800, [{ id: 'i1', amount: 500, paidAmount: 0 }]);

    expect(result.allocations).toEqual([{ installmentId: 'i1', amount: 500 }]);
    expect(result.unallocatedAmount).toBe(300);
  });

  it('skips installments that are already fully paid', () => {
    const result = allocateOldestFirst(500, [
      { id: 'paid', amount: 1_000, paidAmount: 1_000 },
      { id: 'due', amount: 500, paidAmount: 0 },
    ]);

    expect(result.allocations).toEqual([{ installmentId: 'due', amount: 500 }]);
  });
});

describe('allocateManually', () => {
  const outstanding = [
    { id: 'i1', amount: 1_000, paidAmount: 0 },
    { id: 'i2', amount: 500, paidAmount: 200 },
  ];

  it('applies each manual allocation exactly as specified', () => {
    const result = allocateManually(
      600,
      [
        { installmentId: 'i1', amount: 400 },
        { installmentId: 'i2', amount: 200 },
      ],
      outstanding,
    );

    expect(result.allocations).toEqual([
      { installmentId: 'i1', amount: 400 },
      { installmentId: 'i2', amount: 200 },
    ]);
    expect(result.unallocatedAmount).toBe(0);
  });

  it('throws when the manual allocations do not add up to the payment amount', () => {
    expect(() =>
      allocateManually(600, [{ installmentId: 'i1', amount: 400 }], outstanding),
    ).toThrow();
  });

  it('throws when an allocation exceeds the installment remaining balance', () => {
    expect(() =>
      allocateManually(1_000, [{ installmentId: 'i1', amount: 1_000 }, { installmentId: 'i2', amount: 0 }], [
        { id: 'i1', amount: 500, paidAmount: 0 },
        { id: 'i2', amount: 500, paidAmount: 0 },
      ]),
    ).toThrow();
  });

  it('throws when the installment is not outstanding on this contract', () => {
    expect(() =>
      allocateManually(100, [{ installmentId: 'unknown', amount: 100 }], outstanding),
    ).toThrow();
  });
});
