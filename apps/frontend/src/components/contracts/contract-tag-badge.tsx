'use client';

import { Plus, Tag as TagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUpdateContractTag } from '@/hooks/use-contracts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

export function ContractTagBadge({ contractId, tag }: { contractId: string; tag: string | null }) {
  const t = useTranslations('contracts.detail');
  const tCommon = useTranslations('common');
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  const updateTag = useUpdateContractTag(contractId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(tag ?? '');

  if (!isAdmin) {
    return tag ? (
      <span className={cn(badgeVariants({ variant: 'outline' }))}>
        <TagIcon className="size-3" />
        {tag}
      </span>
    ) : null;
  }

  async function handleSave() {
    await updateTag.mutateAsync(draft.trim() || null);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setDraft(tag ?? '');
      }}
    >
      <PopoverTrigger
        render={
          <button type="button" className={cn(badgeVariants({ variant: 'outline' }), 'cursor-pointer')}>
            {tag ? (
              <>
                <TagIcon className="size-3" />
                {tag}
              </>
            ) : (
              <>
                <Plus className="size-3" />
                {t('addTag')}
              </>
            )}
          </button>
        }
      />
      <PopoverContent className="w-64">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('tagPlaceholder')}
            className="h-8"
          />
          <Button type="button" size="sm" onClick={handleSave} disabled={updateTag.isPending}>
            {tCommon('confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
