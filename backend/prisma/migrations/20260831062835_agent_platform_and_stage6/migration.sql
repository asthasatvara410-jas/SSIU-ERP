-- AlterTable
ALTER TABLE "Patent" ADD COLUMN     "applicant" TEXT NOT NULL DEFAULT 'Swarrnim Startup & Innovation University',
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "assignee" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "jurisdiction" TEXT NOT NULL DEFAULT 'INDIA (IPO)',
ADD COLUMN     "patentNumber" TEXT,
ADD COLUMN     "publicationDate" TIMESTAMP(3),
ADD COLUMN     "publicationNumber" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "url" TEXT,
ADD COLUMN     "validationStatus" TEXT NOT NULL DEFAULT 'NOT_VERIFIED';

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN     "abstract" TEXT,
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "citationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "citationRetrievedAt" TIMESTAMP(3),
ADD COLUMN     "citationSource" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "conferenceId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "duplicateStatus" TEXT NOT NULL DEFAULT 'UNIQUE',
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "issn" TEXT,
ADD COLUMN     "issue" TEXT,
ADD COLUMN     "journalId" TEXT,
ADD COLUMN     "pages" TEXT,
ADD COLUMN     "publicationDate" TIMESTAMP(3),
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "url" TEXT,
ADD COLUMN     "validationStatus" TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
ADD COLUMN     "volume" TEXT,
ALTER COLUMN "journalName" DROP NOT NULL,
ALTER COLUMN "year" SET DEFAULT 2026;

