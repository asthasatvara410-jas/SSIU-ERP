import { db } from './db';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

export interface NoteSheetFinancialRecord {
  id: string;
  noteSheetId?: string;
  noteSheetNumber: string;
  date: string;
  department: string;
  subject: string;
  creator: string;
  fundHead: string;
  budget: number;
  received: number;
  spent: number;
  balance: number;
  utilization: number; // e.g. 52.00
  expenseCategory: string;
  vendor: string;
  paymentMode: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'APPROVED' | 'SETTLED' | 'CANCELLED';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAuditLogItem {
  id: string;
  recordId: string;
  noteSheetNumber: string;
  action: 'CREATE' | 'UPDATE' | 'IMPORT' | 'SETTLE';
  user: string;
  role: string;
  oldValue?: string;
  newValue?: string;
  details: string;
  timestamp: string;
}

const STORAGE_KEY = 'ssiu_notesheet_financial_records_v1';
const AUDIT_STORAGE_KEY = 'ssiu_notesheet_financial_audit_v1';

const INITIAL_FINANCIAL_RECORDS: NoteSheetFinancialRecord[] = [
  {
    id: 'nsf-001',
    noteSheetNumber: 'SSIU-NS-2026-0001',
    date: '2026-08-05',
    department: 'Computer Engineering',
    subject: 'Annual National TechFest 2026 Innovation Arena & Hackathon',
    creator: 'Dr. Rajesh Patel',
    fundHead: 'Event Fund',
    budget: 150000,
    received: 150000,
    spent: 78000,
    balance: 72000,
    utilization: 52.00,
    expenseCategory: 'Events',
    vendor: 'Apex Tech Solutions & Events',
    paymentMode: 'Bank Transfer',
    status: 'COMPLETED',
    remarks: 'TechFest Phase 1 expenses settled and reconciled with bills.',
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z'
  },
  {
    id: 'nsf-002',
    noteSheetNumber: 'SSIU-NS-2026-0002',
    date: '2026-08-08',
    department: 'Computer Engineering',
    subject: 'National Robotics Championship 2026 Hardware Kits & Arena Setup',
    creator: 'Prof. Ananya Shah',
    fundHead: 'Student Welfare Fund',
    budget: 80000,
    received: 80000,
    spent: 62000,
    balance: 18000,
    utilization: 77.50,
    expenseCategory: 'Technology',
    vendor: 'RoboCrafters India Ltd.',
    paymentMode: 'UPI',
    status: 'COMPLETED',
    remarks: 'Procured microcontrollers, motors, sensors, and obstacle tracks.',
    createdAt: '2026-08-08T11:30:00.000Z',
    updatedAt: '2026-08-08T11:30:00.000Z'
  },
  {
    id: 'nsf-003',
    noteSheetNumber: 'SSIU-NS-2026-0003',
    date: '2026-08-10',
    department: 'Computer Engineering',
    subject: 'AI & Cloud Computing Lab Server Upgrade & GPU Extension',
    creator: 'Dr. Rajesh Patel',
    fundHead: 'Infrastructure Fund',
    budget: 200000,
    received: 200000,
    spent: 185000,
    balance: 15000,
    utilization: 92.50,
    expenseCategory: 'Infrastructure',
    vendor: 'Silicon Computech Pvt Ltd',
    paymentMode: 'NEFT',
    status: 'COMPLETED',
    remarks: 'High-performance NVIDIA GPU servers installed for deep learning lab.',
    createdAt: '2026-08-10T14:15:00.000Z',
    updatedAt: '2026-08-10T14:15:00.000Z'
  }
];

class NotesheetFinancialReportService {
  private records: NoteSheetFinancialRecord[] = [];
  private auditLogs: FinancialAuditLogItem[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    // Load records from localStorage or seed
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        this.records = JSON.parse(stored);
      } else {
        this.records = [...INITIAL_FINANCIAL_RECORDS];
        this.persist();
      }
    } catch {
      this.records = [...INITIAL_FINANCIAL_RECORDS];
    }

