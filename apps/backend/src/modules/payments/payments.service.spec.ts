import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

interface FakeInstallment {
  id: string;
  sequence: number;
  amount: number;
  paidAmount: number;
}

function createService(installments: FakeInstallment[]) {
  const calls: string[] = [];
  const transaction = {
    $queryRaw: jest.fn().mockImplementation(async () => {
      calls.push('lock');
      return [];
    }),
    installment: {
      findMany: jest.fn().mockImplementation(async () => {
        calls.push('read-installments');
        return installments;
      }),
      update: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
    },
    payment: { create: jest.fn().mockResolvedValue({ id: 'payment-1' }) },
    paymentAllocation: { createMany: jest.fn().mockResolvedValue(undefined) },
    contract: { update: jest.fn().mockResolvedValue(undefined) },
  };
  const prisma = {
    contract: { findFirst: jest.fn().mockResolvedValue({ id: 'contract-1' }) },
    paymentMethod: { findFirst: jest.fn() },
    payment: { findFirst: jest.fn().mockResolvedValue({ id: 'payment-1', allocations: [] }) },
    $transaction: jest.fn().mockImplementation((callback: (tx: typeof transaction) => Promise<string>) => callback(transaction)),
  };
  const limitService = { checkAndAlert: jest.fn() };
  const service = new PaymentsService(prisma as never, limitService as never);
  return { service, transaction, calls };
}

describe('PaymentsService.create', () => {
  const installments: FakeInstallment[] = [{ id: 'i1', sequence: 1, amount: 500, paidAmount: 0 }];

  it('rejects a payment larger than the remaining balance without writing anything', async () => {
    const { service, transaction } = createService(installments);

    await expect(service.create('tenant-1', { contractId: 'contract-1', amount: 800 })).rejects.toThrow(BadRequestException);

    expect(transaction.payment.create).not.toHaveBeenCalled();
    expect(transaction.paymentAllocation.createMany).not.toHaveBeenCalled();
    expect(transaction.installment.update).not.toHaveBeenCalled();
  });

  it('rejects any payment on a contract that has nothing left to pay', async () => {
    const { service, transaction } = createService([]);

    await expect(service.create('tenant-1', { contractId: 'contract-1', amount: 100 })).rejects.toThrow(
      'This contract has no remaining balance.',
    );

    expect(transaction.payment.create).not.toHaveBeenCalled();
  });

  it('accepts a payment that exactly settles the remaining balance', async () => {
    const { service, transaction } = createService(installments);

    await service.create('tenant-1', { contractId: 'contract-1', amount: 500 });

    expect(transaction.paymentAllocation.createMany).toHaveBeenCalledWith({
      data: [{ tenantId: 'tenant-1', paymentId: 'payment-1', installmentId: 'i1', amount: 500 }],
    });
  });

  it('locks the contract before reading its installments so concurrent payments cannot double-count', async () => {
    const { service, calls } = createService(installments);

    await service.create('tenant-1', { contractId: 'contract-1', amount: 500 });

    expect(calls.slice(0, 2)).toEqual(['lock', 'read-installments']);
  });
});
