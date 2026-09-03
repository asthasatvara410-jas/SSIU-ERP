// ==============================================================================
// SWARRNIM STARTUP & INNOVATION UNIVERSITY — STUDENT ONBOARDING SERVICE
// ==============================================================================

import { db } from './db';
import { mentorAssignmentService } from './mentorAssignmentService';
import { auditLogService } from './auditLogService';
import { 
  AdmissionApplication, 
  AdmissionApplicationStatus, 
  AdmissionDocument, 
  Student, 
  User, 
  UserRole, 
  StudentDocument,
  StudentFeeRecord,
  FeePaymentTransaction,
  ERPNotification
} from '../types';

export interface OnboardingStatistics {
  totalAdmissions: number;
  confirmed: number;
  docPending: number;
  feePending: number;
  readyForOnboarding: number;
  onboardingInProgress: number;
  onboarded: number;
  onHold: number;
  rejected: number;
}

export interface OnboardingHistoryRecord {
  id: string;
  applicationId: string;
  applicationNumber: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  programName: string;
  departmentName: string;
  onboardedBy: string;
  role: string;
  date: string;
  time: string;
  previousStatus: string;
  newStatus: string;
  onboardingSource?: 'ADMISSION_APPLICATION' | 'MANUAL_ONBOARDING';
  actionsCompleted: string[];
  remarks?: string;
}

