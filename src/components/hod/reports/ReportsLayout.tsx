import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService } from '../../../services/departmentScopeService';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { 
  FileSpreadsheet, Download, Printer, RotateCcw, Search, 
  Building2, Calendar, Filter, RefreshCw, CheckCircle2, ChevronRight
} from 'lucide-react';

export type ReportTabKey = 
  | 'ACADEMIC'
  | 'ATTENDANCE'
  | 'STUDENT'
  | 'FACULTY'
  | 'DEPARTMENT';

export interface ReportKPICard {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string; // Hex or theme color for left border
  textColor?: string;
  badgeText?: string;
  badgeVariant?: 'active' | 'navy' | 'warning' | 'danger' | 'purple';
}

export interface ReportsLayoutProps {
  currentTab: ReportTabKey;
  onTabChange?: (tab: ReportTabKey) => void;
  title: string;
  subtitle: string;
  kpis: ReportKPICard[];
  // Filters
  selectedProgram: string;
  onProgramChange: (val: string) => void;
  selectedSemester: string;
  onSemesterChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
  extraFilterSlot?: React.ReactNode;
  // Export actions
  onExportXLSX: () => void;
  onExportPDF?: () => void;
  pdfTitle?: string;
  pdfDataPreview?: {
    summary: { label: string; value: string | number }[];
    headers: string[];
    rows: (string | number)[][];
  };
  children: React.ReactNode;
}

