import * as XLSX from 'xlsx';
import { db } from './db';
import { SessionPlanTopic, Subject, User, UserRole, TimetableEntry, AttendanceSession } from '../types';

export interface SyllabusImportRow {
  rowNumber: number;
  subjectCode: string;
  subjectName: string;
  unitNo: number;
  unitTitle: string;
  lectureNo: number;
  topicTitle: string;
  subTopic?: string;
  teachingMethod: string;
  plannedDate: string;
  durationHours: number;
  referenceMaterial?: string;
  remarks?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface SyllabusImportValidationResult {
  totalRows: number;
  validRows: SyllabusImportRow[];
  invalidRows: SyllabusImportRow[];
  duplicateRows: SyllabusImportRow[];
}

export interface SyllabusStats {
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  inProgressTopics: number;
  completionPercentage: number;
  totalUnits: number;
}

class SessionPlanService {
  /**
   * Get subjects assigned to faculty or all subjects for admins
   */
  /**
   * Get subjects assigned to faculty, or relevant to mentor's assigned mentees, or all subjects for admins
   */
  public getFacultySubjects(user?: User | null, role?: UserRole): Subject[] {
    const allSubjects = db.getSubjects();
    if (!user) return allSubjects;

    if (role === 'MENTOR') {
      const assignments = db.getMentorAssignments().filter(a => a.mentorFacultyId === user.id && a.status === 'ACTIVE');
      if (assignments.length > 0) {
        const studentIds = new Set(assignments.map(a => a.studentId));
        const students = db.getStudents().filter(s => studentIds.has(s.id));
        const semesterIds = new Set(students.map(s => s.semesterId).filter(Boolean));
        const programIds = new Set(students.map(s => s.programId).filter(Boolean));
        const departmentIds = new Set(students.map(s => s.departmentId).filter(Boolean));

        const menteeSubjects = allSubjects.filter(s => {
          if (departmentIds.size > 0 && !departmentIds.has(s.departmentId)) return false;
          if (semesterIds.size > 0 && s.semesterId && !semesterIds.has(s.semesterId)) return false;
          if (programIds.size > 0 && s.programId && !programIds.has(s.programId)) return false;
          return true;
        });

        if (menteeSubjects.length > 0) return menteeSubjects;
      }

      // Department subjects fallback for Mentor
      const deptSubjects = allSubjects.filter(s => s.departmentId === user.departmentId || s.departmentId === 'dept-1');
      if (deptSubjects.length > 0) return deptSubjects;
      return allSubjects.slice(0, 4);
    }

    if (role !== 'FACULTY') {
      return allSubjects;
    }

    const fac = db.getFaculty().find(f => f.id === user.id || f.email === user.email);
    if (fac?.subjectIds && fac.subjectIds.length > 0) {
      const assigned = allSubjects.filter(s => fac.subjectIds.includes(s.id));
      if (assigned.length > 0) return assigned;
    }

    // Default to department subjects or first 4 core subjects
    const deptSubjects = allSubjects.filter(s => s.departmentId === user.departmentId || s.departmentId === fac?.departmentId);
    if (deptSubjects.length > 0) return deptSubjects;

    return allSubjects.slice(0, 4);
  }

  /**
   * Get session plan topics for a subject sorted by unit and lecture number
   */
  public getSessionPlanTopics(subjectId: string): SessionPlanTopic[] {
    const allTopics = db.getSessionPlanTopics();
    return allTopics
      .filter(t => t.subjectId === subjectId)
      .sort((a, b) => {
        if (a.unitNo !== b.unitNo) return a.unitNo - b.unitNo;
        return a.lectureNo - b.lectureNo;
      });
  }

