# SSIU ERP — Future Student Council Database Requirements

**Document Purpose**: Architectural roadmap and database schema recommendations for future major iterations of the SSIU ERP Student Council Desk when schema migrations are formally scheduled.  
**Current State (Phase 8)**: 100% operational using existing unencumbered models (`Committee`, `CommitteeMember`, `CommitteeMeeting`, `CommitteeActionItem`, `StatutoryApproval`) with zero schema changes.  

---

## 1. Context & Trade-Off Analysis

### Current Phase 8 Implementation (Zero-Migration Approach)
- **Advantages**:
  - Zero database downtime or migration risk.
  - Reuses battle-tested, existing PostgreSQL relational tables (`Committee`, `CommitteeMeeting`, etc.).
  - Preserves 100% backward compatibility across all modules.
  - Met all 21 functional mandates of Phase 8 with 100% test pass rate.
- **Trade-Offs**:
  - Event proposals serialize extended metadata (venue, budget, footfall, review notes) into JSON/string columns (`remarks`) in `StatutoryApproval`.
  - Distinguishing between faculty-led statutory committees and student council bodies relies on discriminator column values (`committeeType: 'STUDENT_COUNCIL' | 'TECHNICAL_CLUB' | ...`).
  - Office bearer terms (e.g. Academic Year 2025–26 tenure) are managed via application-level validations rather than dedicated foreign key relationships.

---

## 2. Recommended Future Database Models

When the university schedules a dedicated database maintenance window and permits Prisma migrations, the following normalized schema expansion is recommended:

