import * as XLSX from 'xlsx';
import { db } from './db';
import { NoteSheet, NoteSheetPriority, NoteSheetVisibility, User } from '../types';

export interface NotesheetImportRow {
  Institute_Code: string;
  Department: string;
  Notesheet_Type: string;
  Subject: string;
  Priority?: string;
  Visibility?: string;
  Proposal: string;
  Purpose_Justification: string;
  Financial_Requirement_YN?: string;
  Estimated_Cost?: number | string;
  Budget_Head?: string;
  Expense_Category?: string;
  Required_By_Date?: string;
}

export interface NotesheetImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: { row: number; field: string; message: string }[];
  importedNotesheets: NoteSheet[];
}

export const NOTESHEET_TYPES_LIST = [
  'Academic',
  'Examination',
  'Student Affairs',
  'Faculty & Staff',
  'Department Administration',
  'Attendance',
  'Admission',
  'Scholarship',
  'Student Support',
  'Research & Innovation',
  'Training & Placement',
  'Event / Activity',
  'Discipline & Student Conduct',
  'Academic Infrastructure',
  'IT / Digital Services',
  'Library',
  'Hostel',
  'Transport',
  'Sports',
  'Purchase',
  'Administration',
  'Legal / Compliance',
  'University Committee',
  'General / Other'
] as const;

export type UniversityNoteSheetType = typeof NOTESHEET_TYPES_LIST[number];

