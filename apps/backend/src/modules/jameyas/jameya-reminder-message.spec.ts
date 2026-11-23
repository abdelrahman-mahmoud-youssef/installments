import { NotificationLanguage } from '@prisma/client';
import { formatDate } from '../reminders/notification-format';
import { formatJameyaReminderMessage, JameyaReminderData, JameyaReminderStatus } from './jameya-reminder-message';

const dueDate = new Date('2026-11-10');

function reminder(status: JameyaReminderStatus): JameyaReminderData {
  return {
    memberName: 'Mona',
    businessName: 'Acme Shop',
    jameyaName: 'Family circle',
    amountDue: 150_000,
    dueDate,
    status,
  };
}

describe('formatJameyaReminderMessage', () => {
  it('writes a late English reminder with the amount and the date it was due', () => {
    const money = 'EGP 1,500';
    const date = formatDate(dueDate, NotificationLanguage.EN);

    expect(formatJameyaReminderMessage(reminder(JameyaReminderStatus.LATE), NotificationLanguage.EN)).toBe(
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

  it('writes a reminder for a payment past its date but inside the grace days as due since that date', () => {
    const money = 'EGP 1,500';
    const date = formatDate(dueDate, NotificationLanguage.EN);
    const english = formatJameyaReminderMessage(reminder(JameyaReminderStatus.DUE), NotificationLanguage.EN);
    const arabic = formatJameyaReminderMessage(reminder(JameyaReminderStatus.DUE), NotificationLanguage.AR);

    expect(english).toContain(`⏳ Your payment of ${money} has been due since ${date}.`);
    expect(english).not.toMatch(/late|next payment/);
    expect(arabic).toContain(
      `⏳ ميعاد دفعتك كان يوم ${formatDate(dueDate, NotificationLanguage.AR)}: ${'١٬٥٠٠ ج.م'}`,
    );
    expect(arabic).not.toMatch(/متأخرة|الجاية/);
  });

  it('writes an upcoming English reminder without calling it late', () => {
    const message = formatJameyaReminderMessage(reminder(JameyaReminderStatus.UPCOMING), NotificationLanguage.EN);

    const money = 'EGP 1,500';
    const date = formatDate(dueDate, NotificationLanguage.EN);

    expect(message).toContain(`📅 Your next payment of ${money} is due ${date}.`);
    expect(message).not.toContain('late');
  });

  it('writes a late Arabic reminder', () => {
    const money = '١٬٥٠٠ ج.م';
    const date = formatDate(dueDate, NotificationLanguage.AR);

    expect(formatJameyaReminderMessage(reminder(JameyaReminderStatus.LATE), NotificationLanguage.AR)).toBe(
      [
        'مرحباً Mona 👋',
        'معاك Acme Shop بخصوص جمعية "Family circle".',
        '',
        `⏰ عليك دفعة متأخرة: ${money} (كان ميعادها ${date})`,
        '',
        'لو حضرتك دفعت بالفعل، تجاهل الرسالة دي وسامحنا على الإزعاج 🙏',
      ].join('\n'),
    );
  });

  it('writes an upcoming Arabic reminder without calling it late', () => {
    const message = formatJameyaReminderMessage(reminder(JameyaReminderStatus.UPCOMING), NotificationLanguage.AR);

    const money = '١٬٥٠٠ ج.م';
    const date = formatDate(dueDate, NotificationLanguage.AR);

    expect(message).toContain(`📅 دفعتك الجاية: ${money} ميعادها ${date}`);
    expect(message).not.toContain('متأخرة');
  });
});
