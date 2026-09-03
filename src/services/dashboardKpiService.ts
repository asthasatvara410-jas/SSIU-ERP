import { db } from './db';
import { moduleQueryEngineService } from './moduleQueryEngineService';
import {
  User, UserRole, UserAuthorizationContext, NoteSheet,
  ApprovalRequest, Student, Faculty
} from '../types';

export interface DashboardKPICard {
  kpiId: string;
  title: string;
  description: string;
  value: number | string;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  trend?: string;
  drillDownRoute: string;
  category: 'ATTENTION' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GOVERNANCE' | 'INVENTORY';
}

export interface AttentionItem {
  id: string;
  title: string;
  entityType: 'NOTESHEET' | 'REQUEST' | 'ATTENDANCE' | 'EXAMINATION' | 'TASK';
  entityId: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  actionRoute: string;
  summary: string;
}

export interface RiskAlertItem {
  id: string;
  title: string;
  riskCategory: 'ATTENDANCE_DEFICIT' | 'EXAM_BACKLOG' | 'PENDING_APPROVAL_SLA' | 'UNALLOCATED_WORKLOAD' | 'STAFFING';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  affectedEntityId?: string;
  recommendedAction: string;
}

export interface UniversalDashboardPayload {
  dashboardType: 'REGISTRAR' | 'HOI' | 'HOD' | 'FACULTY' | 'MENTOR' | 'DEPUTY_REGISTRAR' | 'STUDENT' | 'MULTI_ROLE';
  scopeLabel: string;
  academicYear: string;
  semesterTerm: string;
  attentionItems: AttentionItem[];
  kpis: DashboardKPICard[];
  risks: RiskAlertItem[];
  recentActivity: Array<{ id: string; title: string; timestamp: string; actor: string }>;
  quickActions: Array<{ id: string; label: string; icon?: string; route: string; permission: string }>;
  subSections?: Record<string, any>;
}

class DashboardKpiService {
  private static instance: DashboardKpiService;

  private constructor() {}

  public static getInstance(): DashboardKpiService {
    if (!DashboardKpiService.instance) {
      DashboardKpiService.instance = new DashboardKpiService();
    }
    return DashboardKpiService.instance;
  }

