import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface TemplateDefinition {
  type: string;
  name: string;
  fileName: string;
  description: string;
  headers: string[];
  sampleRows: any[][];
  instructions: { field: string; required: string; description: string; example: string }[];
}

@Injectable()
export class TemplateGeneratorService {
  private readonly templates: Record<string, TemplateDefinition> = {
    STUDENT: {
      type: 'STUDENT',
      name: 'Student Admission & Enrollment Master',
      fileName: 'Student_Import_Template.xlsx',
      description: 'Template for bulk registering student admissions, academic allocations, and profiles.',
      headers: [
        'Enrollment Number',
        'Student Name',
        'Email',
        'Mobile',
        'Date of Birth (YYYY-MM-DD)',
        'Gender',
        'Institute Code',
        'Department Code',
        'Program Code',
        'Academic Year',
        'Semester (1-8)',
        'Admission Year',
        'Student Type',
        'Nationality',
        'Passport Number',
        'Status',
      ],
      sampleRows: [
        ['EN202600101', 'Aarav Sharma', 'aarav.sharma@example.com', '9876543210', '2004-05-15', 'MALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 1, 2026, 'REGULAR', 'INDIAN', '', 'ACTIVE'],
        ['EN202600102', 'Priya Patel', 'priya.patel@example.com', '9876543211', '2004-08-22', 'FEMALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 1, 2026, 'REGULAR', 'INDIAN', '', 'ACTIVE'],
        ['EN202600103', 'John Doe', 'john.doe@example.com', '9876543212', '2003-11-10', 'MALE', 'INST-ENG', 'DEP-CSE', 'PROG-BTECH-CSE', '2026-27', 3, 2025, 'INTERNATIONAL', 'NIGERIAN', 'A12345678', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Unique university enrollment/roll number', example: 'EN202600101' },
        { field: 'Student Name', required: 'YES', description: 'Full name of candidate', example: 'Aarav Sharma' },
        { field: 'Email', required: 'YES', description: 'Valid primary email address', example: 'aarav@example.com' },
        { field: 'Mobile', required: 'YES', description: '10-digit mobile number', example: '9876543210' },
        { field: 'Date of Birth', required: 'YES', description: 'Format: YYYY-MM-DD', example: '2004-05-15' },
        { field: 'Gender', required: 'YES', description: 'MALE | FEMALE | OTHER', example: 'MALE' },
        { field: 'Institute Code', required: 'YES', description: 'Valid Institute Code (e.g. INST-ENG)', example: 'INST-ENG' },
        { field: 'Department Code', required: 'YES', description: 'Valid Department Code (e.g. DEP-CSE)', example: 'DEP-CSE' },
        { field: 'Program Code', required: 'YES', description: 'Valid Program Code (e.g. PROG-BTECH-CSE)', example: 'PROG-BTECH-CSE' },
        { field: 'Student Type', required: 'NO', description: 'REGULAR | LATERAL_ENTRY | TRANSFER | INTERNATIONAL', example: 'REGULAR' },
      ],
    },

    FACULTY: {
      type: 'FACULTY',
      name: 'Faculty & Staff Master',
      fileName: 'Faculty_Import_Template.xlsx',
      description: 'Template for bulk creating teaching and non-teaching faculty profiles.',
      headers: [
        'Employee ID',
        'Faculty Name',
        'Email',
        'Mobile',
        'Department Code',
        'Designation',
        'Institute Code',
        'Joining Date (YYYY-MM-DD)',
        'Status',
      ],
      sampleRows: [
        ['EMP-1001', 'Dr. Rajesh Kumar', 'rajesh.kumar@swarrnim.edu.in', '9811223344', 'DEP-CSE', 'Professor', 'INST-ENG', '2022-06-01', 'ACTIVE'],
        ['EMP-1002', 'Prof. Sunita Rao', 'sunita.rao@swarrnim.edu.in', '9822334455', 'DEP-ECE', 'Associate Professor', 'INST-ENG', '2023-01-15', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Employee ID', required: 'YES', description: 'Unique staff identifier', example: 'EMP-1001' },
        { field: 'Faculty Name', required: 'YES', description: 'Full name with title', example: 'Dr. Rajesh Kumar' },
        { field: 'Email', required: 'YES', description: 'Official university email', example: 'rajesh@swarrnim.edu.in' },
        { field: 'Department Code', required: 'YES', description: 'Department code identifier', example: 'DEP-CSE' },
        { field: 'Designation', required: 'YES', description: 'Professor | Associate Professor | Assistant Professor | Lecturer', example: 'Professor' },
      ],
    },

    STAFF: {
      type: 'STAFF',
      name: 'Non-Teaching Staff Master',
      fileName: 'Staff_Import_Template.xlsx',
      description: 'Template for bulk registering non-teaching administrative, technical, and support staff.',
      headers: [
        'Employee Code',
        'Staff Name',
        'Email',
        'Mobile',
        'Department Code',
        'Designation',
        'Institute Code',
        'Employment Type',
        'Joining Date (YYYY-MM-DD)',
        'Status',
      ],
      sampleRows: [
        ['STF-1001', 'Ramesh Patel', 'ramesh.patel@swarrnim.edu.in', '9898011223', 'DEP-ADMIN', 'Office Superintendent', 'INST-ENG', 'FULL_TIME', '2023-04-01', 'ACTIVE'],
        ['STF-1002', 'Bhavna Dave', 'bhavna.dave@swarrnim.edu.in', '9898022334', 'DEP-CSE', 'Senior Lab Technician', 'INST-ENG', 'FULL_TIME', '2023-06-15', 'ACTIVE'],
        ['STF-1003', 'Kishore Joshi', 'kishore.joshi@swarrnim.edu.in', '9898033445', 'DEP-ACCOUNTS', 'Accountant', 'INST-ENG', 'FULL_TIME', '2024-01-10', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Employee Code', required: 'YES', description: 'Unique non-teaching staff identifier (Official ERP Login ID)', example: 'STF-1001' },
        { field: 'Staff Name', required: 'YES', description: 'Full legal name of staff member', example: 'Ramesh Patel' },
        { field: 'Email', required: 'YES', description: 'Official or personal email address', example: 'ramesh.patel@swarrnim.edu.in' },
        { field: 'Department Code', required: 'YES', description: 'Valid Department Code (e.g. DEP-ADMIN, DEP-CSE)', example: 'DEP-ADMIN' },
        { field: 'Designation', required: 'YES', description: 'Job title / cadre designation', example: 'Office Superintendent' },
        { field: 'Institute Code', required: 'YES', description: 'Valid Institute Code (e.g. INST-ENG)', example: 'INST-ENG' },
        { field: 'Employment Type', required: 'NO', description: 'FULL_TIME | PART_TIME | CONTRACT | ADHOC', example: 'FULL_TIME' },
      ],
    },

    SUBJECT: {
      type: 'SUBJECT',
      name: 'Academic Subject Curriculum Master',
      fileName: 'Subject_Import_Template.xlsx',
      description: 'Template for uploading university courses, syllabus codes, and credit rules.',
      headers: [
        'Subject Code',
        'Subject Name',
        'Program Code',
        'Department Code',
        'Semester',
        'Academic Year',
        'Credits',
        'Subject Type',
        'Maximum Marks',
        'Passing Marks',
        'Status',
      ],
      sampleRows: [
        ['CS501', 'Database Management Systems', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 4, 'THEORY', 100, 40, 'ACTIVE'],
        ['CS502', 'Operating Systems', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 4, 'THEORY', 100, 40, 'ACTIVE'],
        ['CS503P', 'DBMS Practical Lab', 'PROG-BTECH-CSE', 'DEP-CSE', 5, '2026-27', 2, 'PRACTICAL', 50, 20, 'ACTIVE'],
      ],
      instructions: [
        { field: 'Subject Code', required: 'YES', description: 'Unique syllabus subject code', example: 'CS501' },
        { field: 'Subject Name', required: 'YES', description: 'Official subject title', example: 'Database Management Systems' },
        { field: 'Credits', required: 'YES', description: 'Integer credit weight (e.g. 1 to 6)', example: '4' },
        { field: 'Subject Type', required: 'YES', description: 'THEORY | PRACTICAL | ELECTIVE | VIVA', example: 'THEORY' },
        { field: 'Passing Marks', required: 'YES', description: 'Minimum required passing marks', example: '40' },
      ],
    },

    EXAM_FORM: {
      type: 'EXAM_FORM',
      name: 'Examination Form Bulk Submission',
      fileName: 'Exam_Form_Import_Template.xlsx',
      description: 'Template for staging regular and backlog examination candidate forms.',
      headers: [
        'Application Number',
        'Enrollment Number',
        'Exam Code',
        'Exam Type',
        'Subject Codes (Comma Separated)',
        'Academic Year',
        'Semester',
        'Payment Reference',
        'Status',
      ],
      sampleRows: [
        ['APP-EX-2026-001', 'EN202600101', 'SUMMER-2026', 'REGULAR', 'CS501, CS502, CS503P', '2026-27', 5, 'TXN-987654', 'VERIFIED'],
        ['APP-EX-2026-002', 'EN202600102', 'SUMMER-2026', 'REGULAR', 'CS501, CS502, CS503P', '2026-27', 5, 'TXN-987655', 'VERIFIED'],
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Registered candidate enrollment no', example: 'EN202600101' },
        { field: 'Exam Code', required: 'YES', description: 'Active Examination code', example: 'SUMMER-2026' },
        { field: 'Exam Type', required: 'YES', description: 'REGULAR | REMEDIAL | BACKLOG', example: 'REGULAR' },
        { field: 'Subject Codes', required: 'YES', description: 'Comma separated list of subject codes', example: 'CS501, CS502' },
      ],
    },

    MARKS: {
      type: 'MARKS',
      name: 'Student Evaluation Marks Entry',
      fileName: 'Marks_Import_Template.xlsx',
      description: 'Template for uploading raw internal, external, and practical marks.',
      headers: [
        'Enrollment Number',
        'Exam Code',
        'Subject Code',
        'Internal Marks (Max 30)',
        'External Marks (Max 70)',
        'Practical Marks (Max 50)',
        'Viva Marks (Max 20)',
        'Attendance Marks (Max 10)',
        'Result Flag',
      ],
      sampleRows: [
        ['EN202600101', 'SUMMER-2026', 'CS501', 28, 62, 0, 0, 0, 'NORMAL'],
        ['EN202600102', 'SUMMER-2026', 'CS501', 22, 54, 0, 0, 0, 'NORMAL'],
        ['EN202600103', 'SUMMER-2026', 'CS501', 0, 0, 0, 0, 0, 'ABSENT'],
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Valid enrolled student roll number', example: 'EN202600101' },
        { field: 'Exam Code', required: 'YES', description: 'Valid active exam code', example: 'SUMMER-2026' },
        { field: 'Subject Code', required: 'YES', description: 'Subject code being graded', example: 'CS501' },
        { field: 'Result Flag', required: 'NO', description: 'NORMAL | ABSENT | MALPRACTICE | WITHHELD', example: 'NORMAL' },
      ],
    },

    HOSTEL_STUDENT: {
      type: 'HOSTEL_STUDENT',
      name: 'Hostel Bed Allotment Master',
      fileName: 'Hostel_Allotment_Import_Template.xlsx',
      description: 'Template for allocating hostel rooms and beds to students.',
      headers: [
        'Enrollment Number',
        'Hostel Code',
        'Room Number',
        'Bed Number',
        'Academic Year',
        'Allotment Date (YYYY-MM-DD)',
        'Remarks',
      ],
      sampleRows: [
        ['EN202600101', 'HST-BH1', '101', 'B1', '2026-27', '2026-07-01', 'Boys Hostel Block A'],
        ['EN202600102', 'HST-GH1', '201', 'B2', '2026-27', '2026-07-01', 'Girls Hostel Block B'],
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Student enrollment number', example: 'EN202600101' },
        { field: 'Hostel Code', required: 'YES', description: 'Hostel code (e.g. HST-BH1)', example: 'HST-BH1' },
        { field: 'Room Number', required: 'YES', description: 'Room number inside hostel', example: '101' },
        { field: 'Bed Number', required: 'YES', description: 'Bed number identifier (e.g. B1, B2)', example: 'B1' },
      ],
    },

    HOSTEL_ROOM: {
      type: 'HOSTEL_ROOM',
      name: 'Hostel Rooms & Capacity Master',
      fileName: 'Hostel_Rooms_Import_Template.xlsx',
      description: 'Template for configuring hostel blocks, room types, and bed capacities.',
      headers: [
        'Hostel Code',
        'Room Number',
        'Floor',
        'Capacity',
        'Room Type',
        'Facilities',
        'Status',
      ],
      sampleRows: [
        ['HST-BH1', '101', 1, 2, 'NON_AC', 'Attached Bath, Study Table', 'AVAILABLE'],
        ['HST-BH1', '102', 1, 3, 'AC', 'Attached Bath, AC, Balcony', 'AVAILABLE'],
      ],
      instructions: [
        { field: 'Hostel Code', required: 'YES', description: 'Hostel code identifier', example: 'HST-BH1' },
        { field: 'Room Number', required: 'YES', description: 'Room number within hostel', example: '101' },
        { field: 'Capacity', required: 'YES', description: 'Maximum student capacity (> 0)', example: '2' },
        { field: 'Room Type', required: 'YES', description: 'AC | NON_AC | DELUXE', example: 'NON_AC' },
      ],
    },

    FEE_ASSIGNMENT: {
      type: 'FEE_ASSIGNMENT',
      name: 'Student Fee Structure Assignment',
      fileName: 'Fee_Assignment_Import_Template.xlsx',
      description: 'Template for bulk assigning academic, tuition, and hostel dues to students.',
      headers: [
        'Enrollment Number',
        'Academic Year',
        'Semester',
        'Fee Head Code',
        'Amount',
        'Due Date (YYYY-MM-DD)',
        'Concession Amount',
        'Status',
      ],
      sampleRows: [
        ['EN202600101', '2026-27', 1, 'FH-TUIT', 45000, '2026-08-31', 0, 'UNPAID'],
        ['EN202600102', '2026-27', 1, 'FH-TUIT', 45000, '2026-08-31', 5000, 'UNPAID'],
      ],
      instructions: [
        { field: 'Enrollment Number', required: 'YES', description: 'Student enrollment number', example: 'EN202600101' },
        { field: 'Fee Head Code', required: 'YES', description: 'Valid fee head (e.g. FH-TUIT, FH-EXAM, FH-HSTL)', example: 'FH-TUIT' },
        { field: 'Amount', required: 'YES', description: 'Total fee payable amount', example: '45000' },
        { field: 'Due Date', required: 'YES', description: 'Due date in YYYY-MM-DD format', example: '2026-08-31' },
      ],
    },

    TRANSPORT_VEHICLE: {
      type: 'TRANSPORT_VEHICLE',
      name: 'Transport Vehicle Fleet Master',
      fileName: 'Transport_Vehicle_Import_Template.xlsx',
      description: 'Template for registering university buses, vans, and emergency vehicles.',
      headers: [
        'Vehicle Number',
        'Vehicle Type',
        'Make Model',
        'Capacity',
        'Fuel Type',
        'Registration Date (YYYY-MM-DD)',
        'Insurance Expiry (YYYY-MM-DD)',
        'Fitness Expiry (YYYY-MM-DD)',
        'Permit Expiry (YYYY-MM-DD)',
        'Status',
      ],
      sampleRows: [
        ['GJ-01-AB-1234', 'BUS', 'Tata Starbus 40 Seater', 40, 'DIESEL', '2022-01-10', '2027-01-10', '2027-01-10', '2027-01-10', 'ACTIVE'],
        ['GJ-01-CD-5678', 'MINI_BUS', 'Eicher Skyline 25 Seater', 25, 'CNG', '2023-03-15', '2028-03-15', '2028-03-15', '2028-03-15', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Vehicle Number', required: 'YES', description: 'Unique vehicle registration number', example: 'GJ-01-AB-1234' },
        { field: 'Vehicle Type', required: 'YES', description: 'BUS | MINI_BUS | VAN | AMBULANCE | CAR', example: 'BUS' },
        { field: 'Capacity', required: 'YES', description: 'Passenger seat capacity', example: '40' },
      ],
    },

    TRANSPORT_DRIVER: {
      type: 'TRANSPORT_DRIVER',
      name: 'Transport Driver Profile Master',
      fileName: 'Transport_Driver_Import_Template.xlsx',
      description: 'Template for registering licensed commercial drivers.',
      headers: [
        'Driver Name',
        'Contact Number',
        'License Number',
        'License Type',
        'License Expiry (YYYY-MM-DD)',
        'Experience Years',
        'Address',
        'Status',
      ],
      sampleRows: [
        ['Ramesh Bhai Patel', '9898012345', 'DL-GJ01-2015-001234', 'HEAVY_VEHICLE', '2030-05-20', 8.5, 'Ahmedabad, Gujarat', 'ACTIVE'],
        ['Suresh Singh', '9898054321', 'DL-GJ01-2018-005678', 'COMMERCIAL', '2032-08-14', 6.0, 'Gandhinagar, Gujarat', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Driver Name', required: 'YES', description: 'Full name of driver', example: 'Ramesh Bhai Patel' },
        { field: 'License Number', required: 'YES', description: 'Unique driving license number', example: 'DL-GJ01-2015-001234' },
        { field: 'Contact Number', required: 'YES', description: '10-digit mobile number', example: '9898012345' },
      ],
    },

    TRANSPORT_ROUTE: {
      type: 'TRANSPORT_ROUTE',
      name: 'Transport Bus Route Master',
      fileName: 'Transport_Route_Import_Template.xlsx',
      description: 'Template for defining campus transit routes, stops, and schedules.',
      headers: [
        'Route Number',
        'Route Name',
        'Start Point',
        'End Point',
        'Distance KM',
        'Duration Minutes',
        'Monthly Fee',
        'Stops (Name:PickupTime:DropTime; ...)',
        'Status',
      ],
      sampleRows: [
        ['R-101', 'Ahmedabad ISKCON to Swarrnim Campus', 'ISKCON Cross Road', 'Main Campus', 28.5, 50, 2500, 'ISKCON:07:30 AM:05:45 PM; Shivranjani:07:45 AM:05:30 PM; Campus:08:20 AM:05:00 PM', 'ACTIVE'],
        ['R-102', 'Gandhinagar Sector 11 to Campus', 'Sector 11 Bus Station', 'Main Campus', 15.0, 30, 2000, 'Sec 11:07:45 AM:05:30 PM; GH-0:08:00 AM:05:15 PM; Campus:08:20 AM:05:00 PM', 'ACTIVE'],
      ],
      instructions: [
        { field: 'Route Number', required: 'YES', description: 'Unique route code (e.g. R-101)', example: 'R-101' },
        { field: 'Route Name', required: 'YES', description: 'Descriptive route title', example: 'Ahmedabad ISKCON to Swarrnim Campus' },
        { field: 'Monthly Fee', required: 'YES', description: 'Monthly subscription fee in INR', example: '2500' },
      ],
    },
  };

  getTemplateList() {
    return Object.values(this.templates).map(t => ({
      type: t.type,
      name: t.name,
      fileName: t.fileName,
      description: t.description,
      headers: t.headers,
    }));
  }

  getTemplateDefinition(type: string): TemplateDefinition | null {
    return this.templates[type.toUpperCase()] || null;
  }

  generateExcelBuffer(type: string): Buffer {
    const tpl = this.getTemplateDefinition(type);
    if (!tpl) throw new Error(`Template for type "${type}" does not exist.`);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Template data with headers and sample rows
    const dataRows = [tpl.headers, ...tpl.sampleRows];
    const wsData = XLSX.utils.aoa_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Template');

    // Sheet 2: Field Instructions & Rules
    const instructionHeaders = ['Field Name', 'Required?', 'Description', 'Example Value'];
    const instructionRows = tpl.instructions.map(i => [i.field, i.required, i.description, i.example]);
    const wsInst = XLSX.utils.aoa_to_sheet([instructionHeaders, ...instructionRows]);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions & Guidelines');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  generateErrorReportBuffer(importNo: string, importType: string, errors: { rowNumber: number; field: string; enteredValue: string; errorMessage: string }[]): Buffer {
    const wb = XLSX.utils.book_new();

    const headers = ['Row Number', 'Field Name', 'Entered Value', 'Validation Error / Reason'];
    const rows = errors.map(e => [e.rowNumber, e.field, e.enteredValue, e.errorMessage]);

    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ...rows,
    ]);

    XLSX.utils.book_append_sheet(wb, ws, 'Import Error Report');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
