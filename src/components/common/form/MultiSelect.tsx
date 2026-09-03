// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED MULTI-SELECT COMPONENT
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';
import { SelectOption } from './SelectInput';

export interface MultiSelectProps extends BaseFieldProps {
  values?: string[];
  onValuesChange?: (vals: string[]) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
  maxDisplayPills?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  values = [],
  onValuesChange,
  options,
  placeholder = 'Select one or more...',
  maxDisplayPills = 3,
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isNotApplicable;

  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string) => {
    if (isDisabled) return;
    if (!onValuesChange) return;
    if (values.includes(val)) {
      onValuesChange(values.filter(v => v !== val));
    } else {
      onValuesChange([...values, val]);
    }
  };

  const handleRemove = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (onValuesChange) {
      onValuesChange(values.filter(v => v !== val));
    }
  };

  const handleNA = (isNA: boolean) => {
    if (onNotApplicableChange) {
      onNotApplicableChange(isNA);
      if (isNA && onValuesChange) {
        onValuesChange([]);
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
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        {/* Toggle container */}
        <div
          id={id}
          onClick={() => {
            if (!isDisabled) setIsOpen(!isOpen);
          }}
          style={{
            width: '100%',
            minHeight: '38px',
            padding: '4px 8px',
            fontSize: '0.8125rem',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            flexWrap: 'wrap'
          }}
        >
          {isNotApplicable ? (
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
              Not Applicable (N/A)
            </span>
          ) : values.length === 0 ? (
            <span style={{ color: 'var(--text-muted, #94A3B8)', padding: '4px' }}>
              {placeholder}
            </span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {values.slice(0, maxDisplayPills).map(val => {
                const opt = normalizedOptions.find(o => o.value === val);
                return (
                  <span
                    key={val}
                    style={{
                      background: 'rgba(243, 112, 35, 0.1)',
                      color: 'var(--brand-navy, #0B192C)',
                      border: '1px solid rgba(243, 112, 35, 0.25)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {opt?.label || val}
                    {!isDisabled && (
                      <span onClick={(e) => handleRemove(e, val)} style={{ cursor: 'pointer', display: 'flex' }}>
                        <X size={11} color="#EF4444" />
                      </span>
                    )}
                  </span>
                );
              })}
              {values.length > maxDisplayPills && (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: 'var(--brand-orange, #F37023)',
                  background: '#F1F5F9',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  +{values.length - maxDisplayPills} more
                </span>
              )}
            </div>
          )}

          <ChevronDown size={14} color="var(--text-muted, #64748B)" style={{ marginLeft: 'auto' }} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && !isDisabled && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #CBD5E1)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 9999,
            padding: '6px',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '8px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                autoFocus
                style={{
                  width: '100%',
                  height: '32px',
                  paddingLeft: '28px',
                  paddingRight: '8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  outline: 'none'
                }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = values.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleToggle(opt.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isSelected ? 'rgba(243, 112, 35, 0.08)' : 'transparent',
                        color: isSelected ? 'var(--brand-orange, #F37023)' : 'var(--text-color, #1E293B)',
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      <span>{opt.label}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        style={{ accentColor: 'var(--brand-orange, #F37023)', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </NotApplicableField>
  );
};
