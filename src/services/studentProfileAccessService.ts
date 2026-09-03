// ==============================================================================
// SWARRNIM UNIVERSITY ERP — CENTRAL STUDENT PROFILE-FIRST ACCESS SERVICE
// ==============================================================================

import { db } from './db';
import { mentorAssignmentService } from './mentorAssignmentService';
import { 
  Student, StudentStatus, StudentDocument, DocumentVerificationRecord, 
  User, UserRole, StudentAcademicHistoryRecord, Institute, Department, Program, Semester, Batch, Division
} from '../types';

export interface StudentIdentitySummary {
  id: string;
  name: string;
  enrollmentNo: string;
  photo?: string;
  gender: string;
  email: string;
  phone?: string;
  instituteId: string;
  instituteName: string;
  departmentId?: string;
  departmentName?: string;
  programId: string;
  programName: string;
  semesterId: string;
  semesterNumber: number;
  divisionName?: string;
  batchName?: string;
  academicYearName?: string;
  studentType: 'DOMESTIC' | 'INTERNATIONAL';
  status: StudentStatus | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED';
  abcId?: string;
  abcIdStatus?: string;
}

export interface StudentProfileData {
  student: Student;
  institute?: Institute;
  department?: Department;
  program?: Program;
  semester?: Semester;
  batch?: Batch;
  division?: Division;
  mentor?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    designation?: string;
  };
  attendanceStats?: {
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
    subjectStats: Record<string, { subjectName: string; total: number; present: number }>;
  };
  academicHistory: StudentAcademicHistoryRecord[];
  allowedSections: Array<
    | 'OVERVIEW'
    | 'PERSONAL'
    | 'ACADEMIC'
    | 'DOCUMENTS'
    | 'ATTENDANCE'
    | 'EXAMINATIONS'
    | 'FEES'
    | 'REQUESTS'
    | 'NOTESHEETS'
    | 'VERIFICATION_HISTORY'
    | 'AUDIT_HISTORY'
  >;
}

export interface StudentHistoryTimelineItem {
  id: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'EXAMINATION' | 'FEE' | 'REQUEST' | 'DOCUMENT' | 'ADMIN';
  action: string;
  title: string;
  description: string;
  status?: string;
  performedBy?: string;
  performedByRole?: string;
  timestamp: string;
  referenceId?: string;
  referenceType?: string;
}

export class StudentProfileAccessService {
  private static instance: StudentProfileAccessService;

  private constructor() {}

  public static getInstance(): StudentProfileAccessService {
    if (!StudentProfileAccessService.instance) {
      StudentProfileAccessService.instance = new StudentProfileAccessService();
    }
    return StudentProfileAccessService.instance;
  }

  // ============================================================================
  // 1. RBAC SCOPING & AUTHORIZATION CHECK
  // ============================================================================

  /**
   * Check if a staff user is authorized to access a given student's record
   */
  public isUserAuthorizedForStudent(user: User, role: UserRole, student: Student): boolean {
    if (!user || !role || !student) return false;

    // Student can only access their own profile
    if (role === 'STUDENT') {
      return user.id === student.id || user.enrollmentNo === student.enrollmentNo || user.email === student.email;
    }

    // University-level authorities have university-wide access
    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PROVOST', 'PRESIDENT', 'REGISTRAR'].includes(role)) {
      return true;
    }

    // Deputy Registrar: Checked against assigned institute/department scope
    if (role === 'DEPUTY_REGISTRAR') {
      const scopes = db.getDeputyRegistrarScopeByUserId(user.id);
      if (scopes.length === 0) return true; // Default fallback if not scoped
      return scopes.some(s => {
        const matchInst = !s.instituteId || s.instituteId === student.instituteId;
        const matchDept = s.departmentIds.length > 0
          ? (s.departmentIds.includes('ALL') || (Boolean(student.departmentId) && s.departmentIds.includes(student.departmentId!)))
          : true;
        return matchInst && matchDept;
      });
    }

    // Principal / HOI: Authorized for own institute
    if (role === 'PRINCIPAL') {
      return Boolean(user.instituteId) && user.instituteId === student.instituteId;
    }