export class NotesheetImportService {
  /**
   * Generates and triggers download of official Notesheet Import Template.xlsx
   */
  public downloadImportTemplate(): void {
    const wb = XLSX.utils.book_new();

    // 1. Template Data Sheet
    const sampleRows: NotesheetImportRow[] = [
      {
        Institute_Code: 'SIT',
        Department: 'CSE',
        Notesheet_Type: 'Academic',
        Subject: 'Procurement of High-End GPU Workstations for AI/ML Lab',
        Priority: 'URGENT',
        Visibility: 'NORMAL',
        Proposal: 'Proposal to acquire 10 units of NVIDIA RTX workstations for AI Research Center.',
        Purpose_Justification: 'Required for advanced machine learning research and student semester projects.',
        Financial_Requirement_YN: 'YES',
        Estimated_Cost: 750000,
        Budget_Head: 'Department Academic & Lab Fund',
        Expense_Category: 'RESEARCH_EQUIPMENT',
        Required_By_Date: '2026-09-15'
      },
      {
        Institute_Code: 'SID',
        Department: 'DESIGN',
        Notesheet_Type: 'Event',
        Subject: 'Annual National Design Expo 2026 Sponsorship & Materials',
        Priority: 'IMPORTANT',
        Visibility: 'NORMAL',
        Proposal: 'Organization of national level design exhibition for architecture and fashion students.',
        Purpose_Justification: 'Industry collaboration and placement exposure for graduating batches.',
        Financial_Requirement_YN: 'YES',
        Estimated_Cost: 120000,
        Budget_Head: 'Student Activity & Cultural Fund',
        Expense_Category: 'EVENT',
        Required_By_Date: '2026-09-30'
      },
      {
        Institute_Code: 'SIT',
        Department: 'ADMIN',
        Notesheet_Type: 'Administrative',
        Subject: 'Approval for Revised Campus Wi-Fi Usage Policy 2026-27',
        Priority: 'NORMAL',
        Visibility: 'NORMAL',
        Proposal: 'Formulation and university-wide rollout of student cyber security and bandwidth allocation guidelines.',
        Purpose_Justification: 'Ensures compliance with national cyber safety norms.',
        Financial_Requirement_YN: 'NO',
        Estimated_Cost: 0,
        Budget_Head: '',
        Expense_Category: '',
        Required_By_Date: '2026-09-01'
      }
    ];

    const wsTemplate = XLSX.utils.json_to_sheet(sampleRows);
    wsTemplate['!cols'] = [
      { wch: 16 }, // Institute_Code
      { wch: 18 }, // Department
      { wch: 20 }, // Notesheet_Type
      { wch: 45 }, // Subject
      { wch: 14 }, // Priority
      { wch: 16 }, // Visibility
      { wch: 50 }, // Proposal
      { wch: 50 }, // Purpose_Justification
      { wch: 24 }, // Financial_Requirement_YN
      { wch: 16 }, // Estimated_Cost
      { wch: 32 }, // Budget_Head
      { wch: 24 }, // Expense_Category
      { wch: 18 }  // Required_By_Date
    ];
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Notesheet_Data_Template');

    // 2. Reference Institutes Sheet
    const institutes = db.getInstitutes().map(i => ({
      Institute_Code: i.code,
      Institute_Name: i.name,
      Institute_ID: i.id
    }));
    const wsInst = XLSX.utils.json_to_sheet(institutes);
    wsInst['!cols'] = [{ wch: 16 }, { wch: 45 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Reference_Institutes');

    // 3. Reference Types & Categories Sheet
    const typeRefData = NOTESHEET_TYPES_LIST.map(t => ({
      Allowed_Notesheet_Type: t
    }));
    const wsTypes = XLSX.utils.json_to_sheet(typeRefData);
    wsTypes['!cols'] = [{ wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsTypes, 'Reference_Types');

    // 4. Instructions Sheet
    const instructions = [
      { Rule: '1. File Format', Detail: 'Only Excel (.xlsx) files are accepted. Do not convert to CSV.' },
      { Rule: '2. Institute Code', Detail: 'Must match an existing Institute Code from "Reference_Institutes" (e.g. SIT, SID, SOE, SAL, SHS, SSH, SCS, SAMS, SBAS, SBM, SSUP).' },
      { Rule: '3. Notesheet Type', Detail: 'Must match one of the standard types in "Reference_Types" sheet.' },
      { Rule: '4. Priority Options', Detail: 'NORMAL, IMPORTANT, URGENT, IMMEDIATE' },
      { Rule: '5. Visibility Options', Detail: 'NORMAL, CONFIDENTIAL, HIGHLY_CONFIDENTIAL' },
      { Rule: '6. Financial Notesheet', Detail: 'If Financial_Requirement_YN is YES, Estimated_Cost and Budget_Head are recommended.' },
      { Rule: '7. Notesheet Numbering', Detail: 'Do NOT provide Notesheet numbers. Numbers are auto-generated atomically per Institute on submission.' }
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    XLSX.writeFile(wb, 'Notesheet_Import_Template.xlsx');
  }

  /**
   * Parses uploaded Excel file, validates against database masters, and creates draft Notesheets
   */
  public async parseAndImportNotesheets(file: File, user: User, asDraft: boolean = true): Promise<NotesheetImportResult> {
    const dataBuffer = await file.arrayBuffer();
    const wb = XLSX.read(dataBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const result: NotesheetImportResult = {
      success: true,
      totalRows: rawRows.length,
      importedCount: 0,
      errors: [],
      importedNotesheets: []
    };

    if (rawRows.length === 0) {
      result.success = false;
      result.errors.push({ row: 0, field: 'File', message: 'The uploaded Excel file contains no data rows.' });
      return result;
    }

    const institutes = db.getInstitutes();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // 1-indexed row in Excel
      const r = rawRows[i];

      const instCode = String(r.Institute_Code || '').trim().toUpperCase();
      const dept = String(r.Department || '').trim().toUpperCase();
      const type = String(r.Notesheet_Type || 'Administrative').trim();
      const subject = String(r.Subject || '').trim();
      const proposal = String(r.Proposal || '').trim();
      const purpose = String(r.Purpose_Justification || '').trim();

      // Validation
      if (!instCode) {
        result.errors.push({ row: rowNum, field: 'Institute_Code', message: 'Institute Code is mandatory.' });
      } else {
        const matchInst = institutes.find(inst => inst.code.toUpperCase() === instCode);
        if (!matchInst) {
          result.errors.push({ row: rowNum, field: 'Institute_Code', message: `Institute Code "${instCode}" does not exist in SSIU Institute Master.` });
        }
      }

      if (!dept) {
        result.errors.push({ row: rowNum, field: 'Department', message: 'Department is mandatory.' });
      }

      if (!subject) {
        result.errors.push({ row: rowNum, field: 'Subject', message: 'Subject is mandatory.' });
      }

      if (!proposal) {
        result.errors.push({ row: rowNum, field: 'Proposal', message: 'Proposal / Proposal description is mandatory.' });
      }

      if (!purpose) {
        result.errors.push({ row: rowNum, field: 'Purpose_Justification', message: 'Purpose / Justification is mandatory.' });
      }
    }

    // If there are validation errors, do not partially import
    if (result.errors.length > 0) {
      result.success = false;
      return result;
    }

    // All rows valid -> create notesheets
    for (const r of rawRows) {
      const instCode = String(r.Institute_Code || '').trim().toUpperCase();
      const matchInst = institutes.find(inst => inst.code.toUpperCase() === instCode) || institutes[0];
      const dept = String(r.Department || '').trim().toUpperCase();
      const type = String(r.Notesheet_Type || 'Administrative').trim();
      const subject = String(r.Subject || '').trim();
      const priorityRaw = String(r.Priority || 'NORMAL').trim().toUpperCase() as NoteSheetPriority;
      const priority: NoteSheetPriority = ['NORMAL', 'IMPORTANT', 'URGENT', 'IMMEDIATE'].includes(priorityRaw) ? priorityRaw : 'NORMAL';
      const visibilityRaw = String(r.Visibility || 'NORMAL').trim().toUpperCase() as NoteSheetVisibility;
      const visibility: NoteSheetVisibility = ['NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'].includes(visibilityRaw) ? visibilityRaw : 'NORMAL';
      const proposal = String(r.Proposal || '').trim();
      const purpose = String(r.Purpose_Justification || '').trim();
      const isFin = String(r.Financial_Requirement_YN || '').trim().toUpperCase() === 'YES';
      const cost = Number(r.Estimated_Cost) || 0;
      const budgetHead = String(r.Budget_Head || '').trim();
      const expenseCategory = String(r.Expense_Category || '').trim();
      const requiredDate = r.Required_By_Date ? String(r.Required_By_Date).trim() : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const newNote = db.createNoteSheet({
        instituteId: matchInst.id,
        instituteCode: matchInst.code,
        instituteName: matchInst.name,
        department: dept,
        departmentId: dept,
        departmentName: dept,
        notesheetType: type,
        category: type,
        subject,
        title: subject,
        priority,
        visibility,
        proposal,
        purposeJustification: purpose,
        financialRequirement: isFin,
        budgetRequired: isFin,
        estimatedCost: cost,
        requestedAmount: cost,
        budgetHead: isFin ? budgetHead : undefined,
        expenseCategory: isFin ? expenseCategory : undefined,
        requiredDate
      }, user, asDraft);

      result.importedNotesheets.push(newNote);
      result.importedCount++;
    }

    result.success = true;
    return result;
  }
}

export const notesheetImportService = new NotesheetImportService();
