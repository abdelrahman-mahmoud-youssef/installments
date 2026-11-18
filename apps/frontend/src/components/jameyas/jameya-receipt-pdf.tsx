import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import {
  describeAmountInWords,
  PDF_COLORS,
  PDF_LATIN_FONT,
  PdfLocale,
  pdfFontFamily,
  pdfFontForText,
  sanitizeForPdfFont,
  splitMoneyParts,
} from '@/lib/pdf';
import { BrandColorPreset } from '@/lib/schemas/branding';

export interface JameyaReceiptRow {
  label: string;
  value: string;
}

export interface JameyaReceiptContent {
  documentLabel: string;
  title: string;
  issuedOn: string;
  amountLabel: string;
  amount: number;
  rows: JameyaReceiptRow[];
  footerPrefix: string;
}

export interface JameyaReceiptPdfProps {
  locale: PdfLocale;
  content: JameyaReceiptContent;
  tenant: {
    displayName: string;
    logoUrl: string | null;
    phone: string | null;
    brandColor: BrandColorPreset;
  };
}

export function JameyaReceiptPdf({ locale, content, tenant }: JameyaReceiptPdfProps) {
  const isRtl = locale === 'ar';
  const accent = BRAND_COLOR_VALUES[tenant.brandColor];
  const align = isRtl ? 'right' : 'left';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const s = (text: string) => sanitizeForPdfFont(text);
  const fontOf = (text: string) => ({ fontFamily: pdfFontForText(text, locale) });
  const moneyParts = splitMoneyParts(content.amount, locale);

  const styles = StyleSheet.create({
    page: {
      fontFamily: pdfFontFamily(locale),
      direction: isRtl ? 'rtl' : 'ltr',
      fontSize: 14,
      color: PDF_COLORS.ink,
      backgroundColor: PDF_COLORS.paper,
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
    headerBrand: { flexDirection: rowDirection, alignItems: 'center', gap: 12, flexShrink: 1 },
    headerBrandText: { flexShrink: 1, minWidth: 0 },
    logo: { width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
    tenantName: { fontSize: 21, fontWeight: 700, textAlign: align },
    tenantPhone: { fontSize: 13, color: PDF_COLORS.muted, marginTop: 2, textAlign: align },
    docLabel: { fontSize: 13, color: PDF_COLORS.muted, letterSpacing: 1.5, flexShrink: 0 },
    title: { fontSize: 28, fontWeight: 700, textAlign: align, marginTop: 28, marginBottom: 4 },
    issuedOn: { fontSize: 13, color: PDF_COLORS.muted, textAlign: align, marginBottom: 24 },
    amountPanel: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: PDF_COLORS.border,
      borderRadius: 10,
      backgroundColor: PDF_COLORS.panel,
      paddingVertical: 24,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    amountLabel: { fontSize: 14, color: PDF_COLORS.muted, marginBottom: 8 },
    amountValueRow: { flexDirection: rowDirection, alignItems: 'baseline', gap: 6 },
    amountValue: { fontSize: 40, fontWeight: 700, color: PDF_COLORS.success, fontFamily: PDF_LATIN_FONT },
    amountCurrency: { fontSize: 20, fontWeight: 700, color: PDF_COLORS.success },
    amountInWords: { fontSize: 13, color: PDF_COLORS.muted, marginTop: 8, textAlign: 'center' },
    metaPanel: {
      borderWidth: 1,
      borderColor: PDF_COLORS.border,
      borderRadius: 8,
      padding: 16,
      gap: 10,
    },
    metaRow: { flexDirection: rowDirection, justifyContent: 'space-between', gap: 16 },
    metaLabel: { fontSize: 13, color: PDF_COLORS.muted, flexShrink: 0 },
    metaValue: { fontSize: 14, fontWeight: 600, textAlign: isRtl ? 'left' : 'right', flexShrink: 1 },
    footer: {
      position: 'absolute',
      bottom: 32,
      left: 44,
      right: 44,
      borderTopWidth: 1,
      borderTopColor: PDF_COLORS.border,
      paddingTop: 12,
      flexDirection: rowDirection,
      justifyContent: 'center',
      gap: 4,
    },
    footerText: { fontSize: 11, color: PDF_COLORS.muted },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            {tenant.logoUrl && <Image src={tenant.logoUrl} style={styles.logo} />}
            <View style={styles.headerBrandText}>
              <Text style={[styles.tenantName, fontOf(tenant.displayName)]}>{s(tenant.displayName)}</Text>
              {tenant.phone && <Text style={styles.tenantPhone}>{s(tenant.phone)}</Text>}
            </View>
          </View>
          <Text style={styles.docLabel}>{s(content.documentLabel)}</Text>
        </View>

        <Text style={styles.title}>{s(content.title)}</Text>
        <Text style={styles.issuedOn}>{s(content.issuedOn)}</Text>

        <View style={styles.amountPanel}>
          <Text style={styles.amountLabel}>{s(content.amountLabel)}</Text>
          <View style={styles.amountValueRow}>
            <Text style={styles.amountCurrency}>{s(moneyParts.currency)}</Text>
            <Text style={styles.amountValue}>{moneyParts.amount}</Text>
          </View>
          <Text style={styles.amountInWords}>{s(describeAmountInWords(content.amount, locale))}</Text>
        </View>

        <View style={styles.metaPanel}>
          {content.rows.map((row) => (
            <View key={row.label} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{s(row.label)}</Text>
              <Text style={[styles.metaValue, fontOf(row.value)]}>{s(row.value)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{s(content.footerPrefix)}</Text>
          <Text style={[styles.footerText, fontOf(tenant.displayName)]}>{s(tenant.displayName)}</Text>
        </View>
      </Page>
    </Document>
  );
}
