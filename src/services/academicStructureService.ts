import { db } from './db';
import {
  University, Institute, Department, Program, Student, Faculty,
  FacultyWorkloadRecord, FacultySubjectAllocationRecord,
  UserAuthorizationContext
} from '../types';

export interface AcademicYearRecord {
  id: string;
  universityId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  isCurrent: boolean;
}

export interface SemesterRecord {
  id: string;
  programId: string;
  academicYearId: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
}

export interface BatchRecord {
  id: string;
  programId: string;
  name: string;
  code: string;
  startYear: number;
  endYear: number;
  status: 'ACTIVE' | 'GRADUATED' | 'ARCHIVED';
}

export interface DivisionRecord {
  id: string;
  batchId: string;
  name: string;
  code: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SubjectMasterRecord {
  id: string;
  code: string;
  name: string;
  shortName: string;
  departmentId: string;
  subjectType: 'CORE' | 'ELECTIVE' | 'PRACTICAL' | 'LAB' | 'PROJECT' | 'TRAINING';
  credits: number;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SubjectOfferingRecord {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  programId: string;
  semesterId: string;
  academicYearId: string;
  divisionId?: string;
  credits: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface StudentAcademicEnrollmentRecord {
  id: string;
  studentId: string;
  programId: string;
  batchId: string;
  academicYearId: string;
  semesterId: string;
  divisionId?: string;
  status: 'ENROLLED' | 'PROMOTED' | 'DETENTION' | 'COMPLETED';
  startDate: string;
  endDate?: string;
}

export interface StudentSubjectEnrollmentRecord {
  id: string;
  studentId: string;
  subjectOfferingId: string;
  academicYearId: string;
  semesterId: string;
  status: 'ACTIVE' | 'DROPPED' | 'PASSED' | 'FAILED';
  enrollmentDate: string;
}

class AcademicStructureService {
  private static instance: AcademicStructureService;

  private academicYears: AcademicYearRecord[] = [
    {
      id: 'ay-2025-26',
      universityId: 'univ-ssiu',
      name: '2025–2026',
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      status: 'CLOSED',
      isCurrent: false
    },
    {
      id: 'ay-2026-27',
      universityId: 'univ-ssiu',
      name: '2026–2027',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      status: 'ACTIVE',
      isCurrent: true
    }
  ];

  private batches: BatchRecord[] = [
    { id: 'batch-cse-2026', programId: 'prog-1', name: 'B.Tech CSE 2026-2030', code: 'CSE-2026', startYear: 2026, endYear: 2030, status: 'ACTIVE' },
    { id: 'batch-it-2026', programId: 'prog-2', name: 'B.Tech IT 2026-2030', code: 'IT-2026', startYear: 2026, endYear: 2030, status: 'ACTIVE' }
  ];

  private subjects: SubjectMasterRecord[] = [
    { id: 'sub-dbms', code: 'CS301', name: 'Database Management Systems', shortName: 'DBMS', departmentId: 'dept-1', subjectType: 'CORE', credits: 4, lectureHours: 3, tutorialHours: 0, practicalHours: 2, status: 'ACTIVE' },
    { id: 'sub-os', code: 'CS302', name: 'Operating Systems', shortName: 'OS', departmentId: 'dept-1', subjectType: 'CORE', credits: 4, lectureHours: 3, tutorialHours: 0, practicalHours: 2, status: 'ACTIVE' },
    { id: 'sub-ds', code: 'CS201', name: 'Data Structures & Algorithms', shortName: 'DSA', departmentId: 'dept-1', subjectType: 'CORE', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 2, status: 'ACTIVE' }
  ];

  private subjectOfferings: SubjectOfferingRecord[] = [
    { id: 'off-dbms-2026-sem3', subjectId: 'sub-dbms', subjectCode: 'CS301', subjectName: 'Database Management Systems', programId: 'prog-1', semesterId: 'sem-3', academicYearId: 'ay-2026-27', credits: 4, status: 'ACTIVE' },
    { id: 'off-os-2026-sem3', subjectId: 'sub-os', subjectCode: 'CS302', subjectName: 'Operating Systems', programId: 'prog-1', semesterId: 'sem-3', academicYearId: 'ay-2026-27', credits: 4, status: 'ACTIVE' },
    { id: 'off-dbms-2025-sem3', subjectId: 'sub-dbms', subjectCode: 'CS301', subjectName: 'Database Management Systems', programId: 'prog-1', semesterId: 'sem-3', academicYearId: 'ay-2025-26', credits: 4, status: 'ARCHIVED' }
  ];

  private facultyAllocations: FacultySubjectAllocationRecord[] = [
    { id: 'alloc-01', facultyId: 'fac-101', facultyName: 'Prof. Rajesh Patel', subjectId: 'sub-dbms', subjectCode: 'CS301', subjectName: 'Database Management Systems', programId: 'prog-1', departmentId: 'dept-1', instituteId: 'inst-1', semesterId: 'sem-3', academicYearId: 'ay-2026-27', workloadHoursPerWeek: 5, status: 'ACTIVE', createdAt: '2026-07-01T00:00:00Z' },
    { id: 'alloc-02', facultyId: 'fac-102', facultyName: 'Prof. Anjali Sharma', subjectId: 'sub-os', subjectCode: 'CS302', subjectName: 'Operating Systems', programId: 'prog-1', departmentId: 'dept-1', instituteId: 'inst-1', semesterId: 'sem-3', academicYearId: 'ay-2026-27', workloadHoursPerWeek: 5, status: 'ACTIVE', createdAt: '2026-07-01T00:00:00Z' }
  ];

  private studentEnrollments: StudentAcademicEnrollmentRecord[] = [
    { id: 'enr-stud-01', studentId: 'stud-001', programId: 'prog-1', batchId: 'batch-cse-2026', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'ENROLLED', startDate: '2026-07-01' }
  ];

  private studentSubjectEnrollments: StudentSubjectEnrollmentRecord[] = [
    { id: 'sse-01', studentId: 'stud-001', subjectOfferingId: 'off-dbms-2026-sem3', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'ACTIVE', enrollmentDate: '2026-07-05' },
    { id: 'sse-02', studentId: 'stud-001', subjectOfferingId: 'off-os-2026-sem3', academicYearId: 'ay-2026-27', semesterId: 'sem-3', status: 'ACTIVE', enrollmentDate: '2026-07-05' }
  ];

  private constructor() {}

  public static getInstance(): AcademicStructureService {
    if (!AcademicStructureService.instance) {
      AcademicStructureService.instance = new AcademicStructureService();
    }
    return AcademicStructureService.instance;
  }

  public getCurrentAcademicYear(): AcademicYearRecord {
    const current = this.academicYears.find(ay => ay.isCurrent && ay.status === 'ACTIVE');
    return current || this.academicYears[1];
  }

  public getAcademicYears(): AcademicYearRecord[] {
    return this.academicYears;
  }

  public getBatches(): BatchRecord[] {
    return this.batches;
  }

  public getSubjects(): SubjectMasterRecord[] {
    return this.subjects;
  }

  public getSubjectOfferings(academicYearId?: string): SubjectOfferingRecord[] {
    if (academicYearId) {
      return this.subjectOfferings.filter(so => so.academicYearId === academicYearId);
    }
    return this.subjectOfferings;
  }

  public getFacultyAllocations(facultyId?: string, academicYearId?: string): FacultySubjectAllocationRecord[] {
    let list = this.facultyAllocations;
    if (facultyId) list = list.filter(a => a.facultyId === facultyId);
    if (academicYearId) list = list.filter(a => a.academicYearId === academicYearId);
    return list;
  }

  public getFacultyWorkload(facultyId: string, academicYearId?: string): FacultyWorkloadRecord {
    const yearId = academicYearId || this.getCurrentAcademicYear().id;
    const allocations = this.getFacultyAllocations(facultyId, yearId);

    const totalHours = allocations.reduce((sum, a) => sum + (a.workloadHoursPerWeek || 0), 0);
    const faculty = db.getFaculty().find(f => f.id === facultyId);

    return {
      id: `wl-${facultyId}-${yearId}`,
      facultyId,
      subjectId: allocations[0]?.subjectId || 'sub-dbms',
      programId: allocations[0]?.programId || 'prog-1',
      departmentId: faculty?.departmentId || 'dept-1',
      instituteId: faculty?.instituteId || 'inst-1',
      semesterId: 'sem-3',
      academicYearId: yearId,
      hours: totalHours,
      workloadType: 'THEORY',
      status: 'ACTIVE',
      createdAt: '2026-07-01T00:00:00Z'
    };
  }



  public getStudentSubjectEnrollments(studentId: string, academicYearId?: string): StudentSubjectEnrollmentRecord[] {
    const yearId = academicYearId || this.getCurrentAcademicYear().id;
    return this.studentSubjectEnrollments.filter(
      sse => sse.studentId === studentId && sse.academicYearId === yearId
    );
  }
}

export const academicStructureService = AcademicStructureService.getInstance();
