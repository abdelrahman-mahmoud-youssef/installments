import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { render as shapeBidiText } from 'bidi-shaper';
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
  family: 'Noto Naskh Arabic',
  fonts: [
    { src: '/fonts/pdf/noto-naskh-arabic-400.woff', fontWeight: 400 },
    { src: '/fonts/pdf/noto-naskh-arabic-600.woff', fontWeight: 600 },
    { src: '/fonts/pdf/noto-naskh-arabic-700.woff', fontWeight: 700 },
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

const ARABIC_SCRIPT_PATTERN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const containsArabicScript = (text: string) => ARABIC_SCRIPT_PATTERN.test(text);

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

export function ContactStatementPdf({ locale, copy, tenant, contact }: ContactStatementPdfProps) {
  const isRtl = locale === 'ar';
  const fontFamily = isRtl ? 'Noto Naskh Arabic' : 'IBM Plex Sans';
  const accent = BRAND_COLOR_VALUES[tenant.brandColor];
  const align = isRtl ? 'right' : 'left';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const LEFT_TO_RIGHT_OVERRIDE = String.fromCharCode(0x202d);
  const s = (text: string) => {
    const clean = sanitizeForPdfFont(text);
    return isRtl && containsArabicScript(clean)
      ? `${LEFT_TO_RIGHT_OVERRIDE}${sanitizeForPdfFont(shapeBidiText(clean))}`
      : clean;
  };
  const fontFamilyFor = (text: string) => (isRtl && containsArabicScript(text) ? 'Noto Naskh Arabic' : 'IBM Plex Sans');

  const balanceTone = contact.balance > 0 ? 'danger' : contact.balance < 0 ? 'success' : 'neutral';
  const balanceHint = contact.balance > 0 ? copy.theyOwe : contact.balance < 0 ? copy.youOwe : copy.settled;
  const moneyParts = splitMoneyParts(Math.abs(contact.balance), locale);

  const styles = StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
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
    },
    logo: { width: 44, height: 44, borderRadius: 6, objectFit: 'cover' },
    tenantName: { fontSize: 15, fontWeight: 700, textAlign: align },
    tenantPhone: { fontSize: 9, color: COLORS.muted, marginTop: 2, textAlign: align },
    docLabel: { fontSize: 9, color: COLORS.muted, letterSpacing: 1.5 },
    title: { fontSize: 20, fontWeight: 700, textAlign: align, marginTop: 28, marginBottom: 4 },
    generatedOn: { fontSize: 9, color: COLORS.muted, textAlign: align, marginBottom: 24 },
    metaPanel: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
      gap: 8,
    },
    metaRow: { flexDirection: rowDirection, justifyContent: 'space-between' },
    metaLabel: { fontSize: 9, color: COLORS.muted },
    metaValue: { fontSize: 10, fontWeight: 600, textAlign: isRtl ? 'left' : 'right' },
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
    balanceLabel: { fontSize: 10, color: COLORS.muted, marginBottom: 8 },
    balanceValueRow: { flexDirection: rowDirection, alignItems: 'baseline', gap: 6 },
    balanceValue: {
      fontSize: 30,
      fontWeight: 700,
      color: balanceTone === 'danger' ? COLORS.danger : balanceTone === 'success' ? COLORS.success : COLORS.ink,
    },
    balanceCurrency: {
      fontSize: 14,
      fontWeight: 700,
      color: balanceTone === 'danger' ? COLORS.danger : balanceTone === 'success' ? COLORS.success : COLORS.ink,
    },
    balanceHint: { fontSize: 10, color: COLORS.muted, marginTop: 8 },
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
    footerText: { fontSize: 8, color: COLORS.muted },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            {tenant.logoUrl && <Image src={tenant.logoUrl} style={styles.logo} />}
            <View>
              <Text style={[styles.tenantName, { fontFamily: fontFamilyFor(tenant.displayName) }]}>
                {s(tenant.displayName)}
              </Text>
              {tenant.phone && (
                <Text style={[styles.tenantPhone, { fontFamily: fontFamilyFor(tenant.phone) }]}>
                  {s(tenant.phone)}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.docLabel}>{s(copy.documentLabel)}</Text>
        </View>

        <Text style={styles.title}>{s(copy.title)}</Text>
        <Text style={styles.generatedOn}>{s(copy.generatedOn)}</Text>

        <View style={styles.metaPanel}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{s(copy.contactLabel)}</Text>
            <Text style={[styles.metaValue, { fontFamily: fontFamilyFor(contact.name) }]}>{s(contact.name)}</Text>
          </View>
          {contact.phone && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{s(copy.phoneLabel)}</Text>
              <Text style={[styles.metaValue, { fontFamily: fontFamilyFor(contact.phone) }]}>{s(contact.phone)}</Text>
            </View>
          )}
        </View>

        <View style={styles.balancePanel}>
          <Text style={styles.balanceLabel}>{s(copy.balanceLabel)}</Text>
          <View style={styles.balanceValueRow}>
            <Text style={[styles.balanceCurrency, { fontFamily: fontFamilyFor(moneyParts.currency) }]}>
              {s(moneyParts.currency)}
            </Text>
            <Text style={[styles.balanceValue, { fontFamily: 'IBM Plex Sans' }]}>{moneyParts.amount}</Text>
          </View>
          <Text style={styles.balanceHint}>{s(balanceHint)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{s(copy.footerPrefix)}</Text>
          <Text style={[styles.footerText, { fontFamily: fontFamilyFor(tenant.displayName) }]}>
            {s(tenant.displayName)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
