import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, Switch, View } from 'react-native';
import { TenantBranding, TenantLocation, UpdateBrandingInput } from '@/api/branding';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { BrandColorPicker } from '@/components/shop/brand-color-picker';
import { CalculatorPlansCard } from '@/components/shop/calculator-plans-card';
import { LocationsCard } from '@/components/shop/locations-card';
import { ShopPreviewCard } from '@/components/shop/shop-preview-card';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useBranding, useRemoveLogo, useSetOffersVisibility, useUpdateBranding, useUploadLogo } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { BRAND_COLOR_PRESETS, BrandColorPreset } from '@/lib/brand-colors';
import { isolateLtr } from '@/lib/format';
import { pickImages } from '@/lib/image-picker';
import { buildShopUrl } from '@/lib/share-url';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MIN_LENGTH = 3;

interface ShopForm {
  displayName: string;
  slug: string;
  phone: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

function toForm(branding: TenantBranding): ShopForm {
  return {
    displayName: branding.displayName,
    slug: branding.slug,
    phone: branding.phone ?? '',
    instagramUrl: branding.instagramUrl ?? '',
    facebookUrl: branding.facebookUrl ?? '',
    tiktokUrl: branding.tiktokUrl ?? '',
  };
}

export default function ShopScreen() {
  const { t } = useI18n();
  const { colors, setBrandColor } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const branding = useBranding(isAdmin);
  const savedBrandColor = branding.data?.brandColor;

  useEffect(() => {
    if (savedBrandColor) {
      setBrandColor(savedBrandColor);
    }
  }, [savedBrandColor, setBrandColor]);
  const updateMutation = useUpdateBranding();
  const uploadLogoMutation = useUploadLogo();
  const removeLogoMutation = useRemoveLogo();
  const offersVisibilityMutation = useSetOffersVisibility();

  const [form, setForm] = useState<ShopForm | null>(null);
  const [errors, setErrors] = useState<{ displayName?: string; slug?: string; api?: string }>({});
  const [logoSheetVisible, setLogoSheetVisible] = useState(false);
  const [removeLogoVisible, setRemoveLogoVisible] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (branding.data && !hasInitialized.current) {
      hasInitialized.current = true;
      setForm(toForm(branding.data));
    }
  }, [branding.data]);

  const colorLabels = Object.fromEntries(
    BRAND_COLOR_PRESETS.map((preset) => [preset, t(`shop.colors.${preset}`)]),
  ) as Record<BrandColorPreset, string>;

  const updateField = (field: keyof ShopForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined, api: undefined }));
  };

  const saveQuietly = (input: UpdateBrandingInput, successMessage: string) => {
    updateMutation.mutate(input, {
      onSuccess: () => showToast(successMessage),
      onError: () => showToast(t('common.genericError'), 'error'),
    });
  };

  const saveLocations = async (locations: TenantLocation[]): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ locations });
      showToast(t('shop.saved'));
      return true;
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : t('common.genericError'), 'error');
      return false;
    }
  };

  const submit = async () => {
    if (!form || !branding.data) {
      return;
    }
    const nextErrors: typeof errors = {};
    const slug = form.slug.trim();
    if (!form.displayName.trim()) {
      nextErrors.displayName = t('common.requiredField');
    }
    if (slug.length < SLUG_MIN_LENGTH || !SLUG_PATTERN.test(slug)) {
      nextErrors.slug = t('shop.slugInvalid');
    }
    setErrors(nextErrors);
    if (nextErrors.displayName || nextErrors.slug) {
      return;
    }
    try {
      const saved = await updateMutation.mutateAsync({
        displayName: form.displayName.trim(),
        slug: slug !== branding.data.slug ? slug : undefined,
        phone: form.phone.trim(),
        instagramUrl: form.instagramUrl.trim(),
        facebookUrl: form.facebookUrl.trim(),
        tiktokUrl: form.tiktokUrl.trim(),
      });
      setForm(toForm(saved));
      showToast(t('shop.saved'));
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  const changeLogo = async () => {
    setLogoSheetVisible(false);
    const [picked] = await pickImages({ limit: 1, square: true });
    if (!picked) {
      return;
    }
    uploadLogoMutation.mutate(picked.base64, {
      onSuccess: () => showToast(t('shop.logoUpdated')),
      onError: (error) => showToast(error instanceof ApiError ? error.message : t('common.genericError'), 'error'),
    });
  };

  const confirmRemoveLogo = () => {
    removeLogoMutation.mutate(undefined, {
      onSuccess: () => {
        setRemoveLogoVisible(false);
        showToast(t('shop.logoRemoved'));
      },
      onError: () => {
        setRemoveLogoVisible(false);
        showToast(t('common.genericError'), 'error');
      },
    });
  };

  const renderSwitchRow = (title: string, value: boolean, onValueChange: (next: boolean) => void) => (
    <ListRow
      title={title}
      trailing={
        <Switch
          value={value}
          disabled={updateMutation.isPending || offersVisibilityMutation.isPending}
          onValueChange={onValueChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
        />
      }
    />
  );

  const data = branding.data;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen options={{ title: t('shop.title') }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing.xxxl + floatingActionClearance,
        }}
      >
        {!isAdmin ? (
          <Card>
            <AppText variant="caption" tone="muted">
              {t('shop.adminOnly')}
            </AppText>
          </Card>
        ) : branding.isPending || !form || !data ? (
          branding.isError ? (
            <ErrorState error={branding.error} onRetry={() => void branding.refetch()} />
          ) : (
            <SkeletonCardList count={3} rows={2} />
          )
        ) : (
          <>
            <ShopPreviewCard
              displayName={form.displayName || data.displayName}
              slug={form.slug || data.slug}
              phone={form.phone}
              brandColor={data.brandColor}
              logoUrl={data.logoUrl}
              logoActionLabel={data.logoUrl ? t('shop.changeLogo') : t('shop.addLogo')}
              onPressLogo={() => setLogoSheetVisible(true)}
            />

            <Card>
              <ListRow
                icon="share-outline"
                title={t('shopExtras.shareShop')}
                subtitle={isolateLtr(buildShopUrl(data.slug))}
                onPress={() => void Share.share({ message: buildShopUrl(data.slug) })}
              />
            </Card>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shop.brandColor')} />
              <BrandColorPicker
                selected={data.brandColor}
                labels={colorLabels}
                disabled={updateMutation.isPending}
                onSelect={(brandColor) => saveQuietly({ brandColor }, t('shop.saved'))}
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shop.identitySection')} />
              <Card>
                <View style={{ gap: spacing.lg }}>
                  <TextField
                    label={t('shop.displayName')}
                    placeholder={t('shop.displayNamePlaceholder')}
                    value={form.displayName}
                    onChangeText={(value) => updateField('displayName', value)}
                    error={errors.displayName}
                    maxLength={120}
                  />
                  <TextField
                    label={t('shop.slug')}
                    value={form.slug}
                    ltr
                    onChangeText={(value) => updateField('slug', value.toLowerCase())}
                    error={errors.slug}
                    hint={t('shop.slugHint')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={60}
                  />
                  <TextField
                    label={t('shop.phone')}
                    placeholder={t('shop.phonePlaceholder')}
                    value={form.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    keyboardType="phone-pad"
                    maxLength={30}
                    optional
                  />
                </View>
              </Card>
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shop.socialSection')} />
              <Card>
                <View style={{ gap: spacing.lg }}>
                  {(['instagramUrl', 'facebookUrl', 'tiktokUrl'] as const).map((field) => (
                    <TextField
                      key={field}
                      label={t(`shop.${field.replace('Url', '')}`)}
                      placeholder={t('shop.linkPlaceholder')}
                      value={form[field]}
                      onChangeText={(value) => updateField(field, value)}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={200}
                      optional
                    />
                  ))}
                </View>
              </Card>
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shop.visibilitySection')} />
              <Card>
                {renderSwitchRow(t('shop.showOffers'), data.showOffersOnPublicPage, (value) =>
                  offersVisibilityMutation.mutate(value, {
                    onError: () => showToast(t('common.genericError'), 'error'),
                  }),
                )}
                {renderSwitchRow(t('shop.showPricing'), data.showPublicPricing, (value) =>
                  saveQuietly({ showPublicPricing: value }, t('shop.saved')),
                )}
                {renderSwitchRow(t('shop.showCalculator'), data.showInstallmentCalculator, (value) =>
                  saveQuietly({ showInstallmentCalculator: value }, t('shop.saved')),
                )}
              </Card>
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shopExtras.plansSection')} />
              <CalculatorPlansCard
                plans={data.calculatorPlans}
                saving={updateMutation.isPending}
                onSave={(calculatorPlans) => saveQuietly({ calculatorPlans }, t('shop.saved'))}
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('shopExtras.locationsSection')} />
              <LocationsCard locations={data.locations} saving={updateMutation.isPending} onSave={saveLocations} />
            </View>

            {errors.api ? (
              <AppText variant="caption" tone="danger">
                {errors.api}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="faint">
              {t('shop.webOnlyHint')}
            </AppText>
          </>
        )}
      </ScrollView>

      {isAdmin && form ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('common.save')}
            icon="checkmark-circle-outline"
            onPress={() => void submit()}
            loading={updateMutation.isPending}
          />
        </FloatingActionBar>
      ) : null}

      <BottomSheet
        visible={logoSheetVisible}
        onClose={() => setLogoSheetVisible(false)}
        title={t('shop.logo')}
        scrollable={false}
      >
        <View>
          <ListRow
            icon="image-outline"
            title={data?.logoUrl ? t('shop.changeLogo') : t('shop.addLogo')}
            onPress={() => void changeLogo()}
          />
          {data?.logoUrl ? (
            <ListRow
              icon="trash-outline"
              title={t('shop.removeLogo')}
              destructive
              onPress={() => {
                setLogoSheetVisible(false);
                setRemoveLogoVisible(true);
              }}
            />
          ) : null}
        </View>
      </BottomSheet>

      <ConfirmSheet
        visible={removeLogoVisible}
        title={t('shop.removeLogoTitle')}
        message={t('shop.removeLogoConfirm')}
        confirmTitle={t('shop.removeLogo')}
        destructive
        loading={removeLogoMutation.isPending}
        onConfirm={confirmRemoveLogo}
        onCancel={() => setRemoveLogoVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
