import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useContractTags, useUpdateContractTag } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { MAX_CONTRACT_TAG_LENGTH } from '@/lib/contract-rules';
import { spacing } from '@/theme/tokens';

interface ContractTagSheetProps {
  visible: boolean;
  contractId: string;
  currentTag: string | null;
  onClose: () => void;
}

export function ContractTagSheet({ visible, contractId, currentTag, onClose }: ContractTagSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const tagsQuery = useContractTags(visible);
  const updateMutation = useUpdateContractTag(contractId);
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTag(currentTag ?? '');
      setError(null);
    }
  }, [visible, currentTag]);

  const save = async (nextTag: string) => {
    try {
      await updateMutation.mutateAsync(nextTag.trim());
      showToast(t('contractDetail.tagSaved'));
      onClose();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : t('common.genericError'));
    }
  };

  const suggestions = (tagsQuery.data ?? []).filter((suggestion) => suggestion !== tag.trim());

  return (
    <BottomSheet
      visible={visible}
      onClose={updateMutation.isPending ? () => undefined : onClose}
      title={t('contractDetail.editTag')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('contractForm.tag')}
          placeholder={t('contractForm.tagPlaceholder')}
          value={tag}
          onChangeText={setTag}
          maxLength={MAX_CONTRACT_TAG_LENGTH}
          autoFocus
        />
        {suggestions.length > 0 ? (
          <ChoiceChips
            options={suggestions.map((suggestion) => ({ value: suggestion, label: suggestion }))}
            selected={null}
            onSelect={setTag}
          />
        ) : null}
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void save(tag)} loading={updateMutation.isPending} />
        {currentTag ? (
          <Button
            title={t('contractDetail.removeTag')}
            variant="destructive"
            onPress={() => void save('')}
            disabled={updateMutation.isPending}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}
