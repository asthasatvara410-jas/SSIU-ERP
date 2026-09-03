// ==============================================================================
// SWARRNIM UNIVERSITY ERP — COMMON FORM INPUT TYPES & STANDARDS
// ==============================================================================

import React from 'react';

export type FieldRequirement = 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL' | 'NOT_APPLICABLE_ALLOWED';

export interface BaseFieldProps {
  id?: string;
  name?: string;
  label?: string;
  helperText?: string;
  error?: string;
  requirement?: FieldRequirement | boolean; // true = REQUIRED, false = OPTIONAL
  required?: boolean; // alias for requirement='REQUIRED'
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  allowNotApplicable?: boolean;
  isNotApplicable?: boolean;
  onNotApplicableChange?: (isNA: boolean) => void;
  notApplicableLabel?: string;
  tooltip?: string;
}

export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[]; // e.g. ['image/jpeg', 'image/png', 'application/pdf']
  allowedExtensions?: string[]; // e.g. ['.jpg', '.png', '.pdf', '.docx']
  maxFiles?: number;
}

export interface UploadedFileItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'READY' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  progress?: number;
  errorMessage?: string;
  uploadedAt?: string;
}