  /**
   * Central role-aware & scope-aware dashboard engine
   */
  public getDashboardForUser(context: UserAuthorizationContext): UniversalDashboardPayload {
    const role = String(context.activeRole);
    const assignedRoles = context.assignedRoles || [context.activeRole];
    const isMultiRole = assignedRoles.length > 1;

    // 1. Attention Engine: Collect actionable items pending with current user
    const pendingNotesheets = moduleQueryEngineService.getPendingNotesheetsForUser(context);
    const pendingRequests = moduleQueryEngineService.getRequestsForUser(context, { status: 'PENDING' });

    const attentionItems: AttentionItem[] = [];

    pendingNotesheets.records.forEach(ns => {
      attentionItems.push({
        id: `att-ns-${ns.id}`,
        title: `Notesheet Approval Pending: ${ns.noteSheetNumber}`,
        entityType: 'NOTESHEET',
        entityId: ns.id,
        severity: ns.financialRequirement ? 'HIGH' : 'MEDIUM',
        createdAt: ns.createdAt,
        actionRoute: `/reg-notesheet-details/${ns.id}`,
        summary: `${ns.subject} (${ns.department || 'Academic'})`
      });
    });

    pendingRequests.records.forEach(req => {
      attentionItems.push({
        id: `att-req-${req.id}`,
        title: `Academic Request Pending: ${req.id}`,
        entityType: 'REQUEST',
        entityId: req.id,
        severity: 'MEDIUM',
        createdAt: req.createdAt,
        actionRoute: `/requests/${req.id}`,
        summary: req.description || req.title || String(req.category)
      });
    });



    // 2. Risk Engine: Identify real data-driven risks
    const risks: RiskAlertItem[] = [];
    if (pendingNotesheets.totalCount > 5) {
      risks.push({
        id: 'risk-ns-sla',
        title: 'Notesheet Processing SLA Backlog',
        riskCategory: 'PENDING_APPROVAL_SLA',
        severity: 'HIGH',
        description: `${pendingNotesheets.totalCount} notesheets are awaiting your review.`,
        recommendedAction: 'Process oldest pending notesheet endorsements.'
      });
    }

    // 3. Dynamic KPI Query Resolution
    const kpis: DashboardKPICard[] = [];

    // Attention KPI
    kpis.push({
      kpiId: 'kpi-pending-notesheets',
      title: 'Pending Notesheets',
      description: 'Notesheets currently awaiting your action',
      value: pendingNotesheets.totalCount,
      status: pendingNotesheets.totalCount > 0 ? 'WARNING' : 'NORMAL',
      drillDownRoute: '/reg-notesheets-pending',
      category: 'ATTENTION'
    });

    kpis.push({
      kpiId: 'kpi-pending-requests',
      title: 'Pending Requests',
      description: 'Academic & administrative requests awaiting endorsement',
      value: pendingRequests.totalCount,
      status: pendingRequests.totalCount > 0 ? 'WARNING' : 'NORMAL',
      drillDownRoute: '/requests?status=PENDING',
      category: 'ATTENTION'
    });

    // Scope-Specific KPIs
    if (role === 'REGISTRAR' || role === 'VICE_PRESIDENT') {
      const allInst = db.getInstitutes();
      const allDepts = db.getDepartments();
      const allStudents = moduleQueryEngineService.getStudentsForUser(context);
      const allFaculty = moduleQueryEngineService.getFacultyForUser(context);
      const allNotes = moduleQueryEngineService.getNotesheetsForUser(context);

      kpis.push(
        {
          kpiId: 'kpi-reg-institutes',
          title: 'Total Institutes',
          description: 'Accredited University Constituent Institutes',
          value: allInst.length,
          status: 'SUCCESS',
          drillDownRoute: '/institutes',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-reg-departments',
          title: 'Total Departments',
          description: 'Active Academic Departments',
          value: allDepts.length,
          status: 'NORMAL',
          drillDownRoute: '/departments',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-reg-students',
          title: 'Total Students',
          description: 'University-wide Enrolled Students',
          value: allStudents.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/students',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-reg-faculty',
          title: 'Total Faculty',
          description: 'Teaching & Research Faculty Cadre',
          value: allFaculty.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/faculty',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-reg-notesheets',
          title: 'University Notesheets',
          description: 'Total University Proposals in Lifecycle',
          value: allNotes.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/reg-notesheets-register',
          category: 'GOVERNANCE'
        }
      );
    } else if (role === 'PRINCIPAL') {
      const instStudents = moduleQueryEngineService.getStudentsForUser(context);
      const instFaculty = moduleQueryEngineService.getFacultyForUser(context);
      const instDepts = db.getDepartments().filter(d => d.instituteId === context.instituteId);

      kpis.push(
        {
          kpiId: 'kpi-hoi-departments',
          title: 'Institute Departments',
          description: 'Constituent Academic Departments',
          value: instDepts.length,
          status: 'NORMAL',
          drillDownRoute: '/departments',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-hoi-students',
          title: 'Institute Students',
          description: 'Enrolled Students in Institute',
          value: instStudents.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/students',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-hoi-faculty',
          title: 'Institute Faculty',
          description: 'Faculty members appointed to Institute',
          value: instFaculty.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/faculty',
          category: 'ACADEMIC'
        }
      );
    } else if (role === 'HOD') {
      const deptStudents = moduleQueryEngineService.getStudentsForUser(context);
      const deptFaculty = moduleQueryEngineService.getFacultyForUser(context);

      kpis.push(
        {
          kpiId: 'kpi-hod-students',
          title: 'Department Students',
          description: 'Students enrolled in department programs',
          value: deptStudents.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/students',
          category: 'ACADEMIC'
        },
        {
          kpiId: 'kpi-hod-faculty',
          title: 'Department Faculty',
          description: 'Faculty members in department cadre',
          value: deptFaculty.totalCount,
          status: 'NORMAL',
          drillDownRoute: '/faculty',
          category: 'ACADEMIC'
        }
      );
    } else if (role === 'STUDENT') {
      kpis.push({
        kpiId: 'kpi-stud-attendance',
        title: 'Average Attendance',
        description: 'Cumulative academic attendance percentage',
        value: '86.4%',
        status: 'SUCCESS',
        drillDownRoute: '/student-attendance',
        category: 'ACADEMIC'
      });
    }

    // 4. Quick Actions
    const quickActions = [
      { id: 'qa-notesheet-create', label: 'Create Notesheet', route: '/reg-notesheets-create', permission: 'NOTESHEET_CREATE' },
      { id: 'qa-request-create', label: 'Submit Academic Request', route: '/requests/new', permission: 'REQUEST_CREATE' },
      { id: 'qa-report-view', label: 'Academic Reports', route: '/reg-academic-reports', permission: 'REPORT_VIEW' }
    ];

    return {
      dashboardType: (role as any),
      scopeLabel: role === 'REGISTRAR' ? 'MY UNIVERSITY' :
                  role === 'PRINCIPAL' ? 'MY INSTITUTE' :
                  role === 'HOD' ? 'MY DEPARTMENT' :
                  role === 'DEPUTY_REGISTRAR' ? 'MY JURISDICTION' :
                  role === 'STUDENT' ? 'MY ACADEMIC JOURNEY' : 'MY ACADEMIC WORK',
      academicYear: '2026-2027',
      semesterTerm: 'Odd Semester (Term 1)',
      attentionItems,
      kpis,
      risks,
      recentActivity: [
        { id: 'act-1', title: 'Academic Session Attendance Synchronized', timestamp: new Date().toLocaleDateString(), actor: 'System' }
      ],
      quickActions
    };
  }

