import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // ─── MASTER DATA OPERATIONS ───────────────────────────────────────────────

  async getAllMasterDocuments(params?: {
    category?: string;
    subcategory?: string;
    studentType?: string;
    required?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (params?.category && params.category !== 'ALL') {
      where.category = params.category;
    }
    if (params?.subcategory && params.subcategory !== 'ALL') {
      where.subcategory = params.subcategory;
    }
    if (params?.studentType && params.studentType !== 'ALL') {
      where.OR = [
        { studentType: 'ALL' },
        { studentType: params.studentType }
      ];
    }
    if (params?.required && params.required !== 'ALL') {
      where.required = params.required;
    }
    if (params?.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params?.search) {
      const q = params.search;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    return this.prisma.documentMaster.findMany({
      where,
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getMasterDocumentById(id: string) {
    const doc = await this.prisma.documentMaster.findUnique({
      where: { id },
      include: { applicabilities: true }
    });
    if (!doc) {
      throw new NotFoundException(`Document master not found for ID ${id}`);
    }
    return doc;
  }

  async createMasterDocument(data: any) {
    const allowed = Array.isArray(data.allowedFileTypes) 
      ? data.allowedFileTypes.join(',').toUpperCase() 
      : (data.allowedFileTypes || 'PDF,JPG,JPEG,PNG');

    return this.prisma.documentMaster.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || null,
        description: data.description || null,
        required: data.required || 'REQUIRED',
        studentType: data.studentType || (data.category === 'INTERNATIONAL_STUDENT' ? 'INTERNATIONAL' : 'ALL'),
        programId: data.programId || null,
        departmentId: data.departmentId || null,
        admissionType: data.admissionType || null,
        semester: data.semester ? Number(data.semester) : null,
        internationalOnly: data.internationalOnly !== undefined ? Boolean(data.internationalOnly) : (data.category === 'INTERNATIONAL_STUDENT'),
        verificationRequired: data.verificationRequired !== undefined ? Boolean(data.verificationRequired) : true,
        verifiedByRole: data.verifiedByRole || 'FACULTY_MENTOR',
        allowedFileTypes: allowed,
        maxFileSize: data.maxFileSize ? Number(data.maxFileSize) : 10,
        multipleFilesAllowed: Boolean(data.multipleFilesAllowed),
        expiryRequired: Boolean(data.expiryRequired),
        displayOrder: data.displayOrder ? Number(data.displayOrder) : 999,
        status: data.status || 'ACTIVE'
      }
    });
  }

  async updateMasterDocument(id: string, data: any) {
    await this.getMasterDocumentById(id);
    const updatePayload = { ...data, updatedAt: new Date() };
    if (Array.isArray(updatePayload.allowedFileTypes)) {
      updatePayload.allowedFileTypes = updatePayload.allowedFileTypes.join(',').toUpperCase();
    }
    return this.prisma.documentMaster.update({
      where: { id },
      data: updatePayload
    });
  }

  // ─── APPLICABILITY ENGINE FOR STUDENTS ────────────────────────────────────

  async getApplicableDocumentsForStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { batch: true }
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const anyStudent: any = student;
    const isInternational = anyStudent.studentType === 'INTERNATIONAL' || 
      (anyStudent.nationality && anyStudent.nationality.toUpperCase() !== 'INDIAN');

    const allMasters = await this.prisma.documentMaster.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' }
    });

    const applicableMasters = allMasters.filter(master => {
      if (master.internationalOnly && !isInternational) return false;
      if (master.studentType === 'INTERNATIONAL' && !isInternational) return false;
      if (master.studentType === 'DOMESTIC' && isInternational) return false;
      if (master.programId && master.programId !== student.batch?.programId) return false;
      if (master.departmentId && master.departmentId !== student.departmentId) return false;
      return true;
    });

    const uploadedDocs = await this.prisma.studentAcademicDocument.findMany({
      where: { studentId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    const now = new Date();

    return applicableMasters.map(masterDoc => {
      const uploadedDoc = uploadedDocs.find(u => u.documentMasterId === masterDoc.id || u.documentCode === masterDoc.code);
      let isExpired = false;
      let isExpiringSoon = false;

      if (uploadedDoc && uploadedDoc.expiryDate) {
        const exp = new Date(uploadedDoc.expiryDate);
        if (exp.getTime() < now.getTime()) {
          isExpired = true;
        } else {
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            isExpiringSoon = true;
          }
        }
      }

      let status = 'NOT_UPLOADED';
      if (uploadedDoc) {
        status = isExpired ? 'EXPIRED' : uploadedDoc.status;
      }

      return {
        masterDoc,
        uploadedDoc,
        status,
        isLocked: uploadedDoc ? (uploadedDoc.isLocked || uploadedDoc.status === 'VERIFIED') : false,
        isExpired,
        isExpiringSoon,
        versions: uploadedDoc ? uploadedDoc.versions : []
      };
    });
  }

  // ─── STUDENT UPLOAD & VERSIONING WORKFLOW ──────────────────────────────────

  async uploadStudentDocument(params: {
    studentId: string;
    documentMasterId: string;
    fileName: string;
    fileSize: string;
    fileUrl: string;
    fileType?: string;
    issueDate?: string;
    expiryDate?: string;
    remarks?: string;
    uploadedByUserId: string;
    uploadedByName: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { id: params.studentId }
    });
    if (!student) {
      throw new NotFoundException(`Student ${params.studentId} not found`);
    }

    const master = await this.getMasterDocumentById(params.documentMasterId);

    const existing = await this.prisma.studentAcademicDocument.findFirst({
      where: {
        studentId: params.studentId,
        documentMasterId: params.documentMasterId
      }
    });

    if (existing && (existing.isLocked || existing.status === 'VERIFIED')) {
      throw new ForbiddenException('This document is VERIFIED and LOCKED. Modification or replacement is not permitted.');
    }

    const nextVersion = existing ? existing.currentVersion + 1 : 1;
    const anyStudent: any = student;

    // Execute atomic transaction: archive previous version & update/create current document
    return this.prisma.$transaction(async (tx) => {
      let docRecord: any;

      if (existing) {
        // 1. Archive previous version
        await tx.studentAcademicDocumentVersion.create({
          data: {
            documentId: existing.id,
            versionNumber: existing.currentVersion,
            fileName: existing.fileName,
            fileSize: existing.fileSize,
            fileUrl: existing.fileUrl,
            fileType: existing.fileType,
            issueDate: existing.issueDate,
            expiryDate: existing.expiryDate,
            uploadedByUserId: params.uploadedByUserId,
            uploadedByName: params.uploadedByName,
            status: existing.status,
            rejectionReason: existing.rejectionReason,
            remarks: existing.remarks
          }
        });

        // 2. Update to new version
        docRecord = await tx.studentAcademicDocument.update({
          where: { id: existing.id },
          data: {
            currentVersion: nextVersion,
            fileName: params.fileName,
            fileSize: params.fileSize,
            fileUrl: params.fileUrl,
            fileType: params.fileType || 'application/pdf',
            issueDate: params.issueDate ? new Date(params.issueDate) : null,
            expiryDate: params.expiryDate ? new Date(params.expiryDate) : null,
            status: 'PENDING_VERIFICATION',
            isLocked: false,
            rejectionReason: null,
            remarks: params.remarks || null,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new document
        docRecord = await tx.studentAcademicDocument.create({
          data: {
            studentId: params.studentId,
            enrollmentNo: student.enrollmentNo,
            studentName: `${student.firstName} ${student.lastName}`,
            documentMasterId: master.id,
            documentCode: master.code,
            documentName: master.name,
            category: master.category,
            subcategory: master.subcategory,
            studentType: anyStudent.studentType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'DOMESTIC',
            currentVersion: 1,
            fileName: params.fileName,
            fileSize: params.fileSize,
            fileUrl: params.fileUrl,
            fileType: params.fileType || 'application/pdf',
            issueDate: params.issueDate ? new Date(params.issueDate) : null,
            expiryDate: params.expiryDate ? new Date(params.expiryDate) : null,
            status: 'PENDING_VERIFICATION',
            isLocked: false,
            remarks: params.remarks || null
          }
        });
      }

      return docRecord;
    });
  }

  // ─── VERIFICATION & LOCK WORKFLOW ─────────────────────────────────────────

  async verifyDocument(params: {
    documentId: string;
    verifierUserId: string;
    verifierName: string;
    verifierRole: string;
    remarks?: string;
  }) {
    const doc = await this.prisma.studentAcademicDocument.findUnique({
      where: { id: params.documentId }
    });
    if (!doc) {
      throw new NotFoundException(`Document ${params.documentId} not found`);
    }

    const previousStatus = doc.status;

    return this.prisma.$transaction(async (tx) => {
      const verified = await tx.studentAcademicDocument.update({
        where: { id: params.documentId },
        data: {
          status: 'VERIFIED',
          isLocked: true, // Permanent lock enforced
          verifiedByUserId: params.verifierUserId,
          verifiedByName: params.verifierName,
          verifiedByRole: params.verifierRole,
          verifiedAt: new Date(),
          remarks: params.remarks || doc.remarks,
          rejectionReason: null,
          updatedAt: new Date()
        }
      });

      await tx.documentVerification.create({
        data: {
          documentId: doc.id,
          action: 'VERIFIED',
          performedByUserId: params.verifierUserId,
          performedByName: params.verifierName,
          performedByRole: params.verifierRole,
          reason: params.remarks || null,
          previousStatus,
          newStatus: 'VERIFIED'
        }
      });

      return verified;
    });
  }

  async rejectDocument(params: {
    documentId: string;
    verifierUserId: string;
    verifierName: string;
    verifierRole: string;
    rejectionReason: string;
    remarks?: string;
  }) {
    if (!params.rejectionReason || params.rejectionReason.trim() === '') {
      throw new BadRequestException('A mandatory rejection reason is required.');
    }

    const doc = await this.prisma.studentAcademicDocument.findUnique({
      where: { id: params.documentId }
    });
    if (!doc) {
      throw new NotFoundException(`Document ${params.documentId} not found`);
    }

    const previousStatus = doc.status;

    return this.prisma.$transaction(async (tx) => {
      const rejected = await tx.studentAcademicDocument.update({
        where: { id: params.documentId },
        data: {
          status: 'REJECTED',
          isLocked: false, // Unlocked for student to re-upload new version
          rejectionReason: params.rejectionReason.trim(),
          verifiedByUserId: params.verifierUserId,
          verifiedByName: params.verifierName,
          verifiedByRole: params.verifierRole,
          verifiedAt: new Date(),
          remarks: params.remarks || doc.remarks,
          updatedAt: new Date()
        }
      });

      await tx.documentVerification.create({
        data: {
          documentId: doc.id,
          action: 'REJECTED',
          performedByUserId: params.verifierUserId,
          performedByName: params.verifierName,
          performedByRole: params.verifierRole,
          reason: params.rejectionReason.trim(),
          previousStatus,
          newStatus: 'REJECTED'
        }
      });

      return rejected;
    });
  }
}
