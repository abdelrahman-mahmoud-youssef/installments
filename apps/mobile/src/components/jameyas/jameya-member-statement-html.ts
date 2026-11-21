import { DOCUMENT_COLORS, escapeHtml, STATEMENT_PAGE_SIZE } from '@/components/contacts/contact-statement-html';
import { STATEMENT_FONT_FAMILIES } from '@/components/contacts/statement-fonts';

export type JameyaStatementTone = 'success' | 'danger' | 'muted';

export interface JameyaStatementFigure {
  label: string;
  value: string;
  tone: JameyaStatementTone;
}

export interface JameyaStatementRow {
  turn: string;
  date: string;
  due: string;
  paid: string;
  status: string;
  tone: JameyaStatementTone;
  isOwnTurn: boolean;
}

export interface JameyaStatementDocument {
  isRTL: boolean;
  fontFaces: string;
  documentLabel: string;
  title: string;
  issuedOn: string;
  details: { label: string; value: string }[];
  totals: JameyaStatementFigure[];
  columns: { turn: string; date: string; due: string; paid: string; status: string };
  rows: JameyaStatementRow[];
  ownTurnLabel: string;
  footerPrefix: string;
  shop: { name: string; phone: string | null; logoUrl: string | null; accentColor: string };
}

const TONE_COLORS: Record<JameyaStatementTone, string> = {
  success: DOCUMENT_COLORS.success,
  danger: DOCUMENT_COLORS.danger,
  muted: DOCUMENT_COLORS.ink,
};

function detailRow({ label, value }: { label: string; value: string }): string {
  return `<div class="detail-row"><span class="muted">${escapeHtml(label)}</span><span class="strong">${escapeHtml(value)}</span></div>`;
}

function totalBox({ label, value, tone }: JameyaStatementFigure): string {
  return `<div class="total"><div class="total-label">${escapeHtml(label)}</div><div class="total-value" style="color:${TONE_COLORS[tone]}">${escapeHtml(value)}</div></div>`;
}

function tableRow(row: JameyaStatementRow, ownTurnLabel: string): string {
  const ownTurn = row.isOwnTurn ? `<div class="own-turn">${escapeHtml(ownTurnLabel)}</div>` : '';
  return `<tr><td>${escapeHtml(row.turn)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.due)}</td><td>${escapeHtml(row.paid)}</td><td><span style="color:${TONE_COLORS[row.tone]}">${escapeHtml(row.status)}</span>${ownTurn}</td></tr>`;
}

export function buildJameyaMemberStatementHtml(statement: JameyaStatementDocument): string {
  const { isRTL, shop, columns } = statement;
  const pageFont = isRTL ? STATEMENT_FONT_FAMILIES.arabic : STATEMENT_FONT_FAMILIES.latin;
  const logo = shop.logoUrl ? `<img class="logo" src="${escapeHtml(shop.logoUrl)}" />` : '';
  const shopPhone = shop.phone ? `<div class="muted small">${escapeHtml(shop.phone)}</div>` : '';

  return `<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<style>
  ${statement.fontFaces}
  @page { size: ${STATEMENT_PAGE_SIZE.width}px ${STATEMENT_PAGE_SIZE.height}px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; background: ${DOCUMENT_COLORS.paper}; -webkit-print-color-adjust: exact; }
  .page { width: ${STATEMENT_PAGE_SIZE.width}px; margin: 0 auto; padding: 40px 40px 60px; font-family: '${pageFont}'; font-size: 11px; color: ${DOCUMENT_COLORS.ink}; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid ${shop.accentColor}; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
  .shop-name { font-size: 18px; font-weight: 700; }
  .muted { color: ${DOCUMENT_COLORS.muted}; }
  .small { font-size: 11px; }
  .strong { font-weight: 600; text-align: end; unicode-bidi: plaintext; }
  .title { font-size: 22px; font-weight: 700; margin-top: 20px; margin-bottom: 2px; }
  .issued-on { margin-bottom: 16px; }
  .details { display: flex; flex-direction: column; gap: 6px; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
  .detail-row { display: flex; justify-content: space-between; gap: 12px; }
  .totals { display: flex; gap: 8px; margin-bottom: 16px; }
  .total { flex: 1; border: 1px solid ${DOCUMENT_COLORS.border}; border-radius: 8px; background: ${DOCUMENT_COLORS.panel}; padding: 10px; }
  .total-label { font-size: 10px; color: ${DOCUMENT_COLORS.muted}; margin-bottom: 4px; }
  .total-value { font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; border: 1px solid ${DOCUMENT_COLORS.border}; }
  thead { display: table-header-group; }
  th { background: ${DOCUMENT_COLORS.panel}; color: ${DOCUMENT_COLORS.muted}; font-size: 10px; font-weight: 400; text-align: start; padding: 6px; }
  td { border-top: 1px solid ${DOCUMENT_COLORS.border}; padding: 6px; text-align: start; }
  tr { page-break-inside: avoid; }
  .own-turn { font-size: 9px; color: ${shop.accentColor}; }
  .footer { margin-top: 24px; display: flex; justify-content: center; gap: 4px; border-top: 1px solid ${DOCUMENT_COLORS.border}; padding-top: 10px; font-size: 10px; color: ${DOCUMENT_COLORS.muted}; }
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
    <div class="muted">${escapeHtml(statement.documentLabel)}</div>
  </div>
  <div class="title">${escapeHtml(statement.title)}</div>
  <div class="issued-on muted">${escapeHtml(statement.issuedOn)}</div>
  <div class="details">
    ${statement.details.map(detailRow).join('\n    ')}
  </div>
  <div class="totals">
    ${statement.totals.map(totalBox).join('\n    ')}
  </div>
  <table>
    <thead><tr><th>${escapeHtml(columns.turn)}</th><th>${escapeHtml(columns.date)}</th><th>${escapeHtml(columns.due)}</th><th>${escapeHtml(columns.paid)}</th><th>${escapeHtml(columns.status)}</th></tr></thead>
    <tbody>
    ${statement.rows.map((row) => tableRow(row, statement.ownTurnLabel)).join('\n    ')}
    </tbody>
  </table>
  <div class="footer">
    <span>${escapeHtml(statement.footerPrefix)}</span>
    <span>${escapeHtml(shop.name)}</span>
  </div>
</div>
</body>
</html>`;
}
