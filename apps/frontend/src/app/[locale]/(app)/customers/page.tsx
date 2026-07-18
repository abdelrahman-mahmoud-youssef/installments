'use client';

import { Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('title')}
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

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground rtl:right-2.5 rtl:left-auto" />
        <Input
          placeholder={t('searchPlaceholder')}
          className="pl-8 rtl:pr-8 rtl:pl-3"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('loadError')} description={tCommon('tryAgain')} />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? t('noResults') : t('noCustomersYet')}
          description={debouncedSearch ? undefined : t('createFirst')}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('address')}</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={routes.customer(customer.id)} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.address ?? '—'}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="size-4" />
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
                  </TableCell>
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
