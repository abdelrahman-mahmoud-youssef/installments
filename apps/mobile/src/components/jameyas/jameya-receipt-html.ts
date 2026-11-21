import { DOCUMENT_COLORS, escapeHtml, STATEMENT_PAGE_SIZE } from '@/components/contacts/contact-statement-html';
import { STATEMENT_FONT_FAMILIES } from '@/components/contacts/statement-fonts';

export interface JameyaReceiptRow {
  label: string;
  value: string;
}

export interface JameyaReceiptDocument {
  isRTL: boolean;
  fontFaces: string;
  documentLabel: string;
  title: string;
  issuedOn: string;
  amountLabel: string;
  amount: { currency: string; value: string; inWords: string };
  rows: JameyaReceiptRow[];
  footerPrefix: string;
  shop: { name: string; phone: string | null; logoUrl: string | null; accentColor: string };
}

function metaRow({ label, value }: JameyaReceiptRow): string {
  return `<div class="meta-row"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(value)}</span></div>`;
}

export function buildJameyaReceiptHtml(receipt: JameyaReceiptDocument): string {
  const { isRTL, shop } = receipt;
  const pageFont = isRTL ? STATEMENT_FONT_FAMILIES.arabic : STATEMENT_FONT_FAMILIES.latin;
  const logo = shop.logoUrl ? `<img class="logo" src="${escapeHtml(shop.logoUrl)}" />` : '';
  const shopPhone = shop.phone ? `<div class="shop-phone">${escapeHtml(shop.phone)}</div>` : '';

  return `<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<style>
  ${receipt.fontFaces}
  @page { size: ${STATEMENT_PAGE_SIZE.width}px ${STATEMENT_PAGE_SIZE.height}px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; min-width: ${STATEMENT_PAGE_SIZE.width}px; height: ${STATEMENT_PAGE_SIZE.height}px; background: ${DOCUMENT_COLORS.paper}; -webkit-print-color-adjust: exact; }
  .page { position: relative; margin: 0 auto; width: ${STATEMENT_PAGE_SIZE.width}px; height: ${STATEMENT_PAGE_SIZE.height}px; padding: 48px 44px 64px; font-family: '${pageFont}'; font-size: 14px; color: ${DOCUMENT_COLORS.ink}; overflow: hidden; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid ${shop.accentColor}; }
  .brand { display: flex; align-items: center; gap: 12px; flex-shrink: 1; min-width: 0; }
  .logo { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
  .shop-name { font-size: 21px; font-weight: 700; }
  .shop-phone { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 2px; }
  .doc-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; flex-shrink: 0; ${isRTL ? '' : 'letter-spacing: 1.5px;'} }
  .title { font-size: 28px; font-weight: 700; margin-top: 28px; margin-bottom: 4px; }
  .issued-on { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 24px; }
  .amount { display: flex; flex-direction: column; align-items: center; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 10px; background: ${DOCUMENT_COLORS.panel}; padding: 24px 20px; margin-bottom: 20px; }
  .amount-label { font-size: 14px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 8px; }
  .amount-value-row { display: flex; align-items: baseline; gap: 6px; color: ${DOCUMENT_COLORS.success}; font-weight: 700; }
  .amount-currency { font-size: 20px; }
  .amount-value { font-size: 40px; font-family: '${STATEMENT_FONT_FAMILIES.latin}'; direction: ltr; }
  .in-words { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 8px; text-align: center; }
  .meta { display: flex; flex-direction: column; gap: 10px; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 8px; padding: 16px; }
  .meta-row { display: flex; justify-content: space-between; gap: 16px; }
  .meta-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; flex-shrink: 0; }
  .meta-value { font-size: 14px; font-weight: 600; text-align: end; unicode-bidi: plaintext; white-space: pre-line; }
  .footer { position: absolute; bottom: 32px; left: 44px; right: 44px; display: flex; justify-content: center; gap: 4px; border-top: 1px solid ${DOCUMENT_COLORS.border}; padding-top: 12px; font-size: 11px; color: ${DOCUMENT_COLORS.muted}; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      ${logo}
      <div>
        <div class="shop-name">${escapeHtml(shop.name)}</div>
        ${shopPhone}
      </div>
    </div>
    <div class="doc-label">${escapeHtml(receipt.documentLabel)}</div>
  </div>
  <div class="title">${escapeHtml(receipt.title)}</div>
  <div class="issued-on">${escapeHtml(receipt.issuedOn)}</div>
  <div class="amount">
    <div class="amount-label">${escapeHtml(receipt.amountLabel)}</div>
    <div class="amount-value-row">
      <span class="amount-currency">${escapeHtml(receipt.amount.currency)}</span>
      <span class="amount-value">${escapeHtml(receipt.amount.value)}</span>
    </div>
    <div class="in-words">${escapeHtml(receipt.amount.inWords)}</div>
  </div>
  <div class="meta">
    ${receipt.rows.map(metaRow).join('\n    ')}
  </div>
  <div class="footer">
    <span>${escapeHtml(receipt.footerPrefix)}</span>
    <span>${escapeHtml(shop.name)}</span>
  </div>
</div>
</body>
</html>`;
}
