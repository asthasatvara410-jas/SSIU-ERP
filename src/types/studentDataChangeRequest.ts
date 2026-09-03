// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT DATA CHANGE REQUEST & APPROVAL TYPES
// ==============================================================================

export type DataChangeCategory =
  | 'PERSONAL'
  | 'CONTACT'
  | 'PARENT'
  | 'ACADEMIC'
  | 'OTHER';

export type DataChangeStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MENTOR_PENDING'
  | 'MENTOR_APPROVED'
  | 'HOD_PENDING'
  | 'APPROVED'
  | 'REJECTED_BY_MENTOR'
  | 'REJECTED_BY_HOD'
  | 'SENT_BACK'
  | 'CANCELLED';

export interface StudentDataChangeAuditLog {
  id: string;
  requestId: string;
  studentId: string;
  action: string; // 'CREATED' | 'MENTOR_APPROVED' | 'MENTOR_REJECTED' | 'MENTOR_SENT_BACK' | 'HOD_APPROVED' | 'HOD_REJECTED' | 'HOD_SENT_BACK' | 'CANCELLED'
  fromStatus: string;
  toStatus: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string; // 'STUDENT' | 'MENTOR' | 'HOD' | 'PRINCIPAL' | 'SUPER_ADMIN'
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface StudentDataChangeRequest {
  id: string;
  requestNo: string; // e.g. DCR-2026-000001
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  studentEmail?: string;
  studentPhone?: string;
  departmentId?: string;
  departmentName?: string;
  instituteId?: string;
  instituteName?: string;
  programName?: string;
  semesterName?: string;
  divisionName?: string;

  fieldCategory: DataChangeCategory;
  fieldName: string; // e.g. 'phone', 'address', 'bloodGroup', 'fatherName'
  fieldLabel: string; // e.g. 'Mobile Number', 'Permanent Address'
  oldValue: string;
  newValue: string;
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  status: DataChangeStatus;

  // Mentor Review Details
  mentorId?: string;
  mentorName?: string;
  mentorRemarks?: string;
  mentorActionAt?: string;

  // HOD Final Approval Details
  hodId?: string;
  hodName?: string;
  hodRemarks?: string;
  hodActionAt?: string;

  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  auditLogs?: StudentDataChangeAuditLog[];
}

export interface DataChangeFieldDef {
  key: string;
  label: string;
  category: DataChangeCategory;
  inputType: 'text' | 'tel' | 'email' | 'date' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  requiresAttachment?: boolean;
  helpText?: string;
  studentFieldMapping?: string; // Property name on Student model
}

export const DATA_CHANGE_FIELD_CATALOG: DataChangeFieldDef[] = [
  // PERSONAL
  {
    key: 'studentName',
    label: 'Student Full Name',
    category: 'PERSONAL',
    inputType: 'text',
    requiresAttachment: true,
    helpText: 'Official name change requires valid Government ID (Aadhaar / Passport / Gazette Notification).',
    studentFieldMapping: 'name',
  },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    category: 'PERSONAL',
    inputType: 'date',
    requiresAttachment: true,
    helpText: 'Requires 10th Marksheet or Birth Certificate as proof.',
    studentFieldMapping: 'dateOfBirth',
  },
  {
    key: 'gender',
    label: 'Gender',
    category: 'PERSONAL',
    inputType: 'select',
    options: [
      { label: 'Male', value: 'Male' },
      { label: 'Female', value: 'Female' },
      { label: 'Other', value: 'Other' },
    ],
    studentFieldMapping: 'gender',
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    category: 'PERSONAL',
    inputType: 'select',
    options: [
      { label: 'A+', value: 'A+' },
      { label: 'A-', value: 'A-' },
      { label: 'B+', value: 'B+' },
      { label: 'B-', value: 'B-' },
      { label: 'O+', value: 'O+' },
      { label: 'O-', value: 'O-' },
      { label: 'AB+', value: 'AB+' },
      { label: 'AB-', value: 'AB-' },
    ],
    requiresAttachment: true,
    helpText: 'Attach verified Blood Group Test Report.',
    studentFieldMapping: 'bloodGroup',
  },
  {
    key: 'category',
    label: 'Social Category (Caste / Quota)',
    category: 'PERSONAL',
    inputType: 'select',
    options: [
      { label: 'General / Open', value: 'OPEN' },
      { label: 'SEBC / OBC', value: 'SEBC' },
      { label: 'SC (Scheduled Caste)', value: 'SC' },
      { label: 'ST (Scheduled Tribe)', value: 'ST' },
      { label: 'EWS (Economically Weaker Section)', value: 'EWS' },
    ],
    requiresAttachment: true,
    helpText: 'Attach official Caste / Category Certificate issued by Competent Authority.',
  },
  {
    key: 'nationality',
    label: 'Nationality / Citizenship',
    category: 'PERSONAL',
    inputType: 'text',
    requiresAttachment: true,
    studentFieldMapping: 'nationality',
  },

