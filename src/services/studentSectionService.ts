// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT SECTION & OFFICIAL SERVICES SERVICE
// ==============================================================================

import { db } from './db';
import { 
  StudentSectionService, StudentSectionRequest, StudentSectionDocument,
  StudentSectionRequestStatus, StudentSectionPaymentStatus, StudentSectionTimelineItem
} from '../types/studentSection';
import { studentSectionFeeMasterService } from './studentSectionFeeMasterService';
import { User, UserRole, FeePaymentTransaction, PaymentMode, Student } from '../types';

export class StudentSectionServiceEngine {
  private static instance: StudentSectionServiceEngine;

  private constructor() {}

  public static getInstance(): StudentSectionServiceEngine {
    if (!StudentSectionServiceEngine.instance) {
      StudentSectionServiceEngine.instance = new StudentSectionServiceEngine();
    }
    return StudentSectionServiceEngine.instance;
  }

  // ============================================================================
  // WORKING DAYS SLA CALCULATOR (Excludes Weekends)
  // ============================================================================
  public calculateWorkingDaysDueDate(startDate: Date, workingDays: number): { dueDate: Date; dueDateStr: string } {
    const cur = new Date(startDate);
    let added = 0;
    while (added < workingDays) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
        added++;
      }
    }
    return {
      dueDate: cur,
      dueDateStr: cur.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  }

  // ============================================================================
  // 1. SERVICE CATALOG MASTERS
  // ============================================================================

  public getServices(onlyActive = true): StudentSectionService[] {
    const services = db.getState().studentSectionServices || [];
    if (onlyActive) {
      return services.filter((s: StudentSectionService) => s.isActive);
    }
    return services;
  }

  public getServiceById(id: string): StudentSectionService | undefined {
    return (db.getState().studentSectionServices || []).find((s: StudentSectionService) => s.id === id);
  }

  public saveService(service: StudentSectionService): void {
    db.updateState(state => {
      const services = [...(state.studentSectionServices || [])];
      const index = services.findIndex(s => s.id === service.id);
      if (index >= 0) {
        services[index] = service;
      } else {
        services.push(service);
      }
      state.studentSectionServices = services;
    }, `Saved Student Section Service: ${service.name}`);
  }

  // ============================================================================
  // 2. REQUEST CREATION & AUTO-FILL FROM STUDENT MASTER
  // ============================================================================

  public createRequest(
    params: {
      serviceId: string;
      purpose: string;
      copies?: number;
      isUrgent?: boolean;
      deliveryMode?: 'DIGITAL' | 'PHYSICAL' | 'BOTH';
      deliveryAddress?: string;
      serviceSpecificData?: Record<string, any>;
      attachments?: { name: string; url: string; uploadedAt: string; fileSize?: string; required?: boolean }[];
      isDraft?: boolean;
    },
    user: User
  ): StudentSectionRequest {
    const service = this.getServiceById(params.serviceId);
    if (!service) {
      throw new Error('Requested service does not exist in master catalog.');
    }
    if (!service.isActive && !params.isDraft) {
      throw new Error('This service is currently disabled by the university administration.');
    }

    // Resolve Student from Master Database (Single Source of Truth)
    const students = db.getStudents();
    const student = students.find(s => s.id === user.id || s.email === user.email || s.enrollmentNo === user.enrollmentNo) || students[0];
    if (!student) {
      throw new Error('Student profile not found in ERP master. Request creation aborted.');
    }

    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const semesters = db.getSemesters();
    const divisions = db.getDivisions();
    const batches = db.getBatches();

    const instObj = institutes.find(i => i.id === student.instituteId);
    const deptObj = departments.find(d => d.id === student.departmentId);
    const progObj = programs.find(p => p.id === student.programId);
    const semObj = semesters.find(s => s.id === student.semesterId);
    const divObj = divisions.find(d => d.id === student.divisionId);
    const batchObj = batches.find(b => b.id === student.batchId);

    const copies = Math.max(1, params.copies || 1);
    const isUrgent = Boolean(params.isUrgent);
    const passoutStatus = (params.serviceSpecificData?.passoutStatus as 'NON_PASSOUT' | 'PASSOUT') || 'NON_PASSOUT';
    const docTypeToVerify = params.serviceSpecificData?.docTypeToVerify as string | undefined;

    // Centralized Data-Driven Fee Calculation
    const feeCalculation = studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: service.code,
      serviceName: service.name,
      passoutStatus,
      docTypeToVerify,
      copies,
      isUrgent,
      deliveryMode: params.deliveryMode || service.deliveryMode || 'BOTH'
    });

    const calculatedFee = feeCalculation.totalFee;

    const now = new Date();
    const nowIso = now.toISOString();
    const count = (db.getState().studentSectionRequests || []).length + 1;
    const requestNo = `SSR/${now.getFullYear()}/${String(count).padStart(6, '0')}`;

    const isDraft = Boolean(params.isDraft);
    const requiresPayment = calculatedFee > 0;
    const initialStatus: StudentSectionRequestStatus = isDraft 
      ? 'DRAFT' 
      : requiresPayment ? 'PAYMENT_PENDING' : 'SUBMITTED';
    const paymentStatus: StudentSectionPaymentStatus = requiresPayment ? 'PENDING' : 'NOT_REQUIRED';

    const slaDays = isUrgent ? (service.urgentProcessingDays || 1) : (service.processingDays || 2);
    const { dueDateStr } = this.calculateWorkingDaysDueDate(now, slaDays);

    const timeline: StudentSectionTimelineItem[] = [
      {
        id: `tl-${Date.now()}-1`,
        action: isDraft ? 'DRAFT_SAVED' : 'APPLICATION_CREATED',
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserRole: user.role || 'STUDENT',
        timestamp: nowIso,
        remarks: isDraft
          ? `Application draft saved for ${service.name}.`
          : `Application created for ${service.name} (${copies} ${copies > 1 ? 'copies' : 'copy'}${isUrgent ? ', URGENT' : ''}). Calculated Fee: ₹${calculatedFee}. SLA: ${slaDays} working days.`,
        status: initialStatus
      }
    ];

    if (!isDraft && requiresPayment) {
      timeline.push({
        id: `tl-${Date.now()}-2`,
        action: 'PAYMENT_PENDING',
        fromUserId: 'SYSTEM',
        fromUserName: 'ERP Financial System',
        fromUserRole: 'ACCOUNTS_ADMIN',
        timestamp: nowIso,
        remarks: `Official university service fee of ₹${calculatedFee} is required. Please proceed to payment to submit.`,
        status: 'PAYMENT_PENDING'
      });
    }

    const newRequest: StudentSectionRequest = {
      id: `ssr-${Date.now()}`,
      requestNo,
      studentId: student.id,
      studentName: student.fullName || student.name,
      enrollmentNo: student.enrollmentNo,
      admissionNo: student.admissionNumber || student.admissionId || 'ADM-2026-0089',
      applicationNumber: student.applicationNumber || 'APP/2026/0042',
      email: student.email,
      phone: student.phone,
      instituteId: student.instituteId,
      instituteName: instObj?.name || 'Swarrnim Institute of Technology',
      departmentId: student.departmentId || '',
      departmentName: deptObj?.name || 'Computer Science & Engineering',
      programId: student.programId,
      programName: progObj?.name || 'B.Tech Computer Science & Engineering',
      semesterId: student.semesterId,
      semesterName: semObj ? `Semester ${semObj.number}` : 'Semester 4',
      divisionName: divObj?.name || 'Division A',
      batchName: batchObj?.name || '2024-2028',
      academicYear: '2026-27',
      dateOfBirth: student.dateOfBirth || student.dob || '2005-04-15',
      gender: student.gender || 'Male',
      address: student.address || student.currentAddressLine1 || 'Swarrnim Campus, Bhoyan Rathod, Gandhinagar',
      guardianName: student.guardianName || student.fatherName || 'Parent / Guardian',
      guardianPhone: student.guardianPhone || student.fatherPhone || student.phone,

      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      category: service.category,
      purpose: params.purpose.trim(),
      copies,
      serviceSpecificData: {
        ...(params.serviceSpecificData || {}),
        feeBreakdown: feeCalculation.breakdownItems,
        baseFee: feeCalculation.baseFee,
        perCopyFee: feeCalculation.perCopyFee,
        additionalCopiesCount: feeCalculation.additionalCopiesCount,
        copiesFeeTotal: feeCalculation.copiesFeeTotal,
        urgentFee: feeCalculation.urgentFee,
        postalCharges: feeCalculation.postalCharges
      },

      calculatedFee,
      paymentStatus,

      isUrgent: Boolean(params.isUrgent),
      deliveryMode: 'PHYSICAL',
      deliveryAddress: params.deliveryAddress,
      attachments: params.attachments || [],

      status: initialStatus,
      expectedCompletionDate: dueDateStr,
      workingDaysDueDate: dueDateStr,
      timeline,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    db.updateState(state => {
      state.studentSectionRequests = [newRequest, ...(state.studentSectionRequests || [])];
    }, `Created Student Section Request ${requestNo}`);

    if (!isDraft) {
      db.addNotification({
        title: `New Service Request: ${requestNo}`,
        message: `${student.name} (${student.enrollmentNo}) applied for ${service.name}. Status: ${initialStatus}.`,
        module: 'REQUEST',
        timestamp: nowIso,
        targetRole: 'STUDENT_SECTION',
        linkTab: 'student-section'
      });
    }

    return newRequest;
  }

  // ============================================================================
  // 3. FEE PAYMENT & OFFICIAL RECEIPT GENERATION
  // ============================================================================

  public processPayment(
    requestId: string,
    params: {
      paymentMode: PaymentMode;
      gatewayTxId?: string;
      shouldSucceed?: boolean;
    },
    user: User
  ): { success: boolean; receiptNo?: string; error?: string } {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    if (request.paymentStatus === 'PAID') {
      throw new Error('This service application has already been paid for.');
    }

    const now = new Date().toISOString();
    const shouldSucceed = params.shouldSucceed !== false;

    if (!shouldSucceed) {
      request.paymentStatus = 'FAILED';
      request.status = 'PAYMENT_PENDING';
      request.updatedAt = now;

      request.timeline.push({
        id: `tl-${Date.now()}`,
        action: 'PAYMENT_FAILED',
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserRole: user.role,
        timestamp: now,
        remarks: `Payment attempt of ₹${request.calculatedFee} via ${params.paymentMode} failed. Status remains PAYMENT_PENDING. Please retry.`,
        status: 'PAYMENT_PENDING'
      });

      this.saveRequest(request);

      return {
        success: false,
        error: 'Payment transaction failed. Please retry.'
      };
    }

    // Successful payment path:
    const txId = params.gatewayTxId || `TXN-SSR-${Date.now()}`;
    const year = new Date().getFullYear();
    const receiptCount = (db.getFeePaymentTransactions() || []).length + 1;
    const receiptNo = `SSIU/REC/${year}-${String(year + 1).slice(-2)}/${String(receiptCount).padStart(6, '0')}`;

    const newTx: FeePaymentTransaction = {
      id: `tx-ssr-${Date.now()}`,
      studentFeeRecordId: `ssr-fee-${request.id}`,
      receiptNo,
      studentId: request.studentId,
      studentName: request.studentName,
      enrollmentNo: request.enrollmentNo,
      programId: request.programId,
      semesterId: request.semesterId || 'sem-4',
      paidAmount: request.calculatedFee,
      paymentMode: params.paymentMode,
      transactionId: txId,
      feeType: 'OTHER',
      status: 'SUCCESS',
      paymentDate: now.split('T')[0],
      remarks: `Official Fee Payment for Student Section Service: ${request.serviceName} (${request.requestNo})`,
      recordedBy: `${user.name} (${user.role})`
    };

    db.updateState(state => {
      state.feePaymentTransactions = [newTx, ...(state.feePaymentTransactions || [])];
    }, `Recorded service payment receipt ${receiptNo}`);

    // Update request state to SUBMITTED
    request.paymentStatus = 'PAID';
    request.status = 'SUBMITTED';
    request.paymentTransactionId = newTx.id;
    request.receiptNo = receiptNo;
    request.paidAt = now;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'PAYMENT_SUCCESSFUL',
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: user.role,
      timestamp: now,
      remarks: `Fee of ₹${request.calculatedFee} paid successfully via ${params.paymentMode}. Receipt generated: ${receiptNo}. Transaction Ref: ${txId}.`,
      status: 'SUBMITTED'
    });

    request.timeline.push({
      id: `tl-${Date.now() + 1}`,
      action: 'APPLICATION_SUBMITTED',
      fromUserId: 'SYSTEM',
      fromUserName: 'Student Section Desk',
      fromUserRole: 'STUDENT_SECTION',
      timestamp: now,
      remarks: `Application officially queued for verification and processing by Student Section Officers.`,
      status: 'SUBMITTED'
    });

    this.saveRequest(request);

    // Notify Student Section Staff
    db.addNotification({
      title: `New Service Application Submitted: ${request.requestNo}`,
      message: `${request.studentName} paid ₹${request.calculatedFee} and submitted application for ${request.serviceName}.`,
      module: 'REQUEST',
      timestamp: now,
      targetRole: 'STUDENT_SECTION',
      linkTab: 'student-section'
    });

    // Notify Student
    db.addNotification({
      title: `Application Submitted Successfully`,
      message: `Your application ${request.requestNo} for ${request.serviceName} has been submitted. Receipt: ${receiptNo}.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return {
      success: true,
      receiptNo
    };
  }

  // ============================================================================
  // 4. STAFF ACTIONS & LIFECYCLE WORKFLOW
  // ============================================================================

  /**
   * Action: Accept Request (SUBMITTED -> UNDER_REVIEW)
   */
  public acceptRequest(requestId: string, staffUser: User, remarks?: string): StudentSectionRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    const now = new Date().toISOString();
    request.status = 'UNDER_REVIEW';
    request.acceptedBy = staffUser.id;
    request.acceptedByName = `${staffUser.name} (${staffUser.role})`;
    request.acceptedAt = now;
    request.assignedStaffId = staffUser.id;
    request.assignedStaffName = staffUser.name;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'REQUEST_ACCEPTED',
      fromUserId: staffUser.id,
      fromUserName: staffUser.name,
      fromUserRole: staffUser.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: remarks || `Application verified and accepted by ${staffUser.name}. Under administrative review.`,
      status: 'UNDER_REVIEW'
    });

    this.saveRequest(request);

    db.addNotification({
      title: `Application Accepted: ${request.requestNo}`,
      message: `Your application for ${request.serviceName} was accepted by Student Section Officer ${staffUser.name} and is under review.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return request;
  }

  /**
   * Action: Start Processing (UNDER_REVIEW -> PROCESSING)
   */
  public startProcessingRequest(requestId: string, staffUser: User, remarks?: string): StudentSectionRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    const service = this.getServiceById(request.serviceId);
    const slaDays = request.isUrgent ? (service?.urgentProcessingDays || 1) : (service?.processingDays || 2);
    const { dueDateStr } = this.calculateWorkingDaysDueDate(new Date(), slaDays);

    const now = new Date().toISOString();
    request.status = 'PROCESSING';
    request.processedBy = staffUser.id;
    request.processedByName = `${staffUser.name} (${staffUser.role})`;
    request.processedAt = now;
    request.workingDaysDueDate = dueDateStr;
    request.expectedCompletionDate = dueDateStr;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'PROCESSING_STARTED',
      fromUserId: staffUser.id,
      fromUserName: staffUser.name,
      fromUserRole: staffUser.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: remarks || `Administrative processing initiated. Expected completion date: ${dueDateStr} (${slaDays} working days).`,
      status: 'PROCESSING'
    });

    this.saveRequest(request);

    db.addNotification({
      title: `Processing Started: ${request.requestNo}`,
      message: `Student Section has started processing your ${request.serviceName}. Expected delivery: ${dueDateStr}.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return request;
  }

  /**
   * Action: Reject Request (with MANDATORY REJECTION REASON)
   */
  public rejectRequest(requestId: string, rejectionReason: string, staffUser: User): StudentSectionRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Mandatory rejection reason must be provided when rejecting a student service application.');
    }

    const now = new Date().toISOString();
    request.status = 'REJECTED';
    request.rejectionReason = rejectionReason.trim();
    request.assignedStaffId = staffUser.id;
    request.assignedStaffName = staffUser.name;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'REQUEST_REJECTED',
      fromUserId: staffUser.id,
      fromUserName: staffUser.name,
      fromUserRole: staffUser.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: `Application rejected by ${staffUser.name}. Reason: ${rejectionReason.trim()}`,
      status: 'REJECTED'
    });

    this.saveRequest(request);

    db.addNotification({
      title: `Application Rejected: ${request.requestNo}`,
      message: `Your application for ${request.serviceName} could not be processed. Reason: ${rejectionReason.trim()}`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return request;
  }

  /**
   * Action: Generate Official Document (PROCESSING -> DOCUMENT_READY / READY)
   */
  public generateOfficialDocument(
    requestId: string,
    staffUser: User
  ): { document: StudentSectionDocument; request: StudentSectionRequest } {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    if (request.paymentStatus !== 'PAID' && request.calculatedFee > 0) {
      throw new Error('Cannot generate official document before service fee clearance.');
    }

    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const docCount = (db.getState().studentSectionDocuments || []).length + 1;
    
    // Service specific prefix
    const prefixMap: Record<string, string> = {
      CERTIFICATE: 'BON',
      TRANSCRIPT: 'TRN',
      DEGREE: 'DEG',
      MIGRATION: 'MIG',
      TRANSFER: 'TC',
      DUPLICATE_ID: 'ID',
      MARKSHEET: 'MRK',
      VERIFICATION: 'VER'
    };
    const prefix = prefixMap[request.category] || 'DOC';
    const documentNo = `SSIU/${prefix}/${year}/${String(docCount).padStart(6, '0')}`;
    const verificationCode = `SSIU-${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${year}`;

    const newDoc: StudentSectionDocument = {
      id: `doc-ssr-${Date.now()}`,
      documentNo,
      requestId: request.id,
      requestNo: request.requestNo,
      studentId: request.studentId,
      studentName: request.studentName,
      enrollmentNo: request.enrollmentNo,
      departmentName: request.departmentName,
      programName: request.programName,
      serviceName: request.serviceName,
      title: `Official ${request.serviceName} - ${request.studentName}`,
      fileUrl: `https://erp.swarrnim.edu.in/vault/documents/${documentNo.replace(/\//g, '_')}.pdf`,
      fileType: 'PDF',
      generatedBy: staffUser.id,
      generatedByName: `${staffUser.name} (${staffUser.role})`,
      generatedAt: now,
      version: 1,
      verificationCode,
      status: 'ACTIVE',
      downloadsCount: 0
    };

    db.updateState(state => {
      state.studentSectionDocuments = [newDoc, ...(state.studentSectionDocuments || [])];
    }, `Generated official document ${documentNo}`);

    // Link document to request & transition to DOCUMENT_READY
    request.documentId = newDoc.id;
    request.documentNo = newDoc.documentNo;
    request.documentUrl = newDoc.fileUrl;
    request.documentIssuedAt = now;
    request.documentReadyAt = now;
    request.status = 'DOCUMENT_READY';
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'DOCUMENT_GENERATED',
      fromUserId: staffUser.id,
      fromUserName: staffUser.name,
      fromUserRole: staffUser.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: `Official digital document ${documentNo} generated and sealed with verification token ${verificationCode}. Status is now DOCUMENT READY.`,
      status: 'DOCUMENT_READY'
    });

    this.saveRequest(request);

    // Notify Student
    db.addNotification({
      title: `Your Document is Ready: ${request.serviceName}`,
      message: `Your official ${request.serviceName} (Doc No: ${documentNo}) is ready! You can download the digital copy or collect the hardcopy from Student Section.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return { document: newDoc, request };
  }

  /**
   * Action: Mark Document Collected / Delivered (DOCUMENT_READY -> COMPLETED / COLLECTED)
   */
  public markDocumentCollected(
    requestId: string,
    staffUser: User,
    deliveryRemarks?: string
  ): StudentSectionRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Service request not found.');

    const now = new Date().toISOString();
    request.status = 'COMPLETED';
    request.collectedBy = request.studentId;
    request.collectedByName = request.studentName;
    request.collectedAt = now;
    request.deliveryOfficerName = `${staffUser.name} (${staffUser.role})`;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'DOCUMENT_COLLECTED',
      fromUserId: staffUser.id,
      fromUserName: staffUser.name,
      fromUserRole: staffUser.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: deliveryRemarks || `Original hardcopy document handed over to student ${request.studentName}. Service request completed successfully.`,
      status: 'COMPLETED'
    });

    this.saveRequest(request);

    db.addNotification({
      title: `Service Completed: ${request.requestNo}`,
      message: `Your ${request.serviceName} hardcopy has been marked as collected from Student Section. Service completed.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId,
      linkTab: 'certificates'
    });

    return request;
  }

  // ============================================================================
  // 5. SCOPED ACCESS CONTROL
  // ============================================================================

  public getScopedRequests(user?: User | null, role?: UserRole | null): StudentSectionRequest[] {
    const all = db.getState().studentSectionRequests || [];
    if (!user) return [];

    if (role === 'STUDENT') {
      return all.filter((r: StudentSectionRequest) => r.studentId === user.id || r.enrollmentNo === user.enrollmentNo || r.email === user.email);
    }

    if (role === 'STUDENT_SECTION' || role === 'SUPER_ADMIN' || role === 'REGISTRAR' || role === 'PRINCIPAL') {
      return all;
    }

    if (role === 'HOD') {
      return all.filter((r: StudentSectionRequest) => r.departmentId === user.departmentId);
    }

    return all;
  }

  public getScopedDocuments(user?: User | null, role?: UserRole | null): StudentSectionDocument[] {
    const all = db.getState().studentSectionDocuments || [];
    if (!user) return [];

    if (role === 'STUDENT') {
      return all.filter((d: StudentSectionDocument) => d.studentId === user.id || d.enrollmentNo === user.enrollmentNo);
    }

    return all;
  }

  public updateRequestStatus(
    requestId: string,
    params: {
      status: StudentSectionRequestStatus;
      remarks?: string;
      rejectionReason?: string;
      trackingNumber?: string;
    },
    user: User
  ): StudentSectionRequest {
    const request = this.getRequestById(requestId);
    if (!request) {
      throw new Error(`Request not found with ID ${requestId}`);
    }

    const now = new Date().toISOString();
    request.status = params.status;
    request.updatedAt = now;

    if (params.rejectionReason) {
      request.rejectionReason = params.rejectionReason;
    }
    if (params.trackingNumber) {
      request.trackingNumber = params.trackingNumber;
    }

    request.timeline = request.timeline || [];
    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: params.status === 'REJECTED' ? 'REJECTED' : 'STATUS_UPDATED',
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: user.role,
      toUserId: request.studentId,
      toUserName: request.studentName,
      toUserRole: 'STUDENT',
      timestamp: now,
      remarks: params.remarks || (params.status === 'REJECTED' ? `Application rejected: ${params.rejectionReason}` : `Status updated to ${params.status}`),
      status: params.status
    });

    this.saveRequest(request);

    db.addNotification({
      title: `Status Update: ${request.requestNo}`,
      message: `Your request ${request.requestNo} status has been updated to ${params.status}.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.studentId
    });

    return request;
  }

  public getRequestById(id: string): StudentSectionRequest | undefined {
    return (db.getState().studentSectionRequests || []).find((r: StudentSectionRequest) => r.id === id);
  }

  private saveRequest(request: StudentSectionRequest): void {
    db.updateState(state => {
      const requests = [...(state.studentSectionRequests || [])];
      const index = requests.findIndex(r => r.id === request.id);
      if (index >= 0) {
        requests[index] = request;
      } else {
        requests.unshift(request);
      }
      state.studentSectionRequests = requests;
    }, `Updated Student Section Request ${request.requestNo}`);
  }
}

export const studentSectionService = StudentSectionServiceEngine.getInstance();
