// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED RADIO GROUP COMPONENT
// ==============================================================================

import React from 'react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends BaseFieldProps {
  value?: string;
  onValueChange?: (val: string) => void;
  options: RadioOption[] | string[];
  layout?: 'horizontal' | 'vertical' | 'cards';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  name,
  label,
  value = '',
  onValueChange,
  options,
  layout = 'horizontal',
  helperText,
  error,
  required,
  requirement,
  disabled = false,
  allowNotApplicable = false,
  isNotApplicable = false,
  onNotApplicableChange,
  notApplicableLabel,
  tooltip,
  className = '',
  style
}) => {
  const isDisabled = disabled || isNotApplicable;

  const normalizedOptions: RadioOption[] = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  const handleSelect = (val: string) => {
    if (isDisabled) return;
    if (onValueChange) onValueChange(val);
  };

  const handleNA = (isNA: boolean) => {
    if (onNotApplicableChange) {
      onNotApplicableChange(isNA);
      if (isNA && onValueChange) {
        onValueChange('N/A');
      } else if (!isNA && onValueChange && value === 'N/A') {
        onValueChange('');
      }
    }
  };

  return (
    <NotApplicableField
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      requirement={requirement}
      disabled={disabled}
      allowNotApplicable={allowNotApplicable}
      isNotApplicable={isNotApplicable}
      onNotApplicableChange={handleNA}
      notApplicableLabel={notApplicableLabel}
      tooltip={tooltip}
      className={className}
      style={style}
    >
      <div style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: layout === 'cards' ? '8px' : '16px',
        alignItems: layout === 'vertical' ? 'flex-start' : 'center',
        padding: layout === 'cards' ? '2px 0' : '4px 0'
      }}>
        {isNotApplicable ? (
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
            Not Applicable (N/A)
          </span>
        ) : (
          normalizedOptions.map((opt) => {
            const isSelected = value === opt.value;
            const isOptDisabled = isDisabled || opt.disabled;

            if (layout === 'cards') {
              return (
                <div
                  key={opt.value}
                  onClick={() => !isOptDisabled && handleSelect(opt.value)}
                  style={{
                    flex: '1 1 calc(50% - 8px)',
                    minWidth: '120px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected 
                      ? '2px solid var(--brand-orange, #F37023)' 
                      : '1px solid var(--border-color, #E2E8F0)',
                    background: isSelected 
                      ? 'rgba(243, 112, 35, 0.05)' 
                      : isOptDisabled 
                        ? '#F1F5F9' 
                        : '#FFFFFF',
                    cursor: isOptDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name={name || id}
                    value={opt.value}
                    checked={isSelected}
                    disabled={isOptDisabled}
                    onChange={() => handleSelect(opt.value)}
                    style={{ accentColor: 'var(--brand-orange, #F37023)', cursor: isOptDisabled ? 'not-allowed' : 'pointer' }}
                  />
                  {opt.icon && <div style={{ color: isSelected ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)' }}>{opt.icon}</div>}
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--brand-navy, #0B192C)' : 'var(--text-color, #334155)' }}>
                      {opt.label}
                    </div>
                    {opt.description && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)' }}>
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <label
                key={opt.value}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isOptDisabled ? 'not-allowed' : 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--brand-navy, #0B192C)' : 'var(--text-color, #334155)',
                  userSelect: 'none',
                  margin: 0
                }}
              >
                <input
                  type="radio"
                  name={name || id}
                  value={opt.value}
                  checked={isSelected}
                  disabled={isOptDisabled}
                  onChange={() => handleSelect(opt.value)}
                  style={{ accentColor: 'var(--brand-orange, #F37023)', cursor: isOptDisabled ? 'not-allowed' : 'pointer' }}
                />
                {opt.icon}
                <span>{opt.label}</span>
              </label>
            );
          })
        )}
      </div>
    </NotApplicableField>
  );
};
