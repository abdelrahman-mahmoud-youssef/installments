import { JameyaCycle } from '@/api/jameyas';
import { useI18n } from '@/i18n/i18n-context';
import { JameyaFigures } from './jameya-figures';

export function JameyaCycleFigures({ cycle }: { cycle: JameyaCycle }) {
  const { t } = useI18n();
  return (
    <JameyaFigures
      figures={[
        { label: t('jameyas.detail.pot'), minorUnits: cycle.potAmount },
        { label: t('jameyas.detail.collected'), minorUnits: cycle.collectedAmount, tone: 'success' },
        { label: t('jameyas.detail.paidOut'), minorUnits: cycle.paidOutAmount },
        {
          label: t('jameyas.detail.shopCovered'),
          minorUnits: cycle.exposureAmount,
          tone: cycle.exposureAmount > 0 ? 'warning' : undefined,
        },
      ]}
    />
  );
}
