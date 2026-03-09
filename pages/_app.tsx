/**
 * Next.js App Entry Point — Aurika Flow
 */

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { trpc } from '@/lib/trpc/client';
import { ToastProvider } from '@/components/ui/ToastProvider';
import Layout from '@/components/layout/Layout';
import { AccessDeniedCard } from '@/components/ui/AccessDeniedCard';
import type { ModuleKey } from '@/lib/types/tenant';
import 'swagger-ui-react/swagger-ui.css';
import '../styles/globals.css';

const UNGUARDED_ROUTES = new Set<string>(['/login', '/docs', '/__ui']);
const ROUTE_MODULE_MAP: Record<string, ModuleKey[]> = {
  '/': ['dashboard'],
  '/contacts': ['contacts'],
};

function normalizePath(pathname: string) {
  if (!pathname) return '/';
  const base = pathname.split('?')[0] ?? '/';
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1);
  }
  return base;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = normalizePath(router.asPath);
  const isUnguarded = UNGUARDED_ROUTES.has(path) || path.startsWith('/auth');
  const moduleRequirements = ROUTE_MODULE_MAP[path];
  const userQuery = trpc.user.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !isUnguarded,
  });
  const modules = userQuery.data?.modules ?? [];
  const hasModuleAccess = moduleRequirements
    ? moduleRequirements.every((moduleKey) => modules.includes(moduleKey))
    : true;
  const shouldCheckPage = !isUnguarded && !moduleRequirements;
  const pageQuery = trpc.page.getByPath.useQuery(
    { path },
    {
      enabled: shouldCheckPage && Boolean(userQuery.data),
      retry: false,
    }
  );

  const isForbidden = false; // Bypassed for MVP
  const guardLoading = !isUnguarded && userQuery.isLoading;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aurika Flow</title>
      </Head>
      <ToastProvider>
        {isForbidden ? (
          <Layout title="Access denied">
            <AccessDeniedCard />
          </Layout>
        ) : guardLoading ? null : (
          <Component {...pageProps} />
        )}
      </ToastProvider>
    </>
  );
}

export default trpc.withTRPC(App);