-- AlterTable
ALTER TABLE "Startup" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "foundedDate" TIMESTAMP(3),
ADD COLUMN     "incubationStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "website" TEXT,
ALTER COLUMN "incubationCenterId" SET DEFAULT 'INC-MAIN';

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMs" INTEGER,
    "contextJson" JSONB,
    "resultJson" JSONB,
    "errorDetails" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "toolName" TEXT,
    "targetResource" TEXT,
    "status" TEXT NOT NULL,
    "inputPayload" JSONB,
    "outputPayload" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPolicy" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "policyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "ruleExpression" JSONB NOT NULL,
    "autoApprovalFlag" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentApproval" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionReason" TEXT,
    "requestedData" JSONB NOT NULL,
    "assignedRole" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "actionTakenBy" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAuditLog" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "executionId" TEXT,
    "correlationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actionSummary" TEXT NOT NULL,
    "payload" JSONB,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM_AGENT',
    "actorId" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableScheduleEntry" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotType" TEXT NOT NULL DEFAULT 'THEORY',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyAvailability" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "workloadMin" INTEGER NOT NULL DEFAULT 0,
    "maxDailyMin" INTEGER NOT NULL DEFAULT 360,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstitutionRequest" (
    "id" TEXT NOT NULL,
    "timetableEntryId" TEXT NOT NULL,
    "originalFacultyId" TEXT NOT NULL,
    "substituteFacultyId" TEXT,
    "absenceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "matchingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reasonForAbsence" TEXT,
    "approvalMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstitutionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentExtraction" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "ocrTextRaw" TEXT,
    "extractedFields" JSONB NOT NULL,
    "ocrConfidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerificationResult" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL,
    "matchingDetails" JSONB NOT NULL,
    "discrepancies" JSONB,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVerificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRecoveryCase" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalDueAmount" DOUBLE PRECISION NOT NULL,
    "currentOverdue" DOUBLE PRECISION NOT NULL,
    "dueSinceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "lastContactedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRecoveryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeConversation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "intentDetected" TEXT,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeNegotiationProposal" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL DEFAULT 'AI_AGENT',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "downPaymentAmount" DOUBLE PRECISION NOT NULL,
    "downPaymentDueDate" TIMESTAMP(3) NOT NULL,
    "installmentsCount" INTEGER NOT NULL DEFAULT 2,
    "installmentTerms" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "policyCheckPassed" BOOLEAN NOT NULL DEFAULT true,
    "validationErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeNegotiationProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeEMIPlan" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "proposalId" TEXT,
    "studentId" TEXT NOT NULL,
    "totalPlanAmount" DOUBLE PRECISION NOT NULL,
    "totalPaidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "approvedByRole" TEXT NOT NULL DEFAULT 'POLICY_ENGINE',
    "approvedByUserId" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeEMIPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeEMIInstallment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "transactionRef" TEXT,
    "paymentLinkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeEMIInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "templateCode" TEXT,
    "subject" TEXT,
    "messageBody" TEXT NOT NULL,
    "providerId" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "communicationLogId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "status" TEXT NOT NULL,
    "statusTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawResponse" JSONB,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventSource" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorDetails" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "resultSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicBankOfCredit" (
    "id" TEXT NOT NULL,
    "abcId" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
    "syncError" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicBankOfCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicCreditLedger" (
    "id" TEXT NOT NULL,
    "abcProfileId" TEXT,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT,
    "semesterNumber" INTEGER NOT NULL DEFAULT 1,
    "courseId" TEXT,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "creditValue" DECIMAL(5,2) NOT NULL,
    "creditType" TEXT NOT NULL DEFAULT 'CORE',
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "status" TEXT NOT NULL DEFAULT 'EARNED',
    "earnedAt" TIMESTAMP(3),
    "sourceReference" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbcSyncRecord" (
    "id" TEXT NOT NULL,
    "abcProfileId" TEXT,
    "studentId" TEXT NOT NULL,
    "abcId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "correlationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbcSyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOutcome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT,
    "subjectId" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2025-26',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramOutcome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COPOMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "coId" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "correlationLevel" INTEGER NOT NULL DEFAULT 3,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "COPOMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceTicket" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupResearchGrant" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "amountAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "amountSpent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "facultyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupResearchGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigiLockerConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "provider" TEXT NOT NULL DEFAULT 'DIGILOCKER_NAD',
    "externalUserReference" TEXT,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigiLockerConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigiLockerDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "issuer" TEXT NOT NULL DEFAULT 'SSIU_UNIVERSITY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalDocumentReference" TEXT,
    "issuedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "connectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigiLockerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigiLockerSyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "connectionId" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "correlationId" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigiLockerSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigiLockerConsent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigiLockerConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationFramework" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v2026.1',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "academicYearRange" TEXT NOT NULL DEFAULT '2021-22 to 2025-26',
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationCriterion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "frameworkId" TEXT NOT NULL,
    "criterionNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationMetric" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "criterionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'COUNT',
    "sourceModule" TEXT NOT NULL,
    "sourceEntity" TEXT,
    "calculationMethod" TEXT NOT NULL DEFAULT 'COUNT',
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationAggregatedValue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "metricId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "sourceRecordCount" INTEGER NOT NULL DEFAULT 0,
    "sourceRecordReference" TEXT,
    "details" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccreditationAggregatedValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "metricId" TEXT,
    "framework" TEXT NOT NULL DEFAULT 'NAAC',
    "criterionCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentId" TEXT,
    "sourceModule" TEXT NOT NULL DEFAULT 'DMS',
    "academicYear" TEXT,
    "evidenceType" TEXT NOT NULL DEFAULT 'PDF',
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "reportId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "academicYearRange" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "institutionId" TEXT,
    "departmentId" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotData" JSONB NOT NULL,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationReportJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "progress" INTEGER NOT NULL DEFAULT 100,
    "errorDetails" TEXT,
    "outputFormat" TEXT NOT NULL DEFAULT 'PDF',
    "outputUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationReportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSpecificOutcome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramSpecificOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COPSOMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseOutcomeId" TEXT NOT NULL,
    "programSpecificOutcomeId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 3,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "COPSOMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCOMap" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "assessmentId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCOMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCOAttainment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "marks" DOUBLE PRECISION NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "attainmentLevel" INTEGER NOT NULL DEFAULT 3,
    "academicYear" TEXT NOT NULL DEFAULT '2025-26',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCOAttainment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAttainment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "attainmentLevel" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "attainmentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "academicYear" TEXT NOT NULL DEFAULT '2025-26',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAttainment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramAttainment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "attainmentLevel" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "attainmentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 72.0,
    "academicYear" TEXT NOT NULL DEFAULT '2025-26',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramAttainment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBEConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "level1Threshold" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "level2Threshold" DOUBLE PRECISION NOT NULL DEFAULT 65.0,
    "level3Threshold" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "directWeight" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "indirectWeight" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBEConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBEImprovementAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBEImprovementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBEReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "reportId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'COURSE',
    "courseId" TEXT,
    "programId" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2025-26',
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "generatedBy" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBEReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseNumber" TEXT NOT NULL,
    "trackingToken" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "type" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "incidentDate" TIMESTAMP(3),
    "incidentLocation" TEXT,
    "currentAssigneeId" TEXT,
    "currentCommitteeId" TEXT,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalationDeadline" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievanceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceComplainantIdentity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "identityVisibility" TEXT NOT NULL DEFAULT 'SYSTEM_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievanceComplainantIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "documentId" TEXT,
    "fileUrl" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceInternalNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceCaseEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceCaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievancePolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "category" TEXT NOT NULL DEFAULT 'ALL',
    "initialAuthority" TEXT NOT NULL DEFAULT 'HOD',
    "escalationAuthority" TEXT NOT NULL DEFAULT 'REGISTRAR',
    "deadlineDays" INTEGER NOT NULL DEFAULT 7,
    "workingDaysOnly" BOOLEAN NOT NULL DEFAULT true,
    "autoEscalationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "name" TEXT NOT NULL,
    "publisher" TEXT,
    "issn" TEXT,
    "eissn" TEXT,
    "url" TEXT,
    "country" TEXT,
    "indexingClaim" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "name" TEXT NOT NULL,
    "organizer" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "website" TEXT,
    "proceedingsUrl" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatentInventor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "patentId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "inventorOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatentInventor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchAuthor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "researchProjectId" TEXT,
    "publicationId" TEXT,
    "patentId" TEXT,
    "userId" TEXT,
    "studentId" TEXT,
    "authorNameSnapshot" TEXT NOT NULL,
    "authorOrder" INTEGER NOT NULL DEFAULT 1,
    "correspondingAuthor" BOOLEAN NOT NULL DEFAULT false,
    "affiliation" TEXT NOT NULL DEFAULT 'Swarrnim Startup & Innovation University',
    "orcidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "researchProjectId" TEXT,
    "publicationId" TEXT,
    "patentId" TEXT,
    "documentId" TEXT,
    "evidenceType" TEXT NOT NULL DEFAULT 'PAPER',
    "uploadedBy" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchValidationResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "entityType" TEXT NOT NULL DEFAULT 'PUBLICATION',
    "entityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CROSSREF',
    "status" TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseReference" TEXT,
    "matchedFields" JSONB,
    "mismatchedFields" JSONB,
    "errorCode" TEXT,
    "publicationId" TEXT,

    CONSTRAINT "ResearchValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchApprovalAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "entityType" TEXT NOT NULL DEFAULT 'PUBLICATION',
    "entityId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL DEFAULT 'HOD',
    "action" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicationId" TEXT,
    "patentId" TEXT,

    CONSTRAINT "ResearchApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupFounder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "startupId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "facultyId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CO_FOUNDER',
    "ownershipPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isPrimaryFounder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StartupFounder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnovationProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "innovationArea" TEXT NOT NULL DEFAULT 'Technology & DeepTech',
    "principalInvestigatorId" TEXT,
    "departmentId" TEXT NOT NULL DEFAULT 'DEP-CSE',
    "startupId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budgetReference" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InnovationProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSIPProject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studentLeadId" TEXT NOT NULL,
    "facultyMentorId" TEXT,
    "startupId" TEXT,
    "innovationProjectId" TEXT,
    "schemeName" TEXT NOT NULL DEFAULT 'SSIP 2.0 Policy (Govt of Gujarat)',
    "sanctionedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "utilizedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSIPProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizer" TEXT NOT NULL DEFAULT 'Swarrnim Startup & Innovation University',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "registrationDeadline" TIMESTAMP(3),
    "venue" TEXT DEFAULT 'Swarrnim Campus Hub',
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION_OPEN',
    "prizePoolReference" TEXT DEFAULT '₹5,00,000 Total Prize Pool',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonTeam" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "hackathonId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "startupId" TEXT,
    "mentorId" TEXT,
    "rank" INTEGER,
    "awardStatus" TEXT DEFAULT 'PARTICIPANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackathonMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TEAM_LEADER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackathonMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grantingAgency" TEXT NOT NULL,
    "schemeName" TEXT,
    "grantType" TEXT NOT NULL DEFAULT 'GOVERNMENT',
    "description" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "sanctionDate" TIMESTAMP(3),
    "sanctionReference" TEXT,
    "sanctionedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantApplication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "startupId" TEXT,
    "innovationProjectId" TEXT,
    "ssipProjectId" TEXT,
    "applicationNumber" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantApprovalAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "entityType" TEXT NOT NULL DEFAULT 'GRANT_APPLICATION',
    "entityId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL DEFAULT 'GRANT_OFFICER',
    "action" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantApplicationId" TEXT,

    CONSTRAINT "GrantApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantBudget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "startupId" TEXT,
    "category" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "revisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantFundRelease" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "releaseReference" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "financeTransactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RELEASED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantFundRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantExpense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "startupId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PROTOTYPE',
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financeTransactionId" TEXT,
    "receiptDocumentId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationComment" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantMilestone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "startupId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "evidenceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "startupId" TEXT,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'SANCTION_LETTER',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantUtilizationRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "grantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "verifiedExpense" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "utilizationPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "preparedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrantUtilizationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentABCProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "abcId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
    "provider" TEXT NOT NULL DEFAULT 'MOCK_ABC_ADAPTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentABCProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABCConsent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL DEFAULT 'ACADEMIC_CREDIT_SYNC',
    "status" TEXT NOT NULL DEFAULT 'GRANTED',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "consentVersion" TEXT NOT NULL DEFAULT 'v2.0',
    "source" TEXT NOT NULL DEFAULT 'STUDENT_PORTAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABCConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicCreditRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "resultStatus" TEXT NOT NULL DEFAULT 'PASS',
    "source" TEXT NOT NULL DEFAULT 'ERP',
    "sourceReference" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicCreditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentSyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestReference" TEXT,
    "providerReference" TEXT,
    "correlationId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernmentSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigiLockerProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "providerUserReference" TEXT,
    "connectionStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "linkedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigiLockerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCredential" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "studentId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "credentialNumber" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'DIGILOCKER',
    "providerReference" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "publishedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationHealth" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "lastSuccessfulRequest" TIMESTAMP(3),
    "lastFailedRequest" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "latency" INTEGER NOT NULL DEFAULT 45,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COAssessmentMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "assessmentId" TEXT,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "maximumMarks" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "COAssessmentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "COAttainmentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'DIRECT',
    "assessmentId" TEXT,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "attainedValue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "attainmentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "calculationMethod" TEXT NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "COAttainmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndirectAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "courseId" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndirectAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POAttainmentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 8,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "attainmentLevel" INTEGER NOT NULL DEFAULT 3,
    "calculationMethod" TEXT NOT NULL DEFAULT 'OBE_MATRIX_WEIGHTED',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POAttainmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PSOAttainmentRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "psoId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 8,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "attainmentLevel" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PSOAttainmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NBAProgramProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "accreditationCycle" TEXT NOT NULL DEFAULT 'CYCLE_1',
    "applicationDate" TIMESTAMP(3),
    "visitDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNDER_PREPARATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NBAProgramProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NBAIndicator" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "programId" TEXT NOT NULL,
    "criterionCode" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NBAIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "framework" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "academicYear" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',

    CONSTRAINT "AccreditationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NEPAcademicIndicator" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'ERP_AUTOMATED',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "status" TEXT NOT NULL DEFAULT 'MONITORED',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NEPAcademicIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationDataLineage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "framework" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotId" TEXT,

    CONSTRAINT "AccreditationDataLineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttainmentOverride" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "overrideValue" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "AttainmentOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousCaseIdentity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "identityReference" TEXT NOT NULL,
    "encryptedIdentity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousCaseIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AntiRaggingCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'HIGH',
    "victimCount" INTEGER NOT NULL DEFAULT 1,
    "witnessInformation" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AntiRaggingCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICCCase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'HIGHLY_RESTRICTED',
    "assignedCommitteeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICCCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceCommittee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievanceCommittee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceCommitteeMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "committeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "GrievanceCommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "committeeId" TEXT,
    "assignedTo" TEXT,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceSLAConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "responseHours" INTEGER NOT NULL DEFAULT 24,
    "resolutionHours" INTEGER NOT NULL DEFAULT 168,
    "escalationHours" INTEGER NOT NULL DEFAULT 72,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceSLAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseType" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "afterHours" INTEGER NOT NULL DEFAULT 72,
    "priority" TEXT NOT NULL DEFAULT 'HIGH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TRIGGERED',

    CONSTRAINT "EscalationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "investigatorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "findings" TEXT,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "documentId" TEXT,
    "evidenceType" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',

    CONSTRAINT "CaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseResolution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseId" TEXT NOT NULL,
    "resolutionType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentVisibleSummary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESOLVED',

    CONSTRAINT "CaseResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceRetentionPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'DEFAULT',
    "caseType" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL DEFAULT 1825,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "archiveAfter" INTEGER NOT NULL DEFAULT 365,
    "deleteAfter" INTEGER NOT NULL DEFAULT 2555,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_code_key" ON "Agent"("code");

-- CreateIndex
CREATE INDEX "Agent_category_idx" ON "Agent"("category");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_tenantId_idx" ON "Agent"("tenantId");

-- CreateIndex
CREATE INDEX "AgentExecution_agentId_idx" ON "AgentExecution"("agentId");

-- CreateIndex
CREATE INDEX "AgentExecution_triggerEvent_idx" ON "AgentExecution"("triggerEvent");

-- CreateIndex
CREATE INDEX "AgentExecution_correlationId_idx" ON "AgentExecution"("correlationId");

-- CreateIndex
CREATE INDEX "AgentExecution_status_idx" ON "AgentExecution"("status");

-- CreateIndex
CREATE INDEX "AgentExecution_tenantId_idx" ON "AgentExecution"("tenantId");

-- CreateIndex
CREATE INDEX "AgentExecution_startTime_idx" ON "AgentExecution"("startTime");

-- CreateIndex
CREATE INDEX "AgentAction_agentId_idx" ON "AgentAction"("agentId");

-- CreateIndex
CREATE INDEX "AgentAction_executionId_idx" ON "AgentAction"("executionId");

-- CreateIndex
CREATE INDEX "AgentAction_actionType_idx" ON "AgentAction"("actionType");

-- CreateIndex
CREATE INDEX "AgentAction_toolName_idx" ON "AgentAction"("toolName");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPolicy_policyCode_key" ON "AgentPolicy"("policyCode");

-- CreateIndex
CREATE INDEX "AgentPolicy_agentId_idx" ON "AgentPolicy"("agentId");

-- CreateIndex
CREATE INDEX "AgentPolicy_policyCode_idx" ON "AgentPolicy"("policyCode");

-- CreateIndex
CREATE INDEX "AgentPolicy_category_idx" ON "AgentPolicy"("category");

-- CreateIndex
CREATE INDEX "AgentPolicy_tenantId_idx" ON "AgentPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "AgentApproval_agentId_idx" ON "AgentApproval"("agentId");

-- CreateIndex
CREATE INDEX "AgentApproval_executionId_idx" ON "AgentApproval"("executionId");

-- CreateIndex
CREATE INDEX "AgentApproval_resourceType_resourceId_idx" ON "AgentApproval"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AgentApproval_status_idx" ON "AgentApproval"("status");

-- CreateIndex
CREATE INDEX "AgentApproval_assignedRole_idx" ON "AgentApproval"("assignedRole");

-- CreateIndex
CREATE INDEX "AgentApproval_tenantId_idx" ON "AgentApproval"("tenantId");

-- CreateIndex
CREATE INDEX "AgentAuditLog_agentId_idx" ON "AgentAuditLog"("agentId");

-- CreateIndex
CREATE INDEX "AgentAuditLog_executionId_idx" ON "AgentAuditLog"("executionId");

-- CreateIndex
CREATE INDEX "AgentAuditLog_correlationId_idx" ON "AgentAuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "AgentAuditLog_eventType_idx" ON "AgentAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AgentAuditLog_tenantId_idx" ON "AgentAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AgentAuditLog_timestamp_idx" ON "AgentAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "TimetableScheduleEntry_instituteId_departmentId_idx" ON "TimetableScheduleEntry"("instituteId", "departmentId");

-- CreateIndex
CREATE INDEX "TimetableScheduleEntry_facultyId_dayOfWeek_idx" ON "TimetableScheduleEntry"("facultyId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableScheduleEntry_divisionId_dayOfWeek_idx" ON "TimetableScheduleEntry"("divisionId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableScheduleEntry_status_idx" ON "TimetableScheduleEntry"("status");

-- CreateIndex
CREATE INDEX "FacultyAvailability_facultyId_idx" ON "FacultyAvailability"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyAvailability_date_isAvailable_idx" ON "FacultyAvailability"("date", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAvailability_facultyId_date_key" ON "FacultyAvailability"("facultyId", "date");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_timetableEntryId_idx" ON "SubstitutionRequest"("timetableEntryId");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_originalFacultyId_idx" ON "SubstitutionRequest"("originalFacultyId");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_substituteFacultyId_idx" ON "SubstitutionRequest"("substituteFacultyId");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_absenceDate_idx" ON "SubstitutionRequest"("absenceDate");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_status_idx" ON "SubstitutionRequest"("status");

-- CreateIndex
CREATE INDEX "SubstitutionRequest_tenantId_idx" ON "SubstitutionRequest"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentExtraction_documentId_key" ON "DocumentExtraction"("documentId");

-- CreateIndex
CREATE INDEX "DocumentExtraction_studentId_idx" ON "DocumentExtraction"("studentId");

-- CreateIndex
CREATE INDEX "DocumentExtraction_documentType_idx" ON "DocumentExtraction"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerificationResult_extractionId_key" ON "DocumentVerificationResult"("extractionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerificationResult_documentId_key" ON "DocumentVerificationResult"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVerificationResult_studentId_idx" ON "DocumentVerificationResult"("studentId");

-- CreateIndex
CREATE INDEX "DocumentVerificationResult_decision_idx" ON "DocumentVerificationResult"("decision");

-- CreateIndex
CREATE INDEX "DocumentVerificationResult_tenantId_idx" ON "DocumentVerificationResult"("tenantId");

-- CreateIndex
CREATE INDEX "FeeRecoveryCase_studentId_idx" ON "FeeRecoveryCase"("studentId");

-- CreateIndex
CREATE INDEX "FeeRecoveryCase_status_idx" ON "FeeRecoveryCase"("status");

-- CreateIndex
CREATE INDEX "FeeRecoveryCase_riskLevel_idx" ON "FeeRecoveryCase"("riskLevel");

-- CreateIndex
CREATE INDEX "FeeRecoveryCase_tenantId_idx" ON "FeeRecoveryCase"("tenantId");

-- CreateIndex
CREATE INDEX "FeeConversation_caseId_idx" ON "FeeConversation"("caseId");

-- CreateIndex
CREATE INDEX "FeeConversation_channel_idx" ON "FeeConversation"("channel");

-- CreateIndex
CREATE INDEX "FeeConversation_intentDetected_idx" ON "FeeConversation"("intentDetected");

-- CreateIndex
CREATE INDEX "FeeNegotiationProposal_caseId_idx" ON "FeeNegotiationProposal"("caseId");

-- CreateIndex
CREATE INDEX "FeeNegotiationProposal_status_idx" ON "FeeNegotiationProposal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeeEMIPlan_proposalId_key" ON "FeeEMIPlan"("proposalId");

-- CreateIndex
CREATE INDEX "FeeEMIPlan_caseId_idx" ON "FeeEMIPlan"("caseId");

-- CreateIndex
CREATE INDEX "FeeEMIPlan_studentId_idx" ON "FeeEMIPlan"("studentId");

-- CreateIndex
CREATE INDEX "FeeEMIPlan_status_idx" ON "FeeEMIPlan"("status");

-- CreateIndex
CREATE INDEX "FeeEMIPlan_tenantId_idx" ON "FeeEMIPlan"("tenantId");

-- CreateIndex
CREATE INDEX "FeeEMIInstallment_planId_idx" ON "FeeEMIInstallment"("planId");

-- CreateIndex
CREATE INDEX "FeeEMIInstallment_dueDate_idx" ON "FeeEMIInstallment"("dueDate");

-- CreateIndex
CREATE INDEX "FeeEMIInstallment_status_idx" ON "FeeEMIInstallment"("status");

-- CreateIndex
CREATE INDEX "CommunicationLog_recipientId_channel_idx" ON "CommunicationLog"("recipientId", "channel");

-- CreateIndex
CREATE INDEX "CommunicationLog_deliveryStatus_idx" ON "CommunicationLog"("deliveryStatus");

-- CreateIndex
CREATE INDEX "CommunicationLog_tenantId_idx" ON "CommunicationLog"("tenantId");

-- CreateIndex
CREATE INDEX "CommunicationLog_createdAt_idx" ON "CommunicationLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_communicationLogId_idx" ON "NotificationDelivery"("communicationLogId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationEvent_idempotencyKey_key" ON "AutomationEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AutomationEvent_eventType_idx" ON "AutomationEvent"("eventType");

-- CreateIndex
CREATE INDEX "AutomationEvent_status_idx" ON "AutomationEvent"("status");

-- CreateIndex
CREATE INDEX "AutomationEvent_tenantId_idx" ON "AutomationEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AutomationEvent_createdAt_idx" ON "AutomationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AutomationJob_eventId_idx" ON "AutomationJob"("eventId");

-- CreateIndex
CREATE INDEX "AutomationJob_agentCode_idx" ON "AutomationJob"("agentCode");

-- CreateIndex
CREATE INDEX "AutomationJob_status_nextRunAt_idx" ON "AutomationJob"("status", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicBankOfCredit_abcId_key" ON "AcademicBankOfCredit"("abcId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicBankOfCredit_studentId_key" ON "AcademicBankOfCredit"("studentId");

-- CreateIndex
CREATE INDEX "AcademicBankOfCredit_studentId_idx" ON "AcademicBankOfCredit"("studentId");

-- CreateIndex
CREATE INDEX "AcademicBankOfCredit_syncStatus_idx" ON "AcademicBankOfCredit"("syncStatus");

-- CreateIndex
CREATE INDEX "AcademicBankOfCredit_verificationStatus_idx" ON "AcademicBankOfCredit"("verificationStatus");

-- CreateIndex
CREATE INDEX "AcademicBankOfCredit_tenantId_idx" ON "AcademicBankOfCredit"("tenantId");

-- CreateIndex
CREATE INDEX "AcademicCreditLedger_studentId_idx" ON "AcademicCreditLedger"("studentId");

-- CreateIndex
CREATE INDEX "AcademicCreditLedger_abcProfileId_idx" ON "AcademicCreditLedger"("abcProfileId");

-- CreateIndex
CREATE INDEX "AcademicCreditLedger_semesterId_idx" ON "AcademicCreditLedger"("semesterId");

-- CreateIndex
CREATE INDEX "AcademicCreditLedger_status_idx" ON "AcademicCreditLedger"("status");

-- CreateIndex
CREATE INDEX "AcademicCreditLedger_tenantId_idx" ON "AcademicCreditLedger"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicCreditLedger_studentId_courseCode_academicYear_key" ON "AcademicCreditLedger"("studentId", "courseCode", "academicYear");

-- CreateIndex
CREATE INDEX "AbcSyncRecord_studentId_idx" ON "AbcSyncRecord"("studentId");

-- CreateIndex
CREATE INDEX "AbcSyncRecord_abcProfileId_idx" ON "AbcSyncRecord"("abcProfileId");

-- CreateIndex
CREATE INDEX "AbcSyncRecord_abcId_idx" ON "AbcSyncRecord"("abcId");

-- CreateIndex
CREATE INDEX "AbcSyncRecord_status_idx" ON "AbcSyncRecord"("status");

-- CreateIndex
CREATE INDEX "AbcSyncRecord_tenantId_idx" ON "AbcSyncRecord"("tenantId");

-- CreateIndex
CREATE INDEX "CourseOutcome_courseId_idx" ON "CourseOutcome"("courseId");

-- CreateIndex
CREATE INDEX "CourseOutcome_subjectId_idx" ON "CourseOutcome"("subjectId");

-- CreateIndex
CREATE INDEX "CourseOutcome_code_idx" ON "CourseOutcome"("code");

-- CreateIndex
CREATE INDEX "CourseOutcome_status_idx" ON "CourseOutcome"("status");

-- CreateIndex
CREATE INDEX "CourseOutcome_tenantId_idx" ON "CourseOutcome"("tenantId");

-- CreateIndex
CREATE INDEX "ProgramOutcome_programId_idx" ON "ProgramOutcome"("programId");

-- CreateIndex
CREATE INDEX "ProgramOutcome_code_idx" ON "ProgramOutcome"("code");

-- CreateIndex
CREATE INDEX "ProgramOutcome_status_idx" ON "ProgramOutcome"("status");

-- CreateIndex
CREATE INDEX "ProgramOutcome_tenantId_idx" ON "ProgramOutcome"("tenantId");

-- CreateIndex
CREATE INDEX "COPOMapping_coId_idx" ON "COPOMapping"("coId");

-- CreateIndex
CREATE INDEX "COPOMapping_poId_idx" ON "COPOMapping"("poId");

-- CreateIndex
CREATE INDEX "COPOMapping_tenantId_idx" ON "COPOMapping"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "COPOMapping_coId_poId_key" ON "COPOMapping"("coId", "poId");

-- CreateIndex
CREATE INDEX "GrievanceTicket_category_idx" ON "GrievanceTicket"("category");

-- CreateIndex
CREATE INDEX "GrievanceTicket_status_idx" ON "GrievanceTicket"("status");

-- CreateIndex
CREATE INDEX "StartupResearchGrant_facultyId_idx" ON "StartupResearchGrant"("facultyId");

-- CreateIndex
CREATE INDEX "StartupResearchGrant_grantType_idx" ON "StartupResearchGrant"("grantType");

-- CreateIndex
CREATE INDEX "StartupResearchGrant_status_idx" ON "StartupResearchGrant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DigiLockerConnection_studentId_key" ON "DigiLockerConnection"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerConnection_studentId_idx" ON "DigiLockerConnection"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerConnection_status_idx" ON "DigiLockerConnection"("status");

-- CreateIndex
CREATE INDEX "DigiLockerConnection_tenantId_idx" ON "DigiLockerConnection"("tenantId");

-- CreateIndex
CREATE INDEX "DigiLockerDocument_studentId_idx" ON "DigiLockerDocument"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerDocument_documentType_idx" ON "DigiLockerDocument"("documentType");

-- CreateIndex
CREATE INDEX "DigiLockerDocument_status_idx" ON "DigiLockerDocument"("status");

-- CreateIndex
CREATE INDEX "DigiLockerDocument_connectionId_idx" ON "DigiLockerDocument"("connectionId");

-- CreateIndex
CREATE INDEX "DigiLockerDocument_tenantId_idx" ON "DigiLockerDocument"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DigiLockerDocument_studentId_documentType_documentNumber_key" ON "DigiLockerDocument"("studentId", "documentType", "documentNumber");

-- CreateIndex
CREATE INDEX "DigiLockerSyncLog_studentId_idx" ON "DigiLockerSyncLog"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerSyncLog_connectionId_idx" ON "DigiLockerSyncLog"("connectionId");

-- CreateIndex
CREATE INDEX "DigiLockerSyncLog_status_idx" ON "DigiLockerSyncLog"("status");

-- CreateIndex
CREATE INDEX "DigiLockerSyncLog_correlationId_idx" ON "DigiLockerSyncLog"("correlationId");

-- CreateIndex
CREATE INDEX "DigiLockerSyncLog_tenantId_idx" ON "DigiLockerSyncLog"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DigiLockerConsent_studentId_key" ON "DigiLockerConsent"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerConsent_studentId_idx" ON "DigiLockerConsent"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerConsent_consentGiven_idx" ON "DigiLockerConsent"("consentGiven");

-- CreateIndex
CREATE INDEX "DigiLockerConsent_tenantId_idx" ON "DigiLockerConsent"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationFramework_name_idx" ON "AccreditationFramework"("name");

-- CreateIndex
CREATE INDEX "AccreditationFramework_status_idx" ON "AccreditationFramework"("status");

-- CreateIndex
CREATE INDEX "AccreditationFramework_tenantId_idx" ON "AccreditationFramework"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationCriterion_frameworkId_idx" ON "AccreditationCriterion"("frameworkId");

-- CreateIndex
CREATE INDEX "AccreditationCriterion_criterionNumber_idx" ON "AccreditationCriterion"("criterionNumber");

-- CreateIndex
CREATE INDEX "AccreditationCriterion_tenantId_idx" ON "AccreditationCriterion"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationMetric_criterionId_idx" ON "AccreditationMetric"("criterionId");

-- CreateIndex
CREATE INDEX "AccreditationMetric_code_idx" ON "AccreditationMetric"("code");

-- CreateIndex
CREATE INDEX "AccreditationMetric_sourceModule_idx" ON "AccreditationMetric"("sourceModule");

-- CreateIndex
CREATE INDEX "AccreditationMetric_tenantId_idx" ON "AccreditationMetric"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationAggregatedValue_metricId_idx" ON "AccreditationAggregatedValue"("metricId");

-- CreateIndex
CREATE INDEX "AccreditationAggregatedValue_academicYear_idx" ON "AccreditationAggregatedValue"("academicYear");

-- CreateIndex
CREATE INDEX "AccreditationAggregatedValue_status_idx" ON "AccreditationAggregatedValue"("status");

-- CreateIndex
CREATE INDEX "AccreditationAggregatedValue_tenantId_idx" ON "AccreditationAggregatedValue"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationAggregatedValue_metricId_academicYear_tenantId_key" ON "AccreditationAggregatedValue"("metricId", "academicYear", "tenantId");

-- CreateIndex
CREATE INDEX "AccreditationEvidence_metricId_idx" ON "AccreditationEvidence"("metricId");

-- CreateIndex
CREATE INDEX "AccreditationEvidence_framework_idx" ON "AccreditationEvidence"("framework");

-- CreateIndex
CREATE INDEX "AccreditationEvidence_criterionCode_idx" ON "AccreditationEvidence"("criterionCode");

-- CreateIndex
CREATE INDEX "AccreditationEvidence_status_idx" ON "AccreditationEvidence"("status");

-- CreateIndex
CREATE INDEX "AccreditationEvidence_tenantId_idx" ON "AccreditationEvidence"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationReport_reportId_key" ON "AccreditationReport"("reportId");

-- CreateIndex
CREATE INDEX "AccreditationReport_framework_idx" ON "AccreditationReport"("framework");

-- CreateIndex
CREATE INDEX "AccreditationReport_status_idx" ON "AccreditationReport"("status");

-- CreateIndex
CREATE INDEX "AccreditationReport_tenantId_idx" ON "AccreditationReport"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationReportJob_reportId_idx" ON "AccreditationReportJob"("reportId");

-- CreateIndex
CREATE INDEX "AccreditationReportJob_status_idx" ON "AccreditationReportJob"("status");

-- CreateIndex
CREATE INDEX "AccreditationReportJob_tenantId_idx" ON "AccreditationReportJob"("tenantId");

-- CreateIndex
CREATE INDEX "ProgramSpecificOutcome_programId_idx" ON "ProgramSpecificOutcome"("programId");

-- CreateIndex
CREATE INDEX "ProgramSpecificOutcome_code_idx" ON "ProgramSpecificOutcome"("code");

-- CreateIndex
CREATE INDEX "ProgramSpecificOutcome_status_idx" ON "ProgramSpecificOutcome"("status");

-- CreateIndex
CREATE INDEX "ProgramSpecificOutcome_tenantId_idx" ON "ProgramSpecificOutcome"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSpecificOutcome_programId_code_version_tenantId_key" ON "ProgramSpecificOutcome"("programId", "code", "version", "tenantId");

-- CreateIndex
CREATE INDEX "COPSOMapping_courseOutcomeId_idx" ON "COPSOMapping"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "COPSOMapping_programSpecificOutcomeId_idx" ON "COPSOMapping"("programSpecificOutcomeId");

-- CreateIndex
CREATE INDEX "COPSOMapping_tenantId_idx" ON "COPSOMapping"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "COPSOMapping_courseOutcomeId_programSpecificOutcomeId_tenan_key" ON "COPSOMapping"("courseOutcomeId", "programSpecificOutcomeId", "tenantId");

-- CreateIndex
CREATE INDEX "AssessmentCOMap_assessmentId_idx" ON "AssessmentCOMap"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentCOMap_courseOutcomeId_idx" ON "AssessmentCOMap"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "AssessmentCOMap_tenantId_idx" ON "AssessmentCOMap"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCOMap_assessmentId_courseOutcomeId_tenantId_key" ON "AssessmentCOMap"("assessmentId", "courseOutcomeId", "tenantId");

-- CreateIndex
CREATE INDEX "StudentCOAttainment_studentId_idx" ON "StudentCOAttainment"("studentId");

-- CreateIndex
CREATE INDEX "StudentCOAttainment_courseId_idx" ON "StudentCOAttainment"("courseId");

-- CreateIndex
CREATE INDEX "StudentCOAttainment_courseOutcomeId_idx" ON "StudentCOAttainment"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "StudentCOAttainment_academicYear_idx" ON "StudentCOAttainment"("academicYear");

-- CreateIndex
CREATE INDEX "StudentCOAttainment_tenantId_idx" ON "StudentCOAttainment"("tenantId");

-- CreateIndex
CREATE INDEX "CourseAttainment_courseId_idx" ON "CourseAttainment"("courseId");

-- CreateIndex
CREATE INDEX "CourseAttainment_courseOutcomeId_idx" ON "CourseAttainment"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "CourseAttainment_academicYear_idx" ON "CourseAttainment"("academicYear");

-- CreateIndex
CREATE INDEX "CourseAttainment_tenantId_idx" ON "CourseAttainment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAttainment_courseId_courseOutcomeId_academicYear_tena_key" ON "CourseAttainment"("courseId", "courseOutcomeId", "academicYear", "tenantId");

-- CreateIndex
CREATE INDEX "ProgramAttainment_programId_idx" ON "ProgramAttainment"("programId");

-- CreateIndex
CREATE INDEX "ProgramAttainment_programOutcomeId_idx" ON "ProgramAttainment"("programOutcomeId");

-- CreateIndex
CREATE INDEX "ProgramAttainment_academicYear_idx" ON "ProgramAttainment"("academicYear");

-- CreateIndex
CREATE INDEX "ProgramAttainment_tenantId_idx" ON "ProgramAttainment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramAttainment_programId_programOutcomeId_academicYear_t_key" ON "ProgramAttainment"("programId", "programOutcomeId", "academicYear", "tenantId");

-- CreateIndex
CREATE INDEX "OBEConfiguration_version_idx" ON "OBEConfiguration"("version");

-- CreateIndex
CREATE INDEX "OBEConfiguration_tenantId_idx" ON "OBEConfiguration"("tenantId");

-- CreateIndex
CREATE INDEX "OBEImprovementAction_courseId_idx" ON "OBEImprovementAction"("courseId");

-- CreateIndex
CREATE INDEX "OBEImprovementAction_courseOutcomeId_idx" ON "OBEImprovementAction"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "OBEImprovementAction_status_idx" ON "OBEImprovementAction"("status");

-- CreateIndex
CREATE INDEX "OBEImprovementAction_tenantId_idx" ON "OBEImprovementAction"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OBEReport_reportId_key" ON "OBEReport"("reportId");

-- CreateIndex
CREATE INDEX "OBEReport_reportType_idx" ON "OBEReport"("reportType");

-- CreateIndex
CREATE INDEX "OBEReport_academicYear_idx" ON "OBEReport"("academicYear");

-- CreateIndex
CREATE INDEX "OBEReport_tenantId_idx" ON "OBEReport"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GrievanceCase_caseNumber_key" ON "GrievanceCase"("caseNumber");

-- CreateIndex
CREATE INDEX "GrievanceCase_caseNumber_idx" ON "GrievanceCase"("caseNumber");

-- CreateIndex
CREATE INDEX "GrievanceCase_category_idx" ON "GrievanceCase"("category");

-- CreateIndex
CREATE INDEX "GrievanceCase_type_idx" ON "GrievanceCase"("type");

-- CreateIndex
CREATE INDEX "GrievanceCase_status_idx" ON "GrievanceCase"("status");

-- CreateIndex
CREATE INDEX "GrievanceCase_priority_idx" ON "GrievanceCase"("priority");

-- CreateIndex
CREATE INDEX "GrievanceCase_escalationLevel_idx" ON "GrievanceCase"("escalationLevel");

-- CreateIndex
CREATE INDEX "GrievanceCase_tenantId_idx" ON "GrievanceCase"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GrievanceComplainantIdentity_caseId_key" ON "GrievanceComplainantIdentity"("caseId");

-- CreateIndex
CREATE INDEX "GrievanceComplainantIdentity_studentId_idx" ON "GrievanceComplainantIdentity"("studentId");

-- CreateIndex
CREATE INDEX "GrievanceComplainantIdentity_identityVisibility_idx" ON "GrievanceComplainantIdentity"("identityVisibility");

-- CreateIndex
CREATE INDEX "GrievanceComplainantIdentity_tenantId_idx" ON "GrievanceComplainantIdentity"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceEvidence_caseId_idx" ON "GrievanceEvidence"("caseId");

-- CreateIndex
CREATE INDEX "GrievanceEvidence_documentId_idx" ON "GrievanceEvidence"("documentId");

-- CreateIndex
CREATE INDEX "GrievanceEvidence_tenantId_idx" ON "GrievanceEvidence"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceInternalNote_caseId_idx" ON "GrievanceInternalNote"("caseId");

-- CreateIndex
CREATE INDEX "GrievanceInternalNote_authorId_idx" ON "GrievanceInternalNote"("authorId");

-- CreateIndex
CREATE INDEX "GrievanceInternalNote_tenantId_idx" ON "GrievanceInternalNote"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceCaseEvent_caseId_idx" ON "GrievanceCaseEvent"("caseId");

-- CreateIndex
CREATE INDEX "GrievanceCaseEvent_eventType_idx" ON "GrievanceCaseEvent"("eventType");

-- CreateIndex
CREATE INDEX "GrievanceCaseEvent_tenantId_idx" ON "GrievanceCaseEvent"("tenantId");

-- CreateIndex
CREATE INDEX "GrievancePolicy_category_idx" ON "GrievancePolicy"("category");

-- CreateIndex
CREATE INDEX "GrievancePolicy_version_idx" ON "GrievancePolicy"("version");

-- CreateIndex
CREATE INDEX "GrievancePolicy_tenantId_idx" ON "GrievancePolicy"("tenantId");

-- CreateIndex
CREATE INDEX "Journal_name_idx" ON "Journal"("name");

-- CreateIndex
CREATE INDEX "Journal_issn_idx" ON "Journal"("issn");

-- CreateIndex
CREATE INDEX "Journal_tenantId_idx" ON "Journal"("tenantId");

-- CreateIndex
CREATE INDEX "Conference_name_idx" ON "Conference"("name");

-- CreateIndex
CREATE INDEX "Conference_tenantId_idx" ON "Conference"("tenantId");

-- CreateIndex
CREATE INDEX "PatentInventor_patentId_idx" ON "PatentInventor"("patentId");

-- CreateIndex
CREATE INDEX "PatentInventor_userId_idx" ON "PatentInventor"("userId");

-- CreateIndex
CREATE INDEX "PatentInventor_studentId_idx" ON "PatentInventor"("studentId");

-- CreateIndex
CREATE INDEX "PatentInventor_tenantId_idx" ON "PatentInventor"("tenantId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_researchProjectId_idx" ON "ResearchAuthor"("researchProjectId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_publicationId_idx" ON "ResearchAuthor"("publicationId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_patentId_idx" ON "ResearchAuthor"("patentId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_userId_idx" ON "ResearchAuthor"("userId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_studentId_idx" ON "ResearchAuthor"("studentId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_orcidId_idx" ON "ResearchAuthor"("orcidId");

-- CreateIndex
CREATE INDEX "ResearchAuthor_tenantId_idx" ON "ResearchAuthor"("tenantId");

-- CreateIndex
CREATE INDEX "ResearchEvidence_researchProjectId_idx" ON "ResearchEvidence"("researchProjectId");

-- CreateIndex
CREATE INDEX "ResearchEvidence_publicationId_idx" ON "ResearchEvidence"("publicationId");

-- CreateIndex
CREATE INDEX "ResearchEvidence_patentId_idx" ON "ResearchEvidence"("patentId");

-- CreateIndex
CREATE INDEX "ResearchEvidence_documentId_idx" ON "ResearchEvidence"("documentId");

-- CreateIndex
CREATE INDEX "ResearchEvidence_evidenceType_idx" ON "ResearchEvidence"("evidenceType");

-- CreateIndex
CREATE INDEX "ResearchEvidence_tenantId_idx" ON "ResearchEvidence"("tenantId");

-- CreateIndex
CREATE INDEX "ResearchValidationResult_entityId_idx" ON "ResearchValidationResult"("entityId");

-- CreateIndex
CREATE INDEX "ResearchValidationResult_provider_idx" ON "ResearchValidationResult"("provider");

-- CreateIndex
CREATE INDEX "ResearchValidationResult_status_idx" ON "ResearchValidationResult"("status");

-- CreateIndex
CREATE INDEX "ResearchValidationResult_tenantId_idx" ON "ResearchValidationResult"("tenantId");

-- CreateIndex
CREATE INDEX "ResearchApprovalAction_entityId_idx" ON "ResearchApprovalAction"("entityId");

-- CreateIndex
CREATE INDEX "ResearchApprovalAction_actorId_idx" ON "ResearchApprovalAction"("actorId");

-- CreateIndex
CREATE INDEX "ResearchApprovalAction_action_idx" ON "ResearchApprovalAction"("action");

-- CreateIndex
CREATE INDEX "ResearchApprovalAction_tenantId_idx" ON "ResearchApprovalAction"("tenantId");

-- CreateIndex
CREATE INDEX "StartupFounder_startupId_idx" ON "StartupFounder"("startupId");

-- CreateIndex
CREATE INDEX "StartupFounder_userId_idx" ON "StartupFounder"("userId");

-- CreateIndex
CREATE INDEX "StartupFounder_studentId_idx" ON "StartupFounder"("studentId");

-- CreateIndex
CREATE INDEX "StartupFounder_tenantId_idx" ON "StartupFounder"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InnovationProject_projectCode_key" ON "InnovationProject"("projectCode");

-- CreateIndex
CREATE INDEX "InnovationProject_projectCode_idx" ON "InnovationProject"("projectCode");

-- CreateIndex
CREATE INDEX "InnovationProject_startupId_idx" ON "InnovationProject"("startupId");

-- CreateIndex
CREATE INDEX "InnovationProject_status_idx" ON "InnovationProject"("status");

-- CreateIndex
CREATE INDEX "InnovationProject_tenantId_idx" ON "InnovationProject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SSIPProject_projectCode_key" ON "SSIPProject"("projectCode");

-- CreateIndex
CREATE INDEX "SSIPProject_projectCode_idx" ON "SSIPProject"("projectCode");

-- CreateIndex
CREATE INDEX "SSIPProject_studentLeadId_idx" ON "SSIPProject"("studentLeadId");

-- CreateIndex
CREATE INDEX "SSIPProject_facultyMentorId_idx" ON "SSIPProject"("facultyMentorId");

-- CreateIndex
CREATE INDEX "SSIPProject_startupId_idx" ON "SSIPProject"("startupId");

-- CreateIndex
CREATE INDEX "SSIPProject_status_idx" ON "SSIPProject"("status");

-- CreateIndex
CREATE INDEX "SSIPProject_tenantId_idx" ON "SSIPProject"("tenantId");

-- CreateIndex
CREATE INDEX "Hackathon_name_idx" ON "Hackathon"("name");

-- CreateIndex
CREATE INDEX "Hackathon_status_idx" ON "Hackathon"("status");

-- CreateIndex
CREATE INDEX "Hackathon_tenantId_idx" ON "Hackathon"("tenantId");

-- CreateIndex
CREATE INDEX "HackathonTeam_hackathonId_idx" ON "HackathonTeam"("hackathonId");

-- CreateIndex
CREATE INDEX "HackathonTeam_teamName_idx" ON "HackathonTeam"("teamName");

-- CreateIndex
CREATE INDEX "HackathonTeam_tenantId_idx" ON "HackathonTeam"("tenantId");

-- CreateIndex
CREATE INDEX "HackathonMember_teamId_idx" ON "HackathonMember"("teamId");

-- CreateIndex
CREATE INDEX "HackathonMember_userId_idx" ON "HackathonMember"("userId");

-- CreateIndex
CREATE INDEX "HackathonMember_studentId_idx" ON "HackathonMember"("studentId");

-- CreateIndex
CREATE INDEX "HackathonMember_tenantId_idx" ON "HackathonMember"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Grant_grantCode_key" ON "Grant"("grantCode");

-- CreateIndex
CREATE INDEX "Grant_grantCode_idx" ON "Grant"("grantCode");

-- CreateIndex
CREATE INDEX "Grant_grantingAgency_idx" ON "Grant"("grantingAgency");

-- CreateIndex
CREATE INDEX "Grant_grantType_idx" ON "Grant"("grantType");

-- CreateIndex
CREATE INDEX "Grant_status_idx" ON "Grant"("status");

-- CreateIndex
CREATE INDEX "Grant_tenantId_idx" ON "Grant"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GrantApplication_applicationNumber_key" ON "GrantApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "GrantApplication_grantId_idx" ON "GrantApplication"("grantId");

-- CreateIndex
CREATE INDEX "GrantApplication_applicantUserId_idx" ON "GrantApplication"("applicantUserId");

-- CreateIndex
CREATE INDEX "GrantApplication_applicationNumber_idx" ON "GrantApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "GrantApplication_status_idx" ON "GrantApplication"("status");

-- CreateIndex
CREATE INDEX "GrantApplication_tenantId_idx" ON "GrantApplication"("tenantId");

-- CreateIndex
CREATE INDEX "GrantApprovalAction_entityId_idx" ON "GrantApprovalAction"("entityId");

-- CreateIndex
CREATE INDEX "GrantApprovalAction_actorId_idx" ON "GrantApprovalAction"("actorId");

-- CreateIndex
CREATE INDEX "GrantApprovalAction_action_idx" ON "GrantApprovalAction"("action");

-- CreateIndex
CREATE INDEX "GrantApprovalAction_tenantId_idx" ON "GrantApprovalAction"("tenantId");

-- CreateIndex
CREATE INDEX "GrantBudget_grantId_idx" ON "GrantBudget"("grantId");

-- CreateIndex
CREATE INDEX "GrantBudget_category_idx" ON "GrantBudget"("category");

-- CreateIndex
CREATE INDEX "GrantBudget_tenantId_idx" ON "GrantBudget"("tenantId");

-- CreateIndex
CREATE INDEX "GrantFundRelease_grantId_idx" ON "GrantFundRelease"("grantId");

-- CreateIndex
CREATE INDEX "GrantFundRelease_financeTransactionId_idx" ON "GrantFundRelease"("financeTransactionId");

-- CreateIndex
CREATE INDEX "GrantFundRelease_status_idx" ON "GrantFundRelease"("status");

-- CreateIndex
CREATE INDEX "GrantFundRelease_tenantId_idx" ON "GrantFundRelease"("tenantId");

-- CreateIndex
CREATE INDEX "GrantExpense_grantId_idx" ON "GrantExpense"("grantId");

-- CreateIndex
CREATE INDEX "GrantExpense_verificationStatus_idx" ON "GrantExpense"("verificationStatus");

-- CreateIndex
CREATE INDEX "GrantExpense_financeTransactionId_idx" ON "GrantExpense"("financeTransactionId");

-- CreateIndex
CREATE INDEX "GrantExpense_tenantId_idx" ON "GrantExpense"("tenantId");

-- CreateIndex
CREATE INDEX "GrantMilestone_grantId_idx" ON "GrantMilestone"("grantId");

-- CreateIndex
CREATE INDEX "GrantMilestone_status_idx" ON "GrantMilestone"("status");

-- CreateIndex
CREATE INDEX "GrantMilestone_tenantId_idx" ON "GrantMilestone"("tenantId");

-- CreateIndex
CREATE INDEX "GrantDocument_grantId_idx" ON "GrantDocument"("grantId");

-- CreateIndex
CREATE INDEX "GrantDocument_documentId_idx" ON "GrantDocument"("documentId");

-- CreateIndex
CREATE INDEX "GrantDocument_documentType_idx" ON "GrantDocument"("documentType");

-- CreateIndex
CREATE INDEX "GrantDocument_tenantId_idx" ON "GrantDocument"("tenantId");

-- CreateIndex
CREATE INDEX "GrantUtilizationRecord_grantId_idx" ON "GrantUtilizationRecord"("grantId");

-- CreateIndex
CREATE INDEX "GrantUtilizationRecord_status_idx" ON "GrantUtilizationRecord"("status");

-- CreateIndex
CREATE INDEX "GrantUtilizationRecord_tenantId_idx" ON "GrantUtilizationRecord"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentABCProfile_studentId_key" ON "StudentABCProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentABCProfile_abcId_key" ON "StudentABCProfile"("abcId");

-- CreateIndex
CREATE INDEX "StudentABCProfile_studentId_idx" ON "StudentABCProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentABCProfile_abcId_idx" ON "StudentABCProfile"("abcId");

-- CreateIndex
CREATE INDEX "StudentABCProfile_verificationStatus_idx" ON "StudentABCProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "StudentABCProfile_syncStatus_idx" ON "StudentABCProfile"("syncStatus");

-- CreateIndex
CREATE INDEX "StudentABCProfile_tenantId_idx" ON "StudentABCProfile"("tenantId");

-- CreateIndex
CREATE INDEX "ABCConsent_studentId_idx" ON "ABCConsent"("studentId");

-- CreateIndex
CREATE INDEX "ABCConsent_status_idx" ON "ABCConsent"("status");

-- CreateIndex
CREATE INDEX "ABCConsent_tenantId_idx" ON "ABCConsent"("tenantId");

-- CreateIndex
CREATE INDEX "AcademicCreditRecord_studentId_idx" ON "AcademicCreditRecord"("studentId");

-- CreateIndex
CREATE INDEX "AcademicCreditRecord_courseCode_idx" ON "AcademicCreditRecord"("courseCode");

-- CreateIndex
CREATE INDEX "AcademicCreditRecord_syncStatus_idx" ON "AcademicCreditRecord"("syncStatus");

-- CreateIndex
CREATE INDEX "AcademicCreditRecord_tenantId_idx" ON "AcademicCreditRecord"("tenantId");

-- CreateIndex
CREATE INDEX "GovernmentSyncLog_studentId_idx" ON "GovernmentSyncLog"("studentId");

-- CreateIndex
CREATE INDEX "GovernmentSyncLog_provider_idx" ON "GovernmentSyncLog"("provider");

-- CreateIndex
CREATE INDEX "GovernmentSyncLog_status_idx" ON "GovernmentSyncLog"("status");

-- CreateIndex
CREATE INDEX "GovernmentSyncLog_correlationId_idx" ON "GovernmentSyncLog"("correlationId");

-- CreateIndex
CREATE INDEX "GovernmentSyncLog_tenantId_idx" ON "GovernmentSyncLog"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DigiLockerProfile_studentId_key" ON "DigiLockerProfile"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerProfile_studentId_idx" ON "DigiLockerProfile"("studentId");

-- CreateIndex
CREATE INDEX "DigiLockerProfile_connectionStatus_idx" ON "DigiLockerProfile"("connectionStatus");

-- CreateIndex
CREATE INDEX "DigiLockerProfile_tenantId_idx" ON "DigiLockerProfile"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCredential_credentialNumber_key" ON "DigitalCredential"("credentialNumber");

-- CreateIndex
CREATE INDEX "DigitalCredential_studentId_idx" ON "DigitalCredential"("studentId");

-- CreateIndex
CREATE INDEX "DigitalCredential_credentialType_idx" ON "DigitalCredential"("credentialType");

-- CreateIndex
CREATE INDEX "DigitalCredential_status_idx" ON "DigitalCredential"("status");

-- CreateIndex
CREATE INDEX "DigitalCredential_tenantId_idx" ON "DigitalCredential"("tenantId");

-- CreateIndex
CREATE INDEX "IntegrationHealth_provider_idx" ON "IntegrationHealth"("provider");

-- CreateIndex
CREATE INDEX "IntegrationHealth_status_idx" ON "IntegrationHealth"("status");

-- CreateIndex
CREATE INDEX "IntegrationHealth_tenantId_idx" ON "IntegrationHealth"("tenantId");

-- CreateIndex
CREATE INDEX "COAssessmentMapping_courseId_idx" ON "COAssessmentMapping"("courseId");

-- CreateIndex
CREATE INDEX "COAssessmentMapping_courseOutcomeId_idx" ON "COAssessmentMapping"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "COAssessmentMapping_assessmentType_idx" ON "COAssessmentMapping"("assessmentType");

-- CreateIndex
CREATE INDEX "COAssessmentMapping_status_idx" ON "COAssessmentMapping"("status");

-- CreateIndex
CREATE INDEX "COAssessmentMapping_tenantId_idx" ON "COAssessmentMapping"("tenantId");

-- CreateIndex
CREATE INDEX "COAttainmentRecord_courseId_idx" ON "COAttainmentRecord"("courseId");

-- CreateIndex
CREATE INDEX "COAttainmentRecord_courseOutcomeId_idx" ON "COAttainmentRecord"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "COAttainmentRecord_academicYear_idx" ON "COAttainmentRecord"("academicYear");

-- CreateIndex
CREATE INDEX "COAttainmentRecord_status_idx" ON "COAttainmentRecord"("status");

-- CreateIndex
CREATE INDEX "COAttainmentRecord_tenantId_idx" ON "COAttainmentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "IndirectAssessment_courseId_idx" ON "IndirectAssessment"("courseId");

-- CreateIndex
CREATE INDEX "IndirectAssessment_courseOutcomeId_idx" ON "IndirectAssessment"("courseOutcomeId");

-- CreateIndex
CREATE INDEX "IndirectAssessment_sourceType_idx" ON "IndirectAssessment"("sourceType");

-- CreateIndex
CREATE INDEX "IndirectAssessment_academicYear_idx" ON "IndirectAssessment"("academicYear");

-- CreateIndex
CREATE INDEX "IndirectAssessment_tenantId_idx" ON "IndirectAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "POAttainmentRecord_programId_idx" ON "POAttainmentRecord"("programId");

-- CreateIndex
CREATE INDEX "POAttainmentRecord_programOutcomeId_idx" ON "POAttainmentRecord"("programOutcomeId");

-- CreateIndex
CREATE INDEX "POAttainmentRecord_academicYear_idx" ON "POAttainmentRecord"("academicYear");

-- CreateIndex
CREATE INDEX "POAttainmentRecord_status_idx" ON "POAttainmentRecord"("status");

-- CreateIndex
CREATE INDEX "POAttainmentRecord_tenantId_idx" ON "POAttainmentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "PSOAttainmentRecord_programId_idx" ON "PSOAttainmentRecord"("programId");

-- CreateIndex
CREATE INDEX "PSOAttainmentRecord_psoId_idx" ON "PSOAttainmentRecord"("psoId");

-- CreateIndex
CREATE INDEX "PSOAttainmentRecord_academicYear_idx" ON "PSOAttainmentRecord"("academicYear");

-- CreateIndex
CREATE INDEX "PSOAttainmentRecord_status_idx" ON "PSOAttainmentRecord"("status");

-- CreateIndex
CREATE INDEX "PSOAttainmentRecord_tenantId_idx" ON "PSOAttainmentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "NBAProgramProfile_programId_idx" ON "NBAProgramProfile"("programId");

-- CreateIndex
CREATE INDEX "NBAProgramProfile_status_idx" ON "NBAProgramProfile"("status");

-- CreateIndex
CREATE INDEX "NBAProgramProfile_tenantId_idx" ON "NBAProgramProfile"("tenantId");

-- CreateIndex
CREATE INDEX "NBAIndicator_programId_idx" ON "NBAIndicator"("programId");

-- CreateIndex
CREATE INDEX "NBAIndicator_criterionCode_idx" ON "NBAIndicator"("criterionCode");

-- CreateIndex
CREATE INDEX "NBAIndicator_indicatorCode_idx" ON "NBAIndicator"("indicatorCode");

-- CreateIndex
CREATE INDEX "NBAIndicator_tenantId_idx" ON "NBAIndicator"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationSnapshot_framework_idx" ON "AccreditationSnapshot"("framework");

-- CreateIndex
CREATE INDEX "AccreditationSnapshot_academicYear_idx" ON "AccreditationSnapshot"("academicYear");

-- CreateIndex
CREATE INDEX "AccreditationSnapshot_status_idx" ON "AccreditationSnapshot"("status");

-- CreateIndex
CREATE INDEX "AccreditationSnapshot_tenantId_idx" ON "AccreditationSnapshot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NEPAcademicIndicator_code_key" ON "NEPAcademicIndicator"("code");

-- CreateIndex
CREATE INDEX "NEPAcademicIndicator_code_idx" ON "NEPAcademicIndicator"("code");

-- CreateIndex
CREATE INDEX "NEPAcademicIndicator_category_idx" ON "NEPAcademicIndicator"("category");

-- CreateIndex
CREATE INDEX "NEPAcademicIndicator_academicYear_idx" ON "NEPAcademicIndicator"("academicYear");

-- CreateIndex
CREATE INDEX "NEPAcademicIndicator_tenantId_idx" ON "NEPAcademicIndicator"("tenantId");

-- CreateIndex
CREATE INDEX "AccreditationDataLineage_framework_idx" ON "AccreditationDataLineage"("framework");

-- CreateIndex
CREATE INDEX "AccreditationDataLineage_metricCode_idx" ON "AccreditationDataLineage"("metricCode");

-- CreateIndex
CREATE INDEX "AccreditationDataLineage_sourceModule_idx" ON "AccreditationDataLineage"("sourceModule");

-- CreateIndex
CREATE INDEX "AccreditationDataLineage_snapshotId_idx" ON "AccreditationDataLineage"("snapshotId");

-- CreateIndex
CREATE INDEX "AccreditationDataLineage_tenantId_idx" ON "AccreditationDataLineage"("tenantId");

-- CreateIndex
CREATE INDEX "AttainmentOverride_entityId_idx" ON "AttainmentOverride"("entityId");

-- CreateIndex
CREATE INDEX "AttainmentOverride_entityType_idx" ON "AttainmentOverride"("entityType");

-- CreateIndex
CREATE INDEX "AttainmentOverride_approvedBy_idx" ON "AttainmentOverride"("approvedBy");

-- CreateIndex
CREATE INDEX "AttainmentOverride_tenantId_idx" ON "AttainmentOverride"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCaseIdentity_caseId_key" ON "AnonymousCaseIdentity"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCaseIdentity_identityReference_key" ON "AnonymousCaseIdentity"("identityReference");

-- CreateIndex
CREATE INDEX "AnonymousCaseIdentity_identityReference_idx" ON "AnonymousCaseIdentity"("identityReference");

-- CreateIndex
CREATE INDEX "AnonymousCaseIdentity_tenantId_idx" ON "AnonymousCaseIdentity"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AntiRaggingCase_caseId_key" ON "AntiRaggingCase"("caseId");

-- CreateIndex
CREATE INDEX "AntiRaggingCase_severity_idx" ON "AntiRaggingCase"("severity");

-- CreateIndex
CREATE INDEX "AntiRaggingCase_status_idx" ON "AntiRaggingCase"("status");

-- CreateIndex
CREATE INDEX "AntiRaggingCase_isEmergency_idx" ON "AntiRaggingCase"("isEmergency");

-- CreateIndex
CREATE INDEX "AntiRaggingCase_tenantId_idx" ON "AntiRaggingCase"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ICCCase_caseId_key" ON "ICCCase"("caseId");

-- CreateIndex
CREATE INDEX "ICCCase_confidentialityLevel_idx" ON "ICCCase"("confidentialityLevel");

-- CreateIndex
CREATE INDEX "ICCCase_status_idx" ON "ICCCase"("status");

-- CreateIndex
CREATE INDEX "ICCCase_tenantId_idx" ON "ICCCase"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceCommittee_type_idx" ON "GrievanceCommittee"("type");

-- CreateIndex
CREATE INDEX "GrievanceCommittee_status_idx" ON "GrievanceCommittee"("status");

-- CreateIndex
CREATE INDEX "GrievanceCommittee_tenantId_idx" ON "GrievanceCommittee"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceCommitteeMember_committeeId_idx" ON "GrievanceCommitteeMember"("committeeId");

-- CreateIndex
CREATE INDEX "GrievanceCommitteeMember_userId_idx" ON "GrievanceCommitteeMember"("userId");

-- CreateIndex
CREATE INDEX "GrievanceCommitteeMember_role_idx" ON "GrievanceCommitteeMember"("role");

-- CreateIndex
CREATE INDEX "GrievanceCommitteeMember_tenantId_idx" ON "GrievanceCommitteeMember"("tenantId");

-- CreateIndex
CREATE INDEX "CaseAssignment_caseId_idx" ON "CaseAssignment"("caseId");

-- CreateIndex
CREATE INDEX "CaseAssignment_committeeId_idx" ON "CaseAssignment"("committeeId");

-- CreateIndex
CREATE INDEX "CaseAssignment_assignedTo_idx" ON "CaseAssignment"("assignedTo");

-- CreateIndex
CREATE INDEX "CaseAssignment_status_idx" ON "CaseAssignment"("status");

-- CreateIndex
CREATE INDEX "CaseAssignment_tenantId_idx" ON "CaseAssignment"("tenantId");

-- CreateIndex
CREATE INDEX "GrievanceSLAConfig_caseType_idx" ON "GrievanceSLAConfig"("caseType");

-- CreateIndex
CREATE INDEX "GrievanceSLAConfig_priority_idx" ON "GrievanceSLAConfig"("priority");

-- CreateIndex
CREATE INDEX "GrievanceSLAConfig_tenantId_idx" ON "GrievanceSLAConfig"("tenantId");

-- CreateIndex
CREATE INDEX "EscalationRule_caseType_idx" ON "EscalationRule"("caseType");

-- CreateIndex
CREATE INDEX "EscalationRule_priority_idx" ON "EscalationRule"("priority");

-- CreateIndex
CREATE INDEX "EscalationRule_tenantId_idx" ON "EscalationRule"("tenantId");

-- CreateIndex
CREATE INDEX "EscalationEvent_caseId_idx" ON "EscalationEvent"("caseId");

-- CreateIndex
CREATE INDEX "EscalationEvent_status_idx" ON "EscalationEvent"("status");

-- CreateIndex
CREATE INDEX "EscalationEvent_tenantId_idx" ON "EscalationEvent"("tenantId");

-- CreateIndex
CREATE INDEX "Investigation_caseId_idx" ON "Investigation"("caseId");

-- CreateIndex
CREATE INDEX "Investigation_investigatorId_idx" ON "Investigation"("investigatorId");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_tenantId_idx" ON "Investigation"("tenantId");

-- CreateIndex
CREATE INDEX "CaseEvidence_caseId_idx" ON "CaseEvidence"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvidence_documentId_idx" ON "CaseEvidence"("documentId");

-- CreateIndex
CREATE INDEX "CaseEvidence_verificationStatus_idx" ON "CaseEvidence"("verificationStatus");

-- CreateIndex
CREATE INDEX "CaseEvidence_tenantId_idx" ON "CaseEvidence"("tenantId");

-- CreateIndex
CREATE INDEX "CaseAction_caseId_idx" ON "CaseAction"("caseId");

-- CreateIndex
CREATE INDEX "CaseAction_status_idx" ON "CaseAction"("status");

-- CreateIndex
CREATE INDEX "CaseAction_tenantId_idx" ON "CaseAction"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseResolution_caseId_key" ON "CaseResolution"("caseId");

-- CreateIndex
CREATE INDEX "CaseResolution_caseId_idx" ON "CaseResolution"("caseId");

-- CreateIndex
CREATE INDEX "CaseResolution_status_idx" ON "CaseResolution"("status");

-- CreateIndex
CREATE INDEX "CaseResolution_tenantId_idx" ON "CaseResolution"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GrievanceRetentionPolicy_caseType_key" ON "GrievanceRetentionPolicy"("caseType");

-- CreateIndex
CREATE INDEX "GrievanceRetentionPolicy_caseType_idx" ON "GrievanceRetentionPolicy"("caseType");

-- CreateIndex
CREATE INDEX "GrievanceRetentionPolicy_legalHold_idx" ON "GrievanceRetentionPolicy"("legalHold");

-- CreateIndex
CREATE INDEX "GrievanceRetentionPolicy_tenantId_idx" ON "GrievanceRetentionPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "Patent_title_idx" ON "Patent"("title");

-- CreateIndex
CREATE INDEX "Patent_applicationNumber_idx" ON "Patent"("applicationNumber");

-- CreateIndex
CREATE INDEX "Patent_patentNumber_idx" ON "Patent"("patentNumber");

-- CreateIndex
CREATE INDEX "Patent_status_idx" ON "Patent"("status");

-- CreateIndex
CREATE INDEX "Patent_validationStatus_idx" ON "Patent"("validationStatus");

-- CreateIndex
CREATE INDEX "Patent_approvalStatus_idx" ON "Patent"("approvalStatus");

-- CreateIndex
CREATE INDEX "Patent_tenantId_idx" ON "Patent"("tenantId");

-- CreateIndex
CREATE INDEX "Publication_title_idx" ON "Publication"("title");

-- CreateIndex
CREATE INDEX "Publication_doi_idx" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "Publication_publicationType_idx" ON "Publication"("publicationType");

-- CreateIndex
CREATE INDEX "Publication_validationStatus_idx" ON "Publication"("validationStatus");

-- CreateIndex
CREATE INDEX "Publication_approvalStatus_idx" ON "Publication"("approvalStatus");

-- CreateIndex
CREATE INDEX "Publication_tenantId_idx" ON "Publication"("tenantId");

-- CreateIndex
CREATE INDEX "Startup_stage_idx" ON "Startup"("stage");

-- CreateIndex
CREATE INDEX "Startup_status_idx" ON "Startup"("status");

-- CreateIndex
CREATE INDEX "Startup_tenantId_idx" ON "Startup"("tenantId");

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPolicy" ADD CONSTRAINT "AgentPolicy_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentApproval" ADD CONSTRAINT "AgentApproval_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentApproval" ADD CONSTRAINT "AgentApproval_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAuditLog" ADD CONSTRAINT "AgentAuditLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAuditLog" ADD CONSTRAINT "AgentAuditLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionRequest" ADD CONSTRAINT "SubstitutionRequest_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableScheduleEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerificationResult" ADD CONSTRAINT "DocumentVerificationResult_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "DocumentExtraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConversation" ADD CONSTRAINT "FeeConversation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "FeeRecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeNegotiationProposal" ADD CONSTRAINT "FeeNegotiationProposal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "FeeRecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeEMIPlan" ADD CONSTRAINT "FeeEMIPlan_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "FeeRecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeEMIPlan" ADD CONSTRAINT "FeeEMIPlan_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "FeeNegotiationProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeEMIInstallment" ADD CONSTRAINT "FeeEMIInstallment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FeeEMIPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_communicationLogId_fkey" FOREIGN KEY ("communicationLogId") REFERENCES "CommunicationLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AutomationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicCreditLedger" ADD CONSTRAINT "AcademicCreditLedger_abcProfileId_fkey" FOREIGN KEY ("abcProfileId") REFERENCES "AcademicBankOfCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbcSyncRecord" ADD CONSTRAINT "AbcSyncRecord_abcProfileId_fkey" FOREIGN KEY ("abcProfileId") REFERENCES "AcademicBankOfCredit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COPOMapping" ADD CONSTRAINT "COPOMapping_coId_fkey" FOREIGN KEY ("coId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COPOMapping" ADD CONSTRAINT "COPOMapping_poId_fkey" FOREIGN KEY ("poId") REFERENCES "ProgramOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigiLockerDocument" ADD CONSTRAINT "DigiLockerDocument_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DigiLockerConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigiLockerSyncLog" ADD CONSTRAINT "DigiLockerSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DigiLockerConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationCriterion" ADD CONSTRAINT "AccreditationCriterion_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "AccreditationFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationMetric" ADD CONSTRAINT "AccreditationMetric_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AccreditationCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationAggregatedValue" ADD CONSTRAINT "AccreditationAggregatedValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "AccreditationMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationEvidence" ADD CONSTRAINT "AccreditationEvidence_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "AccreditationMetric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationReportJob" ADD CONSTRAINT "AccreditationReportJob_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AccreditationReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COPSOMapping" ADD CONSTRAINT "COPSOMapping_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COPSOMapping" ADD CONSTRAINT "COPSOMapping_programSpecificOutcomeId_fkey" FOREIGN KEY ("programSpecificOutcomeId") REFERENCES "ProgramSpecificOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCOMap" ADD CONSTRAINT "AssessmentCOMap_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCOAttainment" ADD CONSTRAINT "StudentCOAttainment_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAttainment" ADD CONSTRAINT "CourseAttainment_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAttainment" ADD CONSTRAINT "ProgramAttainment_programOutcomeId_fkey" FOREIGN KEY ("programOutcomeId") REFERENCES "ProgramOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBEImprovementAction" ADD CONSTRAINT "OBEImprovementAction_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceComplainantIdentity" ADD CONSTRAINT "GrievanceComplainantIdentity_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GrievanceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceEvidence" ADD CONSTRAINT "GrievanceEvidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GrievanceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceInternalNote" ADD CONSTRAINT "GrievanceInternalNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GrievanceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceCaseEvent" ADD CONSTRAINT "GrievanceCaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "GrievanceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatentInventor" ADD CONSTRAINT "PatentInventor_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchAuthor" ADD CONSTRAINT "ResearchAuthor_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchAuthor" ADD CONSTRAINT "ResearchAuthor_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchAuthor" ADD CONSTRAINT "ResearchAuthor_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchEvidence" ADD CONSTRAINT "ResearchEvidence_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchEvidence" ADD CONSTRAINT "ResearchEvidence_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchEvidence" ADD CONSTRAINT "ResearchEvidence_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchValidationResult" ADD CONSTRAINT "ResearchValidationResult_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchApprovalAction" ADD CONSTRAINT "ResearchApprovalAction_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchApprovalAction" ADD CONSTRAINT "ResearchApprovalAction_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "Patent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupFounder" ADD CONSTRAINT "StartupFounder_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationProject" ADD CONSTRAINT "InnovationProject_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSIPProject" ADD CONSTRAINT "SSIPProject_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonTeam" ADD CONSTRAINT "HackathonTeam_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonMember" ADD CONSTRAINT "HackathonMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "HackathonTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApprovalAction" ADD CONSTRAINT "GrantApprovalAction_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "GrantApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantBudget" ADD CONSTRAINT "GrantBudget_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantBudget" ADD CONSTRAINT "GrantBudget_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantFundRelease" ADD CONSTRAINT "GrantFundRelease_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantExpense" ADD CONSTRAINT "GrantExpense_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantExpense" ADD CONSTRAINT "GrantExpense_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantMilestone" ADD CONSTRAINT "GrantMilestone_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantMilestone" ADD CONSTRAINT "GrantMilestone_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantDocument" ADD CONSTRAINT "GrantDocument_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantDocument" ADD CONSTRAINT "GrantDocument_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantUtilizationRecord" ADD CONSTRAINT "GrantUtilizationRecord_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationDataLineage" ADD CONSTRAINT "AccreditationDataLineage_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AccreditationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceCommitteeMember" ADD CONSTRAINT "GrievanceCommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "GrievanceCommittee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "GrievanceCommittee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
