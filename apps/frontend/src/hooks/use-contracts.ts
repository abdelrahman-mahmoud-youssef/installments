import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelContract, ContractListParams, createContract, getContract, listContracts } from '@/lib/api/contracts';
import { ContractInput } from '@/lib/schemas/contract';
import { customerKeys } from './use-customers';

export const contractKeys = {
  all: ['contracts'] as const,
  list: (params: ContractListParams) => [...contractKeys.all, 'list', params] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
};

export function useContracts(params: ContractListParams) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => listContracts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContract(id),
    enabled: Boolean(id),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractInput) => createContract(input),
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(contract.customer.id) });
    },
  });
}

export function useCancelContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) });
    },
  });
}
