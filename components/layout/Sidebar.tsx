/**
 * Responsive Sidebar with desktop rail and mobile drawer — Aurika Flow
 */

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, ShoppingCart, Warehouse, Truck, BookOpen, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import type { Page } from '@/lib/types/page';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
  pages: Page[];
  loading?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: <Home className="icon-glyph" strokeWidth={1.75} />, label: 'Dashboard', path: '/' },
  { icon: <ShoppingCart className="icon-glyph" strokeWidth={1.75} />, label: 'Orders', path: '/orders' },
  { icon: <Truck className="icon-glyph" strokeWidth={1.75} />, label: 'Purchases', path: '/purchases' },
  { icon: <Users className="icon-glyph" strokeWidth={1.75} />, label: 'Contacts', path: '/contacts' },
];

export default function Sidebar({ isMobileOpen, onClose, pages, loading }: SidebarProps) {
  const router = useRouter();
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const visibleItems = useMemo(() => {
    if (loading) {
      return sidebarItems.filter((item) => item.path === '/');
    }
    const allowedPaths = new Set(pages.map((page) => page.path));
    const filtered = sidebarItems.filter((item) => allowedPaths.has(item.path));
    return filtered.length ? filtered : sidebarItems.filter((item) => item.path === '/');
  }, [loading, pages]);

  const renderNavItems = (variant: 'desktop' | 'mobile') =>
    visibleItems.map((item) => {
      const isActive = router.pathname === item.path;
      if (variant === 'mobile') {
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`btab-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <span className="btab-icon">{item.icon}</span>
          </Link>
        );
      }
      return (
        <Link
          key={item.path}
          href={item.path}
          className={`nav-item ${isActive ? 'active' : ''}`}
        >
          <span className={`icon-circle ${isActive ? 'active' : ''}`}>{item.icon}</span>
        </Link>
      );
    });

  return (
    <>
      {/* Desktop sidebar rail */}
      <aside className="sidebar desktop">
        <nav className="sidebar-nav">{renderNavItems('desktop')}</nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="bottom-tabs">
        {renderNavItems('mobile')}
      </nav>

      {/* Legacy mobile overlay (still works for drawer access) */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        aria-hidden={!isMobileOpen}
        onClick={onClose}
      >
        <div className="overlay-panel" onClick={(event) => event.stopPropagation()}>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close navigation">
            ×
          </button>
          <nav className="mobile-nav">
            {visibleItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className={`icon-circle ${isActive ? 'active' : ''}`}>{item.icon}</span>
                  <span className="mobile-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <style jsx>{`
        .desktop {
          position: fixed;
          top: 16px;
          bottom: 16px;
          left: 16px;
          width: var(--sidebar-width);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(200, 206, 239, 0.65);
          box-shadow: 0 12px 24px rgba(120, 138, 208, 0.14);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
          border-radius: 32px;
          z-index: 100;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          align-items: center;
        }

        .nav-item {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s ease;
        }

        .nav-item:hover {
          transform: translateY(-2px);
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(81, 98, 255, 0.2);
          box-shadow: 0 12px 24px rgba(81, 98, 255, 0.18);
          transform: scale(1.08);
          z-index: -1;
        }

        .icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: transparent;
          color: var(--gray-600);
          transition: background 0.2s ease;
        }

        .icon-circle.active {
          background: rgba(81, 98, 255, 0.18);
          color: var(--primary-500);
        }

        .icon-circle :global(.icon-glyph) {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          fill: none;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(24, 30, 64, 0.35);
          backdrop-filter: blur(6px);
          display: none;
          align-items: flex-start;
          justify-content: flex-start;
          z-index: 200;
        }

        .sidebar-overlay.open {
          display: flex;
        }

        .overlay-panel {
          width: 200px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 22px;
          margin: 20px 14px;
          padding: 20px 16px;
          box-shadow: 0 16px 28px rgba(96, 112, 190, 0.22);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .close-btn {
          align-self: flex-end;
          background: transparent;
          border: none;
          font-size: 22px;
          color: #5b5f80;
          cursor: pointer;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 14px;
          transition: background 0.2s ease;
        }

        .mobile-nav-item:hover {
          background: rgba(81, 98, 255, 0.12);
        }

        .mobile-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .mobile-nav-item.active {
          background: rgba(81, 98, 255, 0.14);
        }

        .mobile-nav-item.active .mobile-label {
          color: #3d5bff;
        }

        /* ── Bottom Tab Bar (mobile) ── */
        .bottom-tabs {
          display: none;
        }

        @media (max-width: 767px) {
          .desktop {
            display: none;
          }

          .bottom-tabs {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 52px;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(210, 216, 255, 0.35);
            box-shadow: 0 -2px 12px rgba(108, 122, 208, 0.08);
            z-index: 200;
            padding: 0 4px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }

          .bottom-tabs :global(.btab-item) {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 8px 2px;
            min-height: 44px;
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
          }

          .bottom-tabs :global(.btab-icon) {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 10px;
            color: var(--gray-500);
            transition: all 0.2s ease;
          }

          .bottom-tabs :global(.btab-icon .icon-glyph) {
            width: 20px;
            height: 20px;
            stroke: currentColor;
            fill: none;
          }

          .bottom-tabs :global(.btab-item.active .btab-icon) {
            color: var(--primary-500);
            background: rgba(81, 98, 255, 0.12);
          }

        }
      `}</style>
    </>
  );
}