export interface OnboardingReadinessResult {
  isReady: boolean;
  blockers: string[];
  conditions: {
    key: string;
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export interface OnboardStudentPayload {
  applicationId: string;
  customEnrollmentNo?: string;
  customStudentId?: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  academicYearId: string;
  batchId: string;
  semesterId: string;
  divisionId: string;
  mentorId?: string;
  hodId?: string;
  feeStructureId?: string;
  initialFeePaid?: number;
  feeReceiptNo?: string;
  onboardingSource?: 'ADMISSION_APPLICATION' | 'MANUAL_ONBOARDING';
  remarks?: string;
}

export interface OnboardStudentResult {
  success: boolean;
  student?: Student;
  userAccount?: User;
  temporaryEnrollmentNumber?: string;
  studentAccessCode?: string;
  enrollmentNo?: string;
  tempPassword?: string;
  message: string;
  duplicateConflict?: {
    field: string;
    existingStudentId: string;
    existingStudentName: string;
  };
}

export interface OnboardingFilterOptions {
  academicYearId?: string;
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  admissionStatus?: string;
  onboardingStatus?: string;
  searchQuery?: string;
}

export class StudentOnboardingService {
  private static instance: StudentOnboardingService;
  private historyRecords: OnboardingHistoryRecord[] = [
    {
      id: 'onb-hist-1',
      applicationId: 'app-3',
      applicationNumber: 'APP/2024/0003',
      studentId: 'stu-1',
      studentName: 'ABC Student 1',
      enrollmentNo: '2401010001',
      programName: 'B.Tech Computer Science & Engineering',
      departmentName: 'Computer Science & Engineering',
      onboardedBy: 'Registrar Office',
      role: 'REGISTRAR',
      date: '2024-06-05',
      time: '14:30:00',
      previousStatus: 'READY_FOR_ONBOARDING',
      newStatus: 'ONBOARDED',
      actionsCompleted: [
        'Verified 10th & 12th Marksheets',
        'Confirmed Semester 1 Fee Payment',
        'Assigned Faculty Mentor Dr. Bhavin Patel',
        'Generated Active Student User Login'
      ],
      remarks: 'Standard direct admission onboarding completed successfully.'
    }
  ];

  private constructor() {}

  public static getInstance(): StudentOnboardingService {
    if (!StudentOnboardingService.instance) {
      StudentOnboardingService.instance = new StudentOnboardingService();
    }
    return StudentOnboardingService.instance;
  }

  /**
   * 1. GET ONBOARDING KPI METRICS
   */
  public getOnboardingStatistics(): OnboardingStatistics {
    const apps = db.getAdmissionApplications();

    let totalAdmissions = apps.length;
    let confirmed = 0;
    let docPending = 0;
    let feePending = 0;
    let readyForOnboarding = 0;
    let onboardingInProgress = 0;
    let onboarded = 0;
    let onHold = 0;
    let rejected = 0;

    apps.forEach(app => {
      if (app.status === 'ONBOARDED' || app.status === 'CONVERTED' || app.onboardingStatus === 'ONBOARDED') {
        onboarded++;
      } else if (app.status === 'REJECTED' || app.onboardingStatus === 'REJECTED') {
        rejected++;
      } else if (app.status === 'HOLD' || app.onboardingStatus === 'HOLD') {
        onHold++;
      } else if (app.status === 'ONBOARDING_IN_PROGRESS') {
        onboardingInProgress++;
      } else if (app.status === 'READY_FOR_ONBOARDING') {
        readyForOnboarding++;
      } else if (app.status === 'APPROVED' || app.status === 'ADMISSION_CONFIRMED') {
        confirmed++;
        const allDocsVerified = app.documents && app.documents.length > 0 && app.documents.every(d => d.status === 'VERIFIED');
        if (allDocsVerified && app.isFeePaid) {
          readyForOnboarding++;
        } else if (!allDocsVerified) {
          docPending++;
        } else if (!app.isFeePaid) {
          feePending++;
        }
      } else if (app.status === 'DOCUMENT_VERIFICATION' || app.status === 'APPLIED') {
        docPending++;
      } else if (app.status === 'FEE_PENDING') {
        feePending++;
      }
    });

    return {
      totalAdmissions,
      confirmed,
      docPending,
      feePending,
      readyForOnboarding,
      onboardingInProgress,
      onboarded,
      onHold,
      rejected
    };
  }

  /**
   * 1b. CREATE ADMISSION APPLICATION
   */
  public createApplication(data: Partial<AdmissionApplication>, actor?: User): AdmissionApplication {
    const apps = db.getAdmissionApplications();
    const nextSeq = (apps.length + 1).toString().padStart(4, '0');
    const id = data.id || `app-${Date.now()}`;
    const applicationNumber = data.applicationNumber || `APP/2026/${nextSeq}`;
    const admissionNumber = data.admissionNumber || `ADM-2026-${nextSeq}`;

    const newApp: AdmissionApplication = {
      id,
      applicationNumber,
      admissionNumber,
      applicantName: data.applicantName || 'Applicant',
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email || `applicant.${nextSeq}@example.com`,
      phone: data.phone || '9876543210',
      whatsappNumber: data.whatsappNumber || data.phone,
      gender: data.gender || 'Male',
      dateOfBirth: data.dateOfBirth || '2005-08-15',
      bloodGroup: data.bloodGroup || 'O+',
      nationality: data.nationality || 'Indian',
      category: data.category || 'GENERAL',
      religion: data.religion || 'Hindu',
      address: data.address || 'Ahmedabad, Gujarat',
      currentAddress: data.currentAddress || data.address || 'Ahmedabad, Gujarat',
      permanentAddress: data.permanentAddress || data.address || 'Ahmedabad, Gujarat',
      city: data.city || 'Ahmedabad',
      state: data.state || 'Gujarat',
      pincode: data.pincode || '380054',
      fatherName: data.fatherName,
      fatherPhone: data.fatherPhone,
      motherName: data.motherName,
      motherPhone: data.motherPhone,
      guardianName: data.guardianName || data.fatherName || 'Guardian',
      guardianPhone: data.guardianPhone || data.fatherPhone || data.phone || '9876543210',
      instituteId: data.instituteId || 'inst-1',
      departmentId: data.departmentId || 'dept-cse',
      programId: data.programId || 'prog-1',
      academicYearId: data.academicYearId || 'ay-2026',
      admissionYear: data.admissionYear || '2026',
      semesterId: data.semesterId || 'sem-1',
      batchId: data.batchId || 'batch-2026',
      divisionId: data.divisionId || 'div-1',
      status: data.status || 'SUBMITTED',
      onboardingStatus: data.onboardingStatus || 'PENDING',
      isFeePaid: Boolean(data.isFeePaid),
      feeAmountPaid: data.feeAmountPaid || 0,
      feeTotal: data.feeTotal || 60000,
      feePaid: data.feePaid || (data.isFeePaid ? 45000 : 0),
      feePending: data.feePending || (data.isFeePaid ? 15000 : 60000),
      feePaymentStatus: data.feePaymentStatus || (data.isFeePaid ? 'PAID' : 'PENDING'),
      documents: data.documents || [
        { id: 'doc-1', name: '10th Standard Marksheet', documentType: 'ACADEMIC', status: 'PENDING' },
        { id: 'doc-2', name: '12th Standard / Diploma Marksheet', documentType: 'ACADEMIC', status: 'PENDING' },
        { id: 'doc-3', name: 'Aadhaar Card Copy', documentType: 'IDENTITY', status: 'PENDING' },
        { id: 'doc-4', name: 'Passport Size Photo', documentType: 'IDENTITY', status: 'PENDING' }
      ],
      submittedAt: data.submittedAt || new Date().toISOString().split('T')[0]
    };

    db.addEntity('admissionApplications', newApp, `Created admission application: ${newApp.applicationNumber}`);

    if (actor) {
      auditLogService.log({
        action: 'ADMISSION_APPLICATION_CREATED',
        module: 'ADMISSION',
        recordId: id,
        details: `Created admission application for ${newApp.applicantName} (${newApp.applicationNumber})`,
        user: actor,
        newValue: newApp
      });
    }

    return newApp;
  }

  /**
   * 1c. APPROVE ADMISSION APPLICATION
   */
  public approveAdmission(applicationId: string, actor: User, remarks?: string): AdmissionApplication {
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === applicationId);
    if (!app) {
      throw new Error(`Admission Application not found: ${applicationId}`);
    }

    app.status = 'APPROVED';
    app.reviewerRemarks = remarks || 'Admission approved by Admissions Committee';
    
    const readiness = this.evaluateReadiness(app);
    if (readiness.isReady) {
      app.status = 'READY_FOR_ONBOARDING';
      app.onboardingStatus = 'READY';
    }

    db.updateEntity('admissionApplications', app.id, app, `Approved admission application: ${app.applicationNumber}`);

    auditLogService.log({
      action: 'ADMISSION_APPLICATION_APPROVED',
      module: 'ADMISSION',
      recordId: applicationId,
      details: `Approved admission application for ${app.applicantName} (${app.applicationNumber}). Remarks: ${remarks || 'Approved'}`,
      user: actor,
      newValue: { status: app.status, reviewerRemarks: app.reviewerRemarks }
    });

    return app;
  }

  /**
   * 2. EVALUATE READINESS FOR ONBOARDING
   */
  public evaluateReadiness(app: AdmissionApplication): OnboardingReadinessResult {
    const blockers: string[] = [];
    const conditions: OnboardingReadinessResult['conditions'] = [];

    // Condition 1: Admission Approval
    const isApproved = ['APPROVED', 'ADMISSION_CONFIRMED', 'DOCUMENTS_VERIFIED', 'READY_FOR_ONBOARDING', 'CONVERTED', 'ONBOARDED'].includes(app.status);
    conditions.push({
      key: 'ADMISSION_APPROVAL',
      label: 'Admission Approved',
      passed: isApproved,
      detail: isApproved ? 'Application is approved by university authority.' : 'Application is still pending admission review/approval.'
    });
    if (!isApproved) blockers.push('Admission review/approval is pending.');

    // Condition 2: Mandatory Documents (Verified or N/A)
    const docs = app.documents || [];
    const unverifiedDocs = docs.filter(d => d.status !== 'VERIFIED' && d.status !== 'N/A');
    const isDocsPassed = docs.length > 0 && unverifiedDocs.length === 0;
    conditions.push({
      key: 'DOCUMENTS_VERIFICATION',
      label: 'Mandatory Documents Verification',
      passed: isDocsPassed,
      detail: isDocsPassed ? `All ${docs.length} required documents verified / satisfied.` : `${unverifiedDocs.length} of ${docs.length} documents are pending or rejected.`
    });
    if (!isDocsPassed) {
      if (docs.length === 0) blockers.push('No mandatory documents uploaded.');
      else blockers.push(`Mandatory documents (${unverifiedDocs.map(d => d.name).join(', ')}) are unverified.`);
    }

    // Condition 3: Fee Payment Settlement (Paid or Waived)
    const isFeePassed = (Boolean(app.isFeePaid) && (app.feePaymentStatus === 'PAID' || app.feePaymentStatus === 'SUCCESS')) || app.feePaymentStatus === 'WAIVED';
    conditions.push({
      key: 'FEE_VERIFICATION',
      label: 'Initial Admission Fee Settlement',
      passed: isFeePassed,
      detail: isFeePassed 
        ? `Initial admission fee verified / settled (Paid: ₹${(app.feeAmountPaid || app.feePaid || 25000).toLocaleString('en-IN')}, Receipt: ${app.feeReceiptNo || 'SSIU-REC'}).` 
        : 'Required first/initial admission fee is unpaid or payment is pending/failed.'
    });
    if (!isFeePassed) {
      blockers.push('Required first/initial admission fee has not been paid. Student cannot be final onboarded until fee payment is SUCCESS.');
    }

    // Condition 4: Mandatory Demographic Fields
    const hasName = Boolean(app.applicantName && app.applicantName.trim());
    const hasPhone = Boolean(app.phone && app.phone.trim());
    const hasEmail = Boolean(app.email && app.email.trim());
    const hasParent = Boolean((app.guardianName || app.fatherName) && (app.guardianPhone || app.fatherPhone));
    const isProfilePassed = hasName && hasPhone && hasEmail && hasParent;
    conditions.push({
      key: 'DEMOGRAPHIC_INTEGRITY',
      label: 'Student Profile & Parent Information',
      passed: isProfilePassed,
      detail: isProfilePassed ? 'Candidate name, mobile, email, and parent contact details are present.' : 'Incomplete personal or parent information in application.'
    });
    if (!isProfilePassed) {
      if (!hasParent) blockers.push("Parent/Guardian contact details are missing.");
      if (!hasEmail) blockers.push("Candidate email ID is missing.");
    }

    return {
      isReady: blockers.length === 0,
      blockers,
      conditions
    };
  }

  /**
   * 3. GET FILTERED ADMISSION APPLICATIONS FOR ONBOARDING DESK
   */
  public getFilteredApplications(filters?: OnboardingFilterOptions, currentUser?: User | null, currentRole?: UserRole | null): AdmissionApplication[] {
    let list = [...db.getAdmissionApplications()];

    // Apply Role Boundaries
    if (currentRole === 'HOD' && currentUser?.departmentId) {
      list = list.filter(a => a.departmentId === currentUser.departmentId);
    } else if (currentRole === 'PRINCIPAL' && currentUser?.instituteId) {
      list = list.filter(a => a.instituteId === currentUser.instituteId);
    }

    if (filters?.academicYearId && filters.academicYearId !== 'ALL') {
      list = list.filter(a => a.academicYearId === filters.academicYearId);
    }
    if (filters?.instituteId && filters.instituteId !== 'ALL') {
      list = list.filter(a => a.instituteId === filters.instituteId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter(a => a.departmentId === filters.departmentId);
    }
    if (filters?.programId && filters.programId !== 'ALL') {
      list = list.filter(a => a.programId === filters.programId);
    }
    if (filters?.admissionStatus && filters.admissionStatus !== 'ALL') {
      list = list.filter(a => a.status === filters.admissionStatus);
    }
    if (filters?.onboardingStatus && filters.onboardingStatus !== 'ALL') {
      list = list.filter(a => (a.onboardingStatus || 'PENDING') === filters.onboardingStatus);
    }

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(a => 
        (a.applicationNumber && a.applicationNumber.toLowerCase().includes(q)) ||
        (a.admissionNumber && a.admissionNumber.toLowerCase().includes(q)) ||
        (a.enrollmentNo && a.enrollmentNo.toLowerCase().includes(q)) ||
        a.applicantName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q)
      );
    }

    return list;
  }

