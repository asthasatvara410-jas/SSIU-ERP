import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { AcademicsGovernancePage } from './pages/AcademicsGovernancePage';

export const academicsPluginManifest: ERPPluginManifest = {
  id: 'timetable-generator',
  name: 'Academics & Timetable Engine',
  description: 'Automated constraint-based timetable scheduling, faculty workload allocation, and classroom utilization analytics.',
  version: '1.0.0',
  category: 'Academic & LMS',
  component: AcademicsGovernancePage,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'FACULTY']
};

registerPlugin(academicsPluginManifest);

export * from './types';
export * from './services/academicsTimetableService';
export * from './pages/AcademicsGovernancePage';
