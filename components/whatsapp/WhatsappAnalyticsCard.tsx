import React from 'react';
import { MessageCircle } from 'lucide-react';

type TagCategory = {
  category: string;
  count: number;
};

export type WhatsappAnalyticsSnapshot = {
  totalIncoming: number;
  uniqueSenders: number;
  categories: {
    top: TagCategory[];
    other: number;
    total: number;
  };
};

type Props = {
  data: WhatsappAnalyticsSnapshot | null;
  loading?: boolean;
  error?: string | null;
};

export function WhatsappAnalyticsCard({ data, loading, error }: Props) {
  const stats = [
    { label: 'Total Incoming Msgs', value: data?.totalIncoming ?? 0 },
    { label: 'Unique Senders', value: data?.uniqueSenders ?? 0 },
  ];

  const topCategories = data?.categories.top ?? [];
  const otherCount = data?.categories.other ?? 0;
  const categoryTotal =
    typeof data?.categories?.total === 'number'
      ? data.categories.total
      : topCategories.reduce((sum, entry) => sum + entry.count, 0) + otherCount;
  const categoryCards = [
    ...topCategories.map((entry) => ({ label: entry.category, value: entry.count })),
    ...(otherCount > 0 ? [{ label: 'Other', value: otherCount }] : []),
  ];
  const hasCategoryData = categoryCards.length > 0;

  return (
    <article className="card analytics-card">
      <header className="analytics-head">
        <span className="channel-icon">
          <MessageCircle size={20} strokeWidth={1.8} />
        </span>
        <div>
          <h3>WhatsApp</h3>
        </div>
      </header>

      <section className="kpi-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="kpi-pill">
            <span>{stat.label}</span>
            <strong>{loading ? '—' : stat.value.toLocaleString()}</strong>
          </div>
        ))}
      </section>

      <section className="category-section">
        <div className="section-head">
          <div>
            <h4>Frequent Tag Categories</h4>
          </div>
          <span className="badge">{categoryTotal.toLocaleString()} hits</span>
        </div>

        {error ? (
          <div className="empty-state">{error}</div>
        ) : loading ? (
          <div className="kpi-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="kpi-pill skeleton" />
            ))}
          </div>
        ) : hasCategoryData ? (
          <div className="kpi-grid">
            {categoryCards.map((entry) => (
              <div key={entry.label} className="kpi-pill">
                <span>{entry.label}</span>
                <strong>{entry.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No tagged conversations for this range yet.</div>
        )}
      </section>

      <style jsx>{`
        .analytics-card {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .analytics-head {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .analytics-head h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .channel-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 211, 102, 0.14);
          box-shadow: 0 8px 16px rgba(37, 211, 102, 0.14);
          color: #1f9d5e;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .kpi-pill {
          border: 1px solid rgba(37, 211, 102, 0.24);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(242, 255, 248, 0.95);
        }

        .kpi-pill span {
          font-size: 12px;
          color: var(--text-tertiary);
          letter-spacing: 0.02em;
        }

        .kpi-pill strong {
          font-size: 18px;
          color: var(--text-primary);
        }

        .category-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .section-head h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(37, 211, 102, 0.08);
          border: 1px solid rgba(37, 211, 102, 0.24);
          color: var(--text-secondary);
        }

        .kpi-pill.skeleton {
          min-height: 74px;
          background: linear-gradient(90deg, rgba(232, 255, 241, 0.75), rgba(255, 255, 255, 0.92), rgba(232, 255, 241, 0.75));
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-color: rgba(37, 211, 102, 0.18);
        }

        .empty-state {
          text-align: center;
          font-size: 13px;
          color: var(--text-tertiary);
          padding: 16px;
          border: 1px dashed rgba(37, 211, 102, 0.35);
          border-radius: 14px;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </article>
  );
}
