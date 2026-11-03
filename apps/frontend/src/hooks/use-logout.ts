import { useRouter } from '@/i18n/navigation';
import { logout } from '@/lib/api/auth';
import { routes } from '@/lib/routes';

export function useLogout(): () => Promise<void> {
  const router = useRouter();

  return async function handleLogout() {
    await logout();
    router.push(routes.login);
    router.refresh();
  };
}
