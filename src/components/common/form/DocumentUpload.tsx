// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED DOCUMENT UPLOAD ITEM COMPONENT
// ==============================================================================

import React, { useState, useRef } from 'react';
import { 
  FileText, UploadCloud, CheckCircle2, XCircle, Clock, 
  Trash2, Eye, RefreshCw, Ban, AlertCircle 
} from 'lucide-react';
import { Badge } from '../Badge';
import { BaseFieldProps } from './formTypes';

export interface DocumentUploadProps extends BaseFieldProps {
  documentId: string;
  documentName: string;
  fileUrl?: string;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_APPLICABLE';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  onFileUploaded?: (fileUrl: string, fileName: string) => void;
  onRemove?: () => void;
  onPreview?: (fileUrl: string) => void;
  maxSizeMB?: number;
  allowedExtensions?: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  id,
  documentId,
  documentName,
  fileUrl,
  status = 'PENDING',
  rejectionReason,
  verifiedBy,
  verifiedAt,
  onFileUploaded,
  onRemove,
  onPreview,
  required,
  requirement,
  disabled = false,
  allowNotApplicable = true,
  isNotApplicable = false,
  onNotApplicableChange,
  maxSizeMB = 5,
  allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'],
  className = '',
  style
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReq = required || requirement === 'REQUIRED' || requirement === true;
  const isNA = isNotApplicable || status === 'NOT_APPLICABLE';
  const hasFile = Boolean(fileUrl && fileUrl !== 'N/A');

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB} MB.`);
      return;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      setError(`Only ${allowedExtensions.join(', ')} files are allowed.`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    if (onFileUploaded) onFileUploaded(localUrl, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isNA) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleToggleNA = (checked: boolean) => {
    if (onNotApplicableChange) {
      onNotApplicableChange(checked);
      if (checked) {
        setError(null);
        if (onFileUploaded) onFileUploaded('N/A', 'N/A');
      } else {
        if (onFileUploaded) onFileUploaded('', '');
      }
    }
  };

  return (
    <div
      id={id || `doc-upload-${documentId}`}
      className={`card ${className}`}
      style={{
        padding: '0.85rem 1rem',
        borderRadius: '8px',
        border: isDragOver
          ? '2px dashed var(--brand-orange, #F37023)'
          : isNA
            ? '1px dashed #CBD5E1'
            : status === 'REJECTED'
              ? '1px solid #FCA5A5'
              : status === 'VERIFIED'
                ? '1px solid #A7F3D0'
                : '1px solid var(--border-color, #E2E8F0)',
        background: isDragOver
          ? 'rgba(243, 112, 35, 0.05)'
          : isNA
            ? '#F8FAFC'
            : status === 'REJECTED'
              ? '#FFF5F5'
              : status === 'VERIFIED'
                ? '#F0FDF4'
                : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        transition: 'all 0.15s ease',
        ...style
      }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !isNA) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedExtensions.join(',')}
        onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
        disabled={disabled || isNA}
        style={{ display: 'none' }}
      />

      {/* Header Row: Document Name & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={16} color={isNA ? '#94A3B8' : 'var(--brand-orange, #F37023)'} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isNA ? 'var(--text-muted, #94A3B8)' : 'var(--brand-navy, #0B192C)' }}>
            {documentName}
          </span>
          {isReq && <span style={{ color: '#EF4444', fontWeight: 900 }} title="Mandatory Document">*</span>}
          {!isReq && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)' }}>(Optional)</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isNA ? (
            <Badge variant="navy">Not Applicable</Badge>
          ) : status === 'VERIFIED' ? (
            <Badge variant="active">
              <CheckCircle2 size={11} style={{ marginRight: '3px', display: 'inline' }} /> Verified
            </Badge>
          ) : status === 'REJECTED' ? (
            <Badge variant="danger">
              <XCircle size={11} style={{ marginRight: '3px', display: 'inline' }} /> Rejected
            </Badge>
          ) : hasFile ? (
            <Badge variant="gold">
              <Clock size={11} style={{ marginRight: '3px', display: 'inline' }} /> Pending Verification
            </Badge>
          ) : (
            <Badge variant="orange">Missing Document</Badge>
          )}

          {/* N/A Checkbox Toggle */}
          {allowNotApplicable && !isReq && onNotApplicableChange && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: isNA ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)',
                cursor: 'pointer',
                userSelect: 'none',
                marginLeft: '4px'
              }}
            >
              <input
                type="checkbox"
                checked={isNA}
                onChange={(e) => handleToggleNA(e.target.checked)}
                style={{ accentColor: 'var(--brand-orange, #F37023)', width: '12px', height: '12px' }}
              />
              <span>N/A</span>
            </label>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {status === 'REJECTED' && rejectionReason && !isNA && (
        <div style={{
          padding: '6px 8px',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#DC2626',
          fontSize: '0.725rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <AlertCircle size={13} />
          <span><strong>Reason:</strong> {rejectionReason}</span>
        </div>
      )}

      {/* Action / Drop Zone Area */}
      {!isNA && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '2px' }}>
          {hasFile ? (
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              File uploaded & ready
            </div>
          ) : (
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>
              Drag file here or click upload
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {hasFile && onPreview && fileUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => onPreview(fileUrl)}
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Eye size={11} /> View
              </button>
            )}

            {!disabled && (
              <button
                type="button"
                className={`btn btn-xs ${hasFile ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <UploadCloud size={11} /> {hasFile ? 'Replace' : 'Upload'}
              </button>
            )}

            {hasFile && !disabled && onRemove && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={onRemove}
                style={{ color: '#EF4444' }}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
};
