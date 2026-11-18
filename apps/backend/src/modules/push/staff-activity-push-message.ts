import { NotificationLanguage } from '@prisma/client';
import { PushContent } from './push.types';

type ActivityLabel = Record<NotificationLanguage, string>;

export const STAFF_ACTIVITY_LABELS: Record<string, ActivityLabel> = {
  'announcement.send': { EN: 'Sent announcement', AR: 'أرسل إعلانًا' },
  'auth.2fa_disable': { EN: 'Disabled two-factor authentication', AR: 'أوقف التحقق بخطوتين' },
  'auth.2fa_enable': { EN: 'Enabled two-factor authentication', AR: 'فعّل التحقق بخطوتين' },
  'contract.cancel': { EN: 'Cancelled contract', AR: 'ألغى عقدًا' },
  'contract.create': { EN: 'Created contract', AR: 'أنشأ عقدًا' },
  'contract.updateTag': { EN: 'Updated contract tag', AR: 'عدّل وسم العقد' },
  'counterparty.adjustment.create': { EN: 'Adjusted contact balance', AR: 'عدّل رصيد جهة اتصال' },
  'counterparty.create': { EN: 'Added contact', AR: 'أضاف جهة اتصال' },
  'counterparty.delete': { EN: 'Deleted contact', AR: 'حذف جهة اتصال' },
  'counterparty.update': { EN: 'Updated contact', AR: 'عدّل جهة اتصال' },
  'customer.create': { EN: 'Created customer', AR: 'أنشأ عميلًا' },
  'customer.delete': { EN: 'Deleted customer', AR: 'حذف عميلًا' },
  'customer.update': { EN: 'Updated customer', AR: 'عدّل بيانات عميل' },
  'jameya.create': { EN: 'Created jameya', AR: 'أنشأ جمعية' },
  'jameya.update': { EN: 'Updated jameya', AR: 'عدّل جمعية' },
  'jameyaPayment.create': { EN: 'Recorded jameya payment', AR: 'سجّل دفعة جمعية' },
  'jameyaPayout.create': { EN: 'Handed over jameya payout', AR: 'سلّم قبض جمعية' },
  'offer.create': { EN: 'Created offer', AR: 'أنشأ عرضًا' },
  'offer.delete': { EN: 'Deleted offer', AR: 'حذف عرضًا' },
  'offer.set_visibility': { EN: 'Changed offers visibility', AR: 'غيّر ظهور العروض' },
  'offer.update': { EN: 'Updated offer', AR: 'عدّل عرضًا' },
  'payment.create': { EN: 'Recorded payment', AR: 'سجّل دفعة' },
  'paymentClaim.approve': { EN: 'Approved payment claim', AR: 'وافق على مطالبة دفع' },
  'paymentClaim.decline': { EN: 'Declined payment claim', AR: 'رفض مطالبة دفع' },
  'paymentMethod.create': { EN: 'Added payment method', AR: 'أضاف وسيلة دفع' },
  'paymentMethod.delete': { EN: 'Deleted payment method', AR: 'حذف وسيلة دفع' },
  'paymentMethod.update': { EN: 'Updated payment method', AR: 'عدّل وسيلة دفع' },
  'paymentMethodTransaction.create': { EN: 'Logged wallet transaction', AR: 'سجّل معاملة محفظة' },
  'settings.branding.about_image_upload': { EN: 'Uploaded shop image', AR: 'رفع صورة المتجر' },
  'settings.branding.logo_remove': { EN: 'Removed logo', AR: 'أزال الشعار' },
  'settings.branding.logo_upload': { EN: 'Uploaded logo', AR: 'رفع شعارًا' },
  'settings.branding.update': { EN: 'Updated branding', AR: 'عدّل الهوية البصرية' },
  'settings.notifications.disconnect': { EN: 'Disconnected Telegram', AR: 'فصل تيليجرام' },
  'settings.notifications.set_language': { EN: 'Changed reminder language', AR: 'غيّر لغة التذكيرات' },
  'settings.notifications.set_telegram_public_visibility': {
    EN: 'Changed Telegram visibility on customer pages',
    AR: 'غيّر ظهور تيليجرام في صفحات العملاء',
  },
  'settings.notifications.update': { EN: 'Updated notification settings', AR: 'عدّل إعدادات الإشعارات' },
  'settings.notifications.update_reminder_message': { EN: 'Updated reminder message', AR: 'عدّل رسالة التذكير' },
  'staff.create': { EN: 'Added staff account', AR: 'أضاف حساب موظف' },
  'staff.update_status': { EN: 'Updated staff account', AR: 'عدّل حساب موظف' },
  'staff.update_wallet_access': { EN: 'Changed staff wallet access', AR: 'غيّر صلاحية المحافظ لموظف' },
};

const FALLBACK_LABEL: ActivityLabel = { EN: 'Made a change', AR: 'عمل تعديل' };

const TITLE: ActivityLabel = { EN: 'Staff activity', AR: 'نشاط الموظفين' };

export function buildStaffActivityPushContent(
  staffName: string,
  action: string,
  language: NotificationLanguage,
): PushContent {
  const label = STAFF_ACTIVITY_LABELS[action] ?? FALLBACK_LABEL;
  return { title: TITLE[language], body: `${staffName}: ${label[language]}` };
}
