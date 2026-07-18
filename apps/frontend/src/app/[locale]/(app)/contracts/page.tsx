'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Link } from '@/i18n/navigation';
import { useContracts } from '@/hooks/use-contracts';
import { ContractStatus, CONTRACT_STATUSES } from '@/lib/enums';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

const STATUS_FILTER_ALL = 'ALL';

export default function ContractsPage() {
  const t = useTranslations('contracts');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
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
        title={t('title')}
        actions={
          <Button render={<Link href={routes.newContract} />}>
            <Plus className="size-4" />
            {t('newContract')}
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
          <SelectItem value={STATUS_FILTER_ALL}>{t('allStatuses')}</SelectItem>
          {CONTRACT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {tStatus(value)}
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
        <EmptyState title={t('loadError')} description={tCommon('tryAgain')} />
      ) : data.data.length === 0 ? (
        <EmptyState title={t('noContractsYet')} description={t('createPrompt')} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('created')}</TableHead>
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
