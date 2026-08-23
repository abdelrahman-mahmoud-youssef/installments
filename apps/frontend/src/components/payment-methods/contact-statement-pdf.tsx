import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { ToWords } from 'to-words';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import { BrandColorPreset } from '@/lib/schemas/branding';

Font.register({
  family: 'IBM Plex Sans',
  fonts: [
    { src: '/fonts/pdf/ibm-plex-sans-latin-400.woff', fontWeight: 400 },
    { src: '/fonts/pdf/ibm-plex-sans-latin-600.woff', fontWeight: 600 },
    { src: '/fonts/pdf/ibm-plex-sans-latin-700.woff', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Cairo',
  fonts: [
    { src: '/fonts/pdf/cairo-arabic-400.woff', fontWeight: 400 },
    { src: '/fonts/pdf/cairo-arabic-600.woff', fontWeight: 600 },
    { src: '/fonts/pdf/cairo-arabic-700.woff', fontWeight: 700 },
  ],
});

const COLORS = {
  ink: '#1c2333',
  muted: '#6b7280',
  border: '#e2e4ea',
  paper: '#ffffff',
  panel: '#f7f7f9',
  success: '#1f8a57',
  danger: '#c0392b',
};

export interface ContactStatementCopy {
  documentLabel: string;
  title: string;
  generatedOn: string;
  contactLabel: string;
  phoneLabel: string;
  balanceLabel: string;
  theyOwe: string;
  youOwe: string;
  settled: string;
  footerPrefix: string;
}

export interface ContactStatementPdfProps {
  locale: 'en' | 'ar';
  copy: ContactStatementCopy;
  tenant: {
    displayName: string;
    logoUrl: string | null;
    phone: string | null;
    brandColor: BrandColorPreset;
  };
  contact: {
    name: string;
    phone: string | null;
    balance: number;
  };
}

const BIDI_CONTROL_CHARS_PATTERN = new RegExp('[\\u200e\\u200f\\u061c\\u202a-\\u202e\\u2066-\\u2069]', 'g');
const NON_BREAKING_SPACE_PATTERN = new RegExp('\\u00a0', 'g');

const sanitizeForPdfFont = (text: string) =>
  text.replace(BIDI_CONTROL_CHARS_PATTERN, '').replace(NON_BREAKING_SPACE_PATTERN, ' ');

const splitMoneyParts = (minorUnits: number, locale: 'en' | 'ar') => {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    numberingSystem: 'latn',
  }).formatToParts(minorUnits / 100);
  const amount = parts
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('');
  const currency = parts.find((part) => part.type === 'currency')?.value ?? '';
  return { amount, currency };
};

const EGP_CURRENCY_OPTIONS = {
  name: 'Egyptian Pound',
  plural: 'Egyptian Pounds',
  symbol: 'EGP',
  fractionalUnit: { name: 'Piastre', plural: 'Piastres', symbol: '' },
};

const describeAmountInWords = (minorUnits: number, locale: 'en' | 'ar') => {
  const toWords = new ToWords({ localeCode: locale === 'ar' ? 'ar-EG' : 'en-US' });
  const converterOptions = locale === 'ar' ? { currency: true } : { currency: true, currencyOptions: EGP_CURRENCY_OPTIONS };
  return toWords.convert(Math.abs(minorUnits) / 100, converterOptions);
};

