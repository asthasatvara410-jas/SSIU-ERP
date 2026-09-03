import { db } from './db';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  DocumentCategory,
  DocumentFilterOptions,
  DocumentMasterItem,
  DocumentRequirementType,
  DocumentVerificationLogItem,
  StudentAcademicDocumentItem,
  StudentDocumentVersionItem
} from '../types/documentMaster';
import { INITIAL_DOCUMENT_MASTER_DATA } from '../data/initialDocumentMaster';
import { Student } from '../types';

class DocumentMasterService {
  // ─── MASTER DATA OPERATIONS ───────────────────────────────────────────────

  public getAllMasterDocuments(filters?: DocumentFilterOptions): DocumentMasterItem[] {
    let docs = db.getDocumentMasters();
    if (!docs || docs.length === 0) {
      docs = INITIAL_DOCUMENT_MASTER_DATA;
    }

    if (!filters) return docs.sort((a, b) => a.displayOrder - b.displayOrder);

    return docs.filter(doc => {
      if (filters.category && filters.category !== 'ALL' && doc.category !== filters.category) {
        return false;
      }
      if (filters.subcategory && doc.subcategory !== filters.subcategory) {
        return false;
      }
      if (filters.studentType && filters.studentType !== 'ALL' && doc.studentType !== 'ALL' && doc.studentType !== filters.studentType) {
        return false;
      }
      if (filters.required && filters.required !== 'ALL' && doc.required !== filters.required) {
        return false;
      }
      if (filters.internationalOnly !== undefined && doc.internationalOnly !== filters.internationalOnly) {
        return false;
      }
      if (filters.status && filters.status !== 'ALL' && doc.status !== filters.status) {
        return false;
      }
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesCode = doc.code.toLowerCase().includes(q);
        const matchesCategory = doc.category.toLowerCase().includes(q);
        const matchesSubcategory = doc.subcategory ? doc.subcategory.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesCategory && !matchesSubcategory) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getMasterDocumentById(id: string): DocumentMasterItem | undefined {
    const list = db.getDocumentMasters();
    return list.find(d => d.id === id || d.code === id);
  }

  public saveMasterDocument(doc: Partial<DocumentMasterItem> & { name: string; category: DocumentCategory }): DocumentMasterItem {
    const existing = doc.id ? this.getMasterDocumentById(doc.id) : undefined;
    const now = new Date().toISOString();

    const newDoc: DocumentMasterItem = {
      id: doc.id || `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      code: doc.code || this.generateDocumentCode(doc.category),
      name: doc.name,
      category: doc.category,
      subcategory: doc.subcategory,
      description: doc.description || '',
      required: doc.required || 'REQUIRED',
      studentType: doc.studentType || (doc.category === 'INTERNATIONAL_STUDENT' ? 'INTERNATIONAL' : 'ALL'),
      programId: doc.programId,
      departmentId: doc.departmentId,
      admissionType: doc.admissionType,
      semester: doc.semester,
      internationalOnly: doc.internationalOnly !== undefined ? doc.internationalOnly : (doc.category === 'INTERNATIONAL_STUDENT' || doc.studentType === 'INTERNATIONAL'),
      verificationRequired: doc.verificationRequired !== undefined ? doc.verificationRequired : true,
      verifiedByRole: doc.verifiedByRole || 'FACULTY_MENTOR',
      allowedFileTypes: doc.allowedFileTypes || ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSize: doc.maxFileSize || 10,
      multipleFilesAllowed: doc.multipleFilesAllowed || false,
      expiryRequired: doc.expiryRequired || false,
      displayOrder: doc.displayOrder || (existing ? existing.displayOrder : 999),
      status: doc.status || 'ACTIVE',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    db.saveDocumentMaster(newDoc);
    return newDoc;
  }

  public toggleMasterDocumentStatus(id: string): DocumentMasterItem | null {
    const doc = this.getMasterDocumentById(id);
    if (!doc) return null;
    const newStatus = doc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = { ...doc, status: newStatus as 'ACTIVE' | 'INACTIVE', updatedAt: new Date().toISOString() };
    db.saveDocumentMaster(updated);
    return updated;
  }

  private generateDocumentCode(category: DocumentCategory): string {
    const prefixMap: Record<DocumentCategory, string> = {
      ACADEMIC: 'DOC-ACA',
      IDENTITY: 'DOC-ID',
      ADMISSION: 'DOC-ADM',
      UNIVERSITY_RECORD: 'DOC-UNI',
      COMPLETION_EXIT: 'DOC-EXT',
      FINANCIAL_SCHOLARSHIP: 'DOC-FIN',
      INTERNATIONAL_STUDENT: 'DOC-INTL',
      INTERNSHIP_TRAINING: 'DOC-INT',
      MEDICAL: 'DOC-MED',
      OTHER: 'DOC-OTH'
    };

    const prefix = prefixMap[category] || 'DOC-GEN';
    const allDocs = db.getDocumentMasters();
    const count = allDocs.filter(d => d.code.startsWith(prefix)).length + 1;
    return `${prefix}-${String(count).padStart(3, '0')}`;
  }

  // ─── APPLICABILITY ENGINE FOR STUDENTS ────────────────────────────────────

  public getApplicableDocumentsForStudent(student: Student): {
    masterDoc: DocumentMasterItem;
    uploadedDoc?: StudentAcademicDocumentItem;
    status: 'NOT_UPLOADED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REUPLOAD_REQUIRED' | 'EXPIRED';
    isLocked: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    versions: StudentDocumentVersionItem[];
  }[] {
    const allMasters = this.getAllMasterDocuments({ status: 'ACTIVE' });
    const studentUploads = db.getStudentAcademicDocumentsByStudentId(student.id);
    const allVersions = db.getStudentDocumentVersions();

    // Determine if student is International
    const isInternational = student.studentType === 'INTERNATIONAL' || 
      (student as any).isInternational === true || 
      (student.nationality && student.nationality.toUpperCase() !== 'INDIAN');

    const applicableMasters = allMasters.filter(master => {
      // 1. Nationality / Student Type Rule
      if (master.internationalOnly && !isInternational) {
        return false; // Domestic students never see international-only docs
      }
      if (master.studentType === 'INTERNATIONAL' && !isInternational) {
        return false;
      }
      if (master.studentType === 'DOMESTIC' && isInternational) {
        return false;
      }

      // 2. Program / Department / Admission Type rules (if specified)
      if (master.programId && master.programId !== student.programId) {
        return false;
      }
      if (master.departmentId && master.departmentId !== student.departmentId) {
        return false;
      }
      if (master.admissionType && (student as any).admissionType && master.admissionType !== (student as any).admissionType) {
        return false;
      }

      return true;
    });

    const now = new Date();

    return applicableMasters.map(masterDoc => {
      const uploadedDoc = studentUploads.find(u => u.documentMasterId === masterDoc.id || u.documentCode === masterDoc.code);
      const versions = allVersions.filter(v => uploadedDoc && v.documentId === uploadedDoc.id).sort((a, b) => b.versionNumber - a.versionNumber);

      let isExpired = false;
      let isExpiringSoon = false;

      if (uploadedDoc && uploadedDoc.expiryDate) {
        const exp = new Date(uploadedDoc.expiryDate);
        if (exp.getTime() < now.getTime()) {
          isExpired = true;
        } else {
          // Check if expiring within 30 days
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            isExpiringSoon = true;
          }
        }
      }

      let computedStatus: 'NOT_UPLOADED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REUPLOAD_REQUIRED' | 'EXPIRED' = 'NOT_UPLOADED';

      if (uploadedDoc) {
        if (isExpired) {
          computedStatus = 'EXPIRED';
        } else {
          computedStatus = uploadedDoc.status as any;
        }
      }

      const isLocked = uploadedDoc ? (uploadedDoc.isLocked || uploadedDoc.status === 'VERIFIED') : false;

      return {
        masterDoc,
        uploadedDoc,
        status: computedStatus,
        isLocked,
        isExpired,
        isExpiringSoon,
        versions
      };
    });
  }

  // ─── STUDENT UPLOAD & VERSIONING WORKFLOW ──────────────────────────────────

  public uploadStudentDocument(params: {
    student: Student;
    documentMasterId: string;
    fileName: string;
    fileSize: string;
    fileUrl: string;
    fileType?: string;
    issueDate?: string;
    expiryDate?: string;
    remarks?: string;
  }): StudentAcademicDocumentItem {
    const master = this.getMasterDocumentById(params.documentMasterId);
    if (!master) {
      throw new Error(`Document Master record not found for id ${params.documentMasterId}`);
    }

    const existingDocs = db.getStudentAcademicDocumentsByStudentId(params.student.id);
    const existing = existingDocs.find(d => d.documentMasterId === master.id || d.documentCode === master.code);

    if (existing && (existing.isLocked || existing.status === 'VERIFIED')) {
      throw new Error('This document is VERIFIED and LOCKED. Modification or replacement is not permitted.');
    }

    const now = new Date().toISOString();
    const newVersionNumber = existing ? existing.currentVersion + 1 : 1;
    const docId = existing ? existing.id : `stu-doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Archive previous version if this is an update / re-upload
    if (existing) {
      const archivedVersion: StudentDocumentVersionItem = {
        id: `ver-${Date.now().toString(36)}-v${existing.currentVersion}`,
        documentId: existing.id,
        versionNumber: existing.currentVersion,
        fileName: existing.fileName,
        fileSize: existing.fileSize,
        fileUrl: existing.fileUrl,
        fileType: existing.fileType,
        issueDate: existing.issueDate,
        expiryDate: existing.expiryDate,
        uploadedByUserId: params.student.id,
        uploadedByName: params.student.name,
        uploadedAt: existing.updatedAt || existing.createdAt,
        status: existing.status === 'VERIFIED' ? 'VERIFIED' : existing.status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED',
        rejectionReason: existing.rejectionReason,
        remarks: existing.remarks
      };
      db.saveStudentDocumentVersion(archivedVersion);
    }

    const updatedDoc: StudentAcademicDocumentItem = {
      id: docId,
      studentId: params.student.id,
      enrollmentNo: params.student.enrollmentNo,
      studentName: params.student.name,
      documentMasterId: master.id,
      documentCode: master.code,
      documentName: master.name,
      category: master.category,
      subcategory: master.subcategory,
      studentType: params.student.studentType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
      currentVersion: newVersionNumber,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileUrl: params.fileUrl,
      fileType: params.fileType || 'application/pdf',
      issueDate: params.issueDate,
      expiryDate: params.expiryDate,
      status: 'PENDING_VERIFICATION',
      isLocked: false,
      rejectionReason: undefined,
      remarks: params.remarks,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    db.saveStudentAcademicDocument(updatedDoc);

    // Notify Mentor & Student
    const mentorAssignment = (db.getState().mentorAssignments || []).find((m: any) => m.studentId === params.student.id && m.status === 'ACTIVE');
    if (mentorAssignment) {
      db.addNotification({
        type: 'ACTION_REQUIRED',
        title: `Document Verification Required: ${master.name}`,
        message: `Student ${params.student.name} (${params.student.enrollmentNo}) uploaded "${master.name}". Please verify and authenticate.`,
        module: 'DOCUMENT',
        targetUserId: mentorAssignment.mentorFacultyId,
        referenceId: updatedDoc.id,
        referenceType: 'STUDENT_DOCUMENT',
        linkTab: 'student-docs',
        priority: 'HIGH'
      });
    }
    db.addNotification({
      type: 'STATUS_UPDATE',
      title: `Document Uploaded: ${master.name}`,
      message: `Your document "${master.name}" (v${newVersionNumber}) has been submitted for verification.`,
      module: 'DOCUMENT',
      targetUserId: params.student.id,
      referenceId: updatedDoc.id,
      referenceType: 'STUDENT_DOCUMENT',
      linkTab: 'student-docs'
    });

    return updatedDoc;
  }

  // ─── VERIFICATION & LOCK WORKFLOW ─────────────────────────────────────────

  public verifyDocument(params: {
    documentId: string;
    verifierUserId: string;
    verifierName: string;
    verifierRole: string;
    remarks?: string;
  }): StudentAcademicDocumentItem {
    const allDocs = db.getStudentAcademicDocuments();
    const doc = allDocs.find(d => d.id === params.documentId);
    if (!doc) {
      throw new Error(`Student document not found: ${params.documentId}`);
    }

    const now = new Date().toISOString();
    const previousStatus = doc.status;

    const verifiedDoc: StudentAcademicDocumentItem = {
      ...doc,
      status: 'VERIFIED',
      isLocked: true, // Permanent lock enforced
      verifiedByUserId: params.verifierUserId,
      verifiedByName: params.verifierName,
      verifiedByRole: params.verifierRole,
      verifiedAt: now,
      remarks: params.remarks || doc.remarks,
      rejectionReason: undefined,
      updatedAt: now
    };

    db.saveStudentAcademicDocument(verifiedDoc);

    // Save verification audit log
    const auditLog: DocumentVerificationLogItem = {
      id: `dver-${Date.now().toString(36)}`,
      documentId: doc.id,
      action: 'VERIFIED',
      performedByUserId: params.verifierUserId,
      performedByName: params.verifierName,
      performedByRole: params.verifierRole,
      reason: params.remarks,
      previousStatus,
      newStatus: 'VERIFIED',
      timestamp: now
    };
    db.saveDocumentVerification(auditLog);

    // Notify Student
    db.addNotification({
      type: 'SUCCESS',
      title: `Document Verified & Locked: ${doc.documentName}`,
      message: `Your document "${doc.documentName}" has been verified and locked by ${params.verifierName}.`,
      module: 'DOCUMENT',
      targetUserId: doc.studentId,
      referenceId: doc.id,
      referenceType: 'STUDENT_DOCUMENT',
      linkTab: 'student-docs'
    });

    return verifiedDoc;
  }

  public rejectDocument(params: {
    documentId: string;
    verifierUserId: string;
    verifierName: string;
    verifierRole: string;
    rejectionReason: string;
    remarks?: string;
  }): StudentAcademicDocumentItem {
    if (!params.rejectionReason || params.rejectionReason.trim() === '') {
      throw new Error('A mandatory rejection reason must be provided.');
    }

    const allDocs = db.getStudentAcademicDocuments();
    const doc = allDocs.find(d => d.id === params.documentId);
    if (!doc) {
      throw new Error(`Student document not found: ${params.documentId}`);
    }

    const now = new Date().toISOString();
    const previousStatus = doc.status;

    const rejectedDoc: StudentAcademicDocumentItem = {
      ...doc,
      status: 'REJECTED',
      isLocked: false, // Unlocked for student to re-upload new version
      rejectionReason: params.rejectionReason,
      verifiedByUserId: params.verifierUserId,
      verifiedByName: params.verifierName,
      verifiedByRole: params.verifierRole,
      verifiedAt: now,
      remarks: params.remarks,
      updatedAt: now
    };

    db.saveStudentAcademicDocument(rejectedDoc);

    // Save verification audit log
    const auditLog: DocumentVerificationLogItem = {
      id: `dver-${Date.now().toString(36)}`,
      documentId: doc.id,
      action: 'REJECTED',
      performedByUserId: params.verifierUserId,
      performedByName: params.verifierName,
      performedByRole: params.verifierRole,
      reason: params.rejectionReason,
      previousStatus,
      newStatus: 'REJECTED',
      timestamp: now
    };
    db.saveDocumentVerification(auditLog);

    // Notify Student
    db.addNotification({
      type: 'REJECTION',
      title: `Document Rejected - Re-upload Required: ${doc.documentName}`,
      message: `Your document "${doc.documentName}" was rejected by ${params.verifierName}. Reason: ${params.rejectionReason}. Please re-upload.`,
      module: 'DOCUMENT',
      targetUserId: doc.studentId,
      referenceId: doc.id,
      referenceType: 'STUDENT_DOCUMENT',
      linkTab: 'student-docs',
      priority: 'HIGH'
    });

    return rejectedDoc;
  }

  // ─── BULK EXPORT & IMPORT (STRICTLY .XLSX ONLY, NO CSV) ───────────────────

  public exportMasterDocumentsToExcel(): void {
    const docs = this.getAllMasterDocuments();

    const data = docs.map(d => ({
      'Document Code': d.code,
      'Document Name': d.name,
      'Category': d.category,
      'Subcategory': d.subcategory || '',
      'Requirement': d.required,
      'Student Type': d.studentType,
      'International Only': d.internationalOnly ? 'YES' : 'NO',
      'Verification Required': d.verificationRequired ? 'YES' : 'NO',
      'Verified By Role': d.verifiedByRole,
      'Allowed File Types': d.allowedFileTypes.join(', '),
      'Max File Size (MB)': d.maxFileSize,
      'Multiple Files Allowed': d.multipleFilesAllowed ? 'YES' : 'NO',
      'Expiry Required': d.expiryRequired ? 'YES' : 'NO',
      'Display Order': d.displayOrder,
      'Status': d.status,
      'Description': d.description || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Document Master');

    // Auto fit columns
    const maxCols = [15, 35, 20, 25, 15, 15, 18, 20, 20, 20, 18, 20, 15, 12, 10, 35];
    worksheet['!cols'] = maxCols.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `SSIU_Document_Master_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  public downloadImportTemplate(): void {
    const templateData = [
      {
        'Document Code': 'DOC-ACA-101',
        'Document Name': 'Sample Academic Certificate',
        'Category': 'ACADEMIC',
        'Subcategory': 'CERTIFICATES',
        'Requirement': 'REQUIRED',
        'Student Type': 'ALL',
        'International Only': 'NO',
        'Verification Required': 'YES',
        'Verified By Role': 'FACULTY_MENTOR',
        'Allowed File Types': 'PDF, JPG, PNG',
        'Max File Size (MB)': 10,
        'Multiple Files Allowed': 'NO',
        'Expiry Required': 'NO',
        'Display Order': 100,
        'Status': 'ACTIVE',
        'Description': 'Official academic certification document'
      },
      {
        'Document Code': 'DOC-INTL-101',
        'Document Name': 'Sample International Embassy Letter',
        'Category': 'INTERNATIONAL_STUDENT',
        'Subcategory': 'UNIVERSITY_COMPLIANCE',
        'Requirement': 'REQUIRED',
        'Student Type': 'INTERNATIONAL',
        'International Only': 'YES',
        'Verification Required': 'YES',
        'Verified By Role': 'STUDENT_SECTION',
        'Allowed File Types': 'PDF',
        'Max File Size (MB)': 10,
        'Multiple Files Allowed': 'NO',
        'Expiry Required': 'YES',
        'Display Order': 101,
        'Status': 'ACTIVE',
        'Description': 'Embassy clearance letter for international admission'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    worksheet['!cols'] = [15, 35, 22, 25, 15, 15, 18, 20, 20, 20, 18, 20, 15, 12, 10, 35].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, 'SSIU_Document_Master_Import_Template.xlsx');
  }

  public parseAndImportExcelFile(file: File): Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    errors: string[];
  }> {
    return new Promise((resolve) => {
      // Strictly check for .xlsx extension
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        resolve({
          success: false,
          importedCount: 0,
          updatedCount: 0,
          errors: ['Invalid file format. Strictly only .xlsx Excel files are supported (CSV is not allowed).']
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          let importedCount = 0;
          let updatedCount = 0;
          const errors: string[] = [];

          rawRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            const code = (row['Document Code'] || row['Code'] || '').toString().trim();
            const name = (row['Document Name'] || row['Name'] || '').toString().trim();
            const category = (row['Category'] || 'OTHER').toString().trim().toUpperCase() as DocumentCategory;
            const subcategory = (row['Subcategory'] || '').toString().trim();
            const requirement = (row['Requirement'] || 'REQUIRED').toString().trim().toUpperCase() as DocumentRequirementType;
            const studentType = (row['Student Type'] || (category === 'INTERNATIONAL_STUDENT' ? 'INTERNATIONAL' : 'ALL')).toString().trim().toUpperCase();
            const intlOnly = (row['International Only'] || '').toString().trim().toUpperCase() === 'YES' || category === 'INTERNATIONAL_STUDENT';
            const verReq = (row['Verification Required'] || 'YES').toString().trim().toUpperCase() !== 'NO';
            const verRole = (row['Verified By Role'] || 'FACULTY_MENTOR').toString().trim().toUpperCase();
            const fileTypesStr = (row['Allowed File Types'] || 'PDF, JPG, PNG').toString();
            const allowedTypes = fileTypesStr.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
            const maxMb = Number(row['Max File Size (MB)']) || 10;
            const multFiles = (row['Multiple Files Allowed'] || 'NO').toString().trim().toUpperCase() === 'YES';
            const expReq = (row['Expiry Required'] || 'NO').toString().trim().toUpperCase() === 'YES';
            const displayOrder = Number(row['Display Order']) || (idx + 1);
            const status = (row['Status'] || 'ACTIVE').toString().trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
            const description = (row['Description'] || '').toString().trim();

            if (!name) {
              errors.push(`Row ${rowNum}: 'Document Name' is missing.`);
              return;
            }

            const existing = code ? this.getMasterDocumentById(code) : undefined;
            const docItem: DocumentMasterItem = {
              id: existing ? existing.id : `doc-${Date.now().toString(36)}-${idx}`,
              code: code || this.generateDocumentCode(category),
              name,
              category,
              subcategory: subcategory || undefined,
              description,
              required: requirement,
              studentType: studentType as any,
              internationalOnly: intlOnly,
              verificationRequired: verReq,
              verifiedByRole: verRole,
              allowedFileTypes: allowedTypes.length > 0 ? allowedTypes : ['pdf', 'jpg', 'jpeg', 'png'],
              maxFileSize: maxMb,
              multipleFilesAllowed: multFiles,
              expiryRequired: expReq,
              displayOrder,
              status,
              createdAt: existing ? existing.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            db.saveDocumentMaster(docItem);
            if (existing) {
              updatedCount++;
            } else {
              importedCount++;
            }
          });

          resolve({
            success: errors.length === 0 || importedCount > 0 || updatedCount > 0,
            importedCount,
            updatedCount,
            errors
          });
        } catch (err: any) {
          resolve({
            success: false,
            importedCount: 0,
            updatedCount: 0,
            errors: [`Failed to parse Excel file: ${err.message}`]
          });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // ─── STUDENT DOCUMENT VERIFICATION GRID HELPERS ──────────────────────────

  public getStudentDocumentMetrics(student: Student) {
    const list = this.getApplicableDocumentsForStudent(student);
    const totalDocs = list.length;
    const requiredDocs = list.filter(item => item.masterDoc.required === 'REQUIRED').length;
    const verifiedDocs = list.filter(item => item.status === 'VERIFIED').length;
    const pendingDocs = list.filter(item => item.status === 'PENDING_VERIFICATION' || item.status === 'REUPLOAD_REQUIRED').length;
    const missingDocs = list.filter(item => item.masterDoc.required === 'REQUIRED' && (item.status === 'NOT_UPLOADED' || item.status === 'REJECTED' || item.status === 'EXPIRED')).length;
    
    let overallStatus: 'COMPLETE' | 'PARTIALLY_COMPLETE' | 'MISSING_DOCUMENTS' | 'NOT_SUBMITTED' = 'NOT_SUBMITTED';
    if (verifiedDocs >= requiredDocs && requiredDocs > 0) {
      overallStatus = 'COMPLETE';
    } else if (verifiedDocs > 0 || pendingDocs > 0) {
      overallStatus = missingDocs > 0 ? 'MISSING_DOCUMENTS' : 'PARTIALLY_COMPLETE';
    } else if (missingDocs > 0) {
      overallStatus = 'MISSING_DOCUMENTS';
    }

    let lastUpdated = (student as any).updatedAt || (student as any).createdAt || '2026-08-20';
    list.forEach(item => {
      if (item.uploadedDoc?.updatedAt && item.uploadedDoc.updatedAt > lastUpdated) {
        lastUpdated = item.uploadedDoc.updatedAt;
      }
      if (item.uploadedDoc?.createdAt && item.uploadedDoc.createdAt > lastUpdated) {
        lastUpdated = item.uploadedDoc.createdAt;
      }
      if (item.uploadedDoc?.verifiedAt && item.uploadedDoc.verifiedAt > lastUpdated) {
        lastUpdated = item.uploadedDoc.verifiedAt;
      }
    });

    return {
      totalDocs,
      requiredDocs,
      verifiedDocs,
      pendingDocs,
      missingDocs,
      overallStatus,
      lastUpdated: lastUpdated.slice(0, 10),
      abcIdStatus: student.abcIdStatus || 'NOT_SUBMITTED'
    };
  }

  public downloadStudentDocumentTemplate(): void {
    const sampleRows = [
      {
        'Student Enrollment No': '230101001',
        'Student Name': 'Jigar Patel',
        'Academic Year': '2026-2027',
        'Semester': 'Semester 4',
        'Document Type': '10th Marksheet',
        'Required': 'REQUIRED',
        'Uploaded': 'YES',
        'Upload Date': '2026-08-15',
        'Verification Status': 'VERIFIED',
        'Verified By': 'Dr. Rajesh Sharma',
        'Verified Date': '2026-08-16',
        'Remarks': 'Original verified against SSC Board marksheet'
      },
      {
        'Student Enrollment No': '230101002',
        'Student Name': 'Rahul Shah',
        'Academic Year': '2026-2027',
        'Semester': 'Semester 4',
        'Document Type': 'Aadhaar Card',
        'Required': 'REQUIRED',
        'Uploaded': 'YES',
        'Upload Date': '2026-08-18',
        'Verification Status': 'PENDING_VERIFICATION',
        'Verified By': '',
        'Verified Date': '',
        'Remarks': 'Awaiting mentor verification'
      },
      {
        'Student Enrollment No': '230101003',
        'Student Name': 'Harsh Parmar',
        'Academic Year': '2026-2027',
        'Semester': 'Semester 4',
        'Document Type': 'Migration Certificate',
        'Required': 'REQUIRED',
        'Uploaded': 'NO',
        'Upload Date': '',
        'Verification Status': 'NOT_UPLOADED',
        'Verified By': '',
        'Verified Date': '',
        'Remarks': 'Original certificate pending from previous board'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Document_Verification_Template');

    worksheet['!cols'] = [22, 24, 16, 14, 25, 14, 12, 14, 22, 22, 14, 35].map(w => ({ wch: w }));
    XLSX.writeFile(workbook, 'SSIU_Student_Document_Verification_Template.xlsx');
  }

  public parseAndImportStudentDocumentsExcel(file: File): Promise<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    errors: Array<{ row: number; enrollment: string; error: string }>;
  }> {
    return new Promise((resolve) => {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        resolve({
          success: false,
          importedCount: 0,
          failedCount: 0,
          errors: [{ row: 0, enrollment: '', error: 'Invalid file format. Strictly only .xlsx Excel files are supported.' }]
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet);

          const allStudents = db.getStudents();
          const studentMap = new Map<string, Student>();
          allStudents.forEach(s => {
            if (s.enrollmentNo) {
              studentMap.set(s.enrollmentNo.trim().toUpperCase(), s);
            }
          });

          const allMasters = this.getAllMasterDocuments();
          const masterMap = new Map<string, DocumentMasterItem>();
          allMasters.forEach(m => {
            masterMap.set(m.name.trim().toLowerCase(), m);
            masterMap.set(m.code.trim().toLowerCase(), m);
          });

          let importedCount = 0;
          let failedCount = 0;
          const errors: Array<{ row: number; enrollment: string; error: string }> = [];

          rawRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            const enroll = (row['Student Enrollment No'] || row['Enrollment No'] || row['EnrollmentNo'] || '').toString().trim().toUpperCase();
            const docTypeName = (row['Document Type'] || row['Document Name'] || '').toString().trim();
            const verStatus = (row['Verification Status'] || 'PENDING_VERIFICATION').toString().trim().toUpperCase();
            const verifiedBy = (row['Verified By'] || '').toString().trim();
            const remarks = (row['Remarks'] || '').toString().trim();

            if (!enroll) {
              failedCount++;
              errors.push({ row: rowNum, enrollment: enroll || 'EMPTY', error: 'Missing Student Enrollment Number.' });
              return;
            }

            const student = studentMap.get(enroll);
            if (!student) {
              failedCount++;
              errors.push({ row: rowNum, enrollment: enroll, error: `Student with enrollment ${enroll} does not exist in Student Master.` });
              return;
            }

            if (!docTypeName) {
              failedCount++;
              errors.push({ row: rowNum, enrollment: enroll, error: 'Document Type / Name is missing.' });
              return;
            }

            const master = masterMap.get(docTypeName.toLowerCase());
            if (!master) {
              failedCount++;
              errors.push({ row: rowNum, enrollment: enroll, error: `Document Type "${docTypeName}" not recognized in Document Master.` });
              return;
            }

            const existingDocs = db.getStudentAcademicDocumentsByStudentId(student.id);
            const existing = existingDocs.find(d => d.documentMasterId === master.id || d.documentCode === master.code);

            const docId = existing ? existing.id : `stu-doc-${Date.now().toString(36)}-${idx}`;
            const statusMapped = verStatus === 'VERIFIED' ? 'VERIFIED' : verStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_VERIFICATION';

            const updatedDoc: StudentAcademicDocumentItem = {
              id: docId,
              studentId: student.id,
              enrollmentNo: student.enrollmentNo,
              studentName: student.name,
              documentMasterId: master.id,
              documentCode: master.code,
              documentName: master.name,
              category: master.category,
              subcategory: master.subcategory,
              studentType: student.studentType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
              currentVersion: existing ? existing.currentVersion : 1,
              fileName: existing?.fileName || `${master.code}_${enroll}.pdf`,
              fileSize: existing?.fileSize || '1.5 MB',
              fileUrl: existing?.fileUrl || '/sample-docs/document.pdf',
              fileType: 'pdf',
              status: statusMapped as any,
              isLocked: statusMapped === 'VERIFIED',
              verifiedByUserId: statusMapped === 'VERIFIED' ? (verifiedBy || 'fac-1') : undefined,
              verifiedByName: statusMapped === 'VERIFIED' ? (verifiedBy || 'Faculty Mentor') : undefined,
              verifiedAt: statusMapped === 'VERIFIED' ? new Date().toISOString() : undefined,
              remarks: remarks || existing?.remarks || 'Imported via Excel Register',
              createdAt: existing ? existing.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            db.saveStudentAcademicDocument(updatedDoc);
            importedCount++;
          });

          resolve({
            success: failedCount === 0,
            importedCount,
            failedCount,
            errors
          });
        } catch (err: any) {
          resolve({
            success: false,
            importedCount: 0,
            failedCount: 0,
            errors: [{ row: 0, enrollment: '', error: `Failed to process Excel file: ${err.message}` }]
          });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  }

  public async exportStudentDocumentRegisterToExcel(
    students: Student[],
    dataset: Array<{ student: Student; metrics: any }>
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Swarrnim Startup & Innovation University';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Student Documents Register', {
      views: [{ state: 'frozen', ySplit: 6 }]
    });

    // University Header Block
    ws.mergeCells('A1:P1');
    const t1 = ws.getCell('A1');
    t1.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    t1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    t1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:P2');
    const t2 = ws.getCell('A2');
    t2.value = 'SSIU ERP — MENTOR WORKSPACE & STUDENT DOCUMENT VERIFICATION REGISTER';
    t2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
    t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2C59' } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Metadata
    ws.getCell('A4').value = 'Total Students:';
    ws.getCell('A4').font = { bold: true };
    ws.getCell('B4').value = dataset.length;

    ws.getCell('D4').value = 'Report Date:';
    ws.getCell('D4').font = { bold: true };
    ws.getCell('E4').value = new Date().toLocaleDateString('en-GB');

    ws.getCell('G4').value = 'Generated By:';
    ws.getCell('G4').font = { bold: true };
    ws.getCell('H4').value = 'Faculty Mentor / Academic Office';

    const headers = [
      'Sr. No.', 'Student Name', 'Enrollment No.', 'Program', 'Department',
      'Academic Year', 'Semester', 'Division', 'ABC ID Status', 'Total Required Docs',
      'Verified', 'Pending Verification', 'Missing Documents', 'Overall Status', 'Last Updated', 'Verification Remarks'
    ];

    ws.getRow(6).values = headers;
    ws.getRow(6).height = 25;
    ws.getRow(6).eachCell(cell => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    dataset.forEach((row, idx) => {
      const st = row.student;
      const m = row.metrics;
      const prog = db.getProgramById(st.programId);
      const dept = db.getDepartmentById(st.departmentId);
      const sem = db.getSemesterById(st.semesterId);
      const div = db.getDivisionById(st.divisionId);

      const r = ws.addRow([
        idx + 1,
        st.name,
        st.enrollmentNo,
        prog?.name || 'B.Tech CSE',
        dept?.name || 'Computer Engineering',
        '2026-2027',
        sem?.number ? `Sem ${sem.number}` : 'Sem 4',
        div?.name || 'Division A',
        st.abcIdStatus || 'NOT_SUBMITTED',
        m.requiredDocs,
        m.verifiedDocs,
        m.pendingDocs,
        m.missingDocs,
        m.overallStatus,
        m.lastUpdated,
        m.missingDocs > 0 ? `${m.missingDocs} Required Document(s) Pending Upload` : 'All Required Credentials Verified'
      ]);

      r.height = 20;
      r.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if ([1, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    ws.columns = [
      { width: 8 },  // Sr
      { width: 22 }, // Name
      { width: 16 }, // Enrollment
      { width: 24 }, // Program
      { width: 24 }, // Dept
      { width: 14 }, // AY
      { width: 10 }, // Sem
      { width: 12 }, // Div
      { width: 16 }, // ABC ID
      { width: 14 }, // Total
      { width: 12 }, // Verified
      { width: 14 }, // Pending
      { width: 14 }, // Missing
      { width: 18 }, // Status
      { width: 14 }, // Last Updated
      { width: 35 }  // Remarks
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SSIU_Student_Document_Verification_Register_${new Date().toISOString().slice(0, 10)}.xlsx`;

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

  public bulkVerifyStudentDocuments(studentIds: string[], actorUser: any): { verifiedCount: number } {
    let verifiedCount = 0;
    const now = new Date().toISOString();

    studentIds.forEach(stId => {
      const docs = db.getStudentAcademicDocumentsByStudentId(stId);
      docs.forEach(doc => {
        if (doc.status === 'PENDING_VERIFICATION' || doc.status === 'REUPLOAD_REQUIRED') {
          doc.status = 'VERIFIED';
          doc.isLocked = true;
          doc.verifiedByUserId = actorUser?.id || 'fac-1';
          doc.verifiedByName = actorUser?.name || 'Faculty Mentor';
          doc.verifiedByRole = actorUser?.role || 'FACULTY_MENTOR';
          doc.verifiedAt = now;
          doc.updatedAt = now;
          db.saveStudentAcademicDocument(doc);
          verifiedCount++;
        }
      });
    });

    return { verifiedCount };
  }

  public bulkRequestMissingDocuments(studentIds: string[], actorUser: any): { requestedCount: number } {
    let requestedCount = 0;

    studentIds.forEach(stId => {
      const student = db.getStudentById(stId);
      if (student) {
        db.addNotification({
          targetUserId: student.id,
          targetRole: 'STUDENT',
          title: 'Required Academic Documents Pending',
          message: `Your Faculty Mentor (${actorUser?.name || 'Mentor'}) has requested upload of missing academic credentials and certificates.`,
          module: 'STUDENT_SECTION',
          type: 'WARNING' as any
        });
        requestedCount++;
      }
    });

    return { requestedCount };
  }
}

export const documentMasterService = new DocumentMasterService();
