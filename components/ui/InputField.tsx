import React from 'react';
import styles from './InputField.module.css';

type BaseProps = {
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const InputField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, BaseProps>(
  (
    {
      label,
      helperText,
      icon,
      trailingIcon,
      containerClassName,
      inputClassName,
      multiline,
      className,
      ...props
    },
    ref
  ) => {
    const InputElement = multiline ? 'textarea' : 'input';
    return (
      <label className={[styles.wrapper, containerClassName, className].filter(Boolean).join(' ')}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <div className={styles.control}>
          {icon ? <span className={styles.icon}>{icon}</span> : null}
          <InputElement
            ref={ref as any}
            className={[styles.input, icon ? styles.withIcon : '', trailingIcon ? styles.withTrailing : '', inputClassName]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {trailingIcon ? <span className={styles.trailing}>{trailingIcon}</span> : null}
        </div>
        {helperText ? <span className={styles.helper}>{helperText}</span> : null}
      </label>
    );
  }
);

InputField.displayName = 'InputField';
