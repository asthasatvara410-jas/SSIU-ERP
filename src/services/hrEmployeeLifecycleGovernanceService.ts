import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type OrganizationUnitType = 'UNIVERSITY' | 'INSTITUTE' | 'DEPARTMENT' | 'OFFICE' | 'SECTION' | 'CELL';
export type ReportingRelationshipType = 'DIRECT_MANAGER' | 'FUNCTIONAL_MANAGER' | 'ACADEMIC_HEAD' | 'ADMINISTRATIVE_HEAD';
export type EmploymentCadre = 'TEACHING_FACULTY' | 'NON_TEACHING_STAFF' | 'ADMINISTRATIVE_OFFICER' | 'TECHNICAL_STAFF';

export interface OrganizationUnitRecord {
  id: string;
  code: string;
  name: string;
  type: OrganizationUnitType;
  parentUnitId?: string;
  headEmployeeId?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EmployeeHierarchyNode {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  designationTitle: string;
  organizationUnitName: string;
  reportingAuthorityId?: string;
  cadre: EmploymentCadre;
}

export interface EmployeePromotionHistoryRecord {
  id: string;
  employeeId: string;
  oldDesignationTitle: string;
  newDesignationTitle: string;
  effectiveDate: string;
  orderNumber: string;
  approvedByUserId: string;
}

export interface StaffOfficeTaskRecord {
  id: string;
  taskNumber: string;
  assignedToEmployeeId: string;
  organizationUnitId: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}

export interface VacancyPositionRecord {
  id: string;
  organizationUnitId: string;
  designationId: string;
  designationTitle: string;
  sanctionedStrength: number;
  filledStrength: number;
  vacantStrength: number;
}

class HrEmployeeLifecycleGovernanceService {
  private static instance: HrEmployeeLifecycleGovernanceService;

  private organizationUnits: OrganizationUnitRecord[] = [
    { id: 'ou-reg-office', code: 'REG_OFFICE', name: 'Office of the Registrar', type: 'OFFICE', status: 'ACTIVE' },
    { id: 'ou-acad-sec', code: 'ACAD_SEC', name: 'Academic Administration Section', type: 'SECTION', parentUnitId: 'ou-reg-office', status: 'ACTIVE' },
    { id: 'ou-exam-cell', code: 'EXAM_CELL', name: 'Central Examination Cell', type: 'SECTION', parentUnitId: 'ou-reg-office', status: 'ACTIVE' },
    { id: 'ou-sit-cse', code: 'SIT_CSE', name: 'Department of Computer Science & Engineering', type: 'DEPARTMENT', status: 'ACTIVE' }
  ];

  private employees: EmployeeHierarchyNode[] = [
    {
      employeeId: 'emp-reg-01',
      employeeNumber: 'EMP-2026-000001',
      fullName: 'Dr. Registrar SSIU',
      designationTitle: 'Registrar',
      organizationUnitName: 'Office of the Registrar',
      cadre: 'ADMINISTRATIVE_OFFICER'
    },
    {
      employeeId: 'emp-dr-01',
      employeeNumber: 'EMP-2026-000012',
      fullName: 'Shri Deputy Registrar',
      designationTitle: 'Deputy Registrar (Academic)',
      organizationUnitName: 'Academic Administration Section',
      reportingAuthorityId: 'emp-reg-01',
      cadre: 'ADMINISTRATIVE_OFFICER'
    },
    {
      employeeId: 'emp-ar-01',
      employeeNumber: 'EMP-2026-000045',
      fullName: 'Smt. Assistant Registrar',
      designationTitle: 'Assistant Registrar (Academics)',
      organizationUnitName: 'Academic Administration Section',
      reportingAuthorityId: 'emp-dr-01',
      cadre: 'ADMINISTRATIVE_OFFICER'
    },
    {
      employeeId: 'emp-fac-101',
      employeeNumber: 'EMP-2026-000101',
      fullName: 'Prof. Rajesh Patel',
      designationTitle: 'Associate Professor',
      organizationUnitName: 'Department of Computer Science & Engineering',
      reportingAuthorityId: 'emp-dr-01',
      cadre: 'TEACHING_FACULTY'
    }
  ];

  private promotionHistory: EmployeePromotionHistoryRecord[] = [
    {
      id: 'prm-01',
      employeeId: 'emp-fac-101',
      oldDesignationTitle: 'Assistant Professor',
      newDesignationTitle: 'Associate Professor',
      effectiveDate: '2026-07-01',
      orderNumber: 'SSIU/EST/PRM/2026/89',
      approvedByUserId: 'emp-reg-01'
    }
  ];

