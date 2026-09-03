import { db } from './db';
import { FeeQuery, FeeQueryCategory, FeeQueryTimelineItem, ExamFeeConfigItem } from '../types/feeQuery';
import { User, UserRole, Student, StudentFeeRecord, FeePaymentTransaction } from '../types';

export class FeeQueryServiceEngine {
  private static instance: FeeQueryServiceEngine;

  private constructor() {}

  public static getInstance(): FeeQueryServiceEngine {
    if (!FeeQueryServiceEngine.instance) {
      FeeQueryServiceEngine.instance = new FeeQueryServiceEngine();
    }
    return FeeQueryServiceEngine.instance;
  }

  // ============================================================================
  // 1. STUDENT FEE QUERY SUBMISSION (DIRECT TO ACCOUNTS)
  // ============================================================================

  public createFeeQuery(
    params: {
      category: FeeQueryCategory;
      subject: string;
      description: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      claimedAmount?: number;
      transactionReferenceNo?: string;
      attachmentUrl?: string;
      studentFeeRecordId?: string;
      paymentTransactionId?: string;
    },
    user: User
  ): FeeQuery {
    const student = db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo) || {
      id: user.id,
      name: user.name,
      enrollmentNo: user.enrollmentNo || 'ENR-STUDENT',
      email: user.email,
      phone: user.phone || '9876543210',
      departmentId: user.departmentId || 'dept-cse',
      programId: 'prog-btech-cse'
    };

    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const deptObj = departments.find(d => d.id === student.departmentId);
    const progObj = programs.find(p => p.id === student.programId);

    const now = new Date().toISOString();
    const count = (db.getState().feeQueries || []).length + 1;
    const queryNo = `FQ/${new Date().getFullYear()}/${String(count).padStart(6, '0')}`;

    const timeline: FeeQueryTimelineItem[] = [
      {
        id: `tl-${Date.now()}-1`,
        action: 'QUERY_SUBMITTED',
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserRole: 'STUDENT',
        toUserId: 'ACCOUNTS_DESK',
        toUserName: 'Accounts Office Directorate',
        toUserRole: 'ACCOUNTS_ADMIN',
        timestamp: now,
        remarks: `Student submitted fee query regarding ${params.category.replace(/_/g, ' ')}. Priority: ${params.priority || 'MEDIUM'}.`,
        status: 'SUBMITTED'
      }
    ];

    const newQuery: FeeQuery = {
      id: `fq-${Date.now()}`,
      queryNo,
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      email: student.email,
      phone: student.phone,
      departmentId: student.departmentId || '',
      departmentName: deptObj?.name || 'Department of Computer Science & Engineering',
      programId: student.programId,
      programName: progObj?.name || 'B.Tech Computer Science & Engineering',
      category: params.category,
      subject: params.subject.trim(),
      description: params.description.trim(),
      priority: params.priority || 'MEDIUM',
      attachmentUrl: params.attachmentUrl,
      studentFeeRecordId: params.studentFeeRecordId,
      paymentTransactionId: params.paymentTransactionId,
      claimedAmount: params.claimedAmount,
      transactionReferenceNo: params.transactionReferenceNo,
      status: 'SUBMITTED',
      timeline,
      createdAt: now,
      updatedAt: now
    };

    db.updateState(state => {
      state.feeQueries = [newQuery, ...(state.feeQueries || [])];
    }, `Created Fee Query: ${queryNo}`);

    // Direct Notification to Accounts Staff (Section 7 rule: Route directly to Accounts)
    db.addNotification({
      title: `New Fee Query: ${queryNo}`,
      message: `Student ${student.name} submitted query on "${params.subject}" (${params.category.replace(/_/g, ' ')}). Assigned to Accounts.`,
      module: 'FEES',
      timestamp: now,
      targetRole: 'ACCOUNTS_ADMIN',
      linkTab: 'accounts-admin'
    });

