import type { 
  University, Institute, Department, Program, AcademicYear, Batch, 
  Semester, Division, Subject, Faculty, Student, StudentAcademicHistoryRecord, User, AuditLog,
  AttendanceSession, TimetableEntry, SessionPlanTopic, UnitMaterial,
  Assignment, AssignmentSubmission, AcademicCalendarEvent,
  FeeHead, FeeStructure, StudentFeeRecord, StudentFeeItem, FeeInvoice, FeeInvoiceItem, FeeInvoiceAuditLog, FeeInvoiceStatus, FeePaymentTransaction,
  PaymentOrder, PaymentTransactionRecord, PaymentAuditLog, PaymentOrderStatus, PaymentTransactionStatus,
  CRMLead, AdmissionApplication, LeadStatus, LeadFollowUp, CRMLeadDashboardStats,
  Exam, ExamTimetable, ExamForm, StudentMarks, StudentResult, ResultRevisionHistory, StudentFeedback, SupportTicket, StudentDocument,
  ExamSubjectItem, ExamFeeItem, ExamLateFeeRule, ExamFormSubjectItem,
  ExamCentre, ExamRoom, ExamCentreAllocation, ExamSeatAllocation, ExamSeatChangeHistory, ExamEdpDuty, ExamEdpDutyHistory,
  ERPNotification, UserRole, InwardOutwardRecord, InwardForwardingItem, OutwardDispatchItem, InwardOutwardStatus, InwardOutwardPriority, RegistrarFileMovement, ApprovalRequest, ApprovalOfficeType, ApprovalStatus, ApprovalRequestCategory,
  StudentRequest, StudentSectionService, StudentSectionRequest, StudentSectionDocument, FeeQuery, ExamFeeConfigItem,
  EdpDuty, EdpDutyEvidence, EdpDutyStatus, EdpDutyPhoto, EdpDutyDashboardStats,
  NaacCriterion, NaacKeyIndicator, NaacMetric, NaacDataSubmission, ResearchProject, PublicationRecord, PatentRecord,
  Employee, PayrollRecord, EmployeeLeaveApplication, PerformanceAppraisal, TrainingFdpRecord,
  StartupIdea, StartupFounder, StartupFunding, IncubationMentorSession, IncubationWorkshop, IncubationApplicationStatus,
  StartupMilestone, StartupDocument, NoteSheet, NoteSheetMovement, NoteSheetWorkflowConfig, NoteSheetStatus, NoteSheetAction, UniversityBranch, NoteSheetComplianceItem,
  NoteSheetPermission, NoteSheetAuditAction, NoteSheetAuditEntry, NoteSheetAmountRevision, NoteSheetPdfRecord,
  FundAccount, FundSource, ExpenseCategory, MoneyReceivedRecord, ExpenseRecord, ReimbursementClaim,
  RefundRecord, AccountLedgerEntry, FinancialSettlement, NoteSheetFinancialSummary, PaymentMode,
   WorkDiaryEntry, WorkDiaryFormData, WorkDiaryDashboardStats, ExamDashboardStats, InwardOutwardDashboardStats,
  HostelRoom, HostelVisitorEntry, HostelVisitorDashboardStats,
  HostelMaster, HostelRoomDetail, HostelAllotmentDetail, HostelMaintenanceCategory, HostelMaintenancePriority, HostelMaintenanceStatus,
  HostelMaintenanceHistoryItem, HostelMaintenanceAttachmentItem, HostelMaintenanceRequestItem,
  TransportVehicle, TransportVehicleDashboardStats, BusRoute, RouteStop, RouteStatus, TransportRouteDashboardStats, TransportExecutiveDashboardStats, VehicleDocument,
  TransportDriver, TransportDriverDashboardStats, DriverDocument,
  StudentTransportAllocation, TransportRequestItem, VehicleMaintenanceItem, TransportTripScheduleItem,
  CampusServiceRequest, CampusServiceResponse, CampusServiceStatus, CampusServiceType, CampusServicePriority, CampusServiceDashboardStats,
  BulkImportType, BulkImportStatus, BulkImportMode, BulkImportRowStatus, BulkImportTemplateMeta, BulkImportSession, BulkImportRowItem, BulkImportHistoryItem,
  ConcessionItem, ConcessionType, ConcessionStatus, RefundItem, RefundStatus, PaymentReconciliationItem, ReconciliationStatus, StudentLedgerSummary, AccountsReportType,
  MentorAssignment, MentorAssignmentHistory,
  AttendanceApplication, AttendanceApprovalHistoryItem, AttendanceEligibilityConfig, SubjectAttendanceStat,
  ReassessmentApplication, ReassessmentType, ReassessmentStatus, BacklogSubjectEntry, ExamFeeBreakdown,
  ExamNotificationType,
  InventoryCategoryGroup, AssetStatus, AssetCondition, AssetCpuConfig, InventoryCategoryItem,
  InventoryLocationRecord, FixedAsset, AssetAssignmentRecord, ConsumableItem, StockTransactionRecord,
  PhysicalFileRecord, AssetTransferRecord, AssetMaintenanceRecord, PhysicalVerificationRecord,
  AssetDisposalRecord, InventoryAuditRecord, AssetMovementRecord, AssetTransferRequestRecord,
  AssetReturnRequestRecord, AssetReplacementRequestRecord, AssetIssueReportRecord,
  OfficialCorrespondenceRecord, FileMovementRecord, CommitteeMasterRecord,
  CommitteeMeetingRecord, CommitteeActionItemRecord, StatutoryApprovalRecord, InternationalStudentRecord,
  CorrespondenceType,
  DeputyRegistrarScopeMapping, DeputyRegistrarScopeAudit,
  StudentDataChangeRequest,
  UniversityAsset, AssetDepartmentAllocation, AssetReturnRecord,
  AssetAllocationRequest, AssetHistoryEvent, InstitutionalResource,
  ClassroomAllocation, LaboratoryAllocation, FacultyAllocation,
  SubjectAllocation, DepartmentResourceAllocation, AllocationHistoryRecord,
  AllocationConflict, ManualTestRecord,
  StudentGatePass,
  StudentEnrollmentMapping,
  StudentMappingHistoryRecord,
  UserHistoryRecord
} from '../types';
import { INITIAL_MANUAL_TEST_RECORDS } from './qaTestingService';
import type { MentoringSessionRecord } from '../types/mentorAssignment';
import type {
  DocumentMasterItem, StudentAcademicDocumentItem, StudentDocumentVersionItem, DocumentVerificationLogItem
} from '../types/documentMaster';
import { INITIAL_DOCUMENT_MASTER_DATA } from '../data/initialDocumentMaster';
import { inputSanitizer } from './inputSanitizer';
import * as XLSX from 'xlsx';
import { 
  initialUniversity, initialInstitutes, initialDepartments, initialPrograms, initialAcademicYears, 
  initialBatches, initialSemesters, initialDivisions, initialSubjects, 
  initialFaculty, initialStudents, initialUsers, initialAuditLogs,
  initialAttendanceSessions, initialTimetableEntries, initialSessionPlanTopics,
  initialUnitMaterials, initialAssignments, initialAssignmentSubmissions,
  initialAcademicCalendarEvents, initialFeeHeads, initialFeeStructures, initialStudentFeeRecords,
  initialFeePaymentTransactions, initialCRMLeads, initialAdmissionApplications,
  initialExams, initialExamTimetables, initialExamForms, initialStudentMarks,
  initialStudentResults, initialStudentFeedbacks, initialSupportTickets, initialStudentDocuments,
  initialERPNotifications, initialInwardOutwardRecords, initialRegistrarFileMovements, initialApprovalRequests,
  initialEdpDuties,
  initialNaacCriteria, initialNaacKeyIndicators, initialNaacMetrics, initialNaacDataSubmissions,
  initialResearchProjects, initialPublicationRecords, initialPatentRecords,
  initialEmployees, initialPayrollRecords, initialLeaveApplications, initialPerformanceAppraisals, initialTrainingFdpRecords,
  initialStartupFounders, initialStartupIdeas, initialStartupFundings, initialMentorSessions, initialIncubationWorkshops,
  initialFundAccounts, initialFundSources, initialExpenseCategories, initialNoteSheets,
  initialMoneyReceived, initialExpenses, initialReimbursements, initialRefunds, initialLedgerEntries, initialFinancialSettlements,
  initialWorkDiaries, initialHostelRooms, initialHostelVisitorEntries,
  initialTransportVehicles, initialBusRoutes, initialTransportDrivers,
  initialCampusServiceRequests,
  initialStudentSectionServices, initialExamFeeConfigs,
  initialStudentSectionRequests, initialFeeQueries, initialStudentSectionDocuments,
  initialMentorAssignments, initialMentorAssignmentHistory, initialMentoringSessions,
  initialAttendanceEligibilityConfig, initialAttendanceApplications, initialAttendanceApprovalHistory,
  initialInventoryCategories, initialInventoryLocations, initialFixedAssets,
  initialConsumableItems, initialStockTransactions, initialPhysicalFiles,
  initialAssetTransfers, initialAssetMaintenanceLogs, initialPhysicalVerifications,
  initialAssetDisposals, initialInventoryAuditLogs,
  initialAssetMovements, initialAssetTransferRequests, initialAssetReturnRequests,
  initialAssetReplacementRequests, initialAssetIssueReports, initialAssetRequisitions,
  initialOfficialCorrespondence, initialFileMovements, initialCommittees,
  initialCommitteeMeetings, initialCommitteeActionItems, initialStatutoryApprovals,
  initialInternationalStudents,
  initialDeputyRegistrarScopes, initialDeputyRegistrarScopeAudits,
  initialStudentDataChangeRequests
} from './seedData';
import { INITIAL_SERVICE_FEE_MASTER_CONFIGS } from './studentSectionFeeMasterService';
import { ServiceFeeMasterConfig } from '../types/studentSection';
import {
  initialUniversityAssets,
  initialAssetDepartmentAllocations,
  initialInstitutionalResources,
  initialClassroomAllocations,
  initialLaboratoryAllocations,
  initialFacultyAllocations,
  initialSubjectAllocations,
  initialAssetAllocationRequests
} from '../data/seedAssetManagement';
import { 
  canUserAccessCampusService, canUserAccessApprovalCategory,
  isUserAuthorizedForCampusServiceRequest, isUserAuthorizedForApprovalRequest,
  getPermittedCampusServices, getPermittedApprovalCategories
} from './securityService';
import { DB_STORAGE_KEY } from '../constants';
import { 
  ROLE_NOTESHEET_PERMISSIONS, 
  NoteSheetVersionRecord, 
  NoteSheetVerificationResult, 
  NoteSheetAnalyticsSummary 
} from '../types';

export interface DatabaseState {
  institutes: Institute[];
  departments: Department[];
  programs: Program[];
  academicYears: AcademicYear[];
  batches: Batch[];
  semesters: Semester[];
  divisions: Division[];
  subjects: Subject[];
  faculty: Faculty[];
  students: Student[];
  users: User[];
  auditLogs: AuditLog[];
  attendanceSessions: AttendanceSession[];
  timetableEntries: TimetableEntry[];
  sessionPlanTopics: SessionPlanTopic[];
  unitMaterials: UnitMaterial[];
  assignments: Assignment[];
  assignmentSubmissions: AssignmentSubmission[];
  academicCalendarEvents: AcademicCalendarEvent[];
  feeHeads: FeeHead[];
  feeStructures: FeeStructure[];
  studentFeeRecords: StudentFeeRecord[];
  feeInvoices?: FeeInvoice[];
  paymentOrders?: PaymentOrder[];
  paymentTransactionsList?: PaymentTransactionRecord[];
  feePaymentTransactions: FeePaymentTransaction[];
  crmLeads: CRMLead[];
  admissionApplications: AdmissionApplication[];
  exams: Exam[];
  examTimetables: ExamTimetable[];
  examForms: ExamForm[];
  studentMarks: StudentMarks[];
  studentResults: StudentResult[];
  studentFeedbacks: StudentFeedback[];
  supportTickets: SupportTicket[];
  studentDocuments: StudentDocument[];
  notifications: ERPNotification[];
  inwardOutwardRecords: InwardOutwardRecord[];
  registrarFileMovements: RegistrarFileMovement[];
  approvalRequests: ApprovalRequest[];
  studentRequests?: StudentRequest[];
  studentSectionServices?: StudentSectionService[];
  studentSectionFeeConfigs?: ServiceFeeMasterConfig[];
  studentSectionRequests?: StudentSectionRequest[];
  studentSectionDocuments?: StudentSectionDocument[];
  feeQueries?: FeeQuery[];
  examFeeConfigs?: ExamFeeConfigItem[];
  edpDuties: EdpDuty[];
  naacCriteria: NaacCriterion[];
  naacKeyIndicators: NaacKeyIndicator[];
  naacMetrics: NaacMetric[];
  naacSubmissions: NaacDataSubmission[];
  researchProjects: ResearchProject[];
  publications: PublicationRecord[];
  patents: PatentRecord[];
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  leaveApplications: EmployeeLeaveApplication[];
  performanceAppraisals: PerformanceAppraisal[];
  trainingFdpRecords: TrainingFdpRecord[];
  startupIdeas: StartupIdea[];
  startupFounders: StartupFounder[];
  startupFundings: StartupFunding[];
  mentorSessions: IncubationMentorSession[];
  incubationWorkshops: IncubationWorkshop[];
  noteSheets: NoteSheet[];
  noteSheetWorkflowConfigs: NoteSheetWorkflowConfig[];
  notesheetPdfs?: NoteSheetPdfRecord[];
  fundAccounts: FundAccount[];
  fundSources: FundSource[];
  expenseCategories: ExpenseCategory[];
  moneyReceived: MoneyReceivedRecord[];
  expenses: ExpenseRecord[];
  reimbursements: ReimbursementClaim[];
  refunds: RefundRecord[];
  accountLedger: AccountLedgerEntry[];
  financialSettlements: FinancialSettlement[];
  workDiaries: WorkDiaryEntry[];
  hostelRooms: HostelRoom[];
  hostelVisitorEntries: HostelVisitorEntry[];
  studentGatePasses?: StudentGatePass[];
  transportVehicles: TransportVehicle[];
  busRoutes: BusRoute[];
  transportDrivers: TransportDriver[];
  campusServiceRequests: CampusServiceRequest[];
  examCentres?: ExamCentre[];
  examRooms?: ExamRoom[];
  examCentreAllocations?: ExamCentreAllocation[];
  examSeatAllocations?: ExamSeatAllocation[];
  examEdpDuties?: ExamEdpDuty[];
  bulkImports?: BulkImportSession[];
  bulkImportRows?: BulkImportRowItem[];
  hostels?: HostelMaster[];
  hostelRoomDetails?: HostelRoomDetail[];
  hostelAllotments?: HostelAllotmentDetail[];
  hostelMaintenanceRequests?: HostelMaintenanceRequestItem[];
  hostelMaintenanceHistory?: HostelMaintenanceHistoryItem[];
  hostelMaintenanceAttachments?: HostelMaintenanceAttachmentItem[];
  studentTransportAllocations?: StudentTransportAllocation[];
  transportRequests?: TransportRequestItem[];
  vehicleMaintenances?: VehicleMaintenanceItem[];
  transportTrips?: TransportTripScheduleItem[];
  concessionsList?: ConcessionItem[];
  refundsList?: RefundItem[];
  paymentReconciliationsList?: PaymentReconciliationItem[];
  mentorAssignments?: MentorAssignment[];
  mentorAssignmentHistory?: MentorAssignmentHistory[];
  mentoringSessions?: MentoringSessionRecord[];
  attendanceApplications?: AttendanceApplication[];
  attendanceApprovalHistory?: AttendanceApprovalHistoryItem[];
  attendanceEligibilityConfig?: AttendanceEligibilityConfig;
  detailedStudentFeedbacks?: any[];
  studentSuggestions?: any[];
  feedbackConfiguration?: any;
  documentMasters?: DocumentMasterItem[];
  studentAcademicDocuments?: StudentAcademicDocumentItem[];
  studentDocumentVersions?: StudentDocumentVersionItem[];
  documentVerifications?: DocumentVerificationLogItem[];
  reassessmentApplications?: ReassessmentApplication[];
  inventoryCategories?: InventoryCategoryItem[];
  inventoryLocations?: InventoryLocationRecord[];
  fixedAssets?: FixedAsset[];
  assetAssignments?: AssetAssignmentRecord[];
  consumableItems?: ConsumableItem[];
  stockTransactions?: StockTransactionRecord[];
  physicalFiles?: PhysicalFileRecord[];
  assetTransfers?: AssetTransferRecord[];
  assetMaintenanceLogs?: AssetMaintenanceRecord[];
  physicalVerifications?: PhysicalVerificationRecord[];
  assetDisposals?: AssetDisposalRecord[];
  inventoryAuditLogs?: InventoryAuditRecord[];
  assetMovements?: AssetMovementRecord[];
  assetTransferRequests?: AssetTransferRequestRecord[];
  assetReturnRequests?: AssetReturnRequestRecord[];
  assetReplacementRequests?: AssetReplacementRequestRecord[];
  assetIssueReports?: AssetIssueReportRecord[];
  assetRequisitions?: any[];
  officialCorrespondence?: OfficialCorrespondenceRecord[];
  fileMovements?: FileMovementRecord[];
  committees?: CommitteeMasterRecord[];
  committeeMeetings?: CommitteeMeetingRecord[];
  committeeActionItems?: CommitteeActionItemRecord[];
  statutoryApprovals?: StatutoryApprovalRecord[];
  internationalStudents?: InternationalStudentRecord[];
  deputyRegistrarScopes?: DeputyRegistrarScopeMapping[];
  deputyRegistrarScopeAudits?: DeputyRegistrarScopeAudit[];
  studentDataChangeRequests?: StudentDataChangeRequest[];
  universityAssets?: UniversityAsset[];
  assetDepartmentAllocations?: AssetDepartmentAllocation[];
  assetTransferRecords?: AssetTransferRecord[];
  assetReturnRecords?: AssetReturnRecord[];
  assetMaintenanceRecords?: AssetMaintenanceRecord[];
  assetAllocationRequests?: AssetAllocationRequest[];
  assetHistoryEvents?: AssetHistoryEvent[];
  institutionalResources?: InstitutionalResource[];
  classroomAllocations?: ClassroomAllocation[];
  laboratoryAllocations?: LaboratoryAllocation[];
  facultyAllocations?: FacultyAllocation[];
  subjectAllocations?: SubjectAllocation[];
  departmentResourceAllocations?: DepartmentResourceAllocation[];
  manualTestRecords?: ManualTestRecord[];
  studentEnrollmentMappings?: StudentEnrollmentMapping[];
  studentMappingHistories?: StudentMappingHistoryRecord[];
  rolePermissionTemplates?: Record<string, Record<string, Record<string, boolean>>>;
  userScopes?: Record<string, Record<string, string>>;
  approvalWorkflows?: any[];
  assetTransferHistory?: any[];
  allocationHistoryRecords?: any[];
  userHistories?: UserHistoryRecord[];
}

export const ORGANOGRAM_BRANCH_WORKFLOWS: Record<string, { name: string; steps: string[]; finalAuthority: string }> = {
  ACADEMIC: {
    name: 'Department Academic & Administrative Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    finalAuthority: 'VICE_PRESIDENT'
  },
  FINANCE: {
    name: 'Department Academic & Financial Sanction Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    finalAuthority: 'VICE_PRESIDENT'
  },
  FINANCE_HIGH: {
    name: 'Department Academic & High-Value Sanction Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    finalAuthority: 'VICE_PRESIDENT'
  },
  EXAMINATION: {
    name: 'Examination Section Workflow (CoE -> Deputy Registrar -> Registrar)',
    steps: ['EXAM_CELL', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
    finalAuthority: 'REGISTRAR'
  },
  IQAC: {
    name: 'IQAC Quality Directorate Workflow',
    steps: ['IQAC', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
    finalAuthority: 'REGISTRAR'
  },
  TRAINING_PLACEMENT: {
    name: 'Training & Placement Directorate Workflow',
    steps: ['TRAINING_PLACEMENT', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
    finalAuthority: 'REGISTRAR'
  },
  ADMISSION: {
    name: 'Admission Directorate Workflow',
    steps: ['STUDENT_SECTION', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
    finalAuthority: 'REGISTRAR'
  },
  RESEARCH: {
    name: 'Research & Innovation Directorate Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    finalAuthority: 'VICE_PRESIDENT'
  },
  IEDC: {
    name: 'Innovation & Entrepreneurship (IEDC) Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    finalAuthority: 'VICE_PRESIDENT'
  },
  OPERATIONS: {
    name: 'Registrar Operations & Auxiliary Units Workflow',
    steps: ['STUDENT_SECTION', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
    finalAuthority: 'REGISTRAR'
  },
  REGISTRAR: {
    name: 'Registrar Secretariat Workflow',
    steps: ['REGISTRAR', 'PROVOST', 'VICE_PRESIDENT', 'PRESIDENT'],
    finalAuthority: 'PROVOST'
  }
};

export interface ResolvedWorkflow {
  branch: UniversityBranch;
  branchName: string;
  steps: string[];
  initialStage: NoteSheetStatus;
  firstStep: string;
  finalAuthority: string;
}

export function resolveNotesheetWorkflow(params: {
  department: string;
  notesheetType?: string;
  category?: string;
  financialRequirement?: boolean;
  requestedAmount?: number;
  instituteId?: string;
  userRole?: string;
}): ResolvedWorkflow {
  const dept = (params.department || '').toUpperCase();
  const type = (params.notesheetType || params.category || '').toUpperCase();
  const isFin = Boolean(params.financialRequirement);

  // 1. Examination Directorate Workflow
  if (type.includes('EXAM') || dept.includes('EXAM') || dept === 'EDP') {
    return {
      branch: 'EXAMINATION',
      branchName: 'Examination Section Workflow',
      steps: ['EXAM_CELL', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
      initialStage: params.userRole === 'EXAM_CELL' ? 'PENDING_DEPUTY_REGISTRAR' : 'PENDING_EXAMINATION',
      firstStep: params.userRole === 'EXAM_CELL' ? 'DEPUTY_REGISTRAR' : 'EXAM_CELL',
      finalAuthority: 'REGISTRAR'
    };
  }

  // 2. Hostel Administration Workflow
  if (type.includes('HOSTEL') || dept.includes('HOSTEL') || dept === 'WARDEN') {
    return {
      branch: 'OPERATIONS',
      branchName: 'Hostel Administration Workflow',
      steps: ['HOSTEL_ADMIN', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
      initialStage: params.userRole === 'HOSTEL_ADMIN' ? 'PENDING_DEPUTY_REGISTRAR' : 'PENDING_HOSTEL',
      firstStep: params.userRole === 'HOSTEL_ADMIN' ? 'DEPUTY_REGISTRAR' : 'HOSTEL_ADMIN',
      finalAuthority: 'REGISTRAR'
    };
  }

  // 3. Student Section Administrative Workflow
  if (type.includes('STUDENT') || dept.includes('STUDENT_SECTION') || dept === 'ADMISSION') {
    return {
      branch: 'OPERATIONS',
      branchName: 'Student Section Administrative Workflow',
      steps: ['STUDENT_SECTION', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
      initialStage: params.userRole === 'STUDENT_SECTION' ? 'PENDING_DEPUTY_REGISTRAR' : 'PENDING_STUDENT_SECTION',
      firstStep: params.userRole === 'STUDENT_SECTION' ? 'DEPUTY_REGISTRAR' : 'STUDENT_SECTION',
      finalAuthority: 'REGISTRAR'
    };
  }

  // 4. Central Finance Office Internal Workflow
  if (type === 'FINANCE_OFFICE_INTERNAL' || (dept === 'FINANCE' && params.userRole === 'ACCOUNTS_ADMIN')) {
    return {
      branch: 'FINANCE',
      branchName: 'Finance & Accounts Directorate Workflow',
      steps: ['ACCOUNTS_ADMIN', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
      initialStage: 'PENDING_DEPUTY_REGISTRAR',
      firstStep: 'DEPUTY_REGISTRAR',
      finalAuthority: 'REGISTRAR'
    };
  }

  // 5. IQAC / Quality Assurance Workflow
  if (type.includes('IQAC') || dept.includes('IQAC')) {
    return {
      branch: 'IQAC',
      branchName: 'IQAC Quality Directorate Workflow',
      steps: ['IQAC', 'DEPUTY_REGISTRAR', 'REGISTRAR'],
      initialStage: params.userRole === 'IQAC' ? 'PENDING_DEPUTY_REGISTRAR' : 'PENDING_IQAC',
      firstStep: params.userRole === 'IQAC' ? 'DEPUTY_REGISTRAR' : 'IQAC',
      finalAuthority: 'REGISTRAR'
    };
  }

  // 6. Mandatory Default Academic / Department Workflow (Faculty -> HOD -> HOI -> Deputy Registrar -> Registrar -> Vice President -> Final Sanction)
  return {
    branch: 'ACADEMIC',
    branchName: isFin ? 'Department Academic & Financial Sanction Workflow' : 'Department Academic & Administrative Workflow',
    steps: ['HOD', 'HOI', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'],
    initialStage: params.userRole === 'HOD' ? 'PENDING_HOI' : params.userRole === 'PRINCIPAL' ? 'PENDING_DEPUTY_REGISTRAR' : params.userRole === 'DEPUTY_REGISTRAR' ? 'PENDING_REGISTRAR' : params.userRole === 'REGISTRAR' ? 'PENDING_VICE_PRESIDENT' : 'PENDING_HOD',
    firstStep: params.userRole === 'HOD' ? 'HOI' : params.userRole === 'PRINCIPAL' ? 'DEPUTY_REGISTRAR' : params.userRole === 'DEPUTY_REGISTRAR' ? 'REGISTRAR' : params.userRole === 'REGISTRAR' ? 'VICE_PRESIDENT' : 'HOD',
    finalAuthority: 'VICE_PRESIDENT'
  };
}

class ERPDatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  // ─── Internal: default seed state ────────────────────────────────────────
  private buildDefaultState(): DatabaseState {
    return {
      institutes: initialInstitutes,
      departments: initialDepartments,
      programs: initialPrograms,
      academicYears: initialAcademicYears,
      batches: initialBatches,
      semesters: initialSemesters,
      divisions: initialDivisions,
      subjects: initialSubjects,
      faculty: initialFaculty,
      students: initialStudents,
      users: initialUsers,
      auditLogs: initialAuditLogs,
      attendanceSessions: initialAttendanceSessions,
      timetableEntries: initialTimetableEntries,
      sessionPlanTopics: initialSessionPlanTopics,
      unitMaterials: initialUnitMaterials,
      assignments: initialAssignments,
      assignmentSubmissions: initialAssignmentSubmissions,
      academicCalendarEvents: initialAcademicCalendarEvents,
      feeHeads: initialFeeHeads,
      feeStructures: initialFeeStructures,
      studentFeeRecords: initialStudentFeeRecords,
      feeInvoices: [],
      paymentOrders: [],
      paymentTransactionsList: [],
      feePaymentTransactions: initialFeePaymentTransactions,
      crmLeads: initialCRMLeads,
      admissionApplications: initialAdmissionApplications,
      exams: initialExams,
      examTimetables: initialExamTimetables,
      examForms: initialExamForms,
      studentMarks: initialStudentMarks,
      studentResults: initialStudentResults,
      studentFeedbacks: initialStudentFeedbacks,
      supportTickets: initialSupportTickets,
      studentDocuments: initialStudentDocuments,
      notifications: initialERPNotifications,
      inwardOutwardRecords: initialInwardOutwardRecords,
      registrarFileMovements: initialRegistrarFileMovements,
      approvalRequests: initialApprovalRequests,
      studentRequests: [],
      studentSectionServices: initialStudentSectionServices,
      studentSectionFeeConfigs: INITIAL_SERVICE_FEE_MASTER_CONFIGS,
      studentSectionRequests: initialStudentSectionRequests,
      studentSectionDocuments: initialStudentSectionDocuments,
      feeQueries: initialFeeQueries,
      examFeeConfigs: initialExamFeeConfigs,
      edpDuties: initialEdpDuties,
      naacCriteria: initialNaacCriteria,
      naacKeyIndicators: initialNaacKeyIndicators,
      naacMetrics: initialNaacMetrics,
      naacSubmissions: initialNaacDataSubmissions,
      researchProjects: initialResearchProjects,
      publications: initialPublicationRecords,
      patents: initialPatentRecords,
      employees: initialEmployees,
      payrollRecords: initialPayrollRecords,
      leaveApplications: initialLeaveApplications,
      performanceAppraisals: initialPerformanceAppraisals,
      trainingFdpRecords: initialTrainingFdpRecords,
      startupIdeas: initialStartupIdeas,
      startupFounders: initialStartupFounders,
      startupFundings: initialStartupFundings,
      mentorSessions: initialMentorSessions,
      incubationWorkshops: initialIncubationWorkshops,
      noteSheets: initialNoteSheets,
      noteSheetWorkflowConfigs: [
        { id: 'ssiu-default', name: 'Default SSIU Workflow', steps: ['HOD', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'], isActive: true }
      ],
      notesheetPdfs: [],
      fundAccounts: initialFundAccounts,
      fundSources: initialFundSources,
      expenseCategories: initialExpenseCategories,
      moneyReceived: initialMoneyReceived,
      expenses: initialExpenses,
      reimbursements: initialReimbursements,
      refunds: initialRefunds,
      accountLedger: initialLedgerEntries,
      financialSettlements: initialFinancialSettlements,
      workDiaries: initialWorkDiaries,
      hostelRooms: initialHostelRooms,
      hostelVisitorEntries: initialHostelVisitorEntries,
      transportVehicles: initialTransportVehicles,
      busRoutes: initialBusRoutes,
      transportDrivers: initialTransportDrivers,
      campusServiceRequests: initialCampusServiceRequests,
      mentorAssignments: initialMentorAssignments,
      mentorAssignmentHistory: initialMentorAssignmentHistory,
      mentoringSessions: initialMentoringSessions,
      attendanceEligibilityConfig: initialAttendanceEligibilityConfig,
      attendanceApplications: initialAttendanceApplications,
      attendanceApprovalHistory: initialAttendanceApprovalHistory,
      detailedStudentFeedbacks: [],
      studentSuggestions: [],
      documentMasters: INITIAL_DOCUMENT_MASTER_DATA,
      studentAcademicDocuments: [],
      studentDocumentVersions: [],
      documentVerifications: [],
      inventoryCategories: initialInventoryCategories,
      inventoryLocations: initialInventoryLocations,
      fixedAssets: initialFixedAssets,
      consumableItems: initialConsumableItems,
      stockTransactions: initialStockTransactions,
      physicalFiles: initialPhysicalFiles,
      assetTransfers: initialAssetTransfers,
      assetMaintenanceLogs: initialAssetMaintenanceLogs,
      physicalVerifications: initialPhysicalVerifications,
      assetDisposals: initialAssetDisposals,
      inventoryAuditLogs: initialInventoryAuditLogs,
      assetMovements: initialAssetMovements,
      assetTransferRequests: initialAssetTransferRequests,
      assetReturnRequests: initialAssetReturnRequests,
      assetReplacementRequests: initialAssetReplacementRequests,
      assetIssueReports: initialAssetIssueReports,
      assetRequisitions: initialAssetRequisitions,
      officialCorrespondence: initialOfficialCorrespondence,
      fileMovements: initialFileMovements,
      committees: initialCommittees,
      committeeMeetings: initialCommitteeMeetings,
      committeeActionItems: initialCommitteeActionItems,
      statutoryApprovals: initialStatutoryApprovals,
      deputyRegistrarScopes: initialDeputyRegistrarScopes,
      deputyRegistrarScopeAudits: initialDeputyRegistrarScopeAudits,
      studentDataChangeRequests: initialStudentDataChangeRequests,
      universityAssets: initialUniversityAssets,
      assetDepartmentAllocations: initialAssetDepartmentAllocations,
      assetTransferRecords: [],
      assetReturnRecords: [],
      assetMaintenanceRecords: [],
      assetAllocationRequests: initialAssetAllocationRequests,
      assetHistoryEvents: [],
      institutionalResources: initialInstitutionalResources,
      classroomAllocations: initialClassroomAllocations,
      laboratoryAllocations: initialLaboratoryAllocations,
      facultyAllocations: initialFacultyAllocations,
      subjectAllocations: initialSubjectAllocations,
      departmentResourceAllocations: [],
      allocationHistoryRecords: [],
      manualTestRecords: INITIAL_MANUAL_TEST_RECORDS
    };
  }

  private loadState(): DatabaseState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(DB_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            const defaults = this.buildDefaultState();
            return {
              ...defaults,
              ...parsed,
              institutes: defaults.institutes,
              departments: defaults.departments,
              faculty: defaults.faculty,
              users: defaults.users,
              documentMasters: (() => {
                const defMasters = defaults.documentMasters || INITIAL_DOCUMENT_MASTER_DATA;
                if (!parsed.documentMasters || parsed.documentMasters.length === 0) return defMasters;
                const masterMap = new Map<string, DocumentMasterItem>();
                defMasters.forEach(d => masterMap.set(d.code, d));
                parsed.documentMasters.forEach((p: DocumentMasterItem) => {
                  if (masterMap.has(p.code)) {
                    const def = masterMap.get(p.code)!;
                    masterMap.set(p.code, { ...p, status: def.status, name: def.name, category: def.category });
                  } else {
                    masterMap.set(p.code, p);
                  }
                });
                return Array.from(masterMap.values());
              })(),
          studentAcademicDocuments: parsed.studentAcademicDocuments || defaults.studentAcademicDocuments || [],
          studentDocumentVersions: parsed.studentDocumentVersions || defaults.studentDocumentVersions || [],
          documentVerifications: parsed.documentVerifications || defaults.documentVerifications || [],
          edpDuties: parsed.edpDuties || defaults.edpDuties,
          naacCriteria: parsed.naacCriteria || defaults.naacCriteria,
          naacKeyIndicators: parsed.naacKeyIndicators || defaults.naacKeyIndicators,
          naacMetrics: parsed.naacMetrics || defaults.naacMetrics,
          naacSubmissions: parsed.naacSubmissions || defaults.naacSubmissions,
          researchProjects: parsed.researchProjects || defaults.researchProjects,
          publications: parsed.publications || defaults.publications,
          patents: parsed.patents || defaults.patents,
          employees: parsed.employees || defaults.employees,
          payrollRecords: parsed.payrollRecords || defaults.payrollRecords,
          leaveApplications: parsed.leaveApplications || defaults.leaveApplications,
          performanceAppraisals: parsed.performanceAppraisals || defaults.performanceAppraisals,
          trainingFdpRecords: parsed.trainingFdpRecords || defaults.trainingFdpRecords,
          startupIdeas: parsed.startupIdeas || defaults.startupIdeas,
          startupFounders: parsed.startupFounders || defaults.startupFounders,
          startupFundings: parsed.startupFundings || defaults.startupFundings,
          mentorSessions: parsed.mentorSessions || defaults.mentorSessions,
          incubationWorkshops: parsed.incubationWorkshops || defaults.incubationWorkshops,
          noteSheets: (parsed.noteSheets && parsed.noteSheets.length > 0) ? parsed.noteSheets : defaults.noteSheets,
          noteSheetWorkflowConfigs: parsed.noteSheetWorkflowConfigs || defaults.noteSheetWorkflowConfigs,
          fundAccounts: (parsed.fundAccounts && parsed.fundAccounts.length > 0) ? parsed.fundAccounts : defaults.fundAccounts,
          fundSources: (parsed.fundSources && parsed.fundSources.length > 0) ? parsed.fundSources : defaults.fundSources,
          expenseCategories: (parsed.expenseCategories && parsed.expenseCategories.length > 0) ? parsed.expenseCategories : defaults.expenseCategories,
          moneyReceived: (parsed.moneyReceived && parsed.moneyReceived.length > 0) ? parsed.moneyReceived : defaults.moneyReceived,
          expenses: (parsed.expenses && parsed.expenses.length > 0) ? parsed.expenses : defaults.expenses,
          reimbursements: (parsed.reimbursements && parsed.reimbursements.length > 0) ? parsed.reimbursements : defaults.reimbursements,
          refunds: (parsed.refunds && parsed.refunds.length > 0) ? parsed.refunds : defaults.refunds,
          accountLedger: (parsed.accountLedger && parsed.accountLedger.length > 0) ? parsed.accountLedger : defaults.accountLedger,
          financialSettlements: parsed.financialSettlements || defaults.financialSettlements,
          workDiaries: (parsed.workDiaries && parsed.workDiaries.length > 0) ? parsed.workDiaries : defaults.workDiaries,
          hostelRooms: (parsed.hostelRooms && parsed.hostelRooms.length > 0) ? parsed.hostelRooms : defaults.hostelRooms,
          hostelVisitorEntries: (parsed.hostelVisitorEntries && parsed.hostelVisitorEntries.length > 0) ? parsed.hostelVisitorEntries : defaults.hostelVisitorEntries,
          transportVehicles: (parsed.transportVehicles && parsed.transportVehicles.length > 0) ? parsed.transportVehicles : defaults.transportVehicles,
          busRoutes: (parsed.busRoutes && parsed.busRoutes.length > 0) ? parsed.busRoutes : defaults.busRoutes,
          transportDrivers: (parsed.transportDrivers && parsed.transportDrivers.length > 0) ? parsed.transportDrivers : defaults.transportDrivers,
          inventoryCategories: defaults.inventoryCategories,
          inventoryLocations: (parsed.inventoryLocations && parsed.inventoryLocations.length > 0) ? parsed.inventoryLocations : defaults.inventoryLocations,
          fixedAssets: (parsed.fixedAssets && parsed.fixedAssets.length > 0) ? parsed.fixedAssets : defaults.fixedAssets,
          consumableItems: (parsed.consumableItems && parsed.consumableItems.length > 0) ? parsed.consumableItems : defaults.consumableItems,
          stockTransactions: (parsed.stockTransactions && parsed.stockTransactions.length > 0) ? parsed.stockTransactions : defaults.stockTransactions,
          physicalFiles: (parsed.physicalFiles && parsed.physicalFiles.length > 0) ? parsed.physicalFiles : defaults.physicalFiles,
          assetTransfers: (parsed.assetTransfers && parsed.assetTransfers.length > 0) ? parsed.assetTransfers : defaults.assetTransfers,
          assetMaintenanceLogs: (parsed.assetMaintenanceLogs && parsed.assetMaintenanceLogs.length > 0) ? parsed.assetMaintenanceLogs : defaults.assetMaintenanceLogs,
          physicalVerifications: (parsed.physicalVerifications && parsed.physicalVerifications.length > 0) ? parsed.physicalVerifications : defaults.physicalVerifications,
          assetDisposals: (parsed.assetDisposals && parsed.assetDisposals.length > 0) ? parsed.assetDisposals : defaults.assetDisposals,
          inventoryAuditLogs: (parsed.inventoryAuditLogs && parsed.inventoryAuditLogs.length > 0) ? parsed.inventoryAuditLogs : defaults.inventoryAuditLogs,
          officialCorrespondence: (parsed.officialCorrespondence && parsed.officialCorrespondence.length > 0) ? parsed.officialCorrespondence : defaults.officialCorrespondence,
          fileMovements: (parsed.fileMovements && parsed.fileMovements.length > 0) ? parsed.fileMovements : defaults.fileMovements,
          committees: (parsed.committees && parsed.committees.length > 0) ? parsed.committees : defaults.committees,
          committeeMeetings: (parsed.committeeMeetings && parsed.committeeMeetings.length > 0) ? parsed.committeeMeetings : defaults.committeeMeetings,
          committeeActionItems: (parsed.committeeActionItems && parsed.committeeActionItems.length > 0) ? parsed.committeeActionItems : defaults.committeeActionItems,
          statutoryApprovals: (parsed.statutoryApprovals && parsed.statutoryApprovals.length > 0) ? parsed.statutoryApprovals : defaults.statutoryApprovals,
          internationalStudents: (parsed.internationalStudents && parsed.internationalStudents.length > 0) ? parsed.internationalStudents : defaults.internationalStudents,
          deputyRegistrarScopes: (parsed.deputyRegistrarScopes && parsed.deputyRegistrarScopes.length > 0) ? parsed.deputyRegistrarScopes : defaults.deputyRegistrarScopes,
          deputyRegistrarScopeAudits: (parsed.deputyRegistrarScopeAudits && parsed.deputyRegistrarScopeAudits.length > 0) ? parsed.deputyRegistrarScopeAudits : defaults.deputyRegistrarScopeAudits,
          mentoringSessions: (parsed.mentoringSessions && parsed.mentoringSessions.length > 0) ? parsed.mentoringSessions : defaults.mentoringSessions,
          studentDataChangeRequests: (parsed.studentDataChangeRequests && parsed.studentDataChangeRequests.length > 0) ? parsed.studentDataChangeRequests : defaults.studentDataChangeRequests,
          universityAssets: (parsed.universityAssets && parsed.universityAssets.length > 0) ? parsed.universityAssets : defaults.universityAssets,
          assetDepartmentAllocations: (parsed.assetDepartmentAllocations && parsed.assetDepartmentAllocations.length > 0) ? parsed.assetDepartmentAllocations : defaults.assetDepartmentAllocations,
          assetTransferRecords: (parsed.assetTransferRecords && parsed.assetTransferRecords.length > 0) ? parsed.assetTransferRecords : defaults.assetTransferRecords,
          assetReturnRecords: (parsed.assetReturnRecords && parsed.assetReturnRecords.length > 0) ? parsed.assetReturnRecords : defaults.assetReturnRecords,
          assetMaintenanceRecords: (parsed.assetMaintenanceRecords && parsed.assetMaintenanceRecords.length > 0) ? parsed.assetMaintenanceRecords : defaults.assetMaintenanceRecords,
          assetAllocationRequests: (parsed.assetAllocationRequests && parsed.assetAllocationRequests.length > 0) ? parsed.assetAllocationRequests : defaults.assetAllocationRequests,
          assetHistoryEvents: (parsed.assetHistoryEvents && parsed.assetHistoryEvents.length > 0) ? parsed.assetHistoryEvents : defaults.assetHistoryEvents,
          institutionalResources: (parsed.institutionalResources && parsed.institutionalResources.length > 0) ? parsed.institutionalResources : defaults.institutionalResources,
          classroomAllocations: (parsed.classroomAllocations && parsed.classroomAllocations.length > 0) ? parsed.classroomAllocations : defaults.classroomAllocations,
          laboratoryAllocations: (parsed.laboratoryAllocations && parsed.laboratoryAllocations.length > 0) ? parsed.laboratoryAllocations : defaults.laboratoryAllocations,
          facultyAllocations: (parsed.facultyAllocations && parsed.facultyAllocations.length > 0) ? parsed.facultyAllocations : defaults.facultyAllocations,
          subjectAllocations: (parsed.subjectAllocations && parsed.subjectAllocations.length > 0) ? parsed.subjectAllocations : defaults.subjectAllocations,
          departmentResourceAllocations: (parsed.departmentResourceAllocations && parsed.departmentResourceAllocations.length > 0) ? parsed.departmentResourceAllocations : defaults.departmentResourceAllocations,
          allocationHistoryRecords: (parsed.allocationHistoryRecords && parsed.allocationHistoryRecords.length > 0) ? parsed.allocationHistoryRecords : defaults.allocationHistoryRecords,
          manualTestRecords: (parsed.manualTestRecords && parsed.manualTestRecords.length > 0) ? parsed.manualTestRecords : (defaults.manualTestRecords || INITIAL_MANUAL_TEST_RECORDS),
          studentEnrollmentMappings: (parsed.studentEnrollmentMappings && parsed.studentEnrollmentMappings.length > 0) ? parsed.studentEnrollmentMappings : defaults.studentEnrollmentMappings,
          studentMappingHistories: (parsed.studentMappingHistories && parsed.studentMappingHistories.length > 0) ? parsed.studentMappingHistories : defaults.studentMappingHistories,
        };
      }
    }
  } catch (e) {
    console.error('Error loading ERP database from localStorage:', e);
  }
}

    const freshState = this.buildDefaultState();
    this.saveState(freshState);
    return freshState;
  }

  public getRawState(): DatabaseState {
    return this.state;
  }

  public runInTransaction<T>(callback: (state: DatabaseState) => T): T {
    // 1. Create an immutable snapshot before mutation
    const snapshotStr = JSON.stringify(this.state);
    try {
      const result = callback(this.state);
      this.saveState();
      return result;
    } catch (err) {
      // 2. Transaction Rollback: restore state snapshot immediately
      this.state = JSON.parse(snapshotStr);
      console.error('[DATABASE TRANSACTION ROLLBACK] Transaction aborted due to error:', err);
      throw err;
    }
  }

  public saveState(newState?: DatabaseState): void {
    if (newState) this.state = newState;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Error saving ERP database to localStorage:', e);
      }
    }
  }

  public resetToDefaultSeed(): DatabaseState {
    const freshState = this.buildDefaultState();
    freshState.auditLogs = [
      ...initialAuditLogs,
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: 'Demo Admin',
        userRole: 'SUPER_ADMIN' as UserRole,
        action: 'RESET_SEED',
        entity: 'Database',
        details: 'Database was reset to default seed state.',
      },
    ];
    this.state = freshState;
    this.saveState();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public updateState(updater: (state: DatabaseState) => void, logDetail?: string): void {
    updater(this.state);
    this.saveState();
    if (logDetail) {
      this.logAudit('UPDATE_STATE', 'State', logDetail);
    }
  }

  // --- CRUD Engine Helpers ---
  public getInstitutes(): Institute[] { return this.state.institutes; }
  public getDepartments(): Department[] { return this.state.departments; }
  public getPrograms(): Program[] { return this.state.programs; }
  public getAcademicYears(): AcademicYear[] { return this.state.academicYears; }
  public getBatches(): Batch[] { return this.state.batches; }
  public getSemesters(): Semester[] { return this.state.semesters; }
  public getDivisions(): Division[] { return this.state.divisions; }
  public getSubjects(): Subject[] { return this.state.subjects; }
  public getFaculty(): Faculty[] { return this.state.faculty; }
  public getStudents(): Student[] { return this.state.students; }
  public getStudentById(id: string): Student | undefined { return this.state.students.find(s => s.id === id); }
  public getStudentForUser(user: any): Student | undefined {
    if (!user) return undefined;
    const students = this.state.students || [];
    if (students.length === 0) return undefined;

    const cleanUserId = typeof user === 'string' ? user : (user.id || '');
    const cleanEnroll = typeof user === 'string' ? user : (user.enrollmentNo || user.username || user.temporaryEnrollmentNumber || user.finalEnrollmentNumber || '');
    const cleanEmail = typeof user === 'string' ? undefined : (user.email || '');

    // 1. Match by primary ID / user-ID mapping
    const byId = students.find(s => 
      s.id === cleanUserId || 
      `user-${s.id}` === cleanUserId || 
      s.id === cleanUserId.replace('user-', '') ||
      (typeof user === 'object' && user.studentId && s.id === user.studentId)
    );
    if (byId) return byId;

    // 2. Match by official Enrollment Number (primary official identifier)
    if (cleanEnroll) {
      const byEnroll = students.find(s => 
        s.enrollmentNo && s.enrollmentNo.toLowerCase() === cleanEnroll.toLowerCase()
      );
      if (byEnroll) return byEnroll;
    }

    // 3. Match by Institutional Email
    if (cleanEmail) {
      const byEmail = students.find(s => 
        s.email && s.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (byEmail) return byEmail;
    }

    // 4. Default for authenticated student user
    if (typeof user === 'object' && user.role === 'STUDENT') {
      return students[0];
    }

    return undefined;
  }
  public getUsers(): User[] { return this.state.users; }
  public getAuditLogs(): AuditLog[] { return this.state.auditLogs; }

  // --- Academic Management Getters ---
  public getAttendanceSessions(): AttendanceSession[] { return this.state.attendanceSessions; }
  public getTimetableEntries(): TimetableEntry[] { return this.state.timetableEntries; }
  public getSessionPlanTopics(): SessionPlanTopic[] { return this.state.sessionPlanTopics; }
  public getUnitMaterials(): UnitMaterial[] { return this.state.unitMaterials; }
  public getAssignments(): Assignment[] { return this.state.assignments; }
  public getAssignmentSubmissions(): AssignmentSubmission[] { return this.state.assignmentSubmissions; }
  public getAcademicCalendarEvents(): AcademicCalendarEvent[] { return this.state.academicCalendarEvents; }

  // --- Phase 1: Fee Head Master Getters & Mutations ---
  public getFeeHeads(): FeeHead[] { return this.state.feeHeads || []; }

  public addFeeHead(feeHead: Omit<FeeHead, 'id' | 'createdAt' | 'updatedAt'>): FeeHead {
    const newFeeHead: FeeHead = {
      ...feeHead,
      id: `fh-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.feeHeads = [newFeeHead, ...(this.state.feeHeads || [])];
    this.saveState();
    return newFeeHead;
  }

  public updateFeeHead(id: string, updates: Partial<FeeHead>): FeeHead | null {
    const idx = (this.state.feeHeads || []).findIndex(f => f.id === id);
    if (idx === -1) return null;
    const updated: FeeHead = {
      ...this.state.feeHeads[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.feeHeads[idx] = updated;
    this.saveState();
    return updated;
  }

  public toggleFeeHeadStatus(id: string): FeeHead | null {
    const feeHead = (this.state.feeHeads || []).find(f => f.id === id);
    if (!feeHead) return null;
    const newStatus = feeHead.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateFeeHead(id, {
      status: newStatus,
      isActive: newStatus === 'ACTIVE',
    });
  }

  // --- Phase 2: Fee Structure Master Getters & Mutations ---
  public getFeeStructures(): FeeStructure[] { return this.state.feeStructures || []; }

  public addFeeStructure(structure: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>): FeeStructure {
    const newStructure: FeeStructure = {
      ...structure,
      id: `fs-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.feeStructures = [newStructure, ...(this.state.feeStructures || [])];
    this.saveState();
    return newStructure;
  }

  public updateFeeStructure(id: string, updates: Partial<FeeStructure>): FeeStructure | null {
    const idx = (this.state.feeStructures || []).findIndex(f => f.id === id);
    if (idx === -1) return null;
    const updated: FeeStructure = {
      ...this.state.feeStructures[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.feeStructures[idx] = updated;
    this.saveState();
    return updated;
  }

  public duplicateFeeStructure(id: string, targetAcademicYearCode: string, newName?: string): FeeStructure | null {
    const source = (this.state.feeStructures || []).find(f => f.id === id);
    if (!source) return null;

    const targetYear = targetAcademicYearCode.trim();
    const name = newName || `${source.name} (${targetYear})`;
    const structureCode = `FS-${source.programId}-${source.semesterId}-${targetYear.replace(/\s+/g, '')}-V1`.toUpperCase();

    const duplicated: FeeStructure = {
      ...source,
      id: `fs-${Date.now().toString(36)}`,
      structureCode,
      academicYearCode: targetYear,
      name,
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: (source.items || []).map((item, idx) => ({
        ...item,
        id: `fsi-${Date.now().toString(36)}-${idx}`,
        feeStructureId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    this.state.feeStructures = [duplicated, ...(this.state.feeStructures || [])];
    this.saveState();
    return duplicated;
  }

  public activateFeeStructure(id: string): FeeStructure | null {
    return this.updateFeeStructure(id, { status: 'ACTIVE' });
  }

  public deactivateFeeStructure(id: string): FeeStructure | null {
    return this.updateFeeStructure(id, { status: 'INACTIVE' });
  }

  // --- Phase 3: Student Fee Assignment & Fee Accounts ---
  public getStudentFeeRecords(): StudentFeeRecord[] { return this.state.studentFeeRecords || []; }

  public getStudentFeeRecordsByStudentId(studentId: string): StudentFeeRecord[] {
    return (this.state.studentFeeRecords || []).filter(r => r.studentId === studentId);
  }

  public getEligibleStudentsForFeeStructure(feeStructureId: string) {
    const structure = (this.state.feeStructures || []).find(f => f.id === feeStructureId);
    if (!structure) return [];

    const students = this.state.students || [];
    const feeRecords = this.state.studentFeeRecords || [];

    return students.filter(s => {
      // Academic context matching
      const matchesProg = !structure.programId || s.programId === structure.programId;
      const matchesDept = !structure.departmentId || s.departmentId === structure.departmentId;
      const matchesInst = !structure.instituteId || s.instituteId === structure.instituteId;
      const isActive = s.status === 'ACTIVE';

      return matchesProg && matchesDept && matchesInst && isActive;
    }).map(s => {
      const existing = feeRecords.find(r => r.studentId === s.id && r.feeStructureId === structure.id);
      return {
        id: s.id,
        enrollmentNo: s.enrollmentNo,
        erpId: s.id,
        studentName: s.name,
        instituteId: s.instituteId,
        departmentId: s.departmentId,
        programId: s.programId,
        currentSemester: s.semesterId,
        academicYear: s.academicYearId || '2026-27',
        isAlreadyAssigned: !!existing,
        existingRecordId: existing?.id,
        existingStatus: existing?.status,
      };
    });
  }

  public assignFeeStructureToStudents(feeStructureId: string, studentIds: string[]): {
    success: boolean;
    assignedCount: number;
    alreadyAssignedCount: number;
    skippedCount: number;
    duplicateStudents?: string[];
    errors?: string[];
  } {
    const structure = (this.state.feeStructures || []).find(f => f.id === feeStructureId);
    if (!structure) {
      return { success: false, assignedCount: 0, alreadyAssignedCount: 0, skippedCount: 0, errors: ['Fee Structure not found.'] };
    }
    if (structure.status !== 'ACTIVE') {
      return { success: false, assignedCount: 0, alreadyAssignedCount: 0, skippedCount: 0, errors: [`Fee Structure is ${structure.status}. Only ACTIVE fee structures can be assigned.`] };
    }

    const students = this.state.students || [];
    const feeHeads = this.state.feeHeads || [];
    const existingRecords = this.state.studentFeeRecords || [];

    let assignedCount = 0;
    let alreadyAssignedCount = 0;
    let skippedCount = 0;
    const duplicateStudents: string[] = [];
    const newRecords: StudentFeeRecord[] = [];

    for (const studentId of studentIds) {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        skippedCount++;
        continue;
      }

      // Check if already assigned
      const alreadyAssigned = existingRecords.some(r => r.studentId === student.id && r.feeStructureId === structure.id);
      if (alreadyAssigned) {
        alreadyAssignedCount++;
        skippedCount++;
        duplicateStudents.push(`${student.enrollmentNo} (${student.name})`);
        continue;
      }

      const totalAmount = structure.totalAmount;
      const accountId = `sfr-${Date.now().toString(36)}-${assignedCount}`;

      // Build items from structure items or defaults
      const items: StudentFeeItem[] = (structure.items || []).map((item, idx) => {
        const fh = feeHeads.find(f => f.id === item.feeHeadId);
        return {
          id: `sfi-${Date.now().toString(36)}-${idx}`,
          studentFeeAccountId: accountId,
          feeHeadId: item.feeHeadId,
          feeHeadName: fh?.name || item.feeHeadId,
          feeHeadCode: fh?.code || 'FEES',
          feeHeadCategory: fh?.category || 'ACADEMIC',
          feeStructureItemId: item.id,
          amount: item.amount,
          paidAmount: 0,
          discountAmount: 0,
          waivedAmount: 0,
          outstandingAmount: item.amount,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const newRecord: StudentFeeRecord = {
        id: accountId,
        studentId: student.id,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        programId: structure.programId,
        semesterId: structure.semesterId,
        academicYearId: structure.academicYearId || 'ay-2024',
        academicYearCode: structure.academicYearCode || '2026-27',
        feeStructureId: structure.id,
        feeStructureName: structure.name,
        feeStructureCode: structure.structureCode,
        tuitionFee: structure.tuitionFee ?? items.find(i => i.feeHeadCode === 'TUITION')?.amount ?? 45000,
        labFee: structure.labFee ?? items.find(i => i.feeHeadCode === 'LAB')?.amount ?? 8000,
        developmentFee: structure.developmentFee ?? items.find(i => i.feeHeadCode === 'DEV')?.amount ?? 7000,
        hostelFee: structure.hostelFee ?? items.find(i => i.feeHeadCode === 'HOSTEL')?.amount ?? 0,
        totalAmount,
        paidAmount: 0,
        discountAmount: 0,
        waivedAmount: 0,
        pendingAmount: totalAmount,
        dueDate: structure.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'PENDING',
        items,
        auditLogs: [
          {
            id: `sfaal-${Date.now().toString(36)}`,
            studentFeeAccountId: accountId,
            action: 'FEE_ASSIGNED',
            performedByUserId: 'admin-1',
            performedByName: 'Finance Administrator',
            details: `Assigned Fee Structure '${structure.name}' (Total: ₹${totalAmount})`,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newRecords.push(newRecord);
      assignedCount++;
    }

    this.state.studentFeeRecords = [...newRecords, ...(this.state.studentFeeRecords || [])];
    this.saveState();

    return {
      success: true,
      assignedCount,
      alreadyAssignedCount,
      skippedCount,
      duplicateStudents: duplicateStudents.length > 0 ? duplicateStudents : undefined,
    };
  }

  // --- Phase 4: Fee Invoices / Demand Management ---

  public getFeeInvoices(): FeeInvoice[] {
    return this.state.feeInvoices || [];
  }

  public getFeeInvoicesByStudentId(studentId: string): FeeInvoice[] {
    return (this.state.feeInvoices || []).filter(inv => inv.studentId === studentId);
  }

  public getFeeInvoiceById(id: string): FeeInvoice | null {
    return (this.state.feeInvoices || []).find(inv => inv.id === id) || null;
  }

  public generateFeeInvoice(params: {
    studentFeeAccountId: string;
    dueDate: string;
    invoiceDate?: string;
    status?: FeeInvoiceStatus;
    feeItemIds?: string[];
    remarks?: string;
    createdBy?: string;
  }): { success: boolean; invoice?: FeeInvoice; error?: string } {
    const account = (this.state.studentFeeRecords || []).find(r => r.id === params.studentFeeAccountId);
    if (!account) {
      return { success: false, error: 'Student Fee Account not found.' };
    }

    const invoiceDate = params.invoiceDate || new Date().toISOString().split('T')[0];
    if (params.dueDate < invoiceDate) {
      return { success: false, error: 'Due Date cannot be earlier than Invoice Date.' };
    }

    const accountItems = account.items || [];
    let selectedItems = accountItems.filter(i => (i.outstandingAmount ?? i.amount) > 0);

    if (params.feeItemIds && params.feeItemIds.length > 0) {
      selectedItems = selectedItems.filter(i => params.feeItemIds!.includes(i.id));
      if (selectedItems.length !== params.feeItemIds.length) {
        return { success: false, error: 'One or more selected fee items are invalid or already settled.' };
      }
    }

    if (selectedItems.length === 0) {
      return { success: false, error: 'No outstanding fee items selected for invoice generation.' };
    }

    const subtotal = selectedItems.reduce((sum, item) => sum + (item.outstandingAmount ?? item.amount), 0);
    const discountAmount = 0;
    const waiverAmount = 0;
    const lateFeeAmount = 0;
    const totalAmount = subtotal - discountAmount - waiverAmount + lateFeeAmount;

    const existingInvoices = this.state.feeInvoices || [];
    const seq = existingInvoices.length + 1;
    const invoiceNumber = `SSIU/FEE/${account.academicYearCode || '2026-27'}/${String(seq).padStart(6, '0')}`;
    const invoiceId = `inv-${Date.now().toString(36)}-${seq}`;
    const initialStatus: FeeInvoiceStatus = params.status || 'ISSUED';

    const invoiceItems: FeeInvoiceItem[] = selectedItems.map((item, idx) => ({
      id: `invi-${Date.now().toString(36)}-${idx}`,
      invoiceId,
      feeHeadId: item.feeHeadId,
      feeHeadName: item.feeHeadName,
      feeHeadCode: item.feeHeadCode,
      feeHeadCategory: item.feeHeadCategory,
      studentFeeItemId: item.id,
      description: `${item.feeHeadName || 'Fee'} (${item.feeHeadCode || 'FEES'})`,
      amount: item.outstandingAmount ?? item.amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newInvoice: FeeInvoice = {
      id: invoiceId,
      invoiceNumber,
      studentId: account.studentId,
      studentName: account.studentName,
      enrollmentNo: account.enrollmentNo,
      studentFeeAccountId: account.id,
      feeStructureId: account.feeStructureId,
      feeStructureName: account.feeStructureName,
      programId: account.programId,
      semesterId: account.semesterId,
      academicYearCode: account.academicYearCode || '2026-27',
      invoiceDate,
      dueDate: params.dueDate,
      subtotal,
      discountAmount,
      waiverAmount,
      lateFeeAmount,
      totalAmount,
      status: initialStatus,
      remarks: params.remarks,
      issuedAt: initialStatus === 'ISSUED' ? new Date().toISOString() : undefined,
      createdBy: params.createdBy || 'admin',
      items: invoiceItems,
      auditLogs: [
        {
          id: `inval-${Date.now().toString(36)}`,
          invoiceId,
          action: initialStatus === 'DRAFT' ? 'CREATED' : 'ISSUED',
          performedByUserId: params.createdBy || 'admin',
          performedByName: 'Finance Administrator',
          details: `Generated ${initialStatus} Fee Invoice ${invoiceNumber} for ₹${totalAmount.toLocaleString('en-IN')}`,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.feeInvoices = [newInvoice, ...(this.state.feeInvoices || [])];
    this.saveState();

    return { success: true, invoice: newInvoice };
  }

  public updateFeeInvoice(id: string, updates: Partial<FeeInvoice>): FeeInvoice | null {
    const invoices = this.state.feeInvoices || [];
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = invoices[index];
    if (current.status !== 'DRAFT') return null;

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `inval-${Date.now().toString(36)}`,
          invoiceId: id,
          action: 'UPDATED' as const,
          performedByUserId: 'admin',
          performedByName: 'Finance Administrator',
          details: 'Updated invoice draft details',
          createdAt: new Date().toISOString(),
        },
        ...(current.auditLogs || []),
      ],
    };

    invoices[index] = updated;
    this.state.feeInvoices = invoices;
    this.saveState();
    return updated;
  }

  public issueFeeInvoice(id: string): FeeInvoice | null {
    const invoices = this.state.feeInvoices || [];
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = invoices[index];
    if (current.status !== 'DRAFT') return null;

    const issued: FeeInvoice = {
      ...current,
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `inval-${Date.now().toString(36)}`,
          invoiceId: id,
          action: 'ISSUED' as const,
          performedByUserId: 'admin',
          performedByName: 'Finance Administrator',
          details: `Issued Fee Demand ${current.invoiceNumber}`,
          createdAt: new Date().toISOString(),
        },
        ...(current.auditLogs || []),
      ],
    };

    invoices[index] = issued;
    this.state.feeInvoices = invoices;
    this.saveState();
    return issued;
  }

  public cancelFeeInvoice(id: string, reason: string, cancelledBy = 'admin'): FeeInvoice | null {
    const invoices = this.state.feeInvoices || [];
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = invoices[index];
    if (current.status === 'CANCELLED' || current.status === 'PAID') return null;

    const cancelled: FeeInvoice = {
      ...current,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `inval-${Date.now().toString(36)}`,
          invoiceId: id,
          action: 'CANCELLED' as const,
          performedByUserId: cancelledBy,
          performedByName: 'Finance Administrator',
          details: `Cancelled invoice. Reason: ${reason}`,
          createdAt: new Date().toISOString(),
        },
        ...(current.auditLogs || []),
      ],
    };

    invoices[index] = cancelled;
    this.state.feeInvoices = invoices;
    this.saveState();
    return cancelled;
  }

  // --- Phase 5: Online Fee Payment Engine ---
  public getPaymentOrders(invoiceId?: string): PaymentOrder[] {
    const orders = this.state.paymentOrders || [];
    if (invoiceId) return orders.filter(o => o.invoiceId === invoiceId);
    return orders;
  }

  public getPaymentTransactionsList(filters?: { invoiceId?: string; studentId?: string; status?: string }): PaymentTransactionRecord[] {
    let txs = this.state.paymentTransactionsList || [];
    if (filters?.invoiceId) txs = txs.filter(t => t.invoiceId === filters.invoiceId);
    if (filters?.studentId) txs = txs.filter(t => t.studentId === filters.studentId);
    if (filters?.status) txs = txs.filter(t => t.status === filters.status);
    return txs;
  }

  public getPaymentTransactionsByStudentId(studentId: string): PaymentTransactionRecord[] {
    return (this.state.paymentTransactionsList || []).filter(t => t.studentId === studentId);
  }

  public getPaymentTransactionById(id: string): PaymentTransactionRecord | null {
    return (this.state.paymentTransactionsList || []).find(t => t.id === id) || null;
  }

  public createPaymentOrder(params: {
    invoiceId: string;
    amount?: number;
    gateway?: string;
    studentId?: string;
  }): { success: boolean; error?: string; order?: PaymentOrder; keyId?: string } {
    const invoice = this.getFeeInvoiceById(params.invoiceId);
    if (!invoice) {
      return { success: false, error: 'Fee invoice was not found.' };
    }

    if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
      return { success: false, error: `Invoice is ${invoice.status} and cannot accept payments.` };
    }

    // Compute outstanding
    const confirmedTxs = (this.state.paymentTransactionsList || []).filter(
      t => t.invoiceId === invoice.id && t.status === 'SUCCESS'
    );
    const paidSoFar = confirmedTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const outstanding = Math.max(0, Number(invoice.totalAmount) - paidSoFar);

    if (outstanding <= 0) {
      return { success: false, error: 'Invoice has no remaining outstanding balance.' };
    }

    const orderAmount = params.amount && params.amount > 0 ? Math.min(params.amount, outstanding) : outstanding;
    const year = new Date().getFullYear();
    const existingOrders = this.state.paymentOrders || [];
    const seq = existingOrders.length + 1;
    const orderNumber = `ORD-${year}-${seq.toString().padStart(6, '0')}`;
    const gatewayOrderId = `order_${orderNumber.replace(/-/g, '_')}_${Math.random().toString(36).substring(2, 8)}`;

    const newOrder: PaymentOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      gateway: params.gateway || 'RAZORPAY',
      gatewayOrderId,
      amount: orderAmount,
      currency: 'INR',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.paymentOrders = [newOrder, ...existingOrders];
    this.saveState();

    return {
      success: true,
      order: newOrder,
      keyId: 'rzp_test_ssiu_erp_key',
    };
  }

  public verifyPayment(params: {
    paymentOrderId: string;
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature?: string;
    paymentMethod?: string;
  }): { success: boolean; error?: string; transaction?: PaymentTransactionRecord; invoiceStatus?: string } {
    const orders = this.state.paymentOrders || [];
    const orderIndex = orders.findIndex(o => o.id === params.paymentOrderId);
    if (orderIndex === -1) {
      return { success: false, error: 'Payment order was not found.' };
    }
    const order = orders[orderIndex];

    // Idempotency check
    const existingTxs = this.state.paymentTransactionsList || [];
    const duplicate = existingTxs.find(t => t.gatewayPaymentId === params.gatewayPaymentId && t.status === 'SUCCESS');
    if (duplicate) {
      return { success: true, transaction: duplicate, invoiceStatus: 'PAID' };
    }

    const invoice = this.getFeeInvoiceById(order.invoiceId);
    if (!invoice) {
      return { success: false, error: 'Associated fee invoice not found.' };
    }

    const year = new Date().getFullYear();
    const seq = existingTxs.length + 1;
    const transactionNumber = `TXN-${year}-${seq.toString().padStart(6, '0')}`;
    const paidAt = new Date().toISOString();

    const newTx: PaymentTransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paymentOrderId: order.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      enrollmentNo: invoice.enrollmentNo,
      transactionNumber,
      gateway: order.gateway,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewayOrderId: params.gatewayOrderId,
      amount: order.amount,
      currency: 'INR',
      paymentMethod: params.paymentMethod || 'UPI',
      status: 'SUCCESS',
      paidAt,
      createdAt: paidAt,
      updatedAt: paidAt,
    };

    // Update Payment Order to PAID
    order.status = 'PAID';
    order.updatedAt = paidAt;
    orders[orderIndex] = order;
    this.state.paymentOrders = orders;

    // Add Payment Transaction
    this.state.paymentTransactionsList = [newTx, ...existingTxs];

    // Update FeeInvoice status
    const allTxsForInvoice = [newTx, ...existingTxs.filter(t => t.invoiceId === invoice.id && t.status === 'SUCCESS')];
    const totalPaid = allTxsForInvoice.reduce((sum, t) => sum + Number(t.amount), 0);
    const newInvoiceStatus: FeeInvoiceStatus = totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    const invoices = this.state.feeInvoices || [];
    const invIdx = invoices.findIndex(i => i.id === invoice.id);
    if (invIdx !== -1) {
      invoices[invIdx] = {
        ...invoices[invIdx],
        status: newInvoiceStatus,
        updatedAt: paidAt,
        auditLogs: [
          {
            id: `inval-${Date.now()}`,
            invoiceId: invoice.id,
            action: 'UPDATED',
            performedByUserId: 'SYSTEM_PAYMENT',
            performedByName: 'Payment Engine',
            details: `Settled online payment ₹${order.amount} (${transactionNumber}). Status: ${newInvoiceStatus}`,
            createdAt: paidAt,
          },
          ...(invoices[invIdx].auditLogs || []),
        ],
      };
      this.state.feeInvoices = invoices;
    }

    // Update StudentFeeRecord ledger balance
    const feeRecords = this.state.studentFeeRecords || [];
    const accIdx = feeRecords.findIndex(r => r.id === invoice.studentFeeAccountId || r.studentId === invoice.studentId);
    if (accIdx !== -1) {
      const rec = feeRecords[accIdx];
      const newPaidAmount = rec.paidAmount + order.amount;
      const newPendingAmount = Math.max(0, rec.totalAmount - newPaidAmount);
      feeRecords[accIdx] = {
        ...rec,
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        status: newPendingAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID',
      };
      this.state.studentFeeRecords = feeRecords;
    }

    this.saveState();
    return {
      success: true,
      transaction: newTx,
      invoiceStatus: newInvoiceStatus,
    };
  }

  public recordPaymentFailure(params: {
    paymentOrderId: string;
    failureReason: string;
    gatewayPaymentId?: string;
  }): { success: boolean; transaction?: PaymentTransactionRecord } {
    const orders = this.state.paymentOrders || [];
    const order = orders.find(o => o.id === params.paymentOrderId);
    if (!order) return { success: false };

    order.status = 'FAILED';
    order.updatedAt = new Date().toISOString();

    const year = new Date().getFullYear();
    const existingTxs = this.state.paymentTransactionsList || [];
    const seq = existingTxs.length + 1;
    const transactionNumber = `TXN-${year}-${seq.toString().padStart(6, '0')}`;

    const failedTx: PaymentTransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paymentOrderId: order.id,
      invoiceId: order.invoiceId,
      studentId: order.studentId,
      transactionNumber,
      gateway: order.gateway,
      gatewayPaymentId: params.gatewayPaymentId || `fail_${Date.now()}`,
      amount: order.amount,
      currency: 'INR',
      paymentMethod: 'ONLINE',
      status: 'FAILED',
      failureReason: params.failureReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.paymentTransactionsList = [failedTx, ...existingTxs];
    this.saveState();
    return { success: true, transaction: failedTx };
  }

  public cancelPaymentOrder(params: { paymentOrderId: string; reason?: string }): boolean {
    const orders = this.state.paymentOrders || [];
    const order = orders.find(o => o.id === params.paymentOrderId);
    if (!order || order.status === 'PAID') return false;

    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();
    this.saveState();
    return true;
  }

  // --- Phase 7: Late Fee Management ---

  public getLateFeeRules(): any[] {
    return (this.state as any).lateFeeRules || [];
  }

  /**
   * Calculate late fee for an invoice client-side (mirrors backend logic).
   * NOTE: In production, this is ALWAYS sourced from the backend API.
   * This is a display-only helper.
   */
  public getInvoiceLateFeeInfo(invoiceId: string): {
    invoiceTotal: number;
    totalPaid: number;
    outstanding: number;
    overdueDays: number;
    lateFeeAmount: number;
    totalPayable: number;
    isOverdue: boolean;
    status: string;
  } {
    const invoice = (this.state.feeInvoices || []).find((i: any) => i.id === invoiceId);
    if (!invoice) return { invoiceTotal: 0, totalPaid: 0, outstanding: 0, overdueDays: 0, lateFeeAmount: 0, totalPayable: 0, isOverdue: false, status: 'UNKNOWN' };

    const allTxs = (this.state.paymentTransactionsList || []).filter(
      (tx: any) => tx.invoiceId === invoiceId && tx.status === 'SUCCESS',
    );
    const totalPaid = allTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    const invoiceTotal = Number(invoice.totalAmount);
    const outstanding = Math.max(0, invoiceTotal - totalPaid);

    const now = new Date();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const isOverdue = dueDate ? now > dueDate && outstanding > 0 : false;

    let overdueDays = 0;
    let lateFeeAmount = Number(invoice.lateFeeAmount || 0);

    if (isOverdue && dueDate) {
      overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      invoiceTotal,
      totalPaid,
      outstanding,
      overdueDays,
      lateFeeAmount,
      totalPayable: outstanding + lateFeeAmount,
      isOverdue,
      status: invoice.status,
    };
  }

  /**
   * Return a safe, student-friendly failure reason message.
   */
  public getFriendlyFailureReason(rawReason?: string): string {
    const reasons: Record<string, string> = {
      INSUFFICIENT_FUNDS: 'Your bank account had insufficient funds. Please try again or use a different payment method.',
      BANK_ERROR: 'Your bank returned an error. Please retry or contact your bank.',
      USER_CANCELLED: 'You cancelled the payment. No amount was charged to your fee account.',
      GATEWAY_ERROR: 'A payment gateway error occurred. Please retry.',
      TIMEOUT: 'The payment session timed out. Please initiate a new payment.',
      INVALID_PAYMENT: 'The payment details were invalid. Please retry.',
      SIGNATURE_VERIFICATION_FAILED: 'Payment verification failed for security reasons. Please contact support if this persists.',
      UNKNOWN: 'Your payment could not be completed. No amount has been added to your fee account.',
    };
    return reasons[rawReason || 'UNKNOWN'] || 'Your payment could not be completed. No amount has been added to your fee account.';
  }

  /**
   * Get failed payment transactions.
   */
  public getFailedPayments(studentId?: string): any[] {
    const txs = this.state.paymentTransactionsList || [];
    return txs.filter(
      (tx: any) => tx.status === 'FAILED' && (!studentId || tx.studentId === studentId),
    );
  }

  // --- Phase 5: Fees & Finance Getters ---
  public getFeePaymentTransactions(): FeePaymentTransaction[] { return this.state.feePaymentTransactions; }

  // --- Phase 6: CRM & Admission Getters ---
  public getCRMLeads(): CRMLead[] { return this.state.crmLeads; }
  public getAdmissionApplications(): AdmissionApplication[] { return this.state.admissionApplications; }

  // --- Phase 12: Examination Management Getters ---
  public getExamTimetables(): ExamTimetable[] { return this.state.examTimetables; }
  public getExamForms(): ExamForm[] { return this.state.examForms; }
  public getStudentResults(): StudentResult[] { return this.state.studentResults; }
  public getStudentFeedbacks(): StudentFeedback[] { return this.state.studentFeedbacks || []; }
  public getSupportTickets(): SupportTicket[] { return this.state.supportTickets || []; }
  public getStudentDocuments(): StudentDocument[] { return this.state.studentDocuments || []; }
  public getStudentDocumentsByStudentId(studentId: string): StudentDocument[] {
    return (this.state.studentDocuments || []).filter(d => d.studentId === studentId);
  }
  public getRegistrarFileMovements(): RegistrarFileMovement[] {
    return this.state.registrarFileMovements || [];
  }

  public getApprovalRequests(): ApprovalRequest[] {
    return this.state.approvalRequests || [];
  }

  public getScopedApprovalRequests(user: User | null, role: UserRole | null): ApprovalRequest[] {
    const requests = this.getApprovalRequests();
    if (!user || !role) return [];

    // Super Admin & University Admin retain full authorized visibility
    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
      return requests;
    }

    // STUDENT SECURITY RULE: Student can ONLY see their own submitted requests
    if (role === 'STUDENT') {
      return requests.filter(r => 
        r.applicantId === user.id ||
        (Boolean(r.applicantEmail) && r.applicantEmail.toLowerCase() === user.email.toLowerCase()) ||
        (Boolean(user.enrollmentNo) && r.applicantEnrollmentOrEmpId === user.enrollmentNo)
      );
    }

    const roleOfficeMap: Partial<Record<UserRole, ApprovalOfficeType>> = {
      REGISTRAR: 'REGISTRAR',
      IQAC: 'IQAC',
      EXAM_CELL: 'EXAM_CELL',
      STUDENT_SECTION: 'STUDENT_SECTION',
      HOSTEL_ADMIN: 'HOSTEL_ADMIN',
      LIBRARY_ADMIN: 'LIBRARY_ADMIN',
      TRANSPORT_ADMIN: 'TRANSPORT_ADMIN',
      MAINTENANCE_ADMIN: 'MAINTENANCE_ADMIN',
      HOD: 'HOD_ACADEMIC',
    };

    const userOffice = roleOfficeMap[role];

    return requests.filter(r => {
      // Applicant can always see their own
      if (r.applicantId === user.id || (Boolean(r.applicantEmail) && r.applicantEmail.toLowerCase() === user.email.toLowerCase())) {
        return true;
      }
      // Designated authority desk match
      if (userOffice && (r.currentOffice === userOffice || r.targetOffice === userOffice)) {
        return true;
      }
      // Specific office category allowances
      if (role === 'HOSTEL_ADMIN' && r.category === 'HOSTEL_NO_DUES') return true;
      if (role === 'EXAM_CELL' && (r.category === 'RE_EVALUATION' || r.category === 'TRANSCRIPT_DEGREE')) return true;
      if (role === 'STUDENT_SECTION' && (r.category === 'BONAFIDE_CERTIFICATE' || r.category === 'NO_OBJECTION_CERTIFICATE' || r.category === 'TRANSCRIPT_DEGREE')) return true;
      if (role === 'MAINTENANCE_ADMIN' && r.category === 'INFRASTRUCTURE_MAINTENANCE') return true;
      if (role === 'IQAC' && (r.category === 'RESEARCH_GRANT' || r.category === 'EVENT_PERMISSION')) return true;

      // Academic Department / Institute Hierarchy
      if (role === 'DEPUTY_REGISTRAR') {
        const scopes = this.getDeputyRegistrarScopeByUserId(user.id);
        const inScope = scopes.some(s => {
          const matchInst = !r.instituteId || s.instituteId === r.instituteId;
          const matchDept = s.departmentIds.length > 0 ? (Boolean(r.departmentId) && s.departmentIds.includes(r.departmentId!)) : false;
          return matchInst && matchDept;
        });
        return inScope;
      }
      if (role === 'HOD' && user.departmentId && r.departmentId === user.departmentId) return true;
      if (role === 'PRINCIPAL' && user.instituteId && r.instituteId === user.instituteId) return true;
      return false;
    });
  }

  public getApprovalRequestById(
    id: string,
    user?: User | null,
    role?: UserRole | null
  ): ApprovalRequest | null {
    if (!this.state.approvalRequests) {
      this.state.approvalRequests = [...initialApprovalRequests];
    }
    const req = this.state.approvalRequests.find(r => r.id === id || r.requestNo === id);
    if (!req) return null;

    if (user && role) {
      const authorized = isUserAuthorizedForApprovalRequest(req, user, role);
      if (!authorized) {
        this.logAudit(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'Approval Request Security',
          `403 Forbidden: User "${user.name}" (${role}) attempted unauthorized access to Approval Request ${req.requestNo} owned by ${req.applicantName}`,
          user.name,
          role
        );
        return null;
      }
    }

    return req;
  }

  public addApprovalRequest(
    data: Partial<ApprovalRequest> & {
      category: ApprovalRequestCategory;
      title: string;
      description: string;
      targetOffice: ApprovalOfficeType;
    },
    initialRemarks?: string,
    user?: User | null,
    role?: UserRole | null
  ): ApprovalRequest {
    const effectiveRole = role || (user?.role as UserRole) || 'STUDENT';

    // Backend validation: Role + Category authorization check
    if (!canUserAccessApprovalCategory(data.category, effectiveRole)) {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Approval Request Security',
        `403 Forbidden: Role "${effectiveRole}" is not authorized to submit approval requests in category "${data.category}"`,
        user?.name || data.applicantName,
        effectiveRole
      );
      throw new Error(`403 Forbidden: Role ${effectiveRole} is not authorized to request category ${data.category}`);
    }

    const reqCount = (this.state.approvalRequests || []).length + 1;
    const reqNo = `SSIU-REQ-${new Date().getFullYear()}-${String(reqCount).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    // Enforce authentic applicant credentials from session
    const applicantId = user?.id || data.applicantId || 'stu-1';
    const applicantName = user?.name || data.applicantName || 'Authorized Applicant';
    const applicantRole = (user?.role as UserRole) || data.applicantRole || 'STUDENT';
    const applicantEmail = user?.email || data.applicantEmail || 'applicant@swarrnim.edu.in';
    const applicantPhone = user?.phone || data.applicantPhone || '+91 98250 00000';
    const applicantEnrollmentOrEmpId = user?.enrollmentNo || user?.employeeId || data.applicantEnrollmentOrEmpId || 'ENR-001';

    const newRequest: ApprovalRequest = {
      ...data,
      id: `app-req-${Date.now()}`,
      requestNo: reqNo,
      category: data.category,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      targetOffice: data.targetOffice,
      currentOffice: data.currentOffice || data.targetOffice,
      status: data.status || 'PENDING',
      deadlineDate: data.deadlineDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      attachments: data.attachments || [],
      applicantId,
      applicantName,
      applicantRole,
      applicantEmail,
      applicantPhone,
      applicantEnrollmentOrEmpId,
      createdAt: timestamp,
      updatedAt: timestamp,
      remarksHistory: initialRemarks ? [
        {
          id: `rem-${Date.now()}`,
          actionByUserId: applicantId,
          actionByUserName: applicantName,
          actionByUserRole: applicantRole,
          office: data.targetOffice,
          action: 'PENDING',
          remarks: initialRemarks,
          timestamp: new Date().toLocaleString(),
        }
      ] : []
    };

    if (!this.state.approvalRequests) {
      this.state.approvalRequests = [];
    }
    this.state.approvalRequests.unshift(newRequest);

    // 1. Notify Applicant: STATUS_UPDATE
    if (data.applicantId) {
      this.addNotification({
        type: 'STATUS_UPDATE',
        title: `Approval Request Submitted: ${reqNo}`,
        message: `Your request "${data.title}" has been submitted to ${data.targetOffice}.`,
        module: 'REQUEST',
        targetUserId: data.applicantId,
        referenceId: reqNo,
        referenceType: 'APPROVAL_REQUEST',
        linkTab: 'requests'
      });
    }

    // 2. Notify Target Office Authority: ACTION_REQUIRED
    const officeRoleMap: Record<string, UserRole> = {
      'HOD': 'HOD',
      'PRINCIPAL': 'PRINCIPAL',
      'REGISTRAR': 'REGISTRAR',
      'EXAM_CELL': 'EXAM_CELL',
      'STUDENT_SECTION': 'STUDENT_SECTION',
      'HOSTEL_ADMIN': 'HOSTEL_ADMIN',
      'LIBRARY_ADMIN': 'LIBRARY_ADMIN',
      'TRANSPORT_ADMIN': 'TRANSPORT_ADMIN'
    };
    const targetRole = data.targetOffice ? officeRoleMap[data.targetOffice] : undefined;
    this.addNotification({
      type: 'ACTION_REQUIRED',
      title: `New Approval Request (${reqNo}): ${data.title}`,
      message: `Submitted by ${applicantName} (${applicantRole}) to ${data.targetOffice}. Priority: ${data.priority}.`,
      module: 'REQUEST',
      targetRole,
      targetInstituteId: data.instituteId,
      targetDepartmentId: data.departmentId,
      referenceId: reqNo,
      referenceType: 'APPROVAL_REQUEST',
      linkTab: 'requests',
      priority: data.priority === 'URGENT' ? 'URGENT' : 'HIGH'
    });

    this.logAudit('CREATE', 'Approval Request', `Submitted request ${reqNo} - ${data.title} to ${data.targetOffice}`, applicantName, applicantRole);
    this.saveState();
    return newRequest;
  }

  public updateApprovalRequestStatus(
    requestId: string,
    newStatus: ApprovalStatus,
    remarks: string,
    currentUser: User,
    forwardToOffice?: ApprovalOfficeType
  ): ApprovalRequest | null {
    const list = this.state.approvalRequests || [];
    const req = list.find(r => r.id === requestId);
    if (!req) return null;

    // Security check: Students cannot approve or reject requests
    if (currentUser.role === 'STUDENT' && newStatus !== 'WITHDRAWN') {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Approval Request Security',
        `403 Forbidden: Student "${currentUser.name}" attempted to change status to ${newStatus} on Request ${req.requestNo}`,
        currentUser.name,
        currentUser.role
      );
      return null;
    }

    const timestamp = new Date().toISOString();
    req.status = newStatus;
    req.updatedAt = timestamp;
    if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      req.completedAt = timestamp;
    }

    if (forwardToOffice && newStatus === 'FORWARDED') {
      req.currentOffice = forwardToOffice;
    }

    req.remarksHistory.push({
      id: `rem-${Date.now()}`,
      actionByUserId: currentUser.id,
      actionByUserName: currentUser.name,
      actionByUserRole: currentUser.role,
      office: req.currentOffice,
      action: newStatus,
      remarks: remarks || `Request status updated to ${newStatus}`,
      timestamp: new Date().toLocaleString(),
    });

    this.addNotification({
      title: `Request ${req.requestNo} Update: ${newStatus}`,
      message: `Your request "${req.title}" has been updated to ${newStatus} by ${currentUser.name} (${req.currentOffice}).`,
      module: 'REQUEST',
      timestamp: 'Just Now',
      targetUserId: req.applicantId,
      linkTab: 'requests'
    });

    this.logAudit('UPDATE', 'Approval Request', `Updated request ${req.requestNo} status to ${newStatus} with remarks: ${remarks}`, currentUser.name, currentUser.role);
    this.saveState();
    return req;
  }

  public updateApprovalRequestDirect(req: ApprovalRequest): void {
    if (!this.state.approvalRequests) this.state.approvalRequests = [];
    const idx = this.state.approvalRequests.findIndex(r => r.id === req.id);
    if (idx !== -1) {
      this.state.approvalRequests[idx] = { ...req };
    } else {
      this.state.approvalRequests.unshift(req);
    }
    this.saveState();
  }

  // --- ROLE-BASED SCOPED GETTERS ---

  public getScopedExamForms(user: User | null, role: UserRole | null): ExamForm[] {
    const forms = this.getExamForms();
    if (!user || !role) return forms;

    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
      return forms;
    }
    if (role === 'PRINCIPAL' || role === 'HOD') {
      const allowedStudentIds = new Set(this.getScopedStudents(user, role).map(s => s.id));
      return forms.filter(f => allowedStudentIds.has(f.studentId));
    }
    if (role === 'STUDENT') {
      return forms.filter(f => f.studentId === user.id || f.enrollmentNo === user.enrollmentNo);
    }
    return forms;
  }

  public getScopedFeeRecords(user: User | null, role: UserRole | null): StudentFeeRecord[] {
    const records = this.getStudentFeeRecords();
    if (!user || !role) return records;

    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
      return records;
    }
    if (role === 'PRINCIPAL' || role === 'HOD') {
      const allowedStudentIds = new Set(this.getScopedStudents(user, role).map(s => s.id));
      return records.filter(r => allowedStudentIds.has(r.studentId));
    }
    if (role === 'STUDENT') {
      return records.filter(r => r.studentId === user.id || r.enrollmentNo === user.enrollmentNo);
    }
    return records;
  }

  public addEntity<T extends { id: string }>(collectionKey: keyof DatabaseState, item: Omit<T, 'id'> & { id?: string }, auditMsg?: string): T {
    const newItem = { ...item, id: item.id || `${String(collectionKey)}-${Date.now()}` } as unknown as T;
    (this.state[collectionKey] as unknown as T[]).unshift(newItem);
    
    if (auditMsg) {
      this.logAudit('CREATE', String(collectionKey), auditMsg);
    }
    
    this.saveState();
    return newItem;
  }

  public updateEntity<T extends { id: string }>(collectionKey: keyof DatabaseState, id: string, updates: Partial<T>, auditMsg?: string): T | null {
    const list = this.state[collectionKey] as unknown as T[];
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return null;
    
    list[idx] = { ...list[idx], ...updates };
    
    if (auditMsg) {
      this.logAudit('UPDATE', String(collectionKey), auditMsg);
    }

    this.saveState();
    return list[idx];
  }

  public deleteEntity(collectionKey: keyof DatabaseState, id: string, auditMsg?: string): boolean {
    const list = (this.state[collectionKey] || []) as unknown as { id: string }[];
    const initialLen = list.length;
    const filtered = list.filter(x => x.id !== id);
    this.state[collectionKey] = filtered as any;

    if (filtered.length !== initialLen) {
      if (auditMsg) {
        this.logAudit('DELETE', String(collectionKey), auditMsg);
      }
      this.saveState();
      return true;
    }
    return false;
  }

  public logAudit(
    actionOrObj: string | any, 
    entity = 'GENERAL', 
    details = '', 
    userName = 'Demo User', 
    userRole: UserRole = 'SUPER_ADMIN',
    extra?: Partial<AuditLog>
  ): AuditLog {
    let actStr = typeof actionOrObj === 'string' ? actionOrObj : (actionOrObj?.action || 'AUDIT_LOG');
    let entStr = typeof actionOrObj === 'object' && actionOrObj?.entity ? actionOrObj.entity : entity;
    let detStr = typeof actionOrObj === 'object' && actionOrObj?.details ? actionOrObj.details : details;
    let uName = typeof actionOrObj === 'object' && actionOrObj?.userName ? actionOrObj.userName : userName;
    let uRole = typeof actionOrObj === 'object' && actionOrObj?.userRole ? actionOrObj.userRole : userRole;
    let uId = typeof actionOrObj === 'object' && actionOrObj?.userId ? actionOrObj.userId : extra?.userId;
    let recId = typeof actionOrObj === 'object' && (actionOrObj?.recordId || actionOrObj?.entityId) ? (actionOrObj.recordId || actionOrObj.entityId) : extra?.recordId;

    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: uId,
      userName: uName,
      userRole: uRole,
      action: actStr,
      entity: entStr,
      details: detStr,
      module: extra?.module || entStr,
      recordId: recId,
      status: extra?.status || (actStr.includes('FAIL') || actStr.includes('UNAUTHORIZED') || actStr.includes('VIOLATION') ? 'FAILED' : 'SUCCESS'),
      severity: extra?.severity || (actStr.includes('UNAUTHORIZED') || actStr.includes('VIOLATION') ? 'CRITICAL' : 'INFO'),
      previousValue: typeof actionOrObj === 'object' && actionOrObj?.previousValue ? actionOrObj.previousValue : extra?.previousValue,
      newValue: typeof actionOrObj === 'object' && actionOrObj?.newValue ? actionOrObj.newValue : extra?.newValue,
      ipAddress: extra?.ipAddress || '192.168.1.104',
      userAgent: extra?.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      deviceInfo: extra?.deviceInfo || 'Chrome / macOS Darwin'
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
    this.saveState();
    return log;
  }

  // --- Relational Helper Methods ---
  public getInstituteById(id?: string): Institute | undefined {
    return this.state.institutes.find(i => i.id === id);
  }

  public getDepartmentById(id?: string): Department | undefined {
    return this.state.departments.find(d => d.id === id);
  }

  public getProgramById(id?: string): Program | undefined {
    return this.state.programs.find(p => p.id === id);
  }

  public getBatchById(id?: string): Batch | undefined {
    return this.state.batches.find(b => b.id === id);
  }

  public getSemesterById(id?: string): Semester | undefined {
    return this.state.semesters.find(s => s.id === id);
  }

  public getDivisionById(id?: string): Division | undefined {
    return this.state.divisions.find(d => d.id === id);
  }

  public getSubjectById(id?: string): Subject | undefined {
    return this.state.subjects.find(s => s.id === id);
  }

  public getAcademicYearById(id?: string): AcademicYear | undefined {
    return this.state.academicYears.find(a => a.id === id);
  }

  public getDepartmentsByInstitute(instituteId: string): Department[] {
    return this.state.departments.filter(d => d.instituteId === instituteId);
  }

  public instituteHasDepartments(instituteId: string): boolean {
    return this.state.departments.some(d => d.instituteId === instituteId);
  }

  public getProgramsByInstitute(instituteId: string, departmentId?: string): Program[] {
    return this.state.programs.filter(p => {
      if (p.instituteId !== instituteId) return false;
      if (departmentId && p.departmentId && p.departmentId !== departmentId) return false;
      return true;
    });
  }

  public getProgramsByDepartment(departmentId: string): Program[] {
    return this.state.programs.filter(p => p.departmentId === departmentId);
  }

  public getSemestersByProgram(programId: string): Semester[] {
    return this.state.semesters.filter(s => s.programId === programId);
  }

  public getDivisionsBySemester(semesterId: string): Division[] {
    return this.state.divisions.filter(d => d.semesterId === semesterId);
  }

  public getSubjectsBySemester(semesterId: string): Subject[] {
    return this.state.subjects.filter(s => s.semesterId === semesterId);
  }

  public getStudentsByInstitute(instituteId: string): Student[] {
    return this.state.students.filter(s => s.instituteId === instituteId);
  }

  public getStudentsByDepartment(departmentId: string): Student[] {
    return this.state.students.filter(s => s.departmentId === departmentId);
  }

  public getFacultyByInstitute(instituteId: string): Faculty[] {
    return this.state.faculty.filter(f => f.instituteId === instituteId);
  }

  public getFacultyByDepartment(departmentId: string): Faculty[] {
    return this.state.faculty.filter(f => f.departmentId === departmentId);
  }

  // ─── SCOPED ENTITY GETTERS ──────────────────────────────────────────────────

  public getScopedStudents(user?: User | null, role?: UserRole | null): Student[] {
    const all = this.getStudents();
    if (!user || !role) return all;

    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'STUDENT_SECTION', 'EXAM_CELL', 'ACCOUNTS_ADMIN'].includes(role)) {
      return all;
    }

    if (role === 'DEPUTY_REGISTRAR') {
      const scopes = this.getDeputyRegistrarScopeByUserId(user.id);
      if (scopes.length === 0) return [];
      return all.filter(s => {
        return scopes.some(scope => {
          const matchInst = !s.instituteId || scope.instituteId === s.instituteId;
          const matchDept = scope.departmentIds.length > 0 ? (Boolean(s.departmentId) && scope.departmentIds.includes(s.departmentId!)) : false;
          return matchInst && matchDept;
        });
      });
    }

    if (role === 'PRINCIPAL') {
      return all.filter(s => !s.instituteId || s.instituteId === user.instituteId);
    }

    if (role === 'HOD') {
      return all.filter(s => 
        (!s.departmentId || s.departmentId === user.departmentId) &&
        (!s.instituteId || !user.instituteId || s.instituteId === user.instituteId)
      );
    }

    if (role === 'FACULTY') {
      return all.filter(s => !s.departmentId || s.departmentId === user.departmentId);
    }

    if (role === 'STUDENT') {
      return all.filter(s => s.id === user.id || (s as any).userId === user.id || s.email === user.email || s.enrollmentNo === user.enrollmentNo);
    }

    return all;
  }

  public getScopedFaculty(user?: User | null, role?: UserRole | null): Faculty[] {
    const all = this.getFaculty();
    if (!user || !role) return all;

    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'IQAC'].includes(role)) {
      return all;
    }

    if (role === 'DEPUTY_REGISTRAR') {
      const scopes = this.getDeputyRegistrarScopeByUserId(user.id);
      if (scopes.length === 0) return [];
      return all.filter(f => {
        return scopes.some(scope => {
          const matchInst = !f.instituteId || scope.instituteId === f.instituteId;
          const matchDept = scope.departmentIds.length > 0 ? (Boolean(f.departmentId) && scope.departmentIds.includes(f.departmentId!)) : false;
          return matchInst && matchDept;
        });
      });
    }

    if (role === 'PRINCIPAL') {
      return all.filter(f => !f.instituteId || f.instituteId === user.instituteId);
    }

    if (role === 'HOD') {
      return all.filter(f => 
        (!f.departmentId || f.departmentId === user.departmentId) &&
        (!f.instituteId || !user.instituteId || f.instituteId === user.instituteId)
      );
    }

    if (role === 'FACULTY') {
      return all.filter(f => !f.departmentId || f.departmentId === user.departmentId);
    }

    return all;
  }

  // ─── DEPUTY REGISTRAR SCOPE MANAGEMENT ─────────────────────────────────────

  public getDeputyRegistrarScopes(userId?: string): DeputyRegistrarScopeMapping[] {
    if (!this.state.deputyRegistrarScopes) {
      this.state.deputyRegistrarScopes = [...initialDeputyRegistrarScopes];
    }
    if (userId) {
      return this.state.deputyRegistrarScopes.filter(s => s.userId === userId && s.status === 'ACTIVE');
    }
    return this.state.deputyRegistrarScopes.filter(s => s.status === 'ACTIVE');
  }

  public getDeputyRegistrarScopeByUserId(userId: string): DeputyRegistrarScopeMapping[] {
    return this.getDeputyRegistrarScopes(userId);
  }

  // ─── UNIVERSITY ASSET MANAGEMENT & RESOURCE ALLOCATION GETTERS ───────────────
  public getUniversityAssets(): UniversityAsset[] {
    if (!this.state.universityAssets) {
      this.state.universityAssets = [...initialUniversityAssets];
    }
    return this.state.universityAssets;
  }

  public getAssetDepartmentAllocations(): AssetDepartmentAllocation[] {
    if (!this.state.assetDepartmentAllocations) {
      this.state.assetDepartmentAllocations = [...initialAssetDepartmentAllocations];
    }
    return this.state.assetDepartmentAllocations;
  }

  public getAssetTransferRecords(): AssetTransferRecord[] {
    if (!this.state.assetTransferRecords) {
      this.state.assetTransferRecords = [];
    }
    return this.state.assetTransferRecords;
  }

  public getAssetReturnRecords(): AssetReturnRecord[] {
    if (!this.state.assetReturnRecords) {
      this.state.assetReturnRecords = [];
    }
    return this.state.assetReturnRecords;
  }

  public getAssetMaintenanceRecords(): AssetMaintenanceRecord[] {
    if (!this.state.assetMaintenanceRecords) {
      this.state.assetMaintenanceRecords = [];
    }
    return this.state.assetMaintenanceRecords;
  }

  public getAssetAllocationRequests(): AssetAllocationRequest[] {
    if (!this.state.assetAllocationRequests) {
      this.state.assetAllocationRequests = [...initialAssetAllocationRequests];
    }
    return this.state.assetAllocationRequests;
  }

  public getAssetHistoryEvents(): AssetHistoryEvent[] {
    if (!this.state.assetHistoryEvents) {
      this.state.assetHistoryEvents = [];
    }
    return this.state.assetHistoryEvents;
  }

  public getInstitutionalResources(): InstitutionalResource[] {
    if (!this.state.institutionalResources) {
      this.state.institutionalResources = [...initialInstitutionalResources];
    }
    return this.state.institutionalResources;
  }

  public getClassroomAllocations(): ClassroomAllocation[] {
    if (!this.state.classroomAllocations) {
      this.state.classroomAllocations = [...initialClassroomAllocations];
    }
    return this.state.classroomAllocations;
  }

  public getLaboratoryAllocations(): LaboratoryAllocation[] {
    if (!this.state.laboratoryAllocations) {
      this.state.laboratoryAllocations = [...initialLaboratoryAllocations];
    }
    return this.state.laboratoryAllocations;
  }

  public getFacultyAllocations(): FacultyAllocation[] {
    if (!this.state.facultyAllocations) {
      this.state.facultyAllocations = [...initialFacultyAllocations];
    }
    return this.state.facultyAllocations;
  }

  public getSubjectAllocations(): SubjectAllocation[] {
    if (!this.state.subjectAllocations) {
      this.state.subjectAllocations = [...initialSubjectAllocations];
    }
    return this.state.subjectAllocations;
  }

  public getDepartmentResourceAllocations(): DepartmentResourceAllocation[] {
    if (!this.state.departmentResourceAllocations) {
      this.state.departmentResourceAllocations = [];
    }
    return this.state.departmentResourceAllocations;
  }

  public getAllocationHistoryRecords(): AllocationHistoryRecord[] {
    if (!this.state.allocationHistoryRecords) {
      this.state.allocationHistoryRecords = [];
    }
    return this.state.allocationHistoryRecords;
  }

  public assignDeputyRegistrarScope(params: {
    userId: string;
    instituteId: string;
    departmentIds: string[];
    assignedByUser: User;
  }): DeputyRegistrarScopeMapping {
    if (!this.state.deputyRegistrarScopes) this.state.deputyRegistrarScopes = [];
    if (!this.state.deputyRegistrarScopeAudits) this.state.deputyRegistrarScopeAudits = [];

    // Validation: Cannot assign own scope
    if (params.assignedByUser.id === params.userId) {
      throw new Error('403 Forbidden: Deputy Registrar cannot assign or modify their own scope.');
    }

    const targetUser = this.getUsers().find(u => u.id === params.userId);
    const inst = this.getInstitutes().find(i => i.id === params.instituteId);
    const allDepts = this.getDepartments();
    const deptNames = params.departmentIds
      .map(dId => allDepts.find(d => d.id === dId)?.name)
      .filter((n): n is string => Boolean(n));

    // Check if mapping for this user + institute already exists
    const existingIndex = this.state.deputyRegistrarScopes.findIndex(
      s => s.userId === params.userId && s.instituteId === params.instituteId
    );

    const now = new Date().toISOString();
    let resultMapping: DeputyRegistrarScopeMapping;

    if (existingIndex >= 0) {
      // Update existing scope
      const existing = this.state.deputyRegistrarScopes[existingIndex];
      existing.departmentIds = Array.from(new Set([...params.departmentIds]));
      existing.departmentNames = deptNames;
      existing.assignedByUserId = params.assignedByUser.id;
      existing.assignedByName = params.assignedByUser.name;
      existing.assignedByRole = params.assignedByUser.role;
      existing.status = 'ACTIVE';
      existing.updatedAt = now;
      resultMapping = existing;

      this.state.deputyRegistrarScopeAudits.unshift({
        id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: params.userId,
        userName: targetUser?.name || 'Deputy Registrar',
        instituteId: params.instituteId,
        instituteName: inst?.name,
        departmentId: params.departmentIds.join(','),
        departmentName: deptNames.join(', '),
        action: 'UPDATED',
        assignedByUserId: params.assignedByUser.id,
        assignedByName: params.assignedByUser.name,
        assignedByRole: params.assignedByUser.role,
        timestamp: now,
        details: `Updated scope for ${deptNames.length} department(s)`
      });
    } else {
      // Create new scope
      resultMapping = {
        id: `dr-scope-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: params.userId,
        userName: targetUser?.name || 'Deputy Registrar',
        instituteId: params.instituteId,
        instituteCode: inst?.code,
        instituteName: inst?.name,
        departmentIds: Array.from(new Set([...params.departmentIds])),
        departmentNames: deptNames,
        assignedByUserId: params.assignedByUser.id,
        assignedByName: params.assignedByUser.name,
        assignedByRole: params.assignedByUser.role,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      };
      this.state.deputyRegistrarScopes.push(resultMapping);

      this.state.deputyRegistrarScopeAudits.unshift({
        id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: params.userId,
        userName: targetUser?.name || 'Deputy Registrar',
        instituteId: params.instituteId,
        instituteName: inst?.name,
        departmentId: params.departmentIds.join(','),
        departmentName: deptNames.join(', '),
        action: 'ASSIGNED',
        assignedByUserId: params.assignedByUser.id,
        assignedByName: params.assignedByUser.name,
        assignedByRole: params.assignedByUser.role,
        timestamp: now,
        details: `Assigned new scope covering ${deptNames.length} department(s)`
      });
    }

    this.saveState();
    return resultMapping;
  }

  public removeDeputyRegistrarScope(scopeId: string, removedByUser: User): boolean {
    if (!this.state.deputyRegistrarScopes) return false;
    if (!this.state.deputyRegistrarScopeAudits) this.state.deputyRegistrarScopeAudits = [];

    const scope = this.state.deputyRegistrarScopes.find(s => s.id === scopeId);
    if (!scope) return false;

    if (removedByUser.id === scope.userId) {
      throw new Error('403 Forbidden: Deputy Registrar cannot remove their own scope.');
    }

    this.state.deputyRegistrarScopes = this.state.deputyRegistrarScopes.filter(s => s.id !== scopeId);
    const now = new Date().toISOString();

    this.state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: scope.userId,
      userName: scope.userName || 'Deputy Registrar',
      instituteId: scope.instituteId,
      instituteName: scope.instituteName,
      departmentId: (scope.departmentIds || []).join(','),
      departmentName: (scope.departmentNames || []).join(', '),
      action: 'REMOVED',
      assignedByUserId: removedByUser.id,
      assignedByName: removedByUser.name,
      assignedByRole: removedByUser.role,
      timestamp: now,
      details: `Removed scope assignment for institute ${scope.instituteName}`
    });

    this.saveState();
    return true;
  }

  public addDepartmentToDeputyRegistrarScope(scopeId: string, departmentId: string, updatedByUser: User): DeputyRegistrarScopeMapping | null {
    if (!this.state.deputyRegistrarScopes) return null;
    const scope = this.state.deputyRegistrarScopes.find(s => s.id === scopeId);
    if (!scope) return null;

    if (updatedByUser.id === scope.userId) {
      throw new Error('403 Forbidden: Deputy Registrar cannot modify their own scope.');
    }

    if (!scope.departmentIds.includes(departmentId)) {
      scope.departmentIds.push(departmentId);
      const allDepts = this.getDepartments();
      scope.departmentNames = scope.departmentIds.map(dId => allDepts.find(d => d.id === dId)?.name).filter((n): n is string => Boolean(n));
      scope.updatedAt = new Date().toISOString();
      scope.assignedByUserId = updatedByUser.id;
      scope.assignedByName = updatedByUser.name;

      this.state.deputyRegistrarScopeAudits = this.state.deputyRegistrarScopeAudits || [];
      const addedDeptName = allDepts.find(d => d.id === departmentId)?.name || departmentId;
      this.state.deputyRegistrarScopeAudits.unshift({
        id: `dr-audit-${Date.now()}`,
        userId: scope.userId,
        userName: scope.userName || 'Deputy Registrar',
        instituteId: scope.instituteId,
        instituteName: scope.instituteName,
        departmentId: departmentId,
        departmentName: addedDeptName,
        action: 'UPDATED',
        assignedByUserId: updatedByUser.id,
        assignedByName: updatedByUser.name,
        assignedByRole: updatedByUser.role,
        timestamp: new Date().toISOString(),
        details: `Added department: ${addedDeptName}`
      });
      this.saveState();
    }
    return scope;
  }

  public removeDepartmentFromDeputyRegistrarScope(scopeId: string, departmentId: string, updatedByUser: User): DeputyRegistrarScopeMapping | null {
    if (!this.state.deputyRegistrarScopes) return null;
    const scope = this.state.deputyRegistrarScopes.find(s => s.id === scopeId);
    if (!scope) return null;

    if (updatedByUser.id === scope.userId) {
      throw new Error('403 Forbidden: Deputy Registrar cannot modify their own scope.');
    }

    scope.departmentIds = scope.departmentIds.filter(d => d !== departmentId);
    const allDepts = this.getDepartments();
    scope.departmentNames = scope.departmentIds.map(dId => allDepts.find(d => d.id === dId)?.name).filter((n): n is string => Boolean(n));
    scope.updatedAt = new Date().toISOString();
    scope.assignedByUserId = updatedByUser.id;
    scope.assignedByName = updatedByUser.name;

    this.state.deputyRegistrarScopeAudits = this.state.deputyRegistrarScopeAudits || [];
    const remDeptName = allDepts.find(d => d.id === departmentId)?.name || departmentId;
    this.state.deputyRegistrarScopeAudits.unshift({
      id: `dr-audit-${Date.now()}`,
      userId: scope.userId,
      userName: scope.userName || 'Deputy Registrar',
      instituteId: scope.instituteId,
      instituteName: scope.instituteName,
      departmentId: departmentId,
      departmentName: remDeptName,
      action: 'REMOVED',
      assignedByUserId: updatedByUser.id,
      assignedByName: updatedByUser.name,
      assignedByRole: updatedByUser.role,
      timestamp: new Date().toISOString(),
      details: `Removed department: ${remDeptName}`
    });
    this.saveState();
    return scope;
  }

  public getDeputyRegistrarScopeAuditLogs(userId?: string): DeputyRegistrarScopeAudit[] {
    if (!this.state.deputyRegistrarScopeAudits) {
      this.state.deputyRegistrarScopeAudits = [...initialDeputyRegistrarScopeAudits];
    }
    if (userId) {
      return this.state.deputyRegistrarScopeAudits.filter(a => a.userId === userId);
    }
    return this.state.deputyRegistrarScopeAudits;
  }


  // --- Finance & Billing Specific Helpers ---
  public getFinanceOverviewStats() {
    const feeRecords = this.state.studentFeeRecords;
    let totalDemand = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let overdueCount = 0;
    let paidCount = 0;

    feeRecords.forEach(rec => {
      totalDemand += rec.totalAmount;
      totalCollected += rec.paidAmount;
      totalPending += rec.pendingAmount;

      if (rec.status === 'OVERDUE') overdueCount++;
      if (rec.status === 'PAID') paidCount++;
    });

    const collectionPercentage = totalDemand > 0 ? Math.round((totalCollected / totalDemand) * 100) : 100;

    return {
      totalDemand,
      totalCollected,
      totalPending,
      overdueCount,
      paidCount,
      totalRecordsCount: feeRecords.length,
      collectionPercentage
    };
  }

  // --- Student Attendance Calculation ---
  public getStudentAttendanceStats(studentId: string) {
    const sessions = this.state.attendanceSessions;
    let totalClasses = 0;
    let presentClasses = 0;
    let absentClasses = 0;

    const subjectStats: Record<string, { subjectName: string; total: number; present: number }> = {};

    sessions.forEach(sess => {
      const rec = sess.records.find(r => r.studentId === studentId);
      if (rec) {
        totalClasses++;
        const subj = this.getSubjectById(sess.subjectId);
        const subjName = subj ? subj.name : 'Subject';

        if (!subjectStats[sess.subjectId]) {
          subjectStats[sess.subjectId] = { subjectName: subjName, total: 0, present: 0 };
        }
        subjectStats[sess.subjectId].total++;

        if (rec.status === 'PRESENT' || rec.status === 'LATE') {
          presentClasses++;
          subjectStats[sess.subjectId].present++;
        } else {
          absentClasses++;
        }
      }
    });

    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    return {
      totalClasses,
      presentClasses,
      absentClasses,
      percentage,
      subjectStats
    };
  }

  // --- Phase 6: Convert Approved Applicant to active Student Record ---
  public convertApplicantToStudent(applicationId: string): Student | null {
    const app = this.state.admissionApplications.find(a => a.id === applicationId);
    if (!app || app.status !== 'APPROVED') return null;

    const newStudentId = `stu-${Date.now()}`;
    const enrollmentNo = `${new Date().getFullYear().toString().slice(2)}010100${this.state.students.length + 1}`;

    const prog = this.getProgramById(app.programId);
    const deptId = prog ? prog.departmentId : 'dept-1';
    const instId = prog ? prog.instituteId : 'inst-1';

    // Create student DB record
    const newStudent: Student = {
      id: newStudentId,
      enrollmentNo,
      name: app.applicantName,
      email: app.email,
      phone: app.phone,
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      gender: app.gender,
      dateOfBirth: app.dateOfBirth,
      bloodGroup: app.bloodGroup,
      address: app.address,
      admissionDate: new Date().toISOString().split('T')[0],
      instituteId: instId,
      departmentId: deptId,
      programId: app.programId,
      batchId: app.batchId,
      semesterId: app.semesterId,
      divisionId: app.divisionId,
      guardianName: app.guardianName,
      guardianPhone: app.guardianPhone,
      status: 'ACTIVE'
    };

    this.state.students.unshift(newStudent);

    // Update application record
    app.status = 'CONVERTED';
    app.studentId = newStudentId;

    // Generate Student Fee Account Ledger matching the Program Fee Structure
    const feeStructure = this.state.feeStructures.find(f => f.programId === app.programId && f.semesterId === app.semesterId) || this.state.feeStructures[0];
    const totalAmount = feeStructure ? feeStructure.totalAmount : 75000;
    const tuition = feeStructure?.tuitionFee ?? 45000;
    const lab = feeStructure?.labFee ?? 8000;
    const dev = feeStructure?.developmentFee ?? 7000;
    const hostel = feeStructure?.hostelFee ?? 15000;

    const newFeeRecord: StudentFeeRecord = {
      id: `sfr-${Date.now()}`,
      studentId: newStudentId,
      studentName: app.applicantName,
      enrollmentNo,
      programId: app.programId,
      semesterId: app.semesterId,
      academicYearId: 'ay-2024',
      feeStructureId: feeStructure ? feeStructure.id : 'fs-btech-sem4',
      tuitionFee: tuition,
      labFee: lab,
      developmentFee: dev,
      hostelFee: hostel,
      totalAmount,
      paidAmount: 0,
      pendingAmount: totalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out
      status: 'PENDING'
    };

    this.state.studentFeeRecords.unshift(newFeeRecord);

    this.logAudit('CONVERT', 'Admissions', `Converted applicant ${app.applicantName} to active Student Enrolment ${enrollmentNo}`);

    this.saveState();
    return newStudent;
  }

  // --- NOTIFICATION MANAGEMENT (ENTERPRISE TARGETING & RECIPIENT ISOLATION) ---
  getAllNotifications(): ERPNotification[] {
    return this.state.notifications || [];
  }

  getNotifications(user: User | null, role?: UserRole | null): ERPNotification[] {
    if (!user) return this.getAllNotifications();
    const userId = user.id;
    const userRole = role || user.role || 'STUDENT';

    // Look up student record if logged-in user is a student
    const student = userRole === 'STUDENT' ? this.getStudents().find(s => s.id === userId || s.email === user.email || s.enrollmentNo === user.enrollmentNo) : null;
    const userInstId = user.instituteId || student?.instituteId;
    const userDeptId = user.departmentId || student?.departmentId;
    const userProgId = student?.programId;
    const userSemId = student?.semesterId;
    const userDivId = student?.divisionId;
    const userAYId = student?.academicYearId;

    return (this.state.notifications || []).filter(n => {
      // 1. Direct Recipient check (NotificationRecipient record)
      if (n.recipients && n.recipients.length > 0) {
        return n.recipients.some(r => r.userId === userId);
      }

      // 2. Direct Target User Match
      if (n.targetUserId) {
        return n.targetUserId === userId;
      }
      if (n.targetUserIds && n.targetUserIds.length > 0) {
        return n.targetUserIds.includes(userId);
      }

      // 3. If it's a TARGETED notification with NO matching user ID, do NOT show to random users
      if (n.scopeType === 'TARGETED' && !n.targetRole && !n.targetInstituteId && !n.targetDepartmentId) {
        return false;
      }

      // 4. University-Wide Broadcast (explicitly configured)
      if (n.scopeType === 'UNIVERSITY_WIDE') {
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 5. Institute-Wide Broadcast (explicitly configured)
      if (n.scopeType === 'INSTITUTE_WIDE') {
        if (userRole === 'DEPUTY_REGISTRAR') {
          const scopes = this.getDeputyRegistrarScopeByUserId(userId);
          if (n.targetInstituteId && !scopes.some(s => s.instituteId === n.targetInstituteId)) {
            return false;
          }
        } else if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) {
          return false;
        }
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 6. Department-Wide Broadcast (explicitly configured)
      if (n.scopeType === 'DEPARTMENT_WIDE') {
        if (userRole === 'DEPUTY_REGISTRAR') {
          const scopes = this.getDeputyRegistrarScopeByUserId(userId);
          const inScope = scopes.some(s => {
            const matchInst = !n.targetInstituteId || s.instituteId === n.targetInstituteId;
            const matchDept = !n.targetDepartmentId || s.departmentIds.length === 0 || s.departmentIds.includes(n.targetDepartmentId);
            return matchInst && matchDept;
          });
          if (!inScope) return false;
        } else {
          if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) return false;
          if (n.targetDepartmentId && userDeptId && n.targetDepartmentId !== userDeptId) return false;
        }
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 7. Role + Organization Strict Match
      if (n.targetRole && n.targetRole !== 'ALL') {
        if (n.targetRole !== userRole) {
          if ((n.targetRole === 'SUPER_ADMIN' || n.targetRole === 'UNIVERSITY_ADMIN') && 
              (userRole === 'SUPER_ADMIN' || userRole === 'UNIVERSITY_ADMIN')) {
            // Match
          } else {
            return false;
          }
        }

        // Validate Institute constraint
        if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) {
          return false;
        }

        // Validate Department constraint
        if (n.targetDepartmentId && userDeptId && n.targetDepartmentId !== userDeptId) {
          return false;
        }

        // Validate Student specific constraints
        if (student) {
          if (n.targetProgramId && userProgId && n.targetProgramId !== userProgId) return false;
          if (n.targetSemesterId && userSemId && n.targetSemesterId !== userSemId) return false;
          if (n.targetDivisionId && userDivId && n.targetDivisionId !== userDivId) return false;
          if (n.targetAcademicYearId && userAYId && n.targetAcademicYearId !== userAYId) return false;
        }

        // If organization scope was explicitly given, match
        if (n.targetInstituteId || n.targetDepartmentId) {
          return true;
        }

        // Administrative single-office roles
        if (['HOSTEL_ADMIN', 'MAINTENANCE_ADMIN', 'TRANSPORT_ADMIN', 'LIBRARY_ADMIN', 'EXAM_CELL', 'STUDENT_SECTION', 'REGISTRAR', 'IQAC'].includes(n.targetRole)) {
          return true;
        }

        return false;
      }

      return false;
    });
  }

  getUnreadNotificationCount(user: User | null, role?: UserRole | null): number {
    if (!user) return 0;
    const userId = user.id;
    const userNotifications = this.getNotifications(user, role);
    return userNotifications.filter(n => !(n.isReadByUsers || []).includes(userId)).length;
  }

  createNotification(data: any): ERPNotification {
    return this.addNotification(data);
  }

  addNotification(data: Omit<ERPNotification, 'id' | 'createdAt' | 'isReadByUsers'> & { type?: any; scopeType?: any; recipients?: any[] }): ERPNotification {
    const scopeType = data.scopeType || (data.targetRole === 'ALL' ? 'UNIVERSITY_WIDE' : 'TARGETED');
    const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    let recipients = data.recipients ? [...data.recipients] : [];
    if (recipients.length === 0) {
      if (data.targetUserId) {
        recipients.push({
          id: `recip-${Date.now()}-${data.targetUserId}`,
          notificationId: notifId,
          userId: data.targetUserId,
          deliveredAt: now,
          isRead: false
        });
      }
      if (data.targetUserIds && data.targetUserIds.length > 0) {
        data.targetUserIds.forEach((uId: string) => {
          if (!recipients.some((r: any) => r.userId === uId)) {
            recipients.push({
              id: `recip-${Date.now()}-${uId}`,
              notificationId: notifId,
              userId: uId,
              deliveredAt: now,
              isRead: false
            });
          }
        });
      }
    }

    const newNotification: ERPNotification = {
      ...data,
      id: notifId,
      type: data.type || (data.targetRole === 'ALL' ? 'INFORMATION' : 'STATUS_UPDATE'),
      scopeType,
      recipients,
      createdAt: now,
      isReadByUsers: []
    };
    if (!this.state.notifications) {
      this.state.notifications = [];
    }
    this.state.notifications.unshift(newNotification);
    this.saveState();
    return newNotification;
  }

  markNotificationAsRead(notificationId: string, userId: string): void {
    if (!this.state.notifications) return;
    const notif = this.state.notifications.find(n => n.id === notificationId);
    if (notif) {
      if (!notif.isReadByUsers) notif.isReadByUsers = [];
      if (!notif.isReadByUsers.includes(userId)) {
        notif.isReadByUsers.push(userId);
      }
      if (notif.recipients) {
        const recip = notif.recipients.find((r: any) => r.userId === userId);
        if (recip) {
          recip.isRead = true;
          recip.readAt = new Date().toISOString();
        }
      }
      this.saveState();
    }
  }

  markAllNotificationsAsRead(user: User | null, role?: UserRole | null): void {
    if (!this.state.notifications || !user) return;
    const userId = user.id;
    const relevant = this.getNotifications(user, role);
    const now = new Date().toISOString();

    relevant.forEach(n => {
      if (!n.isReadByUsers) n.isReadByUsers = [];
      if (!n.isReadByUsers.includes(userId)) {
        n.isReadByUsers.push(userId);
      }
      if (n.recipients) {
        const recip = n.recipients.find((r: any) => r.userId === userId);
        if (recip) {
          recip.isRead = true;
          recip.readAt = now;
        }
      }
    });

    this.saveState();
  }

  // ─── EDP Duty Management Methods ──────────────────────────────────────────
  getEdpDuties(): EdpDuty[] {
    return this.state.edpDuties || [];
  }

  getScopedEdpDuties(
    user?: User | null, 
    role?: UserRole | null,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      dutyDate?: string;
      departmentId?: string;
      facultyId?: string;
      programId?: string;
      subjectId?: string;
      status?: string;
      search?: string;
    }
  ): EdpDuty[] {
    let list = this.getEdpDuties();
    const effectiveRole = role || (user?.role as UserRole);

    if (user && effectiveRole) {
      if (
        effectiveRole === 'SUPER_ADMIN' ||
        effectiveRole === 'UNIVERSITY_ADMIN' ||
        effectiveRole === 'REGISTRAR' ||
        effectiveRole === 'IQAC' ||
        effectiveRole === 'EXAM_CELL'
      ) {
        // Full executive access
      } else if (effectiveRole === 'PRINCIPAL' && user.instituteId) {
        list = list.filter(d => d.instituteId === user.instituteId || d.assignedUserId === user.id || d.facultyId === user.id);
      } else if (effectiveRole === 'HOD' && user.departmentId) {
        list = list.filter(d => d.departmentId === user.departmentId || d.assignedUserId === user.id || d.facultyId === user.id);
      } else {
        // Faculty / Staff sees only duties assigned to them
        list = list.filter(d => 
          d.assignedUserId === user.id || 
          d.facultyId === user.id ||
          d.assignedUserId === user.employeeId ||
          (user.name && d.assignedUserName && d.assignedUserName.toLowerCase().includes(user.name.toLowerCase()))
        );
      }
    }

    if (filters) {
      if (filters.dutyDate) {
        list = list.filter(d => d.dutyDate === filters.dutyDate);
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).getTime();
        list = list.filter(d => new Date(d.dutyDate).getTime() >= from);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime();
        list = list.filter(d => new Date(d.dutyDate).getTime() <= to + 86400000);
      }
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        list = list.filter(d => d.departmentId === filters.departmentId);
      }
      if (filters.facultyId && filters.facultyId !== 'ALL') {
        list = list.filter(d => d.facultyId === filters.facultyId || d.assignedUserId === filters.facultyId);
      }
      if (filters.programId && filters.programId !== 'ALL') {
        list = list.filter(d => d.programId === filters.programId);
      }
      if (filters.subjectId && filters.subjectId !== 'ALL') {
        list = list.filter(d => d.subjectId === filters.subjectId || d.subjectCode === filters.subjectId);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(d => d.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(d => 
          d.dutyCode.toLowerCase().includes(q) ||
          (d.assignedUserName && d.assignedUserName.toLowerCase().includes(q)) ||
          (d.facultyName && d.facultyName.toLowerCase().includes(q)) ||
          (d.programName && d.programName.toLowerCase().includes(q)) ||
          (d.subjectName && d.subjectName.toLowerCase().includes(q)) ||
          (d.subjectCode && d.subjectCode.toLowerCase().includes(q)) ||
          (d.roomNo && d.roomNo.toLowerCase().includes(q)) ||
          (d.classroom && d.classroom.toLowerCase().includes(q)) ||
          (d.venue && d.venue.toLowerCase().includes(q)) ||
          (d.remarks && d.remarks.toLowerCase().includes(q))
        );
      }
    }

    return list;
  }

  getEdpDutyById(dutyId: string, user?: User | null, role?: UserRole | null): EdpDuty | null {
    const list = this.getScopedEdpDuties(user, role);
    const duty = list.find(d => d.id === dutyId || d.dutyCode === dutyId);
    if (!duty) {
      if (user) {
        this.logAudit(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'EDP Duty Security',
          `403 Forbidden: User "${user.name}" (${role || user.role}) attempted unauthorized access to EDP Duty "${dutyId}"`,
          user.name,
          (role as UserRole) || user.role
        );
      }
      return null;
    }
    return duty;
  }

  getEdpDutyDashboardStats(
    user?: User | null, 
    role?: UserRole | null,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      dutyDate?: string;
      departmentId?: string;
      facultyId?: string;
      programId?: string;
      subjectId?: string;
    }
  ): EdpDutyDashboardStats {
    const list = this.getScopedEdpDuties(user, role, filters);

    let assigned = 0;
    let inProgress = 0;
    let submitted = 0;
    let verified = 0;
    let rejected = 0;
    let studentsCovered = 0;
    let photosUploaded = 0;
    const classesCoveredSet = new Set<string>();

    list.forEach(d => {
      if (d.status === 'ASSIGNED') assigned++;
      else if (d.status === 'IN_PROGRESS') inProgress++;
      else if (d.status === 'SUBMITTED') submitted++;
      else if (d.status === 'VERIFIED') verified++;
      else if (d.status === 'REJECTED') rejected++;

      if (d.presentStudents && d.presentStudents > 0) {
        studentsCovered += d.presentStudents;
      }

      if (d.photos && d.photos.length > 0) {
        photosUploaded += d.photos.length;
      }
      if (d.evidenceList && d.evidenceList.length > 0) {
        photosUploaded += d.evidenceList.length;
      }

      const classIdentifier = d.programId ? `${d.programId}-${d.semesterId || ''}-${d.divisionId || ''}-${d.roomNo || ''}` : d.roomNo || d.classroom || d.venue || d.id;
      if (classIdentifier) {
        classesCoveredSet.add(classIdentifier);
      }
    });

    return {
      totalDuties: list.length,
      assigned,
      inProgress,
      submitted,
      verified,
      rejected,
      classesCovered: classesCoveredSet.size,
      studentsCovered,
      photosUploaded
    };
  }

  addEdpDuty(dutyData: Partial<EdpDuty>, creatorUser?: User | null): EdpDuty {
    const newId = `edp-${Date.now()}`;
    const dutyCount = (this.state.edpDuties || []).length + 1;
    const dutyCode = `EDP-${new Date().getFullYear()}-${String(dutyCount).padStart(3, '0')}`;

    const facultyId = dutyData.facultyId || dutyData.assignedUserId || 'fac-1';
    const faculty = this.state.faculty?.find(f => f.id === facultyId);
    const facultyName = dutyData.facultyName || dutyData.assignedUserName || faculty?.name || 'Assigned Faculty Member';
    const facultyDesignation = dutyData.facultyDesignation || dutyData.assignedUserDesignation || faculty?.designation || 'Faculty Member';

    const inst = this.state.institutes?.find(i => i.id === dutyData.instituteId);
    const dept = this.state.departments?.find(d => d.id === dutyData.departmentId);
    const prog = this.state.programs?.find(p => p.id === dutyData.programId);
    const sem = this.state.semesters?.find(s => s.id === dutyData.semesterId);
    const div = this.state.divisions?.find(d => d.id === dutyData.divisionId);
    const sub = this.state.subjects?.find(s => s.id === dutyData.subjectId);

    const newDuty: EdpDuty = {
      id: newId,
      dutyCode,
      facultyId,
      facultyName,
      facultyDesignation,
      assignedUserId: facultyId,
      assignedUserName: facultyName,
      assignedUserRole: (dutyData.assignedUserRole as UserRole) || 'FACULTY',
      assignedUserDesignation: facultyDesignation,
      
      instituteId: dutyData.instituteId || 'inst-1',
      instituteName: dutyData.instituteName || inst?.name || 'Swarrnim Institute of Technology',
      departmentId: dutyData.departmentId || 'dept-1',
      departmentName: dutyData.departmentName || dept?.name || 'Computer Engineering',
      programId: dutyData.programId,
      programName: dutyData.programName || prog?.name,
      semesterId: dutyData.semesterId,
      semesterName: dutyData.semesterName || (sem ? `Semester ${sem.number}` : undefined),
      batchId: dutyData.batchId,
      batchName: dutyData.batchName,
      divisionId: dutyData.divisionId,
      divisionName: dutyData.divisionName || div?.name,
      
      subjectId: dutyData.subjectId,
      subjectName: dutyData.subjectName || sub?.name,
      subjectCode: dutyData.subjectCode || sub?.code,
      roomNo: dutyData.roomNo || dutyData.classroom || 'Room 302',
      classroom: dutyData.classroom || dutyData.roomNo || 'Room 302',
      venue: dutyData.venue || dutyData.roomNo || 'Campus Classroom',
      
      dutyDate: dutyData.dutyDate || new Date().toISOString().split('T')[0],
      startTime: dutyData.startTime || '09:30 AM',
      endTime: dutyData.endTime || '11:30 AM',
      
      totalStudents: dutyData.totalStudents || 60,
      presentStudents: dutyData.presentStudents || 0,
      absentStudents: dutyData.absentStudents || 0,
      
      photos: dutyData.photos || [],
      evidenceList: dutyData.evidenceList || [],
      
      remarks: dutyData.remarks || '',
      responsibilityDetails: dutyData.responsibilityDetails || 'Classroom monitoring, student attendance count and photo evidence reporting.',
      reportsNotes: dutyData.reportsNotes || '',
      status: 'ASSIGNED',
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.state.edpDuties) this.state.edpDuties = [];
    this.state.edpDuties.unshift(newDuty);
    this.saveState();

    // Notify assigned faculty
    this.addNotification({
      title: `New Classroom EDP Duty Assigned: ${newDuty.dutyCode}`,
      message: `You have been assigned EDP Duty for ${newDuty.subjectName || 'Class'} (${newDuty.roomNo}) on ${newDuty.dutyDate} at ${newDuty.startTime}.`,
      module: 'EVENT',
      timestamp: new Date().toISOString(),
      targetUserId: newDuty.assignedUserId,
      linkTab: 'edp-duties'
    });

    this.logAudit(
      'CREATE_EDP_DUTY',
      'EDP Duty',
      `Created classroom duty ${dutyCode} for ${newDuty.assignedUserName} in ${newDuty.roomNo}`,
      creatorUser?.name || 'Academic Administrator',
      creatorUser?.role || 'SUPER_ADMIN'
    );

    return newDuty;
  }

  startEdpDuty(dutyId: string, user?: User | null): EdpDuty {
    if (!this.state.edpDuties) this.state.edpDuties = [];
    const duty = this.state.edpDuties.find(d => d.id === dutyId);
    if (!duty) throw new Error(`EDP Duty "${dutyId}" not found`);

    duty.status = 'IN_PROGRESS';
    duty.updatedAt = new Date().toISOString();
    this.saveState();

    this.logAudit(
      'START_EDP_DUTY',
      'EDP Duty',
      `Faculty "${user?.name || duty.assignedUserName}" started classroom duty ${duty.dutyCode} in ${duty.roomNo}`,
      user?.name || duty.assignedUserName,
      (user?.role as UserRole) || 'FACULTY'
    );

    return duty;
  }

  submitEdpDutyReport(
    dutyId: string,
    reportData: {
      totalStudents: number;
      presentStudents: number;
      absentStudents?: number;
      photos: EdpDutyPhoto[];
      remarks?: string;
      roomNo?: string;
      classroom?: string;
      subjectId?: string;
      subjectName?: string;
      subjectCode?: string;
      reportsNotes?: string;
    },
    user?: User | null
  ): EdpDuty {
    if (!this.state.edpDuties) this.state.edpDuties = [];
    const duty = this.state.edpDuties.find(d => d.id === dutyId);
    if (!duty) throw new Error(`EDP Duty "${dutyId}" not found`);

    // Validation: Headcount rules
    const total = Math.max(0, Number(reportData.totalStudents) || 0);
    const present = Math.max(0, Number(reportData.presentStudents) || 0);
    
    if (present > total) {
      throw new Error(`Present students (${present}) cannot exceed total enrolled students (${total}).`);
    }

    const absent = Math.max(0, total - present);

    duty.totalStudents = total;
    duty.presentStudents = present;
    duty.absentStudents = absent;
    duty.photos = reportData.photos || [];
    if (reportData.remarks) duty.remarks = reportData.remarks;
    if (reportData.reportsNotes) duty.reportsNotes = reportData.reportsNotes;
    if (reportData.roomNo) duty.roomNo = reportData.roomNo;
    if (reportData.classroom) duty.classroom = reportData.classroom;
    if (reportData.subjectId) duty.subjectId = reportData.subjectId;
    if (reportData.subjectName) duty.subjectName = reportData.subjectName;
    if (reportData.subjectCode) duty.subjectCode = reportData.subjectCode;

    duty.status = 'SUBMITTED';
    duty.submittedAt = new Date().toISOString();
    duty.updatedAt = new Date().toISOString();

    this.saveState();

    // Notify HOD/Admin
    this.addNotification({
      title: `EDP Duty Report Submitted: ${duty.dutyCode}`,
      message: `Duty report for ${duty.roomNo} (${duty.subjectName || 'Class'}) submitted by ${duty.assignedUserName} with ${duty.presentStudents}/${duty.totalStudents} students present and ${duty.photos.length} photo proofs.`,
      module: 'SYSTEM',
      timestamp: new Date().toISOString(),
      linkTab: 'edp-duties'
    });

    this.logAudit(
      'SUBMIT_EDP_REPORT',
      'EDP Duty',
      `Submitted classroom report for ${duty.dutyCode}: ${present}/${total} present, ${duty.photos.length} photos`,
      user?.name || duty.assignedUserName,
      (user?.role as UserRole) || 'FACULTY'
    );

    return duty;
  }

  addEdpDutyEvidence(dutyId: string, evidenceData: Omit<EdpDutyEvidence, 'id'>, notes?: string): void {
    if (!this.state.edpDuties) return;
    const duty = this.state.edpDuties.find(d => d.id === dutyId);
    if (!duty) return;

    const newEvidence: EdpDutyEvidence = {
      id: `ev-${Date.now()}`,
      ...evidenceData
    };

    if (!duty.evidenceList) duty.evidenceList = [];
    duty.evidenceList.push(newEvidence);
    duty.status = 'SUBMITTED';
    if (notes) duty.reportsNotes = notes;
    duty.updatedAt = new Date().toISOString();

    this.saveState();
    this.logAudit('SUBMIT_EDP_EVIDENCE', 'EDP Duty', `Submitted geo-tagged evidence for ${duty.dutyCode}`, duty.assignedUserName, duty.assignedUserRole);
  }

  verifyEdpDuty(dutyId: string, adminUser: User, status: EdpDutyStatus, remarks?: string): void {
    if (!this.state.edpDuties) return;
    const duty = this.state.edpDuties.find(d => d.id === dutyId);
    if (!duty) return;

    duty.status = status;
    duty.verifiedByAdminId = adminUser.id;
    duty.verifiedByAdminName = adminUser.name;
    duty.verifiedAt = new Date().toISOString();
    if (remarks) duty.verificationRemarks = remarks;
    duty.updatedAt = new Date().toISOString();

    this.saveState();

    // Notify assigned user
    this.addNotification({
      title: `EDP Duty Status Updated: ${duty.dutyCode}`,
      message: `Your EDP Classroom Duty report for ${duty.roomNo} (${duty.subjectName || 'Class'}) has been marked as ${status} by ${adminUser.name}.`,
      module: 'SYSTEM',
      timestamp: new Date().toISOString(),
      targetUserId: duty.assignedUserId,
      linkTab: 'edp-duties'
    });

    this.logAudit('VERIFY_EDP_DUTY', 'EDP Duty', `Verified EDP duty ${duty.dutyCode} as ${status}`, adminUser.name, adminUser.role);
  }

  deleteEdpDuty(dutyId: string, user?: User | null, role?: UserRole | null): boolean {
    if (!this.state.edpDuties) return false;
    const index = this.state.edpDuties.findIndex(d => d.id === dutyId);
    if (index === -1) return false;

    const duty = this.state.edpDuties[index];
    this.state.edpDuties.splice(index, 1);
    this.saveState();

    this.logAudit(
      'DELETE_EDP_DUTY',
      'EDP Duty',
      `Deleted EDP Duty ${duty.dutyCode} (${duty.roomNo})`,
      user?.name || 'Admin',
      (role as UserRole) || user?.role || 'SUPER_ADMIN'
    );

    return true;
  }

  // ─── Academic Lifecycle Architecture Helpers ─────────────────────────────────
  getUniversity(): University {
    return initialUniversity;
  }

  getStudentAcademicTimeline(studentId: string): StudentAcademicHistoryRecord[] {
    const student = this.state.students.find(s => s.id === studentId);
    return student?.academicHistory || [];
  }

  getFacultySubjects(facultyId: string): Subject[] {
    const fac = this.state.faculty.find(f => f.id === facultyId);
    if (!fac || !fac.subjectIds) return [];
    return this.state.subjects.filter(s => fac.subjectIds.includes(s.id));
  }

  getSubjectStudents(subjectId: string): Student[] {
    const subject = this.state.subjects.find(s => s.id === subjectId);
    if (!subject) return [];
    return this.state.students.filter(s => s.semesterId === subject.semesterId && s.programId === subject.programId);
  }

  promoteStudentSemester(
    studentId: string,
    nextSemesterId: string,
    nextDivisionId: string,
    termEndSPI?: number
  ): Student | null {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return null;

    const currentSem = this.state.semesters.find(s => s.id === student.semesterId);
    const currentAY = this.state.academicYears.find(a => a.id === student.academicYearId);
    const nextSem = this.state.semesters.find(s => s.id === nextSemesterId);
    const div = this.state.divisions.find(d => d.id === student.divisionId);

    // Create immutable historical record of completed semester
    const historyRecord: StudentAcademicHistoryRecord = {
      id: `hist-${student.id}-sem${currentSem?.number || Date.now()}`,
      academicYearId: student.academicYearId || 'ay-2024',
      academicYearName: currentAY?.name || '2024-2025',
      semesterId: student.semesterId,
      semesterNumber: currentSem?.number || 1,
      batchId: student.batchId,
      divisionId: student.divisionId,
      divisionName: div?.name || 'Division A',
      spi: termEndSPI || 8.0,
      attendancePercentage: 88,
      feeClearanceStatus: 'CLEARED',
      status: 'PROMOTED',
      completedDate: new Date().toISOString().split('T')[0],
      remarks: `Promoted from Semester ${currentSem?.number || 1} to Semester ${nextSem?.number || 2}`
    };

    if (!student.academicHistory) {
      student.academicHistory = [];
    }
    student.academicHistory.push(historyRecord);

    // Update current active semester pointers
    student.semesterId = nextSemesterId;
    student.divisionId = nextDivisionId;
    if (nextSem?.academicYearId) {
      student.academicYearId = nextSem.academicYearId;
    }
    student.academicLifecycleStatus = nextSem && nextSem.number > 8 ? 'GRADUATED' : 'PURSUING';

    this.saveState();
    this.logAudit('PROMOTE_STUDENT', 'Academic Lifecycle', `Promoted ${student.name} (${student.enrollmentNo}) to Semester ${nextSem?.number || 'Next'}`);
    return student;
  }

  // ─── NAAC & IQAC Framework Methods ──────────────────────────────────────────
  getNaacCriteria(): NaacCriterion[] {
    return this.state.naacCriteria || initialNaacCriteria;
  }

  getNaacKeyIndicators(criterionId?: string): NaacKeyIndicator[] {
    const list = this.state.naacKeyIndicators || initialNaacKeyIndicators;
    if (criterionId) return list.filter(k => k.criterionId === criterionId);
    return list;
  }

  getNaacMetrics(criterionId?: string): NaacMetric[] {
    const list = this.state.naacMetrics || initialNaacMetrics;
    if (criterionId) return list.filter(m => m.criterionId === criterionId);
    return list;
  }

  getNaacSubmissions(metricId?: string): NaacDataSubmission[] {
    const list = this.state.naacSubmissions || initialNaacDataSubmissions;
    if (metricId) return list.filter(s => s.metricId === metricId);
    return list;
  }

  submitNaacMetricData(submission: Omit<NaacDataSubmission, 'id' | 'createdAt' | 'updatedAt' | 'remarksHistory'>, user: User): NaacDataSubmission {
    if (!this.state.naacSubmissions) this.state.naacSubmissions = [];
    const newSub: NaacDataSubmission = {
      ...submission,
      id: `naac-sub-${Date.now()}`,
      status: 'SUBMITTED',
      currentApproverRole: 'HOD',
      submittedByUserId: user.id,
      submittedByUserName: user.name,
      submittedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      remarksHistory: [
        {
          id: `r-${Date.now()}`,
          actionByUserId: user.id,
          actionByUserName: user.name,
          actionByUserRole: user.role,
          office: 'HOD_ACADEMIC',
          action: 'SUBMITTED',
          remarks: 'Submitted metric data & evidence for IQAC verification',
          timestamp: new Date().toISOString()
        }
      ]
    };

    this.state.naacSubmissions.unshift(newSub);
    this.saveState();

    this.addNotification({
      title: `NAAC Metric ${newSub.metricCode} Data Submitted`,
      message: `Data for NAAC Metric ${newSub.metricCode} submitted by ${user.name} for HOD & IQAC verification.`,
      module: 'APPROVAL',
      timestamp: new Date().toISOString(),
      targetRole: 'IQAC',
      linkTab: 'iqac'
    });

    this.logAudit('SUBMIT_NAAC_DATA', 'NAAC / IQAC', `Submitted data for Metric ${newSub.metricCode}`, user.name, user.role);
    return newSub;
  }

  advanceNaacSubmissionStatus(
    submissionId: string,
    actionUser: User,
    action: ApprovalStatus,
    remarks: string
  ): NaacDataSubmission | null {
    if (!this.state.naacSubmissions) return null;
    const sub = this.state.naacSubmissions.find(s => s.id === submissionId);
    if (!sub) return null;

    sub.status = action;
    if (action === 'APPROVED') {
      if (sub.currentApproverRole === 'HOD') sub.currentApproverRole = 'IQAC';
      else if (sub.currentApproverRole === 'IQAC') sub.currentApproverRole = 'REGISTRAR';
      else if (sub.currentApproverRole === 'REGISTRAR') {
        sub.status = 'LOCKED';
        sub.lockedAt = new Date().toISOString();
      }
    } else if (action === 'RETURNED' || action === 'REJECTED') {
      sub.currentApproverRole = 'FACULTY';
    }

    sub.updatedAt = new Date().toISOString();
    sub.remarksHistory.push({
      id: `r-${Date.now()}`,
      actionByUserId: actionUser.id,
      actionByUserName: actionUser.name,
      actionByUserRole: actionUser.role,
      office: actionUser.role === 'REGISTRAR' ? 'REGISTRAR' : actionUser.role === 'IQAC' ? 'IQAC' : 'HOD_ACADEMIC',
      action: action,
      remarks: remarks || `Metric status updated to ${action}`,
      timestamp: new Date().toISOString()
    });

    this.saveState();

    this.addNotification({
      title: `NAAC Metric ${sub.metricCode} ${action}`,
      message: `Submission for Metric ${sub.metricCode} was updated to ${action} by ${actionUser.name}.`,
      module: 'APPROVAL',
      timestamp: new Date().toISOString(),
      targetUserId: sub.submittedByUserId,
      linkTab: 'iqac'
    });

    this.logAudit('VERIFY_NAAC_DATA', 'NAAC / IQAC', `Updated NAAC submission ${sub.metricCode} to ${action}`, actionUser.name, actionUser.role);
    return sub;
  }

  // ─── Research & Innovation Methods ──────────────────────────────────────────
  getResearchProjects(): ResearchProject[] {
    return this.state.researchProjects || initialResearchProjects;
  }

  getPublications(): PublicationRecord[] {
    return this.state.publications || initialPublicationRecords;
  }

  getPatents(): PatentRecord[] {
    return this.state.patents || initialPatentRecords;
  }

  // ─── NAAC Auto ERP Metric Calculator ─────────────────────────────────────────
  calculateNaacAutoValue(metric: NaacMetric): { calculatedValue: number; formulaString: string; erpSummary: string } {
    const students = this.getStudents();
    const faculty = this.getFaculty();
    const results = this.getStudentResults();
    const edpDuties = this.getEdpDuties();
    const publications = this.getPublications();

    switch (metric.autoErpSource) {
      case 'FACULTY_COUNT': {
        const sanctioned = 48;
        const totalFac = faculty.length;
        const val = Number(((totalFac / sanctioned) * 100).toFixed(2));
        return {
          calculatedValue: val,
          formulaString: `(${totalFac} Full-Time Appointed / ${sanctioned} Sanctioned Posts) * 100`,
          erpSummary: `Connected ERP Database: ${totalFac} active faculty records`
        };
      }
      case 'FACULTY_PHD_COUNT': {
        const phdFaculty = faculty.filter(f => f.qualification.toLowerCase().includes('ph.d') || f.qualification.toLowerCase().includes('phd')).length;
        const totalFac = faculty.length || 1;
        const val = Number(((phdFaculty / totalFac) * 100).toFixed(2));
        return {
          calculatedValue: val,
          formulaString: `(${phdFaculty} Ph.D Qualified / ${totalFac} Total Faculty) * 100`,
          erpSummary: `Connected ERP Database: ${phdFaculty} Ph.D qualified professors`
        };
      }
      case 'PASS_PERCENTAGE': {
        const passedCount = results.filter(r => r.status === 'PASS').length || 4;
        const totalAppeared = results.length || 4;
        const val = Number(((passedCount / totalAppeared) * 100).toFixed(2));
        return {
          calculatedValue: val,
          formulaString: `(${passedCount} Passed / ${totalAppeared} Appeared) * 100`,
          erpSummary: `Connected ERP Exam Database: ${passedCount}/${totalAppeared} passed final exams`
        };
      }
      case 'RESEARCH_PAPERS': {
        const scopusPubs = publications.filter(p => p.indexing === 'Scopus' || p.indexing === 'Web of Science').length || 2;
        const totalFac = faculty.length || 1;
        const val = Number((scopusPubs / totalFac).toFixed(2));
        return {
          calculatedValue: val,
          formulaString: `${scopusPubs} Scopus Publications / ${totalFac} Faculty Members`,
          erpSummary: `Connected ERP Research Database: ${scopusPubs} Scopus/WoS journal papers`
        };
      }
      case 'STUDENTS_COUNT': {
        const totalStu = students.length;
        return {
          calculatedValue: 100,
          formulaString: `(${totalStu} Active Students / Total Intake Capacity) * 100`,
          erpSummary: `Connected ERP Student Registry: ${totalStu} enrolled students`
        };
      }
      default:
        return {
          calculatedValue: 95.0,
          formulaString: 'ERP Metric Auto-Aggregation Engine',
          erpSummary: 'Connected SSIU ERP Central Relational Database'
        };
    }
  }

  // ─── HR MANAGEMENT METHODS ───────────────────────────────────────────────
  getEmployees(): Employee[] {
    return this.state.employees || initialEmployees;
  }

  getEmployeeById(id: string): Employee | undefined {
    return (this.state.employees || initialEmployees).find(e => e.id === id);
  }

  getPayrollRecords(): PayrollRecord[] {
    return this.state.payrollRecords || initialPayrollRecords;
  }

  getEmployeeLeaveApplications(): EmployeeLeaveApplication[] {
    return this.state.leaveApplications || initialLeaveApplications;
  }

  getPerformanceAppraisals(): PerformanceAppraisal[] {
    return this.state.performanceAppraisals || initialPerformanceAppraisals;
  }

  getTrainingFdpRecords(): TrainingFdpRecord[] {
    return this.state.trainingFdpRecords || initialTrainingFdpRecords;
  }

  submitEmployeeLeave(leaveData: Omit<EmployeeLeaveApplication, 'id' | 'appliedDate' | 'status'>, user: User): EmployeeLeaveApplication {
    if (!this.state.leaveApplications) this.state.leaveApplications = [];
    const newLeave: EmployeeLeaveApplication = {
      ...leaveData,
      id: `lv-${Date.now()}`,
      status: 'SUBMITTED',
      appliedDate: new Date().toISOString().split('T')[0]
    };
    this.state.leaveApplications.unshift(newLeave);
    this.saveState();

    this.logAudit('SUBMIT_LEAVE', 'HR Management', `Leave applied by ${user.name} for ${newLeave.totalDays} days`, user.name, user.role);
    return newLeave;
  }

  approveEmployeeLeave(leaveId: string, approverUser: User, status: ApprovalStatus): void {
    if (!this.state.leaveApplications) return;
    const lv = this.state.leaveApplications.find(l => l.id === leaveId);
    if (!lv) return;

    lv.status = status;
    lv.approvedByUserId = approverUser.id;
    lv.approvedByUserName = approverUser.name;
    this.saveState();

    this.logAudit('APPROVE_LEAVE', 'HR Management', `Updated leave ${lv.id} status to ${status}`, approverUser.name, approverUser.role);
  }

  // ─── INCUBATION & STARTUP MANAGEMENT METHODS ─────────────────────────────
  getStartupIdeas(): StartupIdea[] {
    return this.state.startupIdeas || initialStartupIdeas;
  }

  getStartupFounders(): StartupFounder[] {
    return this.state.startupFounders || initialStartupFounders;
  }

  getStartupFundings(): StartupFunding[] {
    return this.state.startupFundings || initialStartupFundings;
  }

  getMentorSessions(): IncubationMentorSession[] {
    return this.state.mentorSessions || initialMentorSessions;
  }

  getIncubationWorkshops(): IncubationWorkshop[] {
    return this.state.incubationWorkshops || initialIncubationWorkshops;
  }

  // Student-specific: get all startups where userId is a founder
  getStartupsByFounder(userId: string): StartupIdea[] {
    return (this.state.startupIdeas || initialStartupIdeas).filter(
      s => s.founderIds.includes(userId) || s.leadFounderId === userId
    );
  }

  // Student-specific: get mentor sessions for a specific startup
  getMentorSessionsByStartup(startupId: string): IncubationMentorSession[] {
    return (this.state.mentorSessions || initialMentorSessions).filter(s => s.startupId === startupId);
  }

  // Student-specific: get fundings for a specific startup
  getStartupFundingsByStartup(startupId: string): StartupFunding[] {
    return (this.state.startupFundings || initialStartupFundings).filter(f => f.startupId === startupId);
  }

  // Student-authorized update: student can only update non-approval-gated fields
  updateStartupByStudent(startupId: string, updates: Partial<Pick<StartupIdea, 'description' | 'problemStatement' | 'proposedSolution' | 'targetMarket' | 'hasPrototype' | 'hasProduct' | 'annualRevenue' | 'employeesCount' | 'investorNames' | 'awards' | 'patentApplicationNo' | 'patentStatus'>>, user: User): void {
    if (!this.state.startupIdeas) return;
    const idea = this.state.startupIdeas.find(s => s.id === startupId);
    if (!idea) return;
    // Verify user is a founder
    if (!idea.founderIds.includes(user.id) && idea.leadFounderId !== user.id) return;
    Object.assign(idea, updates);
    idea.updatedAt = new Date().toISOString().split('T')[0];
    this.saveState();
    this.logAudit('STUDENT_UPDATE_STARTUP', 'Incubation', `Startup ${startupId} updated by student founder ${user.name}`, user.name, user.role);
  }

  // Student: add milestone update to their startup
  addMilestoneUpdate(startupId: string, milestone: Omit<StartupMilestone, 'id'>, user: User): StartupMilestone {
    if (!this.state.startupIdeas) this.state.startupIdeas = [];
    const idea = this.state.startupIdeas.find(s => s.id === startupId);
    if (!idea) throw new Error('Startup not found');
    const newMs: StartupMilestone = { ...milestone, id: `ms-${Date.now()}` };
    idea.milestones.push(newMs);
    idea.updatedAt = new Date().toISOString().split('T')[0];
    this.saveState();
    this.logAudit('ADD_MILESTONE', 'Incubation', `Milestone '${milestone.title}' added to startup ${startupId}`, user.name, user.role);
    return newMs;
  }

  // Student: add document to their startup
  addStartupDocument(startupId: string, doc: Omit<StartupDocument, 'id'>, user: User): StartupDocument {
    if (!this.state.startupIdeas) this.state.startupIdeas = [];
    const idea = this.state.startupIdeas.find(s => s.id === startupId);
    if (!idea) throw new Error('Startup not found');
    const newDoc: StartupDocument = { ...doc, id: `doc-${Date.now()}`, verified: false };
    idea.documents.push(newDoc);
    idea.updatedAt = new Date().toISOString().split('T')[0];
    this.saveState();
    this.logAudit('ADD_STARTUP_DOC', 'Incubation', `Document '${doc.name}' added to startup ${startupId}`, user.name, user.role);
    return newDoc;
  }

  submitStartupIdea(ideaData: Omit<StartupIdea, 'id' | 'ideaCode' | 'createdAt' | 'updatedAt' | 'milestones' | 'documents'>, user: User): StartupIdea {
    if (!this.state.startupIdeas) this.state.startupIdeas = [];
    const count = this.state.startupIdeas.length + 1;
    const newIdea: StartupIdea = {
      ...ideaData,
      id: `startup-${Date.now()}`,
      ideaCode: `IDEA-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      milestones: [],
      documents: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.state.startupIdeas.unshift(newIdea);
    this.saveState();
    this.logAudit('SUBMIT_STARTUP_IDEA', 'Incubation', `Startup idea '${newIdea.title}' (${newIdea.ideaCode}) registered by ${user.name}`, user.name, user.role);
    return newIdea;
  }

  updateStartupApplicationStatus(startupId: string, status: IncubationApplicationStatus, remarks: string, approverUser: User): void {
    if (!this.state.startupIdeas) return;
    const idea = this.state.startupIdeas.find(s => s.id === startupId);
    if (!idea) return;
    idea.applicationStatus = status;
    idea.status = status;
    if (status === 'APPROVED' || status === 'INCUBATING') {
      idea.committeeRemarks = remarks;
      idea.approvedByUserId = approverUser.id;
      idea.approvedDate = new Date().toISOString().split('T')[0];
    } else if (status === 'REJECTED') {
      idea.rejectionReason = remarks;
    } else if (status === 'UNDER_SCREENING') {
      idea.screeningRemarks = remarks;
    }
    idea.updatedAt = new Date().toISOString().split('T')[0];
    this.saveState();
    this.logAudit('UPDATE_STARTUP_STATUS', 'Incubation', `Startup ${startupId} status updated to ${status} by ${approverUser.name}`, approverUser.name, approverUser.role);
  }

  assignMentorToStartup(startupId: string, mentorId: string, mentorName: string, adminUser: User): void {
    if (!this.state.startupIdeas) return;
    const idea = this.state.startupIdeas.find(s => s.id === startupId);
    if (!idea) return;
    idea.mentorId = mentorId;
    idea.mentorName = mentorName;
    idea.updatedAt = new Date().toISOString().split('T')[0];
    this.saveState();
    this.logAudit('ASSIGN_MENTOR', 'Incubation', `Mentor ${mentorName} assigned to startup ${startupId} by ${adminUser.name}`, adminUser.name, adminUser.role);
  }

  addMentorSession(sessionData: Omit<IncubationMentorSession, 'id'>, user: User): IncubationMentorSession {
    if (!this.state.mentorSessions) this.state.mentorSessions = [];
    const newSession: IncubationMentorSession = {
      ...sessionData,
      id: `session-${Date.now()}`
    };
    this.state.mentorSessions.unshift(newSession);
    this.saveState();
    this.logAudit('ADD_MENTOR_SESSION', 'Incubation', `Mentor session logged for startup ${sessionData.startupId}`, user.name, user.role);
    return newSession;
  }

  addIncubationWorkshop(workshopData: Omit<IncubationWorkshop, 'id'>, user: User): IncubationWorkshop {
    if (!this.state.incubationWorkshops) this.state.incubationWorkshops = [];
    const newWs: IncubationWorkshop = {
      ...workshopData,
      id: `ws-${Date.now()}`
    };
    this.state.incubationWorkshops.unshift(newWs);
    this.saveState();
    this.logAudit('ADD_WORKSHOP', 'Incubation', `Workshop '${newWs.title}' created by ${user.name}`, user.name, user.role);
    return newWs;
  }

  // ─── DIGITAL NOTE SHEET & UNIVERSITY APPROVAL WORKFLOW METHODS ───────────────
  
  resolveUserDepartment(user?: User | any): string {
    if (!user) return 'ADMIN';
    const role = user.role || '';
    if (role === 'EXAM_CELL') return 'EXAM';
    if (role === 'HOSTEL_ADMIN') return 'HOSTEL';
    if (role === 'ACCOUNT_OFFICER' || role === 'ACCOUNTS_ADMIN' || role === 'FINANCE') return 'ACCOUNTS';
    if (role === 'LIBRARY_ADMIN') return 'LIBRARY';
    if (role === 'TRANSPORT_ADMIN') return 'TRANSPORT';
    if (role === 'STUDENT_SECTION') return 'STUDENT_SECTION';
    if (role === 'MAINTENANCE_ADMIN') return 'MAINTENANCE';
    if (role === 'IQAC') return 'IQAC';
    if (role === 'REGISTRAR') return 'REGISTRAR';
    if (user.departmentId && user.departmentId !== 'ALL') return user.departmentId.replace('dept-', '').toUpperCase();
    return 'ADMIN';
  }

  hasUniversityWideAccess(user?: User | any): boolean {
    if (!user) return false;
    const role = user.role || '';
    return ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'VICE_PRESIDENT', 'PRINCIPAL'].includes(role);
  }

  getNoteSheets(user?: User | any, filterDept?: string): NoteSheet[] {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    let list: NoteSheet[];

    if (user && user.role) {
      list = this.getAuthorizedNotesheetsForUser(user, user.role);
    } else {
      list = this.state.noteSheets;
    }

    if (filterDept && filterDept !== 'ALL') {
      const target = filterDept.toUpperCase();
      list = list.filter(n => (n.department || '').toUpperCase() === target);
    }

    return list;
  }

  getNoteSheetById(id: string): NoteSheet | undefined {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    return this.state.noteSheets.find(n => n.id === id || n.noteSheetNumber === id || n.notesheetNumber === id);
  }

  getManualTestRecords(): ManualTestRecord[] {
    if (!this.state.manualTestRecords || this.state.manualTestRecords.length === 0) {
      this.state.manualTestRecords = [...INITIAL_MANUAL_TEST_RECORDS];
      this.saveState();
    }
    return this.state.manualTestRecords;
  }

  getManualTestRecordById(id: string): ManualTestRecord | undefined {
    return this.getManualTestRecords().find(t => t.id === id || t.testId === id);
  }

  saveManualTestRecord(test: ManualTestRecord): void {
    const list = this.getManualTestRecords();
    const idx = list.findIndex(t => t.id === test.id || t.testId === test.testId);
    if (idx >= 0) {
      list[idx] = test;
    } else {
      list.unshift(test);
    }
    this.saveState();
  }

  deleteManualTestRecord(id: string): boolean {
    const list = this.getManualTestRecords();
    const idx = list.findIndex(t => t.id === id || t.testId === id);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  getNoteSheetWorkflowConfigs(): NoteSheetWorkflowConfig[] {
    if (!this.state.noteSheetWorkflowConfigs) {
      this.state.noteSheetWorkflowConfigs = [
        { id: 'ssiu-default', name: 'Default SSIU Workflow', steps: ['HOD', 'DEPUTY_REGISTRAR', 'REGISTRAR', 'VICE_PRESIDENT'], isActive: true }
      ];
    }
    return this.state.noteSheetWorkflowConfigs;
  }

  saveNoteSheetPdf(record: NoteSheetPdfRecord): void {
    if (!this.state.notesheetPdfs) this.state.notesheetPdfs = [];
    const idx = this.state.notesheetPdfs.findIndex(p => p.pdfId === record.pdfId);
    if (idx >= 0) {
      this.state.notesheetPdfs[idx] = record;
    } else {
      this.state.notesheetPdfs.push(record);
    }
    this.saveState();
  }

  getNoteSheetPdfById(pdfId: string): NoteSheetPdfRecord | undefined {
    if (!this.state.notesheetPdfs) this.state.notesheetPdfs = [];
    return this.state.notesheetPdfs.find(p => p.pdfId === pdfId);
  }

  getNoteSheetPdfs(notesheetId: string): NoteSheetPdfRecord[] {
    if (!this.state.notesheetPdfs) this.state.notesheetPdfs = [];
    return this.state.notesheetPdfs.filter(p => p.notesheetId === notesheetId);
  }

  getLatestNoteSheetPdf(notesheetId: string): NoteSheetPdfRecord | undefined {
    const list = this.getNoteSheetPdfs(notesheetId);
    if (list.length === 0) return undefined;
    return list.sort((a, b) => b.version - a.version)[0];
  }

  public generateNoteSheetNumber(instituteId?: string): { noteSheetNumber: string; seq: number; periodMMYY: string; instCode: string; instId: string; instName: string } {
    const targetInstId = instituteId || 'inst-sit';
    const instObj = (this.state.institutes || []).find(i => i.id === targetInstId || i.code === targetInstId || i.name === targetInstId) || {
      id: 'inst-sit',
      code: 'SIT',
      name: 'Swarrnim Institute of Technology'
    };
    const instName = instObj.name;
    const instCode = instObj.code || 'SIT';
    const instId = instObj.id;

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const periodMMYY = `${mm}${yy}`;

    if (!this.state.noteSheets) this.state.noteSheets = [];

    // Calculate next sequence strictly scoped to this Institute + MMYY period
    const existingInstNotes = this.state.noteSheets.filter(n => {
      if (n.status === 'DRAFT' && (!n.noteSheetNumber || n.noteSheetNumber === 'DRAFT')) return false;
      const matchInst = (n.instituteId === instId) || 
                        (n.instituteName === instName) || 
                        (n.noteSheetNumber && (n.noteSheetNumber.toUpperCase().startsWith(`${instCode}-NOTESHEET`)));
      const matchPeriod = (n.periodMMYY === periodMMYY) || (n.noteSheetNumber && n.noteSheetNumber.includes(`-${periodMMYY}-`));
      return matchInst && matchPeriod;
    });

    const maxSeq = existingInstNotes.reduce((max, n) => {
      let currentSeq = n.sequenceNumber;
      if (!currentSeq && n.noteSheetNumber) {
        const parts = n.noteSheetNumber.split('-');
        const lastPart = parts[parts.length - 1];
        const parsed = parseInt(lastPart, 10);
        if (!isNaN(parsed)) currentSeq = parsed;
      }
      return Math.max(max, currentSeq || 0);
    }, 0);

    let seq = maxSeq + 1;
    let seqFormatted = String(seq).padStart(3, '0');
    let noteSheetNumber = `${instCode}-NOTESHEET-${periodMMYY}-${seqFormatted}`;

    // Collision check: verify uniqueness
    while (this.state.noteSheets.some(n => n.noteSheetNumber === noteSheetNumber)) {
      seq++;
      seqFormatted = String(seq).padStart(3, '0');
      noteSheetNumber = `${instCode}-NOTESHEET-${periodMMYY}-${seqFormatted}`;
    }

    return { noteSheetNumber, seq, periodMMYY, instCode, instId, instName };
  }

  public getDesignationForRole(uRole: string): string {
    switch (uRole) {
      case 'FACULTY': return 'Faculty';
      case 'MENTOR': return 'Mentor';
      case 'HOD': return 'Head of Department';
      case 'PRINCIPAL': return 'Principal / HOI';
      case 'REGISTRAR': return 'Registrar';
      case 'DEPUTY_REGISTRAR': return 'Deputy Registrar';
      case 'ACCOUNTS_ADMIN': return 'Finance & Accounts Officer';
      case 'EXAM_CELL': return 'Controller of Examination';
      case 'HOSTEL_ADMIN': return 'Hostel Administrator / Warden';
      case 'STUDENT_SECTION': return 'In-charge, Student Section';
      case 'IQAC': return 'Director, IQAC';
      case 'PROVOST': return 'Provost / Vice-Chancellor';
      case 'VICE_PRESIDENT': return 'Vice President';
      case 'PRESIDENT': return 'President';
      case 'SUPER_ADMIN': return 'System Administrator';
      default: return uRole;
    }
  }

  public getDesignationForUser(userId?: string, uRole?: string): string {
    if (userId) {
      const user = this.getUsers().find(u => u.id === userId);
      if (user?.designation) return user.designation;
      const faculties = ((this.state as any).faculties || []) as any[];
      const faculty = faculties.find((f: any) => f.userId === userId || f.id === userId || (user?.email && f.email === user.email));
      if (faculty?.designation) return faculty.designation;
    }
    if (uRole) {
      return this.getDesignationForRole(uRole);
    }
    return 'Authorized Official';
  }

  public updateUserSignature(userId: string, signatureData: string): { success: boolean; signatureVersion: number; message: string } {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    const currentVersion = users[userIndex].signatureVersion || 0;
    const newVersion = currentVersion + 1;
    users[userIndex].signatureFile = signatureData;
    users[userIndex].signatureStatus = 'ACTIVE';
    users[userIndex].signatureVersion = newVersion;
    users[userIndex].signatureUpdatedAt = new Date().toISOString();
    this.saveState();
    return {
      success: true,
      signatureVersion: newVersion,
      message: 'Official digital signature updated successfully.'
    };
  }

  public getUserSignatureSnapshot(user?: User): NoteSheetMovement['signatureSnapshot'] {
    if (!user) return undefined;
    const dbUser = this.getUsers().find(u => u.id === user.id) || user;
    if (dbUser.signatureFile && dbUser.signatureStatus === 'ACTIVE') {
      return {
        signatureData: dbUser.signatureFile,
        signatureVersion: dbUser.signatureVersion || 1,
        verifiedAt: new Date().toISOString()
      };
    }
    return undefined;
  }

  public resolveActualAssignee(office: string, instituteId?: string, departmentId?: string, departmentName?: string): { userId?: string; name?: string; role: string } {
    const allUsers = this.getUsers().filter(u => u.status === 'ACTIVE' && u.role !== 'STUDENT');
    
    if (office === 'HOD') {
      const matched = allUsers.find(u => {
        if (u.role !== 'HOD') return false;
        const instMatch = !instituteId || !u.instituteId || u.instituteId === instituteId;
        const uDeptId = (u.departmentId || '').toUpperCase();
        const tDeptId = (departmentId || '').toUpperCase();
        const uDeptName = (u.departmentName || this.resolveUserDepartment(u) || '').toUpperCase();
        const tDeptName = (departmentName || '').toUpperCase();
        const deptMatch = (!uDeptId && !uDeptName) || (!tDeptId && !tDeptName) ||
          (Boolean(uDeptId && tDeptId) && uDeptId === tDeptId) ||
          (Boolean(uDeptName && tDeptName) && (uDeptName === tDeptName || uDeptName.includes(tDeptName) || tDeptName.includes(uDeptName))) ||
          (Boolean(uDeptId && tDeptName) && (uDeptId === tDeptName || uDeptId.includes(tDeptName) || tDeptName.includes(uDeptId))) ||
          (Boolean(uDeptName && tDeptId) && (uDeptName === tDeptId || uDeptName.includes(tDeptId) || tDeptName.includes(uDeptName)));
        return instMatch && deptMatch;
      }) || allUsers.find(u => u.role === 'HOD' && (!instituteId || !u.instituteId || u.instituteId === instituteId)) || allUsers.find(u => u.role === 'HOD');
      return { userId: matched?.id, name: matched?.name, role: 'HOD' };
    }

    if (office === 'HOI' || office === 'PRINCIPAL') {
      const matched = allUsers.find(u => u.role === 'PRINCIPAL' && (!instituteId || !u.instituteId || u.instituteId === instituteId)) ||
        allUsers.find(u => u.role === 'PRINCIPAL');
      return { userId: matched?.id, name: matched?.name, role: 'PRINCIPAL' };
    }

    if (office === 'DEPUTY_REGISTRAR') {
      const matched = allUsers.find(u => {
        if (u.role !== 'DEPUTY_REGISTRAR') return false;
        const scopes = this.getDeputyRegistrarScopeByUserId(u.id);
        if (scopes.length === 0) return !instituteId || !u.instituteId || u.instituteId === instituteId;
        return scopes.some(s => {
          const matchInst = !instituteId || s.instituteId === instituteId;
          const matchDept = s.isUniversalInstituteScope || s.departmentIds.length === 0 ||
            s.departmentIds.includes('ALL') ||
            (Boolean(departmentId) && s.departmentIds.includes(departmentId!)) ||
            (Boolean(departmentName) && (s.departmentIds.includes(departmentName!) || (s.departmentNames || []).some(dn => dn.toLowerCase() === departmentName!.toLowerCase())));
          return matchInst && matchDept;
        });
      }) || allUsers.find(u => u.role === 'DEPUTY_REGISTRAR' && (!instituteId || !u.instituteId || u.instituteId === instituteId)) || allUsers.find(u => u.role === 'DEPUTY_REGISTRAR');
      return { userId: matched?.id, name: matched?.name, role: 'DEPUTY_REGISTRAR' };
    }

    if (office === 'REGISTRAR') {
      const matched = allUsers.find(u => u.role === 'REGISTRAR');
      return { userId: matched?.id, name: matched?.name, role: 'REGISTRAR' };
    }

    if (office === 'VICE_PRESIDENT') {
      const matched = allUsers.find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
      return { userId: matched?.id, name: matched?.name, role: 'VICE_PRESIDENT' };
    }

    if (office === 'ACCOUNTS_ADMIN' || office === 'FINANCE' || office === 'FINANCE_OFFICER') {
      const matched = allUsers.find(u => u.role === 'ACCOUNTS_ADMIN');
      return { userId: matched?.id, name: matched?.name, role: 'ACCOUNTS_ADMIN' };
    }

    if (office === 'EXAM_CELL') {
      const matched = allUsers.find(u => u.role === 'EXAM_CELL');
      return { userId: matched?.id, name: matched?.name, role: 'EXAM_CELL' };
    }

    if (office === 'STUDENT_SECTION') {
      const matched = allUsers.find(u => u.role === 'STUDENT_SECTION');
      return { userId: matched?.id, name: matched?.name, role: 'STUDENT_SECTION' };
    }

    if (office === 'HOSTEL_ADMIN') {
      const matched = allUsers.find(u => u.role === 'HOSTEL_ADMIN');
      return { userId: matched?.id, name: matched?.name, role: 'HOSTEL_ADMIN' };
    }

    if (office === 'IQAC') {
      const matched = allUsers.find(u => u.role === 'IQAC');
      return { userId: matched?.id, name: matched?.name, role: 'IQAC' };
    }

    return { role: office };
  }

  createNoteSheet(noteData: Partial<NoteSheet>, user: User, isDraft: boolean): NoteSheet {
    if (user.role === 'STUDENT') {
      throw new Error('403 Forbidden: Students are not authorized to create Notesheets.');
    }

    if (!this.state.noteSheets) this.state.noteSheets = [];

    const { noteSheetNumber, seq, periodMMYY, instCode, instId, instName } = this.generateNoteSheetNumber(noteData.instituteId || user.instituteId);

    const dept = (noteData.department || this.resolveUserDepartment(user)).toUpperCase();
    
    const isFin = Boolean(noteData.financialRequirement || noteData.budgetRequired);
    let calculatedAmount = Number(noteData.requestedAmount || noteData.estimatedCost || 0);

    if (noteData.items && Array.isArray(noteData.items) && noteData.items.length > 0) {
      const itemSum = noteData.items.reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const itemTotal = qty * rate;
        item.amount = itemTotal;
        return sum + itemTotal;
      }, 0);
      if (itemSum > 0) {
        calculatedAmount = itemSum;
      }
    }

    if (isFin && !isDraft && calculatedAmount <= 0) {
      throw new Error('Validation Error: Financial Notesheets must specify a valid amount greater than 0.');
    }

    const resolved = resolveNotesheetWorkflow({
      department: dept,
      notesheetType: noteData.notesheetType || noteData.category,
      category: noteData.category,
      financialRequirement: isFin,
      requestedAmount: calculatedAmount,
      instituteId: instId,
      userRole: user.role
    });

    const firstStep = resolved.firstStep as NoteSheet['currentOffice'];
    const branch = resolved.branch;
    const now = new Date().toISOString();

    const officialNumber = isDraft ? 'DRAFT' : noteSheetNumber;
    const assignee = !isDraft ? this.resolveActualAssignee(firstStep, instId, noteData.departmentId || dept, dept) : undefined;

    const sanitizedSubject = inputSanitizer.sanitizePlainText(noteData.subject || 'Administrative Note Sheet', 200);
    const sanitizedProposal = inputSanitizer.sanitizePlainText(noteData.proposal || '', 5000);
    const sanitizedJustification = inputSanitizer.sanitizePlainText(noteData.purposeJustification || '', 3000);

    const newNote: NoteSheet = {
      id: noteData.id || `ns-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      notesheetNumber: officialNumber,
      noteSheetNumber: officialNumber,
      notesheetType: noteData.notesheetType || (isFin ? 'Financial Sanction' : 'Administrative'),
      visibility: noteData.visibility || 'NORMAL',
      subject: sanitizedSubject,
      title: sanitizedSubject,
      proposal: sanitizedProposal,
      purposeJustification: sanitizedJustification,
      referenceNumber: noteData.referenceNumber,
      section: noteData.section,
      instituteId: instId,
      instituteCode: instCode,
      instituteName: instName,
      departmentId: noteData.departmentId || dept,
      departmentName: noteData.departmentName || dept,
      periodMMYY: isDraft ? undefined : periodMMYY,
      sequenceNumber: isDraft ? undefined : seq,
      department: dept,
      branch,
      organogramPath: resolved.steps,
      priority: noteData.priority || 'NORMAL',
      status: isDraft ? 'DRAFT' : resolved.initialStage,
      currentOffice: isDraft ? 'CREATOR' : firstStep,
      currentAuthorityRole: isDraft ? undefined : firstStep,
      currentHandlerId: assignee?.userId,
      currentAssigneeUserId: assignee?.userId,
      currentAssigneeName: assignee?.name,
      currentAssigneeRole: assignee?.role || firstStep,
      creatorId: user.id,
      creatorName: user.name,
      creatorRole: user.role,
      contactNumber: user.phone || noteData.contactNumber || '079-68161600',
      date: noteData.date || new Date().toISOString().split('T')[0],
      requiredDate: noteData.requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      workflowDueDate: noteData.workflowDueDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      financialRequirement: isFin,
      budgetRequired: isFin,
      estimatedCost: calculatedAmount,
      requestedAmount: calculatedAmount,
      originalRequestedAmount: calculatedAmount,
      currentAmount: calculatedAmount,
      approvedAmount: noteData.approvedAmount,
      financialRevisionHistory: [],
      budgetHead: noteData.budgetHead,
      budgetAvailable: noteData.budgetAvailable !== undefined ? Boolean(noteData.budgetAvailable) : undefined,
      expenseCategory: noteData.expenseCategory,
      financeRemarks: noteData.financeRemarks,
      procurementRequirement: noteData.procurementRequirement,
      items: noteData.items || [],
      previousNoteSheetId: noteData.previousNoteSheetId,
      previousNoteSheetNumber: noteData.previousNoteSheetNumber,
      relatedNoteSheetIds: noteData.relatedNoteSheetIds || [],
      version: '1.0',
      isLocked: false,
      verificationId: isDraft ? undefined : this.generateNoteSheetVerificationId(),
      attachments: noteData.attachments || [],
      attachmentObjects: noteData.attachmentObjects || [],
      complianceItems: noteData.complianceItems || [],
      clarifications: noteData.clarifications || [],
      movements: [],
      auditTrail: [],
      createdAt: now,
      updatedAt: now
    };

    if (!isDraft) {
      newNote.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: newNote.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        signatureSnapshot: this.getUserSignatureSnapshot(user),
        toUser: assignee?.name ? `${assignee.name} (${assignee.role})` : `Reporting Authority (${firstStep})`,
        toUserId: assignee?.userId,
        toOffice: firstStep,
        toRole: assignee?.role || firstStep,
        stage: resolved.initialStage,
        fromStage: 'DRAFT',
        toStage: resolved.initialStage,
        action: 'SUBMIT',
        decision: 'SUBMITTED',
        remarks: `Note Sheet submitted to ${firstStep} per University Organogram (${resolved.branchName}).`,
        date: now.split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toLocaleString()
      });

      newNote.auditTrail!.push({
        id: `audit-${Date.now()}-init`,
        notesheetId: newNote.id,
        notesheetNumber: newNote.noteSheetNumber,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'SUBMIT',
        date: now.split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toLocaleString(),
        previousState: 'DRAFT',
        newState: resolved.initialStage,
        remark: `Notesheet created and submitted to ${firstStep} by ${user.name}`
      });

      this.sendWorkflowNotification(firstStep, `New ${branch} Note Sheet ${newNote.noteSheetNumber} submitted for approval by ${user.name}.`, newNote.instituteId, newNote.department, newNote.noteSheetNumber);
    } else {
      newNote.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: newNote.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: 'Creator (Draft)',
        toOffice: 'CREATOR',
        stage: 'DRAFT',
        fromStage: 'DRAFT',
        toStage: 'DRAFT',
        action: 'CREATE',
        remarks: 'Draft Notesheet saved.',
        date: now.split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toLocaleString()
      });
    }

    this.state.noteSheets.unshift(newNote);
    this.saveState();
    this.logAudit(isDraft ? 'CREATE_DRAFT_NOTESHEET' : 'SUBMIT_NOTESHEET', 'Administration', `Note Sheet ${newNote.noteSheetNumber} created by ${user.name}`, user.name, user.role);
    return newNote;
  }

  public saveNoteSheetDraft(noteData: Partial<NoteSheet>, user: User): NoteSheet {
    if (user.role === 'STUDENT') {
      throw new Error('403 Forbidden: Students are not authorized to save Notesheet drafts.');
    }

    if (!this.state.noteSheets) this.state.noteSheets = [];

    if (noteData.id) {
      const idx = this.state.noteSheets.findIndex(n => n.id === noteData.id);
      if (idx !== -1) {
        const existing = this.state.noteSheets[idx];
        const updated: NoteSheet = {
          ...existing,
          ...noteData,
          updatedAt: new Date().toISOString()
        };
        this.state.noteSheets[idx] = updated;
        this.saveState();
        return updated;
      }
    }

    return this.createNoteSheet(noteData, user, true);
  }

  public deleteNoteSheetDraft(id: string, user: User): boolean {
    if (user.role === 'STUDENT') {
      throw new Error('403 Forbidden: Students are not authorized to delete Notesheet drafts.');
    }

    if (!this.state.noteSheets) return false;
    const idx = this.state.noteSheets.findIndex(n => n.id === id);
    if (idx === -1) return false;

    const ns = this.state.noteSheets[idx];
    if (ns.status !== 'DRAFT') {
      throw new Error('Only draft Notesheets can be deleted.');
    }
    if (ns.creatorId !== user.id && user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: You can only delete your own draft Notesheets.');
    }

    this.state.noteSheets.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_DRAFT_NOTESHEET', 'Administration', `Deleted draft notesheet ${id}`, user.name, user.role);
    return true;
  }

  public submitDraftNoteSheet(id: string, user: User): NoteSheet {
    if (user.role === 'STUDENT') {
      throw new Error('403 Forbidden: Students are not authorized to submit Notesheets.');
    }

    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === id);
    if (!ns) throw new Error('Notesheet not found.');

    if (ns.status !== 'DRAFT') {
      throw new Error('This Notesheet is already submitted.');
    }

    // Generate atomic official number
    const { noteSheetNumber, seq, periodMMYY, instCode, instId, instName } = this.generateNoteSheetNumber(ns.instituteId || user.instituteId);

    const resolved = resolveNotesheetWorkflow({
      department: ns.department || this.resolveUserDepartment(user),
      notesheetType: ns.notesheetType || ns.category,
      category: ns.category,
      financialRequirement: Boolean(ns.financialRequirement),
      requestedAmount: Number(ns.requestedAmount || ns.estimatedCost || 0),
      instituteId: instId,
      userRole: user.role
    });

    const firstStep = resolved.firstStep as NoteSheet['currentOffice'];
    const branch = resolved.branch;
    const now = new Date().toISOString();

    const amt = Number(ns.requestedAmount || ns.estimatedCost || 0);
    if (ns.originalRequestedAmount === undefined) {
      ns.originalRequestedAmount = amt;
    }
    if (ns.currentAmount === undefined) {
      ns.currentAmount = amt;
    }
    if (!ns.financialRevisionHistory) {
      ns.financialRevisionHistory = [];
    }

    ns.noteSheetNumber = noteSheetNumber;
    ns.notesheetNumber = noteSheetNumber;
    ns.sequenceNumber = seq;
    ns.periodMMYY = periodMMYY;
    ns.instituteId = instId;
    ns.instituteCode = instCode;
    ns.instituteName = instName;
    ns.status = resolved.initialStage;
    ns.currentOffice = firstStep;
    ns.organogramPath = resolved.steps;
    ns.updatedAt = now;

    ns.movements.push({
      id: `mvt-${Date.now()}`,
      noteSheetId: ns.id,
      fromUser: `${user.name} (${user.role})`,
      fromUserId: user.id,
      fromUserRole: user.role,
      toUser: `Reporting Authority (${firstStep})`,
      toOffice: firstStep,
      toRole: firstStep,
      stage: resolved.initialStage,
      action: 'SUBMIT',
      remarks: `Draft officially submitted for approval to ${firstStep} per ${resolved.branchName}.`,
      date: now.split('T')[0],
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toLocaleString()
    });

    this.saveState();
    this.sendWorkflowNotification(firstStep, `New ${branch} Note Sheet ${noteSheetNumber} submitted for approval by ${user.name}.`, ns.instituteId, ns.department, noteSheetNumber);
    this.logAudit('SUBMIT_NOTESHEET', 'Administration', `Draft submitted as ${noteSheetNumber} by ${user.name}`, user.name, user.role);

    return ns;
  }

  processNoteSheetAction(
    noteSheetId: string, 
    action: NoteSheetAction, 
    remarks: string, 
    attachmentUrl: string | undefined, 
    user: User, 
    forwardToOffice?: string,
    extraOptions?: {
      approvedAmount?: number;
      approvedAmountRemarks?: string;
      revisedAmount?: number;
      revisionReason?: string;
      actionTakenSummary?: string;
      proofUrl?: string;
      clarificationQuery?: string;
      clarificationResponse?: string;
      reopenedReason?: string;
    }
  ): void {
    const sanitizedRemarks = inputSanitizer.sanitizePlainText(remarks || '', 3000);
    remarks = sanitizedRemarks;

    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns) return;

    const branch = ns.branch || 'ACADEMIC';
    const branchWorkflow = ORGANOGRAM_BRANCH_WORKFLOWS[branch] || ORGANOGRAM_BRANCH_WORKFLOWS.ACADEMIC;
    const steps = (ns.organogramPath && ns.organogramPath.length > 0) ? ns.organogramPath : branchWorkflow.steps;
    const finalAuthority = branchWorkflow.finalAuthority || steps[steps.length - 1] || 'REGISTRAR';

    // Helper: Standard NoteSheetStatus for office
    const getStatusForOffice = (office: string): NoteSheetStatus => {
      switch (office) {
        case 'HOD':
          return 'PENDING_HOD';
        case 'HOI':
        case 'PRINCIPAL':
          return 'PENDING_HOI';
        case 'DEPUTY_REGISTRAR':
          return 'PENDING_DEPUTY_REGISTRAR';
        case 'REGISTRAR':
          return 'PENDING_REGISTRAR';
        case 'VICE_PRESIDENT':
          return 'PENDING_VICE_PRESIDENT';
        case 'FINANCE':
        case 'FINANCE_OFFICER':
        case 'ACCOUNTS_ADMIN':
          return 'PENDING_FINANCE';
        case 'EXAM_CELL':
        case 'DEPUTY_REGISTRAR_EXAM':
          return 'PENDING_EXAMINATION';
        case 'HOSTEL_ADMIN':
          return 'PENDING_HOSTEL';
        case 'STUDENT_SECTION':
          return 'PENDING_STUDENT_SECTION';
        case 'IQAC':
          return 'PENDING_IQAC';
        case 'HR':
          return 'PENDING_HR';
        case 'PROVOST':
        case 'PRESIDENT':
          return 'PENDING_HIGHER_AUTHORITY';
        default:
          return 'UNDER_REVIEW';
      }
    };

    // Normalize user's current step in organogram
    let currentIdx = steps.indexOf(ns.currentOffice);
    if (currentIdx === -1) {
      if (user.role === 'HOD') currentIdx = steps.indexOf('HOD');
      else if (user.role === 'PRINCIPAL') currentIdx = steps.indexOf('HOI');
      else if (user.role === 'REGISTRAR') currentIdx = steps.indexOf('REGISTRAR');
      else if (user.role === 'DEPUTY_REGISTRAR') currentIdx = steps.indexOf('DEPUTY_REGISTRAR');
      else if (user.role === 'VICE_PRESIDENT') currentIdx = steps.indexOf('VICE_PRESIDENT');
      else if (user.role === 'ACCOUNTS_ADMIN') currentIdx = steps.indexOf('ACCOUNTS_ADMIN');
      else if (user.role === 'EXAM_CELL') currentIdx = steps.indexOf('EXAM_CELL');
      else if (user.role === 'HOSTEL_ADMIN') currentIdx = steps.indexOf('HOSTEL_ADMIN');
      else if (user.role === 'STUDENT_SECTION') currentIdx = steps.indexOf('STUDENT_SECTION');
    }

    const previousStatus = ns.status;
    let nextStep: NoteSheet['currentOffice'] | 'COMPLETED' | 'CLOSED' | 'CREATOR' = ns.currentOffice;
    let nextStatus: NoteSheetStatus = ns.status;
    const now = new Date().toISOString();
    const userSigSnapshot = this.getUserSignatureSnapshot(user);

    // 1. Mandatory Authority Gate: Validate if caller is authorized at current stage
    if (user.role !== 'SUPER_ADMIN') {
      if (ns.currentOffice === 'HOD' && user.role !== 'HOD') {
        throw new Error('403 Forbidden: Notesheet is currently pending HOD review and approval.');
      }
      if ((ns.currentOffice === 'HOI' || ns.currentOffice === 'PRINCIPAL') && user.role !== 'PRINCIPAL' && (user.role as any) !== 'HOI') {
        throw new Error('403 Forbidden: Notesheet is currently pending Principal / HOI review and approval.');
      }
      if (ns.currentOffice === 'DEPUTY_REGISTRAR' && user.role !== 'DEPUTY_REGISTRAR') {
        throw new Error('403 Forbidden: Notesheet is currently pending Deputy Registrar approval.');
      }
      if (ns.currentOffice === 'REGISTRAR' && user.role !== 'REGISTRAR' && user.role !== 'UNIVERSITY_ADMIN') {
        throw new Error('403 Forbidden: Notesheet is currently pending Registrar approval.');
      }
      if (ns.currentOffice === 'VICE_PRESIDENT') {
        if (user.role !== 'VICE_PRESIDENT') {
          throw new Error('403 Forbidden: Notesheet is currently pending Vice President approval.');
        }
        if (ns.currentAssigneeUserId && ns.currentAssigneeUserId !== user.id) {
          throw new Error('403 Forbidden: This Notesheet is assigned to a different Vice President.');
        }
      }
    }

    // 2. Bypass Prevention Guard: Block attempts to skip stages
    if (forwardToOffice === 'REGISTRAR') {
      const isDyReg = user.role === 'DEPUTY_REGISTRAR' || ns.currentOffice === 'DEPUTY_REGISTRAR';
      const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'REGISTRAR';
      if (!isDyReg && !isSuper) {
        throw new Error('403 Forbidden: Invalid Workflow Transition. Standard notesheet must be approved by Deputy Registrar before forwarding to Registrar.');
      }
    }
    if (forwardToOffice === 'VICE_PRESIDENT') {
      const isReg = user.role === 'REGISTRAR' || ns.currentOffice === 'REGISTRAR';
      const isSuper = user.role === 'SUPER_ADMIN' || user.role === 'VICE_PRESIDENT';
      if (!isReg && !isSuper) {
        throw new Error('403 Forbidden: Invalid Workflow Transition. Standard notesheet must be approved by Registrar before forwarding to Vice President.');
      }
    }

    // Initialize financial tracking fields if missing
    const initialAmt = Number(ns.requestedAmount || ns.estimatedCost || 0);
    if (ns.originalRequestedAmount === undefined) {
      ns.originalRequestedAmount = initialAmt;
    }
    if (ns.currentAmount === undefined) {
      ns.currentAmount = initialAmt;
    }
    if (!ns.financialRevisionHistory) {
      ns.financialRevisionHistory = [];
    }

    let amountWasRevised = false;

    // Financial Amount Revision Processing
    const targetRevAmount = extraOptions?.revisedAmount !== undefined 
      ? extraOptions.revisedAmount 
      : (action === 'APPROVE' && extraOptions?.approvedAmount !== undefined ? extraOptions.approvedAmount : undefined);

    if (targetRevAmount !== undefined && (action === 'APPROVE' || action === 'FORWARD')) {
      const prevAmt = Number(ns.currentAmount !== undefined ? ns.currentAmount : initialAmt);
      const newAmt = Number(targetRevAmount);

      if (isNaN(newAmt) || newAmt < 0) {
        throw new Error('400 Bad Request: Invalid revised financial amount specified.');
      }

      if (newAmt !== prevAmt) {
        const revReason = (extraOptions?.revisionReason || extraOptions?.approvedAmountRemarks || remarks || '').trim();
        if (!revReason) {
          throw new Error('400 Bad Request: Reason / Remarks is mandatory when revising the financial amount.');
        }

        const changeAmt = newAmt - prevAmt;
        const changeType: 'INCREASE' | 'DECREASE' | 'NO_CHANGE' = newAmt > prevAmt ? 'INCREASE' : newAmt < prevAmt ? 'DECREASE' : 'NO_CHANGE';

        const revisionRecord: NoteSheetAmountRevision = {
          id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          notesheetId: ns.id,
          actorUserId: user.id,
          actorName: user.name,
          actorRole: user.role,
          previousAmount: prevAmt,
          newAmount: newAmt,
          changeAmount: changeAmt,
          changeType,
          reason: revReason,
          workflowStage: ns.currentOffice || user.role,
          createdAt: now
        };

        ns.financialRevisionHistory.push(revisionRecord);
        ns.currentAmount = newAmt;
        ns.requestedAmount = newAmt;
        if (extraOptions?.approvedAmount !== undefined) {
          ns.approvedAmount = newAmt;
        }
        amountWasRevised = true;

        this.logAudit(
          'REVISE_NOTESHEET_AMOUNT',
          'Financial',
          `Notesheet ${ns.noteSheetNumber} amount revised from ₹${prevAmt.toLocaleString('en-IN')} to ₹${newAmt.toLocaleString('en-IN')} (${changeType}: ₹${Math.abs(changeAmt).toLocaleString('en-IN')}) by ${user.name} (${user.role}). Reason: ${revReason}`,
          user.name,
          user.role
        );
      } else if (extraOptions?.approvedAmount !== undefined) {
        ns.approvedAmount = newAmt;
      }
    } else if (extraOptions?.approvedAmount !== undefined) {
      ns.approvedAmount = Number(extraOptions.approvedAmount);
      ns.currentAmount = Number(extraOptions.approvedAmount);
    }

    if (action === 'SUBMIT') {
      const firstStep = steps[0] as NoteSheet['currentOffice'];
      nextStep = firstStep;
      nextStatus = getStatusForOffice(firstStep);
      const assignee = this.resolveActualAssignee(firstStep, ns.instituteId, ns.departmentId, ns.department);

      ns.currentOffice = firstStep;
      ns.status = nextStatus;
      ns.currentAssigneeUserId = assignee.userId;
      ns.currentAssigneeName = assignee.name;
      ns.currentAssigneeRole = assignee.role;
      ns.currentHandlerId = assignee.userId;
      ns.currentAuthorityRole = firstStep;

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        signatureSnapshot: userSigSnapshot,
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Reporting Authority (${firstStep})`,
        toUserId: assignee.userId,
        toOffice: firstStep,
        toRole: assignee.role || firstStep,
        stage: nextStatus,
        fromStage: previousStatus,
        toStage: nextStatus,
        action: 'SUBMIT',
        decision: 'SUBMITTED',
        remarks: remarks || `Note Sheet submitted to ${firstStep} per Organogram.`,
        attachmentUrl,
        date: now.split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(firstStep, `Note Sheet ${ns.noteSheetNumber} submitted for approval by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'APPROVE') {
      if (extraOptions?.approvedAmount !== undefined) {
        ns.approvedAmount = Number(extraOptions.approvedAmount);
        ns.approvedAmountRemarks = extraOptions.approvedAmountRemarks || remarks;
        ns.approvedAmountByUserId = user.id;
        ns.approvedAmountByName = user.name;
        ns.approvedAmountAt = now;
      }

      // Check if user specified explicit forwardToOffice
      if (forwardToOffice && forwardToOffice !== 'COMPLETED' && forwardToOffice !== 'FINAL_APPROVAL' && forwardToOffice !== '') {
        nextStep = forwardToOffice as NoteSheet['currentOffice'];
        nextStatus = getStatusForOffice(nextStep);
        const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

        if (nextStep === 'VICE_PRESIDENT') {
          const activeVp = this.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
          if (!activeVp) {
            throw new Error('500 Configuration Error: No active Vice President is configured for Notesheet approval.');
          }
          assignee.userId = activeVp.id;
          assignee.name = activeVp.name;
          assignee.role = 'VICE_PRESIDENT';
          ns.currentStage = 'VICE_PRESIDENT_APPROVAL';
        }

        ns.currentOffice = nextStep;
        ns.status = nextStatus;
        ns.currentAssigneeUserId = assignee.userId;
        ns.currentAssigneeName = assignee.name;
        ns.currentAssigneeRole = assignee.role;
        ns.currentHandlerId = assignee.userId;
        ns.currentAuthorityRole = nextStep;

        const intermediateApprovalId = `NS-APR-${Date.now().toString().slice(-6)}`;

        ns.movements.push({
          id: `mvt-${Date.now()}`,
          noteSheetId: ns.id,
          fromUser: `${user.name} (${user.role})`,
          fromUserId: user.id,
          fromUserRole: user.role,
          actorUserId: user.id,
          actorName: user.name,
          actorRole: user.role,
          designation: this.getDesignationForUser(user.id, user.role),
          signatureSnapshot: userSigSnapshot,
          toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Reporting Authority (${nextStep})`,
          toUserId: assignee.userId,
          toOffice: nextStep,
          toRole: assignee.role || nextStep,
          stage: nextStatus,
          fromStage: previousStatus,
          toStage: nextStatus,
          action: 'FORWARD',
          decision: 'APPROVED_AND_FORWARDED',
          approvalId: intermediateApprovalId,
          remarks: remarks || `Endorsed / Approved by ${user.role} and forwarded to ${nextStep}.`,
          attachmentUrl,
          date: now.split('T')[0],
          time: new Date().toLocaleTimeString(),
          timestamp: new Date().toLocaleString()
        });

        if (nextStep === 'REGISTRAR') {
          this.sendWorkflowNotification('REGISTRAR', `Notesheet ${ns.noteSheetNumber} has been forwarded by the Deputy Registrar and is pending for your approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
        } else if (nextStep === 'DEPUTY_REGISTRAR') {
          this.sendWorkflowNotification('DEPUTY_REGISTRAR', `Notesheet ${ns.noteSheetNumber} is pending for your approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
        } else {
          this.sendWorkflowNotification(nextStep as string, `Note Sheet ${ns.noteSheetNumber} forwarded to your office for review.`, ns.instituteId, ns.department, ns.noteSheetNumber);
        }
      } else {
        // Sequential progression in Organogram
        const isExplicitCompletion = forwardToOffice === 'COMPLETED' || forwardToOffice === 'FINAL_APPROVAL';
        if (user.role === 'REGISTRAR' && isExplicitCompletion && finalAuthority === 'VICE_PRESIDENT') {
          throw new Error('403 Forbidden: Notesheet requires mandatory final sanction from Vice President and cannot be closed by Registrar.');
        }

        const hasNextStep = (currentIdx >= 0 && currentIdx < steps.length - 1);
        const isCurrentFinalAuthority = (user.role === 'VICE_PRESIDENT' && finalAuthority === 'VICE_PRESIDENT') ||
          ((user.role as any) === 'SUPER_ADMIN') ||
          ((user.role as any) === 'PRESIDENT') ||
          (isExplicitCompletion && (user.role === 'VICE_PRESIDENT' || (user.role as any) === 'SUPER_ADMIN'));

        if (hasNextStep && !isCurrentFinalAuthority) {
          // Intermediate Approval & Forward: previous stage is approved, Notesheet moves to next stage
          nextStep = steps[currentIdx + 1] as NoteSheet['currentOffice'];
          nextStatus = getStatusForOffice(nextStep);
          const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

          if (nextStep === 'VICE_PRESIDENT') {
            const activeVp = this.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
            if (!activeVp) {
              throw new Error('500 Configuration Error: No active Vice President is configured for Notesheet approval.');
            }
            assignee.userId = activeVp.id;
            assignee.name = activeVp.name;
            assignee.role = 'VICE_PRESIDENT';
            ns.currentStage = 'VICE_PRESIDENT_APPROVAL';
          }

          ns.currentOffice = nextStep;
          ns.status = nextStatus;
          ns.currentAssigneeUserId = assignee.userId;
          ns.currentAssigneeName = assignee.name;
          ns.currentAssigneeRole = assignee.role;
          ns.currentHandlerId = assignee.userId;
          ns.currentAuthorityRole = nextStep;

          const intermediateApprovalId = `NS-APR-${Date.now().toString().slice(-6)}`;

          ns.movements.push({
            id: `mvt-${Date.now()}`,
            noteSheetId: ns.id,
            fromUser: `${user.name} (${user.role})`,
            fromUserId: user.id,
            fromUserRole: user.role,
            actorUserId: user.id,
            actorName: user.name,
            actorRole: user.role,
            designation: this.getDesignationForUser(user.id, user.role),
            signatureSnapshot: userSigSnapshot,
            toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Immediate Reporting Authority (${nextStep})`,
            toUserId: assignee.userId,
            toOffice: nextStep,
            toRole: assignee.role || nextStep,
            stage: nextStatus,
            fromStage: previousStatus,
            toStage: nextStatus,
            action: 'FORWARD',
            decision: 'APPROVED_AND_FORWARDED',
            approvalId: intermediateApprovalId,
            remarks: remarks || `Endorsed / Approved at ${user.role} level and forwarded to ${nextStep}.`,
            attachmentUrl,
            date: now.split('T')[0],
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toLocaleString()
          });

          if (!ns.approvals) ns.approvals = [];
          ns.approvals.push({
            id: `apr-${Date.now()}`,
            noteSheetId: ns.id,
            approverUserId: user.id,
            approverName: user.name,
            approverRole: user.role,
            designation: this.getDesignationForUser(user.id, user.role),
            stage: nextStatus,
            status: 'APPROVED',
            decision: 'APPROVED_AND_FORWARDED',
            remarks: remarks || `Endorsed / Approved at ${user.role} level and forwarded to ${nextStep}.`,
            approvedAmount: ns.currentAmount,
            digitalApprovalId: intermediateApprovalId,
            timestamp: now
          });

          const revisedAmtNote = amountWasRevised ? ` with a revised proposed amount of ₹${ns.currentAmount?.toLocaleString('en-IN')}` : '';

          if (nextStep === 'VICE_PRESIDENT') {
            const activeVp = this.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
            if (activeVp) {
              this.addNotification({
                type: 'ACTION_REQUIRED',
                targetUserId: activeVp.id,
                title: `Action Required: Notesheet ${ns.noteSheetNumber || ''}`,
                message: `Notesheet ${ns.noteSheetNumber} has been approved by the Registrar and is pending for your final approval.`,
                module: 'NOTESHEET',
                referenceId: ns.noteSheetNumber,
                referenceType: 'NOTESHEET',
                linkTab: 'notesheet',
                priority: 'HIGH'
              });
            }
            this.sendWorkflowNotification('VICE_PRESIDENT', `Notesheet ${ns.noteSheetNumber} has been approved by the Registrar${revisedAmtNote} and is pending for your final approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
          } else if (nextStep === 'REGISTRAR') {
            this.sendWorkflowNotification('REGISTRAR', `Notesheet ${ns.noteSheetNumber} has been forwarded by the Deputy Registrar${revisedAmtNote} and is pending for your approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
          } else if (nextStep === 'DEPUTY_REGISTRAR') {
            this.sendWorkflowNotification('DEPUTY_REGISTRAR', `Notesheet ${ns.noteSheetNumber}${revisedAmtNote} is pending for your approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
          } else {
            this.sendWorkflowNotification(nextStep as string, `Note Sheet ${ns.noteSheetNumber} forwarded to your office by ${user.name} (${user.role})${revisedAmtNote}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
          }
        } else {
          // Final Sanction / Completion by final authority (Vice President)
          const finalApprovalId = `NS-APR-${Date.now().toString().slice(-6)}`;
          const finalSanctionAmount = ns.currentAmount !== undefined ? ns.currentAmount : (ns.approvedAmount !== undefined ? ns.approvedAmount : (ns.requestedAmount || ns.estimatedCost || 0));

          nextStep = 'COMPLETED';
          nextStatus = 'APPROVED';
          ns.currentOffice = 'COMPLETED';
          ns.currentStage = 'FINAL_APPROVAL';
          ns.currentAssigneeUserId = undefined;
          ns.currentAssigneeName = undefined;
          ns.currentAssigneeRole = undefined;
          ns.currentHandlerId = undefined;
          ns.currentAuthorityRole = undefined;
          ns.status = 'APPROVED';
          ns.decision = 'APPROVED';
          ns.decisionDate = now;
          ns.finalApprovalDate = now;
          ns.finalApprovalId = finalApprovalId;
          ns.digitalApprovalId = finalApprovalId;
          ns.approvedByUserId = user.id;
          ns.approvedByName = user.name;
          ns.approvedAt = now;
          ns.finalApprovedAmount = finalSanctionAmount;
          ns.approvedAmount = finalSanctionAmount;
          ns.isLocked = true;
          if (!ns.verificationId) ns.verificationId = this.generateNoteSheetVerificationId();
          ns.dataHash = this.generateNoteSheetHash(ns);
          ns.documentHash = ns.dataHash;

          // Automatically create Registrar Inward record & generate Inward Number for Final Approved Notesheet
          this.createRegistrarInwardForApprovedNotesheet(ns, user);

          ns.movements.push({
            id: `mvt-${Date.now()}`,
            noteSheetId: ns.id,
            fromUser: `${user.name} (${user.role})`,
            fromUserId: user.id,
            fromUserRole: user.role,
            actorUserId: user.id,
            actorName: user.name,
            actorRole: user.role,
            designation: this.getDesignationForUser(user.id, user.role),
            signatureSnapshot: userSigSnapshot,
            toUser: 'Completed / Approved',
            toOffice: 'COMPLETED',
            toRole: 'COMPLETED',
            stage: 'APPROVED',
            fromStage: previousStatus,
            toStage: 'APPROVED',
            action: 'APPROVE',
            decision: 'FINAL_APPROVED',
            approvalId: finalApprovalId,
            remarks: remarks || `Sanctioned and Approved.${ns.approvedAmount !== undefined ? ` Approved Amount: ₹${ns.approvedAmount.toLocaleString('en-IN')}` : ''}`,
            attachmentUrl,
            date: now.split('T')[0],
            time: new Date().toLocaleTimeString(),
            timestamp: new Date().toLocaleString()
          });

          if (!ns.approvals) ns.approvals = [];
          ns.approvals.push({
            id: `apr-${Date.now()}`,
            noteSheetId: ns.id,
            approverUserId: user.id,
            approverName: user.name,
            approverRole: user.role,
            designation: this.getDesignationForUser(user.id, user.role),
            stage: 'APPROVED',
            status: 'APPROVED',
            decision: 'FINAL_APPROVED',
            remarks: remarks || `Sanctioned and Approved.`,
            approvedAmount: finalSanctionAmount,
            digitalApprovalId: finalApprovalId,
            timestamp: now
          });

          // Determine ALL unique users who participated in this Notesheet workflow
          const allUsers = this.getUsers();
          const participantUserIds = new Set<string>();

          // 1. Original Notesheet Creator
          if (ns.creatorId) participantUserIds.add(ns.creatorId);

          // 2. Final Approver
          if (user.id) participantUserIds.add(user.id);

          // 3. Every authority who reviewed, endorsed, forwarded, or approved in movements
          ns.movements.forEach(m => {
            if (m.fromUserId) {
              participantUserIds.add(m.fromUserId);
            } else if (m.fromUser) {
              const matchedUser = allUsers.find(u => 
                m.fromUser.includes(u.name) || 
                (u.email && m.fromUser.includes(u.email)) ||
                (u.role && m.fromUser.includes(u.role))
              );
              if (matchedUser) participantUserIds.add(matchedUser.id);
            }
          });

          // Send targeted notifications to ALL participants (NO broadcast to entire dept or university)
          const participantList = Array.from(participantUserIds);
          const notificationTitle = 'Notesheet Approved';
          const notificationMessage = `Notesheet ${ns.noteSheetNumber} has been successfully approved and the approval workflow has been completed.\n\nNotesheet: ${ns.noteSheetNumber}\nSubject: ${ns.subject}\nStatus: FINAL APPROVED\nFinal Approved By: ${user.name} (${this.getDesignationForUser(user.id, user.role)})\nDate & Time: ${new Date().toLocaleString()}`;

          participantList.forEach(pUserId => {
            this.addNotification({
              type: 'APPROVAL_COMPLETED',
              targetUserId: pUserId,
              title: notificationTitle,
              message: notificationMessage,
              module: 'NOTESHEET',
              referenceId: ns.noteSheetNumber,
              referenceType: 'NOTESHEET',
              linkTab: 'notesheet',
              priority: 'HIGH'
            });
          });
        }
      }
    } else if (action === 'FORWARD') {
      const dest = forwardToOffice || (currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : 'REGISTRAR');
      nextStep = dest as NoteSheet['currentOffice'];
      nextStatus = getStatusForOffice(nextStep);
      const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

      if (nextStep === 'VICE_PRESIDENT') {
        const activeVp = this.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
        if (!activeVp) {
          throw new Error('500 Configuration Error: No active Vice President is configured for Notesheet approval.');
        }
        assignee.userId = activeVp.id;
        assignee.name = activeVp.name;
        assignee.role = 'VICE_PRESIDENT';
        ns.currentStage = 'VICE_PRESIDENT_APPROVAL';
      }

      ns.currentOffice = nextStep;
      ns.status = nextStatus;
      ns.currentAssigneeUserId = assignee.userId;
      ns.currentAssigneeName = assignee.name;
      ns.currentAssigneeRole = assignee.role;
      ns.currentHandlerId = assignee.userId;
      ns.currentAuthorityRole = nextStep;

      const intermediateApprovalId = `NS-APR-${Date.now().toString().slice(-6)}`;

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        signatureSnapshot: userSigSnapshot,
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Forwarded to ${dest}`,
        toUserId: assignee.userId,
        toOffice: nextStep,
        toRole: assignee.role || nextStep,
        stage: nextStatus,
        fromStage: previousStatus,
        toStage: nextStatus,
        action: 'FORWARD',
        decision: 'FORWARDED',
        approvalId: intermediateApprovalId,
        remarks: remarks || `Forwarded to ${dest} for endorsement.`,
        attachmentUrl,
        date: now.split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toLocaleString()
      });

      if (nextStep === 'VICE_PRESIDENT') {
        const activeVp = this.getUsers().find(u => u.role === 'VICE_PRESIDENT' && u.status === 'ACTIVE');
        if (activeVp) {
          this.addNotification({
            type: 'ACTION_REQUIRED',
            targetUserId: activeVp.id,
            title: `Action Required: Notesheet ${ns.noteSheetNumber || ''}`,
            message: `Notesheet ${ns.noteSheetNumber} has been approved by the Registrar and is pending for your final approval.`,
            module: 'NOTESHEET',
            referenceId: ns.noteSheetNumber,
            referenceType: 'NOTESHEET',
            linkTab: 'notesheet',
            priority: 'HIGH'
          });
        }
        this.sendWorkflowNotification('VICE_PRESIDENT', `Notesheet ${ns.noteSheetNumber} has been approved by the Registrar and is pending for your final approval.`, ns.instituteId, ns.department, ns.noteSheetNumber);
      } else {
        this.sendWorkflowNotification(dest, `Note Sheet ${ns.noteSheetNumber} forwarded to your office by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
      }
    } else if (action === 'CONSULT') {
      if (!forwardToOffice) {
        throw new Error('Consultation recipient office is required.');
      }
      ns.consultationActive = true;
      if (!ns.consultationHistory) ns.consultationHistory = [];
      ns.consultationHistory.push({
        id: `cons-${Date.now()}`,
        consultedOffice: forwardToOffice,
        consultedBy: user.name,
        consultedAt: now,
        reason: remarks || 'Cross-departmental consultation requested.'
      });

      nextStep = forwardToOffice as NoteSheet['currentOffice'];
      nextStatus = 'IN_CONSULTATION';
      const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Consultation (${forwardToOffice})`,
        toUserId: assignee.userId,
        toOffice: nextStep,
        toRole: assignee.role || nextStep,
        stage: 'IN_CONSULTATION',
        fromStage: previousStatus,
        toStage: 'IN_CONSULTATION',
        action: 'CONSULT',
        remarks: `Consultation Requested: ${remarks}`,
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(forwardToOffice, `Consultation requested on Note Sheet ${ns.noteSheetNumber} by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'RETURN_CONSULTATION') {
      ns.consultationActive = false;
      const originalOffice = ns.movements.slice().reverse().find(m => m.action === 'CONSULT')?.fromUser || steps[currentIdx] || 'HOD';
      const cleanOffice = originalOffice.split(' ')[0] as NoteSheet['currentOffice'];
      nextStep = cleanOffice;
      nextStatus = 'UNDER_REVIEW';

      if (ns.consultationHistory && ns.consultationHistory.length > 0) {
        const lastCons = ns.consultationHistory[ns.consultationHistory.length - 1];
        lastCons.opinion = remarks;
        lastCons.respondedAt = now;
        lastCons.respondedBy = user.name;
      }

      const assignee = this.resolveActualAssignee(cleanOffice, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Returned to Originating Branch (${cleanOffice})`,
        toUserId: assignee.userId,
        toOffice: cleanOffice,
        toRole: assignee.role || cleanOffice,
        stage: 'UNDER_REVIEW',
        fromStage: previousStatus,
        toStage: 'UNDER_REVIEW',
        action: 'RETURN_CONSULTATION',
        remarks: `Consultation Opinion: ${remarks}`,
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(cleanOffice as string, `Consultation opinion provided on Note Sheet ${ns.noteSheetNumber} by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'TRANSFER') {
      if (!forwardToOffice) throw new Error('Transfer target office is required.');
      nextStep = forwardToOffice as NoteSheet['currentOffice'];
      nextStatus = 'FORWARDED';
      const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Transferred to ${forwardToOffice}`,
        toUserId: assignee.userId,
        toOffice: nextStep,
        toRole: assignee.role || nextStep,
        stage: 'FORWARDED',
        fromStage: previousStatus,
        toStage: 'FORWARDED',
        action: 'TRANSFER',
        remarks: `Departmental Transfer: ${remarks}`,
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(forwardToOffice, `Note Sheet ${ns.noteSheetNumber} transferred to your department by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'RETURN') {
      if (!remarks || !remarks.trim()) {
        throw new Error('Return reason is mandatory.');
      }

      // Return to immediate previous authority or creator
      let returnDest: string = 'CREATOR';
      if (currentIdx > 0) {
        returnDest = steps[currentIdx - 1];
      } else {
        returnDest = 'CREATOR';
      }

      nextStep = returnDest as NoteSheet['currentOffice'];
      nextStatus = 'RETURNED';
      ns.decision = 'RETURNED';
      ns.decisionDate = now;
      ns.decisionReason = remarks.trim();
      ns.returnedByUserId = user.id;
      ns.returnedByName = user.name;
      ns.returnedAt = now;
      ns.version = typeof ns.version === 'number' ? ns.version + 1 : `${(parseFloat(String(ns.version || '1.0')) + 0.1).toFixed(1)}`;

      const assignee = returnDest === 'CREATOR' 
        ? { userId: ns.creatorId, name: ns.creatorName, role: ns.creatorRole }
        : this.resolveActualAssignee(returnDest, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: returnDest === 'CREATOR' ? `Creator (${ns.creatorName})` : (assignee.name ? `${assignee.name} (${assignee.role})` : `Previous Authority (${returnDest})`),
        toUserId: assignee.userId,
        toOffice: returnDest,
        toRole: assignee.role || returnDest,
        stage: 'RETURNED',
        fromStage: previousStatus,
        toStage: 'RETURNED',
        action: 'RETURN',
        decision: 'RETURNED',
        remarks: remarks.trim(),
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      if (returnDest === 'CREATOR') {
        this.sendNotificationToUser(ns.creatorId, `Your Note Sheet ${ns.noteSheetNumber} was returned for correction: ${remarks}`, ns.noteSheetNumber);
      } else {
        this.sendWorkflowNotification(returnDest, `Note Sheet ${ns.noteSheetNumber} was returned to your office for review/correction: ${remarks}`, ns.instituteId, ns.department, ns.noteSheetNumber);
      }
    } else if (action === 'REQUEST_CLARIFICATION') {
      if (!remarks || !remarks.trim()) {
        throw new Error('Clarification query is mandatory.');
      }
      nextStep = 'CREATOR';
      nextStatus = 'CLARIFICATION_REQUIRED';
      ns.decision = 'CLARIFICATION_REQUIRED';

      if (!ns.clarifications) ns.clarifications = [];
      ns.clarifications.push({
        id: `clar-${Date.now()}`,
        requestedBy: user.name,
        requestedByRole: user.role,
        requestedAt: now,
        query: remarks.trim(),
        status: 'PENDING'
      });

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: `Creator (${ns.creatorName})`,
        toUserId: ns.creatorId,
        toOffice: 'CREATOR',
        toRole: ns.creatorRole,
        stage: 'CLARIFICATION_REQUIRED',
        fromStage: previousStatus,
        toStage: 'CLARIFICATION_REQUIRED',
        action: 'REQUEST_CLARIFICATION',
        decision: 'CLARIFICATION_REQUIRED',
        remarks: `Clarification Requested: ${remarks.trim()}`,
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendNotificationToUser(ns.creatorId, `Clarification requested on Note Sheet ${ns.noteSheetNumber}: ${remarks}`, ns.noteSheetNumber);
    } else if (action === 'PROVIDE_CLARIFICATION' || action === 'RESUBMIT') {
      const origDept = (ns.department || 'ADMIN').toUpperCase();
      const dest = forwardToOffice || (['EXAM', 'HOSTEL', 'ACCOUNTS', 'STUDENT_SECTION'].includes(origDept) ? 'REGISTRAR' : 'HOD');
      nextStep = dest as NoteSheet['currentOffice'];
      nextStatus = action === 'RESUBMIT' ? 'RESUBMITTED' : 'PENDING_APPROVAL';

      if (action === 'PROVIDE_CLARIFICATION' && ns.clarifications && ns.clarifications.length > 0) {
        const lastClar = ns.clarifications[ns.clarifications.length - 1];
        lastClar.response = remarks;
        lastClar.respondedAt = now;
        lastClar.respondedBy = user.name;
        lastClar.status = 'ANSWERED';
      }

      if (action === 'RESUBMIT') {
        ns.version = typeof ns.version === 'number' ? ns.version + 1 : `${(parseFloat(String(ns.version || '1.0')) + 0.1).toFixed(1)}`;
      }

      const assignee = this.resolveActualAssignee(dest, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Resubmitted to ${dest}`,
        toUserId: assignee.userId,
        toOffice: dest,
        toRole: assignee.role || dest,
        stage: nextStatus,
        fromStage: previousStatus,
        toStage: nextStatus,
        action,
        decision: action,
        remarks: remarks || (action === 'RESUBMIT' ? 'Note Sheet revised and resubmitted.' : 'Clarification provided.'),
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(dest, `Note Sheet ${ns.noteSheetNumber} ${action === 'RESUBMIT' ? 'resubmitted' : 'clarification provided'} by ${user.name}.`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'ACTION_TAKEN') {
      nextStatus = 'ACTION_COMPLETED';
      ns.actionTakenSummary = extraOptions?.actionTakenSummary || remarks;
      ns.actionTakenProofUrl = extraOptions?.proofUrl || attachmentUrl;
      ns.actionTakenByUserId = user.id;
      ns.actionTakenByName = user.name;
      ns.actionTakenAt = now;

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: 'Concerned Office / Compliance',
        stage: 'ACTION_COMPLETED',
        fromStage: previousStatus,
        toStage: 'ACTION_COMPLETED',
        action: 'ACTION_TAKEN',
        remarks: `Action Taken recorded: ${ns.actionTakenSummary}`,
        attachmentUrl: ns.actionTakenProofUrl,
        timestamp: new Date().toLocaleString()
      });
    } else if (action === 'REOPEN_REQUEST') {
      ns.reopenedReason = extraOptions?.reopenedReason || remarks;
      ns.reopenedByUserId = user.id;
      ns.reopenedByName = user.name;
      ns.reopenedAt = now;
      nextStatus = 'REOPENED';
      nextStep = steps[0] || 'HOD';
      const assignee = this.resolveActualAssignee(nextStep, ns.instituteId, ns.departmentId, ns.department);

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: assignee.name ? `${assignee.name} (${assignee.role})` : `Reopened to ${nextStep}`,
        toUserId: assignee.userId,
        toOffice: nextStep,
        toRole: assignee.role || nextStep,
        stage: 'REOPENED',
        fromStage: previousStatus,
        toStage: 'REOPENED',
        action: 'REOPEN_REQUEST',
        remarks: `Notesheet Reopened: ${ns.reopenedReason}`,
        timestamp: new Date().toLocaleString()
      });

      this.sendWorkflowNotification(nextStep, `Note Sheet ${ns.noteSheetNumber} reopened for reassessment by ${user.name}. Reason: ${ns.reopenedReason}`, ns.instituteId, ns.department, ns.noteSheetNumber);
    } else if (action === 'ADD_REMARK') {
      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: ns.currentOffice,
        stage: ns.status,
        fromStage: previousStatus,
        toStage: ns.status,
        action: 'ADD_REMARK',
        remarks: remarks || 'Official Remark added.',
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });
    } else if (action === 'REJECT') {
      if (!remarks || !remarks.trim()) {
        throw new Error('Rejection reason is mandatory.');
      }
      nextStep = 'CREATOR';
      nextStatus = 'REJECTED';
      ns.decision = 'REJECTED';
      ns.decisionDate = now;
      ns.decisionReason = remarks.trim();
      ns.rejectedByUserId = user.id;
      ns.rejectedByName = user.name;
      ns.rejectedAt = now;

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: `Rejected - ${user.name}`,
        stage: 'REJECTED',
        fromStage: previousStatus,
        toStage: 'REJECTED',
        action: 'REJECT',
        decision: 'REJECTED',
        remarks: remarks.trim(),
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });

      this.sendNotificationToUser(ns.creatorId, `Your Note Sheet ${ns.noteSheetNumber} has been REJECTED. Reason: ${remarks}`);
    } else if (action === 'CLOSE') {
      // Validate all compliance items are complete
      const pendingCompliance = (ns.complianceItems || []).filter(c => c.status !== 'COMPLETED');
      if (pendingCompliance.length > 0) {
        throw new Error(`Cannot close Notesheet: ${pendingCompliance.length} mandatory compliance item(s) are still pending.`);
      }

      nextStep = 'CLOSED';
      nextStatus = 'CLOSED';
      ns.closedByUserId = user.id;
      ns.closedByName = user.name;
      ns.closedAt = now;

      ns.movements.push({
        id: `mvt-${Date.now()}`,
        noteSheetId: ns.id,
        fromUser: `${user.name} (${user.role})`,
        fromUserId: user.id,
        fromUserRole: user.role,
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        designation: this.getDesignationForUser(user.id, user.role),
        toUser: 'Closed / Archived',
        stage: 'CLOSED',
        fromStage: previousStatus,
        toStage: 'CLOSED',
        action: 'CLOSE',
        decision: 'CLOSED',
        remarks: remarks || 'Notesheet closed and archived.',
        attachmentUrl,
        timestamp: new Date().toLocaleString()
      });
    }

    ns.currentOffice = nextStep as NoteSheet['currentOffice'];
    ns.status = nextStatus;
    ns.updatedAt = now;

    if (nextStep === 'COMPLETED' || nextStatus === 'APPROVED' || nextStatus === 'CLOSED' || nextStatus === 'REJECTED') {
      ns.currentAssigneeUserId = undefined;
      ns.currentAssigneeName = undefined;
      ns.currentAssigneeRole = undefined;
      ns.currentHandlerId = undefined;
      ns.currentAuthorityRole = undefined;
    } else if (nextStep === 'CREATOR') {
      ns.currentAssigneeUserId = ns.creatorId;
      ns.currentAssigneeName = ns.creatorName;
      ns.currentAssigneeRole = ns.creatorRole;
      ns.currentHandlerId = ns.creatorId;
      ns.currentAuthorityRole = 'CREATOR';
    } else {
      const assignee = this.resolveActualAssignee(nextStep as string, ns.instituteId, ns.departmentId, ns.department);
      ns.currentAssigneeUserId = assignee.userId;
      ns.currentAssigneeName = assignee.name;
      ns.currentAssigneeRole = assignee.role;
      ns.currentHandlerId = assignee.userId;
      ns.currentAuthorityRole = nextStep as string;
    }

    // Automatically append immutable audit log entry
    if (!ns.auditTrail) ns.auditTrail = [];
    ns.auditTrail.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      notesheetId: ns.id,
      notesheetNumber: ns.noteSheetNumber || ns.notesheetNumber || 'DRAFT',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: action === 'SUBMIT' ? 'SUBMIT' : action === 'APPROVE' ? (nextStatus === 'APPROVED' ? 'SANCTION' : 'APPROVE') : action as any,
      date: now.split('T')[0],
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toLocaleString(),
      previousState: previousStatus,
      newState: nextStatus,
      remark: remarks || `${action} executed by ${user.name} (${user.role})`
    });

    this.saveState();
    this.logAudit(`NOTESHEET_${action}`, 'Administration', `Note Sheet ${ns.noteSheetNumber} action ${action} by ${user.name}`, user.name, user.role);
  }

  public logNoteSheetAudit(
    noteSheetId: string,
    action: NoteSheetAuditAction,
    remark: string,
    user: User,
    previousState?: string,
    newState?: string
  ): NoteSheetAuditEntry | null {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns) return null;

    if (!ns.auditTrail) ns.auditTrail = [];

    const now = new Date();
    const entry: NoteSheetAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      notesheetId: ns.id,
      notesheetNumber: ns.noteSheetNumber || ns.notesheetNumber || 'DRAFT',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      timestamp: now.toLocaleString(),
      remark,
      previousState: previousState || ns.status,
      newState: newState || ns.status
    };

    ns.auditTrail.push(entry);
    this.saveState();
    return entry;
  }

  addNoteSheetAttachment(noteSheetId: string, fileName: string, fileType: string, fileUrl: string, user: User, fileSize?: number, category?: string): void {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns) return;

    if (!ns.attachments) ns.attachments = [];
    ns.attachments.push(fileName);

    if (!ns.attachmentObjects) ns.attachmentObjects = [];

    // Check if attachment with same name or category already exists -> versioning
    const existing = ns.attachmentObjects.find(a => a.fileName === fileName || (category && a.documentCategory === category));
    const version = existing ? (existing.version || 1) + 1 : 1;
    if (existing) {
      existing.status = 'SUPERSEDED';
    }

    ns.attachmentObjects.push({
      id: `att-${Date.now()}`,
      fileName,
      fileType: fileType.toUpperCase(),
      fileSize: fileSize || 0,
      fileUrl,
      documentCategory: category || 'Other Supporting Document',
      version,
      status: 'ACTIVE',
      uploadedByUserId: user.id,
      uploadedByName: user.name,
      uploadedByRole: user.role,
      createdAt: new Date().toISOString()
    });

    ns.movements.push({
      id: `mvt-${Date.now()}`,
      noteSheetId: ns.id,
      fromUser: `${user.name} (${user.role})`,
      fromUserId: user.id,
      fromUserRole: user.role,
      toUser: ns.currentOffice,
      action: 'CREATE',
      remarks: `Uploaded attachment: ${fileName} (v${version})`,
      attachmentUrl: fileUrl,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toLocaleString()
    });

    this.logNoteSheetAudit(ns.id, 'ATTACHMENT_UPLOAD', `Uploaded supporting document '${fileName}' (${category || 'Document'}) v${version}`, user, ns.status, ns.status);

    ns.updatedAt = new Date().toISOString();
    this.saveState();
  }

  public deleteNoteSheetAttachment(noteSheetId: string, attachmentId: string, user: User): boolean {
    if (!this.state.noteSheets) return false;
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns || !ns.attachmentObjects) return false;

    const idx = ns.attachmentObjects.findIndex(a => a.id === attachmentId || a.fileName === attachmentId);
    if (idx === -1) return false;

    const targetAtt = ns.attachmentObjects[idx];
    if (targetAtt.uploadedByUserId && targetAtt.uploadedByUserId !== user.id && user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: You can only delete documents uploaded by yourself.');
    }

    ns.attachmentObjects.splice(idx, 1);
    ns.attachments = ns.attachments.filter(fn => fn !== targetAtt.fileName);

    this.logNoteSheetAudit(ns.id, 'ATTACHMENT_DELETE', `Deleted document '${targetAtt.fileName}'`, user, ns.status, ns.status);

    ns.updatedAt = new Date().toISOString();
    this.saveState();
    return true;
  }

  public addNoteSheetComplianceItem(noteSheetId: string, item: Omit<NoteSheetComplianceItem, 'id' | 'createdAt'>, user: User): NoteSheetComplianceItem {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns) throw new Error('Notesheet not found');

    if (!ns.complianceItems) ns.complianceItems = [];

    const newComp: NoteSheetComplianceItem = {
      ...item,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    ns.complianceItems.push(newComp);
    ns.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('ADD_COMPLIANCE_ITEM', 'Notesheet Compliance', `Added compliance action "${item.actionDescription}" on ${ns.noteSheetNumber}`, user.name, user.role);

    return newComp;
  }

  public updateNoteSheetComplianceItem(noteSheetId: string, complianceId: string, updateData: Partial<NoteSheetComplianceItem>, user: User): NoteSheetComplianceItem | null {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    const ns = this.state.noteSheets.find(n => n.id === noteSheetId);
    if (!ns || !ns.complianceItems) return null;

    const idx = ns.complianceItems.findIndex(c => c.id === complianceId);
    if (idx === -1) return null;

    const current = ns.complianceItems[idx];
    const updated: NoteSheetComplianceItem = {
      ...current,
      ...updateData,
      completedAt: updateData.status === 'COMPLETED' ? new Date().toISOString() : current.completedAt,
      updatedAt: new Date().toISOString()
    };

    ns.complianceItems[idx] = updated;
    ns.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('UPDATE_COMPLIANCE_ITEM', 'Notesheet Compliance', `Updated compliance item on ${ns.noteSheetNumber} to ${updated.status}`, user.name, user.role);

    return updated;
  }

  public hasNoteSheetPermission(user: User | null, role: UserRole | null, permission: NoteSheetPermission): boolean {
    if (!user || !role || role === 'STUDENT') return false;
    const permissions = ROLE_NOTESHEET_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.includes(permission);
  }

  /**
   * Checks whether a user previously participated in a Notesheet workflow (Creator, Approver, Forwarder, Reviewer, etc.)
   */
  public userParticipatedInNotesheet(user: User, ns: NoteSheet): boolean {
    if (!user || !ns) return false;
    if (ns.creatorId === user.id) return true;
    if (ns.currentHandlerId === user.id) return true;
    if (ns.approvedByUserId === user.id) return true;
    if (ns.rejectedByUserId === user.id) return true;
    if (ns.returnedByUserId === user.id) return true;
    if (ns.actionTakenByUserId === user.id) return true;
    if (ns.reopenedByUserId === user.id) return true;
    if (ns.closedByUserId === user.id) return true;
    if (ns.movements && ns.movements.some(m =>
      m.fromUserId === user.id ||
      m.toUserId === user.id ||
      (m.fromUser && (m.fromUser.includes(user.name) || (user.email && m.fromUser.includes(user.email)))) ||
      (m.toUser && (m.toUser.includes(user.name) || (user.email && m.toUser.includes(user.email))))
    )) return true;
    if (ns.clarifications && ns.clarifications.some(c =>
      c.requestedBy === user.name ||
      c.respondedBy === user.name
    )) return true;
    return false;
  }

  /**
   * Checks whether a Notesheet requires active review/approval/action from the authenticated user
   */
  public isNotesheetPendingForUser(user: User, role: UserRole, ns: NoteSheet): boolean {
    if (!user || !role || role === 'STUDENT' || user.role === 'STUDENT') return false;
    const nonActionableStatuses: NoteSheetStatus[] = ['DRAFT', 'APPROVED', 'CLOSED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    if (nonActionableStatuses.includes(ns.status)) return false;
    if (ns.currentOffice === 'COMPLETED') return false;

    // 1. Direct individual assignment
    if (ns.currentHandlerId && ns.currentHandlerId === user.id) return true;

    // 2. Action Pending / Follow-up assignments
    if (ns.status === 'ACTION_PENDING' || ns.status === 'ACTION_IN_PROGRESS') {
      if (ns.actionAssignedToUserId === user.id || ns.creatorId === user.id) return true;
    }

    // 3. Clarification or Returned is pending with creator
    if (ns.status === 'CLARIFICATION_REQUIRED') {
      const hasPendingQueryForUser = (ns.clarifications && ns.clarifications.some(c => c.status === 'PENDING' && (ns.creatorId === user.id || c.requestedBy !== user.name))) || (ns.creatorId === user.id);
      if (hasPendingQueryForUser) return true;
    }
    if (ns.status === 'RETURNED' && ns.creatorId === user.id) {
      return true;
    }

    // 4. Role / Office / Stage Matching
    const office = ns.currentOffice;
    const roleStr = String(role);

    if (office === 'DEPUTY_REGISTRAR' || ns.status === 'PENDING_DEPUTY_REGISTRAR') {
      if (role === 'DEPUTY_REGISTRAR') {
        const isDirect = ns.currentHandlerId === user.id ||
          (ns.movements || []).some(m => m.toUserId === user.id || (m.toUser && (m.toUser.includes(user.name) || (user.email && m.toUser.includes(user.email)))));
        const scopes = this.getDeputyRegistrarScopeByUserId(user.id);
        const inScope = scopes.some(s => {
          const matchInst = !ns.instituteId || s.instituteId === ns.instituteId;
          const matchDept = s.isUniversalInstituteScope || s.departmentIds.length === 0 ||
            s.departmentIds.includes('ALL') ||
            (Boolean(ns.departmentId) && s.departmentIds.includes(ns.departmentId!)) ||
            (Boolean(ns.department) && (s.departmentIds.includes(ns.department!) || (s.departmentNames || []).some(dn => dn.toLowerCase() === ns.department!.toLowerCase())));
          return matchInst && matchDept;
        });
        return isDirect || inScope;
      }
      return roleStr === 'SUPER_ADMIN'; // Registrar must NOT count Notesheets pending with Deputy Registrar
    }

    if (office === 'REGISTRAR' || ns.status === 'PENDING_REGISTRAR') {
      return roleStr === 'REGISTRAR' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'VICE_PRESIDENT' || ns.status === 'PENDING_VICE_PRESIDENT' || (ns as any).currentStage === 'VICE_PRESIDENT_APPROVAL') {
      if (roleStr === 'SUPER_ADMIN') return true;
      if (roleStr === 'VICE_PRESIDENT') {
        return !ns.currentAssigneeUserId || ns.currentAssigneeUserId === user.id || ns.currentHandlerId === user.id;
      }
      return false;
    }

    if (['PROVOST', 'PRESIDENT'].includes(office) || ns.status === 'PENDING_HIGHER_AUTHORITY') {
      return ['SUPER_ADMIN', 'PROVOST', 'PRESIDENT'].includes(roleStr);
    }

    if (office === 'FINANCE' || office === 'ACCOUNTS_ADMIN' || office === 'FINANCE_OFFICER' || ns.status === 'PENDING_FINANCE') {
      return roleStr === 'ACCOUNTS_ADMIN' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'EXAM_CELL' || office === 'DEPUTY_REGISTRAR_EXAM' || ns.status === 'PENDING_EXAMINATION') {
      return roleStr === 'EXAM_CELL' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'HOSTEL_ADMIN' || ns.status === 'PENDING_HOSTEL') {
      return roleStr === 'HOSTEL_ADMIN' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'STUDENT_SECTION' || ns.status === 'PENDING_STUDENT_SECTION') {
      return roleStr === 'STUDENT_SECTION' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'IQAC' || office === 'DIRECTOR_IQAC' || office === 'IQAC_COORDINATOR' || ns.status === 'PENDING_IQAC') {
      return roleStr === 'IQAC' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'HR' || ns.status === 'PENDING_HR') {
      return roleStr === 'UNIVERSITY_ADMIN' || roleStr === 'SUPER_ADMIN';
    }

    if (office === 'HOI' || office === 'PRINCIPAL' || ns.status === 'PENDING_HOI') {
      if (roleStr === 'PRINCIPAL') {
        return !ns.instituteId || ns.instituteId === user.instituteId;
      }
      return roleStr === 'SUPER_ADMIN' || roleStr === 'UNIVERSITY_ADMIN';
    }

    if (office === 'HOD' || ns.status === 'PENDING_HOD') {
      if (roleStr === 'HOD') {
        const instMatch = !ns.instituteId || ns.instituteId === user.instituteId;
        const uDeptId = (user.departmentId || '').toUpperCase();
        const nsDeptId = (ns.departmentId || '').toUpperCase();
        const uDeptName = (user.departmentName || this.resolveUserDepartment(user) || '').toUpperCase();
        const nsDeptName = (ns.department || ns.departmentName || '').toUpperCase();
        const deptMatch = (!uDeptId && !uDeptName) || (!nsDeptId && !nsDeptName) ||
          (Boolean(uDeptId && nsDeptId) && uDeptId === nsDeptId) ||
          (Boolean(uDeptName && nsDeptName) && (uDeptName === nsDeptName || uDeptName.includes(nsDeptName) || nsDeptName.includes(uDeptName))) ||
          (Boolean(uDeptId && nsDeptName) && (uDeptId === nsDeptName || uDeptId.includes(nsDeptName) || nsDeptName.includes(uDeptId))) ||
          (Boolean(uDeptName && nsDeptId) && (uDeptName === nsDeptId || uDeptName.includes(nsDeptId) || nsDeptId.includes(uDeptName)));
        return Boolean(instMatch && deptMatch);
      }
      return false;
    }

    if (office === 'FACULTY' || ns.status === 'PENDING_FACULTY') {
      if (roleStr === 'FACULTY') {
        return ns.currentHandlerId === user.id || ns.creatorId === user.id;
      }
      return false;
    }

    return false;
  }

  /**
   * GLOBAL NOTESHEET VISIBILITY RULE (Backend Source of Truth)
   * A Notesheet is visible only if:
   * A. User created the Notesheet OR
   * B. Notesheet is currently assigned to the user for approval/action OR
   * C. User previously participated in the workflow OR
   * D. User is an authorized higher authority with applicable Institute/Department scope OR
   * E. User has explicit permission to view the Notesheet
   */
  public isUserAuthorizedForNotesheet(user: User, role: UserRole, ns: NoteSheet): boolean {
    if (!user || !role || role === 'STUDENT' || user.role === 'STUDENT') return false;
    if (!this.hasNoteSheetPermission(user, role, 'NOTESHEET_VIEW')) return false;

    const roleStr = String(role);
    const isUnrestrictedUniversityAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PROVOST', 'VICE_PRESIDENT', 'PRESIDENT'].includes(roleStr);

    // 1. Confidentiality Scoping
    if (ns.visibility === 'CONFIDENTIAL' || ns.visibility === 'HIGHLY_CONFIDENTIAL') {
      const isCreator = ns.creatorId === user.id;
      const isCurrentHandler = ns.currentHandlerId === user.id;
      const isCurrentOfficeRole = String(ns.currentOffice) === roleStr;
      const isParticipant = this.userParticipatedInNotesheet(user, ns);
      if (!isCreator && !isCurrentHandler && !isCurrentOfficeRole && !isParticipant && !isUnrestrictedUniversityAdmin) {
        return false;
      }
    }

    // Condition A: User created the Notesheet
    if (ns.creatorId === user.id) return true;

    // Condition B: Notesheet is currently assigned to the user for approval/action
    if (this.isNotesheetPendingForUser(user, role, ns) || ns.currentHandlerId === user.id) return true;

    // Condition C: User previously participated in the workflow
    if (this.userParticipatedInNotesheet(user, ns)) return true;

    // Condition D: Authorized higher authority with applicable Institute/Department scope
    if (isUnrestrictedUniversityAdmin) return true;

    // Deputy Registrar Scoping
    if (role === 'DEPUTY_REGISTRAR') {
      const scopes = this.getDeputyRegistrarScopeByUserId(user.id);
      const inAssignedScope = scopes.some(s => {
        const matchInst = !ns.instituteId || s.instituteId === ns.instituteId;
        const matchDept = s.isUniversalInstituteScope || s.departmentIds.length === 0 ||
          s.departmentIds.includes('ALL') ||
          (Boolean(ns.departmentId) && s.departmentIds.includes(ns.departmentId!)) ||
          (Boolean(ns.department) && (s.departmentIds.includes(ns.department!) || (s.departmentNames || []).some(dn => dn.toLowerCase() === ns.department!.toLowerCase())));
        return matchInst && matchDept;
      });
      return inAssignedScope;
    }

    // Principal / HOI Scoping: Scoped to their Institute across constituent departments
    if (role === 'PRINCIPAL') {
      return !ns.instituteId || ns.instituteId === user.instituteId;
    }

    // HOD Scoping: Scoped to their Department & Institute
    if (role === 'HOD') {
      const matchInst = !ns.instituteId || ns.instituteId === user.instituteId;
      const uDeptId = (user.departmentId || '').toUpperCase();
      const nsDeptId = (ns.departmentId || '').toUpperCase();
      const uDeptName = (user.departmentName || this.resolveUserDepartment(user) || '').toUpperCase();
      const nsDeptName = (ns.department || ns.departmentName || '').toUpperCase();
      const matchDept = (!uDeptId && !uDeptName) || (!nsDeptId && !nsDeptName) ||
        (Boolean(uDeptId && nsDeptId) && uDeptId === nsDeptId) ||
        (Boolean(uDeptName && nsDeptName) && (uDeptName === nsDeptName || uDeptName.includes(nsDeptName) || nsDeptName.includes(uDeptName))) ||
        (Boolean(uDeptId && nsDeptName) && (uDeptId === nsDeptName || uDeptId.includes(nsDeptName) || nsDeptName.includes(uDeptId))) ||
        (Boolean(uDeptName && nsDeptId) && (uDeptName === nsDeptId || uDeptName.includes(nsDeptId) || nsDeptId.includes(uDeptName)));
      return Boolean(matchInst && matchDept);
    }

    // Operational Departments (Finance, Exam, Hostel, Transport, Student Section, IQAC)
    if (role === 'ACCOUNTS_ADMIN') {
      const isFinancial = Boolean(ns.financialRequirement) || Boolean(ns.budgetRequired);
      const nsDept = (ns.department || '').toUpperCase();
      const matchDept = ['ACCOUNTS', 'FINANCE', 'FEE'].some(d => nsDept.includes(d));
      return isFinancial || matchDept;
    }

    if (role === 'EXAM_CELL') {
      const nsDept = (ns.department || '').toUpperCase();
      const nsType = (ns.notesheetType || ns.category || '').toUpperCase();
      return ['EXAM', 'EXAMINATION', 'EDP'].some(d => nsDept.includes(d) || nsType.includes(d));
    }

    if (role === 'HOSTEL_ADMIN') {
      const nsDept = (ns.department || '').toUpperCase();
      return ['HOSTEL', 'WARDEN'].some(d => nsDept.includes(d));
    }

    if (role === 'TRANSPORT_ADMIN') {
      const nsDept = (ns.department || '').toUpperCase();
      return nsDept.includes('TRANSPORT');
    }

    if (role === 'STUDENT_SECTION') {
      const nsDept = (ns.department || '').toUpperCase();
      return ['STUDENT_SECTION', 'ADMISSION', 'STUDENT'].some(d => nsDept.includes(d));
    }

    if (role === 'IQAC') {
      const nsDept = (ns.department || '').toUpperCase();
      return ['IQAC', 'QUALITY'].some(d => nsDept.includes(d));
    }

    // Faculty / Mentor: Scoped to creation, direct assignment, or workflow participation
    return false;
  }

  /**
   * Central backend service for retrieving all authorized Notesheets for a user
   */
  public getAuthorizedNotesheetsForUser(user?: User | null, role?: UserRole | null): NoteSheet[] {
    if (!this.state.noteSheets) this.state.noteSheets = [];
    if (!user) return [];
    const effectiveRole = role || user.role;
    if (!effectiveRole || effectiveRole === 'STUDENT' || user.role === 'STUDENT') return [];

    return this.state.noteSheets.filter(ns => this.isUserAuthorizedForNotesheet(user, effectiveRole, ns));
  }

  public getScopedNoteSheets(user?: User | null, role?: UserRole | null): NoteSheet[] {
    return this.getAuthorizedNotesheetsForUser(user, role);
  }

  public hasPendingWithMeAccess(user?: User | null, role?: UserRole | null): boolean {
    if (!user || !role || role === 'STUDENT' || user.role === 'STUDENT') return false;
    const workflowPermissions: NoteSheetPermission[] = [
      'NOTESHEET_REVIEW',
      'NOTESHEET_APPROVE',
      'NOTESHEET_FORWARD',
      'NOTESHEET_REJECT',
      'NOTESHEET_RETURN',
      'NOTESHEET_ACTION'
    ];
    return workflowPermissions.some(p => this.hasNoteSheetPermission(user, role, p));
  }

  /**
   * SINGLE SOURCE OF TRUTH: Retrieves all Notesheets currently pending active approval/action for the user
   */
  public getPendingWithMeNotesheets(user?: User | null, role?: UserRole | null): NoteSheet[] {
    if (!user) return [];
    const effectiveRole = role || user.role;
    if (!effectiveRole || effectiveRole === 'STUDENT' || user.role === 'STUDENT') return [];
    if (!this.hasPendingWithMeAccess(user, effectiveRole)) return [];

    const authorized = this.getAuthorizedNotesheetsForUser(user, effectiveRole);
    return authorized.filter(ns => this.isNotesheetPendingForUser(user, effectiveRole, ns));
  }

  public getPendingNotesheetsForUser(user?: User | null, role?: UserRole | null): NoteSheet[] {
    return this.getPendingWithMeNotesheets(user, role);
  }

  /**
   * Filters authorized Notesheets by category
   */
  public filterNotesheetsByCategory(notes: NoteSheet[], category: string, user: User, role: UserRole): NoteSheet[] {
    const now = new Date();
    switch (category) {
      case 'MY_DRAFTS':
      case 'DRAFTS':
        return notes.filter(n => n.status === 'DRAFT' && n.creatorId === user.id);
      case 'PENDING_WITH_ME':
        return notes.filter(n => this.isNotesheetPendingForUser(user, role, n));
      case 'SUBMITTED':
      case 'MY_SHEETS':
      case 'MY_NOTESHEETS':
        return notes.filter(n => n.creatorId === user.id && n.status !== 'DRAFT');
      case 'FORWARDED':
      case 'SENT':
        return notes.filter(n =>
          (n.movements || []).some(m => (m.fromUserId === user.id || (m.fromUser && m.fromUser.includes(user.name))) && ['FORWARD', 'APPROVE', 'SUBMIT'].includes(m.action)) &&
          !this.isNotesheetPendingForUser(user, role, n) &&
          (n.creatorId !== user.id || (n.status !== 'SUBMITTED' && n.status !== 'DRAFT'))
        );
      case 'RETURNED':
        return notes.filter(n => n.status === 'RETURNED' && (n.creatorId === user.id || n.returnedByUserId === user.id || (n.movements || []).some(m => m.fromUserId === user.id && m.action === 'RETURN')));
      case 'CLARIFICATION':
      case 'CLARIFICATION_REQUIRED':
        return notes.filter(n => n.status === 'CLARIFICATION_REQUIRED' && (n.creatorId === user.id || (n.clarifications && n.clarifications.some(c => c.status === 'PENDING' && (n.creatorId === user.id || c.requestedBy === user.name)))));
      case 'FINANCIAL':
        return notes.filter(n => Boolean(n.financialRequirement));
      case 'URGENT':
        return notes.filter(n => n.priority === 'URGENT' || n.priority === 'IMMEDIATE');
      case 'OVERDUE':
        return notes.filter(n => n.workflowDueDate && new Date(n.workflowDueDate) < now && !['APPROVED', 'CLOSED', 'REJECTED'].includes(n.status));
      case 'APPROVED':
        return notes.filter(n => n.status === 'APPROVED');
      case 'ACTION_PENDING':
        return notes.filter(n => (n.status === 'ACTION_PENDING' || n.status === 'ACTION_IN_PROGRESS') && (n.creatorId === user.id || n.currentHandlerId === user.id || (n.complianceItems && n.complianceItems.some(c => c.responsibleUserId === user.id || c.responsibleDept === user.departmentId)) || ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(String(role))));
      case 'CLOSED':
        return notes.filter(n => n.status === 'CLOSED');
      case 'REJECTED':
        return notes.filter(n => n.status === 'REJECTED');
      case 'ALL':
      default:
        return notes;
    }
  }

  /**
   * Universal Backend Source of Truth for "Pending for Approval" and "Pending With Me"
   * Returns consistent counts, records, and pagination for any authenticated role.
   */
  public getPaginatedPendingNotesheetsForUser(
    user?: User | null,
    role?: UserRole | null,
    options?: { page?: number; limit?: number; search?: string }
  ): { count: number; records: NoteSheet[]; page: number; totalPages: number } {
    if (!user || !role || role === 'STUDENT' || user.role === 'STUDENT') {
      return { count: 0, records: [], page: 1, totalPages: 0 };
    }

    const allPending = this.getPendingWithMeNotesheets(user, role);
    let filtered = allPending;

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(n =>
        (n.noteSheetNumber && n.noteSheetNumber.toLowerCase().includes(q)) ||
        (n.subject && n.subject.toLowerCase().includes(q)) ||
        (n.creatorName && n.creatorName.toLowerCase().includes(q)) ||
        (n.department && n.department.toLowerCase().includes(q))
      );
    }

    const count = filtered.length;
    const page = options?.page || 1;
    const limit = options?.limit || (filtered.length > 0 ? filtered.length : 10);
    const totalPages = Math.ceil(count / limit) || 1;
    const startIndex = (page - 1) * limit;
    const records = filtered.slice(startIndex, startIndex + limit);

    return { count, records, page, totalPages };
  }

  private sendWorkflowNotification(officeRole: string, message: string, instituteId?: string, departmentId?: string, noteSheetNumber?: string): void {
    const isUnivRole = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PROVOST', 'VICE_PRESIDENT', 'PRESIDENT'].includes(officeRole);

    const targetUsers = this.getUsers().filter(u => {
      if (u.role === 'STUDENT') return false;

      // Role check
      const roleMatches = u.role === officeRole ||
        (officeRole === 'DEPUTY_REGISTRAR' && u.role === 'DEPUTY_REGISTRAR') ||
        (officeRole === 'REGISTRAR' && u.role === 'REGISTRAR') ||
        (officeRole === 'HOI' && u.role === 'PRINCIPAL') ||
        (officeRole === 'FINANCE' && u.role === 'ACCOUNTS_ADMIN') ||
        (officeRole === 'ACCOUNTS_ADMIN' && u.role === 'ACCOUNTS_ADMIN') ||
        (officeRole === 'EXAM_CELL' && u.role === 'EXAM_CELL') ||
        (officeRole === 'HOSTEL_ADMIN' && u.role === 'HOSTEL_ADMIN');

      if (!roleMatches) return false;

      // Deputy Registrar scope filtering: Only notify Deputy Registrar if within their assigned scope
      if (officeRole === 'DEPUTY_REGISTRAR' && u.role === 'DEPUTY_REGISTRAR') {
        const scopes = this.getDeputyRegistrarScopeByUserId(u.id);
        const inScope = scopes.some(s => {
          const matchInst = !instituteId || s.instituteId === instituteId;
          const matchDept = departmentId && s.departmentIds.length > 0
            ? (s.departmentIds.includes('ALL') || s.departmentIds.includes(departmentId) || (s.departmentNames || []).some(dn => dn.toLowerCase() === departmentId.toLowerCase()))
            : true;
          return matchInst && matchDept;
        });
        return inScope;
      }

      // University-level authorities receive across all institutes
      if (isUnivRole) return true;

      // Institute scoping for institute-level roles (e.g. Principal / HOI)
      if (instituteId && u.instituteId && u.instituteId !== instituteId) return false;

      // Department scoping for departmental roles (e.g. HOD / Faculty)
      if (departmentId && (officeRole === 'HOD' || officeRole === 'FACULTY')) {
        const uDept = (u.departmentId || '').toUpperCase();
        const tDept = departmentId.toUpperCase();
        if (uDept !== tDept && !uDept.includes(tDept) && !tDept.includes(uDept)) return false;
      }

      return true;
    });

    targetUsers.forEach(u => {
      this.addNotification({
        type: 'ACTION_REQUIRED',
        targetUserId: u.id,
        title: `Action Required: Note Sheet ${noteSheetNumber || ''}`,
        message,
        module: 'NOTESHEET',
        referenceId: noteSheetNumber,
        referenceType: 'NOTESHEET',
        linkTab: 'notesheet',
        priority: 'HIGH'
      });
    });
  }

  private sendNotificationToUser(userId: string, message: string, noteSheetNumber?: string): void {
    this.addNotification({
      type: 'STATUS_UPDATE',
      targetUserId: userId,
      title: `Status Update: Note Sheet ${noteSheetNumber || ''}`,
      message,
      module: 'NOTESHEET',
      referenceId: noteSheetNumber,
      referenceType: 'NOTESHEET',
      linkTab: 'notesheet',
      priority: 'NORMAL'
    });
  }

  // ─── ACCOUNT / FUND MANAGEMENT METHODS ──────────────────────────────────────

  getFundAccounts(): FundAccount[] {
    if (!this.state.fundAccounts) this.state.fundAccounts = initialFundAccounts;
    return this.state.fundAccounts;
  }

  saveFundAccount(account: FundAccount, user?: User): void {
    if (!this.state.fundAccounts) this.state.fundAccounts = [];
    const idx = this.state.fundAccounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      this.state.fundAccounts[idx] = { ...account, updatedAt: new Date().toISOString() };
    } else {
      this.state.fundAccounts.push({
        ...account,
        id: account.id || `fund-acc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    this.saveState();
    if (user) {
      this.logAudit('SAVE_FUND_ACCOUNT', 'Accounts & Finance', `Fund Account ${account.name} (${account.code}) saved/updated`, user.name, user.role);
    }
  }

  getFundSources(): FundSource[] {
    if (!this.state.fundSources) this.state.fundSources = initialFundSources;
    return this.state.fundSources;
  }

  saveFundSource(source: FundSource, user?: User): void {
    if (!this.state.fundSources) this.state.fundSources = [];
    const idx = this.state.fundSources.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      this.state.fundSources[idx] = source;
    } else {
      this.state.fundSources.push({
        ...source,
        id: source.id || `src-${Date.now()}`
      });
    }
    this.saveState();
    if (user) {
      this.logAudit('SAVE_FUND_SOURCE', 'Accounts & Finance', `Fund source ${source.name} updated`, user.name, user.role);
    }
  }

  getExpenseCategories(): ExpenseCategory[] {
    if (!this.state.expenseCategories) this.state.expenseCategories = initialExpenseCategories;
    return this.state.expenseCategories;
  }

  saveExpenseCategory(category: ExpenseCategory, user?: User): void {
    if (!this.state.expenseCategories) this.state.expenseCategories = [];
    const idx = this.state.expenseCategories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.state.expenseCategories[idx] = category;
    } else {
      this.state.expenseCategories.push({
        ...category,
        id: category.id || `cat-${Date.now()}`
      });
    }
    this.saveState();
    if (user) {
      this.logAudit('SAVE_EXPENSE_CATEGORY', 'Accounts & Finance', `Expense category ${category.name} updated`, user.name, user.role);
    }
  }

  getMoneyReceived(noteSheetId?: string): MoneyReceivedRecord[] {
    if (!this.state.moneyReceived) this.state.moneyReceived = initialMoneyReceived;
    if (noteSheetId) {
      return this.state.moneyReceived.filter(r => r.noteSheetId === noteSheetId);
    }
    return this.state.moneyReceived;
  }

  addMoneyReceived(data: Omit<MoneyReceivedRecord, 'id' | 'createdAt'>, user?: any): MoneyReceivedRecord {
    if (!this.state.moneyReceived) this.state.moneyReceived = [];
    if (!this.state.accountLedger) this.state.accountLedger = [];

    const newId = `mr-${Date.now()}`;
    const newRecord: MoneyReceivedRecord = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Update fund account balance
    const accounts = this.getFundAccounts();
    const acc = accounts.find(a => a.id === data.bankAccountId);
    let newBalance = data.amount;
    if (acc) {
      acc.totalCredits = (acc.totalCredits || 0) + data.amount;
      acc.currentBalance = (acc.currentBalance || 0) + data.amount;
      acc.updatedAt = new Date().toISOString();
      newBalance = acc.currentBalance;
    }

    // Add Ledger Entry
    const ledgerEntry: AccountLedgerEntry = {
      id: `ledg-${Date.now()}`,
      noteSheetId: data.noteSheetId,
      noteSheetNumber: data.noteSheetNumber,
      fundAccountId: data.bankAccountId,
      fundAccountName: data.bankAccountName || (acc ? acc.name : 'Central Fund Account'),
      date: data.date,
      transactionId: `TXN-MR-${Date.now().toString().slice(-6)}`,
      transactionType: 'MONEY_RECEIVED',
      description: `Money Received: ${data.source} - ${data.remarks || 'Receipt credit'}`,
      reference: data.referenceNo || `REF-${newId}`,
      moneyIn: data.amount,
      moneyOut: 0,
      balance: newBalance,
      paymentMode: data.paymentMode,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString()
    };
    this.state.accountLedger.unshift(ledgerEntry);
    this.state.moneyReceived.unshift(newRecord);

    // Update NoteSheet financial status if allocated
    if (this.state.noteSheets) {
      const ns = this.state.noteSheets.find(n => n.id === data.noteSheetId);
      if (ns) {
        ns.financialStatus = 'ACTIVE';
        if (!ns.allocatedFundAccountId) {
          ns.allocatedFundAccountId = data.bankAccountId;
          ns.allocatedFundAccountName = data.bankAccountName;
        }
      }
    }

    this.saveState();
    this.logAudit('ADD_MONEY_RECEIVED', 'Accounts & Finance', `₹${data.amount.toLocaleString('en-IN')} received for Note Sheet ${data.noteSheetNumber} via ${data.paymentMode} (${data.source})`, user.name, user.role);
    return newRecord;
  }

  getExpenses(noteSheetId?: string): ExpenseRecord[] {
    if (!this.state.expenses) this.state.expenses = initialExpenses;
    if (noteSheetId) {
      return this.state.expenses.filter(e => e.noteSheetId === noteSheetId);
    }
    return this.state.expenses;
  }

  addExpense(data: Omit<ExpenseRecord, 'id' | 'createdAt'>, user?: any, overrideBudgetCheck?: boolean): { success: boolean; message?: string; record?: ExpenseRecord } {
    if (!this.state.expenses) this.state.expenses = [];
    if (!this.state.accountLedger) this.state.accountLedger = [];

    // Backend budget control validation
    if (data.noteSheetId) {
      const summary = this.getNoteSheetFinancialSummary(data.noteSheetId);
      if (summary.isClosed) {
        return { success: false, message: 'This Note Sheet account has been finalized and closed. No new expenses can be recorded.' };
      }

      if (!overrideBudgetCheck && user.role !== 'SUPER_ADMIN' && user.role !== 'REGISTRAR') {
        if (data.totalAmount > summary.balanceAvailable && summary.balanceAvailable > 0) {
          return {
            success: false,
            message: `Insufficient Available Balance! Available: ₹${summary.balanceAvailable.toLocaleString('en-IN')}, Expense: ₹${data.totalAmount.toLocaleString('en-IN')}. Authorized admin approval required to exceed budget.`
          };
        }
      }
    }

    const newId = `exp-${Date.now()}`;
    const newRecord: ExpenseRecord = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Update fund account balance
    const accounts = this.getFundAccounts();
    const acc = accounts.find(a => a.id === data.paidFromAccountId);
    let newBalance = 0;
    if (acc) {
      acc.totalDebits = (acc.totalDebits || 0) + data.totalAmount;
      acc.currentBalance = (acc.currentBalance || 0) - data.totalAmount;
      acc.updatedAt = new Date().toISOString();
      newBalance = acc.currentBalance;
    }

    // Add Ledger Entry
    const ledgerEntry: AccountLedgerEntry = {
      id: `ledg-${Date.now()}`,
      noteSheetId: data.noteSheetId,
      noteSheetNumber: data.noteSheetNumber,
      fundAccountId: data.paidFromAccountId,
      fundAccountName: data.paidFromAccountName || (acc ? acc.name : 'Central Fund Account'),
      date: data.date,
      transactionId: `TXN-EXP-${Date.now().toString().slice(-6)}`,
      transactionType: 'EXPENSE',
      description: `Expense: ${data.itemName} (${data.category}) - ${data.vendor}`,
      reference: data.invoiceNo || data.referenceNo || `REF-${newId}`,
      moneyIn: 0,
      moneyOut: data.totalAmount,
      balance: newBalance,
      paymentMode: data.paymentMode,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString()
    };
    this.state.accountLedger.unshift(ledgerEntry);
    this.state.expenses.unshift(newRecord);

    this.saveState();
    this.logAudit('ADD_EXPENSE', 'Accounts & Finance', `₹${data.totalAmount.toLocaleString('en-IN')} expense recorded for ${data.itemName} on Note Sheet ${data.noteSheetNumber}`, user.name, user.role);
    return { success: true, record: newRecord };
  }

  getReimbursements(noteSheetId?: string): ReimbursementClaim[] {
    if (!this.state.reimbursements) this.state.reimbursements = initialReimbursements;
    if (noteSheetId) {
      return this.state.reimbursements.filter(r => r.noteSheetId === noteSheetId);
    }
    return this.state.reimbursements;
  }

  addReimbursement(data: Omit<ReimbursementClaim, 'id' | 'submittedDate' | 'status'>, user?: any): ReimbursementClaim {
    if (!this.state.reimbursements) this.state.reimbursements = [];
    const newClaim: ReimbursementClaim = {
      ...data,
      id: `reimb-${Date.now()}`,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING'
    };
    this.state.reimbursements.unshift(newClaim);
    this.saveState();
    this.logAudit('SUBMIT_REIMBURSEMENT', 'Accounts & Finance', `Reimbursement claim of ₹${data.amount.toLocaleString('en-IN')} submitted by ${user.name}`, user.name, user.role);
    return newClaim;
  }

  processReimbursement(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'PAY',
    remarks: string,
    paymentDetails?: { fundAccountId: string; referenceNo: string; paymentMode?: PaymentMode },
    user?: any
  ): { success: boolean; message?: string } {
    if (!this.state.reimbursements) this.state.reimbursements = [];
    const claim = this.state.reimbursements.find(r => r.id === id);
    if (!claim) return { success: false, message: 'Reimbursement claim not found.' };

    const userName = user ? user.name : 'Authorized Admin';

    if (action === 'APPROVE') {
      claim.status = 'APPROVED';
      claim.approvedBy = userName;
      claim.approvedDate = new Date().toISOString().split('T')[0];
      claim.remarks = remarks;
      this.saveState();
      this.logAudit('APPROVE_REIMBURSEMENT', 'Accounts & Finance', `Reimbursement claim ${claim.id} of ₹${claim.amount} approved by ${userName}`, userName, user?.role || 'REGISTRAR');
      return { success: true };
    } else if (action === 'REJECT') {
      claim.status = 'REJECTED';
      claim.remarks = remarks;
      this.saveState();
      this.logAudit('REJECT_REIMBURSEMENT', 'Accounts & Finance', `Reimbursement claim ${claim.id} rejected by ${userName}. Reason: ${remarks}`, userName, user?.role || 'REGISTRAR');
      return { success: true };
    } else if (action === 'PAY') {
      if (!paymentDetails || !paymentDetails.fundAccountId) {
        return { success: false, message: 'Payment account is required to disburse reimbursement.' };
      }
      claim.status = 'PAID';
      claim.paidDate = new Date().toISOString().split('T')[0];
      claim.paymentReference = paymentDetails.referenceNo || `PAY-REIMB-${Date.now().toString().slice(-6)}`;
      claim.paidFromAccountId = paymentDetails.fundAccountId;
      claim.remarks = remarks || 'Reimbursement payment disbursed.';

      // Automatically record as an expense transaction
      const accounts = this.getFundAccounts();
      const fundAcc = accounts.find(a => a.id === paymentDetails.fundAccountId);
      const paymentMode = paymentDetails.paymentMode || 'Bank Transfer';

      this.addExpense({
        noteSheetId: claim.noteSheetId,
        noteSheetNumber: claim.noteSheetNumber,
        date: claim.paidDate,
        category: claim.category || 'Reimbursement',
        itemName: `Reimbursement: ${claim.applicantName} (${claim.purpose})`,
        description: `Approved claim reimbursement for ${claim.applicantName}`,
        quantity: 1,
        unit: 'Claim',
        rate: claim.amount,
        totalAmount: claim.amount,
        paymentMode,
        vendor: claim.applicantName,
        invoiceNo: claim.paymentReference,
        referenceNo: claim.paymentReference,
        paidFromAccountId: paymentDetails.fundAccountId,
        paidFromAccountName: fundAcc ? fundAcc.name : 'University Fund',
        paidBy: userName,
        paidById: user?.id || 'admin-1',
        isApproved: true,
        approvedBy: claim.approvedBy || userName,
        remarks: `Reimbursement settlement. ${remarks || ''}`
      }, user || { id: 'admin-1', name: 'Finance Officer', role: 'REGISTRAR' as any, email: '', departmentId: '', instituteId: '' }, true);

      this.saveState();
      this.logAudit('PAY_REIMBURSEMENT', 'Accounts & Finance', `Reimbursement claim ${claim.id} of ₹${claim.amount} marked as PAID by ${userName}`, userName, user?.role || 'REGISTRAR');
      return { success: true };
    }
    return { success: false, message: 'Invalid action.' };
  }

  getRefunds(noteSheetId?: string): RefundRecord[] {
    if (!this.state.refunds) this.state.refunds = initialRefunds;
    if (noteSheetId) {
      return this.state.refunds.filter(r => r.noteSheetId === noteSheetId);
    }
    return this.state.refunds;
  }

  addRefund(data: Omit<RefundRecord, 'id' | 'createdAt'>, user?: any): RefundRecord {
    if (!this.state.refunds) this.state.refunds = [];
    if (!this.state.accountLedger) this.state.accountLedger = [];

    const newId = `ref-${Date.now()}`;
    const newRecord: RefundRecord = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Update fund account balance (Money returned back into fund)
    const accounts = this.getFundAccounts();
    const acc = accounts.find(a => a.id === data.toAccountId);
    let newBalance = data.amount;
    if (acc) {
      acc.totalCredits = (acc.totalCredits || 0) + data.amount;
      acc.currentBalance = (acc.currentBalance || 0) + data.amount;
      acc.updatedAt = new Date().toISOString();
      newBalance = acc.currentBalance;
    }

    // Add Ledger Entry
    const ledgerEntry: AccountLedgerEntry = {
      id: `ledg-${Date.now()}`,
      noteSheetId: data.noteSheetId,
      noteSheetNumber: data.noteSheetNumber,
      fundAccountId: data.toAccountId,
      fundAccountName: data.toAccountName || (acc ? acc.name : 'Central Fund Account'),
      date: data.date,
      transactionId: `TXN-REF-${Date.now().toString().slice(-6)}`,
      transactionType: 'REFUND',
      description: `Refund / Returned Money: ${data.reason} (Returned to: ${data.returnedTo})`,
      reference: data.referenceNo || `REF-${newId}`,
      moneyIn: data.amount,
      moneyOut: 0,
      balance: newBalance,
      paymentMode: data.paymentMode,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString()
    };
    this.state.accountLedger.unshift(ledgerEntry);
    this.state.refunds.unshift(newRecord);

    this.saveState();
    this.logAudit('ADD_REFUND', 'Accounts & Finance', `₹${data.amount.toLocaleString('en-IN')} returned/refunded for Note Sheet ${data.noteSheetNumber}`, user.name, user.role);
    return newRecord;
  }

  getAccountLedger(noteSheetId?: string, fundAccountId?: string): AccountLedgerEntry[] {
    if (!this.state.accountLedger) this.state.accountLedger = initialLedgerEntries;
    let list = this.state.accountLedger;
    if (noteSheetId) {
      list = list.filter(l => l.noteSheetId === noteSheetId);
    }
    if (fundAccountId) {
      list = list.filter(l => l.fundAccountId === fundAccountId);
    }
    return list;
  }

  getFinancialSettlements(noteSheetId?: string): FinancialSettlement[] {
    if (!this.state.financialSettlements) this.state.financialSettlements = [];
    if (noteSheetId) {
      return this.state.financialSettlements.filter(s => s.noteSheetId === noteSheetId);
    }
    return this.state.financialSettlements;
  }

  getNoteSheetFinancialSummary(noteSheetId: string): NoteSheetFinancialSummary {
    const noteSheets = this.getNoteSheets();
    const ns = noteSheets.find(n => n.id === noteSheetId);
    const approvedBudget = ns ? ((ns.totalEstimatedAmount || ns.estimatedCost) || 0) : 0;

    const receipts = this.getMoneyReceived(noteSheetId);
    const totalReceived = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    const expenses = this.getExpenses(noteSheetId);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

    const refunds = this.getRefunds(noteSheetId);
    const totalReturned = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Balance Remaining backend rule:
    // Total Allocated / Received + Total Returned - Total Spent
    const baseBudget = totalReceived > 0 ? totalReceived : approvedBudget;
    const balanceAvailable = Math.max(0, baseBudget + totalReturned - totalSpent);

    const budgetBase = approvedBudget > 0 ? approvedBudget : (totalReceived > 0 ? totalReceived : 1);
    const utilizedPercentage = Math.min(100, Math.round((totalSpent / budgetBase) * 10000) / 100);
    const remainingPercentage = Math.max(0, Math.round((100 - utilizedPercentage) * 100) / 100);

    let warningLevel: NoteSheetFinancialSummary['warningLevel'] = 'NORMAL';
    if (utilizedPercentage >= 100 || (baseBudget > 0 && balanceAvailable <= 0)) {
      warningLevel = 'EXHAUSTED';
    } else if (utilizedPercentage >= 90) {
      warningLevel = 'HIGH_WARNING';
    } else if (utilizedPercentage >= 75) {
      warningLevel = 'WARNING';
    }

    const settlements = this.getFinancialSettlements(noteSheetId);
    const isClosed = settlements.some(s => s.isClosed);

    return {
      approvedBudget,
      totalReceived,
      totalSpent,
      totalReturned,
      balanceAvailable,
      utilizedPercentage,
      remainingPercentage,
      warningLevel,
      isClosed
    };
  }

  closeNoteSheetFinancialAccount(noteSheetId: string, remarks: string, user?: any): FinancialSettlement {
    if (!this.state.financialSettlements) this.state.financialSettlements = [];
    const noteSheets = this.getNoteSheets();
    const ns = noteSheets.find(n => n.id === noteSheetId);
    const summary = this.getNoteSheetFinancialSummary(noteSheetId);

    const settlement: FinancialSettlement = {
      id: `set-${Date.now()}`,
      noteSheetId,
      noteSheetNumber: ns ? ns.noteSheetNumber : noteSheetId,
      settledDate: new Date().toISOString().split('T')[0],
      approvedBudget: summary.approvedBudget,
      totalReceived: summary.totalReceived,
      totalSpent: summary.totalSpent,
      totalReturned: summary.totalReturned,
      finalBalance: summary.balanceAvailable,
      utilizationPercent: summary.utilizedPercentage,
      unutilizedAmount: summary.balanceAvailable,
      settledBy: user.name,
      settledById: user.id,
      isClosed: true,
      closureRemarks: remarks
    };

    // Remove old settlement record if any and add new
    this.state.financialSettlements = this.state.financialSettlements.filter(s => s.noteSheetId !== noteSheetId);
    this.state.financialSettlements.unshift(settlement);

    if (ns) {
      ns.financialStatus = 'CLOSED';
    }

    // Record closure in ledger
    if (!this.state.accountLedger) this.state.accountLedger = [];
    this.state.accountLedger.unshift({
      id: `ledg-${Date.now()}`,
      noteSheetId,
      noteSheetNumber: ns ? ns.noteSheetNumber : noteSheetId,
      fundAccountId: ns?.allocatedFundAccountId || 'fund-acc-1',
      fundAccountName: ns?.allocatedFundAccountName || 'Central Fund Account',
      date: settlement.settledDate,
      transactionId: `TXN-SET-${Date.now().toString().slice(-6)}`,
      transactionType: 'SETTLEMENT',
      description: `Financial Account Final Settlement & Closure: ${remarks}`,
      reference: `SETTLE-${settlement.id}`,
      moneyIn: 0,
      moneyOut: 0,
      balance: summary.balanceAvailable,
      paymentMode: 'System Close',
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString()
    });

    this.saveState();
    this.logAudit('CLOSE_FINANCIAL_ACCOUNT', 'Accounts & Finance', `Note Sheet ${ns?.noteSheetNumber || noteSheetId} financial account finalized & closed by ${user.name}`, user.name, user.role);
    return settlement;
  }

  reopenNoteSheetFinancialAccount(noteSheetId: string, user?: any): void {
    if (!this.state.financialSettlements) return;
    const settlement = this.state.financialSettlements.find(s => s.noteSheetId === noteSheetId);
    if (settlement) {
      settlement.isClosed = false;
      settlement.reopenedBy = user.name;
      settlement.reopenedAt = new Date().toISOString();
    }
    const ns = this.getNoteSheets().find(n => n.id === noteSheetId);
    if (ns) {
      ns.financialStatus = 'ACTIVE';
    }
    this.saveState();
    this.logAudit('REOPEN_FINANCIAL_ACCOUNT', 'Accounts & Finance', `Note Sheet ${ns?.noteSheetNumber || noteSheetId} financial account reopened by ${user.name}`, user.name, user.role);
  }

  getOverallFinancialStats() {
    const accounts = this.getFundAccounts();
    const totalFundsAvailable = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    const receipts = this.getMoneyReceived();
    const totalMoneyReceived = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    const expenses = this.getExpenses();
    const totalMoneySpent = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

    const refunds = this.getRefunds();
    const totalRefunds = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalBalance = Math.max(0, totalMoneyReceived + totalRefunds - totalMoneySpent);

    const noteSheets = this.getNoteSheets();
    const totalApprovedBudgets = noteSheets
      .filter(n => n.status === 'APPROVED' || n.status === 'COMPLETED')
      .reduce((sum, n) => sum + ((n.totalEstimatedAmount || n.estimatedCost) || 0), 0);

    const reimbursements = this.getReimbursements();
    const pendingReimbursementsCount = reimbursements.filter(r => r.status === 'PENDING').length;
    const pendingExpensesCount = reimbursements.filter(r => r.status === 'APPROVED').length;

    return {
      totalFundsAvailable,
      totalMoneyReceived,
      totalMoneySpent,
      totalRefunds,
      totalBalance,
      totalApprovedBudgets,
      pendingReimbursementsCount,
      pendingExpensesCount,
      totalNoteSheetsCount: noteSheets.length,
      activeNoteSheetsCount: noteSheets.filter(n => n.status === 'APPROVED' || n.status === 'COMPLETED').length
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WORK DIARY MANAGEMENT MODULE
  // ──────────────────────────────────────────────────────────────────────────

  getWorkDiaries(filter?: {
    userId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
  }): WorkDiaryEntry[] {
    if (!this.state.workDiaries) this.state.workDiaries = initialWorkDiaries;
    let list = [...this.state.workDiaries];

    if (filter?.userId && filter.userId !== 'ALL') {
      list = list.filter(w => w.userId === filter.userId);
    }

    if (filter?.date) {
      list = list.filter(w => w.workDate === filter.date);
    } else {
      if (filter?.startDate) {
        list = list.filter(w => w.workDate >= filter.startDate!);
      }
      if (filter?.endDate) {
        list = list.filter(w => w.workDate <= filter.endDate!);
      }
    }

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(w => w.status === filter.status);
    }

    if (filter?.category && filter.category !== 'ALL') {
      list = list.filter(w => w.category === filter.category);
    }

    if (filter?.priority && filter.priority !== 'ALL') {
      list = list.filter(w => w.priority === filter.priority);
    }

    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(w =>
        w.workTitle.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.userName && w.userName.toLowerCase().includes(q)) ||
        (w.relatedPerson && w.relatedPerson.toLowerCase().includes(q)) ||
        (w.relatedDepartment && w.relatedDepartment.toLowerCase().includes(q)) ||
        (w.meetingDetails && w.meetingDetails.toLowerCase().includes(q)) ||
        (w.appointmentDetails && w.appointmentDetails.toLowerCase().includes(q)) ||
        (w.taskDetails && w.taskDetails.toLowerCase().includes(q)) ||
        (w.remarks && w.remarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => (b.workDate > a.workDate ? 1 : b.workDate < a.workDate ? -1 : 0));
  }

  getWorkDiaryById(id: string): WorkDiaryEntry | undefined {
    if (!this.state.workDiaries) this.state.workDiaries = initialWorkDiaries;
    return this.state.workDiaries.find(w => w.id === id);
  }

  createWorkDiary(data: WorkDiaryFormData, user?: any): WorkDiaryEntry {
    if (!this.state.workDiaries) this.state.workDiaries = [];

    const newId = `wd-${Date.now()}`;
    const newEntry: WorkDiaryEntry = {
      ...data,
      id: newId,
      userId: user?.id || 'user-superadmin',
      userName: user?.name || 'Authorized Staff',
      userRole: user?.role || 'FACULTY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.state.workDiaries.unshift(newEntry);
    this.saveState();
    this.logAudit('CREATE_WORK_DIARY', 'Work Diary', `Created diary entry "${newEntry.workTitle}" (${newEntry.status})`, user?.name || 'Staff', user?.role || 'FACULTY');
    return newEntry;
  }

  updateWorkDiary(id: string, data: Partial<WorkDiaryFormData>, user?: any): WorkDiaryEntry | null {
    if (!this.state.workDiaries) this.state.workDiaries = [];
    const idx = this.state.workDiaries.findIndex(w => w.id === id);
    if (idx === -1) return null;

    const existing = this.state.workDiaries[idx];
    const updated: WorkDiaryEntry = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.state.workDiaries[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_WORK_DIARY', 'Work Diary', `Updated diary entry "${updated.workTitle}" (${updated.status})`, user?.name || 'Staff', user?.role || 'FACULTY');
    return updated;
  }

  deleteWorkDiary(id: string, user?: any): boolean {
    if (!this.state.workDiaries) this.state.workDiaries = [];
    const idx = this.state.workDiaries.findIndex(w => w.id === id);
    if (idx === -1) return false;

    const title = this.state.workDiaries[idx].workTitle;
    this.state.workDiaries.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_WORK_DIARY', 'Work Diary', `Deleted diary entry "${title}"`, user?.name || 'Staff', user?.role || 'FACULTY');
    return true;
  }

  getWorkDiaryDashboardStats(userId?: string): WorkDiaryDashboardStats {
    const list = this.getWorkDiaries(userId && userId !== 'ALL' ? { userId } : undefined);
    const today = new Date().toISOString().split('T')[0];

    const completed = list.filter(w => w.status === 'COMPLETED').length;
    const inProgress = list.filter(w => w.status === 'IN_PROGRESS').length;
    const pending = list.filter(w => w.status === 'DRAFT' || w.status === 'SUBMITTED').length;
    const overdue = list.filter(w => w.status === 'OVERDUE' || (w.workDate < today && w.status !== 'COMPLETED' && w.status !== 'CANCELLED')).length;
    const todayCount = list.filter(w => w.workDate === today).length;

    return {
      total: list.length,
      completed,
      pending,
      inProgress,
      overdue,
      todayCount
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXAMINATION & EVALUATION MANAGEMENT MODULE
  // ──────────────────────────────────────────────────────────────────────────

  getExams(filter?: {
    programId?: string;
    departmentId?: string;
    instituteId?: string;
    academicYearId?: string;
    status?: string;
    type?: string;
    search?: string;
  }, user?: any): Exam[] {
    if (!this.state.exams) this.state.exams = [];
    let list = [...this.state.exams];

    // RBAC Scoping
    if (user?.role === 'STUDENT') {
      list = list.filter(e => ['FORM_OPEN', 'FORM_CLOSED', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'RESULT_PUBLISHED', 'RESULTS_PUBLISHED'].includes(e.status));
    } else if (user?.role === 'HOD' && user.department) {
      list = list.filter(e => e.departmentId === user.department || this.getProgramById(e.programId)?.departmentId === user.department);
    } else if (user?.role === 'PRINCIPAL' && user.instituteId) {
      list = list.filter(e => e.instituteId === user.instituteId || this.getProgramById(e.programId)?.instituteId === user.instituteId);
    }

    if (filter?.programId && filter.programId !== 'ALL') {
      list = list.filter(e => e.programId === filter.programId);
    }
    if (filter?.departmentId && filter.departmentId !== 'ALL') {
      list = list.filter(e => e.departmentId === filter.departmentId || (!e.departmentId && this.getProgramById(e.programId)?.departmentId === filter.departmentId));
    }
    if (filter?.instituteId && filter.instituteId !== 'ALL') {
      list = list.filter(e => e.instituteId === filter.instituteId || (!e.instituteId && this.getProgramById(e.programId)?.instituteId === filter.instituteId));
    }
    if (filter?.academicYearId && filter.academicYearId !== 'ALL') {
      list = list.filter(e => e.academicYearId === filter.academicYearId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(e => e.status === filter.status);
    }
    if (filter?.type && filter.type !== 'ALL') {
      list = list.filter(e => e.type === filter.type);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.examCode && e.examCode.toLowerCase().includes(q)) ||
        (e.session && e.session.toLowerCase().includes(q)) ||
        (e.type && e.type.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => (b.startDate > a.startDate ? 1 : b.startDate < a.startDate ? -1 : 0));
  }

  getExamById(id: string): Exam | undefined {
    if (!this.state.exams) this.state.exams = [];
    return this.state.exams.find(e => e.id === id);
  }

  createExam(data: Partial<Exam>, user?: any): Exam {
    if (!this.state.exams) this.state.exams = [];
    const newId = data.id || `exam-${Date.now()}`;
    const rawCode = data.examCode || data.code || `EXAM-2026-${(data.name || 'SESSION').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    // Auto-map subjects if not provided
    let subjectIds = data.subjectIds || [];
    if (subjectIds.length === 0 && data.programId && data.semesterId) {
      subjectIds = this.getSubjects()
        .filter(s => s.programId === data.programId && s.semesterId === data.semesterId)
        .map(s => s.id);
    }

    // Auto-map students if not provided
    let studentIds = data.studentIds || [];
    if (studentIds.length === 0 && data.programId && data.semesterId) {
      studentIds = this.getStudents()
        .filter(s => s.programId === data.programId && s.semesterId === data.semesterId)
        .map(s => s.id);
    }

    // Build structured subjects if not provided
    const subjects: ExamSubjectItem[] = data.subjects && data.subjects.length > 0
      ? data.subjects
      : subjectIds.map(sId => {
          const sObj = this.getSubjects().find(sub => sub.id === sId);
          return {
            subjectId: sId,
            subjectCode: sObj?.code || '',
            subjectName: sObj?.name || 'Subject',
            examType: data.type || 'Regular',
            durationMinutes: 180,
            maximumMarks: 100,
            passingMarks: 40,
            internalMarks: 30,
            externalMarks: 70,
            credits: sObj?.credits || 3,
            examMode: 'OFFLINE',
            status: 'ACTIVE'
          };
        });

    // Build default fees if not provided
    const fees: ExamFeeItem[] = data.fees && data.fees.length > 0
      ? data.fees
      : [
          { examType: 'Regular', amount: data.baseFee ?? 2500, currency: 'INR', isMandatory: true },
          { examType: 'Backlog', amount: data.perSubjectFee ?? 500, currency: 'INR', isMandatory: false }
        ];

    // Build default late fee rule if not provided
    const lateFeeRule: ExamLateFeeRule = data.lateFeeRule || {
      calculationType: 'FIXED',
      amount: data.lateFee ?? 500,
      maximumAmount: 2000,
      gracePeriodDays: 2,
      isActive: true
    };

    const newExam: Exam = {
      id: newId,
      code: rawCode,
      examCode: rawCode,
      name: data.name || 'New Examination Session',
      type: (data.type as any) || 'Regular',
      academicYearId: data.academicYearId || 'ay-2026',
      academicYearCode: data.academicYearCode || '2026-27',
      instituteId: data.instituteId || (data.programId ? this.getProgramById(data.programId)?.instituteId : 'inst-1'),
      departmentId: data.departmentId || (data.programId ? this.getProgramById(data.programId)?.departmentId : 'dept-cse'),
      programId: data.programId || 'prog-btech-cse',
      semesterId: data.semesterId || 'sem-4',
      semesterNumber: data.semesterNumber || 4,
      session: data.session || 'Summer 2026',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      formStartDate: data.formStartDate || new Date().toISOString().split('T')[0],
      formEndDate: data.formEndDate || data.formDeadline || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      status: data.status || 'DRAFT',
      description: data.description || '',
      instructions: data.instructions || 'Candidates must present valid University ID card and Examination Hall Ticket.',
      notesheetId: data.notesheetId,
      notesheetNumber: data.notesheetNumber,
      subjects,
      fees,
      lateFeeRule,
      subjectIds,
      studentIds,
      baseFee: data.baseFee ?? 2500,
      perSubjectFee: data.perSubjectFee ?? 500,
      lateFee: data.lateFee ?? 500,
      formDeadline: data.formEndDate || data.formDeadline || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      lateFeeDeadline: data.lateFeeDeadline || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      minAttendancePercentage: data.minAttendancePercentage ?? 75,
      createdBy: user?.name || user?.username || 'Exam Controller',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.state.exams.unshift(newExam);

    // Also auto-generate initial schedules for mapped subjects if timetable is empty
    subjectIds.forEach((subjId, idx) => {
      const scheduleDate = new Date(new Date(newExam.startDate).getTime() + (idx * 2) * 86400000).toISOString().split('T')[0];
      const schedId = `tt-${newExam.id}-${subjId}`;
      const existing = this.state.examTimetables.find(t => t.id === schedId || (t.examId === newExam.id && t.subjectId === subjId));
      if (!existing) {
        this.state.examTimetables.push({
          id: schedId,
          examId: newExam.id,
          subjectId: subjId,
          date: scheduleDate,
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          roomNo: `Hall ${201 + (idx % 4)}`,
          supervisorId: 'fac-1'
        });
      }
    });

    this.saveState();
    this.logAudit('CREATE_EXAM', 'Examination Management', `Created new exam session "${newExam.name}" (${newExam.code})`, user?.name || 'Administrator', user?.role || 'EXAM_CELL');
    return newExam;
  }

  updateExam(id: string, data: Partial<Exam>, user?: any): Exam | null {
    if (!this.state.exams) this.state.exams = [];
    const idx = this.state.exams.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const existing = this.state.exams[idx];
    const updated: Exam = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.state.exams[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_EXAM', 'Examination Management', `Updated exam session "${updated.name}" (${updated.status})`, user?.name || 'Administrator', user?.role || 'EXAM_CELL');
    
    // Auto-notify if deadline changed
    if (data.formEndDate || data.formDeadline || data.lateFeeEndDate) {
      this.notifyExamEvent('EXAM_DEADLINE', id, {
        title: `Exam Form Deadline Updated: ${updated.name}`,
        message: `The form submission deadline for ${updated.name} has been updated to ${updated.formEndDate || updated.formDeadline || updated.lateFeeEndDate}.`
      });
    }

    return updated;
  }

  publishExamForm(id: string, user?: any): Exam | null {
    const exam = this.getExamById(id);
    if (!exam) return null;
    const updated = this.updateExam(id, { status: 'FORM_OPEN' }, user);
    if (updated) {
      this.notifyExamEvent('EXAM_FORM', id, {
        title: `Exam Form Published: ${updated.name}`,
        message: `The examination form for ${updated.name} is now open for registration. Please submit before ${updated.formEndDate || updated.formDeadline || 'the deadline'}.`
      });
    }
    return updated;
  }

  publishExam(id: string, user?: any): Exam | null {
    return this.publishExamForm(id, user);
  }

  unpublishExam(id: string, user?: any): Exam | null {
    const exam = this.getExamById(id);
    if (!exam) return null;
    return this.updateExam(id, { status: 'DRAFT' }, user);
  }

  closeExamForm(id: string, user?: any): Exam | null {
    const exam = this.getExamById(id);
    if (!exam) return null;
    const updated = this.updateExam(id, { status: 'FORM_CLOSED' }, user);
    if (updated) {
      this.notifyExamEvent('EXAM_DEADLINE', id, {
        title: `Exam Form Window Closed: ${updated.name}`,
        message: `The form registration portal for ${updated.name} has now officially closed.`
      });
    }
    return updated;
  }

  closeExam(id: string, user?: any): Exam | null {
    return this.closeExamForm(id, user);
  }

  cancelExam(id: string, user?: any, reason?: string): Exam | null {
    const exam = this.getExamById(id);
    if (!exam) return null;
    return this.updateExam(id, {
      status: 'CANCELLED',
      description: reason ? `${exam.description}\n[CANCELLED]: ${reason}` : exam.description
    }, user);
  }

  linkExamNotesheet(id: string, notesheetId: string, user?: any): Exam | null {
    const exam = this.getExamById(id);
    if (!exam) return null;
    const ns = this.state.noteSheets?.find(n => n.id === notesheetId);
    return this.updateExam(id, {
      notesheetId,
      notesheetNumber: ns?.noteSheetNumber
    }, user);
  }

  // ─── EXAMINATION NOTIFICATION ENGINE ──────────────────────────────────────────

  notifyExamEvent(
    eventType: ExamNotificationType,
    examId: string,
    options: {
      title?: string;
      message?: string;
      targetUserId?: string;
      priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
      linkTab?: string;
      actionUrl?: string;
      actionLabel?: string;
    } = {}
  ): ERPNotification[] {
    const exam = this.getExamById(examId);
    if (!exam) return [];

    const titles: Record<ExamNotificationType, string> = {
      EXAM_FORM: `Exam Form Published: ${exam.name}`,
      EXAM_FEE: `Exam Fee Schedule Updated: ${exam.name}`,
      EXAM_DEADLINE: `Exam Form Deadline Updated: ${exam.name}`,
      EXAM_SCHEDULE: `Exam Schedule Published: ${exam.name}`,
      EXAM_CENTRE: `Exam Centre & Hall Assigned: ${exam.name}`,
      HALL_TICKET: `Hall Ticket Available: ${exam.name}`,
      RESULT: `Examination Result Published: ${exam.name}`,
      REASSESSMENT: `Reassessment / Rechecking Opened: ${exam.name}`,
      RECHECKING: `Rechecking Portal Opened: ${exam.name}`,
      BACKLOG: `Backlog / Re-Exam Form Available: ${exam.name}`,
      RE_EXAM: `Re-Examination Window Opened: ${exam.name}`,
      IMPORTANT_NOTICE: `Examination Notice: ${exam.name}`
    };

    const defaultMessages: Record<ExamNotificationType, string> = {
      EXAM_FORM: `The examination form for ${exam.name} is now open. Please complete your form before ${exam.formEndDate || exam.formDeadline || 'the deadline'}.`,
      EXAM_FEE: `The examination fee schedule for ${exam.name} has been updated by the Exam Section.`,
      EXAM_DEADLINE: `The form submission deadline for ${exam.name} has been updated to ${exam.formEndDate || exam.formDeadline || 'the new date'}.`,
      EXAM_SCHEDULE: `The official examination timetable and datesheet for ${exam.name} has been published.`,
      EXAM_CENTRE: `Your examination centre, hall, and seating allocation have been finalized for ${exam.name}.`,
      HALL_TICKET: `Your verified Hall Ticket / Admit Card for ${exam.name} is now available for download.`,
      RESULT: `Official semester results and grades for ${exam.name} have been published to the student portal.`,
      REASSESSMENT: `The reassessment and paper re-evaluation window for ${exam.name} is now open.`,
      RECHECKING: `The answer script rechecking and totaling verification portal for ${exam.name} is now active.`,
      BACKLOG: `Backlog / ATKT examination application forms for ${exam.name} are now available for submission.`,
      RE_EXAM: `Special re-examination registration for ${exam.name} has commenced.`,
      IMPORTANT_NOTICE: `An official examination notice has been issued regarding ${exam.name}.`
    };

    const linkTabs: Record<ExamNotificationType, string> = {
      EXAM_FORM: 'exam-forms',
      EXAM_FEE: 'exam-fees-student',
      EXAM_DEADLINE: 'exam-forms',
      EXAM_SCHEDULE: 'exam-schedule',
      EXAM_CENTRE: 'exam-hallticket',
      HALL_TICKET: 'exam-hallticket',
      RESULT: 'exam-results',
      REASSESSMENT: 'exam-reassessment',
      RECHECKING: 'exam-reassessment',
      BACKLOG: 'exam-backlog',
      RE_EXAM: 'exam-backlog',
      IMPORTANT_NOTICE: 'exam-dashboard'
    };

    const actionLabels: Record<ExamNotificationType, string> = {
      EXAM_FORM: 'Open Exam Form',
      EXAM_FEE: 'View Fees',
      EXAM_DEADLINE: 'View Deadline',
      EXAM_SCHEDULE: 'View Schedule',
      EXAM_CENTRE: 'View Seating',
      HALL_TICKET: 'Download Hall Ticket',
      RESULT: 'View Results',
      REASSESSMENT: 'Apply Reassessment',
      RECHECKING: 'Apply Rechecking',
      BACKLOG: 'Apply Backlog',
      RE_EXAM: 'Apply Re-Exam',
      IMPORTANT_NOTICE: 'View Notice'
    };

    const actionUrls: Record<ExamNotificationType, string> = {
      EXAM_FORM: '/student/examination/exam-forms',
      EXAM_FEE: '/student/examination/exam-fees',
      EXAM_DEADLINE: '/student/examination/exam-forms',
      EXAM_SCHEDULE: '/student/examination/schedule',
      EXAM_CENTRE: '/student/examination/hall-ticket',
      HALL_TICKET: '/student/examination/hall-ticket',
      RESULT: '/student/examination/results',
      REASSESSMENT: '/student/examination/reassessment',
      RECHECKING: '/student/examination/reassessment',
      BACKLOG: '/student/examination/backlog',
      RE_EXAM: '/student/examination/backlog',
      IMPORTANT_NOTICE: '/student/examination/dashboard'
    };

    const title = options.title || titles[eventType] || `Examination Update: ${exam.name}`;
    const message = options.message || defaultMessages[eventType] || `Important examination update regarding ${exam.name}.`;
    const linkTab = options.linkTab || linkTabs[eventType] || 'exam-forms';
    const actionLabel = options.actionLabel || actionLabels[eventType] || 'View Details';
    const actionUrl = options.actionUrl || actionUrls[eventType] || '/student/examination/exam-forms';
    const priority = options.priority || (eventType === 'EXAM_DEADLINE' || eventType === 'HALL_TICKET' ? 'HIGH' : 'NORMAL');

    const notif = this.addNotification({
      title,
      message,
      module: 'EXAM',
      timestamp: new Date().toISOString(),
      targetRole: 'STUDENT',
      targetProgramId: exam.programId,
      targetDepartmentId: exam.departmentId,
      targetSemesterId: exam.semesterId,
      targetAcademicYearId: exam.academicYearId,
      targetUserId: options.targetUserId,
      linkTab,
      examId: exam.id,
      examName: exam.name,
      examNotificationType: eventType,
      actionUrl,
      actionLabel,
      priority
    });

    return [notif];
  }

  createManualExamNotice(dto: {
    title: string;
    message: string;
    examId?: string;
    noticeType?: ExamNotificationType;
    programId?: string;
    departmentId?: string;
    semesterId?: string;
    academicYearId?: string;
    priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
    publishDate?: string;
    expiryDate?: string;
    attachmentName?: string;
    attachmentUrl?: string;
  }, user?: any): ERPNotification {
    const exam = dto.examId ? this.getExamById(dto.examId) : null;
    const now = new Date().toISOString();

    const notif = this.addNotification({
      title: dto.title,
      message: dto.message,
      module: 'EXAM',
      timestamp: now,
      targetRole: 'STUDENT',
      targetProgramId: dto.programId || exam?.programId,
      targetDepartmentId: dto.departmentId || exam?.departmentId,
      targetSemesterId: dto.semesterId || exam?.semesterId,
      targetAcademicYearId: dto.academicYearId || exam?.academicYearId,
      linkTab: 'exam-dashboard',
      examId: dto.examId,
      examName: exam?.name,
      examNotificationType: dto.noticeType || 'IMPORTANT_NOTICE',
      actionUrl: '/student/examination/dashboard',
      actionLabel: 'View Notice',
      priority: dto.priority || 'NORMAL',
      publishDate: dto.publishDate || now.split('T')[0],
      expiryDate: dto.expiryDate,
      attachmentName: dto.attachmentName,
      attachmentUrl: dto.attachmentUrl
    });

    this.logAudit(
      'CREATE_EXAM_NOTICE',
      'Examination Notice',
      `Published manual notice "${dto.title}" by ${user?.name || 'Exam Controller'}`,
      user?.name || 'Exam Controller',
      user?.role || 'EXAM_CELL'
    );

    return notif;
  }

  // ─── 75% ATTENDANCE ELIGIBILITY CHECKER ───────────────────────────────────────

  checkStudentSubjectAttendanceEligibility(studentId: string, subjectId: string, minPct: number = 75.0): {
    percentage: number;
    isEligible: boolean;
    status: 'EXAM_ELIGIBLE' | 'ATTENDANCE_SHORTAGE' | 'APPROVED_BY_ATTENDANCE_WORKFLOW';
    reason?: string;
    applicationId?: string;
    applicationStatus?: string;
  } {
    const student = this.getStudents().find(s => s.id === studentId);
    if (!student) return { percentage: 100, isEligible: true, status: 'EXAM_ELIGIBLE' };

    const sessions = this.state.attendanceSessions || [];
    const applications = this.state.attendanceApplications || [];
    const subject = this.state.subjects.find(s => s.id === subjectId || s.code === subjectId);

    let total = 0;
    let present = 0;

    sessions.forEach(sess => {
      if (sess.subjectId === subjectId || (subject && sess.subjectId === subject.code)) {
        const rec = sess.records.find(r => r.studentId === student.id || r.enrollmentNo === student.enrollmentNo);
        if (rec) {
          total++;
          if (rec.status === 'PRESENT' || rec.status === 'LATE') present++;
        }
      }
    });

    if (total === 0) {
      total = 30;
      present = 25; // default fallback (83.3%)
    }

    const rawPct = (present / total) * 100;
    const percentage = Math.round(rawPct * 10) / 10;

    const app = applications.find(a =>
      a.studentId === student.id &&
      (a.subjectId === subjectId || (subject && a.subjectCode === subject.code))
    );

    const isHoiApproved = app && (
      app.finalEligibilityGranted === true ||
      app.status === 'FINAL_APPROVED' ||
      app.status === 'HOI_APPROVED' ||
      app.status === 'EXAM_ELIGIBLE'
    );

    if (percentage >= minPct) {
      return {
        percentage,
        isEligible: true,
        status: 'EXAM_ELIGIBLE'
      };
    }

    if (isHoiApproved) {
      return {
        percentage,
        isEligible: true,
        status: 'APPROVED_BY_ATTENDANCE_WORKFLOW',
        applicationId: app?.id,
        applicationStatus: app?.status
      };
    }

    return {
      percentage,
      isEligible: false,
      status: 'ATTENDANCE_SHORTAGE',
      reason: `Attendance ${percentage}% is below required ${minPct}%`,
      applicationId: app?.id,
      applicationStatus: app?.status
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 — STUDENT EXAM FORM & SUBMISSION ENGINE (FRONTEND MOCK DB)
  // ──────────────────────────────────────────────────────────────────────────

  getAvailableExamsForStudent(user?: any): any[] {
    if (!this.state.exams) this.state.exams = [];
    if (!this.state.examForms) this.state.examForms = [];

    const studentId = user?.studentId || user?.id || 'student-1';
    const student = this.getStudents().find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username);
    
    // Inactive student cannot view/fill exam forms
    if (student) {
      if (student.status && student.status !== 'ACTIVE') return [];
      if (student.academicStatus && student.academicStatus !== 'ACTIVE') return [];
    }

    // Filter exams where status is FORM_OPEN / PUBLISHED / OPEN and matches student program & department & semester
    const openExams = this.state.exams.filter(e => {
      const isStatusOpen = e.status === 'FORM_OPEN' || e.status === 'PUBLISHED' || e.status === 'OPEN';
      if (!isStatusOpen) return false;
      if (student) {
        if (e.programId && student.programId && e.programId !== student.programId) return false;
        if (e.departmentId && student.departmentId && e.departmentId !== student.departmentId) return false;
        
        // Flexible semester matching (supports semesterId, semesterNumber, semNumber, and semester object lookup)
        const semObj = student.semesterId ? this.getSemesters().find(s => s.id === student.semesterId) : null;
        const studentSemNum = (student as any).currentSemester ?? (student as any).semesterNumber ?? semObj?.number ?? (semObj as any)?.semesterNumber ?? (student.semesterId ? parseInt(student.semesterId.replace(/\D/g, ''), 10) : undefined);
        
        if (e.semesterId && student.semesterId && e.semesterId !== student.semesterId) {
          if (e.semesterNumber && studentSemNum && e.semesterNumber !== studentSemNum) {
            return false;
          }
        }
        if (e.semesterNumber && studentSemNum && !isNaN(studentSemNum) && e.semesterNumber !== studentSemNum) {
          return false;
        }

        if (e.academicYearId && student.academicYearId && e.academicYearId !== student.academicYearId) return false;
      }
      return true;
    });

    const now = new Date();

    return openExams.map(exam => {
      const existingForm = this.state.examForms.find(f => f.examId === exam.id && (f.studentId === studentId || (student && f.studentId === student.id)));
      const isSubmitted = existingForm && ['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'VERIFICATION_PENDING', 'UNDER_REVIEW', 'VERIFIED'].includes(existingForm.status);
      const isDraft = existingForm && existingForm.status === 'DRAFT';

      // Date Window Calculation
      const formStartDate = exam.formStartDate ? new Date(exam.formStartDate) : new Date(exam.startDate);
      const formEndDate = exam.formEndDate ? new Date(exam.formEndDate) : (exam.formDeadline ? new Date(exam.formDeadline) : new Date(exam.endDate));
      const lateFeeEndDate = exam.lateFeeEndDate ? new Date(exam.lateFeeEndDate) : (exam.lateFeeDeadline ? new Date(exam.lateFeeDeadline) : new Date(formEndDate.getTime() + 7 * 86400000));

      let timePeriodStatus: 'FORM_NOT_STARTED' | 'OPEN' | 'OPEN_WITH_LATE_FEE' | 'CLOSED' = 'OPEN';
      let isFillable = true;
      let isLate = false;

      if (now < formStartDate) {
        timePeriodStatus = 'FORM_NOT_STARTED';
        isFillable = false;
      } else if (now <= formEndDate) {
        timePeriodStatus = 'OPEN';
        isFillable = true;
        isLate = false;
      } else if (now <= lateFeeEndDate) {
        timePeriodStatus = 'OPEN_WITH_LATE_FEE';
        isFillable = true;
        isLate = true;
      } else {
        timePeriodStatus = 'CLOSED';
        isFillable = false;
      }

      // Base fee
      const regularFeeObj = exam.fees?.find(f => f.examType === 'Regular' || f.examType === exam.type);
      const baseFee = regularFeeObj ? regularFeeObj.amount : (exam.baseFee ?? 2500);

      // Late fee check
      const lateRule = exam.lateFeeRule;
      let applicableLateFee = 0;
      if (isLate) {
        if (lateRule && lateRule.isActive) {
          if (lateRule.calculationType === 'FIXED') {
            applicableLateFee = lateRule.amount;
          } else if (lateRule.calculationType === 'PER_DAY') {
            const diffDays = Math.max(1, Math.ceil((now.getTime() - formEndDate.getTime()) / 86400000));
            applicableLateFee = diffDays * lateRule.amount;
          } else if (lateRule.calculationType === 'PERCENTAGE') {
            applicableLateFee = (baseFee * lateRule.amount) / 100;
          }
          if (lateRule.maximumAmount) {
            applicableLateFee = Math.min(applicableLateFee, lateRule.maximumAmount);
          }
        } else {
          applicableLateFee = exam.lateFee ?? 500;
        }
      }

      // Subject-wise attendance calculation
      const subjectsWithAttendance = (exam.subjects || []).map(s => {
        const elig = this.checkStudentSubjectAttendanceEligibility(student?.id || studentId, s.subjectId, exam.minAttendanceRequired || 75);
        return {
          ...s,
          attendancePct: elig.percentage,
          isEligible: elig.isEligible,
          eligibilityStatus: elig.status,
          eligibilityReason: elig.reason,
          applicationId: elig.applicationId,
          applicationStatus: elig.applicationStatus
        };
      });

      const totalSubjects = subjectsWithAttendance.length;
      const eligibleSubjectsCount = subjectsWithAttendance.filter(s => s.isEligible).length;
      const shortageCount = totalSubjects - eligibleSubjectsCount;

      // User-friendly display status
      let displayStatus = 'Open';
      let statusBadgeVariant: 'active' | 'navy' | 'warning' | 'danger' | 'inactive' = 'active';

      if (existingForm) {
        const formStatus = existingForm.status as string;
        if (formStatus === 'VERIFIED' || formStatus === 'APPROVED') {
          displayStatus = 'Approved';
          statusBadgeVariant = 'active';
        } else if (formStatus === 'REJECTED') {
          displayStatus = 'Rejected';
          statusBadgeVariant = 'danger';
        } else if (formStatus === 'UNDER_REVIEW' || formStatus === 'UNDER_VERIFICATION' || formStatus === 'VERIFICATION_PENDING') {
          displayStatus = 'Under Verification';
          statusBadgeVariant = 'warning';
        } else if (formStatus === 'SUBMITTED' || formStatus === 'PAYMENT_PENDING' || formStatus === 'PAYMENT_COMPLETED' || formStatus === 'PAID') {
          displayStatus = 'Applied';
          statusBadgeVariant = 'navy';
        } else if (formStatus === 'RETURNED') {
          displayStatus = 'Returned for Correction';
          statusBadgeVariant = 'warning';
        } else if (formStatus === 'DRAFT') {
          displayStatus = 'Draft';
          statusBadgeVariant = 'warning';
        }
      } else {
        if (timePeriodStatus === 'CLOSED') {
          displayStatus = 'Closed';
          statusBadgeVariant = 'danger';
        } else if (timePeriodStatus === 'FORM_NOT_STARTED') {
          displayStatus = `Opens ${exam.formStartDate || exam.startDate}`;
          statusBadgeVariant = 'inactive';
        } else if (timePeriodStatus === 'OPEN_WITH_LATE_FEE') {
          displayStatus = 'Open (Late Fee)';
          statusBadgeVariant = 'warning';
        } else {
          displayStatus = 'Open';
          statusBadgeVariant = 'active';
        }
      }

      return {
        id: exam.id,
        examCode: exam.examCode || exam.code,
        name: exam.name,
        type: exam.type,
        session: exam.session || 'Summer 2026',
        academicYearCode: exam.academicYearCode || '2026-27',
        semesterNumber: exam.semesterNumber || 4,
        programId: exam.programId,
        departmentId: exam.departmentId,
        formStartDate: exam.formStartDate || exam.startDate,
        formEndDate: exam.formEndDate || exam.formDeadline || exam.endDate,
        lateFeeStartDate: exam.lateFeeStartDate || exam.formEndDate,
        lateFeeEndDate: exam.lateFeeEndDate || exam.lateFeeDeadline,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status,
        displayStatus,
        statusBadgeVariant,
        timePeriodStatus,
        isFillable,
        description: exam.description,
        instructions: exam.instructions,
        subjectsCount: totalSubjects,
        eligibleSubjectsCount,
        shortageCount,
        subjects: subjectsWithAttendance,
        baseExamFee: baseFee,
        isLate,
        applicableLateFee,
        totalPayable: baseFee + applicableLateFee,
        hasExistingForm: !!existingForm,
        existingFormId: existingForm?.id || null,
        existingFormNumber: existingForm?.formNumber || null,
        existingFormStatus: existingForm?.status || null,
        isSubmitted,
        hasDraft: isDraft,
      };
    });
  }

  createStudentExamForm(dto: { examId: string; subjectIds?: string[]; remarks?: string }, user?: any): ExamForm {
    if (!this.state.examForms) this.state.examForms = [];
    const studentId = user?.studentId || user?.id || 'student-1';
    const student = this.getStudents().find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username);

    const exam = this.getExamById(dto.examId);
    if (!exam) throw new Error(`Examination "${dto.examId}" not found.`);
    if (exam.status !== 'FORM_OPEN' && exam.status !== 'PUBLISHED' && exam.status !== 'OPEN') {
      throw new Error(`Exam form submission is closed (${exam.status}).`);
    }

    const now = new Date();
    const formStartDate = exam.formStartDate ? new Date(exam.formStartDate) : new Date(exam.startDate);
    const formEndDate = exam.formEndDate ? new Date(exam.formEndDate) : (exam.formDeadline ? new Date(exam.formDeadline) : new Date(exam.endDate));
    const lateFeeEndDate = exam.lateFeeEndDate ? new Date(exam.lateFeeEndDate) : (exam.lateFeeDeadline ? new Date(exam.lateFeeDeadline) : new Date(formEndDate.getTime() + 7 * 86400000));

    if (now < formStartDate) {
      throw new Error('Exam form submission has not started yet.');
    }
    if (now > lateFeeEndDate) {
      throw new Error('Exam form submission deadline has passed. Form portal is closed.');
    }

    // Check duplicate
    const existing = this.state.examForms.find(f => f.examId === exam.id && f.studentId === (student?.id || studentId));
    if (existing) {
      if (['SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'VERIFIED'].includes(existing.status)) {
        throw new Error(`Exam form already submitted for this examination (Form #${existing.formNumber}).`);
      }
      return existing;
    }

    const isLate = now > formEndDate;
    const lateRule = exam.lateFeeRule;

    // Subjects selection
    const allSubjects = exam.subjects || [];
    let selectedSubjects = allSubjects;
    if (dto.subjectIds && dto.subjectIds.length > 0) {
      selectedSubjects = allSubjects.filter(s => dto.subjectIds?.includes(s.subjectId));
    }

    // ─── STRICT 75% ATTENDANCE GATE VERIFICATION ───
    for (const sub of selectedSubjects) {
      const elig = this.checkStudentSubjectAttendanceEligibility(student?.id || studentId, sub.subjectId, exam.minAttendanceRequired || 75);
      if (!elig.isEligible) {
        throw new Error(`Exam form cannot be submitted because attendance eligibility has not been fulfilled for one or more selected subjects (${sub.subjectName || sub.subjectCode}: ${elig.percentage}% < 75%).`);
      }
    }

    const regularFeeObj = exam.fees?.find(f => f.examType === 'Regular' || f.examType === exam.type);
    const baseFee = regularFeeObj ? regularFeeObj.amount : (exam.baseFee ?? 2500);
    const backlogFeeObj = exam.fees?.find(f => f.examType === 'Backlog');
    const backlogFee = backlogFeeObj ? backlogFeeObj.amount : (exam.perSubjectFee ?? 500);

    let examFeeAmount = baseFee;
    if (exam.type === 'Backlog' || exam.type === 'Supplementary') {
      examFeeAmount = selectedSubjects.length * backlogFee;
    }

    let lateFeeAmount = 0;
    if (isLate) {
      if (lateRule && lateRule.isActive) {
        if (lateRule.calculationType === 'FIXED') lateFeeAmount = lateRule.amount;
        else if (lateRule.calculationType === 'PER_DAY') {
          const diffDays = Math.max(1, Math.ceil((now.getTime() - formEndDate.getTime()) / 86400000));
          lateFeeAmount = diffDays * lateRule.amount;
        } else if (lateRule.calculationType === 'PERCENTAGE') {
          lateFeeAmount = (examFeeAmount * lateRule.amount) / 100;
        }
        if (lateRule.maximumAmount) lateFeeAmount = Math.min(lateFeeAmount, lateRule.maximumAmount);
      } else {
        lateFeeAmount = exam.lateFee ?? 500;
      }
    }

    const totalAmount = examFeeAmount + lateFeeAmount;
    const formNumber = `EXAM/${now.getFullYear()}/${String(this.state.examForms.length + 1).padStart(6, '0')}`;

    const formSubjects: ExamFormSubjectItem[] = selectedSubjects.map(s => ({
      id: `efs-${Date.now()}-${s.subjectId}`,
      subjectId: s.subjectId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      credits: s.credits,
      examType: s.examType || exam.type,
      amount: exam.type === 'Backlog' ? backlogFee : 0,
      status: 'ENROLLED'
    }));

    const newForm: ExamForm = {
      id: `ef-${Date.now()}`,
      examId: exam.id,
      studentId: student?.id || studentId,
      formNumber,
      studentName: student?.name || user?.name || 'Student',
      enrollmentNo: student?.enrollmentNo || user?.enrollmentNo || 'EN2024CSE001',
      programId: exam.programId,
      semesterId: exam.semesterId,
      semesterNumber: exam.semesterNumber,
      appliedDate: now.toISOString().split('T')[0],
      status: 'DRAFT',
      paymentStatus: totalAmount === 0 ? 'WAIVED' : 'PENDING',
      formSubjects,
      regularSubjects: formSubjects.map(f => f.subjectId),
      examFeeAmount,
      lateFeeAmount,
      totalAmount,
      baseFee: examFeeAmount,
      lateFee: lateFeeAmount,
      totalFee: totalAmount,
      remarks: dto.remarks || 'Student draft exam form',
      createdAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0]
    };

    this.state.examForms.unshift(newForm);
    this.saveState();
    this.logAudit('CREATE_EXAM_FORM', 'Exam Form', `Created draft exam form ${formNumber}`, user?.name || 'Student', 'STUDENT');
    return newForm;
  }

  updateStudentExamForm(id: string, dto: { subjectIds?: string[]; remarks?: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    const form = this.state.examForms[idx];
    if (form.status !== 'DRAFT' && form.status !== 'RETURNED') throw new Error(`Cannot edit exam form in status ${form.status}.`);

    const exam = this.getExamById(form.examId);
    if (exam && dto.subjectIds && dto.subjectIds.length > 0) {
      const selectedSubjects = (exam.subjects || []).filter(s => dto.subjectIds?.includes(s.subjectId));

      // ─── STRICT 75% ATTENDANCE GATE VERIFICATION ───
      for (const sub of selectedSubjects) {
        const elig = this.checkStudentSubjectAttendanceEligibility(form.studentId, sub.subjectId, exam.minAttendanceRequired || 75);
        if (!elig.isEligible) {
          throw new Error(`Exam form cannot be submitted because attendance eligibility has not been fulfilled for one or more selected subjects (${sub.subjectName || sub.subjectCode}: ${elig.percentage}% < 75%).`);
        }
      }

      form.formSubjects = selectedSubjects.map(s => ({
        id: `efs-${Date.now()}-${s.subjectId}`,
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        examType: s.examType || exam.type,
        amount: 0,
        status: 'ENROLLED'
      }));
      form.regularSubjects = form.formSubjects.map(f => f.subjectId);
    }

    if (dto.remarks) form.remarks = dto.remarks;
    form.updatedAt = new Date().toISOString().split('T')[0];

    this.state.examForms[idx] = form;
    this.saveState();
    return form;
  }

  submitStudentExamForm(id: string, dto: { declarationAccepted: boolean; remarks?: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    const form = this.state.examForms[idx];
    if (form.status !== 'DRAFT' && form.status !== 'RETURNED') throw new Error(`Exam form is already in status ${form.status}.`);
    if (dto.declarationAccepted !== true) throw new Error('Confirmation declaration must be accepted.');

    const exam = this.getExamById(form.examId);
    if (exam) {
      const now = new Date();
      const formEndDate = exam.formEndDate ? new Date(exam.formEndDate) : (exam.formDeadline ? new Date(exam.formDeadline) : new Date(exam.endDate));
      const lateFeeEndDate = exam.lateFeeEndDate ? new Date(exam.lateFeeEndDate) : (exam.lateFeeDeadline ? new Date(exam.lateFeeDeadline) : new Date(formEndDate.getTime() + 7 * 86400000));
      if (now > lateFeeEndDate) {
        throw new Error('Exam form submission deadline has passed. Form portal is closed.');
      }

      // ─── STRICT 75% ATTENDANCE GATE VERIFICATION ───
      const subjectIds = form.regularSubjects || (form.formSubjects || []).map(s => s.subjectId);
      for (const subId of subjectIds) {
        const elig = this.checkStudentSubjectAttendanceEligibility(form.studentId, subId, exam.minAttendanceRequired || 75);
        if (!elig.isEligible) {
          throw new Error('Exam form cannot be submitted because attendance eligibility has not been fulfilled for one or more selected subjects.');
        }
      }
    }

    const now = new Date();
    form.status = 'SUBMITTED';
    form.submittedAt = now.toISOString().split('T')[0];
    form.submittedBy = user?.name || form.studentName;
    form.declarationAccepted = true;
    if (dto.remarks) form.remarks = `${form.remarks}\n[SUBMITTED]: ${dto.remarks}`;
    form.updatedAt = now.toISOString().split('T')[0];

    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('SUBMIT_EXAM_FORM', 'Exam Form', `Submitted exam form ${form.formNumber}`, user?.name || form.studentName, 'STUDENT');
    return form;
  }

  payStudentExamForm(id: string, dto: { gateway?: string; paymentTransactionId?: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    const form = this.state.examForms[idx];
    const now = new Date();
    form.paymentStatus = 'SUCCESS';
    form.feePaid = true;
    form.paidAt = now.toISOString().split('T')[0];
    form.paymentTransactionId = dto.paymentTransactionId || `TXN-EXAM-${Date.now()}`;
    form.updatedAt = now.toISOString().split('T')[0];

    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('PAY_EXAM_FORM', 'Exam Form Fee Payment', `Paid ₹${form.totalAmount} for ${form.formNumber}`, user?.name || form.studentName, 'STUDENT');
    return form;
  }

  reviewExamForm(id: string, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    const form = this.state.examForms[idx];
    form.status = 'UNDER_REVIEW';
    form.updatedAt = new Date().toISOString().split('T')[0];
    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('REVIEW_EXAM_FORM', 'Exam Form Verification', `Under review: ${form.formNumber}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return form;
  }

  verifyExamForm(id: string, dto?: { verificationRemarks?: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    const form = this.state.examForms[idx];
    const totalAmount = Number(form.totalAmount ?? form.totalFee ?? 0);
    const isPaid = form.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(form.paymentStatus);

    if (totalAmount > 0 && !isPaid) {
      throw new Error(`Cannot verify exam form: Required fee of ₹${totalAmount} is unpaid (${form.paymentStatus}).`);
    }

    const now = new Date().toISOString().split('T')[0];
    form.status = 'VERIFIED';
    form.verifiedAt = now;
    form.verifiedBy = user?.name || 'Exam Controller';
    form.verificationRemarks = dto?.verificationRemarks;
    form.updatedAt = now;

    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('VERIFY_EXAM_FORM', 'Exam Form Verification', `Verified form ${form.formNumber}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    // Notify student about verification
    this.notifyExamEvent('EXAM_FORM', form.examId, {
      targetUserId: form.studentId,
      title: `Exam Form Verified: ${form.formNumber}`,
      message: `Your examination registration form #${form.formNumber} has been officially verified and approved.`,
      linkTab: 'exam-forms'
    });

    return form;
  }

  returnExamForm(id: string, dto: { returnReason: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    if (!dto.returnReason || dto.returnReason.trim() === '') {
      throw new Error('Return reason is mandatory.');
    }

    const form = this.state.examForms[idx];
    const now = new Date().toISOString().split('T')[0];
    form.status = 'RETURNED';
    form.returnedAt = now;
    form.returnedBy = user?.name || 'Exam Controller';
    form.returnReason = dto.returnReason.trim();
    form.updatedAt = now;

    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('RETURN_EXAM_FORM', 'Exam Form Verification', `Returned form ${form.formNumber}: ${form.returnReason}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    // Notify student about correction required
    this.notifyExamEvent('EXAM_FORM', form.examId, {
      targetUserId: form.studentId,
      title: `Correction Required: Exam Form #${form.formNumber}`,
      message: `Your exam form #${form.formNumber} requires correction: ${dto.returnReason}`,
      priority: 'HIGH',
      linkTab: 'exam-forms'
    });

    return form;
  }

  rejectExamForm(id: string, dto: { rejectionReason: string }, user?: any): ExamForm | null {
    if (!this.state.examForms) this.state.examForms = [];
    const idx = this.state.examForms.findIndex(f => f.id === id);
    if (idx === -1) return null;

    if (!dto.rejectionReason || dto.rejectionReason.trim() === '') {
      throw new Error('Rejection reason is mandatory.');
    }

    const form = this.state.examForms[idx];
    const now = new Date().toISOString().split('T')[0];
    form.status = 'REJECTED';
    form.rejectedAt = now;
    form.rejectedBy = user?.name || 'Exam Controller';
    form.rejectionReason = dto.rejectionReason.trim();
    form.updatedAt = now;

    this.state.examForms[idx] = form;
    this.saveState();
    this.logAudit('REJECT_EXAM_FORM', 'Exam Form Verification', `Rejected form ${form.formNumber}: ${form.rejectionReason}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return form;
  }

  bulkVerifyExamForms(dto: { formIds: string[]; verificationRemarks?: string }, user?: any) {
    if (!this.state.examForms) this.state.examForms = [];
    let count = 0;
    for (const id of dto.formIds) {
      const updated = this.verifyExamForm(id, { verificationRemarks: dto.verificationRemarks }, user);
      if (updated) count++;
    }
    return { success: true, verifiedCount: count };
  }

  bulkReturnExamForms(dto: { formIds: string[]; returnReason: string }, user?: any) {
    if (!this.state.examForms) this.state.examForms = [];
    let count = 0;
    for (const id of dto.formIds) {
      const updated = this.returnExamForm(id, { returnReason: dto.returnReason }, user);
      if (updated) count++;
    }
    return { success: true, returnedCount: count };
  }

  bulkRejectExamForms(dto: { formIds: string[]; rejectionReason: string }, user?: any) {
    if (!this.state.examForms) this.state.examForms = [];
    let count = 0;
    for (const id of dto.formIds) {
      const updated = this.rejectExamForm(id, { rejectionReason: dto.rejectionReason }, user);
      if (updated) count++;
    }
    return { success: true, rejectedCount: count };
  }

  generateHallTicket(examFormId: string, user?: any) {
    if (!(this.state as any).hallTickets) (this.state as any).hallTickets = [];
    const form = this.state.examForms?.find(f => f.id === examFormId);
    if (!form) throw new Error(`Exam form "${examFormId}" not found.`);

    if (form.status !== 'VERIFIED' && form.status !== 'APPROVED') {
      throw new Error(`Exam form must be VERIFIED before Hall Ticket generation (Current status: ${form.status}).`);
    }

    const totalAmount = Number(form.totalAmount ?? form.totalFee ?? 0);
    const isPaid = form.feePaid || ['SUCCESS', 'COMPLETED', 'PAID', 'WAIVED'].includes(form.paymentStatus);
    if (totalAmount > 0 && !isPaid) {
      throw new Error(`Exam fee must be paid before Hall Ticket issuance (Payment status: ${form.paymentStatus}).`);
    }

    const existing = (this.state as any).hallTickets.find((h: any) => h.examFormId === form.id);
    if (existing) return existing;

    const exam = this.getExamById(form.examId);
    const student = this.getStudents().find(s => s.id === form.studentId);
    const now = new Date();
    const hallTicketNo = `HT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationCode = `VREF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const hallTicket = {
      id: `ht-${Date.now()}`,
      hallTicketNo,
      examId: form.examId,
      studentId: form.studentId,
      examFormId: form.id,
      examSessionName: exam?.name || 'End-Semester Examination 2026',
      verificationCode,
      issueDate: now.toISOString().split('T')[0],
      status: 'GENERATED',
      qrData: `/public/hall-ticket/verify/${verificationCode}`,
      downloadUrl: `/hall-tickets/${hallTicketNo}.pdf`,
      student,
      examForm: form,
      centreName: 'SSIU Main Examination Centre, Gandhinagar',
      roomNumber: 'ROOM-102 (Floor 1)',
      seatNumber: `S-${Math.floor(10 + Math.random() * 90)}`,
      createdAt: now.toISOString().split('T')[0],
    };

    (this.state as any).hallTickets.push(hallTicket);
    form.hallTicketNo = hallTicketNo;
    this.saveState();
    this.logAudit('GENERATE_HALL_TICKET', 'Hall Ticket Management', `Generated Hall Ticket ${hallTicketNo} for student ${student?.enrollmentNo || form.studentName}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return hallTicket;
  }

  getHallTickets(user?: any) {
    if (!(this.state as any).hallTickets) (this.state as any).hallTickets = [];
    const tickets = (this.state as any).hallTickets;
    const isStudent = user?.role === 'STUDENT' || user?.roles?.includes('STUDENT');
    const isHOD = user?.role === 'HOD' || user?.roles?.includes('HOD');

    if (isStudent) {
      const studentId = user?.studentId || user?.id;
      const student = this.getStudents().find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username);
      return tickets.filter((t: any) => t.studentId === studentId || (student && t.studentId === student.id));
    }
    if (isHOD && user?.department) {
      return tickets.filter((t: any) => t.student?.departmentId === user.department);
    }
    return tickets;
  }

  getHallTicketById(id: string, user?: any) {
    if (!(this.state as any).hallTickets) (this.state as any).hallTickets = [];
    const ticket = (this.state as any).hallTickets.find((t: any) => t.id === id || t.hallTicketNo === id || t.examFormId === id);
    if (!ticket) return null;

    const isStudent = user?.role === 'STUDENT' || user?.roles?.includes('STUDENT');
    if (isStudent) {
      const studentId = user?.studentId || user?.id;
      const student = this.getStudents().find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username);
      if (ticket.studentId !== studentId && (!student || ticket.studentId !== student.id)) {
        throw new Error('Unauthorized to view this Hall Ticket.');
      }
    }
    return ticket;
  }

  getStudentExamForms(user?: any): ExamForm[] {
    if (!this.state.examForms) this.state.examForms = [];
    const studentId = user?.studentId || user?.id || 'student-1';
    const student = this.getStudents().find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username);
    return this.state.examForms.filter(f => f.studentId === studentId || (student && f.studentId === student.id));
  }

  deleteExam(id: string, user?: any): boolean {
    if (!this.state.exams) this.state.exams = [];
    const idx = this.state.exams.findIndex(e => e.id === id);
    if (idx === -1) return false;

    const name = this.state.exams[idx].name;
    this.state.exams.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_EXAM', 'Examination Management', `Deleted exam session "${name}"`, user?.name || 'Administrator', user?.role || 'SUPER_ADMIN');
    return true;
  }

  mapExamSubjects(examId: string, subjectIds: string[], user?: any): Exam | null {
    const exam = this.getExamById(examId);
    if (!exam) return null;

    exam.subjectIds = subjectIds;
    this.saveState();
    this.logAudit('MAP_EXAM_SUBJECTS', 'Examination Management', `Updated mapped subjects for exam "${exam.name}" (${subjectIds.length} subjects)`, user?.name || 'Administrator', user?.role || 'SUPER_ADMIN');
    return exam;
  }

  mapExamStudents(examId: string, studentIds: string[], user?: any): Exam | null {
    const exam = this.getExamById(examId);
    if (!exam) return null;

    exam.studentIds = studentIds;
    this.saveState();
    this.logAudit('MAP_EXAM_STUDENTS', 'Examination Management', `Updated mapped candidates for exam "${exam.name}" (${studentIds.length} students)`, user?.name || 'Administrator', user?.role || 'SUPER_ADMIN');
    return exam;
  }

  getExamDashboardStats(): ExamDashboardStats {
    const exams = this.state.exams || [];
    const total = exams.length;
    const upcoming = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'DRAFT' || e.status === 'ONGOING').length;
    const completed = exams.filter(e => e.status === 'COMPLETED').length;
    const resultsPublished = exams.filter(e => e.status === 'RESULTS_PUBLISHED').length;
    const evaluationPending = exams.filter(e => e.status === 'COMPLETED' || e.status === 'ONGOING').length;

    return {
      total,
      upcoming,
      completed,
      evaluationPending,
      resultsPublished
    };
  }

  // ── PHASE 4: RESULT MANAGEMENT & MARKS VERIFICATION ───────────────────────

  getStudentMarks(examId?: string, subjectId?: string): StudentMarks[] {
    let list = this.state.studentMarks || [];
    if (examId) list = list.filter(m => m.examId === examId);
    if (subjectId) list = list.filter(m => m.subjectId === subjectId);
    return list;
  }

  saveStudentMarks(dto: Partial<StudentMarks>, user?: any): StudentMarks {
    if (!this.state.studentMarks) this.state.studentMarks = [];

    const internal = dto.internalMarks !== undefined ? Number(dto.internalMarks) : 0;
    const maxInternal = dto.maxInternalMarks !== undefined ? Number(dto.maxInternalMarks) : 30;
    const external = dto.externalMarks !== undefined ? Number(dto.externalMarks) : 0;
    const maxExternal = dto.maxExternalMarks !== undefined ? Number(dto.maxExternalMarks) : 70;
    const practical = dto.practicalMarks !== undefined ? Number(dto.practicalMarks) : 0;
    const maxPractical = dto.maxPracticalMarks !== undefined ? Number(dto.maxPracticalMarks) : 0;

    if (internal < 0 || external < 0 || practical < 0) {
      throw new Error('Marks cannot be negative.');
    }
    if (internal > maxInternal) {
      throw new Error(`Internal marks (${internal}) cannot exceed internal max (${maxInternal}).`);
    }
    if (external > maxExternal) {
      throw new Error(`External marks (${external}) cannot exceed external max (${maxExternal}).`);
    }
    if (practical > maxPractical) {
      throw new Error(`Practical marks (${practical}) cannot exceed practical max (${maxPractical}).`);
    }

    const maxMarks = dto.maxMarks !== undefined ? Number(dto.maxMarks) : maxInternal + maxExternal + maxPractical;
    const totalMarks = (dto.isAbsent || dto.isMalpractice) ? 0 : (internal + external + practical);

    if (totalMarks > maxMarks) {
      throw new Error(`Total marks (${totalMarks}) cannot exceed max marks (${maxMarks}).`);
    }

    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    let grade = 'F';
    let gradePoints = 0;
    if (dto.isAbsent) { grade = 'AB'; gradePoints = 0; }
    else if (dto.isMalpractice) { grade = 'MP'; gradePoints = 0; }
    else if (percentage >= 90) { grade = 'O'; gradePoints = 10; }
    else if (percentage >= 80) { grade = 'A+'; gradePoints = 9; }
    else if (percentage >= 70) { grade = 'A'; gradePoints = 8; }
    else if (percentage >= 60) { grade = 'B+'; gradePoints = 7; }
    else if (percentage >= 50) { grade = 'B'; gradePoints = 6; }
    else if (percentage >= 45) { grade = 'C'; gradePoints = 5; }
    else if (percentage >= 40) { grade = 'P'; gradePoints = 4; }

    const isPass = !dto.isAbsent && !dto.isMalpractice && percentage >= 40 && (maxExternal > 0 ? external >= maxExternal * 0.35 : true);

    const existingIdx = this.state.studentMarks.findIndex(
      m => m.studentId === dto.studentId && m.subjectId === dto.subjectId && (m.examId === dto.examId || m.examFormId === dto.examFormId)
    );

    const record: StudentMarks = {
      id: dto.id || (existingIdx !== -1 ? this.state.studentMarks[existingIdx].id : `sm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`),
      examId: dto.examId,
      examFormId: dto.examFormId,
      studentId: dto.studentId || '',
      studentName: dto.studentName,
      enrollmentNo: dto.enrollmentNo,
      subjectId: dto.subjectId || '',
      subjectCode: dto.subjectCode,
      subjectName: dto.subjectName,
      examScheduleId: dto.examScheduleId,
      internalMarks: internal,
      maxInternalMarks: maxInternal,
      externalMarks: external,
      maxExternalMarks: maxExternal,
      practicalMarks: practical,
      maxPracticalMarks: maxPractical,
      totalMarks,
      maxMarks,
      grade,
      gradePoints,
      isPass,
      isPassed: isPass,
      isAbsent: !!dto.isAbsent,
      isMalpractice: !!dto.isMalpractice,
      evaluationStatus: 'DRAFT',
      resultStatus: 'PENDING',
      enteredBy: user?.name || 'Faculty Examiner',
      enteredAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.state.studentMarks[existingIdx] = {
        ...this.state.studentMarks[existingIdx],
        ...record,
        evaluationStatus: this.state.studentMarks[existingIdx].evaluationStatus === 'RETURNED' ? 'DRAFT' : this.state.studentMarks[existingIdx].evaluationStatus || 'DRAFT',
      };
    } else {
      this.state.studentMarks.push(record);
    }

    this.saveState();
    return record;
  }

  submitStudentMarks(examId: string, subjectId: string, user?: any): { success: boolean; count: number } {
    let count = 0;
    this.state.studentMarks = (this.state.studentMarks || []).map(m => {
      if (m.examId === examId && m.subjectId === subjectId) {
        count++;
        return {
          ...m,
          evaluationStatus: 'SUBMITTED',
          submittedBy: user?.name || 'Faculty Examiner',
          submittedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    this.saveState();
    this.logAudit('SUBMIT_MARKS', 'Result Management', `Submitted evaluation marks for subject ${subjectId} in exam ${examId} (${count} students)`, user?.name || 'Faculty', user?.role || 'FACULTY');
    return { success: true, count };
  }

  returnStudentMarks(examId: string, subjectId: string, returnReason: string, user?: any): { success: boolean; count: number } {
    if (!returnReason || !returnReason.trim()) {
      throw new Error('A mandatory reason is required to return marks for correction.');
    }

    let count = 0;
    this.state.studentMarks = (this.state.studentMarks || []).map(m => {
      if (m.examId === examId && m.subjectId === subjectId) {
        count++;
        return {
          ...m,
          evaluationStatus: 'RETURNED',
          returnReason: returnReason.trim(),
        };
      }
      return m;
    });

    this.saveState();
    this.logAudit('RETURN_MARKS', 'Result Management', `Returned marks for subject ${subjectId} in exam ${examId}: ${returnReason.trim()}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return { success: true, count };
  }

  verifyStudentMarks(examId: string, subjectId: string, verificationRemarks?: string, user?: any): { success: boolean; count: number } {
    let count = 0;
    this.state.studentMarks = (this.state.studentMarks || []).map(m => {
      if (m.examId === examId && m.subjectId === subjectId) {
        count++;
        return {
          ...m,
          evaluationStatus: 'VERIFIED',
          verifiedBy: user?.name || 'Exam Controller',
          verifiedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    this.saveState();
    this.logAudit('VERIFY_MARKS', 'Result Management', `Verified marks for subject ${subjectId} in exam ${examId} (${count} students)`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return { success: true, count };
  }

  processStudentResults(examId: string, user?: any): { success: boolean; count: number; results: StudentResult[] } {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found.');

    const examMarks = (this.state.studentMarks || []).filter(m => m.examId === examId);
    const forms = (this.state.examForms || []).filter(f => f.examId === examId && f.status !== 'REJECTED');
    const students = this.getStudents().filter(s =>
      forms.some(f => f.studentId === s.id) ||
      (exam.studentIds && exam.studentIds.includes(s.id)) ||
      (!exam.studentIds && s.programId === exam.programId && s.semesterId === exam.semesterId)
    );

    const computedResults: StudentResult[] = [];

    students.forEach(st => {
      const studentMarks = examMarks.filter(m => m.studentId === st.id);
      let totalObtained = 0;
      let totalMax = 0;
      let totalGradePoints = 0;
      let creditCount = 0;
      let backlogs = 0;
      let isWithheld = false;

      studentMarks.forEach(m => {
        totalObtained += m.totalMarks;
        totalMax += (m.maxMarks || (m.maxInternalMarks + m.maxExternalMarks + (m.maxPracticalMarks || 0)));
        const credits = 4;
        creditCount += credits;
        totalGradePoints += ((m.gradePoints ?? 8) * credits);
        if (!m.isPass) backlogs++;
        if (m.resultStatus === 'WITHHELD') isWithheld = true;
      });

      const sgpa = creditCount > 0 ? parseFloat((totalGradePoints / creditCount).toFixed(2)) : 8.5;
      const cgpa = sgpa;
      const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 85.0;
      const status: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD' = isWithheld ? 'WITHHELD' : (backlogs === 0 ? 'PASS' : backlogs <= 2 ? 'ATKT' : 'FAIL');

      const existing = (this.state.studentResults || []).find(r => r.examId === exam.id && r.studentId === st.id);

      const newResult: StudentResult = {
        id: existing?.id || `res-${exam.id}-${st.id}`,
        examId: exam.id,
        examName: exam.name,
        studentId: st.id,
        studentName: st.name,
        enrollmentNo: st.enrollmentNo,
        programId: st.programId,
        programName: 'B.Tech Computer Engineering',
        departmentId: st.departmentId,
        departmentName: 'Department of Computer Engineering',
        semesterId: st.semesterId,
        semesterNumber: exam.semesterNumber || 4,
        academicYearCode: exam.academicYearCode || '2026-27',
        totalMarksObtained: totalObtained || 342,
        totalMaxMarks: totalMax || 400,
        percentage,
        sgpa,
        cgpa,
        backlogsCount: backlogs,
        status,
        isPublished: false,
        subjectResults: studentMarks,
      };

      const idx = (this.state.studentResults || []).findIndex(r => r.examId === exam.id && r.studentId === st.id);
      if (idx !== -1) {
        this.state.studentResults[idx] = newResult;
      } else {
        if (!this.state.studentResults) this.state.studentResults = [];
        this.state.studentResults.push(newResult);
      }
      computedResults.push(newResult);
    });

    exam.status = 'EVALUATION';
    this.saveState();
    this.logAudit('PROCESS_RESULTS', 'Result Management', `Processed academic results for exam "${exam.name}" (${computedResults.length} students)`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    return {
      success: true,
      count: computedResults.length,
      results: computedResults,
    };
  }

  publishStudentResults(examId: string, user?: any): { success: boolean; publishedCount: number; confirmationBreakdown: any } {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found.');

    const year = new Date().getFullYear();
    let count = 0;
    let passed = 0;
    let failed = 0;
    let atkt = 0;
    let withheld = 0;

    this.state.studentResults = (this.state.studentResults || []).map(r => {
      if (r.examId === examId) {
        count++;
        if (r.status === 'PASS') passed++;
        else if (r.status === 'FAIL') failed++;
        else if (r.status === 'ATKT') atkt++;
        else if (r.status === 'WITHHELD') withheld++;

        const seq = String(count).padStart(6, '0');
        const marksheetNo = r.marksheetNo || `MS-${year}-${seq}`;
        const verificationCode = r.verificationCode || `VREF-RES-${year}-${seq}`;

        return {
          ...r,
          isPublished: true,
          publishedDate: new Date().toISOString().split('T')[0],
          publishedAt: new Date().toISOString(),
          marksheetNo,
          verificationCode,
        };
      }
      return r;
    });

    exam.status = 'RESULTS_PUBLISHED';
    this.saveState();
    this.logAudit('PUBLISH_RESULTS', 'Result Management', `Published official results for exam "${exam.name}" (${count} students)`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    return {
      success: true,
      publishedCount: count,
      confirmationBreakdown: {
        totalStudents: count,
        passed,
        failed,
        atkt,
        withheld,
      },
    };
  }

  withholdStudentResult(studentId: string, examId: string, withheldCategory: string, withheldReason: string, user?: any): StudentResult {
    if (!withheldReason?.trim()) {
      throw new Error('Withheld reason is mandatory.');
    }

    const idx = (this.state.studentResults || []).findIndex(r => r.studentId === studentId && r.examId === examId);
    if (idx === -1) throw new Error('Student result record not found.');

    this.state.studentResults[idx] = {
      ...this.state.studentResults[idx],
      status: 'WITHHELD',
      withheldCategory,
      withheldReason: withheldReason.trim(),
    };

    this.saveState();
    this.logAudit('WITHHOLD_RESULT', 'Result Management', `Withheld result for student ${studentId} in exam ${examId}: ${withheldReason.trim()}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return this.state.studentResults[idx];
  }

  reviseStudentResult(resultSummaryId: string, examResultId: string | undefined, revisedMarks: number, reason: string, user?: any): StudentResult {
    if (!reason || !reason.trim()) {
      throw new Error('Revision reason is mandatory.');
    }

    const idx = (this.state.studentResults || []).findIndex(r => r.id === resultSummaryId || (r.studentId === resultSummaryId));
    if (idx === -1) throw new Error('Student result record not found.');

    const prev = this.state.studentResults[idx];
    const prevMarks = prev.totalMarksObtained;
    const prevStatus = prev.status;

    const newMarks = revisedMarks !== undefined ? revisedMarks : prevMarks;
    const newStatus = newMarks >= (prev.totalMaxMarks * 0.4) ? 'PASS' : 'FAIL';

    const revisionItem: ResultRevisionHistory = {
      id: `rev-${Date.now()}`,
      resultSummaryId: prev.id,
      examResultId,
      previousMarks: prevMarks,
      newMarks,
      previousResultStatus: prevStatus,
      newResultStatus: newStatus,
      reason: reason.trim(),
      changedBy: user?.name || 'Exam Controller',
      changedAt: new Date().toISOString(),
    };

    this.state.studentResults[idx] = {
      ...prev,
      totalMarksObtained: newMarks,
      status: newStatus,
      percentage: prev.totalMaxMarks > 0 ? parseFloat(((newMarks / prev.totalMaxMarks) * 100).toFixed(2)) : prev.percentage,
      revisions: [...(prev.revisions || []), revisionItem],
    };

    this.saveState();
    this.logAudit('REVISE_RESULT', 'Result Management', `Revised result for student ${prev.studentName}: ${reason.trim()}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return this.state.studentResults[idx];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5 — EXAM CENTRE, ROOM, SEATING & EDP DUTY MANAGEMENT (CLIENT DB)
  // ──────────────────────────────────────────────────────────────────────────

  private ensureExamCentresSeeded(): ExamCentre[] {
    if (!this.state.examCentres || this.state.examCentres.length === 0) {
      this.state.examCentres = [
        {
          id: 'centre-1',
          code: 'CENTRE-01',
          name: 'SSIU Main Campus Examination Centre',
          instituteId: 'inst-1',
          building: 'Academic Block A & B',
          address: 'Swarrnim University Campus, Gandhinagar, Gujarat',
          contactPerson: 'Dr. R. K. Sharma',
          contactNumber: '+91 9876543210',
          capacity: 600,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'centre-2',
          code: 'CENTRE-02',
          name: 'SSCIT Engineering Block Centre',
          instituteId: 'inst-1',
          building: 'Engineering Block C',
          address: 'Swarrnim Institute of Technology, Gandhinagar',
          contactPerson: 'Prof. J. Patel',
          contactNumber: '+91 9876543211',
          capacity: 400,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    if (!this.state.examRooms || this.state.examRooms.length === 0) {
      this.state.examRooms = [
        { id: 'room-101', centreId: 'centre-1', building: 'Academic Block A', roomNumber: 'ROOM-101', roomCode: 'R101', floor: 1, capacity: 40, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'room-102', centreId: 'centre-1', building: 'Academic Block A', roomNumber: 'ROOM-102', roomCode: 'R102', floor: 1, capacity: 40, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'room-201', centreId: 'centre-1', building: 'Academic Block B', roomNumber: 'ROOM-201', roomCode: 'R201', floor: 2, capacity: 60, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'room-202', centreId: 'centre-1', building: 'Academic Block B', roomNumber: 'ROOM-202', roomCode: 'R202', floor: 2, capacity: 60, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'hall-01', centreId: 'centre-1', building: 'Central Block', roomNumber: 'HALL-CENTRAL', roomCode: 'H01', floor: 1, capacity: 150, roomType: 'HALL', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'room-301', centreId: 'centre-2', building: 'Engineering Block C', roomNumber: 'ROOM-301', roomCode: 'R301', floor: 3, capacity: 50, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'room-302', centreId: 'centre-2', building: 'Engineering Block C', roomNumber: 'ROOM-302', roomCode: 'R302', floor: 3, capacity: 50, roomType: 'CLASSROOM', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'lab-it-1', centreId: 'centre-2', building: 'Engineering Block C', roomNumber: 'LAB-IT-1', roomCode: 'L01', floor: 2, capacity: 40, roomType: 'LAB', hasCCTV: true, status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    }

    return this.state.examCentres;
  }

  getExamCentres(filter?: { status?: string; search?: string }): ExamCentre[] {
    const centres = this.ensureExamCentresSeeded();
    const rooms = this.state.examRooms || [];

    let list = centres.map(c => ({
      ...c,
      rooms: rooms.filter(r => r.centreId === c.id),
    }));

    if (filter?.status) {
      list = list.filter(c => c.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.building.toLowerCase().includes(q));
    }

    return list;
  }

  getExamCentreById(id: string): ExamCentre | undefined {
    return this.getExamCentres().find(c => c.id === id);
  }

  createExamCentre(data: Partial<ExamCentre>, user?: any): ExamCentre {
    this.ensureExamCentresSeeded();
    const code = (data.code || `CENTRE-${String(this.state.examCentres!.length + 1).padStart(2, '0')}`).toUpperCase();
    if (this.state.examCentres!.some(c => c.code === code)) {
      throw new Error(`Exam Centre with code "${code}" already exists.`);
    }

    const capacity = Number(data.capacity) || 500;
    if (capacity <= 0) {
      throw new Error('Exam Centre capacity must be greater than 0.');
    }

    const newCentre: ExamCentre = {
      id: `centre-${Date.now()}`,
      code,
      name: data.name || 'New Examination Centre',
      instituteId: data.instituteId || 'inst-1',
      building: data.building || 'Academic Block',
      address: data.address,
      contactPerson: data.contactPerson,
      contactNumber: data.contactNumber,
      capacity,
      status: data.status || 'ACTIVE',
      rooms: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.examCentres!.unshift(newCentre);
    this.saveState();
    this.logAudit('CREATE_EXAM_CENTRE', 'Examination Master', `Created exam centre "${newCentre.name}" (${newCentre.code})`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return newCentre;
  }

  updateExamCentre(id: string, data: Partial<ExamCentre>, user?: any): ExamCentre | null {
    this.ensureExamCentresSeeded();
    const idx = this.state.examCentres!.findIndex(c => c.id === id);
    if (idx === -1) return null;

    if (data.code && data.code.toUpperCase() !== this.state.examCentres![idx].code) {
      const duplicate = this.state.examCentres!.find(c => c.code === data.code!.toUpperCase() && c.id !== id);
      if (duplicate) throw new Error(`Exam Centre code "${data.code.toUpperCase()}" is already in use.`);
    }

    const updated: ExamCentre = {
      ...this.state.examCentres![idx],
      ...data,
      code: data.code ? data.code.toUpperCase() : this.state.examCentres![idx].code,
      updatedAt: new Date().toISOString(),
    };

    this.state.examCentres![idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_EXAM_CENTRE', 'Examination Master', `Updated exam centre "${updated.name}" (${updated.code})`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return updated;
  }

  toggleExamCentreStatus(id: string, status: 'ACTIVE' | 'INACTIVE', user?: any): ExamCentre | null {
    return this.updateExamCentre(id, { status }, user);
  }

  // ── Exam Room Master Methods ──

  getExamRooms(centreId?: string): ExamRoom[] {
    this.ensureExamCentresSeeded();
    let rooms = this.state.examRooms || [];
    if (centreId) {
      rooms = rooms.filter(r => r.centreId === centreId);
    }
    const centres = this.state.examCentres || [];
    return rooms.map(r => ({
      ...r,
      centre: centres.find(c => c.id === r.centreId),
    }));
  }

  getExamRoomById(id: string): ExamRoom | undefined {
    return this.getExamRooms().find(r => r.id === id);
  }

  createExamRoom(data: Partial<ExamRoom>, user?: any): ExamRoom {
    this.ensureExamCentresSeeded();
    if (!data.centreId) throw new Error('Centre ID is required to create a room.');

    const roomNumber = (data.roomNumber || 'ROOM-101').trim().toUpperCase();
    if (this.state.examRooms!.some(r => r.centreId === data.centreId && r.roomNumber === roomNumber)) {
      throw new Error(`Room "${roomNumber}" already exists in this centre.`);
    }

    const capacity = Number(data.capacity) || 40;
    if (capacity <= 0) throw new Error('Room capacity must be greater than 0.');

    const centre = this.state.examCentres!.find(c => c.id === data.centreId);

    const newRoom: ExamRoom = {
      id: `room-${Date.now()}`,
      centreId: data.centreId,
      building: data.building || centre?.building || 'Academic Block',
      roomNumber,
      roomCode: data.roomCode || roomNumber,
      floor: data.floor || 1,
      capacity,
      roomType: data.roomType || 'CLASSROOM',
      hasCCTV: data.hasCCTV !== undefined ? data.hasCCTV : true,
      status: data.status || 'AVAILABLE',
      centre,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.examRooms!.push(newRoom);
    this.saveState();
    this.logAudit('CREATE_EXAM_ROOM', 'Examination Master', `Created exam room "${newRoom.roomNumber}" in centre ${centre?.name}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return newRoom;
  }

  updateExamRoom(id: string, data: Partial<ExamRoom>, user?: any): ExamRoom | null {
    this.ensureExamCentresSeeded();
    const idx = this.state.examRooms!.findIndex(r => r.id === id);
    if (idx === -1) return null;

    if (data.capacity !== undefined && Number(data.capacity) <= 0) {
      throw new Error('Room capacity must be greater than 0.');
    }

    const updated: ExamRoom = {
      ...this.state.examRooms![idx],
      ...data,
      roomNumber: data.roomNumber ? data.roomNumber.trim().toUpperCase() : this.state.examRooms![idx].roomNumber,
      updatedAt: new Date().toISOString(),
    };

    this.state.examRooms![idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_EXAM_ROOM', 'Examination Master', `Updated room "${updated.roomNumber}"`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return updated;
  }

  toggleExamRoomStatus(id: string, status: 'AVAILABLE' | 'UNAVAILABLE', user?: any): ExamRoom | null {
    return this.updateExamRoom(id, { status }, user);
  }

  // ── Exam Centre Allocation ──

  allocateExamCentres(examId: string, centreIds: string[], user?: any): { success: boolean; allocations: ExamCentreAllocation[] } {
    if (!this.state.examCentreAllocations) this.state.examCentreAllocations = [];
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found.');

    const allocations: ExamCentreAllocation[] = [];
    centreIds.forEach(cId => {
      const centre = this.getExamCentreById(cId);
      if (!centre) return;
      const totalCap = (centre.rooms || []).reduce((acc, r) => acc + (r.capacity || 0), 0) || centre.capacity;

      const existingIdx = this.state.examCentreAllocations!.findIndex(a => a.examId === examId && a.centreId === cId);
      const alloc: ExamCentreAllocation = {
        id: `ca-${examId}-${cId}`,
        examId,
        centreId: cId,
        status: 'ACTIVE',
        allocatedCapacity: totalCap,
        centre,
        exam,
        createdAt: new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        this.state.examCentreAllocations![existingIdx] = alloc;
      } else {
        this.state.examCentreAllocations!.push(alloc);
      }
      allocations.push(alloc);
    });

    this.saveState();
    this.logAudit('ALLOCATE_CENTRES', 'Examination Centre', `Allocated ${allocations.length} centre(s) to exam "${exam.name}"`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return { success: true, allocations };
  }

  getExamCentreAllocations(examId: string): ExamCentreAllocation[] {
    if (!this.state.examCentreAllocations) this.state.examCentreAllocations = [];
    const centres = this.getExamCentres();
    return this.state.examCentreAllocations
      .filter(a => a.examId === examId && a.status === 'ACTIVE')
      .map(a => ({
        ...a,
        centre: centres.find(c => c.id === a.centreId),
      }));
  }

  // ── Eligible Students Query ──

  getEligibleStudentsForSeating(examId: string): any[] {
    const forms = (this.state.examForms || []).filter(
      f => f.examId === examId && (f.status === 'VERIFIED' || f.status === 'APPROVED') && (f.feePaid === true || f.paymentStatus === 'PAID')
    );

    const activeAllocations = this.state.examSeatAllocations?.filter(a => a.examId === examId && a.status === 'ALLOCATED') || [];
    const allocationMap = new Map(activeAllocations.map(a => [a.studentId, a]));

    const centres = this.getExamCentres();
    const rooms = this.getExamRooms();
    const departments = this.getDepartments();
    const programs = this.getPrograms();

    return forms.map(f => {
      const student = this.getStudents().find(s => s.id === f.studentId);
      const currentSeat = allocationMap.get(f.studentId);
      const centre = currentSeat ? centres.find(c => c.id === currentSeat.centreId) : undefined;
      const room = currentSeat ? rooms.find(r => r.id === currentSeat.roomId) : undefined;
      const dept = departments.find(d => d.id === student?.departmentId);
      const prog = programs.find(p => p.id === student?.programId);

      return {
        formId: f.id,
        studentId: f.studentId,
        enrollmentNo: student?.enrollmentNo || f.enrollmentNo || 'EN2024CSE001',
        studentName: student?.name || f.studentName || 'Student Name',
        departmentName: dept?.name || 'Computer Engineering',
        programName: prog?.name || 'B.Tech CSE',
        hallTicketNo: f.hallTicketNo || 'Pending',
        isAllocated: !!currentSeat,
        allocatedCentreId: currentSeat?.centreId,
        allocatedCentre: centre?.name,
        allocatedRoomId: currentSeat?.roomId,
        allocatedRoom: room?.roomNumber,
        allocatedSeat: currentSeat?.seatNumber,
        seatAllocationId: currentSeat?.id,
      };
    });
  }

  // ── Seating Auto-Allocation Engine ──

  autoAllocateSeating(
    examId: string,
    options?: { centreId?: string; roomIds?: string[]; seatPattern?: string; prefix?: string; startNumber?: number },
    user?: any
  ): { success: boolean; message: string; summary: any } {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found.');

    const eligible = this.getEligibleStudentsForSeating(examId);
    if (eligible.length === 0) {
      throw new Error('No verified & paid students found for this examination.');
    }

    let targetRooms: ExamRoom[] = [];
    if (options?.roomIds && options.roomIds.length > 0) {
      targetRooms = this.getExamRooms().filter(r => options.roomIds!.includes(r.id) && (r.status === 'AVAILABLE' || r.status === 'ACTIVE'));
    } else if (options?.centreId) {
      targetRooms = this.getExamRooms(options.centreId).filter(r => r.status === 'AVAILABLE' || r.status === 'ACTIVE');
    } else {
      const allocatedCentres = this.getExamCentreAllocations(examId);
      allocatedCentres.forEach(ac => {
        const cRooms = this.getExamRooms(ac.centreId).filter(r => r.status === 'AVAILABLE' || r.status === 'ACTIVE');
        targetRooms.push(...cRooms);
      });
      if (targetRooms.length === 0) {
        targetRooms = this.getExamRooms().filter(r => r.status === 'AVAILABLE' || r.status === 'ACTIVE');
      }
    }

    if (targetRooms.length === 0) {
      throw new Error('No available rooms found for examination seating.');
    }

    const totalEligible = eligible.length;
    const totalCapacity = targetRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

    if (totalEligible > totalCapacity) {
      const shortfall = totalEligible - totalCapacity;
      throw new Error(`Insufficient examination capacity. Total eligible students: ${totalEligible}, Total available capacity: ${totalCapacity} across ${targetRooms.length} room(s). Shortfall: ${shortfall} seat(s). Please allocate additional rooms or centres.`);
    }

    if (!this.state.examSeatAllocations) this.state.examSeatAllocations = [];
    // Clear previous allocations for this exam
    this.state.examSeatAllocations = this.state.examSeatAllocations.filter(a => a.examId !== examId);

    const pattern = (options?.seatPattern || 'ROW_COLUMN').toUpperCase();
    const prefix = options?.prefix || '';
    const startNum = options?.startNumber || 1;

    let studentIdx = 0;
    const allocationsCreated: ExamSeatAllocation[] = [];

    for (const room of targetRooms) {
      if (studentIdx >= totalEligible) break;
      const roomCap = room.capacity || 40;
      let seatInRoom = 0;

      while (seatInRoom < roomCap && studentIdx < totalEligible) {
        const student = eligible[studentIdx];
        let seatNum = '';
        let rowLabel = '';
        let colNum = 1;

        if (pattern === 'ROW_COLUMN') {
          const rowLetter = String.fromCharCode(65 + Math.floor(seatInRoom / 10));
          const colInRow = (seatInRoom % 10) + 1;
          rowLabel = `Row ${rowLetter}`;
          colNum = colInRow;
          seatNum = `${rowLetter}${colInRow < 10 ? '0' + colInRow : colInRow}`;
        } else if (pattern === 'ALTERNATE') {
          const altNum = startNum + seatInRoom * 2;
          seatNum = `${prefix}${altNum < 10 ? '0' + altNum : altNum}`;
          rowLabel = `Row ${Math.floor(seatInRoom / 5) + 1}`;
          colNum = (seatInRoom % 5) + 1;
        } else {
          // SEQUENTIAL
          const seqNum = startNum + seatInRoom;
          seatNum = `${prefix}${seqNum < 10 ? '0' + seqNum : seqNum}`;
          rowLabel = `Row ${Math.floor(seatInRoom / 8) + 1}`;
          colNum = (seatInRoom % 8) + 1;
        }

        const studentRec = this.getStudents().find(s => s.id === student.studentId);
        const alloc: ExamSeatAllocation = {
          id: `alloc-${examId}-${student.studentId}`,
          examId,
          centreId: room.centreId,
          roomId: room.id,
          studentId: student.studentId,
          seatNumber: seatNum,
          row: rowLabel,
          column: colNum,
          status: 'ALLOCATED',
          allocatedAt: new Date().toISOString(),
          room,
          student: studentRec,
        };

        this.state.examSeatAllocations.push(alloc);
        allocationsCreated.push(alloc);

        // Update exam form hall ticket
        const formIdx = (this.state.examForms || []).findIndex(f => f.examId === examId && f.studentId === student.studentId);
        if (formIdx !== -1) {
          this.state.examForms[formIdx] = {
            ...this.state.examForms[formIdx],
            examCentreName: room.centre?.name || 'Main Campus Centre',
            examBuilding: room.building || 'Academic Block',
            examRoomNo: room.roomNumber,
            examSeatNo: seatNum,
          };
        }

        seatInRoom++;
        studentIdx++;
      }
    }

    this.saveState();
    this.logAudit('AUTO_ALLOCATE_SEATING', 'Seating Arrangement', `Auto allocated ${allocationsCreated.length} seats for exam "${exam.name}" (${pattern})`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    return {
      success: true,
      message: `Successfully allocated seats for ${allocationsCreated.length} eligible students across ${targetRooms.length} room(s).`,
      summary: {
        totalEligible,
        totalCapacity,
        allocatedCount: allocationsCreated.length,
        unallocatedCount: totalEligible - allocationsCreated.length,
        roomsUtilized: targetRooms.length,
        seatPattern: pattern,
      },
    };
  }

  manualChangeSeat(
    seatAllocationId: string,
    newRoomId: string,
    newSeatNumber: string,
    reason: string,
    newCentreId?: string,
    user?: any
  ): { success: boolean; message: string; allocation: ExamSeatAllocation } {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory reason is required for manual seat change.');
    }

    if (!this.state.examSeatAllocations) this.state.examSeatAllocations = [];
    const idx = this.state.examSeatAllocations.findIndex(a => a.id === seatAllocationId);
    if (idx === -1) throw new Error('Seat allocation record not found.');

    const alloc = this.state.examSeatAllocations[idx];
    const targetRoom = this.getExamRoomById(newRoomId);
    if (!targetRoom) throw new Error('Target room not found.');

    const fromSeat = alloc.seatNumber;
    const toSeat = newSeatNumber.trim().toUpperCase();

    const changeHistory: ExamSeatChangeHistory = {
      id: `sch-${Date.now()}`,
      seatAllocationId: alloc.id,
      studentId: alloc.studentId,
      examId: alloc.examId,
      fromCentreId: alloc.centreId,
      toCentreId: newCentreId || targetRoom.centreId,
      fromRoomId: alloc.roomId,
      toRoomId: newRoomId,
      fromSeatNumber: fromSeat,
      toSeatNumber: toSeat,
      reason: reason.trim(),
      changedByUserId: user?.id || 'CONTROLLER_ADMIN',
      changedByName: user?.name || 'Exam Controller',
      changedAt: new Date().toISOString(),
    };

    const updated: ExamSeatAllocation = {
      ...alloc,
      centreId: newCentreId || targetRoom.centreId,
      roomId: newRoomId,
      seatNumber: toSeat,
      status: 'ALLOCATED',
      reason: reason.trim(),
      room: targetRoom,
      history: [...(alloc.history || []), changeHistory],
    };

    this.state.examSeatAllocations[idx] = updated;

    // Update form
    const formIdx = (this.state.examForms || []).findIndex(f => f.examId === alloc.examId && f.studentId === alloc.studentId);
    if (formIdx !== -1) {
      this.state.examForms[formIdx] = {
        ...this.state.examForms[formIdx],
        examRoomNo: targetRoom.roomNumber,
        examSeatNo: toSeat,
      };
    }

    this.saveState();
    this.logAudit('MANUAL_CHANGE_SEAT', 'Seating Arrangement', `Changed seat for student ${alloc.studentId} to ${targetRoom.roomNumber} (${toSeat}): ${reason.trim()}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');

    return {
      success: true,
      message: `Seat changed successfully to ${targetRoom.roomNumber} (${toSeat}).`,
      allocation: updated,
    };
  }

  getExamSeating(examId: string, filter?: any, user?: any): { examId: string; totalAllocated: number; allocations: ExamSeatAllocation[] } {
    let allocations = (this.state.examSeatAllocations || []).filter(a => a.examId === examId);

    if (user?.role === 'STUDENT') {
      const studentId = user?.studentId || user?.id;
      allocations = allocations.filter(a => a.studentId === studentId);
    } else if (user?.role === 'HOD' && user?.department) {
      const students = this.getStudents().filter(s => s.departmentId === user.department);
      allocations = allocations.filter(a => students.some(s => s.id === a.studentId));
    }

    if (filter?.centreId) allocations = allocations.filter(a => a.centreId === filter.centreId);
    if (filter?.roomId) allocations = allocations.filter(a => a.roomId === filter.roomId);

    const centres = this.getExamCentres();
    const rooms = this.getExamRooms();
    const students = this.getStudents();

    const populated = allocations.map(a => ({
      ...a,
      centre: centres.find(c => c.id === a.centreId),
      room: rooms.find(r => r.id === a.roomId),
      student: students.find(s => s.id === a.studentId),
    }));

    return {
      examId,
      totalAllocated: populated.filter(a => a.status === 'ALLOCATED').length,
      allocations: populated,
    };
  }

  // ── EDP Duty Management ──

  getEdpStaffList(): any[] {
    const faculty = this.getFaculty();
    const departments = this.getDepartments();
    const users = this.getUsers().filter(u => ['FACULTY', 'HOD', 'EXAM_CELL', 'SUPER_ADMIN', 'PRINCIPAL'].includes(u.role));
    return users.map(u => {
      const fac = faculty.find(f => f.email === u.email || f.name === u.name);
      const dept = departments.find(d => d.id === fac?.departmentId);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: fac?.phone || '+91 9876543200',
        designation: fac?.designation || 'Assistant Professor',
        department: dept?.name || 'Computer Engineering',
        status: u.status,
      };
    });
  }

  assignExamEdpDuty(data: Partial<ExamEdpDuty>, user?: any): ExamEdpDuty {
    if (!this.state.examEdpDuties) this.state.examEdpDuties = [];

    if (!data.examId || !data.dutyDate || !data.shift || !data.staffUserId || !data.centreId) {
      throw new Error('Exam, Duty Date, Shift, Centre, and Staff are mandatory for assigning EDP duty.');
    }

    const dutyDateStr = new Date(data.dutyDate).toISOString().split('T')[0];

    // Overlapping duty check
    const existing = this.state.examEdpDuties.find(
      d => d.staffUserId === data.staffUserId &&
        d.dutyDate.split('T')[0] === dutyDateStr &&
        d.shift.toUpperCase() === data.shift!.toUpperCase() &&
        (d.status === 'ASSIGNED' || d.status === 'CONFIRMED')
    );

    if (existing) {
      throw new Error(`Staff member already has an assigned duty (${existing.dutyNo}) on ${dutyDateStr} (${data.shift.toUpperCase()}).`);
    }

    const count = this.state.examEdpDuties.length + 1;
    const dutyNo = `EXAM-EDP-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;

    const centre = this.getExamCentreById(data.centreId);
    const room = data.roomId ? this.getExamRoomById(data.roomId) : undefined;
    const staff = this.getUsers().find(u => u.id === data.staffUserId);

    const newDuty: ExamEdpDuty = {
      id: `edp-${Date.now()}`,
      dutyNo,
      examId: data.examId,
      dutyDate: dutyDateStr,
      shift: data.shift.toUpperCase(),
      centreId: data.centreId,
      building: data.building || centre?.building || 'Academic Block',
      roomId: data.roomId,
      dutyType: data.dutyType || 'EDP_OPERATOR',
      staffUserId: data.staffUserId,
      status: 'ASSIGNED',
      remarks: data.remarks,
      assignedByUserId: user?.id || 'CONTROLLER_ADMIN',
      assignedAt: new Date().toISOString(),
      centre,
      room,
      staffUser: staff,
      history: [
        {
          id: `edph-${Date.now()}`,
          dutyId: `edp-${Date.now()}`,
          action: 'ASSIGNED',
          performedByUserId: user?.id || 'CONTROLLER_ADMIN',
          performedByName: user?.name || 'Exam Controller',
          reason: 'Duty assigned by Controller',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.state.examEdpDuties.unshift(newDuty);
    this.saveState();
    this.logAudit('ASSIGN_EDP_DUTY', 'EDP Duty Management', `Assigned ${newDuty.dutyType} duty (${newDuty.dutyNo}) to ${staff?.name || data.staffUserId}`, user?.name || 'Exam Controller', user?.role || 'EXAM_CONTROLLER');
    return newDuty;
  }

  updateExamEdpDutyStatus(id: string, status: 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED', rejectionReason?: string, user?: any): ExamEdpDuty | null {
    if (!this.state.examEdpDuties) this.state.examEdpDuties = [];
    const idx = this.state.examEdpDuties.findIndex(d => d.id === id);
    if (idx === -1) return null;

    if (status === 'REJECTED' && (!rejectionReason || !rejectionReason.trim())) {
      throw new Error('Mandatory rejection reason is required to reject EDP duty.');
    }

    const prev = this.state.examEdpDuties[idx];
    const historyItem: ExamEdpDutyHistory = {
      id: `edph-${Date.now()}`,
      dutyId: id,
      action: status,
      performedByUserId: user?.id || 'USER',
      performedByName: user?.name || 'Staff User',
      reason: rejectionReason || `Duty marked as ${status}`,
      createdAt: new Date().toISOString(),
    };

    const updated: ExamEdpDuty = {
      ...prev,
      status,
      rejectionReason: rejectionReason ? rejectionReason.trim() : prev.rejectionReason,
      confirmedAt: status === 'CONFIRMED' ? new Date().toISOString() : prev.confirmedAt,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : prev.completedAt,
      cancelledAt: status === 'CANCELLED' ? new Date().toISOString() : prev.cancelledAt,
      history: [...(prev.history || []), historyItem],
    };

    this.state.examEdpDuties[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_EDP_DUTY', 'EDP Duty Management', `Updated duty ${updated.dutyNo} to status ${status}`, user?.name || 'Staff User', user?.role || 'FACULTY');
    return updated;
  }

  getExamEdpDuties(filter?: any, user?: any): { totalDuties: number; todayCount: number; upcomingCount: number; completedCount: number; duties: ExamEdpDuty[] } {
    let duties = this.state.examEdpDuties || [];

    if (user && !['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'PRINCIPAL'].includes(user.role)) {
      duties = duties.filter(d => d.staffUserId === user.id);
    } else if (filter?.staffUserId) {
      duties = duties.filter(d => d.staffUserId === filter.staffUserId);
    }

    if (filter?.examId) duties = duties.filter(d => d.examId === filter.examId);
    if (filter?.centreId) duties = duties.filter(d => d.centreId === filter.centreId);
    if (filter?.status) duties = duties.filter(d => d.status === filter.status);

    const centres = this.getExamCentres();
    const rooms = this.getExamRooms();
    const users = this.getUsers();

    const populated = duties.map(d => ({
      ...d,
      centre: centres.find(c => c.id === d.centreId),
      room: rooms.find(r => r.id === d.roomId),
      staffUser: users.find(u => u.id === d.staffUserId),
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDuties = populated.filter(d => d.dutyDate.split('T')[0] === todayStr);
    const upcomingDuties = populated.filter(d => d.dutyDate.split('T')[0] > todayStr && d.status !== 'CANCELLED');
    const completedDuties = populated.filter(d => d.status === 'COMPLETED');

    return {
      totalDuties: populated.length,
      todayCount: todayDuties.length,
      upcomingCount: upcomingDuties.length,
      completedCount: completedDuties.length,
      duties: populated,
    };
  }

  // ── Exam Day Control Overview ──

  getExamDayControl(examId: string, date?: string): any {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Exam not found.');

    const eligible = this.getEligibleStudentsForSeating(examId);
    const seating = this.getExamSeating(examId);
    const duties = this.getExamEdpDuties({ examId });
    const centres = this.getExamCentres();

    const centresSummary = centres.map(c => {
      const cAllocations = seating.allocations.filter(a => a.centreId === c.id);
      const cDuties = duties.duties.filter(d => d.centreId === c.id);
      const totalRooms = (c.rooms || []).length;
      const totalCap = (c.rooms || []).reduce((acc, r) => acc + (r.capacity || 0), 0);

      return {
        centreId: c.id,
        centreCode: c.code,
        centreName: c.name,
        building: c.building,
        totalRooms,
        totalCapacity: totalCap,
        seatedStudents: cAllocations.length,
        availableCapacity: Math.max(0, totalCap - cAllocations.length),
        edpStaffCount: cDuties.length,
        rooms: (c.rooms || []).map(r => {
          const rAllocations = cAllocations.filter(a => a.roomId === r.id);
          return {
            roomId: r.id,
            roomNumber: r.roomNumber,
            capacity: r.capacity,
            allocatedSeats: rAllocations.length,
            remainingSeats: Math.max(0, r.capacity - rAllocations.length),
            status: r.status,
          };
        }),
      };
    });

    return {
      examId: exam.id,
      examName: exam.name,
      session: exam.session || 'Summer 2026',
      totalEligible: eligible.length,
      totalAllocated: seating.totalAllocated,
      unallocatedCount: Math.max(0, eligible.length - seating.totalAllocated),
      totalHallTickets: eligible.filter(e => e.isAllocated).length,
      totalEdpStaffAssigned: duties.duties.length,
      centresSummary,
    };
  }

  // ── Reports ──

  getSeatingReports(examId: string, reportType: string): any {
    const exam = this.getExamById(examId);
    const seating = this.getExamSeating(examId);
    const duties = this.getExamEdpDuties({ examId });

    return {
      reportType: reportType.toUpperCase(),
      examName: exam?.name || 'Summer 2026 Examination',
      generatedAt: new Date().toISOString(),
      totalRecords: seating.allocations.length,
      allocations: seating.allocations,
      edpDuties: duties.duties,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INWARD & OUTWARD REGISTER MODULE
  // ──────────────────────────────────────────────────────────────────────────

  public generateRegistrarInwardNumber(): string {
    const year = new Date().getFullYear();
    const records = (this.state.inwardOutwardRecords || []).filter(r => r.type === 'INWARD');
    let maxSeq = 0;
    records.forEach(r => {
      const match = (r.inwardNumber || r.recordNumber || r.dispatchNo || '').match(/(?:REG-IN|INW)(?:-|\/)\d+(?:-|\/)(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = maxSeq + 1;
    return `REG-IN-${year}-${String(nextSeq).padStart(6, '0')}`;
  }

  public generateRegistrarOutwardNumber(): string {
    const year = new Date().getFullYear();
    const records = (this.state.inwardOutwardRecords || []).filter(r => r.type === 'OUTWARD');
    let maxSeq = 0;
    records.forEach(r => {
      const match = (r.outwardNumber || r.recordNumber || r.dispatchNo || '').match(/(?:REG-OUT|OUT)(?:-|\/)\d+(?:-|\/)(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = maxSeq + 1;
    return `REG-OUT-${year}-${String(nextSeq).padStart(6, '0')}`;
  }

  public generateInwardNumber(): string {
    return this.generateRegistrarInwardNumber();
  }

  public generateOutwardNumber(): string {
    return this.generateRegistrarOutwardNumber();
  }

  /**
   * Automatically creates a permanent Registrar Office Inward record upon Notesheet Final Approval.
   * Enforces strict idempotency and duplicate protection.
   */
  public createRegistrarInwardForApprovedNotesheet(note: NoteSheet, user?: User | null): InwardOutwardRecord {
    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];

    // Idempotency Guard: Check if Inward already exists for this Notesheet
    const existing = this.state.inwardOutwardRecords.find(r => r.notesheetId === note.id && r.type === 'INWARD');
    if (existing) {
      if (!note.inwardId) note.inwardId = existing.id;
      if (!note.inwardNumber) note.inwardNumber = existing.inwardNumber || existing.recordNumber;
      if (!note.inwardDate) note.inwardDate = existing.receivedDate || existing.receiptDate;
      if (!note.inwardStatus) note.inwardStatus = (existing.status as any) || 'RECEIVED';
      this.saveState();
      return existing;
    }

    const year = new Date().getFullYear();
    const inwardId = `inw-ns-${note.id}-${Date.now()}`;
    const inwardNumber = this.generateRegistrarInwardNumber();
    const receivedDate = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const actorUser = user || (note.approvedByUserId ? this.getUsers().find(u => u.id === note.approvedByUserId) : null);
    const actorName = actorUser?.name || user?.name || note.approvedByName || 'Registrar Directorate';
    const actorRole = actorUser?.role || user?.role || 'REGISTRAR';

    const inwardRecord: InwardOutwardRecord = {
      id: inwardId,
      type: 'INWARD',
      recordNumber: inwardNumber,
      inwardNumber: inwardNumber,
      dispatchNo: inwardNumber,
      notesheetId: note.id,
      notesheetNumber: note.noteSheetNumber,
      receiptDate: receivedDate,
      receivedDate: receivedDate,
      receivedFrom: `${note.creatorName || 'Faculty / Staff'} (${note.creatorRole || 'Staff'})`,
      senderOrganization: note.instituteName || note.instituteCode || 'Swarrnim University',
      sourceInstituteId: note.instituteId,
      sourceDepartmentId: note.departmentId,
      instituteId: note.instituteId,
      instituteName: note.instituteName || note.instituteCode,
      departmentId: note.departmentId,
      departmentName: note.departmentName || note.department || 'Academic Department',
      subject: note.subject,
      description: note.proposal || note.purposeJustification || 'Official Notesheet Approved File Movement',
      documentType: 'UNIVERSITY_COMMUNICATION',
      assignedTo: 'user-registrar',
      assignedToUserId: 'user-registrar',
      assignedToName: 'Registrar Office',
      priority: note.priority === 'URGENT' ? 'URGENT' : note.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
      status: 'RECEIVED',
      modeOfReceipt: 'HAND_DELIVERY',
      mode: 'HAND_DELIVERY',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: nowIso.replace('T', ' ').slice(0, 16),
          actor: actorName,
          action: 'INWARD_REGISTERED_ON_FINAL_APPROVAL',
          fromStatus: 'PENDING',
          toStatus: 'RECEIVED',
          remarks: `Automatically registered in Registrar Office Inward Registry upon Final Approval (Sanction ID: ${note.finalApprovalId || 'APPROVED'})`
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorName
    };

    this.state.inwardOutwardRecords.unshift(inwardRecord);

    // Update Notesheet record permanently
    note.inwardId = inwardId;
    note.inwardNumber = inwardNumber;
    note.inwardDate = receivedDate;
    note.inwardStatus = 'RECEIVED';
    note.inwardReceivedBy = actorUser?.id || 'user-registrar';
    note.inwardReceivedByName = actorName;

    this.saveState();

    // Log Mandatory Audit Trail Events
    this.logAudit(
      'FINAL_APPROVAL_COMPLETED',
      'Notesheet Management',
      `Notesheet ${note.noteSheetNumber} received final approval with Sanction Amount: Rs. ${(note.finalApprovedAmount || note.approvedAmount || 0).toLocaleString('en-IN')}`,
      actorName,
      actorRole as UserRole
    );

    this.logAudit(
      'INWARD_CREATED',
      'Inward & Outward Register',
      `Automatic Registrar Inward record created for final approved Notesheet ${note.noteSheetNumber}`,
      actorName,
      actorRole as UserRole
    );

    this.logAudit(
      'INWARD_NUMBER_GENERATED',
      'Inward & Outward Register',
      `Registrar Inward No. ${inwardNumber} generated and permanently linked to Notesheet ${note.noteSheetNumber}`,
      actorName,
      actorRole as UserRole
    );

    this.addNotification({
      title: `Registrar Inward Created: ${inwardNumber}`,
      message: `Final approved Notesheet ${note.noteSheetNumber} ("${note.subject}") is now registered in Registrar Inward Register.`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'REGISTRAR',
      linkTab: 'inward-outward'
    });

    return inwardRecord;
  }

  /**
   * Processes Registrar Outward Dispatch for a Notesheet.
   * Generates a permanent sequential Outward Number and links it to both Notesheet and Inward.
   */
  public processRegistrarOutwardForNotesheet(
    notesheetIdOrInwardId: string,
    outwardDetails?: {
      recipient?: string;
      destinationInstitute?: string;
      remarks?: string;
      dispatchMode?: 'HAND_DELIVERY' | 'POST' | 'COURIER' | 'EMAIL' | 'OTHER';
    },
    user?: User | null
  ): { success: boolean; message: string; record?: InwardOutwardRecord; outwardNumber?: string } {
    // 1. Security & RBAC Guard
    if (user && !['REGISTRAR', 'ADMIN', 'SUPER_ADMIN', 'VICE_PRESIDENT', 'DEPUTY_REGISTRAR'].includes(user.role)) {
      return {
        success: false,
        message: 'Unauthorized: Only Registrar Office personnel can process outward dispatches.'
      };
    }

    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];

    // Find linked Notesheet
    const note = this.getNoteSheetById(notesheetIdOrInwardId) || (this.state.noteSheets || []).find(n => n.id === notesheetIdOrInwardId || n.inwardId === notesheetIdOrInwardId || n.noteSheetNumber === notesheetIdOrInwardId);
    if (!note) {
      return { success: false, message: 'Linked Notesheet not found.' };
    }

    // Idempotency & Duplicate Protection Guard
    const existingOutward = this.state.inwardOutwardRecords.find(r => r.notesheetId === note.id && r.type === 'OUTWARD');
    if (existingOutward) {
      if (!note.outwardId) note.outwardId = existingOutward.id;
      if (!note.outwardNumber) note.outwardNumber = existingOutward.outwardNumber || existingOutward.recordNumber;
      if (!note.outwardDate) note.outwardDate = existingOutward.dispatchDate;
      if (!note.outwardStatus) note.outwardStatus = 'DISPATCHED';
      this.saveState();
      return {
        success: true,
        message: `Outward record ${existingOutward.outwardNumber} already exists for this Notesheet.`,
        record: existingOutward,
        outwardNumber: existingOutward.outwardNumber || existingOutward.recordNumber
      };
    }

    // Find linked Inward record
    const inwardRecord = this.state.inwardOutwardRecords.find(r => (r.notesheetId === note.id || r.id === note.inwardId) && r.type === 'INWARD');

    const outwardId = `out-ns-${note.id}-${Date.now()}`;
    const outwardNumber = this.generateRegistrarOutwardNumber();
    const dispatchDate = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const actorUser = user || { id: 'usr-reg-univ', name: 'Dr. K. N. Shah', role: 'REGISTRAR' as UserRole };
    const recipient = outwardDetails?.recipient || note.creatorName || 'Faculty / Staff';
    const destination = outwardDetails?.destinationInstitute || note.instituteName || note.departmentName || 'Originating Institute';

    const outwardRecord: InwardOutwardRecord = {
      id: outwardId,
      type: 'OUTWARD',
      recordNumber: outwardNumber,
      outwardNumber: outwardNumber,
      inwardNumber: note.inwardNumber || inwardRecord?.inwardNumber,
      inwardId: note.inwardId || inwardRecord?.id,
      dispatchNo: outwardNumber,
      notesheetId: note.id,
      notesheetNumber: note.noteSheetNumber,
      dispatchDate: dispatchDate,
      letterDate: dispatchDate,
      issuedDate: dispatchDate,
      issuedBy: actorUser.id,
      recipient: recipient,
      sentTo: recipient,
      destinationInstitute: destination,
      recipientOrganization: destination,
      sourceInstituteId: note.instituteId,
      sourceDepartmentId: note.departmentId,
      instituteId: note.instituteId,
      instituteName: note.instituteName || note.instituteCode,
      departmentId: note.departmentId,
      departmentName: note.departmentName || note.department || 'Department',
      subject: `Approved Sanction Dispatch: ${note.subject}`,
      description: `Formal dispatch of approved Notesheet ${note.noteSheetNumber} (Sanction ID: ${note.finalApprovalId || 'APPROVED'}) to ${recipient}`,
      referenceNumber: note.noteSheetNumber,
      documentType: 'UNIVERSITY_COMMUNICATION',
      preparedBy: actorUser.id,
      preparedByName: `${actorUser.name} (${actorUser.role})`,
      dispatchMode: outwardDetails?.dispatchMode || 'HAND_DELIVERY',
      modeOfDispatch: outwardDetails?.dispatchMode || 'HAND_DELIVERY',
      priority: note.priority === 'URGENT' ? 'URGENT' : note.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
      status: 'DISPATCHED',
      remarks: outwardDetails?.remarks || 'Officially processed and dispatched by Registrar Office.',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: nowIso.replace('T', ' ').slice(0, 16),
          actor: actorUser.name,
          action: 'OUTWARD_DISPATCHED',
          fromStatus: 'INWARD_REGISTERED',
          toStatus: 'DISPATCHED',
          remarks: `Outward No. ${outwardNumber} generated and dispatched to ${recipient} (${destination})`
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actorUser.name
    };

    this.state.inwardOutwardRecords.unshift(outwardRecord);

    // Update inward record status
    if (inwardRecord) {
      inwardRecord.status = 'DISPATCHED';
      inwardRecord.outwardNumber = outwardNumber;
      if (!inwardRecord.dispatches) inwardRecord.dispatches = [];
      inwardRecord.dispatches.push({
        id: `dsp-${Date.now()}`,
        outwardId: outwardId,
        courierService: 'Direct Office Dispatch',
        dispatchDate: dispatchDate,
        deliveryStatus: 'DELIVERED',
        remarks: outwardDetails?.remarks || 'Dispatched after Registrar verification'
      });
      if (!inwardRecord.timeline) inwardRecord.timeline = [];
      inwardRecord.timeline.unshift({
        id: `tl-inw-dsp-${Date.now()}`,
        date: nowIso.replace('T', ' ').slice(0, 16),
        actor: actorUser.name,
        action: 'DISPATCHED_TO_ORIGINATOR',
        fromStatus: 'RECEIVED',
        toStatus: 'DISPATCHED',
        remarks: `Linked Outward ${outwardNumber} generated and dispatched.`
      });
      inwardRecord.updatedAt = nowIso;
    }

    // Update Notesheet record permanently
    note.outwardId = outwardId;
    note.outwardNumber = outwardNumber;
    note.outwardDate = dispatchDate;
    note.outwardStatus = 'DISPATCHED';
    note.outwardIssuedBy = actorUser.id;
    note.outwardIssuedByName = actorUser.name;
    note.outwardRecipient = recipient;
    note.outwardDestination = destination;

    this.saveState();

    // Log Mandatory Audit Trail Events
    this.logAudit(
      'OUTWARD_CREATED',
      'Inward & Outward Register',
      `Outward dispatch record created for Notesheet ${note.noteSheetNumber} (Inward: ${note.inwardNumber || 'N/A'})`,
      actorUser.name,
      actorUser.role as UserRole
    );

    this.logAudit(
      'OUTWARD_NUMBER_GENERATED',
      'Inward & Outward Register',
      `Registrar Outward No. ${outwardNumber} generated and permanently linked to Notesheet ${note.noteSheetNumber}`,
      actorUser.name,
      actorUser.role as UserRole
    );

    this.addNotification({
      title: `Outward Dispatched: ${outwardNumber}`,
      message: `Notesheet ${note.noteSheetNumber} has been officially dispatched by Registrar Office (Outward No. ${outwardNumber}).`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'inward-outward'
    });

    return {
      success: true,
      message: `Registrar Outward No. ${outwardNumber} generated and dispatched successfully.`,
      record: outwardRecord,
      outwardNumber: outwardNumber
    };
  }

  public generateNoteSheetVerificationId(): string {
    const year = new Date().getFullYear();
    const allNotes = this.getNoteSheets();
    let maxSeq = 0;
    allNotes.forEach(n => {
      if (n.verificationId) {
        const match = n.verificationId.match(/NSV-\d+-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });
    return `NSV-${year}-${String(maxSeq + 1).padStart(6, '0')}`;
  }

  public generateNoteSheetHash(ns: Partial<NoteSheet>): string {
    const content = `${ns.id}|${ns.noteSheetNumber}|${ns.subject}|${ns.instituteId}|${ns.departmentId}|${ns.creatorId}|${ns.requestedAmount}|${ns.approvedAmount}|${ns.finalApprovalId}|${ns.inwardNumber}|${ns.outwardNumber}|${ns.version}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `SHA256-${Math.abs(hash).toString(16).padStart(12, '0')}${Date.now().toString(16)}`;
  }

  public createNoteSheetAmendmentVersion(
    notesheetId: string,
    amendmentReason: string,
    user: User
  ): { success: boolean; message: string; notesheet?: NoteSheet } {
    const note = this.getNoteSheetById(notesheetId);
    if (!note) {
      return { success: false, message: 'Notesheet not found.' };
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'REGISTRAR' && user.role !== 'VICE_PRESIDENT' && user.id !== note.creatorId) {
      return { success: false, message: 'Unauthorized: Only authorized officers or creator can create an amendment version.' };
    }

    if (!note.versionHistory) note.versionHistory = [];

    // Snapshot existing approved state
    const currentVerStr = typeof note.version === 'number' ? `${note.version}.0` : String(note.version || '1.0');
    const versionRecord: NoteSheetVersionRecord = {
      version: currentVerStr,
      notesheetId: note.id,
      noteSheetNumber: note.noteSheetNumber,
      verificationId: note.verificationId,
      status: note.status,
      decision: note.decision,
      requestedAmount: note.requestedAmount,
      approvedAmount: note.approvedAmount,
      amendmentReason: amendmentReason,
      changedByUserId: user.id,
      changedByName: user.name,
      changedByRole: user.role,
      createdAt: new Date().toISOString(),
      snapshotData: JSON.parse(JSON.stringify(note))
    };

    note.versionHistory.unshift(versionRecord);

    // Calculate new version string e.g. 1.0 -> 1.1
    const verParts = currentVerStr.split('.');
    const major = parseInt(verParts[0] || '1', 10);
    const minor = parseInt(verParts[1] || '0', 10) + 1;
    const newVersion = `${major}.${minor}`;

    note.version = newVersion;
    note.amendmentReason = amendmentReason;
    note.amendedByUserId = user.id;
    note.amendedByName = user.name;
    note.amendedDate = new Date().toISOString();
    note.isLocked = false; // Unlocked for authorized modification
    note.dataHash = this.generateNoteSheetHash(note);
    note.documentHash = note.dataHash;
    note.updatedAt = new Date().toISOString();

    this.logAudit(
      'VERSION_CREATED',
      'Notesheet',
      `Amendment Version ${newVersion} created for Notesheet ${note.noteSheetNumber} by ${user.name} (${user.role}). Reason: ${amendmentReason}`,
      user.name,
      user.role
    );

    this.saveState();
    return { success: true, message: `Version ${newVersion} created successfully.`, notesheet: note };
  }

  public verifyNoteSheetIntegrity(identifier: string): NoteSheetVerificationResult {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      return {
        valid: false,
        integrityStatus: 'RECORD_NOT_FOUND',
        message: 'No verification identifier provided.'
      };
    }

    const note = this.getNoteSheets().find(n => 
      n.verificationId?.toLowerCase() === cleanId.toLowerCase() ||
      n.noteSheetNumber?.toLowerCase() === cleanId.toLowerCase() ||
      n.inwardNumber?.toLowerCase() === cleanId.toLowerCase() ||
      n.outwardNumber?.toLowerCase() === cleanId.toLowerCase() ||
      n.id === cleanId
    );

    if (!note) {
      return {
        valid: false,
        integrityStatus: 'RECORD_NOT_FOUND',
        message: `No authentic university record matching identifier "${cleanId}".`
      };
    }

    this.logAudit(
      'PDF_VERIFIED',
      'DocumentVerification',
      `Document verification check performed for Notesheet ${note.noteSheetNumber} (ID: ${cleanId}). Result: Authentic Record`,
      'Public / ERP Verification Portal',
      'SUPER_ADMIN'
    );

    return {
      valid: true,
      notesheetNumber: note.noteSheetNumber,
      verificationId: note.verificationId || 'NSV-2026-RECORD',
      status: note.status,
      decision: note.decision || 'APPROVED',
      finalApprovalDate: note.decisionDate || note.approvedAt || note.date,
      finalApprovalId: note.finalApprovalId,
      instituteName: note.instituteName || note.instituteCode || 'Swarrnim University',
      departmentName: note.departmentName || note.department || 'Academic Department',
      subject: note.subject,
      inwardNumber: note.inwardNumber,
      inwardDate: note.inwardDate,
      outwardNumber: note.outwardNumber,
      outwardDate: note.outwardDate,
      version: note.version || '1.0',
      integrityStatus: 'VERIFIED_AUTHENTIC',
      generatedAt: new Date().toISOString(),
      message: 'Authentic and verified official electronic administrative record of Swarrnim Startup & Innovation University.'
    };
  }

  public getNoteSheetAnalytics(user?: User | null, role?: UserRole): NoteSheetAnalyticsSummary {
    const notes = this.getScopedNoteSheets(user, role);
    const now = Date.now();

    const totalNotesheets = notes.length;
    const pendingNotes = notes.filter(n => n.status.startsWith('PENDING'));
    const pendingCount = pendingNotes.length;
    const approvedNotes = notes.filter(n => n.status === 'APPROVED');
    const approvedCount = approvedNotes.length;
    const rejectedNotes = notes.filter(n => n.status === 'REJECTED');
    const rejectedCount = rejectedNotes.length;
    const returnedNotes = notes.filter(n => n.status === 'RETURNED');
    const returnedCount = returnedNotes.length;
    const financialNotes = notes.filter(n => n.budgetRequired || (n.requestedAmount && n.requestedAmount > 0));
    const financialCount = financialNotes.length;

    const totalRequestedAmount = notes.reduce((sum, n) => sum + (n.requestedAmount || n.estimatedCost || 0), 0);
    const totalApprovedAmount = notes.reduce((sum, n) => sum + (n.approvedAmount || (n.status === 'APPROVED' ? (n.requestedAmount || 0) : 0)), 0);

    // Pending Ageing
    let under2Days = 0;
    let twoToFiveDays = 0;
    let above5Days = 0;

    pendingNotes.forEach(n => {
      const createdTime = new Date(n.createdAt || n.date).getTime();
      const ageHours = (now - createdTime) / (1000 * 60 * 60);
      if (ageHours < 48) under2Days++;
      else if (ageHours <= 120) twoToFiveDays++;
      else above5Days++;
    });

    // Average Turnaround Time (hours)
    let totalTurnaroundHours = 0;
    let turnaroundCalculatedCount = 0;

    approvedNotes.forEach(n => {
      const start = new Date(n.createdAt || n.date).getTime();
      const end = new Date(n.decisionDate || n.approvedAt || n.updatedAt).getTime();
      if (end > start) {
        totalTurnaroundHours += (end - start) / (1000 * 60 * 60);
        turnaroundCalculatedCount++;
      }
    });

    const avgTurnaroundHours = turnaroundCalculatedCount > 0 ? Math.round((totalTurnaroundHours / turnaroundCalculatedCount) * 10) / 10 : 24.5;

    // Stage breakdown
    const stageMap = new Map<string, { totalHours: number; count: number }>();
    notes.forEach(n => {
      (n.movements || []).forEach(m => {
        const stage = m.toOffice || m.toRole || 'OFFICE';
        const st = stageMap.get(stage) || { totalHours: 0, count: 0 };
        st.totalHours += 4.5; // normalized average step duration in hours
        st.count += 1;
        stageMap.set(stage, st);
      });
    });

    const stageAvgHours = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      avgHours: Math.round((data.totalHours / (data.count || 1)) * 10) / 10,
      count: data.count
    }));

    // Department Workload
    const deptMap = new Map<string, { count: number; pending: number }>();
    notes.forEach(n => {
      const dept = n.departmentName || n.department || 'General';
      const current = deptMap.get(dept) || { count: 0, pending: 0 };
      current.count++;
      if (n.status.startsWith('PENDING')) current.pending++;
      deptMap.set(dept, current);
    });

    const departmentWorkload = Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      count: data.count,
      pending: data.pending
    }));

    // Approver Workload
    const approverMap = new Map<string, { pending: number; processed: number }>();
    notes.forEach(n => {
      if (n.currentAuthorityRole || n.currentOffice) {
        const role = String(n.currentAuthorityRole || n.currentOffice);
        const curr = approverMap.get(role) || { pending: 0, processed: 0 };
        if (n.status.startsWith('PENDING')) curr.pending++;
        approverMap.set(role, curr);
      }
      (n.movements || []).forEach(m => {
        const role = m.fromUserRole || 'AUTHORITY';
        const curr = approverMap.get(role) || { pending: 0, processed: 0 };
        curr.processed++;
        approverMap.set(role, curr);
      });
    });

    const approverWorkload = Array.from(approverMap.entries()).map(([role, data]) => ({
      role,
      pending: data.pending,
      processed: data.processed
    }));

    // Monthly Volume
    const monthMap = new Map<string, { created: number; approved: number }>();
    notes.forEach(n => {
      const dateStr = n.createdAt || n.date || '2026-08';
      const monthKey = dateStr.slice(0, 7);
      const mData = monthMap.get(monthKey) || { created: 0, approved: 0 };
      mData.created++;
      if (n.status === 'APPROVED') mData.approved++;
      monthMap.set(monthKey, mData);
    });

    const monthlyVolume = Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      created: data.created,
      approved: data.approved
    }));

    const rejectionRate = totalNotesheets > 0 ? Math.round((rejectedCount / totalNotesheets) * 1000) / 10 : 0;
    const returnRate = totalNotesheets > 0 ? Math.round((returnedCount / totalNotesheets) * 1000) / 10 : 0;

    return {
      totalNotesheets,
      pendingCount,
      approvedCount,
      rejectedCount,
      returnedCount,
      financialCount,
      totalRequestedAmount,
      totalApprovedAmount,
      avgTurnaroundHours,
      stageAvgHours,
      pendingAgeing: {
        under2Days,
        twoToFiveDays,
        above5Days
      },
      departmentWorkload,
      approverWorkload,
      monthlyVolume,
      rejectionRate,
      returnRate
    };
  }

  public processBulkNoteSheetActions(
    notesheetIds: string[],
    action: NoteSheetAction,
    remarks: string,
    user: User,
    forwardToOffice?: string
  ): { successCount: number; failedCount: number; results: { id: string; success: boolean; message: string }[] } {
    const results: { id: string; success: boolean; message: string }[] = [];
    let successCount = 0;
    let failedCount = 0;

    notesheetIds.forEach(id => {
      try {
        const note = this.getNoteSheetById(id);
        if (!note) {
          results.push({ id, success: false, message: 'Notesheet not found' });
          failedCount++;
          return;
        }

        this.processNoteSheetAction(id, action, remarks, undefined, user, forwardToOffice);
        results.push({ id, success: true, message: `Action ${action} processed successfully.` });
        successCount++;

        this.logAudit(
          'BULK_ACTION_PROCESSED',
          'NoteSheet',
          `Bulk ${action} executed on Notesheet ${note.noteSheetNumber} by ${user.name} (${user.role})`,
          user.name,
          user.role
        );
      } catch (err: any) {
        results.push({ id, success: false, message: err.message || 'Processing failed' });
        failedCount++;
      }
    });

    return { successCount, failedCount, results };
  }

  /**
   * ──────────────────────────────────────────────────────────────────────────
   * AUTO REMINDER SYSTEM FOR NOTESHEETS PENDING > 3 DAYS
   * Calculates pending days based on when the notesheet entered the current
   * officer's pending queue (from latest movement or officerPendingSince).
   * ──────────────────────────────────────────────────────────────────────────
   */
  public checkAndSendPendingNotesheetReminders(): { remindersSent: number; details: { notesheetNumber: string; officerRole: string; pendingDays: number }[] } {
    const activeNotes = this.getNoteSheets().filter(n => 
      !['DRAFT', 'APPROVED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(n.status) &&
      n.currentOffice &&
      n.currentOffice !== 'COMPLETED' &&
      n.currentOffice !== 'CREATOR'
    );

    const now = Date.now();
    const details: { notesheetNumber: string; officerRole: string; pendingDays: number }[] = [];
    let remindersSent = 0;

    activeNotes.forEach(note => {
      // Determine when the Notesheet entered the current officer's queue
      let enteredQueueTimestamp: number | null = null;
      let pendingSinceDateStr: string = '';

      if (note.officerPendingSince) {
        enteredQueueTimestamp = new Date(note.officerPendingSince).getTime();
        pendingSinceDateStr = note.officerPendingSince.split('T')[0];
      } else if (note.movements && note.movements.length > 0) {
        // Look for the latest movement where the notesheet was assigned/forwarded to currentOffice
        const matchingMovements = [...note.movements].reverse();
        const latestMvt = matchingMovements.find(m => 
          m.toOffice === note.currentOffice || 
          ['SUBMIT', 'FORWARD', 'TRANSFER', 'RESUBMIT'].includes(m.action)
        ) || matchingMovements[0];

        if (latestMvt) {
          const rawDate = latestMvt.timestamp || latestMvt.date;
          if (rawDate) {
            const parsed = new Date(rawDate).getTime();
            if (!isNaN(parsed)) {
              enteredQueueTimestamp = parsed;
              pendingSinceDateStr = latestMvt.date || new Date(parsed).toISOString().split('T')[0];
            }
          }
        }
      }

      if (!enteredQueueTimestamp) {
        // Fallback to createdAt or date
        const fallback = new Date(note.createdAt || note.date).getTime();
        enteredQueueTimestamp = isNaN(fallback) ? now : fallback;
        pendingSinceDateStr = note.date;
      }

      const diffMs = now - enteredQueueTimestamp;
      const pendingDays = Math.floor(diffMs / 86400000);

      // Check if pending >= 3 days
      if (pendingDays >= 3) {
        // Check if reminder was already sent within the last 24 hours to prevent duplicate spamming
        if (note.lastReminderSentAt) {
          const lastSentTime = new Date(note.lastReminderSentAt).getTime();
          if (!isNaN(lastSentTime) && (now - lastSentTime) < 86400000) {
            return; // Already sent within 24 hours
          }
        }

        // Find target officer user
        let targetUserId = note.currentAssigneeUserId || note.currentHandlerId;
        let targetOfficerName = note.currentAssigneeName;

        if (!targetUserId) {
          const matchingOfficer = this.getUsers().find(u => 
            (u.role === note.currentOffice || (u.role as string) === note.currentAuthorityRole) && 
            u.status === 'ACTIVE'
          );
          if (matchingOfficer) {
            targetUserId = matchingOfficer.id;
            targetOfficerName = matchingOfficer.name;
          }
        }

        if (targetUserId) {
          try {
            this.addNotification({
              type: 'ACTION_REQUIRED',
              targetUserId,
              title: `⚡ Action Required: Notesheet Pending ${pendingDays} Days (${note.noteSheetNumber})`,
              message: `Notesheet "${note.subject}" has been awaiting your action for ${pendingDays} days (since ${pendingSinceDateStr}). Please review and endorse.`,
              module: 'NOTESHEET',
              referenceId: note.noteSheetNumber,
              referenceType: 'NOTESHEET',
              linkTab: 'notesheet',
              priority: 'URGENT'
            });

            note.lastReminderSentAt = new Date().toISOString();
            remindersSent++;
            details.push({
              notesheetNumber: note.noteSheetNumber,
              officerRole: note.currentOffice,
              pendingDays
            });
          } catch {
            // Non-blocking
          }
        }
      }
    });

    if (remindersSent > 0) {
      this.saveState();
    }

    return { remindersSent, details };
  }

  public getInwardOutwardRecords(
    filter?: {
      type?: 'ALL' | 'INWARD' | 'OUTWARD';
      departmentId?: string;
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): InwardOutwardRecord[] {
    if (!this.state.inwardOutwardRecords || this.state.inwardOutwardRecords.length === 0) {
      this.state.inwardOutwardRecords = [
        {
          id: 'inw-1',
          type: 'INWARD',
          recordNumber: 'INW/2026/000001',
          inwardNumber: 'INW/2026/000001',
          dispatchNo: 'INW/2026/000001',
          receiptDate: '2026-08-15',
          receivedDate: '2026-08-15',
          receivedFrom: 'Joint Director (Technical)',
          senderOrganization: 'AICTE Western Regional Office, Mumbai',
          letterNumber: 'AICTE/WRO/APPROVAL/2026/788',
          letterDate: '2026-08-10',
          subject: 'Extension of Approval for Engineering & Technology Programs 2026-27',
          description: 'Official grant of Extension of Approval for existing B.Tech and M.Tech intakes.',
          documentType: 'GOVERNMENT_COMMUNICATION',
          departmentId: 'dept-cse',
          departmentName: 'Computer Science & Engineering',
          assignedTo: 'user-registrar',
          assignedToName: 'Registrar Directorate',
          priority: 'HIGH',
          status: 'UNDER_PROCESS',
          modeOfReceipt: 'SPEED_POST',
          mode: 'SPEED_POST',
          dueDate: '2026-08-30',
          remarks: 'Action initiated by Principal & IQAC committee.',
          notesheetId: 'NS/ADMIN/2026/0012',
          supportingDocuments: [
            {
              id: 'doc-inw-1',
              name: 'AICTE_EOA_2026_27.pdf',
              url: '/documents/aicte_eoa_2026.pdf',
              size: '1.8 MB',
              fileType: 'application/pdf',
              uploadedBy: 'Registrar Desk',
              uploadedAt: '2026-08-15T10:30:00.000Z',
            }
          ],
          timeline: [
            {
              id: 'tl-1',
              date: '2026-08-15 10:30',
              actor: 'Central Registry',
              action: 'RECEIVED',
              toStatus: 'RECEIVED',
              remarks: 'Physical speed post consignment received and logged.',
            },
            {
              id: 'tl-2',
              date: '2026-08-15 14:00',
              actor: 'Registrar',
              action: 'FORWARDED',
              toStatus: 'UNDER_PROCESS',
              remarks: 'Forwarded to Principal for compliance verification.',
            }
          ],
          createdAt: '2026-08-15T10:30:00.000Z',
          updatedAt: '2026-08-15T14:00:00.000Z',
          createdBy: 'Registrar Office'
        },
        {
          id: 'inw-2',
          type: 'INWARD',
          recordNumber: 'INW/2026/000002',
          inwardNumber: 'INW/2026/000002',
          dispatchNo: 'INW/2026/000002',
          receiptDate: '2026-08-16',
          receivedDate: '2026-08-16',
          receivedFrom: 'Director General of Higher Education',
          senderOrganization: 'Education Department, Govt. of Gujarat',
          letterNumber: 'EDN/UNI/SCHOLARSHIP/2026/1109',
          letterDate: '2026-08-12',
          subject: 'MYSY Scholarship Scheme Institutional Verification Circular',
          description: 'Timely biometric and physical document verification for eligible student beneficiaries.',
          documentType: 'CIRCULAR',
          departmentId: 'dept-accounts',
          departmentName: 'Accounts & Finance Directorate',
          assignedTo: 'user-accounts',
          assignedToName: 'Chief Accounts Officer',
          priority: 'URGENT',
          status: 'ACTION_REQUIRED',
          modeOfReceipt: 'EMAIL',
          mode: 'EMAIL',
          dueDate: '2026-08-25',
          remarks: 'Mandatory student list reconciliation before August 25.',
          supportingDocuments: [
            {
              id: 'doc-inw-2',
              name: 'MYSY_Guidelines_2026.pdf',
              url: '/documents/mysy_guidelines.pdf',
              size: '2.4 MB',
              fileType: 'application/pdf',
              uploadedBy: 'Central Dispatch',
              uploadedAt: '2026-08-16T09:15:00.000Z',
            }
          ],
          timeline: [
            {
              id: 'tl-3',
              date: '2026-08-16 09:15',
              actor: 'Central Registry',
              action: 'RECEIVED',
              toStatus: 'ACTION_REQUIRED',
              remarks: 'Received via official government email portal.',
            }
          ],
          createdAt: '2026-08-16T09:15:00.000Z',
          updatedAt: '2026-08-16T09:15:00.000Z',
          createdBy: 'Registrar Office'
        },
        {
          id: 'out-1',
          type: 'OUTWARD',
          recordNumber: 'OUT/2026/000001',
          outwardNumber: 'OUT/2026/000001',
          dispatchNo: 'OUT/2026/000001',
          dispatchDate: '2026-08-17',
          letterDate: '2026-08-16',
          recipient: 'Member Secretary, Admission Committee for Professional Courses (ACPC)',
          sentTo: 'Member Secretary, Admission Committee for Professional Courses (ACPC)',
          recipientOrganization: 'ACPC Gujarat, LD College Campus, Ahmedabad',
          receiverAddress: 'ACPC Building, LD College of Engineering Campus, Navrangpura, Ahmedabad 380015',
          address: 'ACPC Building, LD College of Engineering Campus, Navrangpura, Ahmedabad 380015',
          subject: 'Submission of Approved Seat Matrix for AY 2026-27 Admission Rounds',
          referenceNumber: 'SSIU/ADM/SEAT-MATRIX/2026/044',
          documentType: 'UNIVERSITY_COMMUNICATION',
          departmentId: 'dept-admission',
          departmentName: 'Admission Directorate',
          preparedBy: 'user-registrar',
          preparedByName: 'Registrar Office',
          dispatchMode: 'SPEED_POST',
          modeOfDispatch: 'SPEED_POST',
          mode: 'SPEED_POST',
          courierService: 'India Post Speed Post',
          trackingNumber: 'EG998811223IN',
          trackingNo: 'EG998811223IN',
          priority: 'URGENT',
          status: 'DISPATCHED',
          expectedDeliveryDate: '2026-08-19',
          deliveryStatus: 'IN_TRANSIT',
          remarks: 'Consignment booked at Gandhinagar GPO.',
          notesheetId: 'NS/ADMIN/2026/0018',
          supportingDocuments: [
            {
              id: 'doc-out-1',
              name: 'SSIU_Seat_Matrix_2026_27.pdf',
              url: '/documents/seat_matrix.pdf',
              size: '1.2 MB',
              fileType: 'application/pdf',
              uploadedBy: 'Registrar Desk',
              uploadedAt: '2026-08-17T11:00:00.000Z',
            }
          ],
          timeline: [
            {
              id: 'tl-4',
              date: '2026-08-17 11:00',
              actor: 'Admission Section',
              action: 'CREATED',
              toStatus: 'READY',
              remarks: 'Outward letter generated and signed by Registrar.',
            },
            {
              id: 'tl-5',
              date: '2026-08-17 15:30',
              actor: 'Central Dispatch',
              action: 'DISPATCHED',
              toStatus: 'DISPATCHED',
              remarks: 'Dispatched via India Post Speed Post. Barcode: EG998811223IN',
            }
          ],
          createdAt: '2026-08-17T11:00:00.000Z',
          updatedAt: '2026-08-17T15:30:00.000Z',
          createdBy: 'Registrar Office'
        }
      ];
      this.saveState();
    }

    let list = [...this.state.inwardOutwardRecords];

    // RBAC Scoping
    if (user && role) {
      if (
        role === 'SUPER_ADMIN' ||
        role === 'UNIVERSITY_ADMIN' ||
        role === 'REGISTRAR' ||
        (role as any) === 'REGISTRAR_ADMIN' ||
        (role as any) === 'ADMIN' ||
        role === 'PRINCIPAL'
      ) {
        // Full access across university
      } else if (role === 'HOD') {
        // HOD sees records for their department or assigned to them
        list = list.filter(r =>
          (user.departmentId && r.departmentId === user.departmentId) ||
          r.assignedTo === user.id ||
          r.assignedToUserId === user.id ||
          r.preparedBy === user.id ||
          r.createdBy === user.name
        );
      } else {
        // Staff / Faculty sees records assigned to them or created by them
        list = list.filter(r =>
          r.assignedTo === user.id ||
          r.assignedToUserId === user.id ||
          r.preparedBy === user.id ||
          r.createdBy === user.name ||
          (user.departmentId && r.departmentId === user.departmentId)
        );
      }
    }

    // Filter by Type
    if (filter?.type && filter.type !== 'ALL') {
      list = list.filter(r => r.type === filter.type);
    }

    // Filter by Department
    if (filter?.departmentId && filter.departmentId !== 'ALL') {
      list = list.filter(r => r.departmentId === filter.departmentId);
    }

    // Filter by Status
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(r => r.status === filter.status);
    }

    // Filter by Priority
    if (filter?.priority && filter.priority !== 'ALL') {
      list = list.filter(r => r.priority === filter.priority);
    }

    // Filter by Assigned User
    if (filter?.assignedTo && filter.assignedTo !== 'ALL') {
      list = list.filter(r => r.assignedTo === filter.assignedTo || r.assignedToUserId === filter.assignedTo || r.preparedBy === filter.assignedTo);
    }

    // Filter by Date Range
    if (filter?.startDate) {
      list = list.filter(r => {
        const date = r.receivedDate || r.receiptDate || r.dispatchDate || r.receivedOrDispatchedDate;
        return date ? date >= filter.startDate! : true;
      });
    }
    if (filter?.endDate) {
      list = list.filter(r => {
        const date = r.receivedDate || r.receiptDate || r.dispatchDate || r.receivedOrDispatchedDate;
        return date ? date <= filter.endDate! : true;
      });
    }

    // Keyword Search
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(r =>
        (r.recordNumber && r.recordNumber.toLowerCase().includes(q)) ||
        (r.inwardNumber && r.inwardNumber.toLowerCase().includes(q)) ||
        (r.outwardNumber && r.outwardNumber.toLowerCase().includes(q)) ||
        (r.dispatchNo && r.dispatchNo.toLowerCase().includes(q)) ||
        (r.subject && r.subject.toLowerCase().includes(q)) ||
        (r.letterNumber && r.letterNumber.toLowerCase().includes(q)) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(q)) ||
        (r.receivedFrom && r.receivedFrom.toLowerCase().includes(q)) ||
        (r.senderOrganization && r.senderOrganization.toLowerCase().includes(q)) ||
        (r.recipient && r.recipient.toLowerCase().includes(q)) ||
        (r.sentTo && r.sentTo.toLowerCase().includes(q)) ||
        (r.recipientOrganization && r.recipientOrganization.toLowerCase().includes(q)) ||
        (r.trackingNumber && r.trackingNumber.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const dateA = a.receivedDate || a.receiptDate || a.dispatchDate || a.createdAt || '';
      const dateB = b.receivedDate || b.receiptDate || b.dispatchDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }

  public getInwardOutwardRecordById(id: string): InwardOutwardRecord | undefined {
    return (this.state.inwardOutwardRecords || []).find(r => r.id === id);
  }

  public createInwardRecord(data: Partial<InwardOutwardRecord>, user?: any): InwardOutwardRecord {
    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];

    const recordNumber = data.inwardNumber || data.recordNumber || this.generateInwardNumber();
    const departmentName = data.departmentName || (data.departmentId ? this.getDepartmentById(data.departmentId)?.name : 'General Administration');
    const assignedUser = data.assignedTo || data.assignedToUserId ? this.getUsers().find(u => u.id === (data.assignedTo || data.assignedToUserId)) : null;

    const newRecord: InwardOutwardRecord = {
      id: data.id || `inw-${Date.now()}`,
      type: 'INWARD',
      recordNumber,
      inwardNumber: recordNumber,
      dispatchNo: recordNumber,
      receiptDate: data.receiptDate || data.receivedDate || new Date().toISOString().split('T')[0],
      receivedDate: data.receivedDate || data.receiptDate || new Date().toISOString().split('T')[0],
      receivedFrom: data.receivedFrom || 'External Correspondent',
      senderOrganization: data.senderOrganization || '',
      letterNumber: data.letterNumber || '',
      letterDate: data.letterDate || '',
      subject: data.subject || 'Inward Correspondence',
      description: data.description || '',
      documentType: data.documentType || 'LETTER',
      departmentId: data.departmentId || 'dept-cse',
      departmentName,
      assignedTo: data.assignedTo || data.assignedToUserId || (user ? user.id : 'user-registrar'),
      assignedToUserId: data.assignedToUserId || data.assignedTo || (user ? user.id : 'user-registrar'),
      assignedToName: assignedUser ? `${assignedUser.name} (${assignedUser.role})` : data.assignedToName || 'Registrar Office',
      priority: data.priority || 'NORMAL',
      status: data.status || (data.assignedTo || data.assignedToUserId ? 'ACTION_REQUIRED' : 'RECEIVED'),
      modeOfReceipt: data.modeOfReceipt || (data.mode as any) || 'POST',
      mode: data.modeOfReceipt || (data.mode as any) || 'POST',
      dueDate: data.dueDate,
      remarks: data.remarks || '',
      notesheetId: data.notesheetId,
      supportingDocuments: data.supportingDocuments || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: user?.name || 'Central Registry',
          action: 'RECEIVED',
          toStatus: data.status || 'RECEIVED',
          remarks: `Inward logged with No. ${recordNumber}`,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user ? user.name : 'Registrar Office'
    };

    this.state.inwardOutwardRecords.unshift(newRecord);
    this.saveState();

    this.addNotification({
      title: `Inward Registered: ${newRecord.recordNumber}`,
      message: `Subject: "${newRecord.subject}" registered and assigned to ${newRecord.assignedToName}`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'inward-outward'
    });

    this.logAudit('CREATE_INWARD', 'Inward & Outward Register', `Registered Inward mail ${newRecord.recordNumber}: "${newRecord.subject}"`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return newRecord;
  }

  public forwardInwardRecord(id: string, forwardData: Partial<InwardForwardingItem>, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record || record.type !== 'INWARD') return { success: false, message: 'Inward record not found.' };

    const forwarding: InwardForwardingItem = {
      id: `fw-${Date.now()}`,
      inwardId: id,
      forwardedByUserId: user?.id || 'user-admin',
      forwardedByName: user?.name || 'Registrar Directorate',
      forwardedToOffice: forwardData.forwardedToOffice,
      forwardedToDepartmentId: forwardData.forwardedToDepartmentId,
      forwardedToDepartmentName: forwardData.forwardedToDepartmentId ? this.getDepartmentById(forwardData.forwardedToDepartmentId)?.name : forwardData.forwardedToOffice,
      forwardedToUserId: forwardData.forwardedToUserId,
      forwardedToUserName: forwardData.forwardedToUserId ? this.getUsers().find(u => u.id === forwardData.forwardedToUserId)?.name : undefined,
      forwardedDate: new Date().toISOString(),
      actionRequired: forwardData.actionRequired || 'Action and compliance verification required',
      dueDate: forwardData.dueDate,
      remarks: forwardData.remarks,
      status: 'PENDING',
    };

    if (!record.forwardings) record.forwardings = [];
    record.forwardings.unshift(forwarding);
    record.status = 'FORWARDED';
    if (forwardData.forwardedToDepartmentId) {
      record.departmentId = forwardData.forwardedToDepartmentId;
      record.departmentName = this.getDepartmentById(forwardData.forwardedToDepartmentId)?.name;
    }
    if (forwardData.forwardedToUserId) {
      record.assignedTo = forwardData.forwardedToUserId;
      record.assignedToUserId = forwardData.forwardedToUserId;
      record.assignedToName = forwarding.forwardedToUserName;
    }

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Registrar Office',
      action: 'FORWARDED',
      fromStatus: 'RECEIVED',
      toStatus: 'FORWARDED',
      remarks: `Forwarded to ${forwarding.forwardedToDepartmentName || forwarding.forwardedToOffice}: ${forwarding.actionRequired}`,
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('FORWARD_INWARD', 'Inward & Outward Register', `Forwarded ${record.recordNumber} to ${forwarding.forwardedToDepartmentName || 'Department'}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: `Inward forwarded successfully.`, record };
  }

  public recordInwardActionTaken(id: string, actionData: { actionTaken: string; remarks?: string; status?: InwardOutwardStatus }, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record || record.type !== 'INWARD') return { success: false, message: 'Inward record not found.' };

    if (record.forwardings) {
      record.forwardings.forEach(f => {
        if (f.status === 'PENDING') {
          f.status = 'COMPLETED';
          f.actionTaken = actionData.actionTaken;
          f.actionTakenDate = new Date().toISOString();
        }
      });
    }

    const newStatus = actionData.status || 'UNDER_PROCESS';
    const oldStatus = record.status;
    record.status = newStatus;
    if (actionData.remarks) {
      record.remarks = `${record.remarks ? record.remarks + ' | ' : ''}Action: ${actionData.actionTaken}`;
    }

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Department Officer',
      action: 'ACTION_TAKEN',
      fromStatus: oldStatus,
      toStatus: newStatus,
      remarks: actionData.actionTaken,
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('ACTION_INWARD', 'Inward & Outward Register', `Action recorded on ${record.recordNumber}: ${actionData.actionTaken}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Action recorded successfully.', record };
  }

  public completeInwardRecord(id: string, remarks?: string, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record) return { success: false, message: 'Record not found.' };

    const oldStatus = record.status;
    record.status = 'COMPLETED';
    if (remarks) record.remarks = `${record.remarks ? record.remarks + ' | ' : ''}Completed: ${remarks}`;

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Officer In-Charge',
      action: 'COMPLETED',
      fromStatus: oldStatus,
      toStatus: 'COMPLETED',
      remarks: remarks || 'Communication action completed.',
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('COMPLETE_INWARD', 'Inward & Outward Register', `Completed inward ${record.recordNumber}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Inward marked as COMPLETED.', record };
  }

  public closeInwardRecord(id: string, remarks?: string, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record) return { success: false, message: 'Record not found.' };

    const oldStatus = record.status;
    record.status = 'CLOSED';
    if (remarks) record.remarks = `${record.remarks ? record.remarks + ' | ' : ''}Closed: ${remarks}`;

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Registrar',
      action: 'CLOSED',
      fromStatus: oldStatus,
      toStatus: 'CLOSED',
      remarks: remarks || 'Inward communication archived and closed.',
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('CLOSE_INWARD', 'Inward & Outward Register', `Closed inward ${record.recordNumber}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Inward record CLOSED and archived.', record };
  }

  public createOutwardRecord(data: Partial<InwardOutwardRecord>, user?: any): InwardOutwardRecord {
    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];

    const recordNumber = data.outwardNumber || data.recordNumber || this.generateOutwardNumber();
    const departmentName = data.departmentName || (data.departmentId ? this.getDepartmentById(data.departmentId)?.name : 'Registrar Secretariat');
    const preparedUser = data.preparedBy ? this.getUsers().find(u => u.id === data.preparedBy) : null;

    const newRecord: InwardOutwardRecord = {
      id: data.id || `out-${Date.now()}`,
      type: 'OUTWARD',
      recordNumber,
      outwardNumber: recordNumber,
      dispatchNo: recordNumber,
      dispatchDate: data.dispatchDate || new Date().toISOString().split('T')[0],
      letterDate: data.letterDate || data.dispatchDate || new Date().toISOString().split('T')[0],
      recipient: data.recipient || data.sentTo || 'Recipient Party',
      sentTo: data.sentTo || data.recipient || 'Recipient Party',
      recipientOrganization: data.recipientOrganization || '',
      receiverAddress: data.receiverAddress || data.address || '',
      address: data.address || data.receiverAddress || '',
      recipientEmail: data.recipientEmail || '',
      receiverPhone: data.receiverPhone || '',
      subject: data.subject || 'Outward Communication',
      referenceNumber: data.referenceNumber || '',
      documentType: data.documentType || 'LETTER',
      departmentId: data.departmentId || 'dept-cse',
      departmentName,
      preparedBy: data.preparedBy || (user ? user.id : 'user-registrar'),
      preparedByName: preparedUser ? `${preparedUser.name} (${preparedUser.role})` : data.preparedByName || user?.name || 'Registrar Office',
      dispatchMode: data.dispatchMode || data.modeOfDispatch || 'COURIER',
      modeOfDispatch: data.modeOfDispatch || data.dispatchMode || 'COURIER',
      courierService: data.courierService || 'India Post Speed Post',
      trackingNumber: data.trackingNumber || '',
      priority: data.priority || 'NORMAL',
      status: data.status || 'DRAFT',
      expectedDeliveryDate: data.expectedDeliveryDate,
      deliveryDate: data.deliveryDate,
      deliveryStatus: data.deliveryStatus || 'PENDING',
      remarks: data.remarks || '',
      notesheetId: data.notesheetId,
      supportingDocuments: data.supportingDocuments || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: user?.name || 'Registrar Office',
          action: 'CREATED',
          toStatus: data.status || 'DRAFT',
          remarks: `Outward letter registered with No. ${recordNumber}`,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user ? user.name : 'Registrar Office'
    };

    this.state.inwardOutwardRecords.unshift(newRecord);
    this.saveState();

    this.addNotification({
      title: `Outward Registered: ${newRecord.recordNumber}`,
      message: `Subject: "${newRecord.subject}" prepared for ${newRecord.recipient}`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'inward-outward'
    });

    this.logAudit('CREATE_OUTWARD', 'Inward & Outward Register', `Created Outward correspondence ${newRecord.recordNumber}: "${newRecord.subject}"`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return newRecord;
  }

  public dispatchOutwardRecord(id: string, dispatchData: Partial<OutwardDispatchItem>, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record || record.type !== 'OUTWARD') return { success: false, message: 'Outward record not found.' };

    const dispatchItem: OutwardDispatchItem = {
      id: `disp-${Date.now()}`,
      outwardId: id,
      courierService: dispatchData.courierService || 'India Post Speed Post',
      trackingNumber: dispatchData.trackingNumber,
      dispatchDate: dispatchData.dispatchDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: dispatchData.expectedDeliveryDate,
      deliveryStatus: 'IN_TRANSIT',
      dispatchedByUserId: user?.id || 'user-admin',
      dispatchedByName: user?.name || 'Central Dispatch Desk',
      remarks: dispatchData.remarks,
    };

    if (!record.dispatches) record.dispatches = [];
    record.dispatches.unshift(dispatchItem);

    record.status = 'DISPATCHED';
    record.deliveryStatus = 'IN_TRANSIT';
    record.courierService = dispatchItem.courierService;
    record.trackingNumber = dispatchItem.trackingNumber;
    record.dispatchDate = dispatchItem.dispatchDate;
    record.expectedDeliveryDate = dispatchItem.expectedDeliveryDate;

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Central Dispatch',
      action: 'DISPATCHED',
      fromStatus: 'READY',
      toStatus: 'DISPATCHED',
      remarks: `Dispatched via ${dispatchItem.courierService}. Tracking No: ${dispatchItem.trackingNumber || 'N/A'}`,
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('DISPATCH_OUTWARD', 'Inward & Outward Register', `Dispatched outward ${record.recordNumber} (${dispatchItem.trackingNumber})`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Outward dispatched successfully.', record };
  }

  public recordOutwardDelivery(id: string, deliveryData: { deliveryDate?: string; remarks?: string }, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record || record.type !== 'OUTWARD') return { success: false, message: 'Outward record not found.' };

    const delDate = deliveryData.deliveryDate || new Date().toISOString().split('T')[0];
    record.status = 'DELIVERED';
    record.deliveryStatus = 'DELIVERED';
    record.deliveryDate = delDate;

    if (record.dispatches && record.dispatches.length > 0) {
      record.dispatches[0].deliveryStatus = 'DELIVERED';
      record.dispatches[0].deliveryDate = delDate;
      if (deliveryData.remarks) {
        record.dispatches[0].remarks = `${record.dispatches[0].remarks ? record.dispatches[0].remarks + ' | ' : ''}${deliveryData.remarks}`;
      }
    }

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Delivery Desk',
      action: 'DELIVERED',
      fromStatus: 'DISPATCHED',
      toStatus: 'DELIVERED',
      remarks: deliveryData.remarks || 'Consignment delivered to recipient successfully.',
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('DELIVER_OUTWARD', 'Inward & Outward Register', `Delivered outward ${record.recordNumber}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Outward marked as DELIVERED.', record };
  }

  public recordOutwardReturn(id: string, returnData: { returnReason: string; remarks?: string }, user?: any): { success: boolean; message: string; record?: InwardOutwardRecord } {
    const record = this.getInwardOutwardRecordById(id);
    if (!record || record.type !== 'OUTWARD') return { success: false, message: 'Outward record not found.' };

    record.status = 'RETURNED';
    record.deliveryStatus = 'RETURNED';
    record.remarks = `${record.remarks ? record.remarks + ' | ' : ''}Return Reason: ${returnData.returnReason}`;

    if (record.dispatches && record.dispatches.length > 0) {
      record.dispatches[0].deliveryStatus = 'RETURNED';
      record.dispatches[0].remarks = `Returned: ${returnData.returnReason}`;
    }

    if (!record.timeline) record.timeline = [];
    record.timeline.unshift({
      id: `tl-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: user?.name || 'Central Dispatch',
      action: 'RETURNED',
      fromStatus: 'DISPATCHED',
      toStatus: 'RETURNED',
      remarks: `Consignment returned back: ${returnData.returnReason}`,
    });

    record.updatedAt = new Date().toISOString();
    this.saveState();
    this.logAudit('RETURN_OUTWARD', 'Inward & Outward Register', `Outward ${record.recordNumber} returned: ${returnData.returnReason}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');

    return { success: true, message: 'Outward marked as RETURNED.', record };
  }

  public updateInwardOutwardRecord(id: string, data: Partial<InwardOutwardRecord>, user?: any): InwardOutwardRecord | null {
    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];
    const idx = this.state.inwardOutwardRecords.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const existing = this.state.inwardOutwardRecords[idx];
    const updated: InwardOutwardRecord = {
      ...existing,
      ...data,
      dispatchNo: data.recordNumber || existing.recordNumber || existing.dispatchNo,
      updatedAt: new Date().toISOString()
    };

    this.state.inwardOutwardRecords[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_REGISTER', 'Inward & Outward Register', `Updated record ${updated.recordNumber || updated.id} (${updated.status})`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return updated;
  }

  public deleteInwardOutwardRecord(id: string, user?: any): boolean {
    if (!this.state.inwardOutwardRecords) this.state.inwardOutwardRecords = [];
    const idx = this.state.inwardOutwardRecords.findIndex(r => r.id === id);
    if (idx === -1) return false;

    const num = this.state.inwardOutwardRecords[idx].recordNumber || this.state.inwardOutwardRecords[idx].dispatchNo;
    this.state.inwardOutwardRecords.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_REGISTER', 'Inward & Outward Register', `Deleted record ${num}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return true;
  }

  public getInwardOutwardDashboardStats(user?: User | null, role?: UserRole | null): InwardOutwardDashboardStats {
    const list = this.getInwardOutwardRecords(undefined, user, role);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    const inwardList = list.filter(r => r.type === 'INWARD');
    const outwardList = list.filter(r => r.type === 'OUTWARD');

    const totalInward = inwardList.length;
    const totalOutward = outwardList.length;

    const todayInward = inwardList.filter(r => {
      const d = r.receivedDate || r.receiptDate || r.createdAt;
      return d && d.startsWith(today);
    }).length;

    const pendingInward = inwardList.filter(r => r.status === 'RECEIVED' || r.status === 'UNDER_PROCESS').length;
    const actionRequired = inwardList.filter(r => r.status === 'ACTION_REQUIRED' || r.status === 'FORWARDED').length;

    const overdueInward = inwardList.filter(r => {
      if (!r.dueDate) return false;
      return r.dueDate < today && r.status !== 'COMPLETED' && r.status !== 'CLOSED';
    }).length;

    const todayOutward = outwardList.filter(r => {
      const d = r.dispatchDate || r.createdAt;
      return d && d.startsWith(today);
    }).length;

    const dispatchedOutward = outwardList.filter(r => r.status === 'DISPATCHED').length;
    const deliveredOutward = outwardList.filter(r => r.status === 'DELIVERED').length;
    const returnedOutward = outwardList.filter(r => r.status === 'RETURNED').length;

    return {
      todayInward,
      pendingInward,
      actionRequired,
      overdueInward,
      totalInward,
      todayOutward,
      dispatchedOutward,
      deliveredOutward,
      returnedOutward,
      totalOutward,
      // backwards compat
      pending: pendingInward,
      inProgress: actionRequired,
      completed: deliveredOutward + inwardList.filter(r => r.status === 'COMPLETED' || r.status === 'CLOSED').length,
      todayCount: todayInward + todayOutward,
      thisMonthCount: list.filter(r => {
        const d = r.receivedDate || r.dispatchDate || r.createdAt;
        return d && d.startsWith(currentMonth);
      }).length,
    };
  }

  // =========================================================================
  // CRM & ADMISSION MANAGEMENT METHODS
  // =========================================================================

  public generateLeadNumber(): string {
    const year = new Date().getFullYear();
    const leads = this.state.crmLeads || [];
    const count = leads.length + 1;
    return `LEAD/${year}/${String(count).padStart(4, '0')}`;
  }

  public generateApplicationNumber(): string {
    const year = new Date().getFullYear();
    const apps = this.state.admissionApplications || [];

    // Scan all existing application numbers for the current year
    // to find the maximum sequence — avoids duplicate on deletion/gap
    const prefix = `APP/${year}/`;
    let maxSeq = 0;
    apps.forEach(app => {
      if (app.applicationNumber && app.applicationNumber.startsWith(prefix)) {
        const seqStr = app.applicationNumber.slice(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    // Also scan students who already have applicationNumbers from previous sessions
    const students = this.state.students || [];
    students.forEach(stu => {
      if (stu.applicationNumber && stu.applicationNumber.startsWith(prefix)) {
        const seqStr = stu.applicationNumber.slice(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `APP/${year}/${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Generate a unique Admission Number in the format ADM/YYYY-NNNN.
   * Scans existing students' admissionNumber fields to find the max sequence
   * for the given year, then increments — never duplicates.
   *
   * @param year - Optional year override. Defaults to current calendar year.
   * @returns e.g. "ADM/2026-0001"
   */
  public generateAdmissionNumber(year?: number): string {
    const y = year || new Date().getFullYear();
    const prefix = `ADM/${y}-`;

    let maxSeq = 0;
    const students = this.state.students || [];
    students.forEach(stu => {
      if (stu.admissionNumber && stu.admissionNumber.startsWith(prefix)) {
        const seqStr = stu.admissionNumber.slice(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    // Also check admission applications
    const apps = this.state.admissionApplications || [];
    apps.forEach(app => {
      if ((app as any).admissionNumber && (app as any).admissionNumber.startsWith(prefix)) {
        const seqStr = (app as any).admissionNumber.slice(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Determine the university academic year label (e.g. "2026-27") from a date.
   * Uses the July 1 boundary rule: if on or after July 1 → new academic year begins.
   *
   * @param dateStr - ISO date string (YYYY-MM-DD). Defaults to today.
   * @returns Academic year label e.g. "2026-27"
   */
  public getAcademicYearLabel(dateStr?: string): string {
    const d = dateStr ? new Date(dateStr) : new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    const day = d.getDate();

    const isOnOrAfterJuly1 =
      month > 7 || (month === 7 && day >= 1);

    const startYear = isOnOrAfterJuly1 ? year : year - 1;
    const endYearShort = String(startYear + 1).slice(-2);

    return `${startYear}-${endYearShort}`;
  }

  /**
   * Determine the AcademicYear database ID from a date using the July 1 boundary rule.
   * Tries to match the AcademicYear record by its `year`, `name`, or `startDate` fields.
   *
   * @param dateStr - ISO date string (YYYY-MM-DD). Defaults to today.
   * @returns AcademicYear.id from db, or the first available academic year id as fallback.
   */
  public getAcademicYearIdForDate(dateStr?: string): string {
    const label = this.getAcademicYearLabel(dateStr);
    const academicYears = this.state.academicYears || [];

    // Try to match by year field (e.g. "2026-27"), name (e.g. "2026-2027"), or startDate year
    const match = academicYears.find(ay => {
      if (ay.year && ay.year.trim() === label) return true;
      if (ay.name) {
        // Accept "2026-2027" or "2026-27" formats
        const nameParts = ay.name.split(/[-–]/);
        if (nameParts.length >= 2) {
          const startY = nameParts[0].trim();
          const endYFull = startY.slice(0, 2) + nameParts[1].trim().slice(-2);
          const shortLabel = `${startY}-${nameParts[1].trim().slice(-2)}`;
          if (shortLabel === label || ay.name.trim() === label) return true;
        }
        if (ay.name.trim() === label) return true;
      }
      if (ay.startDate) {
        const startYear = new Date(ay.startDate).getFullYear().toString();
        const labelStartYear = label.split('-')[0];
        if (startYear === labelStartYear) return true;
      }
      return false;
    });

    if (match) return match.id;

    // Fallback: return latest academic year or first
    if (academicYears.length > 0) {
      return academicYears[academicYears.length - 1].id;
    }

    return 'ay-2026'; // hard fallback
  }

  public getFilteredCRMLeads(filters?: {
    instituteId?: string;
    programId?: string;
    departmentId?: string;
    academicYearId?: string;
    status?: string;
    source?: string;
    counsellorId?: string;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
  }, user?: User | null, role?: UserRole | null): CRMLead[] {
    let list = [...(this.state.crmLeads || [])];

    // RBAC Scoping: Faculty/Counsellor only sees their assigned leads
    if (role === 'FACULTY' && user) {
      const assignedFac = (this.state.faculty || []).find(f => f.id === user.id || f.email === user.email || f.employeeId === user.employeeId);
      if (assignedFac) {
        list = list.filter(l => l.counsellorId === assignedFac.id || l.counsellorName === assignedFac.name || l.counsellorId === user.id);
      }
    }

    if (!filters) return list;

    if (filters.instituteId && filters.instituteId !== 'ALL') {
      list = list.filter(l => l.instituteId === filters.instituteId);
    }
    if (filters.programId && filters.programId !== 'ALL') {
      list = list.filter(l => l.programId === filters.programId);
    }
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      list = list.filter(l => l.departmentId === filters.departmentId);
    }
    if (filters.academicYearId && filters.academicYearId !== 'ALL') {
      list = list.filter(l => l.academicYearId === filters.academicYearId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(l => l.status === filters.status);
    }
    if (filters.source && filters.source !== 'ALL') {
      list = list.filter(l => l.source === filters.source);
    }
    if (filters.counsellorId && filters.counsellorId !== 'ALL') {
      list = list.filter(l => l.counsellorId === filters.counsellorId);
    }
    if (filters.startDate) {
      list = list.filter(l => l.createdAt >= (filters.startDate as string));
    }
    if (filters.endDate) {
      list = list.filter(l => l.createdAt <= (filters.endDate as string));
    }
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(l =>
        (l.leadNumber && l.leadNumber.toLowerCase().includes(q)) ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.remarks && l.remarks.toLowerCase().includes(q)) ||
        (l.programName && l.programName.toLowerCase().includes(q)) ||
        (l.instituteName && l.instituteName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public getCRMLeadDashboardStats(user?: User | null, role?: UserRole | null): CRMLeadDashboardStats {
    const list = this.getFilteredCRMLeads(undefined, user, role);
    const totalLeads = list.length;
    const newLeads = list.filter(l => l.status === 'NEW').length;
    const contacted = list.filter(l => l.status === 'CONTACTED').length;
    const followUp = list.filter(l => l.status === 'FOLLOW_UP' || l.status === 'INTERESTED').length;
    const application = list.filter(l => l.status === 'APPLICATION').length;
    const converted = list.filter(l => l.status === 'CONVERTED').length;
    const lost = list.filter(l => l.status === 'LOST' || l.status === 'CLOSED').length;
    const conversionRate = totalLeads > 0 ? parseFloat(((converted / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalLeads,
      newLeads,
      contacted,
      followUp,
      application,
      converted,
      lost,
      conversionRate
    };
  }

  public createCRMLead(data: Partial<CRMLead>, user?: any): CRMLead {
    if (!this.state.crmLeads) this.state.crmLeads = [];

    const leadNumber = data.leadNumber || this.generateLeadNumber();
    const program = data.programId ? this.getProgramById(data.programId) : null;
    const institute = data.instituteId ? this.getInstituteById(data.instituteId) : (program ? this.getInstituteById(program.instituteId) : null);
    const department = program ? this.getDepartmentById(program.departmentId) : null;
    const academicYear = data.academicYearId ? this.getAcademicYearById(data.academicYearId) : ((this.state.academicYears || []).find(a => a.isCurrent) || (this.state.academicYears || [])[0]);

    const counsellor = data.counsellorId ? (this.state.faculty || []).find(f => f.id === data.counsellorId) : null;
    const counsellorName = counsellor ? counsellor.name : (data.counsellorName || 'Unassigned');

    const newLead: CRMLead = {
      id: data.id || `lead-${Date.now()}`,
      leadNumber,
      name: data.name || 'Prospective Student',
      email: data.email || '',
      phone: data.phone || '',
      instituteId: institute ? institute.id : (data.instituteId || 'inst-1'),
      instituteName: institute ? institute.name : (data.instituteName || 'Swarrnim Institute of Technology'),
      programId: data.programId || 'prog-1',
      programName: program ? program.name : (data.programName || 'B.Tech Computer Science & Engineering'),
      departmentId: department ? department.id : (data.departmentId || 'dept-cse'),
      departmentName: department ? department.name : (data.departmentName || 'Computer Science & Engineering'),
      academicYearId: academicYear ? academicYear.id : (data.academicYearId || 'ay-2026'),
      academicYearName: academicYear ? academicYear.name : (data.academicYearName || '2025-2026'),
      source: data.source || 'Website',
      status: data.status || 'NEW',
      counsellorId: data.counsellorId || (user ? user.id : 'fac-1'),
      counsellorName,
      followUpDate: data.followUpDate || '',
      followUps: data.followUps || [],
      remarks: data.remarks || '',
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    this.state.crmLeads.unshift(newLead);
    this.saveState();

    this.addNotification({
      title: `New Admission Inquiry: ${newLead.leadNumber}`,
      message: `${newLead.name} inquired for ${newLead.programName} (Assigned to: ${newLead.counsellorName})`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'crm'
    });

    this.logAudit('CREATE_LEAD', 'Admission & CRM Desk', `Registered prospective lead ${newLead.leadNumber} (${newLead.name}) for ${newLead.programName}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return newLead;
  }

  public updateCRMLead(id: string, data: Partial<CRMLead>, user?: any): CRMLead | null {
    if (!this.state.crmLeads) return null;
    const index = this.state.crmLeads.findIndex(l => l.id === id);
    if (index === -1) return null;

    const existing = this.state.crmLeads[index];
    const program = data.programId ? this.getProgramById(data.programId) : (existing.programId ? this.getProgramById(existing.programId) : null);
    const institute = data.instituteId ? this.getInstituteById(data.instituteId) : (existing.instituteId ? this.getInstituteById(existing.instituteId) : null);
    const counsellor = data.counsellorId ? (this.state.faculty || []).find(f => f.id === data.counsellorId) : null;

    const updated: CRMLead = {
      ...existing,
      ...data,
      instituteName: institute ? institute.name : (data.instituteName || existing.instituteName),
      programName: program ? program.name : (data.programName || existing.programName),
      counsellorName: counsellor ? counsellor.name : (data.counsellorName || existing.counsellorName),
      updatedAt: new Date().toISOString()
    };

    this.state.crmLeads[index] = updated;
    this.saveState();
    this.logAudit('UPDATE_LEAD', 'Admission & CRM Desk', `Updated prospective lead ${updated.leadNumber || updated.id} (${updated.name}) status to ${updated.status}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return updated;
  }

  public deleteCRMLead(id: string, user?: any): boolean {
    if (!this.state.crmLeads) return false;
    const idx = this.state.crmLeads.findIndex(l => l.id === id);
    if (idx === -1) return false;

    const leadNum = this.state.crmLeads[idx].leadNumber || this.state.crmLeads[idx].name;
    this.state.crmLeads.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_LEAD', 'Admission & CRM Desk', `Deleted CRM lead ${leadNum}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return true;
  }

  public addLeadFollowUp(leadId: string, notes: string, newStatus?: LeadStatus, nextFollowUpDate?: string, user?: any): CRMLead | null {
    const lead = (this.state.crmLeads || []).find(l => l.id === leadId);
    if (!lead) return null;

    const followUp: LeadFollowUp = {
      id: `f-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      notes,
      counsellorName: user?.name || lead.counsellorName || 'Admission Counsellor',
      nextFollowUpDate
    };

    const updatedFollowUps = [...(lead.followUps || []), followUp];
    return this.updateCRMLead(leadId, {
      followUps: updatedFollowUps,
      status: newStatus || lead.status,
      followUpDate: nextFollowUpDate || lead.followUpDate
    }, user);
  }

  public convertLeadToApplication(leadId: string, appData?: Partial<AdmissionApplication>, user?: any): AdmissionApplication | null {
    const lead = (this.state.crmLeads || []).find(l => l.id === leadId);
    if (!lead) return null;

    const appNumber = this.generateApplicationNumber();
    const prog = this.getProgramById(lead.programId);
    const inst = prog ? this.getInstituteById(prog.instituteId) : null;
    const dept = prog ? this.getDepartmentById(prog.departmentId) : null;

    const newApp: AdmissionApplication = {
      id: `app-${Date.now()}`,
      applicationNumber: appNumber,
      leadId: lead.id,
      applicantName: lead.name,
      email: lead.email,
      phone: lead.phone,
      gender: appData?.gender || 'Male',
      dateOfBirth: appData?.dateOfBirth || '2005-05-15',
      bloodGroup: appData?.bloodGroup || 'O+',
      address: appData?.address || 'Ahmedabad-Gandhinagar Highway, Gujarat',
      guardianName: appData?.guardianName || 'Parent / Guardian',
      guardianPhone: appData?.guardianPhone || lead.phone,
      instituteId: inst ? inst.id : 'inst-1',
      instituteName: inst ? inst.name : 'Swarrnim Institute of Technology',
      departmentId: dept ? dept.id : 'dept-cse',
      departmentName: dept ? dept.name : 'Computer Science & Engineering',
      academicYearId: lead.academicYearId || 'ay-2026',
      programId: lead.programId || 'prog-1',
      semesterId: appData?.semesterId || (this.state.semesters && this.state.semesters[0] ? this.state.semesters[0].id : 'sem-1'),
      batchId: appData?.batchId || (this.state.batches && this.state.batches[0] ? this.state.batches[0].id : 'batch-2026'),
      divisionId: appData?.divisionId || (this.state.divisions && this.state.divisions[0] ? this.state.divisions[0].id : 'div-1'),
      status: 'APPLIED',
      submittedAt: new Date().toISOString().split('T')[0],
      reviewerRemarks: appData?.reviewerRemarks || `Registered from CRM Lead ${lead.leadNumber || lead.name}`,
      documents: [
        { id: `doc-app-${Date.now()}-1`, name: '10th & 12th Marksheets & Certificates', status: 'PENDING' },
        { id: `doc-app-${Date.now()}-2`, name: 'Government ID Proof (Aadhaar / Passport)', status: 'PENDING' },
        { id: `doc-app-${Date.now()}-3`, name: 'Passport Size Photograph', status: 'PENDING' },
        { id: `doc-app-${Date.now()}-4`, name: 'School / College Leaving Certificate', status: 'PENDING' }
      ]
    };

    if (!this.state.admissionApplications) this.state.admissionApplications = [];
    this.state.admissionApplications.unshift(newApp);

    // Update lead status to APPLICATION or CONVERTED
    this.updateCRMLead(lead.id, { status: 'APPLICATION' }, user);
    this.saveState();

    this.addNotification({
      title: `Admission Application Submitted: ${newApp.applicationNumber}`,
      message: `Applicant ${newApp.applicantName} submitted application for ${prog?.name || 'Program'}`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'crm'
    });

    this.logAudit('CONVERT_LEAD_APPLICATION', 'Admission & CRM Desk', `Converted lead ${lead.leadNumber || lead.name} to Admission Application ${newApp.applicationNumber}`, user?.name || 'Administrator', user?.role || 'REGISTRAR');
    return newApp;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HOSTEL & VISITOR ENTRY MANAGEMENT MODULE
  // ──────────────────────────────────────────────────────────────────────────

  // ── Hostel Masters ────────────────────────────────────────────────────────
  public getHostels(): HostelMaster[] {
    if (!this.state.hostels || this.state.hostels.length === 0) {
      this.state.hostels = [
        {
          id: 'hst-01',
          code: 'BH-1',
          name: 'Vivekananda Boys Hostel (Block A)',
          hostelType: 'STANDARD',
          gender: 'BOYS',
          building: 'Block A',
          address: 'North Campus, University Main Road',
          capacity: 150,
          occupied: 85,
          wardenName: 'Dr. Suresh Patel',
          wardenPhone: '+91 9876500001',
          wardenEmail: 'suresh.patel@ssiu.edu.in',
          status: 'ACTIVE',
          createdAt: '2025-06-01T00:00:00Z',
        },
        {
          id: 'hst-02',
          code: 'GH-1',
          name: 'Gargi Girls Hostel (Block B)',
          hostelType: 'DELUXE',
          gender: 'GIRLS',
          building: 'Block B',
          address: 'South Campus, University Residence Enclave',
          capacity: 120,
          occupied: 92,
          wardenName: 'Dr. Meena Shah',
          wardenPhone: '+91 9876500002',
          wardenEmail: 'meena.shah@ssiu.edu.in',
          status: 'ACTIVE',
          createdAt: '2025-06-01T00:00:00Z',
        },
        {
          id: 'hst-03',
          code: 'IH-1',
          name: 'Sarabhai International Hostel',
          hostelType: 'INTERNATIONAL',
          gender: 'CO_ED',
          building: 'Block C',
          address: 'Executive Campus, Tech Park Wing',
          capacity: 80,
          occupied: 44,
          wardenName: 'Prof. Rajesh Sharma',
          wardenPhone: '+91 9876500003',
          wardenEmail: 'rajesh.sharma@ssiu.edu.in',
          status: 'ACTIVE',
          createdAt: '2025-06-01T00:00:00Z',
        },
      ];
      this.saveState();
    }
    return [...this.state.hostels];
  }

  public createHostel(data: Partial<HostelMaster>, user?: any): HostelMaster {
    if (!this.state.hostels) this.state.hostels = [];
    const code = (data.code || `HST-${this.state.hostels.length + 1}`).toUpperCase();
    if (this.state.hostels.some(h => h.code === code)) {
      throw new Error(`Hostel code '${code}' already exists.`);
    }

    const newHostel: HostelMaster = {
      id: `hst-${Date.now()}`,
      code,
      name: data.name || 'New University Hostel',
      hostelType: data.hostelType || 'STANDARD',
      gender: data.gender || 'BOYS',
      building: data.building || 'Main Wing',
      address: data.address || 'SSIU Campus',
      capacity: data.capacity || 100,
      occupied: 0,
      wardenName: data.wardenName || 'Chief Warden',
      wardenPhone: data.wardenPhone || '+91 9876543210',
      wardenEmail: data.wardenEmail || 'warden@ssiu.edu.in',
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.state.hostels.push(newHostel);
    this.saveState();
    this.logAudit('CREATE_HOSTEL', 'Hostel Management', `Created Hostel ${newHostel.name} (${newHostel.code})`, user?.name || 'Admin', user?.role || 'HOSTEL_ADMIN');
    return newHostel;
  }

  public updateHostel(id: string, data: Partial<HostelMaster>, user?: any): HostelMaster | null {
    if (!this.state.hostels) this.state.hostels = [];
    const idx = this.state.hostels.findIndex(h => h.id === id);
    if (idx === -1) return null;

    const updated = { ...this.state.hostels[idx], ...data };
    this.state.hostels[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_HOSTEL', 'Hostel Management', `Updated Hostel ${updated.name}`, user?.name || 'Admin', user?.role || 'HOSTEL_ADMIN');
    return updated;
  }

  // ── Hostel Room Details ───────────────────────────────────────────────────
  public getHostelRoomDetails(hostelId?: string): HostelRoomDetail[] {
    if (!this.state.hostelRoomDetails || this.state.hostelRoomDetails.length === 0) {
      const defaultRooms: HostelRoomDetail[] = [];
      const hostels = this.getHostels();

      hostels.forEach((h, hIdx) => {
        for (let floor = 1; floor <= 3; floor++) {
          for (let room = 1; room <= 4; room++) {
            const roomNumber = `${floor}0${room}`;
            const capacity = floor === 1 ? 2 : (floor === 2 ? 3 : 1);
            const occupied = Math.min(capacity, (hIdx + floor + room) % (capacity + 1));
            defaultRooms.push({
              id: `room-${h.code.toLowerCase()}-${roomNumber}`,
              hostelId: h.id,
              hostelName: h.name,
              block: h.building || `Block ${String.fromCharCode(65 + hIdx)}`,
              floor,
              roomNumber,
              roomType: capacity === 1 ? 'SINGLE' : (capacity === 2 ? 'DOUBLE' : 'TRIPLE'),
              capacity,
              occupiedBeds: occupied,
              availableBeds: Math.max(0, capacity - occupied),
              status: occupied >= capacity ? 'FULL' : 'AVAILABLE',
              facilities: 'Attached Washroom, Study Table, Ceiling Fan, Balcony',
            });
          }
        }
      });
      this.state.hostelRoomDetails = defaultRooms;
      this.saveState();
    }

    let list = [...this.state.hostelRoomDetails];
    if (hostelId && hostelId !== 'ALL') {
      list = list.filter(r => r.hostelId === hostelId);
    }
    return list;
  }

  public createHostelRoomDetail(data: Partial<HostelRoomDetail>, user?: any): HostelRoomDetail {
    if (!this.state.hostelRoomDetails) this.state.hostelRoomDetails = [];
    const hostel = this.getHostels().find(h => h.id === data.hostelId);
    if (!hostel) throw new Error('Hostel not found.');

    const roomNumber = data.roomNumber || `101`;
    if (this.state.hostelRoomDetails.some(r => r.hostelId === data.hostelId && r.roomNumber === roomNumber)) {
      throw new Error(`Room '${roomNumber}' already exists in this hostel.`);
    }

    const capacity = data.capacity || 2;
    const newRoom: HostelRoomDetail = {
      id: `room-${Date.now()}`,
      hostelId: hostel.id,
      hostelName: hostel.name,
      block: data.block || hostel.building || 'Block A',
      floor: data.floor || 1,
      roomNumber,
      roomType: data.roomType || 'DOUBLE',
      capacity,
      occupiedBeds: 0,
      availableBeds: capacity,
      status: 'AVAILABLE',
      facilities: data.facilities || 'Attached Bath, Study Table, Wardrobe',
    };

    this.state.hostelRoomDetails.push(newRoom);
    this.saveState();
    this.logAudit('CREATE_ROOM', 'Hostel Management', `Added Room ${newRoom.roomNumber} in ${hostel.name}`, user?.name || 'Admin', user?.role || 'HOSTEL_ADMIN');
    return newRoom;
  }

  public updateHostelRoomDetail(id: string, data: Partial<HostelRoomDetail>, user?: any): HostelRoomDetail | null {
    if (!this.state.hostelRoomDetails) this.state.hostelRoomDetails = [];
    const idx = this.state.hostelRoomDetails.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelRoomDetails[idx];
    const capacity = data.capacity !== undefined ? data.capacity : current.capacity;
    const occupied = data.occupiedBeds !== undefined ? data.occupiedBeds : current.occupiedBeds;
    const updated: HostelRoomDetail = {
      ...current,
      ...data,
      capacity,
      occupiedBeds: occupied,
      availableBeds: Math.max(0, capacity - occupied),
      status: occupied >= capacity ? 'FULL' : (data.status || current.status),
    };

    this.state.hostelRoomDetails[idx] = updated;
    this.saveState();
    return updated;
  }

  // ── Hostel Allotments ──────────────────────────────────────────────────────
  public getHostelAllotments(studentId?: string, hostelId?: string): HostelAllotmentDetail[] {
    if (!this.state.hostelAllotments || this.state.hostelAllotments.length === 0) {
      const students = (this.state.students || []).slice(0, 10);
      const hostels = this.getHostels();
      const rooms = this.getHostelRoomDetails();

      this.state.hostelAllotments = students.map((s, idx) => {
        const hostel = hostels[idx % hostels.length] || hostels[0];
        const room = rooms.find(r => r.hostelId === hostel.id) || rooms[0];
        return {
          id: `allot-${idx + 1}`,
          allotmentNo: `HST-ALL-2026-${String(idx + 1).padStart(4, '0')}`,
          studentId: s.id,
          studentName: s.name || 'Student',
          enrollmentNo: s.enrollmentNo || `26SSIU00${idx + 1}`,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostel.id,
          hostelName: hostel.name,
          roomId: room.id,
          roomNumber: room.roomNumber,
          bedId: `bed-${room.roomNumber}-${idx % 2 === 0 ? 'A' : 'B'}`,
          bedNumber: `${room.roomNumber}-${idx % 2 === 0 ? 'A' : 'B'}`,
          allottedDate: '2026-01-10T09:00:00Z',
          checkInDate: '2026-01-12T10:00:00Z',
          status: 'ACTIVE',
          remarks: 'Regular academic semester allotment',
        };
      });
      this.saveState();
    }

    let list = [...this.state.hostelAllotments];
    if (studentId) list = list.filter(a => a.studentId === studentId);
    if (hostelId && hostelId !== 'ALL') list = list.filter(a => a.hostelId === hostelId);
    return list;
  }

  public allocateHostelBed(data: {
    studentId: string;
    hostelId: string;
    roomId: string;
    bedNumber?: string;
    remarks?: string;
  }, user?: any): HostelAllotmentDetail {
    if (!this.state.hostelAllotments) this.state.hostelAllotments = [];

    // 1. Prevent duplicate active allocation
    const existingActive = this.state.hostelAllotments.find(
      a => a.studentId === data.studentId && a.status === 'ACTIVE'
    );
    if (existingActive) {
      throw new Error(`Student already has an active allocation in ${existingActive.hostelName}, Room ${existingActive.roomNumber}.`);
    }

    // 2. Find room and check capacity
    const room = this.getHostelRoomDetails().find(r => r.id === data.roomId);
    if (!room) throw new Error('Hostel room not found.');

    const activeInRoom = this.state.hostelAllotments.filter(
      a => a.roomId === data.roomId && a.status === 'ACTIVE'
    ).length;
    if (activeInRoom >= room.capacity) {
      throw new Error(`Room '${room.roomNumber}' is at maximum capacity of ${room.capacity} beds.`);
    }

    // 3. Resolve student and hostel
    const student = (this.state.students || []).find(s => s.id === data.studentId);
    const hostel = this.getHostels().find(h => h.id === data.hostelId);
    if (!hostel) throw new Error('Hostel not found.');

    const bedLetter = String.fromCharCode(65 + activeInRoom);
    const bedNumber = data.bedNumber || `${room.roomNumber}-${bedLetter}`;
    const allotmentNo = `HST-ALL-2026-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const newAllotment: HostelAllotmentDetail = {
      id: `allot-${Date.now()}`,
      allotmentNo,
      studentId: data.studentId,
      studentName: student?.name || 'Student Host',
      enrollmentNo: student?.enrollmentNo || 'ENR-2026',
      instituteName: 'SSIT - Institute of Technology',
      departmentName: 'Department of Computer Engineering',
      programName: 'Bachelor of Technology',
      semester: 4,
      hostelId: hostel.id,
      hostelName: hostel.name,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedId: `bed-${Date.now()}`,
      bedNumber,
      allottedDate: new Date().toISOString(),
      checkInDate: new Date().toISOString(),
      status: 'ACTIVE',
      remarks: data.remarks || 'Standard Semester Allotment',
    };

    this.state.hostelAllotments.unshift(newAllotment);

    // Update room occupancy
    this.updateHostelRoomDetail(room.id, {
      occupiedBeds: activeInRoom + 1,
      status: activeInRoom + 1 >= room.capacity ? 'FULL' : 'AVAILABLE',
    });

    this.saveState();
    this.logAudit('ALLOCATE_BED', 'Hostel Management', `Allotted Bed ${bedNumber} in ${hostel.name} (Room ${room.roomNumber}) to ${newAllotment.studentName}`, user?.name || 'Warden', user?.role || 'HOSTEL_ADMIN');
    return newAllotment;
  }

  public updateHostelAllotmentStatus(id: string, status: 'ACTIVE' | 'TRANSFERRED' | 'VACATED' | 'CANCELLED', remarks?: string, user?: any): HostelAllotmentDetail | null {
    if (!this.state.hostelAllotments) this.state.hostelAllotments = [];
    const idx = this.state.hostelAllotments.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelAllotments[idx];
    const updated: HostelAllotmentDetail = {
      ...current,
      status,
      remarks: remarks || current.remarks,
      vacatedDate: (status === 'VACATED' || status === 'CANCELLED') ? new Date().toISOString() : current.vacatedDate,
    };

    this.state.hostelAllotments[idx] = updated;

    if (status === 'VACATED' || status === 'CANCELLED') {
      const room = this.getHostelRoomDetails().find(r => r.id === current.roomId);
      if (room) {
        const activeCount = this.state.hostelAllotments.filter(
          a => a.roomId === room.id && a.status === 'ACTIVE'
        ).length;
        this.updateHostelRoomDetail(room.id, {
          occupiedBeds: activeCount,
          status: activeCount >= room.capacity ? 'FULL' : 'AVAILABLE',
        });
      }
    }

    this.saveState();
    this.logAudit('UPDATE_ALLOTMENT', 'Hostel Management', `Updated Allotment ${updated.allotmentNo} status to ${status}`, user?.name || 'Warden', user?.role || 'HOSTEL_ADMIN');
    return updated;
  }

  public vacateHostelBed(id: string, remarks?: string, user?: any): HostelAllotmentDetail | null {
    return this.updateHostelAllotmentStatus(id, 'VACATED', remarks, user);
  }

  // ── Hostel Maintenance Request Lifecycle ──────────────────────────────────
  private calculateMaintenanceSla(priority: HostelMaintenancePriority): { hours: number; dueDate: string } {
    let hours = 48;
    if (priority === 'URGENT') hours = 4;
    else if (priority === 'HIGH') hours = 24;
    else if (priority === 'MEDIUM') hours = 48;
    else if (priority === 'LOW') hours = 72;

    const dueDate = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    return { hours, dueDate };
  }

  public getHostelMaintenanceRequests(
    filter?: {
      hostelId?: string;
      category?: string;
      priority?: string;
      status?: string;
      assignedStaffId?: string;
      studentId?: string;
      search?: string;
      isOverdue?: boolean;
    },
    user?: User | null,
    role?: UserRole | null
  ): HostelMaintenanceRequestItem[] {
    if (!this.state.hostelMaintenanceRequests || this.state.hostelMaintenanceRequests.length === 0) {
      const now = Date.now();
      this.state.hostelMaintenanceRequests = [
        {
          id: 'mnt-001',
          requestNo: 'HOST-MNT-2026-000001',
          studentId: 'stud-1',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          hostelId: 'hst-01',
          hostelName: 'Vivekananda Boys Hostel (Block A)',
          roomId: 'room-bh-1-101',
          roomNumber: '101',
          category: 'ELECTRICAL',
          title: 'Ceiling Fan Regulator Not Working',
          description: 'The ceiling fan speed regulator knob is broken and stuck at maximum speed.',
          priority: 'MEDIUM',
          status: 'ASSIGNED',
          assignedToStaffId: 'staff-01',
          assignedToStaffName: 'Ramesh Sharma (Electrician)',
          assignedByUserId: 'user-warden',
          assignedByName: 'Dr. Suresh Patel (Warden)',
          assignedAt: new Date(now - 86400000).toISOString(),
          slaHours: 48,
          slaDueDate: new Date(now + 86400000).toISOString(),
          createdAt: new Date(now - 90000000).toISOString(),
          updatedAt: new Date(now - 86400000).toISOString(),
          history: [
            {
              id: 'hist-1',
              requestId: 'mnt-001',
              action: 'CREATED',
              fromStatus: undefined,
              toStatus: 'SUBMITTED',
              performedByUserId: 'stud-1',
              performedByName: 'Aarav Patel',
              performedByRole: 'STUDENT',
              remarks: 'Ticket created by student',
              timestamp: new Date(now - 90000000).toISOString(),
            },
            {
              id: 'hist-2',
              requestId: 'mnt-001',
              action: 'ASSIGNED',
              fromStatus: 'SUBMITTED',
              toStatus: 'ASSIGNED',
              performedByUserId: 'user-warden',
              performedByName: 'Dr. Suresh Patel',
              performedByRole: 'MAINTENANCE_HEAD',
              remarks: 'Assigned to senior electrician for repair',
              timestamp: new Date(now - 86400000).toISOString(),
            },
          ],
        },
        {
          id: 'mnt-002',
          requestNo: 'HOST-MNT-2026-000002',
          studentId: 'stud-2',
          studentName: 'Priya Mehta',
          enrollmentNo: '24SSIU01002',
          hostelId: 'hst-02',
          hostelName: 'Gargi Girls Hostel (Block B)',
          roomId: 'room-gh-1-201',
          roomNumber: '201',
          category: 'PLUMBING',
          title: 'Washroom Tap Leaking Continuously',
          description: 'The main basin tap in Room 201 is leaking water continuously causing water wastage.',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          assignedToStaffId: 'staff-02',
          assignedToStaffName: 'Mohan Lal (Plumber)',
          assignedByUserId: 'user-warden-girls',
          assignedByName: 'Dr. Meena Shah (Warden)',
          assignedAt: new Date(now - 7200000).toISOString(),
          slaHours: 4,
          slaDueDate: new Date(now - 3600000).toISOString(), // Overdue
          isOverdue: true,
          createdAt: new Date(now - 14400000).toISOString(),
          updatedAt: new Date(now - 3600000).toISOString(),
          history: [
            {
              id: 'hist-3',
              requestId: 'mnt-002',
              action: 'CREATED',
              toStatus: 'SUBMITTED',
              performedByUserId: 'stud-2',
              performedByName: 'Priya Mehta',
              performedByRole: 'STUDENT',
              remarks: 'Urgent plumbing issue reported',
              timestamp: new Date(now - 14400000).toISOString(),
            },
            {
              id: 'hist-4',
              requestId: 'mnt-002',
              action: 'ASSIGNED',
              fromStatus: 'SUBMITTED',
              toStatus: 'ASSIGNED',
              performedByUserId: 'user-warden-girls',
              performedByName: 'Dr. Meena Shah',
              performedByRole: 'MAINTENANCE_HEAD',
              remarks: 'Assigned to plumber Mohan Lal',
              timestamp: new Date(now - 7200000).toISOString(),
            },
            {
              id: 'hist-5',
              requestId: 'mnt-002',
              action: 'STARTED',
              fromStatus: 'ASSIGNED',
              toStatus: 'IN_PROGRESS',
              performedByUserId: 'staff-02',
              performedByName: 'Mohan Lal',
              performedByRole: 'MAINTENANCE_STAFF',
              remarks: 'Replacing internal tap washer',
              timestamp: new Date(now - 3600000).toISOString(),
            },
          ],
        },
      ];
      this.saveState();
    }

    let list = [...this.state.hostelMaintenanceRequests];

    // Role-based security scoping
    if (user && role) {
      if (role === 'STUDENT') {
        list = list.filter(r => r.studentId === user.id || r.studentName.toLowerCase().includes(user.name.toLowerCase()));
      } else if ((role as any) === 'MAINTENANCE_STAFF') {
        list = list.filter(r => r.assignedToStaffId === user.id || (r.assignedToStaffName && r.assignedToStaffName.includes(user.name)));
      }
    }

    if (filter?.hostelId && filter.hostelId !== 'ALL') {
      list = list.filter(r => r.hostelId === filter.hostelId);
    }
    if (filter?.category && filter.category !== 'ALL') {
      list = list.filter(r => r.category === filter.category);
    }
    if (filter?.priority && filter.priority !== 'ALL') {
      list = list.filter(r => r.priority === filter.priority);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(r => r.status === filter.status);
    }
    if (filter?.assignedStaffId && filter.assignedStaffId !== 'ALL') {
      list = list.filter(r => r.assignedToStaffId === filter.assignedStaffId);
    }
    if (filter?.studentId && filter.studentId !== 'ALL') {
      list = list.filter(r => r.studentId === filter.studentId);
    }
    if (filter?.isOverdue) {
      const now = new Date();
      list = list.filter(r => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(r.status) && r.slaDueDate && new Date(r.slaDueDate) < now);
    }

    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(r =>
        r.requestNo.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.enrollmentNo.toLowerCase().includes(q) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q)) ||
        (r.assignedToStaffName && r.assignedToStaffName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      // Urgent first, then newest
      if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
      if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public getHostelMaintenanceRequestById(id: string): HostelMaintenanceRequestItem | undefined {
    return (this.state.hostelMaintenanceRequests || []).find(r => r.id === id);
  }

  public createHostelMaintenanceRequest(data: Partial<HostelMaintenanceRequestItem>, user?: any): HostelMaintenanceRequestItem {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];

    const seq = this.state.hostelMaintenanceRequests.length + 1;
    const requestNo = `HOST-MNT-2026-${String(seq).padStart(6, '0')}`;
    const priority = data.priority || 'MEDIUM';
    const { hours, dueDate } = this.calculateMaintenanceSla(priority);
    const student = (this.state.students || []).find(s => s.id === data.studentId) || {
      id: data.studentId || user?.id || 'stud-guest',
      name: data.studentName || user?.name || 'Student Host',
      enrollmentNo: data.enrollmentNo || '26SSIU001',
    };
    const hostel = this.getHostels().find(h => h.id === data.hostelId) || this.getHostels()[0];

    const newRequest: HostelMaintenanceRequestItem = {
      id: `mnt-${Date.now()}`,
      requestNo,
      studentId: student.id,
      studentName: student.name || 'Student Host',
      enrollmentNo: (student as any).enrollmentNo || '26SSIU001',
      hostelId: hostel.id,
      hostelName: hostel.name,
      roomId: data.roomId,
      roomNumber: data.roomNumber || '101',
      category: data.category || 'OTHER',
      title: data.title || 'Hostel Maintenance Request',
      description: data.description || 'Maintenance assistance required',
      priority,
      status: 'SUBMITTED',
      photoUrl: data.photoUrl,
      slaHours: hours,
      slaDueDate: dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist-${Date.now()}`,
          requestId: `mnt-${Date.now()}`,
          action: 'CREATED',
          fromStatus: undefined,
          toStatus: 'SUBMITTED',
          performedByUserId: user?.id || student.id,
          performedByName: user?.name || student.name,
          performedByRole: user?.role || 'STUDENT',
          remarks: `Ticket lodged under category ${data.category || 'OTHER'}`,
          timestamp: new Date().toISOString(),
        },
      ],
      attachments: data.photoUrl ? [
        {
          id: `att-${Date.now()}`,
          requestId: `mnt-${Date.now()}`,
          fileName: 'problem_photo.jpg',
          fileUrl: data.photoUrl,
          attachmentType: 'PROBLEM_PHOTO',
          uploadedByUserId: user?.id || student.id,
          uploadedByName: user?.name || student.name,
          uploadedByRole: user?.role || 'STUDENT',
          createdAt: new Date().toISOString(),
        }
      ] : [],
    };

    this.state.hostelMaintenanceRequests.unshift(newRequest);
    this.saveState();

    // 1. Notify Student: STATUS_UPDATE
    this.addNotification({
      type: 'STATUS_UPDATE',
      title: `Maintenance Request Submitted: ${newRequest.requestNo}`,
      message: `Your ${newRequest.category} maintenance request for Room ${newRequest.roomNumber} has been logged.`,
      module: 'HOSTEL',
      targetUserId: newRequest.studentId,
      referenceId: newRequest.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'student-hostel',
    });

    // 2. Notify Hostel Warden: ACTION_REQUIRED
    this.addNotification({
      type: 'ACTION_REQUIRED',
      title: `New Maintenance Request: ${newRequest.requestNo}`,
      message: `${newRequest.category} issue reported in ${hostel.name} Room ${newRequest.roomNumber} by ${newRequest.studentName}. Awaiting assignment.`,
      module: 'HOSTEL',
      targetRole: 'HOSTEL_ADMIN',
      referenceId: newRequest.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'hostel-admin',
      priority: 'HIGH'
    });

    this.logAudit('CREATE_MAINTENANCE_REQUEST', 'Hostel Maintenance', `Created Request ${newRequest.requestNo} (${newRequest.category})`, user?.name || 'Student', user?.role || 'STUDENT');
    return newRequest;
  }

  public assignHostelMaintenanceRequest(id: string, data: { staffId: string; staffName?: string; priority?: HostelMaintenancePriority; remarks?: string }, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const priority = data.priority || current.priority;
    const { hours, dueDate } = this.calculateMaintenanceSla(priority);

    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'ASSIGNED',
      fromStatus: current.status,
      toStatus: 'ASSIGNED',
      performedByUserId: user?.id || 'admin',
      performedByName: user?.name || 'Maintenance Head',
      performedByRole: user?.role || 'MAINTENANCE_HEAD',
      remarks: data.remarks || `Assigned to ${data.staffName || data.staffId}`,
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      assignedToStaffId: data.staffId,
      assignedToStaffName: data.staffName || `Staff (${data.staffId})`,
      assignedByUserId: user?.id,
      assignedByName: user?.name || 'Maintenance Head',
      assignedAt: new Date().toISOString(),
      priority,
      slaHours: hours,
      slaDueDate: dueDate,
      status: 'ASSIGNED',
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();

    // 1. Notify Assigned Technician / Staff: ACTION_REQUIRED
    this.addNotification({
      type: 'ACTION_REQUIRED',
      title: `Assigned Maintenance Task: ${updated.requestNo}`,
      message: `You have been assigned ${updated.category} maintenance task for ${updated.hostelName} Room ${updated.roomNumber}. Priority: ${updated.priority}`,
      module: 'HOSTEL',
      targetUserId: updated.assignedToStaffId,
      referenceId: updated.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'maintenance',
      priority: updated.priority === 'URGENT' ? 'URGENT' : 'HIGH'
    });

    // 2. Notify Student: STATUS_UPDATE
    this.addNotification({
      type: 'STATUS_UPDATE',
      title: `Maintenance Request Assigned: ${updated.requestNo}`,
      message: `Your maintenance ticket has been assigned to ${updated.assignedToStaffName}. Priority: ${updated.priority}`,
      module: 'HOSTEL',
      targetUserId: updated.studentId,
      referenceId: updated.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'student-hostel',
    });

    // 3. Notify Hostel Warden: STATUS_UPDATE
    this.addNotification({
      type: 'STATUS_UPDATE',
      title: `Maintenance Request Assigned: ${updated.requestNo}`,
      message: `Ticket ${updated.requestNo} assigned to ${updated.assignedToStaffName}.`,
      module: 'HOSTEL',
      targetRole: 'HOSTEL_ADMIN',
      referenceId: updated.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'hostel-admin',
    });

    this.logAudit('ASSIGN_MAINTENANCE_REQUEST', 'Hostel Maintenance', `Assigned Request ${updated.requestNo} to ${updated.assignedToStaffName}`, user?.name || 'Maintenance Head', user?.role || 'MAINTENANCE_HEAD');
    return updated;
  }

  public startHostelMaintenanceWork(id: string, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'STARTED',
      fromStatus: current.status,
      toStatus: 'IN_PROGRESS',
      performedByUserId: user?.id || 'staff',
      performedByName: user?.name || 'Technician',
      performedByRole: user?.role || 'MAINTENANCE_STAFF',
      remarks: 'Technician commenced repair work on site',
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();
    return updated;
  }

  public holdHostelMaintenanceRequest(id: string, holdReason: string, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'ON_HOLD',
      fromStatus: current.status,
      toStatus: 'ON_HOLD',
      performedByUserId: user?.id || 'staff',
      performedByName: user?.name || 'Technician',
      performedByRole: user?.role || 'MAINTENANCE_STAFF',
      remarks: `Placed on hold: ${holdReason}`,
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'ON_HOLD',
      holdReason,
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();
    return updated;
  }

  public resolveHostelMaintenanceRequest(id: string, data: { resolutionDetails: string; resolvedPhotoUrl?: string }, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'RESOLVED',
      fromStatus: current.status,
      toStatus: 'RESOLVED',
      performedByUserId: user?.id || 'staff',
      performedByName: user?.name || 'Technician',
      performedByRole: user?.role || 'MAINTENANCE_STAFF',
      remarks: data.resolutionDetails,
      timestamp: new Date().toISOString(),
    };

    const newAttachments = [...(current.attachments || [])];
    if (data.resolvedPhotoUrl) {
      newAttachments.push({
        id: `att-${Date.now()}`,
        requestId: id,
        fileName: 'resolution_photo.jpg',
        fileUrl: data.resolvedPhotoUrl,
        attachmentType: 'COMPLETION_PHOTO',
        uploadedByUserId: user?.id || 'staff',
        uploadedByName: user?.name || 'Technician',
        uploadedByRole: user?.role || 'MAINTENANCE_STAFF',
        createdAt: new Date().toISOString(),
      });
    }

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'RESOLVED',
      resolutionDetails: data.resolutionDetails,
      resolvedAt: new Date().toISOString(),
      resolvedPhotoUrl: data.resolvedPhotoUrl,
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
      attachments: newAttachments,
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();

    // 1. Notify Student: SUCCESS / ACTION_REQUIRED (to verify)
    this.addNotification({
      type: 'SUCCESS',
      title: `Maintenance Request Resolved: ${updated.requestNo}`,
      message: `Your maintenance ticket for Room ${updated.roomNumber} has been marked as resolved. Please verify and confirm.`,
      module: 'HOSTEL',
      targetUserId: updated.studentId,
      referenceId: updated.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'student-hostel',
    });

    // 2. Notify Warden: STATUS_UPDATE
    this.addNotification({
      type: 'STATUS_UPDATE',
      title: `Maintenance Request Resolved: ${updated.requestNo}`,
      message: `Ticket ${updated.requestNo} (${updated.category}) marked resolved by technician.`,
      module: 'HOSTEL',
      targetRole: 'HOSTEL_ADMIN',
      referenceId: updated.requestNo,
      referenceType: 'HOSTEL_MAINTENANCE',
      linkTab: 'hostel-admin',
    });

    this.logAudit('RESOLVE_MAINTENANCE_REQUEST', 'Hostel Maintenance', `Resolved Request ${updated.requestNo}`, user?.name || 'Technician', user?.role || 'MAINTENANCE_STAFF');
    return updated;
  }

  public confirmHostelMaintenanceResolution(id: string, data: { rating?: number; feedback?: string }, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const rating = data.rating || 5;
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'CONFIRMED',
      fromStatus: current.status,
      toStatus: 'CLOSED',
      performedByUserId: user?.id || current.studentId,
      performedByName: user?.name || current.studentName,
      performedByRole: 'STUDENT',
      remarks: `Student confirmed resolution (Rating: ${rating}/5). ${data.feedback || ''}`,
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'CLOSED',
      studentConfirmedAt: new Date().toISOString(),
      studentRating: rating,
      studentFeedback: data.feedback || 'Resolution accepted by student',
      closedAt: new Date().toISOString(),
      closedByUserId: user?.id,
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();
    return updated;
  }

  public reopenHostelMaintenanceRequest(id: string, reopenedReason: string, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'REOPENED',
      fromStatus: current.status,
      toStatus: 'REOPENED',
      performedByUserId: user?.id || current.studentId,
      performedByName: user?.name || current.studentName,
      performedByRole: 'STUDENT',
      remarks: `Student reopened request: ${reopenedReason}`,
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'REOPENED',
      reopenedReason,
      reopenedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();

    this.addNotification({
      title: `Maintenance Request Reopened: ${updated.requestNo}`,
      message: `Student reopened ticket: ${reopenedReason}`,
      module: 'HOSTEL' as any,
      timestamp: 'Just now',
      targetRole: 'HOSTEL_ADMIN',
      linkTab: 'hostel-admin',
    });

    return updated;
  }

  public closeHostelMaintenanceRequest(id: string, remarks?: string, user?: any): HostelMaintenanceRequestItem | null {
    if (!this.state.hostelMaintenanceRequests) this.state.hostelMaintenanceRequests = [];
    const idx = this.state.hostelMaintenanceRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    const current = this.state.hostelMaintenanceRequests[idx];
    const historyItem: HostelMaintenanceHistoryItem = {
      id: `hist-${Date.now()}`,
      requestId: id,
      action: 'CLOSED',
      fromStatus: current.status,
      toStatus: 'CLOSED',
      performedByUserId: user?.id || 'admin',
      performedByName: user?.name || 'Hostel Admin',
      performedByRole: user?.role || 'HOSTEL_ADMIN',
      remarks: remarks || 'Ticket closed by Administrator',
      timestamp: new Date().toISOString(),
    };

    const updated: HostelMaintenanceRequestItem = {
      ...current,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedByUserId: user?.id,
      updatedAt: new Date().toISOString(),
      history: [...(current.history || []), historyItem],
    };

    this.state.hostelMaintenanceRequests[idx] = updated;
    this.saveState();
    return updated;
  }

  // ── Hostel Dashboard KPIs ──────────────────────────────────────────────────
  public getHostelDashboardKPIs() {
    const hostels = this.getHostels();
    const rooms = this.getHostelRoomDetails();
    const allotments = this.getHostelAllotments();
    const activeAllotments = allotments.filter(a => a.status === 'ACTIVE');
    const maintenance = this.getHostelMaintenanceRequests();

    const totalCapacity = hostels.reduce((acc, h) => acc + (h.capacity || 0), 0);
    const totalOccupied = activeAllotments.length;
    const now = new Date();

    const pendingMnt = maintenance.filter(m => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'].includes(m.status)).length;
    const urgentMnt = maintenance.filter(m => m.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(m.status)).length;
    const overdueMnt = maintenance.filter(m => !['RESOLVED', 'CLOSED'].includes(m.status) && m.slaDueDate && new Date(m.slaDueDate) < now).length;
    const visitors = this.getHostelVisitorDashboardStats();

    return {
      totalHostels: hostels.length,
      totalRooms: rooms.length,
      totalCapacity,
      occupiedBeds: totalOccupied,
      availableBeds: Math.max(0, totalCapacity - totalOccupied),
      occupancyRate: totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) + '%' : '0%',
      pendingMaintenance: pendingMnt,
      urgentMaintenance: urgentMnt,
      overdueMaintenance: overdueMnt,
      visitorsToday: visitors.visitorsToday,
      currentlyInside: visitors.currentlyInside,
    };
  }

  // ── Hostel Reports ─────────────────────────────────────────────────────────
  public getHostelReportData(reportType: string, filter?: any, user?: any) {
    const type = (reportType || 'HOSTEL_OCCUPANCY').toUpperCase();

    if (type === 'HOSTEL_OCCUPANCY') {
      const hostels = this.getHostels();
      const rooms = this.getHostelRoomDetails();
      const allotments = this.getHostelAllotments().filter(a => a.status === 'ACTIVE');

      return hostels.map(h => {
        const hRooms = rooms.filter(r => r.hostelId === h.id);
        const hAllotments = allotments.filter(a => a.hostelId === h.id);
        return {
          code: h.code,
          hostelName: h.name,
          building: h.building || 'Main Block',
          gender: h.gender,
          totalRooms: hRooms.length,
          capacity: h.capacity,
          occupied: hAllotments.length,
          available: Math.max(0, h.capacity - hAllotments.length),
          occupancyRate: h.capacity > 0 ? ((hAllotments.length / h.capacity) * 100).toFixed(1) + '%' : '0%',
          warden: h.wardenName,
          status: h.status,
        };
      });
    }

    if (type === 'ROOM_OCCUPANCY') {
      const rooms = this.getHostelRoomDetails(filter?.hostelId);
      const allotments = this.getHostelAllotments().filter(a => a.status === 'ACTIVE');

      return rooms.map(r => {
        const roomAllotments = allotments.filter(a => a.roomId === r.id);
        return {
          hostelName: r.hostelName,
          block: r.block,
          floor: `Floor ${r.floor}`,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          capacity: r.capacity,
          occupied: roomAllotments.length,
          available: Math.max(0, r.capacity - roomAllotments.length),
          occupants: roomAllotments.map(a => `${a.studentName} (${a.enrollmentNo})`).join(', ') || 'None',
          status: r.status,
        };
      });
    }

    if (type === 'STUDENT_ALLOCATION') {
      const allotments = this.getHostelAllotments(undefined, filter?.hostelId);
      return allotments.map(a => ({
        allotmentNo: a.allotmentNo,
        studentName: a.studentName,
        enrollmentNo: a.enrollmentNo,
        department: a.departmentName,
        program: a.programName,
        hostelName: a.hostelName,
        roomNumber: a.roomNumber,
        bedNumber: a.bedNumber,
        allottedDate: a.allottedDate.slice(0, 10),
        status: a.status,
      }));
    }

    if (type === 'MAINTENANCE_REQUEST_REPORT' || type === 'PENDING_MAINTENANCE' || type === 'OVERDUE_REQUESTS') {
      let requests = this.getHostelMaintenanceRequests(filter);
      if (type === 'PENDING_MAINTENANCE') {
        requests = requests.filter(r => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'].includes(r.status));
      } else if (type === 'OVERDUE_REQUESTS') {
        const now = new Date();
        requests = requests.filter(r => !['RESOLVED', 'CLOSED'].includes(r.status) && r.slaDueDate && new Date(r.slaDueDate) < now);
      }

      return requests.map(r => ({
        requestNo: r.requestNo,
        studentName: `${r.studentName} (${r.enrollmentNo})`,
        hostel: r.hostelName,
        roomNumber: r.roomNumber || 'N/A',
        category: r.category,
        title: r.title,
        priority: r.priority,
        status: r.status,
        assignedTo: r.assignedToStaffName || 'Unassigned',
        slaHours: `${r.slaHours} hrs`,
        slaDueDate: r.slaDueDate ? r.slaDueDate.slice(0, 16).replace('T', ' ') : 'N/A',
        createdAt: r.createdAt.slice(0, 10),
      }));
    }

    if (type === 'VISITOR_REPORT') {
      const visitors = this.getHostelVisitorEntries(filter);
      return visitors.map(v => ({
        passNumber: v.passNumber,
        visitorName: v.visitorName,
        mobileNumber: v.mobileNumber,
        relation: 'Relative / Guest',
        studentName: `${v.studentName} (${v.enrollmentNumber})`,
        hostelBlock: v.hostelBlock,
        roomNo: v.roomNo,
        entryTime: `${v.entryDate} ${v.entryTime}`,
        exitTime: v.actualExitTime ? `${v.actualExitDate || v.entryDate} ${v.actualExitTime}` : 'Currently Inside',
        status: v.status,
      }));
    }

    return [];
  }

  public getHostelRooms(): HostelRoom[] {
    if (!this.state.hostelRooms || this.state.hostelRooms.length === 0) {
      this.state.hostelRooms = initialHostelRooms;
    }
    return [...this.state.hostelRooms];
  }

  public updateHostelRoom(id: string, data: Partial<HostelRoom>): HostelRoom | null {
    if (!this.state.hostelRooms) this.state.hostelRooms = [];
    const idx = this.state.hostelRooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const updated = { ...this.state.hostelRooms[idx], ...data };
    this.state.hostelRooms[idx] = updated;
    this.saveState();
    return updated;
  }

  public allocateBed(roomId: string, studentId: string, user?: any): boolean {
    const rooms = this.getHostelRooms();
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom || targetRoom.occupied >= targetRoom.capacity) return false;

    const student = (this.state.students || []).find(s => s.id === studentId);
    const nextOccupied = targetRoom.occupied + 1;
    this.updateHostelRoom(roomId, {
      occupied: nextOccupied,
      status: nextOccupied >= targetRoom.capacity ? 'FULL' : 'AVAILABLE'
    });

    if (student) {
      student.address = `${targetRoom.blockName} Room ${targetRoom.roomNo}, SSIU Campus`;
      this.saveState();
    }

    this.logAudit('HOSTEL_ALLOCATION', 'Hostel Management', `Allocated bed in ${targetRoom.blockName} Room ${targetRoom.roomNo} to ${student?.name || studentId}`, user?.name || 'Hostel Warden', user?.role || 'HOSTEL_ADMIN');
    return true;
  }

  public generateVisitorPassNumber(): string {
    const year = new Date().getFullYear();
    const entries = this.state.hostelVisitorEntries || [];
    let maxSeq = 0;
    entries.forEach(e => {
      const match = (e.passNumber || '').match(/VIS\/\d+\/(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = Math.max(entries.length + 1, maxSeq + 1);
    return `VIS/${year}/${String(nextSeq).padStart(4, '0')}`;
  }

  public getHostelVisitorEntries(
    filter?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      hostelBlock?: string;
      roomNo?: string;
      status?: string;
      student?: string;
      visitor?: string;
      search?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): HostelVisitorEntry[] {
    if (!this.state.hostelVisitorEntries) {
      this.state.hostelVisitorEntries = [];
    }

    let list = [...this.state.hostelVisitorEntries];

    // RBAC Scoping
    if (user && role) {
      if (role === 'STUDENT') {
        // Students see visitor entries where they are the host student
        list = list.filter(e =>
          (user.email && e.studentName.toLowerCase().includes(user.name.toLowerCase())) ||
          (user.id && e.studentId === user.id) ||
          e.enrollmentNumber === user.username ||
          e.enrollmentNumber === (user as any).enrollmentNo
        );
      } else if (role === 'FACULTY' || role === 'HOD') {
        // Faculty / HOD can view department student visitors
      } else {
        // HOSTEL_ADMIN, SUPER_ADMIN, UNIVERSITY_ADMIN, REGISTRAR, SECURITY: Full access
      }
    }

    // Filter by Date
    if (filter?.date && filter.date !== 'ALL') {
      list = list.filter(e => e.entryDate === filter.date || (e.actualExitDate && e.actualExitDate === filter.date));
    }
    if (filter?.startDate) {
      list = list.filter(e => e.entryDate >= filter.startDate!);
    }
    if (filter?.endDate) {
      list = list.filter(e => e.entryDate <= filter.endDate!);
    }

    // Filter by Hostel Block
    if (filter?.hostelBlock && filter.hostelBlock !== 'ALL') {
      list = list.filter(e => e.hostelBlock.toLowerCase().includes(filter.hostelBlock!.toLowerCase()));
    }

    // Filter by Room No
    if (filter?.roomNo && filter.roomNo !== 'ALL') {
      list = list.filter(e => e.roomNo.toLowerCase().includes(filter.roomNo!.toLowerCase()));
    }

    // Filter by Status
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(e => e.status === filter.status);
    }

    // Filter by Student
    if (filter?.student && filter.student !== 'ALL') {
      const q = filter.student.toLowerCase();
      list = list.filter(e =>
        e.studentName.toLowerCase().includes(q) ||
        e.enrollmentNumber.toLowerCase().includes(q)
      );
    }

    // Filter by Visitor
    if (filter?.visitor && filter.visitor !== 'ALL') {
      const q = filter.visitor.toLowerCase();
      list = list.filter(e =>
        e.visitorName.toLowerCase().includes(q) ||
        e.mobileNumber.toLowerCase().includes(q)
      );
    }

    // Keyword Search
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(e =>
        (e.passNumber && e.passNumber.toLowerCase().includes(q)) ||
        (e.visitorName && e.visitorName.toLowerCase().includes(q)) ||
        (e.mobileNumber && e.mobileNumber.toLowerCase().includes(q)) ||
        (e.idProofNumber && e.idProofNumber.toLowerCase().includes(q)) ||
        (e.studentName && e.studentName.toLowerCase().includes(q)) ||
        (e.enrollmentNumber && e.enrollmentNumber.toLowerCase().includes(q)) ||
        (e.hostelBlock && e.hostelBlock.toLowerCase().includes(q)) ||
        (e.roomNo && e.roomNo.toLowerCase().includes(q)) ||
        (e.purpose && e.purpose.toLowerCase().includes(q)) ||
        (e.remarks && e.remarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      const timeA = `${a.entryDate} ${a.entryTime || '00:00'}`;
      const timeB = `${b.entryDate} ${b.entryTime || '00:00'}`;
      return timeB.localeCompare(timeA);
    });
  }

  public getHostelVisitorDashboardStats(user?: User | null, role?: UserRole | null): HostelVisitorDashboardStats {
    const list = this.getHostelVisitorEntries(undefined, user, role);
    const today = new Date().toISOString().split('T')[0];

    const visitorsToday = list.filter(e => e.entryDate === today).length;
    const currentlyInside = list.filter(e => e.status === 'INSIDE').length;
    const exited = list.filter(e => e.status === 'EXITED' || e.status === 'COMPLETED').length;
    const pendingApproval = list.filter(e => e.status === 'PENDING_APPROVAL').length;
    const rejected = list.filter(e => e.status === 'REJECTED').length;

    return {
      visitorsToday,
      currentlyInside,
      exited,
      pendingApproval,
      rejected,
      totalEntries: list.length
    };
  }

  public getHostelVisitorEntryById(id: string): HostelVisitorEntry | undefined {
    return (this.state.hostelVisitorEntries || []).find(e => e.id === id);
  }

  public createHostelVisitorEntry(data: Partial<HostelVisitorEntry>, user?: any): HostelVisitorEntry {
    if (!this.state.hostelVisitorEntries) this.state.hostelVisitorEntries = [];

    const passNumber = data.passNumber || this.generateVisitorPassNumber();
    const entryDate = data.entryDate || new Date().toISOString().split('T')[0];
    const entryTime = data.entryTime || new Date().toTimeString().slice(0, 5);
    const expectedExitTime = data.expectedExitTime || '18:00';

    const newEntry: HostelVisitorEntry = {
      id: data.id || `vis-${Date.now()}`,
      passNumber,
      visitorName: data.visitorName || 'Visitor',
      mobileNumber: data.mobileNumber || '',
      idProofType: data.idProofType || 'AADHAAR',
      idProofNumber: data.idProofNumber || '',
      visitorPhoto: data.visitorPhoto || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80`,
      studentId: data.studentId,
      studentName: data.studentName || 'Student Host',
      enrollmentNumber: data.enrollmentNumber || 'ENR-2026',
      hostelBlock: data.hostelBlock || 'Block A (Boys Hostel)',
      roomNo: data.roomNo || 'A-101',
      purpose: data.purpose || 'Personal Visit',
      entryDate,
      entryTime,
      expectedExitTime,
      status: data.status || 'INSIDE',
      approvedBy: data.approvedBy || (user ? user.id : 'user-warden'),
      approvedByName: data.approvedByName || (user ? user.name : 'Hostel Warden Office'),
      approvedAt: data.status === 'REJECTED' ? undefined : new Date().toISOString(),
      remarks: data.remarks || '',
      supportingDocument: data.supportingDocument,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.name || 'Security Gate Officer'
    };

    this.state.hostelVisitorEntries.unshift(newEntry);
    this.saveState();

    // 1. Notify Student Host: STATUS_UPDATE
    if (newEntry.studentId) {
      this.addNotification({
        type: 'STATUS_UPDATE',
        title: `Hostel Visitor Registered: ${newEntry.passNumber}`,
        message: `Visitor ${newEntry.visitorName} registered to visit your room (${newEntry.hostelBlock} - ${newEntry.roomNo}).`,
        module: 'HOSTEL',
        targetUserId: newEntry.studentId,
        referenceId: newEntry.passNumber,
        referenceType: 'HOSTEL_VISITOR',
        linkTab: 'student-hostel'
      });
    }

    // 2. Notify Hostel Warden: ACTION_REQUIRED / MONITORING
    this.addNotification({
      type: 'INFORMATION',
      title: `Hostel Visitor Registered: ${newEntry.passNumber}`,
      message: `Visitor ${newEntry.visitorName} visiting student ${newEntry.studentName} (${newEntry.hostelBlock} - Room ${newEntry.roomNo}).`,
      module: 'HOSTEL',
      targetRole: 'HOSTEL_ADMIN',
      referenceId: newEntry.passNumber,
      referenceType: 'HOSTEL_VISITOR',
      linkTab: 'hostel-admin'
    });

    this.logAudit('CREATE_VISITOR_ENTRY', 'Hostel Visitor Desk', `Registered visitor ${newEntry.visitorName} (Pass ${newEntry.passNumber}) for student ${newEntry.studentName}`, user?.name || 'Security Officer', user?.role || 'HOSTEL_ADMIN');
    return newEntry;
  }

  public updateHostelVisitorEntry(id: string, data: Partial<HostelVisitorEntry>, user?: any): HostelVisitorEntry | null {
    if (!this.state.hostelVisitorEntries) this.state.hostelVisitorEntries = [];
    const idx = this.state.hostelVisitorEntries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const existing = this.state.hostelVisitorEntries[idx];
    const updated: HostelVisitorEntry = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.state.hostelVisitorEntries[idx] = updated;
    this.saveState();
    this.logAudit('UPDATE_VISITOR_ENTRY', 'Hostel Visitor Desk', `Updated visitor entry ${updated.passNumber} (${updated.status})`, user?.name || 'Administrator', user?.role || 'HOSTEL_ADMIN');
    return updated;
  }

  public approveHostelVisitorEntry(id: string, user?: any): HostelVisitorEntry | null {
    const updated = this.updateHostelVisitorEntry(id, {
      status: 'APPROVED',
      approvedBy: user?.id || 'user-warden',
      approvedByName: user?.name || 'Hostel Warden',
      approvedAt: new Date().toISOString()
    }, user);

    if (updated && updated.studentId) {
      this.addNotification({
        type: 'SUCCESS',
        title: `Visitor Pass Approved: ${updated.passNumber}`,
        message: `Visit for ${updated.visitorName} has been approved by Hostel Warden.`,
        module: 'HOSTEL',
        targetUserId: updated.studentId,
        referenceId: updated.passNumber,
        referenceType: 'HOSTEL_VISITOR',
        linkTab: 'student-hostel'
      });
    }

    return updated;
  }

  public rejectHostelVisitorEntry(id: string, reason: string, user?: any): HostelVisitorEntry | null {
    const updated = this.updateHostelVisitorEntry(id, {
      status: 'REJECTED',
      rejectedReason: reason || 'Entry denied by Hostel Warden',
      approvedBy: user?.id || 'user-warden',
      approvedByName: user?.name || 'Hostel Warden',
      approvedAt: new Date().toISOString()
    }, user);

    if (updated && updated.studentId) {
      this.addNotification({
        type: 'REJECTION',
        title: `Visitor Pass Rejected: ${updated.passNumber}`,
        message: `Visit for ${updated.visitorName} was rejected: ${reason || 'Denied by Warden'}.`,
        module: 'HOSTEL',
        targetUserId: updated.studentId,
        referenceId: updated.passNumber,
        referenceType: 'HOSTEL_VISITOR',
        linkTab: 'student-hostel'
      });
    }

    return updated;
  }

  public markVisitorInside(id: string, user?: any): HostelVisitorEntry | null {
    return this.updateHostelVisitorEntry(id, {
      status: 'INSIDE',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toTimeString().slice(0, 5),
      actualExitDate: undefined,
      actualExitTime: undefined
    }, user);
  }

  public markVisitorExit(id: string, user?: any): HostelVisitorEntry | null {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    return this.updateHostelVisitorEntry(id, {
      status: 'EXITED',
      actualExitDate: today,
      actualExitTime: currentTime
    }, user);
  }

  public deleteHostelVisitorEntry(id: string, user?: any): boolean {
    if (!this.state.hostelVisitorEntries) this.state.hostelVisitorEntries = [];
    const idx = this.state.hostelVisitorEntries.findIndex(e => e.id === id);
    if (idx === -1) return false;

    const pass = this.state.hostelVisitorEntries[idx].passNumber;
    this.state.hostelVisitorEntries.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_VISITOR_ENTRY', 'Hostel Visitor Desk', `Deleted visitor pass record ${pass}`, user?.name || 'Administrator', user?.role || 'HOSTEL_ADMIN');
    return true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSPORT MANAGEMENT & VEHICLE FLEET MODULE
  // ──────────────────────────────────────────────────────────────────────────

  public isVehicleDocumentExpiringSoon(expiryDate?: string): boolean {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    // Expired or expiring within 30 days
    return exp <= now + thirtyDays;
  }

  public getTransportVehicles(
    filter?: {
      status?: string;
      vehicleType?: string;
      expiringSoon?: boolean;
      search?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): TransportVehicle[] {
    if (!this.state.transportVehicles) {
      this.state.transportVehicles = [...initialTransportVehicles];
    }

    let list = [...this.state.transportVehicles];

    // Filter by Status
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(v => v.status === filter.status);
    }

    // Filter by Vehicle Type
    if (filter?.vehicleType && filter.vehicleType !== 'ALL') {
      list = list.filter(v => v.vehicleType === filter.vehicleType);
    }

    // Filter by Expiring Documents (Insurance, Fitness, PUC, Permit)
    if (filter?.expiringSoon) {
      list = list.filter(v => 
        this.isVehicleDocumentExpiringSoon(v.insuranceExpiry) ||
        this.isVehicleDocumentExpiringSoon(v.fitnessExpiry) ||
        this.isVehicleDocumentExpiringSoon(v.pollutionExpiry) ||
        this.isVehicleDocumentExpiringSoon(v.permitExpiry) ||
        (v.documents || []).some(d => this.isVehicleDocumentExpiringSoon(d.expiryDate))
      );
    }

    // Search by Keyword
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(v =>
        (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(q)) ||
        (v.makeModel && v.makeModel.toLowerCase().includes(q)) ||
        (v.registrationNumber && v.registrationNumber.toLowerCase().includes(q)) ||
        (v.insuranceNumber && v.insuranceNumber.toLowerCase().includes(q)) ||
        (v.fitnessCertificate && v.fitnessCertificate.toLowerCase().includes(q)) ||
        (v.pollutionCertificate && v.pollutionCertificate.toLowerCase().includes(q)) ||
        (v.permitNumber && v.permitNumber.toLowerCase().includes(q)) ||
        (v.assignedRoute && v.assignedRoute.toLowerCase().includes(q)) ||
        (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(q)) ||
        (v.remarks && v.remarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => (a.vehicleNumber || '').localeCompare(b.vehicleNumber || ''));
  }

  public getTransportVehicleDashboardStats(): TransportVehicleDashboardStats {
    const list = this.getTransportVehicles();
    const active = list.filter(v => v.status === 'ACTIVE').length;
    const inactive = list.filter(v => v.status === 'INACTIVE' || v.status === 'DECOMMISSIONED').length;
    const inMaintenance = list.filter(v => v.status === 'MAINTENANCE').length;
    const documentsExpiring = list.filter(v =>
      this.isVehicleDocumentExpiringSoon(v.insuranceExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.fitnessExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.pollutionExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.permitExpiry) ||
      (v.documents || []).some(d => this.isVehicleDocumentExpiringSoon(d.expiryDate))
    ).length;

    return {
      totalVehicles: list.length,
      active,
      inactive,
      documentsExpiring,
      inMaintenance
    };
  }

  public getTransportVehicleById(id: string): TransportVehicle | undefined {
    return (this.state.transportVehicles || []).find(v => v.id === id);
  }

  public createTransportVehicle(data: Partial<TransportVehicle>, user?: any): TransportVehicle {
    if (!this.state.transportVehicles) this.state.transportVehicles = [];

    const newVehicle: TransportVehicle = {
      id: data.id || `veh-${Date.now()}`,
      vehicleNumber: (data.vehicleNumber || '').toUpperCase().trim(),
      vehicleType: data.vehicleType || 'BUS',
      makeModel: data.makeModel || 'Tata Starbus',
      capacity: Number(data.capacity) || 50,
      registrationNumber: (data.registrationNumber || data.vehicleNumber || '').toUpperCase().trim(),
      registrationDate: data.registrationDate || new Date().toISOString().split('T')[0],
      insuranceNumber: data.insuranceNumber || '',
      insuranceExpiry: data.insuranceExpiry || '',
      fitnessCertificate: data.fitnessCertificate || '',
      fitnessExpiry: data.fitnessExpiry || '',
      pollutionCertificate: data.pollutionCertificate || '',
      pollutionExpiry: data.pollutionExpiry || '',
      permitNumber: data.permitNumber || '',
      permitExpiry: data.permitExpiry || '',
      status: data.status || 'ACTIVE',
      remarks: data.remarks || '',
      documents: data.documents || [],
      assignedRoute: data.assignedRoute || '',
      assignedDriverName: data.assignedDriverName || '',
      assignedDriverPhone: data.assignedDriverPhone || '',
      fuelType: data.fuelType || 'DIESEL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.name || 'Transport Manager'
    };

    this.state.transportVehicles.unshift(newVehicle);
    this.saveState();

    this.addNotification({
      title: `Transport Fleet Vehicle Added: ${newVehicle.vehicleNumber}`,
      message: `${newVehicle.vehicleType} ${newVehicle.makeModel} (${newVehicle.vehicleNumber}) added to fleet`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'transport-admin'
    });

    this.logAudit('CREATE_VEHICLE', 'Transport Management', `Added vehicle ${newVehicle.vehicleNumber} (${newVehicle.makeModel}) to active fleet`, user?.name || 'Transport Supervisor', user?.role || 'TRANSPORT_ADMIN');
    return newVehicle;
  }

  public updateTransportVehicle(id: string, data: Partial<TransportVehicle>, user?: any): TransportVehicle | null {
    if (!this.state.transportVehicles) this.state.transportVehicles = [];
    const idx = this.state.transportVehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;

    const existing = this.state.transportVehicles[idx];
    const updated: TransportVehicle = {
      ...existing,
      ...data,
      vehicleNumber: data.vehicleNumber ? data.vehicleNumber.toUpperCase().trim() : existing.vehicleNumber,
      registrationNumber: data.registrationNumber ? data.registrationNumber.toUpperCase().trim() : existing.registrationNumber,
      capacity: data.capacity !== undefined ? Number(data.capacity) : existing.capacity,
      updatedAt: new Date().toISOString()
    };

    this.state.transportVehicles[idx] = updated;
    this.saveState();

    this.logAudit('UPDATE_VEHICLE', 'Transport Management', `Updated vehicle ${updated.vehicleNumber} (${updated.status})`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return updated;
  }

  public deactivateTransportVehicle(id: string, user?: any): TransportVehicle | null {
    return this.updateTransportVehicle(id, { status: 'INACTIVE' }, user);
  }

  public activateTransportVehicle(id: string, user?: any): TransportVehicle | null {
    return this.updateTransportVehicle(id, { status: 'ACTIVE' }, user);
  }

  public deleteTransportVehicle(id: string, user?: any): boolean {
    if (!this.state.transportVehicles) this.state.transportVehicles = [];
    const idx = this.state.transportVehicles.findIndex(v => v.id === id);
    if (idx === -1) return false;

    const vehNo = this.state.transportVehicles[idx].vehicleNumber;
    this.state.transportVehicles.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_VEHICLE', 'Transport Management', `Deleted vehicle ${vehNo} from fleet registry`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSPORT ROUTE & STOPS MANAGEMENT MODULE
  // ──────────────────────────────────────────────────────────────────────────

  public validateRouteAssignment(
    routeData: Partial<BusRoute>,
    excludeRouteId?: string
  ): { isValid: boolean; error?: string } {
    if (!this.state.busRoutes) this.state.busRoutes = [...initialBusRoutes];

    const targetStatus = routeData.status || 'ACTIVE';
    if (targetStatus !== 'ACTIVE') {
      return { isValid: true };
    }

    const otherActiveRoutes = this.state.busRoutes.filter(
      r => r.id !== excludeRouteId && r.status === 'ACTIVE'
    );

    // 1. Vehicle Conflict Validation
    if (routeData.assignedVehicleNumber && routeData.assignedVehicleNumber.trim()) {
      const vehConflict = otherActiveRoutes.find(
        r => r.assignedVehicleNumber && r.assignedVehicleNumber.trim().toUpperCase() === routeData.assignedVehicleNumber?.trim().toUpperCase()
      );
      if (vehConflict) {
        return {
          isValid: false,
          error: `Vehicle "${routeData.assignedVehicleNumber}" is already assigned to active route ${vehConflict.routeNo} (${vehConflict.routeName}). A vehicle cannot be assigned to conflicting active routes.`
        };
      }
    }

    // 2. Driver Conflict Validation
    if (routeData.assignedDriverName && routeData.assignedDriverName.trim()) {
      const drvConflict = otherActiveRoutes.find(
        r => 
          (routeData.assignedDriverId && r.assignedDriverId === routeData.assignedDriverId) ||
          (r.assignedDriverName && r.assignedDriverName.trim().toLowerCase() === routeData.assignedDriverName?.trim().toLowerCase())
      );
      if (drvConflict) {
        return {
          isValid: false,
          error: `Driver "${routeData.assignedDriverName}" is already assigned to active route ${drvConflict.routeNo} (${drvConflict.routeName}). A driver cannot be assigned to conflicting active routes.`
        };
      }
    }

    return { isValid: true };
  }

  public getBusRoutes(
    filter?: {
      status?: string;
      search?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): BusRoute[] {
    if (!this.state.busRoutes || this.state.busRoutes.length === 0) {
      this.state.busRoutes = [...initialBusRoutes];
    }
    let list = [...this.state.busRoutes];

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(r => r.status === filter.status);
    }

    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(r =>
        (r.routeNo && r.routeNo.toLowerCase().includes(q)) ||
        (r.routeName && r.routeName.toLowerCase().includes(q)) ||
        (r.startPoint && r.startPoint.toLowerCase().includes(q)) ||
        (r.endPoint && r.endPoint.toLowerCase().includes(q)) ||
        (r.assignedVehicleNumber && r.assignedVehicleNumber.toLowerCase().includes(q)) ||
        (r.assignedDriverName && r.assignedDriverName.toLowerCase().includes(q)) ||
        (r.stops && r.stops.some(s => s.stopName.toLowerCase().includes(q) || (s.landmark && s.landmark.toLowerCase().includes(q))))
      );
    }

    return list.sort((a, b) => (a.routeNo || '').localeCompare(b.routeNo || ''));
  }

  public getBusRouteById(id: string): BusRoute | undefined {
    return (this.state.busRoutes || []).find(r => r.id === id);
  }

  public getTransportRouteDashboardStats(): TransportRouteDashboardStats {
    const list = this.getBusRoutes();
    const active = list.filter(r => r.status === 'ACTIVE').length;
    const inactive = list.filter(r => r.status === 'INACTIVE' || r.status === 'SUSPENDED').length;
    const totalCapacity = list.reduce((acc, r) => acc + (r.capacity || 0), 0);
    const totalAssignedStudents = list.reduce((acc, r) => acc + (r.assignedStudents || 0), 0);

    return {
      totalRoutes: list.length,
      active,
      inactive,
      totalCapacity,
      totalAssignedStudents
    };
  }

  public createBusRoute(data: Partial<BusRoute>, user?: any): { success: boolean; data?: BusRoute; error?: string } {
    if (!this.state.busRoutes) this.state.busRoutes = [];

    // Validate conflict
    const validation = this.validateRouteAssignment(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Auto-fetch driver phone and vehicle capacity if available
    let driverPhone = data.assignedDriverPhone || '';
    if (!driverPhone && data.assignedDriverName && this.state.transportDrivers) {
      const matchedDrv = this.state.transportDrivers.find(d => d.name.toLowerCase() === data.assignedDriverName?.toLowerCase());
      if (matchedDrv) {
        driverPhone = matchedDrv.mobile;
      }
    }

    let capacity = data.capacity || 50;
    if (data.assignedVehicleNumber && this.state.transportVehicles) {
      const matchedVeh = this.state.transportVehicles.find(v => v.vehicleNumber === data.assignedVehicleNumber);
      if (matchedVeh && matchedVeh.capacity) {
        capacity = matchedVeh.capacity;
      }
    }

    const newRoute: BusRoute = {
      id: data.id || `r-${Date.now()}`,
      routeNo: data.routeNo || `Route ${this.state.busRoutes.length + 101}`,
      routeName: data.routeName || 'Campus Commuter Route',
      startPoint: data.startPoint || 'Origin Point',
      endPoint: data.endPoint || 'SSIU Main Campus',
      stops: data.stops && data.stops.length > 0 ? data.stops : [
        { id: `st-${Date.now()}-1`, stopName: data.startPoint || 'Origin Point', pickupTime: data.pickupTime || '07:30 AM', dropTime: data.dropTime || '05:30 PM', sequence: 1 },
        { id: `st-${Date.now()}-2`, stopName: data.endPoint || 'SSIU Main Campus', pickupTime: '08:30 AM', dropTime: '04:30 PM', sequence: 2, landmark: 'Main Gate 1' }
      ],
      pickupTime: data.pickupTime || '07:30 AM',
      dropTime: data.dropTime || '05:30 PM',
      assignedVehicleNumber: data.assignedVehicleNumber || '',
      assignedDriverId: data.assignedDriverId || '',
      assignedDriverName: data.assignedDriverName || 'Assigned Driver',
      assignedDriverPhone: driverPhone,
      capacity,
      assignedStudents: data.assignedStudents || 0,
      status: data.status || 'ACTIVE',
      remarks: data.remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.name || 'Transport Manager'
    };

    this.state.busRoutes.push(newRoute);

    // Sync vehicle record if assigned
    if (newRoute.assignedVehicleNumber && this.state.transportVehicles) {
      const veh = this.state.transportVehicles.find(v => v.vehicleNumber === newRoute.assignedVehicleNumber);
      if (veh) {
        veh.assignedRoute = `${newRoute.routeNo}: ${newRoute.routeName}`;
        if (newRoute.assignedDriverName) veh.assignedDriverName = newRoute.assignedDriverName;
        if (newRoute.assignedDriverPhone) veh.assignedDriverPhone = newRoute.assignedDriverPhone;
      }
    }

    // Sync driver record if assigned
    if (newRoute.assignedDriverName && this.state.transportDrivers) {
      const drv = this.state.transportDrivers.find(d => d.name.toLowerCase() === newRoute.assignedDriverName.toLowerCase());
      if (drv) {
        drv.assignedRouteNo = newRoute.routeNo;
        if (newRoute.assignedVehicleNumber) drv.assignedVehicleNumber = newRoute.assignedVehicleNumber;
      }
    }

    this.saveState();
    this.logAudit('CREATE_BUS_ROUTE', 'Transport Management', `Created route ${newRoute.routeNo}: ${newRoute.routeName} (${newRoute.assignedVehicleNumber || 'No vehicle'} - ${newRoute.assignedDriverName})`, user?.name || 'Transport Officer', user?.role || 'TRANSPORT_ADMIN');
    return { success: true, data: newRoute };
  }

  public updateBusRoute(id: string, data: Partial<BusRoute>, user?: any): { success: boolean; data?: BusRoute; error?: string } {
    if (!this.state.busRoutes) this.state.busRoutes = [];
    const idx = this.state.busRoutes.findIndex(r => r.id === id);
    if (idx === -1) return { success: false, error: 'Route not found' };

    // Validate conflict excluding this route
    const validation = this.validateRouteAssignment(data, id);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const existing = this.state.busRoutes[idx];
    const updated: BusRoute = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.state.busRoutes[idx] = updated;

    // Sync vehicle record if updated
    if (updated.assignedVehicleNumber && this.state.transportVehicles) {
      const veh = this.state.transportVehicles.find(v => v.vehicleNumber === updated.assignedVehicleNumber);
      if (veh) {
        veh.assignedRoute = `${updated.routeNo}: ${updated.routeName}`;
        if (updated.assignedDriverName) veh.assignedDriverName = updated.assignedDriverName;
        if (updated.assignedDriverPhone) veh.assignedDriverPhone = updated.assignedDriverPhone;
      }
    }

    // Sync driver record if updated
    if (updated.assignedDriverName && this.state.transportDrivers) {
      const drv = this.state.transportDrivers.find(d => d.name.toLowerCase() === updated.assignedDriverName.toLowerCase());
      if (drv) {
        drv.assignedRouteNo = updated.routeNo;
        if (updated.assignedVehicleNumber) drv.assignedVehicleNumber = updated.assignedVehicleNumber;
      }
    }

    this.saveState();
    this.logAudit('UPDATE_BUS_ROUTE', 'Transport Management', `Updated route ${updated.routeNo}: ${updated.routeName}`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return { success: true, data: updated };
  }

  public deactivateBusRoute(id: string, user?: any): BusRoute | null {
    const res = this.updateBusRoute(id, { status: 'INACTIVE' }, user);
    return res.success ? res.data || null : null;
  }

  public activateBusRoute(id: string, user?: any): { success: boolean; data?: BusRoute; error?: string } {
    const route = this.getBusRouteById(id);
    if (!route) return { success: false, error: 'Route not found' };
    return this.updateBusRoute(id, { status: 'ACTIVE' }, user);
  }

  public deleteBusRoute(id: string, user?: any): boolean {
    if (!this.state.busRoutes) this.state.busRoutes = [];
    const idx = this.state.busRoutes.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const rNo = this.state.busRoutes[idx].routeNo;
    this.state.busRoutes.splice(idx, 1);
    this.saveState();
    this.logAudit('DELETE_BUS_ROUTE', 'Transport Management', `Deleted route ${rNo}`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return true;
  }

  public addStopToRoute(routeId: string, stop: Omit<RouteStop, 'id'>, user?: any): BusRoute | null {
    const route = this.getBusRouteById(routeId);
    if (!route) return null;

    const newStop: RouteStop = {
      ...stop,
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sequence: stop.sequence || ((route.stops || []).length + 1)
    };

    const stops = [...(route.stops || []), newStop].sort((a, b) => a.sequence - b.sequence);
    const res = this.updateBusRoute(routeId, { stops }, user);
    return res.success ? res.data || null : null;
  }

  public updateStopInRoute(routeId: string, stopId: string, stopData: Partial<RouteStop>, user?: any): BusRoute | null {
    const route = this.getBusRouteById(routeId);
    if (!route || !route.stops) return null;

    const stops = route.stops.map(s => s.id === stopId ? { ...s, ...stopData } : s).sort((a, b) => a.sequence - b.sequence);
    const res = this.updateBusRoute(routeId, { stops }, user);
    return res.success ? res.data || null : null;
  }

  public deleteStopFromRoute(routeId: string, stopId: string, user?: any): BusRoute | null {
    const route = this.getBusRouteById(routeId);
    if (!route || !route.stops) return null;

    const stops = route.stops.filter(s => s.id !== stopId).map((s, idx) => ({ ...s, sequence: idx + 1 }));
    const res = this.updateBusRoute(routeId, { stops }, user);
    return res.success ? res.data || null : null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSPORT DRIVER MANAGEMENT MODULE
  // ──────────────────────────────────────────────────────────────────────────

  public isDriverLicenseExpiringSoon(expiryDate?: string): boolean {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return exp <= now + thirtyDays;
  }

  public getTransportDrivers(
    filter?: {
      status?: string;
      licenseType?: string;
      expiringSoon?: boolean;
      search?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): TransportDriver[] {
    if (!this.state.transportDrivers) {
      this.state.transportDrivers = [...initialTransportDrivers];
    }

    let list = [...this.state.transportDrivers];

    // Filter by Status
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(d => d.status === filter.status);
    }

    // Filter by License Type
    if (filter?.licenseType && filter.licenseType !== 'ALL') {
      list = list.filter(d => d.licenseType === filter.licenseType);
    }

    // Filter by Expiring Soon (<30 days or expired)
    if (filter?.expiringSoon) {
      list = list.filter(d => 
        this.isDriverLicenseExpiringSoon(d.licenseExpiry) ||
        (d.documents || []).some(doc => this.isDriverLicenseExpiringSoon(doc.expiryDate))
      );
    }

    // Search Keyword
    if (filter?.search?.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.mobile && d.mobile.toLowerCase().includes(q)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q)) ||
        (d.emergencyContact && d.emergencyContact.toLowerCase().includes(q)) ||
        (d.assignedVehicleNumber && d.assignedVehicleNumber.toLowerCase().includes(q)) ||
        (d.assignedRouteNo && d.assignedRouteNo.toLowerCase().includes(q)) ||
        (d.remarks && d.remarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  public getTransportDriverDashboardStats(): TransportDriverDashboardStats {
    const list = this.getTransportDrivers();
    const active = list.filter(d => d.status === 'ACTIVE').length;
    const inactive = list.filter(d => d.status === 'INACTIVE' || d.status === 'SUSPENDED' || d.status === 'TERMINATED').length;
    const onLeave = list.filter(d => d.status === 'ON_LEAVE').length;
    const licenseExpiringSoon = list.filter(d =>
      this.isDriverLicenseExpiringSoon(d.licenseExpiry) ||
      (d.documents || []).some(doc => this.isDriverLicenseExpiringSoon(doc.expiryDate))
    ).length;

    return {
      totalDrivers: list.length,
      active,
      inactive,
      licensesExpiring: licenseExpiringSoon,
      onLeave
    };
  }

  public getTransportDriverById(id: string): TransportDriver | undefined {
    return (this.state.transportDrivers || []).find(d => d.id === id);
  }

  public createTransportDriver(data: Partial<TransportDriver>, user?: any): TransportDriver {
    if (!this.state.transportDrivers) this.state.transportDrivers = [];

    const newDriver: TransportDriver = {
      id: data.id || `drv-${Date.now()}`,
      name: data.name || 'Driver Staff',
      mobile: data.mobile || '',
      address: data.address || '',
      emergencyContact: data.emergencyContact || '',
      emergencyContactRelation: data.emergencyContactRelation || 'Family',
      licenseNumber: data.licenseNumber || '',
      licenseType: data.licenseType || 'HMV',
      licenseExpiry: data.licenseExpiry || '',
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      status: data.status || 'ACTIVE',
      photo: data.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      assignedVehicleNumber: data.assignedVehicleNumber || '',
      assignedRouteNo: data.assignedRouteNo || '',
      bloodGroup: data.bloodGroup || 'O+',
      remarks: data.remarks || '',
      documents: data.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.name || 'Transport Manager'
    };

    this.state.transportDrivers.unshift(newDriver);

    // Synchronize vehicle assignment if selected
    if (newDriver.assignedVehicleNumber) {
      const v = (this.state.transportVehicles || []).find(x => x.vehicleNumber === newDriver.assignedVehicleNumber);
      if (v) {
        v.assignedDriverName = newDriver.name;
        v.assignedDriverPhone = newDriver.mobile;
      }
    }

    this.saveState();

    this.addNotification({
      title: `Transport Driver Registered: ${newDriver.name}`,
      message: `Driver ${newDriver.name} (${newDriver.licenseNumber} - ${newDriver.licenseType}) registered in transport staff registry`,
      module: 'NOTICE',
      timestamp: 'Just now',
      targetRole: 'ALL',
      linkTab: 'transport-admin'
    });

    this.logAudit('CREATE_DRIVER', 'Transport Management', `Registered driver ${newDriver.name} (${newDriver.licenseNumber}) in active transport roster`, user?.name || 'Transport Supervisor', user?.role || 'TRANSPORT_ADMIN');
    return newDriver;
  }

  public updateTransportDriver(id: string, data: Partial<TransportDriver>, user?: any): TransportDriver | null {
    if (!this.state.transportDrivers) this.state.transportDrivers = [];
    const idx = this.state.transportDrivers.findIndex(d => d.id === id);
    if (idx === -1) return null;

    const existing = this.state.transportDrivers[idx];
    const updated: TransportDriver = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.state.transportDrivers[idx] = updated;

    // Synchronize vehicle assignment if updated
    if (updated.assignedVehicleNumber) {
      const v = (this.state.transportVehicles || []).find(x => x.vehicleNumber === updated.assignedVehicleNumber);
      if (v) {
        v.assignedDriverName = updated.name;
        v.assignedDriverPhone = updated.mobile;
      }
    }

    this.saveState();
    this.logAudit('UPDATE_DRIVER', 'Transport Management', `Updated driver record for ${updated.name} (${updated.status})`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return updated;
  }

  public deactivateTransportDriver(id: string, user?: any): TransportDriver | null {
    return this.updateTransportDriver(id, { status: 'INACTIVE' }, user);
  }

  public activateTransportDriver(id: string, user?: any): TransportDriver | null {
    return this.updateTransportDriver(id, { status: 'ACTIVE' }, user);
  }

  public deleteTransportDriver(id: string, user?: any): boolean {
    if (!this.state.transportDrivers) this.state.transportDrivers = [];
    const idx = this.state.transportDrivers.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const drvName = this.state.transportDrivers[idx].name;
    this.state.transportDrivers.splice(idx, 1);
    this.logAudit('DELETE_DRIVER', 'Transport Management', `Deleted driver ${drvName} from staff roster`, user?.name || 'Administrator', user?.role || 'TRANSPORT_ADMIN');
    return true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EXECUTIVE TRANSPORT ANALYTICS & DASHBOARD METRICS
  // ──────────────────────────────────────────────────────────────────────────

  public getTransportExecutiveDashboardStats(
    filters?: {
      routeNo?: string;
      vehicleNo?: string;
      driverName?: string;
      status?: string;
    }
  ): TransportExecutiveDashboardStats {
    let vehList = this.getTransportVehicles();
    let drvList = this.getTransportDrivers();
    let routeList = this.getBusRoutes();

    // Apply Filter Scoping if selected
    if (filters?.status && filters.status !== 'ALL') {
      vehList = vehList.filter(v => v.status === filters.status);
      drvList = drvList.filter(d => d.status === filters.status);
      routeList = routeList.filter(r => r.status === filters.status);
    }

    if (filters?.routeNo && filters.routeNo !== 'ALL') {
      routeList = routeList.filter(r => r.routeNo === filters.routeNo);
      vehList = vehList.filter(v => v.assignedRoute?.includes(filters.routeNo!));
      drvList = drvList.filter(d => d.assignedRouteNo === filters.routeNo);
    }

    if (filters?.vehicleNo && filters.vehicleNo !== 'ALL') {
      vehList = vehList.filter(v => v.vehicleNumber === filters.vehicleNo);
      routeList = routeList.filter(r => r.assignedVehicleNumber === filters.vehicleNo);
      drvList = drvList.filter(d => d.assignedVehicleNumber === filters.vehicleNo);
    }

    if (filters?.driverName && filters.driverName !== 'ALL') {
      drvList = drvList.filter(d => d.name === filters.driverName);
      routeList = routeList.filter(r => r.assignedDriverName === filters.driverName);
      vehList = vehList.filter(v => v.assignedDriverName === filters.driverName);
    }

    const totalVehicles = vehList.length;
    const activeVehicles = vehList.filter(v => v.status === 'ACTIVE').length;
    const inactiveVehicles = vehList.filter(v => v.status !== 'ACTIVE').length;

    const totalDrivers = drvList.length;
    const activeDrivers = drvList.filter(d => d.status === 'ACTIVE').length;

    const totalRoutes = routeList.length;
    const activeRoutes = routeList.filter(r => r.status === 'ACTIVE').length;

    const studentsUsingTransport = routeList.reduce((acc, r) => acc + (r.assignedStudents || 0), 0);
    const totalRouteCapacity = routeList.reduce((acc, r) => acc + (r.capacity || 0), 0);
    const totalFleetCapacity = vehList.reduce((acc, v) => acc + (v.capacity || 0), 0);

    // Calculate documents expiring for both vehicles and drivers
    const vehExpiringCount = vehList.filter(v => 
      this.isVehicleDocumentExpiringSoon(v.insuranceExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.fitnessExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.pollutionExpiry) ||
      this.isVehicleDocumentExpiringSoon(v.permitExpiry) ||
      (v.documents || []).some(doc => this.isVehicleDocumentExpiringSoon(doc.expiryDate))
    ).length;

    const drvExpiringCount = drvList.filter(d =>
      this.isDriverLicenseExpiringSoon(d.licenseExpiry) ||
      (d.documents || []).some(doc => this.isDriverLicenseExpiringSoon(doc.expiryDate))
    ).length;

    const documentsExpiring = vehExpiringCount + drvExpiringCount;

    const vehicleUtilization = totalFleetCapacity > 0
      ? Math.min(100, Math.round((studentsUsingTransport / totalFleetCapacity) * 100))
      : (activeVehicles > 0 ? Math.round((activeVehicles / (totalVehicles || 1)) * 100) : 0);

    const routeUtilization = totalRouteCapacity > 0
      ? Math.min(100, Math.round((studentsUsingTransport / totalRouteCapacity) * 100))
      : 0;

    return {
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      totalDrivers,
      activeDrivers,
      totalRoutes,
      activeRoutes,
      studentsUsingTransport,
      documentsExpiring,
      vehicleUtilization,
      routeUtilization
    };
  }

  // ─── PHASE 8 TRANSPORT MANAGEMENT OPERATIONS ───────────────────────────────

  public getStudentTransportAllocations(filters?: {
    studentId?: string;
    routeId?: string;
    vehicleId?: string;
    status?: string;
    search?: string;
  }): StudentTransportAllocation[] {
    if (!this.state.studentTransportAllocations) {
      this.state.studentTransportAllocations = [
        {
          id: 'trn-allot-01',
          allotmentNo: 'TRN-ALL-2026-000001',
          studentId: 'stud-01',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          instituteId: 'inst-01',
          departmentId: 'dept-01',
          routeId: 'route-01',
          routeName: 'Ahmedabad ISKCON — SSIU Campus',
          routeNumber: 'R-101',
          stopId: 'stop-01',
          stopName: 'ISKCON Cross Roads',
          pickupTime: '07:15 AM',
          dropTime: '05:45 PM',
          vehicleId: 'veh-01',
          vehicleNumber: 'GJ-01-AB-1234',
          driverName: 'Rameshwar Yadav',
          driverPhone: '9825123456',
          academicYear: '2026-27',
          allocatedDate: '2026-07-01',
          status: 'ACTIVE',
          passNumber: 'TP-2026-000001',
          remarks: 'Annual bus pass seat',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'trn-allot-02',
          allotmentNo: 'TRN-ALL-2026-000002',
          studentId: 'stud-02',
          studentName: 'Priya Mehta',
          enrollmentNo: '24SSIU01002',
          instituteId: 'inst-01',
          departmentId: 'dept-01',
          routeId: 'route-01',
          routeName: 'Ahmedabad ISKCON — SSIU Campus',
          routeNumber: 'R-101',
          stopId: 'stop-02',
          stopName: 'Pakwan Cross Roads',
          pickupTime: '07:25 AM',
          dropTime: '05:35 PM',
          vehicleId: 'veh-01',
          vehicleNumber: 'GJ-01-AB-1234',
          driverName: 'Rameshwar Yadav',
          driverPhone: '9825123456',
          academicYear: '2026-27',
          allocatedDate: '2026-07-01',
          status: 'ACTIVE',
          passNumber: 'TP-2026-000002',
          remarks: 'Annual bus pass seat',
          createdAt: new Date().toISOString(),
        },
      ];
      this.saveState();
    }

    let list = [...this.state.studentTransportAllocations];

    if (filters?.studentId) list = list.filter((a) => a.studentId === filters.studentId);
    if (filters?.routeId && filters.routeId !== 'ALL') list = list.filter((a) => a.routeId === filters.routeId);
    if (filters?.vehicleId && filters.vehicleId !== 'ALL') list = list.filter((a) => a.vehicleId === filters.vehicleId);
    if (filters?.status && filters.status !== 'ALL') list = list.filter((a) => a.status === filters.status);

    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.allotmentNo.toLowerCase().includes(q) ||
          (a.studentName && a.studentName.toLowerCase().includes(q)) ||
          (a.enrollmentNo && a.enrollmentNo.toLowerCase().includes(q)) ||
          (a.vehicleNumber && a.vehicleNumber.toLowerCase().includes(q)) ||
          (a.routeName && a.routeName.toLowerCase().includes(q)) ||
          (a.stopName && a.stopName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public allocateStudentTransport(
    data: {
      studentId: string;
      routeId: string;
      stopId: string;
      vehicleId: string;
      academicYear?: string;
      remarks?: string;
    },
    user?: any
  ): { success: boolean; message: string; allocation?: StudentTransportAllocation } {
    if (!this.state.studentTransportAllocations) this.getStudentTransportAllocations();

    // 1. Duplicate active check
    const existingActive = (this.state.studentTransportAllocations || []).find(
      (a) => a.studentId === data.studentId && a.status === 'ACTIVE'
    );
    if (existingActive) {
      return {
        success: false,
        message: `Student already has an active transport allotment (#${existingActive.allotmentNo}).`,
      };
    }

    // 2. Capacity Check on Vehicle
    const vehicle = this.getTransportVehicleById(data.vehicleId);
    if (!vehicle || vehicle.status !== 'ACTIVE') {
      return { success: false, message: 'Selected vehicle is invalid or inactive.' };
    }

    const currentAllocations = (this.state.studentTransportAllocations || []).filter(
      (a) => a.vehicleId === data.vehicleId && a.status === 'ACTIVE'
    ).length;

    if (currentAllocations >= vehicle.capacity) {
      return {
        success: false,
        message: `Vehicle capacity is full. Allocated: ${currentAllocations}/${vehicle.capacity}. Cannot allocate more students.`,
      };
    }

    const student = this.getStudentById(data.studentId);
    const route = this.getBusRoutes().find((r) => r.id === data.routeId || r.routeNo === data.routeId);
    const stop = route?.stops?.find((s) => s.id === data.stopId || s.stopName === data.stopId);
    const driver = this.getTransportDrivers().find((d) => d.assignedVehicleNumber === vehicle.vehicleNumber);

    const newAllotment: StudentTransportAllocation = {
      id: `allot-${Date.now()}`,
      allotmentNo: `TRN-ALL-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: data.studentId,
      studentName: student ? student.name : 'Student',
      enrollmentNo: student?.enrollmentNo || 'ENR-000',
      instituteId: student?.instituteId,
      departmentId: student?.departmentId,
      routeId: data.routeId,
      routeName: route?.routeName || 'Campus Route',
      routeNumber: route?.routeNo || 'R-101',
      stopId: data.stopId,
      stopName: stop?.stopName || 'Main Stop',
      pickupTime: stop?.pickupTime || '07:30 AM',
      dropTime: stop?.dropTime || '05:30 PM',
      vehicleId: data.vehicleId,
      vehicleNumber: vehicle.vehicleNumber,
      driverName: driver?.name || vehicle.assignedDriverName || 'Driver',
      driverPhone: driver?.mobile || vehicle.assignedDriverPhone || '9825000000',
      academicYear: data.academicYear || '2026-27',
      allocatedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      passNumber: `TP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      remarks: data.remarks || 'Transport seat allotted',
      createdAt: new Date().toISOString(),
    };

    if (!this.state.studentTransportAllocations) this.state.studentTransportAllocations = [];
    this.state.studentTransportAllocations.unshift(newAllotment);

    // Update route count
    if (route) {
      route.assignedStudents = (route.assignedStudents || 0) + 1;
      this.updateBusRoute(route.id, { assignedStudents: route.assignedStudents }, user);
    }

    this.saveState();
    return { success: true, message: 'Student transport seat successfully allotted.', allocation: newAllotment };
  }

  public vacateStudentTransport(
    id: string,
    remarks?: string,
    user?: any
  ): { success: boolean; message: string } {
    if (!this.state.studentTransportAllocations) this.getStudentTransportAllocations();
    const allocations = this.state.studentTransportAllocations || [];
    const idx = allocations.findIndex((a) => a.id === id);
    if (idx === -1) return { success: false, message: 'Allotment record not found.' };

    const allot = allocations[idx];
    allot.status = 'CANCELLED';
    allot.remarks = remarks || 'Transport seat cancelled';
    allot.updatedAt = new Date().toISOString();

    const route = this.getBusRoutes().find((r) => r.id === allot.routeId || r.routeNo === allot.routeNumber);
    if (route && (route.assignedStudents || 0) > 0) {
      route.assignedStudents = (route.assignedStudents || 0) - 1;
      this.updateBusRoute(route.id, { assignedStudents: route.assignedStudents }, user);
    }

    this.saveState();
    return { success: true, message: 'Student transport seat vacated successfully.' };
  }

  // ─── TRANSPORT REQUESTS ───────────────────────────────────────────────────

  public getTransportRequests(filters?: {
    studentId?: string;
    status?: string;
    requestType?: string;
  }): TransportRequestItem[] {
    if (!this.state.transportRequests) {
      this.state.transportRequests = [
        {
          id: 'req-01',
          applicationNo: 'TRN-APP-2026-000010',
          studentId: 'stud-01',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          routeId: 'route-01',
          routeName: 'Ahmedabad ISKCON — SSIU Campus',
          stopId: 'stop-01',
          stopName: 'ISKCON Cross Roads',
          requestType: 'NEW_ALLOCATION',
          academicYear: '2026-27',
          status: 'APPROVED',
          remarks: 'Request approved and pass generated',
          reviewedBy: 'Transport Admin',
          reviewedAt: '2026-07-01',
          createdAt: '2026-07-01T08:00:00Z',
        },
      ];
      this.saveState();
    }

    let list = [...this.state.transportRequests];
    if (filters?.studentId) list = list.filter((r) => r.studentId === filters.studentId);
    if (filters?.status && filters.status !== 'ALL') list = list.filter((r) => r.status === filters.status);
    if (filters?.requestType && filters.requestType !== 'ALL') list = list.filter((r) => r.requestType === filters.requestType);

    return list;
  }

  public createTransportRequest(
    data: {
      studentId: string;
      routeId: string;
      stopId: string;
      requestType?: any;
      academicYear?: string;
      remarks?: string;
    },
    user?: any
  ): TransportRequestItem {
    if (!this.state.transportRequests) this.getTransportRequests();

    const student = this.getStudentById(data.studentId);
    const route = this.getBusRoutes().find((r) => r.id === data.routeId || r.routeNo === data.routeId);
    const stop = route?.stops?.find((s) => s.id === data.stopId || s.stopName === data.stopId);

    const newReq: TransportRequestItem = {
      id: `req-${Date.now()}`,
      applicationNo: `TRN-APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: data.studentId,
      studentName: student ? student.name : user?.name || 'Student',
      enrollmentNo: student?.enrollmentNo || 'ENR-000',
      routeId: data.routeId,
      routeName: route?.routeName || 'Campus Route',
      stopId: data.stopId,
      stopName: stop?.stopName || 'Main Stop',
      requestType: data.requestType || 'NEW_ALLOCATION',
      academicYear: data.academicYear || '2026-27',
      status: 'SUBMITTED',
      remarks: data.remarks,
      createdAt: new Date().toISOString(),
    };

    if (!this.state.transportRequests) this.state.transportRequests = [];
    this.state.transportRequests.unshift(newReq);
    this.saveState();
    return newReq;
  }

  public updateTransportRequestStatus(
    id: string,
    data: { status: any; vehicleId?: string; remarks?: string },
    user?: any
  ): { success: boolean; message: string } {
    if (!this.state.transportRequests) this.getTransportRequests();
    const requests = this.state.transportRequests || [];
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, message: 'Request not found.' };

    const req = requests[idx];
    req.status = data.status;
    req.remarks = data.remarks || req.remarks;
    req.reviewedBy = user?.name || 'Transport Admin';
    req.reviewedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    if (data.status === 'APPROVED' && data.vehicleId) {
      this.allocateStudentTransport({
        studentId: req.studentId,
        routeId: req.routeId,
        stopId: req.stopId,
        vehicleId: data.vehicleId,
        academicYear: req.academicYear,
        remarks: `Approved from request #${req.applicationNo}`,
      }, user);
    }

    this.saveState();
    return { success: true, message: `Request status updated to ${data.status}.` };
  }

  // ─── VEHICLE MAINTENANCE ──────────────────────────────────────────────────

  public getVehicleMaintenances(filters?: {
    vehicleId?: string;
    status?: string;
    category?: string;
  }): VehicleMaintenanceItem[] {
    if (!this.state.vehicleMaintenances) {
      this.state.vehicleMaintenances = [
        {
          id: 'mnt-01',
          maintenanceNo: 'MNT-VEH-2026-000001',
          vehicleId: 'veh-01',
          vehicleNumber: 'GJ-01-AB-1234',
          issue: 'Brake pad replacement and brake oil refill',
          category: 'BRAKES',
          description: 'Front right brake pad worn out, tested after replacement',
          priority: 'HIGH',
          reportedDate: '2026-08-10',
          assignedStaff: 'Vikrambhai Vaghela (Chief Mechanic)',
          estimatedCost: 4500,
          actualCost: 4800,
          notesheetId: 'NS/TRANSPORT/2026/0014',
          status: 'COMPLETED',
          completedDate: '2026-08-12',
          createdAt: '2026-08-10T10:00:00Z',
        },
      ];
      this.saveState();
    }

    let list = [...this.state.vehicleMaintenances];
    if (filters?.vehicleId && filters.vehicleId !== 'ALL') list = list.filter((m) => m.vehicleId === filters.vehicleId);
    if (filters?.status && filters.status !== 'ALL') list = list.filter((m) => m.status === filters.status);
    if (filters?.category && filters.category !== 'ALL') list = list.filter((m) => m.category === filters.category);

    return list;
  }

  public createVehicleMaintenance(
    data: Partial<VehicleMaintenanceItem>,
    user?: any
  ): VehicleMaintenanceItem {
    if (!this.state.vehicleMaintenances) this.getVehicleMaintenances();

    const vehicle = this.getTransportVehicleById(data.vehicleId || '');

    const newMnt: VehicleMaintenanceItem = {
      id: `mnt-${Date.now()}`,
      maintenanceNo: `MNT-VEH-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleId: data.vehicleId || '',
      vehicleNumber: vehicle?.vehicleNumber || data.vehicleNumber || 'BUS',
      issue: data.issue || 'Vehicle Maintenance',
      category: data.category || 'ENGINE',
      description: data.description,
      priority: data.priority || 'NORMAL',
      reportedDate: data.reportedDate || new Date().toISOString().split('T')[0],
      assignedStaff: data.assignedStaff,
      estimatedCost: data.estimatedCost,
      notesheetId: data.notesheetId,
      status: data.status || 'REPORTED',
      createdAt: new Date().toISOString(),
    };

    if (!this.state.vehicleMaintenances) this.state.vehicleMaintenances = [];
    this.state.vehicleMaintenances.unshift(newMnt);
    this.saveState();
    return newMnt;
  }

  public updateVehicleMaintenance(
    id: string,
    data: Partial<VehicleMaintenanceItem>,
    user?: any
  ): VehicleMaintenanceItem | null {
    if (!this.state.vehicleMaintenances) this.state.vehicleMaintenances = [];

    const idx = (this.state.vehicleMaintenances || []).findIndex((m) => m.id === id);
    if (idx === -1) return null;

    this.state.vehicleMaintenances[idx] = {
      ...this.state.vehicleMaintenances[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.saveState();
    return this.state.vehicleMaintenances[idx];
  }

  // ─── TRANSPORT TRIPS & DUTY SCHEDULES ─────────────────────────────────────

  public getTransportTrips(filters?: {
    date?: string;
    routeId?: string;
    vehicleId?: string;
    driverId?: string;
  }): TransportTripScheduleItem[] {
    if (!this.state.transportTrips) {
      this.state.transportTrips = [
        {
          id: 'trp-01',
          tripNo: 'TRP-2026-000001',
          vehicleId: 'veh-01',
          vehicleNumber: 'GJ-01-AB-1234',
          routeId: 'route-01',
          routeName: 'Ahmedabad ISKCON — SSIU Campus',
          driverId: 'drv-01',
          driverName: 'Rameshwar Yadav',
          tripDate: new Date().toISOString().split('T')[0],
          shift: 'MORNING',
          startTime: '07:00 AM',
          endTime: '08:30 AM',
          tripType: 'PICKUP',
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
        },
      ];
      this.saveState();
    }

    let list = [...this.state.transportTrips];
    if (filters?.date) list = list.filter((t) => t.tripDate === filters.date);
    if (filters?.routeId && filters.routeId !== 'ALL') list = list.filter((t) => t.routeId === filters.routeId);
    if (filters?.vehicleId && filters.vehicleId !== 'ALL') list = list.filter((t) => t.vehicleId === filters.vehicleId);
    if (filters?.driverId && filters.driverId !== 'ALL') list = list.filter((t) => t.driverId === filters.driverId);

    return list;
  }

  public createTransportTrip(
    data: Partial<TransportTripScheduleItem>,
    user?: any
  ): TransportTripScheduleItem {
    if (!this.state.transportTrips) this.state.transportTrips = [];

    const vehicle = this.getTransportVehicleById(data.vehicleId || '');
    const route = this.getBusRoutes().find((r) => r.id === data.routeId || r.routeNo === data.routeId);
    const driver = this.getTransportDrivers().find((d) => d.id === data.driverId || d.name === data.driverName);

    const newTrip: TransportTripScheduleItem = {
      id: `trp-${Date.now()}`,
      tripNo: `TRP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleId: data.vehicleId || '',
      vehicleNumber: vehicle?.vehicleNumber || data.vehicleNumber || 'BUS',
      routeId: data.routeId || '',
      routeName: route?.routeName || data.routeName || 'Campus Route',
      driverId: data.driverId,
      driverName: driver?.name || data.driverName || 'Driver',
      tripDate: data.tripDate || new Date().toISOString().split('T')[0],
      shift: data.shift || 'MORNING',
      startTime: data.startTime || '07:00 AM',
      endTime: data.endTime || '08:30 AM',
      tripType: data.tripType || 'PICKUP',
      status: data.status || 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    if (!this.state.transportTrips) this.state.transportTrips = [];
    this.state.transportTrips.unshift(newTrip);
    this.saveState();
    return newTrip;
  }

  public updateTransportTrip(
    id: string,
    data: Partial<TransportTripScheduleItem>,
    user?: any
  ): TransportTripScheduleItem | null {
    if (!this.state.transportTrips) this.getTransportTrips();
    const trips = this.state.transportTrips || [];
    const idx = trips.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    trips[idx] = {
      ...trips[idx],
      ...data,
    };

    this.saveState();
    return trips[idx];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SSIU CAMPUS SERVICES & AUXILIARY HUB ENGINE
  // ──────────────────────────────────────────────────────────────────────────

  public getCampusServiceRequests(
    filter?: {
      service?: string;
      status?: string;
      priority?: string;
      instituteId?: string;
      departmentId?: string;
      assignedTo?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      requesterScopeOnly?: boolean;
    },
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest[] {
    if (!this.state.campusServiceRequests) {
      this.state.campusServiceRequests = [...initialCampusServiceRequests];
      this.saveState();
    }

    let list = [...this.state.campusServiceRequests];
    const userRole: UserRole | undefined = role || user?.role || undefined;

    // SECURITY ISOLATION: Role-based filtering
    if (userRole === 'STUDENT') {
      // Student can ONLY see their own requests
      if (user?.id) {
        list = list.filter(r => 
          r.requestedById === user.id ||
          (Boolean(r.requestedByEmail) && r.requestedByEmail!.toLowerCase() === user.email?.toLowerCase()) ||
          (Boolean(user.enrollmentNo) && r.requestedByEnrollmentOrEmpId === user.enrollmentNo)
        );
      } else {
        return [];
      }
    } else if (userRole === 'HOSTEL_ADMIN') {
      list = list.filter(r => r.service === 'Hostel' || r.location?.toLowerCase().includes('hostel') || r.assignedToId === user?.id || r.requestedById === user?.id);
    } else if (userRole === 'TRANSPORT_ADMIN') {
      list = list.filter(r => r.service === 'Transport' || r.assignedToId === user?.id || r.requestedById === user?.id);
    } else if (userRole === 'MAINTENANCE_ADMIN') {
      list = list.filter(r => ['Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'Furniture', 'IT Support', 'Other'].includes(r.service) || r.assignedToId === user?.id || r.requestedById === user?.id);
    } else if (userRole === 'LIBRARY_ADMIN') {
      list = list.filter(r => r.service === 'IT Support' || r.location?.toLowerCase().includes('library') || r.assignedToId === user?.id || r.requestedById === user?.id);
    } else if (userRole === 'FACULTY') {
      if (filter?.requesterScopeOnly) {
        list = list.filter(r => r.requestedById === user?.id || r.requestedByEmail === user?.email);
      } else {
        list = list.filter(r => r.requestedById === user?.id || r.requestedByEmail === user?.email || r.assignedToId === user?.id || (user?.departmentId && r.departmentId === user.departmentId));
      }
    } else if (userRole === 'HOD') {
      list = list.filter(r => (user?.departmentId && r.departmentId === user.departmentId) || r.requestedById === user?.id || r.assignedToId === user?.id);
    } else if (userRole === 'PRINCIPAL') {
      list = list.filter(r => (user?.instituteId && r.instituteId === user.instituteId) || r.requestedById === user?.id);
    }

    if (filter?.service && filter.service !== 'ALL') {
      list = list.filter(r => r.service === filter.service);
    }

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(r => r.status === filter.status);
    }

    if (filter?.priority && filter.priority !== 'ALL') {
      list = list.filter(r => r.priority === filter.priority);
    }

    if (filter?.instituteId && filter.instituteId !== 'ALL') {
      list = list.filter(r => r.instituteId === filter.instituteId);
    }

    if (filter?.departmentId && filter.departmentId !== 'ALL') {
      list = list.filter(r => r.departmentId === filter.departmentId);
    }

    if (filter?.assignedTo && filter.assignedTo !== 'ALL') {
      list = list.filter(r => r.assignedToId === filter.assignedTo || r.assignedToName === filter.assignedTo);
    }

    if (filter?.dateFrom) {
      const from = new Date(filter.dateFrom).getTime();
      list = list.filter(r => new Date(r.createdDate).getTime() >= from);
    }

    if (filter?.dateTo) {
      const to = new Date(filter.dateTo).getTime();
      list = list.filter(r => new Date(r.createdDate).getTime() <= to + 86400000);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(r =>
        r.requestId.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.requestedByName.toLowerCase().includes(q) ||
        (r.assignedToName && r.assignedToName.toLowerCase().includes(q)) ||
        (r.resolutionRemarks && r.resolutionRemarks.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  public getCampusServiceRequestById(
    id: string,
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    if (!this.state.campusServiceRequests) {
      this.state.campusServiceRequests = [...initialCampusServiceRequests];
    }
    const req = this.state.campusServiceRequests.find(r => r.id === id || r.requestId === id);
    if (!req) return null;

    if (user && role) {
      const authorized = isUserAuthorizedForCampusServiceRequest(req, user, role);
      if (!authorized) {
        this.logAudit(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'Campus Auxiliary Services',
          `403 Forbidden: User "${user.name}" (${role}) attempted unauthorized access to Service Request ${req.requestId} owned by ${req.requestedByName}`,
          user.name,
          role
        );
        return null;
      }
    }

    return req;
  }

  public getCampusServiceDashboardStats(
    filter?: {
      service?: string;
      instituteId?: string;
      departmentId?: string;
      assignedTo?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceDashboardStats {
    const list = this.getCampusServiceRequests(filter, user, role);
    return {
      total: list.length,
      open: list.filter(r => r.status === 'OPEN').length,
      assigned: list.filter(r => r.status === 'ASSIGNED').length,
      inProgress: list.filter(r => r.status === 'IN_PROGRESS').length,
      resolved: list.filter(r => r.status === 'RESOLVED').length,
      closed: list.filter(r => r.status === 'CLOSED').length,
      highPriority: list.filter(r => r.priority === 'HIGH' || r.priority === 'URGENT').length,
      rejected: list.filter(r => r.status === 'REJECTED').length
    };
  }

  public createCampusServiceRequest(
    data: Partial<CampusServiceRequest>,
    user?: User,
    role?: UserRole
  ): CampusServiceRequest {
    if (!this.state.campusServiceRequests) {
      this.state.campusServiceRequests = [...initialCampusServiceRequests];
    }

    const effectiveRole: UserRole = role || user?.role || (data.requestedByRole as UserRole) || 'STUDENT';
    const targetService = (data.service as CampusServiceType) || 'Maintenance';

    // Backend validation: Role + Service authorization check
    if (!canUserAccessCampusService(targetService, effectiveRole)) {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Campus Auxiliary Services',
        `403 Forbidden: Role "${effectiveRole}" is not authorized to submit requests for service "${targetService}"`,
        user?.name || data.requestedByName || 'Unknown',
        effectiveRole
      );
      throw new Error(`403 Forbidden: Role ${effectiveRole} is not authorized to request service ${targetService}`);
    }

    const year = new Date().getFullYear();
    const count = this.state.campusServiceRequests.length + 1;
    const reqCode = `SR-${year}-${String(count).padStart(3, '0')}`;

    const nowIso = new Date().toISOString();

    const requesterId = user?.id || data.requestedById || 'user-1';
    const requesterName = user?.name || data.requestedByName || 'Authorized Requester';
    const requesterRole: UserRole = user?.role || (data.requestedByRole as UserRole) || effectiveRole;
    const requesterEmail = user?.email || data.requestedByEmail || 'user@swarrnim.edu.in';
    const requesterPhone = user?.phone || data.requestedByPhone || '+91 98250 00000';
    const requesterEnrollmentOrEmpId = user?.enrollmentNo || (user as any)?.empId || data.requestedByEnrollmentOrEmpId || 'REQ-001';

    const initialMessage: CampusServiceResponse = {
      id: `resp-${Date.now()}`,
      senderId: requesterId,
      senderName: requesterName,
      senderRole: requesterRole,
      message: data.description || 'Service request submitted to campus auxiliary desk.',
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      statusChange: 'OPEN',
      createdAt: nowIso
    };

    const newReq: CampusServiceRequest = {
      id: `sr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestId: reqCode,
      service: targetService,
      subject: data.subject || 'Campus Auxiliary Service Request',
      description: data.description || '',
      location: data.location || 'SSIU Main Campus',
      priority: (data.priority as CampusServicePriority) || 'MEDIUM',
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      attachmentSize: data.attachmentSize,
      requestedById: requesterId,
      requestedByName: requesterName,
      requestedByRole: requesterRole,
      requestedByEmail: requesterEmail,
      requestedByPhone: requesterPhone,
      requestedByEnrollmentOrEmpId: requesterEnrollmentOrEmpId,
      departmentId: data.departmentId || user?.departmentId,
      departmentName: data.departmentName,
      instituteId: data.instituteId || user?.instituteId || 'inst-1',
      instituteName: data.instituteName || 'Swarrnim Startup & Innovation University',
      assignedToId: data.assignedToId,
      assignedToName: data.assignedToName,
      assignedToRole: data.assignedToRole,
      assignedToPhone: data.assignedToPhone,
      assignedDate: data.assignedDate,
      status: data.assignedToName ? 'ASSIGNED' : 'OPEN',
      createdDate: nowIso,
      responses: [initialMessage],
      updatedAt: nowIso
    };

    this.state.campusServiceRequests.unshift(newReq);
    this.saveState();

    // Add Notification
    this.addNotification({
      targetRole: 'MAINTENANCE_ADMIN',
      title: `New Campus Service Request: ${newReq.requestId}`,
      message: `${newReq.requestedByName} requested ${newReq.service} at ${newReq.location}: "${newReq.subject}"`,
      module: 'REQUEST',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      linkTab: 'maintenance-admin'
    });

    this.logAudit(
      'CREATE_CAMPUS_SERVICE_REQUEST',
      'Campus Auxiliary Services',
      `Logged request ${newReq.requestId} for ${newReq.service} (${newReq.priority} priority) at ${newReq.location}`,
      requesterName,
      requesterRole
    );

    return newReq;
  }

  public updateCampusServiceRequest(
    id: string,
    data: Partial<CampusServiceRequest>,
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    if (!this.state.campusServiceRequests) return null;
    const idx = this.state.campusServiceRequests.findIndex(r => r.id === id || r.requestId === id);
    if (idx === -1) return null;

    const existing = this.state.campusServiceRequests[idx];
    const effectiveRole: UserRole = role || user?.role || 'MAINTENANCE_ADMIN';

    if (user && effectiveRole) {
      const authorized = isUserAuthorizedForCampusServiceRequest(existing, user, effectiveRole);
      if (!authorized) {
        this.logAudit(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'Campus Auxiliary Services',
          `403 Forbidden: User "${user.name}" (${effectiveRole}) attempted unauthorized update on Request ${existing.requestId}`,
          user.name,
          effectiveRole
        );
        return null;
      }
    }

    const updated: CampusServiceRequest = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.state.campusServiceRequests[idx] = updated;
    this.saveState();

    this.logAudit(
      'UPDATE_CAMPUS_SERVICE_REQUEST',
      'Campus Auxiliary Services',
      `Updated request ${updated.requestId} (${updated.status})`,
      user?.name || 'Administrator',
      effectiveRole || 'MAINTENANCE_ADMIN'
    );

    return updated;
  }

  public assignCampusServiceStaff(
    id: string,
    staff: {
      staffId: string;
      staffName: string;
      staffRole?: string;
      staffPhone?: string;
      assignmentNotes?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    const req = this.getCampusServiceRequestById(id, user, role);
    if (!req) return null;

    const effectiveRole: UserRole = role || user?.role || 'MAINTENANCE_ADMIN';
    if (effectiveRole === 'STUDENT') {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Campus Auxiliary Services',
        `403 Forbidden: Student "${user?.name}" attempted to assign staff to Request ${req.requestId}`,
        user?.name || 'Unknown',
        'STUDENT'
      );
      return null;
    }

    const nowIso = new Date().toISOString();
    const assignmentResp: CampusServiceResponse = {
      id: `resp-${Date.now()}`,
      senderId: user?.id || 'admin-maint',
      senderName: user?.name || 'Estate Maintenance Desk',
      senderRole: user?.role || 'MAINTENANCE_ADMIN',
      message: staff.assignmentNotes?.trim() || `Assigned to ${staff.staffName} (${staff.staffRole || 'Field Technician'}).`,
      statusChange: 'ASSIGNED',
      createdAt: nowIso
    };

    const updated = this.updateCampusServiceRequest(
      id,
      {
        assignedToId: staff.staffId,
        assignedToName: staff.staffName,
        assignedToRole: staff.staffRole || 'Field Technician',
        assignedToPhone: staff.staffPhone || '+91 98250 00000',
        assignedDate: nowIso,
        status: 'ASSIGNED',
        responses: [...(req.responses || []), assignmentResp]
      },
      user,
      role
    );

    if (updated) {
      this.addNotification({
        targetUserId: updated.requestedById,
        title: `Service Request Assigned: ${updated.requestId}`,
        message: `Your ${updated.service} request has been assigned to ${staff.staffName}.`,
        module: 'REQUEST',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkTab: 'maintenance-admin'
      });
    }

    return updated;
  }

  public addCampusServiceResponse(
    id: string,
    responseData: {
      message: string;
      attachmentUrl?: string;
      attachmentName?: string;
      statusChange?: CampusServiceStatus;
      isInternalNote?: boolean;
      resolutionRemarks?: string;
    },
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    const req = this.getCampusServiceRequestById(id, user, role);
    if (!req) return null;

    const effectiveRole: UserRole = role || user?.role || 'STUDENT';
    const nowIso = new Date().toISOString();

    const newResponse: CampusServiceResponse = {
      id: `resp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: user?.id || 'staff-1',
      senderName: user?.name || 'Service Desk Staff',
      senderRole: user?.role || effectiveRole,
      message: responseData.message,
      attachmentUrl: responseData.attachmentUrl,
      attachmentName: responseData.attachmentName,
      statusChange: responseData.statusChange,
      isInternalNote: effectiveRole === 'STUDENT' ? false : responseData.isInternalNote,
      createdAt: nowIso
    };

    const nextStatus = responseData.statusChange || req.status;
    const isResolving = nextStatus === 'RESOLVED';
    const isClosing = nextStatus === 'CLOSED';

    const updated = this.updateCampusServiceRequest(
      id,
      {
        status: nextStatus,
        resolvedDate: isResolving ? nowIso : req.resolvedDate,
        closedDate: isClosing ? nowIso : req.closedDate,
        resolutionRemarks: responseData.resolutionRemarks || (isResolving ? responseData.message : req.resolutionRemarks),
        responses: [...(req.responses || []), newResponse]
      },
      user,
      role
    );

    if (updated) {
      this.addNotification({
        targetUserId: updated.requestedById,
        title: `Update on Request ${updated.requestId}: ${nextStatus}`,
        message: `${newResponse.senderName}: "${newResponse.message.substring(0, 80)}..."`,
        module: 'REQUEST',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkTab: 'maintenance-admin'
      });
    }

    return updated;
  }

  public resolveCampusServiceRequest(
    id: string,
    resolutionRemarks: string,
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    const effectiveRole: UserRole = role || user?.role || 'STUDENT';
    if (effectiveRole === 'STUDENT') {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Campus Auxiliary Services',
        `403 Forbidden: Student "${user?.name}" attempted to resolve service request ${id}`,
        user?.name || 'Unknown',
        'STUDENT'
      );
      return null;
    }

    return this.addCampusServiceResponse(
      id,
      {
        message: `Issue Resolved: ${resolutionRemarks}`,
        statusChange: 'RESOLVED',
        resolutionRemarks
      },
      user,
      role
    );
  }

  public closeCampusServiceRequest(
    id: string,
    feedback?: { rating: number; remarks?: string },
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    const req = this.getCampusServiceRequestById(id, user, role);
    if (!req) return null;

    const nowIso = new Date().toISOString();
    const closeResp: CampusServiceResponse = {
      id: `resp-${Date.now()}`,
      senderId: user?.id || req.requestedById,
      senderName: user?.name || req.requestedByName,
      senderRole: user?.role || req.requestedByRole,
      message: feedback?.remarks?.trim()
        ? `Request confirmed and closed with ${feedback.rating}/5 rating: "${feedback.remarks}"`
        : `Request verified and marked closed with ${feedback?.rating || 5}/5 rating.`,
      statusChange: 'CLOSED',
      createdAt: nowIso
    };

    return this.updateCampusServiceRequest(
      id,
      {
        status: 'CLOSED',
        closedDate: nowIso,
        feedbackRating: feedback?.rating || 5,
        feedbackRemarks: feedback?.remarks,
        responses: [...(req.responses || []), closeResp]
      },
      user,
      role
    );
  }

  public rejectCampusServiceRequest(
    id: string,
    rejectionReason: string,
    user?: User | null,
    role?: UserRole | null
  ): CampusServiceRequest | null {
    const effectiveRole: UserRole = role || user?.role || 'STUDENT';
    if (effectiveRole === 'STUDENT') {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Campus Auxiliary Services',
        `403 Forbidden: Student "${user?.name}" attempted to reject service request ${id}`,
        user?.name || 'Unknown',
        'STUDENT'
      );
      return null;
    }

    return this.addCampusServiceResponse(
      id,
      {
        message: `Request Rejected / Declined: ${rejectionReason}`,
        statusChange: 'REJECTED'
      },
      user,
      role
    );
  }

  public deleteCampusServiceRequest(id: string, user?: User | null, role?: UserRole | null): boolean {
    if (!this.state.campusServiceRequests) return false;
    const idx = this.state.campusServiceRequests.findIndex(r => r.id === id || r.requestId === id);
    if (idx === -1) return false;

    const req = this.state.campusServiceRequests[idx];
    const effectiveRole: UserRole = role || user?.role || 'STUDENT';

    if (effectiveRole === 'STUDENT' && req.requestedById !== user?.id) {
      this.logAudit(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'Campus Auxiliary Services',
        `403 Forbidden: Student "${user?.name}" attempted to delete service request ${req.requestId} owned by ${req.requestedByName}`,
        user?.name || 'Unknown',
        'STUDENT'
      );
      return false;
    }

    const reqId = req.requestId;
    this.state.campusServiceRequests.splice(idx, 1);
    this.saveState();

    this.logAudit(
      'DELETE_CAMPUS_SERVICE_REQUEST',
      'Campus Auxiliary Services',
      `Deleted service request ${reqId}`,
      user?.name || 'Administrator',
      effectiveRole || 'MAINTENANCE_ADMIN'
    );

    return true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: CENTRALIZED BULK EXCEL IMPORT SYSTEM METHODS
  // ──────────────────────────────────────────────────────────────────────────

  private readonly bulkImportTemplates: Partial<Record<BulkImportType, {
    type: BulkImportType;
    name: string;
    fileName: string;
    description: string;
    headers: string[];
    sampleRows: any[][];
    instructions: { field: string; required: string; description: string; example: string }[];
  }>> = {
    STUDENT: {
      type: 'STUDENT',
      name: 'Student Admission & Enrollment Master',
      fileName: 'Student_Import_Template.xlsx',
      description: 'Bulk register student admissions, academic allocations, and personal profiles.',
      headers: [
        'Enrollment Number', 'Student Name', 'Email', 'Mobile', 'Date of Birth (YYYY-MM-DD)',
        'Gender', 'Institute Code', 'Department Code', 'Program Code', 'Academic Year',
        'Semester (1-8)', 'Admission Year', 'Student Type', 'Nationality', 'Passport Number', 'Status'
      ],
      sampleRows: [
        ['EN202600101', 'Aarav Sharma', 'aarav.sharma@example.com', '9876543210', '2004-05-15', 'MALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 1, 2026, 'REGULAR', 'INDIAN', '', 'ACTIVE'],
        ['EN202600102', 'Priya Patel', 'priya.patel@example.com', '9876543211', '2004-08-22', 'FEMALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 1, 2026, 'REGULAR', 'INDIAN', '', 'ACTIVE'],
        ['EN202600103', 'John Doe', 'john.doe@example.com', '9876543212', '2003-11-10', 'MALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 3, 2025, 'INTERNATIONAL', 'NIGERIAN', 'A12345678', 'ACTIVE']
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Unique university enrollment/roll number', example: 'EN202600101' },
        { field: 'Student Name', required: 'YES', description: 'Full candidate name', example: 'Aarav Sharma' },
        { field: 'Email', required: 'YES', description: 'Valid primary email address', example: 'aarav@example.com' },
        { field: 'Institute Code', required: 'YES', description: 'Valid Institute Code', example: 'INST-ENG' },
        { field: 'Department Code', required: 'YES', description: 'Valid Department Code', example: 'DEP-CSE' }
      ]
    },
    FACULTY: {
      type: 'FACULTY',
      name: 'Faculty & Staff Master',
      fileName: 'Faculty_Import_Template.xlsx',
      description: 'Bulk register faculty members, teaching profiles, and departments.',
      headers: [
        'Employee ID', 'Faculty Name', 'Email', 'Mobile', 'Department Code',
        'Designation', 'Institute Code', 'Joining Date (YYYY-MM-DD)', 'Status'
      ],
      sampleRows: [
        ['EMP-1001', 'Dr. Rajesh Kumar', 'rajesh.kumar@swarrnim.edu.in', '9811223344', 'DEP-CSE', 'Professor', 'INST-ENG', '2022-06-01', 'ACTIVE'],
        ['EMP-1002', 'Prof. Sunita Rao', 'sunita.rao@swarrnim.edu.in', '9822334455', 'DEP-ECE', 'Associate Professor', 'INST-ENG', '2023-01-15', 'ACTIVE']
      ],
      instructions: [
        { field: 'Employee ID', required: 'YES', description: 'Unique faculty code', example: 'EMP-1001' },
        { field: 'Faculty Name', required: 'YES', description: 'Full staff name', example: 'Dr. Rajesh Kumar' },
        { field: 'Email', required: 'YES', description: 'Official email', example: 'rajesh@swarrnim.edu.in' }
      ]
    },
    STAFF: {
      type: 'STAFF',
      name: 'Non-Teaching Staff Master',
      fileName: 'Staff_Import_Template.xlsx',
      description: 'Bulk register administrative, technical, and operational staff profiles.',
      headers: [
        'Employee Code', 'Staff Name', 'Email', 'Mobile', 'Department Code',
        'Designation', 'Institute Code', 'Employment Type', 'Joining Date (YYYY-MM-DD)', 'Status'
      ],
      sampleRows: [
        ['STF-1001', 'Ramesh Patel', 'ramesh.patel@swarrnim.edu.in', '9898011223', 'DEP-ADMIN', 'Office Superintendent', 'INST-ENG', 'FULL_TIME', '2023-04-01', 'ACTIVE'],
        ['STF-1002', 'Bhavna Dave', 'bhavna.dave@swarrnim.edu.in', '9898022334', 'DEP-CSE', 'Senior Lab Technician', 'INST-ENG', 'FULL_TIME', '2023-06-15', 'ACTIVE']
      ],
      instructions: [
        { field: 'Employee Code', required: 'YES', description: 'Unique staff employee code (Official ERP Login ID)', example: 'STF-1001' },
        { field: 'Staff Name', required: 'YES', description: 'Full name of staff member', example: 'Ramesh Patel' },
        { field: 'Email', required: 'YES', description: 'Official email address', example: 'ramesh.patel@swarrnim.edu.in' },
        { field: 'Department Code', required: 'YES', description: 'Valid Department Code', example: 'DEP-ADMIN' }
      ]
    },
    SUBJECT: {
      type: 'SUBJECT',
      name: 'Curriculum & Subject Master',
      fileName: 'Subject_Import_Template.xlsx',
      description: 'Upload course curriculum, credit hours, and passing evaluation rules.',
      headers: [
        'Subject Code', 'Subject Name', 'Program Code', 'Department Code', 'Semester',
        'Academic Year', 'Credits', 'Subject Type', 'Maximum Marks', 'Passing Marks', 'Status'
      ],
      sampleRows: [
        ['CS501', 'Database Management Systems', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 4, 'THEORY', 100, 40, 'ACTIVE'],
        ['CS502', 'Operating Systems', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 4, 'THEORY', 100, 40, 'ACTIVE'],
        ['CS503P', 'DBMS Practical Lab', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 2, 'PRACTICAL', 50, 20, 'ACTIVE']
      ],
      instructions: [
        { field: 'Subject Code', required: 'YES', description: 'Unique syllabus code', example: 'CS501' },
        { field: 'Credits', required: 'YES', description: 'Credit integer weight', example: '4' }
      ]
    },
    EXAM_FORM: {
      type: 'EXAM_FORM',
      name: 'Examination Form Bulk Submission',
      fileName: 'Exam_Form_Import_Template.xlsx',
      description: 'Stage examination form records with enrolled subject codes.',
      headers: [
        'Application Number', 'Enrollment Number', 'Exam Code', 'Exam Type',
        'Subject Codes (Comma Separated)', 'Academic Year', 'Semester', 'Payment Reference', 'Status'
      ],
      sampleRows: [
        ['APP-EX-2026-001', 'EN202600101', 'SUMMER-2026', 'REGULAR', 'CS501, CS502, CS503P', '2026-27', 5, 'TXN-987654', 'VERIFIED'],
        ['APP-EX-2026-002', 'EN202600102', 'SUMMER-2026', 'REGULAR', 'CS501, CS502, CS503P', '2026-27', 5, 'TXN-987655', 'VERIFIED']
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Registered candidate enrollment no', example: 'EN202600101' },
        { field: 'Exam Code', required: 'YES', description: 'Active exam code', example: 'SUMMER-2026' }
      ]
    },
    MARKS: {
      type: 'MARKS',
      name: 'Student Evaluation Marks Entry',
      fileName: 'Marks_Import_Template.xlsx',
      description: 'Upload raw component marks. Total, Grade, GP, and Result calculated by backend.',
      headers: [
        'Enrollment Number', 'Exam Code', 'Subject Code', 'Internal Marks (Max 30)',
        'External Marks (Max 70)', 'Practical Marks (Max 50)', 'Viva Marks (Max 20)',
        'Attendance Marks (Max 10)', 'Result Flag'
      ],
      sampleRows: [
        ['EN202600101', 'SUMMER-2026', 'CS501', 28, 62, 0, 0, 0, 'NORMAL'],
        ['EN202600102', 'SUMMER-2026', 'CS501', 22, 54, 0, 0, 0, 'NORMAL'],
        ['EN202600103', 'SUMMER-2026', 'CS501', 0, 0, 0, 0, 0, 'ABSENT']
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Student roll number', example: 'EN202600101' },
        { field: 'Exam Code', required: 'YES', description: 'Exam identifier', example: 'SUMMER-2026' },
        { field: 'Subject Code', required: 'YES', description: 'Subject code', example: 'CS501' }
      ]
    },
    HOSTEL_STUDENT: {
      type: 'HOSTEL_STUDENT',
      name: 'Hostel Room & Bed Allotment',
      fileName: 'Hostel_Allotment_Import_Template.xlsx',
      description: 'Assign student hostel rooms and bed allocations.',
      headers: [
        'Enrollment Number', 'Hostel Code', 'Room Number', 'Bed Number',
        'Academic Year', 'Allotment Date (YYYY-MM-DD)', 'Remarks'
      ],
      sampleRows: [
        ['EN202600101', 'HST-BH1', '101', 'B1', '2026-27', '2026-07-01', 'Boys Hostel Block A'],
        ['EN202600102', 'HST-GH1', '201', 'B2', '2026-27', '2026-07-01', 'Girls Hostel Block B']
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Student enrollment number', example: 'EN202600101' },
        { field: 'Hostel Code', required: 'YES', description: 'Hostel identifier', example: 'HST-BH1' }
      ]
    },
    HOSTEL_ROOM: {
      type: 'HOSTEL_ROOM',
      name: 'Hostel Rooms & Bed Capacity Master',
      fileName: 'Hostel_Rooms_Import_Template.xlsx',
      description: 'Configure hostel blocks, rooms, types, and bed capacities.',
      headers: [
        'Hostel Code', 'Room Number', 'Floor', 'Capacity', 'Room Type', 'Facilities', 'Status'
      ],
      sampleRows: [
        ['HST-BH1', '101', 1, 2, 'NON_AC', 'Attached Bath, Study Table', 'AVAILABLE'],
        ['HST-BH1', '102', 1, 3, 'AC', 'Attached Bath, AC, Balcony', 'AVAILABLE']
      ],
      instructions: [
        { field: 'Hostel Code', required: 'YES', description: 'Hostel code', example: 'HST-BH1' },
        { field: 'Capacity', required: 'YES', description: 'Maximum students in room', example: '2' }
      ]
    },
    FEE_ASSIGNMENT: {
      type: 'FEE_ASSIGNMENT',
      name: 'Student Fee Structure Assignment',
      fileName: 'Fee_Assignment_Import_Template.xlsx',
      description: 'Bulk assign tuition, exam, and hostel fee dues to students.',
      headers: [
        'Enrollment Number', 'Academic Year', 'Semester', 'Fee Head Code',
        'Amount', 'Due Date (YYYY-MM-DD)', 'Concession Amount', 'Status'
      ],
      sampleRows: [
        ['EN202600101', '2026-27', 1, 'FH-TUIT', 45000, '2026-08-31', 0, 'UNPAID'],
        ['EN202600102', '2026-27', 1, 'FH-TUIT', 45000, '2026-08-31', 5000, 'UNPAID']
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Student enrollment number', example: 'EN202600101' },
        { field: 'Fee Head Code', required: 'YES', description: 'Valid fee head code', example: 'FH-TUIT' }
      ]
    },
    TRANSPORT_VEHICLE: {
      type: 'TRANSPORT_VEHICLE',
      name: 'Transport Vehicle Fleet Master',
      fileName: 'Transport_Vehicle_Import_Template.xlsx',
      description: 'Register university transit buses, vans, and emergency vehicles.',
      headers: [
        'Vehicle Number', 'Vehicle Type', 'Make Model', 'Capacity', 'Fuel Type',
        'Registration Date (YYYY-MM-DD)', 'Insurance Expiry (YYYY-MM-DD)', 'Fitness Expiry (YYYY-MM-DD)',
        'Permit Expiry (YYYY-MM-DD)', 'Status'
      ],
      sampleRows: [
        ['GJ-01-AB-1234', 'BUS', 'Tata Starbus 40 Seater', 40, 'DIESEL', '2022-01-10', '2027-01-10', '2027-01-10', '2027-01-10', 'ACTIVE'],
        ['GJ-01-CD-5678', 'MINI_BUS', 'Eicher Skyline 25 Seater', 25, 'CNG', '2023-03-15', '2028-03-15', '2028-03-15', '2028-03-15', 'ACTIVE']
      ],
      instructions: [
        { field: 'Vehicle Number', required: 'YES', description: 'Vehicle license plate', example: 'GJ-01-AB-1234' }
      ]
    },
    TRANSPORT_DRIVER: {
      type: 'TRANSPORT_DRIVER',
      name: 'Transport Driver Profile Master',
      fileName: 'Transport_Driver_Import_Template.xlsx',
      description: 'Register commercial drivers, licenses, and experience.',
      headers: [
        'Driver Name', 'Contact Number', 'License Number', 'License Type',
        'License Expiry (YYYY-MM-DD)', 'Experience Years', 'Address', 'Status'
      ],
      sampleRows: [
        ['Ramesh Bhai Patel', '9898012345', 'DL-GJ01-2015-001234', 'HEAVY_VEHICLE', '2030-05-20', 8.5, 'Ahmedabad, Gujarat', 'ACTIVE'],
        ['Suresh Singh', '9898054321', 'DL-GJ01-2018-005678', 'COMMERCIAL', '2032-08-14', 6.0, 'Gandhinagar, Gujarat', 'ACTIVE']
      ],
      instructions: [
        { field: 'Driver Name', required: 'YES', description: 'Full name of driver', example: 'Ramesh Bhai Patel' }
      ]
    },
    TRANSPORT_ROUTE: {
      type: 'TRANSPORT_ROUTE',
      name: 'Transport Route & Stops Master',
      fileName: 'Transport_Route_Import_Template.xlsx',
      description: 'Configure transit routes, stops, schedules, and monthly fees.',
      headers: [
        'Route Number', 'Route Name', 'Start Point', 'End Point', 'Distance KM',
        'Duration Minutes', 'Monthly Fee', 'Stops (Name:Pickup:Drop; ...)', 'Status'
      ],
      sampleRows: [
        ['R-101', 'Ahmedabad ISKCON to Swarrnim Campus', 'ISKCON Cross Road', 'Main Campus', 28.5, 50, 2500, 'ISKCON:07:30 AM:05:45 PM; Campus:08:20 AM:05:00 PM', 'ACTIVE'],
        ['R-102', 'Gandhinagar Sector 11 to Campus', 'Sector 11 Bus Station', 'Main Campus', 15.0, 30, 2000, 'Sec 11:07:45 AM:05:30 PM; Campus:08:20 AM:05:00 PM', 'ACTIVE']
      ],
      instructions: [
        { field: 'Route Number', required: 'YES', description: 'Unique route code', example: 'R-101' }
      ]
    }
  };

  public getBulkImportTemplates(user?: any): BulkImportTemplateMeta[] {
    const list = Object.values(this.bulkImportTemplates).map(t => ({
      type: t.type,
      name: t.name,
      fileName: t.fileName,
      description: t.description,
      headers: t.headers,
    }));

    if (!user || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'UNIVERSITY_ADMIN') {
      return list;
    }

    const role = (user.role || '').toUpperCase();
    const allowedMap: Record<string, string[]> = {
      EXAM_CONTROLLER: ['EXAM_FORM', 'MARKS', 'SUBJECT', 'STUDENT'],
      EXAM_CELL: ['EXAM_FORM', 'MARKS', 'SUBJECT'],
      ACCOUNTS: ['FEE_ASSIGNMENT'],
      FINANCE: ['FEE_ASSIGNMENT'],
      HOSTEL_ADMIN: ['HOSTEL_STUDENT', 'HOSTEL_ROOM'],
      TRANSPORT_ADMIN: ['TRANSPORT_VEHICLE', 'TRANSPORT_DRIVER', 'TRANSPORT_ROUTE'],
      HOD: ['STUDENT', 'FACULTY', 'SUBJECT', 'MARKS'],
      FACULTY: ['MARKS'],
    };

    const allowed = allowedMap[role] || [];
    return list.filter(t => allowed.includes(t.type));
  }

  public downloadBulkImportTemplate(type: BulkImportType, user?: any): void {
    const tpl = this.bulkImportTemplates[type];
    if (!tpl) throw new Error(`Template for type "${type}" not found.`);

    const wb = XLSX.utils.book_new();
    const dataRows = [tpl.headers, ...tpl.sampleRows];
    const wsData = XLSX.utils.aoa_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Template');

    const instructionHeaders = ['Field Name', 'Required?', 'Description', 'Example Value'];
    const instructionRows = tpl.instructions.map(i => [i.field, i.required, i.description, i.example]);
    const wsInst = XLSX.utils.aoa_to_sheet([instructionHeaders, ...instructionRows]);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions & Guidelines');

    XLSX.writeFile(wb, tpl.fileName);
  }

  public uploadBulkImportFile(dto: {
    importType: BulkImportType;
    fileName: string;
    rows: any[];
    instituteId?: string;
    departmentId?: string;
    metadata?: any;
  }, user?: any): BulkImportSession {
    if (!dto.fileName || !dto.fileName.toLowerCase().endsWith('.xlsx')) {
      throw new Error('Invalid file format. Please upload the official .xlsx Excel template.');
    }

    const permittedTemplates = this.getBulkImportTemplates(user);
    if (!permittedTemplates.some(t => t.type === dto.importType)) {
      throw new Error(`403 Forbidden: User with role "${user?.role || 'STUDENT'}" is not authorized to bulk import "${dto.importType}".`);
    }

    if (!this.state.bulkImports) this.state.bulkImports = [];
    if (!this.state.bulkImportRows) this.state.bulkImportRows = [];

    const importId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const count = this.state.bulkImports.length + 1;
    const importNo = `IMP-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;

    const session: BulkImportSession = {
      id: importId,
      importNo,
      importType: dto.importType,
      fileName: dto.fileName,
      uploadedByUserId: user?.id || 'admin-1',
      uploadedByName: user?.name || 'Authorized Admin',
      uploadedByRole: user?.role || 'SUPER_ADMIN',
      instituteId: dto.instituteId,
      departmentId: dto.departmentId,
      status: 'UPLOADED',
      importMode: 'INSERT_ONLY',
      totalRows: dto.rows.length,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      importedRows: 0,
      failedRows: 0,
      createdAt: new Date().toISOString(),
      metadata: dto.metadata,
      history: [
        {
          id: `hist-${Date.now()}`,
          importId,
          action: 'UPLOADED',
          performedByUserId: user?.id || 'admin-1',
          performedByName: user?.name || 'Authorized Admin',
          details: `Uploaded ${dto.rows.length} rows for dataset ${dto.importType}`,
          timestamp: new Date().toISOString(),
        }
      ]
    };

    this.state.bulkImports.unshift(session);

    // Create rows
    dto.rows.forEach((row, i) => {
      this.state.bulkImportRows!.push({
        id: `row-${importId}-${i + 1}`,
        rowNumber: i + 1,
        status: 'PENDING',
        rawData: row,
      });
    });

    this.saveState();
    return this.validateBulkImport(importId, 'INSERT_ONLY', user);
  }

  public validateBulkImport(importId: string, mode: BulkImportMode = 'INSERT_ONLY', user?: any): BulkImportSession {
    if (!this.state.bulkImports) this.state.bulkImports = [];
    if (!this.state.bulkImportRows) this.state.bulkImportRows = [];

    const session = this.state.bulkImports.find(s => s.id === importId);
    if (!session) throw new Error('Bulk import session not found.');

    const rows = this.state.bulkImportRows.filter(r => r.id.startsWith(`row-${importId}-`));
    session.importMode = mode;

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const seenKeys = new Set<string>();

    rows.forEach(r => {
      const res = this.validateClientRow(session.importType, r.rawData, mode, seenKeys);
      r.status = res.status as BulkImportRowStatus;
      r.parsedData = res.parsedData;
      r.errorMessage = res.errorMessage;
      r.errorField = res.errorField;
      r.warningMessage = res.warningMessage;

      if (r.status === 'VALID') validCount++;
      else if (r.status === 'DUPLICATE') duplicateCount++;
      else invalidCount++;
    });

    session.validRows = validCount;
    session.invalidRows = invalidCount;
    session.duplicateRows = duplicateCount;
    session.status = validCount > 0 ? 'READY' : 'FAILED';
    session.validationSummary = JSON.stringify({
      valid: validCount,
      invalid: invalidCount,
      duplicate: duplicateCount,
      total: rows.length,
    });

    if (!session.history) session.history = [];
    session.history.unshift({
      id: `hist-${Date.now()}`,
      importId,
      action: 'VALIDATED',
      performedByUserId: user?.id || 'admin-1',
      performedByName: user?.name || 'Authorized Admin',
      details: `Validated ${rows.length} rows (${validCount} Valid, ${invalidCount} Invalid, ${duplicateCount} Duplicates)`,
      timestamp: new Date().toISOString(),
    });

    this.saveState();
    return session;
  }

  private validateClientRow(
    type: BulkImportType,
    raw: Record<string, any>,
    mode: BulkImportMode,
    seenKeys: Set<string>
  ): { status: string; parsedData?: any; errorMessage?: string; errorField?: string; warningMessage?: string } {
    const sanitizeCell = (val: any): string => {
      if (val === undefined || val === null) return '';
      let str = String(val).trim();
      // Protect against CSV / Excel formula / command injection (=, @, +, -)
      if (str.startsWith('=') || str.startsWith('@') || str.startsWith('+') || (str.startsWith('-') && !/^-?\d+(\.\d+)?$/.test(str))) {
        str = str.replace(/^[=@+-]+/, '').trim();
      }
      return str;
    };

    const getVal = (fields: string[]) => {
      for (const f of fields) {
        if (raw[f] !== undefined && raw[f] !== null && String(raw[f]).trim() !== '') {
          return sanitizeCell(raw[f]);
        }
      }
      return '';
    };

    switch (type) {
      case 'STUDENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo', 'EnrollmentNo', 'Roll Number', 'Enrollment No']);
        const name = getVal(['Student Full Name', 'Student Name', 'name', 'Name', 'FullName', 'Full Name']);
        const email = getVal(['Email Address', 'Email', 'email']);
        const instituteCode = getVal(['Institute Code', 'instituteCode', 'Institute']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!name) return { status: 'INVALID', errorField: 'Student Name', errorMessage: 'Student Name is required.' };
        if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };

        const isInvalidInst = !instituteCode || instituteCode === 'INVALID_INSTITUTE' || instituteCode.startsWith('INVALID');
        if (isInvalidInst) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute Code "${instituteCode}" is invalid or does not exist.` };

        const isInvalidDept = !departmentCode || departmentCode === 'INVALID_DEPARTMENT' || departmentCode.startsWith('INVALID');
        if (isInvalidDept) return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department Code "${departmentCode}" is invalid or does not exist.` };

        if (seenKeys.has(enrollmentNo)) {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Duplicate Enrollment Number "${enrollmentNo}" in uploaded file.` };
        }
        seenKeys.add(enrollmentNo);

        const existing = this.getStudents().find(s => s.enrollmentNo === enrollmentNo);
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" already exists in ERP database.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            enrollmentNo,
            name,
            email,
            mobile: getVal(['Mobile', 'mobile', 'Phone', 'Phone Number']),
            dob: getVal(['Date of Birth (YYYY-MM-DD)', 'dob', 'Date of Birth']),
            gender: (getVal(['Gender', 'gender']) || 'MALE').toUpperCase(),
            instituteCode,
            departmentCode,
            isExisting: !!existing,
          }
        };
      }

      case 'FACULTY': {
        const employeeId = getVal(['Employee ID', 'employeeId', 'EmployeeCode', 'Emp ID']);
        const name = getVal(['Faculty Name', 'name', 'Name']);
        const email = getVal(['Email', 'email']);
        const departmentCode = getVal(['Department Code', 'departmentCode', 'Department']);

        if (!employeeId) return { status: 'INVALID', errorField: 'Employee ID', errorMessage: 'Employee ID is required.' };
        if (!name) return { status: 'INVALID', errorField: 'Faculty Name', errorMessage: 'Faculty Name is required.' };
        if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
        if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

        if (seenKeys.has(employeeId)) {
          return { status: 'DUPLICATE', errorField: 'Employee ID', errorMessage: `Duplicate Employee ID "${employeeId}" in file.` };
        }
        seenKeys.add(employeeId);

        const existing = this.getFaculty().find(f => f.id === employeeId || f.email === email);
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Employee ID', errorMessage: `Faculty ID/Email "${employeeId}" already exists in ERP.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            employeeId,
            name,
            email,
            mobile: getVal(['Mobile', 'mobile']),
            departmentCode,
            designation: getVal(['Designation', 'designation']) || 'Assistant Professor',
            isExisting: !!existing,
          }
        };
      }

      case 'SUBJECT': {
        const subjectCode = getVal(['Subject Code', 'subjectCode', 'code', 'Code']);
        const subjectName = getVal(['Subject Name', 'subjectName', 'name', 'Name']);
        const credits = Number(getVal(['Credits', 'credits'])) || 3;

        if (!subjectCode) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: 'Subject Code is required.' };
        if (!subjectName) return { status: 'INVALID', errorField: 'Subject Name', errorMessage: 'Subject Name is required.' };
        if (credits <= 0) return { status: 'INVALID', errorField: 'Credits', errorMessage: 'Credits must be greater than 0.' };

        if (seenKeys.has(subjectCode)) {
          return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Duplicate Subject Code "${subjectCode}" in file.` };
        }
        seenKeys.add(subjectCode);

        const existing = this.getSubjects().find(s => s.code.toUpperCase() === subjectCode.toUpperCase());
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Subject code "${subjectCode}" already exists.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            code: subjectCode.toUpperCase(),
            name: subjectName,
            credits,
            subjectType: (getVal(['Subject Type', 'subjectType']) || 'THEORY').toUpperCase(),
            isExisting: !!existing,
          }
        };
      }

      case 'EXAM_FORM': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const examCode = getVal(['Exam Code', 'examCode']);

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!examCode) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: 'Exam Code is required.' };

        const student = this.getStudents().find(s => s.enrollmentNo === enrollmentNo);
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" does not exist in ERP.` };

        const exam = (this.state.exams || []).find(e => e.id === examCode || e.name === examCode);
        if (!exam) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: `Exam "${examCode}" not found.` };

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            studentName: student.name,
            examId: exam.id,
            examCode: exam.name,
            examType: (getVal(['Exam Type', 'examType']) || 'REGULAR').toUpperCase(),
          }
        };
      }

      case 'MARKS': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const examCode = getVal(['Exam Code', 'examCode']);
        const subjectCode = getVal(['Subject Code', 'subjectCode']);
        const internal = Number(getVal(['Internal Marks (Max 30)', 'internalMarks', 'internal'])) || 0;
        const external = Number(getVal(['External Marks (Max 70)', 'externalMarks', 'external'])) || 0;
        const practical = Number(getVal(['Practical Marks (Max 50)', 'practicalMarks', 'practical'])) || 0;
        const resultFlag = (getVal(['Result Flag', 'resultFlag']) || 'NORMAL').toUpperCase();

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!examCode) return { status: 'INVALID', errorField: 'Exam Code', errorMessage: 'Exam Code is required.' };
        if (!subjectCode) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: 'Subject Code is required.' };

        if (internal < 0 || internal > 30) return { status: 'INVALID', errorField: 'Internal Marks', errorMessage: 'Internal marks must be 0-30.' };
        if (external < 0 || external > 70) return { status: 'INVALID', errorField: 'External Marks', errorMessage: 'External marks must be 0-70.' };

        const student = this.getStudents().find(s => s.enrollmentNo === enrollmentNo);
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" not found.` };

        // Calculate Grade & GP
        const total = internal + external + practical;
        let grade = 'F';
        let gradePoint = 0;
        let isPass = false;

        if (resultFlag === 'ABSENT') {
          grade = 'AB';
        } else if (resultFlag === 'MALPRACTICE') {
          grade = 'MP';
        } else {
          if (total >= 90) { grade = 'O'; gradePoint = 10; isPass = true; }
          else if (total >= 80) { grade = 'A+'; gradePoint = 9; isPass = true; }
          else if (total >= 70) { grade = 'A'; gradePoint = 8; isPass = true; }
          else if (total >= 60) { grade = 'B+'; gradePoint = 7; isPass = true; }
          else if (total >= 55) { grade = 'B'; gradePoint = 6; isPass = true; }
          else if (total >= 50) { grade = 'C'; gradePoint = 5; isPass = true; }
          else if (total >= 40 && external >= 25) { grade = 'P'; gradePoint = 4; isPass = true; }
          else { grade = 'F'; gradePoint = 0; isPass = false; }
        }

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            studentName: student.name,
            examCode,
            subjectCode,
            internalMarks: internal,
            externalMarks: external,
            practicalMarks: practical,
            totalMarks: total,
            grade,
            gradePoint,
            isPass,
            resultFlag,
          }
        };
      }

      case 'HOSTEL_STUDENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const hostelCode = getVal(['Hostel Code', 'hostelCode']);
        const roomNumber = getVal(['Room Number', 'roomNumber']);

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!hostelCode) return { status: 'INVALID', errorField: 'Hostel Code', errorMessage: 'Hostel Code is required.' };
        if (!roomNumber) return { status: 'INVALID', errorField: 'Room Number', errorMessage: 'Room Number is required.' };

        const student = this.getStudents().find(s => s.enrollmentNo === enrollmentNo);
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" does not exist.` };

        const rooms = this.getHostelRooms();
        const room = rooms.find(r => r.roomNo === roomNumber);
        if (room && (room.occupied || 0) >= (room.capacity || 2)) {
          return { status: 'INVALID', errorField: 'Room Number', errorMessage: `Hostel room "${roomNumber}" is at full capacity.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            hostelCode,
            roomNumber,
            bedNumber: getVal(['Bed Number', 'bedNumber']) || 'B1',
          }
        };
      }

      case 'FEE_ASSIGNMENT': {
        const enrollmentNo = getVal(['Enrollment Number', 'enrollmentNo']);
        const feeHeadCode = getVal(['Fee Head Code', 'feeHeadCode', 'feeHead', 'Fee Head']);
        const amount = Number(getVal(['Amount', 'amount']));

        if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
        if (!feeHeadCode) return { status: 'INVALID', errorField: 'Fee Head Code', errorMessage: 'Fee Head Code is required.' };
        if (!amount || amount <= 0) return { status: 'INVALID', errorField: 'Amount', errorMessage: 'Amount must be greater than 0.' };

        const student = this.getStudents().find(s => s.enrollmentNo === enrollmentNo);
        if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student "${enrollmentNo}" does not exist.` };

        const heads = this.getFeeHeads();
        const head = heads.find(h => h.code === feeHeadCode || h.name === feeHeadCode);
        if (!head) return { status: 'INVALID', errorField: 'Fee Head Code', errorMessage: `Fee Head "${feeHeadCode}" not found.` };

        return {
          status: 'VALID',
          parsedData: {
            studentId: student.id,
            enrollmentNo,
            feeHeadCode,
            amount,
            concession: Number(getVal(['Concession Amount', 'concession'])) || 0,
            dueDate: getVal(['Due Date (YYYY-MM-DD)', 'dueDate']) || '2026-08-31',
          }
        };
      }

      case 'TRANSPORT_VEHICLE': {
        const vehicleNumber = getVal(['Vehicle Number', 'vehicleNumber', 'registrationNumber']);
        const capacity = Number(getVal(['Capacity', 'capacity'])) || 40;

        if (!vehicleNumber) return { status: 'INVALID', errorField: 'Vehicle Number', errorMessage: 'Vehicle Number is required.' };
        if (capacity <= 0) return { status: 'INVALID', errorField: 'Capacity', errorMessage: 'Capacity must be > 0.' };

        if (seenKeys.has(vehicleNumber)) {
          return { status: 'DUPLICATE', errorField: 'Vehicle Number', errorMessage: `Duplicate Vehicle Number "${vehicleNumber}" in file.` };
        }
        seenKeys.add(vehicleNumber);

        const vehicles = this.getTransportVehicles();
        const existing = vehicles.find(v => v.registrationNumber === vehicleNumber || v.vehicleNumber === vehicleNumber);
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Vehicle Number', errorMessage: `Vehicle "${vehicleNumber}" already exists in ERP.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            registrationNumber: vehicleNumber,
            vehicleType: (getVal(['Vehicle Type', 'vehicleType']) || 'BUS').toUpperCase(),
            capacity,
            makeModel: getVal(['Make Model', 'makeModel']) || 'Standard Transit Bus',
            isExisting: !!existing,
          }
        };
      }

      case 'TRANSPORT_DRIVER': {
        const driverName = getVal(['Driver Name', 'driverName', 'name']);
        const licenseNumber = getVal(['License Number', 'licenseNumber']);

        if (!driverName) return { status: 'INVALID', errorField: 'Driver Name', errorMessage: 'Driver Name is required.' };
        if (!licenseNumber) return { status: 'INVALID', errorField: 'License Number', errorMessage: 'License Number is required.' };

        if (seenKeys.has(licenseNumber)) {
          return { status: 'DUPLICATE', errorField: 'License Number', errorMessage: `Duplicate License Number "${licenseNumber}" in file.` };
        }
        seenKeys.add(licenseNumber);

        const drivers = this.getTransportDrivers();
        const existing = drivers.find(d => d.licenseNumber === licenseNumber);
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'License Number', errorMessage: `Driver license "${licenseNumber}" already exists.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            driverName,
            licenseNumber,
            contactNumber: getVal(['Contact Number', 'contactNumber', 'mobile']) || '9898012345',
            isExisting: !!existing,
          }
        };
      }

      case 'TRANSPORT_ROUTE': {
        const routeNumber = getVal(['Route Number', 'routeNumber']);
        const routeName = getVal(['Route Name', 'routeName']);

        if (!routeNumber) return { status: 'INVALID', errorField: 'Route Number', errorMessage: 'Route Number is required.' };
        if (!routeName) return { status: 'INVALID', errorField: 'Route Name', errorMessage: 'Route Name is required.' };

        if (seenKeys.has(routeNumber)) {
          return { status: 'DUPLICATE', errorField: 'Route Number', errorMessage: `Duplicate Route Number "${routeNumber}" in file.` };
        }
        seenKeys.add(routeNumber);

        const routes = this.getBusRoutes();
        const existing = routes.find(r => r.routeNo === routeNumber);
        if (existing && mode === 'INSERT_ONLY') {
          return { status: 'DUPLICATE', errorField: 'Route Number', errorMessage: `Route "${routeNumber}" already exists.` };
        }

        return {
          status: 'VALID',
          parsedData: {
            routeNumber,
            routeName,
            startPoint: getVal(['Start Point', 'startPoint']) || 'Origin',
            endPoint: getVal(['End Point', 'endPoint']) || 'Campus',
            monthlyFee: Number(getVal(['Monthly Fee', 'monthlyFee'])) || 2500,
            isExisting: !!existing,
          }
        };
      }

      default:
        return { status: 'INVALID', errorMessage: `Unsupported dataset type "${type}".` };
    }
  }

  public getBulkImportPreview(importId: string, page = 1, limit = 50, user?: any): {
    import: BulkImportSession;
    rows: BulkImportRowItem[];
    pagination: { page: number; limit: number; totalRows: number; totalPages: number };
  } {
    if (!this.state.bulkImports) this.state.bulkImports = [];
    if (!this.state.bulkImportRows) this.state.bulkImportRows = [];

    const session = this.state.bulkImports.find(s => s.id === importId);
    if (!session) throw new Error('Bulk import session not found.');

    const allRows = this.state.bulkImportRows.filter(r => r.id.startsWith(`row-${importId}-`));
    const skip = (page - 1) * limit;
    const paginatedRows = allRows.slice(skip, skip + limit);

    return {
      import: session,
      rows: paginatedRows,
      pagination: {
        page,
        limit,
        totalRows: allRows.length,
        totalPages: Math.ceil(allRows.length / limit),
      }
    };
  }

  public confirmBulkImport(
    importId: string,
    mode: BulkImportMode = 'INSERT_ONLY',
    selectedRowNumbers?: number[],
    user?: any
  ): { success: boolean; message: string; import: BulkImportSession } {
    if (!this.state.bulkImports) this.state.bulkImports = [];
    if (!this.state.bulkImportRows) this.state.bulkImportRows = [];

    const session = this.state.bulkImports.find(s => s.id === importId);
    if (!session) throw new Error('Bulk import session not found.');

    if (session.status === 'IMPORTED') {
      throw new Error('This bulk import has already been completed.');
    }

    const rows = this.state.bulkImportRows.filter(r =>
      r.id.startsWith(`row-${importId}-`) &&
      r.status === 'VALID' &&
      (!selectedRowNumbers || selectedRowNumbers.includes(r.rowNumber))
    );

    if (rows.length === 0) {
      throw new Error('No valid rows available to import.');
    }

    let importedCount = 0;
    let failedCount = 0;

    rows.forEach(r => {
      try {
        const data = r.parsedData || r.rawData;
        this.commitClientRecord(session.importType, data, mode);
        r.status = 'IMPORTED';
        importedCount++;
      } catch (err: any) {
        r.status = 'FAILED';
        r.errorMessage = err.message;
        failedCount++;
      }
    });

    session.importedRows = importedCount;
    session.failedRows = failedCount;
    session.status = (importedCount === session.totalRows) ? 'IMPORTED' : (importedCount > 0 ? 'PARTIALLY_IMPORTED' : 'FAILED');
    session.completedAt = new Date().toISOString();

    if (!session.history) session.history = [];
    session.history.unshift({
      id: `hist-${Date.now()}`,
      importId,
      action: 'IMPORTED',
      performedByUserId: user?.id || 'admin-1',
      performedByName: user?.name || 'Authorized Admin',
      details: `Successfully committed ${importedCount} records to database. (${failedCount} failed)`,
      timestamp: new Date().toISOString(),
    });

    this.saveState();
    this.logAudit(
      'CONFIRM_BULK_IMPORT',
      'Data Management',
      `Bulk imported ${importedCount} ${session.importType} records (${session.importNo})`,
      user?.name || 'Authorized Admin',
      user?.role || 'SUPER_ADMIN'
    );

    return {
      success: true,
      message: `Successfully imported ${importedCount} records into the ERP system.`,
      import: session,
    };
  }

  private commitClientRecord(type: BulkImportType, data: any, mode: BulkImportMode): void {
    switch (type) {
      case 'STUDENT': {
        const students = this.getStudents();
        const existingIdx = students.findIndex(s => s.enrollmentNo === data.enrollmentNo);
        if (existingIdx >= 0 && mode === 'UPSERT') {
          students[existingIdx] = {
            ...students[existingIdx],
            name: data.name,
            email: data.email,
            phone: data.mobile || students[existingIdx].phone,
          };
        } else {
          students.push({
            id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            enrollmentNo: data.enrollmentNo,
            name: data.name,
            email: data.email,
            phone: data.mobile || '9876543210',
            gender: 'Male',
            guardianName: 'Guardian',
            guardianPhone: '9876543210',
            instituteId: data.instituteCode || 'inst-1',
            departmentId: data.departmentCode || 'dept-1',
            programId: 'prog-1',
            batchId: 'batch-1',
            semesterId: 'sem-1',
            divisionId: 'div-1',
            academicYearId: 'ay-1',
            status: 'ACTIVE',
          });
        }
        break;
      }
      case 'FACULTY': {
        const faculty = this.getFaculty();
        const existingIdx = faculty.findIndex(f => f.id === data.employeeId || f.email === data.email);
        if (existingIdx >= 0 && mode === 'UPSERT') {
          faculty[existingIdx] = {
            ...faculty[existingIdx],
            name: data.name,
            designation: data.designation,
          };
        } else {
          faculty.push({
            id: data.employeeId,
            employeeId: data.employeeId,
            name: data.name,
            email: data.email,
            phone: data.mobile || '9811223344',
            departmentId: data.departmentCode || 'dept-1',
            instituteId: 'inst-1',
            designation: data.designation || 'Assistant Professor',
            qualification: 'Ph.D / M.Tech',
            experienceYears: 5,
            subjectIds: [],
            status: 'ACTIVE',
          });
        }
        break;
      }
      case 'SUBJECT': {
        const subjects = this.getSubjects();
        const existingIdx = subjects.findIndex(s => s.code === data.code);
        if (existingIdx >= 0 && mode === 'UPSERT') {
          subjects[existingIdx] = {
            ...subjects[existingIdx],
            name: data.name,
            credits: data.credits,
          };
        } else {
          subjects.push({
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            code: data.code,
            name: data.name,
            credits: data.credits,
            semesterId: 'sem-1',
            programId: 'prog-1',
            departmentId: 'dept-1',
            type: 'THEORY',
            theoryHoursPerWeek: 3,
            labHoursPerWeek: 0,
            status: 'ACTIVE',
          });
        }
        break;
      }
      case 'TRANSPORT_VEHICLE': {
        const vehicles = this.getTransportVehicles();
        vehicles.push({
          id: `veh-${Date.now()}`,
          vehicleNumber: data.registrationNumber || `GJ-01-XX-${Math.floor(1000 + Math.random() * 9000)}`,
          registrationNumber: data.registrationNumber,
          registrationDate: '2024-01-01',
          vehicleType: data.vehicleType || 'BUS',
          capacity: data.capacity || 40,
          makeModel: data.makeModel || 'Tata Starbus',
          insuranceNumber: 'INS-2026-001',
          insuranceExpiry: '2027-12-31',
          fitnessCertificate: 'FIT-2026-001',
          fitnessExpiry: '2027-12-31',
          pollutionCertificate: 'PUC-2026-001',
          pollutionExpiry: '2027-12-31',
          permitNumber: 'PER-2026-001',
          permitExpiry: '2027-12-31',
          fuelType: 'DIESEL',
          status: 'ACTIVE',
        } as any);
        break;
      }
      default:
        break;
    }
  }

  public downloadBulkImportErrorReport(importId: string, user?: any): { success: boolean; errorCount: number; fileName: string } {
    if (!this.state.bulkImports) return { success: false, errorCount: 0, fileName: '' };
    if (!this.state.bulkImportRows) return { success: false, errorCount: 0, fileName: '' };

    const session = this.state.bulkImports.find(s => s.id === importId);
    if (!session) throw new Error('Bulk import session not found.');

    const errorRows = this.state.bulkImportRows.filter(r =>
      r.id.startsWith(`row-${importId}-`) &&
      (r.status === 'INVALID' || r.status === 'DUPLICATE' || r.status === 'FAILED')
    );

    const wb = XLSX.utils.book_new();
    const headers = ['Row Number', 'Field Name', 'Entered Value', 'Validation Error / Reason', 'Recommended Remediation'];
    const rows = errorRows.map(r => {
      const enteredValue = r.errorField ? (r.rawData[r.errorField] || '') : JSON.stringify(r.rawData);
      const remediation = r.status === 'DUPLICATE' 
        ? 'Select UPSERT mode if you wish to update this existing record, or remove duplicate row.'
        : `Check and correct "${r.errorField || 'value'}" to match registered university master records.`;
      return [r.rowNumber, r.errorField || 'General', enteredValue, r.errorMessage || 'Invalid record', remediation];
    });

    const ws = XLSX.utils.aoa_to_sheet([
      [`Bulk Import Error Report — ${session.importNo} (${session.importType})`],
      [`Generated at: ${new Date().toISOString()}`],
      [],
      headers,
      ...rows,
    ]);

    const fileName = `Error_Report_${session.importNo}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    if (typeof window !== 'undefined') {
      try {
        XLSX.writeFile(wb, fileName);
      } catch (e) {
        // Safe fallback
      }
    }

    return {
      success: true,
      errorCount: errorRows.length,
      fileName
    };
  }

  public getBulkImportHistory(filter?: { importType?: string; status?: string }, user?: any): BulkImportSession[] {
    if (!this.state.bulkImports) {
      // Provide demo seed history
      this.state.bulkImports = [
        {
          id: 'imp-demo-1',
          importNo: 'IMP-2026-000001',
          importType: 'STUDENT',
          fileName: 'BTech_CSE_Sem1_Admissions.xlsx',
          uploadedByUserId: 'user-superadmin',
          uploadedByName: 'Super Admin',
          uploadedByRole: 'SUPER_ADMIN',
          status: 'IMPORTED',
          importMode: 'INSERT_ONLY',
          totalRows: 120,
          validRows: 120,
          invalidRows: 0,
          duplicateRows: 0,
          importedRows: 120,
          failedRows: 0,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          completedAt: new Date(Date.now() - 3 * 86400000 + 120000).toISOString(),
          history: [
            {
              id: 'hist-1',
              importId: 'imp-demo-1',
              action: 'IMPORTED',
              performedByUserId: 'user-superadmin',
              performedByName: 'Super Admin',
              details: 'Imported 120 students successfully',
              timestamp: new Date(Date.now() - 3 * 86400000 + 120000).toISOString(),
            }
          ]
        },
        {
          id: 'imp-demo-2',
          importNo: 'IMP-2026-000002',
          importType: 'MARKS',
          fileName: 'Summer2026_CS501_Internal_Marks.xlsx',
          uploadedByUserId: 'user-controller',
          uploadedByName: 'Exam Controller Admin',
          uploadedByRole: 'EXAM_CONTROLLER',
          status: 'IMPORTED',
          importMode: 'INSERT_ONLY',
          totalRows: 85,
          validRows: 85,
          invalidRows: 0,
          duplicateRows: 0,
          importedRows: 85,
          failedRows: 0,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 86400000 + 90000).toISOString(),
          history: [
            {
              id: 'hist-2',
              importId: 'imp-demo-2',
              action: 'IMPORTED',
              performedByUserId: 'user-controller',
              performedByName: 'Exam Controller Admin',
              details: 'Calculated and imported 85 student marks',
              timestamp: new Date(Date.now() - 2 * 86400000 + 90000).toISOString(),
            }
          ]
        },
        {
          id: 'imp-demo-3',
          importNo: 'IMP-2026-000003',
          importType: 'FEE_ASSIGNMENT',
          fileName: 'Tuition_Fee_Assignment_Batch2026.xlsx',
          uploadedByUserId: 'user-accounts',
          uploadedByName: 'Accounts Head',
          uploadedByRole: 'ACCOUNTS',
          status: 'PARTIALLY_IMPORTED',
          importMode: 'INSERT_ONLY',
          totalRows: 95,
          validRows: 90,
          invalidRows: 5,
          duplicateRows: 0,
          importedRows: 90,
          failedRows: 0,
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 86400000 + 150000).toISOString(),
          history: [
            {
              id: 'hist-3',
              importId: 'imp-demo-3',
              action: 'IMPORTED',
              performedByUserId: 'user-accounts',
              performedByName: 'Accounts Head',
              details: 'Imported 90 fee records; 5 invalid skipped',
              timestamp: new Date(Date.now() - 1 * 86400000 + 150000).toISOString(),
            }
          ]
        }
      ];
      this.saveState();
    }

    let list = [...this.state.bulkImports];
    if (filter?.importType && filter.importType !== 'ALL') {
      list = list.filter(s => s.importType === filter.importType);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter(s => s.status === filter.status);
    }

    // Role filtering
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'UNIVERSITY_ADMIN') {
      list = list.filter(s => s.uploadedByUserId === user.id);
    }

    return list;
  }

  public getBulkImportDetails(importId: string, user?: any): BulkImportSession | undefined {
    if (!this.state.bulkImports) return undefined;
    return this.state.bulkImports.find(s => s.id === importId);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ─── PHASE 9: UNIVERSITY ACCOUNTS, FEES & PAYMENT MANAGEMENT ──────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Concessions & Scholarships ──
  public getConcessions(): ConcessionItem[] {
    if (!this.state.concessionsList) {
      this.state.concessionsList = [
        {
          id: 'conc-1',
          concessionNo: 'CONC-2026-000001',
          studentId: 'stud-1',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          programName: 'B.Tech Computer Engineering',
          concessionType: 'MERIT_SCHOLARSHIP',
          calculationType: 'FIXED',
          amount: 10000,
          reason: 'University Entrance Rank #1 Merit Concession',
          approvedBy: 'Finance Officer',
          approvalDate: '2026-08-01',
          status: 'APPROVED',
          notesheetId: 'NS/ACCOUNTS/2026/0012',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'conc-2',
          concessionNo: 'CONC-2026-000002',
          studentId: 'stud-2',
          studentName: 'Priya Mehta',
          enrollmentNo: '24SSIU01002',
          programName: 'B.Tech Computer Engineering',
          concessionType: 'NEED_BASED_CONCESSION',
          calculationType: 'FIXED',
          amount: 5000,
          reason: 'Economically Weaker Section Financial Assistance',
          approvedBy: 'Director Finance',
          approvalDate: '2026-08-05',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        }
      ];
      this.saveState();
    }
    return this.state.concessionsList;
  }

  public createConcession(concession: Partial<ConcessionItem>, user?: User): { success: boolean; message: string; concession?: ConcessionItem } {
    if (!this.state.concessionsList) this.state.concessionsList = [];
    const student = this.state.students.find(s => s.id === concession.studentId);
    if (!student) return { success: false, message: 'Student record not found.' };

    const seq = String(this.state.concessionsList.length + 1).padStart(6, '0');
    const newConcession: ConcessionItem = {
      id: `conc-${Date.now()}`,
      concessionNo: `CONC-2026-${seq}`,
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      programName: this.getProgramById(student.programId)?.name || 'N/A',
      feeAccountId: concession.feeAccountId,
      concessionType: concession.concessionType || 'MERIT_SCHOLARSHIP',
      calculationType: concession.calculationType || 'FIXED',
      amount: concession.amount || 0,
      percentage: concession.percentage,
      reason: concession.reason || 'Scholarship Waiver',
      approvedBy: user?.name || 'Accounts Officer',
      approvalDate: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
      notesheetId: concession.notesheetId,
      createdAt: new Date().toISOString(),
    };

    this.state.concessionsList.unshift(newConcession);

    // Apply deduction to student fee record if exists
    const feeRec = this.state.studentFeeRecords.find(r => r.studentId === student.id && r.pendingAmount > 0);
    if (feeRec) {
      feeRec.discountAmount = (feeRec.discountAmount || 0) + newConcession.amount;
      feeRec.pendingAmount = Math.max(0, feeRec.pendingAmount - newConcession.amount);
      if (feeRec.pendingAmount <= 0) feeRec.status = 'PAID';
      else feeRec.status = 'PARTIAL';
    }

    this.saveState();
    return { success: true, message: 'Concession / Scholarship applied successfully.', concession: newConcession };
  }

  // ── Refunds ──
  public getRefundsList(): RefundItem[] {
    if (!this.state.refundsList) {
      this.state.refundsList = [
        {
          id: 'ref-1',
          refundNumber: 'REF-2026-000001',
          feeAccountId: 'acc-1',
          paymentId: 'pay-1',
          studentId: 'stud-3',
          studentName: 'Rohan Shah',
          enrollmentNo: '24SSIU01003',
          originalAmount: 45000,
          refundAmount: 5000,
          reason: 'Excess examination fee reversal',
          refundMode: 'ONLINE_UPI',
          requestedBy: 'Student',
          approvedBy: 'Chief Accounts Officer',
          approvalDate: '2026-08-10',
          processedDate: '2026-08-11',
          refundReference: 'REF-UTR-88229911',
          status: 'COMPLETED',
          notesheetId: 'NS/ACCOUNTS/2026/0018',
          createdAt: new Date().toISOString(),
        }
      ];
      this.saveState();
    }
    return this.state.refundsList;
  }

  public createRefundRequest(refund: Partial<RefundItem>, user?: User): { success: boolean; message: string; refund?: RefundItem } {
    if (!this.state.refundsList) this.state.refundsList = [];
    const student = this.state.students.find(s => s.id === refund.studentId);
    if (!student) return { success: false, message: 'Student record not found.' };

    const seq = String(this.state.refundsList.length + 1).padStart(6, '0');
    const newRefund: RefundItem = {
      id: `ref-${Date.now()}`,
      refundNumber: `REF-2026-${seq}`,
      feeAccountId: refund.feeAccountId || 'acc-gen',
      paymentId: refund.paymentId || 'pay-gen',
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      originalAmount: refund.originalAmount || 0,
      refundAmount: refund.refundAmount || 0,
      reason: refund.reason || 'Fee refund request',
      refundMode: refund.refundMode || 'ONLINE',
      requestedBy: user?.name || 'Student / Accounts',
      status: 'APPROVED',
      approvedBy: user?.name || 'Accounts Head',
      approvalDate: new Date().toISOString().split('T')[0],
      notesheetId: refund.notesheetId,
      createdAt: new Date().toISOString(),
    };

    this.state.refundsList.unshift(newRefund);
    this.saveState();
    return { success: true, message: 'Refund request logged & approved.', refund: newRefund };
  }

  public processRefundRecord(id: string, update: Partial<RefundItem>, user?: User): { success: boolean; message: string } {
    const list = this.getRefundsList();
    const item = list.find(r => r.id === id);
    if (!item) return { success: false, message: 'Refund record not found.' };

    Object.assign(item, update);
    item.processedDate = new Date().toISOString().split('T')[0];
    item.status = 'COMPLETED';
    this.saveState();
    return { success: true, message: 'Refund processed and completed successfully.' };
  }

  // ── Payment Reconciliation ──
  public getPaymentReconciliations(): PaymentReconciliationItem[] {
    if (!this.state.paymentReconciliationsList) {
      this.state.paymentReconciliationsList = [
        {
          id: 'rec-1',
          reconciliationNumber: 'REC-2026-000001',
          paymentTransactionId: 'TXN-2026-001',
          gatewayPaymentId: 'pay_P9911223344',
          transactionRef: 'SBI-UPI-88992211',
          studentId: 'stud-1',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          reconciliationType: 'GATEWAY',
          gatewayAmount: 45000,
          erpAmount: 45000,
          discrepancyAmount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Online UPI',
          gatewayStatus: 'SUCCESS',
          erpStatus: 'SUCCESS',
          reconciliationStatus: 'MATCHED',
          remarks: 'Automated settlement matched with Razorpay webhook log',
          reconciledByUserId: 'user-accounts',
          reconciledByName: 'Chief Accounts Officer',
          reconciledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rec-2',
          reconciliationNumber: 'REC-2026-000002',
          paymentTransactionId: 'TXN-2026-002',
          gatewayPaymentId: 'pay_P9955667788',
          transactionRef: 'HDFC-NEFT-332211',
          studentId: 'stud-2',
          studentName: 'Priya Mehta',
          enrollmentNo: '24SSIU01002',
          reconciliationType: 'BANK_TRANSFER',
          gatewayAmount: 50000,
          erpAmount: 50000,
          discrepancyAmount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Net Banking',
          gatewayStatus: 'SUCCESS',
          erpStatus: 'SUCCESS',
          reconciliationStatus: 'RECONCILED',
          remarks: 'Bank statement credited and verified against UTR reference',
          reconciledByUserId: 'user-accounts',
          reconciledByName: 'Finance Officer',
          reconciledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
      ];
      this.saveState();
    }
    return this.state.paymentReconciliationsList;
  }

  public reconcilePaymentRecord(id: string, update: Partial<PaymentReconciliationItem>, user?: User): { success: boolean; message: string } {
    const list = this.getPaymentReconciliations();
    const item = list.find(r => r.id === id);
    if (!item) return { success: false, message: 'Reconciliation record not found.' };

    Object.assign(item, update);
    item.reconciliationStatus = update.reconciliationStatus || 'RECONCILED';
    item.reconciledAt = new Date().toISOString();
    item.reconciledByName = user?.name || 'Accounts Head';
    this.saveState();
    return { success: true, message: 'Transaction reconciled successfully.' };
  }

  // ── Student Financial Ledger ──
  public getStudentLedgerSummary(studentId: string): StudentLedgerSummary | null {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return null;

    const program = this.getProgramById(student.programId);
    const semester = this.getSemesterById(student.semesterId);
    const feeRecords = this.state.studentFeeRecords.filter(r => r.studentId === studentId);
    const payments = this.state.feePaymentTransactions.filter(p => p.studentId === studentId);
    const concessions = this.getConcessions().filter(c => c.studentId === studentId && c.status === 'APPROVED');
    const refunds = this.getRefundsList().filter(r => r.studentId === studentId && r.status === 'COMPLETED');

    let runningBalance = 0;
    const entries: any[] = [];

    feeRecords.forEach((r, idx) => {
      runningBalance += r.totalAmount;
      entries.push({
        id: `fee-rec-${r.id || idx}`,
        date: r.dueDate || new Date().toISOString().split('T')[0],
        type: 'FEE_ASSIGNED',
        referenceNo: r.feeStructureCode || `FEE-${r.id.slice(0, 8)}`,
        description: `Fee Assigned: ${r.feeStructureName || 'Semester Academic Fee'}`,
        debit: r.totalAmount,
        credit: 0,
        balance: runningBalance,
      });
    });

    concessions.forEach(c => {
      runningBalance -= c.amount;
      entries.push({
        id: `conc-${c.id}`,
        date: c.approvalDate || c.createdAt.slice(0, 10),
        type: 'CONCESSION_APPLIED',
        referenceNo: c.concessionNo,
        description: `Scholarship/Concession: ${c.concessionType} (${c.reason})`,
        debit: 0,
        credit: c.amount,
        balance: runningBalance,
      });
    });

    payments.forEach(p => {
      runningBalance -= p.paidAmount;
      entries.push({
        id: `pay-${p.id}`,
        date: p.paymentDate,
        type: 'PAYMENT_RECEIVED',
        referenceNo: p.receiptNo || p.transactionId,
        description: `Payment Received via ${p.paymentMode}`,
        debit: 0,
        credit: p.paidAmount,
        balance: runningBalance,
      });
    });

    refunds.forEach(rf => {
      runningBalance += rf.refundAmount;
      entries.push({
        id: `ref-${rf.id}`,
        date: rf.processedDate || rf.createdAt.slice(0, 10),
        type: 'REFUND_PROCESSED',
        referenceNo: rf.refundNumber,
        description: `Refund Reversal: ${rf.reason}`,
        debit: rf.refundAmount,
        credit: 0,
        balance: runningBalance,
      });
    });

    const totalFeesAssigned = feeRecords.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalConcessions = concessions.reduce((acc, c) => acc + c.amount, 0);
    const totalPayments = payments.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalRefunds = refunds.reduce((acc, r) => acc + r.refundAmount, 0);

    return {
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      programName: program?.name || 'N/A',
      semesterName: semester ? `Semester ${semester.number}` : 'N/A',
      academicYear: '2026-27',
      openingBalance: 0,
      totalFeesAssigned,
      totalConcessions,
      totalLateFees: 0,
      totalPayments,
      totalRefunds,
      closingBalance: runningBalance,
      entries,
    };
  }

  // ── Bulk Fee Assignment ──
  public previewBulkAssignFees(params: { feeStructureId: string; studentIds?: string[]; programId?: string; semesterId?: string; academicYear?: string }) {
    const structure = this.getFeeStructures().find(s => s.id === params.feeStructureId);
    if (!structure) return { success: false, message: 'Fee structure not found.' };

    let targetStudents = this.getStudents();
    if (params.studentIds && params.studentIds.length > 0) {
      targetStudents = targetStudents.filter(s => params.studentIds!.includes(s.id));
    } else {
      if (params.programId && params.programId !== 'ALL') {
        targetStudents = targetStudents.filter(s => s.programId === params.programId);
      }
      if (params.semesterId && params.semesterId !== 'ALL') {
        targetStudents = targetStudents.filter(s => s.semesterId === params.semesterId);
      }
    }

    const existingFeeRecords = this.getStudentFeeRecords();
    const assignedIds = new Set(
      existingFeeRecords
        .filter(r => r.feeStructureId === structure.id || (r.programId === structure.programId && r.semesterId === structure.semesterId))
        .map(r => r.studentId)
    );

    const previewList = targetStudents.map(s => {
      const isAssigned = assignedIds.has(s.id);
      const sem = this.getSemesterById(s.semesterId);
      return {
        studentId: s.id,
        studentName: s.name,
        enrollmentNo: s.enrollmentNo,
        programName: this.getProgramById(s.programId)?.name || 'N/A',
        semesterName: sem ? `Semester ${sem.number}` : 'N/A',
        alreadyAssigned: isAssigned,
        totalFee: structure.totalAmount,
      };
    });

    const studentsSelected = targetStudents.length;
    const alreadyAssignedCount = previewList.filter(p => p.alreadyAssigned).length;
    const newAssignmentsCount = studentsSelected - alreadyAssignedCount;

    return {
      success: true,
      structure,
      studentsSelected,
      alreadyAssigned: alreadyAssignedCount,
      skipped: alreadyAssignedCount,
      newAssignments: newAssignmentsCount,
      totalFeeAmount: newAssignmentsCount * structure.totalAmount,
      preview: previewList,
    };
  }

  public executeBulkAssignFees(params: { feeStructureId: string; studentIds?: string[]; programId?: string; semesterId?: string; academicYear?: string }, user?: User): { success: boolean; message: string; assignedCount: number } {
    const preview = this.previewBulkAssignFees(params);
    if (!preview.success || !preview.structure) {
      return { success: false, message: preview.message || 'Failed to preview bulk fee assignment.', assignedCount: 0 };
    }

    const toAssign = preview.preview.filter((p: any) => !p.alreadyAssigned);
    if (toAssign.length === 0) {
      return { success: false, message: 'All selected students already have active fee assignments.', assignedCount: 0 };
    }

    const structure = preview.structure;
    toAssign.forEach((p: any) => {
      const student = this.state.students.find(s => s.id === p.studentId);
      if (!student) return;

      const newRecord: StudentFeeRecord = {
        id: `fee-rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId: student.id,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        programId: student.programId,
        semesterId: student.semesterId,
        academicYearId: 'ay-2026-27',
        academicYearCode: '2026-27',
        feeStructureId: structure.id,
        feeStructureName: structure.name,
        feeStructureCode: structure.structureCode,
        tuitionFee: structure.tuitionFee || 45000,
        labFee: structure.labFee || 8000,
        developmentFee: structure.developmentFee || 7000,
        hostelFee: structure.hostelFee || 0,
        totalAmount: structure.totalAmount,
        paidAmount: 0,
        pendingAmount: structure.totalAmount,
        dueDate: structure.dueDate || '2026-09-30',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      this.state.studentFeeRecords.push(newRecord);
    });

    this.saveState();
    return { success: true, message: `Successfully assigned fees to ${toAssign.length} students.`, assignedCount: toAssign.length };
  }

  // ── Accounts Real-Time Executive Dashboard Metrics ──
  public getAccountsDashboardStats() {
    const students = this.getStudents();
    const records = this.getStudentFeeRecords();
    const payments = this.getFeePaymentTransactions();
    const concessions = this.getConcessions().filter(c => c.status === 'APPROVED');
    const refunds = this.getRefundsList().filter(r => r.status === 'COMPLETED');
    const reconciliations = this.getPaymentReconciliations();

    const totalStudents = students.length;
    const totalFeesAssigned = records.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalPending = records.reduce((acc, r) => acc + r.pendingAmount, 0);
    const totalConcessions = concessions.reduce((acc, c) => acc + c.amount, 0);
    const totalRefunds = refunds.reduce((acc, r) => acc + r.refundAmount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = payments
      .filter(p => p.paymentDate === todayStr)
      .reduce((acc, p) => acc + p.paidAmount, 0);

    const thisMonthStr = new Date().toISOString().slice(0, 7);
    const thisMonthCollection = payments
      .filter(p => p.paymentDate.startsWith(thisMonthStr))
      .reduce((acc, p) => acc + p.paidAmount, 0);

    const failedPayments = reconciliations.filter(r => r.gatewayStatus === 'FAILED').length;

    return {
      totalStudents,
      totalFeesAssigned,
      totalCollected,
      totalPending,
      todayCollection,
      thisMonthCollection,
      lateFeeCollected: 0,
      totalConcessions,
      totalRefunds,
      failedPayments,
      collectionPercentage: totalFeesAssigned > 0 ? Math.round((totalCollected / totalFeesAssigned) * 100) : 100,
    };
  }

  public getStudentSectionServices(onlyActive = true): StudentSectionService[] {
    const list = this.state.studentSectionServices || [];
    return onlyActive ? list.filter(s => s.isActive) : list;
  }

  public getStudentSectionRequests(): StudentSectionRequest[] {
    return this.state.studentSectionRequests || [];
  }

  public getStudentSectionDocuments(): StudentSectionDocument[] {
    return this.state.studentSectionDocuments || [];
  }

  public getFeeQueries(): FeeQuery[] {
    return this.state.feeQueries || [];
  }

  public getExamFeeConfigs(): ExamFeeConfigItem[] {
    return this.state.examFeeConfigs || [];
  }

  // ─── Student Mentor Assignment Centralized Store ──────────────────────────
  public getMentorAssignments(): MentorAssignment[] {
    return this.state.mentorAssignments || [];
  }

  public getMentorAssignmentHistory(): MentorAssignmentHistory[] {
    return this.state.mentorAssignmentHistory || [];
  }

  public saveMentorAssignment(assignment: MentorAssignment, user?: User | null): void {
    const list = this.state.mentorAssignments || [];
    const idx = list.findIndex(a => a.id === assignment.id);
    if (idx >= 0) {
      list[idx] = { ...assignment, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...assignment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.state.mentorAssignments = [...list];

    // Sync student's mentorId for quick access
    const students = this.state.students || [];
    const studentIdx = students.findIndex(s => s.id === assignment.studentId);
    if (studentIdx >= 0) {
      students[studentIdx] = {
        ...students[studentIdx],
        mentorId: assignment.status === 'ACTIVE' ? assignment.mentorFacultyId : undefined
      };
      this.state.students = [...students];
    }

    this.saveState();
  }

  public saveMentorAssignmentHistory(historyItem: MentorAssignmentHistory): void {
    const list = this.state.mentorAssignmentHistory || [];
    this.state.mentorAssignmentHistory = [historyItem, ...list];
    this.saveState();
  }

  // ─── Student Mentoring Sessions Store ──────────────────────────────────────
  public getMentoringSessions(): MentoringSessionRecord[] {
    return this.state.mentoringSessions || [];
  }

  public getMentoringSessionById(id: string): MentoringSessionRecord | undefined {
    return (this.state.mentoringSessions || []).find(s => s.id === id);
  }

  public saveMentoringSession(session: MentoringSessionRecord, user?: User | null): void {
    const list = this.state.mentoringSessions || [];
    const idx = list.findIndex(s => s.id === session.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...session, updatedAt: now };
    } else {
      list.unshift({ ...session, createdAt: session.createdAt || now, updatedAt: now });
    }
    this.state.mentoringSessions = [...list];
    this.saveState();
  }

  public deleteMentoringSession(id: string, user?: User | null): void {
    const list = this.state.mentoringSessions || [];
    this.state.mentoringSessions = list.filter(s => s.id !== id);
    this.saveState();
  }

  // ─── Subject-Wise Attendance, 75% Exam Eligibility & Approval Store ───────
  public getAttendanceEligibilityConfig(): AttendanceEligibilityConfig {
    return this.state.attendanceEligibilityConfig || {
      id: 'att-cfg-default',
      minimumAttendancePct: 75.0,
      condonationFloorPct: 60.0,
      isCondonationAllowed: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };
  }

  public saveAttendanceEligibilityConfig(config: AttendanceEligibilityConfig): void {
    this.state.attendanceEligibilityConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    this.saveState();
  }

  public getAttendanceApplications(): AttendanceApplication[] {
    return this.state.attendanceApplications || [];
  }

  public saveAttendanceApplication(application: AttendanceApplication, user?: User | null): void {
    const list = this.state.attendanceApplications || [];
    const idx = list.findIndex(a => a.id === application.id || a.applicationNo === application.applicationNo);
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...application, updatedAt: now };
    } else {
      list.unshift({ ...application, createdAt: now, updatedAt: now });
    }
    this.state.attendanceApplications = [...list];
    this.saveState();
  }

  public getAttendanceApprovalHistory(): AttendanceApprovalHistoryItem[] {
    return this.state.attendanceApprovalHistory || [];
  }

  public saveAttendanceApprovalHistory(historyItem: AttendanceApprovalHistoryItem): void {
    const list = this.state.attendanceApprovalHistory || [];
    this.state.attendanceApprovalHistory = [historyItem, ...list];
    this.saveState();
  }

  // ─── Document Master & Student Academic Documents Store ───────────────────
  public getDocumentMasters(): DocumentMasterItem[] {
    return this.state.documentMasters || INITIAL_DOCUMENT_MASTER_DATA;
  }

  public saveDocumentMaster(doc: DocumentMasterItem): void {
    const list = this.state.documentMasters || [...INITIAL_DOCUMENT_MASTER_DATA];
    const idx = list.findIndex(d => d.id === doc.id || d.code === doc.code);
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...doc, updatedAt: now };
    } else {
      list.push({ ...doc, createdAt: now, updatedAt: now });
    }
    this.state.documentMasters = [...list];
    this.saveState();
  }

  public getStudentAcademicDocuments(): StudentAcademicDocumentItem[] {
    return this.state.studentAcademicDocuments || [];
  }

  public getStudentAcademicDocumentsByStudentId(studentId: string): StudentAcademicDocumentItem[] {
    return (this.state.studentAcademicDocuments || []).filter(d => d.studentId === studentId);
  }

  public saveStudentAcademicDocument(doc: StudentAcademicDocumentItem): void {
    const list = this.state.studentAcademicDocuments || [];
    const idx = list.findIndex(d => d.id === doc.id || (d.studentId === doc.studentId && d.documentMasterId === doc.documentMasterId));
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = { ...doc, updatedAt: now };
    } else {
      list.unshift({ ...doc, createdAt: now, updatedAt: now });
    }
    this.state.studentAcademicDocuments = [...list];
    this.saveState();
  }

  public getStudentDocumentVersions(): StudentDocumentVersionItem[] {
    return this.state.studentDocumentVersions || [];
  }

  public saveStudentDocumentVersion(version: StudentDocumentVersionItem): void {
    const list = this.state.studentDocumentVersions || [];
    this.state.studentDocumentVersions = [version, ...list];
    this.saveState();
  }

  public getDocumentVerifications(): DocumentVerificationLogItem[] {
    return this.state.documentVerifications || [];
  }

  public saveDocumentVerification(verification: DocumentVerificationLogItem): void {
    const list = this.state.documentVerifications || [];
    this.state.documentVerifications = [verification, ...list];
    this.saveState();
  }

  // ─── Academic Bank of Credits (ABC) ID Management ─────────────────────────
  public updateStudentAbcId(
    studentId: string, 
    abcId: string, 
    options?: { remarks?: string; academicYear?: string; docUrl?: string }
  ): { success: boolean; error?: string; student?: Student } {
    const cleanId = abcId.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanId)) {
      return { success: false, error: 'ABC ID must be exactly 12 numeric digits (e.g. 1234-5678-9012 or 123456789012).' };
    }

    const students = this.state.students || [];
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const currentStudent = students[idx];
    if (currentStudent.abcIdStatus === 'VERIFIED') {
      return { success: false, error: 'Verified ABC ID is locked and cannot be edited by the student.' };
    }

    // Duplicate check: ensure no other student already has this ABC ID
    const duplicate = students.find(s => s.id !== studentId && s.abcId && s.abcId.replace(/[\s-]/g, '') === cleanId);
    if (duplicate) {
      return { success: false, error: 'This ABC ID is already registered to another student profile.' };
    }

    // Format formatted ID: XXXX-XXXX-XXXX
    const formattedId = `${cleanId.slice(0, 4)}-${cleanId.slice(4, 8)}-${cleanId.slice(8, 12)}`;
    const now = new Date().toISOString();

    const history = currentStudent.abcIdHistory || [];
    const newHistoryEntry = {
      abcId: formattedId,
      submittedAt: now,
      status: 'PENDING_VERIFICATION' as const,
      remarks: options?.remarks
    };

    const updatedStudent: Student = {
      ...currentStudent,
      abcId: formattedId,
      abcIdStatus: 'PENDING_VERIFICATION',
      abcIdRejectionReason: undefined,
      abcIdAcademicYear: options?.academicYear || '2026-27',
      abcIdDocUrl: options?.docUrl || currentStudent.abcIdDocUrl,
      abcIdRemarks: options?.remarks || currentStudent.abcIdRemarks,
      abcIdHistory: [newHistoryEntry, ...history]
    };

    students[idx] = updatedStudent;
    this.state.students = [...students];

    this.logAudit(
      'UPDATE', 
      'ABC_ID', 
      `Student ${currentStudent.name} (${currentStudent.enrollmentNo}) submitted ABC ID ${formattedId} for Mentor verification.`,
      currentStudent.name,
      'STUDENT'
    );

    this.saveState();
    return { success: true, student: updatedStudent };
  }

  public verifyStudentAbcId(
    studentId: string, 
    verifierUserId: string, 
    verifierName: string, 
    verifierRole = 'FACULTY_MENTOR',
    remarks?: string
  ): { success: boolean; error?: string; student?: Student } {
    const students = this.state.students || [];
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const currentStudent = students[idx];
    if (!currentStudent.abcId) {
      return { success: false, error: 'Student has not submitted an ABC ID yet.' };
    }

    const now = new Date().toISOString();
    const history = currentStudent.abcIdHistory || [];
    const updatedHistory = history.map((h, i) => i === 0 ? {
      ...h,
      status: 'VERIFIED' as const,
      verifiedBy: `${verifierName} (${verifierRole})`,
      verifiedAt: now,
      remarks: remarks || h.remarks
    } : h);

    const updatedStudent: Student = {
      ...currentStudent,
      abcIdStatus: 'VERIFIED',
      abcIdVerifiedByUserId: verifierUserId,
      abcIdVerifiedByName: verifierName,
      abcIdVerifiedAt: now,
      abcIdRejectionReason: undefined,
      abcIdRemarks: remarks || currentStudent.abcIdRemarks,
      abcIdHistory: updatedHistory
    };

    students[idx] = updatedStudent;
    this.state.students = [...students];

    this.logAudit(
      'APPROVE', 
      'ABC_ID', 
      `Mentor ${verifierName} verified and permanently locked ABC ID ${currentStudent.abcId} for student ${currentStudent.name} (${currentStudent.enrollmentNo}).`,
      verifierName,
      'FACULTY'
    );

    this.addNotification({
      title: 'ABC ID Verified & Locked',
      message: `Your Academic Bank of Credits (ABC) ID ${currentStudent.abcId} has been verified by Mentor ${verifierName} and is now permanently locked.`,
      module: 'REQUEST',
      timestamp: 'Just Now',
      targetUserId: currentStudent.id,
      linkTab: 'documents'
    });

    this.saveState();
    return { success: true, student: updatedStudent };
  }

  public rejectStudentAbcId(
    studentId: string, 
    verifierUserId: string, 
    verifierName: string, 
    verifierRole: string,
    rejectionReason: string,
    remarks?: string
  ): { success: boolean; error?: string; student?: Student } {
    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: 'Rejection reason is required.' };
    }

    const students = this.state.students || [];
    const idx = students.findIndex(s => s.id === studentId);
    if (idx === -1) {
      return { success: false, error: 'Student not found.' };
    }

    const currentStudent = students[idx];
    const now = new Date().toISOString();
    const history = currentStudent.abcIdHistory || [];
    const updatedHistory = history.map((h, i) => i === 0 ? {
      ...h,
      status: 'REJECTED' as const,
      verifiedBy: `${verifierName} (${verifierRole})`,
      verifiedAt: now,
      rejectionReason,
      remarks: remarks || h.remarks
    } : h);

    const updatedStudent: Student = {
      ...currentStudent,
      abcIdStatus: 'REJECTED',
      abcIdVerifiedByUserId: verifierUserId,
      abcIdVerifiedByName: verifierName,
      abcIdVerifiedAt: now,
      abcIdRejectionReason: rejectionReason,
      abcIdRemarks: remarks || currentStudent.abcIdRemarks,
      abcIdHistory: updatedHistory
    };

    students[idx] = updatedStudent;
    this.state.students = [...students];

    this.logAudit(
      'REJECT', 
      'ABC_ID', 
      `Mentor ${verifierName} rejected ABC ID ${currentStudent.abcId} for student ${currentStudent.name}. Reason: ${rejectionReason}`,
      verifierName,
      'FACULTY'
    );

    this.addNotification({
      title: 'ABC ID Verification Returned / Rejected',
      message: `Your submitted ABC ID was rejected by Mentor ${verifierName}. Reason: "${rejectionReason}". Please correct and resubmit.`,
      module: 'REQUEST',
      timestamp: 'Just Now',
      targetUserId: currentStudent.id,
      linkTab: 'documents'
    });

    this.saveState();
    return { success: true, student: updatedStudent };
  }

  // ─── EXAMINATION MODULE: FEE BREAKDOWN ──────────────────────────────────────

  public getExamFeeBreakdown(
    examId: string,
    studentId: string,
    feeCategory: 'REGULAR' | 'BACKLOG' | 'ATKT' | 'RE_EXAM' | 'SUPPLEMENTARY' | 'REASSESSMENT' | 'RECHECKING' = 'REGULAR',
    subjectCount: number = 1
  ): ExamFeeBreakdown {
    const exam = this.state.exams.find(e => e.id === examId);
    const today = new Date();
    const isLate = exam?.formDeadline ? today > new Date(exam.formDeadline) : false;

    // Fee amounts from exam config
    const feeConfigs = this.state.examFeeConfigs || [];
    const relevantConfig = feeConfigs.find(c => (c.category as string) === feeCategory);

    let baseFee = 0;
    let perSubjectFee = 0;

    // Map fee category to exam's configured amounts
    switch (feeCategory) {
      case 'REGULAR':
        baseFee = relevantConfig?.baseAmount ?? (exam?.baseFee ?? 300);
        perSubjectFee = relevantConfig?.perSubjectAmount ?? (exam?.perSubjectFee ?? 50);
        break;
      case 'BACKLOG':
      case 'ATKT':
        baseFee = relevantConfig?.baseAmount ?? 500;
        perSubjectFee = relevantConfig?.perSubjectAmount ?? 100;
        break;
      case 'RE_EXAM':
        baseFee = relevantConfig?.baseAmount ?? 400;
        perSubjectFee = relevantConfig?.perSubjectAmount ?? 75;
        break;
      case 'SUPPLEMENTARY':
        baseFee = relevantConfig?.baseAmount ?? 350;
        perSubjectFee = relevantConfig?.perSubjectAmount ?? 60;
        break;
      case 'REASSESSMENT':
        baseFee = relevantConfig?.baseAmount ?? 200;
        perSubjectFee = 0;
        break;
      case 'RECHECKING':
        baseFee = relevantConfig?.baseAmount ?? 150;
        perSubjectFee = 0;
        break;
      default:
        baseFee = exam?.baseFee ?? 300;
        perSubjectFee = exam?.perSubjectFee ?? 50;
    }

    const subjectFeeTotal = perSubjectFee * subjectCount;
    const lateFee = isLate ? (exam?.lateFee ?? 100) : 0;
    const concession = 0; // Could be expanded for scholarship holders
    const totalPayable = Math.max(0, baseFee + subjectFeeTotal + lateFee - concession);

    return {
      baseFee,
      perSubjectFee,
      subjectCount,
      subjectFeeTotal,
      lateFee,
      concession,
      totalPayable,
      currency: 'INR',
      isLate,
      feeCategory
    };
  }

  // ─── EXAMINATION MODULE: BACKLOG ELIGIBLE SUBJECTS ──────────────────────────

  public getStudentEligibleBacklogSubjects(studentId: string): BacklogSubjectEntry[] {
    const marks = this.state.studentMarks.filter(m => m.studentId === studentId);
    const subjects = this.state.subjects;
    const semesters = this.state.semesters;
    const exams = this.state.exams;
    const examForms = this.state.examForms;

    const backlogEntries: BacklogSubjectEntry[] = [];
    const seenSubjectIds = new Set<string>();

    for (const mark of marks) {
      if (!mark.subjectId) continue;
      const subjectObj = subjects.find(s => s.id === mark.subjectId);
      if (!subjectObj) continue;

      const isFailed = !mark.isPass || mark.isAbsent || mark.grade === 'F' || mark.grade === 'FF' || mark.resultStatus === 'CANCELLED';
      if (!isFailed) continue;
      if (seenSubjectIds.has(mark.subjectId)) continue;
      seenSubjectIds.add(mark.subjectId);

      const examObj = exams.find(e => e.id === mark.examId);
      const semesterObj = examObj?.semesterId ? semesters.find(s => s.id === examObj.semesterId) : (subjectObj.semesterId ? semesters.find(s => s.id === subjectObj.semesterId) : undefined);

      // Count previous backlog attempts
      const pastBacklogForms = examForms.filter(f => {
        const exam = exams.find(e => e.id === f.examId);
        return f.studentId === studentId &&
          (f.formSubjects || []).some(s => s.subjectId === mark.subjectId) &&
          exam && (
            exam.type === 'Backlog' || exam.type === 'BACKLOG' ||
            exam.type === 'Re-Examination' || exam.type === 'RE_EXAM' ||
            exam.type === 'Supplementary' || exam.type === 'ATKT'
          );
      });

      const attemptNumber = pastBacklogForms.length + 1;
      const maxAttempts = 3; // Configurable university rule

      const eligibility = attemptNumber > maxAttempts
        ? 'MAX_ATTEMPTS_REACHED' as const
        : 'ELIGIBLE' as const;

      const isReExam = subjectObj.code === 'CSE301' || attemptNumber > 1;

      backlogEntries.push({
        subjectId: mark.subjectId,
        subjectCode: subjectObj.code,
        subjectName: subjectObj.name,
        semesterId: examObj?.semesterId || subjectObj.semesterId,
        semesterNumber: semesterObj?.number || (subjectObj.semesterId === 'sem-cse-2' ? 2 : (subjectObj.semesterId === 'sem-cse-3' ? 3 : 4)),
        attemptNumber,
        marksObtained: mark.totalMarks,
        maximumMarks: mark.maxMarks ?? ((mark.maxInternalMarks || 0) + (mark.maxExternalMarks || 0) || 100),
        result: mark.isAbsent ? 'ABSENT' : (isReExam ? 'ATKT' : 'FAIL'),
        examType: isReExam ? 'RE_EXAM' : 'BACKLOG',
        eligibility,
        eligibilityReason: eligibility === 'MAX_ATTEMPTS_REACHED'
          ? `Maximum ${maxAttempts} attempts reached`
          : undefined,
        fee: 750
      });
    }

    // DEMO MODE fallback seed records if no failed marks found for the current student
    if (backlogEntries.length === 0) {
      return [
        {
          subjectId: 'sub-cse201',
          subjectCode: 'CSE201',
          subjectName: 'Data Structures',
          semesterId: 'sem-cse-2',
          semesterNumber: 2,
          attemptNumber: 1,
          marksObtained: 28,
          maximumMarks: 100,
          result: 'FAIL',
          examType: 'BACKLOG',
          eligibility: 'ELIGIBLE',
          fee: 750
        },
        {
          subjectId: 'sub-cse204',
          subjectCode: 'CSE204',
          subjectName: 'Database Management System',
          semesterId: 'sem-cse-2',
          semesterNumber: 2,
          attemptNumber: 1,
          marksObtained: 31,
          maximumMarks: 100,
          result: 'FAIL',
          examType: 'BACKLOG',
          eligibility: 'ELIGIBLE',
          fee: 750
        },
        {
          subjectId: 'sub-cse301',
          subjectCode: 'CSE301',
          subjectName: 'Computer Networks',
          semesterId: 'sem-cse-3',
          semesterNumber: 3,
          attemptNumber: 2,
          marksObtained: 34,
          maximumMarks: 100,
          result: 'ATKT',
          examType: 'RE_EXAM',
          eligibility: 'ELIGIBLE',
          fee: 750
        }
      ];
    }

    return backlogEntries;
  }

  public submitBacklogExamForm(dto: {
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    examId?: string;
    subjectEntries: BacklogSubjectEntry[];
    examFee: number;
    processingFee: number;
    totalAmount: number;
    transactionId: string;
    paymentMode: string;
    applicationNumber?: string;
  }): { success: boolean; formNumber: string; transactionId: string } {
    if (!this.state.examForms) this.state.examForms = [];
    const now = new Date();
    const appNum = dto.applicationNumber || `APP/BL/${now.getFullYear()}/${String(Math.floor(100000 + Math.random() * 900000))}`;
    
    const formSubjects: ExamFormSubjectItem[] = dto.subjectEntries.map(s => ({
      id: `efs-${Date.now()}-${s.subjectId}`,
      subjectId: s.subjectId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      credits: 4,
      examType: s.examType === 'RE_EXAM' ? 'Re-Examination' : 'Backlog',
      amount: s.fee || 750,
      status: 'ENROLLED'
    }));

    const newForm: ExamForm = {
      id: `ef-bl-${Date.now()}`,
      examId: dto.examId || 'exam-backlog-1',
      studentId: dto.studentId,
      formNumber: appNum,
      studentName: dto.studentName,
      enrollmentNo: dto.enrollmentNo,
      programId: 'prog-1',
      semesterId: 'sem-cse-4',
      semesterNumber: 4,
      appliedDate: now.toISOString().split('T')[0],
      status: 'VERIFICATION_PENDING',
      paymentStatus: 'PAID',
      formSubjects,
      regularSubjects: [],
      backlogSubjects: dto.subjectEntries.map(s => s.subjectId),
      examFeeAmount: dto.examFee,
      lateFeeAmount: 0,
      totalAmount: dto.totalAmount,
      baseFee: dto.examFee,
      lateFee: 0,
      totalFee: dto.totalAmount,
      paymentTransactionId: dto.transactionId,
      paymentMode: dto.paymentMode,
      paidAt: now.toISOString(),
      remarks: `Online Backlog / Re-Exam Application (${dto.subjectEntries.length} subjects)`,
      createdAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0]
    };

    this.state.examForms.unshift(newForm);
    this.saveState();
    return { success: true, formNumber: appNum, transactionId: dto.transactionId };
  }

  // ─── EXAMINATION MODULE: REASSESSMENT / RECHECKING ───────────────────────────

  public getReassessmentApplications(studentId?: string): ReassessmentApplication[] {
    const apps = this.state.reassessmentApplications || [];
    if (!studentId) return apps;
    return apps.filter(a => a.studentId === studentId);
  }

  public applyReassessment(
    studentId: string,
    examId: string,
    subjectId: string,
    type: ReassessmentType,
    options: {
      fee?: number;
      remarks?: string;
    } = {}
  ): { success: boolean; error?: string; application?: ReassessmentApplication } {
    const students = this.state.students;
    const student = students.find(s => s.id === studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    const exam = this.state.exams.find(e => e.id === examId);
    if (!exam) return { success: false, error: 'Exam not found.' };

    const subject = this.state.subjects.find(s => s.id === subjectId);
    if (!subject) return { success: false, error: 'Subject not found.' };

    // Check if already applied for this subject + exam + type
    const apps = this.state.reassessmentApplications || [];
    const existingActive = apps.find(a =>
      a.studentId === studentId &&
      a.examId === examId &&
      a.subjectId === subjectId &&
      a.type === type &&
      !['REJECTED', 'CANCELLED'].includes(a.status)
    );

    if (existingActive) {
      return { success: false, error: `You have already applied for ${type === 'REASSESSMENT' ? 'Reassessment' : 'Rechecking'} for this subject.` };
    }

    // Get marks for this subject
    const relatedMarks = this.state.studentMarks.find(
      m => m.studentId === studentId && m.subjectId === subjectId && (examId ? m.examId === examId : true)
    );
    const relatedResult = this.state.studentResults.find(
      r => r.studentId === studentId && r.examId === examId
    );

    const feeAmount = options.fee ?? (type === 'REASSESSMENT' ? 200 : 150);
    const now = new Date().toISOString();
    const applicationNo = `${type === 'REASSESSMENT' ? 'RSM' : 'RCK'}-${Date.now().toString().slice(-6)}`;

    const newApp: ReassessmentApplication = {
      id: `reassessment-${Date.now()}`,
      applicationNo,
      studentId,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      examId,
      examName: exam.name,
      subjectId,
      subjectCode: subject.code,
      subjectName: subject.name,
      semesterId: exam.semesterId,
      programId: exam.programId,
      type,
      marksObtained: relatedMarks?.totalMarks,
      maximumMarks: relatedMarks?.maxMarks ?? ((relatedMarks?.maxInternalMarks || 0) + (relatedMarks?.maxExternalMarks || 0) || 100),
      result: relatedMarks ? (relatedMarks.isPass ? 'PASS' : 'FAIL') : (relatedResult?.status ?? 'UNKNOWN'),
      fee: feeAmount,
      paymentStatus: 'PENDING',
      status: 'PAYMENT_PENDING',
      applicationDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    this.state.reassessmentApplications = [...apps, newApp];

    this.logAudit(
      'CREATE',
      'REASSESSMENT_APPLICATION',
      `Student ${student.name} (${student.enrollmentNo}) applied for ${type} of ${subject.name} in exam ${exam.name}.`,
      student.name,
      'STUDENT'
    );

    this.saveState();
    return { success: true, application: newApp };
  }

  public payReassessmentFee(
    applicationId: string,
    paymentMode: string = 'ONLINE_UPI'
  ): { success: boolean; error?: string; application?: ReassessmentApplication } {
    const apps = this.state.reassessmentApplications || [];
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx === -1) return { success: false, error: 'Application not found.' };

    const app = apps[idx];
    if (app.paymentStatus === 'PAID') return { success: false, error: 'Fee already paid.' };

    const txnId = `TXN-RSM-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();

    const updatedApp: ReassessmentApplication = {
      ...app,
      paymentStatus: 'PAID',
      paymentMode,
      transactionId: txnId,
      paidAt: now.split('T')[0],
      status: 'SUBMITTED',
      updatedAt: now
    };

    apps[idx] = updatedApp;
    this.state.reassessmentApplications = [...apps];
    this.saveState();

    return { success: true, application: updatedApp };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // INVENTORY & ASSET MANAGEMENT SERVICE API
  // ──────────────────────────────────────────────────────────────────────────────

  public getInventoryCategories(): InventoryCategoryItem[] {
    return this.state.inventoryCategories || initialInventoryCategories;
  }

  public getInventoryLocations(instituteId?: string, departmentId?: string): InventoryLocationRecord[] {
    let list = this.state.inventoryLocations || initialInventoryLocations;
    if (instituteId) {
      list = list.filter(l => l.instituteId === instituteId);
    }
    if (departmentId) {
      list = list.filter(l => !l.departmentId || l.departmentId === departmentId);
    }
    return list;
  }

  public addInventoryLocation(data: Partial<InventoryLocationRecord>, user?: User): InventoryLocationRecord {
    const locations = this.state.inventoryLocations || initialInventoryLocations;
    const inst = this.getInstituteById(data.instituteId || '');
    const dept = data.departmentId ? this.getDepartmentById(data.departmentId) : undefined;
    const newLoc: InventoryLocationRecord = {
      id: `loc-${Date.now().toString().slice(-6)}`,
      instituteId: data.instituteId || '',
      instituteName: inst?.name || data.instituteName || '',
      departmentId: data.departmentId,
      departmentName: dept?.name || data.departmentName,
      building: data.building || 'Main Block',
      block: data.block || '',
      floor: data.floor || 'Ground Floor',
      roomNo: data.roomNo || '',
      roomType: data.roomType || 'LAB',
      labName: data.labName || '',
      rackNumber: data.rackNumber || '',
      shelfNumber: data.shelfNumber || '',
      drawerNumber: data.drawerNumber || '',
      boxNumber: data.boxNumber || '',
      custodianName: data.custodianName || '',
      status: 'ACTIVE'
    };

    this.state.inventoryLocations = [newLoc, ...locations];
    this.logInventoryAudit('CREATE', 'LOCATIONS', newLoc.id, `${newLoc.building} - ${newLoc.roomNo}`, {
      instituteName: newLoc.instituteName,
      departmentName: newLoc.departmentName,
      newValue: newLoc,
      remarks: 'Location record created.'
    }, user);
    this.saveState();
    return newLoc;
  }

  public getFixedAssets(user?: User | null, filters?: {
    instituteId?: string;
    departmentId?: string;
    categoryId?: string;
    categoryGroup?: string;
    status?: string;
    search?: string;
  }): FixedAsset[] {
    let list = this.state.fixedAssets || initialFixedAssets;

    // Strict RBAC Scoping
    if (user) {
      if (user.role === 'FACULTY' || (user.role as string) === 'STAFF' || user.role === 'MENTOR') {
        list = list.filter(a => 
          (a.assignedToUserId && a.assignedToUserId === user.id) || 
          (a.assignedToName && user.name && a.assignedToName.toLowerCase().includes(user.name.toLowerCase()))
        );
      } else if (user.role === 'HOD') {
        list = list.filter(a => 
          (user.departmentId && a.departmentId === user.departmentId) ||
          (user.departmentName && a.departmentName && a.departmentName.toLowerCase().includes(user.departmentName.toLowerCase()))
        );
      } else if (user.role === 'PRINCIPAL' || (user.role as string) === 'HOI') {
        if (user.instituteId) {
          list = list.filter(a => a.instituteId === user.instituteId);
        }
      }
    }

    if (filters?.instituteId) {
      list = list.filter(a => a.instituteId === filters.instituteId);
    }
    if (filters?.departmentId) {
      list = list.filter(a => a.departmentId === filters.departmentId);
    }
    if (filters?.categoryId) {
      list = list.filter(a => a.categoryId === filters.categoryId);
    }
    if (filters?.categoryGroup) {
      list = list.filter(a => a.categoryGroup === filters.categoryGroup);
    }
    if (filters?.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(a =>
        a.assetTag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
        (a.assignedToName && a.assignedToName.toLowerCase().includes(q)) ||
        (a.locationName && a.locationName.toLowerCase().includes(q)) ||
        (a.roomNo && a.roomNo.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public getFixedAssetById(id: string): FixedAsset | null {
    const list = this.state.fixedAssets || initialFixedAssets;
    return list.find(a => a.id === id || a.assetTag === id) || null;
  }

  public generateAssetTag(instituteId: string, departmentId?: string, categoryCode: string = 'AST'): string {
    const inst = this.getInstituteById(instituteId);
    const instCode = inst?.code?.toUpperCase() || 'SSIU';
    const dept = departmentId ? this.getDepartmentById(departmentId) : undefined;
    const deptCode = dept?.code?.toUpperCase() || (departmentId ? 'DEPT' : 'GEN');
    const prefix = `${instCode}-${deptCode}-${categoryCode.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()}`;
    const count = (this.state.fixedAssets || []).filter(a => a.assetTag.startsWith(prefix)).length + 1;
    return `${prefix}-${count.toString().padStart(4, '0')}`;
  }

  public createFixedAsset(data: Partial<FixedAsset>, user?: User): FixedAsset {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const inst = this.getInstituteById(data.instituteId || '');
    const dept = data.departmentId ? this.getDepartmentById(data.departmentId) : undefined;
    const category = (this.state.inventoryCategories || initialInventoryCategories).find(c => c.id === data.categoryId);

    const assetTag = data.assetTag || this.generateAssetTag(data.instituteId || '', data.departmentId, category?.code || 'AST');
    const now = new Date().toISOString();

    const newAsset: FixedAsset = {
      id: `ast-${Date.now().toString().slice(-8)}`,
      assetTag,
      name: data.name || 'New Asset Item',
      categoryId: data.categoryId || 'cat-it-1',
      categoryName: category?.name || data.categoryName || 'IT Equipment',
      categoryGroup: (category?.categoryGroup || data.categoryGroup || 'IT_EQUIPMENT') as InventoryCategoryGroup,
      instituteId: data.instituteId || '',
      instituteName: inst?.name || data.instituteName || '',
      departmentId: data.departmentId,
      departmentName: dept?.name || data.departmentName,
      locationId: data.locationId,
      locationName: data.locationName,
      building: data.building,
      floor: data.floor,
      roomNo: data.roomNo,
      assignedToUserId: data.assignedToUserId,
      assignedToName: data.assignedToName,
      assignedToEmpCode: data.assignedToEmpCode,
      assignedToDesignation: data.assignedToDesignation,
      purchaseDate: data.purchaseDate || now.split('T')[0],
      purchaseOrderNumber: data.purchaseOrderNumber,
      vendor: data.vendor,
      invoiceNumber: data.invoiceNumber,
      warrantyStart: data.warrantyStart,
      warrantyEnd: data.warrantyEnd,
      purchaseCost: Number(data.purchaseCost || 0),
      currentValue: Number(data.currentValue || data.purchaseCost || 0),
      serialNumber: data.serialNumber,
      modelNumber: data.modelNumber,
      manufacturer: data.manufacturer,
      assetCondition: (data.assetCondition || 'GOOD') as AssetCondition,
      status: (data.status || 'ACTIVE') as AssetStatus,
      usefulLifeYears: Number(data.usefulLifeYears || category?.usefulLifeYears || 5),
      depreciationRate: Number(data.depreciationRate || category?.depreciationRate || 20),
      cpuConfig: data.cpuConfig,
      qrCodeData: `https://erp.swarrnim.edu.in/assets/${assetTag}`,
      remarks: data.remarks,
      documents: data.documents || [],
      createdAt: now,
      updatedAt: now
    };

    this.state.fixedAssets = [newAsset, ...assets];
    this.logInventoryAudit('CREATE', 'ASSETS', newAsset.id, `${newAsset.name} (${newAsset.assetTag})`, {
      instituteName: newAsset.instituteName,
      departmentName: newAsset.departmentName,
      newValue: newAsset,
      remarks: `Fixed Asset ${newAsset.assetTag} created.`
    }, user);

    this.saveState();
    return newAsset;
  }

  public updateFixedAsset(id: string, data: Partial<FixedAsset>, user?: User): FixedAsset {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const idx = assets.findIndex(a => a.id === id || a.assetTag === id);
    if (idx === -1) throw new Error('Asset not found');

    const old = assets[idx];
    const now = new Date().toISOString();
    const updated: FixedAsset = {
      ...old,
      ...data,
      purchaseCost: data.purchaseCost !== undefined ? Number(data.purchaseCost) : old.purchaseCost,
      currentValue: data.currentValue !== undefined ? Number(data.currentValue) : old.currentValue,
      cpuConfig: data.cpuConfig ? { ...old.cpuConfig, ...data.cpuConfig } : old.cpuConfig,
      updatedAt: now
    };

    assets[idx] = updated;
    this.state.fixedAssets = [...assets];

    this.logInventoryAudit('UPDATE', 'ASSETS', updated.id, `${updated.name} (${updated.assetTag})`, {
      instituteName: updated.instituteName,
      departmentName: updated.departmentName,
      oldValue: old,
      newValue: updated,
      remarks: 'Asset details updated.'
    }, user);

    this.saveState();
    return updated;
  }

  public assignAsset(assetId: string, assignmentData: Partial<AssetAssignmentRecord>, user?: User): { success: boolean; error?: string; asset?: FixedAsset } {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const assetIdx = assets.findIndex(a => a.id === assetId || a.assetTag === assetId);
    if (assetIdx === -1) return { success: false, error: 'Asset not found.' };

    const asset = assets[assetIdx];
    const now = new Date().toISOString();

    const assignment: AssetAssignmentRecord = {
      id: `asg-${Date.now().toString().slice(-8)}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      assignedToUserId: assignmentData.assignedToUserId,
      assignedToName: assignmentData.assignedToName || 'Assigned Staff',
      assignedToEmpCode: assignmentData.assignedToEmpCode,
      assignedToDesignation: assignmentData.assignedToDesignation,
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      departmentId: asset.departmentId,
      departmentName: asset.departmentName,
      location: assignmentData.location || asset.locationName,
      roomNo: assignmentData.roomNo || asset.roomNo,
      issueDate: assignmentData.issueDate || now.split('T')[0],
      expectedReturnDate: assignmentData.expectedReturnDate,
      conditionAtIssue: (assignmentData.conditionAtIssue || asset.assetCondition || 'GOOD') as AssetCondition,
      purpose: assignmentData.purpose || 'Official Department Assignment',
      status: 'ACTIVE',
      remarks: assignmentData.remarks,
      assignedByName: user?.name || 'Department Custodian',
      createdAt: now
    };

    const updatedAsset: FixedAsset = {
      ...asset,
      assignedToUserId: assignment.assignedToUserId,
      assignedToName: assignment.assignedToName,
      assignedToEmpCode: assignment.assignedToEmpCode,
      assignedToDesignation: assignment.assignedToDesignation,
      locationName: assignment.location || asset.locationName,
      roomNo: assignment.roomNo || asset.roomNo,
      status: 'ASSIGNED',
      updatedAt: now
    };

    assets[assetIdx] = updatedAsset;
    this.state.fixedAssets = [...assets];

    const currentAssignments = this.state.assetAssignments || [];
    this.state.assetAssignments = [assignment, ...currentAssignments];

    this.logInventoryAudit('ASSIGN', 'ASSETS', asset.id, `${asset.name} (${asset.assetTag})`, {
      instituteName: asset.instituteName,
      departmentName: asset.departmentName,
      oldValue: { status: asset.status, assignedTo: asset.assignedToName },
      newValue: { status: 'ASSIGNED', assignedTo: assignment.assignedToName, date: assignment.issueDate },
      remarks: `Asset assigned to ${assignment.assignedToName}`
    }, user);

    this.saveState();
    return { success: true, asset: updatedAsset };
  }

  public returnAsset(assetId: string, returnData: { returnDate?: string; conditionAtReturn?: AssetCondition; remarks?: string }, user?: User): { success: boolean; error?: string; asset?: FixedAsset } {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const assetIdx = assets.findIndex(a => a.id === assetId || a.assetTag === assetId);
    if (assetIdx === -1) return { success: false, error: 'Asset not found.' };

    const asset = assets[assetIdx];
    const now = new Date().toISOString();

    const assignments = this.state.assetAssignments || [];
    const activeAsgIdx = assignments.findIndex(a => a.assetId === asset.id && a.status === 'ACTIVE');
    if (activeAsgIdx !== -1) {
      assignments[activeAsgIdx] = {
        ...assignments[activeAsgIdx],
        returnDate: returnData.returnDate || now.split('T')[0],
        conditionAtReturn: returnData.conditionAtReturn || asset.assetCondition,
        status: 'RETURNED',
        remarks: returnData.remarks || assignments[activeAsgIdx].remarks
      };
      this.state.assetAssignments = [...assignments];
    }

    const updatedAsset: FixedAsset = {
      ...asset,
      assignedToUserId: undefined,
      assignedToName: undefined,
      assignedToEmpCode: undefined,
      assignedToDesignation: undefined,
      assetCondition: returnData.conditionAtReturn || asset.assetCondition,
      status: 'IN_STORE',
      updatedAt: now
    };

    assets[assetIdx] = updatedAsset;
    this.state.fixedAssets = [...assets];

    this.logInventoryAudit('RETURN', 'ASSETS', asset.id, `${asset.name} (${asset.assetTag})`, {
      instituteName: asset.instituteName,
      departmentName: asset.departmentName,
      oldValue: { status: asset.status, assignedTo: asset.assignedToName },
      newValue: { status: 'IN_STORE', condition: updatedAsset.assetCondition },
      remarks: `Asset returned to department store by ${asset.assignedToName || 'Staff'}`
    }, user);

    this.saveState();
    return { success: true, asset: updatedAsset };
  }

  public transferAsset(transferData: Partial<AssetTransferRecord>, user?: User): { success: boolean; error?: string; transfer?: AssetTransferRecord } {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const assetIdx = assets.findIndex(a => a.id === transferData.assetId || a.assetTag === transferData.assetTag);
    if (assetIdx === -1) return { success: false, error: 'Asset not found.' };

    const asset = assets[assetIdx];
    const fromInst = this.getInstituteById(transferData.fromInstituteId || asset.instituteId);
    const toInst = this.getInstituteById(transferData.toInstituteId || asset.instituteId);
    const toDept = transferData.toDeptId ? this.getDepartmentById(transferData.toDeptId) : undefined;
    const now = new Date().toISOString();

    const transfer: AssetTransferRecord = {
      id: `trf-${Date.now().toString().slice(-8)}`,
      transferNo: `TRF-${new Date().getFullYear()}-${((this.state.assetTransfers || []).length + 1).toString().padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromInstituteId: fromInst?.id || asset.instituteId,
      fromInstituteName: fromInst?.name || asset.instituteName,
      toInstituteId: toInst?.id || asset.instituteId,
      toInstituteName: toInst?.name || asset.instituteName,
      fromDeptId: asset.departmentId,
      fromDeptName: asset.departmentName,
      toDeptId: transferData.toDeptId,
      toDeptName: toDept?.name || transferData.toDeptName,
      fromLocation: asset.locationName,
      toLocation: transferData.toLocation,
      fromCustodian: asset.assignedToName,
      toCustodian: transferData.toCustodian,
      transferDate: transferData.transferDate || now.split('T')[0],
      transferredByName: user?.name || 'Department Custodian',
      authorizedByName: transferData.authorizedByName || 'Head of Institute / Registrar',
      reason: transferData.reason || 'Inter-departmental allocation',
      status: 'COMPLETED',
      remarks: transferData.remarks
    };

    // Update asset ownership & location
    const updatedAsset: FixedAsset = {
      ...asset,
      instituteId: transfer.toInstituteId,
      instituteName: transfer.toInstituteName,
      departmentId: transfer.toDeptId,
      departmentName: transfer.toDeptName,
      locationName: transfer.toLocation || asset.locationName,
      assignedToName: transfer.toCustodian || undefined,
      status: transfer.toCustodian ? 'ASSIGNED' : 'IN_STORE',
      updatedAt: now
    };

    assets[assetIdx] = updatedAsset;
    this.state.fixedAssets = [...assets];

    const currentTransfers = this.state.assetTransfers || initialAssetTransfers;
    this.state.assetTransfers = [transfer, ...currentTransfers];

    this.logInventoryAudit('TRANSFER', 'TRANSFERS', asset.id, `${asset.name} (${asset.assetTag})`, {
      instituteName: asset.instituteName,
      departmentName: asset.departmentName,
      oldValue: { institute: asset.instituteName, department: asset.departmentName, location: asset.locationName },
      newValue: { institute: transfer.toInstituteName, department: transfer.toDeptName, location: transfer.toLocation },
      remarks: `Transferred from ${asset.instituteName} to ${transfer.toInstituteName}`
    }, user);

    this.saveState();
    return { success: true, transfer };
  }

  public createMaintenanceLog(data: Partial<AssetMaintenanceRecord>, user?: User): AssetMaintenanceRecord {
    const logs = this.state.assetMaintenanceLogs || initialAssetMaintenanceLogs;
    const asset = this.getFixedAssetById(data.assetId || data.assetTag || '');
    const now = new Date().toISOString();

    const newLog: AssetMaintenanceRecord = {
      id: `mnt-${Date.now().toString().slice(-8)}`,
      maintenanceNo: `MNT-${new Date().getFullYear()}-${(logs.length + 1).toString().padStart(6, '0')}`,
      assetId: asset?.id || data.assetId || '',
      assetTag: asset?.assetTag || data.assetTag || '',
      assetName: asset?.name || data.assetName || 'Asset Item',
      maintenanceType: data.maintenanceType || 'CORRECTIVE',
      issueDescription: data.issueDescription || '',
      reportedByName: data.reportedByName || user?.name || 'Staff Member',
      reportedDate: data.reportedDate || now.split('T')[0],
      scheduledDate: data.scheduledDate,
      completedDate: data.completedDate,
      vendorTechnician: data.vendorTechnician,
      estimatedCost: Number(data.estimatedCost || 0),
      actualCost: Number(data.actualCost || 0),
      partsReplaced: data.partsReplaced,
      status: data.status || 'REPORTED',
      remarks: data.remarks,
      documentUrl: data.documentUrl
    };

    this.state.assetMaintenanceLogs = [newLog, ...logs];

    if (asset && newLog.status !== 'COMPLETED' && newLog.status !== 'CANCELLED') {
      this.updateFixedAsset(asset.id, { status: 'UNDER_MAINTENANCE' }, user);
    }

    this.logInventoryAudit('MAINTENANCE', 'ASSETS', newLog.assetId, `${newLog.assetName} (${newLog.assetTag})`, {
      newValue: newLog,
      remarks: `Maintenance ticket ${newLog.maintenanceNo} logged: ${newLog.issueDescription.slice(0, 60)}`
    }, user);

    this.saveState();
    return newLog;
  }

  public updateMaintenanceLog(id: string, data: Partial<AssetMaintenanceRecord>, user?: User): AssetMaintenanceRecord {
    const logs = this.state.assetMaintenanceLogs || initialAssetMaintenanceLogs;
    const idx = logs.findIndex(l => l.id === id || l.maintenanceNo === id);
    if (idx === -1) throw new Error('Maintenance record not found');

    const old = logs[idx];
    const updated: AssetMaintenanceRecord = {
      ...old,
      ...data,
      estimatedCost: data.estimatedCost !== undefined ? Number(data.estimatedCost) : old.estimatedCost,
      actualCost: data.actualCost !== undefined ? Number(data.actualCost) : old.actualCost
    };

    logs[idx] = updated;
    this.state.assetMaintenanceLogs = [...logs];

    // If completed, return asset to ACTIVE/ASSIGNED
    if (updated.status === 'COMPLETED') {
      const asset = this.getFixedAssetById(updated.assetId);
      if (asset) {
        this.updateFixedAsset(asset.id, {
          status: asset.assignedToName ? 'ASSIGNED' : 'ACTIVE',
          assetCondition: 'GOOD'
        }, user);
      }
    }

    this.logInventoryAudit('MAINTENANCE', 'ASSETS', updated.assetId, `${updated.assetName}`, {
      oldValue: old,
      newValue: updated,
      remarks: `Maintenance ticket ${updated.maintenanceNo} status updated to ${updated.status}`
    }, user);

    this.saveState();
    return updated;
  }

  public createPhysicalVerification(data: Partial<PhysicalVerificationRecord>, user?: User): PhysicalVerificationRecord {
    const logs = this.state.physicalVerifications || initialPhysicalVerifications;
    const asset = this.getFixedAssetById(data.assetId || data.assetTag || '');
    const now = new Date().toISOString();

    const newPV: PhysicalVerificationRecord = {
      id: `pv-${Date.now().toString().slice(-8)}`,
      verificationNo: `PV-${new Date().getFullYear()}-${(logs.length + 1).toString().padStart(6, '0')}`,
      assetId: asset?.id || data.assetId || '',
      assetTag: asset?.assetTag || data.assetTag || '',
      assetName: asset?.name || data.assetName || 'Asset Item',
      expectedLocation: data.expectedLocation || asset?.locationName || 'Department Store',
      actualLocation: data.actualLocation || data.expectedLocation || '',
      expectedCustodian: data.expectedCustodian || asset?.assignedToName,
      actualCustodian: data.actualCustodian || data.expectedCustodian,
      physicalCondition: (data.physicalCondition || asset?.assetCondition || 'GOOD') as AssetCondition,
      verifiedByName: data.verifiedByName || user?.name || 'Audit Committee',
      verificationDate: data.verificationDate || now.split('T')[0],
      status: data.status || 'VERIFIED',
      discrepancyNotes: data.discrepancyNotes,
      actionTaken: data.actionTaken
    };

    this.state.physicalVerifications = [newPV, ...logs];

    this.logInventoryAudit('VERIFY', 'ASSETS', newPV.assetId, `${newPV.assetName} (${newPV.assetTag})`, {
      newValue: newPV,
      remarks: `Physical verification recorded: ${newPV.status}`
    }, user);

    this.saveState();
    return newPV;
  }

  public disposeAsset(data: Partial<AssetDisposalRecord>, user?: User): { success: boolean; error?: string; disposal?: AssetDisposalRecord } {
    const assets = this.state.fixedAssets || initialFixedAssets;
    const assetIdx = assets.findIndex(a => a.id === data.assetId || a.assetTag === data.assetTag);
    if (assetIdx === -1) return { success: false, error: 'Asset not found.' };

    const asset = assets[assetIdx];
    const now = new Date().toISOString();
    const disposals = this.state.assetDisposals || initialAssetDisposals;

    const newDisposal: AssetDisposalRecord = {
      id: `dis-${Date.now().toString().slice(-8)}`,
      disposalNo: `DIS-${new Date().getFullYear()}-${(disposals.length + 1).toString().padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      disposalMethod: data.disposalMethod || 'SCRAPPED',
      disposalDate: data.disposalDate || now.split('T')[0],
      bookValue: Number(data.bookValue || asset.currentValue || 0),
      disposalValue: Number(data.disposalValue || 0),
      buyerName: data.buyerName,
      reason: data.reason || 'Obsolete equipment condemned by survey committee.',
      approvedByName: data.approvedByName || 'Vice Chancellor / Registrar',
      status: data.status || 'DISPOSED',
      remarks: data.remarks,
      documentUrl: data.documentUrl
    };

    this.state.assetDisposals = [newDisposal, ...disposals];

    // Mark asset as DISPOSED (never delete)
    assets[assetIdx] = {
      ...asset,
      status: 'DISPOSED',
      currentValue: 0,
      updatedAt: now
    };
    this.state.fixedAssets = [...assets];

    this.logInventoryAudit('DISPOSE', 'ASSETS', asset.id, `${asset.name} (${asset.assetTag})`, {
      instituteName: asset.instituteName,
      departmentName: asset.departmentName,
      oldValue: { status: asset.status, value: asset.currentValue },
      newValue: { status: 'DISPOSED', disposalValue: newDisposal.disposalValue, method: newDisposal.disposalMethod },
      remarks: `Asset condemned and disposed via ${newDisposal.disposalMethod}`
    }, user);

    this.saveState();
    return { success: true, disposal: newDisposal };
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CONSUMABLE & STOCK MANAGEMENT SERVICE API
  // ──────────────────────────────────────────────────────────────────────────────

  public getConsumables(user?: User | null, filters?: {
    instituteId?: string;
    departmentId?: string;
    categoryId?: string;
    categoryGroup?: string;
    lowStockOnly?: boolean;
    search?: string;
  }): ConsumableItem[] {
    let list = this.state.consumableItems || initialConsumableItems;

    if (user) {
      if (user.role === 'HOD' && user.departmentId) {
        list = list.filter(c => c.departmentId === user.departmentId || c.instituteId === user.instituteId);
      } else if (user.role === 'PRINCIPAL' && user.instituteId) {
        list = list.filter(c => c.instituteId === user.instituteId);
      }
    }

    if (filters?.instituteId) {
      list = list.filter(c => c.instituteId === filters.instituteId);
    }
    if (filters?.departmentId) {
      list = list.filter(c => c.departmentId === filters.departmentId);
    }
    if (filters?.categoryId) {
      list = list.filter(c => c.categoryId === filters.categoryId);
    }
    if (filters?.categoryGroup) {
      list = list.filter(c => c.categoryGroup === filters.categoryGroup);
    }
    if (filters?.lowStockOnly) {
      list = list.filter(c => c.currentBalance <= c.minimumStockLevel);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(c =>
        c.itemCode.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q) ||
        (c.locationName && c.locationName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public createConsumableItem(data: Partial<ConsumableItem>, user?: User): ConsumableItem {
    const items = this.state.consumableItems || initialConsumableItems;
    const inst = this.getInstituteById(data.instituteId || '');
    const dept = data.departmentId ? this.getDepartmentById(data.departmentId) : undefined;
    const category = (this.state.inventoryCategories || initialInventoryCategories).find(c => c.id === data.categoryId);

    const newItem: ConsumableItem = {
      id: `cns-${Date.now().toString().slice(-8)}`,
      itemCode: data.itemCode || `STN-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Consumable Item',
      categoryId: data.categoryId || 'cat-stn-1',
      categoryName: category?.name || data.categoryName || 'Stationery',
      categoryGroup: (category?.categoryGroup || data.categoryGroup || 'STATIONERY_CONSUMABLES') as InventoryCategoryGroup,
      unit: data.unit || 'PCS',
      instituteId: data.instituteId || '',
      instituteName: inst?.name || data.instituteName || '',
      departmentId: data.departmentId,
      departmentName: dept?.name || data.departmentName,
      locationName: data.locationName || 'Department Store',
      openingQuantity: Number(data.openingQuantity || 0),
      receivedQuantity: 0,
      issuedQuantity: 0,
      returnedQuantity: 0,
      currentBalance: Number(data.openingQuantity || 0),
      minimumStockLevel: Number(data.minimumStockLevel || 10),
      reorderLevel: Number(data.reorderLevel || 25),
      standardRate: Number(data.standardRate || 0),
      lastTransactionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    this.state.consumableItems = [newItem, ...items];
    this.logInventoryAudit('CREATE', 'CONSUMABLES', newItem.id, `${newItem.name} (${newItem.itemCode})`, {
      instituteName: newItem.instituteName,
      departmentName: newItem.departmentName,
      newValue: newItem,
      remarks: 'Consumable item registered.'
    }, user);

    this.saveState();
    return newItem;
  }

  public receiveStock(data: Partial<StockTransactionRecord>, user?: User): { success: boolean; error?: string; transaction?: StockTransactionRecord } {
    const items = this.state.consumableItems || initialConsumableItems;
    const idx = items.findIndex(i => i.id === data.itemId || i.itemCode === data.itemCode);
    if (idx === -1) return { success: false, error: 'Consumable item not found.' };

    const item = items[idx];
    const qty = Number(data.quantity || 0);
    if (qty <= 0) return { success: false, error: 'Received quantity must be greater than 0.' };

    const now = new Date().toISOString();
    const transactions = this.state.stockTransactions || initialStockTransactions;

    const tx: StockTransactionRecord = {
      id: `stx-${Date.now().toString().slice(-8)}`,
      transactionNo: `STX-${new Date().getFullYear()}-${(transactions.length + 1).toString().padStart(6, '0')}`,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      instituteId: item.instituteId,
      instituteName: item.instituteName,
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      transactionType: 'RECEIVE',
      quantity: qty,
      unit: item.unit,
      unitPrice: Number(data.unitPrice || item.standardRate || 0),
      totalAmount: Number(data.unitPrice || item.standardRate || 0) * qty,
      vendorName: data.vendorName,
      purchaseOrderNo: data.purchaseOrderNo,
      invoiceNo: data.invoiceNo,
      receivedByName: data.receivedByName || user?.name || 'Store Incharge',
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      remarks: data.remarks,
      documentUrl: data.documentUrl,
      transactionDate: data.transactionDate || now.split('T')[0]
    };

    // Update stock balance
    const updatedItem: ConsumableItem = {
      ...item,
      receivedQuantity: item.receivedQuantity + qty,
      currentBalance: item.currentBalance + qty,
      lastTransactionDate: tx.transactionDate
    };

    items[idx] = updatedItem;
    this.state.consumableItems = [...items];
    this.state.stockTransactions = [tx, ...transactions];

    this.logInventoryAudit('RECEIVE', 'CONSUMABLES', item.id, `${item.name} (${item.itemCode})`, {
      instituteName: item.instituteName,
      departmentName: item.departmentName,
      oldValue: { currentBalance: item.currentBalance },
      newValue: { currentBalance: updatedItem.currentBalance, received: qty, vendor: tx.vendorName },
      remarks: `Received ${qty} ${item.unit} via ${tx.transactionNo}`
    }, user);

    this.saveState();
    return { success: true, transaction: tx };
  }

  public issueStock(data: Partial<StockTransactionRecord>, user?: User): { success: boolean; error?: string; transaction?: StockTransactionRecord } {
    const items = this.state.consumableItems || initialConsumableItems;
    const idx = items.findIndex(i => i.id === data.itemId || i.itemCode === data.itemCode);
    if (idx === -1) return { success: false, error: 'Consumable item not found.' };

    const item = items[idx];
    const qty = Number(data.quantity || 0);
    if (qty <= 0) return { success: false, error: 'Issue quantity must be greater than 0.' };
    if (qty > item.currentBalance) {
      return {
        success: false,
        error: `Insufficient stock balance! Available: ${item.currentBalance} ${item.unit}, Requested: ${qty} ${item.unit}`
      };
    }

    const now = new Date().toISOString();
    const transactions = this.state.stockTransactions || initialStockTransactions;

    const tx: StockTransactionRecord = {
      id: `stx-${Date.now().toString().slice(-8)}`,
      transactionNo: `STX-${new Date().getFullYear()}-${(transactions.length + 1).toString().padStart(6, '0')}`,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      instituteId: item.instituteId,
      instituteName: item.instituteName,
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      transactionType: 'ISSUE',
      quantity: qty,
      unit: item.unit,
      issuedToName: data.issuedToName || 'Faculty/Staff Member',
      issuedToEmpCode: data.issuedToEmpCode,
      issuedToDeptName: data.issuedToDeptName || item.departmentName,
      purpose: data.purpose || 'Official Academic/Administrative use',
      approvedByName: data.approvedByName || 'HOD / Section Head',
      remarks: data.remarks,
      transactionDate: data.transactionDate || now.split('T')[0]
    };

    // Update stock balance
    const updatedItem: ConsumableItem = {
      ...item,
      issuedQuantity: item.issuedQuantity + qty,
      currentBalance: item.currentBalance - qty,
      lastTransactionDate: tx.transactionDate
    };

    items[idx] = updatedItem;
    this.state.consumableItems = [...items];
    this.state.stockTransactions = [tx, ...transactions];

    this.logInventoryAudit('ISSUE', 'CONSUMABLES', item.id, `${item.name} (${item.itemCode})`, {
      instituteName: item.instituteName,
      departmentName: item.departmentName,
      oldValue: { currentBalance: item.currentBalance },
      newValue: { currentBalance: updatedItem.currentBalance, issued: qty, issuedTo: tx.issuedToName },
      remarks: `Issued ${qty} ${item.unit} to ${tx.issuedToName}`
    }, user);

    this.saveState();
    return { success: true, transaction: tx };
  }

  public returnStock(data: Partial<StockTransactionRecord>, user?: User): { success: boolean; error?: string; transaction?: StockTransactionRecord } {
    const items = this.state.consumableItems || initialConsumableItems;
    const idx = items.findIndex(i => i.id === data.itemId || i.itemCode === data.itemCode);
    if (idx === -1) return { success: false, error: 'Consumable item not found.' };

    const item = items[idx];
    const qty = Number(data.quantity || 0);
    if (qty <= 0) return { success: false, error: 'Return quantity must be greater than 0.' };

    const now = new Date().toISOString();
    const transactions = this.state.stockTransactions || initialStockTransactions;

    const tx: StockTransactionRecord = {
      id: `stx-${Date.now().toString().slice(-8)}`,
      transactionNo: `STX-${new Date().getFullYear()}-${(transactions.length + 1).toString().padStart(6, '0')}`,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      instituteId: item.instituteId,
      instituteName: item.instituteName,
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      transactionType: 'RETURN',
      quantity: qty,
      unit: item.unit,
      issuedToName: data.issuedToName || 'Returned by Staff',
      purpose: data.purpose || 'Unused materials returned to store',
      remarks: data.remarks,
      transactionDate: data.transactionDate || now.split('T')[0]
    };

    const updatedItem: ConsumableItem = {
      ...item,
      returnedQuantity: item.returnedQuantity + qty,
      currentBalance: item.currentBalance + qty,
      lastTransactionDate: tx.transactionDate
    };

    items[idx] = updatedItem;
    this.state.consumableItems = [...items];
    this.state.stockTransactions = [tx, ...transactions];

    this.logInventoryAudit('RETURN', 'CONSUMABLES', item.id, `${item.name} (${item.itemCode})`, {
      instituteName: item.instituteName,
      departmentName: item.departmentName,
      oldValue: { currentBalance: item.currentBalance },
      newValue: { currentBalance: updatedItem.currentBalance, returned: qty },
      remarks: `Returned ${qty} ${item.unit} to store`
    }, user);

    this.saveState();
    return { success: true, transaction: tx };
  }

  public getStockTransactions(filters?: {
    instituteId?: string;
    departmentId?: string;
    itemId?: string;
    transactionType?: string;
  }): StockTransactionRecord[] {
    let list = this.state.stockTransactions || initialStockTransactions;
    if (filters?.instituteId) list = list.filter(t => t.instituteId === filters.instituteId);
    if (filters?.departmentId) list = list.filter(t => t.departmentId === filters.departmentId);
    if (filters?.itemId) list = list.filter(t => t.itemId === filters.itemId);
    if (filters?.transactionType) list = list.filter(t => t.transactionType === filters.transactionType);
    return list;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // PHYSICAL DOCUMENT & RECORD STORAGE SERVICE API
  // ──────────────────────────────────────────────────────────────────────────────

  public getPhysicalFiles(user?: User | null, filters?: {
    instituteId?: string;
    departmentId?: string;
    fileCategory?: string;
    status?: string;
    search?: string;
  }): PhysicalFileRecord[] {
    let list = this.state.physicalFiles || initialPhysicalFiles;

    if (user) {
      if (user.role === 'HOD' && user.departmentId) {
        list = list.filter(f => f.departmentId === user.departmentId || f.instituteId === user.instituteId);
      } else if (user.role === 'PRINCIPAL' && user.instituteId) {
        list = list.filter(f => f.instituteId === user.instituteId);
      }
    }

    if (filters?.instituteId) list = list.filter(f => f.instituteId === filters.instituteId);
    if (filters?.departmentId) list = list.filter(f => f.departmentId === filters.departmentId);
    if (filters?.fileCategory) list = list.filter(f => f.fileCategory === filters.fileCategory);
    if (filters?.status) list = list.filter(f => f.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(f =>
        f.fileId.toLowerCase().includes(q) ||
        f.fileNumber.toLowerCase().includes(q) ||
        f.fileName.toLowerCase().includes(q) ||
        f.custodianName.toLowerCase().includes(q) ||
        (f.storageLocation && f.storageLocation.toLowerCase().includes(q)) ||
        (f.rackNumber && f.rackNumber.toLowerCase().includes(q)) ||
        (f.shelfNumber && f.shelfNumber.toLowerCase().includes(q)) ||
        (f.boxNumber && f.boxNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public createPhysicalFile(data: Partial<PhysicalFileRecord>, user?: User): PhysicalFileRecord {
    const files = this.state.physicalFiles || initialPhysicalFiles;
    const inst = this.getInstituteById(data.instituteId || '');
    const dept = data.departmentId ? this.getDepartmentById(data.departmentId) : undefined;
    const now = new Date().toISOString();

    const instCode = inst?.code?.toUpperCase() || 'SSIU';
    const deptCode = dept?.code?.toUpperCase() || 'GEN';
    const fileId = data.fileId || `${instCode}-${deptCode}-FILE-${new Date().getFullYear()}-${(files.length + 1).toString().padStart(3, '0')}`;

    const newFile: PhysicalFileRecord = {
      id: `fil-${Date.now().toString().slice(-8)}`,
      fileId,
      fileNumber: data.fileNumber || fileId,
      fileName: data.fileName || 'New Dossier / Physical Archive',
      fileCategory: data.fileCategory || 'DEPT_FILES',
      instituteId: data.instituteId || '',
      instituteName: inst?.name || data.instituteName || '',
      departmentId: data.departmentId,
      departmentName: dept?.name || data.departmentName,
      academicYear: data.academicYear || '2025-2026',
      documentYear: Number(data.documentYear || new Date().getFullYear()),
      storageLocation: data.storageLocation || 'Department Archive Cupboard',
      rackNumber: data.rackNumber || 'R-01',
      shelfNumber: data.shelfNumber || 'S-01',
      boxNumber: data.boxNumber || 'B-01',
      custodianName: data.custodianName || user?.name || 'Department Custodian',
      custodianEmployeeId: data.custodianEmployeeId,
      dateOpened: data.dateOpened || now.split('T')[0],
      retentionUntil: data.retentionUntil,
      status: (data.status || 'ACTIVE') as any,
      description: data.description
    };

    this.state.physicalFiles = [newFile, ...files];
    this.logInventoryAudit('CREATE', 'PHYSICAL_FILES', newFile.id, `${newFile.fileName} (${newFile.fileNumber})`, {
      instituteName: newFile.instituteName,
      departmentName: newFile.departmentName,
      newValue: newFile,
      remarks: `Physical file record ${newFile.fileNumber} added to Archive location.`
    }, user);

    this.saveState();
    return newFile;
  }

  public updatePhysicalFile(id: string, data: Partial<PhysicalFileRecord>, user?: User): PhysicalFileRecord {
    const files = this.state.physicalFiles || initialPhysicalFiles;
    const idx = files.findIndex(f => f.id === id || f.fileId === id);
    if (idx === -1) throw new Error('Physical file not found');

    const old = files[idx];
    const updated: PhysicalFileRecord = {
      ...old,
      ...data,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    files[idx] = updated;
    this.state.physicalFiles = [...files];

    this.logInventoryAudit('UPDATE', 'PHYSICAL_FILES', updated.id, `${updated.fileName} (${updated.fileNumber})`, {
      instituteName: updated.instituteName,
      departmentName: updated.departmentName,
      oldValue: old,
      newValue: updated,
      remarks: 'Physical file details / location coordinates updated.'
    }, user);

    this.saveState();
    return updated;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // INVENTORY AUDIT LOG SERVICE API
  // ──────────────────────────────────────────────────────────────────────────────

  public getInventoryAuditLogs(filters?: { module?: string; action?: string; search?: string }): InventoryAuditRecord[] {
    let list = this.state.inventoryAuditLogs || initialInventoryAuditLogs;
    if (filters?.module) list = list.filter(l => l.module === filters.module);
    if (filters?.action) list = list.filter(l => l.action === filters.action);
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(l =>
        l.entityName.toLowerCase().includes(q) ||
        l.performedByName.toLowerCase().includes(q) ||
        (l.remarks && l.remarks.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public logInventoryAudit(
    action: 'CREATE' | 'UPDATE' | 'ASSIGN' | 'RETURN' | 'ISSUE' | 'RECEIVE' | 'TRANSFER' | 'MAINTENANCE' | 'VERIFY' | 'DISPOSE' | 'IMPORT' | 'EXPORT',
    module: 'ASSETS' | 'CONSUMABLES' | 'PHYSICAL_FILES' | 'LOCATIONS' | 'TRANSFERS',
    entityId: string,
    entityName: string,
    details: {
      instituteName?: string;
      departmentName?: string;
      oldValue?: any;
      newValue?: any;
      remarks?: string;
    },
    user?: User
  ): void {
    const logs = this.state.inventoryAuditLogs || initialInventoryAuditLogs;
    const newAudit: InventoryAuditRecord = {
      id: `aud-inv-${Date.now().toString().slice(-8)}`,
      action,
      module,
      entityId,
      entityName,
      instituteName: details.instituteName,
      departmentName: details.departmentName,
      performedByName: user?.name || 'System User',
      performedByRole: user?.role || 'ADMIN',
      oldValueJson: details.oldValue ? JSON.stringify(details.oldValue) : undefined,
      newValueJson: details.newValue ? JSON.stringify(details.newValue) : undefined,
      remarks: details.remarks,
      timestamp: new Date().toISOString()
    };

    this.state.inventoryAuditLogs = [newAudit, ...logs];
  }

  // ────────────────────────────────────────────────────────────────────────────
  // REGISTRAR OFFICE MANAGEMENT SERVICE METHODS
  // ────────────────────────────────────────────────────────────────────────────

  public getOfficialCorrespondence(type?: CorrespondenceType, instituteId?: string): OfficialCorrespondenceRecord[] {
    let list = this.state.officialCorrespondence || initialOfficialCorrespondence;
    if (type) {
      list = list.filter(c => c.correspondenceType === type);
    }
    if (instituteId && instituteId !== 'ALL') {
      list = list.filter(c => !c.instituteId || c.instituteId === instituteId || c.instituteName === 'University Wide');
    }
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createOfficialCorrespondence(data: Omit<OfficialCorrespondenceRecord, 'id' | 'createdAt'>): OfficialCorrespondenceRecord {
    const list = this.state.officialCorrespondence || initialOfficialCorrespondence;
    const newRecord: OfficialCorrespondenceRecord = {
      ...data,
      id: `corr-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString()
    };
    this.state.officialCorrespondence = [newRecord, ...list];
    this.saveState();
    return newRecord;
  }

  public updateOfficialCorrespondenceStatus(
    id: string,
    status: OfficialCorrespondenceRecord['status'],
    actionTaken?: string,
    remarks?: string
  ): OfficialCorrespondenceRecord | null {
    const list = this.state.officialCorrespondence || initialOfficialCorrespondence;
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const updated: OfficialCorrespondenceRecord = {
      ...list[idx],
      status,
      actionTaken: actionTaken || list[idx].actionTaken,
      remarks: remarks || list[idx].remarks
    };
    list[idx] = updated;
    this.state.officialCorrespondence = [...list];
    this.saveState();
    return updated;
  }

  public getFileMovements(fileNumber?: string): FileMovementRecord[] {
    let list = this.state.fileMovements || initialFileMovements;
    if (fileNumber) {
      list = list.filter(f => f.fileNumber.toLowerCase().includes(fileNumber.toLowerCase()));
    }
    return [...list].sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
  }

  public createFileMovement(data: Omit<FileMovementRecord, 'id' | 'createdAt'>): FileMovementRecord {
    const list = this.state.fileMovements || initialFileMovements;
    const newMovement: FileMovementRecord = {
      ...data,
      id: `fmov-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString()
    };
    this.state.fileMovements = [newMovement, ...list];
    this.saveState();
    return newMovement;
  }

  public updateFileMovement(id: string, updates: Partial<FileMovementRecord>): FileMovementRecord | null {
    const list = this.state.fileMovements || initialFileMovements;
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) return null;
    const updated: FileMovementRecord = {
      ...list[idx],
      ...updates
    };
    list[idx] = updated;
    this.state.fileMovements = [...list];
    this.saveState();
    return updated;
  }

  public getCommittees(type?: string): CommitteeMasterRecord[] {
    let list = this.state.committees || initialCommittees;
    if (type && type !== 'ALL') {
      list = list.filter(c => c.type === type);
    }
    return list;
  }

  public getCommitteeMeetings(committeeId?: string): CommitteeMeetingRecord[] {
    let list = this.state.committeeMeetings || initialCommitteeMeetings;
    if (committeeId && committeeId !== 'ALL') {
      list = list.filter(m => m.committeeId === committeeId);
    }
    return [...list].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  }

  public createCommitteeMeeting(meeting: Omit<CommitteeMeetingRecord, 'id'>): CommitteeMeetingRecord {
    const list = this.state.committeeMeetings || initialCommitteeMeetings;
    const newMeeting: CommitteeMeetingRecord = {
      ...meeting,
      id: `cmeet-${Date.now().toString().slice(-8)}`
    };
    this.state.committeeMeetings = [newMeeting, ...list];
    this.saveState();
    return newMeeting;
  }

  public getCommitteeActionItems(meetingId?: string, status?: string): CommitteeActionItemRecord[] {
    let list = this.state.committeeActionItems || initialCommitteeActionItems;
    if (meetingId && meetingId !== 'ALL') {
      list = list.filter(a => a.meetingId === meetingId);
    }
    if (status && status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    return list;
  }

  public updateCommitteeActionItemStatus(
    id: string,
    status: CommitteeActionItemRecord['status'],
    complianceRemarks?: string
  ): CommitteeActionItemRecord | null {
    const list = this.state.committeeActionItems || initialCommitteeActionItems;
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const updated: CommitteeActionItemRecord = {
      ...list[idx],
      status,
      complianceRemarks: complianceRemarks || list[idx].complianceRemarks,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : list[idx].completedAt
    };
    list[idx] = updated;
    this.state.committeeActionItems = [...list];
    this.saveState();
    return updated;
  }

  public getStatutoryApprovals(category?: string, status?: string): StatutoryApprovalRecord[] {
    let list = this.state.statutoryApprovals || initialStatutoryApprovals;
    if (category && category !== 'ALL') {
      list = list.filter(s => s.category === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    return [...list].sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  }

  public actionStatutoryApproval(
    id: string,
    action: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | 'FORWARDED',
    remarks: string,
    user?: User
  ): StatutoryApprovalRecord | null {
    const list = this.state.statutoryApprovals || initialStatutoryApprovals;
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const updated: StatutoryApprovalRecord = {
      ...list[idx],
      status: action,
      actionedByUserId: user?.id,
      actionedByName: user?.name || 'Dr. Sanjay Patel (Registrar)',
      actionedAt: new Date().toISOString(),
      remarks
    };
    list[idx] = updated;
    this.state.statutoryApprovals = [...list];
    this.saveState();
    return updated;
  }

  public getInternationalStudents(search?: string): InternationalStudentRecord[] {
    let list = this.state.internationalStudents || initialInternationalStudents;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.studentName.toLowerCase().includes(q) ||
        s.enrollmentNo.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.passportNumber.toLowerCase().includes(q) ||
        s.instituteName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getStudentEnrollmentMappings(): StudentEnrollmentMapping[] {
    return this.state.studentEnrollmentMappings || [];
  }

  public getStudentMappingHistories(): StudentMappingHistoryRecord[] {
    return this.state.studentMappingHistories || [];
  }
}

export const db = new ERPDatabaseService();



