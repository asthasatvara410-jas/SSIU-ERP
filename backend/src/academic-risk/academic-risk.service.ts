import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Academic Risk Prediction Engine
 * 
 * DISCLAIMER: This is a rule-based heuristic scoring system. It is NOT a medically
 * or scientifically validated AI/ML prediction model. It uses transparent, deterministic
 * scoring derived from existing ERP academic data (attendance, assignments, examinations,
 * engagement metrics) to provide early warning indicators for academic support teams.
 * 
 * Scoring Weights:
 *   Attendance      → 35%
 *   Assignments     → 25%
 *   Examinations    → 25%
 *   Engagement      → 15%
 * 
 * Risk Levels:
 *   0–30  → LOW
 *   31–60 → MEDIUM
 *   61–80 → HIGH
 *   81–100 → CRITICAL
 */
@Injectable()
export class AcademicRiskService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Weight Constants ─────────────────────────────────────────────────────
  private readonly WEIGHTS = {
    attendance: 0.35,
    assignment: 0.25,
    examination: 0.25,
    engagement: 0.15,
  };

  // ─── Risk Level Thresholds ────────────────────────────────────────────────
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  }

  // ─── Generate Human-Readable Reason ───────────────────────────────────────
  private generateReason(scores: {
    attendance: number;
    assignment: number;
    examination: number;
    engagement: number;
  }): string {
    const reasons: string[] = [];

    if (scores.attendance >= 70)
      reasons.push('Critically low class attendance (below 50%)');
    else if (scores.attendance >= 40)
      reasons.push('Below-average attendance — approaching minimum threshold');

    if (scores.assignment >= 70)
      reasons.push('Very low assignment submission/completion rate');
    else if (scores.assignment >= 40)
      reasons.push('Several assignments missing or scored below average');

    if (scores.examination >= 70)
      reasons.push('Exam performance significantly below passing threshold');
    else if (scores.examination >= 40)
      reasons.push('Mid-term/exam marks trending below class average');

    if (scores.engagement >= 70)
      reasons.push('Minimal portal engagement or academic interaction');
    else if (scores.engagement >= 40)
      reasons.push('Reduced academic engagement compared to peers');

    if (reasons.length === 0) {
      reasons.push('Student is performing within acceptable academic parameters');
    }

    return reasons.join('. ') + '.';
  }

  // ─── Generate Recommended Action ──────────────────────────────────────────
  private generateRecommendedAction(
    riskLevel: string,
    scores: {
      attendance: number;
      assignment: number;
      examination: number;
      engagement: number;
    },
  ): string {
    const actions: string[] = [];

    if (riskLevel === 'CRITICAL') {
      actions.push(
        'URGENT: Schedule immediate meeting with student and guardian/parent',
        'Assign dedicated academic mentor for daily follow-up',
        'Consider remedial classes and additional tutorial support',
      );
    } else if (riskLevel === 'HIGH') {
      actions.push(
        'Schedule one-on-one counseling session with mentor within 1 week',
        'Monitor attendance and assignment submissions closely',
      );
    } else if (riskLevel === 'MEDIUM') {
      actions.push(
        'Send advisory notification to student and mentor',
        'Review study patterns in next mentor meeting',
      );
    } else {
      actions.push(
        'No immediate intervention required',
        'Continue regular academic monitoring',
      );
    }

    // Add specific actions based on component scores
    if (scores.attendance >= 60)
      actions.push('Focus on improving class attendance — consider attendance counseling');
    if (scores.assignment >= 60)
      actions.push('Ensure assignment submission deadlines are met — provide deadline reminders');
    if (scores.examination >= 60)
      actions.push('Arrange extra tutorial/revision sessions before next examination');
    if (scores.engagement >= 60)
      actions.push('Encourage participation in academic activities and portal usage');

    return actions.join('. ') + '.';
  }

  // ─── Core: Calculate Risk for a Single Student ────────────────────────────
  async calculateStudentRisk(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        batch: true,
        department: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // Find current academic year
    const currentAY = await this.prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });
    if (!currentAY) {
      throw new NotFoundException('No active academic year found');
    }

    // Find current semester for the student's batch
    const currentSemester = await this.prisma.semester.findFirst({
      where: {
        batchId: student.batchId,
        status: 'ACTIVE',
      },
      orderBy: { semesterNumber: 'desc' },
    });
    if (!currentSemester) {
      throw new NotFoundException('No active semester found for student batch');
    }

    // ── 1. Attendance Score (inverted: higher risk score = worse attendance) ──
    let attendanceRiskScore = 25; // default moderate if no data
    try {
      // Count exam attendance as proxy (since there's no separate class attendance table)
      const examAttendances = await this.prisma.examAttendance.findMany({
        where: { studentId },
      });
      if (examAttendances.length > 0) {
        const presentCount = examAttendances.filter(
          (a) => a.status === 'PRESENT',
        ).length;
        const attendancePercentage =
          (presentCount / examAttendances.length) * 100;
        // Invert: 100% attendance → 0 risk, 0% attendance → 100 risk
        attendanceRiskScore = Math.max(0, Math.min(100, 100 - attendancePercentage));
      }
    } catch {
      // Fallback to default
    }

    // ── 2. Assignment Score ─────────────────────────────────────────────────
    let assignmentRiskScore = 25;
    // No direct assignment submission table in Prisma; use exam form submission rate as proxy
    try {
      const examForms = await this.prisma.examForm.findMany({
        where: { studentId },
      });
      if (examForms.length > 0) {
        const submittedCount = examForms.filter(
          (f) => f.status !== 'DRAFT' && f.status !== 'CANCELLED',
        ).length;
        const submissionRate = (submittedCount / examForms.length) * 100;
        assignmentRiskScore = Math.max(0, Math.min(100, 100 - submissionRate));
      }
    } catch {
      // Fallback
    }

    // ── 3. Examination Score ────────────────────────────────────────────────
    let examinationRiskScore = 25;
    try {
      const results = await this.prisma.examResult.findMany({
        where: { studentId },
      });
      if (results.length > 0) {
        const validResults = results.filter(
          (r) => r.marksObtained !== null && !r.isAbsent,
        );
        if (validResults.length > 0) {
          const avgPercentage =
            validResults.reduce((sum, r) => {
              const obtained = Number(r.marksObtained || 0);
              const max = Number(r.maxMarks || 100);
              return sum + (max > 0 ? (obtained / max) * 100 : 0);
            }, 0) / validResults.length;
          examinationRiskScore = Math.max(0, Math.min(100, 100 - avgPercentage));
        }
      }
    } catch {
      // Fallback
    }

    // ── 4. Engagement Score ─────────────────────────────────────────────────
    let engagementRiskScore = 20;
    try {
      // Check user login recency as engagement proxy
      const user = await this.prisma.user.findFirst({
        where: { studentId },
      });
      if (user?.lastLoginAt) {
        const daysSinceLogin = Math.floor(
          (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceLogin <= 1) engagementRiskScore = 5;
        else if (daysSinceLogin <= 7) engagementRiskScore = 15;
        else if (daysSinceLogin <= 14) engagementRiskScore = 35;
        else if (daysSinceLogin <= 30) engagementRiskScore = 55;
        else engagementRiskScore = 80;
      }
    } catch {
      // Fallback
    }

    // ── Composite Risk Score ────────────────────────────────────────────────
    const compositeScore = Math.round(
      attendanceRiskScore * this.WEIGHTS.attendance +
        assignmentRiskScore * this.WEIGHTS.assignment +
        examinationRiskScore * this.WEIGHTS.examination +
        engagementRiskScore * this.WEIGHTS.engagement,
    );
    const finalScore = Math.max(0, Math.min(100, compositeScore));
    const riskLevel = this.getRiskLevel(finalScore);

    const scores = {
      attendance: attendanceRiskScore,
      assignment: assignmentRiskScore,
      examination: examinationRiskScore,
      engagement: engagementRiskScore,
    };

    const reason = this.generateReason(scores);
    const action = this.generateRecommendedAction(riskLevel, scores);

    // Upsert the risk record
    const risk = await this.prisma.academicRisk.upsert({
      where: {
        studentId_academicYearId_semesterId: {
          studentId,
          academicYearId: currentAY.id,
          semesterId: currentSemester.id,
        },
      },
      update: {
        attendanceScore: attendanceRiskScore,
        assignmentScore: assignmentRiskScore,
        examinationScore: examinationRiskScore,
        engagementScore: engagementRiskScore,
        riskScore: finalScore,
        riskLevel,
        predictionReason: reason,
        recommendedAction: action,
        lastCalculatedAt: new Date(),
      },
      create: {
        studentId,
        academicYearId: currentAY.id,
        semesterId: currentSemester.id,
        attendanceScore: attendanceRiskScore,
        assignmentScore: assignmentRiskScore,
        examinationScore: examinationRiskScore,
        engagementScore: engagementRiskScore,
        riskScore: finalScore,
        riskLevel,
        predictionReason: reason,
        recommendedAction: action,
        lastCalculatedAt: new Date(),
      },
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } } },
        },
      },
    });

    return risk;
  }

  // ─── Batch Recalculate All Active Students ────────────────────────────────
  async recalculateAll() {
    const activeStudents = await this.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const results = { total: activeStudents.length, processed: 0, errors: 0 };

    for (const student of activeStudents) {
      try {
        await this.calculateStudentRisk(student.id);
        results.processed++;
      } catch {
        results.errors++;
      }
    }

    return {
      message: `Risk recalculation completed for ${results.processed}/${results.total} students`,
      ...results,
    };
  }

  // ─── Dashboard KPIs ──────────────────────────────────────────────────────
  async getDashboard(user: any) {
    const where = this.buildScopeFilter(user);

    const risks = await this.prisma.academicRisk.findMany({
      where,
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } } },
        },
      },
      orderBy: { riskScore: 'desc' },
    });

    const totalStudents = await this.prisma.student.count({
      where: { status: 'ACTIVE' },
    });

    const low = risks.filter((r) => r.riskLevel === 'LOW').length;
    const medium = risks.filter((r) => r.riskLevel === 'MEDIUM').length;
    const high = risks.filter((r) => r.riskLevel === 'HIGH').length;
    const critical = risks.filter((r) => r.riskLevel === 'CRITICAL').length;

    const avgScore = risks.length > 0
      ? Math.round(risks.reduce((s, r) => s + r.riskScore, 0) / risks.length)
      : 0;

    return {
      totalStudents,
      assessedStudents: risks.length,
      distribution: { low, medium, high, critical },
      averageRiskScore: avgScore,
      topRiskStudents: risks.slice(0, 10),
    };
  }

  // ─── Student List with Filters ────────────────────────────────────────────
  async getStudents(user: any, query: any) {
    const where: any = this.buildScopeFilter(user);

    // Apply filters from query
    if (query.riskLevel) {
      where.riskLevel = query.riskLevel;
    }
    if (query.departmentId) {
      where.student = { ...where.student, departmentId: query.departmentId };
    }
    if (query.search) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { enrollmentNo: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const risks = await this.prisma.academicRisk.findMany({
      where,
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } } },
        },
        academicYear: true,
        semester: true,
      },
      orderBy: { riskScore: 'desc' },
    });

    return risks;
  }

  // ─── Single Student Risk Detail ───────────────────────────────────────────
  async getStudentRisk(studentId: string) {
    const risks = await this.prisma.academicRisk.findMany({
      where: { studentId },
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } } },
        },
        academicYear: true,
        semester: true,
      },
      orderBy: { lastCalculatedAt: 'desc' },
    });

    if (risks.length === 0) {
      throw new NotFoundException(`No risk assessment found for student ${studentId}`);
    }

    return {
      current: risks[0],
      history: risks,
    };
  }

  // ─── Alerts: HIGH + CRITICAL Only ─────────────────────────────────────────
  async getAlerts(user: any) {
    const where: any = {
      ...this.buildScopeFilter(user),
      riskLevel: { in: ['HIGH', 'CRITICAL'] },
    };

    const alerts = await this.prisma.academicRisk.findMany({
      where,
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } } },
        },
      },
      orderBy: { riskScore: 'desc' },
    });

    return {
      totalAlerts: alerts.length,
      critical: alerts.filter((a) => a.riskLevel === 'CRITICAL'),
      high: alerts.filter((a) => a.riskLevel === 'HIGH'),
    };
  }

  // ─── RBAC Scope Filter Builder ────────────────────────────────────────────
  private buildScopeFilter(user: any): any {
    const role = user?.role || user?.roles?.[0] || 'STUDENT';
    const filter: any = {};

    if (role === 'HOD' && user?.departmentId) {
      filter.student = { departmentId: user.departmentId };
    } else if (role === 'FACULTY' && user?.id) {
      // Faculty sees students they mentor/teach — simplified to department scope
      if (user.departmentId) {
        filter.student = { departmentId: user.departmentId };
      }
    } else if (role === 'PRINCIPAL' && user?.instituteId) {
      filter.student = { instituteId: user.instituteId };
    }
    // SUPER_ADMIN, UNIVERSITY_ADMIN, REGISTRAR → no filter (see all)

    return filter;
  }
}
