import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const hasIconOnly = icon && !children;
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    hasIconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' ? <span className={styles.icon}>{icon}</span> : null}
      {children ? <span className={styles.label}>{children}</span> : null}
      {icon && iconPosition === 'right' ? <span className={styles.icon}>{icon}</span> : null}
    </button>
  );
}
