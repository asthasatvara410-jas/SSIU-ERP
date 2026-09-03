import { registerPlugin, ERPPluginManifest } from '../moduleRegistry';
import { LMSCourseHubPage } from './pages/LMSCourseHubPage';

export const lmsPluginManifest: ERPPluginManifest = {
  id: 'lms-hub',
  name: 'LMS & Course Hub',
  description: 'Syllabus completion tracking, study material repositories, assignment management, and online MCQ examinations.',
  version: '1.0.0',
  category: 'Academic & LMS',
  component: LMSCourseHubPage,
  allowedRoles: ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT']
};

registerPlugin(lmsPluginManifest);

export * from './types';
export * from './services/lmsCourseService';
export * from './pages/LMSCourseHubPage';
