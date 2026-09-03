// ==============================================================================
// SWARRNIM UNIVERSITY ERP — REUSABLE DRAG & DROP FILE UPLOADER
// ==============================================================================

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileText, Image as ImageIcon, File, CheckCircle2, 
  AlertCircle, X, Eye, RefreshCw, Trash2, Ban 
} from 'lucide-react';
import { BaseFieldProps, FileValidationOptions, UploadedFileItem } from './formTypes';
import { NotApplicableField } from './NotApplicableField';

export interface DragDropUploadProps extends BaseFieldProps, FileValidationOptions {
  value?: string | string[] | UploadedFileItem | UploadedFileItem[];
  onUploadSuccess?: (uploaded: UploadedFileItem | UploadedFileItem[]) => void;
  onFileUrlChange?: (url: string) => void;
  onRemove?: () => void;
  multiple?: boolean;
  dropZoneText?: string;
  browseBtnText?: string;
  showPreview?: boolean;
  accept?: string;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  id,
  label,
  value,
  onUploadSuccess,
  onFileUrlChange,
  onRemove,
  multiple = false,
  maxSizeMB = 5,
  allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'],
  dropZoneText = 'Drag & Drop files here or click to browse',
  browseBtnText = 'Browse Files',
  showPreview = true,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
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
  const [uploadingItem, setUploadingItem] = useState<UploadedFileItem | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || isNotApplicable;
  const currentError = propError || internalError;

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate File
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 1. Check size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds maximum allowed size of ${maxSizeMB} MB (${formatBytes(file.size)}).`
      };
    }

    // 2. Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File type "${ext}" is not allowed. Allowed types: ${allowedExtensions.join(', ')}.`
      };
    }

    return { valid: true };
  };

  // Process File Upload Simulation / Reader
  const processFile = (file: File) => {
    setInternalError(null);
    const validation = validateFile(file);
    if (!validation.valid) {
      setInternalError(validation.error || 'Invalid file');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const item: UploadedFileItem = {
      id: `file-${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: fileUrl,
      status: 'UPLOADING',
      progress: 20,
      uploadedAt: new Date().toISOString()
    };
    setUploadingItem(item);

    // Simulate smooth progress
    let p = 20;
    const timer = setInterval(() => {
      p += 30;
      if (p >= 100) {
        clearInterval(timer);
        const completed: UploadedFileItem = {
          ...item,
          status: 'COMPLETED',
          progress: 100
        };
        setUploadingItem(completed);
        if (onUploadSuccess) onUploadSuccess(completed);
        if (onFileUrlChange) onFileUrlChange(fileUrl);
      } else {
        setUploadingItem(prev => prev ? { ...prev, progress: p } : null);
      }
    }, 120);
  };

  // Drag Events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isDisabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadingItem(null);
    setInternalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
    if (onFileUrlChange) onFileUrlChange('');
  };

  const handleNA = (isNA: boolean) => {
    if (onNotApplicableChange) {
      onNotApplicableChange(isNA);
      if (isNA) {
        setUploadingItem(null);
        setInternalError(null);
        if (onFileUrlChange) onFileUrlChange('N/A');
      } else if (!isNA && onFileUrlChange) {
        onFileUrlChange('');
      }
    }
  };

  // Determine current active display (either uploadingItem or value prop string)
  const currentFileName = uploadingItem?.name || (typeof value === 'string' && value && value !== 'N/A' ? value.split('/').pop() || 'Uploaded Document' : null);
  const currentUrl = uploadingItem?.url || (typeof value === 'string' && value && value !== 'N/A' ? value : null);
  const isImage = currentFileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || uploadingItem?.type.startsWith('image/');

  return (
    <NotApplicableField
      id={id}
      label={label}
      helperText={helperText || `Max size: ${maxSizeMB} MB. Formats: ${allowedExtensions.join(', ')}`}
      error={currentError || undefined}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {/* Drag & Drop Box */}
        {!currentFileName && !isNotApplicable && (
          <div
            id={id}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            style={{
              width: '100%',
              minHeight: '110px',
              padding: '1.25rem',
              borderRadius: '8px',
              border: isDragOver
                ? '2px dashed var(--brand-orange, #F37023)'
                : currentError
                  ? '2px dashed #EF4444'
                  : '2px dashed var(--border-color, #CBD5E1)',
              background: isDragOver
                ? 'rgba(243, 112, 35, 0.08)'
                : isDisabled
                  ? '#F8FAFC'
                  : '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              userSelect: 'none'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={isDisabled}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: isDragOver ? 'var(--brand-orange, #F37023)' : 'rgba(243, 112, 35, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDragOver ? '#FFFFFF' : 'var(--brand-orange, #F37023)',
              transition: 'all 0.2s ease'
            }}>
              <UploadCloud size={20} />
            </div>

            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
              {dropZoneText}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-xs"
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                marginTop: '2px',
                pointerEvents: 'none'
              }}
            >
              {browseBtnText}
            </button>
          </div>
        )}

        {/* Uploaded File Info Card */}
        {currentFileName && !isNotApplicable && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#F8FAFC',
            border: '1px solid var(--border-color, #E2E8F0)'
          }}>
            {/* Icon and metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'rgba(243, 112, 35, 0.12)',
                color: 'var(--brand-orange, #F37023)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentFileName}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {uploadingItem?.size ? <span>{formatBytes(uploadingItem.size)}</span> : null}
                  <span style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                    <CheckCircle2 size={11} /> Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {showPreview && currentUrl && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPreviewModalUrl(currentUrl)}
                  title="Preview Document"
                  style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Eye size={12} /> Preview
                </button>
              )}

              {!isDisabled && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace File"
                >
                  <RefreshCw size={12} /> Replace
                </button>
              )}

              {!isDisabled && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={handleRemove}
                  title="Remove File"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar while uploading */}
        {uploadingItem && uploadingItem.status === 'UPLOADING' && (
          <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${uploadingItem.progress || 0}%`,
              height: '100%',
              background: 'var(--brand-orange, #F37023)',
              transition: 'width 0.15s ease'
            }} />
          </div>
        )}

        {/* N/A Empty Placeholder state */}
        {isNotApplicable && (
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--brand-orange, #F37023)',
            fontSize: '0.8125rem',
            fontWeight: 700
          }}>
            <Ban size={15} /> Document marked as Not Applicable (N/A)
          </div>
        )}
      </div>

      {/* Quick Image Preview Modal */}
      {previewModalUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            maxWidth: '650px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                Document Preview
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setPreviewModalUrl(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', background: '#0F172A', maxHeight: '70vh', overflowY: 'auto' }}>
              {isImage ? (
                <img src={previewModalUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '4px' }} />
              ) : (
                <div style={{ padding: '2rem', color: '#FFFFFF', textAlign: 'center' }}>
                  <FileText size={48} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 1rem auto' }} />
                  <p style={{ margin: 0 }}>PDF / Document Ready for Viewing</p>
                  <a href={previewModalUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </NotApplicableField>
  );
};

export const FileUpload = DragDropUpload;
