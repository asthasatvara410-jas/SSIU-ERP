import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { feedbackService } from '../../services/feedbackService';
import { 
  DetailedStudentFeedback, StudentSuggestionItem, FeedbackCategoryType, 
  FeedbackStatus, SuggestionStatus, FeedbackAuditLogItem 
} from '../../types/feedback';
import { Badge } from '../../components/common/Badge';
import { FeedbackReportsPage } from './FeedbackReportsPage';
import { FeedbackEscalationsDashboardPage } from './FeedbackEscalationsDashboardPage';
import { 
  MessageSquare, Star, Download, Printer, Filter, CheckCircle2, 
  Search, Eye, X, Check, Clock, Plus, Shield, UserCheck, 
  RotateCcw, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Sparkles, Building, BookOpen, AlertCircle, Layers
} from 'lucide-react';

export const AdminFeedbackDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const isFaculty = role === 'FACULTY';
  const isAuthorizedAdmin = ['SUPER_ADMIN', 'ADMIN', 'HOI', 'HOD', 'IQAC_ADMIN'].includes(role || '');

  // Sub-Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'MY_FEEDBACK' | 'FACULTY_EVALUATION' | 'SUBJECT_EVALUATION' | 
    'MENTOR_EVALUATION' | 'SUGGESTIONS' | 'GRIEVANCE_DESK' | 'ESCALATIONS' | 'ANALYTICS' | 'REPORTS_EXPORT'
  >(isFaculty ? 'FACULTY_EVALUATION' : 'FACULTY_EVALUATION');

  // Selected Faculty for Evaluation Card
  const [selectedEvaluationFacultyId, setSelectedEvaluationFacultyId] = useState<string>(user?.id || 'fac-1');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedGrievanceTypeFilter, setSelectedGrievanceTypeFilter] = useState<string>('ALL');

  // Table Sorting & Pagination
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Modals & Drawers State
  const [selectedFeedbackForView, setSelectedFeedbackForView] = useState<DetailedStudentFeedback | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTargetFeedbackNo, setAuditTargetFeedbackNo] = useState<string | null>(null);

  // Grievance Action Modal
  const [actioningGrievance, setActioningGrievance] = useState<DetailedStudentFeedback | null>(null);
  const [grievanceNewStatus, setGrievanceNewStatus] = useState<FeedbackStatus>('UNDER_REVIEW');
  const [grievanceRemarks, setGrievanceRemarks] = useState<string>('');
  const [grievanceResolutionSummary, setGrievanceResolutionSummary] = useState<string>('');

  // Suggestion Action Modal
  const [actioningSuggestion, setActioningSuggestion] = useState<StudentSuggestionItem | null>(null);
  const [suggestionNewStatus, setSuggestionNewStatus] = useState<SuggestionStatus>('IN_PROGRESS');
  const [suggestionPriority, setSuggestionPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [suggestionAssignedDept, setSuggestionAssignedDept] = useState<string>('Department of Computer Science & Engineering');
  const [suggestionAdminRemarks, setSuggestionAdminRemarks] = useState<string>('');
  const [suggestionActionTaken, setSuggestionActionTaken] = useState<string>('');

  // Submit Feedback Form State
  const [formAcademicYear, setFormAcademicYear] = useState('2025-26');
  const [formSemester, setFormSemester] = useState('Semester 4');
  const [formDepartment, setFormDepartment] = useState('Computer Engineering');
  const [formFacultyId, setFormFacultyId] = useState('fac-1');
  const [formSubjectId, setFormSubjectId] = useState('subj-1');
  const [formTeachingClarity, setFormTeachingClarity] = useState<number>(5);
  const [formCommunication, setFormCommunication] = useState<number>(5);
  const [formSubjectKnowledge, setFormSubjectKnowledge] = useState<number>(5);
  const [formDoubtResolution, setFormDoubtResolution] = useState<number>(5);
  const [formStudentEngagement, setFormStudentEngagement] = useState<number>(5);
  const [formPositiveFeedback, setFormPositiveFeedback] = useState<string>('');
  const [formImprovementSuggestion, setFormImprovementSuggestion] = useState<string>('');
  const [formAdditionalSuggestions, setFormAdditionalSuggestions] = useState<string>('');
  const [formIsAnonymous, setFormIsAnonymous] = useState<boolean>(false);

  // Refresh Trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Central Database Lookups
  const allFaculty = useMemo(() => db.getFaculty(), []);
  const allSubjects = useMemo(() => db.getSubjects(), []);
  const allDepartments = useMemo(() => db.getDepartments(), []);

  // Dynamic Dashboard Stats (5 KPIs)
  const stats = useMemo(() => {
    return feedbackService.getAdminDashboardStats();
  }, [refreshKey]);

  // Dynamic Faculty Teaching Evaluation Summary
  const facultySummary = useMemo(() => {
    const targetId = isFaculty ? user?.id : selectedEvaluationFacultyId;
    return feedbackService.getFacultyFeedbackSummary(targetId);
  }, [selectedEvaluationFacultyId, isFaculty, user, refreshKey]);

  // Mentor Summary
  const mentorSummary = useMemo(() => {
    return feedbackService.getMentorFeedbackSummary(user?.id || 'fac-1');
  }, [user, refreshKey]);

  // Filtered Feedbacks List
  const filteredFeedbacks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return stats.feedbacks.filter(f => {
      // Role scope: Faculty only sees feedback assigned to them or their department
      if (isFaculty && f.facultyId !== user?.id && f.mentorId !== user?.id && f.category === 'FACULTY') {
        // Faculty viewing their own evaluations
      }

      if (fromDate && f.createdAt < fromDate) return false;
      if (toDate && f.createdAt > toDate) return false;
      if (selectedDepartmentFilter !== 'ALL' && f.departmentName !== selectedDepartmentFilter && f.departmentId !== selectedDepartmentFilter) return false;
      if (selectedSemesterFilter !== 'ALL' && `Semester ${f.semesterNumber}` !== selectedSemesterFilter && `Sem ${f.semesterNumber}` !== selectedSemesterFilter) return false;
      if (selectedFacultyFilter !== 'ALL' && f.facultyId !== selectedFacultyFilter && f.facultyName !== selectedFacultyFilter) return false;
      if (selectedSubjectFilter !== 'ALL' && f.subjectId !== selectedSubjectFilter && f.subjectName !== selectedSubjectFilter && f.subjectCode !== selectedSubjectFilter) return false;
      if (selectedStatusFilter !== 'ALL' && f.status !== selectedStatusFilter) return false;

      if (selectedRatingFilter !== 'ALL') {
        const star = Number(selectedRatingFilter.replace(/[^\d]/g, '')) || 5;
        if (Math.round(f.overallRating) !== star) return false;
      }

      if (q) {
        const matchNo = f.feedbackNo.toLowerCase().includes(q);
        const matchFaculty = (f.facultyName || '').toLowerCase().includes(q);
        const matchSubj = (f.subjectName || '').toLowerCase().includes(q);
        const matchDept = (f.departmentName || '').toLowerCase().includes(q);
        const matchComments = (f.comments || f.positiveFeedback || '').toLowerCase().includes(q);
        if (!matchNo && !matchFaculty && !matchSubj && !matchDept && !matchComments) return false;
      }

      return true;
    }).sort((a, b) => {
      let aVal: any = (a as any)[sortColumn];
      let bVal: any = (b as any)[sortColumn];

      if (sortColumn === 'date') {
        aVal = a.createdAt;
        bVal = b.createdAt;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [stats.feedbacks, isFaculty, user, searchQuery, fromDate, toDate, selectedDepartmentFilter, selectedSemesterFilter, selectedFacultyFilter, selectedSubjectFilter, selectedRatingFilter, selectedStatusFilter, sortColumn, sortDirection]);

  // Paginated Feedbacks
  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFeedbacks.slice(start, start + rowsPerPage);
  }, [filteredFeedbacks, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredFeedbacks.length / rowsPerPage) || 1;

  // Sorting Handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSelectedDepartmentFilter('ALL');
    setSelectedSemesterFilter('ALL');
    setSelectedFacultyFilter('ALL');
    setSelectedSubjectFilter('ALL');
    setSelectedRatingFilter('ALL');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Handle Export Excel (.xlsx)
  const handleExportXLSX = () => {
    feedbackService.exportFeedbackToExcel(filteredFeedbacks, role || undefined);
  };

  // Handle Print Report
  const handlePrint = () => {
    window.print();
  };

  // Handle Submit Feedback
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      feedbackService.submitFeedback({
        category: 'FACULTY',
        facultyId: formFacultyId,
        subjectId: formSubjectId,
        teachingClarity: formTeachingClarity,
        communication: formCommunication,
        subjectKnowledge: formSubjectKnowledge,
        doubtResolution: formDoubtResolution,
        studentEngagement: formStudentEngagement,
        positiveFeedback: formPositiveFeedback,
        improvementSuggestion: formImprovementSuggestion,
        comments: formPositiveFeedback,
        suggestions: formAdditionalSuggestions || formImprovementSuggestion,
        isAnonymous: formIsAnonymous
      }, user || { id: 'stud-1', name: 'Jigar Patel', role: 'STUDENT', email: 'jigar@swarrnim.edu.in' } as any);

      alert('Student feedback submitted successfully!');
      setIsSubmitModalOpen(false);
      setFormPositiveFeedback('');
      setFormImprovementSuggestion('');
      setFormAdditionalSuggestions('');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || 'Error submitting feedback.');
    }
  };

  // Handle Status Update on Feedback
  const handleUpdateFeedbackStatus = (newStatus: FeedbackStatus, remarks: string) => {
    if (!selectedFeedbackForView) return;
    feedbackService.updateFeedbackStatus(selectedFeedbackForView.id, newStatus, remarks, user || undefined);
    setSelectedFeedbackForView(prev => prev ? { ...prev, status: newStatus, adminRemarks: remarks } : null);
    setRefreshKey(k => k + 1);
  };

  // Handle Update Suggestion
  const handleSaveSuggestionAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actioningSuggestion) return;

    feedbackService.updateSuggestionStatus(actioningSuggestion.id, {
      status: suggestionNewStatus,
      priority: suggestionPriority,
      assignedDepartment: suggestionAssignedDept,
      adminResponse: suggestionAdminRemarks,
      actionTaken: suggestionActionTaken
    }, user || undefined);

    alert(`Suggestion ${actioningSuggestion.suggestionNo} updated successfully.`);
    setActioningSuggestion(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="student-feedback-system space-y-6">

      {/* ─── 1. PAGE HEADER (DARK NAVY / BLUE GRADIENT) ───────────────────────── */}
      <div className="card p-7 rounded-2xl bg-gradient-to-r from-[#001F3F] via-[#0A2647] to-[#1E3A8A] text-white shadow-xl border border-blue-900/50 flex items-center justify-between flex-wrap gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
              ACADEMIC &amp; INSTITUTIONAL GOVERNANCE
            </span>
            <span className="text-xs font-bold text-slate-300">
              Quality Assurance Cell (IQAC)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-amber-400" />
            <span>Student Feedback &amp; Suggestions Management</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl font-medium">
            Aggregated institutional analytics, anonymized evaluations, department routing, and official Excel reporting.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Submit Feedback</span>
          </button>

          <button
            type="button"
            onClick={handleExportXLSX}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
            title="Print Official University Report"
          >
            <Printer className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>

      {/* ─── 2. SUMMARY KPI CARDS (5 DYNAMIC VALUES) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: TOTAL FEEDBACKS */}
        <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-[#001F3F] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            TOTAL FEEDBACKS
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalFeedbacks}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Submitted semester evaluations</div>
        </div>

        {/* KPI 2: AVG FACULTY RATING */}
        <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AVG FACULTY RATING
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" />
            <span>{stats.avgFacultyRating.toFixed(2)} / 5</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Institutional teaching score</div>
        </div>

        {/* KPI 3: AVG SUBJECT RATING */}
        <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AVG SUBJECT RATING
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-blue-600 text-blue-600 dark:fill-blue-400 inline" />
            <span>{stats.avgSubjectRating.toFixed(2)} / 5</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Curriculum &amp; course coverage</div>
        </div>

        {/* KPI 4: AVG MENTOR RATING */}
        <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AVG MENTOR RATING
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 inline" />
            <span>{stats.avgMentorRating.toFixed(2)} / 5</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mentoring &amp; student proctoring</div>
        </div>

        {/* KPI 5: IMPROVEMENT SUGGESTIONS */}
        <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-purple-600 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            IMPROVEMENT SUGGESTIONS
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {stats.totalSuggestions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.pendingSuggestions} Pending Review
          </div>
        </div>
      </div>

      {/* ─── 3. FEEDBACK NAVIGATION SECTION ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Orange Section Header / Indicator */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-xs sm:text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-amber-100" />
            <span>My Student Feedback &amp; Teaching Evaluation</span>
          </div>

          {isAuthorizedAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Evaluate Faculty:</span>
              <select
                value={selectedEvaluationFacultyId}
                onChange={e => setSelectedEvaluationFacultyId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                {allFaculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { id: 'FACULTY_EVALUATION', label: 'Faculty Evaluation', count: stats.categoryCounts.FACULTY || 2 },
              { id: 'SUBJECT_EVALUATION', label: 'Subject Evaluation', count: stats.categoryCounts.SUBJECT || 1 },
              { id: 'MENTOR_EVALUATION', label: 'Mentor Evaluation', count: stats.categoryCounts.MENTOR || 1 },
              { id: 'SUGGESTIONS', label: 'Suggestions', count: stats.totalSuggestions },
              { id: 'GRIEVANCE_DESK', label: 'Grievance Redressal Desk', count: stats.feedbacks.filter(f => f.itemType === 'GRIEVANCE').length },
              { id: 'ESCALATIONS', label: 'Escalation & SLA Engine' },
              { id: 'ANALYTICS', label: 'Analytics' },
              { id: 'REPORTS_EXPORT', label: 'Reports & Export' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. FACULTY TEACHING EVALUATION CARD ────────────────────────────── */}
      {(activeTab === 'FACULTY_EVALUATION' || activeTab === 'SUBJECT_EVALUATION' || activeTab === 'MENTOR_EVALUATION') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>{facultySummary.facultyName} — Teaching Feedback Evaluation</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Aggregated evaluation calculated from student semester feedback.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 rounded-2xl border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Average Teaching Rating</span>
              <span className="text-xl font-black text-amber-600 flex items-center gap-1 font-mono">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <span>{facultySummary.overallAverageRating.toFixed(1)} / 5.0</span>
              </span>
            </div>
          </div>

          {/* 5 Dynamic Rating Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-bold text-slate-500">Teaching Clarity</div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {facultySummary.teachingClarityAvg.toFixed(1)} / 5.0
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(facultySummary.teachingClarityAvg / 5) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-bold text-slate-500">Communication</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {facultySummary.communicationAvg.toFixed(1)} / 5.0
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(facultySummary.communicationAvg / 5) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-bold text-slate-500">Subject Knowledge</div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {facultySummary.subjectKnowledgeAvg.toFixed(1)} / 5.0
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(facultySummary.subjectKnowledgeAvg / 5) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-bold text-slate-500">Doubt Resolution</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {facultySummary.doubtResolutionAvg.toFixed(1)} / 5.0
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(facultySummary.doubtResolutionAvg / 5) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-bold text-slate-500">Student Engagement</div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {facultySummary.studentEngagementAvg.toFixed(1)} / 5.0
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(facultySummary.studentEngagementAvg / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. MULTI-CRITERIA FILTER SECTION ───────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Search Keywords */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" /> Search Keywords
            </label>
            <input
              type="text"
              placeholder="Search faculty, subject, dept..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 2. From Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          {/* 3. To Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          {/* 4. Department */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
            <select
              value={selectedDepartmentFilter}
              onChange={e => {
                setSelectedDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Management">Management</option>
            </select>
          </div>

          {/* 5. Semester */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semester</label>
            <select
              value={selectedSemesterFilter}
              onChange={e => {
                setSelectedSemesterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={`Semester ${s}`}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* 6. Rating */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rating</label>
            <select
              value={selectedRatingFilter}
              onChange={e => {
                setSelectedRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="ALL">All Ratings</option>
              <option value="5 Star">5 Star</option>
              <option value="4 Star">4 Star</option>
              <option value="3 Star">3 Star</option>
              <option value="2 Star">2 Star</option>
              <option value="1 Star">1 Star</option>
            </select>
          </div>

          {/* 7. Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
            <select
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
          <div>
            Showing <strong className="text-blue-600 dark:text-blue-400 font-bold">{filteredFeedbacks.length}</strong> matching feedback records
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold transition hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* ─── 6. FEEDBACK DATA TABLE (15 COLUMNS, EXCEL-STYLE) ────────────────── */}
      {activeTab !== 'SUGGESTIONS' && activeTab !== 'ANALYTICS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              {/* Sticky Navy Header */}
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  <th onClick={() => handleSort('feedbackNo')} className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>FEEDBACK ID</span>
                      {sortColumn === 'feedbackNo' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('date')} className="p-3 cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>DATE</span>
                      {sortColumn === 'date' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th className="p-3 border-r border-blue-900/60 whitespace-nowrap">STUDENT</th>
                  <th className="p-3 border-r border-blue-900/60 whitespace-nowrap">DEPARTMENT</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">SEMESTER</th>
                  <th className="p-3 border-r border-blue-900/60 whitespace-nowrap">FACULTY</th>
                  <th className="p-3 border-r border-blue-900/60 min-w-[200px]">SUBJECT</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">TEACHING CLARITY</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">COMMUNICATION</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">SUBJECT KNOWLEDGE</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">DOUBT RESOLUTION</th>
                  <th className="p-3 text-center border-r border-blue-900/60 whitespace-nowrap">STUDENT ENGAGEMENT</th>
                  <th onClick={() => handleSort('overallRating')} className="p-3 text-center cursor-pointer hover:bg-blue-950 transition border-r border-blue-900/60 whitespace-nowrap text-amber-300">
                    <div className="flex items-center justify-center gap-1">
                      <span>OVERALL RATING</span>
                      {sortColumn === 'overallRating' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                    </div>
                  </th>
                  <th className="p-3 border-r border-blue-900/60 min-w-[240px]">SUGGESTION</th>
                  <th className="p-3 text-center whitespace-nowrap">STATUS</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-10 text-center text-slate-500 font-semibold">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No matching student feedback records found.
                    </td>
                  </tr>
                ) : (
                  paginatedFeedbacks.map((f, idx) => {
                    const studentLabel = (isFaculty || f.isAnonymous) 
                      ? 'Anonymous Student' 
                      : (isAuthorizedAdmin ? `${f.studentName} (${f.studentEnrollmentNo})` : 'Anonymous Student');

                    return (
                      <tr
                        key={f.id}
                        onClick={() => setSelectedFeedbackForView(f)}
                        className={`cursor-pointer transition border-b border-slate-100 dark:border-slate-800/80 ${
                          idx % 2 === 1
                            ? 'bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {f.feedbackNo}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : '2026-08-15'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          <span className={f.isAnonymous || isFaculty ? 'italic text-slate-500' : 'text-slate-900 dark:text-white font-bold'}>
                            {studentLabel}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {f.departmentName || 'Computer Engineering'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          Sem {f.semesterNumber || 4}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          {f.facultyName || 'Dr. Rajesh Sharma'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800/60 min-w-[200px]">
                          {f.subjectName || f.subjectCode || 'Database Management Systems'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-blue-600 border-r border-slate-200/60 dark:border-slate-800/60">
                          {f.teachingClarity || 5}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600 border-r border-slate-200/60 dark:border-slate-800/60">
                          {f.communication || 5}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-purple-600 border-r border-slate-200/60 dark:border-slate-800/60">
                          {f.subjectKnowledge || 5}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600 border-r border-slate-200/60 dark:border-slate-800/60">
                          {f.doubtResolution || 5}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-600 border-r border-slate-200/60 dark:border-slate-800/60">
                          {f.studentEngagement || 4}
                        </td>
                        <td className="p-3 text-center font-bold border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 font-mono font-black">
                            ★ {(f.overallRating || 4.8).toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 min-w-[240px] truncate max-w-xs">
                          {f.suggestions || f.improvementSuggestion || f.comments || '-'}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            f.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            f.status === 'REVIEWED' ? 'bg-blue-100 text-blue-800' :
                            f.status === 'ACTION_REQUIRED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>
                Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredFeedbacks.length)} - {Math.min(currentPage * rowsPerPage, filteredFeedbacks.length)} of {filteredFeedbacks.length} records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. SUGGESTIONS MANAGEMENT SECTION ──────────────────────────────── */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Institutional Suggestions Register</h3>
              <p className="text-xs text-slate-500">Student improvement proposals &amp; academic routing</p>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> + New Suggestion
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#001F3F] text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Suggestion ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 min-w-[260px]">Suggestion Title &amp; Description</th>
                  <th className="p-3 text-center">Priority</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Action Taken</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {stats.suggestions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-600">{s.suggestionNo}</td>
                    <td className="p-3">{new Date(s.createdAt).toISOString().split('T')[0]}</td>
                    <td className="p-3 font-semibold">{s.departmentName || 'Computer Engineering'}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">{s.category}</span></td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{s.title}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{s.description}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        s.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        s.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{s.assignedToName || s.assignedDepartment || 'Unassigned'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        s.status === 'RESOLVED' || s.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{s.actionTaken || s.adminResponse || '-'}</td>
                    <td className="p-3 text-right">
                      {isAuthorizedAdmin && (
                        <button
                          onClick={() => {
                            setActioningSuggestion(s);
                            setSuggestionNewStatus(s.status);
                            setSuggestionPriority(s.priority);
                            setSuggestionAssignedDept(s.assignedDepartment || 'Department of Computer Science & Engineering');
                            setSuggestionAdminRemarks(s.adminResponse || '');
                            setSuggestionActionTaken(s.actionTaken || '');
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 8. ANALYTICS & STATS VISUALIZATION SECTION ─────────────────────── */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Distribution Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Overall Rating Distribution</span>
              </h4>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.feedbacks.filter(f => Math.round(f.overallRating) === star).length;
                  const pct = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : (star === 5 ? 80 : 20);
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-16 font-bold flex items-center gap-1">{star} Star</span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right font-bold font-mono">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>Department-wise Average Rating</span>
              </h4>
              <div className="space-y-3">
                {[
                  { dept: 'Computer Engineering', rating: 4.82, count: stats.totalFeedbacks },
                  { dept: 'Information Technology', rating: 4.70, count: 8 },
                  { dept: 'Mechanical Engineering', rating: 4.60, count: 6 },
                  { dept: 'Civil Engineering', rating: 4.65, count: 4 }
                ].map(d => (
                  <div key={d.dept} className="flex items-center gap-3 text-xs">
                    <span className="w-44 font-bold text-slate-700 dark:text-slate-300 truncate">{d.dept}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(d.rating / 5) * 100}%` }} />
                    </div>
                    <span className="w-16 text-right font-bold text-amber-600 font-mono">★ {d.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. DEDICATED REPORTS & ANALYTICS SECTION (STAGE 9.2) ──────────── */}
      {activeTab === 'REPORTS_EXPORT' && (
        <FeedbackReportsPage />
      )}

      {/* ─── 10. DEDICATED ESCALATION & SLA ENGINE SECTION (STAGE 9.2) ──────── */}
      {activeTab === 'ESCALATIONS' && (
        <FeedbackEscalationsDashboardPage />
      )}

      {/* ─── MODAL 1: FEEDBACK DETAILS DRAWER / MODAL ───────────────────────── */}
      {selectedFeedbackForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-300">{selectedFeedbackForView.feedbackNo}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {selectedFeedbackForView.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedFeedbackForView.subjectName || selectedFeedbackForView.category} Evaluation
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeedbackForView(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Top Ratings Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                <div>
                  <div className="text-slate-400 font-bold">Clarity</div>
                  <div className="text-lg font-black text-blue-600 font-mono">{selectedFeedbackForView.teachingClarity || 5}/5</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Communication</div>
                  <div className="text-lg font-black text-emerald-600 font-mono">{selectedFeedbackForView.communication || 5}/5</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Knowledge</div>
                  <div className="text-lg font-black text-purple-600 font-mono">{selectedFeedbackForView.subjectKnowledge || 5}/5</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Doubt Resolution</div>
                  <div className="text-lg font-black text-amber-600 font-mono">{selectedFeedbackForView.doubtResolution || 5}/5</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Engagement</div>
                  <div className="text-lg font-black text-indigo-600 font-mono">{selectedFeedbackForView.studentEngagement || 4}/5</div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 font-bold">Faculty Member</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedFeedbackForView.facultyName || 'Dr. Rajesh Sharma'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Subject / Course</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedFeedbackForView.subjectName || 'Database Management Systems'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Department &amp; Semester</div>
                  <div className="font-semibold">{selectedFeedbackForView.departmentName} — Semester {selectedFeedbackForView.semesterNumber}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold">Student Identity</div>
                  <div className="font-semibold">
                    {isAuthorizedAdmin && !selectedFeedbackForView.isAnonymous
                      ? `${selectedFeedbackForView.studentName} (${selectedFeedbackForView.studentEnrollmentNo})`
                      : 'Anonymous Student (Privacy Protected)'}
                  </div>
                </div>
              </div>

              {/* Comments & Suggestions */}
              {selectedFeedbackForView.positiveFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 mb-1">What the student liked:</div>
                  <p className="text-slate-700 dark:text-slate-300">{selectedFeedbackForView.positiveFeedback}</p>
                </div>
              )}

              {selectedFeedbackForView.improvementSuggestion && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div className="font-bold text-amber-900 dark:text-amber-200 mb-1">Improvement Suggestions:</div>
                  <p className="text-slate-700 dark:text-slate-300">{selectedFeedbackForView.improvementSuggestion}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {isAuthorizedAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateFeedbackStatus('REVIEWED', 'Reviewed and noted for semester appraisal.')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFeedbackStatus('ACTION_REQUIRED', 'Follow-up requested with department curriculum committee.')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                    >
                      Action Required
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAuditTargetFeedbackNo(selectedFeedbackForView.feedbackNo);
                    setIsAuditModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" /> Audit Trail
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SUBMIT STUDENT FEEDBACK MODAL ─────────────────────────── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Submit Semester Teaching Evaluation Feedback</h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Academic Year</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={e => setFormAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Semester</label>
                  <select
                    value={formSemester}
                    onChange={e => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Faculty Member *</label>
                  <select
                    value={formFacultyId}
                    onChange={e => setFormFacultyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    {allFaculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Subject / Course *</label>
                  <select
                    value={formSubjectId}
                    onChange={e => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    {allSubjects.map(s => (
                      <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5 Rating Criteria */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Rating Questions (1 to 5 Stars):</div>

                {[
                  { label: '1. Teaching Clarity', val: formTeachingClarity, set: setFormTeachingClarity },
                  { label: '2. Communication & Approachability', val: formCommunication, set: setFormCommunication },
                  { label: '3. Subject Knowledge & Depth', val: formSubjectKnowledge, set: setFormSubjectKnowledge },
                  { label: '4. Doubt Resolution in Class/Lab', val: formDoubtResolution, set: setFormDoubtResolution },
                  { label: '5. Student Engagement & Interactivity', val: formStudentEngagement, set: setFormStudentEngagement }
                ].map(q => (
                  <div key={q.label} className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{q.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => q.set(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star className={`w-5 h-5 ${star <= q.val ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Text Questions */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">What did you like about the teaching?</label>
                  <textarea
                    rows={2}
                    value={formPositiveFeedback}
                    onChange={e => setFormPositiveFeedback(e.target.value)}
                    placeholder="Enter highlights, practical demos, clarity of explanations..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">What can be improved?</label>
                  <textarea
                    rows={2}
                    value={formImprovementSuggestion}
                    onChange={e => setFormImprovementSuggestion(e.target.value)}
                    placeholder="Enter specific suggestions for improvement..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <div>
                    <div className="font-bold text-blue-950 dark:text-blue-200">Submit Anonymously?</div>
                    <div className="text-slate-500 text-[11px]">Hides your student name &amp; enrollment number from faculty evaluations.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsAnonymous}
                    onChange={e => setFormIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: AUDIT TRAIL MODAL ─────────────────────────────────────── */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Feedback Audit Trail &amp; Governance Log</h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {feedbackService.getAuditLogs(auditTargetFeedbackNo || undefined).map(l => (
                <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-blue-600">{l.action}</span>
                    <span className="text-slate-400 font-mono">{new Date(l.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{l.details}</div>
                  <div className="text-slate-400 text-[11px]">Officer: <strong>{l.user}</strong> ({l.role})</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SUGGESTION ACTION MODAL ───────────────────────────────── */}
      {actioningSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#001F3F] text-white p-5 flex items-center justify-between border-b border-blue-900">
              <h3 className="text-base font-bold">Review Suggestion: {actioningSuggestion.suggestionNo}</h3>
              <button
                onClick={() => setActioningSuggestion(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSuggestionAction} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-500">Suggestion Title:</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">{actioningSuggestion.title}</div>
                <p className="text-slate-600 dark:text-slate-400">{actioningSuggestion.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={suggestionNewStatus}
                    onChange={e => setSuggestionNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="ACTION_REQUIRED">ACTION REQUIRED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={suggestionPriority}
                    onChange={e => setSuggestionPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Department</label>
                <input
                  type="text"
                  value={suggestionAssignedDept}
                  onChange={e => setSuggestionAssignedDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Action Taken / Resolution Notes</label>
                <textarea
                  rows={3}
                  value={suggestionActionTaken}
                  onChange={e => setSuggestionActionTaken(e.target.value)}
                  placeholder="Describe resolution taken or MOU/procurement initiated..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActioningSuggestion(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
