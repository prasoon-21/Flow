import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Section header used for panels/lists with optional action (button, link).
 * Keeps consistent spacing, responsive shrink for small screens.
 */
export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <header className={`section-header ${className ?? ''}`}>
      <div className="text">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="action action-group">{action}</div> : null}

      <style jsx>{`
        .section-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: nowrap;
        }
        .text {
          flex: 1 1 auto;
          min-width: 0;
        }
        .text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .text p {
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .action {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }

        @media (max-width: 600px) {
          .section-header {
            flex-wrap: wrap;
            gap: 6px;
          }
          .action {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