  /**
   * 24-25. TOP MANAGEMENT ANALYTICS: Pending Notesheets by Department
   */
  public getPendingNotesheetsByDepartment(context: UserAuthorizationContext): {
    department: string;
    departmentCode: string;
    pendingCount: number;
    financialPendingCount: number;
    avgPendingDays: number;
  }[] {
    const role = String(context.activeRole);
    // Student and plain Faculty have no management analytics access
    if (role === 'STUDENT' || role === 'FACULTY' || role === 'PARENT') {
      return [];
    }

    const allNotes = moduleQueryEngineService.getNotesheetsForUser(context).records;
    const pendingNotes = allNotes.filter(n => ['PENDING', 'SUBMITTED', 'FORWARDED', 'IN_REVIEW'].includes(n.status));

    const depts = db.getDepartments();
    const deptMap: Record<string, { department: string; departmentCode: string; pendingCount: number; financialPendingCount: number; daysAccum: number }> = {};

    depts.forEach(d => {
      // Scope filtering
      if (context.instituteId && d.instituteId !== context.instituteId && (role === 'PRINCIPAL' || role === 'HOD')) {
        return;
      }
      if (context.departmentId && d.id !== context.departmentId && role === 'HOD') {
        return;
      }

      deptMap[d.name] = {
        department: d.name,
        departmentCode: d.code,
        pendingCount: 0,
        financialPendingCount: 0,
        daysAccum: 0
      };
    });

    pendingNotes.forEach(n => {
      const deptName = n.department || 'General Administration';
      if (!deptMap[deptName]) {
        deptMap[deptName] = {
          department: deptName,
          departmentCode: deptName.slice(0, 4).toUpperCase(),
          pendingCount: 0,
          financialPendingCount: 0,
          daysAccum: 0
        };
      }
      deptMap[deptName].pendingCount += 1;
      const amt = n.finalApprovedAmount || n.approvedAmount || n.requestedAmount || n.estimatedCost || 0;
      if (n.financialRequirement && amt > 0) {
        deptMap[deptName].financialPendingCount += 1;
      }
      const days = Math.max(1, Math.floor((Date.now() - new Date(n.createdAt || n.date).getTime()) / (1000 * 3600 * 24)));
      deptMap[deptName].daysAccum += days;
    });

    return Object.values(deptMap).map(d => ({
      department: d.department,
      departmentCode: d.departmentCode,
      pendingCount: d.pendingCount,
      financialPendingCount: d.financialPendingCount,
      avgPendingDays: d.pendingCount > 0 ? Math.round(d.daysAccum / d.pendingCount) : 0
    }));
  }

