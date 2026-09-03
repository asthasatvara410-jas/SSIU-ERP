import { db } from './db';
import { UniversalDocumentRecord, Student, Faculty, UserAuthorizationContext } from '../types';

export interface DossierProfileSummary {
  entityType: 'STUDENT' | 'FACULTY' | 'STAFF';
  entityId: string;
  fullName: string;
  codeOrId: string;
  email: string;
  contact?: string;
  instituteId: string;
  instituteName: string;
  departmentId: string;
  departmentName: string;
  designationOrProgram: string;
  status: string;
  joiningOrAdmissionDate?: string;
  reportingAuthority?: {
    userId?: string;
    name: string;
    role: string;
  };
  completenessPercentage: number;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingVerificationCount: number;
  mandatoryCategoriesCount: number;
  satisfiedMandatoryCount: number;
}

export interface UniversalDossierPayload {
  summary: DossierProfileSummary;
  documentCategories: Array<{
    categoryName: string;
    isMandatory: boolean;
    documents: UniversalDocumentRecord[];
  }>;
  versionHistory: Array<{
    documentId: string;
    fileName: string;
    version: number;
    uploadedAt: string;
    status: string;
  }>;
  recentActivity: Array<{
    action: string;
    timestamp: string;
    performedBy: string;
  }>;
}

class DossierCompletenessService {
  private static instance: DossierCompletenessService;
  private universalDocuments: UniversalDocumentRecord[] = [];

  private constructor() {}

  public static getInstance(): DossierCompletenessService {
    if (!DossierCompletenessService.instance) {
      DossierCompletenessService.instance = new DossierCompletenessService();
    }
    return DossierCompletenessService.instance;
  }

  /**
   * Upload / Add a document version to the universal digital dossier
   */
  public uploadDocument(doc: {
    entityType: UniversalDocumentRecord['entityType'];
    entityId: string;
    documentCategory: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    uploadedByUserId: string;
    uploadedByName: string;
  }): UniversalDocumentRecord {
    // Check if previous version exists
    const previousVersions = this.universalDocuments.filter(
      d => d.entityType === doc.entityType &&
           d.entityId === doc.entityId &&
           d.documentCategory === doc.documentCategory
    );

    const nextVersion = previousVersions.length + 1;

    const record: UniversalDocumentRecord = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: doc.entityType,
      entityId: doc.entityId,
      documentCategory: doc.documentCategory,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      uploadedByUserId: doc.uploadedByUserId,
      uploadedByName: doc.uploadedByName,
      verificationStatus: 'PENDING',
      version: nextVersion,
      createdAt: new Date().toISOString()
    };

