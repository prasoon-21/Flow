import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'primary', size = 'md', icon, className, ...props }: BadgeProps) {
  const classes = [styles.badge, styles[variant], styles[size], className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={classes} {...props}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children}
    </span>
  );
}
