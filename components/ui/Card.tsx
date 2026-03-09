import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  rounded?: string;
  bordered?: boolean;
};

/**
 * Lightweight Card wrapper to standardize padding, radius, and background.
 * Use className to layer page-specific layout styles.
 */
export function Card({
  children,
  className,
  padding = '12px',
  rounded = '22px',
  bordered = true,
}: CardProps) {
  return (
    <div className={`ui-card ${className ?? ''}`}>
      {children}
      <style jsx>{`
        .ui-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: ${rounded};
          padding: ${padding};
          border: ${bordered ? '1px solid rgba(210, 216, 255, 0.35)' : 'none'};
          box-sizing: border-box;
        }

        @media (max-width: 880px) {
          .ui-card {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
