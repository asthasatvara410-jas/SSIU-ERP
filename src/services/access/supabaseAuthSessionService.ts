/**
 * ==============================================================================
 * SSIU ERP — SUPABASE AUTHENTICATION & SESSION SERVICE (CLIENT-SIDE)
 * Resolves user_accounts, RBAC roles, granular permissions, and master identities
 * ==============================================================================
 */

export type ERPRoleCode = 
  | 'SUPER_ADMIN'
  | 'UNIVERSITY_ADMIN'
  | 'HOD'
  | 'FACULTY'
  | 'MENTOR'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF'
  | 'GUEST';

export interface UserAccountSession {
  userAccountId: string;
  authUserId: string;
  email: string;
  username: string;
  accountType: 'STUDENT' | 'FACULTY' | 'STAFF' | 'ADMIN' | 'PARENT' | 'EXTERNAL';
  accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'PENDING_ACTIVATION' | 'DISABLED';
  roles: ERPRoleCode[];
  primaryRole: ERPRoleCode;
  permissions: string[];
  isSuperAdmin: boolean;
  studentId?: string;
  facultyId?: string;
  parentId?: string;
  instituteId?: string;
  departmentId?: string;
  departmentIds?: string[];
  linkedWardStudentIds?: string[];
  token: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'ssiu_erp_supabase_session';

class SupabaseAuthSessionService {
  private currentSession: UserAccountSession | null = null;
  private listeners: Array<(session: UserAccountSession | null) => void> = [];

  constructor() {
    this.restoreSession();
  }

  /**
   * Initializes session from Supabase authentication payload
   */
  public setSession(session: UserAccountSession): void {
    this.currentSession = session;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage fallback
    }
    this.notifyListeners();
  }

  /**
   * Restores session from secure local storage
   */
  public restoreSession(): UserAccountSession | null {
    if (this.currentSession) return this.currentSession;

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserAccountSession;
        if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
          this.logout();
          return null;
        }
        this.currentSession = parsed;
        return this.currentSession;
      }
    } catch {
      this.currentSession = null;
    }
    return null;
  }

  /**
   * Logs out user and clears local session
   */
  public logout(): void {
    this.currentSession = null;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.clear();
    } catch {
      // Ignore cleanup error
    }
    this.notifyListeners();
  }

  public getSession(): UserAccountSession | null {
    if (!this.currentSession) {
      return this.restoreSession();
    }
    if (this.currentSession.expiresAt && Date.now() >= this.currentSession.expiresAt) {
      this.logout();
      return null;
    }
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  public hasRole(role: ERPRoleCode): boolean {
    const session = this.getSession();
    if (!session) return false;
    if (session.isSuperAdmin || session.roles.includes('SUPER_ADMIN')) return true;
    return session.roles.includes(role);
  }

  public hasAnyRole(roles: ERPRoleCode[]): boolean {
    const session = this.getSession();
    if (!session) return false;
    if (session.isSuperAdmin || session.roles.includes('SUPER_ADMIN')) return true;
    return roles.some((r) => session.roles.includes(r));
  }

  public hasPermission(permissionCode: string): boolean {
    const session = this.getSession();
    if (!session) return false;
    if (session.isSuperAdmin || session.roles.includes('SUPER_ADMIN')) return true;
    return session.permissions.includes(permissionCode);
  }

  // Identity Accessors
  public getStudentId(): string | undefined {
    return this.getSession()?.studentId;
  }

  public getFacultyId(): string | undefined {
    return this.getSession()?.facultyId;
  }

  public getParentId(): string | undefined {
    return this.getSession()?.parentId;
  }

  public getDepartmentId(): string | undefined {
    return this.getSession()?.departmentId;
  }

  public getLinkedWardIds(): string[] {
    return this.getSession()?.linkedWardStudentIds || [];
  }

  public isParentOf(studentId: string): boolean {
    const wardIds = this.getLinkedWardIds();
    return wardIds.includes(studentId);
  }

  public subscribe(listener: (session: UserAccountSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentSession);
      } catch (err) {
        console.error('Error in auth session listener', err);
      }
    });
  }
}

export const supabaseAuthSessionService = new SupabaseAuthSessionService();
