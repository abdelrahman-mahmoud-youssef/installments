import { NotificationLanguage } from '@prisma/client';
import { formatDate, formatMoney } from '../reminders/notification-format';
import { formatJameyaReminderMessage, JameyaReminderData } from './jameya-reminder-message';

const dueDate = new Date('2026-11-10');

function reminder(isLate: boolean): JameyaReminderData {
  return {
    memberName: 'Mona',
    businessName: 'Acme Shop',
    jameyaName: 'Family circle',
    amountDue: 150_000,
    dueDate,
    isLate,
  };
}

describe('formatJameyaReminderMessage', () => {
  it('writes a late English reminder with the amount and the date it was due', () => {
    const money = formatMoney(150_000, NotificationLanguage.EN);
    const date = formatDate(dueDate, NotificationLanguage.EN);

    expect(formatJameyaReminderMessage(reminder(true), NotificationLanguage.EN)).toBe(
      [
        'Hi Mona 👋',
        'This is Acme Shop about your "Family circle" jameya.',
        '',
        `⏰ Your payment of ${money} is late (it was due ${date}).`,
        '',
        "If you've already paid, please ignore this message 🙏",
      ].join('\n'),
    );
  });

  it('writes an upcoming English reminder without calling it late', () => {
    const message = formatJameyaReminderMessage(reminder(false), NotificationLanguage.EN);

    const money = formatMoney(150_000, NotificationLanguage.EN);
    const date = formatDate(dueDate, NotificationLanguage.EN);

    expect(message).toContain(`📅 Your next payment of ${money} is due ${date}.`);
    expect(message).not.toContain('late');
  });

  it('writes a late Arabic reminder', () => {
    const money = formatMoney(150_000, NotificationLanguage.AR);
    const date = formatDate(dueDate, NotificationLanguage.AR);

    expect(formatJameyaReminderMessage(reminder(true), NotificationLanguage.AR)).toBe(
      [
        'مرحباً Mona 👋',
        'معاك Acme Shop بخصوص جمعية "Family circle".',
        '',
        `⏰ عليك دفعة متأخرة: ${money} (كانت مستحقة ${date})`,
        '',
        'لو حضرتك دفعت بالفعل، تجاهل الرسالة دي وسامحنا على الإزعاج 🙏',
      ].join('\n'),
    );
  });

  it('writes an upcoming Arabic reminder without calling it late', () => {
    const message = formatJameyaReminderMessage(reminder(false), NotificationLanguage.AR);

    const money = formatMoney(150_000, NotificationLanguage.AR);
    const date = formatDate(dueDate, NotificationLanguage.AR);

    expect(message).toContain(`📅 دفعتك الجاية: ${money} مستحقة ${date}`);
    expect(message).not.toContain('متأخرة');
  });
});
