import ExcelJS from 'exceljs';
import { db } from './db';
import { User, UserRole, Student, Faculty } from '../types';
import { PTMSchedule, PTMRecord, PTMFollowUpAction, PTMEvent } from '../types/ptm';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

export interface PTMExportFilterOptions {
  eventId?: string;
  departmentId?: string;
  departmentName?: string;
  status?: string;
  search?: string;
  filteredSchedules?: PTMSchedule[];
}

export class PTMExcelReportService {
  /**
   * Generates and downloads the official 4-sheet university-grade PTM Excel Report
   */
  public async generateAndDownloadReport(
    schedules: PTMSchedule[],
    records: PTMRecord[],
    followUps: PTMFollowUpAction[],
    events: PTMEvent[],
    user: User,
    role: UserRole,
    filterOptions?: PTMExportFilterOptions
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Swarrnim Startup & Innovation University';
    workbook.lastModifiedBy = user.name || 'SSIU ERP Administrator';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Prepare Master Lookups
    const allStudents = db.getStudents();
    const allFaculty = db.getFaculty();
    const allDepartments = db.getDepartments();
    const allPrograms = db.getPrograms();
    const allSemesters = db.getSemesters();
    const allDivisions = db.getDivisions();
    const allInstitutes = db.getInstitutes();

    const studentMap = new Map<string, Student>();
    const studentEnrollMap = new Map<string, Student>();
    allStudents.forEach(st => {
      studentMap.set(st.id, st);
      if (st.enrollmentNo) studentEnrollMap.set(st.enrollmentNo.trim().toUpperCase(), st);
    });

    const facultyMap = new Map<string, Faculty>();
    allFaculty.forEach(f => {
      facultyMap.set(f.id, f);
      if ((f as any).userId) facultyMap.set((f as any).userId, f);
    });

    const recordScheduleMap = new Map<string, PTMRecord>();
    records.forEach(r => {
      recordScheduleMap.set(r.ptmScheduleId, r);
    });

    // Helper to resolve student from central master
    const resolveStudent = (schedule: PTMSchedule): Student | undefined => {
      if (schedule.studentId && studentMap.has(schedule.studentId)) {
        return studentMap.get(schedule.studentId);
      }
      if (schedule.enrollmentNo && studentEnrollMap.has(schedule.enrollmentNo.trim().toUpperCase())) {
        return studentEnrollMap.get(schedule.enrollmentNo.trim().toUpperCase());
      }
      return undefined;
    };

    // Helper to resolve faculty from central master
    const resolveFaculty = (schedule: PTMSchedule): Faculty | undefined => {
      if (schedule.facultyId && facultyMap.has(schedule.facultyId)) {
        return facultyMap.get(schedule.facultyId);
      }
      return allFaculty.find(f => f.name === schedule.facultyName);
    };

    // Clean logo base64 for embedding
    let logoImageId: number | null = null;
    try {
      if (SWARRNIM_LOGO_PNG_BASE64) {
        const cleanBase64 = SWARRNIM_LOGO_PNG_BASE64.replace(/^data:image\/\w+;base64,/, '');
        logoImageId = workbook.addImage({
          base64: cleanBase64,
          extension: 'png'
        });
      }
    } catch (e) {
      console.warn('Could not embed university logo in Excel:', e);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SHEET 1: Parent–Teacher Meeting (PTM) Report (Master Report)
    // ──────────────────────────────────────────────────────────────────────────
    const sheet1 = workbook.addWorksheet('PTM Report', {
      views: [{ state: 'frozen', ySplit: 11, xSplit: 0 }],
      pageSetup: {
        orientation: 'landscape',
        paperSize: 9, // A4
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: '11:11'
      }
    });

    // University Header Banner
    if (logoImageId !== null) {
      sheet1.addImage(logoImageId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 140, height: 48 }
      });
    }

