const PUSH_ROUTES = { support: '/support', dashboard: '/' } as const;

type PushRouteKey = keyof typeof PUSH_ROUTES;

function isPushRouteKey(value: unknown): value is PushRouteKey {
  return typeof value === 'string' && value in PUSH_ROUTES;
}

export function resolvePushRoute(
  data: Record<string, unknown> | null | undefined,
): (typeof PUSH_ROUTES)[PushRouteKey] | null {
  const route = data?.route;
  return isPushRouteKey(route) ? PUSH_ROUTES[route] : null;
}
