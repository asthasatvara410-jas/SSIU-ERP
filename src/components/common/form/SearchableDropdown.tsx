// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED SEARCHABLE DROPDOWN COMPONENT
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';
import { SelectOption } from './SelectInput';

export interface SearchableDropdownProps extends BaseFieldProps {
  value?: string;
  onValueChange?: (val: string) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  label,
  value = '',
  onValueChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search options...',
  emptyText = 'No matching options found',
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isNotApplicable;

  const normalizedOptions: SelectOption[] = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  const selectedOption = normalizedOptions.find(o => o.value === value);

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (isDisabled) return;
    if (onValueChange) onValueChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (onValueChange) onValueChange('');
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
      <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
        {/* Toggle Button */}
        <div
          id={id}
          onClick={() => {
            if (!isDisabled) setIsOpen(!isOpen);
          }}
          style={{
            width: '100%',
            minHeight: '38px',
            padding: '6px 10px',
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
            color: isNotApplicable 
              ? 'var(--brand-orange, #F37023)' 
              : selectedOption 
                ? 'var(--text-color, #1E293B)' 
                : 'var(--text-muted, #94A3B8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            userSelect: 'none'
          }}
        >
          <span style={{ fontWeight: isNotApplicable ? 800 : selectedOption ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isNotApplicable ? 'Not Applicable (N/A)' : (selectedOption?.label || placeholder)}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {value && !isDisabled && !isNotApplicable && (
              <span onClick={handleClear} style={{ color: '#94A3B8', padding: '2px', cursor: 'pointer' }} title="Clear Selection">
                <X size={13} />
              </span>
            )}
            <ChevronDown size={14} color="var(--text-muted, #64748B)" />
          </div>
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
            {/* Search Input inside Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} color="var(--text-muted, #64748B)" style={{ position: 'absolute', left: '8px' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
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

            {/* Options List */}
            <div style={{ overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
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
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} color="var(--brand-orange, #F37023)" />}
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
