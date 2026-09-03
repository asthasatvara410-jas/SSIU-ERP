import { db } from '../../../services/db';
import { Subject, SessionPlanTopic, UnitMaterial, Assignment, AssignmentSubmission } from '../../../types';
import {
  CourseSyllabusSummary,
  SyllabusUnitProgress,
  StudyResourceItem,
  OnlineQuizManifest,
  StudentMaskedQuestionItem,
  StudentQuizSubmission,
  QuizEvaluationResult
} from '../types';

export class LMSCourseService {
  private static instance: LMSCourseService;

  private static mockQuizzes: OnlineQuizManifest[] = [
    {
      quizId: 'quiz-cs401-mid',
      courseCode: 'CS401',
      title: 'Database Management Systems — Mid-Semester MCQ Assessment',
      durationMinutes: 30,
      totalQuestions: 4,
      totalMarks: 20,
      passingPercentage: 40,
      negativeMarkingEnabled: true,
      attemptLimit: 2,
      questions: [
        {
          id: 'q1',
          questionText: 'Which normal form is strictly based on the concept of full functional dependency?',
          options: ['1NF', '2NF', '3NF', 'BCNF'],
          correctOptionIndex: 1,
          marks: 5,
          negativeMarks: 1,
          explanation: '2NF removes partial dependency, requiring full functional dependency on candidate key.'
        },
        {
          id: 'q2',
          questionText: 'Which SQL clause is used to filter groups created by the GROUP BY clause?',
          options: ['WHERE', 'ORDER BY', 'HAVING', 'FILTER'],
          correctOptionIndex: 2,
          marks: 5,
          negativeMarks: 1,
          explanation: 'HAVING filters aggregated groups, whereas WHERE filters individual rows.'
        },
        {
          id: 'q3',
          questionText: 'What type of lock allows concurrent read transactions but prevents write locks?',
          options: ['Exclusive Lock (X)', 'Shared Lock (S)', 'Intent Lock (IX)', 'Two-Phase Lock'],
          correctOptionIndex: 1,
          marks: 5,
          negativeMarks: 1,
          explanation: 'Shared locks allow multiple concurrent reads without write mutation.'
        },
        {
          id: 'q4',
          questionText: 'In ACID properties of a DBMS, which property ensures transactions survive system crashes?',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
          correctOptionIndex: 3,
          marks: 5,
          negativeMarks: 1,
          explanation: 'Durability ensures committed transactions are permanently recorded even in hardware failure.'
        }
      ]
    }
  ];

  public static getInstance(): LMSCourseService {
    if (!LMSCourseService.instance) {
      LMSCourseService.instance = new LMSCourseService();
    }
    return LMSCourseService.instance;
  }

  public getCourseSyllabusSummary(courseCode: string = 'CS401'): CourseSyllabusSummary {
    const subjects: Subject[] = db.getSubjects() || [];
    const normalizedInput = courseCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const subject = subjects.find(s => 
      s.code.toLowerCase() === courseCode.toLowerCase() || 
      s.code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normalizedInput
    ) || subjects[0];
    const sessionTopics: SessionPlanTopic[] = db.getSessionPlanTopics?.() || [];

    const units: SyllabusUnitProgress[] = [
      {
        unitId: 'unit-1',
        unitNumber: 1,
        unitTitle: 'Relational Model & Relational Algebra',
        totalPlannedHours: 10,
        completedHours: 10,
        completionPercentage: 100,
        topicsCount: 5,
        completedTopicsCount: 5,
        learningOutcomes: ['Understand entity-relationship modeling', 'Translate ER models to tables']
      },
      {
        unitId: 'unit-2',
        unitNumber: 2,
        unitTitle: 'SQL Query Optimization & Indexes',
        totalPlannedHours: 12,
        completedHours: 10,
        completionPercentage: 83,
        topicsCount: 6,
        completedTopicsCount: 5,
        learningOutcomes: ['Write complex SQL joins', 'Build B-Tree indexes']
      },
      {
        unitId: 'unit-3',
        unitNumber: 3,
        unitTitle: 'Normalization & Functional Dependencies',
        totalPlannedHours: 12,
        completedHours: 8,
        completionPercentage: 67,
        topicsCount: 6,
        completedTopicsCount: 4,
        learningOutcomes: ['Eliminate anomalies with BCNF', 'Apply lossless join decomposition']
      },
      {
        unitId: 'unit-4',
        unitNumber: 4,
        unitTitle: 'Transaction Processing & Concurrency Control',
        totalPlannedHours: 10,
        completedHours: 4,
        completionPercentage: 40,
        topicsCount: 5,
        completedTopicsCount: 2,
        learningOutcomes: ['Analyze ACID properties', 'Implement 2-Phase Locking']
      }
    ];

    const totalHours = units.reduce((sum, u) => sum + u.totalPlannedHours, 0);
    const doneHours = units.reduce((sum, u) => sum + u.completedHours, 0);
    const overallPct = totalHours > 0 ? Math.round((doneHours / totalHours) * 100) : 0;

    return {
      courseId: subject?.id || 'subj-cs401',
      courseCode: subject?.code || 'CS401',
      courseName: subject?.name || 'Database Management Systems',
      semester: (subject as any)?.semester || (subject?.semesterId ? parseInt(subject.semesterId, 10) : 4),
      facultyName: 'Dr. Ramesh Sharma',
      totalUnits: units.length,
      overallCompletionPercentage: overallPct,
      units
    };
  }

