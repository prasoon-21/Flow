import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Phone, ShoppingBag, Ticket, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TagPill } from '@/components/ui/TagPill';

export type ActivityItem = {
  id: string;
  type: 'email' | 'whatsapp' | 'call' | 'order' | 'ticket';
  timestamp: Date | string;
  title: string;
  snippet: string;
  metadata: {
    conversationId?: string;
    callId?: string;
    channel?: string;
    orderId?: string;
    orderNumericId?: number;
    ticketId?: string;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    total?: string;
    tags?: string[];
    duration?: string;
    direction?: string;
    recordUrl?: string;
  };
};

const ACTIVITY_FILTER_ORDER: ActivityItem['type'][] = ['email', 'order', 'ticket', 'call', 'whatsapp'];

type OrderDetail = {
  id: number;
  name?: string;
  created_at?: string;
  currency?: string;
  total_price?: string;
  total_discounts?: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  line_items?: Array<{ id: number; title?: string; quantity?: number; price?: string }>;
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
};

interface ActivityTimelineProps {
  activities: ActivityItem[];
  formatRelativeTime: (date: Date | string | null) => string;
  formatExactTime: (date: Date | string | null) => string;
  isLoading?: boolean;
  error?: { message?: string } | null;
  emptyTitle?: string;
  emptyHint?: string;
}

