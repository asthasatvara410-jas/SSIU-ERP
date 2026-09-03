import { describe, it, expect } from 'vitest';
import { lmsCourseService } from '../services/lmsCourseService';

describe('LMS & Digital Course Hub', () => {
  it('should return valid syllabus progress and unit hours breakdown for courses', () => {
    const syllabus = lmsCourseService.getCourseSyllabusSummary('CSE-401');
    expect(syllabus).toBeDefined();
    expect(syllabus.courseCode).toBe('CSE-401');
    expect(syllabus.units.length).toBeGreaterThan(0);
    expect(syllabus.overallCompletionPercentage).toBeGreaterThanOrEqual(0);
    expect(syllabus.overallCompletionPercentage).toBeLessThanOrEqual(100);

    const firstUnit = syllabus.units[0];
    expect(firstUnit).toHaveProperty('unitId');
    expect(firstUnit).toHaveProperty('unitTitle');
    expect(firstUnit.learningOutcomes.length).toBeGreaterThan(0);
  });

  it('should return authorized study material items with safe download URLs', () => {
    const resources = lmsCourseService.getStudyResources('CS401');
    expect(resources).toBeDefined();
    expect(resources.length).toBeGreaterThan(0);

    const firstResource = resources[0];
    expect(firstResource).toHaveProperty('resourceId');
    expect(firstResource).toHaveProperty('safeUrl');
    expect(firstResource.safeUrl.startsWith('https://')).toBe(true);
  });

  it('SECURITY CRITICAL: should mask correctOptionIndex and explanations from student quiz payloads', () => {
    const studentPayload = lmsCourseService.getStudentQuizPayload('quiz-cs401-mid');
    expect(studentPayload).toBeDefined();
    expect(studentPayload?.questions.length).toBeGreaterThan(0);

    studentPayload?.questions.forEach(q => {
      // Ensure correctOptionIndex is NOT exposed to client
      expect((q as any).correctOptionIndex).toBeUndefined();
      // Ensure answer explanation is NOT exposed in student test payload
      expect((q as any).explanation).toBeUndefined();
      // Ensure question text and options exist
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.marks).toBeGreaterThan(0);
    });
  });

  it('should deterministically evaluate quiz answers and apply negative marking penalty for incorrect responses', () => {
    // 4 questions total (5 marks each, -1 penalty for incorrect)
    // q1 correct (opt 1), q2 correct (opt 2), q3 incorrect (opt 0 instead of 1), q4 unattempted (-1)
    const submission = {
      quizId: 'quiz-cs401-mid',
      studentId: 'stud-001',
      timeTakenSeconds: 300,
      submittedAnswers: [
        { questionId: 'q1', selectedOptionIndex: 1 }, // +5
        { questionId: 'q2', selectedOptionIndex: 2 }, // +5
        { questionId: 'q3', selectedOptionIndex: 0 }, // -1
        { questionId: 'q4', selectedOptionIndex: -1 } // 0
      ]
    };

    const result = lmsCourseService.evaluateQuizAttempt(submission);
    expect(result).toBeDefined();
    expect(result.correctAnswersCount).toBe(2);
    expect(result.incorrectAnswersCount).toBe(1);
    expect(result.unattemptedCount).toBe(1);
    // Score: 5 + 5 - 1 = 9
    expect(result.totalMarksScored).toBe(9);
    expect(result.maxMarks).toBe(20);
    expect(result.percentage).toBe(45);
    expect(result.hasPassed).toBe(true); // >= 40% passing threshold
  });
});
