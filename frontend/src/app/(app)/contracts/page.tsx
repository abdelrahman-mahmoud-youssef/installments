'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContracts } from '@/hooks/use-contracts';
import { ContractStatus, CONTRACT_STATUSES } from '@/lib/enums';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

const STATUS_FILTER_ALL = 'ALL';

export default function ContractsPage() {
  const [status, setStatus] = useState<string>(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useContracts({
    status: status === STATUS_FILTER_ALL ? undefined : (status as ContractStatus),
    page,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contracts"
        actions={
          <Button render={<Link href={routes.newContract} />}>
            <Plus className="size-4" />
            New contract
          </Button>
        }
      />

      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value ?? STATUS_FILTER_ALL);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
          {CONTRACT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState title="Couldn't load contracts" description="Please try again in a moment." />
      ) : data.data.length === 0 ? (
        <EmptyState title="No contracts yet" description="Create a contract to get started." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link href={routes.customer(contract.customer.id)} className="hover:underline">
                      {contract.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={routes.contract(contract.id)} className="font-medium hover:underline">
                      {contract.productName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Money minorUnits={contract.totalAmount} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(contract.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
