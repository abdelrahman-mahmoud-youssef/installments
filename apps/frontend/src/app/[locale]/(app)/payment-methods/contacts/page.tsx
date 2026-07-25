'use client';

import { Plus, Trash2, UserRoundX, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ContactFormDialog } from '@/components/payment-methods/contact-form-dialog';
import { PaymentMethodsTabs } from '@/components/payment-methods/payment-methods-tabs';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { InitialAvatar } from '@/components/shared/initial-avatar';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useCreateCounterparty, useCounterparties, useDeleteCounterparty } from '@/hooks/use-counterparties';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api/client';
import type { Counterparty } from '@/lib/api/counterparties';
import { routes } from '@/lib/routes';

export default function ContactsPage() {
  const t = useTranslations('contacts');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useCounterparties({ q: debouncedSearch || undefined, page, limit: 20 });
  const createContact = useCreateCounterparty();
  const deleteContact = useDeleteCounterparty();

  const columns: Column<Counterparty>[] = [
    {
      id: 'name',
      header: t('name'),
      role: 'primary',
      cell: (contact) => (
        <Link href={routes.contact(contact.id)} className="group flex items-center gap-3">
          <InitialAvatar name={contact.name} className="size-9 text-xs" />
          <span className="truncate font-medium group-hover:underline">{contact.name}</span>
        </Link>
      ),
    },
    {
      id: 'phone',
      header: t('phone'),
      cell: (contact) => (
        <span dir="ltr" className="text-muted-foreground tabular-nums">
          {contact.phone ?? '—'}
        </span>
      ),
    },
    {
      id: 'balance',
      header: t('balance'),
      align: 'end',
      cell: (contact) => (
        <Money
          minorUnits={Math.abs(contact.balance)}
          className={contact.balance > 0 ? 'font-semibold text-danger' : 'font-semibold text-success'}
        />
      ),
    },
    {
      id: 'action',
      header: '',
      headerHidden: true,
      role: 'action',
      align: 'end',
      className: 'w-0',
      cell: (contact) => (
        <div onClick={(event) => event.stopPropagation()}>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={t('delete')}>
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            }
            title={t('deleteTitle')}
            description={t('deleteDescription', { name: contact.name })}
            destructive
            confirmLabel={t('delete')}
            onConfirm={async () => {
              try {
                await deleteContact.mutateAsync(contact.id);
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
            <ContactFormDialog
              trigger={
                <Button>
                  <Plus className="size-4" />
                  {t('newContact')}
                </Button>
              }
              onSubmit={(input) => createContact.mutateAsync(input)}
            />
          }
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <PaymentMethodsTabs />
      </FadeIn>

      <FadeIn delay={0.1} className="space-y-4">
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
              title={debouncedSearch ? t('noResults') : t('noContactsYet')}
              description={debouncedSearch ? undefined : t('createFirst')}
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              rows={data.data}
              keyOf={(contact) => contact.id}
              href={(contact) => routes.contact(contact.id)}
            />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