    this.universalDocuments.push(record);
    return record;
  }

  /**
   * Verify an uploaded document
   */
  public verifyDocument(
    documentId: string,
    verifiedByUserId: string,
    status: 'VERIFIED' | 'REJECTED',
    remarks?: string
  ): UniversalDocumentRecord | undefined {
    const doc = this.universalDocuments.find(d => d.id === documentId);
    if (!doc) return undefined;

    doc.verificationStatus = status;
    doc.verifiedByUserId = verifiedByUserId;
    return doc;
  }

  /**
   * Get all active and historical documents for an entity
   */
  public getDocumentsForEntity(
    entityType: UniversalDocumentRecord['entityType'],
    entityId: string,
    context?: UserAuthorizationContext
  ): UniversalDocumentRecord[] {
    return this.universalDocuments.filter(
      d => d.entityType === entityType && d.entityId === entityId
    );
  }

  /**
   * Calculate Dossier Completeness and assemble Universal Digital Dossier
   */
  public getDossier(
    entityType: 'STUDENT' | 'FACULTY' | 'STAFF',
    entityId: string,
    context?: UserAuthorizationContext
  ): UniversalDossierPayload | undefined {
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();

    let fullName = 'Unknown';
    let codeOrId = entityId;
    let email = '';
    let contact = '';
    let instituteId = 'inst-1';
    let departmentId = 'dept-1';
    let designationOrProgram = '';
    let status = 'ACTIVE';
    let reportingAuthority = { name: 'Registrar', role: 'REGISTRAR' };

    let mandatoryCategories: string[] = [];

    if (entityType === 'STUDENT') {
      const student = db.getStudents().find(s => s.id === entityId || (s as any).studentId === entityId);
      if (student) {
        fullName = student.name;
        codeOrId = student.enrollmentNo || (student as any).studentId || student.id;
        email = student.email || `${(student as any).studentId || student.id}@student.ssiu.ac.in`;
        contact = student.phone || '';
        instituteId = student.instituteId || 'inst-1';
        departmentId = student.departmentId || 'dept-1';
        designationOrProgram = student.programId || 'B.Tech CSE';
        status = student.status || 'ACTIVE';
        reportingAuthority = { name: student.mentorName || 'Prof. Mentor', role: 'MENTOR' };
      }
      mandatoryCategories = ['IDENTITY', 'ADMISSION', 'ACADEMIC'];
    } else if (entityType === 'FACULTY') {
      const faculty = db.getFaculty().find(f => f.id === entityId);
      if (faculty) {
        fullName = faculty.name;
        codeOrId = faculty.employeeId || faculty.id;
        email = faculty.email;
        contact = faculty.phone || '';
        instituteId = faculty.instituteId || 'inst-1';
        departmentId = faculty.departmentId || 'dept-1';
        designationOrProgram = faculty.designation || 'Assistant Professor';
        status = faculty.status || 'ACTIVE';
        reportingAuthority = { name: 'Dr. HOD', role: 'HOD' };
      }
      mandatoryCategories = ['IDENTITY', 'QUALIFICATION', 'APPOINTMENT', 'JOINING'];
    }


    const instName = institutes.find(i => i.id === instituteId)?.name || 'Institute of Technology';
    const deptName = departments.find(d => d.id === departmentId)?.name || 'Department';

    const entityDocs = this.getDocumentsForEntity(entityType, entityId, context);

    // Group by category
    const categoriesMap = new Map<string, UniversalDocumentRecord[]>();
    entityDocs.forEach(d => {
      const list = categoriesMap.get(d.documentCategory) || [];
      list.push(d);
      categoriesMap.set(d.documentCategory, list);
    });

    let satisfiedMandatory = 0;
    mandatoryCategories.forEach(cat => {
      const docs = categoriesMap.get(cat) || [];
      if (docs.some(d => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'PENDING')) {
        satisfiedMandatory++;
      }
    });

    const completeness = mandatoryCategories.length > 0
      ? Math.round((satisfiedMandatory / mandatoryCategories.length) * 100)
      : 100;

    const totalDocs = entityDocs.length;
    const verifiedDocs = entityDocs.filter(d => d.verificationStatus === 'VERIFIED').length;
    const pendingDocs = entityDocs.filter(d => d.verificationStatus === 'PENDING').length;

    const summary: DossierProfileSummary = {
      entityType,
      entityId,
      fullName,
      codeOrId,
      email,
      contact,
      instituteId,
      instituteName: instName,
      departmentId,
      departmentName: deptName,
      designationOrProgram,
      status,
      reportingAuthority,
      completenessPercentage: completeness,
      totalDocuments: totalDocs,
      verifiedDocuments: verifiedDocs,
      pendingVerificationCount: pendingDocs,
      mandatoryCategoriesCount: mandatoryCategories.length,
      satisfiedMandatoryCount: satisfiedMandatory
    };

    const documentCategories = mandatoryCategories.map(cat => ({
      categoryName: cat,
      isMandatory: true,
      documents: categoriesMap.get(cat) || []
    }));

    return {
      summary,
      documentCategories,
      versionHistory: entityDocs.map(d => ({
        documentId: d.id,
        fileName: d.fileName,
        version: d.version,
        uploadedAt: d.createdAt,
        status: d.verificationStatus
      })),
      recentActivity: [
        { action: 'Dossier accessed and synchronized', timestamp: new Date().toISOString(), performedBy: 'System' }
      ]
    };
  }
}

export const dossierCompletenessService = DossierCompletenessService.getInstance();
