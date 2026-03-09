import React from 'react';

type InputShellProps = {
  label?: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * InputShell wraps form controls with consistent label/helper/error spacing.
 * Handles responsive spacing automatically.
 */
export function InputShell({ label, helper, error, children, className }: InputShellProps) {
  const helperText = error ?? helper;
  return (
    <div className={`input-shell ${className ?? ''}`}>
      {label ? <label className={`input-label ${error ? 'error' : ''}`}>{label}</label> : null}
      <div className="input-body">{children}</div>
      {helperText ? <p className={`input-helper ${error ? 'error' : ''}`}>{helperText}</p> : null}

      <style jsx>{`
        .input-shell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .input-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .input-label.error {
          color: var(--danger-500, #d14343);
        }
        .input-body {
          display: flex;
          flex-direction: column;
        }
        .input-helper {
          margin: 0;
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .input-helper.error {
          color: var(--danger-500, #d14343);
        }
      `}</style>
    </div>
  );
}
