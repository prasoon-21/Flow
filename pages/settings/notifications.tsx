import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trpc } from '@/lib/trpc/client';
import { requestFcmToken } from '@/lib/notifications/fcm';

const TOKEN_STORAGE_KEY = 'fcmToken';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const registerMutation = trpc.notification.registerDevice.useMutation();
  const unregisterMutation = trpc.notification.unregisterDevice.useMutation();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [token, setToken] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleEnable = async () => {
    if (isWorking) return;
    setIsWorking(true);
    setStatusMessage(null);
    try {
      const result = await requestFcmToken();
      setPermission(result.permission);
      if (!result.token) {
        setStatusMessage(result.error ?? 'Unable to enable notifications.');
        return;
      }
      await registerMutation.mutateAsync({ token: result.token, platform: 'web' });
      window.localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setToken(result.token);
      setStatusMessage('Browser notifications enabled for this device.');
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDisable = async () => {
    if (isWorking) return;
    const storedToken = token ?? (typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null);
    if (!storedToken) {
      setStatusMessage('No device token found for this browser.');
      return;
    }
    setIsWorking(true);
    setStatusMessage(null);
    try {
      await unregisterMutation.mutateAsync({ token: storedToken });
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setStatusMessage('Browser notifications disabled for this device.');
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsWorking(false);
    }
  };

  const permissionLabel =
    permission === 'granted'
      ? 'Granted'
      : permission === 'denied'
        ? 'Denied'
        : permission === 'default'
          ? 'Not requested'
          : 'Unsupported';

  return (
    <Layout title="Settings">
      <div className="settings-container">
        <nav className="tabs">
          {[
            { href: '/settings/email', label: 'Email' },
            { href: '/settings/shopify', label: 'Shopify' },
            { href: '/settings/tags', label: 'Tags' },
            { href: '/settings/notifications', label: 'Notifications' },
          ].map((tab) => (
            <Link key={tab.href} href={tab.href} className={`tab ${router.pathname === tab.href ? 'active' : ''}`}>
              {tab.label}
            </Link>
          ))}
        </nav>

        <section className="card">
          <header className="section-head">
            <div>
              <h2>Browser Notifications</h2>
              <p className="muted">Enable FCM to receive ticket updates even when the app is closed.</p>
            </div>
          </header>

          <div className="status-grid">
            <div>
              <p className="label">Permission status</p>
              <p className="value">{permissionLabel}</p>
            </div>
            <div>
              <p className="label">Device token</p>
              <p className="value">{token ? 'Registered' : 'Not registered'}</p>
            </div>
          </div>

          {statusMessage ? <p className="muted">{statusMessage}</p> : null}

          <div className="action-row action-group">
            <button type="button" className="btn-primary" onClick={handleEnable} disabled={isWorking}>
              {isWorking ? 'Working…' : 'Enable notifications'}
            </button>
            <button type="button" className="btn-pill" onClick={handleDisable} disabled={isWorking || !token}>
              Disable on this device
            </button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tabs {
          display: inline-flex;
          gap: 8px;
          padding: 4px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(210, 216, 255, 0.5);
          box-shadow: 0 10px 20px rgba(108, 122, 208, 0.12);
        }

        :global(a.tab) {
          padding: 8px 12px;
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        :global(a.tab.active) {
          background: rgba(81, 98, 255, 0.12);
          color: var(--text-primary);
          border: 1px solid rgba(81, 98, 255, 0.35);
          box-shadow: 0 8px 16px rgba(81, 98, 255, 0.14);
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }

        .label {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 6px;
        }

        .value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .action-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 18px;
        }

        .muted {
          color: var(--text-tertiary);
          margin-top: 12px;
        }
      `}</style>
    </Layout>
  );
}