export function ActivityTimeline({
  activities,
  formatRelativeTime,
  formatExactTime,
  isLoading,
  error,
  emptyTitle = 'No activity yet for this contact.',
  emptyHint = 'Activity from email, WhatsApp, and calls will appear here.',
}: ActivityTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | ActivityItem['type']>('all');
  const [activeActivity, setActiveActivity] = useState<ActivityItem | null>(null);

  const activityTypeLabels: Record<ActivityItem['type'], string> = {
    email: 'Emails',
    order: 'Orders',
    ticket: 'Tickets',
    call: 'Calls',
    whatsapp: 'WhatsApp',
  };

  const activityTypeBadgeLabels: Record<ActivityItem['type'], string> = {
    email: 'Email',
    order: 'Order',
    ticket: 'Ticket',
    call: 'Call',
    whatsapp: 'WhatsApp',
  };

  const availableTypes = useMemo(() => {
    const typeSet = new Set<ActivityItem['type']>();
    activities.forEach((activity) => typeSet.add(activity.type));
    return ACTIVITY_FILTER_ORDER.filter((type) => typeSet.has(type));
  }, [activities]);

  useEffect(() => {
    if (activeFilter === 'all') return;
    if (!availableTypes.includes(activeFilter)) {
      setActiveFilter('all');
    }
  }, [activeFilter, availableTypes]);

  useEffect(() => {
    if (!activeActivity) return;
    const stillExists = activities.some((activity) => activity.id === activeActivity.id);
    if (!stillExists) {
      setActiveActivity(null);
    }
  }, [activeActivity, activities]);

  useEffect(() => {
    if (!activeActivity) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveActivity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeActivity]);

  useEffect(() => {
    if (!activeActivity) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeActivity]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'email':
        return <Mail size={18} />;
      case 'order':
        return <ShoppingBag size={18} />;
      case 'ticket':
        return <Ticket size={18} />;
      case 'whatsapp':
        return <MessageCircle size={18} />;
      case 'call':
        return <Phone size={18} />;
      default:
        return null;
    }
  };

  const sortedActivities = useMemo(() => {
    const copy = [...activities];
    copy.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
    return copy;
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return sortedActivities;
    return sortedActivities.filter((activity) => activity.type === activeFilter);
  }, [activeFilter, sortedActivities]);

  const detailRows = (activity: ActivityItem) => {
    const rows: Array<{ label: string; value: string }> = [
      { label: 'Type', value: activityTypeBadgeLabels[activity.type] },
      { label: 'When', value: formatExactTime(activity.timestamp) },
    ];

    if (activity.metadata.channel) rows.push({ label: 'Channel', value: activity.metadata.channel });
    if (activity.metadata.conversationId) rows.push({ label: 'Conversation', value: activity.metadata.conversationId });
    if (activity.metadata.callId) rows.push({ label: 'Call ID', value: activity.metadata.callId });
    if (activity.metadata.orderId) rows.push({ label: 'Order', value: activity.metadata.orderId });
    if (activity.metadata.ticketId) rows.push({ label: 'Ticket', value: activity.metadata.ticketId });
    if (activity.type === 'order') {
      const paymentStatus = activity.metadata.paymentStatus ?? 'Unknown';
      const fulfillmentStatus = activity.metadata.fulfillmentStatus ?? 'Unfulfilled';
      rows.push({ label: 'Payment status', value: formatChipLabel(paymentStatus) });
      rows.push({ label: 'Delivery status', value: formatChipLabel(fulfillmentStatus) });
    } else if (activity.metadata.status) {
      rows.push({ label: 'Status', value: activity.metadata.status });
    }
    if (activity.metadata.total) rows.push({ label: 'Total', value: activity.metadata.total });
    if (activity.metadata.direction) rows.push({ label: 'Direction', value: activity.metadata.direction });
    if (activity.metadata.duration) rows.push({ label: 'Duration', value: activity.metadata.duration });
    if (activity.metadata.tags?.length) rows.push({ label: 'Tags', value: activity.metadata.tags.join(', ') });

    return rows;
  };

  const activeConversationId = activeActivity?.metadata.conversationId ?? '';
  const isEmailDrawer = activeActivity?.type === 'email' && Boolean(activeConversationId);
  // Email, ticket, and shopify routers are disabled in Flow MVP — stub the queries
  const emailHeaderTime: string | null = null;
  const activeTicketId = activeActivity?.type === 'ticket' ? activeActivity.metadata.ticketId ?? '' : '';
  const isTicketDrawer = activeActivity?.type === 'ticket' && Boolean(activeTicketId);
  const ticketDetails: any = null;
  const ticketAssignees: string[] = [];
  const ticketTags: string[] = [];
  const ticketContact: any = null;
  const ticketComments: any[] = [];
  const activeOrderId =
    activeActivity?.type === 'order' ? activeActivity.metadata.orderNumericId ?? null : null;
  const isOrderDrawer = activeActivity?.type === 'order' && Boolean(activeOrderId);

  const getActivityTitle = (activity: ActivityItem) => {
    const rawTitle = activity.title ?? '';
    if (activity.type !== 'email') {
      return rawTitle;
    }
    return rawTitle.replace(/^email\s*[:\-]\s*/i, '').trim() || rawTitle;
  };

  const formatChipLabel = (value: string) => {
    return value
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusVariant = (value?: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' => {
    if (!value) return 'neutral';
    const normalized = value.toLowerCase();
    if (['resolved', 'closed', 'completed', 'answered', 'success'].includes(normalized)) {
      return 'success';
    }
    if (['paid', 'authorized', 'fulfilled'].includes(normalized)) {
      return 'success';
    }
    if (['missed', 'failed', 'canceled', 'cancelled', 'overdue'].includes(normalized)) {
      return 'danger';
    }
    if (['unfulfilled', 'unpaid', 'voided', 'refunded'].includes(normalized)) {
      return 'danger';
    }
    if (['pending', 'in progress', 'in-progress', 'queued'].includes(normalized)) {
      return 'warning';
    }
    if (['partial', 'partially_refunded'].includes(normalized)) {
      return 'warning';
    }
    if (['open', 'active', 'new'].includes(normalized)) {
      return 'primary';
    }
    return 'neutral';
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const trimmed = activity.snippet?.trim();
    if (trimmed) {
      return trimmed;
    }
    if (activity.type === 'call') {
      return 'Open the call record to view details.';
    }
    if (activity.type === 'ticket') {
      return 'Open to view ticket details.';
    }
    if (activity.type === 'email') {
      return 'Open to view the conversation.';
    }
    return 'Open to view details.';
  };

  function formatOrderCurrency(order: OrderDetail | null, amount?: string | number | null) {
    const rawAmount = amount?.toString().trim();
    if (!rawAmount) {
      return '—';
    }
    if (order?.currency?.trim()) {
      return `${order.currency} ${rawAmount}`;
    }
    return rawAmount;
  }

  function formatOrderAddress(order: OrderDetail | null) {
    const address = order?.shipping_address;
    if (!address) {
      return [];
    }
    const line1 = [address.address1, address.address2].filter(Boolean).join(', ');
    const line2 = [address.city, address.province, address.zip].filter(Boolean).join(', ');
    const line3 = address.country ?? '';
    return [line1, line2, line3].filter((line) => line && line.trim().length > 0);
  }

  const getCallRecordUrl = (activity: ActivityItem) => {
    if (activity.type === 'call' && activity.metadata.callId) {
      return `/ivr?callId=${activity.metadata.callId}`;
    }
    if (activity.metadata.recordUrl) {
      return activity.metadata.recordUrl;
    }
    return null;
  };

  const getActivityChips = (activity: ActivityItem) => {
    const chips: Array<{ label: string; type: 'tag' | 'status' | 'meta' }> = [];
    const tags = activity.metadata.tags ?? [];
    const maxTags = 3;
    if (tags.length > 0) {
      tags.slice(0, maxTags).forEach((tag) => chips.push({ label: tag, type: 'tag' }));
      if (tags.length > maxTags) {
        chips.push({ label: `+${tags.length - maxTags}`, type: 'meta' });
      }
    }

    if (activity.type === 'order') {
      const paymentStatus = activity.metadata.paymentStatus ?? 'Unknown';
      const fulfillmentStatus = activity.metadata.fulfillmentStatus ?? 'Unfulfilled';
      chips.push({ label: formatChipLabel(paymentStatus), type: 'status' });
      chips.push({ label: formatChipLabel(fulfillmentStatus), type: 'status' });
    } else if (activity.metadata.status) {
      chips.push({ label: formatChipLabel(activity.metadata.status), type: 'status' });
    }

    if (activity.type === 'call') {
      if (activity.metadata.direction) {
        chips.push({ label: formatChipLabel(activity.metadata.direction), type: 'meta' });
      }
      if (activity.metadata.duration && activity.metadata.duration.toLowerCase() !== 'unknown duration') {
        chips.push({ label: activity.metadata.duration, type: 'meta' });
      }
    }

    if (chips.length === 0 && activity.type !== 'email') {
      chips.push({ label: activityTypeBadgeLabels[activity.type], type: 'meta' });
    }

    return chips;
  };

  if (isLoading) {
    return (
      <div className="empty-activity">
        <p>Loading activity...</p>
        <style jsx>{emptyStyles}</style>
      </div>
    );
  }

  if (error) {
    const message = error.message ?? 'Unknown error';
    return (
      <div className="empty-activity">
        <p>Error loading activity: {message}</p>
        <style jsx>{emptyStyles}</style>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="empty-activity">
        <p>{emptyTitle}</p>
        <p className="empty-hint">{emptyHint}</p>
        <style jsx>{emptyStyles}</style>
      </div>
    );
  }

  return (
    <div className="activity-tab">
      <div className="activity-timeline">
        <div className="activity-filters">
          <button
            type="button"
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-chip ${activeFilter === type ? 'active' : ''}`}
              onClick={() => setActiveFilter(type)}
            >
              {activityTypeLabels[type]}
            </button>
          ))}
        </div>
        <div className="activity-list">
          {filteredActivities.map((activity) => {
            const chips = getActivityChips(activity);
            const callRecordUrl = activity.type === 'call' ? getCallRecordUrl(activity) : null;
            return (
              <button
                key={activity.id}
                type="button"
                className="activity-item"
                onClick={() => setActiveActivity(activity)}
                aria-label={`Open ${activity.title}`}
              >
                <div className="activity-row top">
                  <div className="activity-title-group">
                    <span className={`activity-icon activity-icon-${activity.type}`}>
                      {getActivityIcon(activity.type)}
                    </span>
                    <span className="activity-title">{getActivityTitle(activity) || 'No subject'}</span>
                  </div>
                  <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
                </div>
                <div className="activity-row middle">
                  <div className="activity-chip-row">
                    {chips.map((chip, index) => {
                      if (chip.type === 'tag') {
                        return <TagPill key={`${activity.id}-${chip.label}-${index}`} label={chip.label} caps="title" />;
                      }
                      const variant = chip.type === 'status' ? getStatusVariant(chip.label) : 'neutral';
                      return (
                        <Badge key={`${activity.id}-${chip.label}-${index}`} variant={variant}>
                          {chip.label}
                        </Badge>
                      );
                    })}
                    {callRecordUrl ? (
                      <a className="chip-link" href={callRecordUrl} onClick={(event) => event.stopPropagation()}>
                        <Badge variant="primary">Open record</Badge>
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="activity-row bottom">
                  <p className="activity-description">{getActivityDescription(activity)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {activeActivity ? (
        <>
          <div className="drawer-backdrop" onClick={() => setActiveActivity(null)} aria-hidden="true" />
          <aside className="activity-drawer" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                {isEmailDrawer ? null : (
                  <p className="drawer-label">{activityTypeBadgeLabels[activeActivity.type]}</p>
                )}
                <h3 className="drawer-title">
                  {isEmailDrawer ? getActivityTitle(activeActivity) : activeActivity.title}
                </h3>
                <p className="drawer-time">
                  {formatExactTime(isEmailDrawer && emailHeaderTime ? emailHeaderTime : activeActivity.timestamp)}
                </p>
              </div>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setActiveActivity(null)}
                aria-label="Close activity details"
              >
                <X size={18} />
              </button>
            </div>
            {isEmailDrawer ? (
              <div className="drawer-body email-thread">
                <div className="drawer-empty">Email conversations disabled in Flow MVP.</div>
              </div>
            ) : isTicketDrawer ? (
              <div className="drawer-body ticket-body">
                <div className="drawer-empty">Ticket details disabled in Flow MVP.</div>
              </div>
            ) : isOrderDrawer ? (
              <div className="drawer-body order-body">
                <div className="drawer-empty">Order details coming soon.</div>
              </div>
            ) : (
              <div className="drawer-body">
                <div className="drawer-section">
                  <h4>Preview</h4>
                  <p>{activeActivity.snippet || 'No preview available yet.'}</p>
                </div>
                <div className="drawer-section">
                  <h4>Details</h4>
                  <dl className="drawer-details">
                    {detailRows(activeActivity).map((row) => (
                      <React.Fragment key={`${activeActivity.id}-${row.label}`}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </aside>
        </>
      ) : null}
      <style jsx>{`
        .activity-tab {
          flex: 1;
          overflow: hidden;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-filters {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 0 8px;
          position: sticky;
          top: 0;
          z-index: 2;
          background: #ffffff;
          flex: 0 0 auto;
          box-shadow: 0 6px 12px rgba(98, 114, 178, 0.08);
        }

        .filter-chip {
          border: 1px solid rgba(122, 147, 255, 0.3);
          background: rgba(255, 255, 255, 0.9);
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .filter-chip:hover {
          border-color: rgba(81, 98, 255, 0.5);
          color: var(--text-primary);
        }

        .filter-chip.active {
          background: rgba(81, 98, 255, 0.12);
          color: var(--primary-500);
          border-color: rgba(81, 98, 255, 0.45);
          font-weight: 600;
        }

        .activity-timeline {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          min-height: 0;
          padding-right: 2px;
          flex: 1 1 auto;
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 2px;
        }

        .activity-timeline:hover {
          scrollbar-color: rgba(81, 98, 255, 0.35) transparent;
        }

        .activity-timeline::-webkit-scrollbar {
          width: 6px;
        }

        .activity-timeline::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 999px;
        }

        .activity-timeline:hover::-webkit-scrollbar-thumb {
          background: rgba(81, 98, 255, 0.35);
        }

        .activity-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(122, 147, 255, 0.22);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          text-align: left;
          width: 100%;
          font: inherit;
          color: inherit;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }

        .activity-item:hover {
          background: rgba(239, 242, 255, 0.95);
          border-color: rgba(81, 98, 255, 0.35);
          transform: translateY(-1px);
        }

        .activity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .activity-row.middle {
          justify-content: flex-start;
        }

        .activity-row.bottom {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }

        .activity-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .activity-icon {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: rgba(81, 98, 255, 0.12);
          color: var(--primary-500);
        }

        .activity-icon-call {
          background: rgba(50, 201, 141, 0.14);
          color: #0f766e;
        }

        .activity-icon-ticket {
          background: rgba(81, 98, 255, 0.14);
          color: #3d5bff;
        }

        .activity-icon-email {
          background: rgba(77, 155, 255, 0.14);
          color: #2563eb;
        }

        .activity-icon-whatsapp {
          background: rgba(34, 197, 94, 0.14);
          color: #16a34a;
        }

        .activity-icon-order {
          background: rgba(245, 158, 11, 0.16);
          color: #b45309;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex: 1;
        }

        .activity-time {
          font-size: 12px;
          color: var(--text-tertiary);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .activity-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .chip-link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .activity-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          text-align: left;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 18, 32, 0.4);
          backdrop-filter: blur(2px);
          z-index: 300;
        }

        .activity-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: min(520px, 100vw);
          background: #fff;
          border-left: 1px solid rgba(122, 147, 255, 0.2);
          box-shadow: -12px 0 30px rgba(15, 18, 32, 0.12);
          z-index: 310;
          display: flex;
          flex-direction: column;
        }

        .drawer-header {
          padding: 20px;
          border-bottom: 1px solid rgba(210, 216, 255, 0.5);
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .drawer-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          margin-bottom: 6px;
        }

        .drawer-title {
          font-size: 18px;
          margin: 0 0 6px;
          color: var(--text-primary);
        }

        .drawer-time {
          font-size: 13px;
          color: var(--text-tertiary);
          margin: 0;
        }

        .drawer-close {
          border: 1px solid rgba(122, 147, 255, 0.3);
          background: transparent;
          border-radius: 10px;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          font: inherit;
        }

        .drawer-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .drawer-body.email-thread {
          gap: 14px;
        }

        .drawer-empty {
          font-size: 13px;
          color: var(--text-tertiary);
        }

        .drawer-section h4 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          margin: 0 0 8px;
        }

        .drawer-section p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .drawer-details {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr);
          gap: 8px 12px;
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .drawer-details.ticket-details {
          grid-template-columns: 120px minmax(0, 1fr);
        }

        .ticket-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ticket-comments {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-comment {
          border: 1px solid rgba(210, 216, 255, 0.45);
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.9);
        }

        .ticket-comment-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: var(--text-tertiary);
          margin-bottom: 6px;
        }

        .ticket-comment-author {
          color: var(--text-primary);
          font-weight: 600;
        }

        .ticket-comment-body {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .order-item-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .order-item-meta {
          display: flex;
          gap: 8px;
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .order-address {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .order-address p {
          margin: 0;
        }

        .drawer-details dt {
          color: var(--text-tertiary);
        }

        .drawer-details dd {
          margin: 0;
        }

        .drawer-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(81, 98, 255, 0.4);
          color: var(--primary-500);
          text-decoration: none;
          font-weight: 600;
          align-self: flex-start;
        }

        .activity-item:focus-visible,
        .filter-chip:focus-visible,
        .drawer-close:focus-visible,
        .drawer-link:focus-visible {
          outline: 2px solid rgba(81, 98, 255, 0.5);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

const emptyStyles = `
  .empty-activity {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    flex-direction: column;
    text-align: center;
  }

  .empty-activity p {
    font-size: 14px;
    color: var(--text-tertiary);
    margin: 4px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-tertiary);
    opacity: 0.7;
  }
`;
