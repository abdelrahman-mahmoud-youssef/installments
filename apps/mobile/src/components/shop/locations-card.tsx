import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TenantLocation } from '@/api/branding';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';
import { LocationFormSheet } from './location-form-sheet';

const MAX_LOCATIONS = 10;

interface LocationsCardProps {
  locations: TenantLocation[];
  saving: boolean;
  onSave: (locations: TenantLocation[]) => Promise<boolean>;
}

export function LocationsCard({ locations, saving, onSave }: LocationsCardProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [editing, setEditing] = useState<TenantLocation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<TenantLocation | null>(null);

  const openForm = (location: TenantLocation | null) => {
    setEditing(location);
    setIsFormOpen(true);
  };

  const saveLocation = async (location: TenantLocation) => {
    const exists = locations.some((candidate) => candidate.id === location.id);
    const next = exists
      ? locations.map((candidate) => (candidate.id === location.id ? location : candidate))
      : [...locations, location];
    if (await onSave(next)) {
      setIsFormOpen(false);
    }
  };

  const removeLocation = async () => {
    if (!pendingRemove) {
      return;
    }
    if (await onSave(locations.filter((candidate) => candidate.id !== pendingRemove.id))) {
      setPendingRemove(null);
    }
  };

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        {locations.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('shopExtras.noLocations')}
          </AppText>
        ) : (
          locations.map((location) => (
            <View key={location.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <PressableScale
                onPress={() => openForm(location)}
                accessibilityRole="button"
                style={{ flex: 1, gap: 2 }}
              >
                {location.name ? <AppText variant="bodyStrong">{location.name}</AppText> : null}
                <AppText variant="caption" tone="muted" numberOfLines={2}>
                  {location.address}
                </AppText>
              </PressableScale>
              <PressableScale
                onPress={() => setPendingRemove(location)}
                accessibilityRole="button"
                accessibilityLabel={t('common.remove')}
                style={{ width: touchTarget.minHeight, height: touchTarget.minHeight, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </PressableScale>
            </View>
          ))
        )}
        <Button
          title={t('shopExtras.addLocation')}
          icon="add-circle-outline"
          variant="secondary"
          disabled={locations.length >= MAX_LOCATIONS}
          onPress={() => openForm(null)}
        />
      </View>

      <LocationFormSheet
        visible={isFormOpen}
        location={editing}
        saving={saving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(location) => void saveLocation(location)}
      />
      <ConfirmSheet
        visible={pendingRemove !== null}
        title={t('shopExtras.removeLocationTitle')}
        message={pendingRemove?.address ?? ''}
        confirmTitle={t('common.remove')}
        destructive
        loading={saving}
        onConfirm={() => void removeLocation()}
        onCancel={() => setPendingRemove(null)}
      />
    </Card>
  );
}
