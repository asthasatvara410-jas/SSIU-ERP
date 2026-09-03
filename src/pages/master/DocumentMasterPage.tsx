import React, { useState, useMemo, useRef } from 'react';
import {
  FileText, Plus, Search, Filter, Download, Upload, CheckCircle2,
  AlertTriangle, Eye, Edit2, ShieldAlert, Globe, Clock, FileSpreadsheet,
  X, Check, Lock, ChevronRight, Layers, ArrowUpDown, RefreshCw, AlertCircle
} from 'lucide-react';
import { documentMasterService } from '../../services/documentMasterService';
import { DocumentCategory, DocumentMasterItem, DocumentRequirementType, StudentTypeApplicability } from '../../types/documentMaster';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_NAMES: Record<DocumentCategory, string> = {
  ACADEMIC: 'Academic & Educational',
  IDENTITY: 'Identity & Verification',
  ADMISSION: 'Admission & Eligibility',
  UNIVERSITY_RECORD: 'University Academic Records',
  COMPLETION_EXIT: 'Program Completion & Exit',
  FINANCIAL_SCHOLARSHIP: 'Financial & Scholarship',
  INTERNATIONAL_STUDENT: 'International Student Documents',
  INTERNSHIP_TRAINING: 'Internship & Training',
  MEDICAL: 'Medical Records (Restricted)',
  OTHER: 'General & Other'
};

const INTL_SUBCATEGORIES = [
  { id: 'IDENTITY_NATIONALITY', label: '1. Identity & Nationality' },
  { id: 'IMMIGRATION_VISA', label: '2. Immigration & Visa / FRRO' },
  { id: 'ADMISSION', label: '3. International Admission' },
  { id: 'ACADEMIC_QUALIFICATION', label: '4. Academic Qualifications' },
  { id: 'FINANCIAL_SPONSORSHIP', label: '5. Financial & Sponsorship' },
  { id: 'MEDICAL_INSURANCE', label: '6. Medical & Insurance' },
  { id: 'ACCOMMODATION_LOCAL', label: '7. Accommodation & Local Info' },
  { id: 'UNIVERSITY_COMPLIANCE', label: '8. University Compliance' },
  { id: 'EXIT_COMPLETION', label: '9. Exit & FRRO Departure' }
];

export interface DocumentMasterPageProps {
  initialRecordId?: string;
}

