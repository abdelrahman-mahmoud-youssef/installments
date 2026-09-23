import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { CustomerPickerSheet } from '@/components/contracts/contract-form/customer-picker-sheet';
import { PlanFields } from '@/components/contracts/contract-form/plan-fields';
import { SchedulePreviewCard } from '@/components/contracts/contract-form/schedule-preview-card';
import {
  ContractFormErrorCode,
  ContractFormField,
  SelectedCustomer,
  useContractForm,
} from '@/components/contracts/contract-form/use-contract-form';
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { ImageSlot } from '@/components/ui/image-slot';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useContractTags, useCreateContract, useCreateCustomer } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { parseCountInput, parseNonNegativeAmountInput, toMinorUnits } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type OpenSheet = 'picker' | 'newCustomer' | null;

type NewContractParams = {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
};

function initialCustomerFrom(params: NewContractParams): SelectedCustomer | null {
  if (!params.customerId || !params.customerName) {
    return null;
  }
  return { id: params.customerId, name: params.customerName, phone: params.customerPhone ?? '' };
}

export default function NewContractScreen() {
  const params = useLocalSearchParams<NewContractParams>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { values, setField, preview, errorCodes, submitPayload } = useContractForm(initialCustomerFrom(params));
  const createContract = useCreateContract();
  const createCustomer = useCreateCustomer();
  const tagsQuery = useContractTags(isAdmin);

  const errorFor = (field: ContractFormField): string | undefined => {
    const code: ContractFormErrorCode | undefined = errorCodes[field];
    return code ? t(`contractForm.errors.${code}`) : undefined;
  };

  const submit = async () => {
    const payload = submitPayload();
    if (!payload) {
      return;
    }
    setApiError(null);
    try {
      const contract = await createContract.mutateAsync(payload);
      showToast(t('contractForm.created'));
      router.replace(`/contract/${contract.id}`);
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : t('common.genericError'));
    }
  };

  const tagSuggestions = (tagsQuery.data ?? []).filter((tag) => tag !== values.tag.trim());
  const downPaymentMinor = toMinorUnits(parseNonNegativeAmountInput(values.downPayment) ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('contractForm.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl + floatingActionClearance }}
      >
        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('contracts.customerSection')} />
          <PressableScale onPress={() => setOpenSheet('picker')} accessibilityRole="button">
            <Card style={errorFor('customer') ? { borderWidth: 1.5, borderColor: colors.danger } : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {values.customer ? (
                  <Avatar name={values.customer.name} />
                ) : (
                  <Ionicons name="person-circle-outline" size={44} color={colors.textFaint} />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong">{values.customer?.name ?? t('contractForm.chooseCustomer')}</AppText>
                  <AppText variant="caption" tone={errorFor('customer') ? 'danger' : 'muted'}>
                    {values.customer?.phone ?? errorFor('customer') ?? t('contractForm.chooseCustomerHint')}
                  </AppText>
                </View>
                <Ionicons name="chevron-expand" size={18} color={colors.textFaint} />
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
                <ImageSlot
                  label={t('contractForm.image')}
                  picked={values.image}
                  onPick={(image) => setField('image', image)}
                />
              </View>
            </View>
          </Card>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('contractForm.planSection')} />
          <Card>
            <PlanFields
              values={values}
              onChange={setField}
              errors={{
                markupPercent: errorFor('markupPercent'),
                installmentCount: errorFor('installmentCount'),
                fixedInstallmentAmount: errorFor('fixedInstallmentAmount'),
                intervalDays: errorFor('intervalDays'),
              }}
            />
          </Card>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('contractForm.datesSection')} />
          <Card>
            <View style={{ gap: spacing.lg }}>
              <DateStepper
                label={t('contractForm.startDate')}
                value={values.startDate}
                onChange={(date) => setField('startDate', date)}
                showMonthSteps
              />
              <DateStepper
                label={t('contractForm.firstPaymentDate')}
                value={values.firstPaymentDate}
                onChange={(date) => setField('firstPaymentDate', date)}
                showMonthSteps
              />
            </View>
          </Card>
        </View>

        {preview ? (
          <SchedulePreviewCard
            preview={preview}
            downPayment={downPaymentMinor}
            firstPaymentDate={values.firstPaymentDate}
            recurrenceType={values.recurrenceType}
            intervalDays={parseCountInput(values.intervalDays) ?? undefined}
          />
        ) : null}

        {errorFor('schedule') || apiError ? (
          <AppText variant="caption" tone="danger">
            {apiError ?? errorFor('schedule')}
          </AppText>
        ) : null}
      </ScrollView>

      <FloatingActionBar>
        <Button
          variant="glass"
          title={t('contractForm.create')}
          icon="checkmark-circle-outline"
          loading={createContract.isPending}
          onPress={() => void submit()}
        />
      </FloatingActionBar>

      <CustomerPickerSheet
        visible={openSheet === 'picker'}
        selectedId={values.customer?.id ?? null}
        onClose={() => setOpenSheet(null)}
        onSelect={(customer) => {
          setField('customer', { id: customer.id, name: customer.name, phone: customer.phone });
          setOpenSheet(null);
        }}
        onCreateNew={() => setOpenSheet('newCustomer')}
      />
      <CustomerFormSheet
        visible={openSheet === 'newCustomer'}
        customer={null}
        saving={createCustomer.isPending}
        onClose={() => setOpenSheet(null)}
        onSubmit={async (input) => {
          const customer = await createCustomer.mutateAsync(input);
          setField('customer', { id: customer.id, name: customer.name, phone: customer.phone });
          setOpenSheet(null);
          showToast(t('customerForm.created'));
        }}
      />
    </View>
  );
}
