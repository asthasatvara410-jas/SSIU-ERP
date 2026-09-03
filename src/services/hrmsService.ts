import { db } from './db';
import { assetManagementService } from './assetManagementService';
import { 
  Employee, EmployeeType, EmploymentType, EmployeeStatus, LeaveType, AttendanceMark,
  EmployeeAttendanceRecord, AttendanceCorrectionRequest, EmployeeLeaveBalance,
  EmployeeLeaveApplication, SalaryStructure, PayrollRecord, EmployeeDocumentItem,
  PerformanceAppraisal, TrainingFdpRecord, JobVacancy, JobApplication, PromotionRecord,
  SalaryIncrementRecord, EmployeeTransferRecord, WorkloadTransferRecord,
  EmployeeSeparationRecord, EmployeeSelfServiceRequest, HRAuditLogItem, User
} from '../types';

export interface BulkEmployeeImportRow {
  name: string;
  email: string;
  phone: string;
  designation: string;
  employeeType: string;
  employmentType?: string;
  instituteId: string;
  departmentId: string;
  joiningDate: string;
  salary: number | string;
  panNo: string;
  aadhaarNo: string;
  qualification: string;
  experienceYears?: number | string;
  bankAccountNo?: string;
}

export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: { row: number; field: string; message: string; data?: any }[];
  importedIds: string[];
}

export class HRMSService {
  private static instance: HRMSService;

  private constructor() {}

