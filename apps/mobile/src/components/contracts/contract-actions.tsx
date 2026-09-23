import { useState } from 'react';
import { Linking, View } from 'react-native';
import { ContractDetail } from '@/api/contracts';
import { useAuth } from '@/auth/auth-context';
import { ShareLinkSheet } from '@/components/sharing/share-link-sheet';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ListRow } from '@/components/ui/list-row';
import { useToast } from '@/components/ui/toast-context';
import { useCancelContract } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { whatsappChatUrl } from '@/lib/phone';
import { customerPortalPath } from '@/lib/share-url';
import { ContractTagSheet } from './contract-tag-sheet';

type OpenSheet = 'share' | 'tag' | 'cancel' | null;

interface ContractActionsProps {
  contract: ContractDetail;
  isMenuOpen: boolean;
  onMenuClose: () => void;
}

export function ContractActions({ contract, isMenuOpen, onMenuClose }: ContractActionsProps) {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const cancelMutation = useCancelContract(contract.id);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const isActive = contract.status === 'ACTIVE';

  const open = (sheet: OpenSheet) => {
    onMenuClose();
    setOpenSheet(sheet);
  };

  const sendReminder = () => {
    onMenuClose();
    if (contract.reminderMessage) {
      void Linking.openURL(whatsappChatUrl(contract.customer.phone, contract.reminderMessage));
    }
  };

  const cancelContract = async () => {
    try {
      await cancelMutation.mutateAsync();
      showToast(t('contractDetail.cancelled'));
    } catch {
      showToast(t('common.genericError'), 'error');
    } finally {
      setOpenSheet(null);
    }
  };

  return (
    <>
      <BottomSheet visible={isMenuOpen} onClose={onMenuClose} title={contract.productName} scrollable={false}>
        <View>
          <ListRow icon="qr-code-outline" title={t('sharing.shareCustomerLink')} onPress={() => open('share')} />
          {contract.reminderMessage ? (
            <ListRow icon="logo-whatsapp" title={t('contractDetail.sendReminder')} onPress={sendReminder} />
          ) : null}
          {isAdmin ? (
            <ListRow icon="pricetag-outline" title={t('contractDetail.editTag')} onPress={() => open('tag')} />
          ) : null}
          {isAdmin && isActive ? (
            <ListRow
              icon="close-circle-outline"
              title={t('contractDetail.cancelContract')}
              destructive
              onPress={() => open('cancel')}
            />
          ) : null}
        </View>
      </BottomSheet>

      <ShareLinkSheet
        visible={openSheet === 'share'}
        onClose={() => setOpenSheet(null)}
        title={t('sharing.shareCustomerLink')}
        targetPath={customerPortalPath(contract.customer.publicId, contract.publicId)}
        whatsappPhone={contract.customer.phone}
      />

      <ContractTagSheet
        visible={openSheet === 'tag'}
        contractId={contract.id}
        currentTag={contract.tag}
        onClose={() => setOpenSheet(null)}
      />

      <ConfirmSheet
        visible={openSheet === 'cancel'}
        title={t('contractDetail.cancelTitle')}
        message={t('contractDetail.cancelConfirm', { product: contract.productName })}
        confirmTitle={t('contractDetail.cancelContract')}
        destructive
        loading={cancelMutation.isPending}
        onConfirm={() => void cancelContract()}
        onCancel={() => setOpenSheet(null)}
      />
    </>
  );
}
