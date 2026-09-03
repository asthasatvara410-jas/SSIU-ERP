export type RegistrarOfficeRoleLevel = 
  | 'REGISTRAR' 
  | 'DEPUTY_REGISTRAR' 
  | 'ASSISTANT_REGISTRAR' 
  | 'SECTION_OFFICER' 
  | 'OFFICE_STAFF';

export type WorkItemStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'RETURNED' 
  | 'REJECTED' 
  | 'ESCALATED' 
  | 'OVERDUE';

export type WorkItemPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type WorkItemType = 
  | 'TASK' 
  | 'FILE' 
  | 'APPLICATION' 
  | 'REQUEST' 
  | 'CASE' 
  | 'CORRESPONDENCE' 
  | 'APPROVAL' 
  | 'ACADEMIC_MATTER' 
  | 'ADMINISTRATIVE_MATTER'
  | 'STATUTORY_COMPLIANCE';

export interface RegistrarOffice {
  id: string;
  universityId: string;
  officeName: string;
  officeCode: string;
  registrarUserId: string;
  registrarName: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RegistrarOfficeSection {
  id: string;
  officeId: string;
  sectionCode: string;
  sectionName: string;
  sectionHeadUserId?: string;
  sectionHeadName?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RegistrarOfficePosition {
  id: string;
  positionCode: string;
  positionTitle: string;
  level: number; // 1 = Registrar, 2 = Deputy Registrar, 3 = Assistant Registrar, 4 = Section Officer, 5 = Staff
  roleLevel: RegistrarOfficeRoleLevel;
  reportsToPositionId?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RegistrarOfficeStaff {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  officeId: string;
  sectionId: string;
  sectionName: string;
  positionId: string;
  positionTitle: string;
  roleLevel: RegistrarOfficeRoleLevel;
  reportingToUserId?: string;
  reportingToName?: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED' | 'INACTIVE';
  qualifications?: string;
  roomNumber?: string;
}

export interface RegistrarOfficeResponsibility {
  id: string;
  code: string;
  title: string;
  category: 'ACADEMIC' | 'ADMINISTRATIVE' | 'EXAMINATION' | 'AFFILIATION' | 'LEGAL' | 'COMPLIANCE' | 'RECORDS' | 'GENERAL';
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RegistrarStaffResponsibilityAssignment {
  id: string;
  staffId: string;
  userId: string;
  staffName: string;
  responsibilityId: string;
  responsibilityTitle: string;
  category: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedDate: string;
  startDate: string;
  endDate?: string;
  priority: WorkItemPriority;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED';
  remarks?: string;
}

export interface RegistrarWorkItemHistoryEntry {
  id: string;
  action: string;
  performedByUserId: string;
  performedByName: string;
  timestamp: string;
  notes?: string;
  previousStatus?: WorkItemStatus;
  newStatus?: WorkItemStatus;
}

export interface RegistrarOfficeWorkItem {
  id: string;
  workNumber: string;
  title: string;
  description: string;
  workType: WorkItemType;
  priority: WorkItemPriority;
  sectionId: string;
  sectionName: string;
  assignedToStaffId: string;
  assignedToUserId: string;
  assignedToName: string;
  assignedByUserId: string;
  assignedByName: string;
  dueDate: string;
  status: WorkItemStatus;
  createdAt: string;
  completedAt?: string;
  escalatedToUserId?: string;
  escalatedToName?: string;
  escalationReason?: string;
  remarks?: string;
  history: RegistrarWorkItemHistoryEntry[];
}

export interface RegistrarOfficeAuditLog {
  id: string;
  action: string;
  performedByUserId: string;
  performedByName: string;
  targetStaffId?: string;
  targetStaffName?: string;
  details: string;
  timestamp: string;
}
