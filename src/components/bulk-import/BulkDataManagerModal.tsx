import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  FileText,
  UserCheck,
  GraduationCap,
  BookOpen,
  DollarSign,
  Home,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  XCircle,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  BulkImportType,
  BulkImportStatus,
  BulkImportMode,
  BulkImportTemplateMeta,
  BulkImportSession,
  BulkImportRowItem,
} from '../../types';
import * as XLSX from 'xlsx';

interface BulkDataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: BulkImportType;
  onSuccess?: () => void;
}

export const BulkDataManagerModal: React.FC<BulkDataManagerModalProps> = ({
  isOpen,
  onClose,
  initialType = 'STUDENT',
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Steps: 1 (SELECT/TEMPLATE) -> 2 (UPLOAD) -> 3 (PREVIEW & MODE) -> 4 (SUCCESS/REPORT)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Template & Dataset selection
  const [templates, setTemplates] = useState<BulkImportTemplateMeta[]>([]);
  const [selectedType, setSelectedType] = useState<BulkImportType>(initialType);

  // Step 2: Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 3: Preview & Validation
  const [activeSession, setActiveSession] = useState<BulkImportSession | null>(null);
  const [previewRows, setPreviewRows] = useState<BulkImportRowItem[]>([]);
  const [importMode, setImportMode] = useState<BulkImportMode>('INSERT_ONLY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Step 4: Import Success / Result
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    session: BulkImportSession;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (initialType) setSelectedType(initialType);
    }
  }, [isOpen, user, initialType]);

  const loadTemplates = () => {
    const list = db.getBulkImportTemplates(user);
    setTemplates(list);
    if (list.length > 0 && !list.some(t => t.type === selectedType)) {
      setSelectedType(list[0].type);
    }
  };

  const handleDownloadTemplate = (type: BulkImportType) => {
    try {
      db.downloadBulkImportTemplate(type, user);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSpreadsheetFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSpreadsheetFile(file);
  };

  const processSpreadsheetFile = (file: File) => {
    setUploadError(null);
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');

    if (!isXlsx) {
      setUploadError('Invalid file format. Please upload the official .xlsx Excel template.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit. Please upload a smaller batch.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          setUploadError('The uploaded sheet contains no data rows.');
          setIsUploading(false);
          return;
        }

        setParsedRows(rows);
        setIsUploading(false);
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message}`);
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading spreadsheet file.');
      setIsUploading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleProceedToValidation = () => {
    if (!uploadedFile || parsedRows.length === 0) return;
    setIsValidating(true);

    setTimeout(() => {
      try {
        const session = db.uploadBulkImportFile({
          importType: selectedType,
          fileName: uploadedFile.name,
          rows: parsedRows,
        }, user);

        const preview = db.getBulkImportPreview(session.id, 1, 200, user);
        setActiveSession(session);
        setPreviewRows(preview.rows);
        setCurrentStep(3);
      } catch (err: any) {
        setUploadError(err.message);
      } finally {
        setIsValidating(false);
      }
    }, 300);
  };

  const handleRevalidateWithMode = (mode: BulkImportMode) => {
    if (!activeSession) return;
    setImportMode(mode);
    setIsValidating(true);

    setTimeout(() => {
      try {
        const updated = db.validateBulkImport(activeSession.id, mode, user);
        const preview = db.getBulkImportPreview(activeSession.id, 1, 200, user);
        setActiveSession(updated);
        setPreviewRows(preview.rows);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsValidating(false);
      }
    }, 250);
  };

  const handleConfirmImport = () => {
    if (!activeSession) return;
    setIsImporting(true);

    setTimeout(() => {
      try {
        const result = db.confirmBulkImport(activeSession.id, importMode, undefined, user);
        setImportResult({
          success: true,
          message: result.message,
          session: result.import,
        });
        setCurrentStep(4);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        alert(`Import execution failed: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
    }, 500);
  };

  const handleDownloadErrorReport = (sessionId?: string) => {
    const targetId = sessionId || activeSession?.id;
    if (!targetId) return;
    try {
      db.downloadBulkImportErrorReport(targetId, user);
    } catch (err: any) {
      alert(`Error report export failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedRows([]);
    setActiveSession(null);
    setPreviewRows([]);
    setImportResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPreviewRows = previewRows.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const rawStr = JSON.stringify(r.rawData).toLowerCase();
    const errStr = (r.errorMessage || '').toLowerCase();
    return rawStr.includes(q) || errStr.includes(q);
  });

  const getDatasetIcon = (type: BulkImportType) => {
    switch (type) {
      case 'STUDENT': return <GraduationCap size={18} color="var(--brand-orange)" />;
      case 'FACULTY': return <UserCheck size={18} color="#10B981" />;
      case 'SUBJECT': return <BookOpen size={18} color="#6366F1" />;
      case 'EXAM_FORM': return <FileText size={18} color="#F59E0B" />;
      case 'MARKS': return <ShieldCheck size={18} color="#8B5CF6" />;
      case 'FEE_ASSIGNMENT': return <DollarSign size={18} color="#0EA5E9" />;
      case 'HOSTEL_STUDENT':
      case 'HOSTEL_ROOM': return <Home size={18} color="#EC4899" />;
      case 'TRANSPORT_VEHICLE':
      case 'TRANSPORT_DRIVER':
      case 'TRANSPORT_ROUTE': return <Truck size={18} color="#14B8A6" />;
      default: return <Layers size={18} color="var(--brand-navy)" />;
    }
  };

  const selectedTpl = templates.find(t => t.type === selectedType);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Universal Bulk Data Management"
      subtitle="Production-grade Excel / CSV batch ingestion, validation, and multi-mode update engine"
      maxWidth="1000px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Wizard Steps Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {[
            { step: 1, label: '1. Select & Template' },
            { step: 2, label: '2. Upload Excel' },
            { step: 3, label: '3. Preview & Strategy' },
            { step: 4, label: '4. Final Report' },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-color)',
                background: currentStep === s.step ? 'var(--brand-navy)' : currentStep > s.step ? '#ECFDF5' : 'var(--bg-surface-hover)',
                color: currentStep === s.step ? '#FFFFFF' : currentStep > s.step ? '#065F46' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <span>{currentStep > s.step ? '✓' : s.step}.</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ─── STEP 1: SELECT DATASET & DOWNLOAD TEMPLATE ─── */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Choose Target Module &amp; Download Pre-Formatted Master Template
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Every template includes Sheet 1 (Data Layout) and Sheet 2 (Field Instructions &amp; Validation Rules).
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {templates.map((tpl) => {
                const isSelected = selectedType === tpl.type;
                return (
                  <div
                    key={tpl.type}
                    onClick={() => setSelectedType(tpl.type)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--brand-orange)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(243, 112, 35, 0.04)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getDatasetIcon(tpl.type)}
                          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>{tpl.name}</span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', background: 'var(--bg-surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {tpl.headers.length} Cols
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                        {tpl.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTemplate(tpl.type);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        <Download size={13} color="var(--brand-orange)" /> Template (.xlsx)
                      </button>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--brand-orange)' : 'var(--text-muted)' }}>
                        {isSelected ? '● Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setCurrentStep(2)}>
                Proceed to Upload <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: UPLOAD SPREADSHEET ─── */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Upload Populated File for {selectedTpl?.name}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Staging mode: Upload your completed .xlsx file. Data is validated safely in memory before any database write.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadTemplate(selectedType)}>
                <Download size={14} /> Download Template Again
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: uploadedFile ? '2px dashed #10B981' : '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: uploadedFile ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-surface-hover)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {uploadedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={28} />
                  </div>
                  <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '0.25rem' }}>{uploadedFile.name}</h5>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    File Size: {(uploadedFile.size / 1024).toFixed(1)} KB • Detected Rows: <strong>{parsedRows.length}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      setParsedRows([]);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', marginTop: '0.25rem' }}
                  >
                    Remove and choose another file
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(243, 112, 35, 0.1)', color: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={28} />
                  </div>
                  <h5 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '0.25rem' }}>
                    Click to browse or Drag &amp; Drop Excel spreadsheet
                  </h5>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Supports official Microsoft Excel (.xlsx) files up to 20MB
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button
                className="btn btn-primary"
                disabled={!uploadedFile || parsedRows.length === 0 || isValidating}
                onClick={handleProceedToValidation}
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Validating Rows...
                  </>
                ) : (
                  <>
                    Validate &amp; Preview Rows ({parsedRows.length}) <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: PREVIEW, STRATEGY & CONFIRMATION ─── */}
        {currentStep === 3 && activeSession && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Scanned</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '2px' }}>{activeSession.totalRows}</div>
              </div>
              <div className="card" style={{ padding: '0.85rem 1rem', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Valid Records</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{activeSession.validRows}</div>
              </div>
              <div className="card" style={{ padding: '0.85rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Invalid / Errors</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>{activeSession.invalidRows}</div>
              </div>
              <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Duplicates / Collisions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>{activeSession.duplicateRows}</div>
              </div>
            </div>

            {/* Execution Strategy Strategy Selector */}
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Execution Strategy &amp; Mode:</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose how existing database records are handled during batch ingestion.</div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <button
                  className={`btn btn-sm ${importMode === 'INSERT_ONLY' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => handleRevalidateWithMode('INSERT_ONLY')}
                >
                  Create New Only (Reject Duplicates)
                </button>
                <button
                  className={`btn btn-sm ${importMode === 'UPSERT' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  onClick={() => handleRevalidateWithMode('UPSERT')}
                >
                  Create + Update Existing (UPSERT)
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search row values / errors..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '34px' }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '150px', fontSize: '0.8125rem', height: '34px' }}
                >
                  <option value="ALL">All Rows ({previewRows.length})</option>
                  <option value="VALID">Valid Only ({activeSession.validRows})</option>
                  <option value="INVALID">Errors Only ({activeSession.invalidRows})</option>
                  <option value="DUPLICATE">Duplicates ({activeSession.duplicateRows})</option>
                </select>
              </div>

              {(activeSession.invalidRows > 0 || activeSession.duplicateRows > 0) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadErrorReport()}
                  title="Download Excel error report with exact row numbers and correction guidelines"
                >
                  <Download size={14} color="#EF4444" /> Download Error Report (.xlsx)
                </button>
              )}
            </div>

            {/* Interactive Preview Table */}
            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-surface-hover)', position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.65rem 0.85rem', width: '60px' }}>Row #</th>
                    <th style={{ padding: '0.65rem 0.85rem', width: '110px' }}>Status</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Primary Key / Identifier</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Attributes Preview</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Validation Status / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No rows match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewRows.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)', background: r.status === 'INVALID' ? 'rgba(239,68,68,0.04)' : r.status === 'DUPLICATE' ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                        <td style={{ padding: '0.5rem 0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{r.rowNumber}</td>
                        <td style={{ padding: '0.5rem 0.85rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            background: r.status === 'VALID' ? '#D1FAE5' : r.status === 'DUPLICATE' ? '#FEF3C7' : '#FEE2E2',
                            color: r.status === 'VALID' ? '#065F46' : r.status === 'DUPLICATE' ? '#92400E' : '#991B1B'
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {r.parsedData?.enrollmentNo || r.parsedData?.employeeId || r.parsedData?.code || JSON.stringify(r.rawData).substring(0, 24)}
                        </td>
                        <td style={{ padding: '0.5rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {Object.entries(r.rawData).slice(1, 4).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </td>
                        <td style={{ padding: '0.5rem 0.85rem' }}>
                          {r.errorMessage ? (
                            <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={13} /> {r.errorMessage}
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 600 }}>
                              ✓ Ready for commit
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                Back to File Upload
              </button>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <strong>{activeSession.validRows}</strong> valid records will be committed.
                </span>
                <button
                  className="btn btn-primary"
                  disabled={activeSession.validRows === 0 || isImporting}
                  onClick={handleConfirmImport}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Ingesting Records...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirm &amp; Import Valid Records ({activeSession.validRows})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: FINAL REPORT SUMMARY ─── */}
        {currentStep === 4 && importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Bulk Data Import Executed Successfully
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Official Transaction Ref: <strong style={{ color: 'var(--brand-orange)', fontFamily: 'monospace' }}>{importResult.session.importNo}</strong>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: '540px' }}>
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface-hover)', textAlign: 'left' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Processed</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{importResult.session.totalRows}</div>
              </div>
              <div className="card" style={{ padding: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'left' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#065F46' }}>Committed / Saved</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>{importResult.session.importedRows}</div>
              </div>
              <div className="card" style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', textAlign: 'left' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#991B1B' }}>Skipped / Errors</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626' }}>{importResult.session.invalidRows + importResult.session.duplicateRows}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
              {(importResult.session.invalidRows > 0 || importResult.session.duplicateRows > 0) && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDownloadErrorReport(importResult.session.id)}
                >
                  <Download size={15} color="#EF4444" /> Download Error Report
                </button>
              )}
              <button className="btn btn-primary" onClick={onClose}>
                Done &amp; Return to View
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