  private officeTasks: StaffOfficeTaskRecord[] = [
    {
      id: 'ot-01',
      taskNumber: 'TASK-REG-2026-044',
      assignedToEmployeeId: 'emp-ar-01',
      organizationUnitId: 'ou-acad-sec',
      title: 'Scrutinize Program Affiliation Files for Academic Year 2026-27',
      priority: 'HIGH',
      dueDate: '2026-09-10',
      status: 'IN_PROGRESS'
    }
  ];

  private vacancies: VacancyPositionRecord[] = [
    {
      id: 'pos-prof-cse',
      organizationUnitId: 'ou-sit-cse',
      designationId: 'desig-prof',
      designationTitle: 'Professor',
      sanctionedStrength: 4,
      filledStrength: 3,
      vacantStrength: 1
    }
  ];

  private constructor() {}

  public static getInstance(): HrEmployeeLifecycleGovernanceService {
    if (!HrEmployeeLifecycleGovernanceService.instance) {
      HrEmployeeLifecycleGovernanceService.instance = new HrEmployeeLifecycleGovernanceService();
    }
    return HrEmployeeLifecycleGovernanceService.instance;
  }

  // ─── REPORTING HIERARCHY & ACYCLIC VALIDATION ─────────────────────────

  public isReportingChainValid(employeeId: string, targetManagerId: string): boolean {
    if (employeeId === targetManagerId) return false; // Self-reporting disallowed

    let current: string | undefined = targetManagerId;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current)) return false; // Cycle detected
      visited.add(current);

      if (current === employeeId) return false; // Circular ancestor chain detected

      const manager = this.employees.find(e => e.employeeId === current);
      current = manager?.reportingAuthorityId;
    }

    return true;
  }

  public getDirectReports(managerId: string): EmployeeHierarchyNode[] {
    return this.employees.filter(e => e.reportingAuthorityId === managerId);
  }

  // ─── PROMOTION & TRANSFER ─────────────────────────────────────────────

  public recordPromotion(promotion: Omit<EmployeePromotionHistoryRecord, 'id'>): EmployeePromotionHistoryRecord {
    const record: EmployeePromotionHistoryRecord = {
      id: `prm-${Date.now()}`,
      ...promotion
    };

    this.promotionHistory.push(record);

    const employee = this.employees.find(e => e.employeeId === promotion.employeeId);
    if (employee) {
      employee.designationTitle = promotion.newDesignationTitle;
    }

    return record;
  }

  // ─── VACANCY & STRENGTH METRICS ───────────────────────────────────────

  public getStaffStrengthSummary(organizationUnitId?: string): {
    totalSanctioned: number;
    totalFilled: number;
    totalVacant: number;
  } {
    const list = organizationUnitId
      ? this.vacancies.filter(v => v.organizationUnitId === organizationUnitId)
      : this.vacancies;

    const totalSanctioned = list.reduce((sum, v) => sum + v.sanctionedStrength, 0);
    const totalFilled = list.reduce((sum, v) => sum + v.filledStrength, 0);
    const totalVacant = list.reduce((sum, v) => sum + v.vacantStrength, 0);

    return { totalSanctioned, totalFilled, totalVacant };
  }

  // ─── QUERIES & SECURITY ────────────────────────────────────────────────

  public getEmployeeDetails(employeeId: string, context?: UserAuthorizationContext): {
    employee: EmployeeHierarchyNode;
    directReports: EmployeeHierarchyNode[];
    promotions: EmployeePromotionHistoryRecord[];
    tasks: StaffOfficeTaskRecord[];
  } | undefined {
    // RBAC: If regular staff/faculty, block unauthorized inspection of another's confidential file
    if (context && (String(context.activeRole) === 'FACULTY' || String(context.activeRole) === 'STAFF') && context.userId !== employeeId) {
      return undefined;
    }

    const employee = this.employees.find(e => e.employeeId === employeeId);
    if (!employee) return undefined;

    return {
      employee,
      directReports: this.getDirectReports(employeeId),
      promotions: this.promotionHistory.filter(p => p.employeeId === employeeId),
      tasks: this.officeTasks.filter(t => t.assignedToEmployeeId === employeeId)
    };
  }
}

export const hrEmployeeLifecycleGovernanceService = HrEmployeeLifecycleGovernanceService.getInstance();
