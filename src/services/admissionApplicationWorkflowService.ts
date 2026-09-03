import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type AdmissionSessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'ARCHIVED';

export type ProspectStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'APPLICATION_STARTED' | 'APPLICATION_SUBMITTED' | 'CONVERTED' | 'LOST' | 'DUPLICATE';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'DOCUMENT_PENDING'
  | 'UNDER_VERIFICATION'
  | 'ELIGIBILITY_REVIEW'
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'WAITLISTED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ADMITTED'
  | 'CANCELLED';

export type OfferStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export type AdmissionRecordStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WITHDRAWN';

export type AdmissionType = 'REGULAR' | 'LATERAL_ENTRY' | 'TRANSFER' | 'INTERNATIONAL' | 'NRI' | 'MANAGEMENT';

export interface AdmissionSessionRecord {
  id: string;
  session_code: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: AdmissionSessionStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramIntakeRecord {
  id: string;
  admission_session_id: string;
  program_id: string;
  program_name: string;
  institute_id: string;
  department_id: string;
  intake_capacity: number;
  reserved_capacity: number;
  filled_capacity: number;
  application_start_date: string;
  application_end_date: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface AdmissionProspectRecord {
  id: string;
  prospect_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  source: string;
  status: ProspectStatus;
  is_possible_duplicate?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdmissionApplicationRecord {
  id: string;
  application_number: string;
  admission_session_id: string;
  prospect_id?: string;
  program_intake_id: string;
  program_name: string;
  institute_id: string;
  department_id: string;
  applicant_name: string;
  email: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  category: string;
  qualifying_exam: string;
  academic_percentage: number;
  has_required_subjects: boolean;
  application_date: string;
  submission_date?: string;
  status: ApplicationStatus;
  fee_demand_id?: string;
  fee_amount: number;
  is_fee_paid: boolean;
  documents_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdmissionOfferRecord {
  id: string;
  offer_number: string;
  application_id: string;
  applicant_name: string;
  program_id: string;
  program_name: string;
  issue_date: string;
  valid_until: string;
  status: OfferStatus;
  terms: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionConfirmationRecord {
  id: string;
  admission_number: string;
  application_id: string;
  student_id: string;
  enrollment_no: string;
  applicant_name: string;
  program_id: string;
  program_name: string;
  institute_id: string;
  department_id: string;
  academic_year_id: string;
  admission_date: string;
  admission_type: AdmissionType;
  status: AdmissionRecordStatus;
  confirmed_at: string;
  confirmed_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionFunnelMetrics {
  totalProspects: number;
  totalApplications: number;
  submittedApplications: number;
  eligibleApplications: number;
  shortlistedApplications: number;
  offersIssued: number;
  offersAccepted: number;
  confirmedAdmissions: number;
  totalProgramCapacity: number;
  totalFilledSeats: number;
  totalRemainingSeats: number;
}

class AdmissionApplicationWorkflowService {
  private static instance: AdmissionApplicationWorkflowService;

  private sessions: AdmissionSessionRecord[] = [
    {
      id: 'adm-sess-001',
      session_code: 'ADM-2026-27',
      academic_year_id: 'ay-2026-27',
      name: 'Academic Session 2026-27 Centralized Admissions',
      start_date: '2026-03-01',
      end_date: '2026-09-30',
      status: 'OPEN',
      description: 'Undergraduate and Postgraduate Admissions 2026-27',
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-03-01T08:00:00Z'
    }
  ];

  private intakes: ProgramIntakeRecord[] = [
    {
      id: 'intake-bca-001',
      admission_session_id: 'adm-sess-001',
      program_id: 'prog-bca',
      program_name: 'Bachelor of Computer Applications (BCA)',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      intake_capacity: 120,
      reserved_capacity: 36,
      filled_capacity: 1,
      application_start_date: '2026-03-01',
      application_end_date: '2026-09-15',
      status: 'ACTIVE',
      created_at: '2026-03-01T08:00:00Z',
      updated_at: '2026-08-28T10:00:00Z'
    }
  ];

  private prospects: AdmissionProspectRecord[] = [
    {
      id: 'pros-001',
      prospect_number: 'LEAD-2026-000001',
      first_name: 'Aarav',
      last_name: 'Patel',
      date_of_birth: '2005-04-12',
      gender: 'MALE',
      mobile: '+919876543210',
      email: 'aarav.patel@gmail.com',
      city: 'Ahmedabad',
      state: 'Gujarat',
      source: 'WEBSITE',
      status: 'CONVERTED',
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-10T12:00:00Z'
    }
  ];

  private applications: AdmissionApplicationRecord[] = [
    {
      id: 'app-001',
      application_number: 'ADM-2026-000001',
      admission_session_id: 'adm-sess-001',
      prospect_id: 'pros-001',
      program_intake_id: 'intake-bca-001',
      program_name: 'Bachelor of Computer Applications (BCA)',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      applicant_name: 'Aarav Patel',
      email: 'aarav.patel@gmail.com',
      mobile: '+919876543210',
      date_of_birth: '2005-04-12',
      gender: 'MALE',
      category: 'OPEN',
      qualifying_exam: '12th Science / Commerce',
      academic_percentage: 84.5,
      has_required_subjects: true,
      application_date: '2026-04-02',
      submission_date: '2026-04-05',
      status: 'ADMITTED',
      fee_demand_id: 'FD-ADM-2026-000001',
      fee_amount: 1000,
      is_fee_paid: true,
      documents_verified: true,
      created_at: '2026-04-02T10:00:00Z',
      updated_at: '2026-04-15T10:00:00Z'
    }
  ];

  private offers: AdmissionOfferRecord[] = [
    {
      id: 'off-001',
      offer_number: 'OFFER-2026-000001',
      application_id: 'app-001',
      applicant_name: 'Aarav Patel',
      program_id: 'prog-bca',
      program_name: 'Bachelor of Computer Applications (BCA)',
      issue_date: '2026-04-10',
      valid_until: '2026-04-20',
      status: 'ACCEPTED',
      terms: 'Admission confirmed subject to document verification and payment of first semester tuition fee.',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-12T10:00:00Z'
    }
  ];

  private admissions: AdmissionConfirmationRecord[] = [
    {
      id: 'adm-rec-001',
      admission_number: 'AD-2026-000001',
      application_id: 'app-001',
      student_id: 'stud-001',
      enrollment_no: 'SSIU26BCA000059',
      applicant_name: 'Aarav Patel',
      program_id: 'prog-bca',
      program_name: 'Bachelor of Computer Applications (BCA)',
      institute_id: 'inst-sit',
      department_id: 'dept-cse',
      academic_year_id: 'ay-2026-27',
      admission_date: '2026-04-15',
      admission_type: 'REGULAR',
      status: 'CONFIRMED',
      confirmed_at: '2026-04-15T11:00:00Z',
      confirmed_by: 'emp-adm-001',
      created_at: '2026-04-15T11:00:00Z',
      updated_at: '2026-04-15T11:00:00Z'
    }
  ];

  private constructor() {}

  public static getInstance(): AdmissionApplicationWorkflowService {
    if (!AdmissionApplicationWorkflowService.instance) {
      AdmissionApplicationWorkflowService.instance = new AdmissionApplicationWorkflowService();
    }
    return AdmissionApplicationWorkflowService.instance;
  }

  // ─── PROSPECT MANAGEMENT & DUPLICATE LEAD DETECTION ───────────────────

  public createProspect(params: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mobile: string;
    email: string;
    city: string;
    state: string;
    source: string;
  }): AdmissionProspectRecord {
    // Duplicate detection based on mobile or email
    const duplicate = this.prospects.find(p =>
      p.mobile === params.mobile ||
      p.email.toLowerCase() === params.email.toLowerCase()
    );

    const isDuplicate = !!duplicate;
    const prospectNumber = `LEAD-2026-${(this.prospects.length + 1).toString().padStart(6, '0')}`;

    const prospect: AdmissionProspectRecord = {
      id: `pros-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      prospect_number: prospectNumber,
      first_name: params.firstName,
      middle_name: params.middleName,
      last_name: params.lastName,
      date_of_birth: params.dateOfBirth,
      gender: params.gender,
      mobile: params.mobile,
      email: params.email,
      city: params.city,
      state: params.state,
      source: params.source,
      status: isDuplicate ? 'DUPLICATE' : 'NEW',
      is_possible_duplicate: isDuplicate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.prospects.push(prospect);
    return prospect;
  }

  // ─── MULTI-STEP APPLICATION & CENTRAL FINANCE DEMAND ──────────────────

  public createApplicationDraft(params: {
    sessionId: string;
    programIntakeId: string;
    prospectId?: string;
    applicantName: string;
    email: string;
    mobile: string;
    dateOfBirth: string;
    gender: string;
    category: string;
    qualifyingExam: string;
    academicPercentage: number;
    hasRequiredSubjects: boolean;
  }): AdmissionApplicationRecord {
    const intake = this.intakes.find(i => i.id === params.programIntakeId);
    if (!intake) throw new Error(`Program intake ${params.programIntakeId} not found`);

    const appNumber = `ADM-2026-${(this.applications.length + 1).toString().padStart(6, '0')}`;
    const feeDemandId = `FD-ADM-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const app: AdmissionApplicationRecord = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      application_number: appNumber,
      admission_session_id: params.sessionId,
      prospect_id: params.prospectId,
      program_intake_id: params.programIntakeId,
      program_name: intake.program_name,
      institute_id: intake.institute_id,
      department_id: intake.department_id,
      applicant_name: params.applicantName,
      email: params.email,
      mobile: params.mobile,
      date_of_birth: params.dateOfBirth,
      gender: params.gender,
      category: params.category,
      qualifying_exam: params.qualifyingExam,
      academic_percentage: params.academicPercentage,
      has_required_subjects: params.hasRequiredSubjects,
      application_date: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      fee_demand_id: feeDemandId,
      fee_amount: 1000,
      is_fee_paid: false,
      documents_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.applications.push(app);
    return app;
  }

  public submitApplication(params: {
    applicationId: string;
    isFeePaid: boolean;
  }): AdmissionApplicationRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    if (!params.isFeePaid) {
      throw new Error(`Cannot submit application ${app.application_number}: Application fee payment pending in Central Finance`);
    }

    app.status = 'SUBMITTED';
    app.is_fee_paid = true;
    app.submission_date = new Date().toISOString().split('T')[0];
    app.updated_at = new Date().toISOString();

    return app;
  }

  // ─── ELIGIBILITY RULE ENGINE ──────────────────────────────────────────

  public evaluateApplicationEligibility(applicationId: string): {
    application: AdmissionApplicationRecord;
    eligibilityStatus: 'ELIGIBLE' | 'INELIGIBLE';
    reasons: string[];
  } {
    const app = this.applications.find(a => a.id === applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const reasons: string[] = [];
    let isEligible = true;

    // Minimum 50% qualifying percentage rule
    if (app.academic_percentage < 50.0) {
      isEligible = false;
      reasons.push(`Minimum qualifying marks requirement not met (Requires 50%, candidate scored ${app.academic_percentage}%)`);
    }

    // Required subject check
    if (!app.has_required_subjects) {
      isEligible = false;
      reasons.push('Candidate did not have prerequisite subjects in qualifying exam');
    }

    app.status = isEligible ? 'ELIGIBLE' : 'INELIGIBLE';
    app.updated_at = new Date().toISOString();

    return {
      application: app,
      eligibilityStatus: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
      reasons: isEligible ? ['All minimum academic and subject requirements satisfied'] : reasons
    };
  }

  // ─── SHORTLIST, SELECTION & OFFER LETTER ENGINE ───────────────────────

  public issueAdmissionOffer(params: {
    applicationId: string;
    programId: string;
    validityDays: number;
    terms?: string;
  }): AdmissionOfferRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    if (app.status !== 'ELIGIBLE' && app.status !== 'SHORTLISTED' && app.status !== 'SELECTED') {
      throw new Error(`Cannot issue offer: Application ${app.application_number} is in ${app.status} state`);
    }

    const offerNumber = `OFFER-2026-${(this.offers.length + 1).toString().padStart(6, '0')}`;
    const issueDate = new Date();
    const validUntil = new Date();
    validUntil.setDate(issueDate.getDate() + params.validityDays);

    const offer: AdmissionOfferRecord = {
      id: `off-${Date.now()}`,
      offer_number: offerNumber,
      application_id: params.applicationId,
      applicant_name: app.applicant_name,
      program_id: params.programId,
      program_name: app.program_name,
      issue_date: issueDate.toISOString().split('T')[0],
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'ISSUED',
      terms: params.terms || 'Provisional admission offer valid subject to tuition fee payment and document verification.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    app.status = 'OFFERED';
    this.offers.push(offer);
    return offer;
  }

  public acceptOffer(offerId: string): AdmissionOfferRecord {
    const offer = this.offers.find(o => o.id === offerId);
    if (!offer) throw new Error(`Admission offer ${offerId} not found`);

    if (offer.status !== 'ISSUED') {
      throw new Error(`Cannot accept offer in ${offer.status} status`);
    }

    offer.status = 'ACCEPTED';
    offer.updated_at = new Date().toISOString();

    const app = this.applications.find(a => a.id === offer.application_id);
    if (app) app.status = 'ACCEPTED';

    return offer;
  }

  // ─── ATOMIC ADMISSION CONFIRMATION & SEAT CAPACITY ENGINE ─────────────

  public confirmAdmission(params: {
    applicationId: string;
    offerId: string;
    admissionType: AdmissionType;
    isTuitionFeePaid: boolean;
    confirmedBy: string;
  }): AdmissionConfirmationRecord {
    const app = this.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    const offer = this.offers.find(o => o.id === params.offerId);
    if (!offer || offer.status !== 'ACCEPTED') {
      throw new Error(`Cannot confirm admission: Offer ${params.offerId} is not in ACCEPTED state`);
    }

    if (!params.isTuitionFeePaid) {
      throw new Error(`Cannot confirm admission: Semester tuition fee payment pending in Central Finance`);
    }

    const intake = this.intakes.find(i => i.id === app.program_intake_id);
    if (!intake) throw new Error('Program intake record not found');

    // Over-capacity protection check
    if (intake.filled_capacity >= intake.intake_capacity) {
      throw new Error(`Admission confirmation failed: Program capacity for ${intake.program_name} is full (${intake.filled_capacity}/${intake.intake_capacity})`);
    }

    // Atomic seat increment
    intake.filled_capacity += 1;
    intake.updated_at = new Date().toISOString();

    const admissionNumber = `AD-2026-${(this.admissions.length + 1).toString().padStart(6, '0')}`;
    const enrollmentNo = `SSIU26BCA${(this.admissions.length + 60).toString().padStart(6, '0')}`;
    const studentId = `stud-${Date.now()}`;

    const admission: AdmissionConfirmationRecord = {
      id: `adm-rec-${Date.now()}`,
      admission_number: admissionNumber,
      application_id: params.applicationId,
      student_id: studentId,
      enrollment_no: enrollmentNo,
      applicant_name: app.applicant_name,
      program_id: intake.program_id,
      program_name: intake.program_name,
      institute_id: intake.institute_id,
      department_id: intake.department_id,
      academic_year_id: 'ay-2026-27',
      admission_date: new Date().toISOString().split('T')[0],
      admission_type: params.admissionType,
      status: 'CONFIRMED',
      confirmed_at: new Date().toISOString(),
      confirmed_by: params.confirmedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    app.status = 'ADMITTED';
    this.admissions.push(admission);

    return admission;
  }

  // ─── ADMISSION DASHBOARD & FUNNEL QUERY ENGINE ────────────────────────

  public getAdmissionFunnelMetrics(context?: UserAuthorizationContext): AdmissionFunnelMetrics {
    let appList = [...this.applications];
    if (context && context.activeRole !== 'REGISTRAR' && context.instituteId) {
      appList = appList.filter(a => a.institute_id === context.instituteId);
    }
    if (context && context.activeRole === 'HOD' && context.departmentId) {
      appList = appList.filter(a => a.department_id === context.departmentId);
    }

    const totalProspects = this.prospects.length;
    const totalApplications = appList.length;
    const submittedApplications = appList.filter(a => a.status !== 'DRAFT').length;
    const eligibleApplications = appList.filter(a => a.status === 'ELIGIBLE' || a.status === 'SHORTLISTED' || a.status === 'SELECTED' || a.status === 'OFFERED' || a.status === 'ACCEPTED' || a.status === 'ADMITTED').length;
    const shortlistedApplications = appList.filter(a => a.status === 'SHORTLISTED' || a.status === 'SELECTED' || a.status === 'OFFERED' || a.status === 'ACCEPTED' || a.status === 'ADMITTED').length;
    const offersIssued = this.offers.length;
    const offersAccepted = this.offers.filter(o => o.status === 'ACCEPTED').length;
    const confirmedAdmissions = this.admissions.filter(a => a.status === 'CONFIRMED').length;

    const totalProgramCapacity = this.intakes.reduce((sum, i) => sum + i.intake_capacity, 0);
    const totalFilledSeats = this.intakes.reduce((sum, i) => sum + i.filled_capacity, 0);
    const totalRemainingSeats = Math.max(0, totalProgramCapacity - totalFilledSeats);

    return {
      totalProspects,
      totalApplications,
      submittedApplications,
      eligibleApplications,
      shortlistedApplications,
      offersIssued,
      offersAccepted,
      confirmedAdmissions,
      totalProgramCapacity,
      totalFilledSeats,
      totalRemainingSeats
    };
  }
}

export const admissionApplicationWorkflowService = AdmissionApplicationWorkflowService.getInstance();
