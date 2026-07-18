export interface OutstandingInstallment {
  id: string;
  amount: number;
  paidAmount: number;
}

export interface ManualAllocationInput {
  installmentId: string;
  amount: number;
}

export interface AllocationEntry {
  installmentId: string;
  amount: number;
}

export interface AllocationResult {
  allocations: AllocationEntry[];
  unallocatedAmount: number;
}

function remainingBalance(installment: OutstandingInstallment): number {
  return installment.amount - installment.paidAmount;
}

export function allocateOldestFirst(
  paymentAmount: number,
  outstandingInstallmentsOldestFirst: OutstandingInstallment[],
): AllocationResult {
  let remainingPayment = paymentAmount;
  const allocations: AllocationEntry[] = [];

  for (const installment of outstandingInstallmentsOldestFirst) {
    if (remainingPayment <= 0) {
      break;
    }
    const balance = remainingBalance(installment);
    if (balance <= 0) {
      continue;
    }
    const amountApplied = Math.min(remainingPayment, balance);
    allocations.push({ installmentId: installment.id, amount: amountApplied });
    remainingPayment -= amountApplied;
  }

  return { allocations, unallocatedAmount: remainingPayment };
}

export function allocateManually(
  paymentAmount: number,
  manualAllocations: ManualAllocationInput[],
  outstandingInstallments: OutstandingInstallment[],
): AllocationResult {
  const installmentsById = new Map(
    outstandingInstallments.map((installment) => [installment.id, installment]),
  );
  let totalManualAmount = 0;

  for (const manualAllocation of manualAllocations) {
    const installment = installmentsById.get(manualAllocation.installmentId);
    if (!installment) {
      throw new Error(
        `Installment ${manualAllocation.installmentId} is not an outstanding installment on this contract.`,
      );
    }
    if (manualAllocation.amount > remainingBalance(installment)) {
      throw new Error(
        `Allocation of ${manualAllocation.amount} exceeds the remaining balance of installment ${manualAllocation.installmentId}.`,
      );
    }
    totalManualAmount += manualAllocation.amount;
  }

  if (totalManualAmount !== paymentAmount) {
    throw new Error('Manual allocations must add up to exactly the payment amount.');
  }

  return {
    allocations: manualAllocations.map((allocation) => ({
      installmentId: allocation.installmentId,
      amount: allocation.amount,
    })),
    unallocatedAmount: 0,
  };
}