    // Load audit logs
    try {
      const storedAudit = typeof window !== 'undefined' ? localStorage.getItem(AUDIT_STORAGE_KEY) : null;
      if (storedAudit) {
        this.auditLogs = JSON.parse(storedAudit);
      } else {
        this.auditLogs = [
          {
            id: 'audit-001',
            recordId: 'nsf-001',
            noteSheetNumber: 'SSIU-NS-2026-0001',
            action: 'CREATE',
            user: 'Dr. Rajesh Patel',
            role: 'FACULTY',
            details: 'Initial financial record created for TechFest 2026 (Budget: ₹1,50,000)',
            timestamp: '2026-08-05T10:00:00.000Z'
          },
          {
            id: 'audit-002',
            recordId: 'nsf-002',
            noteSheetNumber: 'SSIU-NS-2026-0002',
            action: 'CREATE',
            user: 'Prof. Ananya Shah',
            role: 'FACULTY',
            details: 'Initial financial record created for Robotics Championship (Budget: ₹80,000)',
            timestamp: '2026-08-08T11:30:00.000Z'
          },
          {
            id: 'audit-003',
            recordId: 'nsf-003',
            noteSheetNumber: 'SSIU-NS-2026-0003',
            action: 'CREATE',
            user: 'Dr. Rajesh Patel',
            role: 'FACULTY',
            details: 'Initial financial record created for AI Server Upgrade (Budget: ₹2,00,000)',
            timestamp: '2026-08-10T14:15:00.000Z'
          }
        ];
        this.persistAudit();
      }
    } catch {
      this.auditLogs = [];
    }

