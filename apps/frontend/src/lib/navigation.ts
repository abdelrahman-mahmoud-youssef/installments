import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';
import { routes } from './routes';

export const navigationItems = [
  { labelKey: 'dashboard', href: routes.dashboard, icon: LayoutDashboard },
  { labelKey: 'customers', href: routes.customers, icon: Users },
  { labelKey: 'contracts', href: routes.contracts, icon: FileText },
  { labelKey: 'reports', href: routes.reports, icon: BarChart3 },
] as const;
