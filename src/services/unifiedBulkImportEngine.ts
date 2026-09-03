import * as XLSX from 'xlsx';
import { db } from './db';
import {
  BulkImportType,
  BulkImportMode,
  BulkImportRowStatus,
  BulkImportSession,
  BulkImportRowItem,
  BulkImportTemplateMeta,
  User,
  UserRole,
  Student,
  Faculty,
  Department,
  Program,
  Subject,
  FixedAsset,
  ConsumableItem,
  BulkImportPermission,
  ROLE_BULK_IMPORT_PERMISSIONS,
  MODULE_TO_BULK_PERMISSION
} from '../types';

/**
 * Result returned during preview phase
 */
export interface BulkImportPreviewResult {
  session: BulkImportSession;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newRecords: number;
  existingRecords: number;
  warningsCount: number;
  rows: BulkImportRowItem[];
  templateValid: boolean;
  templateErrors?: string[];
}

/**
 * Interface that every module-specific import handler must implement
 */
export interface IModuleImportHandler {
  type: BulkImportType;
  name: string;
  fileName: string;
  description: string;
  headers: string[];
  requiredHeaders: string[];
  sampleRows: any[][];
  instructions: { field: string; required: string; description: string; example: string }[];
  
  validateRow(
    raw: Record<string, any>,
    seenKeys: Set<string>,
    mode: BulkImportMode,
    user: User | null,
    role: UserRole | null
  ): {
    status: BulkImportRowStatus;
    parsedData?: Record<string, any>;
    errorMessage?: string;
    errorField?: string;
    warningMessage?: string;
    isExisting?: boolean;
    targetId?: string;
  };

  commitRecord(
    data: Record<string, any>,
    mode: BulkImportMode,
    user: User | null,
    role: UserRole | null
  ): { targetId: string; action: 'CREATED' | 'UPDATED' };
}

// ─── HELPER: STRING CLEANER ──────────────────────────────────────────────────
const getVal = (raw: Record<string, any>, aliases: string[]): string => {
  for (const alias of aliases) {
    if (raw[alias] !== undefined && raw[alias] !== null && String(raw[alias]).trim() !== '') {
      return String(raw[alias]).trim();
    }
  }
  return '';
};

