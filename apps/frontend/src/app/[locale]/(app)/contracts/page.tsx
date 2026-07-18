'use client';

import { FileText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from '@/i18n/navigation';
import type { ContractListItem } from '@/lib/api/contracts';
import { useContracts } from '@/hooks/use-contracts';
import { ContractStatus, CONTRACT_STATUSES } from '@/lib/enums';
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

  const columns: Column<ContractListItem>[] = [
    {
      id: 'product',
      header: t('product'),
      role: 'primary',
      cell: (contract) => (
        <Link href={routes.contract(contract.id)} className="font-medium hover:underline">
          {contract.productName}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: t('customer'),
      cell: (contract) => <span className="text-muted-foreground">{contract.customer.name}</span>,
    },
    {
      id: 'total',
      header: t('total'),
      cell: (contract) => <Money minorUnits={contract.totalAmount} className="font-medium" />,
    },
    {
      id: 'status',
      header: t('status'),
      role: 'trailing',
      cell: (contract) => <StatusBadge status={contract.status} />,
    },
    {
      id: 'created',
      header: t('created'),
      cell: (contract) => (
        <span className="text-muted-foreground">
          <DateText value={contract.createdAt} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={
            <Button render={<Link href={routes.newContract} />}>
              <Plus className="size-4" />
              {t('newContract')}
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? STATUS_FILTER_ALL);
            setPage(1);
          }}
          items={{
            [STATUS_FILTER_ALL]: t('allStatuses'),
            ...Object.fromEntries(CONTRACT_STATUSES.map((value) => [value, tStatus(value)])),
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
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={FileText} title={t('loadError')} description={tCommon('tryAgain')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={FileText}
              title={t('noContractsYet')}
              description={t('createPrompt')}
              action={
                <Button size="sm" render={<Link href={routes.newContract} />}>
                  <Plus className="size-4" />
                  {t('newContract')}
                </Button>
              }
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              rows={data.data}
              keyOf={(contract) => contract.id}
              href={(contract) => routes.contract(contract.id)}
            />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
