import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { 
  ReportMode, SingleRecordType, ReportFilterOptions, 
  SingleRecordDossier, MultiRecordReportData, ReportHistoryItem,
  reportEngine 
} from '../../services/reportService';
import { 
  ReportModeSelector, SingleRecordSelector, ReportFilters, 
  ReportSummary, ReportTable, ReportExportToolbar, ReportHistory 
} from '../../components/reports/ReportComponents';
import { ReportPreviewModal } from '../../components/reports/ReportPreviewModal';
import { Badge } from '../../components/common/Badge';
import { 
  ChartBar as BarChart3, FileText, Download, Printer, Search, ListFilter as Filter, 
  GraduationCap, BookOpen, Users, IndianRupee, Clock, CircleCheck as CheckCircle2, ShieldCheck, 
  Layers, Eye, RefreshCw, Award, Home, Bus, Building2, HelpCircle, CheckSquare, ClipboardCheck
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user, role } = useAuth();

  // Active Reporting Mode
  const [reportMode, setReportMode] = useState<ReportMode>('SINGLE');

  // 1. Single Record State
  const [singleType, setSingleType] = useState<SingleRecordType>('STUDENT');
  const [singleRecordId, setSingleRecordId] = useState<string>('230101001');

  // 2. Filter-wise / Multi-filter State
  const [filterCategory, setFilterCategory] = useState<string>('ATTENDANCE');
  const [filters, setFilters] = useState<ReportFilterOptions>({
    instituteId: 'ALL',
    departmentId: 'ALL',
    programId: 'ALL',
    academicYearId: 'ALL',
    semesterId: 'ALL',
    status: 'ALL',
    paymentStatus: 'ALL',
    attendanceStatus: 'ALL',
    searchQuery: ''
  });

  // 3. Dashboard-wise Report State
  const [dashboardType, setDashboardType] = useState<'CAMPUS_HOME' | 'ATTENDANCE' | 'FEES' | 'ADMISSION' | 'EXAMINATION'>('CAMPUS_HOME');

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Compute Single Dossier
  const singleDossier = useMemo<SingleRecordDossier | null>(() => {
    if (reportMode !== 'SINGLE') return null;
    return reportEngine.generateSingleRecordDossier(singleType, singleRecordId);
  }, [reportMode, singleType, singleRecordId]);

  // Compute Multi-Record Report Data
  const multiReportData = useMemo<MultiRecordReportData | null>(() => {
    if (reportMode === 'FILTERED') {
      return reportEngine.generateFilteredReport(filterCategory, filters, role, user);
    } else if (reportMode === 'DASHBOARD') {
      return reportEngine.generateDashboardReport(dashboardType, filters, role, user);
    }
    return null;
  }, [reportMode, filterCategory, dashboardType, filters, role, user]);

  const generatedByStr = user?.name ? `${user.name} (${role || 'OFFICER'})` : 'Authorized ERP Officer';

  // Export handlers
  const handleExportPDF = () => {
    setIsPreviewOpen(true);
  };

  const handleExportExcel = () => {
    if (reportMode === 'SINGLE' && singleDossier) {
      reportEngine.exportSingleRecordExcel(singleDossier, generatedByStr);
    } else if (multiReportData) {
      reportEngine.exportExcel(multiReportData);
    }
  };

  const handlePrint = () => {
    if (reportMode === 'SINGLE' && singleDossier) {
      reportEngine.triggerPrint(singleDossier.title, singleDossier.recordType, generatedByStr, `Record ID: ${singleDossier.referenceId}`, 1);
    } else if (multiReportData) {
      const filterStr = multiReportData.appliedFilters.map(f => `${f.label}: ${f.value}`).join(' | ');
      reportEngine.triggerPrint(multiReportData.reportTitle, multiReportData.moduleName, generatedByStr, filterStr, multiReportData.totalCount);
    }
  };

  // Re-generate from history
  const handleRegenerateFromHistory = (item: ReportHistoryItem) => {
    setReportMode(item.reportMode);
    if (item.reportMode === 'SINGLE') {
      setSingleType((item.moduleOrType as SingleRecordType) || 'STUDENT');
    } else if (item.reportMode === 'FILTERED') {
      setFilterCategory(item.moduleOrType || 'ATTENDANCE');
    }
    setIsPreviewOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* =========================================================================
          1. UNIVERSITY REPORTING CENTER HEADER
          ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #071325 0%, #0F2C59 60%, #183B70 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 25px -5px rgba(15, 44, 89, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">SSIU CENTRAL REPORTING ENGINE</Badge>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#F59E0B" /> NAAC / UGC Statutory Audit Ready
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
            Flexible University Reporting System
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Single record dossiers, multi-filtered cross-department cohorts, and real-time dashboard analytics with instant PDF, multi-sheet Excel &amp; print exports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="btn"
            style={{
              backgroundColor: '#F37023',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(243, 112, 35, 0.35)'
            }}
          >
            <Eye size={17} /> Open Official Report Preview
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. REPORT MODE SELECTOR
          ========================================================================= */}
      <ReportModeSelector mode={reportMode} onSelectMode={setReportMode} />

      {/* =========================================================================
          3. MODE SPECIFIC CONTROLS
          ========================================================================= */}

      {/* MODE 1: SINGLE RECORD REPORT */}
      {reportMode === 'SINGLE' && (
        <SingleRecordSelector
          selectedType={singleType}
          onSelectType={setSingleType}
          selectedRecordId={singleRecordId}
          onSelectRecord={setSingleRecordId}
          role={role}
          user={user}
        />
      )}

      {/* MODE 2: FILTER-WISE & MULTI-FILTER REPORT */}
      {reportMode === 'FILTERED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Module Category Selector */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>
              Select Module Domain:
            </span>
            {[
              { key: 'ATTENDANCE', label: 'Attendance & Shortage', icon: ClipboardCheck },
              { key: 'FEES', label: 'Fees & Outstanding Dues', icon: IndianRupee },
              { key: 'STUDENTS', label: 'Student Enrollment & Roster', icon: GraduationCap }
            ].map(cat => {
              const Icon = cat.icon;
              const isSelected = filterCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setFilterCategory(cat.key)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0F2C59' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#0F2C59' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Icon size={14} color={isSelected ? '#F37023' : '#64748B'} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <ReportFilters
            filters={filters}
            onChangeFilter={setFilters}
            category={filterCategory}
          />
        </div>
      )}

      {/* MODE 3: DASHBOARD-WISE REPORT */}
      {reportMode === 'DASHBOARD' && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59' }}>
              Select University Dashboard Module
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Instantly compile executive response summaries and metrics from any operational ERP dashboard.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { key: 'CAMPUS_HOME', label: 'Campus Home Overview', icon: Building2, desc: 'Central University Governance' },
              { key: 'ATTENDANCE', label: 'Attendance Dashboard', icon: ClipboardCheck, desc: 'Daily Presence Benchmarks' },
              { key: 'FEES', label: 'Fees & Finance Dashboard', icon: IndianRupee, desc: 'Revenue & Demand Realization' },
              { key: 'ADMISSION', label: 'Admissions & CRM', icon: BookOpen, desc: 'Lead Conversion Funnel' },
              { key: 'EXAMINATION', label: 'Examination Cell', icon: Award, desc: 'Grading & Pass Outcomes' }
            ].map(d => {
              const Icon = d.icon;
              const isSelected = dashboardType === d.key;
              return (
                <div
                  key={d.key}
                  onClick={() => setDashboardType(d.key as any)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0F2C59' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F2C59', fontWeight: 800, fontSize: '0.875rem' }}>
                    <Icon size={16} color="#F37023" />
                    {d.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    {d.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. REPORT EXPORT TOOLBAR
          ========================================================================= */}
      <ReportExportToolbar
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        totalRecords={reportMode === 'SINGLE' ? 1 : (multiReportData?.totalCount || 0)}
      />

      {/* =========================================================================
          5. LIVE REPORT CONTENT PREVIEW
          ========================================================================= */}

      {/* Single Record Dossier Presentation */}
      {reportMode === 'SINGLE' && singleDossier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Card */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '5px solid #0F2C59' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2C59', margin: 0 }}>
                  {singleDossier.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                  {singleDossier.subtitle}
                </p>
              </div>
              <Badge variant="active">AUTHENTICATED RECORD</Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                backgroundColor: '#F8FAFC',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginTop: '1rem'
              }}
            >
              {singleDossier.headerFields.map((f, i) => (
                <div key={i}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    {f.label}:
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F2C59', marginTop: '2px' }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dossier Sections */}
          {singleDossier.sections.map((sec, sIdx) => (
            <div key={sIdx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F2C59', margin: 0 }}>
                {sec.title}
              </h4>

              {sec.metrics && <ReportSummary metrics={sec.metrics} />}

              {sec.table && (
                <ReportTable headers={sec.table.headers} rows={sec.table.rows} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Multi-Record & Dashboard Report Presentation */}
      {reportMode !== 'SINGLE' && multiReportData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Summary Metrics */}
          <ReportSummary metrics={multiReportData.summaryMetrics} />

          {/* Data Table */}
          <ReportTable
            headers={multiReportData.headers}
            rows={multiReportData.rows}
          />
        </div>
      )}

      {/* =========================================================================
          6. REPORT GENERATION HISTORY & AUDIT LOGS
          ========================================================================= */}
      <ReportHistory onRegenerate={handleRegenerateFromHistory} />

      {/* =========================================================================
          7. FULL OFFICIAL REPORT PREVIEW MODAL
          ========================================================================= */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        singleDossier={singleDossier}
        multiReport={multiReportData}
        user={user}
        role={role}
      />
    </div>
  );
};
