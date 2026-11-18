import {
  LayoutDashboard,
  Users,
  FileText,
  HandCoins,
  BarChart3,
  Megaphone,
  Settings,
  History,
  UserCog,
  ReceiptText,
  Sparkles,
  Wallet,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { routes } from './routes';

export type NavigationAudience = 'everyone' | 'admins' | 'walletViewers' | 'jameyaUsers';

interface NavigationItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  audience: NavigationAudience;
}

export const navigationItems = [
  { labelKey: 'dashboard', href: routes.dashboard, icon: LayoutDashboard, audience: 'everyone' },
  { labelKey: 'customers', href: routes.customers, icon: Users, audience: 'everyone' },
  { labelKey: 'contracts', href: routes.contracts, icon: FileText, audience: 'everyone' },
  { labelKey: 'jameyas', href: routes.jameyas, icon: HandCoins, audience: 'jameyaUsers' },
  { labelKey: 'paymentClaims', href: routes.paymentClaims, icon: ReceiptText, audience: 'everyone' },
  { labelKey: 'reports', href: routes.reports, icon: BarChart3, audience: 'everyone' },
  { labelKey: 'announcements', href: routes.announcements, icon: Megaphone, audience: 'everyone' },
  { labelKey: 'offers', href: routes.offers, icon: Sparkles, audience: 'admins' },
  { labelKey: 'paymentMethods', href: routes.paymentMethods, icon: Wallet, audience: 'walletViewers' },
  { labelKey: 'staff', href: routes.staff, icon: UserCog, audience: 'admins' },
  { labelKey: 'activity', href: routes.activity, icon: History, audience: 'admins' },
  { labelKey: 'settings', href: routes.settings, icon: Settings, audience: 'admins' },
  { labelKey: 'support', href: routes.support, icon: LifeBuoy, audience: 'everyone' },
] as const satisfies readonly NavigationItem[];