export function ContactStatementPdf({ locale, copy, tenant, contact }: ContactStatementPdfProps) {
  const isRtl = locale === 'ar';
  const fontFamily = isRtl ? 'Cairo' : 'IBM Plex Sans';
  const direction = isRtl ? 'rtl' : 'ltr';
  const accent = BRAND_COLOR_VALUES[tenant.brandColor];
  const align = isRtl ? 'right' : 'left';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const s = (text: string) => sanitizeForPdfFont(text);

  const balanceTone = contact.balance > 0 ? 'danger' : contact.balance < 0 ? 'success' : 'neutral';
  const balanceHint = contact.balance > 0 ? copy.theyOwe : contact.balance < 0 ? copy.youOwe : copy.settled;
  const moneyParts = splitMoneyParts(Math.abs(contact.balance), locale);
  const amountInWords = describeAmountInWords(contact.balance, locale);

  const styles = StyleSheet.create({
    page: {
      fontFamily,
      // page-level only — the same value on a Text style mispaints RTL text outside its own layout box
      direction,
      fontSize: 14,
      color: COLORS.ink,
      backgroundColor: COLORS.paper,
      paddingTop: 48,
      paddingBottom: 64,
      paddingHorizontal: 44,
    },
    header: {
      flexDirection: rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: accent,
    },
    headerBrand: {
      flexDirection: rowDirection,
      alignItems: 'center',
      gap: 12,
      flexShrink: 1,
    },
    headerBrandText: { flexShrink: 1, minWidth: 0 },
    logo: { width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
    tenantName: { fontSize: 21, fontWeight: 700, textAlign: align },
    tenantPhone: { fontSize: 13, color: COLORS.muted, marginTop: 2, textAlign: align },
    docLabel: { fontSize: 13, color: COLORS.muted, letterSpacing: 1.5, flexShrink: 0 },
    title: { fontSize: 28, fontWeight: 700, textAlign: align, marginTop: 28, marginBottom: 4 },
    generatedOn: { fontSize: 13, color: COLORS.muted, textAlign: align, marginBottom: 24 },
    metaPanel: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
      gap: 8,
    },
    metaRow: { flexDirection: rowDirection, justifyContent: 'space-between' },
    metaLabel: { fontSize: 13, color: COLORS.muted },
    metaValue: { fontSize: 14, fontWeight: 600, textAlign: isRtl ? 'left' : 'right' },
    balancePanel: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      backgroundColor: COLORS.panel,
      paddingVertical: 28,
      paddingHorizontal: 20,
      marginBottom: 28,
    },
    balanceLabel: { fontSize: 14, color: COLORS.muted, marginBottom: 8 },
    balanceValueRow: { flexDirection: rowDirection, alignItems: 'baseline', gap: 6 },
    balanceValue: {
      fontSize: 42,
      fontWeight: 700,
      color: balanceTone === 'danger' ? COLORS.danger : balanceTone === 'success' ? COLORS.success : COLORS.ink,
    },
    balanceCurrency: {
      fontSize: 20,
      fontWeight: 700,
      color: balanceTone === 'danger' ? COLORS.danger : balanceTone === 'success' ? COLORS.success : COLORS.ink,
    },
    balanceHint: { fontSize: 14, color: COLORS.muted, marginTop: 8 },
    amountInWords: {
      fontSize: 13,
      color: COLORS.muted,
      marginTop: 4,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 32,
      left: 44,
      right: 44,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: 12,
      flexDirection: rowDirection,
      justifyContent: 'center',
      gap: 4,
    },
    footerText: { fontSize: 11, color: COLORS.muted },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            {tenant.logoUrl && <Image src={tenant.logoUrl} style={styles.logo} />}
            <View style={styles.headerBrandText}>
              <Text style={styles.tenantName}>{s(tenant.displayName)}</Text>
              {tenant.phone && <Text style={styles.tenantPhone}>{s(tenant.phone)}</Text>}
            </View>
          </View>
          <Text style={styles.docLabel}>{s(copy.documentLabel)}</Text>
        </View>

        <Text style={styles.title}>{s(copy.title)}</Text>
        <Text style={styles.generatedOn}>{s(copy.generatedOn)}</Text>

        <View style={styles.metaPanel}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{s(copy.contactLabel)}</Text>
            <Text style={styles.metaValue}>{s(contact.name)}</Text>
          </View>
          {contact.phone && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{s(copy.phoneLabel)}</Text>
              <Text style={styles.metaValue}>{s(contact.phone)}</Text>
            </View>
          )}
        </View>

        <View style={styles.balancePanel}>
          <Text style={styles.balanceLabel}>{s(copy.balanceLabel)}</Text>
          <View style={styles.balanceValueRow}>
            <Text style={styles.balanceCurrency}>{s(moneyParts.currency)}</Text>
            <Text style={[styles.balanceValue, { fontFamily: 'IBM Plex Sans' }]}>{moneyParts.amount}</Text>
          </View>
          <Text style={styles.balanceHint}>{s(balanceHint)}</Text>
          <Text style={styles.amountInWords}>{s(amountInWords)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{s(copy.footerPrefix)}</Text>
          <Text style={styles.footerText}>{s(tenant.displayName)}</Text>
        </View>
      </Page>
    </Document>
  );
}
