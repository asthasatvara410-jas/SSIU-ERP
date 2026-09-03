import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  ChevronRight,
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

export const BulkImportPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs: 'IMPORT' | 'HISTORY'
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'HISTORY'>('IMPORT');

  // Wizard Steps: 1 (SELECT) -> 2 (UPLOAD) -> 3 (PREVIEW) -> 4 (SUCCESS)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Template & Dataset selection
  const [templates, setTemplates] = useState<BulkImportTemplateMeta[]>([]);
  const [selectedType, setSelectedType] = useState<BulkImportType>('STUDENT');
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('inst-1');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('dept-1');

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

  // Step 4: Import Success
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    session: BulkImportSession;
  } | null>(null);

  // History Tab
  const [historyList, setHistoryList] = useState<BulkImportSession[]>([]);
  const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('ALL');
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<BulkImportSession | null>(null);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, [user]);

  const loadTemplates = () => {
    const list = db.getBulkImportTemplates(user);
    setTemplates(list);
    if (list.length > 0 && !list.some(t => t.type === selectedType)) {
      setSelectedType(list[0].type);
    }
  };

  const loadHistory = () => {
    const list = db.getBulkImportHistory({
      importType: historyFilterType !== 'ALL' ? historyFilterType : undefined,
      status: historyFilterStatus !== 'ALL' ? historyFilterStatus : undefined,
    }, user);
    setHistoryList(list);
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
      setUploadError('Error reading file.');
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
          instituteId: selectedInstituteId,
          departmentId: selectedDepartmentId,
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
    }, 400);
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
    }, 300);
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
        loadHistory();
      } catch (err: any) {
        alert(`Import execution failed: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
    }, 800);
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

  const handleResetWizard = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedRows([]);
    setActiveSession(null);
    setPreviewRows([]);
    setImportResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for preview table
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
      case 'STUDENT': return <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FACULTY': return <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'STAFF': return <UserCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'SUBJECT': return <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'EXAM_FORM': return <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'MARKS': return <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'HOSTEL_STUDENT':
      case 'HOSTEL_ROOM': return <Home className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'FEE_ASSIGNMENT': return <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'TRANSPORT_VEHICLE':
      case 'TRANSPORT_DRIVER':
      case 'TRANSPORT_ROUTE': return <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      default: return <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
      case 'IMPORTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle className="w-3 h-3 mr-1" />{status}</span>;
      case 'INVALID':
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"><XCircle className="w-3 h-3 mr-1" />{status}</span>;
      case 'DUPLICATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"><AlertTriangle className="w-3 h-3 mr-1" />DUPLICATE</span>;
      case 'PARTIALLY_IMPORTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"><Info className="w-3 h-3 mr-1" />PARTIAL</span>;
      case 'READY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"><CheckCircle className="w-3 h-3 mr-1" />READY</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  University Centralized Bulk Excel Import Center
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  High-performance, transaction-safe bulk data ingestion engine with live pre-import validation and duplicate detection
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('IMPORT'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'IMPORT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <UploadCloud className="w-4 h-4 inline-block mr-1.5" />
              New Bulk Import
            </button>
            <button
              onClick={() => { setActiveTab('HISTORY'); loadHistory(); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-1.5" />
              Import History & Logs
            </button>
          </div>
        </div>

        {/* Wizard Step Indicator (when on IMPORT tab) */}
        {activeTab === 'IMPORT' && (
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: '1. Select Dataset & Template' },
                { step: 2, label: '2. Upload Spreadsheet' },
                { step: 3, label: '3. Pre-Import Validation' },
                { step: 4, label: '4. Summary & Status' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`flex items-center space-x-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    currentStep === s.step
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : currentStep > s.step
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === s.step
                        ? 'bg-indigo-600 text-white'
                        : currentStep > s.step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </span>
                  <span className="truncate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TAB CONTENT: NEW IMPORT */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-6">
          {/* ────────────────── STEP 1: SELECT DATASET & DOWNLOAD TEMPLATE ────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Step 1: Choose Dataset & Download Master Excel Template
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select an authorized dataset type below and download the official pre-formatted Excel template.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((tpl) => {
                    const isSelected = selectedType === tpl.type;
                    return (
                      <div
                        key={tpl.type}
                        onClick={() => setSelectedType(tpl.type)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                              {getDatasetIcon(tpl.type)}
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                              {tpl.headers.length} Columns
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-3">
                            {tpl.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(tpl.type);
                            }}
                            className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download Template
                          </button>
                          <span className={`text-xs font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                            {isSelected ? '● Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center transition-all"
                  >
                    Proceed to Upload Spreadsheet
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 2: UPLOAD SPREADSHEET ────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Step 2: Upload Excel File for {templates.find(t => t.type === selectedType)?.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload your populated Microsoft Excel template (.xlsx). Files are staged for validation first.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadTemplate(selectedType)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download Template Again
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    uploadedFile
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {uploadedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {uploadedFile.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Size: {(uploadedFile.size / 1024).toFixed(1)} KB • Detected Rows: {parsedRows.length}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setParsedRows([]);
                        }}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline pt-2 inline-block"
                      >
                        Remove and select another file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Click to upload or drag & drop Excel spreadsheet
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Supports official Microsoft Excel (.xlsx) files up to 20MB
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Back to Dataset Selection
                  </button>

                  <button
                    disabled={!uploadedFile || parsedRows.length === 0 || isValidating}
                    onClick={handleProceedToValidation}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center transition-all"
                  >
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Validating Data Rows...
                      </>
                    ) : (
                      <>
                        Validate & Preview Rows ({parsedRows.length})
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 3: PRE-IMPORT VALIDATION & PREVIEW ────────────────── */}
          {currentStep === 3 && activeSession && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Scanned</span>
                    <Layers className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {activeSession.totalRows}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Rows in spreadsheet</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Valid Records</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {activeSession.validRows}
                  </div>
                  <p className="text-xs text-emerald-600/80 mt-1">Ready for commit</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Invalid Records</span>
                    <XCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {activeSession.invalidRows}
                  </div>
                  <p className="text-xs text-rose-600/80 mt-1">Validation errors</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Duplicates</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {activeSession.duplicateRows}
                  </div>
                  <p className="text-xs text-amber-600/80 mt-1">In file / DB matches</p>
                </div>
              </div>

              {/* Mode Selection & Controls */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                      <SlidersHorizontal className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Import Mode & Execution Strategy
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Protected fields (Enrollment Numbers, Student IDs, User IDs) are immutable under all modes.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleRevalidateWithMode('INSERT_ONLY')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          importMode === 'INSERT_ONLY'
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                        }`}
                      >
                        INSERT ONLY (Reject Duplicates)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevalidateWithMode('UPSERT')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          importMode === 'UPSERT'
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                        }`}
                      >
                        UPSERT (Update Existing)
                      </button>
                    </div>

                    {(activeSession.invalidRows > 0 || activeSession.duplicateRows > 0) && (
                      <button
                        onClick={() => handleDownloadErrorReport()}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-lg flex items-center"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download Error Report (.xlsx)
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search row contents / errors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                    >
                      <option value="ALL">All Statuses ({previewRows.length})</option>
                      <option value="VALID">Valid ({activeSession.validRows})</option>
                      <option value="INVALID">Invalid ({activeSession.invalidRows})</option>
                      <option value="DUPLICATE">Duplicates ({activeSession.duplicateRows})</option>
                    </select>
                  </div>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {filteredPreviewRows.length} of {previewRows.length} rows
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-16">Row #</th>
                        <th className="px-4 py-3 font-semibold w-28">Status</th>
                        <th className="px-4 py-3 font-semibold">Primary Key / Identifiers</th>
                        <th className="px-4 py-3 font-semibold">Attributes Snapshot</th>
                        <th className="px-4 py-3 font-semibold">Validation Error / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r) => {
                          const isErr = r.status === 'INVALID' || r.status === 'FAILED';
                          const isDup = r.status === 'DUPLICATE';
                          return (
                            <tr
                              key={r.id}
                              className={`hover:bg-gray-50/50 dark:hover:bg-gray-750 ${
                                isErr
                                  ? 'bg-rose-50/30 dark:bg-rose-950/20'
                                  : isDup
                                  ? 'bg-amber-50/30 dark:bg-amber-950/20'
                                  : ''
                              }`}
                            >
                              <td className="px-4 py-2.5 font-mono text-gray-500 dark:text-gray-400">
                                {r.rowNumber}
                              </td>
                              <td className="px-4 py-2.5">
                                {getStatusBadge(r.status)}
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">
                                {r.parsedData?.enrollmentNo ||
                                  r.parsedData?.employeeId ||
                                  r.parsedData?.code ||
                                  r.parsedData?.registrationNumber ||
                                  r.parsedData?.driverName ||
                                  r.parsedData?.routeNumber ||
                                  JSON.stringify(r.rawData).substring(0, 30)}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 font-mono text-[11px] truncate max-w-xs">
                                {Object.entries(r.rawData).slice(1, 4).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </td>
                              <td className="px-4 py-2.5">
                                {r.errorMessage ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                                    {r.errorField && <strong className="mr-1">{r.errorField}:</strong>}
                                    {r.errorMessage}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    ✓ Ready for ingestion
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Confirm Actions Bar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100"
                  >
                    Upload Corrected File
                  </button>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activeSession.validRows} valid rows will be committed.
                    </span>

                    <button
                      disabled={activeSession.validRows === 0 || isImporting}
                      onClick={handleConfirmImport}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center transition-all"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Committing Records...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Import Valid Records ({activeSession.validRows})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 4: SUCCESS SUMMARY ────────────────── */}
          {currentStep === 4 && importResult && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bulk Import Executed Successfully!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Import ID: <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{importResult.session.importNo}</span>
                </p>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-750 rounded-xl text-left border border-gray-100 dark:border-gray-700">
                <div>
                  <span className="text-xs text-gray-400">Total Processed</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{importResult.session.totalRows}</div>
                </div>
                <div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Successfully Imported</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{importResult.session.importedRows}</div>
                </div>
                <div>
                  <span className="text-xs text-rose-600 dark:text-rose-400">Skipped / Failed</span>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{importResult.session.invalidRows + importResult.session.duplicateRows}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetWizard}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Start New Import
                </button>
                <button
                  onClick={() => { setActiveTab('HISTORY'); }}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  View in Import History
                </button>
                {(importResult.session.invalidRows > 0 || importResult.session.duplicateRows > 0) && (
                  <button
                    onClick={() => handleDownloadErrorReport(importResult.session.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-lg hover:bg-rose-100"
                  >
                    Download Error Report
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB CONTENT: IMPORT HISTORY & LOGS ────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Bulk Import Audit History
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chronological trail of all spreadsheet data imports and execution summaries.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={historyFilterType}
                  onChange={(e) => setHistoryFilterType(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                >
                  <option value="ALL">All Datasets</option>
                  <option value="STUDENT">Students</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="SUBJECT">Subjects</option>
                  <option value="EXAM_FORM">Exam Forms</option>
                  <option value="MARKS">Marks</option>
                  <option value="FEE_ASSIGNMENT">Fees</option>
                  <option value="HOSTEL_STUDENT">Hostel</option>
                  <option value="TRANSPORT_VEHICLE">Transport</option>
                </select>

                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IMPORTED">Imported</option>
                  <option value="PARTIALLY_IMPORTED">Partial</option>
                  <option value="FAILED">Failed</option>
                </select>

                <button
                  onClick={loadHistory}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* History List Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Import ID</th>
                    <th className="px-4 py-3 font-semibold">Dataset Type</th>
                    <th className="px-4 py-3 font-semibold">File Name</th>
                    <th className="px-4 py-3 font-semibold">Uploaded By</th>
                    <th className="px-4 py-3 font-semibold">Date & Time</th>
                    <th className="px-4 py-3 font-semibold text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Imported</th>
                    <th className="px-4 py-3 font-semibold text-center">Skipped/Failed</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {historyList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                        No bulk import history records found.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.importNo}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center font-medium text-gray-900 dark:text-white">
                            {getDatasetIcon(item.importType)}
                            <span className="ml-1.5">{item.importType}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                          {item.fileName}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {item.uploadedByName} <span className="text-[10px] text-gray-400">({item.uploadedByRole})</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">
                          {item.totalRows}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.importedRows}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                          {item.invalidRows + item.duplicateRows}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedHistoryDetail(item)}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 text-[11px] font-semibold rounded"
                          >
                            Details
                          </button>
                          {(item.invalidRows > 0 || item.duplicateRows > 0) && (
                            <button
                              onClick={() => handleDownloadErrorReport(item.id)}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-[11px] font-semibold rounded inline-flex items-center"
                              title="Download Error Report"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Errors
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistoryDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Bulk Import Session: {selectedHistoryDetail.importNo}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedHistoryDetail.fileName} • {selectedHistoryDetail.importType}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <span className="text-gray-400 block">Uploaded By</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedHistoryDetail.uploadedByName}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <span className="text-gray-400 block">Status</span>
                <span className="mt-0.5 inline-block">{getStatusBadge(selectedHistoryDetail.status)}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <span className="text-gray-400 block">Import Mode</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedHistoryDetail.importMode}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <span className="text-gray-400 block">Created At</span>
                <span className="font-semibold text-gray-900 dark:text-white">{new Date(selectedHistoryDetail.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Audit events timeline */}
            {selectedHistoryDetail.history && selectedHistoryDetail.history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">Execution Audit Trail</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedHistoryDetail.history.map((h) => (
                    <div key={h.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-750 rounded border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{h.action}:</span> {h.details}
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {(selectedHistoryDetail.invalidRows > 0 || selectedHistoryDetail.duplicateRows > 0) && (
                <button
                  onClick={() => handleDownloadErrorReport(selectedHistoryDetail.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold rounded-lg hover:bg-rose-100 flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download Error Report
                </button>
              )}
              <button
                onClick={() => setSelectedHistoryDetail(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
