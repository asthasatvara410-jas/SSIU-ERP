import { db } from './db';
import {
  Institute,
  Department,
  Program,
  Subject,
  Student,
  Faculty,
  User,
  AcademicYear,
  Semester,
  Division
} from '../types';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  BadRequestError
} from './apiResponse';
import { logger } from './logger';

export interface MasterDataHealthReport {
  timestamp: string;
  totalInstitutes: number;
  totalDepartments: number;
  totalPrograms: number;
  totalSubjects: number;
  totalStudents: number;
  totalFaculty: number;
  orphanDepartments: string[];
  orphanPrograms: string[];
  orphanSubjects: string[];
  orphanStudents: string[];
  orphanFaculty: string[];
  isHealthy: boolean;
}

export class MasterDataService {
  // ─── 1. INSTITUTE MASTER ───────────────────────────────────────────────────

  public getInstitutes(activeOnly = false): Institute[] {
    const list = db.getInstitutes();
    return activeOnly ? list.filter(i => i.status !== 'INACTIVE') : list;
  }

  public getInstituteById(id: string): Institute {
    const inst = db.getInstitutes().find(i => i.id === id || i.code.toUpperCase() === id.toUpperCase());
    if (!inst) throw new NotFoundError('Institute', id);
    return inst;
  }

