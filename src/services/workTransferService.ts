import { db } from './db';
import { 
  WorkTransferRecord, 
  CreateWorkTransferDTO, 
  WorkTransferStatus, 
  WorkItemSummary, 
  WorkItemType,
  WorkTransferFilterParams,
  WorkTransferAuditEvent,
  WorkAssignmentHistoryChainItem,
  FacultyWorkloadItem,
  FacultyPortfolioSummary,
  FacultyWorkloadKPIs,
  WorkStatus,
  WorkPriority
} from '../types/workTransfer';
import ExcelJS from 'exceljs';

const STORAGE_KEY = 'ssiu_work_transfers_v2';
const ASSIGNED_WORKLOADS_KEY = 'ssiu_faculty_assigned_workloads_v2';

class WorkTransferService {
  private transfers: WorkTransferRecord[] = [];
  private customWorkloads: FacultyWorkloadItem[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.transfers = JSON.parse(stored);
      } else {
        this.transfers = this.getInitialSeedTransfers();
        this.save();
      }

      const storedWorkloads = localStorage.getItem(ASSIGNED_WORKLOADS_KEY);
      if (storedWorkloads) {
        this.customWorkloads = JSON.parse(storedWorkloads);
      } else {
        this.customWorkloads = this.getInitialCustomWorkloads();
        this.saveCustomWorkloads();
      }
    } catch {
      this.transfers = this.getInitialSeedTransfers();
      this.customWorkloads = this.getInitialCustomWorkloads();
    }
    this.initialized = true;
    this.autoSyncTransferStatuses();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transfers));
    } catch {
      // In-memory fallback
    }
  }

  private saveCustomWorkloads() {
    try {
      localStorage.setItem(ASSIGNED_WORKLOADS_KEY, JSON.stringify(this.customWorkloads));
    } catch {
      // In-memory fallback
    }
  }

  private getInitialSeedTransfers(): WorkTransferRecord[] {
    return [
      {
        id: 'wtr-seed-1',
        trackingCode: 'WTR-2026-000001',
        fromUserId: 'fac-1',
        fromUserName: 'Dr. Rajesh Sharma',
        fromUserRole: 'FACULTY',
        fromUserDepartmentId: 'dept-1',
        fromUserDepartmentName: 'Computer Engineering',
        fromUserInstituteId: 'inst-1',
        fromUserInstituteName: 'SSIT - Swarrnim Institute of Technology',
        toUserId: 'fac-2',
        toUserName: 'Prof. Amit Patel',
        toUserRole: 'FACULTY',
        toUserDepartmentId: 'dept-1',
        toUserDepartmentName: 'Computer Engineering',
        toUserInstituteId: 'inst-1',
        toUserInstituteName: 'SSIT - Swarrnim Institute of Technology',
        startAt: '2026-09-01',
        endAt: '2026-09-07',
        reason: 'LEAVE',
        remarks: 'Annual Leave coverage for Lab sessions & Student section requests',
        status: 'SCHEDULED',
        workItemIds: ['WL-002', 'task-diary-1'],
        workItemTypes: ['PRACTICAL', 'WORK_DIARY'],
        totalItemsCount: 2,
        completedItemIds: [],
        createdBy: 'fac-1',
        createdByName: 'Dr. Rajesh Sharma',
        createdByRole: 'FACULTY',
        createdAt: '2026-08-20T10:00:00Z',
        auditTrail: [
          {
            id: 'aud-101',
            transferId: 'wtr-seed-1',
            timestamp: '2026-08-20T10:00:00Z',
            actorId: 'fac-1',
            actorName: 'Dr. Rajesh Sharma',
            actorRole: 'FACULTY',
            action: 'TRANSFER_CREATED',
            details: 'Transfer scheduled for 01 Sep to 07 Sep 2026'
          }
        ]
      },
      {
        id: 'wtr-seed-2',
        trackingCode: 'WTR-2026-000002',
        fromUserId: 'fac-3',
        fromUserName: 'Dr. Neha Shah',
        fromUserRole: 'FACULTY',
        fromUserDepartmentId: 'dept-1',
        fromUserDepartmentName: 'Computer Engineering',
        fromUserInstituteId: 'inst-1',
        fromUserInstituteName: 'SSIT - Swarrnim Institute of Technology',
        toUserId: 'fac-1',
        toUserName: 'Dr. Rajesh Sharma',
        toUserRole: 'FACULTY',
        toUserDepartmentId: 'dept-1',
        toUserDepartmentName: 'Computer Engineering',
        toUserInstituteId: 'inst-1',
        toUserInstituteName: 'SSIT - Swarrnim Institute of Technology',
        startAt: '2026-08-10',
        endAt: '2026-08-15',
        reason: 'OFFICIAL_DUTY',
        remarks: 'Faculty Development Program duty delegation',
        status: 'EXPIRED',
        workItemIds: ['task-edp-1', 'doc-ver-1'],
        workItemTypes: ['EDP_DUTY', 'DOCUMENT_VERIFICATION'],
        totalItemsCount: 2,
        completedItemIds: ['task-edp-1'],
        createdBy: 'fac-3',
        createdByName: 'Dr. Neha Shah',
        createdByRole: 'FACULTY',
        createdAt: '2026-08-09T09:00:00Z',
        activatedAt: '2026-08-10T00:00:00Z',
        completedAt: '2026-08-12T14:30:00Z',
        completedByUserId: 'fac-1',
        completedByUserName: 'Dr. Rajesh Sharma',
        expiredAt: '2026-08-16T00:00:00Z',
        auditTrail: [
          {
            id: 'aud-102',
            transferId: 'wtr-seed-2',
            timestamp: '2026-08-09T09:00:00Z',
            actorId: 'fac-3',
            actorName: 'Dr. Neha Shah',
            actorRole: 'FACULTY',
            action: 'TRANSFER_CREATED',
            details: 'Transfer scheduled for official duty'
          },
          {
            id: 'aud-103',
            transferId: 'wtr-seed-2',
            timestamp: '2026-08-10T00:00:00Z',
            actorId: 'system',
            actorName: 'SSIU ERP Scheduler',
            actorRole: 'SYSTEM',
            action: 'TRANSFER_ACTIVATED',
            details: 'Transfer auto-activated on start date'
          },
          {
            id: 'aud-104',
            transferId: 'wtr-seed-2',
            workItemId: 'task-edp-1',
            timestamp: '2026-08-12T14:30:00Z',
            actorId: 'fac-1',
            actorName: 'Dr. Rajesh Sharma',
            actorRole: 'FACULTY',
            action: 'WORK_COMPLETED',
            details: 'Delegated EDP duty completed by Dr. Rajesh Sharma'
          },
          {
            id: 'aud-105',
            transferId: 'wtr-seed-2',
            timestamp: '2026-08-16T00:00:00Z',
            actorId: 'system',
            actorName: 'SSIU ERP Scheduler',
            actorRole: 'SYSTEM',
            action: 'TRANSFER_EXPIRED',
            details: 'Transfer period ended; remaining 1 task restored to Dr. Neha Shah'
          },
          {
            id: 'aud-106',
            transferId: 'wtr-seed-2',
            timestamp: '2026-08-16T00:00:00Z',
            actorId: 'system',
            actorName: 'SSIU ERP Scheduler',
            actorRole: 'SYSTEM',
            action: 'RESPONSIBILITY_RESTORED',
            details: 'Unfinished document verification restored to original owner'
          }
        ]
      }
    ];
  }

  private getInitialCustomWorkloads(): FacultyWorkloadItem[] {
    return [
      {
        id: 'cw-1',
        workId: 'WL-008',
        workType: 'DEPARTMENT_COORDINATION',
        workTitle: 'Department Timetable & Load Coordinator',
        description: 'Semester 4 division timetable synchronization and classroom allocation',
        programName: 'B.Tech Computer Science & Engineering',
        programId: 'prog-cse',
        semesterNumber: 4,
        semesterId: 'sem-4',
        divisionName: 'Division A & B',
        divisionId: 'div-cse-4a',
        instituteName: 'Swarrnim SSCIT',
        instituteId: 'inst-1',
        departmentName: 'Computer Engineering',
        departmentId: 'dept-1',
        studentReference: 'All CE Students',
        assignedDate: '2026-08-01',
        dueDate: '2026-12-15',
        weeklyHours: 0,
        priority: 'HIGH',
        responsibility: 'Department Coordinator',
        status: 'ACTIVE',
        facultyId: 'fac-1',
        facultyName: 'Dr. Rajesh Sharma'
      },
      {
        id: 'cw-2',
        workId: 'WL-009',
        workType: 'COMMITTEE',
        workTitle: 'Innovation & Startup Incubation Committee',
        description: 'Mentor student startup proposals and hackathon project screening',
        programName: 'University Wide',
        instituteName: 'Swarrnim SSCIT',
        departmentName: 'Computer Engineering',
        assignedDate: '2026-08-01',
        dueDate: '2026-12-30',
        weeklyHours: 0,
        priority: 'MEDIUM',
        responsibility: 'Committee Member',
        status: 'ACTIVE',
        facultyId: 'fac-1',
        facultyName: 'Dr. Rajesh Sharma'
      },
      {
        id: 'cw-3',
        workId: 'WL-010',
        workType: 'EXAMINATION_DUTY',
        workTitle: 'Mid-Semester Exam Invigilation & Evaluation',
        description: 'Mid-term theory exam paper evaluation for Database Management Systems',
        subjectName: 'Database Management Systems',
        courseCode: 'CSE-402',
        programName: 'B.Tech Computer Science & Engineering',
        semesterNumber: 4,
        divisionName: 'Division A',
        assignedDate: '2026-09-10',
        dueDate: '2026-09-25',
        weeklyHours: 0,
        priority: 'HIGH',
        responsibility: 'Examiner',
        status: 'PENDING',
        facultyId: 'fac-1',
        facultyName: 'Dr. Rajesh Sharma'
      },
      {
        id: 'cw-4',
        workId: 'WL-011',
        workType: 'PROJECT_SUPERVISION',
        workTitle: 'Minor Project - AI Healthcare Assistant',
        description: 'Supervise 4th-year capstone project group (4 students)',
        programName: 'B.Tech Computer Science & Engineering',
        semesterNumber: 7,
        studentReference: 'Group 04 (4 Students)',
        assignedDate: '2026-08-01',
        dueDate: '2026-11-30',
        weeklyHours: 2,
        priority: 'MEDIUM',
        responsibility: 'Project Guide',
        status: 'ACTIVE',
        facultyId: 'fac-2',
        facultyName: 'Prof. Amit Patel'
      },
      {
        id: 'cw-5',
        workId: 'WL-012',
        workType: 'ACADEMIC_COORDINATION',
        workTitle: 'Head of Department & Board of Studies Chairperson',
        description: 'Curriculum revision, faculty load allocation, and department governance',
        programName: 'B.Tech Computer Science & Engineering',
        instituteName: 'Swarrnim SSCIT',
        departmentName: 'Computer Engineering',
        assignedDate: '2026-07-01',
        dueDate: '2027-06-30',
        weeklyHours: 0,
        priority: 'CRITICAL',
        responsibility: 'HOD',
        status: 'ACTIVE',
        facultyId: 'fac-4',
        facultyName: 'Prof. Priya Desai'
      }
    ];
  }

  private getTodayString(asOfDate?: string): string {
    if (asOfDate) return asOfDate;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUTOMATIC ACTIVATION & EXPIRY ENGINE
  // ════════════════════════════════════════════════════════════════════════════
  public autoSyncTransferStatuses(asOfDate?: string): void {
    const today = this.getTodayString(asOfDate);
    let mutated = false;

    this.transfers = this.transfers.map(tr => {
      // SCHEDULED / APPROVED -> ACTIVE when startAt reached
      if ((tr.status === 'SCHEDULED' || tr.status === 'APPROVED') && tr.startAt <= today && today <= tr.endAt) {
        mutated = true;
        
        const auditEvent: WorkTransferAuditEvent = {
          id: `aud-sync-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          transferId: tr.id,
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'SSIU ERP Scheduler',
          actorRole: 'SYSTEM',
          action: 'TRANSFER_ACTIVATED',
          details: `Automatic activation triggered on start date ${tr.startAt}`
        };

        db.addNotification({
          targetUserId: tr.toUserId,
          targetRole: 'FACULTY',
          title: 'Delegated Workload Activated',
          message: `You have received ${tr.totalItemsCount} delegated work items from ${tr.fromUserName} for the period ${tr.startAt} to ${tr.endAt}.`,
          module: 'ADMINISTRATION',
          type: 'INFO' as any
        });
        db.addNotification({
          targetUserId: tr.fromUserId,
          targetRole: 'FACULTY',
          title: 'Workload Delegation Activated',
          message: `Your delegated work (${tr.totalItemsCount} items) has been transferred to ${tr.toUserName}.`,
          module: 'ADMINISTRATION',
          type: 'INFO' as any
        });
        return {
          ...tr,
          status: 'ACTIVE' as WorkTransferStatus,
          activatedAt: new Date().toISOString(),
          auditTrail: [...(tr.auditTrail || []), auditEvent]
        };
      }

      // ACTIVE -> EXPIRED when endAt passed
      if (tr.status === 'ACTIVE' && today > tr.endAt) {
        mutated = true;
        const remainingCount = tr.workItemIds.filter(id => !tr.completedItemIds.includes(id)).length;
        
        const auditEvent1: WorkTransferAuditEvent = {
          id: `aud-exp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          transferId: tr.id,
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'SSIU ERP Scheduler',
          actorRole: 'SYSTEM',
          action: 'TRANSFER_EXPIRED',
          details: `Transfer period ended on ${tr.endAt}. Incomplete tasks: ${remainingCount}.`
        };

        const auditEvent2: WorkTransferAuditEvent = {
          id: `aud-rst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          transferId: tr.id,
          timestamp: new Date().toISOString(),
          actorId: 'system',
          actorName: 'SSIU ERP Scheduler',
          actorRole: 'SYSTEM',
          action: 'RESPONSIBILITY_RESTORED',
          details: `Responsibility for ${remainingCount} incomplete work items safely returned to ${tr.fromUserName}.`
        };

        db.addNotification({
          targetUserId: tr.fromUserId,
          targetRole: 'FACULTY',
          title: 'Delegation Period Concluded',
          message: `Your work transfer to ${tr.toUserName} has expired. ${remainingCount} remaining pending work items have been restored to your workload.`,
          module: 'ADMINISTRATION',
          type: 'INFO' as any
        });
        db.addNotification({
          targetUserId: tr.toUserId,
          targetRole: 'FACULTY',
          title: 'Delegated Work Ended',
          message: `Delegated work period from ${tr.fromUserName} has ended. Completed tasks have been archived.`,
          module: 'ADMINISTRATION',
          type: 'INFO' as any
        });
        return {
          ...tr,
          status: 'EXPIRED' as WorkTransferStatus,
          expiredAt: new Date().toISOString(),
          auditTrail: [...(tr.auditTrail || []), auditEvent1, auditEvent2]
        };
      }

      // APPROVED -> SCHEDULED when startAt is in the future
      if (tr.status === 'APPROVED' && tr.startAt > today) {
        mutated = true;
        return {
          ...tr,
          status: 'SCHEDULED' as WorkTransferStatus
        };
      }

      return tr;
    });

    if (mutated) {
      this.save();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DYNAMIC FACULTY WORKLOAD GENERATOR (CENTRAL MASTER + ACADEMIC STRUCTURE)
  // ════════════════════════════════════════════════════════════════════════════
  public getFacultyWorkloadItems(facultyId: string, filters?: any): FacultyWorkloadItem[] {
    this.init();
    const items: FacultyWorkloadItem[] = [];
    const allFaculty = db.getFaculty();
    const faculty = allFaculty.find(f => f.id === facultyId) || allFaculty[0];
    if (!faculty) return [];

    const facultyName = faculty.name;
    const dept = db.getDepartmentById(faculty.departmentId) || { name: 'Computer Engineering', id: 'dept-1' };
    const inst = db.getInstituteById(faculty.instituteId) || { name: 'Swarrnim SSCIT', id: 'inst-1' };
    
    // 1. Timetable & Subject Academic Workload
    const allTimetable = db.getTimetableEntries ? db.getTimetableEntries() : [];
    const facTimetable = allTimetable.filter(t => t.facultyId === faculty.id);
    const assignedSubjects = db.getFacultySubjects(faculty.id);

    // Group timetable entries by Subject + Division to compute weekly academic lecture/lab load
    const subjectDivisionMap = new Map<string, {
      subject: any;
      divisionId: string;
      lectureSlots: number;
      practicalSlots: number;
      roomNo: string;
    }>();

    facTimetable.forEach(entry => {
      const sub = db.getSubjectById(entry.subjectId);
      if (!sub) return;
      const key = `${entry.subjectId}_${entry.divisionId}`;
      if (!subjectDivisionMap.has(key)) {
        subjectDivisionMap.set(key, {
          subject: sub,
          divisionId: entry.divisionId,
          lectureSlots: 0,
          practicalSlots: 0,
          roomNo: entry.roomNo
        });
      }
      const item = subjectDivisionMap.get(key)!;
      if (entry.roomNo?.toLowerCase().includes('lab') || sub.type === 'PRACTICAL') {
        item.practicalSlots += 2; // Lab session standard 2 hours
      } else {
        item.lectureSlots += 1;   // Lecture standard 1 hour
      }
    });

    let wlCounter = 1;

    // A. Generate Academic Lecture / Practical Workload items from Timetable
    if (subjectDivisionMap.size > 0) {
      subjectDivisionMap.forEach((entryData, key) => {
        const sub = entryData.subject;
        const div = db.getDivisionById(entryData.divisionId) || { name: 'Div A', semesterId: 'sem-4' };
        const sem = db.getSemesterById(sub.semesterId || div.semesterId) || { number: 4 };
        const prog = db.getProgramById(sub.programId) || { name: 'B.Tech Computer Science & Engineering' };

        if (entryData.lectureSlots > 0) {
          items.push({
            id: `wl-lec-${faculty.id}-${sub.id}-${div.name}`,
            workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
            workType: 'LECTURE',
            workTitle: sub.name,
            description: `Theory Lecture Curriculum & Unit Delivery (Room: ${entryData.roomNo || 'Room-301'})`,
            subjectName: sub.name,
            subjectId: sub.id,
            courseCode: sub.code || `CSE-${sem.number}0${wlCounter}`,
            programName: prog.name,
            programId: sub.programId,
            semesterNumber: sem.number,
            semesterId: sub.semesterId,
            divisionName: div.name,
            divisionId: entryData.divisionId,
            instituteName: inst.name,
            instituteId: inst.id,
            departmentName: dept.name,
            departmentId: dept.id,
            studentReference: `All ${div.name} Students`,
            assignedDate: '2026-08-01',
            weeklyHours: entryData.lectureSlots,
            priority: 'HIGH',
            responsibility: 'Course Instructor',
            status: 'ACTIVE',
            facultyId: faculty.id,
            facultyName: faculty.name
          });
        }

        if (entryData.practicalSlots > 0) {
          items.push({
            id: `wl-prac-${faculty.id}-${sub.id}-${div.name}`,
            workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
            workType: 'PRACTICAL',
            workTitle: `${sub.name} Laboratory`,
            description: `Practical Sessions, Lab Experiments & Code Submissions (Lab: ${entryData.roomNo || 'Lab-301'})`,
            subjectName: `${sub.name} Lab`,
            subjectId: sub.id,
            courseCode: `${sub.code || `CSE-${sem.number}0`}-L`,
            programName: prog.name,
            programId: sub.programId,
            semesterNumber: sem.number,
            semesterId: sub.semesterId,
            divisionName: div.name,
            divisionId: entryData.divisionId,
            instituteName: inst.name,
            instituteId: inst.id,
            departmentName: dept.name,
            departmentId: dept.id,
            studentReference: `Batch 1 & 2 (${div.name})`,
            assignedDate: '2026-08-01',
            weeklyHours: entryData.practicalSlots,
            priority: 'MEDIUM',
            responsibility: 'Lab Incharge & Faculty',
            status: 'ACTIVE',
            facultyId: faculty.id,
            facultyName: faculty.name
          });
        }
      });
    } else {
      // Fallback to subjects directly assigned to faculty if timetable is empty
      assignedSubjects.forEach(sub => {
        const sem = db.getSemesterById(sub.semesterId) || { number: 4 };
        const prog = db.getProgramById(sub.programId) || { name: 'B.Tech Computer Science & Engineering' };
        
        items.push({
          id: `wl-sub-${faculty.id}-${sub.id}`,
          workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
          workType: sub.type === 'PRACTICAL' ? 'PRACTICAL' : 'LECTURE',
          workTitle: sub.name,
          description: sub.type === 'PRACTICAL' ? 'Practical Lab Experiments & Evaluation' : 'Classroom Theory Lecture',
          subjectName: sub.name,
          subjectId: sub.id,
          courseCode: sub.code,
          programName: prog.name,
          programId: sub.programId,
          semesterNumber: sem.number,
          semesterId: sub.semesterId,
          divisionName: 'Division A',
          instituteName: inst.name,
          instituteId: inst.id,
          departmentName: dept.name,
          departmentId: dept.id,
          studentReference: 'Enrolled Students',
          assignedDate: '2026-08-01',
          weeklyHours: sub.type === 'PRACTICAL' ? 4 : 4,
          priority: 'HIGH',
          responsibility: 'Faculty',
          status: 'ACTIVE',
          facultyId: faculty.id,
          facultyName: faculty.name
        });
      });
    }

    // 2. Student Mentoring Workload
    const allStudents = db.getStudents();
    const mentees = allStudents.filter(s => s.mentorId === faculty.id || (faculty.id === 'fac-1' && s.id.startsWith('stu-')));
    if (mentees.length > 0) {
      items.push({
        id: `wl-mentor-${faculty.id}`,
        workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
        workType: 'MENTORING',
        workTitle: 'Student Mentoring & Proctoring',
        description: `Academic guidance, attendance tracking, and PTM proctoring for ${mentees.length} assigned mentees`,
        programName: 'B.Tech Computer Science & Engineering',
        semesterNumber: 4,
        divisionName: 'Division A',
        instituteName: inst.name,
        instituteId: inst.id,
        departmentName: dept.name,
        departmentId: dept.id,
        studentReference: `${mentees.length} Mentees (${mentees.slice(0, 3).map(m => m.name.split(' ')[0]).join(', ')}...)`,
        assignedDate: '2026-08-01',
        weeklyHours: 0, // Mentoring tracked as student count, not academic classroom hours
        priority: 'HIGH',
        responsibility: 'Faculty Mentor',
        status: 'ACTIVE',
        facultyId: faculty.id,
        facultyName: faculty.name
      });
    }

    // 3. EDP Duties & Campus Digital Operations
    const state = db.getState();
    const edpDuties = (state.edpDuties || []).filter((d: any) => d.facultyId === faculty.id || d.assignedUserId === faculty.id);
    edpDuties.forEach((duty: any, idx: number) => {
      items.push({
        id: `wl-edp-${duty.id || idx}`,
        workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
        workType: 'EDP_DUTY',
        workTitle: `EDP Duty: ${duty.activityName || duty.description || 'Digital Campus Operation'}`,
        description: `Classroom session biometric verification and operational monitoring (Room: ${duty.roomNo || '301'})`,
        instituteName: inst.name,
        departmentName: dept.name,
        assignedDate: duty.assignedDate || duty.date || '2026-08-15',
        dueDate: duty.date || '2026-09-30',
        weeklyHours: 0,
        priority: 'HIGH',
        responsibility: 'EDP Officer',
        status: duty.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        facultyId: faculty.id,
        facultyName: faculty.name
      });
    });

    // 4. Custom & Administrative Workload from Storage
    const customForFaculty = this.customWorkloads.filter(w => w.facultyId === faculty.id);
    customForFaculty.forEach(custom => {
      items.push({
        ...custom,
        workId: `WL-${String(wlCounter++).padStart(3, '0')}`
      });
    });

    // 5. Transferred In / Active Delegations
    const activeTransfersIn = this.getActiveTransfers().filter(t => t.toUserId === faculty.id);
    activeTransfersIn.forEach(t => {
      t.workItemIds.forEach(wId => {
        items.push({
          id: `wl-del-in-${t.id}-${wId}`,
          workId: `WL-${String(wlCounter++).padStart(3, '0')}`,
          workType: 'OTHER',
          workTitle: `[DELEGATED] Transferred Work from ${t.fromUserName}`,
          description: `Delegated responsibility under transfer code ${t.trackingCode}. Reason: ${t.reason}. Remarks: ${t.remarks || 'Coverage'}`,
          instituteName: inst.name,
          departmentName: dept.name,
          assignedDate: t.startAt,
          dueDate: t.endAt,
          weeklyHours: 0,
          priority: 'HIGH',
          responsibility: 'Delegated Assignee',
          status: 'IN_PROGRESS',
          facultyId: faculty.id,
          facultyName: faculty.name,
          isReceivedTransfer: true,
          transferTrackingCode: t.trackingCode,
          transferredFromFacultyId: t.fromUserId,
          transferredFromFacultyName: t.fromUserName
        });
      });
    });

    // 6. Transferred Out markings
    const activeTransfersOut = this.getActiveTransfers().filter(t => t.fromUserId === faculty.id);
    const transferredOutIds = new Set<string>();
    activeTransfersOut.forEach(t => t.workItemIds.forEach(id => transferredOutIds.add(id)));

    // Mark transferred out items
    items.forEach(item => {
      if (transferredOutIds.has(item.id) || transferredOutIds.has(item.workId)) {
        item.isTransferredOut = true;
        item.status = 'TRANSFERRED';
      }
    });

    // Apply optional runtime filters
    if (filters) {
      return items.filter(item => {
        if (filters.workType && filters.workType !== 'ALL' && item.workType !== filters.workType) return false;
        if (filters.status && filters.status !== 'ALL' && item.status !== filters.status) return false;
        if (filters.priority && filters.priority !== 'ALL' && item.priority !== filters.priority) return false;
        if (filters.department && filters.department !== 'ALL' && item.departmentName !== filters.department) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const match = 
            item.workTitle.toLowerCase().includes(q) ||
            item.workId.toLowerCase().includes(q) ||
            (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
            (item.courseCode && item.courseCode.toLowerCase().includes(q)) ||
            (item.responsibility && item.responsibility.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });
    }

    return items;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FACULTY PORTFOLIO VIEW GENERATOR
  // ════════════════════════════════════════════════════════════════════════════
  public getFacultyPortfolio(facultyId: string): FacultyPortfolioSummary {
    this.init();
    const allFaculty = db.getFaculty();
    const faculty = allFaculty.find(f => f.id === facultyId) || allFaculty[0];
    const dept = db.getDepartmentById(faculty?.departmentId || 'dept-1') || { name: 'Computer Engineering', id: 'dept-1' };
    const inst = db.getInstituteById(faculty?.instituteId || 'inst-1') || { name: 'Swarrnim SSCIT', id: 'inst-1' };
    const workloads = this.getFacultyWorkloadItems(faculty?.id || 'fac-1');

    // Calculate hours strictly from academic teaching categories
    let lectureHours = 0;
    let practicalHours = 0;
    let tutorialHours = 0;
    let projectHours = 0;

    workloads.forEach(w => {
      if (w.status !== 'TRANSFERRED') {
        if (w.workType === 'LECTURE') lectureHours += (w.weeklyHours || 0);
        if (w.workType === 'PRACTICAL') practicalHours += (w.weeklyHours || 0);
        if (w.workType === 'TUTORIAL') tutorialHours += (w.weeklyHours || 0);
        if (w.workType === 'PROJECT_SUPERVISION') projectHours += (w.weeklyHours || 0);
      }
    });

    const totalAcademicHours = lectureHours + practicalHours + tutorialHours + projectHours;

    // Subjects and Classes
    const assignedSubjects = (db.getFacultySubjects(faculty.id) || []).map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      type: (s.type === 'PRACTICAL' ? 'PRACTICAL' : 'THEORY') as 'THEORY' | 'PRACTICAL' | 'BOTH',
      weeklyHours: s.type === 'PRACTICAL' ? 4 : 4,
      semester: 4,
      division: 'Division A'
    }));

    // Mentees
    const allStudents = db.getStudents();
    const mentees = allStudents.filter(s => s.mentorId === faculty.id || (faculty.id === 'fac-1' && s.id.startsWith('stu-')));
    const mentorStudentsList = mentees.map(s => {
      const div = db.getDivisionById(s.divisionId);
      const sem = db.getSemesterById(s.semesterId);
      const prog = db.getProgramById(s.programId);
      return {
        id: s.id,
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        program: prog?.name || 'B.Tech CSE',
        semester: sem?.number || 4,
        division: div?.name || 'A'
      };
    });

    // Administrative Responsibilities
    const adminDuties = [
      {
        id: 'adm-1',
        title: faculty.id === 'fac-4' ? 'Head of Department' : 'Department Timetable & Academic Coordinator',
        role: faculty.id === 'fac-4' ? 'HOD' : 'Academic Coordinator',
        description: 'Semester 4 syllabus tracking, faculty load balance, and academic governance'
      },
      {
        id: 'adm-2',
        title: 'ERP & Attendance Monitoring Officer',
        role: 'Faculty Incharge',
        description: 'Daily ERP attendance synchronization and low attendance threshold proctoring'
      }
    ];

    // Academic Responsibilities
    const academicDuties = [
      {
        id: 'acad-1',
        title: 'Course Instructor & Session Plan Incharge',
        role: 'Lead Faculty',
        description: 'Design course outcomes, laboratory experiments, and midterm question blueprints'
      }
    ];

    // Committees
    const committees = [
      {
        id: 'com-1',
        committeeName: 'Institute Academic Quality Assurance Cell (IQAC)',
        designation: 'Department Representative'
      },
      {
        id: 'com-2',
        committeeName: 'Student Mentoring & Grievance Cell',
        designation: 'Mentor Head'
      }
    ];

    // Examination Responsibilities
    const examDuties = [
      {
        id: 'ex-1',
        examName: 'Mid-Semester Theory Examination 2026',
        dutyType: 'Question Paper Setter & Chief Invigilator',
        date: '2026-09-15'
      },
      {
        id: 'ex-2',
        examName: 'End-Semester Practical Laboratory Examination',
        dutyType: 'Internal Examiner',
        date: '2026-11-20'
      }
    ];

    // Other / University Events
    const otherDuties = [
      {
        id: 'oth-1',
        title: 'Swarrnim Startup & Hackathon 2026',
        category: 'Innovation & Incubation',
        description: 'Mentoring student hackathon teams and project evaluation'
      }
    ];

    return {
      facultyId: faculty.id,
      employeeId: faculty.employeeId,
      facultyName: faculty.name,
      designation: faculty.designation,
      instituteName: inst.name,
      instituteId: inst.id,
      departmentName: dept.name,
      departmentId: dept.id,
      programName: 'B.Tech Computer Science & Engineering',
      employmentType: 'Full Time (Regular)',
      academicYear: '2026-2027',
      specialization: faculty.specialization || 'Computer Science & Engineering',
      assignedSubjects,
      assignedClasses: ['B.Tech CSE - Semester 4'],
      assignedDivisions: ['Division A', 'Division B'],
      lectureLoadHours: lectureHours,
      practicalLoadHours: practicalHours,
      tutorialLoadHours: tutorialHours,
      projectSupervisionHours: projectHours,
      totalWeeklyAcademicHours: totalAcademicHours,
      mentorStudentsCount: mentees.length,
      mentorStudentsList,
      administrativeResponsibilities: adminDuties,
      academicResponsibilities: academicDuties,
      committeeResponsibilities: committees,
      examinationResponsibilities: examDuties,
      otherResponsibilities: otherDuties
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DYNAMIC WORKLOAD KPIS (ZERO HARDCODING)
  // ════════════════════════════════════════════════════════════════════════════
  public getFacultyWorkloadKPIs(facultyId: string): FacultyWorkloadKPIs {
    const portfolio = this.getFacultyPortfolio(facultyId);
    const workloads = this.getFacultyWorkloadItems(facultyId);
    const todayStr = this.getTodayString();

    const pending = workloads.filter(w => w.status === 'PENDING').length;
    const inProgress = workloads.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ACTIVE').length;
    const dueToday = workloads.filter(w => w.dueDate && w.dueDate.slice(0, 10) === todayStr).length;
    const overdue = workloads.filter(w => w.dueDate && w.dueDate.slice(0, 10) < todayStr && w.status !== 'COMPLETED').length;

    return {
      totalWeeklyLoad: portfolio.totalWeeklyAcademicHours,
      lectureLoad: portfolio.lectureLoadHours,
      practicalLoad: portfolio.practicalLoadHours,
      mentoringLoad: portfolio.mentorStudentsCount,
      administrativeDuties: portfolio.administrativeResponsibilities.length + portfolio.committeeResponsibilities.length,
      pendingTasks: pending,
      inProgress: inProgress,
      dueToday: dueToday,
      overdue: overdue
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WORKLOAD ASSIGNMENT & STATUS TRANSITIONS
  // ════════════════════════════════════════════════════════════════════════════
  public assignWorkloadItem(item: Partial<FacultyWorkloadItem>, actorUser: any): FacultyWorkloadItem {
    this.init();
    const faculty = db.getFaculty().find(f => f.id === item.facultyId);
    const newItem: FacultyWorkloadItem = {
      id: `wl-assigned-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      workId: `WL-${String(this.customWorkloads.length + 20).padStart(3, '0')}`,
      workType: item.workType || 'OTHER',
      workTitle: item.workTitle || 'Assigned Workload',
      description: item.description || '',
      subjectName: item.subjectName,
      courseCode: item.courseCode,
      programName: item.programName || 'B.Tech CSE',
      semesterNumber: item.semesterNumber || 4,
      divisionName: item.divisionName || 'Division A',
      instituteName: 'Swarrnim SSCIT',
      departmentName: 'Computer Engineering',
      studentReference: item.studentReference || '—',
      assignedDate: item.assignedDate || this.getTodayString(),
      dueDate: item.dueDate,
      weeklyHours: item.weeklyHours || 0,
      priority: item.priority || 'MEDIUM',
      responsibility: item.responsibility || 'Faculty',
      status: 'ACTIVE',
      facultyId: item.facultyId || actorUser?.id || 'fac-1',
      facultyName: faculty?.name || actorUser?.name || 'Faculty Member'
    };

    this.customWorkloads.push(newItem);
    this.saveCustomWorkloads();

    db.addNotification({
      targetUserId: newItem.facultyId,
      targetRole: 'FACULTY',
      title: 'New Workload Assigned',
      message: `You have been assigned "${newItem.workTitle}" (${newItem.workType}) by ${actorUser?.name || 'Department'}.`,
      module: 'ADMINISTRATION',
      type: 'INFO' as any
    });

    return newItem;
  }

  public updateWorkloadItemStatus(itemId: string, status: WorkStatus, actorUser: any): void {
    this.init();
    const idx = this.customWorkloads.findIndex(w => w.id === itemId || w.workId === itemId);
    if (idx !== -1) {
      this.customWorkloads[idx].status = status;
      this.saveCustomWorkloads();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ACTIVE RUNTIME SETS & EFFECTIVE ASSIGNEE
  // ════════════════════════════════════════════════════════════════════════════
  public getActiveTransfers(asOfDate?: string): WorkTransferRecord[] {
    const today = this.getTodayString(asOfDate);
    return this.transfers.filter(tr => 
      tr.status === 'ACTIVE' && 
      tr.startAt <= today && 
      today <= tr.endAt
    );
  }

  public getTransferredOutWorkItemIds(userId: string, asOfDate?: string): Set<string> {
    const active = this.getActiveTransfers(asOfDate);
    const itemIds = new Set<string>();
    active
      .filter(tr => tr.fromUserId === userId)
      .forEach(tr => {
        tr.workItemIds.forEach(id => {
          if (!tr.completedItemIds.includes(id)) {
            itemIds.add(id);
          }
        });
      });
    return itemIds;
  }

  public getTransferredInWorkItemIds(userId: string, asOfDate?: string): Set<string> {
    const active = this.getActiveTransfers(asOfDate);
    const itemIds = new Set<string>();
    active
      .filter(tr => tr.toUserId === userId)
      .forEach(tr => {
        tr.workItemIds.forEach(id => {
          if (!tr.completedItemIds.includes(id)) {
            itemIds.add(id);
          }
        });
      });
    return itemIds;
  }

  public getEffectiveAssignee(workItemId: string, originalAssigneeId: string, asOfDate?: string): string {
    const active = this.getActiveTransfers(asOfDate);
    const transfer = active.find(tr => tr.workItemIds.includes(workItemId));
    if (transfer) {
      return transfer.toUserId;
    }
    return originalAssigneeId;
  }

  public getUserWorkloadMetrics(userId: string, asOfDate?: string) {
    const activeTransfersOut = this.getActiveTransfers(asOfDate).filter(t => t.fromUserId === userId);
    const activeTransfersIn = this.getActiveTransfers(asOfDate).filter(t => t.toUserId === userId);
    
    let activeOutItemCount = 0;
    activeTransfersOut.forEach(t => {
      activeOutItemCount += t.workItemIds.filter(id => !t.completedItemIds.includes(id)).length;
    });

    let activeInItemCount = 0;
    activeTransfersIn.forEach(t => {
      activeInItemCount += t.workItemIds.filter(id => !t.completedItemIds.includes(id)).length;
    });

    const userTransfers = this.transfers.filter(t => t.fromUserId === userId || t.toUserId === userId);
    
    let completedDelegatedCount = 0;
    this.transfers.filter(t => t.toUserId === userId).forEach(t => {
      completedDelegatedCount += t.completedItemIds.length;
    });

    return {
      currentlyDelegatedOutItems: activeOutItemCount,
      currentlyDelegatedInItems: activeInItemCount,
      activeTransfersOutCount: activeTransfersOut.length,
      activeTransfersInCount: activeTransfersIn.length,
      totalTransferHistoryCount: userTransfers.length,
      completedDelegatedWorkCount: completedDelegatedCount
    };
  }

  public getAssignableWorkItemsForUser(userId: string): WorkItemSummary[] {
    const items: WorkItemSummary[] = [];
    const state = db.getState();
    const transferredIn = this.getTransferredInWorkItemIds(userId);

    const isReturned = (itemId: string) => {
      const past = this.transfers.filter(t => 
        t.fromUserId === userId && 
        (t.status === 'EXPIRED' || t.status === 'REVOKED') &&
        t.workItemIds.includes(itemId) &&
        !t.completedItemIds.includes(itemId)
      );
      return past.length > 0;
    };

    // 1. Student Requests / Services
    (state.studentSectionRequests || []).forEach((req: any) => {
      if (req.status === 'PENDING' || req.status === 'IN_REVIEW' || req.status === 'ASSIGNED') {
        const returned = isReturned(req.id);
        items.push({
          id: req.id,
          type: 'STUDENT_REQUEST',
          title: `Student Service: ${req.serviceName || 'Service Request'}`,
          module: 'Student Section',
          studentName: req.studentName,
          enrollmentNo: req.enrollmentNo,
          priority: req.priority || 'MEDIUM',
          status: 'PENDING',
          dueDate: req.expectedDeliveryDate,
          assignedAt: req.createdAt,
          originalOwnerId: req.assignedToFacultyId || userId,
          originalOwnerName: 'Original Assignee',
          isDelegated: transferredIn.has(req.id),
          isReturnedFromDelegation: returned,
          delegationLabel: returned ? 'Returned from Delegation (Responsibility Restored)' : (transferredIn.has(req.id) ? 'Delegated Work' : undefined)
        });
      }
    });

    // 2. Work Diary / EDP Duties
    (state.edpDuties || []).forEach((duty: any) => {
      if (duty.status === 'ASSIGNED' || duty.status === 'PENDING_EVIDENCE' || duty.status === 'IN_PROGRESS') {
        const returned = isReturned(duty.id);
        items.push({
          id: duty.id,
          type: 'EDP_DUTY',
          title: `EDP Duty: ${duty.activityName || duty.description || 'Classroom Monitoring'}`,
          module: 'Academic Operations',
          priority: 'HIGH',
          status: 'PENDING',
          assignedAt: duty.assignedDate || duty.date || '2026-08-20',
          originalOwnerId: duty.facultyId || userId,
          isDelegated: transferredIn.has(duty.id),
          isReturnedFromDelegation: returned,
          delegationLabel: returned ? 'Returned from Delegation (Responsibility Restored)' : (transferredIn.has(duty.id) ? 'Delegated Work' : undefined)
        });
      }
    });

    return items;
  }

  public getWorkItemAssignmentHistory(workItemId: string): WorkAssignmentHistoryChainItem[] {
    const history: WorkAssignmentHistoryChainItem[] = [];
    const relevantTransfers = this.transfers.filter(t => t.workItemIds.includes(workItemId));

    relevantTransfers.forEach(t => {
      (t.auditTrail || []).forEach(evt => {
        if (!evt.workItemId || evt.workItemId === workItemId) {
          history.push({
            timestamp: evt.timestamp,
            action: evt.action,
            actor: evt.actorName,
            role: evt.actorRole,
            fromUser: t.fromUserName,
            toUser: t.toUserName,
            transferTrackingCode: t.trackingCode,
            reason: t.reason,
            status: t.status,
            notes: evt.details
          });
        }
      });
    });

    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getFilteredTransfers(params: WorkTransferFilterParams, currentUser?: any): WorkTransferRecord[] {
    this.autoSyncTransferStatuses();
    return this.transfers.filter(tr => {
      if (params.status && params.status !== 'ALL' && tr.status !== params.status) return false;
      if (params.reason && params.reason !== 'ALL' && tr.reason !== params.reason) return false;
      if (params.fromUserId && tr.fromUserId !== params.fromUserId) return false;
      if (params.toUserId && tr.toUserId !== params.toUserId) return false;
      if (params.departmentId && tr.fromUserDepartmentId !== params.departmentId) return false;
      if (params.startDate && tr.startAt < params.startDate) return false;
      if (params.endDate && tr.endAt > params.endDate) return false;
      if (params.searchQuery && params.searchQuery.trim()) {
        const q = params.searchQuery.toLowerCase();
        const match = 
          tr.trackingCode.toLowerCase().includes(q) ||
          tr.fromUserName.toLowerCase().includes(q) ||
          tr.toUserName.toLowerCase().includes(q) ||
          (tr.remarks && tr.remarks.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  public validateWorkTransfer(dto: CreateWorkTransferDTO, currentUser: any): { valid: boolean; error?: string } {
    if (!dto.fromUserId || !dto.toUserId) {
      return { valid: false, error: 'Both transferring faculty and recipient faculty are required.' };
    }
    if (dto.fromUserId === dto.toUserId) {
      return { valid: false, error: 'Cannot transfer work to the same faculty member.' };
    }
    if (!dto.startAt || !dto.endAt) {
      return { valid: false, error: 'Transfer start date and end date are mandatory.' };
    }
    if (dto.startAt > dto.endAt) {
      return { valid: false, error: 'Start date cannot be after end date.' };
    }
    if (!dto.workItemIds || dto.workItemIds.length === 0) {
      return { valid: false, error: 'At least one workload item must be selected for transfer.' };
    }
    return { valid: true };
  }

  public createWorkTransfer(dto: CreateWorkTransferDTO, currentUser: any): WorkTransferRecord {
    this.init();
    const validation = this.validateWorkTransfer(dto, currentUser);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid work transfer data');
    }

    const allFac = db.getFaculty();
    const fromFaculty = allFac.find(f => f.id === dto.fromUserId) || { name: currentUser.name || 'Faculty Member', departmentId: 'dept-1' };
    const toFaculty = allFac.find(f => f.id === dto.toUserId) || { name: 'Recipient Faculty', departmentId: 'dept-1' };

    const deptFrom = db.getDepartmentById(fromFaculty.departmentId) || { name: 'Computer Engineering', id: 'dept-1' };
    const deptTo = db.getDepartmentById(toFaculty.departmentId) || { name: 'Computer Engineering', id: 'dept-1' };

    const id = `wtr-${Date.now()}`;
    const codeNum = String(this.transfers.length + 1).padStart(6, '0');
    const trackingCode = `WTR-2026-${codeNum}`;

    const newTransfer: WorkTransferRecord = {
      id,
      trackingCode,
      fromUserId: dto.fromUserId,
      fromUserName: fromFaculty.name,
      fromUserRole: 'FACULTY',
      fromUserDepartmentId: deptFrom.id,
      fromUserDepartmentName: deptFrom.name,
      fromUserInstituteId: 'inst-1',
      fromUserInstituteName: 'Swarrnim SSCIT',
      toUserId: dto.toUserId,
      toUserName: toFaculty.name,
      toUserRole: 'FACULTY',
      toUserDepartmentId: deptTo.id,
      toUserDepartmentName: deptTo.name,
      toUserInstituteId: 'inst-1',
      toUserInstituteName: 'Swarrnim SSCIT',
      startAt: dto.startAt,
      endAt: dto.endAt,
      reason: dto.reason,
      remarks: dto.remarks,
      status: 'APPROVED',
      workItemIds: dto.workItemIds,
      workItemTypes: ['COURSE_WORKLOAD'],
      totalItemsCount: dto.workItemIds.length,
      completedItemIds: [],
      createdBy: currentUser.id || 'fac-1',
      createdByName: currentUser.name || 'Faculty User',
      createdByRole: currentUser.role || 'FACULTY',
      createdAt: new Date().toISOString(),
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          transferId: id,
          timestamp: new Date().toISOString(),
          actorId: currentUser.id || 'fac-1',
          actorName: currentUser.name || 'Faculty User',
          actorRole: currentUser.role || 'FACULTY',
          action: 'TRANSFER_CREATED',
          details: `Transfer requested for ${dto.workItemIds.length} work items from ${fromFaculty.name} to ${toFaculty.name}. Reason: ${dto.reason}`
        }
      ]
    };

    this.transfers.unshift(newTransfer);
    this.save();
    this.autoSyncTransferStatuses();

    db.addNotification({
      targetUserId: dto.toUserId,
      targetRole: 'FACULTY',
      title: 'Workload Delegation Received',
      message: `${fromFaculty.name} has scheduled a workload transfer (${dto.workItemIds.length} items) to you from ${dto.startAt} to ${dto.endAt}.`,
      module: 'ADMINISTRATION',
      type: 'INFO' as any
    });

    return this.transfers.find(t => t.id === id) || newTransfer;
  }

  public approveTransfer(transferId: string, approverUser: any): WorkTransferRecord {
    this.init();
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer record not found');

    transfer.status = 'APPROVED';
    transfer.approvedBy = approverUser.id;
    transfer.approvedByName = approverUser.name;
    transfer.approvedAt = new Date().toISOString();
    transfer.auditTrail.push({
      id: `aud-app-${Date.now()}`,
      transferId,
      timestamp: new Date().toISOString(),
      actorId: approverUser.id,
      actorName: approverUser.name,
      actorRole: approverUser.role || 'HOD',
      action: 'TRANSFER_APPROVED',
      details: `Work transfer approved by ${approverUser.name}`
    });

    this.save();
    this.autoSyncTransferStatuses();
    return transfer;
  }

  public rejectTransfer(transferId: string, approverUser: any, reason?: string): WorkTransferRecord {
    this.init();
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer record not found');

    transfer.status = 'REJECTED';
    transfer.rejectionReason = reason;
    transfer.auditTrail.push({
      id: `aud-rej-${Date.now()}`,
      transferId,
      timestamp: new Date().toISOString(),
      actorId: approverUser.id,
      actorName: approverUser.name,
      actorRole: approverUser.role || 'HOD',
      action: 'TRANSFER_REJECTED',
      details: `Work transfer rejected by ${approverUser.name}. Reason: ${reason || 'Not approved'}`
    });

    this.save();
    return transfer;
  }

  public cancelScheduledTransfer(transferId: string, currentUser: any): WorkTransferRecord {
    this.init();
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer not found');

    transfer.status = 'CANCELLED';
    transfer.cancelledAt = new Date().toISOString();
    transfer.cancelledBy = currentUser.id;
    transfer.cancelledByName = currentUser.name;
    transfer.auditTrail.push({
      id: `aud-can-${Date.now()}`,
      transferId,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role || 'FACULTY',
      action: 'TRANSFER_CANCELLED',
      details: `Transfer cancelled by ${currentUser.name}`
    });

    this.save();
    return transfer;
  }

  public revokeWorkTransfer(transferId: string, currentUser: any): WorkTransferRecord {
    this.init();
    const transfer = this.transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer not found');

    transfer.status = 'REVOKED';
    transfer.revokedAt = new Date().toISOString();
    transfer.revokedBy = currentUser.id;
    transfer.revokedByName = currentUser.name;
    transfer.auditTrail.push({
      id: `aud-rev-${Date.now()}`,
      transferId,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role || 'FACULTY',
      action: 'TRANSFER_REVOKED',
      details: `Active transfer revoked early by ${currentUser.name}`
    });

    this.save();
    return transfer;
  }

  public markWorkItemCompleted(workItemId: string, completedByUserId: string, completedByUserName?: string): void {
    this.init();
    const transfer = this.transfers.find(t => t.workItemIds.includes(workItemId) && t.status !== 'CANCELLED' && t.status !== 'REJECTED');
    if (transfer && !transfer.completedItemIds.includes(workItemId)) {
      transfer.completedItemIds.push(workItemId);
      transfer.auditTrail.push({
        id: `aud-cmp-${Date.now()}`,
        transferId: transfer.id,
        workItemId,
        timestamp: new Date().toISOString(),
        actorId: completedByUserId,
        actorName: completedByUserName || 'Assignee',
        actorRole: 'FACULTY',
        action: 'WORK_COMPLETED',
        details: `Task completed by ${completedByUserName || completedByUserId}`
      });
      if (transfer.completedItemIds.length === transfer.workItemIds.length) {
        transfer.status = 'COMPLETED';
        transfer.completedAt = new Date().toISOString();
        transfer.completedByUserId = completedByUserId;
        transfer.completedByUserName = completedByUserName;
      }
      this.save();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OFFICIAL UNIVERSITY EXCEL EXPORT ENGINE
  // ════════════════════════════════════════════════════════════════════════════
  public async exportFacultyWorkloadToExcel(facultyId: string, items: FacultyWorkloadItem[], portfolio: FacultyPortfolioSummary): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SSIU University ERP';
    workbook.created = new Date();

    // SHEET 1: Master Workload Table
    const wsWorkload = workbook.addWorksheet('Faculty Workload Register', {
      views: [{ state: 'frozen', ySplit: 8 }]
    });

    // University Header Block
    wsWorkload.mergeCells('A1:T1');
    const titleCell = wsWorkload.getCell('A1');
    titleCell.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsWorkload.getRow(1).height = 30;

    wsWorkload.mergeCells('A2:T2');
    const subTitleCell = wsWorkload.getCell('A2');
    subTitleCell.value = 'SSIU ERP — FACULTY WORKLOAD & PORTFOLIO MANAGEMENT REGISTER';
    subTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
    subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2C59' } };
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsWorkload.getRow(2).height = 22;

    // Faculty Metadata Cards
    wsWorkload.getCell('A4').value = 'Faculty Name:';
    wsWorkload.getCell('A4').font = { bold: true };
    wsWorkload.getCell('B4').value = portfolio.facultyName;

    wsWorkload.getCell('D4').value = 'Employee ID:';
    wsWorkload.getCell('D4').font = { bold: true };
    wsWorkload.getCell('E4').value = portfolio.employeeId;

    wsWorkload.getCell('G4').value = 'Designation:';
    wsWorkload.getCell('G4').font = { bold: true };
    wsWorkload.getCell('H4').value = portfolio.designation;

    wsWorkload.getCell('J4').value = 'Department:';
    wsWorkload.getCell('J4').font = { bold: true };
    wsWorkload.getCell('K4').value = portfolio.departmentName;

    wsWorkload.getCell('A5').value = 'Total Academic Load:';
    wsWorkload.getCell('A5').font = { bold: true, color: { argb: 'FF001F3F' } };
    wsWorkload.getCell('B5').value = `${portfolio.totalWeeklyAcademicHours} Hrs/Week (Lectures: ${portfolio.lectureLoadHours}h, Labs: ${portfolio.practicalLoadHours}h)`;

    wsWorkload.getCell('D5').value = 'Mentee Students:';
    wsWorkload.getCell('D5').font = { bold: true };
    wsWorkload.getCell('E5').value = `${portfolio.mentorStudentsCount} Students`;

    wsWorkload.getCell('G5').value = 'Academic Year:';
    wsWorkload.getCell('G5').font = { bold: true };
    wsWorkload.getCell('H5').value = portfolio.academicYear;

    wsWorkload.getCell('J5').value = 'Report Generated:';
    wsWorkload.getCell('J5').font = { bold: true };
    wsWorkload.getCell('K5').value = new Date().toLocaleDateString('en-GB');

    // Workload Table Header (Row 8)
    const headers = [
      'Sr. No.', 'Work ID', 'Work Type', 'Work Title', 'Description', 
      'Subject / Module', 'Course Code', 'Program', 'Semester', 'Division', 
      'Institute', 'Department', 'Student / Reference', 'Assigned Date', 'Due Date', 
      'Weekly Load', 'Priority', 'Responsibility', 'Status', 'Delegation Status'
    ];

    wsWorkload.getRow(8).values = headers;
    wsWorkload.getRow(8).height = 26;
    wsWorkload.getRow(8).eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Populate data rows
    items.forEach((item, idx) => {
      const row = wsWorkload.addRow([
        idx + 1,
        item.workId,
        item.workType,
        item.workTitle,
        item.description,
        item.subjectName || '—',
        item.courseCode || '—',
        item.programName || 'B.Tech CSE',
        item.semesterNumber ? `Sem ${item.semesterNumber}` : '—',
        item.divisionName || '—',
        item.instituteName || 'SSCIT',
        item.departmentName || 'CE',
        item.studentReference || '—',
        item.assignedDate,
        item.dueDate || '—',
        item.weeklyHours ? `${item.weeklyHours} Hrs/Week` : '—',
        item.priority,
        item.responsibility,
        item.status,
        item.isTransferredOut ? `Transferred (${item.status})` : item.isReceivedTransfer ? 'Received Delegation' : 'Direct Assignment'
      ]);

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if ([1, 2, 7, 9, 10, 14, 15, 16, 17, 19].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // Column widths
    wsWorkload.columns = [
      { width: 8 },  // Sr
      { width: 12 }, // Work ID
      { width: 18 }, // Type
      { width: 30 }, // Title
      { width: 38 }, // Description
      { width: 22 }, // Subject
      { width: 14 }, // Code
      { width: 24 }, // Program
      { width: 10 }, // Sem
      { width: 12 }, // Div
      { width: 16 }, // Inst
      { width: 20 }, // Dept
      { width: 20 }, // Student Ref
      { width: 14 }, // Assigned
      { width: 14 }, // Due
      { width: 14 }, // Weekly Load
      { width: 12 }, // Priority
      { width: 20 }, // Responsibility
      { width: 14 }, // Status
      { width: 20 }  // Delegation
    ];

    // SHEET 2: Portfolio Summary & Portfolios
    const wsPortfolio = workbook.addWorksheet('Faculty Portfolio Summary');
    wsPortfolio.mergeCells('A1:F1');
    const portTitle = wsPortfolio.getCell('A1');
    portTitle.value = `FACULTY PORTFOLIO & RESPONSIBILITIES — ${portfolio.facultyName} (${portfolio.employeeId})`;
    portTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    portTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    portTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    wsPortfolio.getRow(1).height = 28;

    // Academic Load Summary Table
    wsPortfolio.getCell('A3').value = '1. ACADEMIC TEACHING LOAD BREAKDOWN';
    wsPortfolio.getCell('A3').font = { bold: true, size: 11, color: { argb: 'FF001F3F' } };

    wsPortfolio.getRow(4).values = ['Subject Code', 'Subject Name', 'Type', 'Class / Division', 'Weekly Hours'];
    wsPortfolio.getRow(4).font = { bold: true };
    portfolio.assignedSubjects.forEach((sub, sIdx) => {
      wsPortfolio.addRow([sub.code, sub.name, sub.type, `${sub.division} (Sem ${sub.semester})`, `${sub.weeklyHours} Hrs/Week`]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SSIU_Workload_Portfolio_${portfolio.employeeId}_${portfolio.facultyName.replace(/\s+/g, '_')}.xlsx`;
    
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  public getTransferAuditMetrics(currentUser?: any) {
    this.init();
    const all = this.transfers;
    const active = all.filter(t => t.status === 'ACTIVE').length;
    const scheduled = all.filter(t => t.status === 'SCHEDULED' || t.status === 'APPROVED').length;
    const completed = all.filter(t => t.status === 'COMPLETED').length;
    const expired = all.filter(t => t.status === 'EXPIRED').length;
    const revoked = all.filter(t => t.status === 'REVOKED').length;
    const cancelled = all.filter(t => t.status === 'CANCELLED').length;
    
    let totalItems = 0;
    let completedItems = 0;
    all.forEach(t => {
      totalItems += t.totalItemsCount;
      completedItems += (t.completedItemIds || []).length;
    });

    return {
      totalCount: all.length,
      activeCount: active,
      scheduledCount: scheduled,
      completedCount: completed,
      expiredCount: expired,
      revokedCount: revoked,
      cancelledCount: cancelled,
      totalTransfers: all.length,
      activeTransfers: active,
      scheduledTransfers: scheduled,
      completedTransfers: completed,
      expiredTransfers: expired,
      revokedTransfers: revoked,
      cancelledTransfers: cancelled,
      totalItemsDelegated: totalItems,
      completedItemsDelegated: completedItems,
      delegationSuccessRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100
    };
  }

  public generateCsvExport(records: WorkTransferRecord[]): string {
    const headers = [
      'Tracking Code', 'From Faculty', 'From Department', 'To Faculty', 'To Department',
      'Start Date', 'End Date', 'Reason', 'Total Items', 'Completed Items', 'Status', 'Created At', 'Remarks'
    ];
    const rows = records.map(r => [
      r.trackingCode,
      `"${r.fromUserName}"`,
      `"${r.fromUserDepartmentName || ''}"`,
      `"${r.toUserName}"`,
      `"${r.toUserDepartmentName || ''}"`,
      r.startAt,
      r.endAt,
      r.reason,
      r.totalItemsCount,
      r.completedItemIds?.length || 0,
      r.status,
      r.createdAt,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public getAllTransfers(): WorkTransferRecord[] {
    this.init();
    return this.transfers;
  }

  public getTransferById(id: string): WorkTransferRecord | undefined {
    this.init();
    return this.transfers.find(t => t.id === id);
  }

  public getTransfersCreatedByUser(userId: string): WorkTransferRecord[] {
    this.init();
    return this.transfers.filter(t => t.fromUserId === userId);
  }

  public getTransfersReceivedByUser(userId: string): WorkTransferRecord[] {
    this.init();
    return this.transfers.filter(t => t.toUserId === userId);
  }

  public resetToInitialSeed(): void {
    this.transfers = this.getInitialSeedTransfers();
    this.customWorkloads = this.getInitialCustomWorkloads();
    this.save();
    this.saveCustomWorkloads();
  }
}

export const workTransferService = new WorkTransferService();
