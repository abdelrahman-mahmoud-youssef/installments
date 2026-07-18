'use client';

import { Plus, Trash2, Users, UserRoundX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { InitialAvatar } from '@/components/shared/initial-avatar';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Customer } from '@/lib/api/customers';
import { useCreateCustomer, useCustomers, useDeleteCustomer } from '@/hooks/use-customers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api/client';
import { routes } from '@/lib/routes';

export default function CustomersPage() {
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useCustomers({ q: debouncedSearch || undefined, page, limit: 20 });
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const columns: Column<Customer>[] = [
    {
      id: 'name',
      header: t('name'),
      role: 'primary',
      cell: (customer) => (
        <Link href={routes.customer(customer.id)} className="group flex items-center gap-3">
          <InitialAvatar name={customer.name} className="size-9 text-xs" />
          <span className="truncate font-medium group-hover:underline">{customer.name}</span>
        </Link>
      ),
    },
    {
      id: 'phone',
      header: t('phone'),
      cell: (customer) => (
        <span dir="ltr" className="text-muted-foreground tabular-nums">
          {customer.phone}
        </span>
      ),
    },
    {
      id: 'address',
      header: t('address'),
      cell: (customer) => <span className="text-muted-foreground">{customer.address ?? '—'}</span>,
    },
    {
      id: 'action',
      header: '',
      headerHidden: true,
      role: 'action',
      align: 'end',
      className: 'w-0',
      cell: (customer) => (
        <div onClick={(event) => event.stopPropagation()}>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={t('delete')}>
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            }
            title={t('deleteTitle')}
            description={t('deleteDescription', { name: customer.name })}
            destructive
            confirmLabel={t('delete')}
            onConfirm={async () => {
              try {
                await deleteCustomer.mutateAsync(customer.id);
                toast.success(t('deleted'));
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : t('deleteError'));
              }
            }}
          />
        </div>
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
            <CustomerFormDialog
              trigger={
                <Button>
                  <Plus className="size-4" />
                  {t('newCustomer')}
                </Button>
              }
              onSubmit={(input) => createCustomer.mutateAsync(input)}
            />
          }
        />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="max-w-sm"
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={Users} title={t('loadError')} description={tCommon('tryAgain')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={debouncedSearch ? UserRoundX : Users}
              title={debouncedSearch ? t('noResults') : t('noCustomersYet')}
              description={debouncedSearch ? undefined : t('createFirst')}
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              rows={data.data}
              keyOf={(customer) => customer.id}
              href={(customer) => routes.customer(customer.id)}
            />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