export const ReportsLayout: React.FC<ReportsLayoutProps> = ({
  currentTab,
  onTabChange,
  title,
  subtitle,
  kpis,
  selectedProgram,
  onProgramChange,
  selectedSemester,
  onSemesterChange,
  searchQuery,
  onSearchChange,
  onResetFilters,
  extraFilterSlot,
  onExportXLSX,
  onExportPDF,
  pdfTitle,
  pdfDataPreview,
  children
}) => {
  const { user, role } = useAuth();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scope = departmentScopeService.resolveScopeIdentity(user, role || undefined);

  const handlePrintTrigger = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      setIsPdfModalOpen(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ 
          padding: '0.75rem 1.25rem', 
          backgroundColor: '#ECFDF5', 
          border: '1px solid #10B981', 
          color: '#065F46', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '0.84rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} color="#10B981" /> {toastMessage}
        </div>
      )}

      {/* ═══ 1. SUB-NAVIGATION SWITCHER (5 DEDICATED REPORT ROUTES) ═══ */}
      {onTabChange && (
        <div style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          background: '#FFFFFF', 
          padding: '0.5rem 0.75rem', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', marginRight: '0.5rem', textTransform: 'uppercase' }}>
            REPORT DOMAIN:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'ACADEMIC' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onTabChange('ACADEMIC')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            1. Academic Reports
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'ATTENDANCE' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onTabChange('ATTENDANCE')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            2. Attendance Reports
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onTabChange('STUDENT')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            3. Student Reports
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'FACULTY' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onTabChange('FACULTY')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            4. Faculty Reports
          </button>
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'DEPARTMENT' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onTabChange('DEPARTMENT')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            5. Department Reports
          </button>
        </div>
      )}

      {/* ═══ 2. HEADER & EXPORT TOOLBAR ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: '1.25rem 1.5rem', 
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 70%, #0F172A 100%)', 
          color: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ 
              fontSize: '0.725rem', 
              fontWeight: 800, 
              color: 'var(--brand-orange, #F37023)', 
              background: 'rgba(243, 112, 35, 0.18)', 
              padding: '2px 8px', 
              borderRadius: '4px',
              border: '1px solid rgba(243, 112, 35, 0.3)'
            }}>
              [{scope.departmentCode}] {scope.departmentName}
            </span>
            <span style={{ 
              fontSize: '0.725rem', 
              fontWeight: 700, 
              color: '#93C5FD', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              AY 2025–2026
            </span>
            <span style={{ 
              fontSize: '0.725rem', 
              fontWeight: 700, 
              color: '#86EFAC', 
              background: 'rgba(34, 197, 94, 0.15)', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              OFFICIAL HOD AUDIT
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', margin: '3px 0 0 0' }}>
            {subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onExportXLSX}
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem', 
              fontWeight: 800,
              background: '#FFFFFF',
              color: 'var(--brand-navy)'
            }}
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet size={15} color="#10B981" /> Download XLSX
          </button>

          <button
            type="button"
            onClick={handlePrintTrigger}
            className="btn btn-primary btn-sm"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              fontSize: '0.75rem', 
              fontWeight: 800 
            }}
            title="Download PDF or Print Official Report"
          >
            <Printer size={15} /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* ═══ 3. TOP KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`, gap: '0.75rem' }}>
        {kpis.map((kpi, idx) => (
          <div 
            key={idx}
            className="card" 
            style={{ 
              padding: '0.85rem 1rem', 
              borderLeft: `4px solid ${kpi.color || 'var(--brand-navy)'}`, 
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {kpi.label}
              </span>
              {kpi.badgeText && (
                <Badge variant={kpi.badgeVariant || 'navy'}>
                  {kpi.badgeText}
                </Badge>
              )}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: kpi.textColor || 'var(--brand-navy)', marginTop: '2px' }}>
              {kpi.value}
            </div>
            {kpi.sublabel && (
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                {kpi.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ 4. FILTER BAR ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: '0.85rem 1.15rem', 
          background: '#FFFFFF', 
          borderRadius: '8px', 
          border: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search report records..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
          />
        </div>

        {/* Program Filter */}
        <div style={{ width: '180px' }}>
          <select
            className="form-control"
            value={selectedProgram}
            onChange={e => onProgramChange(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Programs / Branches</option>
            {scope.programs.map(p => (
              <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div style={{ width: '140px' }}>
          <select
            className="form-control"
            value={selectedSemester}
            onChange={e => onSemesterChange(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Semesters</option>
            {scope.semesters.map(s => (
              <option key={s.id} value={s.id}>Semester {s.number}</option>
            ))}
          </select>
        </div>

        {/* Extra Filter Slot */}
        {extraFilterSlot}

        {/* Reset */}
        <button
          type="button"
          onClick={onResetFilters}
          className="btn btn-outline btn-sm"
          style={{ height: '34px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          title="Reset Filters"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* ═══ 5. ROUTE SPECIFIC REPORT CONTENT ═══ */}
      {children}

      {/* ═══ 6. OFFICIAL PRINT / PDF MODAL ═══ */}
      {isPdfModalOpen && (
        <Modal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title={`Official Report Document: ${pdfTitle || title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* SSIU Official Header */}
            <div style={{ 
              padding: '1.25rem', 
              border: '2px solid var(--brand-navy, #0B192C)', 
              borderRadius: '8px', 
              background: '#FAFAFA',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', letterSpacing: '0.5px' }}>
                SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>
                Department of {scope.departmentName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                Campus: Bhoyan Rathod, Opp. IFFCO, Gandhinagar, Gujarat — 382420
              </div>
              <div style={{ margin: '0.5rem auto 0', height: '1px', background: '#CBD5E1', width: '80%' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                {pdfTitle || title}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Generated on: {new Date().toLocaleString()} • Authorized by HOD {scope.departmentName}
              </div>
            </div>

            {/* Document Summary Stats */}
            {pdfDataPreview && pdfDataPreview.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {pdfDataPreview.summary.map((item, idx) => (
                  <div key={idx} style={{ padding: '0.5rem 0.75rem', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Table Preview */}
            {pdfDataPreview && pdfDataPreview.rows && (
              <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead style={{ background: '#0B192C', color: '#FFFFFF', position: 'sticky', top: 0 }}>
                    <tr>
                      {pdfDataPreview.headers.map((h, i) => (
                        <th key={i} style={{ padding: '0.45rem 0.6rem', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pdfDataPreview.rows.slice(0, 15).map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #E2E8F0', background: rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: '0.45rem 0.6rem' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                * Official tamper-evident record certified by Swarrnim ERP System.
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={13} /> Print Document
                </button>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