  public static getInstance(): HRMSService {
    if (!HRMSService.instance) {
      HRMSService.instance = new HRMSService();
    }
    return HRMSService.instance;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. UNIQUE IDENTIFIER GENERATORS
  // ══════════════════════════════════════════════════════════════════════════════
  public generateEmployeeId(): string {
    const employees = db.getEmployees();
    const count = employees.length + 1;
    const year = new Date().getFullYear();
    return `EMP-${year}-${count.toString().padStart(5, '0')}`;
  }

  public generatePayrollNumber(month: string, year: number): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PAY-${year}-${month.slice(0, 3).toUpperCase()}-${random}`;
  }

  public generateRequestNumber(prefix: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${year}-${random}`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. EMPLOYEE MASTER & ONBOARDING
  // ══════════════════════════════════════════════════════════════════════════════
  public getEmployees(filter?: {
    instituteId?: string;
    departmentId?: string;
    employeeType?: string;
    employmentType?: string;
    status?: string;
    searchQuery?: string;
  }): Employee[] {
    let list = db.getEmployees();

    if (filter) {
      if (filter.instituteId && filter.instituteId !== 'ALL') {
        list = list.filter(e => e.instituteId === filter.instituteId);
      }
      if (filter.departmentId && filter.departmentId !== 'ALL') {
        list = list.filter(e => e.departmentId === filter.departmentId);
      }
      if (filter.employeeType && filter.employeeType !== 'ALL') {
        list = list.filter(e => e.employeeType === filter.employeeType);
      }
      if (filter.employmentType && filter.employmentType !== 'ALL') {
        list = list.filter(e => e.employmentType === filter.employmentType);
      }
      if (filter.status && filter.status !== 'ALL') {
        list = list.filter(e => e.status === filter.status);
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        list = list.filter(e => 
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          (e.departmentName && e.departmentName.toLowerCase().includes(q))
        );
      }
    }

    return list;
  }

  public getEmployeeById(id: string): Employee | undefined {
    return db.getEmployees().find(e => e.id === id || e.employeeId === id || e.userId === id);
  }

  public checkDuplicates(payload: { email: string; phone: string; panNo?: string; aadhaarNo?: string; excludeId?: string }) {
    const existing = db.getEmployees().filter(e => e.id !== payload.excludeId);
    
    const emailDup = existing.find(e => e.email.trim().toLowerCase() === payload.email.trim().toLowerCase());
    if (emailDup) return { hasDuplicate: true, field: 'email', message: `Email '${payload.email}' is already registered with ${emailDup.name} (${emailDup.employeeId}).` };

    const phoneDup = existing.find(e => e.phone.trim() === payload.phone.trim());
    if (phoneDup) return { hasDuplicate: true, field: 'phone', message: `Phone '${payload.phone}' is already registered with ${phoneDup.name} (${phoneDup.employeeId}).` };

    if (payload.panNo && payload.panNo.trim()) {
      const panDup = existing.find(e => e.panNo && e.panNo.trim().toUpperCase() === payload.panNo!.trim().toUpperCase());
      if (panDup) return { hasDuplicate: true, field: 'panNo', message: `PAN '${payload.panNo}' is already registered with ${panDup.name} (${panDup.employeeId}).` };
    }

    if (payload.aadhaarNo && payload.aadhaarNo.trim()) {
      const aadhaarDup = existing.find(e => e.aadhaarNo && e.aadhaarNo.trim() === payload.aadhaarNo!.trim());
      if (aadhaarDup) return { hasDuplicate: true, field: 'aadhaarNo', message: `Aadhaar '${payload.aadhaarNo}' is already registered with ${aadhaarDup.name} (${aadhaarDup.employeeId}).` };
    }

    return { hasDuplicate: false };
  }

  public onboardEmployee(
    payload: Omit<Employee, 'id' | 'employeeId' | 'status'> & { customEmployeeId?: string; password?: string; activateLogin?: boolean },
    actor: User
  ): { success: boolean; employee?: Employee; userAccount?: User; message: string } {
    // 1. Duplicate Validation
    const dupCheck = this.checkDuplicates({
      email: payload.email,
      phone: payload.phone,
      panNo: payload.panNo,
      aadhaarNo: payload.aadhaarNo
    });

    if (dupCheck.hasDuplicate) {
      return { success: false, message: dupCheck.message || 'Duplicate employee information detected.' };
    }

    // 2. Resolve Names
    const institute = db.getInstitutes().find(i => i.id === payload.instituteId);
    const department = db.getDepartments().find(d => d.id === payload.departmentId);

    const employeeId = payload.customEmployeeId?.trim() || this.generateEmployeeId();
    const id = `emp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newEmployee: Employee = {
      ...payload,
      id,
      employeeId,
      employeeCode: employeeId,
      instituteName: institute?.name || payload.instituteName || 'SSIU Main Campus',
      departmentName: department?.name || payload.departmentName || 'General Administration',
      status: 'ACTIVE',
      employmentType: payload.employmentType || 'PERMANENT',
      basicSalary: payload.basicSalary || Math.round(Number(payload.salary) * 0.5),
      hra: payload.hra || Math.round(Number(payload.salary) * 0.2),
      da: payload.da || Math.round(Number(payload.salary) * 0.15),
      specialAllowance: payload.specialAllowance || Math.round(Number(payload.salary) * 0.15),
      loginActivated: payload.activateLogin !== false,
      assignedAssetIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Persist Employee Master
    db.addEntity('employees', newEmployee as any, `Onboarded employee ${newEmployee.name} (${newEmployee.employeeId})`);

    // 4. Auto-Create / Link User Account
    let userAccount: User | undefined = undefined;
    if (payload.activateLogin !== false) {
      const username = payload.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const userRole = payload.employeeType === 'FACULTY' ? 'FACULTY' : 'UNIVERSITY_ADMIN';
      
      const existingUser = db.getUsers().find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (existingUser) {
        newEmployee.userId = existingUser.id;
        newEmployee.username = existingUser.username || existingUser.email;
        userAccount = existingUser;
      } else {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: newEmployee.name,
          email: newEmployee.email,
          username: username,
          password: payload.password || 'Employee@123',
          role: userRole as any,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          phone: newEmployee.phone,
          departmentId: newEmployee.departmentId,
          departmentName: newEmployee.departmentName,
          instituteId: newEmployee.instituteId,
        };
        db.addEntity('users', newUser as any, `Created login credentials for employee ${newEmployee.name}`);
        newEmployee.userId = newUser.id;
        newEmployee.username = newUser.username;
        userAccount = newUser;
      }
      db.updateEntity('employees', newEmployee.id, newEmployee, `Updated employee ${newEmployee.employeeId} with user account`);
    }

    // 5. Initialize Leave Balances
    this.initializeEmployeeLeaveBalances(newEmployee.id);

    // 6. Log Audit
    this.logHRAudit({
      actionType: 'ONBOARD_EMPLOYEE',
      entityId: newEmployee.id,
      entityName: newEmployee.name,
      details: `Onboarded new ${newEmployee.employeeType} (${newEmployee.designation}) in ${newEmployee.departmentName}.`,
      actor
    });

    return {
      success: true,
      employee: newEmployee,
      userAccount,
      message: `Employee ${newEmployee.name} (${newEmployee.employeeId}) onboarded successfully.`
    };
  }

  public updateEmployee(
    id: string,
    payload: Partial<Employee>,
    actor: User
  ): { success: boolean; employee?: Employee; message: string } {
    const employees = db.getEmployees();
    const existing = employees.find(e => e.id === id);
    if (!existing) return { success: false, message: 'Employee not found.' };

    if (payload.email || payload.phone || payload.panNo || payload.aadhaarNo) {
      const dupCheck = this.checkDuplicates({
        email: payload.email || existing.email,
        phone: payload.phone || existing.phone,
        panNo: payload.panNo || existing.panNo,
        aadhaarNo: payload.aadhaarNo || existing.aadhaarNo,
        excludeId: id
      });
      if (dupCheck.hasDuplicate) {
        return { success: false, message: dupCheck.message || 'Duplicate conflict detected.' };
      }
    }

    const updated: Employee = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString()
    };

    db.updateEntity('employees', existing.id, updated, `Updated employee profile ${updated.employeeId}`);

    this.logHRAudit({
      actionType: 'UPDATE_EMPLOYEE',
      entityId: updated.id,
      entityName: updated.name,
      details: `Updated employee details for ${updated.name} (${updated.employeeId})`,
      previousValue: existing,
      newValue: updated,
      actor
    });

    return { success: true, employee: updated, message: 'Employee profile updated successfully.' };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. ATTENDANCE & BIOMETRIC ENGINE
  // ══════════════════════════════════════════════════════════════════════════════
  public getAttendanceRecords(filter?: { employeeId?: string; departmentId?: string; date?: string; month?: string }): EmployeeAttendanceRecord[] {
    let records = (db as any).state?.employeeAttendanceRecords || [];
    if (filter) {
      if (filter.employeeId) records = records.filter((r: EmployeeAttendanceRecord) => r.employeeId === filter.employeeId);
      if (filter.departmentId && filter.departmentId !== 'ALL') records = records.filter((r: EmployeeAttendanceRecord) => r.departmentId === filter.departmentId);
      if (filter.date) records = records.filter((r: EmployeeAttendanceRecord) => r.date === filter.date);
    }
    return records;
  }

  public recordDailyAttendance(
    payload: {
      employeeId: string;
      date: string;
      status: AttendanceMark;
      inTime?: string;
      outTime?: string;
      remarks?: string;
      source?: 'MANUAL' | 'BIOMETRIC' | 'BULK_IMPORT' | 'CORRECTION' | 'WEB';
    },
    actor: User
  ): { success: boolean; record?: EmployeeAttendanceRecord; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const records = (db as any).state?.employeeAttendanceRecords || [];
    const existingIdx = records.findIndex((r: EmployeeAttendanceRecord) => r.employeeId === payload.employeeId && r.date === payload.date);

    const inTime = payload.inTime || '09:00';
    const outTime = payload.outTime || (payload.status === 'HALF_DAY' ? '13:00' : '17:00');
    
    // Check if late (e.g. after 09:15 AM)
    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const isLate = (inHours > 9 || (inHours === 9 && inMinutes > 15)) && payload.status === 'PRESENT';
    const lateMinutes = isLate ? Math.max(0, (inHours - 9) * 60 + inMinutes - 15) : 0;

    const record: EmployeeAttendanceRecord = {
      id: existingIdx >= 0 ? records[existingIdx].id : `att-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employeeId,
      departmentId: employee.departmentId,
      departmentName: employee.departmentName,
      date: payload.date,
      inTime,
      outTime,
      status: isLate ? 'LATE' : payload.status,
      workHours: payload.status === 'HALF_DAY' ? 4 : (payload.status === 'PRESENT' || payload.status === 'LATE' || payload.status === 'WORK_FROM_HOME' || payload.status === 'ON_DUTY') ? 8 : 0,
      isLate,
      lateMinutes,
      isEarlyExit: false,
      source: payload.source || 'MANUAL',
      remarks: payload.remarks || '',
      verifiedBy: actor.name
    };

    if (existingIdx >= 0) {
      records[existingIdx] = record;
    } else {
      records.unshift(record);
    }

    if (!(db as any).state.employeeAttendanceRecords) (db as any).state.employeeAttendanceRecords = [];
    (db as any).state.employeeAttendanceRecords = records;
    db.saveState();

    this.logHRAudit({
      actionType: 'RECORD_ATTENDANCE',
      entityId: employee.id,
      entityName: employee.name,
      details: `Marked attendance ${record.status} for ${employee.name} on ${record.date}.`,
      actor
    });

    return { success: true, record, message: `Attendance marked ${record.status} for ${employee.name}.` };
  }

  public getAttendanceCorrectionRequests(employeeId?: string): AttendanceCorrectionRequest[] {
    let list = (db as any).state?.attendanceCorrectionRequests || [];
    if (employeeId) list = list.filter((r: AttendanceCorrectionRequest) => r.employeeId === employeeId);
    return list;
  }

