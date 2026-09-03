import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { hrEmployeeLifecycleGovernanceService } from './hrEmployeeLifecycleGovernanceService';

export interface EmployeeQualificationRecord {
  degree: string;
  specialization: string;
  university: string;
  year: number;
  grade: string;
}

export interface EmployeePublicationRecord {
  id: string;
  title: string;
  journal: string;
  year: number;
  doi: string;
}

export interface EmployeeTaskRecord {
  id: string;
  taskTitle: string;
  assignedBy: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}

export interface Employee360DossierView {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  employeeType: 'FACULTY' | 'ADMINISTRATIVE_STAFF' | 'TECHNICAL_STAFF' | 'SUPPORT_STAFF';
  designationName: string;
  organizationUnit: string;
  reportingManagerName: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED';
  qualifications: EmployeeQualificationRecord[];
  // Faculty specific
  facultyPortfolio?: {
    teachingHoursPerWeek: number;
    assignedCourses: string[];
    publications: EmployeePublicationRecord[];
    researchGrantsCount: number;
  };
  // Staff specific
  staffTasks?: EmployeeTaskRecord[];
  timeline: Array<{
    date: string;
    event: string;
    category: 'JOINING' | 'PROMOTION' | 'TRANSFER' | 'APPRAISAL' | 'AWARD';
  }>;
}

class HrmsUnifiedEmployee360Service {
  private static instance: HrmsUnifiedEmployee360Service;

  private constructor() {}

  public static getInstance(): HrmsUnifiedEmployee360Service {
    if (!HrmsUnifiedEmployee360Service.instance) {
      HrmsUnifiedEmployee360Service.instance = new HrmsUnifiedEmployee360Service();
    }
    return HrmsUnifiedEmployee360Service.instance;
  }

  // ─── UNIFIED EMPLOYEE 360° DOSSIER AGGREGATION ────────────────────────

  public getEmployee360Dossier(employeeId: string, context?: UserAuthorizationContext): Employee360DossierView | undefined {
    // RBAC: If role is FACULTY/STAFF and viewing others, ensure authorized scope
    if (context && context.activeRole === 'FACULTY' && context.userId !== employeeId) {
      return undefined;
    }

    if (employeeId === 'emp-fac-01') {
      return {
        employeeId: 'emp-fac-01',
        employeeNumber: 'EMP-FAC-2021-0084',
        fullName: 'Dr. Amit Trivedi',
        email: 'amit.trivedi@ssiu.ac.in',
        phone: '+91 9825098765',
        employeeType: 'FACULTY',
        designationName: 'Associate Professor',
        organizationUnit: 'Department of Computer Science & Engineering',
        reportingManagerName: 'Dr. Sanjay Patel (HOD CSE)',
        employmentStatus: 'ACTIVE',
        qualifications: [
          { degree: 'Ph.D.', specialization: 'Artificial Intelligence & Distributed Systems', university: 'IIT Bombay', year: 2018, grade: 'Distinction' },
          { degree: 'M.Tech', specialization: 'Computer Engineering', university: 'GTU', year: 2013, grade: 'First Class with Distinction' }
        ],
        facultyPortfolio: {
          teachingHoursPerWeek: 16,
          assignedCourses: ['CS501 - Distributed Systems', 'CS302 - Data Structures & Algorithms'],
          publications: [
            { id: 'pub-01', title: 'Scalable Consensus Protocols in Cloud Computing', journal: 'IEEE Transactions on Cloud Systems', year: 2024, doi: '10.1109/TCS.2024.01928' }
          ],
          researchGrantsCount: 2
        },
        timeline: [
          { date: '2021-07-01', event: 'Joined SSIU as Assistant Professor in Dept. of CSE', category: 'JOINING' },
          { date: '2023-08-15', event: 'Promoted to Associate Professor', category: 'PROMOTION' },
          { date: '2025-04-10', event: 'Sanctioned SERB Research Grant (₹25,00,000)', category: 'AWARD' }
        ]
      };
    }

    if (employeeId === 'emp-reg-staff-01') {
      return {
        employeeId: 'emp-reg-staff-01',
        employeeNumber: 'EMP-ADM-2022-0144',
        fullName: 'Manish Rawal',
        email: 'manish.rawal@ssiu.ac.in',
        phone: '+91 9824054321',
        employeeType: 'ADMINISTRATIVE_STAFF',
        designationName: 'Section Officer (Academic & Student Affairs)',
        organizationUnit: 'Office of the Registrar',
        reportingManagerName: 'Dr. Pravin Vaghela (Deputy Registrar)',
        employmentStatus: 'ACTIVE',
        qualifications: [
          { degree: 'MBA', specialization: 'Educational Administration', university: 'Gujarat University', year: 2019, grade: 'First Class' }
        ],
        staffTasks: [
          { id: 'tsk-01', taskTitle: 'Finalize Degree Certificate Roster for Convocation 2026', assignedBy: 'Dr. Pravin Vaghela', priority: 'HIGH', dueDate: '2026-09-05', status: 'IN_PROGRESS' },
          { id: 'tsk-02', taskTitle: 'Process Bonafide and Migration Requests for SIT', assignedBy: 'Registrar SSIU', priority: 'MEDIUM', dueDate: '2026-08-30', status: 'COMPLETED' }
        ],
        timeline: [
          { date: '2022-02-01', event: 'Joined Office of Registrar as Senior Clerk', category: 'JOINING' },
          { date: '2024-06-01', event: 'Promoted to Section Officer (Academic & Student Affairs)', category: 'PROMOTION' }
        ]
      };
    }

    return undefined;
  }

  // ─── REGISTRAR DUAL-VIEW SUMMARY ──────────────────────────────────────

  public getRegistrarOfficeAndAcademicOverview(): {
    academic: {
      totalFaculty: number;
      activeResearchersCount: number;
      averageWorkloadHours: number;
    };
    administrative: {
      registrarOfficeStaffCount: number;
      activeTasksCount: number;
      pendingLeavesCount: number;
    };
  } {
    return {
      academic: {
        totalFaculty: 420,
        activeResearchersCount: 135,
        averageWorkloadHours: 16.4
      },
      administrative: {
        registrarOfficeStaffCount: 48,
        activeTasksCount: 18,
        pendingLeavesCount: 3
      }
    };
  }
}

export const hrmsUnifiedEmployee360Service = HrmsUnifiedEmployee360Service.getInstance();
