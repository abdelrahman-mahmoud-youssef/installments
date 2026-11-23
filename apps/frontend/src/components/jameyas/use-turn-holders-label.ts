import { useTranslations } from 'next-intl';
import { JameyaCycle, JameyaDetail } from '@/lib/api/jameyas';
import { memberNameOf } from '@/lib/jameya-turns';

export function useTurnHoldersLabel(jameya: Pick<JameyaDetail, 'members'>) {
  const t = useTranslations('jameyas.detail');
  return (cycle: Pick<JameyaCycle, 'holders'>) => {
    const [first, ...others] = cycle.holders;
    const name = first ? memberNameOf(jameya, first.customerId) : '';
    return others.length === 0 ? name : t('sharedHolders', { name, count: others.length });
  };
}
