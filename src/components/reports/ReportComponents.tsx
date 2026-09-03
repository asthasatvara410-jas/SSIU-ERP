import React, { useState, useMemo } from 'react';
import { 
  ReportMode, SingleRecordType, ReportFilterOptions, 
  SingleRecordDossier, MultiRecordReportData, ReportHistoryItem,
  reportEngine 
} from '../../services/reportService';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { 
  FileText, Download, Printer, Search, ListFilter as Filter, 
  Users, GraduationCap, IndianRupee, Clock, CheckCircle2, 
  BookOpen, Award, Building2, Calendar, Bus, Home, ClipboardCheck, 
  RefreshCw, Layers, ShieldCheck, Check, ArrowRight, Eye, Trash2,
  ChevronDown, AlertCircle
} from 'lucide-react';

// =========================================================================
// 1. REPORT MODE SELECTOR
// =========================================================================

interface ReportModeSelectorProps {
  mode: ReportMode;
  onSelectMode: (mode: ReportMode) => void;
}

export const ReportModeSelector: React.FC<ReportModeSelectorProps> = ({ mode, onSelectMode }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: '#FFFFFF',
        padding: '0.5rem',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        flexWrap: 'wrap'
      }}
    >
      <button
        onClick={() => onSelectMode('SINGLE')}
        style={{
          flex: 1,
          minWidth: '180px',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: mode === 'SINGLE' ? '#0F2C59' : 'transparent',
          color: mode === 'SINGLE' ? '#FFFFFF' : '#475569',
          fontWeight: mode === 'SINGLE' ? 800 : 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <GraduationCap size={18} color={mode === 'SINGLE' ? '#F37023' : '#64748B'} />
        <span>1. Single Record Report</span>
      </button>

      <button
        onClick={() => onSelectMode('FILTERED')}
        style={{
          flex: 1,
          minWidth: '180px',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: mode === 'FILTERED' ? '#0F2C59' : 'transparent',
          color: mode === 'FILTERED' ? '#FFFFFF' : '#475569',
          fontWeight: mode === 'FILTERED' ? 800 : 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <Filter size={18} color={mode === 'FILTERED' ? '#F37023' : '#64748B'} />
        <span>2. Filter / Multi-Filter Report</span>
      </button>

      <button
        onClick={() => onSelectMode('DASHBOARD')}
        style={{
          flex: 1,
          minWidth: '180px',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: mode === 'DASHBOARD' ? '#0F2C59' : 'transparent',
          color: mode === 'DASHBOARD' ? '#FFFFFF' : '#475569',
          fontWeight: mode === 'DASHBOARD' ? 800 : 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <Layers size={18} color={mode === 'DASHBOARD' ? '#F37023' : '#64748B'} />
        <span>3. Dashboard Analytics Report</span>
      </button>
    </div>
  );
};

// =========================================================================
// 2. SINGLE RECORD SELECTOR
// =========================================================================

interface SingleRecordSelectorProps {
  selectedType: SingleRecordType;
  onSelectType: (type: SingleRecordType) => void;
  selectedRecordId: string;
  onSelectRecord: (recordId: string) => void;
  role?: string | null;
  user?: any;
}

export const SingleRecordSelector: React.FC<SingleRecordSelectorProps> = ({
  selectedType,
  onSelectType,
  selectedRecordId,
  onSelectRecord,
  role,
  user
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const recordTypes: { key: SingleRecordType; label: string; icon: any }[] = [
    { key: 'STUDENT', label: 'Student Dossier', icon: GraduationCap },
    { key: 'FACULTY', label: 'Faculty Directory', icon: Users },
    { key: 'FEE_ACCOUNT', label: 'Fee Account Statement', icon: IndianRupee },
    { key: 'ADMISSION', label: 'Admission Application', icon: BookOpen },
    { key: 'EXAM', label: 'Exam Record', icon: ClipboardCheck },
    { key: 'HOSTEL', label: 'Hostel Room Allocation', icon: Home },
    { key: 'TRANSPORT_ROUTE', label: 'Bus Route / Vehicle', icon: Bus },
    { key: 'REQUEST', label: 'Approval Request', icon: ShieldCheck },
    { key: 'EDP_DUTY', label: 'EDP Duty Record', icon: Award }
  ];

  const searchResults = useMemo(() => {
    return reportEngine.searchSingleRecords(selectedType, searchQuery, role, user);
  }, [selectedType, searchQuery, role, user]);

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59', marginBottom: '0.25rem' }}>
          Select Record Type &amp; Search Entity
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
          Generate a comprehensive, single-dossier report with complete audit history and verified academic data.
        </p>
      </div>

      {/* Type Pill Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {recordTypes.map(t => {
          const Icon = t.icon;
          const isSelected = selectedType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                onSelectType(t.key);
                setSearchQuery('');
              }}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '10px',
                border: isSelected ? '1px solid #0F2C59' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? '#0F2C59' : '#F8FAFC',
                color: isSelected ? '#FFFFFF' : '#334155',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={isSelected ? '#F37023' : '#64748B'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          color="#94A3B8"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder={`Search ${selectedType.toLowerCase()} by name, enrollment, employee code or ID...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.5rem',
            borderRadius: '12px',
            border: '1px solid #CBD5E1',
            fontSize: '0.875rem',
            backgroundColor: '#FFFFFF'
          }}
        />
      </div>

      {/* Records Selection Grid */}
      <div
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.75rem',
          padding: '0.25rem'
        }}
      >
        {searchResults.map(item => {
          const rawEnr = (item.raw as any)?.enrollmentNo;
          const isSelected = selectedRecordId === item.id || (rawEnr && selectedRecordId === rawEnr);
          return (
            <div
              key={item.id}
              onClick={() => onSelectRecord(rawEnr || item.id)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: isSelected ? '2px solid #0F2C59' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F2C59', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.primaryText}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.secondaryText}
                </div>
              </div>
              {item.tag && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: item.tag === 'ACTIVE' || item.tag === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                    color: item.tag === 'ACTIVE' || item.tag === 'PAID' ? '#166534' : '#92400E'
                  }}
                >
                  {item.tag}
                </span>
              )}
            </div>
          );
        })}
        {searchResults.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.875rem' }}>
            No matching records found for "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 3. REPORT FILTERS
// =========================================================================

interface ReportFiltersProps {
  filters: ReportFilterOptions;
  onChangeFilter: (filters: ReportFilterOptions) => void;
  category: string;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onChangeFilter, category }) => {
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const semesters = db.getSemesters();

  const filteredDepts = useMemo(() => {
    if (!filters.instituteId || filters.instituteId === 'ALL') return departments;
    return departments.filter(d => d.instituteId === filters.instituteId);
  }, [departments, filters.instituteId]);

  const filteredPrograms = useMemo(() => {
    if (!filters.departmentId || filters.departmentId === 'ALL') return programs;
    return programs.filter(p => p.departmentId === filters.departmentId);
  }, [programs, filters.departmentId]);

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59' }}>
            Multi-Filter Criteria Selection
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Combine institutional hierarchy, academic terms, payment thresholds, and shortage filters.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChangeFilter({ instituteId: 'ALL', departmentId: 'ALL', programId: 'ALL', academicYearId: 'ALL', semesterId: 'ALL', status: 'ALL', paymentStatus: 'ALL', attendanceStatus: 'ALL', searchQuery: '' })}
        >
          <RefreshCw size={14} /> Reset All Filters
        </button>
      </div>

      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Institute */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Constituent Institute
          </label>
          <select
            value={filters.instituteId || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, instituteId: e.target.value, departmentId: 'ALL' })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Institutes (Campus Wide)</option>
            {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Academic Department
          </label>
          <select
            value={filters.departmentId || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, departmentId: e.target.value, programId: 'ALL' })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Departments</option>
            {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Program */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Degree Program
          </label>
          <select
            value={filters.programId || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, programId: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Programs</option>
            {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Academic Session
          </label>
          <select
            value={filters.academicYearId || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, academicYearId: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Academic Years</option>
            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Semester Level
          </label>
          <select
            value={filters.semesterId || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, semesterId: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Semesters</option>
            {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.code || s.number}</option>)}
          </select>
        </div>

        {/* Attendance Filter Preset */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Attendance Shortage Filter
          </label>
          <select
            value={filters.attendanceStatus || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, attendanceStatus: e.target.value as any })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Attendance Ranges</option>
            <option value="LOW_ATTENDANCE">Low Attendance Shortage (&lt; 75%)</option>
            <option value="REGULAR">Regular Attendance (&gt;= 75%)</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Fee Payment Status
          </label>
          <select
            value={filters.paymentStatus || 'ALL'}
            onChange={e => onChangeFilter({ ...filters, paymentStatus: e.target.value as any })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="ALL">All Accounts (Paid &amp; Pending)</option>
            <option value="PENDING">Pending / Overdue Dues</option>
            <option value="PAID">Fully Paid Accounts</option>
          </select>
        </div>

        {/* Search Query */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
            Keyword Search Filter
          </label>
          <input
            type="text"
            placeholder="Search by student name, enrollment no, employee code, invoice ref..."
            value={filters.searchQuery || ''}
            onChange={e => onChangeFilter({ ...filters, searchQuery: e.target.value })}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. REPORT SUMMARY METRIC CARDS
// =========================================================================

interface ReportSummaryProps {
  metrics: { label: string; value: number | string; percentage?: number; color?: string; sublabel?: string }[];
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ metrics }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}
    >
      {metrics.map((m, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: '#FFFFFF',
            padding: '1.25rem',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            borderTop: `4px solid ${m.color || '#0F2C59'}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B' }}>
            {m.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0F2C59' }}>
              {m.value}
            </span>
            {m.percentage !== undefined && (
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  color: m.color || '#34A853',
                  backgroundColor: '#F8FAFC',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}
              >
                {m.percentage}%
              </span>
            )}
          </div>
          {m.sublabel && (
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
              {m.sublabel}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// =========================================================================
// 5. REPORT TABLE
// =========================================================================

interface ReportTableProps {
  headers: string[];
  rows: (string | number)[][];
}

export const ReportTable: React.FC<ReportTableProps> = ({ headers, rows }) => {
  return (
    <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2C59' }}>
          Itemized ERP Data Records ({rows.length} Total)
        </h4>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
          Official NAAC / UGC Audit Record Set
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#F8FAFC' }}>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0F2C59', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    {String(cell).includes('SHORTAGE') ? (
                      <span style={{ color: '#EA4335', fontWeight: 700 }}>{cell}</span>
                    ) : String(cell).includes('REGULAR') || String(cell).includes('ELIGIBLE') ? (
                      <span style={{ color: '#166534', fontWeight: 700 }}>{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                  No records found for the selected filter combination.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 6. REPORT EXPORT TOOLBAR
// =========================================================================

interface ReportExportToolbarProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  totalRecords: number;
}

export const ReportExportToolbar: React.FC<ReportExportToolbarProps> = ({
  onExportPDF,
  onExportExcel,
  onPrint,
  totalRecords
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '0.85rem 1.25rem',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={18} color="#166534" />
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F2C59' }}>
          Official Report Generation Desk ({totalRecords} Records)
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={onExportPDF}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={15} /> Download PDF Dossier
        </button>

        <button
          onClick={onExportExcel}
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Download size={15} /> Export Multi-Sheet Excel
        </button>

        <button
          onClick={onPrint}
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={15} /> Print Official Letterhead
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// 7. REPORT HISTORY DRAWER / SECTION
// =========================================================================

interface ReportHistoryProps {
  onRegenerate: (item: ReportHistoryItem) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({ onRegenerate }) => {
  const [history, setHistory] = useState<ReportHistoryItem[]>(() => reportEngine.getHistory());

  const handleClear = () => {
    reportEngine.clearHistory();
    setHistory([]);
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59' }}>
            Generated Report History &amp; Audit Logs
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Audit trail of recently generated university dossiers, filters applied, and export formats.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#EA4335' }}
          >
            <Trash2 size={13} /> Clear History
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Mode</th>
              <th>Module</th>
              <th>Generated Date</th>
              <th>Generated By</th>
              <th>Records</th>
              <th>Format</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id}>
                <td><strong>{item.reportName}</strong></td>
                <td><Badge variant="navy">{item.reportMode}</Badge></td>
                <td>{item.moduleOrType}</td>
                <td>{item.generatedDate}</td>
                <td>{item.generatedBy}</td>
                <td>{item.recordCount} Records</td>
                <td><Badge variant={item.exportFormat === 'PDF' ? 'orange' : 'active'}>{item.exportFormat}</Badge></td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onRegenerate(item)}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  >
                    View / Regenerate
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8' }}>
                  No reports generated yet in this session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
