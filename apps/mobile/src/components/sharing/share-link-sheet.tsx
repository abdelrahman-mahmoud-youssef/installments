import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useCreateShareLink } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { whatsappChatUrl } from '@/lib/phone';
import { buildShareUrl } from '@/lib/share-url';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const QR_SIZE = 184;
const QR_BACKGROUND = '#ffffff';

interface ShareLinkSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  targetPath: string;
  whatsappPhone?: string;
}

export function ShareLinkSheet({ visible, onClose, title, targetPath, whatsappPhone }: ShareLinkSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const shareLinkMutation = useCreateShareLink();
  const [url, setUrl] = useState<string | null>(null);
  const { mutate, reset } = shareLinkMutation;
  const tenantSlug = user?.tenant.slug;

  const requestLink = useCallback(() => {
    setUrl(null);
    reset();
    mutate(targetPath, { onSuccess: ({ code }) => setUrl(buildShareUrl(code, tenantSlug)) });
  }, [mutate, reset, targetPath, tenantSlug]);

  useEffect(() => {
    if (visible) {
      requestLink();
    }
  }, [visible, requestLink]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      {shareLinkMutation.isError ? (
        <ErrorState error={shareLinkMutation.error} onRetry={requestLink} />
      ) : !url ? (
        <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.xxxl }} />
      ) : (
        <View style={{ gap: spacing.lg, alignItems: 'stretch' }}>
          <View
            style={{
              alignSelf: 'center',
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: QR_BACKGROUND,
            }}
          >
            <QRCode value={url} size={QR_SIZE} />
          </View>
          <AppText variant="caption" tone="muted" align="center" selectable>
            {url}
          </AppText>
          <Button
            title={t('sharing.shareLink')}
            icon="share-outline"
            onPress={() => void Share.share({ message: url })}
          />
          {whatsappPhone ? (
            <Button
              title={t('sharing.sendWhatsapp')}
              icon="logo-whatsapp"
              variant="secondary"
              onPress={() => void Linking.openURL(whatsappChatUrl(whatsappPhone, url))}
            />
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}