    this.initialized = true;
  }

  private persist(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      } catch (err) {
        console.error('Failed to persist financial records', err);
      }
    }
  }

  private persistAudit(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditLogs));
      } catch (err) {
        console.error('Failed to persist audit logs', err);
      }
    }
  }

  public getAllFinancialRecords(): NoteSheetFinancialRecord[] {
    this.init();

    // Dynamically merge any approved notesheets from db that aren't in this.records yet
    const dbNoteSheets = db.getNoteSheets();
    const existingNumbers = new Set(this.records.map(r => r.noteSheetNumber));

    dbNoteSheets.forEach(ns => {
      if ((ns.budgetRequired || (ns.estimatedCost && ns.estimatedCost > 0)) && !existingNumbers.has(ns.noteSheetNumber)) {
        const sum = db.getNoteSheetFinancialSummary(ns.id);
        const dept = db.getDepartmentById(ns.departmentId);

        const newRec: NoteSheetFinancialRecord = {
          id: `nsf-${ns.id}`,
          noteSheetId: ns.id,
          noteSheetNumber: ns.noteSheetNumber,
          date: ns.date || '2026-08-15',
          department: dept ? dept.name : (ns.department || 'Computer Engineering'),
          subject: ns.subject,
          creator: ns.creatorName,
          fundHead: 'University General Fund',
          budget: ns.approvedAmount || ns.requestedAmount || ns.estimatedCost || 0,
          received: sum.totalReceived || ns.approvedAmount || ns.estimatedCost || 0,
          spent: sum.totalSpent || 0,
          balance: (sum.totalReceived || ns.approvedAmount || ns.estimatedCost || 0) - (sum.totalSpent || 0),
          utilization: (sum.totalReceived || ns.approvedAmount || ns.estimatedCost || 0) > 0
            ? Number((((sum.totalSpent || 0) / (sum.totalReceived || ns.approvedAmount || ns.estimatedCost || 1)) * 100).toFixed(2))
            : 0,
          expenseCategory: ns.expenseCategory || 'Academic',
          vendor: 'University Central Stores',
          paymentMode: 'Bank Transfer',
          status: ns.status === 'APPROVED' ? 'COMPLETED' : (ns.status as any || 'COMPLETED'),
          remarks: 'Imported from Central Notesheet Register',
          createdAt: ns.date ? `${ns.date}T09:00:00.000Z` : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.records.push(newRec);
        existingNumbers.add(ns.noteSheetNumber);
      }
    });

    return [...this.records].sort((a, b) => b.date.localeCompare(a.date));
  }

  public getFinancialRecordById(id: string): NoteSheetFinancialRecord | undefined {
    this.init();
    return this.records.find(r => r.id === id || r.noteSheetNumber === id);
  }

  public saveFinancialRecord(
    record: Partial<NoteSheetFinancialRecord> & { noteSheetNumber: string; subject: string; budget: number; received: number; spent: number },
    actorUser?: any
  ): NoteSheetFinancialRecord {
    this.init();
    const now = new Date().toISOString();
    const existingIndex = this.records.findIndex(r => r.id === record.id || r.noteSheetNumber === record.noteSheetNumber);

    const received = Number(record.received) || 0;
    const spent = Number(record.spent) || 0;
    const budget = Number(record.budget) || received || 0;
    const balance = received - spent;
    const utilization = received > 0 ? Number(((spent / received) * 100).toFixed(2)) : (budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0);

    let savedRecord: NoteSheetFinancialRecord;

    if (existingIndex >= 0) {
      const old = this.records[existingIndex];
      savedRecord = {
        ...old,
        ...record,
        budget,
        received,
        spent,
        balance,
        utilization,
        status: record.status || old.status || 'COMPLETED',
        updatedAt: now
      };
      this.records[existingIndex] = savedRecord;

      this.logAudit({
        recordId: savedRecord.id,
        noteSheetNumber: savedRecord.noteSheetNumber,
        action: 'UPDATE',
        user: actorUser?.name || 'Authorized Officer',
        role: actorUser?.role || 'FINANCE_ADMIN',
        oldValue: `Spent: ₹${old.spent}, Bal: ₹${old.balance}`,
        newValue: `Spent: ₹${savedRecord.spent}, Bal: ₹${savedRecord.balance}`,
        details: `Updated financial record for Notesheet ${savedRecord.noteSheetNumber}`
      });
    } else {
      savedRecord = {
        id: record.id || `nsf-${Date.now()}`,
        noteSheetId: record.noteSheetId,
        noteSheetNumber: record.noteSheetNumber,
        date: record.date || new Date().toISOString().split('T')[0],
        department: record.department || 'Computer Engineering',
        subject: record.subject,
        creator: record.creator || actorUser?.name || 'Dr. Rajesh Patel',
        fundHead: record.fundHead || 'University General Fund',
        budget,
        received,
        spent,
        balance,
        utilization,
        expenseCategory: record.expenseCategory || 'Academic',
        vendor: record.vendor || 'General Supplier',
        paymentMode: record.paymentMode || 'Bank Transfer',
        status: record.status || 'COMPLETED',
        remarks: record.remarks || '',
        createdAt: now,
        updatedAt: now
      };
      this.records.unshift(savedRecord);

      this.logAudit({
        recordId: savedRecord.id,
        noteSheetNumber: savedRecord.noteSheetNumber,
        action: 'CREATE',
        user: actorUser?.name || 'Authorized Officer',
        role: actorUser?.role || 'FINANCE_ADMIN',
        newValue: `Budget: ₹${budget}, Recv: ₹${received}, Spent: ₹${spent}`,
        details: `Created new financial record for Notesheet ${savedRecord.noteSheetNumber}`
      });
    }

    this.persist();
    return savedRecord;
  }

  public getAuditLogsForRecord(recordIdOrNumber: string): FinancialAuditLogItem[] {
    this.init();
    return this.auditLogs.filter(l => l.recordId === recordIdOrNumber || l.noteSheetNumber === recordIdOrNumber);
  }

  public getAllAuditLogs(): FinancialAuditLogItem[] {
    this.init();
    return [...this.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public logAudit(item: Omit<FinancialAuditLogItem, 'id' | 'timestamp'>): void {
    this.init();
    const newLog: FinancialAuditLogItem = {
      ...item,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    this.persistAudit();
  }

  // ─── IMPORT FROM EXCEL / CSV ───
  public parseAndValidateImport(file: File): Promise<{
    success: boolean;
    validRows: NoteSheetFinancialRecord[];
    invalidRows: Array<{ row: number; data: any; error: string }>;
    totalRows: number;
  }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const validRows: NoteSheetFinancialRecord[] = [];
          const invalidRows: Array<{ row: number; data: any; error: string }> = [];

          rawRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            const nsNumber = (row['NOTE SHEET NO.'] || row['Note Sheet No'] || row['Notesheet Number'] || row['noteSheetNumber'] || '').toString().trim();
            const subject = (row['SUBJECT'] || row['Subject'] || '').toString().trim();
            const date = (row['DATE'] || row['Date'] || new Date().toISOString().split('T')[0]).toString().trim();
            const department = (row['DEPARTMENT'] || row['Department'] || 'Computer Engineering').toString().trim();
            const creator = (row['CREATOR'] || row['Creator'] || 'Dr. Rajesh Patel').toString().trim();
            
            // Clean amounts (handle ₹, commas, etc.)
            const parseAmount = (val: any) => {
              if (val === undefined || val === null || val === '') return 0;
              const clean = String(val).replace(/[₹,\s]/g, '');
              const num = Number(clean);
              return isNaN(num) ? 0 : num;
            };

            const budget = parseAmount(row['BUDGET (₹)'] || row['Budget'] || row['budget']);
            const received = parseAmount(row['RECEIVED (₹)'] || row['Received'] || row['received']) || budget;
            const spent = parseAmount(row['SPENT (₹)'] || row['Spent'] || row['spent']);
            const fundHead = (row['Fund Head'] || row['FUND HEAD'] || 'University General Fund').toString().trim();
            const category = (row['Category'] || row['Expense Category'] || 'Academic').toString().trim();
            const vendor = (row['Vendor'] || row['VENDOR'] || 'General Supplier').toString().trim();
            const paymentMode = (row['Payment Mode'] || row['PAYMENT MODE'] || 'Bank Transfer').toString().trim();
            const status = (row['STATUS'] || row['Status'] || 'COMPLETED').toString().trim().toUpperCase() as any;

            if (!nsNumber) {
              invalidRows.push({ row: rowNum, data: row, error: 'Note Sheet Number is required.' });
              return;
            }

            if (!subject) {
              invalidRows.push({ row: rowNum, data: row, error: 'Subject is required.' });
              return;
            }

            const balance = received - spent;
            const utilization = received > 0 ? Number(((spent / received) * 100).toFixed(2)) : 0;

            const record: NoteSheetFinancialRecord = {
              id: `nsf-import-${Date.now()}-${idx}`,
              noteSheetNumber: nsNumber,
              date,
              department,
              subject,
              creator,
              fundHead,
              budget,
              received,
              spent,
              balance,
              utilization,
              expenseCategory: category,
              vendor,
              paymentMode,
              status: ['COMPLETED', 'IN_PROGRESS', 'PENDING', 'APPROVED', 'SETTLED', 'CANCELLED'].includes(status) ? status : 'COMPLETED',
              remarks: 'Imported via Excel Batch Upload',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            validRows.push(record);
          });

          resolve({
            success: invalidRows.length === 0,
            validRows,
            invalidRows,
            totalRows: rawRows.length
          });
        } catch (err: any) {
          resolve({
            success: false,
            validRows: [],
            invalidRows: [{ row: 0, data: null, error: `File parse error: ${err.message}` }],
            totalRows: 0
          });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  public commitImport(validRows: NoteSheetFinancialRecord[], actorUser?: any): number {
    this.init();
    let count = 0;
    validRows.forEach(row => {
      const idx = this.records.findIndex(r => r.noteSheetNumber === row.noteSheetNumber);
      if (idx >= 0) {
        this.records[idx] = { ...this.records[idx], ...row, updatedAt: new Date().toISOString() };
      } else {
        this.records.unshift(row);
      }
      count++;
    });

    this.logAudit({
      recordId: 'BATCH-IMPORT',
      noteSheetNumber: `BATCH (${count} records)`,
      action: 'IMPORT',
      user: actorUser?.name || 'Authorized Officer',
      role: actorUser?.role || 'FINANCE_ADMIN',
      details: `Batch imported ${count} financial record(s) via Excel upload`
    });

    this.persist();
    return count;
  }

  // ─── EXCEL / CSV EXPORT WITH OFFICIAL UNIVERSITY STYLING ───
  public async exportFinancialsToExcel(records: NoteSheetFinancialRecord[], filterSummary?: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Swarrnim Startup & Innovation University';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Note Sheet Financials', {
      views: [{ state: 'frozen', ySplit: 6 }]
    });

    // 1. Header Banner
    ws.mergeCells('A1:K1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:K2');
    const subCell = ws.getCell('A2');
    subCell.value = 'UNIVERSITY NOTESHEET MANAGEMENT SYSTEM — FINANCIAL & FUND ACCOUNTS REPORT';
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2C59' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Metadata
    ws.getCell('A4').value = 'Total Records:';
    ws.getCell('A4').font = { bold: true };
    ws.getCell('B4').value = records.length;

    ws.getCell('D4').value = 'Generated On:';
    ws.getCell('D4').font = { bold: true };
    ws.getCell('E4').value = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    ws.getCell('G4').value = 'Filter Scope:';
    ws.getCell('G4').font = { bold: true };
    ws.getCell('H4').value = filterSummary || 'All Applied Filters';

    // Headers
    const headers = [
      'NOTE SHEET NO.', 'DATE', 'DEPARTMENT', 'SUBJECT', 'CREATOR',
      'BUDGET (₹)', 'RECEIVED (₹)', 'SPENT (₹)', 'BALANCE (₹)', 'UTILIZATION', 'STATUS'
    ];

    ws.getRow(6).values = headers;
    ws.getRow(6).height = 26;
    ws.getRow(6).eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = {
        horizontal: [1, 2, 10, 11].includes(colNum) ? 'center' : ([6, 7, 8, 9].includes(colNum) ? 'right' : 'left'),
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    let totalBudget = 0;
    let totalReceived = 0;
    let totalSpent = 0;
    let totalBalance = 0;

    records.forEach(r => {
      totalBudget += r.budget;
      totalReceived += r.received;
      totalSpent += r.spent;
      totalBalance += r.balance;

      const row = ws.addRow([
        r.noteSheetNumber,
        r.date,
        r.department,
        r.subject,
        r.creator,
        r.budget,
        r.received,
        r.spent,
        r.balance,
        `${r.utilization.toFixed(2)}%`,
        r.status
      ]);

      row.height = 22;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if ([1, 2, 10, 11].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if ([6, 7, 8, 9].includes(colNum)) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        }
      });
    });

    // Summary Total Row
    const overallUtil = totalReceived > 0 ? ((totalSpent / totalReceived) * 100).toFixed(2) : '0.00';
    const totalRow = ws.addRow([
      'TOTAL', '', '', `Total Records: ${records.length}`, '',
      totalBudget, totalReceived, totalSpent, totalBalance, `${overallUtil}%`, ''
    ]);

    totalRow.height = 25;
    totalRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF001F3F' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF001F3F' } },
        bottom: { style: 'double', color: { argb: 'FF001F3F' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
      if ([6, 7, 8, 9].includes(colNum)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else if ([1, 10].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    ws.columns = [
      { width: 22 }, // Note Sheet No
      { width: 14 }, // Date
      { width: 24 }, // Department
      { width: 42 }, // Subject
      { width: 22 }, // Creator
      { width: 16 }, // Budget
      { width: 16 }, // Received
      { width: 16 }, // Spent
      { width: 16 }, // Balance
      { width: 15 }, // Utilization
      { width: 16 }  // Status
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SSIU_Notesheet_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

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

  public exportFinancialsToCSV(records: NoteSheetFinancialRecord[]): void {
    const headers = [
      'NOTE SHEET NO.', 'DATE', 'DEPARTMENT', 'SUBJECT', 'CREATOR',
      'BUDGET (INR)', 'RECEIVED (INR)', 'SPENT (INR)', 'BALANCE (INR)', 'UTILIZATION %', 'STATUS'
    ];

    const rows = records.map(r => [
      `"${r.noteSheetNumber}"`,
      r.date,
      `"${r.department}"`,
      `"${r.subject.replace(/"/g, '""')}"`,
      `"${r.creator}"`,
      r.budget,
      r.received,
      r.spent,
      r.balance,
      `"${r.utilization.toFixed(2)}%"`,
      r.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `SSIU_Notesheet_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;

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

  public downloadImportTemplate(): void {
    const sampleRows = [
      {
        'NOTE SHEET NO.': 'SSIU-NS-2026-0004',
        'DATE': '2026-08-20',
        'DEPARTMENT': 'Computer Engineering',
        'SUBJECT': 'Cyber Security Center of Excellence Workshop & Lab Setup',
        'CREATOR': 'Dr. Rajesh Patel',
        'BUDGET (₹)': 120000,
        'RECEIVED (₹)': 120000,
        'SPENT (₹)': 45000,
        'Fund Head': 'University General Fund',
        'Category': 'Academic',
        'Vendor': 'CyberSec Infotech',
        'Payment Mode': 'Bank Transfer',
        'STATUS': 'COMPLETED'
      },
      {
        'NOTE SHEET NO.': 'SSIU-NS-2026-0005',
        'DATE': '2026-08-22',
        'DEPARTMENT': 'Information Technology',
        'SUBJECT': 'Annual Faculty Development Program on Generative AI',
        'CREATOR': 'Prof. Ananya Shah',
        'BUDGET (₹)': 60000,
        'RECEIVED (₹)': 60000,
        'SPENT (₹)': 38000,
        'Fund Head': 'Research Fund',
        'Category': 'Academic',
        'Vendor': 'AI Learning Hub',
        'Payment Mode': 'UPI',
        'STATUS': 'COMPLETED'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial_Import_Template');

    worksheet['!cols'] = [22, 14, 24, 45, 20, 16, 16, 16, 24, 18, 22, 18, 16].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, 'SSIU_Notesheet_Financial_Import_Template.xlsx');
  }
}

export const notesheetFinancialReportService = new NotesheetFinancialReportService();
