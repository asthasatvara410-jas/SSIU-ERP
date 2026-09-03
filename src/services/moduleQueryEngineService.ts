import { db } from './db';
import {
  User, UserRole, UserAuthorizationContext, Student, Faculty,
  NoteSheet, ApprovalRequest,
  AssetBusinessTransferRecord, AssetBusinessIssueRecord,
  AssetBusinessReturnRecord, AssetBusinessReplacementRecord,
  AssetBusinessMaintenanceRecord, AssetBusinessRequisitionRecord,
  FacultyWorkloadRecord, FacultySubjectAllocationRecord,
  MentorAssignmentRecord
} from '../types';

export interface QueryPaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryFilterOptions {
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
  semesterId?: string;
  status?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  records: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ModuleQueryEngineService {
  private static instance: ModuleQueryEngineService;

  private constructor() {}

  public static getInstance(): ModuleQueryEngineService {
    if (!ModuleQueryEngineService.instance) {
      ModuleQueryEngineService.instance = new ModuleQueryEngineService();
    }
    return ModuleQueryEngineService.instance;
  }

  /**
   * Helper to paginate and sort an authorized dataset
   */
  public paginateAndSort<T>(
    items: T[],
    pagination?: QueryPaginationOptions
  ): PaginatedResult<T> {
    const totalCount = items.length;
    const page = Math.max(1, pagination?.page || 1);
    const pageSize = Math.max(1, pagination?.pageSize || (totalCount > 0 ? totalCount : 10));
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    let sorted = [...items];
    if (pagination?.sortBy) {
      const field = pagination.sortBy as keyof T;
      const order = pagination.sortOrder === 'desc' ? -1 : 1;
      sorted.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        return (valA > valB ? 1 : -1) * order;
      });
    }

    const startIndex = (page - 1) * pageSize;
    const records = sorted.slice(startIndex, startIndex + pageSize);

    return {
      records,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * 1. Authoritative Student Query (Single Source of Truth)
   */
  public getStudentsForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<Student> {
    const allStudents = db.getStudents();
    const role = String(context.activeRole);

    let scoped = allStudents.filter(student => {
      // Student SELF Scope
      if (role === 'STUDENT') {
        return student.id === context.userId || (student as any).studentId === context.userId;
      }
      // Mentor Scope
      if (role === 'MENTOR') {
        return context.assignedStudentIds ? context.assignedStudentIds.includes(student.id) : false;
      }
      // Faculty Scope
      if (role === 'FACULTY') {
        const matchDept = !context.departmentId || student.departmentId === context.departmentId;
        const matchInst = !context.instituteId || student.instituteId === context.instituteId;
        return matchDept && matchInst;
      }
      // HOD Department Scope
      if (role === 'HOD') {
        const matchDept = !context.departmentId || student.departmentId === context.departmentId;
        const matchInst = !context.instituteId || student.instituteId === context.instituteId;
        return matchDept && matchInst;
      }
      // HOI / Principal Institute Scope
      if (role === 'PRINCIPAL') {
        return !context.instituteId || student.instituteId === context.instituteId;
      }
      // Deputy Registrar Assigned Jurisdiction
      if (role === 'DEPUTY_REGISTRAR') {
        const matchInst = !context.instituteIds || (Boolean(student.instituteId) && context.instituteIds.includes(student.instituteId!));
        const matchDept = !context.departmentIds || context.departmentIds.length === 0 || (Boolean(student.departmentId) && context.departmentIds.includes(student.departmentId!));
        return matchInst && matchDept;
      }
      // Registrar / VP / Central Admin University-wide
      return true;
    });

    // Apply Filters
    if (filters?.instituteId) scoped = scoped.filter(s => s.instituteId === filters.instituteId);
    if (filters?.departmentId) scoped = scoped.filter(s => s.departmentId === filters.departmentId);
    if (filters?.programId) scoped = scoped.filter(s => s.programId === filters.programId);
    if (filters?.status) scoped = scoped.filter(s => s.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      scoped = scoped.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
        ((s as any).studentId && ((s as any).studentId as string).toLowerCase().includes(q))
      );
    }

    return this.paginateAndSort(scoped, pagination);
  }

