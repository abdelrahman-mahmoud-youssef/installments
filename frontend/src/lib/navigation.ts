import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';
import { routes } from './routes';

export const navigationItems = [
  { label: 'Dashboard', href: routes.dashboard, icon: LayoutDashboard },
  { label: 'Customers', href: routes.customers, icon: Users },
  { label: 'Contracts', href: routes.contracts, icon: FileText },
  { label: 'Reports', href: routes.reports, icon: BarChart3 },
] as const;
