import type { BalanceStatus } from '@/lib/counterparty-balance';

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
  footer: string;
}

export interface ContactStatementDocument {
  isRTL: boolean;
  copy: ContactStatementCopy;
  shop: { name: string; phone: string | null; logoUrl: string | null; accentColor: string };
  contact: { name: string; phone: string | null };
  balance: { status: BalanceStatus; amount: string; inWords: string };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function ltr(text: string): string {
  return `<bdi dir="ltr">${escapeHtml(text)}</bdi>`;
}

function metaRow(label: string, valueHtml: string): string {
  return `<div class="meta-row"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${valueHtml}</span></div>`;
}

export function buildContactStatementHtml({ isRTL, copy, shop, contact, balance }: ContactStatementDocument): string {
  const logo = shop.logoUrl ? `<img class="logo" src="${escapeHtml(shop.logoUrl)}" />` : '';
  const shopPhone = shop.phone ? `<div class="shop-phone">${ltr(shop.phone)}</div>` : '';
  const contactPhone = contact.phone ? metaRow(copy.phoneLabel, ltr(contact.phone)) : '';

  return `<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 48px 44px 64px; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'SF Arabic', 'Helvetica Neue', Roboto, sans-serif; font-size: 14px; color: ${DOCUMENT_COLORS.ink}; background: ${DOCUMENT_COLORS.paper}; }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 20px; border-bottom: 2px solid ${shop.accentColor}; }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
  .shop-name { font-size: 21px; font-weight: 700; }
  .shop-phone { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 2px; }
  .doc-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; letter-spacing: 1.5px; white-space: nowrap; }
  .title { font-size: 28px; font-weight: 700; margin: 28px 0 4px; }
  .generated-on { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 24px; }
  .meta { border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .meta-row { display: flex; justify-content: space-between; gap: 12px; }
  .meta-row + .meta-row { margin-top: 8px; }
  .meta-label { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; }
  .meta-value { font-size: 14px; font-weight: 600; }
  .balance { text-align: center; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 10px; background: ${DOCUMENT_COLORS.panel}; padding: 28px 20px; }
  .balance-label { font-size: 14px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 8px; }
  .balance-value { font-size: 42px; font-weight: 700; color: ${BALANCE_COLORS[balance.status]}; }
  .balance-hint { font-size: 14px; color: ${DOCUMENT_COLORS.muted}; margin-top: 8px; }
  .in-words { font-size: 13px; color: ${DOCUMENT_COLORS.muted}; margin-top: 4px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid ${DOCUMENT_COLORS.border}; padding-top: 12px; text-align: center; font-size: 11px; color: ${DOCUMENT_COLORS.muted}; }
</style>
</head>
<body>
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
    ${metaRow(copy.contactLabel, escapeHtml(contact.name))}
    ${contactPhone}
  </div>
  <div class="balance">
    <div class="balance-label">${escapeHtml(copy.balanceLabel)}</div>
    <div class="balance-value">${escapeHtml(balance.amount)}</div>
    <div class="balance-hint">${escapeHtml(copy.balanceHint)}</div>
    <div class="in-words">${escapeHtml(balance.inWords)}</div>
  </div>
  <div class="footer">${escapeHtml(copy.footer)}</div>
</body>
</html>`;
}
