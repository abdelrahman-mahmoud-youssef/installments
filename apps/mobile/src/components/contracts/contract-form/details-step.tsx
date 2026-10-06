import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { ImageSlot } from '@/components/ui/image-slot';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { isolateLtr } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { ContractFormField, ContractFormValues, SetContractFormField } from './use-contract-form';

const CUSTOMER_PLACEHOLDER_ICON_SIZE = 44;
const CHEVRON_SIZE = 18;

interface DetailsStepProps {
  values: ContractFormValues;
  setField: SetContractFormField;
  errorFor: (field: ContractFormField) => string | undefined;
  tagSuggestions: string[];
  onChooseCustomer: () => void;
}

export function DetailsStep({ values, setField, errorFor, tagSuggestions, onChooseCustomer }: DetailsStepProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const customerError = errorFor('customer');

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title={t('contracts.customerSection')} />
        <PressableScale onPress={onChooseCustomer} accessibilityRole="button">
          <Card style={customerError ? { borderWidth: 1.5, borderColor: colors.danger } : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              {values.customer ? (
                <Avatar name={values.customer.name} />
              ) : (
                <Ionicons name="person-circle-outline" size={CUSTOMER_PLACEHOLDER_ICON_SIZE} color={colors.textFaint} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{values.customer?.name ?? t('contractForm.chooseCustomer')}</AppText>
                <AppText variant="caption" tone={customerError ? 'danger' : 'muted'}>
                  {values.customer
                    ? isolateLtr(values.customer.phone)
                    : (customerError ?? t('contractForm.chooseCustomerHint'))}
                </AppText>
              </View>
              <Ionicons name="chevron-expand" size={CHEVRON_SIZE} color={colors.textFaint} />
            </View>
          </Card>
        </PressableScale>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader title={t('contractForm.productSection')} />
        <Card>
          <View style={{ gap: spacing.lg }}>
            <TextField
              label={t('contractForm.productName')}
              value={values.productName}
              onChangeText={(text) => setField('productName', text)}
              error={errorFor('productName')}
            />
            <TextField
              label={t('contracts.productPrice')}
              value={values.productPrice}
              onChangeText={(text) => setField('productPrice', text)}
              keyboardType="decimal-pad"
              placeholder="0"
              error={errorFor('productPrice')}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('contracts.downPayment')}
                  value={values.downPayment}
                  onChangeText={(text) => setField('downPayment', text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  error={errorFor('downPayment')}
                  optional
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('contractForm.costPrice')}
                  value={values.costPrice}
                  onChangeText={(text) => setField('costPrice', text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  error={errorFor('costPrice')}
                  optional
                />
              </View>
            </View>
            <AppText variant="label" tone="faint">
              {t('contractForm.costPriceHint')}
            </AppText>
            <View style={{ gap: spacing.sm }}>
              <TextField
                label={t('contractForm.tag')}
                value={values.tag}
                onChangeText={(text) => setField('tag', text)}
                placeholder={t('contractForm.tagPlaceholder')}
                error={errorFor('tag')}
                optional
              />
              {tagSuggestions.length > 0 ? (
                <ChoiceChips
                  options={tagSuggestions.map((tag) => ({ value: tag, label: tag, icon: 'pricetag-outline' as const }))}
                  selected={null}
                  onSelect={(tag) => setField('tag', tag)}
                />
              ) : null}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <ImageSlot label={t('contractForm.image')} picked={values.image} onPick={(image) => setField('image', image)} />
            </View>
          </View>
        </Card>
      </View>
    </>
  );
}
