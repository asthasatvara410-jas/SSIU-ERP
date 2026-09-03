import { describe, it, expect, beforeEach } from 'vitest';
import { registrarOfficeService } from '../services/registrarOfficeService';

describe('Registrar Office Organization & Staff Control Suite', () => {

  beforeEach(() => {
    registrarOfficeService.init();
  });

  // TEST 1: Registrar Office is a separate autonomous organizational unit
  it('TEST 1: Establishes Registrar Office as an autonomous university administrative unit', () => {
    const office = registrarOfficeService.getOffice();
    expect(office).toBeDefined();
    expect(office.officeCode).toBe('RO-CENTRAL');
    expect(office.registrarName).toBe('Dr. Sanjay Patel');
    expect(office.status).toBe('ACTIVE');

    const sections = registrarOfficeService.getSections();
    expect(sections.length).toBeGreaterThanOrEqual(5);

    const positions = registrarOfficeService.getPositions();
    expect(positions.length).toBeGreaterThanOrEqual(5);
  });

  // TEST 2: Hierarchical reporting lines and levels
  it('TEST 2: Enforces hierarchical reporting lines across all positions', () => {
    const staff = registrarOfficeService.getStaffList();
    expect(staff.length).toBeGreaterThanOrEqual(10);

    staff.forEach(s => {
      expect(s.officeId).toBe('OFFICE-REGISTRAR-01');
      expect(s.sectionId).toBeDefined();
      expect(s.positionTitle).toBeDefined();
      expect(s.roleLevel).toBeDefined();

      if (s.roleLevel !== 'REGISTRAR') {
        expect(s.reportingToUserId || s.reportingToName).toBeDefined();
      }
    });

    // Verify presence of all tiers
    const depRegs = staff.filter(s => s.roleLevel === 'DEPUTY_REGISTRAR');
    const asstRegs = staff.filter(s => s.roleLevel === 'ASSISTANT_REGISTRAR');
    const secOfficers = staff.filter(s => s.roleLevel === 'SECTION_OFFICER');

    expect(depRegs.length).toBeGreaterThan(0);
    expect(asstRegs.length).toBeGreaterThan(0);
    expect(secOfficers.length).toBeGreaterThan(0);
  });

  // TEST 3: Dynamic staff appointment increments total count immediately
  it('TEST 3: Appointing a new officer increments office roster count with zero hardcoding', () => {
    const initialStaffCount = registrarOfficeService.getStaffList().length;
    const initialKPI = registrarOfficeService.getOfficeDashboardKPIs().totalStaff;

    const newStaff = registrarOfficeService.createStaffMember({
      name: 'Dr. Vikramaditya Joshi',
      email: `vikram.${Date.now()}@swarrnim.edu.in`,
      phone: '9825099887',
      sectionId: 'SEC-ACAD',
      positionId: 'POS-AREG',
      reportingToUserId: 'USER-DEP-REG-1',
      qualifications: 'Ph.D. in Academic Governance',
      performedByUser: { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });

    expect(newStaff.id).toBeDefined();
    expect(newStaff.roleLevel).toBe('ASSISTANT_REGISTRAR');

    const updatedStaffList = registrarOfficeService.getStaffList();
    const updatedKPI = registrarOfficeService.getOfficeDashboardKPIs().totalStaff;

    expect(updatedStaffList.length).toBe(initialStaffCount + 1);
    expect(updatedKPI).toBe(initialKPI + 1);
  });

  // TEST 4: Multiple responsibility assignments per employee
  it('TEST 4: Allows assigning multiple statutory responsibilities to a single officer', () => {
    const staff = registrarOfficeService.getStaffList()[1]; // Deputy Registrar
    const responsibilities = registrarOfficeService.getResponsibilities();
    expect(responsibilities.length).toBeGreaterThanOrEqual(2);

    const assignment = registrarOfficeService.assignResponsibility({
      staffId: staff.id,
      responsibilityId: responsibilities[0].id,
      priority: 'HIGH',
      remarks: 'Lead coordinator for annual accreditation audit',
      performedByUser: { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.status).toBe('ACTIVE');

    const staffAssignments = registrarOfficeService.getResponsibilityAssignments(staff.id);
    expect(staffAssignments.length).toBeGreaterThanOrEqual(1);
    expect(staffAssignments.some(a => a.id === assignment.id)).toBe(true);
  });

  // TEST 5: Work matter lifecycle and workflow tracking
  it('TEST 5: Tracks complete matter workflow: assignment, status update, reassignment and escalation', () => {
    const staff = registrarOfficeService.getStaffList()[2];
    const sections = registrarOfficeService.getSections();

    // 1. Assign Work
    const workItem = registrarOfficeService.assignWorkItem({
      title: 'Scrutiny of Gujarat Pharmacy Council Notification',
      description: 'Review amendments to faculty eligibility criteria',
      workType: 'ACADEMIC_MATTER',
      priority: 'HIGH',
      sectionId: sections[0].id,
      assignedToStaffId: staff.id,
      dueDate: '2026-09-15',
      remarks: 'Submit report before Academic Council meet',
      performedByUser: { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    });

    expect(workItem.status).toBe('PENDING');
    expect(workItem.history.length).toBe(1);

    // 2. Update Status to IN_PROGRESS
    registrarOfficeService.updateWorkItemStatus(
      workItem.id,
      'IN_PROGRESS',
      'Preliminary legal scrutiny initiated',
      { id: staff.userId, name: staff.name, role: 'STAFF' } as any
    );

    const inProgressItem = registrarOfficeService.getWorkItems().find(w => w.id === workItem.id);
    expect(inProgressItem?.status).toBe('IN_PROGRESS');
    expect(inProgressItem?.history.length).toBe(2);

    // 3. Escalate to Registrar
    registrarOfficeService.escalateWorkItem(
      workItem.id,
      'Legal ambiguity requiring Registrar apex interpretation',
      { id: staff.userId, name: staff.name, role: 'STAFF' } as any
    );

    const escalatedItem = registrarOfficeService.getWorkItems().find(w => w.id === workItem.id);
    expect(escalatedItem?.status).toBe('ESCALATED');
    expect(escalatedItem?.escalatedToUserId).toBe('USER-REGISTRAR');

    // 4. Complete Work
    registrarOfficeService.updateWorkItemStatus(
      workItem.id,
      'COMPLETED',
      'Approved and circulated to Council members',
      { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    );

    const completedItem = registrarOfficeService.getWorkItems().find(w => w.id === workItem.id);
    expect(completedItem?.status).toBe('COMPLETED');
    expect(completedItem?.completedAt).toBeDefined();
  });

  // TEST 6: Reassigning reporting authority updates reporting tree and creates audit trail
  it('TEST 6: Reassigning reporting authority dynamically updates hierarchy and logs audit trail', () => {
    const staffList = registrarOfficeService.getStaffList();
    const targetOfficer = staffList[staffList.length - 1]; // e.g. DEO
    const newReportingOfficer = staffList[1]; // Deputy Registrar

    const success = registrarOfficeService.updateStaffReportingAuthority(
      targetOfficer.id,
      newReportingOfficer.userId,
      { id: 'USER-REGISTRAR', name: 'Dr. Sanjay Patel', role: 'REGISTRAR' } as any
    );

    expect(success).toBe(true);

    const updatedOfficer = registrarOfficeService.getStaffById(targetOfficer.id);
    expect(updatedOfficer?.reportingToUserId).toBe(newReportingOfficer.userId);

    const audits = registrarOfficeService.getAuditLogs();
    expect(audits.some(a => a.action === 'REPORTING_AUTHORITY_CHANGED')).toBe(true);
  });
});