  public getStudyResources(courseCode: string = 'CS401'): StudyResourceItem[] {
    return [
      {
        resourceId: 'res-01',
        subjectCode: courseCode,
        title: 'Unit 1: ER Modeling & Relational Schema Handout',
        resourceType: 'PDF_NOTES',
        fileSizeBytes: 2450000,
        uploadDate: '2026-01-15',
        authorName: 'Prof. Ramesh Sharma',
        safeUrl: `https://lms.ssiu.edu.in/resources/${courseCode.toLowerCase()}/unit1_er_model.pdf`
      },
      {
        resourceId: 'res-02',
        subjectCode: courseCode,
        title: 'Unit 2: SQL Optimization Lecture Slide Deck',
        resourceType: 'SLIDE_DECK',
        fileSizeBytes: 4800000,
        uploadDate: '2026-01-28',
        authorName: 'Prof. Ramesh Sharma',
        safeUrl: `https://lms.ssiu.edu.in/resources/${courseCode.toLowerCase()}/unit2_sql_slides.pdf`
      },
      {
        resourceId: 'res-03',
        subjectCode: courseCode,
        title: 'Unit 3: BCNF & 3NF Decomposition Interactive Lab Walkthrough',
        resourceType: 'CODE_LAB',
        fileSizeBytes: 120000,
        uploadDate: '2026-02-10',
        authorName: 'Prof. Ramesh Sharma',
        safeUrl: `https://lms.ssiu.edu.in/resources/${courseCode.toLowerCase()}/normalization_lab`
      }
    ];
  }

  /**
   * CRITICAL SECURITY METHOD:
   * Sanitizes question payload for student test taking.
   * Strips correctOptionIndex and answer explanations.
   */
  public getStudentQuizPayload(quizId: string): {
    quizId: string;
    courseCode: string;
    title: string;
    durationMinutes: number;
    totalMarks: number;
    questions: StudentMaskedQuestionItem[];
  } | null {
    const quiz = LMSCourseService.mockQuizzes.find(q => q.quizId === quizId) || LMSCourseService.mockQuizzes[0];
    if (!quiz) return null;

    const sanitizedQuestions: StudentMaskedQuestionItem[] = quiz.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: [...q.options],
      marks: q.marks,
      negativeMarks: q.negativeMarks
    }));

    return {
      quizId: quiz.quizId,
      courseCode: quiz.courseCode,
      title: quiz.title,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      questions: sanitizedQuestions
    };
  }

  /**
   * Server-side/Service-side evaluation with negative marking.
   */
  public evaluateQuizAttempt(submission: StudentQuizSubmission): QuizEvaluationResult {
    const quiz = LMSCourseService.mockQuizzes.find(q => q.quizId === submission.quizId) || LMSCourseService.mockQuizzes[0];
    const questionBreakdown: {
      questionId: string;
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
      marksAwarded: number;
    }[] = [];

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    quiz.questions.forEach(q => {
      const answer = submission.submittedAnswers.find(a => a.questionId === q.id);
      if (!answer || answer.selectedOptionIndex === -1) {
        // Unattempted
        questionBreakdown.push({
          questionId: q.id,
          selectedOption: -1,
          correctOption: q.correctOptionIndex,
          isCorrect: false,
          marksAwarded: 0
        });
      } else if (answer.selectedOptionIndex === q.correctOptionIndex) {
        // Correct
        correctCount++;
        totalScore += q.marks;
        questionBreakdown.push({
          questionId: q.id,
          selectedOption: answer.selectedOptionIndex,
          correctOption: q.correctOptionIndex,
          isCorrect: true,
          marksAwarded: q.marks
        });
      } else {
        // Incorrect
        incorrectCount++;
        const penalty = quiz.negativeMarkingEnabled ? q.negativeMarks : 0;
        totalScore -= penalty;
        questionBreakdown.push({
          questionId: q.id,
          selectedOption: answer.selectedOptionIndex,
          correctOption: q.correctOptionIndex,
          isCorrect: false,
          marksAwarded: -penalty
        });
      }
    });

    const finalScore = Math.max(0, totalScore);
    const percentage = quiz.totalMarks > 0 ? Math.round((finalScore / quiz.totalMarks) * 100) : 0;
    const hasPassed = percentage >= quiz.passingPercentage;

    return {
      attemptId: `att-${Date.now()}`,
      quizId: quiz.quizId,
      studentId: submission.studentId,
      totalQuestions: quiz.questions.length,
      attemptedQuestions: submission.submittedAnswers.filter(a => a.selectedOptionIndex !== -1).length,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unattemptedCount: quiz.questions.length - (correctCount + incorrectCount),
      totalMarksScored: finalScore,
      maxMarks: quiz.totalMarks,
      percentage,
      hasPassed,
      evaluatedAt: new Date().toISOString(),
      questionBreakdown
    };
  }
}

export const lmsCourseService = LMSCourseService.getInstance();
