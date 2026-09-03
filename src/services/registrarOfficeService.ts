import {
  RegistrarOffice,
  RegistrarOfficeSection,
  RegistrarOfficePosition,
  RegistrarOfficeStaff,
  RegistrarOfficeResponsibility,
  RegistrarStaffResponsibilityAssignment,
  RegistrarOfficeWorkItem,
  RegistrarOfficeAuditLog,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemType
} from '../types/registrarOffice';
import { User } from '../types';

const STORAGE_KEY_OFFICE = 'ssiu_erp_registrar_office_v1';
const STORAGE_KEY_SECTIONS = 'ssiu_erp_registrar_office_sections_v1';
const STORAGE_KEY_POSITIONS = 'ssiu_erp_registrar_office_positions_v1';
const STORAGE_KEY_STAFF = 'ssiu_erp_registrar_office_staff_v1';
const STORAGE_KEY_RESPONSIBILITIES = 'ssiu_erp_registrar_office_responsibilities_v1';
const STORAGE_KEY_ASSIGNMENTS = 'ssiu_erp_registrar_office_resp_assignments_v1';
const STORAGE_KEY_WORK_ITEMS = 'ssiu_erp_registrar_office_work_items_v1';
const STORAGE_KEY_AUDIT = 'ssiu_erp_registrar_office_audit_logs_v1';

const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {}
  return memoryStore[key] || null;
}

function safeSetItem(key: string, val: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
      return;
    }
  } catch (e) {}
  memoryStore[key] = val;
}

class RegistrarOfficeService {
  private office: RegistrarOffice | null = null;
  private sections: RegistrarOfficeSection[] = [];
  private positions: RegistrarOfficePosition[] = [];
  private staffList: RegistrarOfficeStaff[] = [];
  private responsibilities: RegistrarOfficeResponsibility[] = [];
  private assignments: RegistrarStaffResponsibilityAssignment[] = [];
  private workItems: RegistrarOfficeWorkItem[] = [];
  private auditLogs: RegistrarOfficeAuditLog[] = [];
  private initialized = false;

  public init() {
    if (this.initialized) return;
    this.loadState();
    this.initialized = true;
  }

