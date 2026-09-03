# SSIU ERP — FUTURE ROLE GROUP DATABASE REQUIREMENTS

**Document Status:** 📋 Architectural Proposal for Future Database Migration Phase  
**Prisma Schema Status:** 🛡️ Zero Schema Changes / Zero Migrations in Phase 4

---

## 1. Overview & Architectural Motivation
In SSIU ERP Phase 4, Role Group permission bundling and User-Specific Overrides are operational using existing `Role`, `UserRole`, `Permission`, and `RolePermission` models with in-memory override persistence and audit tracking.

When the database migration phase is executed, dedicated relational tables should be introduced to persist Role Groups, multi-role groupings, and individual permission overrides with full relational integrity and foreign-key cascades.

---

## 2. Proposed Relational Schema (Prisma Format)

```prisma
// ──────────────────────────────────────────────────────────────────────────────
// ROLE GROUPS & PERMISSION BUNDLES (FUTURE MIGRATION PHASE)
// ──────────────────────────────────────────────────────────────────────────────

model RoleGroup {
  id             String   @id @default(uuid())
  code           String   @unique // e.g. "FACULTY_GROUP", "ADMIN_OFFICER_GROUP", "CLERK_GROUP"
  name           String   // e.g. "Teaching Faculty Bundle", "Office Staff Bundle"
  description    String?
  category       String   @default("STAFF") // ACADEMIC | ADMINISTRATIVE | TECHNICAL | STUDENT_SERVICES
  authorityLevel Int      @default(10)
  status         String   @default("ACTIVE") // ACTIVE | INACTIVE | DEPRECATED
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relationships
  roleGroupRoles       RoleGroupRole[]
  userRoleGroups       UserRoleGroup[]
  roleGroupPermissions RoleGroupPermission[]

  @@index([category])
  @@index([authorityLevel])
  @@index([status])
}

model RoleGroupRole {
  roleGroupId String
  roleId      String
  assignedAt  DateTime @default(now())
  assignedBy  String?

  roleGroup   RoleGroup @relation(fields: [roleGroupId], references: [id], onDelete: Cascade)
  role        Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([roleGroupId, roleId])
  @@index([roleGroupId])
  @@index([roleId])
}

model RoleGroupPermission {
  roleGroupId  String
  permissionId String
  assignedAt   DateTime @default(now())

  roleGroup    RoleGroup  @relation(fields: [roleGroupId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleGroupId, permissionId])
  @@index([roleGroupId])
  @@index([permissionId])
}

model UserRoleGroup {
  userId      String
  roleGroupId String
  assignedAt  DateTime @default(now())
  assignedBy  String?
  scopeType   String   @default("UNIVERSITY") // UNIVERSITY | INSTITUTE | DEPARTMENT | PROGRAM | OWN
  scopeId     String?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleGroup   RoleGroup @relation(fields: [roleGroupId], references: [id], onDelete: Cascade)

  @@id([userId, roleGroupId])
  @@index([userId])
  @@index([roleGroupId])
  @@index([scopeType, scopeId])
}

model UserPermissionOverride {
  id                String   @id @default(uuid())
  userId            String
  permissionId      String
  isGranted         Boolean  // true = Explicit ALLOW, false = Explicit DENY
  reason            String?  // Administrative rationale for override
  assignedByUserId  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission        Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([userId, permissionId])
  @@index([userId])
  @@index([permissionId])
  @@index([isGranted])
}
```

---

## 3. Precedence & Evaluation Rules
When the relational models are deployed:
1. **Account Status Verification** (`ACTIVE` required; `LOCKED`/`INACTIVE`/`SUSPENDED` rejected).
2. **UserPermissionOverride** evaluated first:
   - If `isGranted == false` -> **DENY immediately** (e.g. Faculty group has EXPORT, but individual faculty has DENY EXPORT).
   - If `isGranted == true` -> **GRANT** (proceed to Scope check).
3. **Super Admin Hierarchy Bypass**:
   - `SUPER_ADMIN`, `SYSTEM_ADMIN`, `PRESIDENT`, `VICE_PRESIDENT` maintain university-wide access.
4. **RoleGroup / Role Inheritance**:
   - Union of all permissions granted across assigned `RoleGroup` bundles and standalone `Role` assignments.
5. **Scope Verification**:
   - Scopes attached to the granting `UserRoleGroup` or `UserRole` determine resource boundaries (`UNIVERSITY`, `INSTITUTE`, `DEPARTMENT`, `OWN`).

---

## 4. Migration & Safety Considerations
1. **Zero Downtime Migration**:
   - Seed default `RoleGroup` records matching existing baseline roles (`FACULTY_GROUP`, `HOD_GROUP`, `STAFF_GROUP`, `STUDENT_GROUP`).
   - Populate `RoleGroupRole` associations without deleting existing `UserRole` data.
2. **Indexing**:
   - Composite indexes on `[userId, roleGroupId]` and `[userId, permissionId]` ensure $O(1)$ lookup times.
3. **Audit History**:
   - Existing `RbacAudit` table is retained and logs every `ROLE_GROUP_ASSIGNED`, `ROLE_GROUP_REMOVED`, and `OVERRIDE_CHANGED` event.
