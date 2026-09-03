# SSIU ERP — FUTURE HELPDESK DATABASE REQUIREMENTS

**Document Status:** 📋 Architectural Proposal for Future Database Migration Phase  
**Prisma Schema Status:** 🛡️ Zero Schema Changes / Zero Migrations in Phase 5

---

## 1. Executive Summary
During Phase 5, the SSIU Helpdesk & Support Ticketing System was successfully consolidated into a unified university-wide workflow using the existing `ITTicket` PostgreSQL model for master records and a thread persistence layer in `ItHelpdeskService` for comments and internal notes.

When the centralized database migration phase is executed, dedicated relational tables should be introduced to establish permanent relational integrity for threaded conversations, attachments, departmental routing, and audit logs.

---

## 2. Proposed Relational Schema (Prisma Format)

```prisma
// ──────────────────────────────────────────────────────────────────────────────
// UNIFIED HELPDESK & SUPPORT TICKETING ENGINE (FUTURE MIGRATION PHASE)
// ──────────────────────────────────────────────────────────────────────────────

enum HelpdeskCategory {
  ACADEMIC
  HOSTEL
  FEES
  INFRASTRUCTURE
  IT
  EXAMINATION
  LIBRARY
  TRANSPORT
  TECHNICAL
  ADMINISTRATIVE
  OTHER
}

enum TicketPriority {
  URGENT
  HIGH
  NORMAL
  LOW
}

enum TicketStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  WAITING
  RESOLVED
  CLOSED
  REOPENED
}

enum TicketMessageType {
  USER_MESSAGE
  STAFF_RESPONSE
  INTERNAL_NOTE
}

model HelpdeskTicket {
  id               String           @id @default(uuid())
  ticketNo         String           @unique // HD-2026-000001
  userId           String           // Creator User ID
  category         HelpdeskCategory
  priority         TicketPriority   @default(NORMAL)
  status           TicketStatus     @default(OPEN)
  title            String           @db.VarChar(200)
  description      String           @db.Text

  departmentId     String?          // Target academic or administrative department
  assignedToUserId String?          // Assigned Staff/Faculty User ID
  
  resolution       String?          @db.Text
  resolvedAt       DateTime?
  closedAt         DateTime?
  reopenedAt       DateTime?

  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relationships
  user             User             @relation("TicketCreator", fields: [userId], references: [id])
  assignedTo       User?            @relation("TicketAssignee", fields: [assignedToUserId], references: [id])
  department       Department?      @relation(fields: [departmentId], references: [id])
  messages         TicketMessage[]
  attachments      TicketAttachment[]
  auditLogs        TicketAuditLog[]

  @@index([userId])
  @@index([assignedToUserId])
  @@index([departmentId])
  @@index([category])
  @@index([status])
  @@index([priority])
  @@index([createdAt])
}

model TicketMessage {
  id               String            @id @default(uuid())
  ticketId         String
  authorId         String
  messageType      TicketMessageType @default(USER_MESSAGE)
  message          String            @db.Text
  createdAt        DateTime          @default(now())

  // Relationships
  ticket           HelpdeskTicket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author           User              @relation(fields: [authorId], references: [id])
  attachments      TicketAttachment[]

  @@index([ticketId])
  @@index([authorId])
  @@index([messageType])
  @@index([createdAt])
}

model TicketAttachment {
  id               String          @id @default(uuid())
  ticketId         String
  messageId        String?
  uploaderId       String
  fileName         String
  fileUrl          String
  fileSize         Int             // In bytes
  mimeType         String
  isPrivate        Boolean         @default(false) // true if internal note attachment
  createdAt        DateTime        @default(now())

  // Relationships
  ticket           HelpdeskTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  message          TicketMessage?  @relation(fields: [messageId], references: [id], onDelete: SetNull)
  uploader         User            @relation(fields: [uploaderId], references: [id])

  @@index([ticketId])
  @@index([uploaderId])
}

model TicketAuditLog {
  id               String          @id @default(uuid())
  ticketId         String
  actorId          String
  actorRole        String
  action           String          // CREATED | ASSIGNED | STATUS_CHANGED | RESOLVED | REOPENED | CLOSED
  details          String?
  timestamp        DateTime        @default(now())

  // Relationships
  ticket           HelpdeskTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actor            User            @relation(fields: [actorId], references: [id])

  @@index([ticketId])
  @@index([actorId])
  @@index([timestamp])
}
```

---

## 3. Precedence, Access Control & Visibility Rules
1. **Internal Note Protection**:
   - `TicketMessage.messageType == 'INTERNAL_NOTE'` is strictly restricted to Staff and Administrators.
   - Ordinary students querying tickets will never receive internal notes in SQL result sets (`WHERE messageType != 'INTERNAL_NOTE'`).
2. **IDOR & Scope Guard**:
   - Students querying `HelpdeskTicket` must satisfy `userId == req.user.id`.
   - Department Helpdesk Officers are scoped to `departmentId == req.user.departmentId`.
   - Institute Principals are scoped to departments within their `instituteId`.
3. **Status Transitions**:
   - Only assigned staff or administrators can mark tickets as `RESOLVED` or `ASSIGNED`.
   - Students may only `CLOSE` their own tickets or `REOPEN` their own previously resolved tickets within 7 days.

---

## 4. Migration Considerations
1. **Data Migration from `ITTicket`**:
   - An ETL migration script will copy existing rows from `ITTicket` into `HelpdeskTicket`, mapping `title` $\to$ `title`, `description` $\to$ `description`, and generating initial `TicketMessage` records for the initial description.
2. **Index Optimization**:
   - Composite indexes on `[status, category, createdAt]` to accelerate high-volume dashboard filtering.
