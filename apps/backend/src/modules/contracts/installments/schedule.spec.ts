import { CalculationMethod } from '@prisma/client';
import { calculateInstallmentSchedule } from './schedule';

function sum(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

describe('calculateInstallmentSchedule', () => {
  it('splits evenly for a fixed installment count (Option 1)', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.FIXED_COUNT,
      productPrice: 12_000,
      downPayment: 0,
      installmentCount: 12,
    });

    expect(result.totalAmount).toBe(12_000);
    expect(result.installmentAmounts).toEqual(Array(12).fill(1_000));
    expect(sum(result.installmentAmounts)).toBe(12_000);
  });

  it('generates installments from a fixed monthly payment, with the final one absorbing the remainder (Option 2)', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.FIXED_AMOUNT,
      productPrice: 10_000,
      downPayment: 0,
      fixedInstallmentAmount: 1_500,
    });

    expect(result.installmentAmounts).toEqual([1_500, 1_500, 1_500, 1_500, 1_500, 1_500, 1_000]);
    expect(sum(result.installmentAmounts)).toBe(10_000);
  });

  it('does not add a trailing zero installment when the fixed amount divides evenly', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.FIXED_AMOUNT,
      productPrice: 9_000,
      downPayment: 0,
      fixedInstallmentAmount: 1_500,
    });

    expect(result.installmentAmounts).toEqual(Array(6).fill(1_500));
  });

  it('applies markup to the financed amount, not the down payment (Option 3)', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.MARKUP_PERCENT,
      productPrice: 10_000,
      downPayment: 2_000,
      markupPercent: 20,
      installmentCount: 10,
    });

    expect(result.totalAmount).toBe(11_600);
    expect(result.installmentAmounts).toEqual(Array(10).fill(960));
    expect(sum(result.installmentAmounts)).toBe(9_600);
  });

  it('marks up the whole price when there is no down payment', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.MARKUP_PERCENT,
      productPrice: 10_000,
      downPayment: 0,
      markupPercent: 25,
      installmentCount: 5,
    });

    expect(result.totalAmount).toBe(12_500);
    expect(result.installmentAmounts).toEqual(Array(5).fill(2_500));
  });

  it('puts the rounding remainder on the final installment', () => {
    const result = calculateInstallmentSchedule({
      calculationMethod: CalculationMethod.FIXED_COUNT,
      productPrice: 1_000,
      downPayment: 0,
      installmentCount: 3,
    });

    expect(result.installmentAmounts).toEqual([333, 333, 334]);
    expect(sum(result.installmentAmounts)).toBe(1_000);
  });

  it('throws when the remaining amount after the down payment is not positive', () => {
    expect(() =>
      calculateInstallmentSchedule({
        calculationMethod: CalculationMethod.FIXED_COUNT,
        productPrice: 1_000,
        downPayment: 1_000,
        installmentCount: 5,
      }),
    ).toThrow();
  });

  it('throws when installmentCount is missing for FIXED_COUNT', () => {
    expect(() =>
      calculateInstallmentSchedule({
        calculationMethod: CalculationMethod.FIXED_COUNT,
        productPrice: 1_000,
        downPayment: 0,
      }),
    ).toThrow();
  });

  it('throws when fixedInstallmentAmount is missing for FIXED_AMOUNT', () => {
    expect(() =>
      calculateInstallmentSchedule({
        calculationMethod: CalculationMethod.FIXED_AMOUNT,
        productPrice: 1_000,
        downPayment: 0,
      }),
    ).toThrow();
  });

  it('throws when markupPercent is missing for MARKUP_PERCENT', () => {
    expect(() =>
      calculateInstallmentSchedule({
        calculationMethod: CalculationMethod.MARKUP_PERCENT,
        productPrice: 1_000,
        downPayment: 0,
        installmentCount: 5,
      }),
    ).toThrow();
  });
});
