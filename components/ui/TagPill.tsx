import React from 'react';
import styles from './TagPill.module.css';

interface TagPillProps {
  label: string;
  onRemove?: () => void;
  caps?: 'uppercase' | 'title';
  className?: string;
  variant?: 'default' | 'green' | 'yellow';
}

export function TagPill({ label, onRemove, caps = 'uppercase', className, variant = 'default' }: TagPillProps) {
  const variantClass = variant === 'green' ? styles.green : variant === 'yellow' ? styles.yellow : '';
  return (
    <span className={[styles.pill, caps === 'title' ? styles.titleCase : '', variantClass, className ?? ''].filter(Boolean).join(' ')}>
      {label}
      {onRemove ? (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Remove ${label}`}>
          ×
        </button>
      ) : null}
    </span>
  );
}