  public submitAttendanceCorrection(
    payload: {
      employeeId: string;
      date: string;
      currentStatus: AttendanceMark;
      requestedStatus: AttendanceMark;
      requestedInTime?: string;
      requestedOutTime?: string;
      reason: string;
    },
    actor: User
  ): { success: boolean; request?: AttendanceCorrectionRequest; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const requestNo = this.generateRequestNumber('ATT-CORR');
    const newReq: AttendanceCorrectionRequest = {
      id: `att-corr-${Date.now()}`,
      requestNo,
      employeeId: employee.id,
      employeeName: employee.name,
      departmentId: employee.departmentId,
      date: payload.date,
      currentStatus: payload.currentStatus,
      requestedStatus: payload.requestedStatus,
      requestedInTime: payload.requestedInTime || '09:00',
      requestedOutTime: payload.requestedOutTime || '17:00',
      reason: payload.reason,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };

    if (!(db as any).state.attendanceCorrectionRequests) (db as any).state.attendanceCorrectionRequests = [];
    (db as any).state.attendanceCorrectionRequests.unshift(newReq);
    db.saveState();

    return { success: true, request: newReq, message: `Correction request ${requestNo} submitted for review.` };
  }

  public reviewAttendanceCorrection(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewRemarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const list = (db as any).state?.attendanceCorrectionRequests || [];
    const req = list.find((r: AttendanceCorrectionRequest) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    req.status = status;
    req.reviewedBy = actor.name;
    req.reviewedAt = new Date().toISOString();
    req.reviewRemarks = reviewRemarks;

    if (status === 'APPROVED') {
      // Auto-update attendance record
      this.recordDailyAttendance({
        employeeId: req.employeeId,
        date: req.date,
        status: req.requestedStatus,
        inTime: req.requestedInTime,
        outTime: req.requestedOutTime,
        remarks: `Approved correction: ${req.reason}`,
        source: 'CORRECTION'
      }, actor);
    }

    db.saveState();
    return { success: true, message: `Attendance correction ${req.requestNo} ${status.toLowerCase()} successfully.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. LEAVE MANAGEMENT ENGINE
  // ══════════════════════════════════════════════════════════════════════════════
  public initializeEmployeeLeaveBalances(employeeId: string) {
    const year = new Date().getFullYear().toString();
    const defaultTypes: { type: LeaveType; quota: number }[] = [
      { type: 'CASUAL', quota: 12 },
      { type: 'SICK', quota: 10 },
      { type: 'EARNED', quota: 15 },
      { type: 'DUTY_LEAVE', quota: 10 },
      { type: 'SPECIAL_LEAVE', quota: 5 },
    ];

    if (!(db as any).state.employeeLeaveBalances) (db as any).state.employeeLeaveBalances = [];
    
    defaultTypes.forEach(d => {
      const exists = (db as any).state.employeeLeaveBalances.some(
        (b: EmployeeLeaveBalance) => b.employeeId === employeeId && b.leaveType === d.type && b.academicYear === year
      );
      if (!exists) {
        (db as any).state.employeeLeaveBalances.push({
          id: `bal-${employeeId}-${d.type}-${year}`,
          employeeId,
          academicYear: year,
          leaveType: d.type,
          openingBalance: d.quota,
          used: 0,
          pending: 0,
          remaining: d.quota
        });
      }
    });
    db.saveState();
  }

  public getLeaveBalances(employeeId: string): EmployeeLeaveBalance[] {
    const balances = (db as any).state?.employeeLeaveBalances || [];
    const empBalances = balances.filter((b: EmployeeLeaveBalance) => b.employeeId === employeeId);
    if (empBalances.length === 0) {
      this.initializeEmployeeLeaveBalances(employeeId);
      return ((db as any).state?.employeeLeaveBalances || []).filter((b: EmployeeLeaveBalance) => b.employeeId === employeeId);
    }
    return empBalances;
  }

  public applyLeave(
    payload: {
      employeeId: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      totalDays?: number;
      reason: string;
      documentUrl?: string;
    },
    actor: User
  ): { success: boolean; application?: EmployeeLeaveApplication; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const totalDays = payload.totalDays || Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const balances = this.getLeaveBalances(employee.id);
    const typeBal = balances.find(b => b.leaveType === payload.leaveType);

    if (typeBal && typeBal.remaining < totalDays && payload.leaveType !== 'UNPAID') {
      return {
        success: false,
        message: `Insufficient ${payload.leaveType} leave balance. Available: ${typeBal.remaining} day(s), Requested: ${totalDays} day(s).`
      };
    }

    const applicationNo = this.generateRequestNumber('LV-APP');
    const newLeave: EmployeeLeaveApplication = {
      id: `lv-${Date.now()}`,
      applicationNo,
      employeeId: employee.id,
      employeeName: employee.name,
      departmentId: employee.departmentId,
      departmentName: employee.departmentName,
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalDays,
      reason: payload.reason,
      documentUrl: payload.documentUrl,
      status: 'SUBMITTED',
      managerApproval: 'PENDING',
      hodApproval: 'PENDING',
      hrApproval: 'PENDING',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    if (!(db as any).state.leaveApplications) (db as any).state.leaveApplications = [];
    (db as any).state.leaveApplications.unshift(newLeave);

    // Increment pending leave days in balance
    if (typeBal) {
      typeBal.pending += totalDays;
      typeBal.remaining = Math.max(0, typeBal.openingBalance - typeBal.used - typeBal.pending);
    }
    db.saveState();

    this.logHRAudit({
      actionType: 'APPROVE_LEAVE',
      entityId: employee.id,
      entityName: employee.name,
      details: `Submitted ${totalDays} day(s) of ${payload.leaveType} leave from ${payload.startDate} to ${payload.endDate}.`,
      actor
    });

    return { success: true, application: newLeave, message: `Leave application ${applicationNo} submitted successfully.` };
  }

  public reviewLeaveApplication(
    leaveId: string,
    approvalRole: 'MANAGER' | 'HOD' | 'HR',
    status: 'APPROVED' | 'REJECTED',
    remarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const list = db.getEmployeeLeaveApplications();
    const app = list.find(l => l.id === leaveId);
    if (!app) return { success: false, message: 'Leave application not found.' };

    if (approvalRole === 'MANAGER') {
      app.managerApproval = status;
      app.managerRemarks = remarks;
    } else if (approvalRole === 'HOD') {
      app.hodApproval = status;
      app.hodRemarks = remarks;
    } else if (approvalRole === 'HR') {
      app.hrApproval = status;
      app.hrRemarks = remarks;
    }

    if (status === 'REJECTED') {
      app.status = 'REJECTED';
      // Release pending days
      const balances = this.getLeaveBalances(app.employeeId);
      const bal = balances.find(b => b.leaveType === app.leaveType);
      if (bal) {
        bal.pending = Math.max(0, bal.pending - app.totalDays);
        bal.remaining = Math.max(0, bal.openingBalance - bal.used - bal.pending);
      }
    } else if (approvalRole === 'HR' && status === 'APPROVED') {
      app.status = 'APPROVED';
      app.approvedByUserId = actor.id;
      app.approvedByUserName = actor.name;
      app.approvedDate = new Date().toISOString();

      // Deduct from used & clear pending
      const balances = this.getLeaveBalances(app.employeeId);
      const bal = balances.find(b => b.leaveType === app.leaveType);
      if (bal) {
        bal.pending = Math.max(0, bal.pending - app.totalDays);
        bal.used += app.totalDays;
        bal.remaining = Math.max(0, bal.openingBalance - bal.used - bal.pending);
      }
    }

    db.saveState();
    return { success: true, message: `Leave application ${app.applicationNo || app.id} marked ${status} by ${approvalRole}.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. PAYROLL & SALARY ARCHITECTURE
  // ══════════════════════════════════════════════════════════════════════════════
  public calculateMonthlyPayroll(
    month: string, // e.g. "August 2026"
    year: number,
    workingDays: number = 26,
    actor: User
  ): { success: boolean; payrolls: PayrollRecord[]; message: string } {
    const employees = db.getEmployees().filter(e => e.status === 'ACTIVE');
    const generated: PayrollRecord[] = [];

    employees.forEach(emp => {
      const basicPay = emp.basicSalary || Math.round(emp.salary * 0.5);
      const hra = emp.hra || Math.round(emp.salary * 0.2);
      const da = emp.da || Math.round(emp.salary * 0.15);
      const specialAllowance = emp.specialAllowance || Math.round(emp.salary * 0.15);
      const grossSalary = basicPay + hra + da + specialAllowance;

      // Statutory deductions
      const pfDeduction = Math.round(basicPay * 0.12);
      const professionalTax = 200;
      const taxDeduction = grossSalary > 50000 ? Math.round(grossSalary * 0.05) : 0;
      const totalDeductions = pfDeduction + professionalTax + taxDeduction;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const payrollNumber = this.generatePayrollNumber(month, year);
      const record: PayrollRecord = {
        id: `pay-${emp.id}-${year}-${month.slice(0, 3)}`,
        payrollNumber,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeId,
        designation: emp.designation,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
        month,
        year,
        workingDays,
        presentDays: workingDays,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        basicPay,
        hra,
        da,
        specialAllowance,
        grossSalary,
        pfDeduction,
        professionalTax,
        taxDeduction,
        totalDeductions,
        netSalary,
        bankName: emp.bankName || 'State Bank of India',
        bankAccountNo: emp.bankAccountNo,
        status: 'CALCULATED',
        processedBy: actor.name,
        processedAt: new Date().toISOString(),
        payslipGenerated: true
      };

      generated.push(record);
    });

    if (!(db as any).state.payrollRecords) (db as any).state.payrollRecords = [];
    
    // Replace or merge for the current month
    const nonMonth = (db as any).state.payrollRecords.filter((p: PayrollRecord) => !(p.month === month && p.year === year));
    (db as any).state.payrollRecords = [...nonMonth, ...generated];
    db.saveState();

    this.logHRAudit({
      actionType: 'PROCESS_PAYROLL',
      entityId: `${month}-${year}`,
      entityName: `Payroll ${month} ${year}`,
      details: `Processed payroll calculation for ${generated.length} employees for ${month} ${year}. Total Net: ₹${generated.reduce((s, p) => s + p.netSalary, 0).toLocaleString()}`,
      actor
    });

    return {
      success: true,
      payrolls: generated,
      message: `Calculated payroll for ${generated.length} employees for ${month} ${year}.`
    };
  }

  public approveMonthlyPayroll(
    month: string,
    year: number,
    actor: User
  ): { success: boolean; message: string } {
    const list = db.getPayrollRecords();
    let approvedCount = 0;

    list.forEach(p => {
      if (p.month === month && p.year === year && (p.status === 'CALCULATED' || p.status === 'DRAFT' || p.status === 'VERIFIED')) {
        p.status = 'APPROVED';
        p.approvedBy = actor.name;
        p.approvedAt = new Date().toISOString();
        approvedCount++;
      }
    });

    db.saveState();

    this.logHRAudit({
      actionType: 'APPROVE_PAYROLL',
      entityId: `${month}-${year}`,
      entityName: `Payroll ${month} ${year}`,
      details: `Approved payroll batch of ${approvedCount} records for ${month} ${year}.`,
      actor
    });

    return { success: true, message: `Approved payroll for ${approvedCount} employees for ${month} ${year}.` };
  }

  public getEmployeePayslips(employeeId: string): PayrollRecord[] {
    return db.getPayrollRecords().filter(p => p.employeeId === employeeId);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. PROMOTIONS & INCREMENTS
  // ══════════════════════════════════════════════════════════════════════════════
  public getPromotions(employeeId?: string): PromotionRecord[] {
    let list = (db as any).state?.promotionRecords || [];
    if (employeeId) list = list.filter((p: PromotionRecord) => p.employeeId === employeeId);
    return list;
  }

  public proposePromotion(
    payload: {
      employeeId: string;
      proposedDesignation: string;
      proposedSalary: number;
      effectiveDate: string;
      reason: string;
      evaluationScore?: number;
    },
    actor: User
  ): { success: boolean; promotion?: PromotionRecord; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const proposalNo = this.generateRequestNumber('PROM');
    const newPromotion: PromotionRecord = {
      id: `prom-${Date.now()}`,
      proposalNo,
      employeeId: employee.id,
      employeeName: employee.name,
      departmentName: employee.departmentName || '',
      currentDesignation: employee.designation,
      proposedDesignation: payload.proposedDesignation,
      currentSalary: employee.salary,
      proposedSalary: payload.proposedSalary,
      effectiveDate: payload.effectiveDate,
      reason: payload.reason,
      evaluationScore: payload.evaluationScore,
      status: 'PROPOSED',
      approvedBy: undefined,
      approvedAt: undefined
    };

    if (!(db as any).state.promotionRecords) (db as any).state.promotionRecords = [];
    (db as any).state.promotionRecords.unshift(newPromotion);
    db.saveState();

    this.logHRAudit({
      actionType: 'PROCESS_PROMOTION',
      entityId: employee.id,
      entityName: employee.name,
      details: `Proposed promotion for ${employee.name} to ${payload.proposedDesignation} with salary ₹${payload.proposedSalary}.`,
      actor
    });

    return { success: true, promotion: newPromotion, message: `Promotion proposal ${proposalNo} submitted successfully.` };
  }

  public executePromotion(
    promotionId: string,
    status: 'APPROVED' | 'REJECTED',
    remarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const list = (db as any).state?.promotionRecords || [];
    const prom = list.find((p: PromotionRecord) => p.id === promotionId);
    if (!prom) return { success: false, message: 'Promotion proposal not found.' };

    prom.status = status === 'APPROVED' ? 'EXECUTED' : 'REJECTED';
    prom.approvedBy = actor.name;
    prom.approvedAt = new Date().toISOString();
    prom.remarks = remarks;

    if (status === 'APPROVED') {
      const employee = this.getEmployeeById(prom.employeeId);
      if (employee) {
        employee.designation = prom.proposedDesignation;
        employee.salary = prom.proposedSalary;
        employee.basicSalary = Math.round(prom.proposedSalary * 0.5);
        employee.hra = Math.round(prom.proposedSalary * 0.2);
        employee.da = Math.round(prom.proposedSalary * 0.15);
        employee.specialAllowance = Math.round(prom.proposedSalary * 0.15);
        db.updateEntity('employees', employee.id, employee, `Updated designation & salary after promotion`);
      }
    }

    db.saveState();
    return { success: true, message: `Promotion ${prom.proposalNo} ${status.toLowerCase()} and master records updated.` };
  }

  public getSalaryIncrements(employeeId?: string): SalaryIncrementRecord[] {
    let list = (db as any).state?.salaryIncrementRecords || [];
    if (employeeId) list = list.filter((i: SalaryIncrementRecord) => i.employeeId === employeeId);
    return list;
  }

  public processSalaryIncrement(
    payload: {
      employeeId: string;
      incrementType: 'PERCENTAGE' | 'FLAT_AMOUNT';
      incrementValue: number;
      effectiveDate: string;
      reason: string;
    },
    actor: User
  ): { success: boolean; increment?: SalaryIncrementRecord; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const incrementAmount = payload.incrementType === 'PERCENTAGE' 
      ? Math.round(employee.salary * (payload.incrementValue / 100))
      : payload.incrementValue;
    
    const newSalary = employee.salary + incrementAmount;
    const incrementNo = this.generateRequestNumber('INCR');

    const record: SalaryIncrementRecord = {
      id: `incr-${Date.now()}`,
      incrementNo,
      employeeId: employee.id,
      employeeName: employee.name,
      departmentName: employee.departmentName || '',
      currentSalary: employee.salary,
      incrementType: payload.incrementType,
      incrementValue: payload.incrementValue,
      newSalary,
      effectiveDate: payload.effectiveDate,
      reason: payload.reason,
      status: 'EXECUTED',
      approvedBy: actor.name,
      approvedAt: new Date().toISOString()
    };

    if (!(db as any).state.salaryIncrementRecords) (db as any).state.salaryIncrementRecords = [];
    (db as any).state.salaryIncrementRecords.unshift(record);

    // Apply directly to Employee Master
    employee.salary = newSalary;
    employee.basicSalary = Math.round(newSalary * 0.5);
    employee.hra = Math.round(newSalary * 0.2);
    employee.da = Math.round(newSalary * 0.15);
    employee.specialAllowance = Math.round(newSalary * 0.15);
    db.updateEntity('employees', employee.id, employee, `Applied salary increment`);

    this.logHRAudit({
      actionType: 'PROCESS_INCREMENT',
      entityId: employee.id,
      entityName: employee.name,
      details: `Processed ${payload.incrementValue}${payload.incrementType === 'PERCENTAGE' ? '%' : ' INR'} increment for ${employee.name}. New salary: ₹${newSalary}.`,
      actor
    });

    return { success: true, increment: record, message: `Salary increment of ₹${incrementAmount} processed for ${employee.name}.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. EMPLOYEE TRANSFERS & WORKLOAD DELEGATION
  // ══════════════════════════════════════════════════════════════════════════════
  public getTransfers(employeeId?: string): EmployeeTransferRecord[] {
    let list = (db as any).state?.employeeTransferRecords || [];
    if (employeeId) list = list.filter((t: EmployeeTransferRecord) => t.employeeId === employeeId);
    return list;
  }

  public transferEmployee(
    payload: {
      employeeId: string;
      toInstituteId: string;
      toDepartmentId: string;
      toDesignation?: string;
      transferType: 'DEPARTMENT' | 'INSTITUTE' | 'ROLE' | 'LOCATION';
      effectiveDate: string;
      reason: string;
    },
    actor: User
  ): { success: boolean; transfer?: EmployeeTransferRecord; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const toInst = db.getInstitutes().find(i => i.id === payload.toInstituteId);
    const toDept = db.getDepartments().find(d => d.id === payload.toDepartmentId);

    const transferNo = this.generateRequestNumber('TRNS');
    const record: EmployeeTransferRecord = {
      id: `trns-${Date.now()}`,
      transferNo,
      employeeId: employee.id,
      employeeName: employee.name,
      fromInstituteId: employee.instituteId,
      fromInstituteName: employee.instituteName || '',
      fromDepartmentId: employee.departmentId,
      fromDepartmentName: employee.departmentName || '',
      fromDesignation: employee.designation,
      toInstituteId: payload.toInstituteId,
      toInstituteName: toInst?.name || 'SSIU Main Campus',
      toDepartmentId: payload.toDepartmentId,
      toDepartmentName: toDept?.name || 'General Administration',
      toDesignation: payload.toDesignation || employee.designation,
      transferType: payload.transferType,
      effectiveDate: payload.effectiveDate,
      reason: payload.reason,
      status: 'COMPLETED',
      approvedBy: actor.name,
      approvedAt: new Date().toISOString()
    };

    if (!(db as any).state.employeeTransferRecords) (db as any).state.employeeTransferRecords = [];
    (db as any).state.employeeTransferRecords.unshift(record);

    // Update Master
    employee.instituteId = payload.toInstituteId;
    employee.instituteName = record.toInstituteName;
    employee.departmentId = payload.toDepartmentId;
    employee.departmentName = record.toDepartmentName;
    if (payload.toDesignation) employee.designation = payload.toDesignation;
    db.updateEntity('employees', employee.id, employee, `Updated employee department via transfer ${transferNo}`);

    this.logHRAudit({
      actionType: 'TRANSFER_EMPLOYEE',
      entityId: employee.id,
      entityName: employee.name,
      details: `Transferred ${employee.name} from ${record.fromDepartmentName} to ${record.toDepartmentName}.`,
      actor
    });

    return { success: true, transfer: record, message: `Employee transferred to ${record.toDepartmentName} successfully.` };
  }

  public getWorkloadTransfers(employeeId?: string): WorkloadTransferRecord[] {
    let list = (db as any).state?.workloadTransferRecords || [];
    if (employeeId) list = list.filter((w: WorkloadTransferRecord) => w.fromEmployeeId === employeeId || w.toEmployeeId === employeeId);
    return list;
  }

  public transferWorkload(
    payload: {
      fromEmployeeId: string;
      toEmployeeId: string;
      workloadType: 'TEACHING_SUBJECT' | 'LAB_SESSION' | 'ADMIN_RESPONSIBILITY' | 'COMMITTEE_DUTY';
      subjectOrDutyName: string;
      startDate: string;
      endDate: string;
      reason: 'ON_LEAVE' | 'VACATION' | 'OFFICIAL_DUTY' | 'MEDICAL' | 'OTHER';
    },
    actor: User
  ): { success: boolean; record?: WorkloadTransferRecord; message: string } {
    const fromEmp = this.getEmployeeById(payload.fromEmployeeId);
    const toEmp = this.getEmployeeById(payload.toEmployeeId);
    if (!fromEmp || !toEmp) return { success: false, message: 'Source or target employee not found.' };

    const transferNo = this.generateRequestNumber('WLD-TRNS');
    const record: WorkloadTransferRecord = {
      id: `wld-${Date.now()}`,
      transferNo,
      fromEmployeeId: fromEmp.id,
      fromEmployeeName: fromEmp.name,
      toEmployeeId: toEmp.id,
      toEmployeeName: toEmp.name,
      workloadType: payload.workloadType,
      subjectOrDutyName: payload.subjectOrDutyName,
      departmentName: fromEmp.departmentName || '',
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      status: 'ACTIVE',
      approvedBy: actor.name,
      approvedAt: new Date().toISOString()
    };

    if (!(db as any).state.workloadTransferRecords) (db as any).state.workloadTransferRecords = [];
    (db as any).state.workloadTransferRecords.unshift(record);
    db.saveState();

    this.logHRAudit({
      actionType: 'TRANSFER_WORKLOAD',
      entityId: fromEmp.id,
      entityName: fromEmp.name,
      details: `Delegated ${payload.subjectOrDutyName} from ${fromEmp.name} to ${toEmp.name} until ${payload.endDate}.`,
      actor
    });

    return { success: true, record, message: `Workload delegated to ${toEmp.name} successfully.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. ASSET ASSIGNMENT INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════════
  public assignAssetToEmployee(
    payload: {
      employeeId: string;
      assetMasterId: string;
      remarks?: string;
    },
    actor: User
  ): { success: boolean; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    // Use Asset Management Service
    const allocResult = assetManagementService.allocateAssetToPerson({
      assetMasterId: payload.assetMasterId,
      assignedPersonId: employee.id,
      assignedPersonName: employee.name,
      assignedPersonType: employee.employeeType === 'FACULTY' ? 'FACULTY' : 'STAFF',
      effectiveFrom: new Date().toISOString().split('T')[0],
      remarks: payload.remarks || 'Assigned via HRMS Asset Desk'
    }, actor);

    if (!allocResult.success) return allocResult;

    if (!employee.assignedAssetIds) employee.assignedAssetIds = [];
    if (!employee.assignedAssetIds.includes(payload.assetMasterId)) {
      employee.assignedAssetIds.push(payload.assetMasterId);
    }
    db.updateEntity('employees', employee.id, employee, `Assigned asset to employee`);

    this.logHRAudit({
      actionType: 'ASSIGN_ASSET',
      entityId: employee.id,
      entityName: employee.name,
      details: `Assigned hardware asset (ID: ${payload.assetMasterId}) to ${employee.name}.`,
      actor
    });

    return { success: true, message: `Asset assigned to ${employee.name} successfully.` };
  }

  public getEmployeeAssets(employeeId: string) {
    const employee = this.getEmployeeById(employeeId);
    if (!employee) return [];
    return assetManagementService.getPersonAssets(employee.id);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. SEPARATION & EXIT WORKFLOW
  // ══════════════════════════════════════════════════════════════════════════════
  public getSeparations(employeeId?: string): EmployeeSeparationRecord[] {
    let list = (db as any).state?.employeeSeparationRecords || [];
    if (employeeId) list = list.filter((s: EmployeeSeparationRecord) => s.employeeId === employeeId);
    return list;
  }

  public initiateSeparation(
    payload: {
      employeeId: string;
      separationType: 'RESIGNATION' | 'RETIREMENT' | 'TERMINATION' | 'CONTRACT_END' | 'TRANSFERRED_OUT' | 'OTHER';
      resignationDate: string;
      noticePeriodDays: number;
      lastWorkingDay: string;
      reason: string;
    },
    actor: User
  ): { success: boolean; separation?: EmployeeSeparationRecord; message: string } {
    const employee = this.getEmployeeById(payload.employeeId);
    if (!employee) return { success: false, message: 'Employee not found.' };

    const separationNo = this.generateRequestNumber('SEP');
    const record: EmployeeSeparationRecord = {
      id: `sep-${Date.now()}`,
      separationNo,
      employeeId: employee.id,
      employeeName: employee.name,
      designation: employee.designation,
      departmentName: employee.departmentName || '',
      separationType: payload.separationType,
      resignationDate: payload.resignationDate,
      noticePeriodDays: payload.noticePeriodDays,
      lastWorkingDay: payload.lastWorkingDay,
      reason: payload.reason,
      status: 'SUBMITTED',
      departmentClearance: false,
      libraryClearance: false,
      assetClearance: false,
      itClearance: false,
      financeClearance: false,
      hrClearance: false,
    };

    if (!(db as any).state.employeeSeparationRecords) (db as any).state.employeeSeparationRecords = [];
    (db as any).state.employeeSeparationRecords.unshift(record);
    db.saveState();

    this.logHRAudit({
      actionType: 'INITIATE_SEPARATION',
      entityId: employee.id,
      entityName: employee.name,
      details: `Initiated separation (${payload.separationType}) for ${employee.name}. Last working day: ${payload.lastWorkingDay}.`,
      actor
    });

    return { success: true, separation: record, message: `Separation request ${separationNo} registered.` };
  }

  public updateSeparationClearance(
    separationId: string,
    clearanceType: 'DEPARTMENT' | 'LIBRARY' | 'ASSET' | 'IT' | 'FINANCE' | 'HR',
    cleared: boolean,
    remarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const list = (db as any).state?.employeeSeparationRecords || [];
    const sep = list.find((s: EmployeeSeparationRecord) => s.id === separationId);
    if (!sep) return { success: false, message: 'Separation record not found.' };

    if (clearanceType === 'DEPARTMENT') sep.departmentClearance = cleared;
    if (clearanceType === 'LIBRARY') sep.libraryClearance = cleared;
    if (clearanceType === 'ASSET') sep.assetClearance = cleared;
    if (clearanceType === 'IT') sep.itClearance = cleared;
    if (clearanceType === 'FINANCE') sep.financeClearance = cleared;
    if (clearanceType === 'HR') sep.hrClearance = cleared;

    const allCleared = sep.departmentClearance && sep.libraryClearance && sep.assetClearance && sep.itClearance && sep.financeClearance && sep.hrClearance;
    if (allCleared) {
      sep.status = 'RELIEVED';
      sep.settledDate = new Date().toISOString();
      sep.clearedBy = actor.name;

      // Deactivate Employee status without deleting history
      const employee = this.getEmployeeById(sep.employeeId);
      if (employee) {
        employee.status = 'RELIEVED';
        employee.loginActivated = false;
        db.updateEntity('employees', employee.id, employee, `Deactivated employee after exit clearance`);
      }
    } else {
      sep.status = 'CLEARANCE_IN_PROGRESS';
    }

    db.saveState();
    return { success: true, message: `Updated ${clearanceType} clearance for ${sep.employeeName}.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. RECRUITMENT & APPLICANT TRACKING
  // ══════════════════════════════════════════════════════════════════════════════
  public getVacancies(): JobVacancy[] {
    if (!(db as any).state?.jobVacancies || (db as any).state.jobVacancies.length === 0) {
      const defaultVacancies: JobVacancy[] = [
        {
          id: 'vac-1',
          vacancyCode: 'VAC-2026-001',
          positionTitle: 'Professor & Head - Artificial Intelligence',
          instituteId: 'inst-1',
          instituteName: 'SSIT - Institute of Technology',
          departmentId: 'dept-1',
          departmentName: 'Computer Engineering',
          designation: 'Professor',
          employeeType: 'FACULTY',
          employmentType: 'PERMANENT',
          vacanciesCount: 2,
          requiredQualification: 'Ph.D in AI / Machine Learning with min 10 yrs exp',
          minExperienceYears: 10,
          jobDescription: 'Lead AI research cluster, mentor doctoral scholars, and guide curriculum.',
          postingDate: '2026-01-15',
          closingDate: '2026-09-30',
          status: 'PUBLISHED',
          applicantCount: 14
        },
        {
          id: 'vac-2',
          vacancyCode: 'VAC-2026-002',
          positionTitle: 'Senior Systems Administrator & Cloud Engineer',
          instituteId: 'inst-1',
          instituteName: 'SSIT - Institute of Technology',
          departmentId: 'dept-1',
          departmentName: 'Computer Engineering',
          designation: 'Senior Systems Administrator',
          employeeType: 'IT',
          employmentType: 'PERMANENT',
          vacanciesCount: 1,
          requiredQualification: 'B.Tech / MCA with RedHat & AWS Certifications',
          minExperienceYears: 5,
          jobDescription: 'Manage campus high-performance computing cluster and data centers.',
          postingDate: '2026-02-01',
          closingDate: '2026-09-15',
          status: 'PUBLISHED',
          applicantCount: 8
        }
      ];
      if (!(db as any).state) (db as any).state = {};
      (db as any).state.jobVacancies = defaultVacancies;
      db.saveState();
    }
    return (db as any).state.jobVacancies;
  }

  public createVacancy(payload: Omit<JobVacancy, 'id' | 'vacancyCode' | 'applicantCount'>, actor: User): JobVacancy {
    const list = this.getVacancies();
    const count = list.length + 1;
    const vacancyCode = `VAC-2026-${count.toString().padStart(3, '0')}`;
    const newVac: JobVacancy = {
      ...payload,
      id: `vac-${Date.now()}`,
      vacancyCode,
      applicantCount: 0
    };
    list.unshift(newVac);
    (db as any).state.jobVacancies = list;
    db.saveState();
    return newVac;
  }

  public getApplications(vacancyId?: string): JobApplication[] {
    let list = (db as any).state?.jobApplications || [];
    if (vacancyId) list = list.filter((a: JobApplication) => a.vacancyId === vacancyId);
    return list;
  }

  public submitJobApplication(payload: Omit<JobApplication, 'id' | 'applicationNo' | 'appliedDate' | 'screeningStatus'>): JobApplication {
    const applicationNo = this.generateRequestNumber('APP-JOB');
    const newApp: JobApplication = {
      ...payload,
      id: `app-job-${Date.now()}`,
      applicationNo,
      appliedDate: new Date().toISOString().split('T')[0],
      screeningStatus: 'APPLIED'
    };
    if (!(db as any).state.jobApplications) (db as any).state.jobApplications = [];
    (db as any).state.jobApplications.unshift(newApp);

    // Update count in vacancy
    const vac = this.getVacancies().find(v => v.id === payload.vacancyId);
    if (vac) vac.applicantCount = (vac.applicantCount || 0) + 1;

    db.saveState();
    return newApp;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. DOCUMENTS & COMPLIANCE
  // ══════════════════════════════════════════════════════════════════════════════
  public getEmployeeDocuments(employeeId: string): EmployeeDocumentItem[] {
    let list = (db as any).state?.employeeDocuments || [];
    return list.filter((d: EmployeeDocumentItem) => d.employeeId === employeeId);
  }

  public uploadDocument(
    payload: Omit<EmployeeDocumentItem, 'id' | 'uploadedDate' | 'verificationStatus'>,
    actor: User
  ): EmployeeDocumentItem {
    const newDoc: EmployeeDocumentItem = {
      ...payload,
      id: `doc-${Date.now()}`,
      uploadedDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'PENDING'
    };

    if (!(db as any).state.employeeDocuments) (db as any).state.employeeDocuments = [];
    (db as any).state.employeeDocuments.unshift(newDoc);
    db.saveState();

    this.logHRAudit({
      actionType: 'UPLOAD_DOCUMENT',
      entityId: payload.employeeId,
      entityName: payload.documentTitle,
      details: `Uploaded ${payload.documentType} document: ${payload.documentTitle}`,
      actor
    });

    return newDoc;
  }

  public verifyDocument(
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    remarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const list = (db as any).state?.employeeDocuments || [];
    const doc = list.find((d: EmployeeDocumentItem) => d.id === documentId);
    if (!doc) return { success: false, message: 'Document not found.' };

    doc.verificationStatus = status;
    doc.verifiedBy = actor.name;
    doc.verifiedAt = new Date().toISOString();
    doc.remarks = remarks;

    db.saveState();
    return { success: true, message: `Document marked ${status.toLowerCase()}.` };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 12. PERFORMANCE APPRAISALS & TRAINING
  // ══════════════════════════════════════════════════════════════════════════════
  public getAppraisals(employeeId?: string): PerformanceAppraisal[] {
    let list = db.getPerformanceAppraisals();
    if (employeeId) list = list.filter(a => a.employeeId === employeeId);
    return list;
  }

  public submitAppraisal(payload: Omit<PerformanceAppraisal, 'id' | 'status'>, actor: User): PerformanceAppraisal {
    const appraisalNo = this.generateRequestNumber('APR');
    const newAppr: PerformanceAppraisal = {
      ...payload,
      id: `appr-${Date.now()}`,
      appraisalNo,
      status: 'SUBMITTED'
    };
    if (!(db as any).state.performanceAppraisals) (db as any).state.performanceAppraisals = [];
    (db as any).state.performanceAppraisals.unshift(newAppr);
    db.saveState();

    this.logHRAudit({
      actionType: 'SUBMIT_APPRAISAL',
      entityId: payload.employeeId,
      entityName: payload.employeeName,
      details: `Submitted annual performance appraisal for ${payload.employeeName}. Overall Score: ${payload.overallScore}/5.0`,
      actor
    });

    return newAppr;
  }

  public getTrainingRecords(employeeId?: string): TrainingFdpRecord[] {
    let list = db.getTrainingFdpRecords();
    if (employeeId) list = list.filter(t => t.employeeId === employeeId);
    return list;
  }

  public addTrainingRecord(payload: Omit<TrainingFdpRecord, 'id' | 'status'>, actor: User): TrainingFdpRecord {
    const newTrain: TrainingFdpRecord = {
      ...payload,
      id: `fdp-${Date.now()}`,
      status: 'COMPLETED'
    };
    if (!(db as any).state.trainingFdpRecords) (db as any).state.trainingFdpRecords = [];
    (db as any).state.trainingFdpRecords.unshift(newTrain);
    db.saveState();

    this.logHRAudit({
      actionType: 'ADD_TRAINING',
      entityId: payload.employeeId,
      entityName: payload.employeeName,
      details: `Added ${payload.trainingType} record: ${payload.title} for ${payload.employeeName}.`,
      actor
    });

    return newTrain;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 13. BULK EXCEL INGESTION (TRANSACTION-SAFE)
  // ══════════════════════════════════════════════════════════════════════════════
  public processBulkEmployeeImport(rows: BulkEmployeeImportRow[], actor: User): BulkImportResult {
    const errors: { row: number; field: string; message: string; data?: any }[] = [];
    const validPayloads: any[] = [];
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const seenPans = new Set<string>();

    const existingEmployees = db.getEmployees();
    existingEmployees.forEach(e => {
      if (e.email) seenEmails.add(e.email.trim().toLowerCase());
      if (e.phone) seenPhones.add(e.phone.trim());
      if (e.panNo) seenPans.add(e.panNo.trim().toUpperCase());
    });

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Accounting for Excel Header

      if (!row.name || !row.name.trim()) {
        errors.push({ row: rowNum, field: 'name', message: 'Employee name is required.', data: row });
        return;
      }
      if (!row.email || !row.email.includes('@')) {
        errors.push({ row: rowNum, field: 'email', message: `Invalid email address '${row.email}'.`, data: row });
        return;
      }
      if (seenEmails.has(row.email.trim().toLowerCase())) {
        errors.push({ row: rowNum, field: 'email', message: `Duplicate email '${row.email}' found.`, data: row });
        return;
      }
      if (!row.phone || row.phone.toString().trim().length < 10) {
        errors.push({ row: rowNum, field: 'phone', message: `Invalid phone number '${row.phone}'.`, data: row });
        return;
      }
      if (seenPhones.has(row.phone.toString().trim())) {
        errors.push({ row: rowNum, field: 'phone', message: `Duplicate phone '${row.phone}' found.`, data: row });
        return;
      }
      if (row.panNo && seenPans.has(row.panNo.toString().trim().toUpperCase())) {
        errors.push({ row: rowNum, field: 'panNo', message: `Duplicate PAN '${row.panNo}' found.`, data: row });
        return;
      }

      seenEmails.add(row.email.trim().toLowerCase());
      seenPhones.add(row.phone.toString().trim());
      if (row.panNo) seenPans.add(row.panNo.toString().trim().toUpperCase());

      validPayloads.push({
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone.toString().trim(),
        designation: row.designation || 'Staff Member',
        employeeType: (row.employeeType?.toUpperCase() || 'ADMINISTRATIVE') as EmployeeType,
        employmentType: (row.employmentType?.toUpperCase() || 'PERMANENT') as EmploymentType,
        instituteId: row.instituteId || 'inst-1',
        departmentId: row.departmentId || 'dept-1',
        joiningDate: row.joiningDate || new Date().toISOString().split('T')[0],
        salary: Number(row.salary) || 50000,
        panNo: (row.panNo || 'ABCDE1234F').toString().toUpperCase().trim(),
        aadhaarNo: (row.aadhaarNo || '1234-5678-9012').toString().trim(),
        qualification: row.qualification || 'Bachelor Degree',
        experienceYears: Number(row.experienceYears) || 2,
        bankAccountNo: row.bankAccountNo || `SBIN000${Math.floor(100000 + Math.random() * 900000)}`,
      });
    });

    if (errors.length > 0) {
      return {
        success: false,
        totalProcessed: rows.length,
        successCount: 0,
        failureCount: errors.length,
        errors,
        importedIds: []
      };
    }

    const importedIds: string[] = [];
    validPayloads.forEach(p => {
      const res = this.onboardEmployee(p, actor);
      if (res.success && res.employee) {
        importedIds.push(res.employee.id);
      }
    });

    this.logHRAudit({
      actionType: 'BULK_IMPORT',
      entityId: `BATCH-${Date.now()}`,
      entityName: 'Bulk Employee Import',
      details: `Successfully imported ${importedIds.length} employee records via Excel batch ingestion.`,
      actor
    });

    return {
      success: true,
      totalProcessed: rows.length,
      successCount: importedIds.length,
      failureCount: 0,
      errors: [],
      importedIds
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 14. EXECUTIVE HR DASHBOARD KPIS & STATS
  // ══════════════════════════════════════════════════════════════════════════════
  public getDashboardKPIs() {
    const employees = db.getEmployees();
    const active = employees.filter(e => e.status === 'ACTIVE');
    const faculty = active.filter(e => e.employeeType === 'FACULTY');
    const nonTeaching = active.filter(e => e.employeeType !== 'FACULTY');
    
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = this.getAttendanceRecords({ date: today });
    const presentToday = todayAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'WORK_FROM_HOME' || a.status === 'ON_DUTY').length;
    const attendanceRate = active.length > 0 ? Math.round((presentToday / active.length) * 100) : 100;

    const leaves = db.getEmployeeLeaveApplications();
    const pendingLeaves = leaves.filter(l => l.status === 'SUBMITTED' || l.managerApproval === 'PENDING' || l.hrApproval === 'PENDING').length;
    
    const vacancies = this.getVacancies().filter(v => v.status === 'PUBLISHED');
    const totalApplicants = vacancies.reduce((s, v) => s + (v.applicantCount || 0), 0);

    const payrolls = db.getPayrollRecords();
    const totalMonthlySalary = active.reduce((s, e) => s + (Number(e.salary) || 0), 0);

    return {
      totalEmployees: employees.length,
      activeEmployees: active.length,
      facultyCount: faculty.length,
      nonTeachingCount: nonTeaching.length,
      presentToday,
      attendanceRate,
      pendingLeaves,
      openVacancies: vacancies.length,
      totalApplicants,
      totalMonthlySalary,
      pendingClearances: this.getSeparations().filter(s => s.status === 'SUBMITTED' || s.status === 'CLEARANCE_IN_PROGRESS').length
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 15. AUDIT LOGGING
  // ══════════════════════════════════════════════════════════════════════════════
  public logHRAudit(params: {
    actionType: HRAuditLogItem['actionType'];
    entityId: string;
    entityName: string;
    details: string;
    previousValue?: any;
    newValue?: any;
    actor: User;
  }) {
    const auditItem: HRAuditLogItem = {
      id: `hr-aud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      performedByUserId: params.actor.id,
      performedByName: params.actor.name,
      performedByRole: params.actor.role,
      actionType: params.actionType,
      moduleName: 'UNIVERSITY_HRMS',
      entityId: params.entityId,
      entityName: params.entityName,
      details: params.details,
      previousValue: params.previousValue,
      newValue: params.newValue
    };

    if (!(db as any).state.hrAuditLogs) (db as any).state.hrAuditLogs = [];
    (db as any).state.hrAuditLogs.unshift(auditItem);
    db.saveState();
  }

  public getHRAuditLogs(): HRAuditLogItem[] {
    return (db as any).state?.hrAuditLogs || [];
  }
}

export const hrmsService = HRMSService.getInstance();
