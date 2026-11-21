'use client';

import { useTranslations } from 'next-intl';
import { FaWhatsapp } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { JameyaMember } from '@/lib/api/jameyas';
import { toWhatsappNumber } from '@/lib/phone';

export function JameyaWhatsappButton({ member }: { member: JameyaMember }) {
  const t = useTranslations('jameyas.grid');
  if (!member.reminderMessage) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('sendReminder', { name: member.name })}
      title={t('sendReminder', { name: member.name })}
      render={
        <a
          href={`https://wa.me/${toWhatsappNumber(member.phone)}?text=${encodeURIComponent(member.reminderMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      <FaWhatsapp className="size-4 text-success" />
    </Button>
  );
}
