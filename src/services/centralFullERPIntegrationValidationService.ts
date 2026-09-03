import { db } from './db';
import { centralMasterDataIntegrationValidationService } from './centralMasterDataIntegrationValidationService';
import { centralAcademicIntegrationValidationService } from './centralAcademicIntegrationValidationService';
import { centralStudentLifecycleIntegrationValidationService } from './centralStudentLifecycleIntegrationValidationService';
import { centralFacultyHRPayrollIntegrationValidationService } from './centralFacultyHRPayrollIntegrationValidationService';
import { centralFinanceFeesIntegrationValidationService } from './centralFinanceFeesIntegrationValidationService';
import { centralCampusServicesIntegrationValidationService } from './centralCampusServicesIntegrationValidationService';
import { centralProcurementInventoryIntegrationValidationService } from './centralProcurementInventoryIntegrationValidationService';
import { centralCareerResearchIntegrationValidationService } from './centralCareerResearchIntegrationValidationService';
import { centralGrievanceEventsIntegrationValidationService } from './centralGrievanceEventsIntegrationValidationService';
import { centralCertificateNotesheetIntegrationValidationService } from './centralCertificateNotesheetIntegrationValidationService';
import { centralSearchDocumentBIIntegrationValidationService } from './centralSearchDocumentBIIntegrationValidationService';
import { centralSystemAdministrationValidationService } from './centralSystemAdministrationValidationService';

export interface FullERPSummary {
  studentLifecycleVerified: boolean;
  facultyPayrollVerified: boolean;
  financeAndProcurementVerified: boolean;
  campusFacilitiesVerified: boolean;
  careerResearchVerified: boolean;
  grievanceEventsVerified: boolean;
  certificatesWorkflowVerified: boolean;
  searchAndBIVerified: boolean;
  systemAdminAndSecurityVerified: boolean;
  overallGateStatus: 'PASS' | 'FAIL';
  checkedAt: string;
}

class CentralFullERPIntegrationValidationService {
  private static instance: CentralFullERPIntegrationValidationService;

  private constructor() {}

  public static getInstance(): CentralFullERPIntegrationValidationService {
    if (!CentralFullERPIntegrationValidationService.instance) {
      CentralFullERPIntegrationValidationService.instance = new CentralFullERPIntegrationValidationService();
    }
    return CentralFullERPIntegrationValidationService.instance;
  }

  // ─── 1. RUN UNIFIED CROSS-MODULE ERP VERIFICATION ───────────────────

  public runUnifiedERPLifecycleGate(): FullERPSummary {
    // 1. Master Data & Academic
    const masterReport = centralMasterDataIntegrationValidationService.runFullMasterDataGate();
    const academicReport = centralAcademicIntegrationValidationService.runFullAcademicIntegrationGate();

    // 2. Student Lifecycle & Faculty HR
    const studentReport = centralStudentLifecycleIntegrationValidationService.runFullStudentLifecycleGate();
    const facultyReport = centralFacultyHRPayrollIntegrationValidationService.runFullFacultyHRPayrollGate();

    // 3. Finance & Supply Chain
    const financeReport = centralFinanceFeesIntegrationValidationService.runFullFinanceFeesGate();
    const procurementReport = centralProcurementInventoryIntegrationValidationService.runFullProcurementInventoryGate();

    // 4. Campus Facilities & Career
    const campusReport = centralCampusServicesIntegrationValidationService.runFullCampusServicesGate();
    const careerReport = centralCareerResearchIntegrationValidationService.runFullCareerResearchGate();

    // 5. Grievance, Workflow & Certificates
    const grievanceReport = centralGrievanceEventsIntegrationValidationService.runFullGrievanceEventsGate();
    const certificateReport = centralCertificateNotesheetIntegrationValidationService.runFullCertificateNotesheetGate();

    // 6. Search, BI, Security & Administration
    const searchReport = centralSearchDocumentBIIntegrationValidationService.runFullSearchDocumentBIGate();
    const adminReport = centralSystemAdministrationValidationService.runFullSystemAdminGate();

    const isAllPassed = (
      masterReport.overallGateStatus === 'PASS' &&
      academicReport.overallGateStatus === 'PASS' &&
      studentReport.overallGateStatus === 'PASS' &&
      facultyReport.overallGateStatus === 'PASS' &&
      financeReport.overallGateStatus === 'PASS' &&
      procurementReport.overallGateStatus === 'PASS' &&
      campusReport.overallGateStatus === 'PASS' &&
      careerReport.overallGateStatus === 'PASS' &&
      grievanceReport.overallGateStatus === 'PASS' &&
      certificateReport.overallGateStatus === 'PASS' &&
      searchReport.overallGateStatus === 'PASS' &&
      adminReport.overallGateStatus === 'PASS'
    );

    return {
      studentLifecycleVerified: studentReport.overallGateStatus === 'PASS' && academicReport.overallGateStatus === 'PASS',
      facultyPayrollVerified: facultyReport.overallGateStatus === 'PASS',
      financeAndProcurementVerified: financeReport.overallGateStatus === 'PASS' && procurementReport.overallGateStatus === 'PASS',
      campusFacilitiesVerified: campusReport.overallGateStatus === 'PASS',
      careerResearchVerified: careerReport.overallGateStatus === 'PASS',
      grievanceEventsVerified: grievanceReport.overallGateStatus === 'PASS',
      certificatesWorkflowVerified: certificateReport.overallGateStatus === 'PASS',
      searchAndBIVerified: searchReport.overallGateStatus === 'PASS',
      systemAdminAndSecurityVerified: adminReport.overallGateStatus === 'PASS',
      overallGateStatus: isAllPassed ? 'PASS' : 'FAIL',
      checkedAt: new Date().toISOString()
    };
  }
}

export const centralFullERPIntegrationValidationService = CentralFullERPIntegrationValidationService.getInstance();
