import { NotificationLanguage } from '@prisma/client';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildStaffActivityPushContent, STAFF_ACTIVITY_LABELS } from './staff-activity-push-message';

const AUDIT_DECORATOR_PATTERN = /@Audit\('([^']+)'/g;
const SOURCE_ROOT = join(__dirname, '..', '..');

function auditedActions(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return auditedActions(path);
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.spec.ts')) {
      return [];
    }
    return Array.from(readFileSync(path, 'utf8').matchAll(AUDIT_DECORATOR_PATTERN), (match) => match[1]);
  });
}

describe('staff activity push content', () => {
  it('names the staff member and the action in English', () => {
    expect(buildStaffActivityPushContent('Ahmed', 'payment.create', NotificationLanguage.EN)).toEqual({
      title: 'Staff activity',
      body: 'Ahmed: Recorded payment',
    });
  });

  it('names the staff member and the action in Arabic', () => {
    expect(buildStaffActivityPushContent('أحمد', 'payment.create', NotificationLanguage.AR)).toEqual({
      title: 'نشاط الموظفين',
      body: 'أحمد: سجّل دفعة',
    });
  });

  it('falls back to a general message for an unknown action', () => {
    expect(buildStaffActivityPushContent('Ahmed', 'something.new', NotificationLanguage.EN).body).toBe(
      'Ahmed: Made a change',
    );
  });

  it('has wording for every audited action in the codebase', () => {
    const missing = [...new Set(auditedActions(SOURCE_ROOT))].filter((action) => !(action in STAFF_ACTIVITY_LABELS));

    expect(missing).toEqual([]);
  });
});