  public createInstitute(data: Omit<Institute, 'id'> & { id?: string }): Institute {
    return db.runInTransaction(state => {
      const existing = state.institutes.find(i => i.code.toUpperCase() === data.code.toUpperCase());
      if (existing) {
        throw new ConflictError(`Institute with code "${data.code}" already exists.`);
      }

      const id = data.id || `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const institute: Institute = {
        id,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        type: data.type || 'Engineering',
        email: data.email || `${data.code.toLowerCase()}@swarrnim.edu.in`,
        phone: data.phone || '9876543210',
        location: data.location || 'Main Campus, Gandhinagar',
        establishedYear: data.establishedYear || 2017,
        principalName: data.principalName,
        status: (data.status || 'ACTIVE') as any
      };

      state.institutes.push(institute);
      logger.audit('INSTITUTE_CREATED', 'MasterData', `Created Institute ${institute.code} - ${institute.name}`);
      return institute;
    });
  }

  public updateInstitute(id: string, updates: Partial<Institute>): Institute {
    return db.runInTransaction(state => {
      const idx = state.institutes.findIndex(i => i.id === id);
      if (idx === -1) throw new NotFoundError('Institute', id);

      const current = state.institutes[idx];
      const updated: Institute = {
        ...current,
        ...updates,
        id: current.id,
        code: updates.code ? updates.code.toUpperCase().trim() : current.code
      };

      state.institutes[idx] = updated;
      logger.audit('INSTITUTE_UPDATED', 'MasterData', `Updated Institute ${updated.code}`);
      return updated;
    });
  }

  public deactivateInstitute(id: string): Institute {
    return this.updateInstitute(id, { status: 'INACTIVE' as any });
  }

  // ─── 2. DEPARTMENT MASTER ──────────────────────────────────────────────────

  public getDepartments(instituteId?: string, activeOnly = false): Department[] {
    let list = db.getDepartments();
    if (instituteId) {
      list = list.filter(d => d.instituteId === instituteId);
    }
    return activeOnly ? list.filter(d => d.status !== 'INACTIVE') : list;
  }

  public getDepartmentById(id: string): Department {
    const dept = db.getDepartments().find(d => d.id === id || d.code.toUpperCase() === id.toUpperCase());
    if (!dept) throw new NotFoundError('Department', id);
    return dept;
  }

  public createDepartment(data: Omit<Department, 'id'> & { id?: string }): Department {
    return db.runInTransaction(state => {
      // 1. Relational Parent Integrity Check: Institute must exist and be active
      const institute = state.institutes.find(i => i.id === data.instituteId || i.code.toUpperCase() === data.instituteId.toUpperCase());
      if (!institute) {
        throw new ValidationError(`Invalid parent Institute ID "${data.instituteId}". Department must belong to a valid Institute.`);
      }

      // 2. Uniqueness check
      const existing = state.departments.find(d => 
        d.code.toUpperCase() === data.code.toUpperCase() && 
        d.instituteId === institute.id
      );
      if (existing) {
        throw new ConflictError(`Department with code "${data.code}" already exists in Institute "${institute.code}".`);
      }

      const id = data.id || `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const department: Department = {
        id,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        instituteId: institute.id,
        email: data.email || `${data.code.toLowerCase()}@swarrnim.edu.in`,
        phone: data.phone || '9876543210',
        hodName: data.hodName,
        status: (data.status || 'ACTIVE') as any
      };

      state.departments.push(department);
      logger.audit('DEPARTMENT_CREATED', 'MasterData', `Created Department ${department.code} in ${institute.code}`);
      return department;
    });
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department {
    return db.runInTransaction(state => {
      const idx = state.departments.findIndex(d => d.id === id);
      if (idx === -1) throw new NotFoundError('Department', id);

      const current = state.departments[idx];

      // If re-assigning institute, verify parent
      if (updates.instituteId && updates.instituteId !== current.instituteId) {
        const institute = state.institutes.find(i => i.id === updates.instituteId);
        if (!institute) throw new ValidationError(`Target Institute ID "${updates.instituteId}" does not exist.`);
      }

      const updated: Department = {
        ...current,
        ...updates,
        id: current.id,
        code: updates.code ? updates.code.toUpperCase().trim() : current.code
      };

      state.departments[idx] = updated;
      logger.audit('DEPARTMENT_UPDATED', 'MasterData', `Updated Department ${updated.code}`);
      return updated;
    });
  }

  public deactivateDepartment(id: string): Department {
    return this.updateDepartment(id, { status: 'INACTIVE' as any });
  }

  // ─── 3. PROGRAM MASTER ─────────────────────────────────────────────────────

  public getPrograms(instituteId?: string, departmentId?: string, activeOnly = false): Program[] {
    let list = db.getPrograms();
    if (instituteId) list = list.filter(p => p.instituteId === instituteId);
    if (departmentId) list = list.filter(p => p.departmentId === departmentId);
    return activeOnly ? list.filter(p => p.status !== 'INACTIVE') : list;
  }

  public getProgramById(id: string): Program {
    const prog = db.getPrograms().find(p => p.id === id || p.code.toUpperCase() === id.toUpperCase());
    if (!prog) throw new NotFoundError('Program', id);
    return prog;
  }

  public createProgram(data: Omit<Program, 'id'> & { id?: string }): Program {
    return db.runInTransaction(state => {
      // 1. Validate Parent Institute
      const institute = state.institutes.find(i => i.id === data.instituteId || i.code.toUpperCase() === data.instituteId.toUpperCase());
      if (!institute) throw new ValidationError(`Parent Institute "${data.instituteId}" not found.`);

      // 2. Validate Parent Department if provided
      let resolvedDeptId = data.departmentId;
      if (data.departmentId) {
        const department = state.departments.find(d => 
          (d.id === data.departmentId || d.code.toUpperCase() === data.departmentId!.toUpperCase()) &&
          d.instituteId === institute.id
        );
        if (!department) {
          throw new ValidationError(`Department "${data.departmentId}" not found under Institute "${institute.code}".`);
        }
        resolvedDeptId = department.id;
      }

      const existing = state.programs.find(p => p.code.toUpperCase() === data.code.toUpperCase());
      if (existing) throw new ConflictError(`Program with code "${data.code}" already exists.`);

      const id = data.id || `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const program: Program = {
        id,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        degreeType: data.degreeType || 'B.Tech',
        durationYears: data.durationYears || 4,
        totalSemesters: data.totalSemesters || 8,
        intakeCapacity: data.intakeCapacity || 60,
        instituteId: institute.id,
        departmentId: resolvedDeptId,
        status: (data.status || 'ACTIVE') as any
      };

      state.programs.push(program);
      logger.audit('PROGRAM_CREATED', 'MasterData', `Created Program ${program.code} (${program.name})`);
      return program;
    });
  }

  public updateProgram(id: string, updates: Partial<Program>): Program {
    return db.runInTransaction(state => {
      const idx = state.programs.findIndex(p => p.id === id);
      if (idx === -1) throw new NotFoundError('Program', id);

      const current = state.programs[idx];
      const updated: Program = {
        ...current,
        ...updates,
        id: current.id,
        code: updates.code ? updates.code.toUpperCase().trim() : current.code
      };

      state.programs[idx] = updated;
      logger.audit('PROGRAM_UPDATED', 'MasterData', `Updated Program ${updated.code}`);
      return updated;
    });
  }

  public deactivateProgram(id: string): Program {
    return this.updateProgram(id, { status: 'INACTIVE' as any });
  }

  // ─── 4. SUBJECT MASTER ─────────────────────────────────────────────────────

  public getSubjects(programId?: string, semesterId?: string, activeOnly = false): Subject[] {
    let list = db.getSubjects();
    if (programId) list = list.filter(s => s.programId === programId);
    if (semesterId) list = list.filter(s => s.semesterId === semesterId);
    return activeOnly ? list.filter(s => s.status !== 'INACTIVE') : list;
  }

  public getSubjectById(id: string): Subject {
    const subj = db.getSubjects().find(s => s.id === id || s.code.toUpperCase() === id.toUpperCase());
    if (!subj) throw new NotFoundError('Subject', id);
    return subj;
  }

  public createSubject(data: Omit<Subject, 'id'> & { id?: string }): Subject {
    return db.runInTransaction(state => {
      // Validate Parent Program
      const program = state.programs.find(p => p.id === data.programId || p.code.toUpperCase() === data.programId.toUpperCase());
      if (!program) throw new ValidationError(`Parent Program "${data.programId}" not found.`);

      const existing = state.subjects.find(s => s.code.toUpperCase() === data.code.toUpperCase());
      if (existing) throw new ConflictError(`Subject with code "${data.code}" already exists.`);

      const id = data.id || `subj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const subject: Subject = {
        id,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        programId: program.id,
        semesterId: data.semesterId || 'sem-1',
        departmentId: data.departmentId || program.departmentId,
        type: data.type || 'THEORY',
        credits: data.credits || 3,
        theoryHoursPerWeek: data.theoryHoursPerWeek || 3,
        labHoursPerWeek: data.labHoursPerWeek || 0,
        status: (data.status || 'ACTIVE') as any
      };

      state.subjects.push(subject);
      logger.audit('SUBJECT_CREATED', 'MasterData', `Created Subject ${subject.code} (${subject.name})`);
      return subject;
    });
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject {
    return db.runInTransaction(state => {
      const idx = state.subjects.findIndex(s => s.id === id);
      if (idx === -1) throw new NotFoundError('Subject', id);

      const current = state.subjects[idx];
      const updated: Subject = {
        ...current,
        ...updates,
        id: current.id,
        code: updates.code ? updates.code.toUpperCase().trim() : current.code
      };

      state.subjects[idx] = updated;
      logger.audit('SUBJECT_UPDATED', 'MasterData', `Updated Subject ${updated.code}`);
      return updated;
    });
  }

  public deactivateSubject(id: string): Subject {
    return this.updateSubject(id, { status: 'INACTIVE' as any });
  }

  // ─── 5. STUDENT MASTER ─────────────────────────────────────────────────────

  public getStudents(instituteId?: string, departmentId?: string, programId?: string, activeOnly = false): Student[] {
    let list = db.getStudents();
    if (instituteId) list = list.filter(s => s.instituteId === instituteId);
    if (departmentId) list = list.filter(s => s.departmentId === departmentId);
    if (programId) list = list.filter(s => s.programId === programId);
    return activeOnly ? list.filter(s => s.status !== 'INACTIVE') : list;
  }

  public getStudentById(id: string): Student {
    const stu = db.getStudents().find(s => s.id === id || s.enrollmentNo.toUpperCase() === id.toUpperCase());
    if (!stu) throw new NotFoundError('Student', id);
    return stu;
  }

  public createStudent(data: Omit<Student, 'id'> & { id?: string }): Student {
    return db.runInTransaction(state => {
      // 1. Relational Integrity Checks
      const institute = state.institutes.find(i => i.id === data.instituteId || i.code.toUpperCase() === data.instituteId.toUpperCase());
      if (!institute) throw new ValidationError(`Student institute "${data.instituteId}" does not exist.`);

      if (!data.departmentId) throw new ValidationError('Student departmentId is required.');
      const department = state.departments.find(d => 
        (d.id === data.departmentId || d.code.toUpperCase() === data.departmentId!.toUpperCase()) &&
        d.instituteId === institute.id
      );
      if (!department) throw new ValidationError(`Student department "${data.departmentId}" not found in institute "${institute.code}".`);

      const program = state.programs.find(p => 
        (p.id === data.programId || p.code.toUpperCase() === data.programId.toUpperCase()) &&
        p.instituteId === institute.id
      );
      if (!program) throw new ValidationError(`Student program "${data.programId}" not found in institute "${institute.code}".`);

      const existing = state.students.find(s => s.enrollmentNo.toUpperCase() === data.enrollmentNo.toUpperCase());
      if (existing) throw new ConflictError(`Student with Enrollment Number "${data.enrollmentNo}" already exists.`);

      const id = data.id || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const student: Student = {
        ...data,
        id,
        enrollmentNo: data.enrollmentNo.toUpperCase().trim(),
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        instituteId: institute.id,
        departmentId: department.id,
        programId: program.id,
        status: (data.status || 'ACTIVE') as any
      };

      state.students.push(student);

      // Auto-synchronize User account
      const existingUser = state.users.find(u => u.enrollmentNo?.toUpperCase() === student.enrollmentNo.toUpperCase() || u.email.toLowerCase() === student.email.toLowerCase());
      if (!existingUser) {
        state.users.push({
          id: `usr-${student.id}`,
          name: student.name,
          email: student.email,
          username: student.enrollmentNo.toLowerCase(),
          role: 'STUDENT',
          enrollmentNo: student.enrollmentNo,
          instituteId: student.instituteId,
          departmentId: student.departmentId,
          programId: student.programId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }

      logger.audit('STUDENT_CREATED', 'MasterData', `Created Student ${student.enrollmentNo} (${student.name})`);
      return student;
    });
  }

  public updateStudent(id: string, updates: Partial<Student>): Student {
    return db.runInTransaction(state => {
      const idx = state.students.findIndex(s => s.id === id || s.enrollmentNo.toUpperCase() === id.toUpperCase());
      if (idx === -1) throw new NotFoundError('Student', id);

      const current = state.students[idx];
      const updated: Student = {
        ...current,
        ...updates,
        id: current.id,
        enrollmentNo: current.enrollmentNo
      };

      state.students[idx] = updated;
      logger.audit('STUDENT_UPDATED', 'MasterData', `Updated Student ${updated.enrollmentNo}`);
      return updated;
    });
  }

  public deactivateStudent(id: string): Student {
    return this.updateStudent(id, { status: 'INACTIVE' as any });
  }

  // ─── 6. FACULTY MASTER ─────────────────────────────────────────────────────

  public getFaculty(instituteId?: string, departmentId?: string, activeOnly = false): Faculty[] {
    let list = db.getFaculty();
    if (instituteId) list = list.filter(f => f.instituteId === instituteId);
    if (departmentId) list = list.filter(f => f.departmentId === departmentId);
    return activeOnly ? list.filter(f => f.status !== 'INACTIVE') : list;
  }

  public getFacultyById(id: string): Faculty {
    const fac = db.getFaculty().find(f => f.id === id || f.employeeId.toUpperCase() === id.toUpperCase());
    if (!fac) throw new NotFoundError('Faculty', id);
    return fac;
  }

  public createFaculty(data: Omit<Faculty, 'id'> & { id?: string }): Faculty {
    return db.runInTransaction(state => {
      const institute = state.institutes.find(i => i.id === data.instituteId || i.code.toUpperCase() === data.instituteId.toUpperCase());
      if (!institute) throw new ValidationError(`Faculty institute "${data.instituteId}" does not exist.`);

      let resolvedDeptId = data.departmentId;
      if (data.departmentId) {
        const department = state.departments.find(d => 
          (d.id === data.departmentId || d.code.toUpperCase() === data.departmentId!.toUpperCase()) &&
          d.instituteId === institute.id
        );
        if (!department) throw new ValidationError(`Faculty department "${data.departmentId}" not found in institute "${institute.code}".`);
        resolvedDeptId = department.id;
      }

      const existing = state.faculty.find(f => f.employeeId.toUpperCase() === data.employeeId.toUpperCase());
      if (existing) throw new ConflictError(`Faculty with Employee ID "${data.employeeId}" already exists.`);

      const id = data.id || `fac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const faculty: Faculty = {
        id,
        employeeId: data.employeeId.toUpperCase().trim(),
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone || '9876543210',
        designation: data.designation || 'Assistant Professor',
        instituteId: institute.id,
        departmentId: resolvedDeptId,
        qualification: data.qualification || 'Ph.D.',
        specialization: data.specialization,
        experienceYears: data.experienceYears || 5,
        subjectIds: data.subjectIds || [],
        status: (data.status || 'ACTIVE') as any
      };

      state.faculty.push(faculty);

      // Auto-synchronize User account
      const existingUser = state.users.find(u => u.employeeId?.toUpperCase() === faculty.employeeId.toUpperCase() || u.email.toLowerCase() === faculty.email.toLowerCase());
      if (!existingUser) {
        state.users.push({
          id: `usr-${faculty.id}`,
          name: faculty.name,
          email: faculty.email,
          username: faculty.employeeId.toLowerCase(),
          role: 'FACULTY',
          employeeId: faculty.employeeId,
          instituteId: faculty.instituteId,
          departmentId: faculty.departmentId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }

      logger.audit('FACULTY_CREATED', 'MasterData', `Created Faculty ${faculty.employeeId} (${faculty.name})`);
      return faculty;
    });
  }

  public updateFaculty(id: string, updates: Partial<Faculty>): Faculty {
    return db.runInTransaction(state => {
      const idx = state.faculty.findIndex(f => f.id === id || f.employeeId.toUpperCase() === id.toUpperCase());
      if (idx === -1) throw new NotFoundError('Faculty', id);

      const current = state.faculty[idx];
      const updated: Faculty = {
        ...current,
        ...updates,
        id: current.id,
        employeeId: current.employeeId
      };

      state.faculty[idx] = updated;
      logger.audit('FACULTY_UPDATED', 'MasterData', `Updated Faculty ${updated.employeeId}`);
      return updated;
    });
  }

  public deactivateFaculty(id: string): Faculty {
    return this.updateFaculty(id, { status: 'INACTIVE' as any });
  }

  // ─── 7. HIERARCHICAL HEALTH CHECK & ORPHAN DETECTOR ───────────────────────

  public runMasterDataHealthCheck(): MasterDataHealthReport {
    const state = db.getRawState();
    const instIds = new Set(state.institutes.map(i => i.id));
    const deptIds = new Set(state.departments.map(d => d.id));
    const progIds = new Set(state.programs.map(p => p.id));

    const orphanDepts = state.departments.filter(d => !instIds.has(d.instituteId)).map(d => d.code);
    const orphanProgs = state.programs.filter(p => !instIds.has(p.instituteId) || (p.departmentId && !deptIds.has(p.departmentId))).map(p => p.code);
    const orphanSubjs = state.subjects.filter(s => !progIds.has(s.programId)).map(s => s.code);
    const orphanStudents = state.students.filter(s => !instIds.has(s.instituteId) || !deptIds.has(s.departmentId || '') || !progIds.has(s.programId)).map(s => s.enrollmentNo);
    const orphanFaculty = state.faculty.filter(f => !instIds.has(f.instituteId) || (f.departmentId && !deptIds.has(f.departmentId))).map(f => f.employeeId);

    const isHealthy = orphanDepts.length === 0 &&
      orphanProgs.length === 0 &&
      orphanSubjs.length === 0 &&
      orphanStudents.length === 0 &&
      orphanFaculty.length === 0;

    return {
      timestamp: new Date().toISOString(),
      totalInstitutes: state.institutes.length,
      totalDepartments: state.departments.length,
      totalPrograms: state.programs.length,
      totalSubjects: state.subjects.length,
      totalStudents: state.students.length,
      totalFaculty: state.faculty.length,
      orphanDepartments: orphanDepts,
      orphanPrograms: orphanProgs,
      orphanSubjects: orphanSubjs,
      orphanStudents: orphanStudents,
      orphanFaculty: orphanFaculty,
      isHealthy
    };
  }
}

export const masterDataService = new MasterDataService();