  private loadState() {
    try {
      // 1. Office Master
      const officeStr = safeGetItem(STORAGE_KEY_OFFICE);
      if (officeStr) {
        this.office = JSON.parse(officeStr);
      } else {
        this.office = {
          id: 'OFFICE-REGISTRAR-01',
          universityId: 'SSIU-UNIV-01',
          officeName: 'Office of the Registrar',
          officeCode: 'RO-CENTRAL',
          registrarUserId: 'USER-REGISTRAR',
          registrarName: 'Dr. Sanjay Patel',
          description: 'Apex statutory custodian, university governance, affiliations, student records, and central administration.',
          status: 'ACTIVE'
        };
        this.saveOffice();
      }

      // 2. Sections
      const secStr = safeGetItem(STORAGE_KEY_SECTIONS);
      if (secStr) {
        this.sections = JSON.parse(secStr);
      } else {
        this.sections = [
          {
            id: 'SEC-ACAD',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-ACAD',
            sectionName: 'Academic & Curriculum Governance Section',
            sectionHeadUserId: 'USER-DEP-REG-1',
            sectionHeadName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            description: 'Board of Studies, Academic Council, Curriculum Revisions, and Approvals',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-EXAM',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-EXAM',
            sectionName: 'Statutory Examination & Degree Section',
            sectionHeadUserId: 'USER-DEP-REG-2',
            sectionHeadName: 'Dr. Ananya Sharma (Deputy Registrar)',
            description: 'COE Coordination, Degree Verification, Convocation, and Statutory Results',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-AFFIL',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-AFFIL',
            sectionName: 'Affiliation & Statutory Compliance Section',
            sectionHeadUserId: 'USER-DEP-REG-1',
            sectionHeadName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            description: 'UGC, AICTE, PCI, BCI, GNC Statutory Affiliations and Return of Information',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-RECORDS',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-RECORDS',
            sectionName: 'Student Records & Enrollment Section',
            sectionHeadUserId: 'USER-AST-REG-1',
            sectionHeadName: 'Mr. Hardik Trivedi (Assistant Registrar)',
            description: 'Central Enrollment Register, Eligibility Clearance, and Document Vault',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-ESTAB',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-ESTAB',
            sectionName: 'Establishment & Service Records Section',
            sectionHeadUserId: 'USER-AST-REG-2',
            sectionHeadName: 'Mrs. Rekha Varma (Assistant Registrar)',
            description: 'Faculty Service Books, Statutory Appointments, and Committee Gazettes',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-LEGAL',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-LEGAL',
            sectionName: 'Legal, RTI & Compliance Section',
            sectionHeadUserId: 'USER-REGISTRAR',
            sectionHeadName: 'Dr. Sanjay Patel (Registrar)',
            description: 'University Legal Suits, Statutory Ordinances, and RTI Cell',
            status: 'ACTIVE'
          },
          {
            id: 'SEC-CORR',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionCode: 'SEC-CORR',
            sectionName: 'Central Inward / Outward Correspondence Section',
            sectionHeadUserId: 'USER-SO-1',
            sectionHeadName: 'Mr. Bhavesh Joshi (Section Officer)',
            description: 'Government Letters, Chancellor Notes, Official Circulars, and Despatch',
            status: 'ACTIVE'
          }
        ];
        this.saveSections();
      }

      // 3. Positions
      const posStr = safeGetItem(STORAGE_KEY_POSITIONS);
      if (posStr) {
        this.positions = JSON.parse(posStr);
      } else {
        this.positions = [
          { id: 'POS-REG', positionCode: 'REG', positionTitle: 'Registrar', level: 1, roleLevel: 'REGISTRAR', status: 'ACTIVE' },
          { id: 'POS-DREG', positionCode: 'DREG', positionTitle: 'Deputy Registrar', level: 2, roleLevel: 'DEPUTY_REGISTRAR', reportsToPositionId: 'POS-REG', status: 'ACTIVE' },
          { id: 'POS-AREG', positionCode: 'AREG', positionTitle: 'Assistant Registrar', level: 3, roleLevel: 'ASSISTANT_REGISTRAR', reportsToPositionId: 'POS-DREG', status: 'ACTIVE' },
          { id: 'POS-SO', positionCode: 'SO', positionTitle: 'Section Officer', level: 4, roleLevel: 'SECTION_OFFICER', reportsToPositionId: 'POS-AREG', status: 'ACTIVE' },
          { id: 'POS-SUPT', positionCode: 'SUPT', positionTitle: 'Office Superintendent', level: 4, roleLevel: 'SECTION_OFFICER', reportsToPositionId: 'POS-AREG', status: 'ACTIVE' },
          { id: 'POS-SRCLK', positionCode: 'SRCLK', positionTitle: 'Senior Administrative Assistant', level: 5, roleLevel: 'OFFICE_STAFF', reportsToPositionId: 'POS-SO', status: 'ACTIVE' },
          { id: 'POS-JRCLK', positionCode: 'JRCLK', positionTitle: 'Junior Clerk / Scrutiny Assistant', level: 5, roleLevel: 'OFFICE_STAFF', reportsToPositionId: 'POS-SO', status: 'ACTIVE' },
          { id: 'POS-DEO', positionCode: 'DEO', positionTitle: 'Data Entry Operator', level: 5, roleLevel: 'OFFICE_STAFF', reportsToPositionId: 'POS-SO', status: 'ACTIVE' }
        ];
        this.savePositions();
      }

      // 4. Staff Roster
      const staffStr = safeGetItem(STORAGE_KEY_STAFF);
      if (staffStr) {
        this.staffList = JSON.parse(staffStr);
      } else {
        this.staffList = [
          {
            id: 'RO-STAFF-01',
            userId: 'USER-REGISTRAR',
            employeeId: 'EMP-REG-001',
            name: 'Dr. Sanjay Patel',
            email: 'registrar@swarrnim.edu.in',
            phone: '9825001122',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-LEGAL',
            sectionName: 'Legal, RTI & Compliance Section',
            positionId: 'POS-REG',
            positionTitle: 'Registrar',
            roleLevel: 'REGISTRAR',
            joiningDate: '2020-06-01',
            employmentStatus: 'ACTIVE',
            qualifications: 'Ph.D. in Governance, M.A., LL.B.',
            roomNumber: 'AD-101 (Registrar Secretariat)'
          },
          {
            id: 'RO-STAFF-02',
            userId: 'USER-DEP-REG-1',
            employeeId: 'EMP-REG-002',
            name: 'Dr. Rajiv Mehta',
            email: 'deputy.registrar.acad@swarrnim.edu.in',
            phone: '9825003344',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-ACAD',
            sectionName: 'Academic & Curriculum Governance Section',
            positionId: 'POS-DREG',
            positionTitle: 'Deputy Registrar (Academics & Affiliation)',
            roleLevel: 'DEPUTY_REGISTRAR',
            reportingToUserId: 'USER-REGISTRAR',
            reportingToName: 'Dr. Sanjay Patel (Registrar)',
            joiningDate: '2021-08-15',
            employmentStatus: 'ACTIVE',
            qualifications: 'Ph.D. in Higher Education Management',
            roomNumber: 'AD-104'
          },
          {
            id: 'RO-STAFF-03',
            userId: 'USER-DEP-REG-2',
            employeeId: 'EMP-REG-003',
            name: 'Dr. Ananya Sharma',
            email: 'deputy.registrar.exam@swarrnim.edu.in',
            phone: '9825005566',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-EXAM',
            sectionName: 'Statutory Examination & Degree Section',
            positionId: 'POS-DREG',
            positionTitle: 'Deputy Registrar (Evaluation & Examination)',
            roleLevel: 'DEPUTY_REGISTRAR',
            reportingToUserId: 'USER-REGISTRAR',
            reportingToName: 'Dr. Sanjay Patel (Registrar)',
            joiningDate: '2022-01-10',
            employmentStatus: 'ACTIVE',
            qualifications: 'Ph.D., M.Sc.',
            roomNumber: 'AD-105'
          },
          {
            id: 'RO-STAFF-04',
            userId: 'USER-AST-REG-1',
            employeeId: 'EMP-REG-004',
            name: 'Mr. Hardik Trivedi',
            email: 'asst.registrar.records@swarrnim.edu.in',
            phone: '9825007788',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-RECORDS',
            sectionName: 'Student Records & Enrollment Section',
            positionId: 'POS-AREG',
            positionTitle: 'Assistant Registrar (Records & Admissions)',
            roleLevel: 'ASSISTANT_REGISTRAR',
            reportingToUserId: 'USER-DEP-REG-1',
            reportingToName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            joiningDate: '2022-07-01',
            employmentStatus: 'ACTIVE',
            qualifications: 'M.B.A., B.Tech',
            roomNumber: 'AD-108'
          },
          {
            id: 'RO-STAFF-05',
            userId: 'USER-AST-REG-2',
            employeeId: 'EMP-REG-005',
            name: 'Mrs. Rekha Varma',
            email: 'asst.registrar.admin@swarrnim.edu.in',
            phone: '9825009900',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-ESTAB',
            sectionName: 'Establishment & Service Records Section',
            positionId: 'POS-AREG',
            positionTitle: 'Assistant Registrar (Establishment & HR)',
            roleLevel: 'ASSISTANT_REGISTRAR',
            reportingToUserId: 'USER-DEP-REG-1',
            reportingToName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            joiningDate: '2022-11-15',
            employmentStatus: 'ACTIVE',
            qualifications: 'M.Com, PGDHRM',
            roomNumber: 'AD-109'
          },
          {
            id: 'RO-STAFF-06',
            userId: 'USER-SO-1',
            employeeId: 'EMP-REG-006',
            name: 'Mr. Bhavesh Joshi',
            email: 'bhavesh.joshi@swarrnim.edu.in',
            phone: '9825011122',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-CORR',
            sectionName: 'Central Inward / Outward Correspondence Section',
            positionId: 'POS-SO',
            positionTitle: 'Section Officer (Despatch & Senate Secretariat)',
            roleLevel: 'SECTION_OFFICER',
            reportingToUserId: 'USER-AST-REG-1',
            reportingToName: 'Mr. Hardik Trivedi (Assistant Registrar)',
            joiningDate: '2023-02-01',
            employmentStatus: 'ACTIVE',
            qualifications: 'B.A., Diploma in Secretarial Practice',
            roomNumber: 'AD-112'
          },
          {
            id: 'RO-STAFF-07',
            userId: 'USER-SO-2',
            employeeId: 'EMP-REG-007',
            name: 'Mr. Nilesh Patel',
            email: 'nilesh.patel@swarrnim.edu.in',
            phone: '9825013344',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-ACAD',
            sectionName: 'Academic & Curriculum Governance Section',
            positionId: 'POS-SUPT',
            positionTitle: 'Office Superintendent',
            roleLevel: 'SECTION_OFFICER',
            reportingToUserId: 'USER-AST-REG-1',
            reportingToName: 'Mr. Hardik Trivedi (Assistant Registrar)',
            joiningDate: '2023-04-15',
            employmentStatus: 'ACTIVE',
            qualifications: 'B.Com, B.Ed',
            roomNumber: 'AD-114'
          },
          {
            id: 'RO-STAFF-08',
            userId: 'USER-CLK-1',
            employeeId: 'EMP-REG-008',
            name: 'Ms. Pooja Parmar',
            email: 'pooja.parmar@swarrnim.edu.in',
            phone: '9825015566',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-RECORDS',
            sectionName: 'Student Records & Enrollment Section',
            positionId: 'POS-SRCLK',
            positionTitle: 'Senior Administrative Assistant',
            roleLevel: 'OFFICE_STAFF',
            reportingToUserId: 'USER-SO-1',
            reportingToName: 'Mr. Bhavesh Joshi (Section Officer)',
            joiningDate: '2023-09-01',
            employmentStatus: 'ACTIVE',
            qualifications: 'B.C.A.',
            roomNumber: 'AD-115'
          },
          {
            id: 'RO-STAFF-09',
            userId: 'USER-CLK-2',
            employeeId: 'EMP-REG-009',
            name: 'Mr. Chetan Prajapati',
            email: 'chetan.p@swarrnim.edu.in',
            phone: '9825017788',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-EXAM',
            sectionName: 'Statutory Examination & Degree Section',
            positionId: 'POS-JRCLK',
            positionTitle: 'Junior Clerk / Verification Assistant',
            roleLevel: 'OFFICE_STAFF',
            reportingToUserId: 'USER-SO-2',
            reportingToName: 'Mr. Nilesh Patel (Superintendent)',
            joiningDate: '2024-01-10',
            employmentStatus: 'ACTIVE',
            qualifications: 'B.Sc.',
            roomNumber: 'AD-116'
          },
          {
            id: 'RO-STAFF-10',
            userId: 'USER-DEO-1',
            employeeId: 'EMP-REG-010',
            name: 'Mr. Jignesh Solanki',
            email: 'jignesh.deo@swarrnim.edu.in',
            phone: '9825019900',
            officeId: 'OFFICE-REGISTRAR-01',
            sectionId: 'SEC-CORR',
            sectionName: 'Central Inward / Outward Correspondence Section',
            positionId: 'POS-DEO',
            positionTitle: 'Data Entry Operator & File Dispatcher',
            roleLevel: 'OFFICE_STAFF',
            reportingToUserId: 'USER-SO-1',
            reportingToName: 'Mr. Bhavesh Joshi (Section Officer)',
            joiningDate: '2024-03-01',
            employmentStatus: 'ACTIVE',
            qualifications: 'Diploma in Computer Applications',
            roomNumber: 'AD-118'
          }
        ];
        this.saveStaff();
      }

      // 5. Responsibilities Master
      const respStr = safeGetItem(STORAGE_KEY_RESPONSIBILITIES);
      if (respStr) {
        this.responsibilities = JSON.parse(respStr);
      } else {
        this.responsibilities = [
          { id: 'RESP-01', code: 'UGC-COMP', title: 'UGC & AICTE Statutory Returns Filing', category: 'AFFILIATION', description: 'Timely filing of annual university compliance returns to statutory councils.', status: 'ACTIVE' },
          { id: 'RESP-02', code: 'ACAD-COUNCIL', title: 'Academic Council Agenda & Minutes Management', category: 'ACADEMIC', description: 'Collation of BoS recommendations, council convening, and notifications.', status: 'ACTIVE' },
          { id: 'RESP-03', code: 'DEGREE-VERIF', title: 'Degree Certificate Verification & Embassy Attestation', category: 'EXAMINATION', description: 'Scrutiny and apostille authentication of degree parchments.', status: 'ACTIVE' },
          { id: 'RESP-04', code: 'ENROLL-AUDIT', title: 'Central Student Enrollment Register Auditing', category: 'RECORDS', description: 'Verification of 10+2 / Diploma / Degree eligibility for new admissions.', status: 'ACTIVE' },
          { id: 'RESP-05', code: 'RTI-CELL', title: 'RTI Applications & Appellate Authority Processing', category: 'LEGAL', description: 'Processing citizen RTI queries within statutory 30-day timeline.', status: 'ACTIVE' },
          { id: 'RESP-06', code: 'DISPATCH-GOV', title: 'State Education Department Inward/Outward Liaison', category: 'ADMINISTRATIVE', description: 'Managing fast-track correspondence with Gujarat Higher Education Council.', status: 'ACTIVE' },
          { id: 'RESP-07', code: 'NOTESHEET-SCRUTINY', title: 'Inter-Institute Notesheet Concurrence Scrutiny', category: 'GENERAL', description: 'Scrutiny of financial and academic notesheets submitted to Registrar Office.', status: 'ACTIVE' }
        ];
        this.saveResponsibilities();
      }

      // 6. Responsibility Assignments
      const assignStr = safeGetItem(STORAGE_KEY_ASSIGNMENTS);
      if (assignStr) {
        this.assignments = JSON.parse(assignStr);
      } else {
        this.assignments = [
          {
            id: 'R-ASSIGN-01',
            staffId: 'RO-STAFF-02',
            userId: 'USER-DEP-REG-1',
            staffName: 'Dr. Rajiv Mehta',
            responsibilityId: 'RESP-01',
            responsibilityTitle: 'UGC & AICTE Statutory Returns Filing',
            category: 'AFFILIATION',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            assignedDate: '2025-07-01',
            startDate: '2025-07-01',
            priority: 'HIGH',
            status: 'ACTIVE',
            remarks: 'Primary custodian for 2025-26 statutory renewal portfolio.'
          },
          {
            id: 'R-ASSIGN-02',
            staffId: 'RO-STAFF-02',
            userId: 'USER-DEP-REG-1',
            staffName: 'Dr. Rajiv Mehta',
            responsibilityId: 'RESP-02',
            responsibilityTitle: 'Academic Council Agenda & Minutes Management',
            category: 'ACADEMIC',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            assignedDate: '2025-07-01',
            startDate: '2025-07-01',
            priority: 'HIGH',
            status: 'ACTIVE'
          },
          {
            id: 'R-ASSIGN-03',
            staffId: 'RO-STAFF-03',
            userId: 'USER-DEP-REG-2',
            staffName: 'Dr. Ananya Sharma',
            responsibilityId: 'RESP-03',
            responsibilityTitle: 'Degree Certificate Verification & Embassy Attestation',
            category: 'EXAMINATION',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            assignedDate: '2025-07-01',
            startDate: '2025-07-01',
            priority: 'URGENT',
            status: 'ACTIVE'
          },
          {
            id: 'R-ASSIGN-04',
            staffId: 'RO-STAFF-04',
            userId: 'USER-AST-REG-1',
            staffName: 'Mr. Hardik Trivedi',
            responsibilityId: 'RESP-04',
            responsibilityTitle: 'Central Student Enrollment Register Auditing',
            category: 'RECORDS',
            assignedByUserId: 'USER-DEP-REG-1',
            assignedByName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            assignedDate: '2025-08-01',
            startDate: '2025-08-01',
            priority: 'NORMAL',
            status: 'ACTIVE'
          },
          {
            id: 'R-ASSIGN-05',
            staffId: 'RO-STAFF-06',
            userId: 'USER-SO-1',
            staffName: 'Mr. Bhavesh Joshi',
            responsibilityId: 'RESP-06',
            responsibilityTitle: 'State Education Department Inward/Outward Liaison',
            category: 'ADMINISTRATIVE',
            assignedByUserId: 'USER-AST-REG-1',
            assignedByName: 'Mr. Hardik Trivedi (Assistant Registrar)',
            assignedDate: '2025-08-15',
            startDate: '2025-08-15',
            priority: 'NORMAL',
            status: 'ACTIVE'
          }
        ];
        this.saveAssignments();
      }

      // 7. Work Allocation Items
      const workStr = safeGetItem(STORAGE_KEY_WORK_ITEMS);
      if (workStr) {
        this.workItems = JSON.parse(workStr);
      } else {
        this.workItems = [
          {
            id: 'WORK-2026-001',
            workNumber: 'RO/TASK/2026/001',
            title: 'Draft Academic Council 24th Meeting Statutory Gazette',
            description: 'Compile recommendations of Faculty of Technology and Faculty of Pharmacy for university notification.',
            workType: 'ACADEMIC_MATTER',
            priority: 'HIGH',
            sectionId: 'SEC-ACAD',
            sectionName: 'Academic & Curriculum Governance Section',
            assignedToStaffId: 'RO-STAFF-02',
            assignedToUserId: 'USER-DEP-REG-1',
            assignedToName: 'Dr. Rajiv Mehta',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            dueDate: '2026-09-05',
            status: 'IN_PROGRESS',
            createdAt: '2026-08-20T10:00:00Z',
            remarks: 'Prepare draft notification for signature.',
            history: [
              {
                id: 'HIST-1',
                action: 'WORK_ASSIGNED',
                performedByUserId: 'USER-REGISTRAR',
                performedByName: 'Dr. Sanjay Patel (Registrar)',
                timestamp: '2026-08-20T10:00:00Z',
                notes: 'Assigned high priority statutory gazette draft.'
              }
            ]
          },
          {
            id: 'WORK-2026-002',
            workNumber: 'RO/FILE/2026/002',
            title: 'AICTE Extension of Approval (EoA) Compliance Dossier',
            description: 'Scrutinize deficiency reports from constituent engineering departments and prepare portal upload.',
            workType: 'STATUTORY_COMPLIANCE',
            priority: 'URGENT',
            sectionId: 'SEC-AFFIL',
            sectionName: 'Affiliation & Statutory Compliance Section',
            assignedToStaffId: 'RO-STAFF-02',
            assignedToUserId: 'USER-DEP-REG-1',
            assignedToName: 'Dr. Rajiv Mehta',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            dueDate: '2026-08-30',
            status: 'PENDING',
            createdAt: '2026-08-22T11:30:00Z',
            history: [
              {
                id: 'HIST-2',
                action: 'WORK_ASSIGNED',
                performedByUserId: 'USER-REGISTRAR',
                performedByName: 'Dr. Sanjay Patel (Registrar)',
                timestamp: '2026-08-22T11:30:00Z'
              }
            ]
          },
          {
            id: 'WORK-2026-003',
            workNumber: 'RO/REQ/2026/003',
            title: 'WES Degree Attestation Batch #48 Verification',
            description: 'Verify transcripts and degree records of 14 international alumni for World Education Services.',
            workType: 'CASE',
            priority: 'HIGH',
            sectionId: 'SEC-EXAM',
            sectionName: 'Statutory Examination & Degree Section',
            assignedToStaffId: 'RO-STAFF-03',
            assignedToUserId: 'USER-DEP-REG-2',
            assignedToName: 'Dr. Ananya Sharma',
            assignedByUserId: 'USER-REGISTRAR',
            assignedByName: 'Dr. Sanjay Patel (Registrar)',
            dueDate: '2026-08-29',
            status: 'IN_PROGRESS',
            createdAt: '2026-08-24T09:00:00Z',
            history: [
              {
                id: 'HIST-3',
                action: 'WORK_ASSIGNED',
                performedByUserId: 'USER-REGISTRAR',
                performedByName: 'Dr. Sanjay Patel (Registrar)',
                timestamp: '2026-08-24T09:00:00Z'
              }
            ]
          },
          {
            id: 'WORK-2026-004',
            workNumber: 'RO/FILE/2026/004',
            title: 'Eligibility Discrepancy Audit in B.Tech AY 2025-26',
            description: 'Audit 32 pending student enrollment files with missing 12th standard migration certificates.',
            workType: 'FILE',
            priority: 'NORMAL',
            sectionId: 'SEC-RECORDS',
            sectionName: 'Student Records & Enrollment Section',
            assignedToStaffId: 'RO-STAFF-04',
            assignedToUserId: 'USER-AST-REG-1',
            assignedToName: 'Mr. Hardik Trivedi',
            assignedByUserId: 'USER-DEP-REG-1',
            assignedByName: 'Dr. Rajiv Mehta (Deputy Registrar)',
            dueDate: '2026-09-10',
            status: 'IN_PROGRESS',
            createdAt: '2026-08-25T14:00:00Z',
            history: [
              {
                id: 'HIST-4',
                action: 'WORK_ASSIGNED',
                performedByUserId: 'USER-DEP-REG-1',
                performedByName: 'Dr. Rajiv Mehta',
                timestamp: '2026-08-25T14:00:00Z'
              }
            ]
          },
          {
            id: 'WORK-2026-005',
            workNumber: 'RO/CORR/2026/005',
            title: 'Gujarat Education Department Circular #GED/2026/410 Despatch',
            description: 'Disseminate State Anti-Ragging statutory directive to all 12 Constituent Institutes.',
            workType: 'CORRESPONDENCE',
            priority: 'NORMAL',
            sectionId: 'SEC-CORR',
            sectionName: 'Central Inward / Outward Correspondence Section',
            assignedToStaffId: 'RO-STAFF-06',
            assignedToUserId: 'USER-SO-1',
            assignedToName: 'Mr. Bhavesh Joshi',
            assignedByUserId: 'USER-AST-REG-1',
            assignedByName: 'Mr. Hardik Trivedi',
            dueDate: '2026-08-27',
            status: 'OVERDUE',
            createdAt: '2026-08-21T10:00:00Z',
            remarks: 'Requires immediate circular dispatch to all Deans & Principals.',
            history: [
              {
                id: 'HIST-5',
                action: 'WORK_ASSIGNED',
                performedByUserId: 'USER-AST-REG-1',
                performedByName: 'Mr. Hardik Trivedi',
                timestamp: '2026-08-21T10:00:00Z'
              }
            ]
          }
        ];
        this.saveWorkItems();
      }

      // 8. Audit Logs
      const auditStr = safeGetItem(STORAGE_KEY_AUDIT);
      if (auditStr) {
        this.auditLogs = JSON.parse(auditStr);
      } else {
        this.auditLogs = [
          {
            id: 'RO-AUDIT-1',
            action: 'OFFICE_ORGANIZATION_INITIALIZED',
            performedByUserId: 'USER-REGISTRAR',
            performedByName: 'Dr. Sanjay Patel (Registrar)',
            details: 'Configured Registrar Office sections, positions, and statutory reporting hierarchy.',
            timestamp: '2026-08-20T09:00:00Z'
          }
        ];
        this.saveAuditLogs();
      }
    } catch (err) {
      console.error('Failed to load Registrar Office state:', err);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STORAGE PERSISTENCE HELPERS
  // ──────────────────────────────────────────────────────────────────────────
  private saveOffice() {
    if (this.office) safeSetItem(STORAGE_KEY_OFFICE, JSON.stringify(this.office));
  }
  private saveSections() {
    safeSetItem(STORAGE_KEY_SECTIONS, JSON.stringify(this.sections));
  }
  private savePositions() {
    safeSetItem(STORAGE_KEY_POSITIONS, JSON.stringify(this.positions));
  }
  private saveStaff() {
    safeSetItem(STORAGE_KEY_STAFF, JSON.stringify(this.staffList));
  }
  private saveResponsibilities() {
    safeSetItem(STORAGE_KEY_RESPONSIBILITIES, JSON.stringify(this.responsibilities));
  }
  private saveAssignments() {
    safeSetItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(this.assignments));
  }
  private saveWorkItems() {
    safeSetItem(STORAGE_KEY_WORK_ITEMS, JSON.stringify(this.workItems));
  }
  private saveAuditLogs() {
    safeSetItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GETTERS (SINGLE SOURCE OF TRUTH QUERIES)
  // ──────────────────────────────────────────────────────────────────────────
  public getOffice(): RegistrarOffice {
    this.init();
    return this.office!;
  }

  public getSections(): RegistrarOfficeSection[] {
    this.init();
    return [...this.sections];
  }

  public getPositions(): RegistrarOfficePosition[] {
    this.init();
    return [...this.positions];
  }

  public getStaffList(filterSectionId?: string): RegistrarOfficeStaff[] {
    this.init();
    if (filterSectionId && filterSectionId !== 'ALL') {
      return this.staffList.filter(s => s.sectionId === filterSectionId);
    }
    return [...this.staffList];
  }

  public getStaffById(staffId: string): RegistrarOfficeStaff | undefined {
    this.init();
    return this.staffList.find(s => s.id === staffId || s.userId === staffId);
  }

  public getResponsibilities(): RegistrarOfficeResponsibility[] {
    this.init();
    return [...this.responsibilities];
  }

  public getResponsibilityAssignments(filterStaffId?: string): RegistrarStaffResponsibilityAssignment[] {
    this.init();
    if (filterStaffId) {
      return this.assignments.filter(a => a.staffId === filterStaffId || a.userId === filterStaffId);
    }
    return [...this.assignments];
  }

  public getWorkItems(filterStatus?: string, filterSectionId?: string, filterStaffId?: string): RegistrarOfficeWorkItem[] {
    this.init();
    let items = [...this.workItems];
    if (filterStatus && filterStatus !== 'ALL') {
      items = items.filter(w => w.status === filterStatus);
    }
    if (filterSectionId && filterSectionId !== 'ALL') {
      items = items.filter(w => w.sectionId === filterSectionId);
    }
    if (filterStaffId && filterStaffId !== 'ALL') {
      items = items.filter(w => w.assignedToStaffId === filterStaffId || w.assignedToUserId === filterStaffId);
    }
    return items;
  }

  public getAuditLogs(): RegistrarOfficeAuditLog[] {
    this.init();
    return [...this.auditLogs];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LIVE COMPUTED DASHBOARD KPIS
  // ──────────────────────────────────────────────────────────────────────────
  public getOfficeDashboardKPIs() {
    this.init();
    const staff = this.staffList;
    const work = this.workItems;

    const totalStaff = staff.length;
    const deputyRegistrars = staff.filter(s => s.roleLevel === 'DEPUTY_REGISTRAR').length;
    const assistantRegistrars = staff.filter(s => s.roleLevel === 'ASSISTANT_REGISTRAR').length;
    const sectionOfficers = staff.filter(s => s.roleLevel === 'SECTION_OFFICER').length;
    const otherStaff = staff.filter(s => s.roleLevel === 'OFFICE_STAFF').length;

    const activeStaff = staff.filter(s => s.employmentStatus === 'ACTIVE').length;
    const onLeaveStaff = staff.filter(s => s.employmentStatus === 'ON_LEAVE').length;

    const pendingWork = work.filter(w => w.status === 'PENDING').length;
    const inProgressWork = work.filter(w => w.status === 'IN_PROGRESS').length;
    const completedWork = work.filter(w => w.status === 'COMPLETED').length;
    const overdueWork = work.filter(w => w.status === 'OVERDUE' || (w.status !== 'COMPLETED' && new Date(w.dueDate) < new Date())).length;
    const escalatedWork = work.filter(w => w.status === 'ESCALATED').length;
    const unassignedWork = work.filter(w => !w.assignedToStaffId || w.assignedToStaffId === '').length;

    return {
      totalStaff,
      deputyRegistrars,
      assistantRegistrars,
      sectionOfficers,
      otherStaff,
      activeStaff,
      onLeaveStaff,
      activeSections: this.sections.filter(s => s.status === 'ACTIVE').length,
      totalWorkItems: work.length,
      pendingWork,
      inProgressWork,
      completedWork,
      overdueWork,
      escalatedWork,
      unassignedWork,
      actionableExceptions: overdueWork + escalatedWork + pendingWork
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MUTATIONS (REGISTRAR AUTHORIZED ACTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  public createStaffMember(params: {
    name: string;
    email: string;
    phone: string;
    sectionId: string;
    positionId: string;
    reportingToUserId?: string;
    qualifications?: string;
    roomNumber?: string;
    performedByUser: User;
  }): RegistrarOfficeStaff {
    this.init();
    const section = this.sections.find(s => s.id === params.sectionId);
    const position = this.positions.find(p => p.id === params.positionId);
    const reportingStaff = params.reportingToUserId ? this.staffList.find(s => s.userId === params.reportingToUserId) : undefined;

    const newStaff: RegistrarOfficeStaff = {
      id: `RO-STAFF-${Date.now().toString().slice(-4)}`,
      userId: `USER-RO-${Date.now().toString().slice(-4)}`,
      employeeId: `EMP-REG-${(this.staffList.length + 1).toString().padStart(3, '0')}`,
      name: params.name,
      email: params.email,
      phone: params.phone,
      officeId: 'OFFICE-REGISTRAR-01',
      sectionId: params.sectionId,
      sectionName: section?.sectionName || 'Registrar Office Section',
      positionId: params.positionId,
      positionTitle: position?.positionTitle || 'Office Staff',
      roleLevel: position?.roleLevel || 'OFFICE_STAFF',
      reportingToUserId: params.reportingToUserId,
      reportingToName: reportingStaff ? `${reportingStaff.name} (${reportingStaff.positionTitle})` : 'Dr. Sanjay Patel (Registrar)',
      joiningDate: new Date().toISOString().slice(0, 10),
      employmentStatus: 'ACTIVE',
      qualifications: params.qualifications,
      roomNumber: params.roomNumber || 'Central Admin Complex'
    };

    this.staffList.push(newStaff);
    this.saveStaff();

    this.logAudit({
      action: 'STAFF_MEMBER_CREATED',
      performedByUserId: params.performedByUser.id,
      performedByName: params.performedByUser.name,
      targetStaffId: newStaff.id,
      targetStaffName: newStaff.name,
      details: `Appointed ${newStaff.name} as ${newStaff.positionTitle} in ${newStaff.sectionName}.`
    });

    return newStaff;
  }

  public updateStaffReportingAuthority(
    staffId: string,
    newReportingUserId: string,
    performedByUser: User
  ): boolean {
    this.init();
    const staff = this.staffList.find(s => s.id === staffId);
    if (!staff) return false;

    const oldReporting = staff.reportingToName;
    const newReportingStaff = this.staffList.find(s => s.userId === newReportingUserId);

    staff.reportingToUserId = newReportingUserId;
    staff.reportingToName = newReportingStaff 
      ? `${newReportingStaff.name} (${newReportingStaff.positionTitle})` 
      : 'Dr. Sanjay Patel (Registrar)';

    this.saveStaff();

    this.logAudit({
      action: 'REPORTING_AUTHORITY_CHANGED',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      targetStaffId: staff.id,
      targetStaffName: staff.name,
      details: `Reassigned reporting authority of ${staff.name} from "${oldReporting}" to "${staff.reportingToName}".`
    });

    return true;
  }

  public assignResponsibility(params: {
    staffId: string;
    responsibilityId: string;
    priority: WorkItemPriority;
    remarks?: string;
    performedByUser: User;
  }): RegistrarStaffResponsibilityAssignment {
    this.init();
    const staff = this.staffList.find(s => s.id === params.staffId);
    const resp = this.responsibilities.find(r => r.id === params.responsibilityId);

    const newAssignment: RegistrarStaffResponsibilityAssignment = {
      id: `R-ASSIGN-${Date.now().toString().slice(-4)}`,
      staffId: params.staffId,
      userId: staff?.userId || params.staffId,
      staffName: staff?.name || 'Staff Member',
      responsibilityId: params.responsibilityId,
      responsibilityTitle: resp?.title || 'Office Responsibility',
      category: resp?.category || 'GENERAL',
      assignedByUserId: params.performedByUser.id,
      assignedByName: `${params.performedByUser.name} (${params.performedByUser.role})`,
      assignedDate: new Date().toISOString().slice(0, 10),
      startDate: new Date().toISOString().slice(0, 10),
      priority: params.priority,
      status: 'ACTIVE',
      remarks: params.remarks
    };

    this.assignments.push(newAssignment);
    this.saveAssignments();

    this.logAudit({
      action: 'RESPONSIBILITY_ASSIGNED',
      performedByUserId: params.performedByUser.id,
      performedByName: params.performedByUser.name,
      targetStaffId: staff?.id,
      targetStaffName: staff?.name,
      details: `Assigned responsibility "${newAssignment.responsibilityTitle}" to ${newAssignment.staffName}.`
    });

    return newAssignment;
  }

  public assignWorkItem(params: {
    title: string;
    description: string;
    workType: WorkItemType;
    priority: WorkItemPriority;
    sectionId: string;
    assignedToStaffId: string;
    dueDate: string;
    remarks?: string;
    performedByUser: User;
  }): RegistrarOfficeWorkItem {
    this.init();
    const section = this.sections.find(s => s.id === params.sectionId);
    const staff = this.staffList.find(s => s.id === params.assignedToStaffId);

    const newItem: RegistrarOfficeWorkItem = {
      id: `WORK-${Date.now().toString().slice(-4)}`,
      workNumber: `RO/MATTER/${Date.now().toString().slice(-4)}`,
      title: params.title,
      description: params.description,
      workType: params.workType,
      priority: params.priority,
      sectionId: params.sectionId,
      sectionName: section?.sectionName || 'Central Administration Section',
      assignedToStaffId: params.assignedToStaffId,
      assignedToUserId: staff?.userId || params.assignedToStaffId,
      assignedToName: staff?.name || 'Assigned Officer',
      assignedByUserId: params.performedByUser.id,
      assignedByName: `${params.performedByUser.name} (${params.performedByUser.role})`,
      dueDate: params.dueDate,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      remarks: params.remarks,
      history: [
        {
          id: `HIST-${Date.now()}`,
          action: 'WORK_ASSIGNED',
          performedByUserId: params.performedByUser.id,
          performedByName: params.performedByUser.name,
          timestamp: new Date().toISOString(),
          notes: params.remarks || 'Matter created and assigned.'
        }
      ]
    };

    this.workItems.unshift(newItem);
    this.saveWorkItems();

    this.logAudit({
      action: 'WORK_ITEM_ASSIGNED',
      performedByUserId: params.performedByUser.id,
      performedByName: params.performedByUser.name,
      targetStaffId: staff?.id,
      targetStaffName: staff?.name,
      details: `Created and assigned matter "${newItem.title}" (${newItem.workNumber}) to ${newItem.assignedToName} with due date ${newItem.dueDate}.`
    });

    return newItem;
  }

  public updateWorkItemStatus(
    workId: string,
    newStatus: WorkItemStatus,
    notes: string,
    performedByUser: User
  ): boolean {
    this.init();
    const work = this.workItems.find(w => w.id === workId);
    if (!work) return false;

    const oldStatus = work.status;
    work.status = newStatus;
    if (newStatus === 'COMPLETED') {
      work.completedAt = new Date().toISOString();
    }

    work.history.unshift({
      id: `HIST-${Date.now()}`,
      action: `STATUS_CHANGED_TO_${newStatus}`,
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      timestamp: new Date().toISOString(),
      notes,
      previousStatus: oldStatus,
      newStatus
    });

    this.saveWorkItems();

    this.logAudit({
      action: 'WORK_STATUS_UPDATED',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      details: `Updated status of ${work.workNumber} from ${oldStatus} to ${newStatus}. Note: ${notes}`
    });

    return true;
  }

  public reassignWorkItem(
    workId: string,
    newAssignedStaffId: string,
    reason: string,
    performedByUser: User
  ): boolean {
    this.init();
    const work = this.workItems.find(w => w.id === workId);
    const newStaff = this.staffList.find(s => s.id === newAssignedStaffId);
    if (!work || !newStaff) return false;

    const oldStaffName = work.assignedToName;
    work.assignedToStaffId = newStaff.id;
    work.assignedToUserId = newStaff.userId;
    work.assignedToName = newStaff.name;

    work.history.unshift({
      id: `HIST-${Date.now()}`,
      action: 'WORK_REASSIGNED',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      timestamp: new Date().toISOString(),
      notes: `Reassigned from ${oldStaffName} to ${newStaff.name}. Reason: ${reason}`
    });

    this.saveWorkItems();

    this.logAudit({
      action: 'WORK_REASSIGNED',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      details: `Reassigned matter ${work.workNumber} from ${oldStaffName} to ${newStaff.name}. Reason: ${reason}`
    });

    return true;
  }

  public escalateWorkItem(
    workId: string,
    escalationReason: string,
    performedByUser: User
  ): boolean {
    this.init();
    const work = this.workItems.find(w => w.id === workId);
    if (!work) return false;

    work.status = 'ESCALATED';
    work.escalatedToUserId = 'USER-REGISTRAR';
    work.escalatedToName = 'Dr. Sanjay Patel (Registrar)';
    work.escalationReason = escalationReason;

    work.history.unshift({
      id: `HIST-${Date.now()}`,
      action: 'WORK_ESCALATED_TO_REGISTRAR',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      timestamp: new Date().toISOString(),
      notes: `Escalated to Registrar. Reason: ${escalationReason}`,
      newStatus: 'ESCALATED'
    });

    this.saveWorkItems();

    this.logAudit({
      action: 'WORK_ESCALATED_TO_REGISTRAR',
      performedByUserId: performedByUser.id,
      performedByName: performedByUser.name,
      details: `Matter ${work.workNumber} escalated to Registrar. Reason: ${escalationReason}`
    });

    return true;
  }

  private logAudit(entry: Omit<RegistrarOfficeAuditLog, 'id' | 'timestamp'>) {
    const log: RegistrarOfficeAuditLog = {
      id: `RO-AUDIT-${Date.now()}`,
      ...entry,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.saveAuditLogs();
  }
}

export const registrarOfficeService = new RegistrarOfficeService();