  /**
   * 4. DUPLICATE CHECK UTILITY
   */
  public checkDuplicates(payload: { email: string; phone: string; enrollmentNo?: string; applicationNumber?: string; aadhaarNumber?: string }): {
    hasDuplicate: boolean;
    conflictType?: string;
    existingStudent?: Student;
    message?: string;
  } {
    const students = db.getStudents();
    const users = db.getUsers();

    if (payload.enrollmentNo) {
      const existEnroll = students.find(s => s.enrollmentNo.toLowerCase() === payload.enrollmentNo?.toLowerCase());
      if (existEnroll) {
        return {
          hasDuplicate: true,
          conflictType: 'ENROLLMENT_NO',
          existingStudent: existEnroll,
          message: `Student with Enrollment No "${payload.enrollmentNo}" already exists: ${existEnroll.name} (${existEnroll.id})`
        };
      }
    }

    if (payload.email) {
      const existEmail = students.find(s => s.email.toLowerCase() === payload.email.toLowerCase()) ||
                          users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (existEmail) {
        return {
          hasDuplicate: true,
          conflictType: 'EMAIL',
          existingStudent: students.find(s => s.email.toLowerCase() === payload.email.toLowerCase()),
          message: `Student or User with Email "${payload.email}" already exists in the system.`
        };
      }
    }

    if (payload.phone) {
      const existPhone = students.find(s => s.phone === payload.phone);
      if (existPhone) {
        return {
          hasDuplicate: true,
          conflictType: 'PHONE',
          existingStudent: existPhone,
          message: `Student with Mobile Number "${payload.phone}" already exists: ${existPhone.name}`
        };
      }
    }

    return { hasDuplicate: false };
  }

  /**
   * 5. VERIFY ADMISSION DOCUMENT (VERIFIED | REJECTED | N/A | PENDING)
   */
  public verifyDocument(
    applicationId: string,
    documentId: string,
    status: 'VERIFIED' | 'REJECTED' | 'N/A' | 'PENDING',
    verifiedBy: User,
    remarks?: string
  ): boolean {
    if (status === 'REJECTED' && (!remarks || !remarks.trim())) {
      throw new Error('A mandatory rejection reason is required when rejecting a document.');
    }

    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === applicationId);
    if (!app) return false;

