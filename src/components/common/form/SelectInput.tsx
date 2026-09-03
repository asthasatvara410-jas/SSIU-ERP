// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED SELECT INPUT COMPONENT
// ==============================================================================

import React from 'react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectInputProps extends BaseFieldProps, Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'name' | 'style' | 'className' | 'disabled' | 'onChange' | 'value'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (val: string) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  name,
  label,
  value = '',
  onChange,
  onValueChange,
  options,
  placeholder = 'Select option...',
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
  style,
  ...rest
}) => {
  const isDisabled = disabled || isNotApplicable;

  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isDisabled) return;
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
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
      <select
        id={id}
        name={name}
        value={isNotApplicable ? 'N/A' : value}
        onChange={handleChange}
        disabled={isDisabled}
        style={{
          width: '100%',
          height: '38px',
          fontSize: '0.8125rem',
          paddingLeft: '10px',
          paddingRight: isNotApplicable ? '80px' : '28px',
          borderRadius: '6px',
          border: error 
            ? '1px solid #EF4444' 
            : isNotApplicable 
              ? '1px dashed #CBD5E1' 
              : '1px solid var(--border-color, #CBD5E1)',
          background: isNotApplicable 
            ? '#F8FAFC' 
            : isDisabled 
              ? '#F1F5F9' 
              : '#FFFFFF',
          color: isNotApplicable 
            ? 'var(--brand-orange, #F37023)' 
            : 'var(--text-color, #1E293B)',
          fontWeight: isNotApplicable ? 800 : 500,
          outline: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer'
        }}
        className="form-control"
        {...rest}
      >
        {isNotApplicable ? (
          <option value="N/A">Not Applicable</option>
        ) : (
          <>
            {placeholder && <option value="">{placeholder}</option>}
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
    </NotApplicableField>
  );
};
