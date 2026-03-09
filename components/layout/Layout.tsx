/**
 * Layout Component
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { trpc } from '@/lib/trpc/client';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentUserQuery = trpc.user.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const canFetchProtected = Boolean(currentUserQuery.data);
  const accessiblePagesQuery = trpc.page.getAccessible.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: canFetchProtected,
  });
  const normalizedPages = useMemo(() => {
    return (accessiblePagesQuery.data ?? []).map((page) => ({
      ...page,
      createdAt: typeof page.createdAt === 'string' ? new Date(page.createdAt) : page.createdAt,
      updatedAt: typeof page.updatedAt === 'string' ? new Date(page.updatedAt) : page.updatedAt,
    }));
  }, [accessiblePagesQuery.data]);
  const logoutInFlightRef = useRef(false);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  const handleLogout = useCallback(async () => {
    if (logoutInFlightRef.current) {
      return;
    }
    logoutInFlightRef.current = true;
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const authErrorCodes = new Set(['UNAUTHORIZED', 'NOT_FOUND']);
    const unauthorized =
      (currentUserQuery.error && authErrorCodes.has(currentUserQuery.error.data?.code ?? '')) ||
      (accessiblePagesQuery.error && authErrorCodes.has(accessiblePagesQuery.error.data?.code ?? ''));
    if (unauthorized) {
      handleLogout();
    }
  }, [accessiblePagesQuery.error, currentUserQuery.error, handleLogout]);

  return (
    <div className="layout-shell">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        pages={normalizedPages}
        loading={accessiblePagesQuery.isLoading}
      />
      <div className="layout-body">
        <Header
          title={title}
          onToggleMenu={() => setMobileSidebarOpen(true)}
          user={currentUserQuery.data ?? null}
          onLogout={handleLogout}
        />
        <main className="page-content">{children}</main>
      </div>
      <style jsx>{`
        .layout-shell {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .layout-body {
          --layout-padding-top: 14px;
          --layout-padding-bottom: 18px;
          --layout-gap: 10px;
          --header-slot-height: var(--header-height);
          --page-available-height: calc(
            100vh - var(--layout-padding-top) - var(--layout-padding-bottom) - var(--layout-gap) -
              var(--header-slot-height)
          );
          flex: 1;
          margin-left: calc(var(--sidebar-width) + 10px);
          padding: var(--layout-padding-top) 16px var(--layout-padding-bottom);
          display: flex;
          flex-direction: column;
          gap: var(--layout-gap);
          min-height: 100vh;
          overflow-y: auto;
          scrollbar-width: none;
          transition: margin 0.3s ease;
        }

        .layout-body::-webkit-scrollbar {
          display: none;
        }

        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        @media (max-width: 1440px) {
          .layout-body {
            --layout-padding-top: 12px;
            --layout-padding-bottom: 16px;
            padding: var(--layout-padding-top) 14px var(--layout-padding-bottom);
          }
        }

        @media (max-width: 1280px) {
          .layout-body {
            margin-left: calc(var(--sidebar-width) + 8px);
            --layout-padding-top: 10px;
            --layout-padding-bottom: 16px;
            padding: var(--layout-padding-top) 12px var(--layout-padding-bottom);
          }
        }

        @media (max-width: 1024px) {
          .layout-body {
            margin-left: calc(var(--sidebar-width) + 8px);
          }
        }

        @media (max-width: 767px) {
          .layout-body {
            margin-left: 0;
            --layout-padding-top: 56px;
            --layout-padding-bottom: 70px;
            --layout-gap: 12px;
            --header-slot-height: 0px;
            padding: var(--layout-padding-top) 10px var(--layout-padding-bottom);
            gap: var(--layout-gap);
          }

          .page-content {
            padding-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}
