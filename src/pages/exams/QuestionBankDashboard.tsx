import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Filter,
  Layers,
  Award,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  X,
  UploadCloud,
  Check,
  Ban,
  ArrowUpRight,
  Sparkles,
  Lock,
  Eye,
  Trash2,
  Edit3,
  Send,
  HelpCircle,
  BarChart3,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { questionBankService } from '../../services/questionBankService';
import {
  QuestionBankItem,
  ExamPaperItem,
  QuestionFilterState,
  PaperFilterState,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  ExamType,
  BulkUploadPreviewItem,
} from '../../types/questionBank';

export type ExamTabType =
  | 'OVERVIEW'
  | 'QUESTION_BANK'
  | 'ADD_QUESTION'
  | 'BULK_UPLOAD'
  | 'REVIEW_QUEUE'
  | 'PAPER_BUILDER'
  | 'PAPER_APPROVAL'
  | 'LOCKED_PAPERS'
  | 'STUDENT_VIEW'
  | 'REPORTS';

interface QuestionBankDashboardProps {
  initialTab?: ExamTabType;
  activeRouteTab?: string;
}

export const QuestionBankDashboard: React.FC<QuestionBankDashboardProps> = ({
  initialTab = 'OVERVIEW',
  activeRouteTab,
}) => {
  const { user, role } = useAuth();

  const resolveTabFromRoute = (tabRoute?: string): ExamTabType => {
    if (!tabRoute) return initialTab;
    switch (tabRoute) {
      case 'question-bank': return 'QUESTION_BANK';
      case 'bulk-upload': return 'BULK_UPLOAD';
      case 'paper-builder': return 'PAPER_BUILDER';
      case 'paper-approval': return 'PAPER_APPROVAL';
      case 'published-papers': return 'LOCKED_PAPERS';
      case 'student-question-bank': return 'STUDENT_VIEW';
      case 'exam-reports': return 'REPORTS';
      default: return 'OVERVIEW';
    }
  };

  const [activeTab, setActiveTab] = useState<ExamTabType>(() => resolveTabFromRoute(activeRouteTab));

  useEffect(() => {
    if (activeRouteTab) {
      setActiveTab(resolveTabFromRoute(activeRouteTab));
    }
  }, [activeRouteTab]);

  // Filters
  const [filters, setFilters] = useState<QuestionFilterState>({
    academicYear: '2025-26',
    departmentId: 'ALL',
    programId: 'ALL',
    subjectId: 'ALL',
    questionType: 'ALL',
    difficultyLevel: 'ALL',
    bloomLevel: 'ALL',
    status: 'ALL',
    semester: 'ALL',
    searchQuery: '',
  });

  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick(t => t + 1);

  // Data fetching
  const metrics = useMemo(() => questionBankService.getMetrics(filters, role || undefined, user), [filters, role, user, refreshTick]);
  const questions = useMemo(() => questionBankService.getQuestions(filters, role || undefined, user), [filters, role, user, refreshTick]);
  const papers = useMemo(() => questionBankService.getPapers(filters as any, role || undefined, user), [filters, role, user, refreshTick]);

  // Selected Question Modal
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Selected Paper Preview Modal
  const [selectedPaper, setSelectedPaper] = useState<ExamPaperItem | null>(null);
  const [showPaperModal, setShowPaperModal] = useState(false);

  // Review / Remarks Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState<'QUESTION' | 'PAPER'>('QUESTION');
  const [targetReviewId, setTargetReviewId] = useState('');
  const [reviewDecision, setReviewDecision] = useState<string>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Question Form State
  const [newQuestionForm, setNewQuestionForm] = useState<{
    questionText: string;
    questionType: QuestionType;
    options: string[];
    correctAnswer: string;
    explanation: string;
    marks: number;
    difficultyLevel: DifficultyLevel;
    bloomLevel: BloomLevel;
    subjectId: string;
    subjectName: string;
    departmentId: string;
    departmentName: string;
    topic: string;
    unit: string;
    semester: number;
  }>({
    questionText: '',
    questionType: 'MCQ',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    marks: 2,
    difficultyLevel: 'MEDIUM',
    bloomLevel: 'UNDERSTAND',
    subjectId: 'sub-cs-701',
    subjectName: 'Network Security & Cryptography',
    departmentId: 'dept-cse',
    departmentName: 'Computer Engineering',
    topic: '',
    unit: 'Unit 1',
    semester: 7,
  });

  // Paper Builder State
  const [paperBuilderForm, setPaperBuilderForm] = useState<{
    title: string;
    subjectId: string;
    subjectName: string;
    departmentId: string;
    departmentName: string;
    semester: number;
    examType: ExamType;
    totalMarks: number;
    durationMinutes: number;
    instructions: string;
    selectedQuestions: Array<{ questionId: string; section: string; marks: number; questionOrder: number; question?: QuestionBankItem }>;
  }>({
    title: 'Semester Midterm Examination — Network Security',
    subjectId: 'sub-cs-701',
    subjectName: 'Network Security & Cryptography',
    departmentId: 'dept-cse',
    departmentName: 'Computer Engineering',
    semester: 7,
    examType: 'MIDTERM',
    totalMarks: 30,
    durationMinutes: 90,
    instructions: '1. All questions in Section A are compulsory.\n2. Write structured answers with relevant block diagrams.\n3. Programmable devices are prohibited.',
    selectedQuestions: [],
  });

  // Bulk Upload Preview State
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<BulkUploadPreviewItem[]>([]);
  const [bulkErrors, setBulkErrors] = useState<any[]>([]);

  const handleParseBulk = () => {
    if (!bulkCsvText.trim()) return;
    const { preview, errors } = questionBankService.parseAndValidateBulkCsv(bulkCsvText);
    setBulkPreview(preview);
    setBulkErrors(errors);
  };

  const handleCommitBulk = () => {
    if (bulkPreview.length === 0) return;
    const res = questionBankService.commitBulkUpload(
      bulkPreview,
      newQuestionForm.subjectId,
      newQuestionForm.subjectName,
      newQuestionForm.departmentId,
      newQuestionForm.departmentName,
      filters.academicYear,
      newQuestionForm.semester,
      user
    );
    showToast(`Successfully imported ${res.importedCount} questions to Question Bank!`);
    setBulkCsvText('');
    setBulkPreview([]);
    setBulkErrors([]);
    triggerRefresh();
    setActiveTab('QUESTION_BANK');
  };

  const isStudent = role === 'STUDENT';
  const isFaculty = role === 'FACULTY';
  const isHOD = role === 'HOD';
  const isHOI = role === 'PRINCIPAL' || role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'EXAM_CELL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SSIU Enterprise Examination Engine • Stage 10.3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Smart Examination & Question Bank Engine
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Hierarchical Question Scrutiny (Faculty → HOD Review → HOI Final Lock), Bloom Taxonomy Analytics, Exam Paper Builder, and Student-Safe Publications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('ADD_QUESTION')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
                <button
                  onClick={() => setActiveTab('PAPER_BUILDER')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Build Exam Paper</span>
                </button>
              </>
            )}
            <button
              onClick={() => questionBankService.exportComprehensiveReports(filters, role || undefined, user)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">Total Questions</span>
            <span className="text-xl font-bold text-white mt-1">{metrics.totalQuestions}</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">Approved Questions</span>
            <span className="text-xl font-bold text-emerald-400 mt-1">{metrics.approvedQuestions}</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">Pending HOD Review</span>
            <span className="text-xl font-bold text-amber-400 mt-1">{metrics.pendingReviewQuestions}</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">Exam Papers</span>
            <span className="text-xl font-bold text-indigo-400 mt-1">{metrics.totalPapers}</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">HOI Locked Papers</span>
            <span className="text-xl font-bold text-cyan-400 mt-1">{metrics.hoiLocked}</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-3 border border-slate-700/50">
            <span className="text-slate-400 block font-medium">Published Papers</span>
            <span className="text-xl font-bold text-purple-400 mt-1">{metrics.publishedPapers}</span>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, text, topic..."
            value={filters.searchQuery}
            onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={filters.difficultyLevel}
            onChange={e => setFilters(f => ({ ...f, difficultyLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Difficulty Levels</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div>
          <select
            value={filters.bloomLevel}
            onChange={e => setFilters(f => ({ ...f, bloomLevel: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Bloom Taxonomy Levels</option>
            <option value="REMEMBER">L1: Remember</option>
            <option value="UNDERSTAND">L2: Understand</option>
            <option value="APPLY">L3: Apply</option>
            <option value="ANALYZE">L4: Analyze</option>
            <option value="EVALUATE">L5: Evaluate</option>
            <option value="CREATE">L6: Create</option>
          </select>
        </div>

        <div>
          <select
            value={filters.questionType}
            onChange={e => setFilters(f => ({ ...f, questionType: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Question Types</option>
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="MULTIPLE_SELECT">Multiple Select</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="LONG_ANSWER">Long Answer</option>
            <option value="DESCRIPTIVE">Descriptive Problem</option>
            <option value="NUMERICAL">Numerical</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED_FOR_REVIEW">Pending HOD Review</option>
            <option value="AVAILABLE_FOR_PAPER">HOD Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={() => setFilters({
              academicYear: '2025-26',
              departmentId: 'ALL',
              programId: 'ALL',
              subjectId: 'ALL',
              questionType: 'ALL',
              difficultyLevel: 'ALL',
              bloomLevel: 'ALL',
              status: 'ALL',
              semester: 'ALL',
              searchQuery: '',
            })}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-700 scrollbar-none text-xs font-bold">
        {[
          { id: 'OVERVIEW', label: 'Overview & KPIs', icon: BarChart3, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT'] },
          { id: 'QUESTION_BANK', label: 'Question Bank', icon: BookOpen, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT'] },
          { id: 'ADD_QUESTION', label: '+ Add Question', icon: Plus, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'] },
          { id: 'BULK_UPLOAD', label: 'Bulk Upload (CSV)', icon: UploadCloud, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'] },
          { id: 'REVIEW_QUEUE', label: 'HOD Review Queue', icon: Clock, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD'] },
          { id: 'PAPER_BUILDER', label: 'Exam Paper Builder', icon: Sparkles, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'] },
          { id: 'PAPER_APPROVAL', label: 'Paper Approval Workflow', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD'] },
          { id: 'LOCKED_PAPERS', label: 'Locked & Published Papers', icon: Lock, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT'] },
          { id: 'STUDENT_VIEW', label: 'Student Portal View', icon: Eye, roles: ['STUDENT', 'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'] },
          { id: 'REPORTS', label: 'Examination Reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'] },
        ]
          .filter(tab => !role || tab.roles.includes(role))
          .map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ExamTabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* ── 1. TAB: OVERVIEW & KPIS ────────────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Difficulty Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Difficulty Level Distribution
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400">Easy ({metrics.difficultyDistribution.EASY})</span>
                    <span>{metrics.totalQuestions > 0 ? Math.round((metrics.difficultyDistribution.EASY / metrics.totalQuestions) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.totalQuestions > 0 ? (metrics.difficultyDistribution.EASY / metrics.totalQuestions) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-amber-600 dark:text-amber-400">Medium ({metrics.difficultyDistribution.MEDIUM})</span>
                    <span>{metrics.totalQuestions > 0 ? Math.round((metrics.difficultyDistribution.MEDIUM / metrics.totalQuestions) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${metrics.totalQuestions > 0 ? (metrics.difficultyDistribution.MEDIUM / metrics.totalQuestions) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-rose-600 dark:text-rose-400">Hard ({metrics.difficultyDistribution.HARD})</span>
                    <span>{metrics.totalQuestions > 0 ? Math.round((metrics.difficultyDistribution.HARD / metrics.totalQuestions) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${metrics.totalQuestions > 0 ? (metrics.difficultyDistribution.HARD / metrics.totalQuestions) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloom Taxonomy Coverage */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-purple-500" />
                Bloom Taxonomy Alignment (OBE)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.bloomDistribution).map(([bloom, count]) => (
                  <div key={bloom} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold">{bloom}</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{count} Questions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paper Lifecycle Pipeline */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                Exam Paper Lifecycle Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Draft Assembly</span>
                  <span className="font-bold text-slate-900 dark:text-white">{metrics.draftPapers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                  <span className="font-medium">Pending HOD Scrutiny</span>
                  <span className="font-bold">{metrics.pendingHOD}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300">
                  <span className="font-medium">HOD Approved (To HOI)</span>
                  <span className="font-bold">{metrics.hodApproved}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300">
                  <span className="font-medium">HOI Locked (Tamper-Proof)</span>
                  <span className="font-bold">{metrics.hoiLocked}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  <span className="font-medium">Published & Live</span>
                  <span className="font-bold">{metrics.publishedPapers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. TAB: QUESTION BANK TABLE ──────────────────────────────────── */}
      {(activeTab === 'QUESTION_BANK' || activeTab === 'REVIEW_QUEUE') && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {activeTab === 'REVIEW_QUEUE' ? 'HOD Question Review & Scrutiny Queue' : 'Question Bank Repository'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'REVIEW_QUEUE' ? 'Review submitted questions from department faculty for paper eligibility.' : 'All subject questions across academic sessions.'}
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
              {questions.length} Items
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Question Text</th>
                  <th className="p-3.5">Type & Marks</th>
                  <th className="p-3.5">Difficulty / Bloom</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No questions found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  questions.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{q.questionCode}</td>
                      <td className="p-3.5 max-w-md">
                        <div className="truncate text-slate-900 dark:text-white font-semibold">{q.questionText}</div>
                        {q.topic && <span className="text-[10px] text-slate-400 block mt-0.5">Topic: {q.topic} • {q.unit}</span>}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-semibold text-[10px]">
                          {q.questionType}
                        </span>
                        <span className="text-slate-500 ml-1.5 font-bold">{q.marks} M</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.difficultyLevel === 'EASY' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          q.difficultyLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {q.difficultyLevel}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1 font-semibold">{q.bloomLevel}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{q.subjectName || q.subjectId}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          q.status === 'AVAILABLE_FOR_PAPER' || q.status === 'HOD_APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                          q.status === 'SUBMITTED_FOR_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                          q.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => { setSelectedQuestion(q); setShowQuestionModal(true); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isHOD && q.status === 'SUBMITTED_FOR_REVIEW' && (
                          <button
                            onClick={() => {
                              setReviewType('QUESTION');
                              setTargetReviewId(q.id);
                              setReviewDecision('APPROVED');
                              setShowReviewModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                          >
                            Scrutinize
                          </button>
                        )}
                        {!isStudent && q.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              questionBankService.submitQuestionForReview(q.id, user, role || 'FACULTY');
                              showToast(`Question ${q.questionCode} submitted for HOD review!`);
                              triggerRefresh();
                            }}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-[10px] font-bold"
                            title="Submit for HOD Review"
                          >
                            Submit
                          </button>
                        )}
                        {!isStudent && (q.status === 'DRAFT' || q.status === 'REJECTED') && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this question from question bank?')) {
                                questionBankService.deleteQuestion(q.id, user, role || 'FACULTY');
                                showToast('Question deleted.');
                                triggerRefresh();
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* ── 3. TAB: ADD QUESTION ──────────────────────────────────────────── */}
      {activeTab === 'ADD_QUESTION' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Question Bank Item</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add verified questions with Bloom Level taxonomy and rubric.</p>
            </div>
            <button
              onClick={() => setActiveTab('QUESTION_BANK')}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Subject</label>
              <select
                value={newQuestionForm.subjectId}
                onChange={e => setNewQuestionForm(f => ({ ...f, subjectId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="sub-cs-701">Network Security & Cryptography</option>
                <option value="sub-cs-802">Deep Learning & Computer Vision</option>
                <option value="sub-cs-301">Advanced Data Structures & Algorithms</option>
                <option value="sub-cs-402">Database Management Systems</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Question Type</label>
              <select
                value={newQuestionForm.questionType}
                onChange={e => setNewQuestionForm(f => ({ ...f, questionType: e.target.value as QuestionType }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="MULTIPLE_SELECT">Multiple Select</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
                <option value="DESCRIPTIVE">Descriptive Problem</option>
                <option value="NUMERICAL">Numerical Problem</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Marks Allocation</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newQuestionForm.marks}
                onChange={e => setNewQuestionForm(f => ({ ...f, marks: Number(e.target.value) }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Difficulty Level</label>
              <select
                value={newQuestionForm.difficultyLevel}
                onChange={e => setNewQuestionForm(f => ({ ...f, difficultyLevel: e.target.value as DifficultyLevel }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Bloom Taxonomy Level</label>
              <select
                value={newQuestionForm.bloomLevel}
                onChange={e => setNewQuestionForm(f => ({ ...f, bloomLevel: e.target.value as BloomLevel }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="REMEMBER">L1: Remember</option>
                <option value="UNDERSTAND">L2: Understand</option>
                <option value="APPLY">L3: Apply</option>
                <option value="ANALYZE">L4: Analyze</option>
                <option value="EVALUATE">L5: Evaluate</option>
                <option value="CREATE">L6: Create</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Unit / Module</label>
              <input
                type="text"
                value={newQuestionForm.unit}
                onChange={e => setNewQuestionForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. Unit 2: Key Distribution"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="text-xs space-y-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Question Formulation *</label>
              <textarea
                rows={3}
                value={newQuestionForm.questionText}
                onChange={e => setNewQuestionForm(f => ({ ...f, questionText: e.target.value }))}
                placeholder="Enter complete and unambiguous question text here..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* MCQ Options if applicable */}
            {newQuestionForm.questionType === 'MCQ' && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">MCQ Options (Choices)</label>
                {newQuestionForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-6">Option {String.fromCharCode(65 + idx)}:</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...newQuestionForm.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestionForm(f => ({ ...f, options: newOpts }));
                      }}
                      placeholder={`Enter choice ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Correct Answer / Model Solution</label>
              <textarea
                rows={2}
                value={newQuestionForm.correctAnswer}
                onChange={e => setNewQuestionForm(f => ({ ...f, correctAnswer: e.target.value }))}
                placeholder="Enter correct answer, rubric breakdown, or model answer..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Explanation & Evaluation Rubric</label>
              <textarea
                rows={2}
                value={newQuestionForm.explanation}
                onChange={e => setNewQuestionForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Step-by-step scoring scheme (e.g. 2 marks for derivation, 3 marks for calculation)..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => {
                if (!newQuestionForm.questionText.trim()) {
                  alert('Please enter question text.');
                  return;
                }
                questionBankService.createQuestion({ ...newQuestionForm, status: 'DRAFT' }, user, role || 'FACULTY');
                showToast('Draft question created successfully!');
                triggerRefresh();
                setActiveTab('QUESTION_BANK');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
            >
              Save as Draft
            </button>

            <button
              onClick={() => {
                if (!newQuestionForm.questionText.trim()) {
                  alert('Please enter question text.');
                  return;
                }
                questionBankService.createQuestion({ ...newQuestionForm, status: 'SUBMITTED_FOR_REVIEW' }, user, role || 'FACULTY');
                showToast('Question submitted for HOD review!');
                triggerRefresh();
                setActiveTab('QUESTION_BANK');
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              Submit for Review
            </button>
          </div>
        </div>
      )}

      {/* ── 4. TAB: BULK UPLOAD ───────────────────────────────────────────── */}
      {activeTab === 'BULK_UPLOAD' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Question Import Engine</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload CSV or XLSX files with row-level validation and error reporting.</p>
            </div>
            <button
              onClick={() => questionBankService.downloadCsvTemplate()}
              className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
              Paste CSV Content or Drop File Text
            </label>
            <textarea
              rows={6}
              value={bulkCsvText}
              onChange={e => setBulkCsvText(e.target.value)}
              placeholder="Paste comma-separated CSV rows here (including header line)..."
              className="w-full p-3 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Headers: questionText, questionType, options, correctAnswer, explanation, marks, difficultyLevel, bloomLevel, topic, unit
              </span>
              <button
                onClick={handleParseBulk}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Validate & Preview Rows
              </button>
            </div>
          </div>

          {/* Validation & Preview Table */}
          {bulkPreview.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Preview ({bulkPreview.filter(p => p.isValid).length} Valid, {bulkPreview.filter(p => !p.isValid).length} Invalid)
                </h3>
                <button
                  onClick={handleCommitBulk}
                  disabled={bulkPreview.filter(p => p.isValid).length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  Import {bulkPreview.filter(p => p.isValid).length} Valid Questions
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Row</th>
                      <th className="p-3">Question Text</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3">Difficulty</th>
                      <th className="p-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {bulkPreview.map((item, idx) => (
                      <tr key={idx} className={item.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-900/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                        <td className="p-3 font-mono font-bold">{item.row}</td>
                        <td className="p-3 max-w-sm truncate text-slate-900 dark:text-white">{item.questionText}</td>
                        <td className="p-3">{item.questionType}</td>
                        <td className="p-3 font-bold">{item.marks} M</td>
                        <td className="p-3">{item.difficultyLevel}</td>
                        <td className="p-3">
                          {item.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded font-bold text-[10px]">
                              Valid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded font-bold text-[10px]">
                              {item.errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. TAB: PAPER BUILDER ─────────────────────────────────────────── */}
      {activeTab === 'PAPER_BUILDER' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Metadata & Section Configuration */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Exam Paper Specification
              </h2>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Paper Title *</label>
                <input
                  type="text"
                  value={paperBuilderForm.title}
                  onChange={e => setPaperBuilderForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Exam Type</label>
                  <select
                    value={paperBuilderForm.examType}
                    onChange={e => setPaperBuilderForm(f => ({ ...f, examType: e.target.value as ExamType }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="MIDTERM">Midterm</option>
                    <option value="ENDTERM">Endterm</option>
                    <option value="INTERNAL">Internal Continuous</option>
                    <option value="PRACTICAL">Practical / Viva</option>
                    <option value="REMEDIAL">Remedial</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Total Marks</label>
                  <input
                    type="number"
                    value={paperBuilderForm.totalMarks}
                    onChange={e => setPaperBuilderForm(f => ({ ...f, totalMarks: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={paperBuilderForm.durationMinutes}
                  onChange={e => setPaperBuilderForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Candidate Instructions</label>
                <textarea
                  rows={3}
                  value={paperBuilderForm.instructions}
                  onChange={e => setPaperBuilderForm(f => ({ ...f, instructions: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              {/* Live Marks Summation Card */}
              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/50 dark:border-indigo-800 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-indigo-900 dark:text-indigo-200">Assembled Marks:</span>
                  <span className="text-base text-indigo-700 dark:text-indigo-300">
                    {paperBuilderForm.selectedQuestions.reduce((sum, q) => sum + q.marks, 0)} / {paperBuilderForm.totalMarks} M
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (paperBuilderForm.selectedQuestions.reduce((sum, q) => sum + q.marks, 0) / (paperBuilderForm.totalMarks || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (paperBuilderForm.selectedQuestions.length === 0) {
                    alert('Please select at least one approved question for the paper.');
                    return;
                  }
                  const created = questionBankService.createExamPaper({
                    title: paperBuilderForm.title,
                    subjectId: paperBuilderForm.subjectId,
                    subjectName: paperBuilderForm.subjectName,
                    departmentId: paperBuilderForm.departmentId,
                    departmentName: paperBuilderForm.departmentName,
                    semester: paperBuilderForm.semester,
                    examType: paperBuilderForm.examType,
                    totalMarks: paperBuilderForm.totalMarks,
                    durationMinutes: paperBuilderForm.durationMinutes,
                    instructions: paperBuilderForm.instructions,
                    questions: paperBuilderForm.selectedQuestions as any,
                  }, user, role || 'FACULTY');

                  showToast(`Exam Paper ${created.paperCode} created in DRAFT!`);
                  triggerRefresh();
                  setActiveTab('PAPER_APPROVAL');
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs"
              >
                Save Paper Draft
              </button>
            </div>

            {/* Right: Available Approved Questions Picker */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Select Approved Questions from Bank
                  </h3>
                  <p className="text-slate-400 text-[11px]">Only HOD-approved questions can be assigned to examination papers.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                  {paperBuilderForm.selectedQuestions.length} Selected
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {questions
                  .filter(q => q.status === 'AVAILABLE_FOR_PAPER' || q.status === 'HOD_APPROVED')
                  .map(q => {
                    const isSelected = paperBuilderForm.selectedQuestions.some(sq => sq.questionId === q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (isSelected) {
                            setPaperBuilderForm(f => ({
                              ...f,
                              selectedQuestions: f.selectedQuestions.filter(sq => sq.questionId !== q.id),
                            }));
                          } else {
                            setPaperBuilderForm(f => ({
                              ...f,
                              selectedQuestions: [
                                ...f.selectedQuestions,
                                {
                                  questionId: q.id,
                                  section: 'SECTION_A',
                                  marks: q.marks,
                                  questionOrder: f.selectedQuestions.length + 1,
                                  question: q,
                                },
                              ],
                            }));
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{q.questionCode}</span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-semibold">{q.questionType}</span>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-[10px]">{q.bloomLevel}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">{q.questionText}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white block">{q.marks} Marks</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Added' : '+ Click to Add'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TAB: PAPER APPROVAL & PUBLICATION WORKFLOW ─────────────────── */}
      {(activeTab === 'PAPER_APPROVAL' || activeTab === 'LOCKED_PAPERS' || activeTab === 'STUDENT_VIEW') && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'STUDENT_VIEW' ? 'Student Published Examination Papers' : 'Exam Papers & Approval Hierarchy'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'STUDENT_VIEW' ? 'Access published question papers and study repositories.' : 'Full multi-tiered scrutiny pipeline: Faculty Assembly → HOD Review → HOI Lock & Publish.'}
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
              {papers.length} Papers
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Paper Title</th>
                  <th className="p-3.5">Type & Total Marks</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {papers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No examination papers found in this category.
                    </td>
                  </tr>
                ) : (
                  papers.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{p.paperCode}</td>
                      <td className="p-3.5 max-w-md">
                        <div className="truncate text-slate-900 dark:text-white font-semibold">{p.title}</div>
                        <span className="text-[10px] text-slate-400 block">{p.subjectName || p.subjectId} • Semester {p.semester}</span>
                      </td>
                      <td className="p-3.5 font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] mr-1.5">{p.examType}</span>
                        <span>{p.totalMarks} Marks</span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{p.durationMinutes} Min</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' :
                          p.status === 'HOI_LOCKED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300' :
                          p.status === 'HOD_APPROVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300' :
                          p.status === 'SUBMITTED_FOR_HOD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => { setSelectedPaper(p); setShowPaperModal(true); }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 rounded-lg text-[10px] font-bold"
                        >
                          Preview
                        </button>

                        {/* Faculty Submit to HOD */}
                        {!isStudent && p.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              questionBankService.submitPaperForHOD(p.id, user, role || 'FACULTY');
                              showToast(`Paper ${p.paperCode} submitted for HOD review!`);
                              triggerRefresh();
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-[10px] font-bold"
                          >
                            Submit to HOD
                          </button>
                        )}

                        {/* HOD Review */}
                        {isHOD && p.status === 'SUBMITTED_FOR_HOD' && (
                          <button
                            onClick={() => {
                              setReviewType('PAPER');
                              setTargetReviewId(p.id);
                              setReviewDecision('HOD_APPROVED');
                              setShowReviewModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            HOD Approve
                          </button>
                        )}

                        {/* HOD Escalate to HOI */}
                        {isHOD && p.status === 'HOD_APPROVED' && (
                          <button
                            onClick={() => {
                              questionBankService.submitPaperForHOI(p.id, user, role || 'HOD');
                              showToast(`Paper escalated to HOI for final lock!`);
                              triggerRefresh();
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Send to HOI
                          </button>
                        )}

                        {/* HOI Final Lock & Publish */}
                        {isHOI && (p.status === 'SUBMITTED_FOR_HOI' || p.status === 'HOD_APPROVED') && (
                          <button
                            onClick={() => {
                              questionBankService.reviewPaperByHOI(p.id, 'HOI_LOCKED', 'Final examination paper approved and locked.', user, role || 'PRINCIPAL');
                              showToast(`Paper ${p.paperCode} locked by HOI!`);
                              triggerRefresh();
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Lock Paper
                          </button>
                        )}

                        {isHOI && p.status === 'HOI_LOCKED' && (
                          <button
                            onClick={() => {
                              questionBankService.reviewPaperByHOI(p.id, 'PUBLISHED', 'Published to candidate portal.', user, role || 'PRINCIPAL');
                              showToast(`Paper ${p.paperCode} published live!`);
                              triggerRefresh();
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Publish Live
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
      )}

      {/* ── 7. TAB: REPORTS & ANALYTICS ──────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Examination & Question Bank Audit Dossiers</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Export accredited reports for NAAC Criterion 2 & NBA Course Outcome evaluation.</p>
            </div>
            <button
              onClick={() => questionBankService.exportComprehensiveReports(filters, role || undefined, user)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Full CSV Audit Pack</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[
              '1. Question Bank Full Audit Dossier',
              '2. Bloom Taxonomy Distribution Report',
              '3. Difficulty Index Matrix Report',
              '4. Faculty Question Contribution Index',
              '5. HOD Scrutiny Turnaround Report',
              '6. Exam Paper Assembly Ledger',
              '7. Locked Examination Paper Vault',
              '8. Published Papers Directory',
              '9. NBA Outcome CO/PO Attainment Matrix',
              '10. NAAC Criterion 2.5 Assessment Evidence',
            ].map((rep, idx) => (
              <div
                key={idx}
                onClick={() => questionBankService.exportComprehensiveReports(filters, role || undefined, user)}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-indigo-500 cursor-pointer transition-all"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">{rep}</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: QUESTION DETAILS ──────────────────────────────────────── */}
      {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="font-mono text-indigo-600 font-bold">{selectedQuestion.questionCode}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedQuestion.subjectName}</h3>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Question</span>
                <p className="text-slate-900 dark:text-white font-semibold text-sm mt-1">{selectedQuestion.questionText}</p>
              </div>

              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Options</span>
                  {selectedQuestion.options.map((opt, i) => (
                    <div key={i} className="text-slate-700 dark:text-slate-300">
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}

              {selectedQuestion.correctAnswer && (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block font-bold uppercase">Model Solution</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedQuestion.correctAnswer}</p>
                </div>
              )}

              {selectedQuestion.explanation && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40">
                  <span className="text-indigo-700 dark:text-indigo-400 text-[10px] block font-bold uppercase">Rubric & Bloom Analysis</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedQuestion.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXAM PAPER PRINT PREVIEW ──────────────────────────────── */}
      {showPaperModal && selectedPaper && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-xs max-h-[90vh] overflow-y-auto">
            {/* University Paper Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-800 dark:border-slate-200 pb-4">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Swarrnim Startup & Innovation University
              </h2>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Department of Computer Engineering • Examination Cell
              </h3>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedPaper.title}</p>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-300 pt-2">
                <span>Code: {selectedPaper.paperCode}</span>
                <span>Duration: {selectedPaper.durationMinutes} Minutes</span>
                <span>Max Marks: {selectedPaper.totalMarks}</span>
              </div>
            </div>

            {selectedPaper.instructions && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-pre-line">
                <strong>Instructions:</strong>
                {'\n' + selectedPaper.instructions}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {selectedPaper.questions.map((pq, idx) => (
                <div key={pq.id} className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">Q{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{pq.question?.questionText || 'Question item'}</span>
                    </div>
                    {pq.question?.options && pq.question.options.length > 0 && (
                      <div className="pl-6 grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        {pq.question.options.map((o, i) => (
                          <div key={i}>({String.fromCharCode(97 + i)}) {o}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">[{pq.marks} Marks]</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Paper</span>
              </button>
              <button
                onClick={() => setShowPaperModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REVIEW / SCRUTINY DECISION ─────────────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {reviewType === 'QUESTION' ? 'Scrutinize & Review Question' : 'Scrutinize & Review Exam Paper'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={e => setReviewDecision(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="APPROVED">Approve for Exam Use</option>
                  <option value="REJECTED">Reject / Return for Revision</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Scrutiny Remarks *</label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Provide justification or required revision comments..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-3.5 py-2 text-slate-500 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewType === 'QUESTION') {
                    questionBankService.reviewQuestion(targetReviewId, reviewDecision as any, reviewRemarks, user, role || 'HOD');
                    showToast(`Question review recorded as ${reviewDecision}!`);
                  } else {
                    questionBankService.reviewPaperByHOD(targetReviewId, reviewDecision === 'APPROVED' ? 'HOD_APPROVED' : 'HOD_REJECTED', reviewRemarks, user, role || 'HOD');
                    showToast(`Paper review recorded!`);
                  }
                  setShowReviewModal(false);
                  setReviewRemarks('');
                  triggerRefresh();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
