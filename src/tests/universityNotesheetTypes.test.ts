import { describe, it, expect } from 'vitest';
import { NOTESHEET_TYPES_LIST, notesheetImportService } from '../services/notesheetImportService';
import { db } from '../services/db';

const EXPECTED_TYPES = [
  'Academic',
  'Examination',
  'Student Affairs',
  'Faculty & Staff',
  'Department Administration',
  'Attendance',
  'Admission',
  'Scholarship',
  'Student Support',
  'Research & Innovation',
  'Training & Placement',
  'Event / Activity',
  'Discipline & Student Conduct',
  'Academic Infrastructure',
  'IT / Digital Services',
  'Library',
  'Hostel',
  'Transport',
  'Sports',
  'Purchase',
  'Administration',
  'Legal / Compliance',
  'University Committee',
  'General / Other'
];

describe('University Notesheet Type Master', () => {
  it('verifies all 24 university-specific notesheet types', () => {
    expect(NOTESHEET_TYPES_LIST.length).toBe(EXPECTED_TYPES.length);
    EXPECTED_TYPES.forEach(type => {
      expect(NOTESHEET_TYPES_LIST).toContain(type as any);
    });
  });

  it('generates excel import template successfully', () => {
    expect(() => notesheetImportService.downloadImportTemplate()).not.toThrow();
  });

  it('creates notesheet with official university type', () => {
    const testNote = db.createNoteSheet({
      subject: 'Establishment of University Artificial Intelligence Research Cluster',
      proposal: 'Proposal to establish an interdisciplinary AI Research Cluster under SSIU SSCIT.',
      purposeJustification: 'To support doctoral research, student hackathons, and sponsored AI projects.',
      notesheetType: 'Research & Innovation',
      category: 'Research & Innovation',
      instituteId: 'inst-1',
      department: 'Computer Engineering',
      creatorId: 'fac-1',
      creatorName: 'Dr. Rajesh Sharma',
      contactNumber: '079-68161600',
      budgetRequired: false,
      estimatedCost: 0,
      priority: 'URGENT',
      status: 'SUBMITTED'
    }, { id: 'fac-1', name: 'Dr. Rajesh Sharma', role: 'FACULTY' as any });

    expect(testNote.notesheetType).toBe('Research & Innovation');
  });

  it('supports backward compatibility for legacy notesheet records', () => {
    const legacyNote = db.createNoteSheet({
      subject: 'Legacy Maintenance Request',
      proposal: 'Proposal recorded under legacy schema.',
      purposeJustification: 'Testing backward compatibility.',
      notesheetType: 'Financial Sanction',
      category: 'Financial Sanction',
      instituteId: 'inst-1',
      department: 'Computer Engineering',
      creatorId: 'fac-1',
      creatorName: 'Dr. Rajesh Sharma',
      contactNumber: '079-68161600',
      budgetRequired: true,
      estimatedCost: 50000,
      priority: 'NORMAL',
      status: 'APPROVED'
    }, { id: 'fac-1', name: 'Dr. Rajesh Sharma', role: 'FACULTY' as any });

    const retrievedLegacy = db.getNoteSheetById(legacyNote.id);
    expect(retrievedLegacy?.notesheetType).toBe('Financial Sanction');
  });
});
