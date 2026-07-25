'use client';

import { Users, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function PaymentMethodsTabs() {
  const t = useTranslations('paymentMethods');
  const pathname = usePathname();
  const isContacts = pathname.startsWith(routes.contacts);

  const tabs = [
    { href: routes.paymentMethods, label: t('walletsTab'), icon: Wallet, active: !isContacts },
    { href: routes.contacts, label: t('contactsTab'), icon: Users, active: isContacts },
  ];

  return (
    <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
            tab.active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground/60 hover:text-foreground',
          )}
        >
          <tab.icon className="size-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