```prisma
// ==========================================
// 1. DEDICATED STUDENT COUNCIL ENTITY
// ==========================================
model StudentCouncil {
  id                    String              @id @default(uuid())
  code                  String              @unique // e.g. COUNCIL-SSCIT-2026
  name                  String              // Central Student Council 2026
  academicYear          String              // 2025-2026
  instituteId           String?
  facultyAdvisorUserId  String?             // Link to User / Faculty
  generalSecretaryId    String?             // Link to Student
  validFrom             DateTime            @db.Date
  validUntil            DateTime            @db.Date
  status                CouncilStatus       @default(ACTIVE)
  constitutionUrl       String?             // Link to charter PDF
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  institute             Institute?          @relation(fields: [instituteId], references: [id])
  facultyAdvisor        User?               @relation("CouncilFacultyAdvisor", fields: [facultyAdvisorUserId], references: [id])
  officeBearers         CouncilOfficeBearer[]
  clubs                 StudentClub[]
  meetings              CouncilMeeting[]
  budgets               CouncilBudget[]
  elections             CouncilElection[]

  @@index([instituteId])
  @@index([academicYear])
  @@index([status])
}

enum CouncilStatus {
  ACTIVE
  INACTIVE
  TRANSITIONING
  DISSOLVED
}

// ==========================================
// 2. OFFICE BEARERS WITH TENURE DATES
// ==========================================
model CouncilOfficeBearer {
  id                    String              @id @default(uuid())
  councilId             String
  studentId             String              // Foreign key to Student
  userId                String              // Foreign key to User
  designation           CouncilDesignation
  departmentId          String?
  appointedAt           DateTime            @default(now())
  tenureStart           DateTime            @db.Date
  tenureEnd             DateTime            @db.Date
  status                BearerStatus        @default(ACTIVE)
  appointmentOrderUrl   String?
  createdAt             DateTime            @default(now())

  council               StudentCouncil      @relation(fields: [councilId], references: [id], onDelete: Cascade)
  student               Student             @relation(fields: [studentId], references: [id])
  user                  User                @relation(fields: [userId], references: [id])

  @@unique([councilId, designation, status]) // Enforces single active President per council at DB level
  @@index([studentId])
  @@index([councilId])
}

enum CouncilDesignation {
  PRESIDENT
  VICE_PRESIDENT
  GENERAL_SECRETARY
  JOINT_SECRETARY
  TREASURER
  SPORTS_SECRETARY
  CULTURAL_SECRETARY
  TECHNICAL_SECRETARY
  EXECUTIVE_MEMBER
}

enum BearerStatus {
  ACTIVE
  RESIGNED
  GRADUATED
  DISQUALIFIED
}

// ==========================================
// 3. SPECIALIZED STUDENT CLUBS & CELLS
// ==========================================
model StudentClub {
  id                    String              @id @default(uuid())
  councilId             String?
  code                  String              @unique // e.g. CLUB-ROBO-2026
  name                  String
  category              ClubCategory
  facultyMentorUserId   String?
  studentLeadId         String?             // Foreign key to Student
  description           String              @db.Text
  logoUrl               String?
  status                ClubStatus          @default(ACTIVE)
  foundedDate           DateTime?           @db.Date
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  council               StudentCouncil?     @relation(fields: [councilId], references: [id])
  facultyMentor         User?               @relation("ClubFacultyMentor", fields: [facultyMentorUserId], references: [id])
  memberships           ClubMembership[]
  proposals             CouncilEventProposal[]

  @@index([category])
  @@index([status])
}

enum ClubCategory {
  TECHNICAL
  CULTURAL
  SPORTS
  INNOVATION_SSIP
  LITERARY
  COMMUNITY_OUTREACH
  STUDENT_WELFARE
}

enum ClubStatus {
  ACTIVE
  PROBATIONARY
  INACTIVE
}

// ==========================================
// 4. MEMBERSHIP WITH RECRUITMENT AUDIT
// ==========================================
model ClubMembership {
  id                    String              @id @default(uuid())
  clubId                String
  studentId             String
  role                  MembershipRole      @default(MEMBER)
  joinedAt              DateTime            @default(now())
  leftAt                DateTime?
  status                MembershipStatus    @default(ACTIVE)

  club                  StudentClub         @relation(fields: [clubId], references: [id], onDelete: Cascade)
  student               Student             @relation(fields: [studentId], references: [id])

  @@unique([clubId, studentId, status]) // Prevents duplicate active memberships in same club
  @@index([clubId])
  @@index([studentId])
}

enum MembershipRole {
  CLUB_HEAD
  VICE_HEAD
  COORDINATOR
  MEMBER
  VOLUNTEER
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
  ALUMNI
}

// ==========================================
// 5. NATIVE EVENT PROPOSAL & SANCTION ENGINE
// ==========================================
model CouncilEventProposal {
  id                    String              @id @default(uuid())
  proposalNo            String              @unique // EVT-PROP-2026-000001
  clubId                String
  proposerUserId        String
  title                 String
  category              String
  description           String              @db.Text
  targetAudience        String?
  proposedStartDate     DateTime
  proposedEndDate       DateTime
  venueRequested        String
  estimatedBudget       Decimal             @db.Decimal(12, 2)
  approvedBudget        Decimal?            @db.Decimal(12, 2)
  expectedParticipants  Int
  status                ProposalStatus      @default(SUBMITTED)
  reviewedByUserId      String?
  reviewedAt            DateTime?
  reviewRemarks         String?             @db.Text
  eventId               String?             // Link to Event in Event calendar when approved
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  club                  StudentClub         @relation(fields: [clubId], references: [id])
  proposer              User                @relation("ProposalProposer", fields: [proposerUserId], references: [id])
  reviewer              User?               @relation("ProposalReviewer", fields: [reviewedByUserId], references: [id])

  @@index([clubId])
  @@index([status])
  @@index([proposerUserId])
}

enum ProposalStatus {
  DRAFT
  SUBMITTED
  FACULTY_REVIEW
  COUNCIL_REVIEW
  APPROVED
  REJECTED
  COMPLETED
}

// ==========================================
// 6. COUNCIL ELECTIONS & VOTING MODULE
// ==========================================
model CouncilElection {
  id                    String              @id @default(uuid())
  councilId             String
  academicYear          String
  title                 String
  nominationStartDate   DateTime
  nominationEndDate     DateTime
  votingDate            DateTime            @db.Date
  status                ElectionStatus      @default(UPCOMING)
  eligibleVoterFilter   String?             // Criteria / institute rules

  council               StudentCouncil      @relation(fields: [councilId], references: [id])

  @@index([academicYear])
  @@index([status])
}

enum ElectionStatus {
  UPCOMING
  NOMINATIONS_OPEN
  SCRUTINY
  CAMPAIGNING
  VOTING_ACTIVE
  COUNTING
  RESULTS_DECLARED
}
```

---

## 3. Migration Strategy When Unlocked

When migration execution is authorized by ERP governance:
1. **Data Migration Script**:
   - Query all `Committee` records where `committeeType IN ('STUDENT_COUNCIL', 'TECHNICAL_CLUB', ...)` and copy into `StudentCouncil` and `StudentClub`.
   - Query `CommitteeMember` and populate `CouncilOfficeBearer` and `ClubMembership`.
   - Migrate `StatutoryApproval` where `category = 'STUDENT_EVENT_PROPOSAL'` into `CouncilEventProposal`.
2. **Zero Downtime View Aliasing**:
   - Create PostgreSQL views aliasing old queries to new tables during transition to guarantee zero disruption.
3. **Backend Service Decoupling**:
   - Switch `student-council.service.ts` Prisma calls from `this.prisma.committee` to `this.prisma.studentCouncil`. The public REST API contract remains 100% identical, requiring **zero frontend changes**.
