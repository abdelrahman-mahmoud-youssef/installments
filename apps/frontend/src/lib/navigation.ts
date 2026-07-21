import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Megaphone,
  Settings,
  History,
  UserCog,
  ReceiptText,
} from 'lucide-react';
import { routes } from './routes';

export const navigationItems = [
  { labelKey: 'dashboard', href: routes.dashboard, icon: LayoutDashboard, adminOnly: false },
  { labelKey: 'customers', href: routes.customers, icon: Users, adminOnly: false },
  { labelKey: 'contracts', href: routes.contracts, icon: FileText, adminOnly: false },
  { labelKey: 'paymentClaims', href: routes.paymentClaims, icon: ReceiptText, adminOnly: false },
  { labelKey: 'reports', href: routes.reports, icon: BarChart3, adminOnly: false },
  { labelKey: 'announcements', href: routes.announcements, icon: Megaphone, adminOnly: false },
  { labelKey: 'staff', href: routes.staff, icon: UserCog, adminOnly: true },
  { labelKey: 'activity', href: routes.activity, icon: History, adminOnly: true },
  { labelKey: 'settings', href: routes.settings, icon: Settings, adminOnly: true },
] as const;