    return newQuery;
  }

  // ============================================================================
  // 2. ACCOUNTS REVIEW & RESOLUTION
  // ============================================================================

  public resolveFeeQuery(
    queryId: string,
    params: {
      resolutionSummary: string;
      resolutionRemarks?: string;
      action?: 'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW';
      adjustmentAmount?: number;
      adjustStudentRecordId?: string;
      adjustmentType?: 'CREDIT_PAYMENT' | 'CONCESSION' | 'REFUND' | 'WAIVE_LATE_FEE';
    },
    accountsUser: User
  ): FeeQuery {
    const query = this.getQueryById(queryId);
    if (!query) throw new Error('Fee query record not found.');

    const now = new Date().toISOString();
    const action = params.action || 'RESOLVED';

    query.status = action;
    query.assignedAccountsHandlerId = accountsUser.id;
    query.assignedAccountsHandlerName = accountsUser.name;
    query.resolutionSummary = params.resolutionSummary.trim();
    query.resolutionRemarks = params.resolutionRemarks?.trim() || params.resolutionSummary.trim();
    if (action === 'RESOLVED') {
      query.resolvedAt = now;
    }
    query.updatedAt = now;

    // ── FINANCIAL LEDGER ADJUSTMENT (IF AUTHORIZED BY FINANCE) ──
    if (action === 'RESOLVED' && params.adjustmentAmount && params.adjustmentAmount > 0) {
      const targetRecordId = params.adjustStudentRecordId || query.studentFeeRecordId;
      if (targetRecordId) {
        const feeRecord = db.getStudentFeeRecords().find(r => r.id === targetRecordId);
        if (feeRecord) {
          const adj = params.adjustmentAmount;
          const adjType = params.adjustmentType || 'CREDIT_PAYMENT';

          if (adjType === 'CREDIT_PAYMENT' || adjType === 'CONCESSION') {
            const newPaid = (feeRecord.paidAmount || 0) + adj;
            const newPending = Math.max(0, (feeRecord.totalAmount || 0) - newPaid);
            const newStatus = newPending === 0 ? 'PAID' : 'PARTIAL';

            db.updateEntity<StudentFeeRecord>('studentFeeRecords', feeRecord.id, {
              paidAmount: newPaid,
              pendingAmount: newPending,
              status: newStatus as any
            }, `Finance adjustment applied for Query ${query.queryNo}: +₹${adj}`);

            // Add official transaction record
            const txId = `tx-adj-${Date.now()}`;
            const receiptNo = `REC-ADJ-${Date.now().toString().slice(-6)}`;
            const adjTx: FeePaymentTransaction = {
              id: txId,
              studentFeeRecordId: feeRecord.id,
              studentId: query.studentId,
              studentName: query.studentName,
              enrollmentNo: query.enrollmentNo,
              programId: query.programId || 'prog-1',
              semesterId: feeRecord.semesterId,
              semesterName: feeRecord.semesterName,
              academicYear: feeRecord.academicYearCode || '2026-2027',
              feeType: 'TUITION',
              paidAmount: adj,
              paymentMode: 'Bank Transfer / NEFT' as any,
              transactionId: `UTR-ADJ-${Date.now()}`,
              referenceNo: query.queryNo,
              referenceDate: now.split('T')[0],
              bankName: 'University Accounts Adjustment',
              gatewayName: 'FINANCE_DIRECT',
              paymentDate: now.split('T')[0],
              receiptNo: receiptNo,
              status: 'SUCCESS',
              remarks: `Financial adjustment for Query ${query.queryNo}: ${params.resolutionSummary}`,
              recordedBy: accountsUser.name
            };

            db.addEntity<FeePaymentTransaction>('feePaymentTransactions', adjTx, `Transaction generated from query resolution ${query.queryNo}`);

            // Log Central Audit
            db.logAudit(
              'FINANCIAL_CORRECTION_APPLIED',
              'StudentFeeRecord',
              `Finance officer ${accountsUser.name} applied ₹${adj} adjustment to ${query.studentName} (${query.enrollmentNo}). Receipt: ${receiptNo}.`,
              accountsUser.name,
              accountsUser.role,
              { recordId: feeRecord.id, module: 'FINANCE_FEES' }
            );
          } else if (adjType === 'REFUND') {
            const newRefund = (feeRecord.refundedAmount || 0) + adj;
            db.updateEntity<StudentFeeRecord>('studentFeeRecords', feeRecord.id, {
              refundedAmount: newRefund
            }, `Refund processed for Query ${query.queryNo}: ₹${adj}`);

            db.logAudit(
              'FINANCIAL_REFUND_PROCESSED',
              'StudentFeeRecord',
              `Refund of ₹${adj} processed for ${query.studentName} (${query.enrollmentNo}) on Query ${query.queryNo}.`,
              accountsUser.name,
              accountsUser.role,
              { recordId: feeRecord.id, module: 'FINANCE_FEES' }
            );
          }
        }
      }
    }

    query.timeline.push({
      id: `tl-${Date.now()}`,
      action: `QUERY_${action}`,
      fromUserId: accountsUser.id,
      fromUserName: accountsUser.name,
      fromUserRole: accountsUser.role || 'ACCOUNTS_ADMIN',
      toUserId: query.studentId,
      toUserName: query.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: params.resolutionRemarks?.trim() || params.resolutionSummary.trim(),
      status: action
    });

    this.saveQuery(query);

    // Notify Student
    db.addNotification({
      title: `Fee Query ${action === 'RESOLVED' ? 'Resolved' : 'Updated'}: ${query.queryNo}`,
      message: `Accounts officer ${accountsUser.name} responded to "${query.subject}": "${params.resolutionSummary}".`,
      module: 'FEES',
      timestamp: now,
      targetUserId: query.studentId,
      linkTab: 'fees'
    });

    return query;
  }

  // ============================================================================
  // 3. EXAM FEE CATEGORY CONFIGURATION
  // ============================================================================

  public getExamFeeConfigs(): ExamFeeConfigItem[] {
    return db.getState().examFeeConfigs || [];
  }

  public saveExamFeeConfig(config: ExamFeeConfigItem): void {
    db.updateState(state => {
      const configs = [...(state.examFeeConfigs || [])];
      const idx = configs.findIndex(c => c.id === config.id || c.category === config.category);
      if (idx >= 0) {
        configs[idx] = config;
      } else {
        configs.push(config);
      }
      state.examFeeConfigs = configs;
    }, `Updated Exam Fee Config: ${config.name}`);
  }

  // ============================================================================
  // 4. SCOPED ACCESS CONTROL
  // ============================================================================

  public getScopedQueries(user?: User | null, role?: UserRole | null): FeeQuery[] {
    const all = db.getState().feeQueries || [];
    if (!user) return [];

    if (role === 'STUDENT') {
      return all.filter((q: FeeQuery) => q.studentId === user.id || q.enrollmentNo === user.enrollmentNo || q.email === user.email);
    }

    if (role === 'ACCOUNTS_ADMIN' || role === 'SUPER_ADMIN' || role === 'REGISTRAR' || role === 'PRINCIPAL') {
      return all;
    }

    if (role === 'HOD') {
      return all.filter((q: FeeQuery) => q.departmentId === user.departmentId);
    }

    return [];
  }

  public getQueryById(id: string): FeeQuery | undefined {
    return (db.getState().feeQueries || []).find((q: FeeQuery) => q.id === id);
  }

  private saveQuery(query: FeeQuery): void {
    db.updateState(state => {
      const queries = [...(state.feeQueries || [])];
      const index = queries.findIndex(q => q.id === query.id);
      if (index >= 0) {
        queries[index] = query;
      } else {
        queries.unshift(query);
      }
      state.feeQueries = queries;
    }, `Updated Fee Query ${query.queryNo}`);
  }
}

export const feeQueryService = FeeQueryServiceEngine.getInstance();