  /**
   * 26. TOP MANAGEMENT ANALYTICS: Monthly Notesheet Expenditure (Sanctioned/Approved Amount)
   */
  public getMonthlyNotesheetExpenditure(context: UserAuthorizationContext): {
    month: string;
    year: number;
    sanctionedAmount: number;
    approvedNotesheetsCount: number;
    formattedAmount: string;
  }[] {
    const role = String(context.activeRole);
    if (role === 'STUDENT' || role === 'FACULTY' || role === 'PARENT') {
      return [];
    }

    const allNotes = moduleQueryEngineService.getNotesheetsForUser(context).records;
    const approvedNotes = allNotes.filter(n => n.status === 'APPROVED' && ((n.finalApprovedAmount || n.approvedAmount || n.estimatedCost || 0) > 0));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();

    const monthlyData: Record<number, { sanctioned: number; count: number }> = {};
    for (let m = 0; m < 12; m++) {
      monthlyData[m] = { sanctioned: 0, count: 0 };
    }

    approvedNotes.forEach(n => {
      const d = new Date(n.decisionDate || n.updatedAt || n.createdAt || n.date);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        const amt = Number(n.finalApprovedAmount || n.approvedAmount || n.estimatedCost || 0);
        monthlyData[m].sanctioned += amt;
        monthlyData[m].count += 1;
      }
    });

    return monthNames.map((month, idx) => ({
      month,
      year: currentYear,
      sanctionedAmount: monthlyData[idx].sanctioned,
      approvedNotesheetsCount: monthlyData[idx].count,
      formattedAmount: `₹${monthlyData[idx].sanctioned.toLocaleString('en-IN')}`
    }));
  }

  /**
   * 27. TOP MANAGEMENT ANALYTICS: Daily Hostel Gate Pass / Outing Metrics
   */
  public getHostelDailyOutingAnalytics(context: UserAuthorizationContext): {
    date: string;
    checkedOutCount: number;
    checkedInCount: number;
    currentlyOutsideCount: number;
  }[] {
    const role = String(context.activeRole);
    if (role === 'STUDENT' || role === 'FACULTY' || role === 'PARENT') {
      return [];
    }

    const state = db.getState();
    const allPasses = (state.studentGatePasses || []) as any[];

    // Aggregate by outing date
    const dateMap: Record<string, { checkedOut: number; checkedIn: number; outside: number }> = {};

    allPasses.forEach(p => {
      const d = p.outingDate || p.leavingDate || p.createdAt?.split('T')[0] || '2026-08-24';
      if (!dateMap[d]) {
        dateMap[d] = { checkedOut: 0, checkedIn: 0, outside: 0 };
      }

      if (p.actualOutTime || p.status === 'CHECKED_OUT' || p.status === 'COMPLETED' || p.status === 'APPROVED') {
        dateMap[d].checkedOut += 1;
      }
      if (p.actualInTime || p.status === 'COMPLETED' || p.status === 'CHECKED_IN') {
        dateMap[d].checkedIn += 1;
      }
      if (p.status === 'CHECKED_OUT' || (p.actualOutTime && !p.actualInTime)) {
        dateMap[d].outside += 1;
      }
    });

    return Object.entries(dateMap).map(([date, val]) => ({
      date,
      checkedOutCount: val.checkedOut,
      checkedInCount: val.checkedIn,
      currentlyOutsideCount: val.outside
    })).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const dashboardKpiService = DashboardKpiService.getInstance();
