import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { useEnableTwoFactor, useSetupTwoFactor } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { BackupCodesStep } from './backup-codes-step';
import { TwoFactorSecretStep } from './two-factor-secret-step';

interface TwoFactorSetupSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TwoFactorSetupSheet({ visible, onClose }: TwoFactorSetupSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const { mutate: requestSetup, reset: resetSetup, data: setup, error: setupError, isPending } = useSetupTwoFactor();
  const enableMutation = useEnableTwoFactor();
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (visible) {
      setBackupCodes(null);
      setEnableError(null);
      resetSetup();
      requestSetup();
    }
  }, [visible, requestSetup, resetSetup]);

  const confirm = async (code: string) => {
    setEnableError(null);
    try {
      const result = await enableMutation.mutateAsync(code);
      setBackupCodes(result.backupCodes);
      showToast(t('security.twoFactorEnabled'));
    } catch (caught) {
      setEnableError(caught instanceof ApiError ? caught.message : t('common.genericError'));
    }
  };

  const finish = async () => {
    setIsFinishing(true);
    try {
      await refreshUser();
    } catch {
      showToast(t('common.genericError'), 'error');
    } finally {
      setIsFinishing(false);
      onClose();
    }
  };

  const isLocked = backupCodes !== null || enableMutation.isPending;

  const renderStep = () => {
    if (backupCodes) {
      return <BackupCodesStep backupCodes={backupCodes} finishing={isFinishing} onDone={() => void finish()} />;
    }
    if (setup) {
      return (
        <TwoFactorSecretStep
          setup={setup}
          confirming={enableMutation.isPending}
          error={enableError}
          onConfirm={(code) => void confirm(code)}
        />
      );
    }
    if (setupError && !isPending) {
      return <ErrorState error={setupError} onRetry={() => requestSetup()} />;
    }
    return <SkeletonCardList count={1} rows={3} />;
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={isLocked ? () => undefined : onClose}
      title={backupCodes ? t('security.backupCodesTitle') : t('security.setupTitle')}
    >
      {renderStep()}
    </BottomSheet>
  );
}