  /**
   * 2. Authoritative Faculty Query
   */
  public getFacultyForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<Faculty> {
    const allFaculty = db.getFaculty();
    const role = String(context.activeRole);

    let scoped = allFaculty.filter(fac => {
      if (role === 'FACULTY' || role === 'MENTOR') {
        return fac.id === context.userId || fac.departmentId === context.departmentId;
      }
      if (role === 'HOD') {
        return !context.departmentId || fac.departmentId === context.departmentId;
      }
      if (role === 'PRINCIPAL') {
        return !context.instituteId || fac.instituteId === context.instituteId;
      }
      if (role === 'DEPUTY_REGISTRAR') {
        const matchInst = !context.instituteIds || (Boolean(fac.instituteId) && context.instituteIds.includes(fac.instituteId!));
        const matchDept = !context.departmentIds || context.departmentIds.length === 0 || (Boolean(fac.departmentId) && context.departmentIds.includes(fac.departmentId!));
        return matchInst && matchDept;
      }
      return true;
    });

    if (filters?.instituteId) scoped = scoped.filter(f => f.instituteId === filters.instituteId);
    if (filters?.departmentId) scoped = scoped.filter(f => f.departmentId === filters.departmentId);
    if (filters?.status) scoped = scoped.filter(f => f.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      scoped = scoped.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.designation && f.designation.toLowerCase().includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q))
      );
    }

    return this.paginateAndSort(scoped, pagination);
  }

  /**
   * 3. Authoritative Notesheet Query
   */
  public getNotesheetsForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<NoteSheet> {
    const user = {
      id: context.userId,
      name: context.userName,
      email: context.email,
      role: context.activeRole as UserRole,
      instituteId: context.instituteId,
      departmentId: context.departmentId,
      status: 'ACTIVE'
    } as User;

    let scoped = db.getAuthorizedNotesheetsForUser(user, context.activeRole as UserRole);

    if (filters?.status) scoped = scoped.filter(n => n.status === filters.status);
    if (filters?.instituteId) scoped = scoped.filter(n => n.instituteId === filters.instituteId);
    if (filters?.departmentId) scoped = scoped.filter(n => n.departmentId === filters.departmentId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      scoped = scoped.filter(n =>
        n.subject.toLowerCase().includes(q) ||
        n.noteSheetNumber.toLowerCase().includes(q) ||
        n.creatorName.toLowerCase().includes(q)
      );
    }

    return this.paginateAndSort(scoped, pagination);
  }

  /**
   * 4. Authoritative Pending With Me Notesheet Query
   */
  public getPendingNotesheetsForUser(
    context: UserAuthorizationContext,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<NoteSheet> {
    const user = {
      id: context.userId,
      name: context.userName,
      email: context.email,
      role: context.activeRole as UserRole,
      instituteId: context.instituteId,
      departmentId: context.departmentId,
      status: 'ACTIVE'
    } as User;

    const pending = db.getPendingWithMeNotesheets(user, context.activeRole as UserRole);
    return this.paginateAndSort(pending, pagination);
  }

  /**
   * 5. Authoritative Academic Requests Query
   */
  public getRequestsForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<ApprovalRequest> {
    const allRequests = db.getApprovalRequests ? db.getApprovalRequests() : [];
    const role = String(context.activeRole);

    let scoped = allRequests.filter(req => {
      if (role === 'STUDENT') return req.applicantId === context.userId;
      if (role === 'FACULTY') return req.applicantId === context.userId || (req as any).currentAssigneeUserId === context.userId;
      if (role === 'HOD') return !context.departmentId || req.departmentId === context.departmentId;
      if (role === 'PRINCIPAL') return !context.instituteId || req.instituteId === context.instituteId;
      return true;
    });

    if (filters?.status) scoped = scoped.filter(r => r.status === filters.status);
    return this.paginateAndSort(scoped, pagination);
  }

  /**
   * 6. Authoritative Asset Master Query
   */
  public getAssetsForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<any> {
    const allAssets = (db.getState() as any).assets || [];
    const role = String(context.activeRole);

    let scoped = allAssets.filter((asset: any) => {
      if (role === 'FACULTY') return asset.currentCustodianId === context.userId;
      if (role === 'HOD') return !context.departmentId || asset.departmentId === context.departmentId;
      if (role === 'PRINCIPAL') return !context.instituteId || asset.instituteId === context.instituteId;
      return true;
    });

    if (filters?.departmentId) scoped = scoped.filter((a: any) => a.departmentId === filters.departmentId);
    if (filters?.status) scoped = scoped.filter((a: any) => a.status === filters.status);
    return this.paginateAndSort(scoped, pagination);
  }


  /**
   * 7. Authoritative Asset Transfer Query (Strictly Isolated from Asset/Return)
   */
  public getTransfersForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<AssetBusinessTransferRecord> {
    const allTransfers: AssetBusinessTransferRecord[] = (db.getState() as any).assetTransfers || [];
    return this.paginateAndSort(allTransfers, pagination);
  }

  /**
   * 8. Authoritative Asset Return Query (Strictly Isolated from Asset/Transfer)
   */
  public getReturnsForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<AssetBusinessReturnRecord> {
    const allReturns: AssetBusinessReturnRecord[] = (db.getState() as any).assetReturns || [];
    return this.paginateAndSort(allReturns, pagination);
  }

  /**
   * 9. Authoritative Asset Issue Query (Strictly Isolated from Transfer/Return)
   */
  public getIssuesForUser(
    context: UserAuthorizationContext,
    filters?: QueryFilterOptions,
    pagination?: QueryPaginationOptions
  ): PaginatedResult<AssetBusinessIssueRecord> {
    const allIssues: AssetBusinessIssueRecord[] = (db.getState() as any).assetIssues || [];
    return this.paginateAndSort(allIssues, pagination);
  }

  /**
   * 10. Reusable Live KPI Aggregator (Guaranteed Dashboard Card = List Count)
   */
  public getDashboardKPIs(context: UserAuthorizationContext): {
    totalStudents: number;
    totalFaculty: number;
    totalNotesheets: number;
    pendingNotesheetsCount: number;
    pendingRequestsCount: number;
  } {
    const studentRes = this.getStudentsForUser(context);
    const facultyRes = this.getFacultyForUser(context);
    const notesheetRes = this.getNotesheetsForUser(context);
    const pendingNotesheetRes = this.getPendingNotesheetsForUser(context);
    const requestRes = this.getRequestsForUser(context, { status: 'PENDING' });

    return {
      totalStudents: studentRes.totalCount,
      totalFaculty: facultyRes.totalCount,
      totalNotesheets: notesheetRes.totalCount,
      pendingNotesheetsCount: pendingNotesheetRes.totalCount,
      pendingRequestsCount: requestRes.totalCount
    };
  }
}

export const moduleQueryEngineService = ModuleQueryEngineService.getInstance();