    // HOD: Authorized for own department
    if (role === 'HOD') {
      const uInstMatch = !user.instituteId || user.instituteId === student.instituteId;
      const uDept = user.departmentId;
      const sDept = student.departmentId;
      if (!uDept || !sDept) return uInstMatch;
      return uInstMatch && (uDept === sDept || uDept.toUpperCase() === sDept.toUpperCase());
    }

    // Mentor: Strictly authorized ONLY for actively assigned mentees within department & institute scope
    if (role === 'MENTOR') {
      const activeMentor = mentorAssignmentService.getActiveMentorForStudent(student.id);
      const isAssigned = (Boolean(activeMentor) && activeMentor?.mentorFacultyId === user.id) || student.mentorId === user.id;
      if (!isAssigned) return false;
      if (user.instituteId && student.instituteId && user.instituteId !== student.instituteId) return false;
      if (user.departmentId && student.departmentId && user.departmentId !== student.departmentId) return false;
      return true;
    }

    // Faculty: Department students, subject students, or assigned mentees
    if (role === 'FACULTY') {
      // 1. Check if assigned as mentor
      const activeMentor = mentorAssignmentService.getActiveMentorForStudent(student.id);
      if (activeMentor && activeMentor.mentorFacultyId === user.id) return true;
      if (student.mentorId === user.id) return true;

      // 2. Department match
      if (user.departmentId && student.departmentId) {
        if (user.departmentId === student.departmentId || user.departmentId.toUpperCase() === student.departmentId.toUpperCase()) {
          return true;
        }
      }

      // 3. Institute match fallback
      if (user.instituteId && student.instituteId && user.instituteId === student.instituteId) {
        return true;
      }

      return false;
    }

    // Student Section: Institute-level or university-wide
    if (role === 'STUDENT_SECTION') {
      if (!user.instituteId) return true;
      return user.instituteId === student.instituteId || user.instituteId === 'inst-1';
    }

    // Examination Cell: All students in institute / university
    if (role === 'EXAM_CELL') {
      if (!user.instituteId) return true;
      return user.instituteId === student.instituteId || user.instituteId === 'inst-1';
    }

    // Accounts / Finance: All students in institute / university
    if (role === 'ACCOUNTS_ADMIN') {
      if (!user.instituteId) return true;
      return user.instituteId === student.instituteId || user.instituteId === 'inst-1';
    }

    // Hostel / Transport / Campus Admins
    if (['HOSTEL_ADMIN', 'TRANSPORT_ADMIN', 'LIBRARY_ADMIN', 'MAINTENANCE_ADMIN'].includes(role)) {
      return true;
    }

