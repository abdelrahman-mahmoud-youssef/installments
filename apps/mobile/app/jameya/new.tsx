import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ApiError } from '@/api/client';
import { JameyaPreview } from '@/api/jameyas';
import { useAuth } from '@/auth/auth-context';
import { CustomerPickerSheet } from '@/components/contracts/contract-form/customer-picker-sheet';
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet';
import { JameyaDetailsStep } from '@/components/jameyas/jameya-form/jameya-details-step';
import { JameyaMembersStep } from '@/components/jameyas/jameya-form/jameya-members-step';
import { JameyaOrderStep } from '@/components/jameyas/jameya-form/jameya-order-step';
import { JameyaReviewStep } from '@/components/jameyas/jameya-form/jameya-review-step';
import { JameyaFormField, useJameyaForm } from '@/components/jameyas/jameya-form/use-jameya-form';
import { JameyaUnavailable } from '@/components/jameyas/jameya-unavailable';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { KeyboardDoneBar } from '@/components/ui/keyboard-done-bar';
import { StepIndicator } from '@/components/ui/step-indicator';
import { useToast } from '@/components/ui/toast-context';
import { useCreateCustomer, useCreateJameya, usePreviewJameya } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type FormStep = 'details' | 'members' | 'order' | 'review';

type OpenSheet = 'picker' | 'newCustomer' | null;

const FORM_STEPS: FormStep[] = ['details', 'members', 'order', 'review'];

export default function NewJameyaScreen() {
  const { t, locale, isRTL } = useI18n();
  const { colors } = useTheme();
  const { canUseJameyas } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const form = useJameyaForm();
  const previewJameya = usePreviewJameya();
  const createJameya = useCreateJameya();
  const createCustomer = useCreateCustomer();
  const [step, setStep] = useState<FormStep>('details');
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [preview, setPreview] = useState<JameyaPreview | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!canUseJameyas) {
    return <JameyaUnavailable title={t('jameyas.new.title')} message={t('jameyas.notEnabled')} />;
  }

  const stepIndex = FORM_STEPS.indexOf(step);
  const isBusy = previewJameya.isPending || createJameya.isPending;

  const errorFor = (field: JameyaFormField): string | undefined => {
    const code = form.errorCodes[field];
    return code ? t(`jameyas.validation.${code}`) : undefined;
  };

  const showStep = (next: FormStep) => {
    setApiError(null);
    setStep(next);
  };

  const goToReview = async () => {
    setApiError(null);
    try {
      setPreview(await previewJameya.mutateAsync(form.payload()));
      setStep('review');
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : t('jameyas.new.previewError'));
    }
  };

  const goNext = () => {
    if (step === 'details' && form.confirmDetails()) {
      showStep('members');
    } else if (step === 'members' && form.hasValidTurns) {
      showStep('order');
    } else if (step === 'order') {
      void goToReview();
    }
  };

  const create = async () => {
    setApiError(null);
    try {
      const jameya = await createJameya.mutateAsync(form.payload());
      showToast(t('jameyas.new.created'));
      router.replace(`/jameya/${jameya.id}`);
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : t('jameyas.new.createError'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('jameyas.new.title') }} />
      <ScrollView
        key={step}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl + floatingActionClearance }}
      >
        <View style={{ gap: spacing.sm }}>
          <StepIndicator
            totalSteps={FORM_STEPS.length}
            currentStep={stepIndex}
            label={t('contractForm.stepOf', {
              step: formatNumber(stepIndex + 1, locale),
              total: formatNumber(FORM_STEPS.length, locale),
            })}
          />
          <AppText variant="title">{t(`jameyas.new.steps.${step}`)}</AppText>
        </View>
        {step === 'details' ? (
          <JameyaDetailsStep values={form.values} setField={form.setField} errorFor={errorFor} />
        ) : null}
        {step === 'members' ? (
          <JameyaMembersStep
            memberTurns={form.memberTurns}
            turnCount={form.turns.length}
            hasEnoughMembers={form.hasEnoughMembers}
            onAddCustomer={() => setOpenSheet('picker')}
            onAddTurn={form.addTurn}
            onRemoveTurn={form.removeTurn}
          />
        ) : null}
        {step === 'order' ? (
          <JameyaOrderStep turns={form.turns} onMove={form.moveTurn} onShuffle={form.shuffleTurns} />
        ) : null}
        {step === 'review' && preview ? <JameyaReviewStep preview={preview} turns={form.turns} /> : null}
        {apiError ? (
          <AppText variant="caption" tone="danger">
            {apiError}
          </AppText>
        ) : null}
      </ScrollView>

      <FloatingActionBar>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {stepIndex > 0 ? (
            <Button
              variant="secondary"
              title={t('jameyas.new.back')}
              icon={isRTL ? 'arrow-forward' : 'arrow-back'}
              disabled={isBusy}
              onPress={() => showStep(FORM_STEPS[stepIndex - 1])}
            />
          ) : null}
          {step === 'review' ? (
            <Button
              variant="glass"
              title={t('jameyas.new.create')}
              icon="checkmark-circle-outline"
              loading={createJameya.isPending}
              onPress={() => void create()}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              variant="glass"
              title={step === 'order' ? t('jameyas.new.toReview') : t('jameyas.new.next')}
              icon={isRTL ? 'arrow-back' : 'arrow-forward'}
              loading={previewJameya.isPending}
              disabled={step === 'members' && !form.hasValidTurns}
              onPress={goNext}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </FloatingActionBar>

      <KeyboardDoneBar />
      <CustomerPickerSheet
        visible={openSheet === 'picker'}
        selectedIds={form.memberTurns.map(({ member }) => member.id)}
        onClose={() => setOpenSheet(null)}
        onSelect={(customer) => form.addTurn({ id: customer.id, name: customer.name, phone: customer.phone })}
        onCreateNew={() => setOpenSheet('newCustomer')}
      />
      <CustomerFormSheet
        visible={openSheet === 'newCustomer'}
        customer={null}
        saving={createCustomer.isPending}
        onClose={() => setOpenSheet(null)}
        onSubmit={async (input) => {
          const customer = await createCustomer.mutateAsync(input);
          form.addTurn({ id: customer.id, name: customer.name, phone: customer.phone });
          setOpenSheet(null);
          showToast(t('customerForm.created'));
        }}
      />
    </View>
  );
}
