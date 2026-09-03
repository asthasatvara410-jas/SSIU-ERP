// ==============================================================================
// SWARRNIM UNIVERSITY ERP — BULK STUDENT MAPPING WIZARD MODAL
// ==============================================================================

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentEnrollmentMappingService } from '../../services/studentEnrollmentMappingService';
import { 
  BulkMappingValidationResult, 
  ParsedMappingRow, 
  BulkMappingExecutionResult 
} from '../../types/studentMapping';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, 
  XCircle, ArrowRight, ArrowLeft, RefreshCw, Eye, Check, Users,
  AlertCircle, ShieldCheck, Database, HelpCircle, FileText, Search
} from 'lucide-react';
import { Badge } from '../common/Badge';

export interface BulkStudentMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
  onViewHistory?: () => void;
  initialStep?: 1 | 2;
}

export const BulkStudentMappingModal: React.FC<BulkStudentMappingModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onViewHistory,
  initialStep = 1
}) => {
  const { user, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(initialStep);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<BulkMappingValidationResult | null>(null);
  const [executionResult, setExecutionResult] = useState<BulkMappingExecutionResult | null>(null);
  const [previewSearch, setPreviewSearch] = useState('');
  const [errorFilter, setErrorFilter] = useState<'ALL' | 'ERRORS_ONLY'>('ERRORS_ONLY');

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    studentEnrollmentMappingService.downloadExcelTemplate();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      alert('Invalid file format. Please upload an Excel (.xlsx) workbook.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = await studentEnrollmentMappingService.parseAndValidateExcel(buffer, user, role);
      setValidationResult(result);
      setCurrentStep(3); // Proceed to Validation Step
    } catch (err: any) {
      alert('Error parsing Excel file: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      alert('Invalid file format. Please upload an Excel (.xlsx) workbook.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const result = await studentEnrollmentMappingService.parseAndValidateExcel(buffer, user, role);
      setValidationResult(result);
      setCurrentStep(3);
    } catch (err: any) {
      alert('Error parsing Excel file: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!validationResult || !validationResult.canImport) return;

    setIsProcessing(true);
    try {
      const validRows = validationResult.rows.filter(r => r.isValid);
      const res = studentEnrollmentMappingService.executeBulkMappingTransaction(
        validRows,
        user,
        role,
        {
          fileName: selectedFile?.name || 'Bulk_Mapping.xlsx',
          fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '42 KB'
        }
      );

      setExecutionResult(res);
      setCurrentStep(5); // Result State
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      alert('Transaction Error: ' + (err?.message || 'Database error occurred during mapping.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!validationResult || validationResult.errorRows.length === 0) return;
    studentEnrollmentMappingService.downloadErrorExcel(validationResult.errorRows);
  };

  const handleDownloadImportReport = () => {
    if (!executionResult) return;
    studentEnrollmentMappingService.exportMappingReport(executionResult.historyId);
  };

  const filteredPreviewRows = (validationResult?.rows || []).filter(r => {
    if (!previewSearch) return true;
    const q = previewSearch.toLowerCase();
    return (
      r.enrollmentNo.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      (r.studentEmail && r.studentEmail.toLowerCase().includes(q)) ||
      r.programCode.toLowerCase().includes(q) ||
      r.departmentCode.toLowerCase().includes(q) ||
      r.instituteCode.toLowerCase().includes(q)
    );
  });

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: currentStep === 4 || currentStep === 3 ? '1200px' : '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Modal Header with Gradient & Stepper */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #001F3F 0%, #0F2C59 100%)',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={22} color="var(--brand-orange)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Bulk Student Enrollment & Academic Mapping
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Centralized single source of truth for Academic Years, Semesters, Divisions & Mentors
            </p>
          </div>

          {/* Stepper Indicator */}
          {currentStep !== 5 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.35rem 0.75rem', borderRadius: '30px' }}>
              {[
                { step: 1, label: '1. Template' },
                { step: 2, label: '2. Upload' },
                { step: 3, label: '3. Validate' },
                { step: 4, label: '4. Preview' }
              ].map(s => (
                <div 
                  key={s.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontWeight: currentStep === s.step ? 800 : 500,
                    color: currentStep === s.step ? 'var(--brand-orange)' : currentStep > s.step ? '#38BDF8' : 'rgba(255, 255, 255, 0.5)',
                    padding: '0.2rem 0.4rem'
                  }}
                >
                  <span>{s.label}</span>
                  {s.step < 4 && <span style={{ opacity: 0.3 }}>•</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', backgroundColor: '#F8FAFC' }}>

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: DOWNLOAD TEMPLATE & GUIDELINES
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div 
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FileSpreadsheet size={22} color="var(--brand-orange)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                        Step 1: Download Standard University Excel Template
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                      Download the official multi-sheet Excel template. The file contains pre-formatted columns on Sheet 1 (with freeze pane & sample rows) and exhaustive master reference values on Sheet 2.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadTemplate}
                    className="btn btn-navy"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.25rem',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      borderRadius: '8px'
                    }}
                  >
                    <Download size={16} /> Download Excel Template (.xlsx)
                  </button>
                </div>
              </div>

              {/* Template Columns & Rules Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 0 }}>
                    <CheckCircle2 size={16} color="#10B981" /> Required Columns
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                    <li><strong>Enrollment No</strong> (Unique student key)</li>
                    <li><strong>Student Name</strong> (Full student name)</li>
                    <li><strong>Institute</strong> (e.g. SSCIT, SOET)</li>
                    <li><strong>Department</strong> (e.g. CSE, IT, ME)</li>
                    <li><strong>Program Code</strong> (e.g. BTECH_CSE)</li>
                    <li><strong>Academic Year</strong> (e.g. 2025-26)</li>
                    <li><strong>Semester</strong> (Numeric 1 to 8)</li>
                    <li><strong>Division</strong> (e.g. A, B, C)</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 0 }}>
                    <Database size={16} color="var(--brand-orange)" /> Smart Central Upgrades
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                    <li><strong>No Duplicate Students:</strong> Existing enrollment numbers will have their academic placement updated.</li>
                    <li><strong>History Retention:</strong> Previous semester records remain saved in the database.</li>
                    <li><strong>Auto-Sync ERP:</strong> Updates reflect dynamically across Faculty rosters, Attendance, Timetable & Exams.</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 0 }}>
                    <ShieldCheck size={16} color="#3B82F6" /> Authorization & Rules
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                    <li>Do not change or delete column header names.</li>
                    <li>Only <strong>.xlsx</strong> files are supported.</li>
                    <li>Rows outside your authorized department will be rejected by security filters.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: UPLOAD FILLED EXCEL WORKBOOK
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '16px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx" 
                  style={{ display: 'none' }} 
                />

                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-orange)'
                  }}
                >
                  <Upload size={32} />
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Click to select or drag and drop your filled Excel file
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Supports standard Excel <strong>.xlsx</strong> workbooks with student mapping data
                </div>

                {isProcessing && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-orange)', fontWeight: 700, fontSize: '0.875rem' }}>
                    <RefreshCw size={18} className="spin-animation" /> Reading and validating student records...
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                >
                  <Download size={14} /> Need the template? Download here
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: AUTOMATED VALIDATION SUMMARY & ERROR RESOLUTION
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && validationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* File Info Bar */}
              <div 
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FileSpreadsheet size={20} color="var(--brand-orange)" />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>
                      {selectedFile?.name || 'Bulk_Mapping.xlsx'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                      ({selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '42 KB'})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {validationResult.errorRows.length > 0 && (
                    <button
                      onClick={handleDownloadErrors}
                      className="btn btn-sm btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      <Download size={14} /> Download Error Excel ({validationResult.errorRows.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setValidationResult(null);
                      setCurrentStep(2);
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} /> Upload Different File
                  </button>
                </div>
              </div>

              {/* KPI Metrics Cards */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Rows</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy)' }}>{validationResult.totalRows}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Valid Rows</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#16A34A' }}>{validationResult.validRows}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid ' + (validationResult.invalidRows > 0 ? '#FECACA' : '#E2E8F0'), textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: validationResult.invalidRows > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase' }}>Invalid Rows</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: validationResult.invalidRows > 0 ? '#DC2626' : '#64748B' }}>{validationResult.invalidRows}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>New Students</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284C7' }}>{validationResult.newStudentsCount}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Existing Mapped</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#D97706' }}>{validationResult.existingStudentsCount}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '10px', border: '1px solid ' + (validationResult.duplicateRowsCount > 0 ? '#FED7AA' : '#E2E8F0'), textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>Duplicate Rows</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: validationResult.duplicateRowsCount > 0 ? '#EA580C' : '#64748B' }}>{validationResult.duplicateRowsCount}</div>
                </div>
              </div>

              {/* Error Table or Success Banner */}
              {validationResult.errorRows.length > 0 ? (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #FCA5A5', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} color="#DC2626" />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
                        Validation Errors Found ({validationResult.errorRows.length} rows will be skipped)
                      </h4>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: '240px', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: '#FEF2F2', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#991B1B', width: '70px' }}>Row No</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#991B1B', width: '140px' }}>Enrollment No</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#991B1B', width: '180px' }}>Student Name</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#991B1B' }}>Validation Error Reason</th>
                          <th style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#991B1B', width: '90px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.errorRows.map(err => (
                          <tr key={err.rowNo} style={{ borderBottom: '1px solid #FEE2E2' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Row {err.rowNo}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}><code>{err.enrollmentNo || '-'}</code></td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{err.studentName || '-'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#DC2626' }}>
                              {err.errors.join('; ')}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                              <Badge variant="danger">INVALID</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div 
                  style={{
                    backgroundColor: '#F0FDF4',
                    borderRadius: '12px',
                    border: '1px solid #86EFAC',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem'
                  }}
                >
                  <CheckCircle2 size={28} color="#16A34A" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                      All {validationResult.totalRows} rows passed university master validation perfectly!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803D' }}>
                      Institutes, departments, programs, semesters, divisions, and mentor constraints are fully verified.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: PREVIEW BEFORE IMPORT
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 4 && validationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                    Final Mapping Preview ({validationResult.validRows} Valid Records Ready to Commit)
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Review resolved academic entities before saving to the central database.
                  </p>
                </div>

                <div style={{ position: 'relative', width: '280px' }}>
                  <input
                    className="form-control"
                    placeholder="Search in preview..."
                    value={previewSearch}
                    onChange={e => setPreviewSearch(e.target.value)}
                    style={{ fontSize: '0.8125rem', height: '36px', paddingLeft: '2rem' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Preview Table */}
              <div 
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  overflowX: 'auto',
                  maxHeight: '400px'
                }}
              >
                <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, borderBottom: '2px solid #CBD5E1', zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Enrollment No</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Student Name</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Program</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Department</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Academic Year</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Semester</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Division</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Class / Batch</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Mentor Faculty</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        style={{ 
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: !row.isValid ? '#FEF2F2' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                        }}
                      >
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <code style={{ color: 'var(--brand-orange)', fontWeight: 700, background: '#FFF7ED', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            {row.enrollmentNo}
                          </code>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {row.studentName}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{ fontWeight: 700 }}>{row.programCode}</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {row.departmentCode}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <Badge variant="navy">{row.academicYear}</Badge>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <Badge variant="navy">Sem {row.semesterNumber}</Badge>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{row.division}</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748B' }}>
                          {row.batchName || '-'}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                          {row.resolvedMentorName || row.mentorFaculty || 'Unassigned'}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          {!row.isValid ? (
                            <Badge variant="danger">ERROR</Badge>
                          ) : row.isExistingStudent ? (
                            <Badge variant="warning">UPDATE MAPPING</Badge>
                          ) : (
                            <Badge variant="active">NEW STUDENT</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 5: IMPORT RESULT STATE
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 5 && executionResult && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem', gap: '1.5rem' }}>
              <div 
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: executionResult.success ? '#DCFCE7' : '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: executionResult.success ? '#16A34A' : '#DC2626'
                }}
              >
                {executionResult.success ? <CheckCircle2 size={42} /> : <AlertTriangle size={42} />}
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy)', margin: '0 0 0.4rem 0' }}>
                  {executionResult.success ? 'Student Mapping Import Successful!' : 'Import Aborted with Errors'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '550px', margin: '0 auto', lineHeight: 1.5 }}>
                  {executionResult.message} Central academic records are immediately live across Faculty Roster, Attendance, Assignments & Examinations.
                </p>
              </div>

              {/* Execution Stats Card */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  width: '100%',
                  maxWidth: '750px'
                }}
              >
                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Processed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy)' }}>{executionResult.totalRecords}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Successfully Mapped</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A' }}>{executionResult.successfullyMapped}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>New Registered</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7' }}>{executionResult.newCreated}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Updated Existing</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D97706' }}>{executionResult.updatedExisting}</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid ' + (executionResult.failed > 0 ? '#FECACA' : '#E2E8F0') }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: executionResult.failed > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase' }}>Failed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: executionResult.failed > 0 ? '#DC2626' : '#64748B' }}>{executionResult.failed}</div>
                </div>
              </div>

              {/* Action Buttons in Result View */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button
                  onClick={onClose}
                  className="btn btn-navy"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
                >
                  <Users size={16} /> View Students in Directory
                </button>

                <button
                  onClick={handleDownloadImportReport}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
                >
                  <FileSpreadsheet size={16} /> Download Import Report (.xlsx)
                </button>

                {onViewHistory && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewHistory();
                    }}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
                  >
                    <FileText size={16} /> View Mapping History
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        {currentStep !== 5 && (
          <div 
            style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  disabled={isProcessing}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                Cancel
              </button>

              {currentStep === 1 && (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-navy"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Next: Upload Excel <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 3 && validationResult && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="btn btn-navy"
                  disabled={!validationResult.canImport || isProcessing}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Proceed to Preview ({validationResult.validRows} Rows) <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 4 && (
                <button
                  onClick={handleConfirmImport}
                  className="btn btn-primary"
                  disabled={isProcessing || !validationResult?.canImport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--brand-orange) 0%, #D95300 100%)',
                    boxShadow: '0 4px 12px rgba(243, 112, 35, 0.3)'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" /> Committing Transaction...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> Confirm & Import {validationResult?.validRows} Students
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
