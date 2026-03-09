import React from 'react';
import { TagPill } from '@/components/ui/TagPill';
import { initialsFromName } from '@/lib/utils/initials';
import { Copy } from 'lucide-react';

type ContactRecord = {
  id?: string | null;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
  note?: string | null;
  shopifyCustomerId?: string | null;
};

type ContactCardProps = {
  title?: string;
  contact: ContactRecord | null;
  emptyState?: string;
  fullHeight?: boolean;
  action?: React.ReactNode;
  noteLabel?: string;
  shopifyConnected?: boolean;
  onSyncShopify?: () => void;
  isSyncing?: boolean;
};

export function ContactCard({
  title = 'Contact',
  contact,
  emptyState = 'Select a contact to view details.',
  fullHeight = false,
  action,
  noteLabel = 'Note',
  shopifyConnected,
  onSyncShopify,
  isSyncing = false,
}: ContactCardProps) {
  const initials = contact?.name
    ? initialsFromName(contact.name)
    : contact?.email
      ? initialsFromName(contact.email)
      : '—';
  const [copiedField, setCopiedField] = React.useState<'email' | 'phone' | null>(null);

  const handleCopy = React.useCallback(async (value: string, field: 'email' | 'phone') => {
    if (!value) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1400);
    } catch (error) {
      console.error('Failed to copy', error);
    }
  }, []);

  const showShopifyStatus = Boolean(contact) && shopifyConnected === true;
  const shopifyState =
    shopifyConnected === false
      ? 'disconnected'
      : shopifyConnected === true
        ? contact?.shopifyCustomerId
          ? 'synced'
          : 'unsynced'
        : 'checking';
  const shopifyStatusLabel =
    shopifyConnected === false
      ? 'Shopify disconnected'
      : shopifyConnected === true
        ? contact?.shopifyCustomerId
          ? 'Synced with Shopify'
          : 'Not synced'
        : 'Checking Shopify';
  const canShowSync = Boolean(contact) && Boolean(onSyncShopify) && shopifyConnected === true;
  const canSync = canShowSync && !isSyncing;
  const syncLabel = isSyncing ? 'Syncing...' : contact?.shopifyCustomerId ? 'Resync' : 'Sync';
  const showActions = Boolean(action) || canShowSync;

  return (
    <div className={`contact-card ${fullHeight ? 'full-height' : ''}`}>
      <header className="contact-card-header">
        <div className="header-left">
          <h3>{title}</h3>
          {showShopifyStatus ? (
            <span className={`sync-status ${shopifyState}`}>{shopifyStatusLabel}</span>
          ) : null}
        </div>
        {showActions ? (
          <div className="contact-actions">
            {canShowSync ? (
              <button
                type="button"
                className="sync-button"
                onClick={onSyncShopify}
                disabled={!canSync}
                aria-label="Sync contact with Shopify"
              >
                {syncLabel}
              </button>
            ) : null}
            {action ? <div className="action-slot">{action}</div> : null}
          </div>
        ) : null}
      </header>
      {contact ? (
        <div className="contact-body">
          <div className="contact-primary">
            <div className="avatar">{initials}</div>
            <div className="primary-text">
              <p className="name">{contact.name || 'Unknown contact'}</p>
              {contact.email ? (
                <div className="secondary-row">
                  <p className="secondary">{contact.email}</p>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => handleCopy(contact.email ?? '', 'email')}
                    aria-label="Copy email address"
                    title="Copy email"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedField === 'email' ? <span className="copy-feedback">Copied</span> : null}
                </div>
              ) : null}
              {contact.phone ? (
                <div className="secondary-row">
                  <p className="secondary">{contact.phone}</p>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={() => handleCopy(contact.phone ?? '', 'phone')}
                    aria-label="Copy phone number"
                    title="Copy phone number"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedField === 'phone' ? <span className="copy-feedback">Copied</span> : null}
                </div>
              ) : null}
            </div>
          </div>

          <hr />

          <section className="contact-section">
            <div className="section-label">Tags</div>
            <div className="contact-tags">
              {contact.tags && contact.tags.length ? (
                contact.tags.map((tag) => (
                  <TagPill key={tag} label={tag} caps="title" />
                ))
              ) : (
                <TagPill label="None" caps="title" />
              )}
            </div>
          </section>

          {contact.note ? (
            <>
              <hr />
              <section className="contact-section">
                <div className="section-label">{noteLabel}</div>
                <p className="note-content">{contact.note}</p>
              </section>
            </>
          ) : null}
        </div>
      ) : (
        <div className="contact-empty">
          <div className="empty-outline">
            <p>{emptyState}</p>
          </div>
        </div>
      )}
      <style jsx>{`
        .contact-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .contact-card.full-height {
          height: 100%;
        }

        .contact-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .contact-card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sync-status {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .sync-status.synced {
          background: rgba(16, 185, 129, 0.12);
          color: #0f766e;
        }

        .sync-status.unsynced {
          background: rgba(148, 163, 184, 0.18);
          color: #475569;
        }

        .sync-status.disconnected {
          background: rgba(248, 113, 113, 0.14);
          color: #b91c1c;
        }

        .sync-status.checking {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }

        .contact-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sync-button {
          border: 1px solid rgba(81, 98, 255, 0.4);
          background: rgba(81, 98, 255, 0.1);
          color: #3d5bff;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sync-button:hover:not(:disabled) {
          background: rgba(81, 98, 255, 0.18);
        }

        .contact-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .contact-primary {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .avatar {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(122, 136, 255, 0.85), rgba(171, 190, 255, 0.85));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #fff;
          font-size: 18px;
        }

        .primary-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
        }

        .name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .secondary {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .secondary-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .copy-button {
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 2px;
        }

        .copy-button:hover {
          color: var(--text-primary);
        }

        .copy-feedback {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        hr {
          border: none;
          border-top: 1px solid rgba(210, 216, 255, 0.6);
          margin: 0;
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .contact-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .note-content {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .contact-empty {
          padding: 6px;
        }

        .empty-outline {
          border: 1px dashed rgba(210, 216, 255, 0.85);
          border-radius: 16px;
          padding: 22px;
          text-align: center;
          color: var(--text-tertiary);
        }

        .empty-outline p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
