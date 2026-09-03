// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED IMAGE / AVATAR UPLOAD COMPONENT
// ==============================================================================

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { BaseFieldProps } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface ImageUploadProps extends BaseFieldProps {
  value?: string;
  onImageUrlChange?: (url: string) => void;
  shape?: 'circle' | 'rectangle';
  width?: number | string;
  height?: number | string;
  placeholderText?: string;
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  id,
  label,
  value,
  onImageUrlChange,
  shape = 'circle',
  width = 110,
  height = 110,
  placeholderText = 'Upload Photo',
  maxSizeMB = 3,
  helperText,
  error: propError,
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || isNotApplicable;
  const currentError = propError || internalError;

  const handleFile = (file: File) => {
    setInternalError(null);
    if (!file.type.startsWith('image/')) {
      setInternalError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setInternalError(`Image size exceeds ${maxSizeMB} MB limit.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (onImageUrlChange) onImageUrlChange(previewUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isDisabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageUrlChange) onImageUrlChange('');
  };

  return (
    <NotApplicableField
      id={id}
      label={label}
      helperText={helperText || `Drag & Drop or click. Max: ${maxSizeMB} MB`}
      error={currentError || undefined}
      required={required}
      requirement={requirement}
      disabled={disabled}
      allowNotApplicable={allowNotApplicable}
      isNotApplicable={isNotApplicable}
      onNotApplicableChange={onNotApplicableChange}
      notApplicableLabel={notApplicableLabel}
      tooltip={tooltip}
      className={className}
      style={style}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Upload Thumbnail / Preview Area */}
        <div
          id={id}
          onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isDisabled && fileInputRef.current?.click()}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius: shape === 'circle' ? '50%' : '8px',
            border: isDragOver
              ? '2px dashed var(--brand-orange, #F37023)'
              : currentError
                ? '2px dashed #EF4444'
                : '2px dashed var(--border-color, #CBD5E1)',
            background: isDragOver
              ? 'rgba(243, 112, 35, 0.08)'
              : isDisabled
                ? '#F1F5F9'
                : '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
            disabled={isDisabled}
            style={{ display: 'none' }}
          />

          {value && value !== 'N/A' ? (
            <img
              src={value}
              alt="Uploaded Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted, #64748B)' }}>
              <Camera size={24} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 4px auto' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, display: 'block' }}>
                {placeholderText}
              </span>
            </div>
          )}

          {/* Hover Overlay */}
          {!isDisabled && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              opacity: 0,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              <Camera size={20} />
            </div>
          )}
        </div>

        {/* Action buttons & Hints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {!isDisabled && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw size={11} /> {value ? 'Change' : 'Browse'}
              </button>
            )}
            {value && value !== 'N/A' && !isDisabled && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleRemove}
                style={{ color: '#EF4444' }}
              >
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)' }}>
            Allowed formats: JPG, PNG, WebP (Max {maxSizeMB} MB)
          </span>
        </div>
      </div>
    </NotApplicableField>
  );
};