// ─── MODULE HANDLER 1: STUDENT MASTER ────────────────────────────────────────
const StudentHandler: IModuleImportHandler = {
  type: 'STUDENT',
  name: 'Student Master & Enrollment Directory',
  fileName: 'Student_Import_Template.xlsx',
  description: 'Bulk register student admissions, personal profiles, academic placements, and ABC IDs.',
  headers: [
    'Enrollment Number', 'Student Name', 'Email', 'Mobile Number', 'Gender',
    'Date of Birth (YYYY-MM-DD)', 'Blood Group', 'Address', 'Institute Code',
    'Department Code', 'Program Code', 'Academic Year', 'Semester', 'Division',
    'Batch', 'Guardian Name', 'Guardian Phone', 'ABC ID', 'Nationality',
    'Student Type', 'Status'
  ],
  requiredHeaders: [
    'Enrollment Number', 'Student Name', 'Email', 'Mobile Number',
    'Institute Code', 'Department Code', 'Program Code'
  ],
  sampleRows: [
    [
      '240101001', 'Aarav Sharma', 'aarav.sharma@swarrnim.edu.in', '9876543210', 'Male',
      '2004-05-15', 'O+', 'Gandhinagar, Gujarat', 'SIT', 'CSE',
      'BTECH_CSE', '2024-2025', 'SEM-1', 'Div A', '2024-2028',
      'Mr. Ramesh Sharma', '9876543211', '984210567890', 'Indian',
      'DOMESTIC', 'ACTIVE'
    ],
    [
      '240101002', 'Priya Patel', 'priya.patel@swarrnim.edu.in', '9876543212', 'Female',
      '2004-08-22', 'A+', 'Ahmedabad, Gujarat', 'SIT', 'CSE',
      'BTECH_CSE', '2024-2025', 'SEM-1', 'Div A', '2024-2028',
      'Mr. Kirit Patel', '9876543213', '984210567891', 'Indian',
      'DOMESTIC', 'ACTIVE'
    ],
    [
      '240101003', 'John Doe', 'john.doe@swarrnim.edu.in', '9876543214', 'Male',
      '2003-11-10', 'B+', 'International House, Gandhinagar', 'SIT', 'CSE',
      'BTECH_CSE', '2024-2025', 'SEM-1', 'Div B', '2024-2028',
      'Mr. David Doe', '9876543215', '', 'Nigerian',
      'INTERNATIONAL', 'ACTIVE'
    ]
  ],
  instructions: [
    { field: 'Enrollment Number', required: 'YES', description: 'Unique university roll / enrollment number', example: '240101001' },
    { field: 'Student Name', required: 'YES', description: 'Full candidate name', example: 'Aarav Sharma' },
    { field: 'Email', required: 'YES', description: 'Valid primary email address', example: 'aarav.sharma@swarrnim.edu.in' },
    { field: 'Mobile Number', required: 'YES', description: '10-digit mobile number', example: '9876543210' },
    { field: 'Institute Code', required: 'YES', description: 'Must match Institute Code in ERP (e.g. SIT, SAL)', example: 'SIT' },
    { field: 'Department Code', required: 'YES', description: 'Must belong to selected Institute (e.g. CSE, MECH)', example: 'CSE' },
    { field: 'Program Code', required: 'YES', description: 'Must belong to Department / Institute (e.g. BTECH_CSE)', example: 'BTECH_CSE' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const enrollmentNo = getVal(raw, ['Enrollment Number', 'enrollmentNo', 'EnrollmentNo', 'Roll Number']);
    const name = getVal(raw, ['Student Name', 'name', 'Name', 'FullName']);
    const email = getVal(raw, ['Email', 'email', 'Email Address']);
    const phone = getVal(raw, ['Mobile Number', 'mobile', 'Mobile', 'Phone', 'phone']);
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const programCode = getVal(raw, ['Program Code', 'programCode', 'Program']);
    const gender = getVal(raw, ['Gender', 'gender']) || 'Male';
    const dob = getVal(raw, ['Date of Birth (YYYY-MM-DD)', 'dateOfBirth', 'Date of Birth', 'DOB']);
    const bloodGroup = getVal(raw, ['Blood Group', 'bloodGroup']) || 'O+';
    const address = getVal(raw, ['Address', 'address']);
    const guardianName = getVal(raw, ['Guardian Name', 'guardianName', 'Father Name']);
    const guardianPhone = getVal(raw, ['Guardian Phone', 'guardianPhone', 'Parent Mobile']) || phone;
    const abcId = getVal(raw, ['ABC ID', 'abcId', 'Academic Bank of Credits ID']);
    const nationality = getVal(raw, ['Nationality', 'nationality']) || 'Indian';
    const studentType = (getVal(raw, ['Student Type', 'studentType']) || 'DOMESTIC').toUpperCase();
    const status = (getVal(raw, ['Status', 'status', 'Student Status']) || 'ACTIVE').toUpperCase();

    // 1. Mandatory Field Checks
    if (!enrollmentNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Student Name', errorMessage: 'Student Name is required.' };
    if (!email || !email.includes('@') || !email.includes('.')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'A valid email address is required.' };
    if (!phone || phone.length < 10) return { status: 'INVALID', errorField: 'Mobile Number', errorMessage: 'A valid 10-digit mobile number is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };
    if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };
    if (!programCode) return { status: 'INVALID', errorField: 'Program Code', errorMessage: 'Program Code is required.' };

    // 2. In-Sheet Duplicate Check
    if (seenKeys.has(enrollmentNo)) {
      return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Duplicate Enrollment Number "${enrollmentNo}" inside the uploaded file.` };
    }
    seenKeys.add(enrollmentNo);

    // 3. Database Reference & Relationship Verification
    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) {
      return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" does not exist in the ERP database.` };
    }

    // Role Scope Verification
    if (role === 'PRINCIPAL' && user?.instituteId && institute.id !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Unauthorized: You are only permitted to import students for Institute "${user.instituteId}".` };
    }

    const departments = db.getDepartments();
    const department = departments.find(d => 
      (d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode) &&
      d.instituteId === institute.id
    );
    if (!department) {
      return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" does not exist under Institute "${institute.code}".` };
    }

    if (role === 'HOD' && user?.departmentId && department.id !== user.departmentId) {
      return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Unauthorized: HOD can only import students for Department "${user.departmentId}".` };
    }

    const programs = db.getPrograms();
    const program = programs.find(p =>
      (p.code.toUpperCase() === programCode.toUpperCase() || p.id === programCode) &&
      p.instituteId === institute.id &&
      (!p.departmentId || p.departmentId === department.id)
    );
    if (!program) {
      return { status: 'INVALID', errorField: 'Program Code', errorMessage: `Program "${programCode}" does not belong to Department "${department.code}" / Institute "${institute.code}".` };
    }

    // Resolve optional batch, semester, division
    const batches = db.getBatches();
    const batch = batches.find(b => b.programId === program.id) || batches[0];
    const semesters = db.getSemesters();
    const semester = semesters.find(s => s.programId === program.id) || semesters[0];
    const divisions = db.getDivisions();
    const division = divisions.find(d => d.programId === program.id) || divisions[0];
    const academicYears = db.getAcademicYears();
    const currentAY = academicYears.find(ay => ay.isCurrent) || academicYears[0];

    // 4. Duplicate Check against Database
    const existing = db.getStudents().find(s => s.enrollmentNo === enrollmentNo);

    if (existing) {
      if (mode === 'INSERT_ONLY') {
        return {
          status: 'DUPLICATE',
          errorField: 'Enrollment Number',
          errorMessage: `Student with Enrollment Number "${enrollmentNo}" already exists in ERP. Choose Update mode to modify.`,
          isExisting: true,
          targetId: existing.id
        };
      }
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          enrollmentNo,
          name,
          email,
          phone,
          gender: gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male',
          dateOfBirth: dob || existing.dateOfBirth || '2004-01-01',
          bloodGroup,
          address: address || existing.address || '',
          admissionDate: existing.admissionDate || '2024-07-15',
          instituteId: institute.id,
          departmentId: department.id,
          programId: program.id,
          academicYearId: currentAY?.id || 'ay-2024-2025',
          batchId: batch?.id || 'batch-1',
          semesterId: semester?.id || 'sem-1',
          divisionId: division?.id || 'div-1',
          guardianName: guardianName || existing.guardianName || 'Parent',
          guardianPhone: guardianPhone || existing.guardianPhone || phone,
          abcId: abcId || existing.abcId,
          nationality,
          studentType: studentType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
          status: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED'].includes(status) ? status : 'ACTIVE'
        }
      };
    }

    if (mode === 'UPDATE_ONLY') {
      return {
        status: 'INVALID',
        errorField: 'Enrollment Number',
        errorMessage: `Student "${enrollmentNo}" does not exist in ERP. (Skipped under Update Only mode).`
      };
    }

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        enrollmentNo,
        name,
        email,
        phone,
        gender: gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male',
        dateOfBirth: dob || '2004-01-01',
        bloodGroup,
        address: address || 'Gandhinagar, Gujarat',
        admissionDate: '2024-07-15',
        instituteId: institute.id,
        departmentId: department.id,
        programId: program.id,
        academicYearId: currentAY?.id || 'ay-2024-2025',
        batchId: batch?.id || 'batch-1',
        semesterId: semester?.id || 'sem-1',
        divisionId: division?.id || 'div-1',
        guardianName: guardianName || 'Parent',
        guardianPhone: guardianPhone || phone,
        abcId: abcId || '',
        nationality,
        studentType: studentType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
        status: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED'].includes(status) ? status : 'ACTIVE'
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const students = db.getStudents();
    const existingIndex = students.findIndex(s => s.enrollmentNo === data.enrollmentNo);

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = students[existingIndex];
      const updated: Student = {
        ...existing,
        ...data,
        id: existing.id
      };
      students[existingIndex] = updated;

      // Sync corresponding Student User account if present
      const users = db.getUsers();
      const userIndex = users.findIndex(u => u.enrollmentNo === data.enrollmentNo || u.email === data.email);
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          name: data.name,
          email: data.email,
          phone: data.phone,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          programId: data.programId
        };
      }

      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newStudent: Student = {
        ...data as any,
        id: newId
      };
      students.unshift(newStudent);

      // Create synchronized student login user account if none exists
      const users = db.getUsers();
      const userExists = users.some(u => u.enrollmentNo === data.enrollmentNo || u.email === data.email);
      if (!userExists) {
        users.push({
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: data.name,
          email: data.email,
          username: data.enrollmentNo,
          role: 'STUDENT',
          phone: data.phone,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          programId: data.programId,
          enrollmentNo: data.enrollmentNo,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }

      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 2: FACULTY MASTER ────────────────────────────────────────
const FacultyHandler: IModuleImportHandler = {
  type: 'FACULTY',
  name: 'Faculty & Academic Staff Master',
  fileName: 'Faculty_Import_Template.xlsx',
  description: 'Bulk register faculty members, designations, qualifications, and teaching profiles.',
  headers: [
    'Employee ID', 'Faculty Name', 'Email', 'Mobile Number', 'Designation',
    'Institute Code', 'Department Code', 'Qualification', 'Specialization',
    'Experience Years', 'Joining Date (YYYY-MM-DD)', 'Status'
  ],
  requiredHeaders: ['Employee ID', 'Faculty Name', 'Email', 'Institute Code', 'Department Code'],
  sampleRows: [
    [
      'EMP-101', 'Dr. Rajesh Kumar', 'rajesh.kumar@swarrnim.edu.in', '9811223344', 'Professor',
      'SIT', 'CSE', 'Ph.D. in Computer Science', 'Artificial Intelligence & Machine Learning',
      12.5, '2020-06-01', 'ACTIVE'
    ],
    [
      'EMP-102', 'Prof. Sunita Rao', 'sunita.rao@swarrnim.edu.in', '9822334455', 'Associate Professor',
      'SIT', 'CSE', 'M.Tech CSE', 'Cloud Computing & Cyber Security',
      8.0, '2022-01-15', 'ACTIVE'
    ]
  ],
  instructions: [
    { field: 'Employee ID', required: 'YES', description: 'Unique faculty code', example: 'EMP-101' },
    { field: 'Faculty Name', required: 'YES', description: 'Full staff name with prefix', example: 'Dr. Rajesh Kumar' },
    { field: 'Email', required: 'YES', description: 'Official institutional email', example: 'rajesh.kumar@swarrnim.edu.in' },
    { field: 'Institute Code', required: 'YES', description: 'Valid Institute Code', example: 'SIT' },
    { field: 'Department Code', required: 'YES', description: 'Valid Department Code', example: 'CSE' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const employeeId = getVal(raw, ['Employee ID', 'employeeId', 'EmployeeCode', 'Emp ID']);
    const name = getVal(raw, ['Faculty Name', 'name', 'Name', 'FullName']);
    const email = getVal(raw, ['Email', 'email', 'Email Address']);
    const phone = getVal(raw, ['Mobile Number', 'mobile', 'Mobile', 'Phone', 'phone']);
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const designation = (getVal(raw, ['Designation', 'designation']) || 'Assistant Professor') as Faculty['designation'];
    const qualification = getVal(raw, ['Qualification', 'qualification']) || 'M.Tech / Post Graduate';
    const specialization = getVal(raw, ['Specialization', 'specialization']) || 'Academic Domain';
    const experienceYears = Number(getVal(raw, ['Experience Years', 'experienceYears'])) || 3;
    const joiningDate = getVal(raw, ['Joining Date (YYYY-MM-DD)', 'joiningDate']) || '2023-01-01';
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as Faculty['status'];

    if (!employeeId) return { status: 'INVALID', errorField: 'Employee ID', errorMessage: 'Employee ID is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Faculty Name', errorMessage: 'Faculty Name is required.' };
    if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };
    if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

    if (seenKeys.has(employeeId)) {
      return { status: 'DUPLICATE', errorField: 'Employee ID', errorMessage: `Duplicate Employee ID "${employeeId}" in file.` };
    }
    seenKeys.add(employeeId);

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) {
      return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" not found.` };
    }

    if (role === 'PRINCIPAL' && user?.instituteId && institute.id !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Unauthorized: Principal can only manage Institute "${user.instituteId}".` };
    }

    const departments = db.getDepartments();
    const department = departments.find(d => 
      (d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode) &&
      d.instituteId === institute.id
    );
    if (!department) {
      return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" does not belong to Institute "${institute.code}".` };
    }

    if (role === 'HOD' && user?.departmentId && department.id !== user.departmentId) {
      return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Unauthorized: HOD can only manage Department "${user.departmentId}".` };
    }

    const existing = db.getFaculty().find(f => f.employeeId === employeeId || f.id === employeeId);

    if (existing) {
      if (mode === 'INSERT_ONLY') {
        return {
          status: 'DUPLICATE',
          errorField: 'Employee ID',
          errorMessage: `Faculty "${employeeId}" already exists in ERP.`,
          isExisting: true,
          targetId: existing.id
        };
      }
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          employeeId,
          name,
          email,
          phone: phone || existing.phone || '9876543210',
          designation,
          instituteId: institute.id,
          departmentId: department.id,
          qualification,
          specialization,
          experienceYears,
          joiningDate,
          subjectIds: existing.subjectIds || [],
          status: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'].includes(status) ? status : 'ACTIVE'
        }
      };
    }

    if (mode === 'UPDATE_ONLY') {
      return { status: 'INVALID', errorField: 'Employee ID', errorMessage: `Faculty "${employeeId}" does not exist in ERP.` };
    }

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        employeeId,
        name,
        email,
        phone: phone || '9876543210',
        designation,
        instituteId: institute.id,
        departmentId: department.id,
        qualification,
        specialization,
        experienceYears,
        joiningDate,
        subjectIds: [],
        status: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'].includes(status) ? status : 'ACTIVE'
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const facultyList = db.getFaculty();
    const existingIndex = facultyList.findIndex(f => f.employeeId === data.employeeId || f.id === data.id);

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = facultyList[existingIndex];
      facultyList[existingIndex] = { ...existing, ...data, id: existing.id };

      // Sync user
      const users = db.getUsers();
      const userIndex = users.findIndex(u => u.employeeId === data.employeeId || u.email === data.email);
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          name: data.name,
          email: data.email,
          phone: data.phone,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          designation: data.designation
        };
      }

      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `faculty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newFaculty: Faculty = {
        ...data as any,
        id: newId
      };
      facultyList.unshift(newFaculty);

      const users = db.getUsers();
      const userExists = users.some(u => u.employeeId === data.employeeId || u.email === data.email);
      if (!userExists) {
        users.push({
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: data.name,
          email: data.email,
          username: data.employeeId,
          role: 'FACULTY',
          phone: data.phone,
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          designation: data.designation,
          employeeId: data.employeeId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }

      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 2B: NON-TEACHING STAFF MASTER ────────────────────────────
const StaffHandler: IModuleImportHandler = {
  type: 'STAFF',
  name: 'Non-Teaching Staff Master',
  fileName: 'Staff_Import_Template.xlsx',
  description: 'Bulk register administrative, laboratory, and operational staff profiles.',
  headers: [
    'Employee Code', 'Staff Name', 'Email', 'Mobile Number', 'Department Code',
    'Designation', 'Institute Code', 'Employment Type', 'Joining Date (YYYY-MM-DD)', 'Status'
  ],
  requiredHeaders: ['Employee Code', 'Staff Name', 'Email', 'Department Code'],
  sampleRows: [
    ['STF-1001', 'Ramesh Patel', 'ramesh.patel@swarrnim.edu.in', '9898011223', 'Office Superintendent', 'INST-ENG', 'DEP-ADMIN', 'FULL_TIME', '2023-04-01', 'ACTIVE'],
    ['STF-1002', 'Bhavna Dave', 'bhavna.dave@swarrnim.edu.in', '9898022334', 'Senior Lab Technician', 'INST-ENG', 'DEP-CSE', 'FULL_TIME', '2023-06-15', 'ACTIVE']
  ],
  instructions: [
    { field: 'Employee Code', required: 'YES', description: 'Unique staff identifier (Official ERP Login ID)', example: 'STF-1001' },
    { field: 'Staff Name', required: 'YES', description: 'Full legal name', example: 'Ramesh Patel' },
    { field: 'Email', required: 'YES', description: 'Official email address', example: 'ramesh.patel@swarrnim.edu.in' },
    { field: 'Department Code', required: 'YES', description: 'Valid Department Code', example: 'DEP-ADMIN' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const employeeCode = getVal(raw, ['Employee Code', 'employeeCode', 'EmployeeID', 'employeeId', 'Emp Code']);
    const name = getVal(raw, ['Staff Name', 'name', 'Name', 'FullName']);
    const email = getVal(raw, ['Email', 'email', 'Email Address']);
    const phone = getVal(raw, ['Mobile Number', 'mobile', 'Mobile', 'Phone', 'phone']);
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const designation = getVal(raw, ['Designation', 'designation']) || 'Staff';
    const employmentType = (getVal(raw, ['Employment Type', 'employmentType']) || 'FULL_TIME').toUpperCase();
    const joiningDate = getVal(raw, ['Joining Date (YYYY-MM-DD)', 'joiningDate']) || '2023-01-01';
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase();

    if (!employeeCode) return { status: 'INVALID', errorField: 'Employee Code', errorMessage: 'Employee Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Staff Name', errorMessage: 'Staff Name is required.' };
    if (!email || !email.includes('@')) return { status: 'INVALID', errorField: 'Email', errorMessage: 'Valid Email is required.' };
    if (!departmentCode) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };

    if (seenKeys.has(employeeCode)) {
      return { status: 'DUPLICATE', errorField: 'Employee Code', errorMessage: `Duplicate Employee Code "${employeeCode}" in file.` };
    }
    seenKeys.add(employeeCode);

    const departments = db.getDepartments();
    const department = departments.find(d => d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode);
    if (!department) {
      return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${departmentCode}" not found in ERP.` };
    }

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode) || institutes[0];

    const users = db.getUsers();
    const existing = users.find(u => u.username === employeeCode || u.employeeId === employeeCode || u.email === email);

    if (existing && mode === 'INSERT_ONLY') {
      return {
        status: 'DUPLICATE',
        errorField: 'Employee Code',
        errorMessage: `Staff member "${employeeCode}" already exists in ERP.`,
        isExisting: true,
        targetId: existing.id
      };
    }

    return {
      status: 'VALID',
      isExisting: !!existing,
      targetId: existing?.id,
      parsedData: {
        employeeCode,
        name,
        email,
        phone: phone || '9876543210',
        designation,
        employmentType,
        instituteId: institute?.id || 'inst-1',
        departmentId: department.id,
        joiningDate,
        status: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'].includes(status) ? status : 'ACTIVE'
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const users = db.getUsers();
    const existingIndex = users.findIndex(u => u.username === data.employeeCode || u.employeeId === data.employeeCode);

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = users[existingIndex];
      users[existingIndex] = {
        ...existing,
        name: data.name,
        email: data.email,
        phone: data.phone,
        designation: data.designation,
        instituteId: data.instituteId,
        departmentId: data.departmentId
      };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      users.push({
        id: newId,
        name: data.name,
        email: data.email,
        username: data.employeeCode,
        employeeId: data.employeeCode,
        role: 'STAFF',
        phone: data.phone,
        designation: data.designation,
        instituteId: data.instituteId,
        departmentId: data.departmentId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 3: DEPARTMENT MASTER ─────────────────────────────────────
const DepartmentHandler: IModuleImportHandler = {
  type: 'DEPARTMENT',
  name: 'Academic Department Master',
  fileName: 'Department_Import_Template.xlsx',
  description: 'Bulk register academic departments, HOD assignments, and official contact emails.',
  headers: ['Department Code', 'Department Name', 'Institute Code', 'HOD Name', 'Email', 'Phone', 'Status'],
  requiredHeaders: ['Department Code', 'Department Name', 'Institute Code'],
  sampleRows: [
    ['CSE', 'Computer Science & Engineering', 'SIT', 'Dr. Rajesh Patel', 'hod.cse@swarrnim.edu.in', '9898001122', 'ACTIVE'],
    ['MECH', 'Mechanical Engineering', 'SIT', 'Dr. Anil Mehta', 'hod.mech@swarrnim.edu.in', '9898001123', 'ACTIVE']
  ],
  instructions: [
    { field: 'Department Code', required: 'YES', description: 'Unique code in institute', example: 'CSE' },
    { field: 'Department Name', required: 'YES', description: 'Full department title', example: 'Computer Science & Engineering' },
    { field: 'Institute Code', required: 'YES', description: 'Valid parent Institute Code', example: 'SIT' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const code = getVal(raw, ['Department Code', 'code', 'DepartmentCode']);
    const name = getVal(raw, ['Department Name', 'name', 'DepartmentName']);
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const hodName = getVal(raw, ['HOD Name', 'hodName']);
    const email = getVal(raw, ['Email', 'email']) || 'dept@swarrnim.edu.in';
    const phone = getVal(raw, ['Phone', 'phone']) || '9876543210';
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as Department['status'];

    if (!code) return { status: 'INVALID', errorField: 'Department Code', errorMessage: 'Department Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Department Name', errorMessage: 'Department Name is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };

    if (seenKeys.has(code)) {
      return { status: 'DUPLICATE', errorField: 'Department Code', errorMessage: `Duplicate Department Code "${code}" in file.` };
    }
    seenKeys.add(code);

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" not found.` };

    if (role === 'PRINCIPAL' && user?.instituteId && institute.id !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Unauthorized: Principal can only manage Institute "${user.instituteId}".` };
    }

    const existing = db.getDepartments().find(d => (d.code.toUpperCase() === code.toUpperCase() || d.id === code) && d.instituteId === institute.id);

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Department Code', errorMessage: `Department "${code}" already exists in institute.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, code: code.toUpperCase(), name, instituteId: institute.id, hodName, email, phone, status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Department Code', errorMessage: `Department "${code}" does not exist.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { code: code.toUpperCase(), name, instituteId: institute.id, hodName, email, phone, status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }
    };
  },

  commitRecord(data, mode, user, role) {
    const departments = db.getDepartments();
    const existingIndex = departments.findIndex(d => d.code.toUpperCase() === data.code.toUpperCase() && d.instituteId === data.instituteId);

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = departments[existingIndex];
      departments[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `dept-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      departments.unshift({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 4: PROGRAM MASTER ────────────────────────────────────────
const ProgramHandler: IModuleImportHandler = {
  type: 'PROGRAM',
  name: 'Academic Degree & Program Master',
  fileName: 'Program_Import_Template.xlsx',
  description: 'Bulk register academic degree programs, duration, semester structures, and intake capacity.',
  headers: [
    'Program Code', 'Program Name', 'Institute Code', 'Department Code',
    'Degree Type', 'Level', 'Duration Years', 'Total Semesters', 'Intake Capacity', 'Status'
  ],
  requiredHeaders: ['Program Code', 'Program Name', 'Institute Code'],
  sampleRows: [
    ['PROG-BTECH-CSE', 'B.Tech Computer Science & Engineering', 'SIT', 'CSE', 'B.Tech', 'UNDERGRADUATE', 4, 8, 120, 'ACTIVE'],
    ['PROG-BTECH-MECH', 'B.Tech Mechanical Engineering', 'SIT', 'MECH', 'B.Tech', 'UNDERGRADUATE', 4, 8, 60, 'ACTIVE']
  ],
  instructions: [
    { field: 'Program Code', required: 'YES', description: 'Unique program identifier', example: 'PROG-BTECH-CSE' },
    { field: 'Program Name', required: 'YES', description: 'Degree specialization title', example: 'B.Tech Computer Science' },
    { field: 'Institute Code', required: 'YES', description: 'Valid Institute Code', example: 'SIT' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const code = getVal(raw, ['Program Code', 'code', 'ProgramCode']);
    const name = getVal(raw, ['Program Name', 'name', 'ProgramName']);
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const degreeType = getVal(raw, ['Degree Type', 'degreeType']) || 'B.Tech';
    const level = (getVal(raw, ['Level', 'level']) || 'UNDERGRADUATE').toUpperCase();
    const durationYears = Number(getVal(raw, ['Duration Years', 'durationYears'])) || 4;
    const totalSemesters = Number(getVal(raw, ['Total Semesters', 'totalSemesters'])) || 8;
    const intakeCapacity = Number(getVal(raw, ['Intake Capacity', 'intakeCapacity'])) || 60;
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as Program['status'];

    if (!code) return { status: 'INVALID', errorField: 'Program Code', errorMessage: 'Program Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Program Name', errorMessage: 'Program Name is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };

    if (seenKeys.has(code)) {
      return { status: 'DUPLICATE', errorField: 'Program Code', errorMessage: `Duplicate Program Code "${code}" in file.` };
    }
    seenKeys.add(code);

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" not found.` };

    let departmentId = '';
    if (departmentCode) {
      const departments = db.getDepartments();
      const department = departments.find(d => (d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode) && d.instituteId === institute.id);
      if (department) departmentId = department.id;
    }

    const existing = db.getPrograms().find(p => p.code.toUpperCase() === code.toUpperCase());

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Program Code', errorMessage: `Program "${code}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, code: code.toUpperCase(), name, instituteId: institute.id, departmentId, degreeType, level, durationYears, totalSemesters, intakeCapacity, status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Program Code', errorMessage: `Program "${code}" does not exist.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { code: code.toUpperCase(), name, instituteId: institute.id, departmentId, degreeType, level, durationYears, totalSemesters, intakeCapacity, status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }
    };
  },

  commitRecord(data, mode, user, role) {
    const programs = db.getPrograms();
    const existingIndex = programs.findIndex(p => p.code.toUpperCase() === data.code.toUpperCase());

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = programs[existingIndex];
      programs[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `prog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      programs.unshift({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 5: INVENTORY ASSET MASTER ────────────────────────────────
const InventoryAssetHandler: IModuleImportHandler = {
  type: 'INVENTORY_ASSET',
  name: 'Storage & Fixed Asset Register',
  fileName: 'Asset_Inventory_Import_Template.xlsx',
  description: 'Bulk register IT hardware, lab machines, furniture, printers, and office equipment.',
  headers: [
    'Asset Tag', 'Asset Name', 'Category Name', 'Category Group', 'Institute Code',
    'Department Code', 'Location / Room', 'Building', 'Floor', 'Purchase Date (YYYY-MM-DD)',
    'Purchase Cost', 'Vendor', 'Invoice Number', 'Serial Number', 'Manufacturer',
    'Model Number', 'Condition', 'Status'
  ],
  requiredHeaders: ['Asset Tag', 'Asset Name', 'Institute Code'],
  sampleRows: [
    [
      'SIT-CSE-PC-001', 'Dell OptiPlex 7090 Desktop', 'Desktop Computers', 'IT_HARDWARE',
      'SIT', 'CSE', 'AI & ML Lab 102', 'Engineering Block A', '1st Floor', '2024-03-15',
      65000, 'Dell India Pvt Ltd', 'INV-2024-0987', 'DL7090-SN-001', 'Dell',
      'OptiPlex 7090', 'WORKING', 'AVAILABLE'
    ],
    [
      'SIT-MECH-LATHE-01', 'CNC Lathe Trainer Machine', 'Lab Equipment', 'LAB_EQUIPMENT',
      'SIT', 'MECH', 'Mechanical Workshop', 'Workshop Block B', 'Ground Floor', '2023-11-20',
      350000, 'BFW Machinery', 'INV-BFW-887', 'CNC-2023-881', 'BFW',
      'Trainer CNC-V1', 'WORKING', 'AVAILABLE'
    ],
    [
      'SIT-ADMIN-PRN-01', 'HP LaserJet Pro MFP 4104dw', 'Printers & Scanners', 'OFFICE_EQUIPMENT',
      'SIT', 'ADMIN', 'Registrar Office', 'Admin Block', 'Ground Floor', '2024-01-10',
      38000, 'HP Enterprise', 'INV-HP-998', 'HPLJ-2024-001', 'HP',
      'LaserJet Pro 4104', 'WORKING', 'ASSIGNED'
    ]
  ],
  instructions: [
    { field: 'Asset Tag', required: 'YES', description: 'Unique institutional asset identifier barcode/tag', example: 'SIT-CSE-PC-001' },
    { field: 'Asset Name', required: 'YES', description: 'Item name / equipment description', example: 'Dell OptiPlex 7090 Desktop' },
    { field: 'Institute Code', required: 'YES', description: 'Institute where asset is stationed', example: 'SIT' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const assetTag = getVal(raw, ['Asset Tag', 'assetTag', 'Tag', 'Barcode']);
    const name = getVal(raw, ['Asset Name', 'name', 'Item Name', 'assetName']);
    const categoryName = getVal(raw, ['Category Name', 'categoryName', 'Category']) || 'General Equipment';
    const categoryGroup = (getVal(raw, ['Category Group', 'categoryGroup']) || 'IT_HARDWARE').toUpperCase() as any;
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const locationName = getVal(raw, ['Location / Room', 'locationName', 'Location', 'Room']);
    const building = getVal(raw, ['Building', 'building']) || 'Main Campus';
    const floor = getVal(raw, ['Floor', 'floor']) || 'Ground Floor';
    const purchaseDate = getVal(raw, ['Purchase Date (YYYY-MM-DD)', 'purchaseDate']) || '2024-01-01';
    const purchaseCost = Number(getVal(raw, ['Purchase Cost', 'purchaseCost', 'Cost'])) || 0;
    const vendor = getVal(raw, ['Vendor', 'vendor']) || 'University Approved Vendor';
    const invoiceNumber = getVal(raw, ['Invoice Number', 'invoiceNumber']);
    const serialNumber = getVal(raw, ['Serial Number', 'serialNumber']);
    const manufacturer = getVal(raw, ['Manufacturer', 'manufacturer']);
    const modelNumber = getVal(raw, ['Model Number', 'modelNumber']);
    const condition = (getVal(raw, ['Condition', 'assetCondition', 'condition']) || 'WORKING').toUpperCase() as any;
    const status = (getVal(raw, ['Status', 'status']) || 'AVAILABLE').toUpperCase() as any;

    if (!assetTag) return { status: 'INVALID', errorField: 'Asset Tag', errorMessage: 'Asset Tag is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Asset Name', errorMessage: 'Asset Name is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };

    if (seenKeys.has(assetTag)) {
      return { status: 'DUPLICATE', errorField: 'Asset Tag', errorMessage: `Duplicate Asset Tag "${assetTag}" in file.` };
    }
    seenKeys.add(assetTag);

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" not found.` };

    let departmentId = '';
    let departmentName = '';
    if (departmentCode) {
      const departments = db.getDepartments();
      const department = departments.find(d => (d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode) && d.instituteId === institute.id);
      if (department) {
        departmentId = department.id;
        departmentName = department.name;
      }
    }

    // Role Scope Verification
    if (role === 'PRINCIPAL' && user?.instituteId && institute.id !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Scope', errorMessage: `Unauthorized Scope: As Principal of Institute "${user.instituteId}", you cannot import assets for Institute "${institute.code}".` };
    }

    if (role === 'HOD' && user?.departmentId && departmentId && departmentId !== user.departmentId) {
      return { status: 'INVALID', errorField: 'Department Scope', errorMessage: `Unauthorized Scope: As HOD of Department "${user.departmentId}", you cannot import assets for Department "${departmentCode}".` };
    }

    const existing = db.getFixedAssets().find(a => a.assetTag.toUpperCase() === assetTag.toUpperCase());

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Asset Tag', errorMessage: `Asset "${assetTag}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          assetTag: assetTag.toUpperCase(),
          name,
          categoryId: existing.categoryId || 'cat-1',
          categoryName,
          categoryGroup,
          instituteId: institute.id,
          instituteName: institute.name,
          departmentId,
          departmentName,
          locationName,
          building,
          floor,
          purchaseDate,
          purchaseCost,
          currentValue: purchaseCost,
          vendor,
          invoiceNumber,
          serialNumber,
          manufacturer,
          modelNumber,
          assetCondition: condition,
          status,
          updatedAt: new Date().toISOString()
        }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Asset Tag', errorMessage: `Asset "${assetTag}" does not exist in ERP.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        assetTag: assetTag.toUpperCase(),
        name,
        categoryId: 'cat-1',
        categoryName,
        categoryGroup,
        instituteId: institute.id,
        instituteName: institute.name,
        departmentId,
        departmentName,
        locationName,
        building,
        floor,
        purchaseDate,
        purchaseCost,
        currentValue: purchaseCost,
        vendor,
        invoiceNumber,
        serialNumber,
        manufacturer,
        modelNumber,
        assetCondition: condition,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const assets = db.getFixedAssets();
    const existingIndex = assets.findIndex(a => a.assetTag.toUpperCase() === data.assetTag.toUpperCase());

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = assets[existingIndex];
      assets[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      assets.unshift({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 6: SUBJECT MASTER ────────────────────────────────────────
const SubjectHandler: IModuleImportHandler = {
  type: 'SUBJECT',
  name: 'Curriculum & Course Subject Master',
  fileName: 'Subject_Import_Template.xlsx',
  description: 'Upload course curriculum, credit hours, passing marks, and subject types.',
  headers: [
    'Subject Code', 'Subject Name', 'Program Code', 'Department Code', 'Semester',
    'Academic Year', 'Credits', 'Subject Type', 'Maximum Marks', 'Passing Marks', 'Status'
  ],
  requiredHeaders: ['Subject Code', 'Subject Name', 'Program Code'],
  sampleRows: [
    ['CS501', 'Database Management Systems', 'PROG-BTECH-CSE', 'CSE', 5, '2024-2025', 4, 'THEORY', 100, 40, 'ACTIVE'],
    ['CS502', 'Operating Systems', 'PROG-BTECH-CSE', 'CSE', 5, '2024-2025', 4, 'THEORY', 100, 40, 'ACTIVE'],
    ['CS503P', 'DBMS Practical Lab', 'PROG-BTECH-CSE', 'CSE', 5, '2024-2025', 2, 'PRACTICAL', 50, 20, 'ACTIVE']
  ],
  instructions: [
    { field: 'Subject Code', required: 'YES', description: 'Unique syllabus code', example: 'CS501' },
    { field: 'Subject Name', required: 'YES', description: 'Subject title', example: 'Database Management Systems' },
    { field: 'Program Code', required: 'YES', description: 'Degree program code', example: 'PROG-BTECH-CSE' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const code = getVal(raw, ['Subject Code', 'subjectCode', 'code', 'Code']);
    const name = getVal(raw, ['Subject Name', 'subjectName', 'name', 'Name']);
    const programCode = getVal(raw, ['Program Code', 'programCode', 'Program']);
    const semester = Number(getVal(raw, ['Semester', 'semester'])) || 1;
    const credits = Number(getVal(raw, ['Credits', 'credits'])) || 3;
    const subjectType = (getVal(raw, ['Subject Type', 'subjectType']) || 'THEORY').toUpperCase() as any;
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as any;

    if (!code) return { status: 'INVALID', errorField: 'Subject Code', errorMessage: 'Subject Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Subject Name', errorMessage: 'Subject Name is required.' };
    if (!programCode) return { status: 'INVALID', errorField: 'Program Code', errorMessage: 'Program Code is required.' };

    if (seenKeys.has(code)) {
      return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Duplicate Subject Code "${code}" in file.` };
    }
    seenKeys.add(code);

    const programs = db.getPrograms();
    const program = programs.find(p => p.code.toUpperCase() === programCode.toUpperCase() || p.id === programCode);
    if (!program) return { status: 'INVALID', errorField: 'Program Code', errorMessage: `Program "${programCode}" not found.` };

    // Role Scope Verification
    if (role === 'PRINCIPAL' && user?.instituteId && program.instituteId !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Scope', errorMessage: `Unauthorized Scope: As Principal of Institute "${user.instituteId}", you cannot import subjects for Program belonging to Institute "${program.instituteId}".` };
    }

    if (role === 'HOD' && user?.departmentId && program.departmentId && program.departmentId !== user.departmentId) {
      return { status: 'INVALID', errorField: 'Department Scope', errorMessage: `Unauthorized Scope: As HOD of Department "${user.departmentId}", you cannot import subjects for Program in Department "${program.departmentId}".` };
    }

    const existing = db.getSubjects().find(s => s.code.toUpperCase() === code.toUpperCase());

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Subject Code', errorMessage: `Subject "${code}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          code: code.toUpperCase(),
          name,
          programId: program.id,
          semester,
          credits,
          type: subjectType,
          status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Subject Code', errorMessage: `Subject "${code}" does not exist in ERP.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        code: code.toUpperCase(),
        name,
        programId: program.id,
        semester,
        credits,
        type: subjectType,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const subjects = db.getSubjects();
    const existingIndex = subjects.findIndex(s => s.code.toUpperCase() === data.code.toUpperCase());

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = subjects[existingIndex];
      subjects[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      subjects.unshift({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MODULE HANDLER 7: INVENTORY CONSUMABLES ────────────────────────────────
const ConsumableHandler: IModuleImportHandler = {
  type: 'INVENTORY_CONSUMABLE',
  name: 'Storage & Consumable Register',
  fileName: 'Consumables_Import_Template.xlsx',
  description: 'Bulk register office supplies, stationery, printer toner, cables, and lab consumables.',
  headers: [
    'Item Code', 'Item Name', 'Category Name', 'Category Group', 'Unit',
    'Institute Code', 'Department Code', 'Location', 'Opening Quantity',
    'Minimum Stock Level', 'Reorder Level', 'Standard Rate', 'Status'
  ],
  requiredHeaders: ['Item Code', 'Item Name', 'Institute Code'],
  sampleRows: [
    ['STN-A4-PAPER', 'JK Copier A4 Paper 75 GSM', 'Office Stationery', 'STATIONERY', 'REAM', 'SIT', 'ADMIN', 'Store Room 101', 150, 20, 40, 320, 'ACTIVE'],
    ['IT-LAN-CAT6', 'D-Link Cat6 Patch Cable 2M', 'IT Consumables', 'IT_HARDWARE', 'PCS', 'SIT', 'CSE', 'Hardware Store', 80, 15, 25, 120, 'ACTIVE']
  ],
  instructions: [
    { field: 'Item Code', required: 'YES', description: 'Unique inventory item SKU', example: 'STN-A4-PAPER' },
    { field: 'Item Name', required: 'YES', description: 'Consumable description', example: 'JK Copier A4 Paper' },
    { field: 'Unit', required: 'YES', description: 'Unit of measurement (PCS, REAM, BOX, PKT)', example: 'REAM' }
  ],

  validateRow(raw, seenKeys, mode, user, role) {
    const itemCode = getVal(raw, ['Item Code', 'itemCode', 'Code', 'SKU']);
    const name = getVal(raw, ['Item Name', 'name', 'ItemName']);
    const categoryName = getVal(raw, ['Category Name', 'categoryName', 'Category']) || 'General Consumables';
    const categoryGroup = (getVal(raw, ['Category Group', 'categoryGroup']) || 'STATIONERY').toUpperCase() as any;
    const unit = (getVal(raw, ['Unit', 'unit']) || 'PCS').toUpperCase() as any;
    const instituteCode = getVal(raw, ['Institute Code', 'instituteCode', 'Institute']);
    const departmentCode = getVal(raw, ['Department Code', 'departmentCode', 'Department']);
    const locationName = getVal(raw, ['Location', 'locationName', 'Room']) || 'Main Store';
    const openingQuantity = Number(getVal(raw, ['Opening Quantity', 'openingQuantity', 'Quantity'])) || 0;
    const minimumStockLevel = Number(getVal(raw, ['Minimum Stock Level', 'minimumStockLevel'])) || 10;
    const reorderLevel = Number(getVal(raw, ['Reorder Level', 'reorderLevel'])) || 20;
    const standardRate = Number(getVal(raw, ['Standard Rate', 'standardRate', 'Price'])) || 0;
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as any;

    if (!itemCode) return { status: 'INVALID', errorField: 'Item Code', errorMessage: 'Item Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Item Name', errorMessage: 'Item Name is required.' };
    if (!instituteCode) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };

    if (seenKeys.has(itemCode)) {
      return { status: 'DUPLICATE', errorField: 'Item Code', errorMessage: `Duplicate Item Code "${itemCode}" in file.` };
    }
    seenKeys.add(itemCode);

    const institutes = db.getInstitutes();
    const institute = institutes.find(i => i.code.toUpperCase() === instituteCode.toUpperCase() || i.id === instituteCode);
    if (!institute) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${instituteCode}" not found.` };

    let departmentId = '';
    let departmentName = '';
    if (departmentCode) {
      const departments = db.getDepartments();
      const department = departments.find(d => (d.code.toUpperCase() === departmentCode.toUpperCase() || d.id === departmentCode) && d.instituteId === institute.id);
      if (department) {
        departmentId = department.id;
        departmentName = department.name;
      }
    }

    // Role Scope Verification
    if (role === 'PRINCIPAL' && user?.instituteId && institute.id !== user.instituteId) {
      return { status: 'INVALID', errorField: 'Institute Scope', errorMessage: `Unauthorized Scope: As Principal of Institute "${user.instituteId}", you cannot import consumables for Institute "${institute.code}".` };
    }

    if (role === 'HOD' && user?.departmentId && departmentId && departmentId !== user.departmentId) {
      return { status: 'INVALID', errorField: 'Department Scope', errorMessage: `Unauthorized Scope: As HOD of Department "${user.departmentId}", you cannot import consumables for Department "${departmentCode}".` };
    }

    const existing = db.getConsumables().find((c: ConsumableItem) => c.itemCode.toUpperCase() === itemCode.toUpperCase());

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Item Code', errorMessage: `Consumable "${itemCode}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          itemCode: itemCode.toUpperCase(),
          name,
          categoryId: existing.categoryId || 'cat-cons-1',
          categoryName,
          categoryGroup,
          unit,
          instituteId: institute.id,
          instituteName: institute.name,
          departmentId,
          departmentName,
          locationName,
          openingQuantity,
          receivedQuantity: existing.receivedQuantity || 0,
          issuedQuantity: existing.issuedQuantity || 0,
          returnedQuantity: existing.returnedQuantity || 0,
          currentBalance: openingQuantity,
          minimumStockLevel,
          reorderLevel,
          standardRate,
          status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Item Code', errorMessage: `Consumable "${itemCode}" does not exist in ERP.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        itemCode: itemCode.toUpperCase(),
        name,
        categoryId: 'cat-cons-1',
        categoryName,
        categoryGroup,
        unit,
        instituteId: institute.id,
        instituteName: institute.name,
        departmentId,
        departmentName,
        locationName,
        openingQuantity,
        receivedQuantity: 0,
        issuedQuantity: 0,
        returnedQuantity: 0,
        currentBalance: openingQuantity,
        minimumStockLevel,
        reorderLevel,
        standardRate,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      }
    };
  },

  commitRecord(data, mode, user, role) {
    const consumables = db.getConsumables();
    const existingIndex = consumables.findIndex((c: ConsumableItem) => c.itemCode.toUpperCase() === data.itemCode.toUpperCase());

    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = consumables[existingIndex];
      consumables[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `cons-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      consumables.unshift({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── 8. INSTITUTE MASTER IMPORT HANDLER ───────────────────────────────────────
const InstituteHandler: IModuleImportHandler = {
  type: 'INSTITUTE',
  name: 'Institute Master Import',
  fileName: 'SSIU_Institute_Master_Template.xlsx',
  description: 'Bulk import of university colleges and constituent institutes.',
  headers: ['Institute Code', 'Institute Name', 'Type', 'Email', 'Phone', 'Location', 'Established Year', 'Principal Name', 'Status'],
  requiredHeaders: ['Institute Code', 'Institute Name'],
  sampleRows: [
    ['SIT', 'Swarrnim Institute of Technology', 'Engineering', 'sit@swarrnim.edu.in', '9876543210', 'Main Campus', 2017, 'Dr. Principal', 'ACTIVE']
  ],
  instructions: [
    { field: 'Institute Code', required: 'YES', description: 'Unique code of the institute (e.g. SIT, SAL)', example: 'SIT' },
    { field: 'Institute Name', required: 'YES', description: 'Full name of the institute', example: 'Swarrnim Institute of Technology' },
    { field: 'Type', required: 'NO', description: 'Engineering, Management, Pharmacy, Science, Nursing', example: 'Engineering' }
  ],
  validateRow(raw, seenKeys, mode, user, role) {
    const code = getVal(raw, ['Institute Code', 'instituteCode', 'code', 'Code']);
    const name = getVal(raw, ['Institute Name', 'instituteName', 'name', 'Name']);
    const type = getVal(raw, ['Type', 'type']) || 'Engineering';
    const email = getVal(raw, ['Email', 'email']) || `${code.toLowerCase()}@swarrnim.edu.in`;
    const phone = getVal(raw, ['Phone', 'phone']) || '9876543210';
    const location = getVal(raw, ['Location', 'location']) || 'Main Campus';
    const establishedYear = Number(getVal(raw, ['Established Year', 'establishedYear'])) || 2017;
    const principalName = getVal(raw, ['Principal Name', 'principalName']);
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as any;

    if (!code) return { status: 'INVALID', errorField: 'Institute Code', errorMessage: 'Institute Code is required.' };
    if (!name) return { status: 'INVALID', errorField: 'Institute Name', errorMessage: 'Institute Name is required.' };

    if (seenKeys.has(code)) {
      return { status: 'DUPLICATE', errorField: 'Institute Code', errorMessage: `Duplicate Institute Code "${code}" in file.` };
    }
    seenKeys.add(code);

    const existing = db.getInstitutes().find(i => i.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Institute Code', errorMessage: `Institute "${code}" already exists in ERP.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: {
          id: existing.id,
          code: code.toUpperCase(),
          name,
          type,
          email,
          phone,
          location,
          establishedYear,
          principalName,
          status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
        }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Institute Code', errorMessage: `Institute "${code}" does not exist in ERP.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: {
        code: code.toUpperCase(),
        name,
        type,
        email,
        phone,
        location,
        establishedYear,
        principalName,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      }
    };
  },
  commitRecord(data, mode, user, role) {
    const institutes = db.getInstitutes();
    const existingIndex = institutes.findIndex(i => i.code.toUpperCase() === data.code.toUpperCase());
    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = institutes[existingIndex];
      institutes[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      institutes.push({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── 9. ACADEMIC YEAR MASTER IMPORT HANDLER ──────────────────────────────────
const AcademicYearHandler: IModuleImportHandler = {
  type: 'ACADEMIC_YEAR',
  name: 'Academic Year Master Import',
  fileName: 'SSIU_Academic_Year_Template.xlsx',
  description: 'Bulk import of academic years and sessions.',
  headers: ['Academic Year Name', 'Start Date', 'End Date', 'Is Current', 'Status'],
  requiredHeaders: ['Academic Year Name', 'Start Date', 'End Date'],
  sampleRows: [
    ['2025-2026', '2025-07-01', '2026-06-30', 'YES', 'ACTIVE']
  ],
  instructions: [
    { field: 'Academic Year Name', required: 'YES', description: 'Academic Year format YYYY-YYYY', example: '2025-2026' },
    { field: 'Start Date', required: 'YES', description: 'YYYY-MM-DD', example: '2025-07-01' },
    { field: 'End Date', required: 'YES', description: 'YYYY-MM-DD', example: '2026-06-30' }
  ],
  validateRow(raw, seenKeys, mode, user, role) {
    const name = getVal(raw, ['Academic Year Name', 'academicYearName', 'name', 'Name']);
    const startDate = getVal(raw, ['Start Date', 'startDate']) || '2025-07-01';
    const endDate = getVal(raw, ['End Date', 'endDate']) || '2026-06-30';
    const isCurrent = (getVal(raw, ['Is Current', 'isCurrent']) || '').toUpperCase() === 'YES';
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as any;

    if (!name) return { status: 'INVALID', errorField: 'Academic Year Name', errorMessage: 'Academic Year Name is required.' };

    if (seenKeys.has(name)) {
      return { status: 'DUPLICATE', errorField: 'Academic Year Name', errorMessage: `Duplicate Academic Year "${name}" in file.` };
    }
    seenKeys.add(name);

    const existing = db.getAcademicYears().find(a => a.name.toUpperCase() === name.toUpperCase());
    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Academic Year Name', errorMessage: `Academic Year "${name}" already exists in ERP.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, name, startDate, endDate, isCurrent, status: status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE' }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Academic Year Name', errorMessage: `Academic Year "${name}" does not exist in ERP.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { name, startDate, endDate, isCurrent, status: status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE' }
    };
  },
  commitRecord(data, mode, user, role) {
    const ays = db.getAcademicYears();
    const existingIndex = ays.findIndex(a => a.name.toUpperCase() === data.name.toUpperCase());
    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = ays[existingIndex];
      ays[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `ay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      ays.push({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── 10. SEMESTER MASTER IMPORT HANDLER ──────────────────────────────────────
const SemesterHandler: IModuleImportHandler = {
  type: 'SEMESTER',
  name: 'Semester Master Import',
  fileName: 'SSIU_Semester_Template.xlsx',
  description: 'Bulk import of program semesters.',
  headers: ['Semester Number', 'Semester Code', 'Program Code', 'Academic Year Name', 'Status'],
  requiredHeaders: ['Semester Number', 'Semester Code', 'Program Code'],
  sampleRows: [
    [1, 'SEM-1', 'BTECH_CSE', '2024-2025', 'ACTIVE']
  ],
  instructions: [
    { field: 'Semester Number', required: 'YES', description: 'Numeric 1 to 10', example: '1' },
    { field: 'Semester Code', required: 'YES', description: 'e.g. SEM-1', example: 'SEM-1' },
    { field: 'Program Code', required: 'YES', description: 'Valid Program Code', example: 'BTECH_CSE' }
  ],
  validateRow(raw, seenKeys, mode, user, role) {
    const number = Number(getVal(raw, ['Semester Number', 'number', 'Semester'])) || 1;
    const code = getVal(raw, ['Semester Code', 'code', 'Code']) || `SEM-${number}`;
    const programCode = getVal(raw, ['Program Code', 'programCode', 'Program']);
    const ayName = getVal(raw, ['Academic Year Name', 'academicYear', 'ayName']) || '2024-2025';
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase() as any;

    if (!programCode) return { status: 'INVALID', errorField: 'Program Code', errorMessage: 'Program Code is required.' };

    const program = db.getPrograms().find(p => p.code.toUpperCase() === programCode.toUpperCase());
    if (!program) return { status: 'INVALID', errorField: 'Program Code', errorMessage: `Program "${programCode}" not found.` };

    const dedupeKey = `${program.id}-${number}`;
    if (seenKeys.has(dedupeKey)) return { status: 'DUPLICATE', errorField: 'Semester Number', errorMessage: `Duplicate Semester ${number} for Program "${programCode}" in file.` };
    seenKeys.add(dedupeKey);

    const existing = db.getSemesters().find(s => s.programId === program.id && s.number === number);
    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Semester Code', errorMessage: `Semester ${number} for program "${programCode}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, number, code: code.toUpperCase(), programId: program.id, academicYearId: 'ay-2024-2025', status }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Semester Code', errorMessage: `Semester ${number} for program "${programCode}" does not exist.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { number, code: code.toUpperCase(), programId: program.id, academicYearId: 'ay-2024-2025', status }
    };
  },
  commitRecord(data, mode, user, role) {
    const sems = db.getSemesters();
    const existingIndex = sems.findIndex(s => s.programId === data.programId && s.number === data.number);
    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = sems[existingIndex];
      sems[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `sem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      sems.push({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── 11. HOSTEL ROOM IMPORT HANDLER ─────────────────────────────────────────
const HostelRoomHandler: IModuleImportHandler = {
  type: 'HOSTEL_ROOM',
  name: 'Hostel Rooms Import',
  fileName: 'SSIU_Hostel_Rooms_Template.xlsx',
  description: 'Bulk import of hostel rooms and floor capacities.',
  headers: ['Hostel Name', 'Room No', 'Floor', 'Capacity', 'Room Type', 'Monthly Rent', 'Status'],
  requiredHeaders: ['Hostel Name', 'Room No', 'Capacity'],
  sampleRows: [
    ['Boys Hostel A', '101', '1st Floor', 3, 'TRIPLE_SHARING', 4500, 'AVAILABLE']
  ],
  instructions: [
    { field: 'Hostel Name', required: 'YES', description: 'Name of the hostel', example: 'Boys Hostel A' },
    { field: 'Room No', required: 'YES', description: 'Room identification number', example: '101' },
    { field: 'Capacity', required: 'YES', description: 'Total beds/capacity (number)', example: '3' }
  ],
  validateRow(raw, seenKeys, mode, user, role) {
    const hostelName = getVal(raw, ['Hostel Name', 'hostelName', 'Hostel']);
    const roomNo = getVal(raw, ['Room No', 'roomNo', 'RoomNumber', 'Room']);
    const floor = getVal(raw, ['Floor', 'floor']) || 'Ground Floor';
    const capacity = Number(getVal(raw, ['Capacity', 'capacity'])) || 3;
    const roomType = getVal(raw, ['Room Type', 'roomType']) || 'TRIPLE_SHARING';
    const monthlyRent = Number(getVal(raw, ['Monthly Rent', 'monthlyRent', 'Rent'])) || 4000;
    const status = (getVal(raw, ['Status', 'status']) || 'AVAILABLE').toUpperCase();

    if (!hostelName) return { status: 'INVALID', errorField: 'Hostel Name', errorMessage: 'Hostel Name is required.' };
    if (!roomNo) return { status: 'INVALID', errorField: 'Room No', errorMessage: 'Room Number is required.' };

    const dedupeKey = `${hostelName.toUpperCase()}-${roomNo.toUpperCase()}`;
    if (seenKeys.has(dedupeKey)) return { status: 'DUPLICATE', errorField: 'Room No', errorMessage: `Duplicate Room ${roomNo} for ${hostelName} in file.` };
    seenKeys.add(dedupeKey);

    const hostels = db.getHostels();
    const hostel = hostels.find(h => h.name.toUpperCase() === hostelName.toUpperCase() || h.id === hostelName);
    const hostelId = hostel ? hostel.id : (hostels[0]?.id || 'hostel-1');

    const existingRooms = db.getHostelRooms();
    const existing = existingRooms.find(r => r.blockName.toUpperCase() === hostelName.toUpperCase() && r.roomNo.toUpperCase() === roomNo.toUpperCase());

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Room No', errorMessage: `Room "${roomNo}" in "${hostelName}" already exists.`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, blockName: hostelName, roomNo, capacity, occupied: existing.occupied || 0, status: (status === 'FULL' || status === 'MAINTENANCE') ? status : 'AVAILABLE' }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Room No', errorMessage: `Room "${roomNo}" in "${hostelName}" does not exist.` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { blockName: hostelName, roomNo, capacity, occupied: 0, status: (status === 'FULL' || status === 'MAINTENANCE') ? status : 'AVAILABLE' }
    };
  },
  commitRecord(data, mode, user, role) {
    const rooms = db.getHostelRooms();
    const existingIndex = rooms.findIndex(r => r.blockName.toUpperCase() === data.blockName.toUpperCase() && r.roomNo.toUpperCase() === data.roomNo.toUpperCase());
    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = rooms[existingIndex];
      rooms[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      rooms.push({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── 12. HOSTEL STUDENT ALLOTMENT IMPORT HANDLER ────────────────────────────
const HostelStudentHandler: IModuleImportHandler = {
  type: 'HOSTEL_STUDENT',
  name: 'Hostel Student Allotment Import',
  fileName: 'SSIU_Hostel_Student_Allotment_Template.xlsx',
  description: 'Bulk import of student hostel bed allotments.',
  headers: ['Enrollment Number', 'Hostel Name', 'Room No', 'Bed No', 'Allotment Date', 'Status'],
  requiredHeaders: ['Enrollment Number', 'Hostel Name', 'Room No'],
  sampleRows: [
    ['240101001', 'Boys Hostel A', '101', 'Bed 1', '2024-08-01', 'ACTIVE']
  ],
  instructions: [
    { field: 'Enrollment Number', required: 'YES', description: 'Student Enrollment No', example: '240101001' },
    { field: 'Hostel Name', required: 'YES', description: 'Name of the hostel', example: 'Boys Hostel A' },
    { field: 'Room No', required: 'YES', description: 'Allotted room number', example: '101' }
  ],
  validateRow(raw, seenKeys, mode, user, role) {
    const enrNo = getVal(raw, ['Enrollment Number', 'enrollmentNo', 'Enrollment', 'Student ID']);
    const hostelName = getVal(raw, ['Hostel Name', 'hostelName', 'Hostel']);
    const roomNo = getVal(raw, ['Room No', 'roomNo', 'RoomNumber']);
    const bedNo = getVal(raw, ['Bed No', 'bedNo', 'Bed']) || 'Bed 1';
    const allotmentDate = getVal(raw, ['Allotment Date', 'allotmentDate']) || new Date().toISOString().split('T')[0];
    const status = (getVal(raw, ['Status', 'status']) || 'ACTIVE').toUpperCase();

    if (!enrNo) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: 'Enrollment Number is required.' };
    if (!hostelName) return { status: 'INVALID', errorField: 'Hostel Name', errorMessage: 'Hostel Name is required.' };
    if (!roomNo) return { status: 'INVALID', errorField: 'Room No', errorMessage: 'Room Number is required.' };

    if (seenKeys.has(enrNo)) return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Duplicate allotment for student "${enrNo}" in file.` };
    seenKeys.add(enrNo);

    const student = db.getStudents().find(s => s.enrollmentNo.toUpperCase() === enrNo.toUpperCase() || s.id === enrNo);
    if (!student) return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `Student with Enrollment Number "${enrNo}" does not exist in ERP.` };

    const hostels = db.getHostels();
    const hostel = hostels.find(h => h.name.toUpperCase() === hostelName.toUpperCase() || h.id === hostelName);
    const hostelId = hostel ? hostel.id : (hostels[0]?.id || 'hostel-1');

    const existingAllotments = db.getHostelAllotments();
    const existing = existingAllotments.find(a => a.studentId === student.id && a.status === 'ACTIVE');

    if (existing) {
      if (mode === 'INSERT_ONLY') return { status: 'DUPLICATE', errorField: 'Enrollment Number', errorMessage: `Active hostel allotment already exists for student "${enrNo}".`, isExisting: true, targetId: existing.id };
      return {
        status: 'VALID',
        isExisting: true,
        targetId: existing.id,
        parsedData: { id: existing.id, studentId: student.id, studentName: student.name, enrollmentNo: student.enrollmentNo, hostelId, hostelName, roomNumber: roomNo, bedNumber: bedNo, allotmentDate, status }
      };
    }

    if (mode === 'UPDATE_ONLY') return { status: 'INVALID', errorField: 'Enrollment Number', errorMessage: `No existing hostel allotment found for student "${enrNo}".` };

    return {
      status: 'VALID',
      isExisting: false,
      parsedData: { studentId: student.id, studentName: student.name, enrollmentNo: student.enrollmentNo, hostelId, hostelName, roomNumber: roomNo, bedNumber: bedNo, allotmentDate, status }
    };
  },
  commitRecord(data, mode, user, role) {
    const allotments = db.getHostelAllotments();
    const existingIndex = allotments.findIndex(a => a.studentId === data.studentId);
    if (existingIndex >= 0 && (mode === 'UPSERT' || mode === 'UPDATE_ONLY')) {
      const existing = allotments[existingIndex];
      allotments[existingIndex] = { ...existing, ...data, id: existing.id };
      return { targetId: existing.id, action: 'UPDATED' };
    } else {
      const newId = `allot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      allotments.push({ ...data as any, id: newId });
      return { targetId: newId, action: 'CREATED' };
    }
  }
};

// ─── MASTER REGISTRY OF IMPORT HANDLERS ───────────────────────────────────────
export const HANDLERS_REGISTRY: Record<string, IModuleImportHandler> = {
  INSTITUTE: InstituteHandler,
  STUDENT: StudentHandler,
  FACULTY: FacultyHandler,
  STAFF: StaffHandler,
  DEPARTMENT: DepartmentHandler,
  PROGRAM: ProgramHandler,
  ACADEMIC_YEAR: AcademicYearHandler,
  SEMESTER: SemesterHandler,
  SUBJECT: SubjectHandler,
  INVENTORY_ASSET: InventoryAssetHandler,
  INVENTORY_CONSUMABLE: ConsumableHandler,
  HOSTEL_ROOM: HostelRoomHandler,
  HOSTEL_STUDENT: HostelStudentHandler
};

/**
 * RBAC & Scope Authorization Validator
 */
export function canUserImportModule(
  type: BulkImportType,
  user: User | null,
  role: UserRole | null
): { allowed: boolean; reason?: string } {
  if (!user || !role) {
    return { allowed: false, reason: '403 Forbidden: Authentication required to perform bulk data import.' };
  }

  // 1. Students are strictly denied from any bulk import or master modification
  if (role === 'STUDENT') {
    return { allowed: false, reason: '403 Forbidden: Students are strictly forbidden from performing bulk data imports or modifying master records.' };
  }

  // 2. Super Admin, University Admin, Registrar have university-level administrative scope
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN'].includes(role)) {
    return { allowed: true };
  }

  // 3. Lookup permission mapping
  const requiredPermission: BulkImportPermission = MODULE_TO_BULK_PERMISSION[type];
  const rolePermissions: BulkImportPermission[] = ROLE_BULK_IMPORT_PERMISSIONS[role] || [];

  if (!requiredPermission || !rolePermissions.includes(requiredPermission)) {
    return {
      allowed: false,
      reason: `403 Forbidden: Role "${role}" does not have the required permission "${requiredPermission || 'UNKNOWN'}" for module "${type}".`
    };
  }

  return { allowed: true };
}

// ─── UNIFIED BULK IMPORT SERVICE CLASS ───────────────────────────────────────
export class UnifiedBulkImportEngine {
  /**
   * Retrieves meta for all available or specific import templates
   */
  public getTemplateMetadata(type?: BulkImportType): BulkImportTemplateMeta[] {
    if (type && HANDLERS_REGISTRY[type]) {
      const h = HANDLERS_REGISTRY[type];
      return [{
        type: h.type,
        name: h.name,
        fileName: h.fileName,
        description: h.description,
        headers: h.headers,
        requiredHeaders: h.requiredHeaders
      }];
    }

    return Object.values(HANDLERS_REGISTRY).map(h => ({
      type: h.type,
      name: h.name,
      fileName: h.fileName,
      description: h.description,
      headers: h.headers,
      requiredHeaders: h.requiredHeaders
    }));
  }

  /**
   * Generates and triggers download of official multi-sheet Excel (.xlsx only) Template
   */
  public downloadOfficialTemplate(type: BulkImportType, user?: User | null): void {
    const handler = HANDLERS_REGISTRY[type];
    if (!handler) throw new Error(`Unsupported bulk import module: ${type}`);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Main Data Entry Sheet with Sample Rows
    const wsData = XLSX.utils.aoa_to_sheet([handler.headers, ...handler.sampleRows]);
    wsData['!cols'] = handler.headers.map(h => ({ wch: Math.max(h.length + 5, 18) }));
    XLSX.utils.book_append_sheet(wb, wsData, 'Template_Data_Entry');

    // Sheet 2: Data Validation & Instructions Sheet
    const instructionRows = [
      ['Column Header', 'Mandatory (YES/NO)', 'Field Description', 'Valid Format / Example'],
      ...handler.instructions.map(i => [i.field, i.required, i.description, i.example])
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionRows);
    wsInstructions['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 45 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions_Rules');

    // Sheet 3: Live Reference - Institutes
    const institutes = db.getInstitutes();
    const instRows = [
      ['Institute Code', 'Institute Name', 'Type'],
      ...institutes.map(i => [i.code, i.name, i.type || 'Academic'])
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instRows);
    wsInst['!cols'] = [{ wch: 16 }, { wch: 38 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Reference_Institutes');

    // Sheet 4: Live Reference - Departments
    const departments = db.getDepartments();
    const deptRows = [
      ['Department Code', 'Department Name', 'Institute Code'],
      ...departments.map(d => {
        const inst = institutes.find(i => i.id === d.instituteId);
        return [d.code, d.name, inst?.code || d.instituteId];
      })
    ];
    const wsDept = XLSX.utils.aoa_to_sheet(deptRows);
    wsDept['!cols'] = [{ wch: 18 }, { wch: 38 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsDept, 'Reference_Departments');

    // Sheet 5: Live Reference - Programs
    const programs = db.getPrograms();
    const progRows = [
      ['Program Code', 'Program Name', 'Degree Type', 'Institute Code'],
      ...programs.map(p => {
        const inst = institutes.find(i => i.id === p.instituteId);
        return [p.code, p.name, p.degreeType, inst?.code || p.instituteId];
      })
    ];
    const wsProg = XLSX.utils.aoa_to_sheet(progRows);
    wsProg['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsProg, 'Reference_Programs');

    // Write file
    XLSX.writeFile(wb, handler.fileName);
  }

  /**
   * Uploads, rigorously validates column schema & rows, and builds pre-import preview
   */
  public async validateAndParseExcelFile(
    type: BulkImportType,
    file: File,
    mode: BulkImportMode = 'INSERT_ONLY',
    user: User | null,
    role: UserRole | null
  ): Promise<BulkImportPreviewResult> {
    // 0. Strict Server-Side Authentication & Scope Authorization Guard
    const authCheck = canUserImportModule(type, user, role);
    if (!authCheck.allowed) {
      db.logAudit(
        'UNAUTHORIZED_IMPORT_ATTEMPT',
        'Bulk Data Management',
        `Access Denied: ${user?.name || 'Anonymous'} (${role || 'UNKNOWN'}) attempted unauthorized bulk import for module "${type}". Reason: ${authCheck.reason}`,
        user?.name || 'Anonymous',
        role || undefined
      );
      throw new Error(authCheck.reason || '403 Forbidden: Unauthorized bulk import attempt.');
    }

    const handler = HANDLERS_REGISTRY[type];
    if (!handler) throw new Error(`Unsupported bulk import module: ${type}`);

    // 1. Strict File Type Validation (Reject non-.xlsx)
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!isXlsx) {
      throw new Error(`Invalid file format "${file.name}". Only official Microsoft Excel (.xlsx) files are accepted. (CSV, XLS, and other formats are strictly rejected).`);
    }

    // 2. Read Binary Array
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error('The uploaded Excel workbook contains no valid data sheets.');
    }

    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      throw new Error('The uploaded Excel sheet contains no data rows.');
    }

    // 3. Column Header Schema Validation
    const uploadedHeaders = Object.keys(rawRows[0] || {}).map(h => h.trim());
    const missingRequired = handler.requiredHeaders.filter(
      req => !uploadedHeaders.some(u => u.toLowerCase() === req.toLowerCase())
    );

    if (missingRequired.length > 0) {
      return {
        session: {} as any,
        totalRows: rawRows.length,
        validRows: 0,
        invalidRows: rawRows.length,
        duplicateRows: 0,
        newRecords: 0,
        existingRecords: 0,
        warningsCount: 0,
        rows: [],
        templateValid: false,
        templateErrors: [
          `INVALID EXCEL TEMPLATE: Missing required columns: ${missingRequired.join(', ')}.`,
          `Expected columns: ${handler.headers.join(', ')}`
        ]
      };
    }

    // 4. Create Batch Session
    const importId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const count = (db.getRawState().bulkImports || []).length + 1;
    const importNo = `IMP-${new Date().getFullYear()}-${String(count).padStart(6, '0')}`;

    const session: BulkImportSession = {
      id: importId,
      importNo,
      importType: type,
      fileName: file.name,
      fileSize: file.size,
      uploadedByUserId: user?.id || 'admin-1',
      uploadedByName: user?.name || 'Authorized User',
      uploadedByRole: role || user?.role || 'SUPER_ADMIN',
      instituteId: user?.instituteId,
      departmentId: user?.departmentId,
      status: 'VALIDATED',
      importMode: mode,
      totalRows: rawRows.length,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      importedRows: 0,
      failedRows: 0,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `hist-${Date.now()}`,
          importId,
          action: 'IMPORT_VALIDATED',
          performedByUserId: user?.id || 'admin-1',
          performedByName: user?.name || 'Authorized User',
          performedByRole: role || user?.role,
          details: `Uploaded and validated ${rawRows.length} rows for module ${type}`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // 5. Row-by-Row Deep Validation
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let newCount = 0;
    let existingCount = 0;
    let warningsCount = 0;
    const seenKeys = new Set<string>();

    const rowItems: BulkImportRowItem[] = rawRows.map((raw, idx) => {
      const res = handler.validateRow(raw, seenKeys, mode, user, role);
      const rowItem: BulkImportRowItem = {
        id: `row-${importId}-${idx + 1}`,
        rowNumber: idx + 1,
        status: res.status,
        rawData: raw,
        parsedData: res.parsedData,
        errorMessage: res.errorMessage,
        errorField: res.errorField,
        warningMessage: res.warningMessage,
        isExisting: res.isExisting,
        targetId: res.targetId
      };

      if (res.status === 'VALID') {
        validCount++;
        if (res.isExisting) existingCount++;
        else newCount++;
      } else if (res.status === 'DUPLICATE') {
        duplicateCount++;
      } else {
        invalidCount++;
      }

      if (res.warningMessage) warningsCount++;

      return rowItem;
    });

    session.validRows = validCount;
    session.invalidRows = invalidCount;
    session.duplicateRows = duplicateCount;
    session.status = validCount > 0 ? 'READY' : 'FAILED';
    session.validationSummary = JSON.stringify({
      valid: validCount,
      invalid: invalidCount,
      duplicate: duplicateCount,
      new: newCount,
      existing: existingCount,
      total: rawRows.length
    });

    // Store in DB state
    const state = db.getRawState();
    if (!state.bulkImports) state.bulkImports = [];
    if (!state.bulkImportRows) state.bulkImportRows = [];

    state.bulkImports.unshift(session);
    state.bulkImportRows.push(...rowItems);
    db.saveState();

    // Log Audit
    db.logAudit(
      'IMPORT_VALIDATED',
      'Bulk Data Management',
      `Validated ${rawRows.length} ${type} rows (${validCount} valid, ${invalidCount} invalid, ${duplicateCount} duplicates)`,
      user?.name || 'Authorized Admin',
      role || user?.role || 'SUPER_ADMIN'
    );

    return {
      session,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      newRecords: newCount,
      existingRecords: existingCount,
      warningsCount,
      rows: rowItems,
      templateValid: true
    };
  }

  /**
   * Executes safe batch database transaction for confirmed rows
   */
  public executeBatchTransaction(
    importId: string,
    mode: BulkImportMode,
    user: User | null,
    role: UserRole | null,
    selectedRowNumbers?: number[]
  ): {
    success: boolean;
    importedCount: number;
    updatedCount: number;
    failedCount: number;
    session: BulkImportSession;
    message: string;
  } {
    const state = db.getRawState();
    const sessions = state.bulkImports || [];
    const allRows = state.bulkImportRows || [];

    const session = sessions.find(s => s.id === importId);
    if (!session) throw new Error('Bulk import batch session not found.');

    // Strict Server-Side Re-validation of Authorization before DB Mutation
    const authCheck = canUserImportModule(session.importType, user, role);
    if (!authCheck.allowed) {
      db.logAudit(
        'UNAUTHORIZED_IMPORT_EXECUTE_ATTEMPT',
        'Bulk Data Management',
        `Access Denied on Commit: ${user?.name || 'Anonymous'} (${role || 'UNKNOWN'}) attempted to commit batch ${session.importNo} for module "${session.importType}". Reason: ${authCheck.reason}`,
        user?.name || 'Anonymous',
        role || undefined
      );
      throw new Error(authCheck.reason || '403 Forbidden: Unauthorized commit attempt.');
    }

    if (session.status === 'IMPORTED' || session.status === 'COMPLETED') {
      throw new Error('This bulk import batch has already been completed.');
    }

    const handler = HANDLERS_REGISTRY[session.importType];
    if (!handler) throw new Error(`No handler registered for module ${session.importType}`);

    const candidateRows = allRows.filter(r =>
      r.id.startsWith(`row-${importId}-`) &&
      r.status === 'VALID' &&
      (!selectedRowNumbers || selectedRowNumbers.includes(r.rowNumber))
    );

    if (candidateRows.length === 0) {
      throw new Error('No valid records are available to commit.');
    }

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    // Transactional Execution Loop
    candidateRows.forEach(r => {
      try {
        const data = r.parsedData || r.rawData;
        const res = handler.commitRecord(data, mode, user, role);
        r.status = 'IMPORTED';
        r.targetId = res.targetId;
        if (res.action === 'UPDATED') updatedCount++;
        else createdCount++;
      } catch (err: any) {
        r.status = 'FAILED';
        r.errorMessage = err.message || 'Database commit failed';
        failedCount++;
      }
    });

    const totalSuccess = createdCount + updatedCount;
    session.importedRows = totalSuccess;
    session.updatedRows = updatedCount;
    session.failedRows = failedCount;
    session.status = failedCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
    session.completedAt = new Date().toISOString();

    if (!session.history) session.history = [];
    session.history.unshift({
      id: `hist-${Date.now()}`,
      importId,
      action: 'IMPORT_COMPLETED',
      performedByUserId: user?.id || 'admin-1',
      performedByName: user?.name || 'Authorized Admin',
      performedByRole: role || user?.role,
      details: `Committed ${totalSuccess} records (${createdCount} created, ${updatedCount} updated, ${failedCount} failed)`,
      timestamp: new Date().toISOString()
    });

    db.saveState();

    // Log Audit
    db.logAudit(
      'IMPORT_COMPLETED',
      'Bulk Data Management',
      `Imported ${totalSuccess} ${session.importType} records (Batch: ${session.importNo})`,
      user?.name || 'Authorized Admin',
      role || user?.role || 'SUPER_ADMIN'
    );

    return {
      success: true,
      importedCount: createdCount,
      updatedCount,
      failedCount,
      session,
      message: `Successfully imported ${totalSuccess} records (${createdCount} created, ${updatedCount} updated, ${failedCount} failed).`
    };
  }

  /**
   * Generates and downloads Error Excel (.xlsx only) containing original rows + validation error notes
   */
  public generateErrorExcelReport(importId: string, user?: User | null): void {
    const state = db.getRawState();
    const sessions = state.bulkImports || [];
    const allRows = state.bulkImportRows || [];

    const session = sessions.find(s => s.id === importId);
    if (!session) return;

    const errorRows = allRows.filter(r =>
      r.id.startsWith(`row-${importId}-`) &&
      (r.status === 'INVALID' || r.status === 'DUPLICATE' || r.status === 'FAILED')
    );

    if (errorRows.length === 0) {
      alert('No error rows found in this import session.');
      return;
    }

    const exportData = errorRows.map(r => ({
      ...r.rawData,
      '[Validation_Status]': r.status,
      '[Error_Field]': r.errorField || 'General',
      '[Error_Description]': r.errorMessage || 'Validation failed'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');

    const fileName = `Error_Report_${session.importType}_${session.importNo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Retrieves import history scoped to user permissions
   */
  public getImportHistory(type?: BulkImportType, user?: User | null, role?: UserRole | null): BulkImportSession[] {
    const state = db.getRawState();
    let list = state.bulkImports || [];

    if (type) {
      list = list.filter(s => s.importType === type);
    }

    if (role === 'PRINCIPAL' && user?.instituteId) {
      list = list.filter(s => !s.instituteId || s.instituteId === user.instituteId);
    } else if (role === 'HOD' && user?.departmentId) {
      list = list.filter(s => !s.departmentId || s.departmentId === user.departmentId);
    }

    return list;
  }
}

export const unifiedBulkImportEngine = new UnifiedBulkImportEngine();