  /**
   * Calculate syllabus completion metrics
   */
  public getSyllabusStats(topics: SessionPlanTopic[]): SyllabusStats {
    const totalTopics = topics.length;
    const completedTopics = topics.filter(t => t.status === 'COMPLETED').length;
    const inProgressTopics = topics.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTopics = topics.filter(t => t.status === 'PENDING' || !t.status).length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const unitSet = new Set<number>();
    topics.forEach(t => {
      if (t.unitNo) unitSet.add(t.unitNo);
    });

    return {
      totalTopics,
      completedTopics,
      pendingTopics,
      inProgressTopics,
      completionPercentage,
      totalUnits: unitSet.size || 1
    };
  }

  /**
   * Generate Downloadable Excel Template (.xlsx)
   */
  public generateSyllabusTemplateWorkbook(subject?: Subject): Uint8Array {
    const subCode = subject?.code || 'CSE-401';
    const subName = subject?.name || 'Data Structures & Algorithms';

    const headers = [
      'Subject Code',
      'Subject Name',
      'Unit No',
      'Unit Title',
      'Lecture No',
      'Topic Title',
      'Sub Topic',
      'Teaching Method',
      'Planned Date',
      'Duration / Hours',
      'Reference Material',
      'Remarks'
    ];

    const sampleRows = [
      [
        subCode,
        subName,
        1,
        'Introduction & Foundations',
        1,
        'Introduction to Data Structures & Algorithms',
        'Linear vs Non-Linear, Memory Organization',
        'PPT Presentation',
        '2026-08-10',
        1,
        'Standard Textbook Ch. 1',
        'Course Orientation'
      ],
      [
        subCode,
        subName,
        1,
        'Introduction & Foundations',
        2,
        'Abstract Data Types & Complexity Analysis',
        'Big-O, Big-Omega, Space-Time Tradeoffs',
        'Chalk & Board',
        '2026-08-12',
        1,
        'Lecture Handout #1',
        '-'
      ],
      [
        subCode,
        subName,
        2,
        'Linear Structures: Arrays & Linked Lists',
        3,
        'Arrays & Multidimensional Representations',
        'Row-Major vs Column-Major Addressing',
        'PPT Presentation',
        '2026-08-14',
        1,
        'Textbook Ch. 2',
        '-'
      ],
      [
        subCode,
        subName,
        2,
        'Linear Structures: Arrays & Linked Lists',
        4,
        'Singly & Doubly Linked List Operations',
        'Node Allocation, Pointers, Traversal',
        'Lab Demonstration',
        '2026-08-17',
        1,
        'Lab Manual #2',
        'Hands-on Demonstration'
      ],
      [
        subCode,
        subName,
        3,
        'Non-Linear Structures: Trees & Graphs',
        5,
        'Binary Trees & Tree Traversals',
        'Inorder, Preorder, Postorder Algorithms',
        'Interactive Case Study',
        '2026-08-19',
        1,
        'Textbook Ch. 4',
        '-'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, // Subject Code
      { wch: 32 }, // Subject Name
      { wch: 10 }, // Unit No
      { wch: 32 }, // Unit Title
      { wch: 12 }, // Lecture No
      { wch: 38 }, // Topic Title
      { wch: 34 }, // Sub Topic
      { wch: 22 }, // Teaching Method
      { wch: 14 }, // Planned Date
      { wch: 16 }, // Duration / Hours
      { wch: 24 }, // Reference Material
      { wch: 20 }  // Remarks
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Syllabus_Plan_Template');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  /**
   * Parse and validate syllabus file (.xlsx / .csv)
   */
  public async parseAndValidateSyllabusFile(
    file: File,
    selectedSubject: Subject
  ): Promise<SyllabusImportValidationResult> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    const validRows: SyllabusImportRow[] = [];
    const invalidRows: SyllabusImportRow[] = [];
    const duplicateRows: SyllabusImportRow[] = [];

    const existingTopics = db.getSessionPlanTopics().filter(t => t.subjectId === selectedSubject.id);
    const seenLectures = new Set<number>();

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // Accounting for 1-based index and header row
      const errors: string[] = [];

      // Extract properties across flexible column naming
      const subjectCode = String(row['Subject Code'] || row['subjectCode'] || row['Code'] || '').trim();
      const subjectName = String(row['Subject Name'] || row['subjectName'] || row['Name'] || selectedSubject.name).trim();
      
      const unitNo = parseInt(String(row['Unit No'] || row['unitNo'] || row['Unit'] || '1'), 10);
      const unitTitle = String(row['Unit Title'] || row['unitTitle'] || `Unit ${unitNo}`).trim();
      
      const lectureNo = parseInt(String(row['Lecture No'] || row['lectureNo'] || row['Lecture'] || row['Lec No'] || '0'), 10);
      const topicTitle = String(row['Topic Title'] || row['topicTitle'] || row['Topic'] || '').trim();
      const subTopic = String(row['Sub Topic'] || row['subTopic'] || row['Topics'] || '').trim();
      
      const teachingMethod = String(row['Teaching Method'] || row['teachingMethod'] || row['Method'] || 'PPT Presentation').trim();
      let plannedDate = String(row['Planned Date'] || row['plannedDate'] || row['Date'] || '').trim();
      const durationHours = parseFloat(String(row['Duration / Hours'] || row['Duration'] || row['Hours'] || '1')) || 1;
      const referenceMaterial = String(row['Reference Material'] || row['referenceMaterial'] || row['References'] || '').trim();
      const remarks = String(row['Remarks'] || row['remarks'] || '').trim();

      // Normalize date if Excel serial number or string
      if (typeof row['Planned Date'] === 'number') {
        const parsedDate = new Date((row['Planned Date'] - (25567 + 2)) * 86400 * 1000);
        plannedDate = parsedDate.toISOString().split('T')[0];
      } else if (!plannedDate || plannedDate.length < 6) {
        plannedDate = '2026-08-26';
      }

      // Validations
      if (!topicTitle) {
        errors.push('Missing Topic Title.');
      }
      if (isNaN(lectureNo) || lectureNo <= 0) {
        errors.push('Invalid or missing Lecture Number.');
      }
      if (isNaN(unitNo) || unitNo <= 0) {
        errors.push('Invalid or missing Unit Number.');
      }
      if (subjectCode && subjectCode.toLowerCase() !== selectedSubject.code.toLowerCase()) {
        errors.push(`Subject code "${subjectCode}" does not match selected subject "${selectedSubject.code}".`);
      }

      const isDuplicateInFile = seenLectures.has(lectureNo);
      const isExistingInDb = existingTopics.some(t => t.lectureNo === lectureNo);

      if (isDuplicateInFile) {
        errors.push(`Duplicate Lecture #${lectureNo} found in file.`);
      }

      if (lectureNo > 0) {
        seenLectures.add(lectureNo);
      }

      const importRow: SyllabusImportRow = {
        rowNumber,
        subjectCode: subjectCode || selectedSubject.code,
        subjectName,
        unitNo: isNaN(unitNo) ? 1 : unitNo,
        unitTitle,
        lectureNo: isNaN(lectureNo) ? 1 : lectureNo,
        topicTitle,
        subTopic,
        teachingMethod: teachingMethod || 'PPT Presentation',
        plannedDate,
        durationHours,
        referenceMaterial,
        remarks,
        isValid: errors.length === 0,
        isDuplicate: isExistingInDb || isDuplicateInFile,
        errors
      };

      if (errors.length > 0) {
        invalidRows.push(importRow);
      } else if (isExistingInDb) {
        duplicateRows.push(importRow);
        validRows.push(importRow);
      } else {
        validRows.push(importRow);
      }
    });

    return {
      totalRows: rawRows.length,
      validRows,
      invalidRows,
      duplicateRows
    };
  }