    sheet1.mergeCells('C1:S1');
    const uTitleCell = sheet1.getCell('C1');
    uTitleCell.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    uTitleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF001F3F' } };
    uTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet1.mergeCells('C2:S2');
    const uSubCell = sheet1.getCell('C2');
    uSubCell.value = 'ACADEMIC EXCELLENCE CELL — PARENT–TEACHER MEETING (PTM) REPORT';
    uSubCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFF37023' } };
    uSubCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet1.mergeCells('C3:S3');
    const uAddrCell = sheet1.getCell('C3');
    uAddrCell.value = 'Bhayan, Gandhinagar - 382420, Gujarat | Recognized under Gujarat Private Universities Act';
    uAddrCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    uAddrCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Metadata Bar
    sheet1.mergeCells('A5:D5');
    sheet1.getCell('A5').value = `Academic Year: ${events[0]?.academicYearName || '2025-26'}`;
    sheet1.getCell('A5').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };

    sheet1.mergeCells('E5:I5');
    sheet1.getCell('E5').value = `Faculty / Mentor: ${user.name || 'All Faculty'}`;
    sheet1.getCell('E5').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };

    sheet1.mergeCells('J5:N5');
    const activeDept = filterOptions?.departmentName || (user.departmentId ? allDepartments.find(d => d.id === user.departmentId)?.name : 'All Departments');
    sheet1.getCell('J5').value = `Department: ${activeDept || 'Computer Engineering'}`;
    sheet1.getCell('J5').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };

    sheet1.mergeCells('O5:S5');
    sheet1.getCell('O5').value = `Generated Date: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`;
    sheet1.getCell('O5').font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };
    sheet1.getCell('O5').alignment = { horizontal: 'right' };

    // KPI Summary Metrics Bar (Calculated from filtered dataset)
    const totalCount = schedules.length;
    const scheduledCount = schedules.filter(s => s.status === 'SCHEDULED' || s.status === 'CONFIRMED').length;
    const confirmedCount = schedules.filter(s => s.parentResponse === 'CONFIRMED').length;
    const completedCount = schedules.filter(s => s.status === 'COMPLETED' || s.status === 'ATTENDED' || s.attendanceStatus === 'PRESENT').length;
    const pendingCount = schedules.filter(s => s.parentResponse === 'PENDING' || s.status === 'SCHEDULED').length;
    
    // Follow-ups matching active schedules
    const activeStudentIds = new Set(schedules.map(s => s.studentId));
    const activeEnrollments = new Set(schedules.map(s => s.enrollmentNo));
    const relevantFollowUps = followUps.filter(f => activeStudentIds.has(f.studentId) || activeEnrollments.has(f.enrollmentNo));
    const followUpRequiredCount = relevantFollowUps.filter(f => f.status === 'PENDING' || f.status === 'IN_PROGRESS' || f.status === 'OVERDUE').length;

    // KPI Row 1: Header Titles
    const kpiHeaders = [
      { cell: 'A7:C7', text: 'TOTAL PTMS', bg: 'FF001F3F', fg: 'FFFFFFFF' },
      { cell: 'D7:F7', text: 'SCHEDULED', bg: 'FF0284C7', fg: 'FFFFFFFF' },
      { cell: 'G7:I7', text: 'CONFIRMED', bg: 'FF16A34A', fg: 'FFFFFFFF' },
      { cell: 'J7:L7', text: 'COMPLETED / ATTENDED', bg: 'FF059669', fg: 'FFFFFFFF' },
      { cell: 'M7:O7', text: 'PENDING RESPONSE', bg: 'FFD97706', fg: 'FFFFFFFF' },
      { cell: 'P7:S7', text: 'FOLLOW-UP REQUIRED', bg: 'FFDC2626', fg: 'FFFFFFFF' }
    ];

    kpiHeaders.forEach(kpi => {
      sheet1.mergeCells(kpi.cell);
      const cell = sheet1.getCell(kpi.cell.split(':')[0]);
      cell.value = kpi.text;
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: kpi.fg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // KPI Row 2: Values
    const kpiValues = [
      { cell: 'A8:C8', val: totalCount },
      { cell: 'D8:F8', val: scheduledCount },
      { cell: 'G8:I8', val: confirmedCount },
      { cell: 'J8:L8', val: completedCount },
      { cell: 'M8:O8', val: pendingCount },
      { cell: 'P8:S8', val: followUpRequiredCount }
    ];

    kpiValues.forEach(kpi => {
      sheet1.mergeCells(kpi.cell);
      const cell = sheet1.getCell(kpi.cell.split(':')[0]);
      cell.value = kpi.val;
      cell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF001F3F' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } }
      };
    });

    // Row 10: Section Title for Table
    sheet1.mergeCells('A10:S10');
    const tableTitle = sheet1.getCell('A10');
    tableTitle.value = `STUDENT CONSULTATION ROSTER (${schedules.length} RECORDS)`;
    tableTitle.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF001F3F' } };
    tableTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    tableTitle.alignment = { vertical: 'middle', indent: 1 };

    // 19 Table Column Headers (Row 11)
    const tableColumns = [
      { key: 'srNo', header: 'Sr. No.', width: 8 },
      { key: 'studentName', header: 'Student Name', width: 24 },
      { key: 'enrollmentNo', header: 'Enrollment No.', width: 16 },
      { key: 'studentEmail', header: 'Student Email', width: 26 },
      { key: 'program', header: 'Program', width: 16 },
      { key: 'semester', header: 'Semester', width: 12 },
      { key: 'department', header: 'Department', width: 22 },
      { key: 'division', header: 'Division', width: 11 },
      { key: 'parentName', header: 'Parent Name', width: 22 },
      { key: 'parentMobile', header: 'Parent Mobile', width: 16 },
      { key: 'ptmDate', header: 'PTM Date', width: 14 },
      { key: 'timeSlot', header: 'Time Slot', width: 20 },
      { key: 'attendancePct', header: 'Attendance %', width: 14 },
      { key: 'parentResponse', header: 'Parent Response', width: 18 },
      { key: 'ptmStatus', header: 'PTM Status', width: 16 },
      { key: 'facultyMentor', header: 'Faculty / Mentor', width: 22 },
      { key: 'remarks', header: 'Remarks / Discussion', width: 32 },
      { key: 'followUpRequired', header: 'Follow-up Required', width: 18 },
      { key: 'followUpDate', header: 'Follow-up Date', width: 15 }
    ];

    const headerRow = sheet1.getRow(11);
    tableColumns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = { horizontal: idx === 0 || idx === 5 || idx === 7 || idx === 10 || idx === 12 || idx === 13 || idx === 14 || idx === 17 || idx === 18 ? 'center' : 'left', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF001F3F' } },
        bottom: { style: 'medium', color: { argb: 'FFF37023' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
      sheet1.getColumn(idx + 1).width = col.width;
    });
    headerRow.height = 28;

    // Enable Excel Auto Filter on Table Headers
    sheet1.autoFilter = {
      from: { row: 11, column: 1 },
      to: { row: 11, column: 19 }
    };

    // Populate Detailed PTM Data Rows
    schedules.forEach((sch, idx) => {
      const rowNum = 12 + idx;
      const dataRow = sheet1.getRow(rowNum);
      const student = resolveStudent(sch);
      const faculty = resolveFaculty(sch);
      const rec = recordScheduleMap.get(sch.id);

      // Student Master resolution
      const studentName = student?.name || sch.studentName || 'Student';
      const enrollmentNo = student?.enrollmentNo || sch.enrollmentNo || '-';
      const studentEmail = student?.email || `${enrollmentNo.toLowerCase()}@swarrnim.edu.in`;
      
      const progObj = student?.programId ? db.getProgramById(student.programId) : undefined;
      const progCode = progObj?.code || sch.programName || 'B.Tech CSE';

      const semObj = student?.semesterId ? db.getSemesterById(student.semesterId) : undefined;
      const semStr = semObj ? `Sem ${semObj.number}` : `Sem ${sch.semesterNumber || 4}`;

      const deptObj = student?.departmentId ? allDepartments.find(d => d.id === student.departmentId) : undefined;
      const deptName = student?.branch || deptObj?.name || sch.departmentName || 'Computer Engineering';

      const divObj = student?.divisionId ? allDivisions.find(d => d.id === student.divisionId) : undefined;
      const divStr = divObj?.name ? divObj.name.replace(/^Division\s*/i, '') : (student?.divisionId || 'A');

      // Attendance statistics from Central Database
      const attStats = student ? db.getStudentAttendanceStats(student.id) : { percentage: 82 };
      const attendanceStr = `${attStats.percentage}%`;

      // Faculty Master resolution
      const facultyName = faculty?.name || sch.facultyName || 'Faculty Mentor';

      // Follow-up resolution
      const studentFollowUps = relevantFollowUps.filter(f => f.studentId === sch.studentId || f.enrollmentNo === sch.enrollmentNo);
      const hasFollowUp = studentFollowUps.length > 0 && studentFollowUps.some(f => f.status !== 'COMPLETED');
      const followUpDate = studentFollowUps.find(f => f.dueDate)?.dueDate || '-';

      // Discussion / Remarks
      const remarks = rec?.facultyRemarks || rec?.academicPerformance || (sch.parentResponseReason ? `Parent Response: ${sch.parentResponseReason}` : 'Routine academic discussion and progress review.');

      const values = [
        idx + 1,
        studentName,
        enrollmentNo,
        studentEmail,
        progCode,
        semStr,
        deptName,
        divStr,
        sch.parentName || 'Parent',
        sch.parentPhone || '-',
        sch.date || '2026-08-28',
        sch.slotTime || `${sch.startTime || '10:00 AM'} - ${sch.endTime || '10:30 AM'}`,
        attendanceStr,
        sch.parentResponse || 'PENDING',
        sch.status || 'SCHEDULED',
        facultyName,
        remarks,
        hasFollowUp ? 'YES' : 'NO',
        followUpDate
      ];

      values.forEach((val, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
        
        // Alignment
        const isCenter = cIdx === 0 || cIdx === 4 || cIdx === 5 || cIdx === 7 || cIdx === 10 || cIdx === 12 || cIdx === 13 || cIdx === 14 || cIdx === 17 || cIdx === 18;
        cell.alignment = { horizontal: isCenter ? 'center' : 'left', vertical: 'middle', wrapText: cIdx === 16 };

        // Zebra striping
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        // Status pill highlight
        if (cIdx === 13) { // Parent Response
          if (val === 'CONFIRMED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
          } else if (val === 'DECLINED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };
          } else if (val === 'RESCHEDULE_REQUESTED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFC2410C' } };
          }
        }

        if (cIdx === 14) { // PTM Status
          if (val === 'COMPLETED' || val === 'ATTENDED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
          } else if (val === 'CANCELLED' || val === 'MISSED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };
          } else if (val === 'CONFIRMED') {
            cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0369A1' } };
          }
        }

        if (cIdx === 17 && val === 'YES') {
          cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFDC2626' } };
        }

        // Grid borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      dataRow.height = 24;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SHEET 2: "PTM Summary" (Multi-Dimensional Analytical Breakdowns)
    // ──────────────────────────────────────────────────────────────────────────
    const sheet2 = workbook.addWorksheet('PTM Summary', {
      views: [{ state: 'frozen', ySplit: 6, xSplit: 0 }],
      pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1 }
    });

    // Header Title
    sheet2.mergeCells('A1:G1');
    const s2Title = sheet2.getCell('A1');
    s2Title.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    s2Title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF001F3F' } };
    s2Title.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet2.mergeCells('A2:G2');
    const s2Sub = sheet2.getCell('A2');
    s2Sub.value = 'PTM ANALYTICAL SUMMARY & PARTICIPATION METRICS';
    s2Sub.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFF37023' } };
    s2Sub.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet2.mergeCells('A3:G3');
    sheet2.getCell('A3').value = `Generated On: ${new Date().toLocaleDateString('en-IN')} | Scope: Authorized Departmental Records`;
    sheet2.getCell('A3').font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: 'FF64748B' } };
    sheet2.getCell('A3').alignment = { horizontal: 'center' };

    let s2Row = 5;

    // 1. Department-wise Summary
    sheet2.mergeCells(`A${s2Row}:G${s2Row}`);
    const dHead = sheet2.getCell(`A${s2Row}`);
    dHead.value = '1. DEPARTMENT-WISE PTM PARTICIPATION';
    dHead.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    dHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    dHead.alignment = { vertical: 'middle', indent: 1 };
    s2Row++;

    const deptCols = ['Department Name', 'Total Scheduled', 'Confirmed', 'Completed', 'Pending', 'Attendance Rate %'];
    const dHeaderRow = sheet2.getRow(s2Row);
    deptCols.forEach((col, idx) => {
      const c = dHeaderRow.getCell(idx + 1);
      c.value = col;
      c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      c.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' };
      c.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    });
    s2Row++;

    // Compute department breakdown
    const deptMap: Record<string, { total: number; confirmed: number; completed: number; pending: number }> = {};
    schedules.forEach(s => {
      const st = resolveStudent(s);
      const dName = st?.branch || (st?.departmentId ? allDepartments.find(d => d.id === st.departmentId)?.name : s.departmentName) || 'Computer Engineering';
      if (!deptMap[dName]) deptMap[dName] = { total: 0, confirmed: 0, completed: 0, pending: 0 };
      deptMap[dName].total++;
      if (s.parentResponse === 'CONFIRMED') deptMap[dName].confirmed++;
      if (s.status === 'COMPLETED' || s.status === 'ATTENDED' || s.attendanceStatus === 'PRESENT') deptMap[dName].completed++;
      if (s.parentResponse === 'PENDING' || s.status === 'SCHEDULED') deptMap[dName].pending++;
    });

    Object.entries(deptMap).forEach(([dept, data]) => {
      const row = sheet2.getRow(s2Row);
      const rate = data.total > 0 ? `${Math.round((data.completed / data.total) * 100)}%` : '0%';
      row.values = [dept, data.total, data.confirmed, data.completed, data.pending, rate];
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'left' };
      for (let i = 2; i <= 6; i++) row.getCell(i).alignment = { horizontal: 'center' };
      s2Row++;
    });

    s2Row += 2;

    // 2. Program-wise Summary
    sheet2.mergeCells(`A${s2Row}:G${s2Row}`);
    const pHead = sheet2.getCell(`A${s2Row}`);
    pHead.value = '2. PROGRAM-WISE PTM BREAKDOWN';
    pHead.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    pHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    pHead.alignment = { vertical: 'middle', indent: 1 };
    s2Row++;

    const progCols = ['Program', 'Total Students', 'Confirmed', 'Completed', 'Pending', 'Completion %'];
    const pHeaderRow = sheet2.getRow(s2Row);
    progCols.forEach((col, idx) => {
      const c = pHeaderRow.getCell(idx + 1);
      c.value = col;
      c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      c.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' };
      c.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    });
    s2Row++;

    const progMap: Record<string, { total: number; confirmed: number; completed: number; pending: number }> = {};
    schedules.forEach(s => {
      const st = resolveStudent(s);
      const pObj = st?.programId ? db.getProgramById(st.programId) : undefined;
      const pName = pObj?.name || s.programName || 'B.Tech in Computer Science & Engineering';
      if (!progMap[pName]) progMap[pName] = { total: 0, confirmed: 0, completed: 0, pending: 0 };
      progMap[pName].total++;
      if (s.parentResponse === 'CONFIRMED') progMap[pName].confirmed++;
      if (s.status === 'COMPLETED' || s.status === 'ATTENDED') progMap[pName].completed++;
      if (s.parentResponse === 'PENDING') progMap[pName].pending++;
    });

    Object.entries(progMap).forEach(([prog, data]) => {
      const row = sheet2.getRow(s2Row);
      const rate = data.total > 0 ? `${Math.round((data.completed / data.total) * 100)}%` : '0%';
      row.values = [prog, data.total, data.confirmed, data.completed, data.pending, rate];
      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'left' };
      for (let i = 2; i <= 6; i++) row.getCell(i).alignment = { horizontal: 'center' };
      s2Row++;
    });

    s2Row += 2;

    // 3. Semester-wise Summary
    sheet2.mergeCells(`A${s2Row}:G${s2Row}`);
    const semHead = sheet2.getCell(`A${s2Row}`);
    semHead.value = '3. SEMESTER-WISE PARTICIPATION';
    semHead.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    semHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    semHead.alignment = { vertical: 'middle', indent: 1 };
    s2Row++;

    const semCols = ['Semester', 'Total Scheduled', 'Confirmed', 'Completed', 'Pending', 'Rate %'];
    const sHeaderRow = sheet2.getRow(s2Row);
    semCols.forEach((col, idx) => {
      const c = sHeaderRow.getCell(idx + 1);
      c.value = col;
      c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    });
    s2Row++;

    const semMap: Record<string, { total: number; confirmed: number; completed: number; pending: number }> = {};
    schedules.forEach(s => {
      const st = resolveStudent(s);
      const sObj = st?.semesterId ? db.getSemesterById(st.semesterId) : undefined;
      const sName = sObj ? `Semester ${sObj.number}` : `Semester ${s.semesterNumber || 4}`;
      if (!semMap[sName]) semMap[sName] = { total: 0, confirmed: 0, completed: 0, pending: 0 };
      semMap[sName].total++;
      if (s.parentResponse === 'CONFIRMED') semMap[sName].confirmed++;
      if (s.status === 'COMPLETED' || s.status === 'ATTENDED') semMap[sName].completed++;
      if (s.parentResponse === 'PENDING') semMap[sName].pending++;
    });

    Object.entries(semMap).sort((a, b) => a[0].localeCompare(b[0])).forEach(([sem, data]) => {
      const row = sheet2.getRow(s2Row);
      const rate = data.total > 0 ? `${Math.round((data.completed / data.total) * 100)}%` : '0%';
      row.values = [sem, data.total, data.confirmed, data.completed, data.pending, rate];
      row.alignment = { vertical: 'middle' };
      for (let i = 1; i <= 6; i++) row.getCell(i).alignment = { horizontal: 'center' };
      s2Row++;
    });

    s2Row += 2;

    // 4. Parent Response & Follow-up Summary Combined Table
    sheet2.mergeCells(`A${s2Row}:G${s2Row}`);
    const rHead = sheet2.getCell(`A${s2Row}`);
    rHead.value = '4. PARENT RESPONSE & ACTION METRICS SUMMARY';
    rHead.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    rHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    rHead.alignment = { vertical: 'middle', indent: 1 };
    s2Row++;

    const respStats = [
      { metric: 'Parent Confirmed Invitations', count: confirmedCount, pct: totalCount > 0 ? `${Math.round((confirmedCount / totalCount) * 100)}%` : '0%' },
      { metric: 'Pending Parent Confirmations', count: pendingCount, pct: totalCount > 0 ? `${Math.round((pendingCount / totalCount) * 100)}%` : '0%' },
      { metric: 'Reschedule Requests Received', count: schedules.filter(s => s.parentResponse === 'RESCHEDULE_REQUESTED').length, pct: totalCount > 0 ? `${Math.round((schedules.filter(s => s.parentResponse === 'RESCHEDULE_REQUESTED').length / totalCount) * 100)}%` : '0%' },
      { metric: 'Meetings Completed & Documented', count: completedCount, pct: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%' },
      { metric: 'Outstanding Follow-up Action Items', count: followUpRequiredCount, pct: `${relevantFollowUps.length} total logged` }
    ];

    respStats.forEach(rs => {
      sheet2.mergeCells(`A${s2Row}:D${s2Row}`);
      sheet2.getCell(`A${s2Row}`).value = rs.metric;
      sheet2.getCell(`A${s2Row}`).font = { name: 'Calibri', size: 9.5, bold: true };

      sheet2.mergeCells(`E${s2Row}:F${s2Row}`);
      sheet2.getCell(`E${s2Row}`).value = rs.count;
      sheet2.getCell(`E${s2Row}`).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF001F3F' } };
      sheet2.getCell(`E${s2Row}`).alignment = { horizontal: 'center' };

      sheet2.getCell(`G${s2Row}`).value = rs.pct;
      sheet2.getCell(`G${s2Row}`).font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF64748B' } };
      sheet2.getCell(`G${s2Row}`).alignment = { horizontal: 'center' };

      s2Row++;
    });

    // Set Column Widths for Sheet 2
    sheet2.getColumn(1).width = 38;
    sheet2.getColumn(2).width = 18;
    sheet2.getColumn(3).width = 16;
    sheet2.getColumn(4).width = 16;
    sheet2.getColumn(5).width = 16;
    sheet2.getColumn(6).width = 20;
    sheet2.getColumn(7).width = 16;

    // ──────────────────────────────────────────────────────────────────────────
    // SHEET 3: "PTM Records" (Complete Row-Level Consultation Dossiers)
    // ──────────────────────────────────────────────────────────────────────────
    const sheet3 = workbook.addWorksheet('PTM Records', {
      views: [{ state: 'frozen', ySplit: 3, xSplit: 0 }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 }
    });

    // Title Row
    sheet3.mergeCells('A1:R1');
    const s3Title = sheet3.getCell('A1');
    s3Title.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY — PTM CONSULTATION RECORDS & DOSSIERS';
    s3Title.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF001F3F' } };
    s3Title.alignment = { vertical: 'middle', indent: 1 };
    s3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    sheet3.getRow(1).height = 26;

    const recordColumns = [
      { header: 'Record ID', width: 14 },
      { header: 'Event Title', width: 28 },
      { header: 'PTM Date', width: 14 },
      { header: 'Student Name', width: 22 },
      { header: 'Enrollment No.', width: 16 },
      { header: 'Program', width: 16 },
      { header: 'Semester', width: 12 },
      { header: 'Department', width: 22 },
      { header: 'Parent Name', width: 20 },
      { header: 'Relationship', width: 14 },
      { header: 'Faculty / Mentor', width: 22 },
      { header: 'PTM Outcome', width: 20 },
      { header: 'Academic Discussion', width: 30 },
      { header: 'Attendance Concern', width: 18 },
      { header: 'Parent Feedback', width: 28 },
      { header: 'Parent Concerns / Grievance', width: 28 },
      { header: 'Faculty Action Remarks', width: 32 },
      { header: 'Follow-up Status', width: 18 }
    ];

    const s3HeaderRow = sheet3.getRow(3);
    recordColumns.forEach((col, idx) => {
      const c = s3HeaderRow.getCell(idx + 1);
      c.value = col.header;
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      c.alignment = { horizontal: idx === 0 || idx === 2 || idx === 6 || idx === 9 || idx === 13 || idx === 17 ? 'center' : 'left', vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
      sheet3.getColumn(idx + 1).width = col.width;
    });
    s3HeaderRow.height = 26;

    sheet3.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 18 } };

    // Fill Records Rows
    schedules.forEach((sch, idx) => {
      const rec = recordScheduleMap.get(sch.id);
      const student = resolveStudent(sch);
      const faculty = resolveFaculty(sch);
      const rRow = sheet3.getRow(4 + idx);

      const progObj = student?.programId ? db.getProgramById(student.programId) : undefined;
      const semObj = student?.semesterId ? db.getSemesterById(student.semesterId) : undefined;
      const deptObj = student?.departmentId ? allDepartments.find(d => d.id === student.departmentId) : undefined;

      const rValues = [
        rec?.id || `REC-${sch.id.toUpperCase()}`,
        sch.ptmEventTitle || 'Academic Review PTM',
        sch.date || '2026-08-28',
        student?.name || sch.studentName,
        student?.enrollmentNo || sch.enrollmentNo,
        progObj?.code || sch.programName || 'B.Tech CSE',
        semObj ? `Sem ${semObj.number}` : `Sem ${sch.semesterNumber || 4}`,
        student?.branch || deptObj?.name || sch.departmentName || 'Computer Engineering',
        sch.parentName,
        sch.parentRelationship || 'Father',
        faculty?.name || sch.facultyName || 'Faculty Mentor',
        rec?.outcome || (sch.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING REVIEW'),
        rec?.academicPerformance || 'Discussed mid-term progress and continuous evaluation milestones.',
        rec?.attendanceConcern ? 'Yes (<75%)' : 'No Shortage',
        rec?.parentFeedback || 'Appreciated the faculty feedback and support structure.',
        rec?.parentConcerns || 'None reported.',
        rec?.facultyRemarks || (sch.parentResponseReason ? `Parent Response: ${sch.parentResponseReason}` : 'Regular monitoring recommended.'),
        rec?.actionRequired || 'Completed'
      ];

      rValues.forEach((val, cIdx) => {
        const c = rRow.getCell(cIdx + 1);
        c.value = val;
        c.font = { name: 'Calibri', size: 9.5 };
        const isCenter = cIdx === 0 || cIdx === 2 || cIdx === 6 || cIdx === 9 || cIdx === 13 || cIdx === 17;
        c.alignment = { horizontal: isCenter ? 'center' : 'left', vertical: 'middle', wrapText: cIdx >= 12 && cIdx <= 16 };
        if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
      rRow.height = 22;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // SHEET 4: "Follow-up Actions" (Action Items, Due Dates, and Status)
    // ──────────────────────────────────────────────────────────────────────────
    const sheet4 = workbook.addWorksheet('Follow-up Actions', {
      views: [{ state: 'frozen', ySplit: 3, xSplit: 0 }],
      pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 }
    });

    // Title Row
    sheet4.mergeCells('A1:L1');
    const s4Title = sheet4.getCell('A1');
    s4Title.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY — PTM FOLLOW-UP ACTIONS DIRECTORY';
    s4Title.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF001F3F' } };
    s4Title.alignment = { vertical: 'middle', indent: 1 };
    s4Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    sheet4.getRow(1).height = 26;

    const followUpColumns = [
      { header: 'Sr. No.', width: 8 },
      { header: 'Action ID', width: 14 },
      { header: 'Student Name', width: 22 },
      { header: 'Enrollment No.', width: 16 },
      { header: 'Parent Name', width: 20 },
      { header: 'Issue / Discussion', width: 30 },
      { header: 'Action Required', width: 32 },
      { header: 'Assigned Faculty / Mentor', width: 24 },
      { header: 'Priority', width: 14 },
      { header: 'Due Date', width: 14 },
      { header: 'Status', width: 16 },
      { header: 'Completion Remarks', width: 28 }
    ];

    const s4HeaderRow = sheet4.getRow(3);
    followUpColumns.forEach((col, idx) => {
      const c = s4HeaderRow.getCell(idx + 1);
      c.value = col.header;
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      c.alignment = { horizontal: idx === 0 || idx === 1 || idx === 8 || idx === 9 || idx === 10 ? 'center' : 'left', vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
      sheet4.getColumn(idx + 1).width = col.width;
    });
    s4HeaderRow.height = 26;

    sheet4.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 12 } };

    // Fill Follow-up Actions
    relevantFollowUps.forEach((act, idx) => {
      const fRow = sheet4.getRow(4 + idx);
      const student = allStudents.find(s => s.id === act.studentId || s.enrollmentNo === act.enrollmentNo);
      const schedule = schedules.find(s => s.studentId === act.studentId || s.enrollmentNo === act.enrollmentNo);

      const fValues = [
        idx + 1,
        act.id,
        student?.name || act.studentName,
        student?.enrollmentNo || act.enrollmentNo,
        schedule?.parentName || 'Parent Guardian',
        'Academic & Attendance counseling',
        act.actionDescription,
        act.assignedToName || 'Assigned Mentor',
        act.priority || 'MEDIUM',
        act.dueDate || '2026-09-15',
        act.status || 'PENDING',
        act.completionRemarks || (act.status === 'COMPLETED' ? 'Completed and confirmed.' : 'In progress with mentor.')
      ];

      fValues.forEach((val, cIdx) => {
        const c = fRow.getCell(cIdx + 1);
        c.value = val;
        c.font = { name: 'Calibri', size: 9.5 };
        const isCenter = cIdx === 0 || cIdx === 1 || cIdx === 8 || cIdx === 9 || cIdx === 10;
        c.alignment = { horizontal: isCenter ? 'center' : 'left', vertical: 'middle', wrapText: cIdx === 5 || cIdx === 6 || cIdx === 11 };
        
        if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        if (cIdx === 10) { // Status
          if (val === 'COMPLETED') c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
          else if (val === 'OVERDUE') c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFDC2626' } };
          else if (val === 'PENDING') c.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFD97706' } };
        }

        c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
      fRow.height = 22;
    });

    // Write buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().split('T')[0];
    link.download = `SSIU_PTM_Report_${user.username || 'Export'}_${dateStamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const ptmExcelReportService = new PTMExcelReportService();
