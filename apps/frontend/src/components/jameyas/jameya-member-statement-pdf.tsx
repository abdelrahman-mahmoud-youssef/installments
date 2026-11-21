import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import {
  PDF_COLORS,
  PDF_LATIN_FONT,
  PdfLocale,
  pdfFontFamily,
  pdfFontForText,
  sanitizeForPdfFont,
  splitMoneyParts,
} from '@/lib/pdf';
import { JameyaStatementContent, JameyaStatementTone } from './use-jameya-member-statement';
import { JameyaPdfTenant } from './use-jameya-pdf-share';

const TONE_COLORS: Record<JameyaStatementTone, string> = {
  success: PDF_COLORS.success,
  danger: PDF_COLORS.danger,
  muted: PDF_COLORS.ink,
};

const COLUMN_WIDTHS = { turn: '10%', date: '20%', due: '22%', paid: '22%', status: '26%' } as const;

export function JameyaMemberStatementPdf({
  locale,
  content,
  tenant,
}: {
  locale: PdfLocale;
  content: JameyaStatementContent;
  tenant: JameyaPdfTenant;
}) {
  const isRtl = locale === 'ar';
  const accent = BRAND_COLOR_VALUES[tenant.brandColor];
  const align = isRtl ? 'right' : 'left';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const s = (text: string) => sanitizeForPdfFont(text);
  const fontOf = (text: string) => ({ fontFamily: pdfFontForText(text, locale) });
  const money = (minorUnits: number, color: string = PDF_COLORS.ink) => {
    const { amount, currency } = splitMoneyParts(minorUnits, locale);
    const amountText = (
      <Text key="amount" style={{ fontFamily: PDF_LATIN_FONT, color }}>
        {amount}
      </Text>
    );
    const currencyText = (
      <Text key="currency" style={{ color }}>
        {s(currency)}
      </Text>
    );
    return (
      <View style={{ flexDirection: rowDirection, gap: 3 }}>
        {isRtl ? [amountText, currencyText] : [currencyText, amountText]}
      </View>
    );
  };

  const styles = StyleSheet.create({
    page: {
      fontFamily: pdfFontFamily(locale),
      fontSize: 11,
      color: PDF_COLORS.ink,
      backgroundColor: PDF_COLORS.paper,
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
    },
    header: {
      flexDirection: rowDirection,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: accent,
    },
    headerBrand: { flexDirection: rowDirection, alignItems: 'center', gap: 10, flexShrink: 1 },
    logo: { width: 40, height: 40, borderRadius: 6, objectFit: 'cover' },
    tenantName: { fontSize: 18, fontWeight: 700, textAlign: align },
    tenantPhone: { fontSize: 11, color: PDF_COLORS.muted, marginTop: 2, textAlign: align },
    docLabel: { fontSize: 11, color: PDF_COLORS.muted, letterSpacing: isRtl ? 0 : 1.5 },
    title: { fontSize: 22, fontWeight: 700, textAlign: align, marginTop: 20, marginBottom: 2 },
    issuedOn: { fontSize: 11, color: PDF_COLORS.muted, textAlign: align, marginBottom: 16 },
    details: { borderWidth: 1, borderColor: PDF_COLORS.border, borderRadius: 8, padding: 12, gap: 6, marginBottom: 14 },
    detailRow: { flexDirection: rowDirection, justifyContent: 'space-between', gap: 12 },
    detailLabel: { color: PDF_COLORS.muted },
    detailValue: { fontWeight: 600, textAlign: isRtl ? 'left' : 'right' },
    totals: { flexDirection: rowDirection, gap: 8, marginBottom: 16 },
    total: {
      flexGrow: 1,
      flexBasis: 0,
      borderWidth: 1,
      borderColor: PDF_COLORS.border,
      borderRadius: 8,
      backgroundColor: PDF_COLORS.panel,
      padding: 10,
    },
    totalLabel: { fontSize: 10, color: PDF_COLORS.muted, textAlign: align, marginBottom: 4 },
    totalValue: { fontSize: 13, fontWeight: 700, textAlign: align },
    table: { borderWidth: 1, borderColor: PDF_COLORS.border, borderRadius: 8 },
    tableRow: { flexDirection: rowDirection, borderTopWidth: 1, borderTopColor: PDF_COLORS.border },
    tableHead: { flexDirection: rowDirection, backgroundColor: PDF_COLORS.panel },
    cell: { paddingVertical: 6, paddingHorizontal: 6, textAlign: align },
    headCell: { paddingVertical: 6, paddingHorizontal: 6, textAlign: align, color: PDF_COLORS.muted, fontSize: 10 },
    ownTurn: { fontSize: 9, color: accent },
    footer: {
      position: 'absolute',
      bottom: 28,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: PDF_COLORS.border,
      paddingTop: 10,
      flexDirection: rowDirection,
      justifyContent: 'center',
      gap: 4,
    },
    footerText: { fontSize: 10, color: PDF_COLORS.muted },
  });

  const columns = [
    { key: 'turn', width: COLUMN_WIDTHS.turn },
    { key: 'date', width: COLUMN_WIDTHS.date },
    { key: 'due', width: COLUMN_WIDTHS.due },
    { key: 'paid', width: COLUMN_WIDTHS.paid },
    { key: 'status', width: COLUMN_WIDTHS.status },
  ] as const;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            {tenant.logoUrl && <Image src={tenant.logoUrl} style={styles.logo} />}
            <View>
              <Text style={[styles.tenantName, fontOf(tenant.displayName)]}>{s(tenant.displayName)}</Text>
              {tenant.phone && <Text style={styles.tenantPhone}>{s(tenant.phone)}</Text>}
            </View>
          </View>
          <Text style={styles.docLabel}>{s(content.documentLabel)}</Text>
        </View>

        <Text style={styles.title}>{s(content.title)}</Text>
        <Text style={styles.issuedOn}>{s(content.issuedOn)}</Text>

        <View style={styles.details}>
          {content.details.map((detail) => (
            <View key={detail.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{s(detail.label)}</Text>
              <Text style={[styles.detailValue, fontOf(detail.value)]}>{s(detail.value)}</Text>
            </View>
          ))}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{s(content.perTurn.label)}</Text>
            <View style={styles.detailValue}>{money(content.perTurn.amount)}</View>
          </View>
        </View>

        <View style={styles.totals}>
          {content.totals.map((total) => (
            <View key={total.label} style={styles.total}>
              <Text style={styles.totalLabel}>{s(total.label)}</Text>
              <View style={styles.totalValue}>{money(total.amount, TONE_COLORS[total.tone])}</View>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead} fixed>
            {columns.map((column) => (
              <Text key={column.key} style={[styles.headCell, { width: column.width }]}>
                {s(content.columns[column.key])}
              </Text>
            ))}
          </View>
          {content.rows.map((row) => (
            <View key={row.key} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.turn }]}>{row.turn}</Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.date }]}>{row.date}</Text>
              <View style={[styles.cell, { width: COLUMN_WIDTHS.due }]}>{money(row.due)}</View>
              <View style={[styles.cell, { width: COLUMN_WIDTHS.paid }]}>{money(row.paid)}</View>
              <View style={[styles.cell, { width: COLUMN_WIDTHS.status }]}>
                <Text style={{ color: TONE_COLORS[row.tone], textAlign: align }}>{s(row.status)}</Text>
                {row.isOwnTurn && <Text style={[styles.ownTurn, { textAlign: align }]}>{s(content.ownTurnLabel)}</Text>}
              </View>
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
