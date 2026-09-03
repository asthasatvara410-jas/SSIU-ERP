import { describe, it, expect } from 'vitest';
import { feedbackService } from '../services/feedbackService';
import { db } from '../services/db';

describe('Student Feedback & Teaching Evaluation Management System', () => {
  it('calculates 5 dynamic KPI summary values from institutional feedback data', () => {
    const stats = feedbackService.getAdminDashboardStats();
    expect(stats.totalFeedbacks).toBeGreaterThanOrEqual(1);
    expect(stats.avgFacultyRating).toBeGreaterThanOrEqual(1);
    expect(stats.avgFacultyRating).toBeLessThanOrEqual(5);
    expect(stats.avgSubjectRating).toBeGreaterThanOrEqual(1);
    expect(stats.avgSubjectRating).toBeLessThanOrEqual(5);
    expect(stats.avgMentorRating).toBeGreaterThanOrEqual(1);
    expect(stats.avgMentorRating).toBeLessThanOrEqual(5);
    expect(stats.totalSuggestions).toBeGreaterThanOrEqual(1);
  });

  it('aggregates faculty teaching evaluations with 5 explicit core metrics', () => {
    const summary = feedbackService.getFacultyFeedbackSummary('fac-1');
    expect(summary).toBeDefined();
    expect(summary.facultyName).toBeTruthy();
    expect(summary.teachingClarityAvg).toBeGreaterThanOrEqual(1);
    expect(summary.communicationAvg).toBeGreaterThanOrEqual(1);
    expect(summary.subjectKnowledgeAvg).toBeGreaterThanOrEqual(1);
    expect(summary.doubtResolutionAvg).toBeGreaterThanOrEqual(1);
    expect(summary.studentEngagementAvg).toBeGreaterThanOrEqual(1);
    expect(summary.overallAverageRating).toBeGreaterThanOrEqual(1);
  });

  it('submits new student feedback with 5 star ratings and creates audit log', () => {
    const feedback = feedbackService.submitFeedback({
      category: 'FACULTY',
      facultyId: 'fac-1',
      subjectId: 'subj-1',
      teachingClarity: 5,
      communication: 4,
      subjectKnowledge: 5,
      doubtResolution: 5,
      studentEngagement: 4,
      positiveFeedback: 'Clear explanations and interactive lab work.',
      improvementSuggestion: 'Share more practice problems.',
      isAnonymous: true
    }, {
      id: 'stud-test-999',
      name: 'Test Student',
      enrollmentNo: '230101999',
      email: 'test999@swarrnim.edu.in',
      role: 'STUDENT'
    } as any);

    expect(feedback.feedbackNo).toMatch(/^FDB\/2026\/\d+$/);
    expect(feedback.teachingClarity).toBe(5);
    expect(feedback.communication).toBe(4);
    expect(feedback.overallRating).toBe(4.6);
    expect(feedback.isAnonymous).toBe(true);

    const logs = feedbackService.getAuditLogs(feedback.feedbackNo);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].action).toBe('FEEDBACK_SUBMITTED');
  });

  it('handles suggestion routing and status lifecycle transitions', () => {
    const suggestion = feedbackService.submitSuggestion({
      category: 'TEACHING',
      title: 'AI Lab GPU Server Request',
      description: 'Request additional compute resources for machine learning practicals.',
      priority: 'HIGH'
    }, {
      id: 'stud-test-999',
      name: 'Test Student',
      enrollmentNo: '230101999',
      email: 'test999@swarrnim.edu.in',
      role: 'STUDENT'
    } as any);

    expect(suggestion.suggestionNo).toMatch(/^SUG\/2026\/\d+$/);
    expect(suggestion.status).toBe('SUBMITTED');

    const updated = feedbackService.updateSuggestionStatus(suggestion.id, {
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedDepartment: 'Department of Computer Science & Engineering',
      adminResponse: 'Proposal approved by IQAC',
      actionTaken: 'MOU initiated'
    });

    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.adminResponse).toBe('Proposal approved by IQAC');
  });
});
