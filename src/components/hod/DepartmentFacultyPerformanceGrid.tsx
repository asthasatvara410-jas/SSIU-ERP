import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { departmentScopeService, FacultyPerformanceItem } from '../../services/departmentScopeService';
import { Faculty, Subject } from '../../types';
import { ExcelDataTable, ExcelColumn, ExcelFilterOption, ExcelBulkAction } from '../common/ExcelDataTable';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  Award, TrendingUp, TrendingDown, Minus, CheckCircle2, 
  AlertTriangle, AlertCircle, Eye, Edit3, MessageSquare, 
  Download, Star, BookOpen, Clock, Users, ShieldCheck, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentFacultyPerformanceGridProps {
  onRefreshParent?: () => void;
  onNavigateToWorkload?: () => void;
}

export const DepartmentFacultyPerformanceGrid: React.FC<DepartmentFacultyPerformanceGridProps> = ({
  onRefreshParent,
  onNavigateToWorkload
}) => {
  const { user, role } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Filter States ────────────────────────────────────────────────────────
  const [selectedBandFilter, setSelectedBandFilter] = useState<string>('ALL');
  const [selectedTrendFilter, setSelectedTrendFilter] = useState<string>('ALL');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>('ALL');

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [selectedFacultyForDetail, setSelectedFacultyForDetail] = useState<FacultyPerformanceItem | null>(null);
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [remarkTargetFaculty, setRemarkTargetFaculty] = useState<FacultyPerformanceItem | null>(null);
  const [hodRemarkText, setHodRemarkText] = useState('');
  const [evalScoreInput, setEvalScoreInput] = useState<number>(85);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role, refreshKey]);

  // Performance Dataset
  const performanceList: FacultyPerformanceItem[] = useMemo(() => {
    void refreshKey;
    return departmentScopeService.getFacultyPerformanceOverview(user, role || undefined);
  }, [user, role, refreshKey]);

  // ─── Filtered Performance Dataset ─────────────────────────────────────────
  const filteredPerformance = useMemo(() => {
    return performanceList.filter(f => {
      if (selectedBandFilter !== 'ALL' && f.performanceBand !== selectedBandFilter) {
        return false;
      }
      if (selectedTrendFilter !== 'ALL' && f.scoreTrend !== selectedTrendFilter) {
        return false;
      }
      if (selectedDesignationFilter !== 'ALL' && f.designation !== selectedDesignationFilter) {
        return false;
      }
      return true;
    });
  }, [performanceList, selectedBandFilter, selectedTrendFilter, selectedDesignationFilter]);

  // ─── KPI Cards ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalEvaluated = filteredPerformance.length;
    const totalScoreSum = filteredPerformance.reduce((sum, f) => sum + f.overallScore, 0);
    const averageScore = totalEvaluated > 0 ? Math.round(totalScoreSum / totalEvaluated) : 0;
    const topPerformers = filteredPerformance.filter(f => f.overallScore >= 90).length;
    const needsAttention = filteredPerformance.filter(f => f.overallScore < 75).length;
    const excellentCount = filteredPerformance.filter(f => f.performanceBand === 'EXCELLENT').length;
    const improvementRequired = filteredPerformance.filter(f => f.performanceBand === 'NEEDS_IMPROVEMENT' || f.performanceBand === 'CRITICAL').length;

    return {
      totalEvaluated,
      averageScore,
      topPerformers,
      needsAttention,
      excellentCount,
      improvementRequired
    };
  }, [filteredPerformance]);

  // ─── Reset Filters ────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedBandFilter('ALL');
    setSelectedTrendFilter('ALL');
    setSelectedDesignationFilter('ALL');
  };

  // ─── Save HOD Performance Review ──────────────────────────────────────────
  const handleSaveHODReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkTargetFaculty) return;

    const facObj = db.getFaculty().find(f => f.id === remarkTargetFaculty.facultyId);
    if (facObj) {
      (facObj as any).hodRemarks = hodRemarkText.trim();
      (facObj as any).overallPerformanceScore = evalScoreInput;
    }

    db.saveState();
    setIsRemarkModalOpen(false);
    setRefreshKey(k => k + 1);
    if (onRefreshParent) onRefreshParent();
    showToast(`Performance evaluation recorded for Prof. ${remarkTargetFaculty.facultyName}.`);
  };

  // ─── Filter Options ───────────────────────────────────────────────────────
  const filterOptions: ExcelFilterOption[] = useMemo(() => {
    const bandOpt: ExcelFilterOption = {
      key: 'band',
      label: 'Performance Band',
      value: selectedBandFilter,
      options: [
        { label: 'All Performance Bands', value: 'ALL' },
        { label: 'Excellent (90–100)', value: 'EXCELLENT' },
        { label: 'Good Standing (75–89)', value: 'GOOD' },
        { label: 'Needs Improvement (60–74)', value: 'NEEDS_IMPROVEMENT' },
        { label: 'Critical Attention (<60)', value: 'CRITICAL' }
      ]
    };

    const trendOpt: ExcelFilterOption = {
      key: 'trend',
      label: 'Score Trend',
      value: selectedTrendFilter,
      options: [
        { label: 'All Score Trends', value: 'ALL' },
        { label: 'Improving (↑)', value: 'UP' },
        { label: 'Stable (↔)', value: 'STABLE' },
        { label: 'Declining (↓)', value: 'DOWN' }
      ]
    };

    const desigOpt: ExcelFilterOption = {
      key: 'designation',
      label: 'Designation',
      value: selectedDesignationFilter,
      options: [
        { label: 'All Designations', value: 'ALL' },
        { label: 'Professor', value: 'Professor' },
        { label: 'Associate Professor', value: 'Associate Professor' },
        { label: 'Assistant Professor', value: 'Assistant Professor' },
        { label: 'Lecturer', value: 'Lecturer' }
      ]
    };

    return [bandOpt, trendOpt, desigOpt];
  }, [selectedBandFilter, selectedTrendFilter, selectedDesignationFilter]);

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'band': setSelectedBandFilter(value); break;
      case 'trend': setSelectedTrendFilter(value); break;
      case 'designation': setSelectedDesignationFilter(value); break;
    }
  };

  // ─── 16 Performance Columns Definition ────────────────────────────────────
  const columns: ExcelColumn<FacultyPerformanceItem>[] = useMemo(() => [
    // 1. Index
    {
      key: 'index',
      header: '#',
      width: '45px',
      align: 'center',
      sortable: false,
      render: (_, idx) => <span style={{ color: '#64748B', fontWeight: 600 }}>{idx + 1}</span>,
      getRawValue: item => item.id
    },
    // 2. Faculty Name
    {
      key: 'facultyName',
      header: 'FACULTY NAME',
      width: '200px',
      minWidth: '170px',
      sortable: true,
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)', fontSize: '0.84rem' }}>
            {item.facultyName}
          </strong>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
            {item.designation}
          </div>
        </div>
      ),
      getRawValue: item => item.facultyName
    },
    // 3. Employee ID
    {
      key: 'employeeId',
      header: 'EMPLOYEE ID',
      width: '120px',
      sortable: true,
      render: item => (
        <code style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          color: 'var(--brand-orange, #F37023)',
          background: 'rgba(243, 112, 35, 0.08)',
          padding: '2px 5px',
          borderRadius: '3px'
        }}>
          {item.employeeId}
        </code>
      ),
      getRawValue: item => item.employeeId
    },
    // 4. Subjects Taught
    {
      key: 'subjectsTaughtCount',
      header: 'COURSES',
      width: '80px',
      align: 'center',
      sortable: true,
      render: item => <strong>{item.subjectsTaughtCount} Sub</strong>,
      getRawValue: item => item.subjectsTaughtCount
    },
    // 5. Classes Conducted
    {
      key: 'classesConducted',
      header: 'CLASSES',
      width: '80px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 700, color: '#334155' }}>{item.classesConducted}</span>,
      getRawValue: item => item.classesConducted
    },
    // 6. Attendance Compliance
    {
      key: 'attendanceCompliancePercentage',
      header: 'ATT COMP %',
      width: '100px',
      align: 'center',
      sortable: true,
      render: item => (
        <span style={{ fontWeight: 800, color: item.attendanceCompliancePercentage >= 85 ? '#15803D' : '#D97706' }}>
          {item.attendanceCompliancePercentage}%
        </span>
      ),
      getRawValue: item => item.attendanceCompliancePercentage
    },
    // 7. Course Completion %
    {
      key: 'courseCompletionPercentage',
      header: 'SYLLABUS %',
      width: '100px',
      align: 'center',
      sortable: true,
      render: item => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.courseCompletionPercentage >= 80 ? '#15803D' : '#D97706' }}>
            {item.courseCompletionPercentage}%
          </span>
          <div style={{ width: '45px', height: '3px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${item.courseCompletionPercentage}%`, height: '100%', background: item.courseCompletionPercentage >= 80 ? '#10B981' : '#F59E0B' }} />
          </div>
        </div>
      ),
      getRawValue: item => item.courseCompletionPercentage
    },
    // 8. Assessment Timeliness
    {
      key: 'assessmentTimelinessPercentage',
      header: 'GRADING %',
      width: '95px',
      align: 'center',
      sortable: true,
      render: item => <span style={{ fontWeight: 700 }}>{item.assessmentTimelinessPercentage}%</span>,
      getRawValue: item => item.assessmentTimelinessPercentage
    },
    // 9. Student Feedback
    {
      key: 'studentFeedbackScore',
      header: 'FEEDBACK',
      width: '110px',
      align: 'center',
      sortable: true,
      render: item => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <strong style={{ color: 'var(--brand-navy)', fontSize: '0.8rem' }}>{item.studentFeedbackScore}</strong>
          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>({item.studentFeedbackPercentage}%)</span>
        </div>
      ),
      getRawValue: item => item.studentFeedbackScore
    },
    // 10. Pass %
    {
      key: 'resultPassPercentage',
      header: 'PASS %',
      width: '85px',
      align: 'center',
      sortable: true,
      render: item => <strong style={{ color: item.resultPassPercentage >= 80 ? '#15803D' : '#B91C1C' }}>{item.resultPassPercentage}%</strong>,
      getRawValue: item => item.resultPassPercentage
    },
    // 11. Mentoring Score
    {
      key: 'mentoringScore',
      header: 'MENTOR',
      width: '85px',
      align: 'center',
      sortable: true,
      render: item => <span>{item.mentoringScore}/100</span>,
      getRawValue: item => item.mentoringScore
    },
    // 12. Overall Score
    {
      key: 'overallScore',
      header: 'OVERALL SCORE',
      width: '125px',
      align: 'center',
      sortable: true,
      render: item => {
        const isEx = item.overallScore >= 90;
        const isGood = item.overallScore >= 75;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: 900, 
              color: isEx ? '#15803D' : isGood ? '#0369A1' : '#B45309',
              background: isEx ? '#DCFCE7' : isGood ? '#E0F2FE' : '#FEF3C7',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {item.overallScore}/100
            </span>
            {item.scoreTrend === 'UP' && <TrendingUp size={13} color="#10B981" />}
            {item.scoreTrend === 'DOWN' && <TrendingDown size={13} color="#EF4444" />}
            {item.scoreTrend === 'STABLE' && <Minus size={13} color="#64748B" />}
          </div>
        );
      },
      getRawValue: item => item.overallScore
    },
    // 13. Performance Band
    {
      key: 'performanceBand',
      header: 'BAND',
      width: '135px',
      align: 'center',
      sortable: true,
      render: item => {
        switch (item.performanceBand) {
          case 'EXCELLENT': return <Badge variant="active">EXCELLENT</Badge>;
          case 'GOOD': return <Badge variant="navy">GOOD</Badge>;
          case 'NEEDS_IMPROVEMENT': return <Badge variant="warning">NEEDS IMPR.</Badge>;
          case 'CRITICAL': return <Badge variant="danger">CRITICAL</Badge>;
        }
      },
      getRawValue: item => item.performanceBand
    },
    // 14. Last Review
    {
      key: 'lastReviewDate',
      header: 'LAST REVIEW',
      width: '110px',
      sortable: true,
      render: item => <span style={{ fontSize: '0.725rem', color: '#64748B' }}>{new Date(item.lastReviewDate).toLocaleDateString()}</span>,
      getRawValue: item => item.lastReviewDate
    },
    // 15. Actions
    {
      key: 'actions',
      header: 'ACTIONS',
      width: '150px',
      align: 'center',
      sortable: false,
      render: item => (
        <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSelectedFacultyForDetail(item)}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="View Comprehensive Performance Breakdown"
          >
            <Eye size={11} /> Review
          </button>
          <button
            type="button"
            onClick={() => {
              setRemarkTargetFaculty(item);
              setHodRemarkText(item.hodRemarks || '');
              setEvalScoreInput(item.overallScore);
              setIsRemarkModalOpen(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}
            title="Add Official HOD Observation"
          >
            <MessageSquare size={11} /> Remark
          </button>
        </div>
      )
    }
  ], []);

  // Bulk Actions
  const bulkActions: ExcelBulkAction<FacultyPerformanceItem>[] = useMemo(() => [
    {
      key: 'export_performance',
      label: 'Export Performance Report',
      icon: <Download size={12} />,
      variant: 'secondary',
      onClick: selected => {
        const rows = selected.map((f, idx) => ({
          '#': idx + 1,
          'Faculty Name': f.facultyName,
          'Employee ID': f.employeeId,
          'Designation': f.designation,
          'Courses Taught': f.subjectsTaughtCount,
          'Attendance Compliance %': `${f.attendanceCompliancePercentage}%`,
          'Course Completion %': `${f.courseCompletionPercentage}%`,
          'Assessment Timeliness %': `${f.assessmentTimelinessPercentage}%`,
          'Student Feedback': `${f.studentFeedbackScore} / 5.0 (${f.studentFeedbackPercentage}%)`,
          'Pass Rate %': `${f.resultPassPercentage}%`,
          'Mentoring Score': f.mentoringScore,
          'Overall Score': `${f.overallScore}/100`,
          'Performance Band': f.performanceBand,
          'HOD Remarks': f.hodRemarks || 'Satisfactory'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Performance_Evaluation');
        XLSX.writeFile(wb, `SSIU_${scope.departmentCode}_Faculty_Performance_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast(`Exported ${selected.length} faculty performance records to Excel.`);
      }
    }
  ], [scope]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', width: '100%' }}>
      
      {/* Toast */}
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

      {/* ═══ 1. TOP KPI CARDS (PERFORMANCE FOCUS) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        
        {/* Evaluated */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-navy, #0B192C)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>FACULTY EVALUATED</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
            {kpis.totalEvaluated}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Academic reviews</div>
        </div>

        {/* Average Score */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid var(--brand-orange, #F37023)', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>AVG PERFORMANCE</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '2px' }}>
            {kpis.averageScore}/100
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Department benchmark</div>
        </div>

        {/* Excellent Top Performers */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: '4px solid #10B981', background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>EXCELLENT (90–100)</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
            {kpis.excellentCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803D', marginTop: '2px', fontWeight: 700 }}>
            Top tier instructors
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="card" style={{ padding: '0.8rem 1rem', borderLeft: `4px solid ${kpis.improvementRequired > 0 ? '#EF4444' : '#10B981'}`, background: '#FFFFFF' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>NEEDS ATTENTION (&lt;75)</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: kpis.improvementRequired > 0 ? '#DC2626' : '#15803D', marginTop: '2px' }}>
            {kpis.improvementRequired}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>Requires HOD guidance</div>
        </div>

      </div>

      {/* ═══ 2. EXCEL DATA TABLE (PERFORMANCE-CENTRIC) ═══ */}
      <ExcelDataTable<FacultyPerformanceItem>
        data={filteredPerformance}
        columns={columns}
        keyField="id"
        title="Faculty Performance & Evaluation"
        subtitle="Monitor teaching effectiveness, academic contribution, student feedback, and performance trends."
        searchPlaceholder="Search faculty name, employee ID, designation..."
        searchFields={['facultyName', 'employeeId', 'designation', 'performanceBand']}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        bulkActions={bulkActions}
        enableSelection={true}
        enableInlineEditing={false}
        exportFilename={`SSIU_${scope.departmentCode}_Faculty_Performance`}
        exportTitle={`${scope.departmentName} — Faculty Performance Evaluation`}
        exportMetadata={{
          'Department': scope.departmentName,
          'Evaluated Count': String(kpis.totalEvaluated),
          'Average Score': `${kpis.averageScore}/100`,
          'Top Performers': String(kpis.excellentCount)
        }}
        defaultPageSize={25}
        onRefresh={() => {
          setRefreshKey(k => k + 1);
          if (onRefreshParent) onRefreshParent();
          showToast('Performance metrics refreshed.');
        }}
        toolbarExtra={
          onNavigateToWorkload && (
            <button
              type="button"
              onClick={onNavigateToWorkload}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              Workload Matrix →
            </button>
          )
        }
      />

      {/* ═══ 3. PERFORMANCE DETAIL DRAWER / MODAL ═══ */}
      {selectedFacultyForDetail && (
        <Modal
          isOpen={!!selectedFacultyForDetail}
          onClose={() => setSelectedFacultyForDetail(null)}
          title={`Performance Audit: Prof. ${selectedFacultyForDetail.facultyName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header Score Card */}
            <div style={{ 
              padding: '1.15rem 1.35rem', 
              background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 100%)', 
              color: '#FFFFFF', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  {selectedFacultyForDetail.facultyName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginTop: '2px' }}>
                  {selectedFacultyForDetail.designation} • <code>{selectedFacultyForDetail.employeeId}</code>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F37023' }}>
                  {selectedFacultyForDetail.overallScore} <span style={{ fontSize: '0.9rem', color: '#CBD5E1' }}>/100</span>
                </div>
                <Badge variant={selectedFacultyForDetail.performanceBand === 'EXCELLENT' ? 'active' : 'warning'}>
                  {selectedFacultyForDetail.performanceBand}
                </Badge>
              </div>
            </div>

            {/* Performance Dimension Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>STUDENT FEEDBACK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
                  ★ {selectedFacultyForDetail.studentFeedbackScore} / 5.0
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedFacultyForDetail.studentFeedbackPercentage}% Student Approval</div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>SYLLABUS COMPLETION</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                  {selectedFacultyForDetail.courseCompletionPercentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>On-schedule delivery</div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PASS RATE IN EXAMS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369A1', marginTop: '2px' }}>
                  {selectedFacultyForDetail.resultPassPercentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Course student results</div>
              </div>

              <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ATTENDANCE COMPLIANCE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
                  {selectedFacultyForDetail.attendanceCompliancePercentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Regularity in class logs</div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 800, color: '#065F46', marginBottom: '0.35rem' }}>KEY STRENGTHS</div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#065F46' }}>
                  {selectedFacultyForDetail.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={{ padding: '0.85rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 800, color: '#92400E', marginBottom: '0.35rem' }}>AREAS FOR GROWTH</div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#92400E' }}>
                  {selectedFacultyForDetail.areasForImprovement.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>

            {/* HOD Remarks */}
            {selectedFacultyForDetail.hodRemarks && (
              <div style={{ padding: '0.85rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem' }}>
                <strong>Current HOD Remarks:</strong> {selectedFacultyForDetail.hodRemarks}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const target = selectedFacultyForDetail;
                  setSelectedFacultyForDetail(null);
                  setRemarkTargetFaculty(target);
                  setHodRemarkText(target.hodRemarks || '');
                  setEvalScoreInput(target.overallScore);
                  setIsRemarkModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
              >
                Update Review Remarks
              </button>
              <button
                type="button"
                onClick={() => setSelectedFacultyForDetail(null)}
                className="btn btn-primary btn-sm"
              >
                Close Audit
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ═══ 4. ADD HOD REMARK MODAL ═══ */}
      {isRemarkModalOpen && remarkTargetFaculty && (
        <Modal
          isOpen={isRemarkModalOpen}
          onClose={() => setIsRemarkModalOpen(false)}
          title={`HOD Performance Review: Prof. ${remarkTargetFaculty.facultyName}`}
        >
          <form onSubmit={handleSaveHODReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Record official evaluation score and academic observations for <strong>Prof. {remarkTargetFaculty.facultyName}</strong> ({remarkTargetFaculty.employeeId}).
            </div>

            <div className="form-group">
              <label className="form-label">Overall Evaluation Score (0–100) *</label>
              <input
                type="number"
                className="form-control"
                value={evalScoreInput}
                min={0}
                max={100}
                onChange={e => setEvalScoreInput(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">HOD Academic Observation & Feedback *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Commended for student mentoring and hands-on lab projects; advised to publish in peer-reviewed journals."
                value={hodRemarkText}
                onChange={e => setHodRemarkText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsRemarkModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Evaluation
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
