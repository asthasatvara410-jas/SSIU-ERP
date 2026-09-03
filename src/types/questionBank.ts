export type QuestionType =
  | 'MCQ'
  | 'MULTIPLE_SELECT'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'DESCRIPTIVE'
  | 'NUMERICAL';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export type BloomLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export type QuestionStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'HOD_APPROVED'
  | 'REJECTED'
  | 'AVAILABLE_FOR_PAPER';

export type ExamPaperStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_HOD'
  | 'HOD_APPROVED'
  | 'HOD_REJECTED'
  | 'SUBMITTED_FOR_HOI'
  | 'HOI_LOCKED'
  | 'HOI_REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ExamType =
  | 'MIDTERM'
  | 'ENDTERM'
  | 'INTERNAL'
  | 'PRACTICAL'
  | 'REMEDIAL'
  | 'CLASS_TEST';

export interface QuestionReviewItem {
  id: string;
  questionId: string;
  reviewerId: string;
  reviewerRole: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISED';
  remarks?: string;
  createdAt: string;
}

export interface QuestionBankItem {
  id: string;
  questionCode: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // Array of choices for MCQ/MULTIPLE_SELECT
  correctAnswer?: string;
  explanation?: string;
  marks: number;
  difficultyLevel: DifficultyLevel;
  bloomLevel: BloomLevel;
  subjectId: string;
  subjectName?: string;
  departmentId: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  academicYearId?: string;
  academicYear?: string;
  semester: number;
  topic?: string;
  unit?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdByName?: string;
  status: QuestionStatus;
  reviews?: QuestionReviewItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperQuestionItem {
  id: string;
  examPaperId: string;
  questionId: string;
  section: string; // e.g. 'SECTION_A', 'SECTION_B', 'SECTION_C'
  questionOrder: number;
  marks: number;
  question?: QuestionBankItem;
  createdAt: string;
}

export interface ExamPaperReviewItem {
  id: string;
  examPaperId: string;
  reviewerId: string;
  reviewerRole: string;
  action: 'SUBMITTED_FOR_HOD' | 'HOD_APPROVED' | 'HOD_REJECTED' | 'SUBMITTED_FOR_HOI' | 'HOI_LOCKED' | 'HOI_REJECTED' | 'PUBLISHED';
  remarks?: string;
  createdAt: string;
}

export interface ExamPaperItem {
  id: string;
  paperCode: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  departmentId: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  academicYearId?: string;
  academicYear?: string;
  semester: number;
  examType: ExamType;
  totalMarks: number;
  durationMinutes: number;
  instructions?: string;
  status: ExamPaperStatus;
  createdBy: string;
  createdByName?: string;
  publishedAt?: string;
  lockedAt?: string;
  questions: ExamPaperQuestionItem[];
  reviews?: ExamPaperReviewItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilterState {
  academicYear: string;
  departmentId: string;
  programId: string;
  subjectId: string;
  questionType: string;
  difficultyLevel: string;
  bloomLevel: string;
  status: string;
  semester: string;
  searchQuery: string;
  myOnly?: boolean;
}

export interface PaperFilterState {
  academicYear: string;
  departmentId: string;
  programId: string;
  subjectId: string;
  examType: string;
  status: string;
  semester: string;
  searchQuery: string;
  myOnly?: boolean;
}

export interface QuestionBankMetrics {
  totalQuestions: number;
  draftQuestions: number;
  pendingReviewQuestions: number;
  approvedQuestions: number;
  rejectedQuestions: number;
  availableQuestions: number;
  totalPapers: number;
  draftPapers: number;
  pendingHOD: number;
  hodApproved: number;
  pendingHOI: number;
  hoiLocked: number;
  publishedPapers: number;
  rejectedPapers: number;
  facultyMetrics?: {
    myQuestions: number;
    myDrafts: number;
    myPending: number;
    myApproved: number;
    myPapers: number;
    myPaperDrafts: number;
  };
  difficultyDistribution: Record<DifficultyLevel, number>;
  bloomDistribution: Record<BloomLevel, number>;
  typeDistribution: Record<QuestionType, number>;
}

export interface BulkUploadRowError {
  row: number;
  field: string;
  error: string;
}

export interface BulkUploadPreviewItem {
  row: number;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  marks: number;
  difficultyLevel: DifficultyLevel;
  bloomLevel: BloomLevel;
  topic?: string;
  unit?: string;
  isValid: boolean;
  errors: string[];
}
