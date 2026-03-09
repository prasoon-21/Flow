/**
 * Header Component - matches provided reference
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, Check, MessageCircle, RefreshCcw, UserPlus, AtSign, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface HeaderProps {
  title: string;
  onToggleMenu?: () => void;
  user?: { name: string; role: string; email?: string | null } | null;
  onLogout?: () => void;
}

export default function Header({ title, onToggleMenu, user, onLogout }: HeaderProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const canFetchNotifications = Boolean(user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notificationsQuery = trpc.notification.list.useQuery(
    { limit: 40 },
    { enabled: isNotificationsOpen && canFetchNotifications, retry: false },
  );
  const { refetch: refetchNotifications } = notificationsQuery;
  const unreadCountQuery = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: canFetchNotifications,
    refetchInterval: canFetchNotifications ? 60000 : false,
    retry: false,
  });
  const markReadMutation = trpc.notification.markRead.useMutation();
  const markAllMutation = trpc.notification.markAllRead.useMutation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        isNotificationsOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (isNotificationsOpen && canFetchNotifications) {
      refetchNotifications();
    }
  }, [isNotificationsOpen, canFetchNotifications, refetchNotifications]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);
  const toggleNotifications = () => setNotificationsOpen((prev) => !prev);

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = unreadCountQuery.data?.count ?? 0;
  const notificationSubtitle = notificationsQuery.isLoading
    ? 'Loading...'
    : unreadCount
      ? `${unreadCount} unread`
      : canFetchNotifications
        ? 'All caught up'
        : 'Sign in required';

  const formatRelativeTime = (value: Date | string | null | undefined) => {
    if (!value) return 'N/A';
    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket.assigned':
        return <UserPlus size={16} />;
      case 'ticket.status_changed':
        return <RefreshCcw size={16} />;
      case 'ticket.comment_mention':
        return <AtSign size={16} />;
      case 'ticket.comment':
        return <MessageCircle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleMarkAllRead = async () => {
    await markAllMutation.mutateAsync();
    await Promise.all([notificationsQuery.refetch(), unreadCountQuery.refetch()]);
  };

  const handleNotificationClick = async (notification: {
    id: string;
    readAt: Date | string | null;
    link?: string;
  }) => {
    if (!notification.readAt) {
      await markReadMutation.mutateAsync({ id: notification.id });
      unreadCountQuery.refetch();
      notificationsQuery.refetch();
    }
    setNotificationsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const notificationLayer = isMounted
    ? createPortal(
        <>
          {isNotificationsOpen ? (
            <div
              className="notification-backdrop"
              onClick={() => setNotificationsOpen(false)}
              aria-hidden="true"
            />
          ) : null}
          <div
            className={`notification-drawer ${isNotificationsOpen ? 'open' : ''}`}
            ref={notificationRef}
            role="dialog"
            aria-modal={isNotificationsOpen}
            aria-hidden={!isNotificationsOpen}
            aria-label="Notifications"
          >
            <div className="notification-header">
              <div>
                <h3>Notifications</h3>
                <p>{notificationSubtitle}</p>
              </div>
              <div className="notification-actions action-group">
                <button
                  type="button"
                  className="mark-read-button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0 || markAllMutation.isLoading}
                >
                  <Check size={14} />
                  Mark all read
                </button>
                <button
                  type="button"
                  className="notification-close"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="notification-list">
              {notificationsQuery.isLoading ? (
                <div className="notification-empty">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">No notifications yet.</div>
              ) : (
                notifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className={`notification-item ${isUnread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-body">
                          {notification.body || 'Open to view details.'}
                        </div>
                      </div>
                      <div className="notification-time">{formatRelativeTime(notification.createdAt)}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <header className="page-header">
        <button
          className="menu-button"
          type="button"
          aria-label="Open navigation"
          onClick={onToggleMenu}
        >
          ☰
        </button>
        <div className="brand-line">
          <span className="brand-title">Aurika Flow</span>
          <span className="brand-divider">|</span>
          <span className="brand-subtitle">{title}</span>
        </div>

        <div className="header-middle" />

        <div className="header-actions action-group">
          <button
            type="button"
            className={`notification-button ${isNotificationsOpen ? 'active' : ''}`}
            onClick={toggleNotifications}
            aria-label="Open notifications"
            ref={notificationButtonRef}
          >
            <Bell size={18} />
            {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
          </button>
          <ProfileMenu
            isOpen={isMenuOpen}
            onToggle={toggleMenu}
            onClose={closeMenu}
            menuRef={menuRef}
            user={user}
            onLogout={onLogout}
          />
        </div>

        <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(240, 244, 255, 0.9));
          border: 1px solid rgba(210, 216, 255, 0.6);
          padding: 12px 18px;
          border-radius: 32px;
          box-shadow: 0 14px 28px rgba(108, 122, 208, 0.18);
          backdrop-filter: blur(28px);
          position: relative;
          z-index: 60;
        }

        .brand-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .brand-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #6e77a8;
        }

        .brand-divider {
          font-size: 14px;
          font-weight: 600;
          color: #a0a7ce;
          margin: 0 8px;
        }

        .brand-line {
          display: flex;
          align-items: center;
        }

        .menu-button {
          display: none;
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: none;
          background: rgba(81, 98, 255, 0.18);
          color: #4c5eff;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(72, 97, 255, 0.16);
        }

        .header-middle {
          flex: 1;
          text-align: center;
          font-size: 13px;
          color: #7d86b8;
        }

        .header-actions {
          display: flex;
          align-items: center;
        }

        .notification-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 14px;
          border: 1px solid rgba(81, 98, 255, 0.2);
          background: rgba(81, 98, 255, 0.08);
          color: #4c5eff;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-button.active,
        .notification-button:hover {
          background: rgba(81, 98, 255, 0.16);
          border-color: rgba(81, 98, 255, 0.4);
        }

        .notification-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: #3d5bff;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(61, 91, 255, 0.28);
        }

        @media (max-width: 1024px) {
          .menu-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .header-middle {
            text-align: left;
          }

          .brand-line {
            gap: 4px;
            flex-direction: column;
            align-items: flex-start;
          }

          .brand-divider {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .page-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            border-radius: 0;
            padding: 10px 16px;
            z-index: 60;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(210, 216, 255, 0.35);
            border: none;
            border-bottom: 1px solid rgba(210, 216, 255, 0.35);
            box-shadow: 0 2px 12px rgba(108, 122, 208, 0.08);
          }

          .menu-button {
            display: none;
          }

          .brand-line {
            flex-direction: row;
            align-items: center;
            gap: 0;
          }

          .brand-title {
            display: none;
          }

          .brand-divider {
            display: none;
          }

          .brand-subtitle {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
          }

          .header-middle {
            flex: 1;
          }

          .header-actions {
            gap: 6px;
          }
        }
      `}</style>
      </header>
      {notificationLayer}
    </>
  );
}

function ProfileMenu({
  isOpen,
  onToggle,
  menuRef,
  onClose,
  user,
  onLogout,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  user?: { name: string; role: string; email?: string | null } | null;
  onLogout?: () => void;
}) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((segment) => segment[0]?.toUpperCase())
        .slice(0, 2)
        .join('')
    : 'AE';

  const handleLogout = () => {
    onClose();
    onLogout?.();
  };

  return (
    <>
      <div className={`profile-menu ${isOpen ? 'open' : ''}`} ref={menuRef}>
        <button className="profile-trigger" type="button" onClick={onToggle} aria-expanded={isOpen}>
          {initials}
        </button>
        <div className={`profile-dropdown ${isOpen ? 'open' : ''}`}>
          <div className="profile-info">
            <strong>{user?.name ?? 'Loading…'}</strong>
            <span>{user?.role ? user.role.toUpperCase() : '—'}</span>
            {user?.email ? <small>{user.email}</small> : null}
          </div>
          <Link href="/settings/email" onClick={onClose}>
            Settings
          </Link>
          <button type="button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
      <style jsx>{`
        .profile-menu {
          position: relative;
          display: inline-flex;
        }

        .profile-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(81, 98, 255, 0.16);
          color: #4c5eff;
          border: none;
          border-radius: 14px;
          padding: 6px 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: 0 12px 22px rgba(72, 97, 255, 0.18);
        }

        .chevron {
          font-size: 10px;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          display: none;
          min-width: 200px;
          background: #fff;
          border: 1px solid rgba(206, 211, 255, 0.65);
          border-radius: 16px;
          box-shadow: 0 10px 24px rgba(99, 113, 195, 0.2);
          padding: 12px;
          flex-direction: column;
          gap: 6px;
          z-index: 20;
        }

        .profile-menu.open .profile-dropdown,
        .profile-menu:hover .profile-dropdown {
          display: flex;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(206, 211, 255, 0.65);
          margin-bottom: 4px;
        }

        .profile-info strong {
          font-size: 14px;
          color: #1b1f44;
        }

        .profile-info span {
          font-size: 11px;
          letter-spacing: 0.06em;
          color: #6f75a3;
        }

        .profile-info small {
          font-size: 11px;
          color: #a3a9d1;
        }

        .profile-dropdown button,
        .profile-dropdown :global(a) {
          background: transparent;
          border: none;
          padding: 8px 10px;
          border-radius: 10px;
          text-align: left;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.2s ease;
          display: block;
        }

        .profile-dropdown button:hover,
        .profile-dropdown :global(a:hover) {
          background: var(--primary-100);
          color: var(--primary-500);
        }
      `}</style>
    </>
  );
}
