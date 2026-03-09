import React from 'react';
import { Card } from '@/components/ui/Card';

type AccessDeniedCardProps = {
  title?: string;
  message?: string;
};

export function AccessDeniedCard({
  title = 'Access denied',
  message = "You don't have access to this page. Contact an admin to request access.",
}: AccessDeniedCardProps) {
  return (
    <Card className="access-denied-card" padding="22px">
      <h2>{title}</h2>
      <p>{message}</p>
      <style jsx>{`
        .access-denied-card {
          max-width: 560px;
          margin: 0 auto;
          text-align: center;
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          color: #2d2f45;
          margin: 0 0 8px;
        }

        p {
          margin: 0;
          color: #67718a;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </Card>
  );
}
