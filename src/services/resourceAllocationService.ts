import {
  InstitutionalResource,
  InstitutionalResourceType,
  ClassroomAllocation,
  LaboratoryAllocation,
  FacultyAllocation,
  SubjectAllocation,
  DepartmentResourceAllocation,
  AllocationRequest,
  AllocationConflict,
  AllocationHistoryRecord,
  User,
  TimetableEntry
} from '../types';
import { db } from './db';

export class ResourceAllocationService {
  private static instance: ResourceAllocationService;

  private constructor() {}

  public static getInstance(): ResourceAllocationService {
    if (!ResourceAllocationService.instance) {
      ResourceAllocationService.instance = new ResourceAllocationService();
    }
    return ResourceAllocationService.instance;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. INSTITUTIONAL RESOURCES MASTER CRUD
  // ══════════════════════════════════════════════════════════════════════════════
  public addInstitutionalResource(
    payload: {
      resourceCode: string;
      name: string;
      type: InstitutionalResourceType;
      instituteId: string;
      departmentId?: string;
      building: string;
      floor: string;
      roomNumber: string;
      capacity: number;
      labType?: string;
      computerCount?: number;
      projectorAvailable?: boolean;
      smartBoardAvailable?: boolean;
      airConditioned?: boolean;
      softwareInstalled?: string[];
      equipmentList?: string[];
      remarks?: string;
    },
    actor: User
  ): { success: boolean; resource?: InstitutionalResource; message: string } {
    const resources = db.getInstitutionalResources();
    const cleanCode = payload.resourceCode.trim().toUpperCase();

    if (resources.some(r => r.resourceCode.toUpperCase() === cleanCode)) {
      return { success: false, message: `Resource Code "${cleanCode}" already exists.` };
    }

    const dept = payload.departmentId ? db.getDepartments().find(d => d.id === payload.departmentId) : undefined;
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId);

    const newRes: InstitutionalResource = {
      id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      resourceCode: cleanCode,
      name: payload.name.trim(),
      type: payload.type,
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      building: payload.building,
      floor: payload.floor,
      roomNumber: payload.roomNumber,
      capacity: Number(payload.capacity) || 60,
      labType: payload.labType,
      computerCount: Number(payload.computerCount) || (payload.type === 'LABORATORY' || payload.type === 'COMPUTER_LAB' ? 30 : 0),
      projectorAvailable: Boolean(payload.projectorAvailable),
      smartBoardAvailable: Boolean(payload.smartBoardAvailable),
      airConditioned: Boolean(payload.airConditioned),
      softwareInstalled: payload.softwareInstalled || [],
      equipmentList: payload.equipmentList || [],
      status: 'AVAILABLE',
      remarks: payload.remarks
    };

    db.addEntity('institutionalResources', newRes, `Created institutional resource ${newRes.name} (${newRes.resourceCode})`);

    return {
      success: true,
      resource: newRes,
      message: `Resource "${newRes.name}" (${newRes.resourceCode}) successfully created.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. CLASSROOM ALLOCATION & CONFLICT DETECTION
  // ══════════════════════════════════════════════════════════════════════════════
  public allocateClassroom(
    payload: {
      academicYearId: string;
      instituteId: string;
      departmentId: string;
      programId: string;
      semesterId: string;
      divisionId: string;
      resourceId: string;
      dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'ALL';
      timeSlot?: string;
      effectiveFrom: string;
      effectiveTo: string;
      remarks?: string;
    },
    actor: User
  ): { success: boolean; allocation?: ClassroomAllocation; message: string } {
    const res = db.getInstitutionalResources().find(r => r.id === payload.resourceId);
    if (!res) return { success: false, message: 'Classroom resource not found.' };

    const ay = db.getAcademicYears().find(a => a.id === payload.academicYearId);
    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const prog = db.getPrograms().find(p => p.id === payload.programId);
    const sem = db.getSemesters().find(s => s.id === payload.semesterId);
    const div = db.getDivisions().find(d => d.id === payload.divisionId);
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId);

    // Conflict Check: Is this classroom already allocated to another department/division during the same time?
    const existingAllocations = db.getClassroomAllocations().filter(a => a.resourceId === res.id && a.status === 'ALLOCATED');
    const day = payload.dayOfWeek || 'ALL';
    const slot = payload.timeSlot || 'FULL_SEMESTER';

    const hasConflict = existingAllocations.some(a => {
      if (a.academicYearId !== payload.academicYearId) return false;
      if (a.dayOfWeek === 'ALL' || day === 'ALL' || a.dayOfWeek === day) {
        if (a.timeSlot === 'FULL_SEMESTER' || slot === 'FULL_SEMESTER' || a.timeSlot === slot) {
          const isSameTarget = a.departmentId === payload.departmentId && 
                               a.programId === payload.programId && 
                               a.divisionId === payload.divisionId && 
                               a.semesterId === payload.semesterId;
          return !isSameTarget;
        }
      }
      return false;
    });

    if (hasConflict) {
      return {
        success: false,
        message: `Conflict Detected: Classroom "${res.name}" (${res.roomNumber}) is already allocated to another department / program / division during this academic period.`
      };
    }

    const allocation: ClassroomAllocation = {
      id: `alloc-cr-${Date.now()}`,
      academicYearId: payload.academicYearId,
      academicYearCode: ay?.year || '2026-27',
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      programId: payload.programId,
      programName: prog?.name,
      semesterId: payload.semesterId,
      semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
      divisionId: payload.divisionId,
      divisionName: div?.name || 'Div A',
      resourceId: res.id,
      roomNumber: res.roomNumber,
      building: res.building,
      floor: res.floor,
      capacity: res.capacity,
      dayOfWeek: payload.dayOfWeek,
      timeSlot: payload.timeSlot,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
      status: 'ALLOCATED',
      allocatedBy: actor.name,
      allocatedAt: new Date().toISOString(),
      remarks: payload.remarks
    };

    db.addEntity('classroomAllocations', allocation, `Allocated classroom ${res.roomNumber} to ${dept?.name} - ${div?.name}`);

    // Update resource status
    res.status = 'ALLOCATED';
    db.updateEntity('institutionalResources', res.id, res, `Updated status of ${res.name}`);

    // Department In-App Notification
    db.addEntity<any>('notifications', {
      id: `notif-cr-${Date.now()}`,
      type: 'INFORMATION',
      title: '🏫 Classroom Allocated',
      message: `Classroom "${res.roomNumber}" (${res.building}) has been allocated to ${dept?.name} for ${div?.name} (${ay?.year || '2026'}).`,
      module: 'RESOURCE_ALLOCATION',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched classroom allocation notification');

    // Record History
    this.logAllocationHistory({
      resourceId: res.id,
      resourceName: res.name,
      resourceType: 'CLASSROOM',
      academicYear: ay?.year || '2026-27',
      newDepartment: dept?.name || 'Department',
      newAcademicPlacement: `${prog?.name || ''} - ${sem ? `Sem ${sem.number}` : ''} (${div?.name || ''})`,
      changedBy: actor.name,
      actionType: 'ALLOCATED',
      reason: payload.remarks || 'Standard Semester Classroom Allocation'
    });

    return {
      success: true,
      allocation,
      message: `Classroom "${res.roomNumber}" (${res.building}) successfully allocated to ${dept?.name} - ${div?.name}.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. LABORATORY ALLOCATION & CONFLICT DETECTION
  // ══════════════════════════════════════════════════════════════════════════════
  public allocateLaboratory(
    payload: {
      academicYearId: string;
      instituteId: string;
      departmentId: string;
      programId: string;
      semesterId: string;
      divisionId: string;
      resourceId: string;
      assignedFacultyId?: string;
      dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'ALL';
      timeSlot?: string;
      effectiveFrom: string;
      effectiveTo: string;
      remarks?: string;
    },
    actor: User
  ): { success: boolean; allocation?: LaboratoryAllocation; message: string } {
    const res = db.getInstitutionalResources().find(r => r.id === payload.resourceId);
    if (!res) return { success: false, message: 'Laboratory resource not found.' };

    const ay = db.getAcademicYears().find(a => a.id === payload.academicYearId);
    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const prog = db.getPrograms().find(p => p.id === payload.programId);
    const sem = db.getSemesters().find(s => s.id === payload.semesterId);
    const div = db.getDivisions().find(d => d.id === payload.divisionId);
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId);

    const faculty = payload.assignedFacultyId 
      ? db.getUsers().find(u => u.id === payload.assignedFacultyId) || db.getFaculty().find(f => f.id === payload.assignedFacultyId)
      : undefined;

    // Check conflict
    const existingLabs = db.getLaboratoryAllocations().filter(l => l.resourceId === res.id && l.status === 'ALLOCATED');
    const day = payload.dayOfWeek || 'ALL';
    const slot = payload.timeSlot || 'FULL_SEMESTER';

    const hasConflict = existingLabs.some(l => {
      if (l.academicYearId !== payload.academicYearId) return false;
      if (l.dayOfWeek === 'ALL' || day === 'ALL' || l.dayOfWeek === day) {
        if (l.timeSlot === 'FULL_SEMESTER' || slot === 'FULL_SEMESTER' || l.timeSlot === slot) {
          return l.divisionId !== payload.divisionId;
        }
      }
      return false;
    });

    if (hasConflict) {
      return {
        success: false,
        message: `Laboratory Conflict: "${res.name}" (${res.roomNumber}) is already allocated to another division during this slot.`
      };
    }

    const allocation: LaboratoryAllocation = {
      id: `alloc-lab-${Date.now()}`,
      academicYearId: payload.academicYearId,
      academicYearCode: ay?.year || '2026-27',
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      programId: payload.programId,
      programName: prog?.name,
      semesterId: payload.semesterId,
      semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
      divisionId: payload.divisionId,
      divisionName: div?.name || 'Div A',
      resourceId: res.id,
      labName: res.name,
      roomNumber: res.roomNumber,
      building: res.building,
      floor: res.floor,
      capacity: res.capacity,
      labType: res.labType || 'Specialized Lab',
      assignedFacultyId: payload.assignedFacultyId,
      assignedFacultyName: faculty?.name,
      computerCount: res.computerCount,
      softwareAvailability: res.softwareInstalled,
      equipmentAvailability: res.equipmentList,
      dayOfWeek: payload.dayOfWeek,
      timeSlot: payload.timeSlot,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
      status: 'ALLOCATED',
      allocatedBy: actor.name,
      allocatedAt: new Date().toISOString(),
      remarks: payload.remarks
    };

    db.addEntity('laboratoryAllocations', allocation, `Allocated lab ${res.name} to ${dept?.name}`);

    res.status = 'ALLOCATED';
    db.updateEntity('institutionalResources', res.id, res, `Updated status of ${res.name}`);

    // Department Notification
    db.addEntity<any>('notifications', {
      id: `notif-lab-${Date.now()}`,
      type: 'INFORMATION',
      title: '🔬 Laboratory Allocated',
      message: `Laboratory "${res.name}" (${res.computerCount || 0} PCs) allocated to ${dept?.name} - ${div?.name}.`,
      module: 'RESOURCE_ALLOCATION',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched lab allocation notification');

    // Record History
    this.logAllocationHistory({
      resourceId: res.id,
      resourceName: res.name,
      resourceType: 'LABORATORY',
      academicYear: ay?.year || '2026-27',
      newDepartment: dept?.name || 'Department',
      newAcademicPlacement: `${prog?.name || ''} - ${sem ? `Sem ${sem.number}` : ''} (${div?.name || ''})`,
      changedBy: actor.name,
      actionType: 'ALLOCATED',
      reason: payload.remarks || 'Standard Semester Laboratory Allocation'
    });

    return {
      success: true,
      allocation,
      message: `Laboratory "${res.name}" (${res.roomNumber}) successfully allocated to ${dept?.name}.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. FACULTY ALLOCATION & LOAD CALCULATION
  // ══════════════════════════════════════════════════════════════════════════════
  public allocateFaculty(
    payload: {
      facultyId: string;
      instituteId: string;
      departmentId: string;
      programId: string;
      subjectId: string;
      semesterId: string;
      divisionId: string;
      academicYearId: string;
      teachingLoad?: number;
      theoryHours?: number;
      practicalHours?: number;
      effectiveFrom: string;
      effectiveTo: string;
      remarks?: string;
    },
    actor: User
  ): { success: boolean; allocation?: FacultyAllocation; message: string } {
    const faculty = db.getUsers().find(u => u.id === payload.facultyId) || 
                    db.getFaculty().find(f => f.id === payload.facultyId) ||
                    db.getUsers().find(u => u.role === 'FACULTY') ||
                    { id: payload.facultyId, name: 'Dr. Faculty Member', role: 'FACULTY' };

    const subject = db.getSubjects().find(s => s.id === payload.subjectId) ||
                    db.getSubjects()[0] ||
                    { id: payload.subjectId, name: 'Core Computing', code: 'CS101' };

    const ay = db.getAcademicYears().find(a => a.id === payload.academicYearId);
    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const prog = db.getPrograms().find(p => p.id === payload.programId);
    const sem = db.getSemesters().find(s => s.id === payload.semesterId);
    const div = db.getDivisions().find(d => d.id === payload.divisionId);
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId);

    const theory = payload.theoryHours !== undefined ? payload.theoryHours : 3;
    const practical = payload.practicalHours !== undefined ? payload.practicalHours : 2;
    const load = payload.teachingLoad !== undefined ? payload.teachingLoad : (theory + practical);

    const allocation: FacultyAllocation = {
      id: `alloc-fac-${Date.now()}`,
      facultyId: faculty.id,
      facultyName: faculty.name,
      employeeCode: (faculty as any).employeeId || (faculty as any).erpId || 'FAC-EMP',
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      programId: payload.programId,
      programName: prog?.name,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      semesterId: payload.semesterId,
      semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
      divisionId: payload.divisionId,
      divisionName: div?.name || 'Div A',
      academicYearId: payload.academicYearId,
      academicYearCode: ay?.year || '2026-27',
      teachingLoad: load,
      theoryHours: theory,
      practicalHours: practical,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
      status: 'ACTIVE',
      allocatedBy: actor.name,
      allocatedAt: new Date().toISOString(),
      remarks: payload.remarks
    };

    db.addEntity('facultyAllocations', allocation, `Allocated ${subject.name} to Professor ${faculty.name}`);

    // Auto-notify Faculty
    db.addEntity<any>('notifications', {
      id: `notif-fac-teach-${Date.now()}`,
      type: 'SUCCESS',
      title: '📚 New Subject Teaching Assignment',
      message: `You have been allocated "${subject.name}" (${subject.code}) for ${sem ? `Sem ${sem.number}` : ''} ${div?.name || ''} in ${dept?.name}.`,
      module: 'RESOURCE_ALLOCATION',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched faculty teaching assignment notification');

    return {
      success: true,
      allocation,
      message: `Professor ${faculty.name} assigned to "${subject.name}" (${subject.code}) for ${div?.name || 'Division'}.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. SUBJECT / COURSE ALLOCATION
  // ══════════════════════════════════════════════════════════════════════════════
  public allocateSubject(
    payload: {
      subjectId: string;
      academicYearId: string;
      instituteId: string;
      departmentId: string;
      programId: string;
      semesterId: string;
      divisionId: string;
      assignedFacultyId?: string;
      classroomId?: string;
      laboratoryId?: string;
    },
    actor: User
  ): { success: boolean; allocation?: SubjectAllocation; message: string } {
    const subject = db.getSubjects().find(s => s.id === payload.subjectId);
    if (!subject) return { success: false, message: 'Subject not found.' };

    const ay = db.getAcademicYears().find(a => a.id === payload.academicYearId);
    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const prog = db.getPrograms().find(p => p.id === payload.programId);
    const sem = db.getSemesters().find(s => s.id === payload.semesterId);
    const div = db.getDivisions().find(d => d.id === payload.divisionId);

    const faculty = payload.assignedFacultyId ? db.getUsers().find(u => u.id === payload.assignedFacultyId) || db.getFaculty().find(f => f.id === payload.assignedFacultyId) : undefined;
    const room = payload.classroomId ? db.getInstitutionalResources().find(r => r.id === payload.classroomId) : undefined;
    const lab = payload.laboratoryId ? db.getInstitutionalResources().find(r => r.id === payload.laboratoryId) : undefined;

    const allocation: SubjectAllocation = {
      id: `alloc-sub-${Date.now()}`,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      credits: (subject as any).credits || 4,
      theoryHours: 3,
      practicalHours: 2,
      academicYearId: payload.academicYearId,
      academicYearCode: ay?.year || '2026-27',
      instituteId: payload.instituteId,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      programId: payload.programId,
      programName: prog?.name,
      semesterId: payload.semesterId,
      semesterName: sem ? `Sem ${sem.number}` : 'Sem 1',
      divisionId: payload.divisionId,
      divisionName: div?.name || 'Div A',
      assignedFacultyId: payload.assignedFacultyId,
      assignedFacultyName: faculty?.name,
      classroomId: room?.id,
      classroomName: room?.roomNumber,
      laboratoryId: lab?.id,
      laboratoryName: lab?.name,
      status: faculty ? 'ALLOCATED' : 'PENDING_FACULTY',
      allocatedBy: actor.name,
      allocatedAt: new Date().toISOString()
    };

    db.addEntity('subjectAllocations', allocation, `Allocated subject ${subject.name} to ${dept?.name}`);

    return {
      success: true,
      allocation,
      message: `Subject "${subject.name}" (${subject.code}) successfully allocated.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. TIMETABLE INTEGRATION & CONFLICT DETECTOR
  // ══════════════════════════════════════════════════════════════════════════════
  public detectAllConflicts(): AllocationConflict[] {
    const conflicts: AllocationConflict[] = [];
    const timetables = db.getTimetableEntries();
    const crAllocations = db.getClassroomAllocations().filter(a => a.status === 'ALLOCATED');
    const labAllocations = db.getLaboratoryAllocations().filter(a => a.status === 'ALLOCATED');

    // 1. Timetable Room Overlap
    const slotRoomMap: Record<string, TimetableEntry[]> = {};
    timetables.forEach(t => {
      if (t.status === 'ACTIVE' && t.roomNo) {
        const key = `${t.dayOfWeek}_${t.timeSlot}_${t.roomNo}`;
        if (!slotRoomMap[key]) slotRoomMap[key] = [];
        slotRoomMap[key].push(t);
      }
    });

    Object.entries(slotRoomMap).forEach(([key, entries]) => {
      if (entries.length > 1) {
        const [day, time, room] = key.split('_');
        conflicts.push({
          id: `conf-room-${Date.now()}-${Math.random()}`,
          resourceId: room,
          resourceName: `Classroom ${room}`,
          resourceType: 'CLASSROOM',
          conflictType: 'CLASSROOM_DOUBLE_BOOKING',
          academicYear: '2026-27',
          dayOfWeek: day,
          timeSlot: time,
          conflictingEntities: entries.map(e => `Subject: ${db.getSubjects().find(s => s.id === e.subjectId)?.name || e.subjectId} (${e.divisionId})`),
          description: `Classroom "${room}" has ${entries.length} conflicting sessions scheduled on ${day} during ${time}.`,
          severity: 'CRITICAL',
          suggestedResolution: 'Reassign one of the lecture sessions to an alternative available classroom.',
          detectedAt: new Date().toISOString()
        });
      }
    });

    // 2. Timetable Faculty Overlap
    const slotFacultyMap: Record<string, TimetableEntry[]> = {};
    timetables.forEach(t => {
      if (t.status === 'ACTIVE' && t.facultyId) {
        const key = `${t.dayOfWeek}_${t.timeSlot}_${t.facultyId}`;
        if (!slotFacultyMap[key]) slotFacultyMap[key] = [];
        slotFacultyMap[key].push(t);
      }
    });

    Object.entries(slotFacultyMap).forEach(([key, entries]) => {
      if (entries.length > 1) {
        const [day, time, facultyId] = key.split('_');
        const facName = db.getUsers().find(u => u.id === facultyId)?.name || db.getFaculty().find(f => f.id === facultyId)?.name || facultyId;
        conflicts.push({
          id: `conf-fac-${Date.now()}-${Math.random()}`,
          resourceId: facultyId,
          resourceName: `Professor ${facName}`,
          resourceType: 'FACULTY',
          conflictType: 'FACULTY_DOUBLE_BOOKING',
          academicYear: '2026-27',
          dayOfWeek: day,
          timeSlot: time,
          conflictingEntities: entries.map(e => `Division: ${e.divisionId}, Room: ${e.roomNo}`),
          description: `Professor ${facName} is assigned to multiple classes simultaneously on ${day} at ${time}.`,
          severity: 'CRITICAL',
          suggestedResolution: 'Reschedule one of the lectures or assign a substitute faculty member.',
          detectedAt: new Date().toISOString()
        });
      }
    });

    return conflicts;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. ALLOCATION HISTORY AUDIT LOGGING
  // ══════════════════════════════════════════════════════════════════════════════
  public logAllocationHistory(record: {
    resourceId: string;
    resourceName: string;
    resourceType: string;
    academicYear: string;
    previousDepartment?: string;
    newDepartment: string;
    previousAcademicPlacement?: string;
    newAcademicPlacement: string;
    changedBy: string;
    actionType: 'ALLOCATED' | 'TRANSFERRED' | 'RELEASED' | 'EDITED';
    reason?: string;
  }) {
    const history: AllocationHistoryRecord = {
      id: `hist-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      resourceId: record.resourceId,
      resourceName: record.resourceName,
      resourceType: record.resourceType,
      academicYear: record.academicYear,
      previousDepartment: record.previousDepartment,
      newDepartment: record.newDepartment,
      previousAcademicPlacement: record.previousAcademicPlacement,
      newAcademicPlacement: record.newAcademicPlacement,
      changedBy: record.changedBy,
      dateTime: new Date().toISOString(),
      actionType: record.actionType,
      reason: record.reason
    };

    db.addEntity('allocationHistoryRecords', history, `Recorded allocation history for ${record.resourceName}`);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. DEPARTMENT AUTO-SYNC SUMMARY
  // ══════════════════════════════════════════════════════════════════════════════
  public getDepartmentResourceSummary(departmentId: string) {
    const classrooms = db.getClassroomAllocations().filter(c => c.departmentId === departmentId && c.status === 'ALLOCATED');
    const labs = db.getLaboratoryAllocations().filter(l => l.departmentId === departmentId && l.status === 'ALLOCATED');
    const faculty = db.getFacultyAllocations().filter(f => f.departmentId === departmentId && f.status === 'ACTIVE');
    const subjects = db.getSubjectAllocations().filter(s => s.departmentId === departmentId && s.status === 'ALLOCATED');

    return {
      classrooms,
      labs,
      faculty,
      subjects,
      totalClassrooms: classrooms.length,
      totalLabs: labs.length,
      totalFaculty: faculty.length,
      totalSubjects: subjects.length
    };
  }

  public getFacultyAllocations(facultyId?: string): FacultyAllocation[] {
    const all = db.getFacultyAllocations();
    if (!facultyId) return all;
    return all.filter(f => f.facultyId === facultyId && f.status === 'ACTIVE');
  }

  public getDashboardStats() {
    const resources = db.getInstitutionalResources();
    const crAlloc = db.getClassroomAllocations().filter(c => c.status === 'ALLOCATED');
    const labAlloc = db.getLaboratoryAllocations().filter(l => l.status === 'ALLOCATED');
    const facAlloc = db.getFacultyAllocations().filter(f => f.status === 'ACTIVE');
    const subAlloc = db.getSubjectAllocations();
    const conflicts = this.detectAllConflicts();

    const totalClassrooms = resources.filter(r => r.type === 'CLASSROOM' || r.type === 'SMART_CLASSROOM').length;
    const allocatedClassrooms = crAlloc.length;
    const availableClassrooms = Math.max(0, totalClassrooms - allocatedClassrooms);

    const totalLabs = resources.filter(r => r.type === 'LABORATORY' || r.type === 'COMPUTER_LAB').length;
    const allocatedLabs = labAlloc.length;

    const totalFaculty = db.getUsers().filter(u => u.role === 'FACULTY').length || db.getFaculty().length;
    const allocatedFaculty = new Set(facAlloc.map(f => f.facultyId)).size;

    return {
      totalClassrooms,
      allocatedClassrooms,
      availableClassrooms,
      totalLabs,
      allocatedLabs,
      totalFaculty,
      allocatedFaculty,
      totalSubjects: subAlloc.length,
      pendingRequests: db.getAssetAllocationRequests().filter(r => r.status === 'SUBMITTED').length,
      activeConflicts: conflicts.length,
      conflicts
    };
  }
}

export const resourceAllocationService = ResourceAllocationService.getInstance();
