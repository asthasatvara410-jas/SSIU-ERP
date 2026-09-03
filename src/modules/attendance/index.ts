/**
 * SSIU ERP — Attendance Intelligence Hub Plugin Entry Point
 * File: src/modules/attendance/index.ts
 */

import { UserCheck } from 'lucide-react';
import { ERPPluginManifest, registerPlugin } from '../moduleRegistry';
import { AttendanceGovernanceHubPage } from './pages/AttendanceGovernanceHubPage';

export const attendanceModuleManifest: ERPPluginManifest = {
  id: 'attendance-hub',
  name: 'Attendance Intelligence Hub',
  description: 'Multi-Department Attendance Averages, Shortage Warnings (<75%) & Exam Debarment Audits',
  icon: UserCheck,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'FACULTY'],
  category: 'Academic & LMS',
  component: AttendanceGovernanceHubPage,
};

// Auto-register plugin into central registry
registerPlugin(attendanceModuleManifest);

export * from './types';
export * from './services/attendanceGovernanceAggregatorService';
export { AttendanceGovernanceHubPage };
