-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "address" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "universityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "departmentId" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "degreeType" TEXT NOT NULL DEFAULT 'UG',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "subjectType" TEXT NOT NULL DEFAULT 'THEORY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "currentDivisionId" TEXT,
    "abcId" TEXT,
    "abcIdStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "abcIdVerifiedByUserId" TEXT,
    "abcIdVerifiedByName" TEXT,
    "abcIdVerifiedAt" TIMESTAMP(3),
    "abcIdRejectionReason" TEXT,
    "abcIdAcademicYear" TEXT,
    "abcIdRemarks" TEXT,
    "temporaryEnrollmentNumber" TEXT,
    "finalEnrollmentNumber" TEXT,
    "enrollmentStatus" TEXT NOT NULL DEFAULT 'TEMPORARY',
    "studentAccessCode" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "finalEnrollmentAssignedAt" TIMESTAMP(3),
    "finalEnrollmentAssignedBy" TEXT,
    "firstLoginAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "temporaryEnrollmentNumber" TEXT,
    "finalEnrollmentNumber" TEXT,
    "enrollmentStatus" TEXT NOT NULL DEFAULT 'TEMPORARY',
    "studentAccessCode" TEXT,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "studentId" TEXT,
    "facultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authorityLevel" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "scopeType" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "scopeId" TEXT,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "RbacAudit" (
    "id" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "targetUserId" TEXT,
    "targetRoleId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RbacAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowDefinitionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "requiredRoleCode" TEXT NOT NULL,
    "minAuthorityLevel" INTEGER NOT NULL DEFAULT 10,
    "dataScope" TEXT NOT NULL DEFAULT 'OWN',
    "actionsAllowed" TEXT NOT NULL,
    "slaHours" INTEGER DEFAULT 24,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL,
    "workflowDefinitionId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStepNumber" INTEGER NOT NULL DEFAULT 1,
    "currentAssigneeRoleId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowHistory" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByRoleId" TEXT,
    "performedByAuthorityLevel" INTEGER,
    "stepNumber" INTEGER NOT NULL,
    "comments" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDelegation" (
    "id" TEXT NOT NULL,
    "delegatorUserId" TEXT NOT NULL,
    "delegateeUserId" TEXT NOT NULL,
    "minAuthorityLevel" INTEGER NOT NULL DEFAULT 10,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFacultyMapping" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "mappingType" TEXT NOT NULL DEFAULT 'COURSE_TEACHER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,

    CONSTRAINT "StudentFacultyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMentorMapping" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mentorFacultyId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,

    CONSTRAINT "StudentMentorMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mentorFacultyId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedByRole" TEXT NOT NULL,
    "assignedByName" TEXT,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT,
    "section" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAssignmentHistory" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousMentorId" TEXT,
    "previousMentorName" TEXT,
    "newMentorId" TEXT NOT NULL,
    "newMentorName" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultySubjectMapping" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultySubjectMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examTypeId" TEXT,
    "type" TEXT,
    "programId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "academicYearCode" TEXT,
    "semesterId" TEXT,
    "semesterNumber" INTEGER,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "session" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "formStartDate" TIMESTAMP(3),
    "formEndDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "instructions" TEXT,
    "notesheetId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubject" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examType" TEXT NOT NULL DEFAULT 'REGULAR',
    "examDate" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 180,
    "maximumMarks" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "passingMarks" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "internalMarks" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "externalMarks" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "credits" DECIMAL(4,2) NOT NULL DEFAULT 3,
    "examMode" TEXT NOT NULL DEFAULT 'OFFLINE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFee" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamLateFeeRule" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL DEFAULT 'FIXED',
    "amount" DECIMAL(10,2) NOT NULL,
    "maximumAmount" DECIMAL(10,2),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamLateFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFormWindow" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "windowOpen" TIMESTAMP(3) NOT NULL,
    "windowClose" TIMESTAMP(3) NOT NULL,
    "lateWindowClose" TIMESTAMP(3),
    "examFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lateFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamFormWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamForm" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "examFormWindowId" TEXT,
    "semesterId" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "examFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lateFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentOrderId" TEXT,
    "paymentTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationRemarks" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnedBy" TEXT,
    "returnReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFormSubject" (
    "id" TEXT NOT NULL,
    "examFormId" TEXT NOT NULL,
    "examinationSubjectId" TEXT,
    "subjectId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamFormSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "invigilator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examFormId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examScheduleId" TEXT,
    "internalMarks" DECIMAL(6,2),
    "maxInternalMarks" DECIMAL(6,2) DEFAULT 30,
    "externalMarks" DECIMAL(6,2),
    "maxExternalMarks" DECIMAL(6,2) DEFAULT 70,
    "practicalMarks" DECIMAL(6,2),
    "maxPracticalMarks" DECIMAL(6,2) DEFAULT 0,
    "marksObtained" DECIMAL(6,2),
    "maxMarks" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "grade" TEXT,
    "gradePoints" DECIMAL(4,2),
    "isPassed" BOOLEAN,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "isMalpractice" BOOLEAN NOT NULL DEFAULT false,
    "evaluationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "resultStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "enteredByUserId" TEXT,
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "evaluatedByUserId" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "originalMarks" DECIMAL(6,2),
    "correctionReason" TEXT,
    "returnReason" TEXT,
    "correctedByUserId" TEXT,
    "correctedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeHead" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "defaultAmount" DECIMAL(12,2) DEFAULT 0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeHeadAuditLog" (
    "id" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeHeadAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "structureCode" TEXT,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearCode" TEXT NOT NULL,
    "academicYearId" TEXT,
    "studentCategoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'PER_SEMESTER',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureAuditLog" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeStructureAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeAccount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "academicYearCode" TEXT NOT NULL,
    "totalDue" DECIMAL(12,2) NOT NULL,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalWaived" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeItem" (
    "id" TEXT NOT NULL,
    "studentFeeAccountId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "feeStructureItemId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "waivedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeAccountAuditLog" (
    "id" TEXT NOT NULL,
    "studentFeeAccountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeeAccountAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentFeeAccountId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "academicYearCode" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "waiverAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "remarks" TEXT,
    "issuedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "studentFeeItemId" TEXT,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInvoiceAuditLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeInvoiceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "gatewayOrderId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT,
    "invoiceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "gatewayPaymentId" TEXT,
    "gatewayOrderId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "failureReason" TEXT,
    "gatewayResponseReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentOrderId" TEXT,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "performedByName" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paymentTransactionId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "totalPaidAfter" DECIMAL(12,2) NOT NULL,
    "balanceRemaining" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" TEXT NOT NULL DEFAULT 'ONLINE',
    "gateway" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "pdfReference" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceiptAuditLog" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "performedByName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceiptAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feeStructureId" TEXT,
    "feeHeadId" TEXT,
    "calculationType" TEXT NOT NULL DEFAULT 'PER_DAY',
    "amount" DECIMAL(12,2) NOT NULL,
    "maximumAmount" DECIMAL(12,2),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "applyOnOutstanding" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LateFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "lateFeeAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LateFeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheet" (
    "id" TEXT NOT NULL,
    "notesheetNumber" TEXT NOT NULL,
    "notesheetType" TEXT NOT NULL DEFAULT 'Administrative',
    "visibility" TEXT NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "section" TEXT,
    "referenceNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "description" TEXT,
    "proposal" TEXT NOT NULL,
    "purposeJustification" TEXT NOT NULL,
    "financialRequirement" BOOLEAN NOT NULL DEFAULT false,
    "budgetRequired" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amountInWords" TEXT,
    "financialImpact" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expenseCategory" TEXT,
    "budgetHead" TEXT,
    "budgetAvailable" BOOLEAN NOT NULL DEFAULT false,
    "requestedAmount" DECIMAL(12,2),
    "approvedAmount" DECIMAL(12,2),
    "approvedAmountRemarks" TEXT,
    "approvedAmountByUserId" TEXT,
    "approvedAmountByName" TEXT,
    "approvedAmountAt" TIMESTAMP(3),
    "financeRemarks" TEXT,
    "procurementRequirement" TEXT,
    "supportingFinancialDoc" TEXT,
    "vendorQuotation" TEXT,
    "requiredDate" TIMESTAMP(3),
    "workflowDueDate" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "previousNoteSheetId" TEXT,
    "previousNoteSheetNumber" TEXT,
    "relatedNoteSheetIds" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentOffice" TEXT NOT NULL DEFAULT 'CREATOR',
    "currentHandlerId" TEXT,
    "decision" TEXT,
    "decisionDate" TIMESTAMP(3),
    "decisionReason" TEXT,
    "approvedByUserId" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectedByName" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "returnedByUserId" TEXT,
    "returnedByName" TEXT,
    "returnedAt" TIMESTAMP(3),
    "actionTakenSummary" TEXT,
    "actionTakenByUserId" TEXT,
    "actionTakenByName" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "actionTakenProofUrl" TEXT,
    "reopenedReason" TEXT,
    "reopenedByUserId" TEXT,
    "reopenedByName" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "closedByName" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdByRole" TEXT NOT NULL,
    "contactNumber" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "instituteId" TEXT,
    "instituteName" TEXT,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "periodMMYY" TEXT,
    "sequenceNumber" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetEstimateItem" (
    "id" TEXT NOT NULL,
    "notesheetId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Nos',
    "rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteSheetEstimateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetAttachment" (
    "id" TEXT NOT NULL,
    "notesheetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT NOT NULL,
    "documentCategory" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteSheetAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetHistory" (
    "id" TEXT NOT NULL,
    "notesheetId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "fromUserName" TEXT NOT NULL,
    "fromUserRole" TEXT NOT NULL,
    "toOffice" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteSheetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetComplianceItem" (
    "id" TEXT NOT NULL,
    "notesheetId" TEXT NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "responsibleDept" TEXT NOT NULL,
    "responsibleUserId" TEXT,
    "responsibleUserName" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSheetComplianceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetClarification" (
    "id" TEXT NOT NULL,
    "notesheetId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requestedByRole" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" TEXT,
    "respondedByUserId" TEXT,
    "respondedByName" TEXT,
    "respondedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "NoteSheetClarification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetWorkflowMatrix" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "notesheetType" TEXT,
    "financialRequired" BOOLEAN NOT NULL DEFAULT false,
    "minAmount" DECIMAL(12,2),
    "maxAmount" DECIMAL(12,2),
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "authorityRole" TEXT NOT NULL,
    "specificUserId" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "parallelGroupId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteSheetWorkflowMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSheetSequence" (
    "id" TEXT NOT NULL,
    "instituteCode" TEXT NOT NULL,
    "periodMMYY" TEXT NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSheetSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "transactionRef" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "FeePaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeDiscount" (
    "id" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "approvedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRefund" (
    "id" TEXT NOT NULL,
    "feeAccountId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refundMode" TEXT NOT NULL DEFAULT 'ONLINE',
    "processedAt" TIMESTAMP(3),
    "processedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "paymentTransactionId" TEXT,
    "gatewayPaymentId" TEXT,
    "transactionRef" TEXT,
    "studentId" TEXT,
    "reconciliationType" TEXT NOT NULL DEFAULT 'GATEWAY',
    "gatewayAmount" DECIMAL(12,2),
    "erpAmount" DECIMAL(12,2),
    "discrepancyAmount" DECIMAL(12,2) DEFAULT 0,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" TEXT,
    "gatewayStatus" TEXT,
    "erpStatus" TEXT,
    "reconciliationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "reconciledByUserId" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasurement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitOfMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMaster" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 10,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLedger" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "unitPrice" DECIMAL(12,2),
    "totalValue" DECIMAL(12,2),
    "remarks" TEXT,
    "performedByUserId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentNo" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityChanged" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adjustmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIssue" (
    "id" TEXT NOT NULL,
    "issueNo" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityIssued" INTEGER NOT NULL,
    "issuedToUserId" TEXT,
    "issuedToDepartment" TEXT,
    "issuedByUserId" TEXT NOT NULL,
    "purpose" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReturn" (
    "id" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityReturned" INTEGER NOT NULL,
    "returnCondition" TEXT NOT NULL DEFAULT 'GOOD',
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedByUserId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstNo" TEXT,
    "panNo" TEXT,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "departmentId" TEXT,
    "instituteId" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredByDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "workflowInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "estimatedUnitPrice" DECIMAL(12,2),
    "specifications" TEXT,
    "remarks" TEXT,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "vendorId" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "termsConditions" TEXT,
    "deliveryDays" INTEGER,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "purchaseRequestId" TEXT,
    "vendorId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "grnNo" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedByUserId" TEXT,
    "vehicleNo" TEXT,
    "dcNo" TEXT,
    "invoiceRef" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "quantityRejected" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "remarks" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "vendorInvoiceNo" TEXT,
    "purchaseOrderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(12,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL DEFAULT 'IT_EQUIPMENT',
    "description" TEXT,
    "parentId" TEXT,
    "depreciationRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "usefulLifeYears" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT,
    "building" TEXT NOT NULL,
    "block" TEXT,
    "floor" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'LAB',
    "labName" TEXT,
    "rackNumber" TEXT,
    "shelfNumber" TEXT,
    "drawerNumber" TEXT,
    "boxNumber" TEXT,
    "custodianName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "minimumStockLevel" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "reorderLevel" DECIMAL(10,2) NOT NULL DEFAULT 25,
    "standardRate" DECIMAL(10,2),
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT,
    "locationId" TEXT,
    "serialNo" TEXT,
    "modelNo" TEXT,
    "manufacturer" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    "usefulLifeYears" INTEGER NOT NULL DEFAULT 5,
    "depreciationRate" DECIMAL(5,2),
    "warrantyStart" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "vendor" TEXT,
    "poNo" TEXT,
    "invoiceRef" TEXT,
    "location" TEXT,
    "buildingBlock" TEXT,
    "floor" TEXT,
    "roomNo" TEXT,
    "assignedToUserId" TEXT,
    "assignedToName" TEXT,
    "assignedDeptId" TEXT,
    "assetCondition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cpuConfigJson" TEXT,
    "qrCodeData" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "assignedToName" TEXT NOT NULL,
    "assignedToEmpCode" TEXT,
    "assignedToDeptId" TEXT,
    "assignedToDeptName" TEXT,
    "assignedByUserId" TEXT,
    "assignedByName" TEXT,
    "location" TEXT,
    "roomNo" TEXT,
    "assignmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "conditionAtIssue" TEXT NOT NULL DEFAULT 'GOOD',
    "conditionAtReturn" TEXT,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransfer" (
    "id" TEXT NOT NULL,
    "transferNo" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromInstituteId" TEXT NOT NULL,
    "toInstituteId" TEXT NOT NULL,
    "fromDeptId" TEXT,
    "toDeptId" TEXT,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "fromCustodian" TEXT,
    "toCustodian" TEXT,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferredByUserId" TEXT,
    "transferredByName" TEXT,
    "authorizedByName" TEXT,
    "receivedByUserId" TEXT,
    "receivedByName" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "maintenanceNo" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "issueDescription" TEXT NOT NULL,
    "reportedByUserId" TEXT,
    "reportedByName" TEXT NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "vendorTechnician" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "partsReplaced" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "remarks" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDisposal" (
    "id" TEXT NOT NULL,
    "disposalNo" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "disposalMethod" TEXT NOT NULL DEFAULT 'SCRAPPED',
    "disposalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookValue" DECIMAL(10,2),
    "disposalValue" DECIMAL(10,2),
    "buyerName" TEXT,
    "reason" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "remarks" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT,
    "locationId" TEXT,
    "openingQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "receivedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "issuedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "returnedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "minimumStockLevel" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "reorderLevel" DECIMAL(10,2) NOT NULL DEFAULT 25,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT,
    "transactionType" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "unitPrice" DECIMAL(10,2),
    "totalAmount" DECIMAL(12,2),
    "vendorName" TEXT,
    "purchaseOrderNo" TEXT,
    "invoiceNo" TEXT,
    "issuedToUserId" TEXT,
    "issuedToName" TEXT,
    "issuedToDeptId" TEXT,
    "purpose" TEXT,
    "approvedByName" TEXT,
    "receivedByName" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "remarks" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalFileRecord" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileCategory" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT,
    "locationId" TEXT,
    "academicYear" TEXT,
    "documentYear" INTEGER DEFAULT 2026,
    "storageLocation" TEXT,
    "rackNumber" TEXT,
    "shelfNumber" TEXT,
    "boxNumber" TEXT,
    "custodianName" TEXT,
    "custodianEmployeeId" TEXT,
    "dateOpened" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalFileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalVerificationLog" (
    "id" TEXT NOT NULL,
    "verificationNo" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "expectedLocation" TEXT NOT NULL,
    "actualLocation" TEXT NOT NULL,
    "expectedCustodian" TEXT,
    "actualCustodian" TEXT,
    "physicalCondition" TEXT NOT NULL DEFAULT 'GOOD',
    "verifiedByUserId" TEXT,
    "verifiedByName" TEXT NOT NULL,
    "verificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "discrepancyNotes" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalVerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'INVENTORY',
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "performedByUserId" TEXT,
    "performedByName" TEXT NOT NULL,
    "performedByRole" TEXT,
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "remarks" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeServiceHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeServiceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxDaysPerYear" INTEGER NOT NULL DEFAULT 12,
    "isCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "totalAllocated" INTEGER NOT NULL DEFAULT 12,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "pendingDays" INTEGER NOT NULL DEFAULT 0,
    "remainingDays" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "workflowInstanceId" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicPay" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "da" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllow" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pfDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostelType" TEXT NOT NULL DEFAULT 'STANDARD',
    "gender" TEXT NOT NULL DEFAULT 'BOYS',
    "instituteId" TEXT,
    "building" TEXT,
    "address" TEXT,
    "location" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "wardenName" TEXT,
    "wardenPhone" TEXT,
    "wardenEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "block" TEXT DEFAULT 'Block A',
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "occupiedBeds" INTEGER NOT NULL DEFAULT 0,
    "roomType" TEXT NOT NULL DEFAULT 'DOUBLE',
    "facilities" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "programId" TEXT,
    "semesterId" TEXT,
    "preferredHostelId" TEXT,
    "roomPreference" TEXT DEFAULT 'NON_AC',
    "reason" TEXT,
    "documents" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAllotment" (
    "id" TEXT NOT NULL,
    "allotmentNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "allottedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allottedByUserId" TEXT,
    "checkInDate" TIMESTAMP(3),
    "expectedCheckout" TIMESTAMP(3),
    "vacatedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelTransfer" (
    "id" TEXT NOT NULL,
    "transferNo" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "fromBedId" TEXT NOT NULL,
    "toBedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelCheckInOut" (
    "id" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomInspection" TEXT DEFAULT 'GOOD',
    "noDuesCleared" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,

    CONSTRAINT "HostelCheckInOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutpassRequest" (
    "id" TEXT NOT NULL,
    "outpassNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "guardianContact" TEXT,
    "qrData" TEXT,
    "verificationCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "actualReturnTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutpassRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelVisitor" (
    "id" TEXT NOT NULL,
    "passNumber" TEXT,
    "visitorName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT,
    "relation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "visitorEmail" TEXT,
    "idProofType" TEXT DEFAULT 'AADHAAR',
    "idProofNumber" TEXT,
    "idProofDocumentUrl" TEXT,
    "visitorPhotoUrl" TEXT,
    "vehicleNumber" TEXT,
    "expectedCheckInDate" DATE,
    "expectedCheckOutDate" DATE,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "checkedInByUserId" TEXT,
    "checkedOutByUserId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelVisitorLog" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelVisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelComplaint" (
    "id" TEXT NOT NULL,
    "complaintNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelMaintenance" (
    "id" TEXT NOT NULL,
    "maintenanceNo" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT,
    "issue" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedStaff" TEXT,
    "cost" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelMaintenanceRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "roomId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "photoUrl" TEXT,
    "assignedToStaffId" TEXT,
    "assignedToStaffName" TEXT,
    "assignedByUserId" TEXT,
    "assignedByName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "expectedCompletionDate" TIMESTAMP(3),
    "slaHours" INTEGER NOT NULL DEFAULT 48,
    "slaDueDate" TIMESTAMP(3),
    "holdReason" TEXT,
    "resolutionDetails" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedPhotoUrl" TEXT,
    "studentConfirmedAt" TIMESTAMP(3),
    "studentRating" INTEGER,
    "studentFeedback" TEXT,
    "reopenedReason" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelMaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelMaintenanceHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "performedByRole" TEXT,
    "remarks" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelMaintenanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelMaintenanceAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "attachmentType" TEXT NOT NULL DEFAULT 'PROBLEM_PHOTO',
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "uploadedByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelMaintenanceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mess" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 200,
    "cateringBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessMenu" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessEnrollment" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "dietType" TEXT NOT NULL DEFAULT 'VEG',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL DEFAULT 'BUS',
    "makeModel" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "fuelType" TEXT NOT NULL DEFAULT 'DIESEL',
    "ownerType" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "rcNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "insuranceNumber" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "fitnessCertificateNumber" TEXT,
    "fitnessExpiry" TIMESTAMP(3),
    "permitNumber" TEXT,
    "permitExpiry" TIMESTAMP(3),
    "pollutionCertificateNumber" TEXT,
    "pucExpiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "driverName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL DEFAULT 'HEAVY_VEHICLE',
    "licenseIssueDate" TIMESTAMP(3),
    "licenseExpiry" TIMESTAMP(3),
    "experienceYears" DECIMAL(4,1) NOT NULL DEFAULT 5,
    "address" TEXT,
    "emergencyContact" TEXT,
    "driverPhotoUrl" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "docUrl" TEXT,
    "uploadedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDriverMapping" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDriverMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "routeNumber" TEXT NOT NULL,
    "routeCode" TEXT,
    "routeName" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "distanceKm" DECIMAL(6,2) NOT NULL DEFAULT 25,
    "estDurationMins" INTEGER NOT NULL DEFAULT 45,
    "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 2500,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRouteMapping" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL DEFAULT 'REGULAR',
    "assignedDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleRouteMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopName" TEXT NOT NULL,
    "stopCode" TEXT,
    "location" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "pickupTime" TEXT NOT NULL,
    "dropTime" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'NEW_ALLOCATION',
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportAllotment" (
    "id" TEXT NOT NULL,
    "allotmentNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "allocatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportPass" (
    "id" TEXT NOT NULL,
    "passNo" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3) NOT NULL,
    "verificationCode" TEXT,
    "qrData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportTrip" (
    "id" TEXT NOT NULL,
    "tripNo" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT,
    "tripDate" DATE NOT NULL,
    "shift" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "tripType" TEXT NOT NULL DEFAULT 'PICKUP',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportAttendance" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOARDED',
    "boardedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenance" (
    "id" TEXT NOT NULL,
    "maintenanceNo" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ENGINE',
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedStaff" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "notesheetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "docUrl" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "remarks" TEXT,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportIncident" (
    "id" TEXT NOT NULL,
    "incidentNo" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportComplaint" (
    "id" TEXT NOT NULL,
    "complaintNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT,
    "vehicleId" TEXT,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instituteId" TEXT,
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibrarySection" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibrarySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryShelf" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "shelfNumber" TEXT NOT NULL,
    "floor" TEXT DEFAULT 'Ground',
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryShelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentCategoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryAuthor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryPublisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryPublisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "edition" TEXT,
    "publicationYear" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'English',
    "categoryId" TEXT,
    "subjectId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "publisherId" TEXT,
    "publisherName" TEXT,
    "description" TEXT,
    "keywords" TEXT[],
    "coverImage" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'BOOK',
    "totalCopies" INTEGER NOT NULL DEFAULT 0,
    "availableCopies" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL,
    "accessionNo" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "libraryId" TEXT,
    "shelfId" TEXT,
    "rack" TEXT,
    "purchaseDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL DEFAULT 'NEW',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMembership" (
    "id" TEXT NOT NULL,
    "membershipNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "issueLimit" INTEGER NOT NULL DEFAULT 3,
    "validity" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryIssue" (
    "id" TEXT NOT NULL,
    "issueNo" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedDate" TIMESTAMP(3),
    "issuedByUserId" TEXT,
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "maxRenewals" INTEGER NOT NULL DEFAULT 2,
    "fineAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryReturn" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedByUserId" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "fineCharged" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryReservation" (
    "id" TEXT NOT NULL,
    "reservationNo" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryFine" (
    "id" TEXT NOT NULL,
    "fineNo" TEXT NOT NULL,
    "issueId" TEXT,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "transactionRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryFine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryIncident" (
    "id" TEXT NOT NULL,
    "incidentNo" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "evidenceDocId" TEXT,
    "replacementCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "resolvedAt" TIMESTAMP(3),
    "resolutionRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalResource" (
    "id" TEXT NOT NULL,
    "resourceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL,
    "fileDocId" TEXT,
    "accessUrl" TEXT,
    "bookId" TEXT,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "programId" TEXT,
    "subjectId" TEXT,
    "unitNumber" INTEGER,
    "facultyId" TEXT,
    "isRestricted" BOOLEAN NOT NULL DEFAULT true,
    "allowedRoles" TEXT[] DEFAULT ARRAY['STUDENT', 'FACULTY', 'LIBRARY_ADMIN', 'SUPER_ADMIN']::TEXT[],
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryNotice" (
    "id" TEXT NOT NULL,
    "noticeNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "targetId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryPolicy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "maxBooksIssued" INTEGER NOT NULL DEFAULT 3,
    "loanDurationDays" INTEGER NOT NULL DEFAULT 14,
    "maxRenewals" INTEGER NOT NULL DEFAULT 2,
    "finePerDay" DECIMAL(8,2) NOT NULL DEFAULT 5.00,
    "reservationDurationDays" INTEGER NOT NULL DEFAULT 3,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "lostBookMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "damageFinePercentage" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITTicket" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusServiceRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampusServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'INTERNAL',
    "researchArea" TEXT,
    "piFacultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "totalBudget" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CO_INVESTIGATOR',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliverable" TEXT,

    CONSTRAINT "ResearchMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGrant" (
    "id" TEXT NOT NULL,
    "grantNo" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fundingAgency" TEXT NOT NULL,
    "proposedAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "releasedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "utilizedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "journalName" TEXT NOT NULL,
    "publicationType" TEXT NOT NULL DEFAULT 'JOURNAL',
    "year" INTEGER NOT NULL,
    "doi" TEXT,
    "indexing" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "inventors" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "filingDate" TIMESTAMP(3) NOT NULL,
    "grantDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'FILED',

    CONSTRAINT "Patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnovationIdea" (
    "id" TEXT NOT NULL,
    "ideaCode" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "evaluationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InnovationIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncubationCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncubationCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL,
    "startupCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'IDEATION',
    "incubationCenterId" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupMember" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FOUNDER',

    CONSTRAINT "StartupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupMentor" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StartupMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupMilestone" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StartupMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementCompany" (
    "id" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementDrive" (
    "id" TEXT NOT NULL,
    "driveCode" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "packageLpa" DECIMAL(5,2) NOT NULL,
    "driveDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "eligibleMinCgpa" DECIMAL(3,2),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "PlacementDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementApplication" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "userId" TEXT,

    CONSTRAINT "PlacementApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementInterview" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "PlacementInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementOffer" (
    "id" TEXT NOT NULL,
    "offerNo" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "packageLpa" DECIMAL(5,2) NOT NULL,
    "offerLetter" TEXT,
    "joiningDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OFFERED',

    CONSTRAINT "PlacementOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trainer" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "currentCompany" TEXT,
    "designation" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "linkedinUrl" TEXT,
    "isMentor" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IQACActivity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IQACActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IQACMeeting" (
    "id" TEXT NOT NULL,
    "meetingNo" TEXT NOT NULL,
    "activityId" TEXT,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "agenda" TEXT NOT NULL,
    "minutes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "IQACMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IQACActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "IQACActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAACCriterion" (
    "id" TEXT NOT NULL,
    "criterionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weightage" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NAACCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAACMetric" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "metricNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" TEXT NOT NULL DEFAULT 'QUANTITATIVE',
    "weightage" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "NAACMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAACMetricData" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "dataValue" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT "NAACMetricData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAACEvidence" (
    "id" TEXT NOT NULL,
    "metricDataId" TEXT NOT NULL,
    "documentTitle" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NAACEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFramework" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsibleOffice" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "committeeType" TEXT NOT NULL,
    "chairperson" TEXT,
    "secretary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "userId" TEXT,
    "memberName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMeeting" (
    "id" TEXT NOT NULL,
    "meetingNo" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "agenda" TEXT NOT NULL,
    "minutes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "CommitteeMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL,
    "circularNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RTIRequest" (
    "id" TEXT NOT NULL,
    "rtiNo" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "responsibleOfficer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseSummary" TEXT,
    "disposedAt" TIMESTAMP(3),

    CONSTRAINT "RTIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "petitioner" TEXT NOT NULL,
    "respondent" TEXT NOT NULL,
    "hearingDate" TIMESTAMP(3),
    "responsibleOfficer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedOffice" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileTracking" (
    "id" TEXT NOT NULL,
    "fileNo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "originOffice" TEXT NOT NULL,
    "currentOffice" TEXT NOT NULL,
    "currentHolder" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgReporting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "reportsToUserId" TEXT,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "functionalDept" TEXT,
    "authorityLevel" INTEGER NOT NULL DEFAULT 10,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrgReporting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldRoleCode" TEXT,
    "newRoleCode" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAuthorityConfig" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canReject" BOOLEAN NOT NULL DEFAULT false,
    "canForward" BOOLEAN NOT NULL DEFAULT false,
    "canVerify" BOOLEAN NOT NULL DEFAULT false,
    "reportsToRole" TEXT,
    "nextAuthorityRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleAuthorityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkDiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workTitle" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "workDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "relatedModule" TEXT,
    "relatedPerson" TEXT,
    "relatedDepartment" TEXT,
    "relatedInstitute" TEXT,
    "departmentId" TEXT,
    "instituteId" TEXT,
    "remarks" TEXT,
    "submittedAt" TIMESTAMP(3),
    "facultyComments" TEXT,
    "facultyReviewedAt" TIMESTAMP(3),
    "facultyReviewedById" TEXT,
    "hodComments" TEXT,
    "hodReviewedAt" TIMESTAMP(3),
    "hodReviewedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkDiaryHistory" (
    "id" TEXT NOT NULL,
    "workDiaryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkDiaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "startDate" DATE,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "assignedByUserId" TEXT,
    "assignedToUserId" TEXT,
    "nextAction" TEXT,
    "nextActionDate" DATE,
    "relatedModule" TEXT,
    "relatedRecord" TEXT,
    "remarks" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDelegation" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "delegatedBy" TEXT NOT NULL,
    "delegatedTo" TEXT NOT NULL,
    "dueBy" DATE NOT NULL,
    "reason" TEXT,
    "delegatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalMeeting" (
    "id" TEXT NOT NULL,
    "organizerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "agenda" TEXT,
    "minutes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rsvp" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalAppointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "purpose" TEXT,
    "appointmentDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkFollowUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "relatedModule" TEXT,
    "relatedRecord" TEXT,
    "lastContactDate" DATE,
    "nextFollowUpDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "relatedModule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "actualStart" TEXT,
    "actualEnd" TEXT,
    "workDescription" TEXT NOT NULL,
    "outcome" TEXT,
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "inwardNo" TEXT,
    "outwardNo" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'INTERNAL',
    "communicationTypeId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "senderName" TEXT,
    "senderOrganization" TEXT,
    "senderEmail" TEXT,
    "receivedThrough" TEXT,
    "receivedDate" DATE,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "creatorUserId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "dueDate" DATE,
    "signatureStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "signedByUserId" TEXT,
    "signedDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationRecipient" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'TO',
    "recipientUserId" TEXT,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAssignment" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT NOT NULL,
    "departmentId" TEXT,
    "instruction" TEXT,
    "dueDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMovement" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "movedByUserId" TEXT NOT NULL,
    "fromOffice" TEXT NOT NULL,
    "toOffice" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "remarks" TEXT,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationApproval" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchRecord" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "dispatchNo" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientName" TEXT NOT NULL,
    "recipientAddress" TEXT,
    "dispatchMethod" TEXT NOT NULL DEFAULT 'COURIER',
    "trackingNo" TEXT,
    "courierAgency" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PREPARED',
    "deliveredDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardRegister" (
    "id" TEXT NOT NULL,
    "registerNo" TEXT NOT NULL,
    "receiptDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderName" TEXT NOT NULL,
    "senderOrganization" TEXT,
    "senderEmail" TEXT,
    "senderPhone" TEXT,
    "letterNumber" TEXT,
    "letterDate" DATE,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'LETTER',
    "departmentId" TEXT,
    "receivedByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "receivedThrough" TEXT NOT NULL DEFAULT 'POST',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "dueDate" DATE,
    "documentUrl" TEXT,
    "attachmentName" TEXT,
    "documentSize" INTEGER,
    "documentTypeMime" TEXT,
    "remarks" TEXT,
    "notesheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InwardRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardForwarding" (
    "id" TEXT NOT NULL,
    "inwardId" TEXT NOT NULL,
    "forwardedByUserId" TEXT NOT NULL,
    "forwardedToOffice" TEXT,
    "forwardedToDepartmentId" TEXT,
    "forwardedToUserId" TEXT,
    "forwardedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionRequired" TEXT NOT NULL,
    "dueDate" DATE,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actionTaken" TEXT,
    "actionTakenDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InwardForwarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardStatusHistory" (
    "id" TEXT NOT NULL,
    "inwardId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InwardStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardRegister" (
    "id" TEXT NOT NULL,
    "dispatchNo" TEXT NOT NULL,
    "dispatchDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letterDate" DATE,
    "receiverName" TEXT NOT NULL,
    "receiverOrganization" TEXT,
    "receiverAddress" TEXT,
    "receiverEmail" TEXT,
    "receiverPhone" TEXT,
    "subject" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'LETTER',
    "departmentId" TEXT,
    "sentByUserId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'COURIER',
    "courierService" TEXT,
    "trackingNo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expectedDeliveryDate" DATE,
    "deliveredDate" DATE,
    "deliveryStatus" TEXT,
    "documentUrl" TEXT,
    "attachmentName" TEXT,
    "remarks" TEXT,
    "notesheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutwardRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardDispatch" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "courierService" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" DATE,
    "deliveryDate" DATE,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "dispatchedByUserId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutwardDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutwardStatusHistory" (
    "id" TEXT NOT NULL,
    "outwardId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutwardStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InwardOutwardAuditLog" (
    "id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "inwardId" TEXT,
    "outwardId" TEXT,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InwardOutwardAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'CERTIFICATE',
    "expectedDays" INTEGER NOT NULL DEFAULT 3,
    "feeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "responsibleRoleCode" TEXT NOT NULL DEFAULT 'STUDENT_SECTION',
    "responsibleDept" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentServiceRequirement" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowedFileTypes" TEXT NOT NULL DEFAULT 'PDF,JPG,PNG',
    "maxSizeBytes" INTEGER NOT NULL DEFAULT 5242880,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentServiceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentServiceRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "departmentId" TEXT,
    "subject" TEXT,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "currentStage" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "currentAuthorityRole" TEXT NOT NULL DEFAULT 'STUDENT_SECTION',
    "assignedToUserId" TEXT,
    "assignedDepartmentId" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "resolution" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentServiceRequestDocument" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentServiceRequestDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentServiceRequestMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentServiceRequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentServiceRequestHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentServiceRequestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "requestId" TEXT,
    "studentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "academicYearCode" TEXT NOT NULL DEFAULT '2026-27',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "signatoryTitle" TEXT NOT NULL DEFAULT 'Registrar / Authorized Signatory',
    "verificationHash" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionCycle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "academicYearCode" TEXT NOT NULL DEFAULT '2026-27',
    "name" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL DEFAULT 'REGULAR',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "applicationFee" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionInquiry" (
    "id" TEXT NOT NULL,
    "inquiryNo" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "state" TEXT,
    "interestedInstituteId" TEXT,
    "interestedProgramId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "counsellorUserId" TEXT,
    "inquiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextFollowUpDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingRecord" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "counsellorUserId" TEXT NOT NULL,
    "counsellingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discussionPoints" TEXT NOT NULL,
    "applicantNeed" TEXT,
    "nextFollowUpDate" DATE,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "inquiryId" TEXT,
    "admissionCycleId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL DEFAULT 'REGULAR',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" DATE,
    "category" TEXT DEFAULT 'GENERAL',
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "qualifyingExam" TEXT,
    "qualifyingBoard" TEXT,
    "passingYear" INTEGER,
    "percentage" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "isFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "feeAmountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "feeReceiptNo" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "verifiedBy" TEXT,
    "remarks" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityRule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "minQualification" TEXT NOT NULL,
    "minPercentage" DECIMAL(5,2) NOT NULL,
    "requiredSubjects" TEXT,
    "entranceRequired" BOOLEAN NOT NULL DEFAULT false,
    "entranceExamName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityResult" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "calculatedPct" DECIMAL(5,2),
    "evaluationLog" TEXT,
    "evaluatedBy" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApproval" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdmissionApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "academicYearCode" TEXT NOT NULL DEFAULT '2026-27',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledBy" TEXT NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCentre" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instituteId" TEXT,
    "building" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 500,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "building" TEXT,
    "roomNumber" TEXT NOT NULL,
    "roomCode" TEXT,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "roomType" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "hasCCTV" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCentreAllocation" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allocatedCapacity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamCentreAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSeatAllocation" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "examScheduleId" TEXT,
    "centreId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hallTicketId" TEXT,
    "seatNumber" TEXT NOT NULL,
    "row" TEXT,
    "column" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "reason" TEXT,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSeatAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSeatChangeHistory" (
    "id" TEXT NOT NULL,
    "seatAllocationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "fromCentreId" TEXT,
    "toCentreId" TEXT,
    "fromRoomId" TEXT,
    "toRoomId" TEXT,
    "fromSeatNumber" TEXT,
    "toSeatNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSeatChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamEdpDuty" (
    "id" TEXT NOT NULL,
    "dutyNo" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "dutyDate" DATE NOT NULL,
    "shift" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "building" TEXT,
    "roomId" TEXT,
    "dutyType" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "assignedByUserId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamEdpDuty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamEdpDutyHistory" (
    "id" TEXT NOT NULL,
    "dutyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamEdpDutyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoomAllocation" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" TEXT,
    "deskNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamRoomAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvigilatorAssignment" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "facultyUserId" TEXT NOT NULL,
    "dutyDate" DATE NOT NULL,
    "reportingTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvigilatorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttendance" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "answerSheetNo" TEXT,
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "ExamAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallTicket" (
    "id" TEXT NOT NULL,
    "hallTicketNo" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examFormId" TEXT,
    "examSessionName" TEXT NOT NULL DEFAULT 'Summer 2026 Regular/Remedial',
    "verificationCode" TEXT NOT NULL,
    "examCentreId" TEXT,
    "centreName" TEXT,
    "building" TEXT,
    "roomNumber" TEXT,
    "seatNumber" TEXT,
    "requiresReissue" BOOLEAN NOT NULL DEFAULT false,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "qrData" TEXT,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HallTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationAssignment" (
    "id" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examinerUserId" TEXT NOT NULL,
    "totalBundles" INTEGER NOT NULL DEFAULT 1,
    "totalScripts" INTEGER NOT NULL DEFAULT 40,
    "evaluatedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedDate" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "EvaluationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "academicYearCode" TEXT NOT NULL DEFAULT '2026-27',
    "totalCredits" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "earnedCredits" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalMarks" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "maxMarks" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2),
    "sgpa" DECIMAL(4,2),
    "cgpa" DECIMAL(4,2),
    "backlogsCount" INTEGER NOT NULL DEFAULT 0,
    "resultStatus" TEXT NOT NULL DEFAULT 'PASS',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "marksheetNo" TEXT,
    "verificationCode" TEXT,
    "withheldCategory" TEXT,
    "withheldReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeConfiguration" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minPercentage" DECIMAL(5,2) NOT NULL,
    "maxPercentage" DECIMAL(5,2) NOT NULL,
    "gradePoint" DECIMAL(4,2) NOT NULL,
    "description" TEXT,
    "isPass" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultRevisionHistory" (
    "id" TEXT NOT NULL,
    "resultSummaryId" TEXT NOT NULL,
    "examResultId" TEXT,
    "previousMarks" DECIMAL(6,2),
    "newMarks" DECIMAL(6,2),
    "previousGrade" TEXT,
    "newGrade" TEXT,
    "previousResultStatus" TEXT,
    "newResultStatus" TEXT,
    "reason" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultRevisionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevaluationRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'REVALUATION',
    "originalMarks" DECIMAL(6,2) NOT NULL,
    "revisedMarks" DECIMAL(6,2),
    "feeAmount" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "isFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assignedExaminer" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevaluationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dutyType" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DutyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holidayDate" DATE NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NATIONAL',
    "instituteId" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2026-27',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL DEFAULT '2026-27',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalReview" (
    "id" TEXT NOT NULL,
    "appraisalCycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "selfAssessment" TEXT,
    "goalsAchieved" TEXT,
    "reviewerComments" TEXT,
    "selfRating" DECIMAL(3,1),
    "finalRating" DECIMAL(3,1),
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SELF_REVIEW_PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "processedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "totalGross" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicPay" DECIMAL(12,2) NOT NULL,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMode" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "transactionRef" TEXT,
    "paidDate" TIMESTAMP(3),

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payslipNo" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basic" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "specialAllow" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pfDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "vacanciesCount" INTEGER NOT NULL DEFAULT 1,
    "minExperience" INTEGER NOT NULL DEFAULT 2,
    "qualificationReq" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobRequisitionId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "experienceYears" DECIMAL(4,1) NOT NULL,
    "highestQual" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "interviewType" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "interviewerUserId" TEXT,
    "rating" DECIMAL(3,1),
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "jobApplicationId" TEXT NOT NULL,
    "offeredPosition" TEXT NOT NULL,
    "offeredSalary" DECIMAL(12,2) NOT NULL,
    "joiningDate" DATE NOT NULL,
    "offerLetterUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resignation" (
    "id" TEXT NOT NULL,
    "resignationNo" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedLWD" DATE NOT NULL,
    "officialLWD" DATE,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "exitInterview" TEXT,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resignation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExitClearance" (
    "id" TEXT NOT NULL,
    "resignationId" TEXT NOT NULL,
    "departmentNoDue" BOOLEAN NOT NULL DEFAULT false,
    "libraryNoDue" BOOLEAN NOT NULL DEFAULT false,
    "financeNoDue" BOOLEAN NOT NULL DEFAULT false,
    "itAssetsReturned" BOOLEAN NOT NULL DEFAULT false,
    "hrFinalSettled" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "ExitClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicRisk" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "attendanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "examinationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "predictionReason" TEXT,
    "recommendedAction" TEXT,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdpDuty" (
    "id" TEXT NOT NULL,
    "dutyNo" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectName" TEXT,
    "classRoom" TEXT NOT NULL,
    "batchOrDivision" TEXT,
    "teachingFacultyId" TEXT,
    "teachingFacultyName" TEXT,
    "assignedOfficerId" TEXT NOT NULL,
    "dutyDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "totalRegisteredStudents" INTEGER NOT NULL DEFAULT 0,
    "presentStudentCount" INTEGER NOT NULL DEFAULT 0,
    "absentStudentCount" INTEGER NOT NULL DEFAULT 0,
    "studentAttendancePercentage" DECIMAL(5,2),
    "lectureTopic" TEXT,
    "teachingMethodology" TEXT,
    "classroomEnvironment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "observations" TEXT,
    "remarks" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdpDuty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdpDutyPhoto" (
    "id" TEXT NOT NULL,
    "dutyId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" TEXT NOT NULL,
    "fileSize" INTEGER,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdpDutyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdpDutyStudentObservation" (
    "id" TEXT NOT NULL,
    "dutyId" TEXT NOT NULL,
    "studentId" TEXT,
    "enrollmentNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "attendanceStatus" TEXT NOT NULL DEFAULT 'PRESENT',
    "observationRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdpDutyStudentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdpDutyHistory" (
    "id" TEXT NOT NULL,
    "dutyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdpDutyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentralReportAuditLog" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "filterParams" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CentralReportAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImport" (
    "id" TEXT NOT NULL,
    "importNo" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "uploadedByRole" TEXT,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "importMode" TEXT NOT NULL DEFAULT 'INSERT_ONLY',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "validationSummary" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" TEXT NOT NULL,
    "parsedData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "targetId" TEXT,
    "errorMessage" TEXT,
    "errorField" TEXT,
    "warningMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImportHistory" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSectionService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urgentFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRefundable" BOOLEAN NOT NULL DEFAULT false,
    "deliveryMode" TEXT NOT NULL DEFAULT 'BOTH',
    "processingDays" INTEGER NOT NULL DEFAULT 3,
    "urgentProcessingDays" INTEGER NOT NULL DEFAULT 1,
    "requiredDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSectionService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSectionRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "semesterId" TEXT,
    "semesterName" TEXT,
    "serviceId" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "calculatedFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentTransactionId" TEXT,
    "receiptNo" TEXT,
    "paidAt" TIMESTAMP(3),
    "deliveryMode" TEXT NOT NULL DEFAULT 'BOTH',
    "deliveryAddress" TEXT,
    "trackingNumber" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assignedStaffId" TEXT,
    "assignedStaffName" TEXT,
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "documentId" TEXT,
    "documentNo" TEXT,
    "documentUrl" TEXT,
    "documentIssuedAt" TIMESTAMP(3),
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSectionDocument" (
    "id" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "generatedBy" TEXT NOT NULL,
    "generatedByName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "verificationCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentSectionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeQuery" (
    "id" TEXT NOT NULL,
    "queryNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "attachmentUrl" TEXT,
    "studentFeeRecordId" TEXT,
    "paymentTransactionId" TEXT,
    "claimedAmount" DOUBLE PRECISION,
    "transactionReferenceNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assignedAccountsHandlerId" TEXT,
    "assignedAccountsHandlerName" TEXT,
    "resolutionSummary" TEXT,
    "resolutionRemarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFeeConfig" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perSubjectAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateFeePerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRefundable" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamFeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEligibilityConfig" (
    "id" TEXT NOT NULL,
    "minimumAttendancePct" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "condonationFloorPct" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    "isCondonationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "academicYearId" TEXT,
    "updatedByUserId" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceEligibilityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentPhone" TEXT,
    "instituteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectFacultyId" TEXT NOT NULL,
    "subjectFacultyName" TEXT NOT NULL,
    "mentorFacultyId" TEXT NOT NULL,
    "mentorFacultyName" TEXT NOT NULL,
    "hodUserId" TEXT NOT NULL,
    "hodUserName" TEXT NOT NULL,
    "hoiUserId" TEXT NOT NULL,
    "hoiUserName" TEXT NOT NULL,
    "totalClasses" INTEGER NOT NULL,
    "presentClasses" INTEGER NOT NULL,
    "absentClasses" INTEGER NOT NULL,
    "currentAttendancePct" DOUBLE PRECISION NOT NULL,
    "requiredAttendancePct" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "shortagePct" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportingDocumentUrl" TEXT,
    "supportingDocumentName" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentHandlerRole" TEXT NOT NULL,
    "currentHandlerId" TEXT NOT NULL,
    "currentHandlerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED_TO_FACULTY',
    "finalEligibilityGranted" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityType" TEXT,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceApprovalHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "fromUserName" TEXT NOT NULL,
    "fromUserRole" TEXT NOT NULL,
    "toUserId" TEXT,
    "toUserName" TEXT,
    "toUserRole" TEXT,
    "remarks" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "required" TEXT NOT NULL DEFAULT 'REQUIRED',
    "studentType" TEXT NOT NULL DEFAULT 'ALL',
    "programId" TEXT,
    "departmentId" TEXT,
    "admissionType" TEXT,
    "semester" INTEGER,
    "internationalOnly" BOOLEAN NOT NULL DEFAULT false,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT true,
    "verifiedByRole" TEXT NOT NULL DEFAULT 'FACULTY_MENTOR',
    "allowedFileTypes" TEXT NOT NULL DEFAULT 'PDF,JPG,JPEG,PNG',
    "maxFileSize" INTEGER NOT NULL DEFAULT 10,
    "multipleFilesAllowed" BOOLEAN NOT NULL DEFAULT false,
    "expiryRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAcademicDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "documentMasterId" TEXT NOT NULL,
    "documentCode" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "studentType" TEXT NOT NULL DEFAULT 'DOMESTIC',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByUserId" TEXT,
    "verifiedByName" TEXT,
    "verifiedByRole" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAcademicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAcademicDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT,
    "remarks" TEXT,

    CONSTRAINT "StudentAcademicDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "reason" TEXT,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentApplicability" (
    "id" TEXT NOT NULL,
    "documentMasterId" TEXT NOT NULL,
    "studentType" TEXT NOT NULL DEFAULT 'ALL',
    "programId" TEXT,
    "departmentId" TEXT,
    "admissionType" TEXT,
    "semester" INTEGER,
    "requiredStatus" TEXT NOT NULL DEFAULT 'REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentApplicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialCorrespondence" (
    "id" TEXT NOT NULL,
    "correspondenceType" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "senderOrRecipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "instituteId" TEXT,
    "instituteName" TEXT,
    "departmentId" TEXT,
    "departmentName" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedOrPreparedByName" TEXT,
    "approvedByName" TEXT,
    "attachmentUrl" TEXT,
    "actionTaken" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialCorrespondence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileMovementRecord" (
    "id" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "currentHolder" TEXT NOT NULL,
    "fromOffice" TEXT NOT NULL,
    "toOffice" TEXT NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "actionRequired" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileMovementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsibleDepartment" TEXT NOT NULL,
    "responsiblePerson" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "complianceRemarks" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutoryApproval" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "applicantEntity" TEXT NOT NULL,
    "instituteId" TEXT,
    "departmentId" TEXT,
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "actionedByUserId" TEXT,
    "actionedByName" TEXT,
    "actionedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutoryApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFORMATION',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scopeType" TEXT NOT NULL DEFAULT 'TARGETED',
    "targetRole" TEXT,
    "targetInstituteId" TEXT,
    "targetDepartmentId" TEXT,
    "targetProgramId" TEXT,
    "targetSemesterId" TEXT,
    "targetDivisionId" TEXT,
    "targetAcademicYearId" TEXT,
    "linkTab" TEXT,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTransfer" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "fromUserName" TEXT NOT NULL,
    "fromUserRole" TEXT NOT NULL,
    "fromDepartmentId" TEXT,
    "fromDepartmentName" TEXT,
    "fromInstituteId" TEXT,
    "fromInstituteName" TEXT,
    "toUserId" TEXT NOT NULL,
    "toUserName" TEXT NOT NULL,
    "toUserRole" TEXT NOT NULL,
    "toDepartmentId" TEXT,
    "toDepartmentName" TEXT,
    "toInstituteId" TEXT,
    "toInstituteName" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "workItemIds" TEXT[],
    "workItemTypes" TEXT[],
    "totalItemsCount" INTEGER NOT NULL DEFAULT 0,
    "completedItemIds" TEXT[],
    "completedByUserId" TEXT,
    "completedByUserName" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelledByName" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedByName" TEXT,
    "auditTrail" JSONB,

    CONSTRAINT "WorkTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDataChangeRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fieldCategory" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentSize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENTOR_PENDING',
    "mentorId" TEXT,
    "mentorName" TEXT,
    "mentorRemarks" TEXT,
    "mentorActionAt" TIMESTAMP(3),
    "hodId" TEXT,
    "hodName" TEXT,
    "hodRemarks" TEXT,
    "hodActionAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDataChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDataChangeRequestAuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "remarks" TEXT,
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDataChangeRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_code_key" ON "University"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Institute_code_key" ON "Institute"("code");

-- CreateIndex
CREATE INDEX "Institute_universityId_idx" ON "Institute"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_instituteId_idx" ON "Department"("instituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_code_key" ON "Batch"("code");

-- CreateIndex
CREATE INDEX "Batch_programId_idx" ON "Batch"("programId");

-- CreateIndex
CREATE INDEX "Batch_academicYearId_idx" ON "Batch"("academicYearId");

-- CreateIndex
CREATE INDEX "Semester_batchId_idx" ON "Semester"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_batchId_semesterNumber_key" ON "Semester"("batchId", "semesterNumber");

-- CreateIndex
CREATE INDEX "Division_semesterId_idx" ON "Division"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Division_semesterId_name_key" ON "Division"("semesterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_programId_idx" ON "Subject"("programId");

-- CreateIndex
CREATE INDEX "Subject_semesterId_idx" ON "Subject"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_erpId_key" ON "Student"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_enrollmentNo_key" ON "Student"("enrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_temporaryEnrollmentNumber_key" ON "Student"("temporaryEnrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_finalEnrollmentNumber_key" ON "Student"("finalEnrollmentNumber");

-- CreateIndex
CREATE INDEX "Student_instituteId_idx" ON "Student"("instituteId");

-- CreateIndex
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");

-- CreateIndex
CREATE INDEX "Student_batchId_idx" ON "Student"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_erpId_key" ON "Faculty"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employeeCode_key" ON "Faculty"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE INDEX "Faculty_instituteId_idx" ON "Faculty"("instituteId");

-- CreateIndex
CREATE INDEX "Faculty_departmentId_idx" ON "Faculty"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_erpId_key" ON "User"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_temporaryEnrollmentNumber_key" ON "User"("temporaryEnrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_finalEnrollmentNumber_key" ON "User"("finalEnrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_facultyId_key" ON "User"("facultyId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_erpId_idx" ON "User"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "LoginAudit_userId_idx" ON "LoginAudit"("userId");

-- CreateIndex
CREATE INDEX "LoginAudit_createdAt_idx" ON "LoginAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "Role_authorityLevel_idx" ON "Role"("authorityLevel");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_module_idx" ON "Permission"("module");

-- CreateIndex
CREATE INDEX "Permission_action_idx" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "RbacAudit_targetUserId_idx" ON "RbacAudit"("targetUserId");

-- CreateIndex
CREATE INDEX "RbacAudit_performedByUserId_idx" ON "RbacAudit"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_code_key" ON "WorkflowDefinition"("code");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_code_idx" ON "WorkflowDefinition"("code");

-- CreateIndex
CREATE INDEX "WorkflowDefinition_module_idx" ON "WorkflowDefinition"("module");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowDefinitionId_idx" ON "WorkflowStep"("workflowDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowDefinitionId_stepNumber_key" ON "WorkflowStep"("workflowDefinitionId", "stepNumber");

-- CreateIndex
CREATE INDEX "WorkflowInstance_workflowDefinitionId_idx" ON "WorkflowInstance"("workflowDefinitionId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_entityId_idx" ON "WorkflowInstance"("entityId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_currentStatus_idx" ON "WorkflowInstance"("currentStatus");

-- CreateIndex
CREATE INDEX "WorkflowInstance_requestedByUserId_idx" ON "WorkflowInstance"("requestedByUserId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_instanceId_idx" ON "WorkflowHistory"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowHistory_performedByUserId_idx" ON "WorkflowHistory"("performedByUserId");

-- CreateIndex
CREATE INDEX "WorkflowDelegation_delegatorUserId_idx" ON "WorkflowDelegation"("delegatorUserId");

-- CreateIndex
CREATE INDEX "WorkflowDelegation_delegateeUserId_idx" ON "WorkflowDelegation"("delegateeUserId");

-- CreateIndex
CREATE INDEX "StudentFacultyMapping_studentId_idx" ON "StudentFacultyMapping"("studentId");

-- CreateIndex
CREATE INDEX "StudentFacultyMapping_facultyId_idx" ON "StudentFacultyMapping"("facultyId");

-- CreateIndex
CREATE INDEX "StudentFacultyMapping_subjectId_idx" ON "StudentFacultyMapping"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFacultyMapping_studentId_subjectId_mappingType_key" ON "StudentFacultyMapping"("studentId", "subjectId", "mappingType");

-- CreateIndex
CREATE INDEX "StudentMentorMapping_studentId_idx" ON "StudentMentorMapping"("studentId");

-- CreateIndex
CREATE INDEX "StudentMentorMapping_mentorFacultyId_idx" ON "StudentMentorMapping"("mentorFacultyId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentMentorMapping_studentId_academicYearId_key" ON "StudentMentorMapping"("studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "MentorAssignment_studentId_idx" ON "MentorAssignment"("studentId");

-- CreateIndex
CREATE INDEX "MentorAssignment_mentorFacultyId_idx" ON "MentorAssignment"("mentorFacultyId");

-- CreateIndex
CREATE INDEX "MentorAssignment_departmentId_idx" ON "MentorAssignment"("departmentId");

-- CreateIndex
CREATE INDEX "MentorAssignment_instituteId_idx" ON "MentorAssignment"("instituteId");

-- CreateIndex
CREATE INDEX "MentorAssignment_status_idx" ON "MentorAssignment"("status");

-- CreateIndex
CREATE INDEX "MentorAssignmentHistory_assignmentId_idx" ON "MentorAssignmentHistory"("assignmentId");

-- CreateIndex
CREATE INDEX "MentorAssignmentHistory_studentId_idx" ON "MentorAssignmentHistory"("studentId");

-- CreateIndex
CREATE INDEX "FacultySubjectMapping_facultyId_idx" ON "FacultySubjectMapping"("facultyId");

-- CreateIndex
CREATE INDEX "FacultySubjectMapping_subjectId_idx" ON "FacultySubjectMapping"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultySubjectMapping_facultyId_subjectId_divisionId_key" ON "FacultySubjectMapping"("facultyId", "subjectId", "divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_code_key" ON "ExamType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_code_key" ON "Exam"("code");

-- CreateIndex
CREATE INDEX "Exam_examTypeId_idx" ON "Exam"("examTypeId");

-- CreateIndex
CREATE INDEX "Exam_programId_idx" ON "Exam"("programId");

-- CreateIndex
CREATE INDEX "Exam_instituteId_idx" ON "Exam"("instituteId");

-- CreateIndex
CREATE INDEX "Exam_departmentId_idx" ON "Exam"("departmentId");

-- CreateIndex
CREATE INDEX "Exam_academicYearId_idx" ON "Exam"("academicYearId");

-- CreateIndex
CREATE INDEX "Exam_semesterId_idx" ON "Exam"("semesterId");

-- CreateIndex
CREATE INDEX "Exam_status_idx" ON "Exam"("status");

-- CreateIndex
CREATE INDEX "Exam_notesheetId_idx" ON "Exam"("notesheetId");

-- CreateIndex
CREATE INDEX "Exam_createdAt_idx" ON "Exam"("createdAt");

-- CreateIndex
CREATE INDEX "ExamSubject_examId_idx" ON "ExamSubject"("examId");

-- CreateIndex
CREATE INDEX "ExamSubject_subjectId_idx" ON "ExamSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubject_examId_subjectId_examType_key" ON "ExamSubject"("examId", "subjectId", "examType");

-- CreateIndex
CREATE INDEX "ExamFee_examId_idx" ON "ExamFee"("examId");

-- CreateIndex
CREATE INDEX "ExamFee_examType_idx" ON "ExamFee"("examType");

-- CreateIndex
CREATE INDEX "ExamLateFeeRule_examId_idx" ON "ExamLateFeeRule"("examId");

-- CreateIndex
CREATE INDEX "ExamLateFeeRule_isActive_idx" ON "ExamLateFeeRule"("isActive");

-- CreateIndex
CREATE INDEX "ExamFormWindow_examId_idx" ON "ExamFormWindow"("examId");

-- CreateIndex
CREATE INDEX "ExamFormWindow_status_idx" ON "ExamFormWindow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamForm_formNumber_key" ON "ExamForm"("formNumber");

-- CreateIndex
CREATE INDEX "ExamForm_examId_idx" ON "ExamForm"("examId");

-- CreateIndex
CREATE INDEX "ExamForm_studentId_idx" ON "ExamForm"("studentId");

-- CreateIndex
CREATE INDEX "ExamForm_formNumber_idx" ON "ExamForm"("formNumber");

-- CreateIndex
CREATE INDEX "ExamForm_status_idx" ON "ExamForm"("status");

-- CreateIndex
CREATE INDEX "ExamForm_paymentStatus_idx" ON "ExamForm"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExamForm_examId_studentId_attemptNumber_key" ON "ExamForm"("examId", "studentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "ExamFormSubject_examFormId_idx" ON "ExamFormSubject"("examFormId");

-- CreateIndex
CREATE INDEX "ExamFormSubject_subjectId_idx" ON "ExamFormSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamFormSubject_examFormId_subjectId_key" ON "ExamFormSubject"("examFormId", "subjectId");

-- CreateIndex
CREATE INDEX "ExamSchedule_examId_idx" ON "ExamSchedule"("examId");

-- CreateIndex
CREATE INDEX "ExamSchedule_subjectId_idx" ON "ExamSchedule"("subjectId");

-- CreateIndex
CREATE INDEX "ExamSchedule_examDate_idx" ON "ExamSchedule"("examDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSchedule_examId_subjectId_key" ON "ExamSchedule"("examId", "subjectId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult"("studentId");

-- CreateIndex
CREATE INDEX "ExamResult_subjectId_idx" ON "ExamResult"("subjectId");

-- CreateIndex
CREATE INDEX "ExamResult_resultStatus_idx" ON "ExamResult"("resultStatus");

-- CreateIndex
CREATE INDEX "ExamResult_evaluationStatus_idx" ON "ExamResult"("evaluationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examFormId_subjectId_key" ON "ExamResult"("examFormId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_code_key" ON "FeeHead"("code");

-- CreateIndex
CREATE INDEX "FeeHead_code_idx" ON "FeeHead"("code");

-- CreateIndex
CREATE INDEX "FeeHead_category_idx" ON "FeeHead"("category");

-- CreateIndex
CREATE INDEX "FeeHead_isActive_idx" ON "FeeHead"("isActive");

-- CreateIndex
CREATE INDEX "FeeHead_status_idx" ON "FeeHead"("status");

-- CreateIndex
CREATE INDEX "FeeHeadAuditLog_feeHeadId_idx" ON "FeeHeadAuditLog"("feeHeadId");

-- CreateIndex
CREATE INDEX "FeeHeadAuditLog_performedByUserId_idx" ON "FeeHeadAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "FeeHeadAuditLog_createdAt_idx" ON "FeeHeadAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_structureCode_key" ON "FeeStructure"("structureCode");

-- CreateIndex
CREATE INDEX "FeeStructure_structureCode_idx" ON "FeeStructure"("structureCode");

-- CreateIndex
CREATE INDEX "FeeStructure_instituteId_idx" ON "FeeStructure"("instituteId");

-- CreateIndex
CREATE INDEX "FeeStructure_departmentId_idx" ON "FeeStructure"("departmentId");

-- CreateIndex
CREATE INDEX "FeeStructure_programId_idx" ON "FeeStructure"("programId");

-- CreateIndex
CREATE INDEX "FeeStructure_semesterId_idx" ON "FeeStructure"("semesterId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearCode_idx" ON "FeeStructure"("academicYearCode");

-- CreateIndex
CREATE INDEX "FeeStructure_status_idx" ON "FeeStructure"("status");

-- CreateIndex
CREATE INDEX "FeeStructureItem_feeStructureId_idx" ON "FeeStructureItem"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_feeHeadId_idx" ON "FeeStructureItem"("feeHeadId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureItem_feeStructureId_feeHeadId_key" ON "FeeStructureItem"("feeStructureId", "feeHeadId");

-- CreateIndex
CREATE INDEX "FeeStructureAuditLog_feeStructureId_idx" ON "FeeStructureAuditLog"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureAuditLog_performedByUserId_idx" ON "FeeStructureAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "FeeStructureAuditLog_createdAt_idx" ON "FeeStructureAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "StudentFeeAccount_studentId_idx" ON "StudentFeeAccount"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeeAccount_feeStructureId_idx" ON "StudentFeeAccount"("feeStructureId");

-- CreateIndex
CREATE INDEX "StudentFeeAccount_status_idx" ON "StudentFeeAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeAccount_studentId_feeStructureId_key" ON "StudentFeeAccount"("studentId", "feeStructureId");

-- CreateIndex
CREATE INDEX "StudentFeeItem_studentFeeAccountId_idx" ON "StudentFeeItem"("studentFeeAccountId");

-- CreateIndex
CREATE INDEX "StudentFeeItem_feeHeadId_idx" ON "StudentFeeItem"("feeHeadId");

-- CreateIndex
CREATE INDEX "StudentFeeItem_status_idx" ON "StudentFeeItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeItem_studentFeeAccountId_feeHeadId_key" ON "StudentFeeItem"("studentFeeAccountId", "feeHeadId");

-- CreateIndex
CREATE INDEX "StudentFeeAccountAuditLog_studentFeeAccountId_idx" ON "StudentFeeAccountAuditLog"("studentFeeAccountId");

-- CreateIndex
CREATE INDEX "StudentFeeAccountAuditLog_performedByUserId_idx" ON "StudentFeeAccountAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "StudentFeeAccountAuditLog_createdAt_idx" ON "StudentFeeAccountAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeeInvoice_invoiceNumber_key" ON "FeeInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "FeeInvoice_studentId_idx" ON "FeeInvoice"("studentId");

-- CreateIndex
CREATE INDEX "FeeInvoice_studentFeeAccountId_idx" ON "FeeInvoice"("studentFeeAccountId");

-- CreateIndex
CREATE INDEX "FeeInvoice_feeStructureId_idx" ON "FeeInvoice"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeInvoice_invoiceNumber_idx" ON "FeeInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "FeeInvoice_status_idx" ON "FeeInvoice"("status");

-- CreateIndex
CREATE INDEX "FeeInvoice_dueDate_idx" ON "FeeInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "FeeInvoice_createdAt_idx" ON "FeeInvoice"("createdAt");

-- CreateIndex
CREATE INDEX "FeeInvoiceItem_invoiceId_idx" ON "FeeInvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "FeeInvoiceItem_feeHeadId_idx" ON "FeeInvoiceItem"("feeHeadId");

-- CreateIndex
CREATE INDEX "FeeInvoiceItem_studentFeeItemId_idx" ON "FeeInvoiceItem"("studentFeeItemId");

-- CreateIndex
CREATE INDEX "FeeInvoiceAuditLog_invoiceId_idx" ON "FeeInvoiceAuditLog"("invoiceId");

-- CreateIndex
CREATE INDEX "FeeInvoiceAuditLog_performedByUserId_idx" ON "FeeInvoiceAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "FeeInvoiceAuditLog_createdAt_idx" ON "FeeInvoiceAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_orderNumber_key" ON "PaymentOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PaymentOrder_invoiceId_idx" ON "PaymentOrder"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentOrder_studentId_idx" ON "PaymentOrder"("studentId");

-- CreateIndex
CREATE INDEX "PaymentOrder_gatewayOrderId_idx" ON "PaymentOrder"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");

-- CreateIndex
CREATE INDEX "PaymentOrder_createdAt_idx" ON "PaymentOrder"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionNumber_key" ON "PaymentTransaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_gatewayPaymentId_key" ON "PaymentTransaction"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentOrderId_idx" ON "PaymentTransaction"("paymentOrderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_studentId_idx" ON "PaymentTransaction"("studentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gatewayPaymentId_idx" ON "PaymentTransaction"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paidAt_idx" ON "PaymentTransaction"("paidAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_transactionId_idx" ON "PaymentAuditLog"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_paymentOrderId_idx" ON "PaymentAuditLog"("paymentOrderId");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_performedByUserId_idx" ON "PaymentAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_createdAt_idx" ON "PaymentAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_receiptNumber_key" ON "PaymentReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_paymentTransactionId_key" ON "PaymentReceipt"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_receiptNumber_idx" ON "PaymentReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "PaymentReceipt_paymentTransactionId_idx" ON "PaymentReceipt"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_invoiceId_idx" ON "PaymentReceipt"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_studentId_idx" ON "PaymentReceipt"("studentId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_paymentDate_idx" ON "PaymentReceipt"("paymentDate");

-- CreateIndex
CREATE INDEX "PaymentReceipt_createdAt_idx" ON "PaymentReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentReceiptAuditLog_receiptId_idx" ON "PaymentReceiptAuditLog"("receiptId");

-- CreateIndex
CREATE INDEX "PaymentReceiptAuditLog_performedByUserId_idx" ON "PaymentReceiptAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "PaymentReceiptAuditLog_createdAt_idx" ON "PaymentReceiptAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LateFeeRule_feeStructureId_idx" ON "LateFeeRule"("feeStructureId");

-- CreateIndex
CREATE INDEX "LateFeeRule_feeHeadId_idx" ON "LateFeeRule"("feeHeadId");

-- CreateIndex
CREATE INDEX "LateFeeRule_isActive_idx" ON "LateFeeRule"("isActive");

-- CreateIndex
CREATE INDEX "LateFeeRule_createdAt_idx" ON "LateFeeRule"("createdAt");

-- CreateIndex
CREATE INDEX "LateFeeRecord_invoiceId_idx" ON "LateFeeRecord"("invoiceId");

-- CreateIndex
CREATE INDEX "LateFeeRecord_ruleId_idx" ON "LateFeeRecord"("ruleId");

-- CreateIndex
CREATE INDEX "LateFeeRecord_status_idx" ON "LateFeeRecord"("status");

-- CreateIndex
CREATE INDEX "LateFeeRecord_calculationDate_idx" ON "LateFeeRecord"("calculationDate");

-- CreateIndex
CREATE INDEX "LateFeeRecord_createdAt_idx" ON "LateFeeRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSheet_notesheetNumber_key" ON "NoteSheet"("notesheetNumber");

-- CreateIndex
CREATE INDEX "NoteSheet_notesheetNumber_idx" ON "NoteSheet"("notesheetNumber");

-- CreateIndex
CREATE INDEX "NoteSheet_instituteId_periodMMYY_sequenceNumber_idx" ON "NoteSheet"("instituteId", "periodMMYY", "sequenceNumber");

-- CreateIndex
CREATE INDEX "NoteSheet_department_idx" ON "NoteSheet"("department");

-- CreateIndex
CREATE INDEX "NoteSheet_section_idx" ON "NoteSheet"("section");

-- CreateIndex
CREATE INDEX "NoteSheet_status_idx" ON "NoteSheet"("status");

-- CreateIndex
CREATE INDEX "NoteSheet_priority_idx" ON "NoteSheet"("priority");

-- CreateIndex
CREATE INDEX "NoteSheet_visibility_idx" ON "NoteSheet"("visibility");

-- CreateIndex
CREATE INDEX "NoteSheet_createdByUserId_idx" ON "NoteSheet"("createdByUserId");

-- CreateIndex
CREATE INDEX "NoteSheet_currentOffice_idx" ON "NoteSheet"("currentOffice");

-- CreateIndex
CREATE INDEX "NoteSheet_createdAt_idx" ON "NoteSheet"("createdAt");

-- CreateIndex
CREATE INDEX "NoteSheetEstimateItem_notesheetId_idx" ON "NoteSheetEstimateItem"("notesheetId");

-- CreateIndex
CREATE INDEX "NoteSheetAttachment_notesheetId_idx" ON "NoteSheetAttachment"("notesheetId");

-- CreateIndex
CREATE INDEX "NoteSheetAttachment_uploadedByUserId_idx" ON "NoteSheetAttachment"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "NoteSheetHistory_notesheetId_idx" ON "NoteSheetHistory"("notesheetId");

-- CreateIndex
CREATE INDEX "NoteSheetHistory_action_idx" ON "NoteSheetHistory"("action");

-- CreateIndex
CREATE INDEX "NoteSheetHistory_fromUserId_idx" ON "NoteSheetHistory"("fromUserId");

-- CreateIndex
CREATE INDEX "NoteSheetHistory_createdAt_idx" ON "NoteSheetHistory"("createdAt");

-- CreateIndex
CREATE INDEX "NoteSheetComplianceItem_notesheetId_idx" ON "NoteSheetComplianceItem"("notesheetId");

-- CreateIndex
CREATE INDEX "NoteSheetComplianceItem_status_idx" ON "NoteSheetComplianceItem"("status");

-- CreateIndex
CREATE INDEX "NoteSheetClarification_notesheetId_idx" ON "NoteSheetClarification"("notesheetId");

-- CreateIndex
CREATE INDEX "NoteSheetClarification_status_idx" ON "NoteSheetClarification"("status");

-- CreateIndex
CREATE INDEX "NoteSheetWorkflowMatrix_instituteId_departmentId_notesheetT_idx" ON "NoteSheetWorkflowMatrix"("instituteId", "departmentId", "notesheetType");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSheetSequence_instituteCode_periodMMYY_key" ON "NoteSheetSequence"("instituteCode", "periodMMYY");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_receiptNo_key" ON "FeePayment"("receiptNo");

-- CreateIndex
CREATE INDEX "FeePayment_feeAccountId_idx" ON "FeePayment"("feeAccountId");

-- CreateIndex
CREATE INDEX "FeePayment_paymentDate_idx" ON "FeePayment"("paymentDate");

-- CreateIndex
CREATE INDEX "FeePayment_status_idx" ON "FeePayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeePaymentItem_paymentId_feeHeadId_key" ON "FeePaymentItem"("paymentId", "feeHeadId");

-- CreateIndex
CREATE INDEX "FeeDiscount_feeAccountId_idx" ON "FeeDiscount"("feeAccountId");

-- CreateIndex
CREATE INDEX "FeeRefund_feeAccountId_idx" ON "FeeRefund"("feeAccountId");

-- CreateIndex
CREATE INDEX "FeeRefund_status_idx" ON "FeeRefund"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReconciliation_reconciliationNumber_key" ON "PaymentReconciliation"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_reconciliationNumber_idx" ON "PaymentReconciliation"("reconciliationNumber");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_paymentTransactionId_idx" ON "PaymentReconciliation"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_gatewayPaymentId_idx" ON "PaymentReconciliation"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_reconciliationStatus_idx" ON "PaymentReconciliation"("reconciliationStatus");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_paymentDate_idx" ON "PaymentReconciliation"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_code_key" ON "ItemCategory"("code");

-- CreateIndex
CREATE INDEX "ItemCategory_parentId_idx" ON "ItemCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasurement_code_key" ON "UnitOfMeasurement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItemMaster_itemCode_key" ON "ItemMaster"("itemCode");

-- CreateIndex
CREATE INDEX "ItemMaster_categoryId_idx" ON "ItemMaster"("categoryId");

-- CreateIndex
CREATE INDEX "ItemMaster_currentStock_idx" ON "ItemMaster"("currentStock");

-- CreateIndex
CREATE INDEX "StockLedger_itemId_idx" ON "StockLedger"("itemId");

-- CreateIndex
CREATE INDEX "StockLedger_transactionType_idx" ON "StockLedger"("transactionType");

-- CreateIndex
CREATE INDEX "StockLedger_transactionDate_idx" ON "StockLedger"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_adjustmentNo_key" ON "StockAdjustment"("adjustmentNo");

-- CreateIndex
CREATE INDEX "StockAdjustment_itemId_idx" ON "StockAdjustment"("itemId");

-- CreateIndex
CREATE INDEX "StockAdjustment_adjustmentType_idx" ON "StockAdjustment"("adjustmentType");

-- CreateIndex
CREATE INDEX "StockAdjustment_status_idx" ON "StockAdjustment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockIssue_issueNo_key" ON "StockIssue"("issueNo");

-- CreateIndex
CREATE INDEX "StockIssue_itemId_idx" ON "StockIssue"("itemId");

-- CreateIndex
CREATE INDEX "StockIssue_issuedToUserId_idx" ON "StockIssue"("issuedToUserId");

-- CreateIndex
CREATE INDEX "StockIssue_status_idx" ON "StockIssue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StockReturn_returnNo_key" ON "StockReturn"("returnNo");

-- CreateIndex
CREATE INDEX "StockReturn_issueId_idx" ON "StockReturn"("issueId");

-- CreateIndex
CREATE INDEX "StockReturn_itemId_idx" ON "StockReturn"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNo_key" ON "PurchaseRequest"("requestNo");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requestedByUserId_idx" ON "PurchaseRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requestDate_idx" ON "PurchaseRequest"("requestDate");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_purchaseRequestId_idx" ON "PurchaseRequestItem"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_itemId_idx" ON "PurchaseRequestItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");

-- CreateIndex
CREATE INDEX "Quotation_purchaseRequestId_idx" ON "Quotation"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Quotation_vendorId_idx" ON "Quotation"("vendorId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_key" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grnNo_key" ON "GoodsReceipt"("grnNo");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_idx" ON "GoodsReceipt"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_receivedDate_idx" ON "GoodsReceipt"("receivedDate");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_grnId_idx" ON "GoodsReceiptItem"("grnId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_itemId_idx" ON "GoodsReceiptItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNo_key" ON "PurchaseInvoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_purchaseOrderId_idx" ON "PurchaseInvoice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_vendorId_idx" ON "PurchaseInvoice"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_paymentStatus_idx" ON "PurchaseInvoice"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_code_key" ON "AssetCategory"("code");

-- CreateIndex
CREATE INDEX "AssetCategory_parentId_idx" ON "AssetCategory"("parentId");

-- CreateIndex
CREATE INDEX "AssetCategory_categoryType_idx" ON "AssetCategory"("categoryType");

-- CreateIndex
CREATE INDEX "InventoryLocation_instituteId_idx" ON "InventoryLocation"("instituteId");

-- CreateIndex
CREATE INDEX "InventoryLocation_departmentId_idx" ON "InventoryLocation"("departmentId");

-- CreateIndex
CREATE INDEX "InventoryLocation_building_roomNo_idx" ON "InventoryLocation"("building", "roomNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");

-- CreateIndex
CREATE INDEX "InventoryItem_isConsumable_idx" ON "InventoryItem"("isConsumable");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "Asset_instituteId_idx" ON "Asset"("instituteId");

-- CreateIndex
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_assetTag_idx" ON "Asset"("assetTag");

-- CreateIndex
CREATE INDEX "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");

-- CreateIndex
CREATE INDEX "AssetAssignment_assignedToUserId_idx" ON "AssetAssignment"("assignedToUserId");

-- CreateIndex
CREATE INDEX "AssetAssignment_status_idx" ON "AssetAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransfer_transferNo_key" ON "AssetTransfer"("transferNo");

-- CreateIndex
CREATE INDEX "AssetTransfer_assetId_idx" ON "AssetTransfer"("assetId");

-- CreateIndex
CREATE INDEX "AssetTransfer_status_idx" ON "AssetTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssetMaintenance_maintenanceNo_key" ON "AssetMaintenance"("maintenanceNo");

-- CreateIndex
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");

-- CreateIndex
CREATE INDEX "AssetMaintenance_status_idx" ON "AssetMaintenance"("status");

-- CreateIndex
CREATE INDEX "AssetMaintenance_maintenanceType_idx" ON "AssetMaintenance"("maintenanceType");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_disposalNo_key" ON "AssetDisposal"("disposalNo");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_assetId_key" ON "AssetDisposal"("assetId");

-- CreateIndex
CREATE INDEX "AssetDisposal_status_idx" ON "AssetDisposal"("status");

-- CreateIndex
CREATE INDEX "AssetDisposal_disposalDate_idx" ON "AssetDisposal"("disposalDate");

-- CreateIndex
CREATE INDEX "StockBalance_instituteId_idx" ON "StockBalance"("instituteId");

-- CreateIndex
CREATE INDEX "StockBalance_departmentId_idx" ON "StockBalance"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_itemId_instituteId_departmentId_key" ON "StockBalance"("itemId", "instituteId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransaction_transactionNo_key" ON "StockTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "StockTransaction_itemId_idx" ON "StockTransaction"("itemId");

-- CreateIndex
CREATE INDEX "StockTransaction_instituteId_idx" ON "StockTransaction"("instituteId");

-- CreateIndex
CREATE INDEX "StockTransaction_departmentId_idx" ON "StockTransaction"("departmentId");

-- CreateIndex
CREATE INDEX "StockTransaction_transactionType_idx" ON "StockTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "StockTransaction_transactionDate_idx" ON "StockTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalFileRecord_fileId_key" ON "PhysicalFileRecord"("fileId");

-- CreateIndex
CREATE INDEX "PhysicalFileRecord_instituteId_idx" ON "PhysicalFileRecord"("instituteId");

-- CreateIndex
CREATE INDEX "PhysicalFileRecord_departmentId_idx" ON "PhysicalFileRecord"("departmentId");

-- CreateIndex
CREATE INDEX "PhysicalFileRecord_fileCategory_idx" ON "PhysicalFileRecord"("fileCategory");

-- CreateIndex
CREATE INDEX "PhysicalFileRecord_status_idx" ON "PhysicalFileRecord"("status");

-- CreateIndex
CREATE INDEX "PhysicalFileRecord_fileNumber_idx" ON "PhysicalFileRecord"("fileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalVerificationLog_verificationNo_key" ON "PhysicalVerificationLog"("verificationNo");

-- CreateIndex
CREATE INDEX "PhysicalVerificationLog_assetId_idx" ON "PhysicalVerificationLog"("assetId");

-- CreateIndex
CREATE INDEX "PhysicalVerificationLog_verificationDate_idx" ON "PhysicalVerificationLog"("verificationDate");

-- CreateIndex
CREATE INDEX "PhysicalVerificationLog_status_idx" ON "PhysicalVerificationLog"("status");

-- CreateIndex
CREATE INDEX "InventoryAuditLog_action_idx" ON "InventoryAuditLog"("action");

-- CreateIndex
CREATE INDEX "InventoryAuditLog_entityId_idx" ON "InventoryAuditLog"("entityId");

-- CreateIndex
CREATE INDEX "InventoryAuditLog_timestamp_idx" ON "InventoryAuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_erpId_key" ON "Employee"("erpId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_instituteId_idx" ON "Employee"("instituteId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_employmentStatus_idx" ON "Employee"("employmentStatus");

-- CreateIndex
CREATE INDEX "EmployeeServiceHistory_employeeId_idx" ON "EmployeeServiceHistory"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");

-- CreateIndex
CREATE INDEX "LeaveBalance_employeeId_idx" ON "LeaveBalance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_academicYear_key" ON "LeaveBalance"("employeeId", "leaveTypeId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveApplication_applicationNo_key" ON "LeaveApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_idx" ON "LeaveApplication"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_idx" ON "LeaveApplication"("status");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_employeeId_idx" ON "EmployeeAttendance"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAttendance_attendanceDate_idx" ON "EmployeeAttendance"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAttendance_employeeId_attendanceDate_key" ON "EmployeeAttendance"("employeeId", "attendanceDate");

-- CreateIndex
CREATE INDEX "SalaryStructure_employeeId_idx" ON "SalaryStructure"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_code_key" ON "Hostel"("code");

-- CreateIndex
CREATE INDEX "Hostel_gender_idx" ON "Hostel"("gender");

-- CreateIndex
CREATE INDEX "Hostel_status_idx" ON "Hostel"("status");

-- CreateIndex
CREATE INDEX "HostelRoom_hostelId_idx" ON "HostelRoom"("hostelId");

-- CreateIndex
CREATE INDEX "HostelRoom_status_idx" ON "HostelRoom"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRoom_hostelId_roomNumber_key" ON "HostelRoom"("hostelId", "roomNumber");

-- CreateIndex
CREATE INDEX "HostelBed_roomId_idx" ON "HostelBed"("roomId");

-- CreateIndex
CREATE INDEX "HostelBed_status_idx" ON "HostelBed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBed_roomId_bedNumber_key" ON "HostelBed"("roomId", "bedNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HostelApplication_applicationNo_key" ON "HostelApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "HostelApplication_studentId_idx" ON "HostelApplication"("studentId");

-- CreateIndex
CREATE INDEX "HostelApplication_status_idx" ON "HostelApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAllotment_allotmentNo_key" ON "HostelAllotment"("allotmentNo");

-- CreateIndex
CREATE INDEX "HostelAllotment_studentId_idx" ON "HostelAllotment"("studentId");

-- CreateIndex
CREATE INDEX "HostelAllotment_hostelId_idx" ON "HostelAllotment"("hostelId");

-- CreateIndex
CREATE INDEX "HostelAllotment_status_idx" ON "HostelAllotment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelTransfer_transferNo_key" ON "HostelTransfer"("transferNo");

-- CreateIndex
CREATE INDEX "HostelTransfer_allotmentId_idx" ON "HostelTransfer"("allotmentId");

-- CreateIndex
CREATE INDEX "HostelCheckInOut_allotmentId_idx" ON "HostelCheckInOut"("allotmentId");

-- CreateIndex
CREATE INDEX "HostelAttendance_hostelId_idx" ON "HostelAttendance"("hostelId");

-- CreateIndex
CREATE INDEX "HostelAttendance_attendanceDate_idx" ON "HostelAttendance"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAttendance_studentId_attendanceDate_key" ON "HostelAttendance"("studentId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "OutpassRequest_outpassNo_key" ON "OutpassRequest"("outpassNo");

-- CreateIndex
CREATE INDEX "OutpassRequest_studentId_idx" ON "OutpassRequest"("studentId");

-- CreateIndex
CREATE INDEX "OutpassRequest_status_idx" ON "OutpassRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelVisitor_passNumber_key" ON "HostelVisitor"("passNumber");

-- CreateIndex
CREATE INDEX "HostelVisitor_passNumber_idx" ON "HostelVisitor"("passNumber");

-- CreateIndex
CREATE INDEX "HostelVisitor_studentId_idx" ON "HostelVisitor"("studentId");

-- CreateIndex
CREATE INDEX "HostelVisitor_hostelId_idx" ON "HostelVisitor"("hostelId");

-- CreateIndex
CREATE INDEX "HostelVisitor_roomId_idx" ON "HostelVisitor"("roomId");

-- CreateIndex
CREATE INDEX "HostelVisitor_status_idx" ON "HostelVisitor"("status");

-- CreateIndex
CREATE INDEX "HostelVisitor_checkInTime_idx" ON "HostelVisitor"("checkInTime");

-- CreateIndex
CREATE INDEX "HostelVisitorLog_visitorId_idx" ON "HostelVisitorLog"("visitorId");

-- CreateIndex
CREATE INDEX "HostelVisitorLog_performedByUserId_idx" ON "HostelVisitorLog"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelComplaint_complaintNo_key" ON "HostelComplaint"("complaintNo");

-- CreateIndex
CREATE INDEX "HostelComplaint_studentId_idx" ON "HostelComplaint"("studentId");

-- CreateIndex
CREATE INDEX "HostelComplaint_hostelId_idx" ON "HostelComplaint"("hostelId");

-- CreateIndex
CREATE INDEX "HostelComplaint_status_idx" ON "HostelComplaint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelMaintenance_maintenanceNo_key" ON "HostelMaintenance"("maintenanceNo");

-- CreateIndex
CREATE INDEX "HostelMaintenance_hostelId_idx" ON "HostelMaintenance"("hostelId");

-- CreateIndex
CREATE INDEX "HostelMaintenance_status_idx" ON "HostelMaintenance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelMaintenanceRequest_requestNo_key" ON "HostelMaintenanceRequest"("requestNo");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_requestNo_idx" ON "HostelMaintenanceRequest"("requestNo");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_studentId_idx" ON "HostelMaintenanceRequest"("studentId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_hostelId_idx" ON "HostelMaintenanceRequest"("hostelId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_roomId_idx" ON "HostelMaintenanceRequest"("roomId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_category_idx" ON "HostelMaintenanceRequest"("category");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_priority_idx" ON "HostelMaintenanceRequest"("priority");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_status_idx" ON "HostelMaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_assignedToStaffId_idx" ON "HostelMaintenanceRequest"("assignedToStaffId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceRequest_createdAt_idx" ON "HostelMaintenanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "HostelMaintenanceHistory_requestId_idx" ON "HostelMaintenanceHistory"("requestId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceHistory_performedByUserId_idx" ON "HostelMaintenanceHistory"("performedByUserId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceHistory_timestamp_idx" ON "HostelMaintenanceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "HostelMaintenanceAttachment_requestId_idx" ON "HostelMaintenanceAttachment"("requestId");

-- CreateIndex
CREATE INDEX "HostelMaintenanceAttachment_uploadedByUserId_idx" ON "HostelMaintenanceAttachment"("uploadedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Mess_code_key" ON "Mess"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MessMenu_messId_dayOfWeek_mealType_key" ON "MessMenu"("messId", "dayOfWeek", "mealType");

-- CreateIndex
CREATE INDEX "MessEnrollment_studentId_idx" ON "MessEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "MessEnrollment_messId_idx" ON "MessEnrollment"("messId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_registrationNumber_idx" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_driverId_key" ON "DriverProfile"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_licenseNumber_key" ON "DriverProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DriverProfile_status_idx" ON "DriverProfile"("status");

-- CreateIndex
CREATE INDEX "DriverProfile_licenseNumber_idx" ON "DriverProfile"("licenseNumber");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_idx" ON "DriverDocument"("driverId");

-- CreateIndex
CREATE INDEX "DriverDocument_docType_idx" ON "DriverDocument"("docType");

-- CreateIndex
CREATE INDEX "DriverDocument_status_idx" ON "DriverDocument"("status");

-- CreateIndex
CREATE INDEX "VehicleDriverMapping_vehicleId_idx" ON "VehicleDriverMapping"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleDriverMapping_driverId_idx" ON "VehicleDriverMapping"("driverId");

-- CreateIndex
CREATE INDEX "VehicleDriverMapping_status_idx" ON "VehicleDriverMapping"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_routeNumber_key" ON "TransportRoute"("routeNumber");

-- CreateIndex
CREATE INDEX "TransportRoute_status_idx" ON "TransportRoute"("status");

-- CreateIndex
CREATE INDEX "TransportRoute_routeNumber_idx" ON "TransportRoute"("routeNumber");

-- CreateIndex
CREATE INDEX "VehicleRouteMapping_vehicleId_idx" ON "VehicleRouteMapping"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleRouteMapping_routeId_idx" ON "VehicleRouteMapping"("routeId");

-- CreateIndex
CREATE INDEX "VehicleRouteMapping_status_idx" ON "VehicleRouteMapping"("status");

-- CreateIndex
CREATE INDEX "TransportStop_routeId_idx" ON "TransportStop"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportStop_routeId_sequence_key" ON "TransportStop"("routeId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "TransportApplication_applicationNo_key" ON "TransportApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "TransportApplication_studentId_idx" ON "TransportApplication"("studentId");

-- CreateIndex
CREATE INDEX "TransportApplication_routeId_idx" ON "TransportApplication"("routeId");

-- CreateIndex
CREATE INDEX "TransportApplication_status_idx" ON "TransportApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TransportAllotment_allotmentNo_key" ON "TransportAllotment"("allotmentNo");

-- CreateIndex
CREATE INDEX "TransportAllotment_studentId_idx" ON "TransportAllotment"("studentId");

-- CreateIndex
CREATE INDEX "TransportAllotment_vehicleId_idx" ON "TransportAllotment"("vehicleId");

-- CreateIndex
CREATE INDEX "TransportAllotment_routeId_idx" ON "TransportAllotment"("routeId");

-- CreateIndex
CREATE INDEX "TransportAllotment_status_idx" ON "TransportAllotment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TransportPass_passNo_key" ON "TransportPass"("passNo");

-- CreateIndex
CREATE INDEX "TransportPass_studentId_idx" ON "TransportPass"("studentId");

-- CreateIndex
CREATE INDEX "TransportPass_allotmentId_idx" ON "TransportPass"("allotmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportTrip_tripNo_key" ON "TransportTrip"("tripNo");

-- CreateIndex
CREATE INDEX "TransportTrip_vehicleId_idx" ON "TransportTrip"("vehicleId");

-- CreateIndex
CREATE INDEX "TransportTrip_routeId_idx" ON "TransportTrip"("routeId");

-- CreateIndex
CREATE INDEX "TransportTrip_tripDate_idx" ON "TransportTrip"("tripDate");

-- CreateIndex
CREATE INDEX "TransportAttendance_studentId_idx" ON "TransportAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportAttendance_tripId_studentId_key" ON "TransportAttendance"("tripId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMaintenance_maintenanceNo_key" ON "VehicleMaintenance"("maintenanceNo");

-- CreateIndex
CREATE INDEX "VehicleMaintenance_vehicleId_idx" ON "VehicleMaintenance"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleMaintenance_status_idx" ON "VehicleMaintenance"("status");

-- CreateIndex
CREATE INDEX "VehicleDocument_vehicleId_idx" ON "VehicleDocument"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleDocument_docType_idx" ON "VehicleDocument"("docType");

-- CreateIndex
CREATE UNIQUE INDEX "TransportIncident_incidentNo_key" ON "TransportIncident"("incidentNo");

-- CreateIndex
CREATE INDEX "TransportIncident_vehicleId_idx" ON "TransportIncident"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportComplaint_complaintNo_key" ON "TransportComplaint"("complaintNo");

-- CreateIndex
CREATE INDEX "TransportComplaint_studentId_idx" ON "TransportComplaint"("studentId");

-- CreateIndex
CREATE INDEX "TransportComplaint_status_idx" ON "TransportComplaint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Library_code_key" ON "Library"("code");

-- CreateIndex
CREATE INDEX "Library_instituteId_idx" ON "Library"("instituteId");

-- CreateIndex
CREATE INDEX "Library_status_idx" ON "Library"("status");

-- CreateIndex
CREATE INDEX "LibrarySection_libraryId_idx" ON "LibrarySection"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySection_libraryId_code_key" ON "LibrarySection"("libraryId", "code");

-- CreateIndex
CREATE INDEX "LibraryShelf_sectionId_idx" ON "LibraryShelf"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCategory_code_key" ON "LibraryCategory"("code");

-- CreateIndex
CREATE INDEX "LibraryCategory_status_idx" ON "LibraryCategory"("status");

-- CreateIndex
CREATE INDEX "LibraryAuthor_name_idx" ON "LibraryAuthor"("name");

-- CreateIndex
CREATE INDEX "LibraryPublisher_name_idx" ON "LibraryPublisher"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_authorName_idx" ON "Book"("authorName");

-- CreateIndex
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");

-- CreateIndex
CREATE INDEX "Book_subjectId_idx" ON "Book"("subjectId");

-- CreateIndex
CREATE INDEX "Book_resourceType_idx" ON "Book"("resourceType");

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_accessionNo_key" ON "BookCopy"("accessionNo");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_barcode_key" ON "BookCopy"("barcode");

-- CreateIndex
CREATE INDEX "BookCopy_bookId_idx" ON "BookCopy"("bookId");

-- CreateIndex
CREATE INDEX "BookCopy_libraryId_idx" ON "BookCopy"("libraryId");

-- CreateIndex
CREATE INDEX "BookCopy_shelfId_idx" ON "BookCopy"("shelfId");

-- CreateIndex
CREATE INDEX "BookCopy_status_idx" ON "BookCopy"("status");

-- CreateIndex
CREATE INDEX "BookCopy_barcode_idx" ON "BookCopy"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMembership_membershipNo_key" ON "LibraryMembership"("membershipNo");

-- CreateIndex
CREATE INDEX "LibraryMembership_userId_idx" ON "LibraryMembership"("userId");

-- CreateIndex
CREATE INDEX "LibraryMembership_memberType_idx" ON "LibraryMembership"("memberType");

-- CreateIndex
CREATE INDEX "LibraryMembership_status_idx" ON "LibraryMembership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryIssue_issueNo_key" ON "LibraryIssue"("issueNo");

-- CreateIndex
CREATE INDEX "LibraryIssue_memberId_idx" ON "LibraryIssue"("memberId");

-- CreateIndex
CREATE INDEX "LibraryIssue_copyId_idx" ON "LibraryIssue"("copyId");

-- CreateIndex
CREATE INDEX "LibraryIssue_status_idx" ON "LibraryIssue"("status");

-- CreateIndex
CREATE INDEX "LibraryIssue_dueDate_idx" ON "LibraryIssue"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryReturn_issueId_key" ON "LibraryReturn"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryReservation_reservationNo_key" ON "LibraryReservation"("reservationNo");

-- CreateIndex
CREATE INDEX "LibraryReservation_memberId_idx" ON "LibraryReservation"("memberId");

-- CreateIndex
CREATE INDEX "LibraryReservation_bookId_idx" ON "LibraryReservation"("bookId");

-- CreateIndex
CREATE INDEX "LibraryReservation_status_idx" ON "LibraryReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryFine_fineNo_key" ON "LibraryFine"("fineNo");

-- CreateIndex
CREATE INDEX "LibraryFine_memberId_idx" ON "LibraryFine"("memberId");

-- CreateIndex
CREATE INDEX "LibraryFine_issueId_idx" ON "LibraryFine"("issueId");

-- CreateIndex
CREATE INDEX "LibraryFine_status_idx" ON "LibraryFine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryIncident_incidentNo_key" ON "LibraryIncident"("incidentNo");

-- CreateIndex
CREATE INDEX "LibraryIncident_memberId_idx" ON "LibraryIncident"("memberId");

-- CreateIndex
CREATE INDEX "LibraryIncident_copyId_idx" ON "LibraryIncident"("copyId");

-- CreateIndex
CREATE INDEX "LibraryIncident_status_idx" ON "LibraryIncident"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalResource_resourceCode_key" ON "DigitalResource"("resourceCode");

-- CreateIndex
CREATE INDEX "DigitalResource_resourceType_idx" ON "DigitalResource"("resourceType");

-- CreateIndex
CREATE INDEX "DigitalResource_programId_idx" ON "DigitalResource"("programId");

-- CreateIndex
CREATE INDEX "DigitalResource_subjectId_idx" ON "DigitalResource"("subjectId");

-- CreateIndex
CREATE INDEX "DigitalResource_status_idx" ON "DigitalResource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryNotice_noticeNo_key" ON "LibraryNotice"("noticeNo");

-- CreateIndex
CREATE INDEX "LibraryNotice_audience_idx" ON "LibraryNotice"("audience");

-- CreateIndex
CREATE INDEX "LibraryNotice_status_idx" ON "LibraryNotice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryPolicy_code_key" ON "LibraryPolicy"("code");

-- CreateIndex
CREATE INDEX "LibraryPolicy_memberType_idx" ON "LibraryPolicy"("memberType");

-- CreateIndex
CREATE INDEX "LibraryPolicy_status_idx" ON "LibraryPolicy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ITTicket_ticketNo_key" ON "ITTicket"("ticketNo");

-- CreateIndex
CREATE INDEX "ITTicket_userId_idx" ON "ITTicket"("userId");

-- CreateIndex
CREATE INDEX "ITTicket_status_idx" ON "ITTicket"("status");

-- CreateIndex
CREATE INDEX "ITTicket_category_idx" ON "ITTicket"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CampusServiceRequest_requestNo_key" ON "CampusServiceRequest"("requestNo");

-- CreateIndex
CREATE INDEX "CampusServiceRequest_userId_idx" ON "CampusServiceRequest"("userId");

-- CreateIndex
CREATE INDEX "CampusServiceRequest_status_idx" ON "CampusServiceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProject_projectCode_key" ON "ResearchProject"("projectCode");

-- CreateIndex
CREATE INDEX "ResearchProject_instituteId_idx" ON "ResearchProject"("instituteId");

-- CreateIndex
CREATE INDEX "ResearchProject_departmentId_idx" ON "ResearchProject"("departmentId");

-- CreateIndex
CREATE INDEX "ResearchProject_status_idx" ON "ResearchProject"("status");

-- CreateIndex
CREATE INDEX "ResearchMember_projectId_idx" ON "ResearchMember"("projectId");

-- CreateIndex
CREATE INDEX "ResearchMember_facultyId_idx" ON "ResearchMember"("facultyId");

-- CreateIndex
CREATE INDEX "ResearchMilestone_projectId_idx" ON "ResearchMilestone"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchGrant_grantNo_key" ON "ResearchGrant"("grantNo");

-- CreateIndex
CREATE INDEX "ResearchGrant_projectId_idx" ON "ResearchGrant"("projectId");

-- CreateIndex
CREATE INDEX "Publication_projectId_idx" ON "Publication"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Patent_applicationNumber_key" ON "Patent"("applicationNumber");

-- CreateIndex
CREATE INDEX "Patent_projectId_idx" ON "Patent"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "InnovationIdea_ideaCode_key" ON "InnovationIdea"("ideaCode");

-- CreateIndex
CREATE INDEX "InnovationIdea_creatorUserId_idx" ON "InnovationIdea"("creatorUserId");

-- CreateIndex
CREATE INDEX "InnovationIdea_status_idx" ON "InnovationIdea"("status");

-- CreateIndex
CREATE UNIQUE INDEX "IncubationCenter_code_key" ON "IncubationCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Startup_startupCode_key" ON "Startup"("startupCode");

-- CreateIndex
CREATE INDEX "Startup_incubationCenterId_idx" ON "Startup"("incubationCenterId");

-- CreateIndex
CREATE INDEX "StartupMember_startupId_idx" ON "StartupMember"("startupId");

-- CreateIndex
CREATE INDEX "StartupMember_studentId_idx" ON "StartupMember"("studentId");

-- CreateIndex
CREATE INDEX "StartupMentor_startupId_idx" ON "StartupMentor"("startupId");

-- CreateIndex
CREATE INDEX "StartupMentor_facultyId_idx" ON "StartupMentor"("facultyId");

-- CreateIndex
CREATE INDEX "StartupMilestone_startupId_idx" ON "StartupMilestone"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementCompany_companyCode_key" ON "PlacementCompany"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementDrive_driveCode_key" ON "PlacementDrive"("driveCode");

-- CreateIndex
CREATE INDEX "PlacementDrive_companyId_idx" ON "PlacementDrive"("companyId");

-- CreateIndex
CREATE INDEX "PlacementDrive_status_idx" ON "PlacementDrive"("status");

-- CreateIndex
CREATE INDEX "PlacementApplication_driveId_idx" ON "PlacementApplication"("driveId");

-- CreateIndex
CREATE INDEX "PlacementApplication_studentId_idx" ON "PlacementApplication"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementApplication_driveId_studentId_key" ON "PlacementApplication"("driveId", "studentId");

-- CreateIndex
CREATE INDEX "PlacementInterview_driveId_idx" ON "PlacementInterview"("driveId");

-- CreateIndex
CREATE INDEX "PlacementInterview_studentId_idx" ON "PlacementInterview"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementOffer_offerNo_key" ON "PlacementOffer"("offerNo");

-- CreateIndex
CREATE INDEX "PlacementOffer_driveId_idx" ON "PlacementOffer"("driveId");

-- CreateIndex
CREATE INDEX "PlacementOffer_studentId_idx" ON "PlacementOffer"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgram_code_key" ON "TrainingProgram"("code");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_programId_idx" ON "TrainingEnrollment"("programId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_studentId_idx" ON "TrainingEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_programId_studentId_key" ON "TrainingEnrollment"("programId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniProfile_studentId_key" ON "AlumniProfile"("studentId");

-- CreateIndex
CREATE INDEX "AlumniProfile_graduationYear_idx" ON "AlumniProfile"("graduationYear");

-- CreateIndex
CREATE UNIQUE INDEX "IQACMeeting_meetingNo_key" ON "IQACMeeting"("meetingNo");

-- CreateIndex
CREATE INDEX "IQACMeeting_meetingDate_idx" ON "IQACMeeting"("meetingDate");

-- CreateIndex
CREATE INDEX "IQACActionItem_meetingId_idx" ON "IQACActionItem"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "NAACCriterion_criterionNumber_key" ON "NAACCriterion"("criterionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NAACMetric_metricNumber_key" ON "NAACMetric"("metricNumber");

-- CreateIndex
CREATE INDEX "NAACMetric_criterionId_idx" ON "NAACMetric"("criterionId");

-- CreateIndex
CREATE INDEX "NAACMetricData_metricId_idx" ON "NAACMetricData"("metricId");

-- CreateIndex
CREATE INDEX "NAACMetricData_academicYear_idx" ON "NAACMetricData"("academicYear");

-- CreateIndex
CREATE INDEX "NAACMetricData_status_idx" ON "NAACMetricData"("status");

-- CreateIndex
CREATE INDEX "NAACEvidence_metricDataId_idx" ON "NAACEvidence"("metricDataId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceFramework_code_key" ON "ComplianceFramework"("code");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_frameworkId_idx" ON "ComplianceRequirement"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_code_key" ON "Committee"("code");

-- CreateIndex
CREATE INDEX "CommitteeMember_committeeId_idx" ON "CommitteeMember"("committeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMeeting_meetingNo_key" ON "CommitteeMeeting"("meetingNo");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_committeeId_idx" ON "CommitteeMeeting"("committeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNo_key" ON "Policy"("policyNo");

-- CreateIndex
CREATE UNIQUE INDEX "Circular_circularNo_key" ON "Circular"("circularNo");

-- CreateIndex
CREATE UNIQUE INDEX "RTIRequest_rtiNo_key" ON "RTIRequest"("rtiNo");

-- CreateIndex
CREATE INDEX "RTIRequest_status_idx" ON "RTIRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalCase_caseNo_key" ON "LegalCase"("caseNo");

-- CreateIndex
CREATE INDEX "LegalCase_status_idx" ON "LegalCase"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_ticketNo_key" ON "Grievance"("ticketNo");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FileTracking_fileNo_key" ON "FileTracking"("fileNo");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgReporting_userId_key" ON "UserOrgReporting"("userId");

-- CreateIndex
CREATE INDEX "UserOrgReporting_userId_idx" ON "UserOrgReporting"("userId");

-- CreateIndex
CREATE INDEX "UserOrgReporting_roleCode_idx" ON "UserOrgReporting"("roleCode");

-- CreateIndex
CREATE INDEX "UserOrgReporting_functionalDept_idx" ON "UserOrgReporting"("functionalDept");

-- CreateIndex
CREATE INDEX "UserRoleHistory_userId_idx" ON "UserRoleHistory"("userId");

-- CreateIndex
CREATE INDEX "ModuleAuthorityConfig_module_idx" ON "ModuleAuthorityConfig"("module");

-- CreateIndex
CREATE INDEX "ModuleAuthorityConfig_roleCode_idx" ON "ModuleAuthorityConfig"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAuthorityConfig_module_roleCode_permission_key" ON "ModuleAuthorityConfig"("module", "roleCode", "permission");

-- CreateIndex
CREATE INDEX "WorkDiary_userId_idx" ON "WorkDiary"("userId");

-- CreateIndex
CREATE INDEX "WorkDiary_workDate_idx" ON "WorkDiary"("workDate");

-- CreateIndex
CREATE INDEX "WorkDiary_status_idx" ON "WorkDiary"("status");

-- CreateIndex
CREATE INDEX "WorkDiary_departmentId_idx" ON "WorkDiary"("departmentId");

-- CreateIndex
CREATE INDEX "WorkDiary_instituteId_idx" ON "WorkDiary"("instituteId");

-- CreateIndex
CREATE INDEX "WorkDiaryHistory_workDiaryId_idx" ON "WorkDiaryHistory"("workDiaryId");

-- CreateIndex
CREATE INDEX "WorkDiaryHistory_performedBy_idx" ON "WorkDiaryHistory"("performedBy");

-- CreateIndex
CREATE INDEX "WorkTask_userId_idx" ON "WorkTask"("userId");

-- CreateIndex
CREATE INDEX "WorkTask_assignedToUserId_idx" ON "WorkTask"("assignedToUserId");

-- CreateIndex
CREATE INDEX "WorkTask_dueDate_idx" ON "WorkTask"("dueDate");

-- CreateIndex
CREATE INDEX "WorkTask_status_idx" ON "WorkTask"("status");

-- CreateIndex
CREATE INDEX "TaskDelegation_taskId_idx" ON "TaskDelegation"("taskId");

-- CreateIndex
CREATE INDEX "PersonalMeeting_organizerUserId_idx" ON "PersonalMeeting"("organizerUserId");

-- CreateIndex
CREATE INDEX "PersonalMeeting_meetingDate_idx" ON "PersonalMeeting"("meetingDate");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_idx" ON "MeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "PersonalAppointment_userId_idx" ON "PersonalAppointment"("userId");

-- CreateIndex
CREATE INDEX "PersonalAppointment_appointmentDate_idx" ON "PersonalAppointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "WorkFollowUp_userId_idx" ON "WorkFollowUp"("userId");

-- CreateIndex
CREATE INDEX "WorkFollowUp_nextFollowUpDate_idx" ON "WorkFollowUp"("nextFollowUpDate");

-- CreateIndex
CREATE INDEX "PersonalNote_userId_idx" ON "PersonalNote"("userId");

-- CreateIndex
CREATE INDEX "WorkLog_userId_idx" ON "WorkLog"("userId");

-- CreateIndex
CREATE INDEX "WorkLog_logDate_idx" ON "WorkLog"("logDate");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationType_code_key" ON "CommunicationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_referenceNo_key" ON "Communication"("referenceNo");

-- CreateIndex
CREATE INDEX "Communication_referenceNo_idx" ON "Communication"("referenceNo");

-- CreateIndex
CREATE INDEX "Communication_direction_idx" ON "Communication"("direction");

-- CreateIndex
CREATE INDEX "Communication_status_idx" ON "Communication"("status");

-- CreateIndex
CREATE INDEX "Communication_creatorUserId_idx" ON "Communication"("creatorUserId");

-- CreateIndex
CREATE INDEX "Communication_assignedUserId_idx" ON "Communication"("assignedUserId");

-- CreateIndex
CREATE INDEX "Communication_departmentId_idx" ON "Communication"("departmentId");

-- CreateIndex
CREATE INDEX "CommunicationRecipient_communicationId_idx" ON "CommunicationRecipient"("communicationId");

-- CreateIndex
CREATE INDEX "CommunicationAssignment_communicationId_idx" ON "CommunicationAssignment"("communicationId");

-- CreateIndex
CREATE INDEX "CommunicationMovement_communicationId_idx" ON "CommunicationMovement"("communicationId");

-- CreateIndex
CREATE INDEX "CommunicationApproval_communicationId_idx" ON "CommunicationApproval"("communicationId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchRecord_dispatchNo_key" ON "DispatchRecord"("dispatchNo");

-- CreateIndex
CREATE INDEX "DispatchRecord_communicationId_idx" ON "DispatchRecord"("communicationId");

-- CreateIndex
CREATE INDEX "DispatchRecord_dispatchNo_idx" ON "DispatchRecord"("dispatchNo");

-- CreateIndex
CREATE INDEX "DispatchRecord_deliveryStatus_idx" ON "DispatchRecord"("deliveryStatus");

-- CreateIndex
CREATE UNIQUE INDEX "InwardRegister_registerNo_key" ON "InwardRegister"("registerNo");

-- CreateIndex
CREATE INDEX "InwardRegister_registerNo_idx" ON "InwardRegister"("registerNo");

-- CreateIndex
CREATE INDEX "InwardRegister_receivedDate_idx" ON "InwardRegister"("receivedDate");

-- CreateIndex
CREATE INDEX "InwardRegister_departmentId_idx" ON "InwardRegister"("departmentId");

-- CreateIndex
CREATE INDEX "InwardRegister_status_idx" ON "InwardRegister"("status");

-- CreateIndex
CREATE INDEX "InwardRegister_priority_idx" ON "InwardRegister"("priority");

-- CreateIndex
CREATE INDEX "InwardRegister_receivedByUserId_idx" ON "InwardRegister"("receivedByUserId");

-- CreateIndex
CREATE INDEX "InwardRegister_assignedToUserId_idx" ON "InwardRegister"("assignedToUserId");

-- CreateIndex
CREATE INDEX "InwardRegister_notesheetId_idx" ON "InwardRegister"("notesheetId");

-- CreateIndex
CREATE INDEX "InwardForwarding_inwardId_idx" ON "InwardForwarding"("inwardId");

-- CreateIndex
CREATE INDEX "InwardForwarding_forwardedByUserId_idx" ON "InwardForwarding"("forwardedByUserId");

-- CreateIndex
CREATE INDEX "InwardForwarding_forwardedToDepartmentId_idx" ON "InwardForwarding"("forwardedToDepartmentId");

-- CreateIndex
CREATE INDEX "InwardForwarding_forwardedToUserId_idx" ON "InwardForwarding"("forwardedToUserId");

-- CreateIndex
CREATE INDEX "InwardForwarding_status_idx" ON "InwardForwarding"("status");

-- CreateIndex
CREATE INDEX "InwardStatusHistory_inwardId_idx" ON "InwardStatusHistory"("inwardId");

-- CreateIndex
CREATE INDEX "InwardStatusHistory_changedByUserId_idx" ON "InwardStatusHistory"("changedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OutwardRegister_dispatchNo_key" ON "OutwardRegister"("dispatchNo");

-- CreateIndex
CREATE INDEX "OutwardRegister_dispatchNo_idx" ON "OutwardRegister"("dispatchNo");

-- CreateIndex
CREATE INDEX "OutwardRegister_dispatchDate_idx" ON "OutwardRegister"("dispatchDate");

-- CreateIndex
CREATE INDEX "OutwardRegister_departmentId_idx" ON "OutwardRegister"("departmentId");

-- CreateIndex
CREATE INDEX "OutwardRegister_status_idx" ON "OutwardRegister"("status");

-- CreateIndex
CREATE INDEX "OutwardRegister_mode_idx" ON "OutwardRegister"("mode");

-- CreateIndex
CREATE INDEX "OutwardRegister_sentByUserId_idx" ON "OutwardRegister"("sentByUserId");

-- CreateIndex
CREATE INDEX "OutwardRegister_notesheetId_idx" ON "OutwardRegister"("notesheetId");

-- CreateIndex
CREATE INDEX "OutwardDispatch_outwardId_idx" ON "OutwardDispatch"("outwardId");

-- CreateIndex
CREATE INDEX "OutwardDispatch_deliveryStatus_idx" ON "OutwardDispatch"("deliveryStatus");

-- CreateIndex
CREATE INDEX "OutwardStatusHistory_outwardId_idx" ON "OutwardStatusHistory"("outwardId");

-- CreateIndex
CREATE INDEX "OutwardStatusHistory_changedByUserId_idx" ON "OutwardStatusHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "InwardOutwardAuditLog_recordType_idx" ON "InwardOutwardAuditLog"("recordType");

-- CreateIndex
CREATE INDEX "InwardOutwardAuditLog_inwardId_idx" ON "InwardOutwardAuditLog"("inwardId");

-- CreateIndex
CREATE INDEX "InwardOutwardAuditLog_outwardId_idx" ON "InwardOutwardAuditLog"("outwardId");

-- CreateIndex
CREATE INDEX "InwardOutwardAuditLog_performedByUserId_idx" ON "InwardOutwardAuditLog"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentService_code_key" ON "StudentService"("code");

-- CreateIndex
CREATE INDEX "StudentService_category_idx" ON "StudentService"("category");

-- CreateIndex
CREATE INDEX "StudentService_isActive_idx" ON "StudentService"("isActive");

-- CreateIndex
CREATE INDEX "StudentServiceRequirement_serviceId_idx" ON "StudentServiceRequirement"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentServiceRequest_requestNo_key" ON "StudentServiceRequest"("requestNo");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_requestNo_idx" ON "StudentServiceRequest"("requestNo");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_studentId_idx" ON "StudentServiceRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_serviceId_idx" ON "StudentServiceRequest"("serviceId");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_departmentId_idx" ON "StudentServiceRequest"("departmentId");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_assignedToUserId_idx" ON "StudentServiceRequest"("assignedToUserId");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_status_idx" ON "StudentServiceRequest"("status");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_priority_idx" ON "StudentServiceRequest"("priority");

-- CreateIndex
CREATE INDEX "StudentServiceRequest_currentAuthorityRole_idx" ON "StudentServiceRequest"("currentAuthorityRole");

-- CreateIndex
CREATE INDEX "StudentServiceRequestDocument_requestId_idx" ON "StudentServiceRequestDocument"("requestId");

-- CreateIndex
CREATE INDEX "StudentServiceRequestMessage_requestId_idx" ON "StudentServiceRequestMessage"("requestId");

-- CreateIndex
CREATE INDEX "StudentServiceRequestMessage_senderId_idx" ON "StudentServiceRequestMessage"("senderId");

-- CreateIndex
CREATE INDEX "StudentServiceRequestHistory_requestId_idx" ON "StudentServiceRequestHistory"("requestId");

-- CreateIndex
CREATE INDEX "StudentServiceRequestHistory_performedByUserId_idx" ON "StudentServiceRequestHistory"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verificationHash_key" ON "Certificate"("verificationHash");

-- CreateIndex
CREATE INDEX "Certificate_certificateNumber_idx" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_verificationHash_idx" ON "Certificate"("verificationHash");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCycle_code_key" ON "AdmissionCycle"("code");

-- CreateIndex
CREATE INDEX "AdmissionCycle_academicYearCode_idx" ON "AdmissionCycle"("academicYearCode");

-- CreateIndex
CREATE INDEX "AdmissionCycle_status_idx" ON "AdmissionCycle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionInquiry_inquiryNo_key" ON "AdmissionInquiry"("inquiryNo");

-- CreateIndex
CREATE INDEX "AdmissionInquiry_inquiryNo_idx" ON "AdmissionInquiry"("inquiryNo");

-- CreateIndex
CREATE INDEX "AdmissionInquiry_status_idx" ON "AdmissionInquiry"("status");

-- CreateIndex
CREATE INDEX "AdmissionInquiry_counsellorUserId_idx" ON "AdmissionInquiry"("counsellorUserId");

-- CreateIndex
CREATE INDEX "AdmissionInquiry_interestedProgramId_idx" ON "AdmissionInquiry"("interestedProgramId");

-- CreateIndex
CREATE INDEX "CounsellingRecord_inquiryId_idx" ON "CounsellingRecord"("inquiryId");

-- CreateIndex
CREATE INDEX "CounsellingRecord_counsellorUserId_idx" ON "CounsellingRecord"("counsellorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_applicationNo_key" ON "AdmissionApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "AdmissionApplication_applicationNo_idx" ON "AdmissionApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "AdmissionApplication_status_idx" ON "AdmissionApplication"("status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_programId_idx" ON "AdmissionApplication"("programId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_instituteId_idx" ON "AdmissionApplication"("instituteId");

-- CreateIndex
CREATE INDEX "AdmissionApplication_admissionCycleId_idx" ON "AdmissionApplication"("admissionCycleId");

-- CreateIndex
CREATE INDEX "AdmissionApplicationDocument_applicationId_idx" ON "AdmissionApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "EligibilityRule_programId_idx" ON "EligibilityRule"("programId");

-- CreateIndex
CREATE INDEX "EligibilityResult_applicationId_idx" ON "EligibilityResult"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionApproval_applicationId_idx" ON "AdmissionApproval"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_applicationId_key" ON "Enrollment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_key" ON "Enrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_enrollmentNo_key" ON "Enrollment"("enrollmentNo");

-- CreateIndex
CREATE INDEX "Enrollment_enrollmentNo_idx" ON "Enrollment"("enrollmentNo");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamCentre_code_key" ON "ExamCentre"("code");

-- CreateIndex
CREATE INDEX "ExamCentre_code_idx" ON "ExamCentre"("code");

-- CreateIndex
CREATE INDEX "ExamCentre_status_idx" ON "ExamCentre"("status");

-- CreateIndex
CREATE INDEX "ExamRoom_centreId_idx" ON "ExamRoom"("centreId");

-- CreateIndex
CREATE INDEX "ExamRoom_roomNumber_idx" ON "ExamRoom"("roomNumber");

-- CreateIndex
CREATE INDEX "ExamRoom_status_idx" ON "ExamRoom"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_centreId_roomNumber_key" ON "ExamRoom"("centreId", "roomNumber");

-- CreateIndex
CREATE INDEX "ExamCentreAllocation_examId_idx" ON "ExamCentreAllocation"("examId");

-- CreateIndex
CREATE INDEX "ExamCentreAllocation_centreId_idx" ON "ExamCentreAllocation"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamCentreAllocation_examId_centreId_key" ON "ExamCentreAllocation"("examId", "centreId");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_examId_idx" ON "ExamSeatAllocation"("examId");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_centreId_idx" ON "ExamSeatAllocation"("centreId");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_roomId_idx" ON "ExamSeatAllocation"("roomId");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_studentId_idx" ON "ExamSeatAllocation"("studentId");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_seatNumber_idx" ON "ExamSeatAllocation"("seatNumber");

-- CreateIndex
CREATE INDEX "ExamSeatAllocation_status_idx" ON "ExamSeatAllocation"("status");

-- CreateIndex
CREATE INDEX "ExamSeatChangeHistory_seatAllocationId_idx" ON "ExamSeatChangeHistory"("seatAllocationId");

-- CreateIndex
CREATE INDEX "ExamSeatChangeHistory_studentId_idx" ON "ExamSeatChangeHistory"("studentId");

-- CreateIndex
CREATE INDEX "ExamSeatChangeHistory_examId_idx" ON "ExamSeatChangeHistory"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamEdpDuty_dutyNo_key" ON "ExamEdpDuty"("dutyNo");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_dutyNo_idx" ON "ExamEdpDuty"("dutyNo");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_examId_idx" ON "ExamEdpDuty"("examId");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_centreId_idx" ON "ExamEdpDuty"("centreId");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_roomId_idx" ON "ExamEdpDuty"("roomId");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_staffUserId_idx" ON "ExamEdpDuty"("staffUserId");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_dutyDate_idx" ON "ExamEdpDuty"("dutyDate");

-- CreateIndex
CREATE INDEX "ExamEdpDuty_status_idx" ON "ExamEdpDuty"("status");

-- CreateIndex
CREATE INDEX "ExamEdpDutyHistory_dutyId_idx" ON "ExamEdpDutyHistory"("dutyId");

-- CreateIndex
CREATE INDEX "ExamEdpDutyHistory_performedByUserId_idx" ON "ExamEdpDutyHistory"("performedByUserId");

-- CreateIndex
CREATE INDEX "ExamRoomAllocation_examScheduleId_idx" ON "ExamRoomAllocation"("examScheduleId");

-- CreateIndex
CREATE INDEX "ExamRoomAllocation_roomId_idx" ON "ExamRoomAllocation"("roomId");

-- CreateIndex
CREATE INDEX "ExamRoomAllocation_studentId_idx" ON "ExamRoomAllocation"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoomAllocation_examScheduleId_studentId_key" ON "ExamRoomAllocation"("examScheduleId", "studentId");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_examScheduleId_idx" ON "InvigilatorAssignment"("examScheduleId");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_facultyUserId_idx" ON "InvigilatorAssignment"("facultyUserId");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_roomId_idx" ON "InvigilatorAssignment"("roomId");

-- CreateIndex
CREATE INDEX "ExamAttendance_examScheduleId_idx" ON "ExamAttendance"("examScheduleId");

-- CreateIndex
CREATE INDEX "ExamAttendance_studentId_idx" ON "ExamAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttendance_examScheduleId_studentId_key" ON "ExamAttendance"("examScheduleId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_hallTicketNo_key" ON "HallTicket"("hallTicketNo");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_examFormId_key" ON "HallTicket"("examFormId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_verificationCode_key" ON "HallTicket"("verificationCode");

-- CreateIndex
CREATE INDEX "HallTicket_hallTicketNo_idx" ON "HallTicket"("hallTicketNo");

-- CreateIndex
CREATE INDEX "HallTicket_examId_idx" ON "HallTicket"("examId");

-- CreateIndex
CREATE INDEX "HallTicket_studentId_idx" ON "HallTicket"("studentId");

-- CreateIndex
CREATE INDEX "HallTicket_verificationCode_idx" ON "HallTicket"("verificationCode");

-- CreateIndex
CREATE INDEX "EvaluationAssignment_examScheduleId_idx" ON "EvaluationAssignment"("examScheduleId");

-- CreateIndex
CREATE INDEX "EvaluationAssignment_examinerUserId_idx" ON "EvaluationAssignment"("examinerUserId");

-- CreateIndex
CREATE INDEX "EvaluationAssignment_subjectId_idx" ON "EvaluationAssignment"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultSummary_marksheetNo_key" ON "ResultSummary"("marksheetNo");

-- CreateIndex
CREATE UNIQUE INDEX "ResultSummary_verificationCode_key" ON "ResultSummary"("verificationCode");

-- CreateIndex
CREATE INDEX "ResultSummary_studentId_idx" ON "ResultSummary"("studentId");

-- CreateIndex
CREATE INDEX "ResultSummary_examId_idx" ON "ResultSummary"("examId");

-- CreateIndex
CREATE INDEX "ResultSummary_resultStatus_idx" ON "ResultSummary"("resultStatus");

-- CreateIndex
CREATE INDEX "ResultSummary_verificationCode_idx" ON "ResultSummary"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ResultSummary_studentId_examId_key" ON "ResultSummary"("studentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeConfiguration_grade_key" ON "GradeConfiguration"("grade");

-- CreateIndex
CREATE INDEX "ResultRevisionHistory_resultSummaryId_idx" ON "ResultRevisionHistory"("resultSummaryId");

-- CreateIndex
CREATE INDEX "ResultRevisionHistory_examResultId_idx" ON "ResultRevisionHistory"("examResultId");

-- CreateIndex
CREATE UNIQUE INDEX "RevaluationRequest_requestNo_key" ON "RevaluationRequest"("requestNo");

-- CreateIndex
CREATE INDEX "RevaluationRequest_requestNo_idx" ON "RevaluationRequest"("requestNo");

-- CreateIndex
CREATE INDEX "RevaluationRequest_studentId_idx" ON "RevaluationRequest"("studentId");

-- CreateIndex
CREATE INDEX "RevaluationRequest_examResultId_idx" ON "RevaluationRequest"("examResultId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_status_idx" ON "EmployeeDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DutyRequest_requestNo_key" ON "DutyRequest"("requestNo");

-- CreateIndex
CREATE INDEX "DutyRequest_employeeId_idx" ON "DutyRequest"("employeeId");

-- CreateIndex
CREATE INDEX "DutyRequest_status_idx" ON "DutyRequest"("status");

-- CreateIndex
CREATE INDEX "Holiday_holidayDate_idx" ON "Holiday"("holidayDate");

-- CreateIndex
CREATE INDEX "Holiday_academicYear_idx" ON "Holiday"("academicYear");

-- CreateIndex
CREATE INDEX "AppraisalCycle_year_idx" ON "AppraisalCycle"("year");

-- CreateIndex
CREATE INDEX "AppraisalCycle_status_idx" ON "AppraisalCycle"("status");

-- CreateIndex
CREATE INDEX "AppraisalReview_employeeId_idx" ON "AppraisalReview"("employeeId");

-- CreateIndex
CREATE INDEX "AppraisalReview_status_idx" ON "AppraisalReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppraisalReview_appraisalCycleId_employeeId_key" ON "AppraisalReview"("appraisalCycleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_code_key" ON "PayrollPeriod"("code");

-- CreateIndex
CREATE INDEX "PayrollPeriod_status_idx" ON "PayrollPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_month_year_key" ON "PayrollPeriod"("month", "year");

-- CreateIndex
CREATE INDEX "PayrollRecord_employeeId_idx" ON "PayrollRecord"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollRecord_paymentStatus_idx" ON "PayrollRecord"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_payrollPeriodId_employeeId_key" ON "PayrollRecord"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payslipNo_key" ON "Payslip"("payslipNo");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip"("employeeId");

-- CreateIndex
CREATE INDEX "Payslip_payrollPeriodId_idx" ON "Payslip"("payrollPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequisition_requisitionNo_key" ON "JobRequisition"("requisitionNo");

-- CreateIndex
CREATE INDEX "JobRequisition_departmentId_idx" ON "JobRequisition"("departmentId");

-- CreateIndex
CREATE INDEX "JobRequisition_status_idx" ON "JobRequisition"("status");

-- CreateIndex
CREATE INDEX "JobApplication_jobRequisitionId_idx" ON "JobApplication"("jobRequisitionId");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE INDEX "Interview_jobApplicationId_idx" ON "Interview"("jobApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_jobApplicationId_key" ON "Offer"("jobApplicationId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Resignation_resignationNo_key" ON "Resignation"("resignationNo");

-- CreateIndex
CREATE INDEX "Resignation_employeeId_idx" ON "Resignation"("employeeId");

-- CreateIndex
CREATE INDEX "Resignation_status_idx" ON "Resignation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExitClearance_resignationId_key" ON "ExitClearance"("resignationId");

-- CreateIndex
CREATE INDEX "AcademicRisk_riskLevel_idx" ON "AcademicRisk"("riskLevel");

-- CreateIndex
CREATE INDEX "AcademicRisk_riskScore_idx" ON "AcademicRisk"("riskScore");

-- CreateIndex
CREATE INDEX "AcademicRisk_studentId_idx" ON "AcademicRisk"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRisk_studentId_academicYearId_semesterId_key" ON "AcademicRisk"("studentId", "academicYearId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "EdpDuty_dutyNo_key" ON "EdpDuty"("dutyNo");

-- CreateIndex
CREATE INDEX "EdpDuty_dutyNo_idx" ON "EdpDuty"("dutyNo");

-- CreateIndex
CREATE INDEX "EdpDuty_departmentId_idx" ON "EdpDuty"("departmentId");

-- CreateIndex
CREATE INDEX "EdpDuty_assignedOfficerId_idx" ON "EdpDuty"("assignedOfficerId");

-- CreateIndex
CREATE INDEX "EdpDuty_teachingFacultyId_idx" ON "EdpDuty"("teachingFacultyId");

-- CreateIndex
CREATE INDEX "EdpDuty_dutyDate_idx" ON "EdpDuty"("dutyDate");

-- CreateIndex
CREATE INDEX "EdpDuty_status_idx" ON "EdpDuty"("status");

-- CreateIndex
CREATE INDEX "EdpDutyPhoto_dutyId_idx" ON "EdpDutyPhoto"("dutyId");

-- CreateIndex
CREATE INDEX "EdpDutyPhoto_uploadedByUserId_idx" ON "EdpDutyPhoto"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "EdpDutyStudentObservation_dutyId_idx" ON "EdpDutyStudentObservation"("dutyId");

-- CreateIndex
CREATE INDEX "EdpDutyStudentObservation_enrollmentNo_idx" ON "EdpDutyStudentObservation"("enrollmentNo");

-- CreateIndex
CREATE INDEX "EdpDutyHistory_dutyId_idx" ON "EdpDutyHistory"("dutyId");

-- CreateIndex
CREATE INDEX "EdpDutyHistory_performedByUserId_idx" ON "EdpDutyHistory"("performedByUserId");

-- CreateIndex
CREATE INDEX "CentralReportAuditLog_module_idx" ON "CentralReportAuditLog"("module");

-- CreateIndex
CREATE INDEX "CentralReportAuditLog_generatedByUserId_idx" ON "CentralReportAuditLog"("generatedByUserId");

-- CreateIndex
CREATE INDEX "CentralReportAuditLog_generatedAt_idx" ON "CentralReportAuditLog"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BulkImport_importNo_key" ON "BulkImport"("importNo");

-- CreateIndex
CREATE INDEX "BulkImport_importNo_idx" ON "BulkImport"("importNo");

-- CreateIndex
CREATE INDEX "BulkImport_importType_idx" ON "BulkImport"("importType");

-- CreateIndex
CREATE INDEX "BulkImport_uploadedByUserId_idx" ON "BulkImport"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "BulkImport_status_idx" ON "BulkImport"("status");

-- CreateIndex
CREATE INDEX "BulkImport_createdAt_idx" ON "BulkImport"("createdAt");

-- CreateIndex
CREATE INDEX "BulkImportRow_importId_idx" ON "BulkImportRow"("importId");

-- CreateIndex
CREATE INDEX "BulkImportRow_status_idx" ON "BulkImportRow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BulkImportRow_importId_rowNumber_key" ON "BulkImportRow"("importId", "rowNumber");

-- CreateIndex
CREATE INDEX "BulkImportHistory_importId_idx" ON "BulkImportHistory"("importId");

-- CreateIndex
CREATE INDEX "BulkImportHistory_performedByUserId_idx" ON "BulkImportHistory"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSectionService_code_key" ON "StudentSectionService"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSectionRequest_requestNo_key" ON "StudentSectionRequest"("requestNo");

-- CreateIndex
CREATE INDEX "StudentSectionRequest_studentId_idx" ON "StudentSectionRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentSectionRequest_enrollmentNo_idx" ON "StudentSectionRequest"("enrollmentNo");

-- CreateIndex
CREATE INDEX "StudentSectionRequest_serviceId_idx" ON "StudentSectionRequest"("serviceId");

-- CreateIndex
CREATE INDEX "StudentSectionRequest_status_idx" ON "StudentSectionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSectionDocument_documentNo_key" ON "StudentSectionDocument"("documentNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSectionDocument_verificationCode_key" ON "StudentSectionDocument"("verificationCode");

-- CreateIndex
CREATE INDEX "StudentSectionDocument_requestId_idx" ON "StudentSectionDocument"("requestId");

-- CreateIndex
CREATE INDEX "StudentSectionDocument_studentId_idx" ON "StudentSectionDocument"("studentId");

-- CreateIndex
CREATE INDEX "StudentSectionDocument_enrollmentNo_idx" ON "StudentSectionDocument"("enrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "FeeQuery_queryNo_key" ON "FeeQuery"("queryNo");

-- CreateIndex
CREATE INDEX "FeeQuery_studentId_idx" ON "FeeQuery"("studentId");

-- CreateIndex
CREATE INDEX "FeeQuery_enrollmentNo_idx" ON "FeeQuery"("enrollmentNo");

-- CreateIndex
CREATE INDEX "FeeQuery_status_idx" ON "FeeQuery"("status");

-- CreateIndex
CREATE INDEX "FeeQuery_category_idx" ON "FeeQuery"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ExamFeeConfig_category_key" ON "ExamFeeConfig"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ExamFeeConfig_code_key" ON "ExamFeeConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceApplication_applicationNo_key" ON "AttendanceApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "AttendanceApplication_studentId_idx" ON "AttendanceApplication"("studentId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_enrollmentNo_idx" ON "AttendanceApplication"("enrollmentNo");

-- CreateIndex
CREATE INDEX "AttendanceApplication_subjectId_idx" ON "AttendanceApplication"("subjectId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_subjectFacultyId_idx" ON "AttendanceApplication"("subjectFacultyId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_mentorFacultyId_idx" ON "AttendanceApplication"("mentorFacultyId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_hodUserId_idx" ON "AttendanceApplication"("hodUserId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_hoiUserId_idx" ON "AttendanceApplication"("hoiUserId");

-- CreateIndex
CREATE INDEX "AttendanceApplication_status_idx" ON "AttendanceApplication"("status");

-- CreateIndex
CREATE INDEX "AttendanceApprovalHistory_applicationId_idx" ON "AttendanceApprovalHistory"("applicationId");

-- CreateIndex
CREATE INDEX "AttendanceApprovalHistory_fromUserId_idx" ON "AttendanceApprovalHistory"("fromUserId");

-- CreateIndex
CREATE INDEX "AttendanceApprovalHistory_toUserId_idx" ON "AttendanceApprovalHistory"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentMaster_code_key" ON "DocumentMaster"("code");

-- CreateIndex
CREATE INDEX "DocumentMaster_category_idx" ON "DocumentMaster"("category");

-- CreateIndex
CREATE INDEX "DocumentMaster_subcategory_idx" ON "DocumentMaster"("subcategory");

-- CreateIndex
CREATE INDEX "DocumentMaster_studentType_idx" ON "DocumentMaster"("studentType");

-- CreateIndex
CREATE INDEX "DocumentMaster_status_idx" ON "DocumentMaster"("status");

-- CreateIndex
CREATE INDEX "DocumentMaster_code_idx" ON "DocumentMaster"("code");

-- CreateIndex
CREATE INDEX "StudentAcademicDocument_studentId_idx" ON "StudentAcademicDocument"("studentId");

-- CreateIndex
CREATE INDEX "StudentAcademicDocument_enrollmentNo_idx" ON "StudentAcademicDocument"("enrollmentNo");

-- CreateIndex
CREATE INDEX "StudentAcademicDocument_documentMasterId_idx" ON "StudentAcademicDocument"("documentMasterId");

-- CreateIndex
CREATE INDEX "StudentAcademicDocument_status_idx" ON "StudentAcademicDocument"("status");

-- CreateIndex
CREATE INDEX "StudentAcademicDocument_isLocked_idx" ON "StudentAcademicDocument"("isLocked");

-- CreateIndex
CREATE INDEX "StudentAcademicDocumentVersion_documentId_idx" ON "StudentAcademicDocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "StudentAcademicDocumentVersion_versionNumber_idx" ON "StudentAcademicDocumentVersion"("versionNumber");

-- CreateIndex
CREATE INDEX "DocumentVerification_documentId_idx" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVerification_performedByUserId_idx" ON "DocumentVerification"("performedByUserId");

-- CreateIndex
CREATE INDEX "DocumentApplicability_documentMasterId_idx" ON "DocumentApplicability"("documentMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialCorrespondence_referenceNumber_key" ON "OfficialCorrespondence"("referenceNumber");

-- CreateIndex
CREATE INDEX "OfficialCorrespondence_correspondenceType_idx" ON "OfficialCorrespondence"("correspondenceType");

-- CreateIndex
CREATE INDEX "OfficialCorrespondence_referenceNumber_idx" ON "OfficialCorrespondence"("referenceNumber");

-- CreateIndex
CREATE INDEX "OfficialCorrespondence_instituteId_idx" ON "OfficialCorrespondence"("instituteId");

-- CreateIndex
CREATE INDEX "OfficialCorrespondence_status_idx" ON "OfficialCorrespondence"("status");

-- CreateIndex
CREATE INDEX "FileMovementRecord_fileNumber_idx" ON "FileMovementRecord"("fileNumber");

-- CreateIndex
CREATE INDEX "FileMovementRecord_status_idx" ON "FileMovementRecord"("status");

-- CreateIndex
CREATE INDEX "FileMovementRecord_currentHolder_idx" ON "FileMovementRecord"("currentHolder");

-- CreateIndex
CREATE INDEX "CommitteeActionItem_meetingId_idx" ON "CommitteeActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "CommitteeActionItem_status_idx" ON "CommitteeActionItem"("status");

-- CreateIndex
CREATE INDEX "CommitteeActionItem_responsibleDepartment_idx" ON "CommitteeActionItem"("responsibleDepartment");

-- CreateIndex
CREATE UNIQUE INDEX "StatutoryApproval_requestNo_key" ON "StatutoryApproval"("requestNo");

-- CreateIndex
CREATE INDEX "StatutoryApproval_requestNo_idx" ON "StatutoryApproval"("requestNo");

-- CreateIndex
CREATE INDEX "StatutoryApproval_category_idx" ON "StatutoryApproval"("category");

-- CreateIndex
CREATE INDEX "StatutoryApproval_status_idx" ON "StatutoryApproval"("status");

-- CreateIndex
CREATE INDEX "Notification_module_idx" ON "Notification"("module");

-- CreateIndex
CREATE INDEX "Notification_scopeType_idx" ON "Notification"("scopeType");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_referenceId_idx" ON "Notification"("referenceId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_idx" ON "NotificationRecipient"("userId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_isRead_idx" ON "NotificationRecipient"("isRead");

-- CreateIndex
CREATE INDEX "NotificationRecipient_notificationId_idx" ON "NotificationRecipient"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTransfer_trackingCode_key" ON "WorkTransfer"("trackingCode");

-- CreateIndex
CREATE INDEX "WorkTransfer_fromUserId_idx" ON "WorkTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "WorkTransfer_toUserId_idx" ON "WorkTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "WorkTransfer_status_idx" ON "WorkTransfer"("status");

-- CreateIndex
CREATE INDEX "WorkTransfer_trackingCode_idx" ON "WorkTransfer"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDataChangeRequest_requestNo_key" ON "StudentDataChangeRequest"("requestNo");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_studentId_idx" ON "StudentDataChangeRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_status_idx" ON "StudentDataChangeRequest"("status");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_fieldCategory_idx" ON "StudentDataChangeRequest"("fieldCategory");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_fieldName_idx" ON "StudentDataChangeRequest"("fieldName");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_mentorId_idx" ON "StudentDataChangeRequest"("mentorId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_hodId_idx" ON "StudentDataChangeRequest"("hodId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequest_createdAt_idx" ON "StudentDataChangeRequest"("createdAt");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequestAuditLog_requestId_idx" ON "StudentDataChangeRequestAuditLog"("requestId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequestAuditLog_studentId_idx" ON "StudentDataChangeRequestAuditLog"("studentId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequestAuditLog_performedByUserId_idx" ON "StudentDataChangeRequestAuditLog"("performedByUserId");

-- CreateIndex
CREATE INDEX "StudentDataChangeRequestAuditLog_createdAt_idx" ON "StudentDataChangeRequestAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Institute" ADD CONSTRAINT "Institute_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentDivisionId_fkey" FOREIGN KEY ("currentDivisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowHistory" ADD CONSTRAINT "WorkflowHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDelegation" ADD CONSTRAINT "WorkflowDelegation_delegatorUserId_fkey" FOREIGN KEY ("delegatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDelegation" ADD CONSTRAINT "WorkflowDelegation_delegateeUserId_fkey" FOREIGN KEY ("delegateeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFacultyMapping" ADD CONSTRAINT "StudentFacultyMapping_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFacultyMapping" ADD CONSTRAINT "StudentFacultyMapping_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFacultyMapping" ADD CONSTRAINT "StudentFacultyMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFacultyMapping" ADD CONSTRAINT "StudentFacultyMapping_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFacultyMapping" ADD CONSTRAINT "StudentFacultyMapping_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMentorMapping" ADD CONSTRAINT "StudentMentorMapping_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMentorMapping" ADD CONSTRAINT "StudentMentorMapping_mentorFacultyId_fkey" FOREIGN KEY ("mentorFacultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMentorMapping" ADD CONSTRAINT "StudentMentorMapping_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAssignment" ADD CONSTRAINT "MentorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAssignment" ADD CONSTRAINT "MentorAssignment_mentorFacultyId_fkey" FOREIGN KEY ("mentorFacultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAssignmentHistory" ADD CONSTRAINT "MentorAssignmentHistory_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "MentorAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectMapping" ADD CONSTRAINT "FacultySubjectMapping_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectMapping" ADD CONSTRAINT "FacultySubjectMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectMapping" ADD CONSTRAINT "FacultySubjectMapping_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultySubjectMapping" ADD CONSTRAINT "FacultySubjectMapping_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFee" ADD CONSTRAINT "ExamFee_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamLateFeeRule" ADD CONSTRAINT "ExamLateFeeRule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFormWindow" ADD CONSTRAINT "ExamFormWindow_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_examFormWindowId_fkey" FOREIGN KEY ("examFormWindowId") REFERENCES "ExamFormWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFormSubject" ADD CONSTRAINT "ExamFormSubject_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "ExamForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFormSubject" ADD CONSTRAINT "ExamFormSubject_examinationSubjectId_fkey" FOREIGN KEY ("examinationSubjectId") REFERENCES "ExamSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFormSubject" ADD CONSTRAINT "ExamFormSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "ExamForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeHeadAuditLog" ADD CONSTRAINT "FeeHeadAuditLog_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureAuditLog" ADD CONSTRAINT "FeeStructureAuditLog_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAccount" ADD CONSTRAINT "StudentFeeAccount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAccount" ADD CONSTRAINT "StudentFeeAccount_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeItem" ADD CONSTRAINT "StudentFeeItem_studentFeeAccountId_fkey" FOREIGN KEY ("studentFeeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeItem" ADD CONSTRAINT "StudentFeeItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeItem" ADD CONSTRAINT "StudentFeeItem_feeStructureItemId_fkey" FOREIGN KEY ("feeStructureItemId") REFERENCES "FeeStructureItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAccountAuditLog" ADD CONSTRAINT "StudentFeeAccountAuditLog_studentFeeAccountId_fkey" FOREIGN KEY ("studentFeeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_studentFeeAccountId_fkey" FOREIGN KEY ("studentFeeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceItem" ADD CONSTRAINT "FeeInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceItem" ADD CONSTRAINT "FeeInvoiceItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceItem" ADD CONSTRAINT "FeeInvoiceItem_studentFeeItemId_fkey" FOREIGN KEY ("studentFeeItemId") REFERENCES "StudentFeeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInvoiceAuditLog" ADD CONSTRAINT "FeeInvoiceAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuditLog" ADD CONSTRAINT "PaymentAuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceiptAuditLog" ADD CONSTRAINT "PaymentReceiptAuditLog_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRule" ADD CONSTRAINT "LateFeeRule_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRule" ADD CONSTRAINT "LateFeeRule_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRecord" ADD CONSTRAINT "LateFeeRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRecord" ADD CONSTRAINT "LateFeeRecord_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LateFeeRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheet" ADD CONSTRAINT "NoteSheet_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheetEstimateItem" ADD CONSTRAINT "NoteSheetEstimateItem_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheetAttachment" ADD CONSTRAINT "NoteSheetAttachment_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheetHistory" ADD CONSTRAINT "NoteSheetHistory_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheetComplianceItem" ADD CONSTRAINT "NoteSheetComplianceItem_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSheetClarification" ADD CONSTRAINT "NoteSheetClarification_notesheetId_fkey" FOREIGN KEY ("notesheetId") REFERENCES "NoteSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentItem" ADD CONSTRAINT "FeePaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentItem" ADD CONSTRAINT "FeePaymentItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDiscount" ADD CONSTRAINT "FeeDiscount_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_feeAccountId_fkey" FOREIGN KEY ("feeAccountId") REFERENCES "StudentFeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMaster" ADD CONSTRAINT "ItemMaster_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ItemCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMaster" ADD CONSTRAINT "ItemMaster_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssue" ADD CONSTRAINT "StockIssue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssue" ADD CONSTRAINT "StockIssue_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssue" ADD CONSTRAINT "StockIssue_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReturn" ADD CONSTRAINT "StockReturn_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "StockIssue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReturn" ADD CONSTRAINT "StockReturn_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalFileRecord" ADD CONSTRAINT "PhysicalFileRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalVerificationLog" ADD CONSTRAINT "PhysicalVerificationLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeServiceHistory" ADD CONSTRAINT "EmployeeServiceHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAttendance" ADD CONSTRAINT "EmployeeAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelBed" ADD CONSTRAINT "HostelBed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelApplication" ADD CONSTRAINT "HostelApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HostelBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelTransfer" ADD CONSTRAINT "HostelTransfer_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelCheckInOut" ADD CONSTRAINT "HostelCheckInOut_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAttendance" ADD CONSTRAINT "HostelAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAttendance" ADD CONSTRAINT "HostelAttendance_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutpassRequest" ADD CONSTRAINT "OutpassRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitor" ADD CONSTRAINT "HostelVisitor_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitor" ADD CONSTRAINT "HostelVisitor_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitor" ADD CONSTRAINT "HostelVisitor_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitorLog" ADD CONSTRAINT "HostelVisitorLog_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "HostelVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelComplaint" ADD CONSTRAINT "HostelComplaint_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenance" ADD CONSTRAINT "HostelMaintenance_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenanceRequest" ADD CONSTRAINT "HostelMaintenanceRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenanceRequest" ADD CONSTRAINT "HostelMaintenanceRequest_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenanceRequest" ADD CONSTRAINT "HostelMaintenanceRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenanceHistory" ADD CONSTRAINT "HostelMaintenanceHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HostelMaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaintenanceAttachment" ADD CONSTRAINT "HostelMaintenanceAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "HostelMaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessMenu" ADD CONSTRAINT "MessMenu_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessEnrollment" ADD CONSTRAINT "MessEnrollment_messId_fkey" FOREIGN KEY ("messId") REFERENCES "Mess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessEnrollment" ADD CONSTRAINT "MessEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDriverMapping" ADD CONSTRAINT "VehicleDriverMapping_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDriverMapping" ADD CONSTRAINT "VehicleDriverMapping_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRouteMapping" ADD CONSTRAINT "VehicleRouteMapping_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRouteMapping" ADD CONSTRAINT "VehicleRouteMapping_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportStop" ADD CONSTRAINT "TransportStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportApplication" ADD CONSTRAINT "TransportApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportApplication" ADD CONSTRAINT "TransportApplication_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportApplication" ADD CONSTRAINT "TransportApplication_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TransportStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TransportStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportPass" ADD CONSTRAINT "TransportPass_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "TransportAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportPass" ADD CONSTRAINT "TransportPass_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportTrip" ADD CONSTRAINT "TransportTrip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportTrip" ADD CONSTRAINT "TransportTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportTrip" ADD CONSTRAINT "TransportTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAttendance" ADD CONSTRAINT "TransportAttendance_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TransportTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAttendance" ADD CONSTRAINT "TransportAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenance" ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportIncident" ADD CONSTRAINT "TransportIncident_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportIncident" ADD CONSTRAINT "TransportIncident_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportComplaint" ADD CONSTRAINT "TransportComplaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportComplaint" ADD CONSTRAINT "TransportComplaint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportComplaint" ADD CONSTRAINT "TransportComplaint_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibrarySection" ADD CONSTRAINT "LibrarySection_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryShelf" ADD CONSTRAINT "LibraryShelf_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "LibrarySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LibraryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "LibraryAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "LibraryPublisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "LibraryShelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMembership" ADD CONSTRAINT "LibraryMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIssue" ADD CONSTRAINT "LibraryIssue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIssue" ADD CONSTRAINT "LibraryIssue_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReturn" ADD CONSTRAINT "LibraryReturn_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "LibraryIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFine" ADD CONSTRAINT "LibraryFine_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "LibraryIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFine" ADD CONSTRAINT "LibraryFine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIncident" ADD CONSTRAINT "LibraryIncident_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIncident" ADD CONSTRAINT "LibraryIncident_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalResource" ADD CONSTRAINT "DigitalResource_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalResource" ADD CONSTRAINT "DigitalResource_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalResource" ADD CONSTRAINT "DigitalResource_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITTicket" ADD CONSTRAINT "ITTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusServiceRequest" ADD CONSTRAINT "CampusServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchMember" ADD CONSTRAINT "ResearchMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchMember" ADD CONSTRAINT "ResearchMember_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchMilestone" ADD CONSTRAINT "ResearchMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGrant" ADD CONSTRAINT "ResearchGrant_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patent" ADD CONSTRAINT "Patent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationIdea" ADD CONSTRAINT "InnovationIdea_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_incubationCenterId_fkey" FOREIGN KEY ("incubationCenterId") REFERENCES "IncubationCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupMember" ADD CONSTRAINT "StartupMember_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupMember" ADD CONSTRAINT "StartupMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupMentor" ADD CONSTRAINT "StartupMentor_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupMentor" ADD CONSTRAINT "StartupMentor_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupMilestone" ADD CONSTRAINT "StartupMilestone_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementDrive" ADD CONSTRAINT "PlacementDrive_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "PlacementCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "PlacementDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementInterview" ADD CONSTRAINT "PlacementInterview_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "PlacementDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementOffer" ADD CONSTRAINT "PlacementOffer_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "PlacementDrive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IQACMeeting" ADD CONSTRAINT "IQACMeeting_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "IQACActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IQACActionItem" ADD CONSTRAINT "IQACActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "IQACMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NAACMetric" ADD CONSTRAINT "NAACMetric_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "NAACCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NAACMetricData" ADD CONSTRAINT "NAACMetricData_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "NAACMetric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NAACEvidence" ADD CONSTRAINT "NAACEvidence_metricDataId_fkey" FOREIGN KEY ("metricDataId") REFERENCES "NAACMetricData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "ComplianceFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgReporting" ADD CONSTRAINT "UserOrgReporting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleHistory" ADD CONSTRAINT "UserRoleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkDiary" ADD CONSTRAINT "WorkDiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkDiaryHistory" ADD CONSTRAINT "WorkDiaryHistory_workDiaryId_fkey" FOREIGN KEY ("workDiaryId") REFERENCES "WorkDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDelegation" ADD CONSTRAINT "TaskDelegation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "PersonalMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAppointment" ADD CONSTRAINT "PersonalAppointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkFollowUp" ADD CONSTRAINT "WorkFollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalNote" ADD CONSTRAINT "PersonalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_communicationTypeId_fkey" FOREIGN KEY ("communicationTypeId") REFERENCES "CommunicationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationRecipient" ADD CONSTRAINT "CommunicationRecipient_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAssignment" ADD CONSTRAINT "CommunicationAssignment_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMovement" ADD CONSTRAINT "CommunicationMovement_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationApproval" ADD CONSTRAINT "CommunicationApproval_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRecord" ADD CONSTRAINT "DispatchRecord_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardRegister" ADD CONSTRAINT "InwardRegister_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardRegister" ADD CONSTRAINT "InwardRegister_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardRegister" ADD CONSTRAINT "InwardRegister_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardForwarding" ADD CONSTRAINT "InwardForwarding_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "InwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardForwarding" ADD CONSTRAINT "InwardForwarding_forwardedByUserId_fkey" FOREIGN KEY ("forwardedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardStatusHistory" ADD CONSTRAINT "InwardStatusHistory_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "InwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardRegister" ADD CONSTRAINT "OutwardRegister_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardRegister" ADD CONSTRAINT "OutwardRegister_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardDispatch" ADD CONSTRAINT "OutwardDispatch_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "OutwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutwardStatusHistory" ADD CONSTRAINT "OutwardStatusHistory_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "OutwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardOutwardAuditLog" ADD CONSTRAINT "InwardOutwardAuditLog_inwardId_fkey" FOREIGN KEY ("inwardId") REFERENCES "InwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardOutwardAuditLog" ADD CONSTRAINT "InwardOutwardAuditLog_outwardId_fkey" FOREIGN KEY ("outwardId") REFERENCES "OutwardRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardOutwardAuditLog" ADD CONSTRAINT "InwardOutwardAuditLog_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequirement" ADD CONSTRAINT "StudentServiceRequirement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "StudentService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequest" ADD CONSTRAINT "StudentServiceRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequest" ADD CONSTRAINT "StudentServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "StudentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequest" ADD CONSTRAINT "StudentServiceRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequestDocument" ADD CONSTRAINT "StudentServiceRequestDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequestMessage" ADD CONSTRAINT "StudentServiceRequestMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentServiceRequestHistory" ADD CONSTRAINT "StudentServiceRequestHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "StudentService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingRecord" ADD CONSTRAINT "CounsellingRecord_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "AdmissionInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_admissionCycleId_fkey" FOREIGN KEY ("admissionCycleId") REFERENCES "AdmissionCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "AdmissionInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplicationDocument" ADD CONSTRAINT "AdmissionApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApproval" ADD CONSTRAINT "AdmissionApproval_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCentreAllocation" ADD CONSTRAINT "ExamCentreAllocation_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCentreAllocation" ADD CONSTRAINT "ExamCentreAllocation_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSeatAllocation" ADD CONSTRAINT "ExamSeatAllocation_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSeatAllocation" ADD CONSTRAINT "ExamSeatAllocation_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSeatAllocation" ADD CONSTRAINT "ExamSeatAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSeatAllocation" ADD CONSTRAINT "ExamSeatAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSeatChangeHistory" ADD CONSTRAINT "ExamSeatChangeHistory_seatAllocationId_fkey" FOREIGN KEY ("seatAllocationId") REFERENCES "ExamSeatAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEdpDuty" ADD CONSTRAINT "ExamEdpDuty_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEdpDuty" ADD CONSTRAINT "ExamEdpDuty_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ExamCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEdpDuty" ADD CONSTRAINT "ExamEdpDuty_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEdpDuty" ADD CONSTRAINT "ExamEdpDuty_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEdpDutyHistory" ADD CONSTRAINT "ExamEdpDutyHistory_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "ExamEdpDuty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoomAllocation" ADD CONSTRAINT "ExamRoomAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoomAllocation" ADD CONSTRAINT "ExamRoomAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvigilatorAssignment" ADD CONSTRAINT "InvigilatorAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "ExamForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSummary" ADD CONSTRAINT "ResultSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultRevisionHistory" ADD CONSTRAINT "ResultRevisionHistory_resultSummaryId_fkey" FOREIGN KEY ("resultSummaryId") REFERENCES "ResultSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevaluationRequest" ADD CONSTRAINT "RevaluationRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyRequest" ADD CONSTRAINT "DutyRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalReview" ADD CONSTRAINT "AppraisalReview_appraisalCycleId_fkey" FOREIGN KEY ("appraisalCycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalReview" ADD CONSTRAINT "AppraisalReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobRequisitionId_fkey" FOREIGN KEY ("jobRequisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resignation" ADD CONSTRAINT "Resignation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExitClearance" ADD CONSTRAINT "ExitClearance_resignationId_fkey" FOREIGN KEY ("resignationId") REFERENCES "Resignation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRisk" ADD CONSTRAINT "AcademicRisk_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRisk" ADD CONSTRAINT "AcademicRisk_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRisk" ADD CONSTRAINT "AcademicRisk_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDuty" ADD CONSTRAINT "EdpDuty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDuty" ADD CONSTRAINT "EdpDuty_assignedOfficerId_fkey" FOREIGN KEY ("assignedOfficerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDuty" ADD CONSTRAINT "EdpDuty_teachingFacultyId_fkey" FOREIGN KEY ("teachingFacultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDutyPhoto" ADD CONSTRAINT "EdpDutyPhoto_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "EdpDuty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDutyStudentObservation" ADD CONSTRAINT "EdpDutyStudentObservation_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "EdpDuty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdpDutyHistory" ADD CONSTRAINT "EdpDutyHistory_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "EdpDuty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkImport" ADD CONSTRAINT "BulkImport_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkImportRow" ADD CONSTRAINT "BulkImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BulkImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkImportHistory" ADD CONSTRAINT "BulkImportHistory_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BulkImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSectionRequest" ADD CONSTRAINT "StudentSectionRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "StudentSectionService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSectionDocument" ADD CONSTRAINT "StudentSectionDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentSectionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAcademicDocument" ADD CONSTRAINT "StudentAcademicDocument_documentMasterId_fkey" FOREIGN KEY ("documentMasterId") REFERENCES "DocumentMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAcademicDocumentVersion" ADD CONSTRAINT "StudentAcademicDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudentAcademicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StudentAcademicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApplicability" ADD CONSTRAINT "DocumentApplicability_documentMasterId_fkey" FOREIGN KEY ("documentMasterId") REFERENCES "DocumentMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeActionItem" ADD CONSTRAINT "CommitteeActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDataChangeRequest" ADD CONSTRAINT "StudentDataChangeRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDataChangeRequestAuditLog" ADD CONSTRAINT "StudentDataChangeRequestAuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StudentDataChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDataChangeRequestAuditLog" ADD CONSTRAINT "StudentDataChangeRequestAuditLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

