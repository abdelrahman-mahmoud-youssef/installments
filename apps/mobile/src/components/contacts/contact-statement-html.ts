import type { BalanceStatus } from '@/lib/counterparty-balance';
import { STATEMENT_FONT_FAMILIES } from './statement-fonts';

export const STATEMENT_PAGE_SIZE = { width: 595, height: 842 } as const;

const DOCUMENT_COLORS = {
  ink: '#1c2333',
  muted: '#6b7280',
  border: '#e2e4ea',
  paper: '#ffffff',
  panel: '#f7f7f9',
  success: '#1f8a57',
  danger: '#c0392b',
};

const BALANCE_COLORS: Record<BalanceStatus, string> = {
  theyOwe: DOCUMENT_COLORS.danger,
  youOwe: DOCUMENT_COLORS.success,
  settled: DOCUMENT_COLORS.ink,
};

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export interface ContactStatementCopy {
  documentLabel: string;
  title: string;
  generatedOn: string;
  contactLabel: string;
  phoneLabel: string;
  balanceLabel: string;
  balanceHint: string;
  footerPrefix: string;
}

export interface ContactStatementDocument {
  isRTL: boolean;
  fontFaces: string;
  copy: ContactStatementCopy;
  shop: { name: string; phone: string | null; logoUrl: string | null; accentColor: string };
  contact: { name: string; phone: string | null };
  balance: { status: BalanceStatus; currency: string; amount: string; inWords: string };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function metaRow(label: string, value: string): string {
  return `<div class="meta-row"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(value)}</span></div>`;
}

export function buildContactStatementHtml({
  isRTL,
  fontFaces,
  copy,
  shop,
  contact,
  balance,
}: ContactStatementDocument): string {
  const pageFont = isRTL ? STATEMENT_FONT_FAMILIES.arabic : STATEMENT_FONT_FAMILIES.latin;
  const balanceColor = BALANCE_COLORS[balance.status];
  const logo = shop.logoUrl ? `<img class="logo" src="${escapeHtml(shop.logoUrl)}" />` : '';
  const shopPhone = shop.phone ? `<div class="shop-phone">${escapeHtml(shop.phone)}</div>` : '';
  const contactPhone = contact.phone ? metaRow(copy.phoneLabel, contact.phone) : '';

  return `<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<style>
  ${fontFaces}
  @page { size: ${STATEMENT_PAGE_SIZE.width}px ${STATEMENT_PAGE_SIZE.height}px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${STATEMENT_PAGE_SIZE.width}px; height: ${STATEMENT_PAGE_SIZE.height}px; background: ${DOCUMENT_COLORS.paper}; -webkit-print-color-adjust: exact; }
  .page { position: relative; width: ${STATEMENT_PAGE_SIZE.width}px; height: ${STATEMENT_PAGE_SIZE.height}px; padding: 48px 44px 64px; font-family: '${pageFont}'; font-size: 14px; color: ${DOCUMENT_COLORS.ink}; overflow: hidden; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid ${shop.accentColor}; }
  .brand { display: flex; align-items: center; gap: 12px; flex-shrink: 1; min-width: 0; }
  .logo { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
  .shop-name { font-size: 21px; font-weight: 700; }
  .shop-phone { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 2px; }
  .doc-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; flex-shrink: 0; ${isRTL ? '' : 'letter-spacing: 1.5px;'} }
  .title { font-size: 28px; font-weight: 700; margin-top: 28px; margin-bottom: 4px; }
  .generated-on { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 24px; }
  .meta { display: flex; flex-direction: column; gap: 8px; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .meta-row { display: flex; justify-content: space-between; }
  .meta-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; }
  .meta-value { font-size: 14px; font-weight: 600; }
  .balance { display: flex; flex-direction: column; align-items: center; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 10px; background: ${DOCUMENT_COLORS.panel}; padding: 28px 20px; margin-bottom: 28px; }
  .balance-label { font-size: 14px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 8px; }
  .balance-value-row { display: flex; align-items: baseline; gap: 6px; color: ${balanceColor}; font-weight: 700; }
  .balance-currency { font-size: 20px; }
  .balance-amount { font-size: 42px; font-family: '${STATEMENT_FONT_FAMILIES.latin}'; direction: ltr; }
  .balance-hint { font-size: 14px; color: ${DOCUMENT_COLORS.muted}; margin-top: 8px; }
  .in-words { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 4px; text-align: center; }
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
    <div class="doc-label">${escapeHtml(copy.documentLabel)}</div>
  </div>
  <div class="title">${escapeHtml(copy.title)}</div>
  <div class="generated-on">${escapeHtml(copy.generatedOn)}</div>
  <div class="meta">
    ${metaRow(copy.contactLabel, contact.name)}
    ${contactPhone}
  </div>
  <div class="balance">
    <div class="balance-label">${escapeHtml(copy.balanceLabel)}</div>
    <div class="balance-value-row">
      <span class="balance-currency">${escapeHtml(balance.currency)}</span>
      <span class="balance-amount">${escapeHtml(balance.amount)}</span>
    </div>
    <div class="balance-hint">${escapeHtml(copy.balanceHint)}</div>
    <div class="in-words">${escapeHtml(balance.inWords)}</div>
  </div>
  <div class="footer">
    <span>${escapeHtml(copy.footerPrefix)}</span>
    <span>${escapeHtml(shop.name)}</span>
  </div>
</div>
</body>
</html>`;
}
