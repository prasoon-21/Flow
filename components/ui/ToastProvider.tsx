import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastInternal extends ToastOptions {
  id: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    setToasts((current) => {
      const id = options.id ?? `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const toast: ToastInternal = {
        variant: 'info',
        duration: 4000,
        ...options,
        id,
      };
      return [...current, toast];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.length ? (
        <div className={styles['toast-root']}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastInternal; onDismiss: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.variant ?? 'info']}`}>
      <div className={styles.content}>
        {toast.title ? <div className={styles.title}>{toast.title}</div> : null}
        <div className={styles.message}>{toast.message}</div>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
          >
            {toast.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
