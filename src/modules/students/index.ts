/**
 * SSIU ERP — Student Management Hub Plugin Definition
 * File: src/modules/students/index.ts
 */

import { Users } from 'lucide-react';
import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { StudentGovernanceHubPage } from './pages/StudentGovernanceHubPage';

export const studentModuleManifest: ERPPluginManifest = {
  id: 'students-hub',
  name: 'Student Management Hub',
  description: 'Multi-Campus Student Demographics, Progression Eligibility & ABC ID Verification',
  icon: Users,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'STUDENT_SECTION'],
  category: 'Administration & Masters',
  component: StudentGovernanceHubPage,
};

// Self-register with central plugin registry
registerPlugin(studentModuleManifest);

export * from './types';
export * from './services/studentGovernanceService';
export * from './pages/StudentGovernanceHubPage';
