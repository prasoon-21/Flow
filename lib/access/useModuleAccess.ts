import { trpc } from '@/lib/trpc/client';
import type { ModuleKey } from '@/lib/types/tenant';

export function useModuleAccess(moduleKey: ModuleKey) {
  const userQuery = trpc.user.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const modules = userQuery.data?.modules ?? [];
  const allowed = modules.includes(moduleKey);
  const loading = userQuery.isLoading;

  return {
    allowed,
    loading,
    denied: !loading && !allowed,
  };
}
