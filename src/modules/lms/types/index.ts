export interface SyllabusUnitProgress {
  unitId: string;
  unitNumber: number;
  unitTitle: string;
  totalPlannedHours: number;
  completedHours: number;
  completionPercentage: number;
  topicsCount: number;
  completedTopicsCount: number;
  learningOutcomes: string[];
}

export interface CourseSyllabusSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: number;
  facultyName: string;
  totalUnits: number;
  overallCompletionPercentage: number;
  units: SyllabusUnitProgress[];
}

export interface StudyResourceItem {
  resourceId: string;
  subjectCode: string;
  title: string;
  resourceType: 'PDF_NOTES' | 'SLIDE_DECK' | 'VIDEO_LECTURE' | 'REFERENCE_LINK' | 'CODE_LAB';
  fileSizeBytes?: number;
  uploadDate: string;
  authorName: string;
  safeUrl: string;
}

export interface QuizQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

export interface StudentMaskedQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  marks: number;
  negativeMarks: number;
}

export interface OnlineQuizManifest {
  quizId: string;
  courseCode: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passingPercentage: number;
  negativeMarkingEnabled: boolean;
  attemptLimit: number;
  questions: QuizQuestionItem[];
}

export interface StudentQuizSubmission {
  quizId: string;
  studentId: string;
  submittedAnswers: { questionId: string; selectedOptionIndex: number }[];
  timeTakenSeconds: number;
}

export interface QuizEvaluationResult {
  attemptId: string;
  quizId: string;
  studentId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  unattemptedCount: number;
  totalMarksScored: number;
  maxMarks: number;
  percentage: number;
  hasPassed: boolean;
  evaluatedAt: string;
  questionBreakdown: {
    questionId: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
}
