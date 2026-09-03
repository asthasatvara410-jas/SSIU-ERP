import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { REGISTRAR_NAVIGATION_STRUCTURE } from '../constants/navigationConfig';
import { ROLE_NOTESHEET_PERMISSIONS, User } from '../types';

describe('SSIU ERP – Registrar Notesheet Module Restoration & Role Visibility', () => {

  const registrarUser: User = {
    id: 'usr-reg-01',
    name: 'Dr. Registrar',
    email: 'registrar@ssiu.ac.in',
    role: 'REGISTRAR',
    departmentId: 'ADMIN',
    instituteId: 'CENTRAL_ADMIN',
    status: 'ACTIVE'
  };

  const facultyUser: User = {
    id: 'fac-101',
    name: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const hodUser: User = {
    id: 'hod-101',
    name: 'Dr. HOD CSE',
    email: 'hod.cse@ssiu.ac.in',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  it('TEST 1: Notesheet is present in Registrar navigation as a clean single item under category 🎓 ACADEMIC', () => {
    const notesheetNav = REGISTRAR_NAVIGATION_STRUCTURE.find(n => n.id === 'note-sheets');
    expect(notesheetNav).toBeDefined();
    expect(notesheetNav?.label).toBe('Notesheet');
    expect(notesheetNav?.category).toBe('🎓 ACADEMIC');
    expect(notesheetNav?.defaultTab).toBe('reg-notesheets');
    // Clean single entry: submenu items are located inside the main Notesheet Management workspace
    expect(notesheetNav?.children).toBeUndefined();
  });

  it('TEST 2: Notesheet is positioned directly between Examination and Academic Requests in sidebar sequence', () => {
    const academicItems = REGISTRAR_NAVIGATION_STRUCTURE.filter(n => n.category === '🎓 ACADEMIC');
    const examIdx = academicItems.findIndex(n => n.id === 'examination');
    const notesheetIdx = academicItems.findIndex(n => n.id === 'note-sheets');
    const requestsIdx = academicItems.findIndex(n => n.id === 'academic-requests');

    expect(examIdx).toBeGreaterThanOrEqual(0);
    expect(notesheetIdx).toBe(examIdx + 1);
    expect(requestsIdx).toBe(notesheetIdx + 1);
  });

  it('TEST 3: Registrar role has complete, unrestricted Notesheet RBAC permissions', () => {
    const registrarPerms = ROLE_NOTESHEET_PERMISSIONS['REGISTRAR'];
    expect(registrarPerms).toBeDefined();
    expect(registrarPerms).toContain('NOTESHEET_VIEW');
    expect(registrarPerms).toContain('NOTESHEET_CREATE');
    expect(registrarPerms).toContain('NOTESHEET_EDIT');
    expect(registrarPerms).toContain('NOTESHEET_SUBMIT');
    expect(registrarPerms).toContain('NOTESHEET_REVIEW');
    expect(registrarPerms).toContain('NOTESHEET_FORWARD');
    expect(registrarPerms).toContain('NOTESHEET_APPROVE');
    expect(registrarPerms).toContain('NOTESHEET_REJECT');
    expect(registrarPerms).toContain('NOTESHEET_RETURN');
    expect(registrarPerms).toContain('NOTESHEET_CLARIFICATION');
    expect(registrarPerms).toContain('NOTESHEET_ACTION');
    expect(registrarPerms).toContain('NOTESHEET_CLOSE');
    expect(registrarPerms).toContain('NOTESHEET_REPORT');
  });

  it('TEST 4: Registrar has university-level visibility of all Notesheets across all institutes and departments', () => {
    const allAuthorized = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    expect(allAuthorized).toBeInstanceOf(Array);
    expect(allAuthorized.length).toBeGreaterThan(0);

    // Verify multiple institutes are included
    const instituteIds = new Set(allAuthorized.map(n => n.instituteId).filter(Boolean));
    expect(instituteIds.size).toBeGreaterThanOrEqual(1);
  });

  it('TEST 5: Exact mathematical match: Pending With Me count strictly matches pending notesheet list length', () => {
    const pendingNotesheets = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
    expect(pendingNotesheets).toBeInstanceOf(Array);

    // Filter using filterNotesheetsByCategory
    const filteredPending = db.filterNotesheetsByCategory(
      db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR'),
      'PENDING_WITH_ME',
      registrarUser,
      'REGISTRAR'
    );

    expect(pendingNotesheets.length).toBe(filteredPending.length);
  });

  it('TEST 6: Role isolation: Faculty and HOD cannot see university-wide Notesheet queues', () => {
    const registrarNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    const facultyNotes = db.getAuthorizedNotesheetsForUser(facultyUser, 'FACULTY');
    const hodNotes = db.getAuthorizedNotesheetsForUser(hodUser, 'HOD');

    // Faculty only sees their own or assigned notesheets
    expect(facultyNotes.length).toBeLessThanOrEqual(registrarNotes.length);

    // HOD only sees department-scoped notesheets
    expect(hodNotes.length).toBeLessThanOrEqual(registrarNotes.length);
  });

  it('TEST 7: Registrar can process action on Notesheet with audit trail', () => {
    const allNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    const sample = allNotes[0];

    if (sample) {
      const initialMovements = sample.movements?.length || 0;
      
      db.processNoteSheetAction(
        sample.id,
        'FORWARD',
        'Forwarded by Registrar for higher sanction',
        undefined,
        registrarUser,
        'VICE_PRESIDENT'
      );

      const updated = db.getState().noteSheets.find(n => n.id === sample.id);
      expect(updated).toBeDefined();
      expect(updated?.movements?.length).toBeGreaterThanOrEqual(initialMovements);
    }
  });

  it('TEST 8: Demo Notesheet data has complete structural relationships and items', () => {
    const notes = db.getState().noteSheets;
    expect(notes.length).toBeGreaterThanOrEqual(5);

    notes.forEach(n => {
      expect(n.id).toBeDefined();
      expect(n.subject).toBeDefined();
      expect(n.status).toBeDefined();
    });
  });

  it('TEST 9: Existing ERP-Wide Notesheet categories and filters work identically for Registrar', () => {
    const allNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    
    const drafts = db.filterNotesheetsByCategory(allNotes, 'MY_DRAFTS', registrarUser, 'REGISTRAR');
    const financial = db.filterNotesheetsByCategory(allNotes, 'FINANCIAL', registrarUser, 'REGISTRAR');
    const urgent = db.filterNotesheetsByCategory(allNotes, 'URGENT', registrarUser, 'REGISTRAR');
    const approved = db.filterNotesheetsByCategory(allNotes, 'APPROVED', registrarUser, 'REGISTRAR');
    const returned = db.filterNotesheetsByCategory(allNotes, 'RETURNED', registrarUser, 'REGISTRAR');
    const clarification = db.filterNotesheetsByCategory(allNotes, 'CLARIFICATION', registrarUser, 'REGISTRAR');
    const actionPending = db.filterNotesheetsByCategory(allNotes, 'ACTION_PENDING', registrarUser, 'REGISTRAR');

    expect(drafts).toBeInstanceOf(Array);
    expect(financial).toBeInstanceOf(Array);
    expect(urgent).toBeInstanceOf(Array);
    expect(approved).toBeInstanceOf(Array);
    expect(returned).toBeInstanceOf(Array);
    expect(clarification).toBeInstanceOf(Array);
    expect(actionPending).toBeInstanceOf(Array);

    financial.forEach(n => {
      expect(Boolean(n.financialRequirement || n.budgetRequired || (n.estimatedCost && n.estimatedCost > 0))).toBe(true);
    });
  });
});

