import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { CustomerPickerSheet } from '@/components/contracts/contract-form/customer-picker-sheet';
import { DetailsStep } from '@/components/contracts/contract-form/details-step';
import { PlanStep } from '@/components/contracts/contract-form/plan-step';
import {
  ContractFormErrorCode,
  ContractFormField,
  SelectedCustomer,
  useContractForm,
} from '@/components/contracts/contract-form/use-contract-form';
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { StepIndicator } from '@/components/ui/step-indicator';
import { useToast } from '@/components/ui/toast-context';
import { useContractTags, useCreateContract, useCreateCustomer } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type OpenSheet = 'picker' | 'newCustomer' | null;

type FormStep = 'details' | 'plan';

const FORM_STEPS: FormStep[] = ['details', 'plan'];

const STEP_TITLE_KEYS: Record<FormStep, string> = {
  details: 'contractForm.detailsStep',
  plan: 'contractForm.planStep',
};

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
  const { t, locale, isRTL } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<FormStep>('details');
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { values, setField, preview, errorCodes, confirmDetails, submitPayload } = useContractForm(
    initialCustomerFrom(params),
  );
  const createContract = useCreateContract();
  const createCustomer = useCreateCustomer();
  const tagsQuery = useContractTags(isAdmin);

  const errorFor = (field: ContractFormField): string | undefined => {
    const code: ContractFormErrorCode | undefined = errorCodes[field];
    return code ? t(`contractForm.errors.${code}`) : undefined;
  };

  const goToPlan = () => {
    if (confirmDetails()) {
      setStep('plan');
    }
  };

  const submit = async () => {
    if (!confirmDetails()) {
      setStep('details');
      return;
    }
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

  const stepIndex = FORM_STEPS.indexOf(step);
  const stepLabel = t('contractForm.stepOf', {
    step: formatNumber(stepIndex + 1, locale),
    total: formatNumber(FORM_STEPS.length, locale),
  });
  const tagSuggestions = (tagsQuery.data ?? []).filter((tag) => tag !== values.tag.trim());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('contractForm.title') }} />
      <ScrollView
        key={step}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl + floatingActionClearance }}
      >
        <View style={{ gap: spacing.sm }}>
          <StepIndicator totalSteps={FORM_STEPS.length} currentStep={stepIndex} label={stepLabel} />
          <AppText variant="title">{t(STEP_TITLE_KEYS[step])}</AppText>
        </View>
        {step === 'details' ? (
          <DetailsStep
            values={values}
            setField={setField}
            errorFor={errorFor}
            tagSuggestions={tagSuggestions}
            onChooseCustomer={() => setOpenSheet('picker')}
          />
        ) : (
          <PlanStep values={values} setField={setField} errorFor={errorFor} preview={preview} apiError={apiError} />
        )}
      </ScrollView>

      <FloatingActionBar>
        {step === 'details' ? (
          <Button
            variant="glass"
            title={t('contractForm.next')}
            icon={isRTL ? 'arrow-back' : 'arrow-forward'}
            onPress={goToPlan}
          />
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              variant="secondary"
              title={t('common.back')}
              icon={isRTL ? 'arrow-forward' : 'arrow-back'}
              disabled={createContract.isPending}
              onPress={() => setStep('details')}
            />
            <Button
              variant="glass"
              title={t('contractForm.create')}
              icon="checkmark-circle-outline"
              loading={createContract.isPending}
              onPress={() => void submit()}
              style={{ flex: 1 }}
            />
          </View>
        )}
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
