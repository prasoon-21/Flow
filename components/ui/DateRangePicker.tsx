'use client';

import React from 'react';

type DateRangePickerProps = {
  value: { start: string; end: string };
  onChange: (which: 'start' | 'end', value: string) => void;
  min?: string;
  max?: string;
  idPrefix?: string;
  className?: string;
};

export function DateRangePicker({ value, onChange, min, max, idPrefix = 'date-range', className }: DateRangePickerProps) {
  const handleChange = (which: 'start' | 'end') => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(which, event.target.value);
  };

  return (
    <div className={`date-range-picker ${className ?? ''}`}>
      <input
        id={`${idPrefix}-start`}
        type="date"
        value={value.start}
        max={value.end || max}
        min={min}
        onChange={handleChange('start')}
      />
      <span className="range-separator">→</span>
      <input
        id={`${idPrefix}-end`}
        type="date"
        value={value.end}
        max={max}
        min={value.start || min}
        onChange={handleChange('end')}
      />

      <style jsx>{`
        .date-range-picker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(210, 216, 255, 0.7);
          border-radius: 10px;
          padding: 3px 8px;
        }

        .date-range-picker input[type='date'] {
          border: none;
          background: transparent;
          font-size: 12px;
          color: var(--text-primary);
          font-family: inherit;
        }

        .date-range-picker input[type='date']:focus {
          outline: none;
        }

        .range-separator {
          color: var(--text-tertiary);
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
