import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { 
  HelpCircle, Clock, CheckCircle2, Award, ArrowRight, 
  RotateCcw, Sparkles, BookOpen, AlertCircle, Play, Check, X,
  Plus, Edit2, Trash2, Users, Eye, BarChart3, Globe, Archive, 
  FileText, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, 
  FileSpreadsheet, Printer, RefreshCw, CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  attemptedAt: string;
  userAnswers?: Record<number, number>;
}

export interface QuizItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  unitName: string;
  unitNo: number;
  totalQuestions: number;
  durationMinutes: number;
  passingPercentage: number;
  status: 'AVAILABLE' | 'COMPLETED' | 'DRAFT' | 'ARCHIVED';
  bestScore?: number;
  questions: QuizQuestion[];
  attempts?: QuizAttempt[];
}

const initialQuizzes: QuizItem[] = [
  {
    id: 'quiz-1',
    title: 'Unit 2: Relational Algebra & SQL Joins Practice Test',
    subjectCode: 'CS401',
    subjectName: 'Database Management Systems',
    unitName: 'Unit 2',
    unitNo: 2,
    totalQuestions: 4,
    durationMinutes: 10,
    passingPercentage: 60,
    status: 'AVAILABLE',
    questions: [
      {
        id: 'q1',
        question: 'Which relational algebra operation selects rows that satisfy a given condition?',
        options: ['Projection (π)', 'Selection (σ)', 'Cartesian Product (×)', 'Rename (ρ)'],
        correctIndex: 1,
        explanation: 'Selection (σ) is a unary operation that selects tuples that satisfy a given predicate.'
      },
      {
        id: 'q2',
        question: 'What type of JOIN returns all records from the left table and matched records from the right table?',
        options: ['INNER JOIN', 'FULL OUTER JOIN', 'LEFT OUTER JOIN', 'CROSS JOIN'],
        correctIndex: 2,
        explanation: 'LEFT JOIN returns all rows from the left table, and matching rows from the right table.'
      },
      {
        id: 'q3',
        question: 'In BCNF, every functional dependency X -> Y must have X as a:',
        options: ['Candidate Key / Super Key', 'Foreign Key', 'Primary Key only', 'Composite Key'],
        correctIndex: 0,
        explanation: 'Boyce-Codd Normal Form (BCNF) strictly requires that for every X -> Y, X must be a super key.'
      },
      {
        id: 'q4',
        question: 'Which ACID property ensures that a transaction is completely executed or completely aborted?',
        options: ['Consistency', 'Atomicity', 'Isolation', 'Durability'],
        correctIndex: 1,
        explanation: 'Atomicity ensures "all or nothing" execution for database transactions.'
      }
    ],
    attempts: [
      {
        id: 'att-1',
        studentId: 'stu-1',
        studentName: 'Aarav Patel',
        enrollmentNo: '230101001',
        score: 4,
        totalQuestions: 4,
        percentage: 100,
        isPassed: true,
        attemptedAt: '2026-03-10 14:30',
        userAnswers: { 0: 1, 1: 2, 2: 0, 3: 1 }
      },
      {
        id: 'att-2',
        studentId: 'stu-2',
        studentName: 'Diya Sharma',
        enrollmentNo: '230101002',
        score: 3,
        totalQuestions: 4,
        percentage: 75,
        isPassed: true,
        attemptedAt: '2026-03-11 11:15',
        userAnswers: { 0: 1, 1: 2, 2: 1, 3: 1 }
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Unit 3: Transport Layer & TCP Congestion Control Quiz',
    subjectCode: 'CS402',
    subjectName: 'Computer Networks',
    unitName: 'Unit 3',
    unitNo: 3,
    totalQuestions: 3,
    durationMinutes: 8,
    passingPercentage: 60,
    status: 'AVAILABLE',
    questions: [
      {
        id: 'q2-1',
        question: 'Which protocol provides reliable, connection-oriented byte-stream delivery?',
        options: ['UDP', 'TCP', 'IP', 'ICMP'],
        correctIndex: 1,
        explanation: 'TCP (Transmission Control Protocol) is connection-oriented and reliable.'
      },
      {
        id: 'q2-2',
        question: 'What is the standard port number for HTTPS secure web traffic?',
        options: ['80', '21', '443', '22'],
        correctIndex: 2,
        explanation: 'Port 443 is the standard default port used for HTTPS encrypted communication.'
      },
      {
        id: 'q2-3',
        question: 'Which algorithm is used in TCP for slow start and congestion avoidance?',
        options: ['Bellman-Ford', 'AIMD (Additive Increase Multiplicative Decrease)', 'Dijkstra', 'Floyd-Warshall'],
        correctIndex: 1,
        explanation: 'TCP congestion control employs Additive Increase Multiplicative Decrease (AIMD).'
      }
    ],
    attempts: []
  },
  {
    id: 'quiz-3',
    title: 'Unit 1: React Component Lifecycle & State Hooks Practice Test',
    subjectCode: 'CS403',
    subjectName: 'Modern Web Architecture & Frameworks',
    unitName: 'Unit 1',
    unitNo: 1,
    totalQuestions: 4,
    durationMinutes: 12,
    passingPercentage: 60,
    status: 'AVAILABLE',
    questions: [
      {
        id: 'q3-1',
        question: 'Which React hook should be used to run side-effects such as data fetching or subscriptions?',
        options: ['useMemo', 'useState', 'useEffect', 'useCallback'],
        correctIndex: 2,
        explanation: 'useEffect is designed specifically for performing side effects in functional components.'
      },
      {
        id: 'q3-2',
        question: 'What does the dependency array in useEffect control?',
        options: ['Component props types', 'When the effect re-runs based on value changes', 'DOM rendering priority', 'State persistence in local storage'],
        correctIndex: 1,
        explanation: 'The dependency array tells React to only re-run the effect when specified values change.'
      },
      {
        id: 'q3-3',
        question: 'In React 18+, which hook is used for deferring non-urgent state updates?',
        options: ['useTransition', 'useId', 'useImperativeHandle', 'useLayoutEffect'],
        correctIndex: 0,
        explanation: 'useTransition marks state updates as non-blocking transitions to keep the UI responsive.'
      },
      {
        id: 'q3-4',
        question: 'What happens when state is mutated directly without calling the updater function in useState?',
        options: ['React immediately triggers a re-render', 'React throws a fatal compilation error', 'React fails to detect the change and will not re-render', 'The component unmounts automatically'],
        correctIndex: 2,
        explanation: 'React relies on immutable state updates to detect shallow changes and trigger reconciliation.'
      }
    ],
    attempts: []
  },
  {
    id: 'quiz-4',
    title: 'Unit 2: Process Synchronization & Semaphores Assessment',
    subjectCode: 'CS404',
    subjectName: 'Operating Systems & System Programming',
    unitName: 'Unit 2',
    unitNo: 2,
    totalQuestions: 3,
    durationMinutes: 10,
    passingPercentage: 65,
    status: 'AVAILABLE',
    questions: [
      {
        id: 'q4-1',
        question: 'What condition occurs when two or more processes are waiting indefinitely for an event caused by one of the waiting processes?',
        options: ['Starvation', 'Deadlock', 'Race Condition', 'Thrashing'],
        correctIndex: 1,
        explanation: 'Deadlock is a state where a set of processes are blocked because each process is holding a resource and waiting for another.'
      },
      {
        id: 'q4-2',
        question: 'A counting semaphore S is initialized to 10. Then 6 wait(P) operations and 4 signal(V) operations are completed. What is the final value of S?',
        options: ['8', '12', '4', '14'],
        correctIndex: 0,
        explanation: 'Initial S = 10. After 6 wait operations: 10 - 6 = 4. After 4 signal operations: 4 + 4 = 8.'
      },
      {
        id: 'q4-3',
        question: 'Which of the following is NOT one of Coffman’s four necessary conditions for deadlock?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Round Robin Scheduling'],
        correctIndex: 3,
        explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.'
      }
    ],
    attempts: []
  }
];

type SortField = 'srNo' | 'subjectCode' | 'title' | 'subjectName' | 'unitNo' | 'totalQuestions' | 'durationMinutes' | 'passingPercentage' | 'status';
type SortOrder = 'asc' | 'desc';

export const QuizPage: React.FC = () => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const subjects = db.getSubjects();

  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes);

  // Student Test Taking State
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // View Past Results Modal
  const [viewingResultQuiz, setViewingResultQuiz] = useState<{ quiz: QuizItem; attempt: QuizAttempt } | null>(null);

  // Faculty Management State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [viewingAttemptsQuiz, setViewingAttemptsQuiz] = useState<QuizItem | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('subjectCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Form State for Quiz
  const [quizTitle, setQuizTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [unitName, setUnitName] = useState('Unit 1');
  const [unitNo, setUnitNo] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [quizStatus, setQuizStatus] = useState<'AVAILABLE' | 'DRAFT' | 'ARCHIVED'>('AVAILABLE');
  const [formQuestions, setFormQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-new-1',
      question: 'Sample Question 1',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Explanation for correct option A'
    }
  ]);

  // Student test runner handlers
  const handleStartQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const passed = calculatedScore >= activeQuiz.passingPercentage;
    setScore(calculatedScore);
    setQuizSubmitted(true);

    // Record attempt
    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      studentId: user?.id || 'stu-1',
      studentName: user?.name || 'Student User',
      enrollmentNo: user?.enrollmentNo || '230101001',
      score: correctCount,
      totalQuestions: activeQuiz.questions.length,
      percentage: calculatedScore,
      isPassed: passed,
      attemptedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userAnswers: { ...selectedAnswers }
    };

    setQuizzes(prev => prev.map(q => {
      if (q.id === activeQuiz.id) {
        return {
          ...q,
          status: 'COMPLETED',
          bestScore: Math.max(q.bestScore || 0, calculatedScore),
          attempts: [newAttempt, ...(q.attempts || [])]
        };
      }
      return q;
    }));
  };

  // Faculty Management Handlers
  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setQuizTitle('');
    setSubjectId(subjects[0]?.id || '');
    setUnitName('Unit 1');
    setUnitNo(1);
    setDurationMinutes(15);
    setPassingPercentage(60);
    setQuizStatus('AVAILABLE');
    setFormQuestions([
      {
        id: `q-${Date.now()}-1`,
        question: 'Enter your question here...',
        options: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
        correctIndex: 0,
        explanation: 'Brief explanation for correct answer.'
      }
    ]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (quiz: QuizItem) => {
    setEditingQuiz(quiz);
    setQuizTitle(quiz.title);
    const sub = subjects.find(s => s.code === quiz.subjectCode || s.name === quiz.subjectName);
    setSubjectId(sub?.id || subjects[0]?.id || '');
    setUnitName(quiz.unitName);
    setUnitNo(quiz.unitNo || 1);
    setDurationMinutes(quiz.durationMinutes);
    setPassingPercentage(quiz.passingPercentage);
    setQuizStatus(quiz.status as any);
    setFormQuestions([...quiz.questions]);
    setIsCreateModalOpen(true);
  };

  const handleAddQuestionToForm = () => {
    setFormQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: `Question ${prev.length + 1}`,
        options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        correctIndex: 0,
        explanation: 'Explanation for correct choice.'
      }
    ]);
  };

  const handleRemoveQuestionFromForm = (idx: number) => {
    if (formQuestions.length <= 1) {
      alert('A quiz must have at least 1 question.');
      return;
    }
    setFormQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionField = (idx: number, field: string, value: any) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i === idx) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const nextOpts = [...q.options];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      }
      return q;
    }));
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    const selectedSub = subjects.find(s => s.id === subjectId) || subjects[0];

    if (editingQuiz) {
      setQuizzes(prev => prev.map(q => {
        if (q.id === editingQuiz.id) {
          return {
            ...q,
            title: quizTitle,
            subjectCode: selectedSub?.code || 'CS401',
            subjectName: selectedSub?.name || 'Computer Science',
            unitName,
            unitNo: Number(unitNo),
            durationMinutes: Number(durationMinutes),
            passingPercentage: Number(passingPercentage),
            status: quizStatus,
            totalQuestions: formQuestions.length,
            questions: formQuestions
          };
        }
        return q;
      }));
    } else {
      const newQuiz: QuizItem = {
        id: `quiz-${Date.now()}`,
        title: quizTitle,
        subjectCode: selectedSub?.code || 'CS401',
        subjectName: selectedSub?.name || 'Computer Science',
        unitName,
        unitNo: Number(unitNo),
        totalQuestions: formQuestions.length,
        durationMinutes: Number(durationMinutes),
        passingPercentage: Number(passingPercentage),
        status: quizStatus,
        questions: formQuestions,
        attempts: []
      };

      setQuizzes(prev => [newQuiz, ...prev]);

      if (quizStatus === 'AVAILABLE') {
        db.addNotification({
          title: `New Quiz Scheduled: ${quizTitle}`,
          message: `${selectedSub?.name}: Practice test with ${formQuestions.length} questions published.`,
          module: 'ASSIGNMENT',
          timestamp: 'Just now',
          targetRole: 'STUDENT',
          linkTab: 'quiz'
        });
      }
    }

    setIsCreateModalOpen(false);
  };

  const handleDeleteQuiz = (id: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      setQuizzes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleTogglePublish = (quiz: QuizItem) => {
    const nextStatus = quiz.status === 'AVAILABLE' ? 'ARCHIVED' : 'AVAILABLE';
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: nextStatus } : q));
  };

  // Student Attempt resolution for each quiz
  const enrichedQuizzes = useMemo(() => {
    return quizzes.map((quiz, index) => {
      const myAttempt = (quiz.attempts || []).find(
        a => a.studentId === user?.id || (user?.enrollmentNo && a.enrollmentNo === user?.enrollmentNo)
      ) || (quiz.attempts && quiz.attempts.length > 0 ? quiz.attempts[0] : undefined);

      const hasAttempted = Boolean(myAttempt || quiz.bestScore !== undefined || quiz.status === 'COMPLETED');
      const isPassed = myAttempt ? myAttempt.isPassed : (quiz.bestScore !== undefined ? quiz.bestScore >= quiz.passingPercentage : false);

      let statusBadgeLabel = 'NOT ATTEMPTED';
      let statusBadgeVariant: 'active' | 'gold' | 'danger' | 'navy' | 'inactive' = 'inactive';

      if (hasAttempted) {
        if (isPassed) {
          statusBadgeLabel = 'PASSED';
          statusBadgeVariant = 'active';
        } else {
          statusBadgeLabel = 'FAILED';
          statusBadgeVariant = 'danger';
        }
      } else {
        if (quiz.status === 'AVAILABLE') {
          statusBadgeLabel = 'AVAILABLE';
          statusBadgeVariant = 'active';
        } else if (quiz.status === 'DRAFT') {
          statusBadgeLabel = 'DRAFT';
          statusBadgeVariant = 'gold';
        } else {
          statusBadgeLabel = 'NOT ATTEMPTED';
          statusBadgeVariant = 'inactive';
        }
      }

      const attemptCountStr = hasAttempted ? '1/1' : '0/1';

      return {
        ...quiz,
        rawIndex: index + 1,
        myAttempt,
        hasAttempted,
        isPassed,
        statusBadgeLabel,
        statusBadgeVariant,
        attemptCountStr
      };
    });
  }, [quizzes, user]);

  // Unique filter list options
  const uniqueCourses = useMemo(() => {
    const list = Array.from(new Set(quizzes.map(q => q.subjectCode)));
    return list.sort();
  }, [quizzes]);

  const uniqueUnits = useMemo(() => {
    const list = Array.from(new Set(quizzes.map(q => q.unitName || `Unit ${q.unitNo}`)));
    return list.sort();
  }, [quizzes]);

  // Filtered & Sorted Quizzes
  const filteredQuizzes = useMemo(() => {
    return enrichedQuizzes.filter(q => {
      // Search
      if (searchQuery.trim()) {
        const text = searchQuery.toLowerCase();
        const mTitle = q.title.toLowerCase().includes(text);
        const mCode = q.subjectCode.toLowerCase().includes(text);
        const mSub = q.subjectName.toLowerCase().includes(text);
        const mUnit = (q.unitName || '').toLowerCase().includes(text);
        if (!mTitle && !mCode && !mSub && !mUnit) return false;
      }

      // Course Filter
      if (selectedCourseFilter !== 'ALL' && q.subjectCode !== selectedCourseFilter) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'PASSED' && q.statusBadgeLabel !== 'PASSED') return false;
        if (selectedStatusFilter === 'FAILED' && q.statusBadgeLabel !== 'FAILED') return false;
        if (selectedStatusFilter === 'NOT_ATTEMPTED' && q.hasAttempted) return false;
        if (selectedStatusFilter === 'AVAILABLE' && q.status !== 'AVAILABLE') return false;
      }

      // Unit Filter
      if (selectedUnitFilter !== 'ALL' && (q.unitName !== selectedUnitFilter && `Unit ${q.unitNo}` !== selectedUnitFilter)) {
        return false;
      }

      return true;
    });
  }, [enrichedQuizzes, searchQuery, selectedCourseFilter, selectedStatusFilter, selectedUnitFilter]);

  const sortedQuizzes = useMemo(() => {
    return [...filteredQuizzes].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'srNo':
          valA = a.rawIndex;
          valB = b.rawIndex;
          break;
        case 'subjectCode':
          valA = a.subjectCode;
          valB = b.subjectCode;
          break;
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case 'subjectName':
          valA = a.subjectName.toLowerCase();
          valB = b.subjectName.toLowerCase();
          break;
        case 'unitNo':
          valA = a.unitNo;
          valB = b.unitNo;
          break;
        case 'totalQuestions':
          valA = a.totalQuestions;
          valB = b.totalQuestions;
          break;
        case 'durationMinutes':
          valA = a.durationMinutes;
          valB = b.durationMinutes;
          break;
        case 'passingPercentage':
          valA = a.passingPercentage;
          valB = b.passingPercentage;
          break;
        case 'status':
          valA = a.statusBadgeLabel;
          valB = b.statusBadgeLabel;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredQuizzes, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export Excel Functionality
  const handleExportExcel = () => {
    try {
      const rows = sortedQuizzes.map((item, idx) => ({
        'Sr. No.': idx + 1,
        'Course Code': item.subjectCode,
        'Quiz / Test Title': item.title,
        'Subject': item.subjectName,
        'Unit': item.unitName || `Unit ${item.unitNo}`,
        'Questions': item.totalQuestions,
        'Duration': `${item.durationMinutes} Mins`,
        'Pass Threshold': `${item.passingPercentage}%`,
        'Status': item.statusBadgeLabel,
        'Attempt': item.attemptCountStr,
        'Best Score': item.bestScore !== undefined ? `${item.bestScore}%` : '—'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Quizzes');

      worksheet['!cols'] = [
        { wch: 8 },  // Sr. No.
        { wch: 14 }, // Course Code
        { wch: 45 }, // Title
        { wch: 32 }, // Subject
        { wch: 12 }, // Unit
        { wch: 12 }, // Questions
        { wch: 14 }, // Duration
        { wch: 16 }, // Pass Threshold
        { wch: 18 }, // Status
        { wch: 12 }, // Attempt
        { wch: 14 }  // Best Score
      ];

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `SSIU_Academic_Quizzes_${dateStr}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Failed to export Excel.');
    }
  };

  // Print Functionality
  const handlePrint = () => {
    window.print();
  };

  // Render Student Active Test Screen
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const userSelected = selectedAnswers[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;
    const isAnswered = userSelected !== undefined;
    const isPassed = score >= activeQuiz.passingPercentage;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '840px', margin: '0 auto' }}>
        {/* Active Quiz Header */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#0F2C59', color: '#FFFFFF', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F37023', fontSize: '0.8125rem', fontWeight: 800 }}>
                <span>{activeQuiz.subjectCode} • {activeQuiz.subjectName} • {activeQuiz.unitName || `Unit ${activeQuiz.unitNo}`}</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem', margin: 0 }}>{activeQuiz.title}</h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.65rem', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
                <Clock size={15} color="#F37023" /> {activeQuiz.durationMinutes} Mins
              </div>
              <button 
                onClick={() => setActiveQuiz(null)}
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: 'none', height: '30px', fontSize: '0.75rem' }}
              >
                Exit Test
              </button>
            </div>
          </div>

          {/* Question Stepper Bar */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1rem' }}>
            {activeQuiz.questions.map((_, idx) => {
              const isCurr = idx === currentQuestionIndex;
              const isFilled = selectedAnswers[idx] !== undefined;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    border: 'none',
                    backgroundColor: isCurr ? '#F37023' : (isFilled ? '#10B981' : 'rgba(255,255,255,0.25)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={`Question ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Results Screen */}
        {quizSubmitted ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderLeft: isPassed ? '6px solid #10B981' : '6px solid #EF4444', borderRadius: '6px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isPassed ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              {isPassed ? <Award size={36} /> : <AlertCircle size={36} />}
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2C59', margin: 0 }}>
              {isPassed ? 'Congratulations! Quiz Passed' : 'Quiz Needs Revision'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.35rem' }}>
              Passing criteria: <strong>{activeQuiz.passingPercentage}%</strong> • Required: <strong>{Math.ceil((activeQuiz.passingPercentage / 100) * activeQuiz.questions.length)} / {activeQuiz.questions.length}</strong> questions
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>YOUR SCORE</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isPassed ? '#10B981' : '#EF4444' }}>{score}%</div>
              </div>
              <div style={{ padding: '0.85rem 1.5rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>CORRECT ANSWERS</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F2C59' }}>
                  {activeQuiz.questions.filter((q, idx) => selectedAnswers[idx] === q.correctIndex).length} / {activeQuiz.questions.length}
                </div>
              </div>
            </div>

            {/* Answer Explanations Review */}
            <div style={{ textAlign: 'left', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F2C59', marginBottom: '0.85rem' }}>
                Detailed Question Solutions &amp; Concepts
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeQuiz.questions.map((q, idx) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div key={q.id} style={{ padding: '0.85rem 1rem', borderRadius: '6px', border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem', color: isCorrect ? '#10B981' : '#EF4444', marginBottom: '0.25rem' }}>
                        {isCorrect ? <CheckCircle2 size={16} /> : <X size={16} />} Question {idx + 1}: {q.question}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#0F2C59', marginTop: '0.25rem' }}>
                        <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                      </div>
                      {userAns !== undefined && userAns !== q.correctIndex && (
                        <div style={{ fontSize: '0.8125rem', color: '#EF4444', marginTop: '0.15rem' }}>
                          <strong>Your Answer:</strong> {q.options[userAns]}
                        </div>
                      )}
                      <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '0.35rem', fontStyle: 'italic' }}>
                        💡 {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => handleStartQuiz(activeQuiz)} className="btn btn-secondary btn-sm">
                <RotateCcw size={14} /> Retake Test
              </button>
              <button onClick={() => setActiveQuiz(null)} className="btn btn-primary btn-sm">
                Return to Quizzes Table
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Question Card */
          <div className="card" style={{ padding: '1.75rem', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <Badge variant="orange">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</Badge>
              <span style={{ fontSize: '0.78125rem', color: '#64748B', fontWeight: 600 }}>Single Choice</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F2C59', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {currentQ.question}
            </h3>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = userSelected === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(optIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #F37023' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? 'rgba(243,112,35,0.06)' : '#FFFFFF',
                      color: isSelected ? '#0F2C59' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #F37023' : '2px solid #94A3B8',
                      backgroundColor: isSelected ? '#F37023' : 'transparent',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isLastQuestion ? (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    Next Question <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={!isAnswered}
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <CheckCircle2 size={14} /> Submit &amp; View Score
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN TABLE VIEW ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── PRINT MEDIA STYLES ──────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-quizzes-table, #printable-quizzes-table * {
            visibility: visible !important;
          }
          #printable-quizzes-table {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          .no-print-toolbar, .no-print-actions-cell, .no-print-header-actions {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#FFFFFF',
        padding: '1.25rem 1.5rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: '#0F2C59',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckSquare size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.3px' }}>
                Continuous Assessment &amp; Quiz Portal
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                Test your unit concepts with timed practice tests and immediate solution feedback
              </p>
            </div>
          </div>
        </div>

        <div className="no-print-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {!isStudent && (
            <button className="btn btn-primary btn-sm" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <Plus size={15} /> Create New Quiz
            </button>
          )}
        </div>
      </div>

      {/* ── EXCEL-STYLE DATA TABLE CONTAINER ─────────────────────────────────── */}
      <div 
        id="printable-quizzes-table"
        style={{
          background: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #CBD5E1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Professional Toolbar */}
        <div className="no-print-toolbar" style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #CBD5E1',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          
          {/* Left Controls: Search & Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '200px', maxWidth: '280px', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  paddingLeft: '32px',
                  paddingRight: '10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F2C59',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Course: All</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Status: All</option>
              <option value="AVAILABLE">Available / Not Attempted</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>

            {/* Unit Filter */}
            <select
              value={selectedUnitFilter}
              onChange={e => setSelectedUnitFilter(e.target.value)}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Unit: All</option>
              {uniqueUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                padding: '0 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="subjectCode">Sort: Course Code</option>
              <option value="title">Sort: Quiz Title</option>
              <option value="unitNo">Sort: Unit Number</option>
              <option value="durationMinutes">Sort: Duration</option>
              <option value="totalQuestions">Sort: Questions</option>
              <option value="passingPercentage">Sort: Threshold</option>
            </select>

            {(searchQuery || selectedCourseFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedUnitFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourseFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSelectedUnitFilter('ALL');
                }}
                style={{ height: '32px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Reset
              </button>
            )}
          </div>

          {/* Right Controls: Count & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B', marginRight: '4px' }}>
              Showing {sortedQuizzes.length} {sortedQuizzes.length === 1 ? 'quiz' : 'quizzes'}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', borderColor: '#A7F3D0', background: '#F0FDF4' }}
              title="Export to Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} /> Export
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ height: '32px', fontSize: '0.78125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Print Table"
            >
              <Printer size={15} /> Print
            </button>
          </div>

        </div>

        {/* ── EXCEL-STYLE DATA TABLE (HORIZONTAL SCROLL ON MOBILE/TABLET) ── */}
        <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            textAlign: 'left',
            background: '#FFFFFF',
            minWidth: '980px'
          }}>
            {/* Sticky Table Header */}
            <thead>
              <tr style={{
                background: '#0F2C59',
                color: '#FFFFFF',
                borderBottom: '2px solid #0B2245'
              }}>
                
                {/* 1. Sr. No. */}
                <th 
                  onClick={() => handleSort('srNo')}
                  style={{
                    padding: '10px 8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    width: '55px',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    Sr. {sortField === 'srNo' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 2. Course Code */}
                <th 
                  onClick={() => handleSort('subjectCode')}
                  style={{
                    padding: '10px 10px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '105px',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Course Code {sortField === 'subjectCode' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 3. Quiz / Test Title */}
                <th 
                  onClick={() => handleSort('title')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    minWidth: '220px',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Quiz / Test Title {sortField === 'title' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 4. Subject */}
                <th 
                  onClick={() => handleSort('subjectName')}
                  style={{
                    padding: '10px 12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    minWidth: '180px',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Subject {sortField === 'subjectName' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 5. Unit / Module */}
                <th 
                  onClick={() => handleSort('unitNo')}
                  style={{
                    padding: '10px 10px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '80px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    Unit {sortField === 'unitNo' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 6. Questions */}
                <th 
                  onClick={() => handleSort('totalQuestions')}
                  style={{
                    padding: '10px 8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '85px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    Questions {sortField === 'totalQuestions' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 7. Duration */}
                <th 
                  onClick={() => handleSort('durationMinutes')}
                  style={{
                    padding: '10px 8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '90px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    Duration {sortField === 'durationMinutes' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 8. Pass Threshold */}
                <th 
                  onClick={() => handleSort('passingPercentage')}
                  style={{
                    padding: '10px 8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '110px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    Pass Threshold {sortField === 'passingPercentage' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={11} color="rgba(255,255,255,0.5)" />}
                  </div>
                </th>

                {/* 9. Status */}
                <th 
                  onClick={() => handleSort('status')}
                  style={{
                    padding: '10px 10px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '115px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Status
                </th>

                {/* 10. Attempt */}
                <th 
                  style={{
                    padding: '10px 8px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: '80px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  Attempt
                </th>

                {/* 11. Action */}
                <th 
                  className="no-print-actions-cell"
                  style={{
                    padding: '10px 12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    minWidth: '150px'
                  }}
                >
                  Action
                </th>

              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={28} color="#94A3B8" />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#334155' }}>No quizzes found</span>
                      <span style={{ fontSize: '0.8125rem' }}>Try adjusting your search query or filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedQuizzes.map((quiz, idx) => {
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={quiz.id}
                      style={{
                        background: isEven ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? '#FFFFFF' : '#F8FAFC')}
                    >
                      {/* 1. Sr. No. */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {idx + 1}
                      </td>

                      {/* 2. Course Code */}
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '2px 6px',
                          background: '#F1F5F9',
                          color: '#0F2C59',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid #E2E8F0'
                        }}>
                          {quiz.subjectCode}
                        </span>
                      </td>

                      {/* 3. Quiz / Test Title */}
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        <div>{quiz.title}</div>
                      </td>

                      {/* 4. Subject */}
                      <td style={{ padding: '8px 12px', color: '#334155', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                        {quiz.subjectName}
                      </td>

                      {/* 5. Unit / Module */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          background: '#FFF7ED',
                          color: '#C2410C',
                          border: '1px solid #FFEDD5',
                          borderRadius: '4px',
                          fontSize: '0.71875rem',
                          fontWeight: 800
                        }}>
                          {quiz.unitName || `Unit ${quiz.unitNo}`}
                        </span>
                      </td>

                      {/* 6. Questions */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {quiz.totalQuestions}
                      </td>

                      {/* 7. Duration */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#475569', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={12} color="#F37023" /> {quiz.durationMinutes} Mins
                        </span>
                      </td>

                      {/* 8. Pass Threshold */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {quiz.passingPercentage}%
                      </td>

                      {/* 9. Status */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <Badge variant={quiz.statusBadgeVariant}>
                          {quiz.statusBadgeLabel}
                        </Badge>
                      </td>

                      {/* 10. Attempt */}
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: quiz.hasAttempted ? (quiz.isPassed ? '#16A34A' : '#DC2626') : '#64748B'
                        }}>
                          {quiz.attemptCountStr}
                        </span>
                        {quiz.bestScore !== undefined && (
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: quiz.isPassed ? '#16A34A' : '#DC2626' }}>
                            ({quiz.bestScore}%)
                          </div>
                        )}
                      </td>

                      {/* 11. Action */}
                      <td className="no-print-actions-cell" style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          
                          {/* Student Role Actions */}
                          {isStudent ? (
                            quiz.hasAttempted ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm py-1 px-2"
                                  onClick={() => setViewingResultQuiz({ quiz, attempt: quiz.myAttempt || quiz.attempts![0] })}
                                  title="View Your Test Score & Solutions"
                                  style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem', color: '#0F2C59', borderColor: '#CBD5E1' }}
                                >
                                  <Eye size={12} /> View Result
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm py-1 px-2"
                                  onClick={() => handleStartQuiz(quiz)}
                                  title="Retake Practice Quiz"
                                  style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem', background: '#F37023', borderColor: '#F37023' }}
                                >
                                  <RotateCcw size={12} /> Retake
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm py-1 px-2"
                                onClick={() => handleStartQuiz(quiz)}
                                title="Start Practice Quiz"
                                style={{
                                  height: '26px',
                                  padding: '0 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: '#F37023',
                                  borderColor: '#F37023',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Play size={12} fill="#FFFFFF" /> Start Quiz
                              </button>
                            )
                          ) : (
                            /* Faculty / Admin Role Actions */
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm py-1 px-2"
                                onClick={() => setViewingAttemptsQuiz(quiz)}
                                title="View Student Results"
                                style={{ height: '26px', padding: '0 6px', fontSize: '0.71875rem' }}
                              >
                                <Users size={12} /> ({quiz.attempts?.length || 0})
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm py-1 px-2"
                                onClick={() => handleTogglePublish(quiz)}
                                title={quiz.status === 'AVAILABLE' ? 'Archive Quiz' : 'Publish Quiz'}
                                style={{ height: '26px', padding: '0 6px' }}
                              >
                                {quiz.status === 'AVAILABLE' ? <Archive size={12} /> : <Globe size={12} />}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm py-1 px-2"
                                onClick={() => handleOpenEdit(quiz)}
                                title="Edit Quiz"
                                style={{ height: '26px', padding: '0 6px' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm py-1 px-2"
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                title="Delete Quiz"
                                style={{ height: '26px', padding: '0 6px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status Summary Bar */}
        <div style={{
          background: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.78125rem',
          color: '#64748B'
        }}>
          <div>
            Total Practice Tests: <strong>{enrichedQuizzes.length}</strong> | Attempted: <strong>{enrichedQuizzes.filter(q => q.hasAttempted).length}</strong> | Passed: <strong>{enrichedQuizzes.filter(q => q.isPassed).length}</strong>
          </div>
          <div>
            Passing Criteria: Score &ge; Pass Threshold for each module
          </div>
        </div>

      </div>

      {/* ── MODAL 1: VIEW STUDENT PAST RESULT & SOLUTIONS MODAL ─────────────── */}
      {viewingResultQuiz && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '88vh', overflowY: 'auto', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Quiz Results &amp; Solutions
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#F37023', fontWeight: 700, marginTop: '2px' }}>
                  {viewingResultQuiz.quiz.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingResultQuiz(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Score Strip */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '6px',
              backgroundColor: viewingResultQuiz.attempt.isPassed ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${viewingResultQuiz.attempt.isPassed ? '#BBF7D0' : '#FECACA'}`,
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: viewingResultQuiz.attempt.isPassed ? '#15803D' : '#DC2626', textTransform: 'uppercase' }}>
                  TEST RESULT STATUS
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: viewingResultQuiz.attempt.isPassed ? '#16A34A' : '#DC2626' }}>
                  {viewingResultQuiz.attempt.isPassed ? 'PASSED' : 'FAILED'} ({viewingResultQuiz.attempt.percentage}%)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Attempted on: {viewingResultQuiz.attempt.attemptedAt}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Pass Threshold</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F2C59' }}>{viewingResultQuiz.quiz.passingPercentage}%</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{viewingResultQuiz.attempt.score} / {viewingResultQuiz.attempt.totalQuestions} Correct</div>
              </div>
            </div>

            {/* Detailed Questions Review */}
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59', marginBottom: '0.75rem' }}>
              Question Solutions &amp; Explanations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {viewingResultQuiz.quiz.questions.map((q, idx) => {
                const userAns = viewingResultQuiz.attempt.userAnswers?.[idx];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div key={q.id} style={{ padding: '0.85rem', borderRadius: '6px', border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECACA'}`, backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.8125rem', color: isCorrect ? '#16A34A' : '#DC2626', marginBottom: '0.25rem' }}>
                      {isCorrect ? <CheckCircle2 size={15} /> : <X size={15} />} Question {idx + 1}: {q.question}
                    </div>
                    <div style={{ fontSize: '0.78125rem', color: '#0F2C59', marginTop: '0.2rem' }}>
                      <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
                    </div>
                    {userAns !== undefined && userAns !== q.correctIndex && (
                      <div style={{ fontSize: '0.78125rem', color: '#DC2626', marginTop: '0.15rem' }}>
                        <strong>Your Answer:</strong> {q.options[userAns]}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', fontStyle: 'italic' }}>
                      💡 {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const targetQuiz = viewingResultQuiz.quiz;
                  setViewingResultQuiz(null);
                  handleStartQuiz(targetQuiz);
                }}
                style={{ background: '#F37023', borderColor: '#F37023' }}
              >
                <RotateCcw size={14} /> Retake Test
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewingResultQuiz(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: FACULTY CREATE / EDIT QUIZ MODAL ───────────────────────── */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                {editingQuiz ? 'Edit Course Quiz' : 'Create Course Quiz & Assessment'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Quiz Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Unit 3: Normalization & Query Optimization Quiz" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Subject *</label>
                  <select className="form-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Unit / Module *</label>
                  <input type="text" className="form-input" placeholder="e.g. Unit 3" value={unitName} onChange={e => { setUnitName(e.target.value); const m = e.target.value.match(/\d+/); if (m) setUnitNo(Number(m[0])); }} required />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Duration (Mins) *</label>
                  <input type="number" className="form-input" min={5} max={180} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Passing % *</label>
                  <input type="number" className="form-input" min={10} max={100} value={passingPercentage} onChange={e => setPassingPercentage(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Status *</label>
                  <select className="form-select" value={quizStatus} onChange={e => setQuizStatus(e.target.value as any)}>
                    <option value="AVAILABLE">AVAILABLE (Live to Students)</option>
                    <option value="DRAFT">DRAFT (Unpublished)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Questions Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                    Questions ({formQuestions.length})
                  </h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQuestionToForm} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Plus size={14} /> Add Question
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {formQuestions.map((q, qIdx) => (
                    <div key={q.id} style={{ padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--brand-orange)' }}>Question #{qIdx + 1}</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveQuestionFromForm(qIdx)} style={{ padding: '0.2rem 0.5rem' }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Question text..."
                          value={q.question}
                          onChange={e => handleUpdateQuestionField(qIdx, 'question', e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => handleUpdateQuestionField(qIdx, 'correctIndex', optIdx)}
                              title="Mark as correct answer"
                            />
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Explanation for solution..."
                          value={q.explanation}
                          onChange={e => handleUpdateQuestionField(qIdx, 'explanation', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingQuiz ? 'Update Quiz' : 'Save & Publish Quiz'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: FACULTY VIEW ATTEMPTS MODAL ────────────────────────────── */}
      {viewingAttemptsQuiz && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '85vh', overflowY: 'auto', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Student Quiz Attempts
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                  {viewingAttemptsQuiz.title}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingAttemptsQuiz(null)}>
                Close
              </button>
            </div>

            {(!viewingAttemptsQuiz.attempts || viewingAttemptsQuiz.attempts.length === 0) ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={36} color="#F37023" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 700, margin: 0 }}>No student attempts recorded for this quiz yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {viewingAttemptsQuiz.attempts.map(att => (
                  <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', borderLeft: att.isPassed ? '4px solid #10B981' : '4px solid #EF4444' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>{att.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrollment: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{att.enrollmentNo}</span> • {att.attemptedAt}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Badge variant={att.isPassed ? 'active' : 'danger'}>
                        {att.isPassed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1rem', color: att.isPassed ? '#10B981' : '#EF4444' }}>{att.percentage}%</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.score} / {att.totalQuestions} Correct</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