export const DocumentMasterPage: React.FC<DocumentMasterPageProps> = ({ initialRecordId }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [selectedStudentType, setSelectedStudentType] = useState<StudentTypeApplicability | 'ALL'>('ALL');
  const [selectedRequirement, setSelectedRequirement] = useState<DocumentRequirementType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<DocumentMasterItem> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; importedCount: number; updatedCount: number; errors: string[] } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all documents
  const allDocs = useMemo(() => {
    return documentMasterService.getAllMasterDocuments({
      category: selectedCategory,
      subcategory: selectedSubcategory !== 'ALL' ? selectedSubcategory : undefined,
      studentType: selectedStudentType !== 'ALL' ? selectedStudentType : undefined,
      required: selectedRequirement !== 'ALL' ? selectedRequirement : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      searchQuery
    });
  }, [refreshKey, selectedCategory, selectedSubcategory, selectedStudentType, selectedRequirement, selectedStatus, searchQuery]);

  // Deep-link Auto-Open Exact Document
  React.useEffect(() => {
    if (initialRecordId && allDocs.length > 0) {
      const match = allDocs.find(d => d.id === initialRecordId || d.code === initialRecordId);
      if (match) {
        setEditingDoc(match);
        setIsEditModalOpen(true);
      }
    }
  }, [initialRecordId, allDocs]);

  // Overall counts
  const stats = useMemo(() => {
    const rawAll = documentMasterService.getAllMasterDocuments();
    return {
      total: rawAll.length,
      active: rawAll.filter(d => d.status === 'ACTIVE').length,
      international: rawAll.filter(d => d.category === 'INTERNATIONAL_STUDENT' || d.internationalOnly).length,
      required: rawAll.filter(d => d.required === 'REQUIRED').length,
      medical: rawAll.filter(d => d.category === 'MEDICAL').length
    };
  }, [refreshKey]);

  const handleOpenAddModal = () => {
    setEditingDoc({
      name: '',
      code: '',
      category: 'ACADEMIC',
      subcategory: '',
      description: '',
      required: 'REQUIRED',
      studentType: 'ALL',
      internationalOnly: false,
      verificationRequired: true,
      verifiedByRole: 'FACULTY_MENTOR',
      allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSize: 10,
      multipleFilesAllowed: false,
      expiryRequired: false,
      displayOrder: allDocs.length + 1,
      status: 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (doc: DocumentMasterItem) => {
    setEditingDoc({ ...doc });
    setIsEditModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editingDoc.name || !editingDoc.category) {
      showToast('Please provide mandatory Document Name and Category.', 'error');
      return;
    }

    try {
      documentMasterService.saveMasterDocument(editingDoc as any);
      setIsEditModalOpen(false);
      setEditingDoc(null);
      setRefreshKey(k => k + 1);
      showToast(`Document "${editingDoc.name}" saved successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save document.', 'error');
    }
  };

  const handleToggleStatus = (doc: DocumentMasterItem) => {
    const updated = documentMasterService.toggleMasterDocumentStatus(doc.id);
    if (updated) {
      setRefreshKey(k => k + 1);
      showToast(`Document "${doc.name}" marked as ${updated.status}.`, 'info');
    }
  };

  const handleExportXlsx = () => {
    try {
      documentMasterService.exportMasterDocumentsToExcel();
      showToast('Master Document Excel (.xlsx) exported successfully!', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      documentMasterService.downloadImportTemplate();
      showToast('Excel (.xlsx) import template downloaded.', 'info');
    } catch (err: any) {
      showToast('Download failed: ' + err.message, 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (!f.name.toLowerCase().endsWith('.xlsx')) {
        showToast('Only .xlsx Excel files are permitted. CSV is not supported.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setImportFile(f);
      setImportResult(null);
    }
  };

  const handleExecuteImport = async () => {
    if (!importFile) {
      showToast('Please select a valid .xlsx file to import.', 'error');
      return;
    }
    setImportLoading(true);
    try {
      const res = await documentMasterService.parseAndImportExcelFile(importFile);
      setImportResult(res);
      if (res.success) {
        setRefreshKey(k => k + 1);
        showToast(`Successfully imported ${res.importedCount} new, updated ${res.updatedCount} records!`, 'success');
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        importedCount: 0,
        updatedCount: 0,
        errors: [err.message || 'Import error occurred.']
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold text-white transition-all transform animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600' : toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header & Title */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
            <span>Administration</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span>Master Data</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-800 dark:text-gray-200">Document Master</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Document Master & Student Repository
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Single source of truth for all Academic, Identity, Admission & International student documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportXlsx}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Export full document catalog to Excel"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export (.xlsx)
          </button>
          <button
            onClick={() => { setImportFile(null); setImportResult(null); setIsImportModalOpen(true); }}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Import documents using .xlsx template"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Bulk Import (.xlsx)
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Documents</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Rules</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.international}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">International Docs</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.required}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Mandatory (Required)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.medical}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Restricted Medical</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search code, name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as any);
                setSelectedSubcategory('ALL');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Categories ({stats.total})</option>
              {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Student Type Filter */}
          <div>
            <select
              value={selectedStudentType}
              onChange={(e) => setSelectedStudentType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Student Types</option>
              <option value="DOMESTIC">Domestic Students Only</option>
              <option value="INTERNATIONAL">International Students Only</option>
            </select>
          </div>

          {/* Requirement Filter */}
          <div>
            <select
              value={selectedRequirement}
              onChange={(e) => setSelectedRequirement(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Requirement Rules</option>
              <option value="REQUIRED">Mandatory (REQUIRED)</option>
              <option value="OPTIONAL">Optional</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Dynamic International Subcategory Pills (when International or ALL is selected) */}
        {selectedCategory === 'INTERNATIONAL_STUDENT' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold shrink-0">Subcategory:</span>
            <button
              onClick={() => setSelectedSubcategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                selectedSubcategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              All 8 Subcategories (78 Docs)
            </button>
            {INTL_SUBCATEGORIES.map(sc => (
              <button
                key={sc.id}
                onClick={() => setSelectedSubcategory(sc.id)}
                className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                  selectedSubcategory === sc.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Master Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Configured Master Documents ({allDocs.length})
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Catalog
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-gray-900/20 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Code & Document Name</th>
                <th className="px-5 py-3.5">Category & Subcategory</th>
                <th className="px-5 py-3.5">Applicability</th>
                <th className="px-5 py-3.5">Requirement</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5">Format & Expiry</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {allDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-semibold text-gray-600 dark:text-gray-300">No documents found matching your filter</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing filters or search query to view master items.</p>
                  </td>
                </tr>
              ) : (
                allDocs.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-5 py-4 text-xs font-semibold text-gray-400 text-center">
                      {doc.displayOrder || index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                          {doc.code}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {doc.name}
                      </div>
                      {doc.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {doc.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {CATEGORY_NAMES[doc.category] || doc.category}
                      </div>
                      {doc.subcategory && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          {doc.subcategory.replace(/_/g, ' ')}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {doc.internationalOnly || doc.studentType === 'INTERNATIONAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Globe className="w-3 h-3" />
                          International
                        </span>
                      ) : doc.studentType === 'DOMESTIC' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          Domestic
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                          All Students
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {doc.required === 'REQUIRED' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                          Required
                        </span>
                      ) : doc.required === 'OPTIONAL' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Optional
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-400">
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                        {doc.verificationRequired ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {doc.verifiedByRole.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-gray-400">Direct Acceptance</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                        {doc.allowedFileTypes.map(t => t.toUpperCase()).join(', ')} ({doc.maxFileSize}MB)
                      </div>
                      {doc.expiryRequired && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          <Clock className="w-3 h-3" />
                          Expiry Date Required
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          doc.status === 'ACTIVE'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {doc.status === 'ACTIVE' ? (
                          <>
                            <Check className="w-3 h-3" /> Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(doc)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                          title="Edit Document Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Master Document Modal */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {editingDoc.id ? 'Edit Document Master Rule' : 'Add New Master Document'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Document Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DOC-ACA-001"
                    value={editingDoc.code || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingDoc.category || 'ACADEMIC'}
                    onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_NAMES).map(([k, name]) => (
                      <option key={k} value={k}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10th / SSC Marksheet"
                  value={editingDoc.name || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subcategory
                  </label>
                  {editingDoc.category === 'INTERNATIONAL_STUDENT' ? (
                    <select
                      value={editingDoc.subcategory || 'IDENTITY_NATIONALITY'}
                      onChange={(e) => setEditingDoc({ ...editingDoc, subcategory: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {INTL_SUBCATEGORIES.map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. SECONDARY, DEGREE, IDENTITY"
                      value={editingDoc.subcategory || ''}
                      onChange={(e) => setEditingDoc({ ...editingDoc, subcategory: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Student Applicability
                  </label>
                  <select
                    value={editingDoc.studentType || 'ALL'}
                    onChange={(e) => setEditingDoc({
                      ...editingDoc,
                      studentType: e.target.value as any,
                      internationalOnly: e.target.value === 'INTERNATIONAL'
                    })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Students (Domestic & International)</option>
                    <option value="DOMESTIC">Domestic Students Only</option>
                    <option value="INTERNATIONAL">International Students Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={editingDoc.required || 'REQUIRED'}
                    onChange={(e) => setEditingDoc({ ...editingDoc, required: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="REQUIRED">REQUIRED (Mandatory)</option>
                    <option value="OPTIONAL">OPTIONAL</option>
                    <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Verified By Role
                  </label>
                  <select
                    value={editingDoc.verifiedByRole || 'FACULTY_MENTOR'}
                    onChange={(e) => setEditingDoc({ ...editingDoc, verifiedByRole: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="FACULTY_MENTOR">FACULTY MENTOR</option>
                    <option value="HOD">HEAD OF DEPARTMENT (HOD)</option>
                    <option value="PRINCIPAL">HEAD OF INSTITUTE (HOI)</option>
                    <option value="STUDENT_SECTION">STUDENT SECTION</option>
                    <option value="REGISTRAR">REGISTRAR</option>
                    <option value="SUPER_ADMIN">UNIVERSITY ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingDoc.maxFileSize || 10}
                    onChange={(e) => setEditingDoc({ ...editingDoc, maxFileSize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description / Upload Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students regarding issuing body, attestation, format..."
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                  <input
                    type="checkbox"
                    checked={editingDoc.expiryRequired || false}
                    onChange={(e) => setEditingDoc({ ...editingDoc, expiryRequired: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">Expiry Date Required</div>
                    <div className="text-[11px] text-gray-500">Student must submit document issue & validity expiration dates</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                  <input
                    type="checkbox"
                    checked={editingDoc.internationalOnly || false}
                    onChange={(e) => setEditingDoc({ ...editingDoc, internationalOnly: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">International Student Only</div>
                    <div className="text-[11px] text-gray-500">Hide from domestic / Indian national student portals</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
                >
                  Save Master Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Bulk Import Master Documents (.xlsx)
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Strictly Excel (.xlsx) Only:</span> CSV files are not allowed. Please download our standard template containing columns for code, name, category, and requirements.
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Download Standard Template:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Template (.xlsx)
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {importFile ? importFile.name : 'Select or drop Excel (.xlsx) file here'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Accepts only .xlsx files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="mt-3 text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl text-xs space-y-1.5 ${
                  importResult.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {importResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Import Result: {importResult.importedCount} created, {importResult.updatedCount} updated
                  </div>
                  {importResult.errors.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 dark:text-rose-400">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!importFile || importLoading}
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:opacity-50 transition"
              >
                {importLoading ? 'Processing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
