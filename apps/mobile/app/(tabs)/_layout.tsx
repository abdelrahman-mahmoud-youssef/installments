import { NativeTabs, SFSymbolIcon } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';

type TabSymbol = Extract<NonNullable<SFSymbolIcon['sf']>, { selected: unknown }>;

interface TabDefinition {
  name: string;
  labelKey: 'tabs.dashboard' | 'tabs.contracts' | 'tabs.customers' | 'tabs.wallets' | 'tabs.more';
  symbol: TabSymbol;
  ionicon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDefinition[] = [
  {
    name: '(home)',
    labelKey: 'tabs.dashboard',
    symbol: { default: 'house', selected: 'house.fill' },
    ionicon: 'home',
  },
  {
    name: 'contracts',
    labelKey: 'tabs.contracts',
    symbol: { default: 'doc.text', selected: 'doc.text.fill' },
    ionicon: 'document-text',
  },
  {
    name: 'customers',
    labelKey: 'tabs.customers',
    symbol: { default: 'person.2', selected: 'person.2.fill' },
    ionicon: 'people',
  },
  {
    name: 'wallets',
    labelKey: 'tabs.wallets',
    symbol: { default: 'creditcard', selected: 'creditcard.fill' },
    ionicon: 'wallet',
  },
  {
    name: 'more',
    labelKey: 'tabs.more',
    symbol: { default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' },
    ionicon: 'ellipsis-horizontal-circle',
  },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();

  return (
    <NativeTabs
      tintColor={colors.primary}
      minimizeBehavior="onScrollDown"
      unstable_nativeProps={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon
            sf={tab.symbol}
            src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name={tab.ionicon} />}
          />
          <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