  /**
   * Commit valid syllabus rows into the Session Plan database
   */
  public commitSyllabusImport(
    validRows: SyllabusImportRow[],
    subjectId: string,
    facultyId: string,
    overwriteExisting: boolean = true
  ): number {
    const existingTopics = db.getSessionPlanTopics().filter(t => t.subjectId === subjectId);
    let count = 0;

    validRows.forEach(row => {
      const existing = existingTopics.find(t => t.lectureNo === row.lectureNo);

      if (existing) {
        if (overwriteExisting) {
          db.updateEntity<SessionPlanTopic>(
            'sessionPlanTopics',
            existing.id,
            {
              unitNo: row.unitNo,
              unitTitle: row.unitTitle,
              topicTitle: row.topicTitle,
              subTopic: row.subTopic,
              teachingMethod: row.teachingMethod as any,
              plannedDate: row.plannedDate,
              durationHours: row.durationHours,
              referenceMaterial: row.referenceMaterial,
              remarks: row.remarks,
              facultyId: facultyId || existing.facultyId
            },
            `Updated session plan topic #${row.lectureNo} via Syllabus Import`
          );
          count++;
        }
      } else {
        const newTopic: Omit<SessionPlanTopic, 'id'> = {
          subjectId,
          unitNo: row.unitNo,
          unitTitle: row.unitTitle,
          lectureNo: row.lectureNo,
          topicTitle: row.topicTitle,
          subTopic: row.subTopic,
          teachingMethod: row.teachingMethod as any,
          plannedDate: row.plannedDate,
          durationHours: row.durationHours,
          referenceMaterial: row.referenceMaterial,
          remarks: row.remarks,
          status: 'PENDING',
          facultyId: facultyId || 'fac-1'
        };

        db.addEntity<SessionPlanTopic>(
          'sessionPlanTopics',
          newTopic,
          `Added session plan topic #${row.lectureNo} via Syllabus Import`
        );
        count++;
      }
    });

    return count;
  }

