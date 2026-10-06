import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { useI18n } from '@/i18n/i18n-context';

const ALL_TAGS = '__all__';

interface ContractTagFilterSheetProps {
  visible: boolean;
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onClose: () => void;
}

export function ContractTagFilterSheet({ visible, tags, selectedTag, onSelectTag, onClose }: ContractTagFilterSheetProps) {
  const { t } = useI18n();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('contracts.filterByTag')}>
      <ChoiceChips
        options={[
          { value: ALL_TAGS, label: t('contractForm.allTags') },
          ...tags.map((tag) => ({ value: tag, label: `# ${tag}` })),
        ]}
        selected={selectedTag ?? ALL_TAGS}
        onSelect={(value) => {
          onSelectTag(value === ALL_TAGS ? null : value);
          onClose();
        }}
      />
    </BottomSheet>
  );
}
