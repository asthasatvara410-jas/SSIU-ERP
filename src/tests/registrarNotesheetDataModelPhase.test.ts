import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { NoteSheet, NoteSheetStatus, NoteSheetAction, NoteSheetPriority } from '../types';

describe('Phase 1: Notesheet Data Model & Relational Integrity Verification', () => {

  it('TEST 1.1: Core NoteSheet entity structure conforms strictly to data model', () => {
    const noteSheets = db.getState().noteSheets || [];
    expect(noteSheets.length).toBeGreaterThanOrEqual(5);

    noteSheets.forEach((ns: NoteSheet) => {
      expect(ns.id).toBeDefined();
      expect(typeof ns.id).toBe('string');
      expect(ns.id.length).toBeGreaterThan(0);

      expect(ns.subject).toBeDefined();
      expect(typeof ns.subject).toBe('string');

      expect(ns.status).toBeDefined();
      const validStatuses: NoteSheetStatus[] = [
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'FORWARDED', 'RETURNED',
        'CLARIFICATION_REQUIRED', 'PENDING_APPROVAL', 'ACTION_PENDING',
        'ACTION_IN_PROGRESS', 'ACTION_COMPLETED', 'APPROVED', 'REJECTED',
        'CLOSED', 'CANCELLED', 'REOPENED', 'COMPLETED',
        'PENDING_HOD', 'PENDING_HOI', 'PENDING_DEPUTY_REGISTRAR',
        'PENDING_REGISTRAR', 'PENDING_ACCOUNTS', 'PENDING_EXAM_CELL',
        'PENDING_ESTATE', 'PENDING_TRANSPORT', 'PENDING_HOSTEL',
        'PENDING_IQAC', 'PENDING_HR', 'PENDING_FACULTY',
        'PENDING_VICE_PRESIDENT', 'PENDING_HIGHER_AUTHORITY',
        'IN_CONSULTATION', 'RESUBMITTED'
      ];
      expect(validStatuses).toContain(ns.status);

      if (ns.priority) {
        const validPriorities: NoteSheetPriority[] = ['NORMAL', 'IMPORTANT', 'URGENT', 'IMMEDIATE', 'LOW', 'MEDIUM', 'HIGH'];
        expect(validPriorities).toContain(ns.priority);
      }
    });
  });

  it('TEST 1.2: Relational Integrity: Institute and Department relationships resolve correctly', () => {
    const noteSheets = db.getState().noteSheets || [];
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();

    const instIds = new Set(institutes.map(i => i.id));
    const deptIds = new Set(departments.map(d => d.id));

    noteSheets.forEach((ns: NoteSheet) => {
      if (ns.instituteId && ns.instituteId !== 'CENTRAL' && ns.instituteId !== 'CENTRAL_ADMIN') {
        expect(instIds.has(ns.instituteId)).toBe(true);
      }
      if (ns.departmentId && ns.departmentId !== 'ADMIN' && ns.departmentId !== 'GENERAL') {
        expect(deptIds.has(ns.departmentId)).toBe(true);
      }
    });
  });

  it('TEST 1.3: Sub-entity Integrity: Estimates, Line Items, and Total Amount calculations', () => {
    const noteSheets = db.getState().noteSheets || [];

    noteSheets.forEach((ns: NoteSheet) => {
      if (ns.items && ns.items.length > 0) {
        ns.items.forEach(item => {
          expect(item.id).toBeDefined();
          expect(item.itemName).toBeDefined();
          expect(item.quantity).toBeGreaterThanOrEqual(0);
          expect(item.rate).toBeGreaterThanOrEqual(0);
          expect(item.amount).toBe(item.quantity * item.rate);
        });

        const calculatedTotal = ns.items.reduce((sum, item) => sum + item.amount, 0);
        if (ns.subtotal !== undefined && ns.subtotal > 0) {
          expect(ns.subtotal).toBe(calculatedTotal);
        }
      }
    });
  });

  it('TEST 1.4: Workflow Movement and Audit Log relational integrity', () => {
    const noteSheets = db.getState().noteSheets || [];

    noteSheets.forEach((ns: NoteSheet) => {
      if (ns.movements && ns.movements.length > 0) {
        ns.movements.forEach(mvt => {
          expect(mvt.id).toBeDefined();
          expect(mvt.fromUser).toBeDefined();
          expect(mvt.action).toBeDefined();
          expect(mvt.timestamp).toBeDefined();
          expect(typeof mvt.remarks).toBe('string');
        });
      }
    });
  });

  it('TEST 1.5: Strict Data Isolation: Notesheets do not cross-contaminate other ERP entity collections', () => {
    const noteSheets = db.getState().noteSheets || [];
    const notesheetIds = new Set(noteSheets.map(n => n.id));

    // Verify assets collection
    const assets = db.getState().assets || [];
    assets.forEach((a: any) => {
      expect(notesheetIds.has(a.id)).toBe(false);
    });

    // Verify student requests collection
    const requests = db.getState().studentRequests || [];
    requests.forEach((r: any) => {
      expect(notesheetIds.has(r.id)).toBe(false);
    });

    // Verify work transfers collection
    const workTransfers = db.getState().workTransfers || [];
    workTransfers.forEach((wt: any) => {
      expect(notesheetIds.has(wt.id)).toBe(false);
    });
  });
});