    return false;
  }

  // ============================================================================
  // 2. SEARCH STUDENTS (MINIMAL IDENTITY PREVIEW — NO DOCUMENTS)
  // ============================================================================

  public searchStudents(
    user: User,
    role: UserRole,
    query?: string,
    filters?: {
      instituteId?: string;
      departmentId?: string;
      programId?: string;
      semesterId?: string;
      status?: string;
      studentType?: string;
    },
    page: number = 1,
    limit: number = 20
  ): {
    records: StudentIdentitySummary[];
    total: number;
    page: number;
    totalPages: number;
  } {
    if (role === 'STUDENT') {
      throw new Error('403 Forbidden: Students are not authorized to access the staff global student search directory.');
    }

    const allStudents = db.getStudents();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const semesters = db.getSemesters();
    const batches = db.getBatches();
    const divisions = db.getDivisions();
    const academicYears = db.getAcademicYears();

    // 1. Filter by user's authorized scope
    const scopedStudents = allStudents.filter(s => this.isUserAuthorizedForStudent(user, role, s));

    // 2. Filter by parameters
    const cleanQuery = (query || '').trim().toLowerCase();

    const filtered = scopedStudents.filter(student => {
      // Query search across multiple fields
      if (cleanQuery) {
        const nameMatch = student.name?.toLowerCase().includes(cleanQuery);
        const enrollMatch = student.enrollmentNo?.toLowerCase().includes(cleanQuery);
        const tempMatch = student.temporaryEnrollmentNumber?.toLowerCase().includes(cleanQuery);
        const finalMatch = student.finalEnrollmentNumber?.toLowerCase().includes(cleanQuery);
        const idMatch = student.id?.toLowerCase().includes(cleanQuery);
        const emailMatch = student.email?.toLowerCase().includes(cleanQuery);
        const phoneMatch = student.phone?.includes(cleanQuery);
        const abcMatch = student.abcId?.toLowerCase().includes(cleanQuery);

        const prog = programs.find(p => p.id === student.programId);
        const progMatch = prog?.name?.toLowerCase().includes(cleanQuery) || prog?.code?.toLowerCase().includes(cleanQuery);

        const dept = departments.find(d => d.id === student.departmentId);
        const deptMatch = dept?.name?.toLowerCase().includes(cleanQuery) || dept?.code?.toLowerCase().includes(cleanQuery);

        if (!nameMatch && !enrollMatch && !tempMatch && !finalMatch && !idMatch && !emailMatch && !phoneMatch && !abcMatch && !progMatch && !deptMatch) {
          return false;
        }
      }

      // Filter: Institute
      if (filters?.instituteId && filters.instituteId !== 'ALL') {
        if (student.instituteId !== filters.instituteId) return false;
      }

      // Filter: Department
      if (filters?.departmentId && filters.departmentId !== 'ALL') {
        if (student.departmentId !== filters.departmentId) return false;
      }

      // Filter: Program
      if (filters?.programId && filters.programId !== 'ALL') {
        if (student.programId !== filters.programId) return false;
      }

      // Filter: Semester
      if (filters?.semesterId && filters.semesterId !== 'ALL') {
        if (student.semesterId !== filters.semesterId) return false;
      }

      // Filter: Status
      if (filters?.status && filters.status !== 'ALL') {
        if (student.status !== filters.status) return false;
      }

      // Filter: Student Type
      if (filters?.studentType && filters.studentType !== 'ALL') {
        if (student.studentType !== filters.studentType) return false;
      }

      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (safePage - 1) * limit;
    const pagedStudents = filtered.slice(startIndex, startIndex + limit);

    // Map to minimal Identity Preview (strictly NO document file previews or drive URLs)
    const records: StudentIdentitySummary[] = pagedStudents.map(s => {
      const inst = institutes.find(i => i.id === s.instituteId);
      const dept = departments.find(d => d.id === s.departmentId);
      const prog = programs.find(p => p.id === s.programId);
      const sem = semesters.find(sm => sm.id === s.semesterId);
      const div = divisions.find(dv => dv.id === s.divisionId);
      const bat = batches.find(b => b.id === s.batchId);
      const ay = academicYears.find(a => a.id === s.academicYearId);

      return {
        id: s.id,
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        photo: s.photo,
        gender: s.gender,
        email: s.email,
        phone: s.phone,
        instituteId: s.instituteId,
        instituteName: inst?.name || 'Swarrnim Institute',
        departmentId: s.departmentId,
        departmentName: dept?.name || 'Academic Department',
        programId: s.programId,
        programName: prog?.name || 'Degree Program',
        semesterId: s.semesterId,
        semesterNumber: sem?.number || 1,
        divisionName: div?.name || 'Division A',
        batchName: bat?.name || 'Current Batch',
        academicYearName: ay?.name || '2026-2027',
        studentType: s.studentType || 'DOMESTIC',
        status: s.status || 'ACTIVE',
        abcId: s.abcId,
        abcIdStatus: s.abcIdStatus
      };
    });

    return {
      records,
      total,
      page: safePage,
      totalPages
    };
  }

  /**
   * 2B. SERVER-SIDE PAGINATED SEARCH
   * Queries real NestJS Backend API /api/v1/students with fallback to local mock database.
   */
  public async searchStudentsServer(
    user: User,
    role: UserRole,
    searchQuery: string = '',
    filters?: {
      instituteId?: string;
      departmentId?: string;
      programId?: string;
      semesterId?: string;
      status?: string;
      studentType?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: StudentIdentitySummary[]; total: number; page: number; totalPages: number }> {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(Math.min(limit, 100)));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filters?.instituteId && filters.instituteId !== 'ALL') params.set('instituteId', filters.instituteId);
      if (filters?.departmentId && filters.departmentId !== 'ALL') params.set('departmentId', filters.departmentId);
      if (filters?.programId && filters.programId !== 'ALL') params.set('programId', filters.programId);
      if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/students?${params.toString()}`, {
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        const data = Array.isArray(payload) ? payload : (payload.data || []);
        const total = typeof payload.total === 'number' ? payload.total : data.length;
        const totalPages = typeof payload.totalPages === 'number' ? payload.totalPages : Math.ceil(total / limit) || 1;

        if (total > 0) {
          const records: StudentIdentitySummary[] = data.map((s: any) => ({
            id: s.id,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
            enrollmentNo: s.enrollmentNo,
            photo: s.photo || '',
            gender: s.gender || 'OTHER',
            email: s.email || '',
            phone: s.phone || '',
            instituteId: s.instituteId || '',
            instituteName: s.institute?.name || 'Swarrnim Institute',
            departmentId: s.departmentId || '',
            departmentName: s.department?.name || 'Academic Department',
            programId: s.batch?.program?.id || '',
            programName: s.batch?.program?.name || 'Degree Program',
            semesterId: s.semesterId || '',
            semesterNumber: s.semesterNumber || 1,
            divisionName: s.divisionName || 'Division A',
            batchName: s.batch?.code || 'Current Batch',
            academicYearName: '2026-2027',
            studentType: s.studentType || 'DOMESTIC',
            status: s.status || 'ACTIVE',
            abcId: s.abcId,
            abcIdStatus: s.abcIdStatus,
          }));

          return {
            records,
            total,
            page,
            totalPages,
          };
        }
      }
    } catch (e) {
      // Fallback to local memory
    }

    return this.searchStudents(user, role, searchQuery, filters, page, limit);
  }

  // ============================================================================
  // 3. GET STUDENT PROFILE (CENTRAL AUTHORIZED GATEWAY)
  // ============================================================================

  public getStudentProfile(user: User, role: UserRole, studentId: string): StudentProfileData {
    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) {
      throw new Error('Student record not found in university master directory.');
    }

    // Authorization & Scope Enforcement
    if (!this.isUserAuthorizedForStudent(user, role, student)) {
      throw new Error('403 Forbidden: You do not have permission to view this student profile.');
    }

    const institute = db.getInstituteById(student.instituteId);
    const department = student.departmentId ? db.getDepartmentById(student.departmentId) : undefined;
    const program = db.getProgramById(student.programId);
    const semester = db.getSemesterById(student.semesterId);
    const batch = db.getBatchById(student.batchId);
    const division = db.getDivisionById(student.divisionId);

    // Resolve assigned mentor
    let mentorData: StudentProfileData['mentor'] = undefined;
    const activeAssignment = mentorAssignmentService.getActiveMentorForStudent(student.id);
    if (activeAssignment && activeAssignment.status === 'ACTIVE') {
      mentorData = {
        id: activeAssignment.mentorFacultyId,
        name: activeAssignment.mentorName,
        email: activeAssignment.mentorEmail,
        phone: activeAssignment.mentorPhone
      };
    } else if (student.mentorId) {
      const fac = db.getFaculty().find(f => f.id === student.mentorId);
      if (fac) {
        mentorData = {
          id: fac.id,
          name: fac.name,
          email: fac.email,
          phone: fac.phone,
          designation: fac.designation
        };
      }
    }

    // Determine RBAC allowed sections
    const allowedSections: StudentProfileData['allowedSections'] = ['OVERVIEW', 'PERSONAL', 'ACADEMIC'];

    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PROVOST', 'PRESIDENT', 'PRINCIPAL', 'HOD', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'STUDENT_SECTION'].includes(role)) {
      allowedSections.push('DOCUMENTS', 'ATTENDANCE', 'EXAMINATIONS', 'FEES', 'REQUESTS', 'NOTESHEETS', 'VERIFICATION_HISTORY', 'AUDIT_HISTORY');
    } else if (role === 'FACULTY' || role === 'MENTOR') {
      allowedSections.push('DOCUMENTS', 'ATTENDANCE', 'EXAMINATIONS', 'REQUESTS');
    } else if (role === 'EXAM_CELL') {
      allowedSections.push('DOCUMENTS', 'ATTENDANCE', 'EXAMINATIONS', 'REQUESTS');
    } else if (role === 'ACCOUNTS_ADMIN') {
      allowedSections.push('DOCUMENTS', 'FEES', 'REQUESTS');
    } else if (role === 'STUDENT') {
      allowedSections.push('DOCUMENTS', 'ATTENDANCE', 'EXAMINATIONS', 'FEES', 'REQUESTS');
    }

    const attendanceStats = db.getStudentAttendanceStats(student.id);

    return {
      student,
      institute,
      department,
      program,
      semester,
      batch,
      division,
      mentor: mentorData,
      attendanceStats,
      academicHistory: student.academicHistory || [],
      allowedSections
    };
  }

  // ============================================================================
  // 4. GET STUDENT DOCUMENTS (GATED BY RBAC & CATEGORY)
  // ============================================================================

  public getStudentDocuments(user: User, role: UserRole, studentId: string): StudentDocument[] {
    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) {
      throw new Error('Student record not found.');
    }

    if (!this.isUserAuthorizedForStudent(user, role, student)) {
      throw new Error('403 Forbidden: You do not have permission to view documents for this student.');
    }

    const allDocs = db.getStudentDocuments().filter(d => d.studentId === student.id);

    // Category-level filtering based on user role
    if (role === 'ACCOUNTS_ADMIN') {
      return allDocs.filter(d => d.category === 'CERTIFICATE' || d.category === 'IDENTITY' || d.title.includes('Fee') || d.title.includes('Bank') || d.title.includes('Income'));
    }

    if (role === 'EXAM_CELL') {
      return allDocs.filter(d => d.category === 'ACADEMIC' || d.category === 'IDENTITY' || d.category === 'CERTIFICATE');
    }

    if ((role === 'FACULTY' || role === 'MENTOR') && user.id !== student.mentorId) {
      return allDocs.filter(d => d.category === 'ACADEMIC' || d.category === 'CERTIFICATE');
    }

    return allDocs;
  }

  // ============================================================================
  // 5. GET DOCUMENT FILE / PREVIEW WITH DIRECT URL TAMPER BLOCK & AUDIT LOG
  // ============================================================================

  public getStudentDocumentFile(
    user: User,
    role: UserRole,
    studentId: string,
    documentId: string,
    actionType: 'VIEW' | 'PREVIEW' | 'DOWNLOAD' = 'VIEW'
  ): {
    document: StudentDocument;
    fileUrl: string;
    fileName: string;
    isAuthorized: boolean;
  } {
    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) {
      throw new Error('404 Not Found: Student record does not exist.');
    }

    // 1. Scoping Check
    if (!this.isUserAuthorizedForStudent(user, role, student)) {
      this.logDocumentAudit('UNAUTHORIZED_ACCESS_ATTEMPT', user, student, documentId, `Attempted unauthorized ${actionType} on document`);
      throw new Error('403 Forbidden: You are not authorized to view this student\'s documents.');
    }

    // 2. Document Existence Check
    const doc = db.getStudentDocuments().find(d => (d.studentId === student.id || d.studentId === studentId) && (d.id === documentId || d.title === documentId));
    if (!doc) {
      throw new Error('404 Not Found: Requested document does not exist in student document vault.');
    }

    // 3. Category Permission Check
    const allowedDocs = this.getStudentDocuments(user, role, student.id);
    if (!allowedDocs.some(d => d.id === doc.id)) {
      this.logDocumentAudit('UNAUTHORIZED_CATEGORY_ATTEMPT', user, student, doc.title, `Attempted unauthorized category access: ${doc.category}`);
      throw new Error(`403 Forbidden: Your role (${role}) is not authorized to access documents in category ${doc.category}.`);
    }

    // 4. Record Audit Log
    this.logDocumentAudit(
      actionType === 'DOWNLOAD' ? 'DOWNLOAD_STUDENT_DOCUMENT' : 'VIEW_STUDENT_DOCUMENT',
      user,
      student,
      doc.title,
      `Action: ${actionType} on document "${doc.title}" (Status: ${doc.status})`
    );

    const safeFileUrl = doc.fileUrl || `/api/documents/secure-vault/${student.id}/${doc.id}`;

    return {
      document: doc,
      fileUrl: safeFileUrl,
      fileName: doc.fileName || `${doc.title.replace(/\s+/g, '_')}.pdf`,
      isAuthorized: true
    };
  }

  // ============================================================================
  // 6. VERIFY OR REJECT STUDENT DOCUMENT
  // ============================================================================

  public verifyStudentDocument(
    user: User,
    role: UserRole,
    studentId: string,
    documentId: string,
    action: 'VERIFY' | 'REJECT',
    remarks?: string,
    rejectionReason?: string
  ): StudentDocument {
    // Only authorized verification roles
    const allowedVerifyRoles: UserRole[] = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRINCIPAL', 'REGISTRAR', 'HOD', 'STUDENT_SECTION'];
    if (!allowedVerifyRoles.includes(role)) {
      throw new Error(`403 Forbidden: Users with role "${role}" are not authorized to verify official university documents.`);
    }

    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) throw new Error('Student record not found.');

    if (!this.isUserAuthorizedForStudent(user, role, student)) {
      throw new Error('403 Forbidden: You do not have permission to verify documents for students outside your scope.');
    }

    const docs = db.getStudentDocuments();
    const docIndex = docs.findIndex(d => (d.studentId === student.id) && (d.id === documentId || d.title === documentId));
    if (docIndex === -1) throw new Error('Document not found in vault.');

    const doc = docs[docIndex];
    const now = new Date().toISOString();
    const isApproved = action === 'VERIFY';

    doc.status = isApproved ? 'VERIFIED' : 'REJECTED';
    doc.isLocked = isApproved; // Lock when verified
    doc.verifiedBy = `${user.name} (${user.role})`;
    doc.verifiedAt = now;
    if (remarks) doc.remarks = remarks.trim();
    if (rejectionReason) doc.rejectionReason = rejectionReason.trim();
    doc.version = (doc.version || 1) + 1;

    // Append to verification history
    const vRecord: DocumentVerificationRecord = {
      id: `dvr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      documentId: doc.id,
      documentTitle: doc.title,
      action: isApproved ? 'VERIFIED' : 'REJECTED',
      status: doc.status,
      verifiedByUserId: user.id,
      verifiedByName: user.name,
      verifiedByRole: user.role,
      timestamp: now,
      remarks: remarks?.trim(),
      rejectionReason: rejectionReason?.trim()
    };

    if (!doc.verificationHistory) doc.verificationHistory = [];
    doc.verificationHistory.unshift(vRecord);

    docs[docIndex] = doc;
    db.updateState(state => {
      state.studentDocuments = docs;
    }, `${isApproved ? 'Verified' : 'Rejected'} document ${doc.title} for ${student.name}`);

    // Audit Log
    this.logDocumentAudit(
      isApproved ? 'VERIFY_STUDENT_DOCUMENT' : 'REJECT_STUDENT_DOCUMENT',
      user,
      student,
      doc.title,
      `Document status updated to ${doc.status}. Remarks: ${remarks || rejectionReason || 'None'}`
    );

    // Notify Student
    db.addNotification({
      type: isApproved ? 'APPROVAL_COMPLETED' : 'REJECTION',
      targetUserId: student.id,
      title: `Document ${isApproved ? 'Verified' : 'Rejected'}: ${doc.title}`,
      message: `Your document "${doc.title}" has been marked ${doc.status} by ${user.name} (${user.role}). ${remarks || rejectionReason || ''}`,
      module: 'DOCUMENT',
      referenceId: doc.id,
      referenceType: 'STUDENT_DOCUMENT',
      linkTab: 'documents',
      priority: isApproved ? 'NORMAL' : 'HIGH'
    });

    return doc;
  }

  // ============================================================================
  // 7. GET CONSOLIDATED STUDENT HISTORY
  // ============================================================================

  public getStudentHistory(user: User, role: UserRole, studentId: string): StudentHistoryTimelineItem[] {
    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) throw new Error('Student record not found.');

    if (!this.isUserAuthorizedForStudent(user, role, student)) {
      throw new Error('403 Forbidden: You do not have permission to view history for this student.');
    }

    const timeline: StudentHistoryTimelineItem[] = [];

    // 1. Academic History
    (student.academicHistory || []).forEach((ah, idx) => {
      timeline.push({
        id: `ah-${idx}`,
        category: 'ACADEMIC',
        action: `SEMESTER_${ah.semesterNumber}_${ah.status}`,
        title: `Completed Semester ${ah.semesterNumber} (${ah.academicYearName})`,
        description: `Status: ${ah.status} • SPI: ${ah.spi || '-'} • CPI: ${ah.cpi || '-'} • Attendance: ${ah.attendancePercentage ? `${ah.attendancePercentage}%` : '-'}`,
        status: ah.status,
        timestamp: ah.completedDate || '2026-01-01',
        referenceId: ah.id,
        referenceType: 'ACADEMIC_HISTORY'
      });
    });

    // 2. Document Uploads & Verifications
    const docs = db.getStudentDocuments().filter(d => d.studentId === student.id);
    docs.forEach(doc => {
      timeline.push({
        id: `doc-up-${doc.id}`,
        category: 'DOCUMENT',
        action: 'DOCUMENT_UPLOADED',
        title: `Uploaded Document: ${doc.title}`,
        description: `Category: ${doc.category} • File: ${doc.fileName} (${doc.fileSize})`,
        status: doc.status,
        performedBy: student.name,
        performedByRole: 'STUDENT',
        timestamp: doc.uploadDate,
        referenceId: doc.id,
        referenceType: 'STUDENT_DOCUMENT'
      });

      (doc.verificationHistory || []).forEach((vh, vIdx) => {
        timeline.push({
          id: `doc-ver-${doc.id}-${vIdx}`,
          category: 'DOCUMENT',
          action: `DOCUMENT_${vh.action}`,
          title: `Document ${vh.action}: ${doc.title}`,
          description: `Status: ${vh.status} • Remarks: ${vh.remarks || vh.rejectionReason || 'Verified'}`,
          status: vh.status,
          performedBy: vh.verifiedByName,
          performedByRole: vh.verifiedByRole,
          timestamp: vh.timestamp,
          referenceId: doc.id,
          referenceType: 'STUDENT_DOCUMENT'
        });
      });
    });

    // 3. Service Requests
    const reqs = (db.getState().studentSectionRequests || []).filter((r: any) => r.studentId === student.id);
    reqs.forEach((r: any) => {
      timeline.push({
        id: `req-${r.id}`,
        category: 'REQUEST',
        action: `SERVICE_REQUEST_${r.status}`,
        title: `Service Application: ${r.serviceName || 'Document Request'}`,
        description: `Request No: ${r.requestNo} • Status: ${r.status} • Fee: ₹${r.calculatedFee || 0} (${r.paymentStatus})`,
        status: r.status,
        performedBy: r.studentName,
        performedByRole: 'STUDENT',
        timestamp: r.createdAt || '2026-08-01',
        referenceId: r.requestNo || r.id,
        referenceType: 'SERVICE_REQUEST'
      });
    });

    // 4. Fee Payment Transactions
    const txs = db.getFeePaymentTransactions().filter(t => t.studentId === student.id);
    txs.forEach(tx => {
      timeline.push({
        id: `tx-${tx.id}`,
        category: 'FEE',
        action: 'FEE_PAYMENT',
        title: `Fee Payment Received: ₹${tx.paidAmount.toLocaleString('en-IN')}`,
        description: `Receipt: ${tx.receiptNo} • Mode: ${tx.paymentMode} • Ref: ${tx.transactionId}`,
        status: tx.status,
        performedBy: tx.recordedBy || student.name,
        timestamp: tx.paymentDate,
        referenceId: tx.receiptNo,
        referenceType: 'FEE_RECEIPT'
      });
    });

    // Sort descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
  }

  // ============================================================================
  // 8. AUDIT LOGGING HELPER
  // ============================================================================

  private logDocumentAudit(
    action: string,
    user: User,
    student: Student,
    documentTitleOrId: string,
    details: string
  ): void {
    db.logAudit(
      action,
      'STUDENT_DOCUMENTS',
      `User ${user.name} (${user.role}) performed ${action} on student ${student.name} (${student.enrollmentNo}) - Document: ${documentTitleOrId}. ${details}`,
      user.name,
      user.role
    );
  }
}

export const studentProfileAccessService = StudentProfileAccessService.getInstance();
