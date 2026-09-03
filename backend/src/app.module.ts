import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MasterDataCacheModule } from './common/cache/master-data-cache.module';
import { RbacModule } from './rbac/rbac.module';
import { CoreMastersModule } from './core-masters/core-masters.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AcademicMappingModule } from './academic-mapping/academic-mapping.module';
// University Attendance Management & Analytics Engine
import { AttendanceModule } from './attendance/attendance.module';
// Backend 7 — Examination & Fees
import { ExamModule } from './exam/exam.module';
import { FeesModule } from './fees/fees.module';
// Store, Purchase & Assets
import { StoreModule } from './store/store.module';
import { PurchaseModule } from './purchase/purchase.module';
import { AssetsModule } from './assets/assets.module';
// Backend 8 — HR & Campus Operations
import { HrModule } from './hr/hr.module';
import { HostelModule } from './hostel/hostel.module';
import { TransportModule } from './transport/transport.module';
import { LibraryModule } from './library/library.module';
import { ItHelpdeskModule } from './it-helpdesk/it-helpdesk.module';
import { CampusServicesModule } from './campus-services/campus-services.module';
// Backend 10 — Research, Innovation, Incubation, Placement & Alumni
import { ResearchModule } from './research/research.module';
import { InnovationModule } from './innovation/innovation.module';
import { IncubationModule } from './incubation/incubation.module';
import { PlacementModule } from './placement/placement.module';
import { AlumniModule } from './alumni/alumni.module';
// Backend 11 — IQAC, NAAC, Compliance & University Governance
import { IqacModule } from './iqac/iqac.module';
import { NaacModule } from './naac/naac.module';
import { ComplianceModule } from './compliance/compliance.module';
import { GovernanceModule } from './governance/governance.module';
// Backend 12 — Reports, Analytics, Search & Audit
import { ReportsModule } from './reports/reports.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SearchModule } from './search/search.module';
import { AuditModule } from './audit/audit.module';
// SSIU Actual Organogram & Authority Engine
import { OrganogramModule } from './organogram/organogram.module';
// Personal Work Diary & Work Management
import { WorkManagementModule } from './work-management/work-management.module';
// University Communication & Official Correspondence
import { CommunicationModule } from './communication/communication.module';
// Digital Student Service Desk & Certificates
import { StudentServicesModule } from './student-services/student-services.module';
// Admission & Enrollment Management
import { AdmissionModule } from './admission/admission.module';
// Phase 1A: AI Academic Risk Prediction
import { AcademicRiskModule } from './academic-risk/academic-risk.module';
// EDP Duty & Academic Inspection Surveillance
import { EdpModule } from './edp/edp.module';
// Centralized University Notesheet Engine
import { NoteSheetModule } from './notesheet/notesheet.module';
// Phase 6: Centralized Bulk Excel Import System
import { BulkImportModule } from './bulk-import/bulk-import.module';
// Student Mentor Assignment & Advisory System
import { MentorAssignmentModule } from './mentor-assignment/mentor-assignment.module';
// Student Feedback & Suggestion System
import { FeedbackModule } from './feedback/feedback.module';
// Centralized Document Master & International Documents
import { DocumentsModule } from './documents/documents.module';
// Student Data Change Request & Approval Workflow
import { StudentDataChangeModule } from './student-data-change/student-data-change.module';
// Stage 6: Enterprise Agentic ERP Automation Platform
import { AgentPlatformModule } from './agent-platform/agent-platform.module';
import { TimetableAgentModule } from './agents/timetable/timetable.module';
// Stage 7.1: ABC / Academic Credit Foundation
import { AbcModule } from './abc/abc.module';
// Stage 7.2: DigiLocker Integration
import { DigiLockerModule } from './digilocker/digilocker.module';
// Stage 7.3: NAAC + NBA Accreditation & Report Generator
import { AccreditationModule } from './accreditation/accreditation.module';
// Stage 7.4: Outcome-Based Education (OBE) Engine
import { OBEModule } from './obe/obe.module';
// Stage 7.5: UGC Grievance, Anti-Ragging & ICC Management
import { GrievanceModule } from './grievance/grievance.module';
// Stage 7.7: Startup, SSIP & Grant/Fund Management
import { StartupGrantModule } from './startup-grant/startup-grant.module';
// Stage 7.8: ABC + DigiLocker + Government Integration Foundation
import { GovernmentIntegrationModule } from './government-integration/government-integration.module';
// Phase 6: Official Notice Board & Targeted Announcements
import { NoticesModule } from './notices/notices.module';
// Phase 8: Student Council Desk
import { StudentCouncilModule } from './student-council/student-council.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    PrismaModule,
    MasterDataCacheModule,
    HealthModule,
    AuthModule,
    RbacModule,
    CoreMastersModule,
    WorkflowModule,
    AcademicMappingModule,
    AttendanceModule,
    // Backend 7
    ExamModule,
    FeesModule,
    // Store, Purchase, Assets
    StoreModule,
    PurchaseModule,
    AssetsModule,
    // Backend 8 Operations
    HrModule,
    HostelModule,
    TransportModule,
    LibraryModule,
    ItHelpdeskModule,
    CampusServicesModule,
    // Backend 10
    ResearchModule,
    InnovationModule,
    IncubationModule,
    PlacementModule,
    AlumniModule,
    // Backend 11 Governance & IQAC
    IqacModule,
    NaacModule,
    ComplianceModule,
    GovernanceModule,
    // Backend 12 Reporting, Analytics, Search & Audit
    ReportsModule,
    AnalyticsModule,
    SearchModule,
    AuditModule,
    // SSIU Organogram
    OrganogramModule,
    // Personal Work Diary & Management
    WorkManagementModule,
    // University Communication
    CommunicationModule,
    // Digital Student Service Desk
    StudentServicesModule,
    // Admission & Enrollment
    AdmissionModule,
    // Phase 1A: AI Academic Risk Prediction
    AcademicRiskModule,
    // EDP Duty Management
    EdpModule,
    // Centralized University Notesheet Engine
    NoteSheetModule,
    // Phase 6: Centralized Bulk Excel Import System
    BulkImportModule,
    // Student Mentor Assignment & Advisory System
    MentorAssignmentModule,
    // Student Feedback & Suggestion System
    FeedbackModule,
    // Centralized Document Master & International Documents
    DocumentsModule,
    // Student Data Change Request & Approval Workflow
    StudentDataChangeModule,
    // Stage 6: Enterprise Agentic ERP Automation Platform
    AgentPlatformModule,
    // Stage 6.2: Autonomous Timetable & Faculty Substitution Agent
    TimetableAgentModule,
    // Stage 7.1: ABC / Academic Credit Foundation
    AbcModule,
    // Stage 7.2: DigiLocker Integration
    DigiLockerModule,
    // Stage 7.3: NAAC + NBA Accreditation & Report Generator
    AccreditationModule,
    // Stage 7.4: Outcome-Based Education (OBE) Engine
    OBEModule,
    // Stage 7.5: UGC Grievance, Anti-Ragging & ICC Management
    GrievanceModule,
    // Stage 7.8: ABC + DigiLocker + Government Integration Foundation
    GovernmentIntegrationModule,
    // Phase 6: Official Notice Board & Targeted Announcements
    NoticesModule,
    // Phase 8: Student Council Desk
    StudentCouncilModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}
