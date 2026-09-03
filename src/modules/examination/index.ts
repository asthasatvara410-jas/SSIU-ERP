import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { ExaminationGovernancePage } from './pages/ExaminationGovernancePage';

export const examinationPluginManifest: ERPPluginManifest = {
  id: 'examination-hub',
  name: 'Examination & Results Engine',
  description: 'Multi-factor exam eligibility enforcement, deterministic UGC grading, SGPA/CGPA calculations, and marksheet generation.',
  version: '1.0.0',
  category: 'Academic & LMS',
  component: ExaminationGovernancePage,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'EXAM_CELL', 'PRINCIPAL', 'HOD', 'FACULTY']
};

registerPlugin(examinationPluginManifest);

export * from './types';
export * from './services/examinationResultsService';
export * from './pages/ExaminationGovernancePage';
