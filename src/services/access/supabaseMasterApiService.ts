/**
 * ==============================================================================
 * SSIU ERP — SUPABASE CENTRAL MASTER API SERVICE (CLIENT-SIDE)
 * Connects frontend modules to Supabase Master APIs with Bearer token injection
 * ==============================================================================
 */

import { supabaseAuthSessionService } from './supabaseAuthSessionService';

const API_BASE = '/api/v1/supabase-master';

export interface UniversityMaster {
  id: string;
  code: string;
  name: string;
  short_name: string;
  status: string;
}

export interface InstituteMaster {
  id: string;
  university_id: string;
  code: string;
  name: string;
  short_name: string;
  status: string;
}

export interface DepartmentMaster {
  id: string;
  institute_id: string;
  code: string;
  name: string;
  short_name: string;
  status: string;
}

export interface AcademicYearMaster {
  id: string;
  code: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  status: string;
}

export interface ProgramMaster {
  id: string;
  department_id: string;
  code: string;
  name: string;
  degree_type: string;
  duration_years: number;
  status: string;
}

export interface SubjectMaster {
  id: string;
  program_id: string;
  semester_id: string;
  code: string;
  name: string;
  subject_type: string;
  credits: number;
  status: string;
}

export interface StudentMaster {
  id: string;
  institute_id: string;
  department_id: string;
  program_id: string;
  batch_id: string;
  enrollment_number: string;
  admission_number: string;
  abc_id?: string;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  category: string;
  institutional_email: string;
  contact_number: string;
  personal_email?: string;
  current_address?: string;
  enrollment_status: string;
}

export interface FacultyMaster {
  id: string;
  institute_id: string;
  department_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  designation: string;
  highest_qualification: string;
  institutional_email: string;
  employment_status: string;
}

class SupabaseMasterApiService {
  private getHeaders(): HeadersInit {
    const session = supabaseAuthSessionService.getSession();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {}),
    };
  }

  // 1. Academic Master
  public async getUniversities(): Promise<UniversityMaster[]> {
    const res = await fetch(`${API_BASE}/academic/universities`, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch universities: ${res.statusText}`);
    return res.json();
  }

  public async getDepartments(instituteId?: string): Promise<DepartmentMaster[]> {
    const url = instituteId ? `${API_BASE}/academic/departments?instituteId=${instituteId}` : `${API_BASE}/academic/departments`;
    const res = await fetch(url, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch departments: ${res.statusText}`);
    return res.json();
  }

  public async getAcademicYears(): Promise<AcademicYearMaster[]> {
    const res = await fetch(`${API_BASE}/academic/years`, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch academic years: ${res.statusText}`);
    return res.json();
  }

  public async getPrograms(departmentId?: string): Promise<ProgramMaster[]> {
    const url = departmentId ? `${API_BASE}/academic/programs?departmentId=${departmentId}` : `${API_BASE}/academic/programs`;
    const res = await fetch(url, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch programs: ${res.statusText}`);
    return res.json();
  }

  public async getSubjects(programId?: string, semesterId?: string): Promise<SubjectMaster[]> {
    const params = new URLSearchParams();
    if (programId) params.append('programId', programId);
    if (semesterId) params.append('semesterId', semesterId);
    const res = await fetch(`${API_BASE}/academic/subjects?${params.toString()}`, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    return res.json();
  }

  // 2. Student Master
  public async getStudents(filters?: { departmentId?: string; programId?: string }): Promise<StudentMaster[]> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.programId) params.append('programId', filters.programId);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch students: ${res.statusText}`);
    return res.json();
  }

  public async getStudentById(studentId: string): Promise<StudentMaster> {
    const res = await fetch(`${API_BASE}/students/${studentId}`, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch student profile: ${res.statusText}`);
    return res.json();
  }

  public async updateStudentContact(studentId: string, data: { contactNumber?: string; personalEmail?: string; currentAddress?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/students/${studentId}/contact`, {
      method: 'PATCH',
      credentials: 'omit',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update student contact: ${res.statusText}`);
    return res.json();
  }

  // 3. Faculty Master
  public async getFacultyList(departmentId?: string): Promise<FacultyMaster[]> {
    const url = departmentId ? `${API_BASE}/faculty?departmentId=${departmentId}` : `${API_BASE}/faculty`;
    const res = await fetch(url, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch faculty list: ${res.statusText}`);
    return res.json();
  }

  // 4. Academic Mappings
  public async getFacultyAllocations(academicYearId?: string): Promise<any[]> {
    const url = academicYearId ? `${API_BASE}/mappings/allocations?academicYearId=${academicYearId}` : `${API_BASE}/mappings/allocations`;
    const res = await fetch(url, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch faculty allocations: ${res.statusText}`);
    return res.json();
  }

  public async getStudentEnrollments(studentId?: string): Promise<any[]> {
    const url = studentId ? `${API_BASE}/mappings/enrollments?studentId=${studentId}` : `${API_BASE}/mappings/enrollments`;
    const res = await fetch(url, { credentials: 'omit', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch student enrollments: ${res.statusText}`);
    return res.json();
  }
}

export const supabaseMasterApiService = new SupabaseMasterApiService();