    const docIndex = app.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) return false;

    app.documents[docIndex].status = status;
    const verifierName = typeof verifiedBy === 'string' ? verifiedBy : verifiedBy?.name || 'Onboarding Officer';
    const verifierRole = typeof verifiedBy === 'string' ? 'STUDENT_ADMIN' : verifiedBy?.role || 'STUDENT_ADMIN';
    app.documents[docIndex].verifiedBy = verifierName;
    app.documents[docIndex].verifiedAt = new Date().toISOString().split('T')[0];
    if (remarks) {
      app.documents[docIndex].remarks = remarks;
      if (status === 'REJECTED') {
        app.documents[docIndex].rejectionReason = remarks;
      }
    }

    // Recompute document readiness
    const allDocsVerified = app.documents.every(d => d.status === 'VERIFIED' || d.status === 'N/A');
    if (allDocsVerified) {
      app.onboardingStatus = app.isFeePaid ? 'READY' : 'DOC_VERIFIED';
      if (app.status === 'DOCUMENT_VERIFICATION' || app.status === 'APPLIED') {
        app.status = 'DOCUMENTS_VERIFIED';
      }
    } else {
      app.onboardingStatus = 'PENDING';
    }

    db.updateEntity('admissionApplications', app.id, app, `Verified application document ${app.documents[docIndex].name} as ${status}`);

    auditLogService.log({
      action: 'ADMISSION_DOCUMENT_VERIFIED',
      module: 'ADMISSION',
      recordId: applicationId,
      details: `Document "${app.documents[docIndex].name}" for applicant ${app.applicantName} marked as ${status} by ${verifierName}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      user: verifiedBy,
      newValue: { document: app.documents[docIndex].name, status, remarks }
    });

    return true;
  }

  /**
   * 6. PROCESS INITIAL ADMISSION FEE PAYMENT (WITH DEMO SIMULATION SUPPORT)
   */
  public payAdmissionFee(payload: {
    applicationId: string;
    amount?: number;
    paymentMethod?: 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | string;
    simulationStatus?: 'SUCCESS' | 'FAILED' | 'CANCELLED';
    actor?: User | null;
  }): {
    success: boolean;
    transaction?: FeePaymentTransaction;
    receiptNumber?: string;
    transactionId?: string;
    paidAmount?: number;
    paidAt?: string;
    message: string;
  } {
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === payload.applicationId);
    if (!app) {
      return { success: false, message: `Admission application ${payload.applicationId} not found.` };
    }

    const simStatus = payload.simulationStatus || 'SUCCESS';
    const amount = payload.amount || app.feePending || app.feeTotal || 25000;
    const yearCode = new Date().getFullYear().toString();
    const timestampStr = Date.now().toString().slice(-6);

    if (simStatus === 'CANCELLED') {
      return { success: false, message: 'Fee payment was cancelled.' };
    }

    if (simStatus === 'FAILED') {
      app.feePaymentStatus = 'FAILED';
      db.updateEntity('admissionApplications', app.id, app, `Admission fee payment failed for ${app.applicantName}`);
      return { success: false, message: 'Fee payment transaction failed. Please retry with a valid payment method.' };
    }

    // SIMULATION SUCCESS
    const receiptNumber = `REC-${yearCode}-${timestampStr}`;
    const transactionId = `TXN-${yearCode}${timestampStr}`;
    const gatewayRef = `GW-REF-${timestampStr}`;
    const paidAt = new Date().toISOString();
    const paymentDate = paidAt.split('T')[0];
    const prog = db.getPrograms().find(p => p.id === app.programId);

    // Create Official University Transaction Record
    const transaction: FeePaymentTransaction = {
      id: `pay-${Date.now()}`,
      studentFeeRecordId: `fee-rec-${app.id}`,
      receiptNo: receiptNumber,
      studentId: app.studentId || app.id,
      studentName: app.applicantName,
      enrollmentNo: app.enrollmentNo || app.applicationNumber || `TEMP-${yearCode}-${timestampStr}`,
      programId: app.programId || 'prog-1',
      semesterId: app.semesterId || 'sem-1',
      semesterName: 'Semester 1 (Admission)',
      academicYear: app.academicYearId || `${yearCode}-${parseInt(yearCode) + 1}`,
      paidAmount: amount,
      paymentMode: (payload.paymentMethod as any) || 'UPI',
      transactionId,
      referenceNo: gatewayRef,
      gatewayName: 'SSIU HDFC / Razorpay University Gateway',
      gatewayRef,
      feeType: 'TUITION',
      status: 'SUCCESS',
      paymentDate,
      remarks: `Initial Admission Fee Payment for Application ${app.applicationNumber || app.id}`,
      recordedBy: payload.actor?.name || 'SSIU Online Admission Portal'
    };

    // Save transaction to DB
    db.addEntity('feePaymentTransactions', transaction, `Recorded admission fee payment ${receiptNumber}`);

    // Update Application Statuses
    app.isFeePaid = true;
    app.feeAmountPaid = amount;
    app.feeReceiptNo = receiptNumber;
    app.feePaid = amount;
    app.feePending = 0;
    app.feePaymentStatus = 'PAID';
    app.paymentTransactionId = transactionId;
    app.paymentDate = paymentDate;

    // Check if documents are also verified to promote to READY_FOR_ONBOARDING
    const docs = app.documents || [];
    const allDocsVerified = docs.length > 0 && docs.every(d => d.status === 'VERIFIED' || d.status === 'N/A');
    if (allDocsVerified) {
      app.status = 'READY_FOR_ONBOARDING';
      app.onboardingStatus = 'READY';
    } else {
      app.status = 'FEE_VERIFIED';
      app.onboardingStatus = 'FEE_VERIFIED';
    }

    db.updateEntity('admissionApplications', app.id, app, `Admission fee of Rs. ${amount} paid successfully (Receipt: ${receiptNumber})`);

    if (payload.actor) {
      auditLogService.log({
        action: 'ADMISSION_FEE_PAID',
        module: 'ADMISSION',
        recordId: app.id,
        details: `Initial admission fee of Rs. ${amount} paid successfully (Receipt: ${receiptNumber}, Txn: ${transactionId}) by ${payload.actor.name}.`,
        user: payload.actor,
        newValue: { feeAmountPaid: amount, receiptNo: receiptNumber, feePaymentStatus: 'PAID' }
      });
    }

    return {
      success: true,
      transaction,
      receiptNumber,
      transactionId,
      paidAmount: amount,
      paidAt,
      message: `Initial admission fee of Rs. ${amount.toLocaleString('en-IN')} paid successfully.`
    };
  }

  /**
   * 6b. CONFIRM & VERIFY ADMISSION FEE
   */
  public verifyFee(
    applicationId: string,
    feeAmount: number,
    receiptNo: string,
    verifiedBy: User,
    status: 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'PENDING' = 'PAID',
    feeTotal = 60000
  ): boolean {
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === applicationId);
    if (!app) return false;

    app.isFeePaid = status === 'PAID' || status === 'WAIVED' || feeAmount > 0;
    app.feeAmountPaid = feeAmount;
    app.feeReceiptNo = receiptNo;
    app.feeTotal = feeTotal;
    app.feePaid = feeAmount;
    app.feePending = Math.max(0, feeTotal - feeAmount);
    app.feePaymentStatus = status;

    const allDocsVerified = app.documents && app.documents.length > 0 && app.documents.every(d => d.status === 'VERIFIED' || d.status === 'N/A');
    if (allDocsVerified && (status === 'PAID' || status === 'WAIVED')) {
      app.status = 'READY_FOR_ONBOARDING';
      app.onboardingStatus = 'READY';
    } else {
      app.status = 'FEE_VERIFIED';
      app.onboardingStatus = 'FEE_VERIFIED';
    }

    db.updateEntity('admissionApplications', app.id, app, `Admission fee of Rs. ${feeAmount} verified for ${app.applicantName}`);

    auditLogService.log({
      action: 'ADMISSION_FEE_VERIFIED',
      module: 'ADMISSION',
      recordId: applicationId,
      details: `Admission fee of Rs. ${feeAmount} (Receipt: ${receiptNo}, Status: ${status}) verified for applicant ${app.applicantName} by ${verifiedBy.name}.`,
      user: verifiedBy,
      newValue: { feeAmount, receiptNo, status, feePending: app.feePending }
    });

    return true;
  }

  /**
   * 6b. GENERATE SEQUENTIAL TEMPORARY ENROLLMENT NUMBER
   */
  public generateTemporaryEnrollmentNumber(academicYear = '2026'): string {
    const students = db.getStudents();
    const apps = db.getAdmissionApplications();
    
    let maxSeq = 0;
    const regex = new RegExp(`^TEMP-${academicYear}-(\\d{5})$`, 'i');

    students.forEach(s => {
      if (s.temporaryEnrollmentNumber) {
        const m = s.temporaryEnrollmentNumber.match(regex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
      if (s.enrollmentNo) {
        const m = s.enrollmentNo.match(regex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });

    apps.forEach(a => {
      if (a.enrollmentNo) {
        const m = a.enrollmentNo.match(regex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });

    const nextSeq = (maxSeq + 1).toString().padStart(5, '0');
    return `TEMP-${academicYear}-${nextSeq}`;
  }

  /**
   * 6c. GENERATE 5-DIGIT RANDOM STUDENT ACCESS CODE
   */
  public generateStudentAccessCode(): string {
    return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  }

  /**
   * 7. ATOMIC ONBOARDING TRANSACTION (ADMISSION -> ACTIVE STUDENT + USER LOGIN)
   */
  public onboardStudent(
    payload: OnboardStudentPayload,
    actor: User
  ): OnboardStudentResult {
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === payload.applicationId);

    if (!app) {
      return { success: false, message: 'Admission application not found.' };
    }

    if (app.status === 'CONVERTED' || app.status === 'ONBOARDED' || app.onboardingStatus === 'ONBOARDED') {
      const existingStudent = db.getStudents().find(s => s.id === app.studentId || s.enrollmentNo === app.enrollmentNo);
      return {
        success: false,
        student: existingStudent,
        message: `Student is already onboarded (Enrollment No: ${app.enrollmentNo || existingStudent?.enrollmentNo}).`
      };
    }

    // Evaluate readiness
    const readiness = this.evaluateReadiness(app);
    if (!readiness.isReady) {
      return {
        success: false,
        message: `Cannot onboard student: ${readiness.blockers.join(' ')}`
      };
    }

    // 1. Generate Safe Sequential Temporary Enrollment Number & 5-Digit Access Code
    const academicYearObj = db.getAcademicYears().find(a => a.id === payload.academicYearId);
    const yearCode = academicYearObj?.name?.slice(0, 4) || '2026';
    const temporaryEnrollmentNumber = payload.customEnrollmentNo?.startsWith('TEMP-') 
      ? payload.customEnrollmentNo.trim() 
      : this.generateTemporaryEnrollmentNumber(yearCode);
    const studentAccessCode = this.generateStudentAccessCode();
    const enrollmentNo = temporaryEnrollmentNumber;
    const studentId = payload.customStudentId?.trim() || `stu-${Date.now()}`;
    const admissionNo = app.admissionNumber || `ADM-${yearCode}-${(db.getStudents().length + 1).toString().padStart(4, '0')}`;

    // 2. Duplicate Protection Check
    const dupCheck = this.checkDuplicates({
      email: app.email,
      phone: app.phone,
      enrollmentNo,
      applicationNumber: app.applicationNumber
    });

    if (dupCheck.hasDuplicate) {
      return {
        success: false,
        message: dupCheck.message || 'Duplicate conflict detected.',
        duplicateConflict: {
          field: dupCheck.conflictType || 'UNKNOWN',
          existingStudentId: dupCheck.existingStudent?.id || '',
          existingStudentName: dupCheck.existingStudent?.name || ''
        }
      };
    }

    // 3. Resolve Academic Hierarchy
    const program = db.getPrograms().find(p => p.id === payload.programId);
    const department = db.getDepartments().find(d => d.id === payload.departmentId) || db.getDepartments().find(d => d.id === program?.departmentId);
    const institute = db.getInstitutes().find(i => i.id === payload.instituteId) || db.getInstitutes().find(i => i.id === department?.instituteId);
    const academicYear = academicYearObj || db.getAcademicYears().find(a => a.id === payload.academicYearId) || db.getAcademicYears()[0];
    const batch = db.getBatches().find(b => b.id === payload.batchId) || db.getBatches()[0];
    const semester = db.getSemesters().find(s => s.id === payload.semesterId) || db.getSemesters()[0];
    const division = db.getDivisions().find(d => d.id === payload.divisionId) || db.getDivisions()[0];

    // 4. Create Canonical Student Master Record
    const newStudent: Student = {
      id: studentId,
      enrollmentNo,
      temporaryEnrollmentNumber,
      finalEnrollmentNumber: undefined,
      enrollmentStatus: 'TEMPORARY',
      studentAccessCode,
      onboardingCompletedAt: new Date().toISOString(),
      isFirstLogin: true,
      admissionId: app.id,
      admissionNumber: admissionNo,
      applicationNumber: app.applicationNumber,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionYear: app.admissionYear || yearCode,
      name: app.applicantName,
      fullName: app.applicantName,
      firstName: app.firstName,
      middleName: app.middleName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      whatsappNumber: app.whatsappNumber || app.phone,
      photo: app.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      gender: app.gender,
      dateOfBirth: app.dateOfBirth,
      dob: app.dateOfBirth,
      bloodGroup: app.bloodGroup,
      address: app.currentAddress || app.address,
      currentAddressLine1: app.currentAddress || app.address,
      currentCity: app.city || 'Ahmedabad',
      currentState: app.state || 'Gujarat',
      currentCountry: app.country || 'India',
      currentPincode: app.pincode || '380054',
      fatherName: app.fatherName,
      fatherPhone: app.fatherPhone,
      motherName: app.motherName,
      motherPhone: app.motherPhone,
      guardianName: app.guardianName || app.fatherName || 'Guardian',
      guardianPhone: app.guardianPhone || app.fatherPhone || app.phone,
      instituteId: institute?.id || 'inst-1',
      departmentId: department?.id || 'dept-cse',
      programId: program?.id || 'prog-1',
      academicYearId: academicYear?.id || 'ay-2026',
      batchId: batch?.id || 'batch-2026',
      semesterId: semester?.id || 'sem-1',
      divisionId: division?.id || 'div-1',
      mentorId: payload.mentorId || undefined,
      studentType: 'DOMESTIC',
      nationality: app.nationality || 'Indian',
      academicLifecycleStatus: 'ADMITTED',
      studentStatus: 'ACTIVE',
      onboardingStatus: 'ONBOARDED',
      onboardingSource: payload.onboardingSource || 'ADMISSION_APPLICATION',
      erpAccountStatus: 'ACTIVE',
      erpUsername: temporaryEnrollmentNumber,
      status: 'ACTIVE'
    };

    // 5. Create Student User Login Account with Temporary Enrollment and 5-digit Access Code
    const newUserAccount: User = {
      id: `user-${studentId}`,
      name: app.applicantName,
      email: app.email,
      username: temporaryEnrollmentNumber,
      password: studentAccessCode, // Student Access Code as Initial Password
      temporaryEnrollmentNumber,
      finalEnrollmentNumber: undefined,
      enrollmentStatus: 'TEMPORARY',
      studentAccessCode,
      isFirstLogin: true,
      role: 'STUDENT',
      phone: app.phone,
      instituteId: institute?.id || 'inst-1',
      departmentId: department?.id || 'dept-cse',
      departmentName: department?.name || 'Computer Science & Engineering',
      programId: program?.id || 'prog-1',
      enrollmentNo: temporaryEnrollmentNumber,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    // 6. Assign Mentor if specified
    if (payload.mentorId) {
      try {
        mentorAssignmentService.assignMentor({
          studentId,
          mentorFacultyId: payload.mentorId,
          effectiveFrom: new Date().toISOString().split('T')[0],
          changeReason: 'Initial admission onboarding mapping'
        }, actor);
      } catch (e) {
        // Fallback: mentor id is mapped in newStudent.mentorId
      }
    }

    // 7. Migrate Verified Documents to Student Document Vault
    if (app.documents && app.documents.length > 0) {
      app.documents.forEach((doc, idx) => {
        const studentDoc: StudentDocument = {
          id: `sdoc-${studentId}-${idx + 1}`,
          studentId,
          studentName: app.applicantName,
          enrollmentNo: temporaryEnrollmentNumber,
          title: doc.name,
          category: doc.name.toLowerCase().includes('mark') ? 'ACADEMIC' : doc.name.toLowerCase().includes('photo') || doc.name.toLowerCase().includes('aadhaar') ? 'IDENTITY' : 'ADMISSION',
          fileName: `${doc.name.replace(/\s+/g, '_')}.pdf`,
          fileSize: '1.4 MB',
          fileUrl: doc.fileUrl || 'https://swarrnim.edu.in/docs/sample.pdf',
          uploadDate: new Date().toISOString().split('T')[0],
          status: doc.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING_VERIFICATION',
          isLocked: doc.status === 'VERIFIED',
          verifiedBy: doc.verifiedBy || actor.name,
          verifiedAt: doc.verifiedAt || new Date().toISOString().split('T')[0]
        };
        db.addEntity('studentDocuments', studentDoc, `Migrated admission document ${doc.name} for newly onboarded student ${app.applicantName}`);
      });
    }

    // 8. Initialize Student Fee Record & Allocation
    const programFeeStruct = db.getFeeStructures().find(f => f.programId === payload.programId) || db.getFeeStructures()[0];
    const semDisplayName = semester ? `Semester ${semester.number}` : 'Semester 1';
    const ayDisplayName = academicYear?.name || '2026-2027';

    const newFeeRecord: StudentFeeRecord = {
      id: `sfr-${studentId}-sem1`,
      studentId,
      studentName: app.applicantName,
      enrollmentNo: temporaryEnrollmentNumber,
      programId: payload.programId,
      semesterId: payload.semesterId,
      semesterName: semDisplayName,
      academicYearId: payload.academicYearId,
      academicYearCode: ayDisplayName,
      feeStructureId: programFeeStruct?.id || 'fs-btech-sem1',
      feeStructureName: programFeeStruct?.name || 'Standard Tuition Fee Structure',
      tuitionFee: programFeeStruct?.tuitionFee || 45000,
      labFee: programFeeStruct?.labFee || 8000,
      developmentFee: programFeeStruct?.developmentFee || 7000,
      hostelFee: 0,
      totalAmount: programFeeStruct?.totalAmount || 60000,
      previouslyPaid: 0,
      currentPaid: payload.initialFeePaid || (app.isFeePaid ? (Number(app.feeAmountPaid) || 45000) : 0),
      paidAmount: payload.initialFeePaid || (app.isFeePaid ? (Number(app.feeAmountPaid) || 45000) : 0),
      pendingAmount: Math.max(0, (programFeeStruct?.totalAmount || 60000) - (payload.initialFeePaid || (Number(app.feeAmountPaid) || 0))),
      dueDate: '2026-09-30',
      status: (payload.initialFeePaid || 0) >= (programFeeStruct?.totalAmount || 60000) ? 'PAID' : (payload.initialFeePaid || 0) > 0 ? 'PARTIAL' : 'PENDING'
    };
    db.addEntity('studentFeeRecords', newFeeRecord, `Assigned initial Semester 1 fee record to onboarded student ${app.applicantName}`);

    // If fee paid during admission, record fee transaction
    if (app.isFeePaid || (payload.initialFeePaid && payload.initialFeePaid > 0)) {
      const feeTx: FeePaymentTransaction = {
        id: `tx-onboard-${Date.now()}`,
        studentFeeRecordId: newFeeRecord.id,
        receiptNo: payload.feeReceiptNo || app.feeReceiptNo || `SSIU-REC-${yearCode}-${(db.getStudents().length + 1).toString().padStart(4, '0')}`,
        studentId,
        studentName: app.applicantName,
        enrollmentNo: temporaryEnrollmentNumber,
        programId: payload.programId,
        semesterId: payload.semesterId,
        semesterName: semDisplayName,
        academicYear: ayDisplayName,
        paidAmount: payload.initialFeePaid || (Number(app.feeAmountPaid) || 45000),
        paymentMode: 'Bank Transfer',
        transactionId: `TXN-ADM-${Date.now().toString().slice(-8)}`,
        referenceNo: app.applicationNumber || 'APP-2026',
        bankName: 'HDFC Bank Ltd',
        gatewayName: 'Admission Accounts Portal',
        feeType: 'TUITION',
        status: 'SUCCESS',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: 'Admission confirmation fee settled during university onboarding.',
        recordedBy: actor.name
      };
      db.addEntity('feePaymentTransactions', feeTx, `Recorded admission confirmation fee transaction for ${app.applicantName}`);
    }

    // 9. Atomic DB Ingestion into Single Canonical Master
    db.addEntity('students', newStudent, `Onboarded student ${newStudent.name} (${newStudent.enrollmentNo}) mapped to ${department?.name}`);
    db.addEntity('users', newUserAccount, `Generated student login account for ${newUserAccount.name} (${newUserAccount.username})`);

    // 10. Update Application Status
    const prevStatus = app.status;
    app.status = 'CONVERTED';
    app.onboardingStatus = 'ONBOARDED';
    app.studentId = studentId;
    app.enrollmentNo = temporaryEnrollmentNumber;
    app.admissionNumber = admissionNo;
    app.studentUserId = newUserAccount.id;
    app.onboardedAt = new Date().toISOString();
    app.onboardedBy = actor.name;
    app.onboardingStep = 11; // 100% complete

    db.updateEntity('admissionApplications', app.id, app, `Completed onboarding for application ${app.applicationNumber}`);

    // 11. Record Onboarding History
    const historyEntry: OnboardingHistoryRecord = {
      id: `onb-hist-${Date.now()}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber || app.id,
      studentId,
      studentName: app.applicantName,
      enrollmentNo: temporaryEnrollmentNumber,
      programName: program?.name || 'Program',
      departmentName: department?.name || 'Department',
      onboardedBy: actor.name,
      role: actor.role,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      previousStatus: prevStatus,
      newStatus: 'ONBOARDED',
      onboardingSource: payload.onboardingSource || 'ADMISSION_APPLICATION',
      actionsCompleted: [
        `Verified ${app.documents?.length || 0} mandatory admission documents`,
        `Confirmed admission fee of ₹${payload.initialFeePaid || app.feeAmountPaid || 45000}`,
        `Mapped academic placement in ${program?.name}, ${semDisplayName}`,
        payload.mentorId ? `Assigned faculty mentor` : 'Mentor unassigned',
        `Generated temporary student login (${temporaryEnrollmentNumber}) with 5-digit access code`
      ],
      remarks: payload.remarks || 'Standard student onboarding executed successfully.'
    };
    this.historyRecords.unshift(historyEntry);

    // 12. Dispatch In-App Notifications
    // 12A. Student Welcome Notification
    db.addEntity<ERPNotification>('notifications', {
      id: `notif-${Date.now()}-1`,
      type: 'SUCCESS',
      title: '🎉 Welcome to Swarrnim University ERP',
      message: `Dear ${app.applicantName}, your admission is confirmed. Your Temporary Enrollment Number is ${temporaryEnrollmentNumber}. Your 5-digit Access Code is ${studentAccessCode}. Your final enrollment number is currently pending.`,
      module: 'ADMISSION',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched welcome notification');

    // 12B. Department / HOD Notification (Auto-sync alert)
    db.addEntity<ERPNotification>('notifications', {
      id: `notif-${Date.now()}-dept`,
      type: 'INFORMATION',
      title: '🏛️ New Student Onboarded to Department',
      message: `${app.applicantName} has been successfully onboarded to Department: ${department?.name || 'Computer Engineering'} (${program?.name || 'B.Tech'}). Temporary Enrollment: ${temporaryEnrollmentNumber}. Academic Year: ${ayDisplayName}.`,
      module: 'DEPARTMENT',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched department onboarding notification');

    // 12C. Mentor Notification
    if (payload.mentorId) {
      db.addEntity<ERPNotification>('notifications', {
        id: `notif-${Date.now()}-2`,
        type: 'INFORMATION',
        title: '📋 New Mentee Onboarded',
        message: `New student ${app.applicantName} (${temporaryEnrollmentNumber}, ${program?.name}) has been assigned to you.`,
        module: 'MENTORSHIP',
        createdAt: new Date().toISOString(),
        isReadByUsers: []
      }, 'Dispatched mentor assignment notification');
    }

    // 13. Log Comprehensive Audit Trail
    db.logAudit(
      'STUDENT_ONBOARDING_COMPLETED',
      'Student',
      `Student ${app.applicantName} successfully onboarded from application ${app.applicationNumber || app.id}. Enrollment No: ${temporaryEnrollmentNumber}, Program: ${program?.name}, Department: ${department?.name}, Mentor: ${payload.mentorId || 'Unassigned'}.`,
      actor.name,
      actor.role,
      {
        recordId: studentId,
        module: 'ADMISSION'
      }
    );

    return {
      success: true,
      student: newStudent,
      userAccount: newUserAccount,
      temporaryEnrollmentNumber,
      studentAccessCode,
      enrollmentNo: temporaryEnrollmentNumber,
      tempPassword: studentAccessCode,
      message: `Student ${newStudent.name} (${temporaryEnrollmentNumber}) successfully onboarded into ERP!`
    };
  }

  /**
   * 8. CONVERT TEMPORARY ENROLLMENT TO FINAL ENROLLMENT
   */
  public assignFinalEnrollment(
    studentId: string,
    finalEnrollmentNo: string,
    actor: User,
    remarks?: string
  ): { success: boolean; student?: Student; message: string } {
    const cleanFinalNo = finalEnrollmentNo.trim();
    if (!cleanFinalNo) {
      return { success: false, message: 'Final enrollment number cannot be empty.' };
    }

    const students = db.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    // Duplicate Check
    const duplicate = students.find(
      s => s.id !== studentId && (s.enrollmentNo.toLowerCase() === cleanFinalNo.toLowerCase() || s.finalEnrollmentNumber?.toLowerCase() === cleanFinalNo.toLowerCase())
    );
    if (duplicate) {
      return {
        success: false,
        message: `Final Enrollment Number "${cleanFinalNo}" is already assigned to student ${duplicate.name} (${duplicate.id}).`
      };
    }

    const prevTempNo = student.temporaryEnrollmentNumber || student.enrollmentNo;
    const prevEnrollmentNo = student.enrollmentNo;

    // 1. Update SAME Student Master Record
    student.enrollmentNo = cleanFinalNo;
    student.finalEnrollmentNumber = cleanFinalNo;
    student.enrollmentStatus = 'FINAL';
    student.finalEnrollmentAssignedAt = new Date().toISOString();
    student.finalEnrollmentAssignedBy = actor.name;
    student.erpUsername = cleanFinalNo;

    db.updateEntity('students', student.id, student, `Assigned Final Enrollment ${cleanFinalNo} to student ${student.name}`);

    // 2. Update SAME User Login Account
    const users = db.getUsers();
    const userAcc = users.find(u => u.id === `user-${studentId}` || u.username === prevTempNo || u.username === prevEnrollmentNo || u.email === student.email);
    if (userAcc) {
      userAcc.username = cleanFinalNo;
      userAcc.enrollmentNo = cleanFinalNo;
      userAcc.finalEnrollmentNumber = cleanFinalNo;
      userAcc.enrollmentStatus = 'FINAL';
      db.updateEntity('users', userAcc.id, userAcc, `Updated user login identifier to ${cleanFinalNo}`);
    }

    // 3. Update Admission Application reference if linked
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.studentId === studentId || a.id === student.admissionId);
    if (app) {
      app.enrollmentNo = cleanFinalNo;
      db.updateEntity('admissionApplications', app.id, app, `Updated enrollment number to final: ${cleanFinalNo}`);
    }

    // 4. Update Fee Records & Transactions
    const feeRecords = db.getStudentFeeRecords();
    feeRecords.filter(r => r.studentId === studentId || r.enrollmentNo === prevTempNo).forEach(r => {
      r.enrollmentNo = cleanFinalNo;
      db.updateEntity('studentFeeRecords', r.id, r, `Updated fee record enrollment number to ${cleanFinalNo}`);
    });

    // 5. Update Documents Vault
    const docVault = db.getStudentDocuments();
    docVault.filter(d => d.studentId === studentId || d.enrollmentNo === prevTempNo).forEach(d => {
      d.enrollmentNo = cleanFinalNo;
      db.updateEntity('studentDocuments', d.id, d, `Updated document vault enrollment number to ${cleanFinalNo}`);
    });

    // 6. Dispatch Notifications
    // Student Notification
    db.addEntity<ERPNotification>('notifications', {
      id: `notif-${Date.now()}-final-stu`,
      type: 'SUCCESS',
      title: '🎓 Your Final Enrollment Number has been generated',
      message: `Dear ${student.name}, your Final Enrollment Number is ${cleanFinalNo}. (Temporary Enrollment was ${prevTempNo}). Your new Login ID is ${cleanFinalNo}.`,
      module: 'ADMISSION',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched final enrollment notification to student');

    // Department Notification
    const dept = db.getDepartments().find(d => d.id === student.departmentId);
    db.addEntity<ERPNotification>('notifications', {
      id: `notif-${Date.now()}-final-dept`,
      type: 'INFORMATION',
      title: '📋 Final Enrollment Assigned to Student',
      message: `Final Enrollment Number ${cleanFinalNo} has been assigned to ${student.name} (${dept?.name || 'Department'}). Previous Temporary Enrollment: ${prevTempNo}.`,
      module: 'DEPARTMENT',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched final enrollment notification to department');

    // 7. Log Comprehensive Audit Trail
    db.logAudit(
      'FINAL_ENROLLMENT_ASSIGNED',
      'Student',
      `Final Enrollment Number ${cleanFinalNo} assigned to student ${student.name} (Enrollment No: ${student.enrollmentNo || prevTempNo}) by ${actor.name}. Previous Temporary Enrollment: ${prevTempNo}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      actor.name,
      actor.role,
      {
        recordId: student.id,
        module: 'ADMISSION'
      }
    );

    return {
      success: true,
      student,
      message: `Successfully assigned Final Enrollment Number "${cleanFinalNo}" to ${student.name}.`
    };
  }

  /**
   * 9. REGENERATE / RESET STUDENT ACCESS CODE
   */
  public resetStudentAccessCode(
    studentId: string,
    actor: User,
    reason?: string
  ): { success: boolean; studentAccessCode?: string; message: string } {
    const student = db.getStudents().find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Student not found.' };
    }

    const newAccessCode = this.generateStudentAccessCode();
    student.studentAccessCode = newAccessCode;
    db.updateEntity('students', student.id, student, `Reset access code for ${student.name}`);

    const userAcc = db.getUsers().find(u => u.id === `user-${studentId}` || u.username === student.enrollmentNo || u.username === student.temporaryEnrollmentNumber);
    if (userAcc) {
      userAcc.password = newAccessCode;
      userAcc.studentAccessCode = newAccessCode;
      db.updateEntity('users', userAcc.id, userAcc, `Updated user password for access code reset`);
    }

    db.logAudit(
      'STUDENT_ACCESS_CODE_RESET',
      'Student',
      `Access Code reset for student ${student.name} (${student.enrollmentNo}) by ${actor.name}.${reason ? ` Reason: ${reason}` : ''}`,
      actor.name,
      actor.role,
      {
        recordId: student.id,
        module: 'ADMISSION'
      }
    );

    return {
      success: true,
      studentAccessCode: newAccessCode,
      message: `Generated new 5-digit Student Access Code: ${newAccessCode}`
    };
  }

  /**
   * 10. UPDATE STUDENT DEPARTMENT MAPPING WITH AUDIT
   */
  public updateStudentDepartment(
    studentId: string,
    newInstituteId: string,
    newDepartmentId: string,
    newProgramId: string,
    actor: User,
    reason?: string
  ): { success: boolean; student?: Student; message: string } {
    const student = db.getStudents().find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Student not found.' };

    const oldDept = db.getDepartments().find(d => d.id === student.departmentId)?.name || student.departmentId;
    const newDept = db.getDepartments().find(d => d.id === newDepartmentId)?.name || newDepartmentId;

    student.instituteId = newInstituteId;
    student.departmentId = newDepartmentId;
    student.programId = newProgramId;

    db.updateEntity('students', student.id, student, `Transferred student department from ${oldDept} to ${newDept}`);

    const userAcc = db.getUsers().find(u => u.id === `user-${studentId}` || u.username === student.enrollmentNo);
    if (userAcc) {
      userAcc.instituteId = newInstituteId;
      userAcc.departmentId = newDepartmentId;
      userAcc.departmentName = newDept;
      userAcc.programId = newProgramId;
      db.updateEntity('users', userAcc.id, userAcc, `Updated user department mapping`);
    }

    db.logAudit(
      'STUDENT_DEPARTMENT_CHANGED',
      'Student',
      `Department for student ${student.name} changed from "${oldDept}" to "${newDept}" by ${actor.name}.${reason ? ` Reason: ${reason}` : ''}`,
      actor.name,
      actor.role,
      { recordId: student.id, module: 'ACADEMIC' }
    );

    return {
      success: true,
      student,
      message: `Department mapping updated to ${newDept}.`
    };
  }


  /**
   * 8. GET ONBOARDING AUDIT HISTORY
   */
  public getOnboardingHistory(): OnboardingHistoryRecord[] {
    return [...this.historyRecords];
  }

  /**
   * 9. HOLD APPLICATION
   */
  public holdApplication(applicationId: string, reason: string, actor: User): boolean {
    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === applicationId);
    if (!app) return false;

    app.status = 'HOLD';
    app.onboardingStatus = 'HOLD';
    app.reviewerRemarks = reason;
    db.updateEntity('admissionApplications', app.id, app, `Put admission application on hold: ${reason}`);

    db.logAudit(
      'ADMISSION_APPLICATION_HOLD',
      'AdmissionApplication',
      `Application ${app.applicationNumber || app.id} for ${app.applicantName} put ON HOLD by ${actor.name}. Reason: ${reason}`,
      actor.name,
      actor.role,
      { recordId: applicationId, module: 'ADMISSION' }
    );
    return true;
  }

  /**
   * 10. REJECT APPLICATION
   */
  public rejectApplication(applicationId: string, reason: string, actor: User): boolean {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory rejection reason required.');
    }

    const apps = db.getAdmissionApplications();
    const app = apps.find(a => a.id === applicationId);
    if (!app) return false;

    app.status = 'REJECTED';
    app.onboardingStatus = 'REJECTED';
    app.reviewerRemarks = reason;
    db.updateEntity('admissionApplications', app.id, app, `Rejected admission application: ${reason}`);

    db.logAudit(
      'ADMISSION_APPLICATION_REJECTED',
      'AdmissionApplication',
      `Application ${app.applicationNumber || app.id} for ${app.applicantName} REJECTED by ${actor.name}. Reason: ${reason}`,
      actor.name,
      actor.role,
      { recordId: applicationId, module: 'ADMISSION' }
    );
    return true;
  }
}

export const studentOnboardingService = StudentOnboardingService.getInstance();
