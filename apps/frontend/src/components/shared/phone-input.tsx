'use client';

import { Contact } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const noopSubscribe = () => () => {};

function useContactPickerSupported(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window,
    () => false,
  );
}

function normalizePickedPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length > 10) {
    return `0${digits.slice(2)}`;
  }
  if (!digits.startsWith('0')) {
    return `0${digits}`;
  }
  return digits;
}

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'type' | 'onChange'> {
  onChange: (value: string) => void;
  onContactSelected?: (phone: string) => void;
}

export function PhoneInput({ className, onChange, onContactSelected, ...props }: PhoneInputProps) {
  const t = useTranslations('common');
  const contactPickerSupported = useContactPickerSupported();

  async function pickContact() {
    try {
      const contacts = await navigator.contacts?.select(['tel'], { multiple: false });
      const phone = contacts?.[0]?.tel?.[0];
      if (phone) {
        onContactSelected?.(normalizePickedPhone(phone));
      }
    } catch {
      // user cancelled the picker or denied permission — no-op
    }
  }

  return (
    <div className="relative">
      <Input
        type="tel"
        autoComplete="tel"
        className={cn(contactPickerSupported && onContactSelected && 'pe-10', className)}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {contactPickerSupported && onContactSelected && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={pickContact}
          aria-label={t('pickFromContacts')}
          className="absolute end-1 top-1/2 -translate-y-1/2"
        >
          <Contact className="size-4" />
        </Button>
      )}
    </div>
  );
}
