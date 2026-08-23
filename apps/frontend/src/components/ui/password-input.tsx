'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const t = useTranslations('common');
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pe-9', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        tabIndex={-1}
        aria-label={visible ? t('hidePassword') : t('showPassword')}
        className="absolute top-1/2 end-2.5 grid size-5 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