  /**
   * Synchronize attendance submission with session plan topic completion
   */
  public syncAttendanceWithSessionPlan(session: AttendanceSession): void {
    if (!session.subjectId) return;

    const topics = db.getSessionPlanTopics().filter(t => t.subjectId === session.subjectId);
    if (topics.length === 0) return;

    // Match by lecture number or session topic title or next pending topic
    let matchingTopic = topics.find(t => t.lectureNo === session.lectureNo);
    if (!matchingTopic && session.topicTaught) {
      matchingTopic = topics.find(t => t.topicTitle.toLowerCase().includes(session.topicTaught.toLowerCase()));
    }
    if (!matchingTopic) {
      matchingTopic = topics.find(t => t.status !== 'COMPLETED');
    }

    if (matchingTopic && matchingTopic.status !== 'COMPLETED') {
      db.updateEntity<SessionPlanTopic>(
        'sessionPlanTopics',
        matchingTopic.id,
        {
          status: 'COMPLETED',
          completedDate: session.date || new Date().toISOString().split('T')[0]
        },
        `Auto-completed session plan topic #${matchingTopic.lectureNo} upon attendance submission`
      );
    }
  }

  /**
   * Get Today's scheduled classes from timetable for the faculty
   */
  public getTodayClassesForFaculty(user?: User | null): {
    entry: TimetableEntry;
    subject: Subject;
    topic?: SessionPlanTopic;
  }[] {
    const timetableEntries = db.getTimetableEntries();
    const subjects = db.getSubjects();
    const facId = user?.id || 'fac-1';

    // Demo anchored date is Wednesday
    const todayDayOfWeek = 'Wednesday';

    const todayEntries = timetableEntries.filter(
      e => e.dayOfWeek === todayDayOfWeek && (e.facultyId === facId || facId === 'fac-1')
    );

    return todayEntries.map(entry => {
      const subject = subjects.find(s => s.id === entry.subjectId) || subjects[0];
      const topics = this.getSessionPlanTopics(subject.id);
      const nextPendingTopic = topics.find(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS') || topics[0];

      return {
        entry,
        subject,
        topic: nextPendingTopic
      };
    });
  }
}

export const sessionPlanService = new SessionPlanService();