  // CONTACT
  {
    key: 'phone',
    label: 'Primary Mobile Number',
    category: 'CONTACT',
    inputType: 'tel',
    helpText: 'Used for all official ERP OTPs, SMS notifications, and fee receipts.',
    studentFieldMapping: 'phone',
  },
  {
    key: 'alternatePhone',
    label: 'Alternate Mobile Number',
    category: 'CONTACT',
    inputType: 'tel',
  },
  {
    key: 'whatsappNumber',
    label: 'WhatsApp Number',
    category: 'CONTACT',
    inputType: 'tel',
  },
  {
    key: 'email',
    label: 'Personal / Communication Email',
    category: 'CONTACT',
    inputType: 'email',
    studentFieldMapping: 'email',
  },
  {
    key: 'address',
    label: 'Permanent Address',
    category: 'CONTACT',
    inputType: 'textarea',
    requiresAttachment: true,
    helpText: 'Attach Electricity Bill, Ration Card, Aadhaar, or Rental Agreement.',
    studentFieldMapping: 'address',
  },
  {
    key: 'city',
    label: 'City / Village',
    category: 'CONTACT',
    inputType: 'text',
  },
  {
    key: 'state',
    label: 'State',
    category: 'CONTACT',
    inputType: 'text',
  },
  {
    key: 'pincode',
    label: 'Postal Pincode',
    category: 'CONTACT',
    inputType: 'text',
  },

  // PARENT / GUARDIAN
  {
    key: 'fatherName',
    label: "Father's Full Name",
    category: 'PARENT',
    inputType: 'text',
    requiresAttachment: true,
    helpText: 'Attach father identity proof.',
    studentFieldMapping: 'guardianName',
  },
  {
    key: 'fatherPhone',
    label: "Father's Mobile Number",
    category: 'PARENT',
    inputType: 'tel',
    studentFieldMapping: 'guardianPhone',
  },
  {
    key: 'motherName',
    label: "Mother's Full Name",
    category: 'PARENT',
    inputType: 'text',
  },
  {
    key: 'motherPhone',
    label: "Mother's Mobile Number",
    category: 'PARENT',
    inputType: 'tel',
  },
  {
    key: 'guardianName',
    label: 'Local Guardian Name',
    category: 'PARENT',
    inputType: 'text',
    studentFieldMapping: 'guardianName',
  },
  {
    key: 'guardianPhone',
    label: 'Local Guardian Contact Number',
    category: 'PARENT',
    inputType: 'tel',
    studentFieldMapping: 'guardianPhone',
  },

  // ACADEMIC
  {
    key: 'abcId',
    label: 'Academic Bank of Credits (ABC) ID',
    category: 'ACADEMIC',
    inputType: 'text',
    requiresAttachment: true,
    helpText: '12-digit DigiLocker ABC/APAAR ID. Attach DigiLocker PDF proof.',
    studentFieldMapping: 'abcId',
  },
  {
    key: 'previousQualification',
    label: 'Prior Qualification / Board Details',
    category: 'ACADEMIC',
    inputType: 'textarea',
    requiresAttachment: true,
    helpText: 'Attach official 10th/12th/Diploma Certificate.',
  },
  {
    key: 'otherMasterDetail',
    label: 'Other Master Profile Information',
    category: 'OTHER',
    inputType: 'textarea',
    requiresAttachment: true,
  },
];
