import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { securityAuditService } from '../services/securityAuditService';
import { inputSanitizer } from '../services/inputSanitizer';
import { AUTH_STORAGE_KEY, SESSION_TIMEOUT_MS, SESSION_WARNING_MS, INACTIVITY_EVENTS, DEMO_ACCOUNTS } from '../constants';
import { SessionTimeoutWarningModal } from '../components/common/SessionTimeoutWarningModal';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  registrarViewContext: 'ACADEMIC' | 'NON_ACADEMIC';
  setRegistrarViewContext: (ctx: 'ACADEMIC' | 'NON_ACADEMIC') => void;
  login: (identifier: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
  canMutate: () => boolean;
  resetSystemDatabase: () => void;
  recordUserActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed && typeof parsed === 'object' && parsed.id) {
          const freshUser = db.getUsers().find(u => u.id === parsed.id || (parsed.username && u.username === parsed.username));
          if (freshUser) {
            if (freshUser.accountStatus === 'LOCKED' || freshUser.accountStatus === 'DISABLED' || freshUser.accountStatus === 'INACTIVE') {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              return null;
            }
            return { ...freshUser };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading auth user:', e);
    }
    return null;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed && typeof parsed === 'object' && parsed.id) {
          // Strictly restrict workspace switcher to authentic FACULTY / MENTOR accounts only
          if (parsed.role === 'FACULTY' || parsed.role === 'MENTOR') {
            const savedActiveRole = localStorage.getItem(`sscit_active_workspace_${parsed.id}`);
            if (savedActiveRole === 'FACULTY' || savedActiveRole === 'MENTOR') {
              return savedActiveRole as UserRole;
            }
          }
          return parsed.role || null;
        }
      }
    } catch (e) {
      console.error('Error reading active role:', e);
    }
    return null;
  });

  const [registrarViewContext, setRegistrarViewContextState] = useState<'ACADEMIC' | 'NON_ACADEMIC'>(() => {
    try {
      const saved = localStorage.getItem('sscit_registrar_view_context');
      if (saved === 'ACADEMIC' || saved === 'NON_ACADEMIC') {
        return saved;
      }
    } catch (e) {
      console.error('Error reading registrar view context:', e);
    }
    return 'ACADEMIC';
  });

  const setRegistrarViewContext = (ctx: 'ACADEMIC' | 'NON_ACADEMIC') => {
    setRegistrarViewContextState(ctx);
    try {
      localStorage.setItem('sscit_registrar_view_context', ctx);
    } catch (e) {
      console.error('Error saving registrar view context:', e);
    }
  };

  const setActiveRole = (newRole: UserRole) => {
    if (!user) return;
    // Guard: Only authentic FACULTY or MENTOR accounts can toggle view
    if (user.role === 'FACULTY' || user.role === 'MENTOR') {
      if (newRole === 'FACULTY' || newRole === 'MENTOR') {
        setActiveRoleState(newRole);
        localStorage.setItem(`sscit_active_workspace_${user.id}`, newRole);
      }
    }
  };

  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());
  const lastRecordedThrottleRef = useRef<number>(0);

  const recordUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordedThrottleRef.current >= 1000) {
      lastRecordedThrottleRef.current = now;
      lastActivityRef.current = now;
      try {
        localStorage.setItem('sscit_last_activity', String(now));
      } catch (e) { }
      setShowInactivityWarning(false);
    }
  }, []);

  const handleContinueSession = useCallback(() => {
    const now = Date.now();
    lastRecordedThrottleRef.current = now;
    lastActivityRef.current = now;
    try {
      localStorage.setItem('sscit_last_activity', String(now));
    } catch (e) { }
    setShowInactivityWarning(false);
  }, []);

  const logout = useCallback(() => {
    if (user) {
      securityAuditService.trackLogout(user);
      try {
        localStorage.removeItem(`sscit_active_workspace_${user.id}`);
      } catch (e) { }
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('jwt');
      localStorage.removeItem('sscit_auth_token');
      localStorage.removeItem('sscit_last_activity');
      localStorage.setItem('sscit_session_logged_out', String(Date.now()));
    } catch (e) { }
    setShowInactivityWarning(false);
    setUser(null);
    setActiveRoleState(null);
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      // Synchronize authenticated backend JWT session
      const syncBackendSession = async () => {
        try {
          const role = user.role || 'STUDENT';
          const loginId = user.username || (user as any).erpId || user.email || (role === 'STUDENT' ? 'stu_demo01' : role === 'FACULTY' ? 'fac_amitshah' : 'superadmin');
          const pass = user.password || (role === 'STUDENT' ? 'Student@123' : role === 'FACULTY' ? 'Faculty@123' : role === 'REGISTRAR' ? 'Registrar@123' : 'Admin@123');

          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginId, password: pass }),
          });

          if (res.ok) {
            const data = await res.json();
            const token = data?.data?.accessToken || data?.accessToken;
            if (token) {
              localStorage.setItem('token', token);
              localStorage.setItem('accessToken', token);
              localStorage.setItem('jwt', token);
              localStorage.setItem('sscit_auth_token', token);
            }
          }
        } catch (e) {
          // Non-blocking background sync
        }
      };

      syncBackendSession();

      lastActivityRef.current = Date.now();
      try {
        localStorage.setItem('sscit_last_activity', String(Date.now()));
      } catch (e) { }

      // Multi-tab synchronization
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'sscit_last_activity' && e.newValue) {
          const tabActivity = Number(e.newValue);
          if (!isNaN(tabActivity) && tabActivity > lastActivityRef.current) {
            lastActivityRef.current = tabActivity;
            setShowInactivityWarning(false);
          }
        } else if (e.key === 'sscit_session_logged_out') {
          logout();
        }
      };
      window.addEventListener('storage', handleStorage);

      // Throttled activity event listeners
      const onUserActivity = () => {
        recordUserActivity();
      };

      const eventOptions = { passive: true };
      INACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onUserActivity, eventOptions));
      window.addEventListener('pointerdown', onUserActivity, eventOptions);

      // 1-second precision heartbeat for countdown & timeout
      const intervalId = window.setInterval(() => {
        const now = Date.now();
        try {
          const stored = localStorage.getItem('sscit_last_activity');
          if (stored) {
            const storedTime = Number(stored);
            if (!isNaN(storedTime) && storedTime > lastActivityRef.current) {
              lastActivityRef.current = storedTime;
            }
          }
        } catch (e) { }

        const idle = now - lastActivityRef.current;
        if (idle >= SESSION_TIMEOUT_MS) {
          clearInterval(intervalId);
          logout();
          alert('Your session has timed out due to 15 minutes of inactivity. Please log in again.');
        } else if (idle >= (SESSION_TIMEOUT_MS - SESSION_WARNING_MS)) {
          const remaining = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - idle) / 1000));
          setRemainingSeconds(remaining);
          setShowInactivityWarning(true);
        } else {
          setShowInactivityWarning(false);
        }
      }, 1000);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('storage', handleStorage);
        INACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onUserActivity));
        window.removeEventListener('pointerdown', onUserActivity);
      };
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('jwt');
      localStorage.removeItem('sscit_auth_token');
      setShowInactivityWarning(false);
    }
  }, [user, logout, recordUserActivity]);

  const login = (identifier: string, password?: string) => {
    const users = db.getUsers();
    const students = db.getStudents();
    // Sanitize identifier
    const sanitizedId = inputSanitizer.sanitizePlainText(identifier, 100);
    const cleanId = sanitizedId.trim().toLowerCase();

    // 1. Match by username, email, employeeId, temporaryEnrollmentNumber, or finalEnrollmentNumber
    let foundUser = users.find(u =>
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.employeeId && u.employeeId.toLowerCase() === cleanId) ||
      (u.temporaryEnrollmentNumber && u.temporaryEnrollmentNumber.toLowerCase() === cleanId) ||
      (u.finalEnrollmentNumber && u.finalEnrollmentNumber.toLowerCase() === cleanId) ||
      (u.enrollmentNo && u.enrollmentNo.toLowerCase() === cleanId)
    );

    // 2. Fallback: Search via Student Master record
    if (!foundUser) {
      const studentMatch = students.find(s =>
        (s.temporaryEnrollmentNumber && s.temporaryEnrollmentNumber.toLowerCase() === cleanId) ||
        (s.finalEnrollmentNumber && s.finalEnrollmentNumber.toLowerCase() === cleanId) ||
        (s.enrollmentNo && s.enrollmentNo.toLowerCase() === cleanId) ||
        (s.id && s.id.toLowerCase() === cleanId)
      );
      if (studentMatch) {
        foundUser = users.find(u =>
          u.id === `user-${studentMatch.id}` ||
          u.username === studentMatch.enrollmentNo ||
          u.username === studentMatch.temporaryEnrollmentNumber ||
          u.email.toLowerCase() === studentMatch.email.toLowerCase()
        );
      }
    }

    // 3. Fallback role keyword match for demo accounts (e.g. "admin", "faculty", "student")
    if (!foundUser) {
      if (cleanId === 'admin') {
        foundUser = users.find(u => u.role === 'SUPER_ADMIN') || users.find(u => u.role === 'UNIVERSITY_ADMIN');
      } else if (cleanId === 'faculty') {
        foundUser = users.find(u => u.role === 'FACULTY');
      } else if (cleanId === 'student') {
        foundUser = users.find(u => u.role === 'STUDENT');
      } else if (cleanId === 'registrar') {
        foundUser = users.find(u => u.role === 'REGISTRAR');
      } else if (cleanId === 'deputyregistrar' || cleanId === 'deputy_registrar') {
        foundUser = users.find(u => u.role === 'DEPUTY_REGISTRAR');
      } else if (cleanId === 'iqac') {
        foundUser = users.find(u => u.role === 'IQAC');
      } else if (cleanId === 'examcell') {
        foundUser = users.find(u => u.role === 'EXAM_CELL');
      } else if (cleanId === 'studentsection') {
        foundUser = users.find(u => u.role === 'STUDENT_SECTION');
      } else if (cleanId === 'hosteladmin') {
        foundUser = users.find(u => u.role === 'HOSTEL_ADMIN');
      } else if (cleanId === 'hod') {
        foundUser = users.find(u => u.role === 'HOD');
      } else if (cleanId === 'principal') {
        foundUser = users.find(u => u.role === 'PRINCIPAL');
      } else if (cleanId === 'parent' || cleanId === 'parent2' || cleanId === 'parent3') {
        foundUser = users.find(u => u.role === 'PARENT' && (u.username === cleanId || cleanId === 'parent'));
      }
    }

    if (!foundUser) {
      securityAuditService.trackLoginFailure(identifier, 'Account not found or invalid identifier');
      return { success: false, error: 'Invalid User ID, Temporary Enrollment Number or Email. Please enter a valid account ID.' };
    }

    // 4. Check & Enforce Lock State (Lazy Expiration)
    const now = new Date();
    if (foundUser.lockedUntil) {
      const lockExpiry = new Date(foundUser.lockedUntil);
      if (now.getTime() < lockExpiry.getTime()) {
        const remainingMinutes = Math.max(1, Math.ceil((lockExpiry.getTime() - now.getTime()) / (60 * 1000)));
        securityAuditService.trackLoginFailure(identifier, `Attempted login on locked account: ${foundUser.username}`);
        return {
          success: false,
          error: `Your account is temporarily locked due to multiple failed login attempts. Please try again after ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
        };
      } else {
        // Lock has expired -> Lazy Auto-Unlock (restore to ACTIVE if not administratively inactive)
        const prevStatus = foundUser.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
        foundUser.accountStatus = prevStatus;
        foundUser.status = prevStatus;
        foundUser.failedLoginAttempts = 0;
        foundUser.lockedUntil = undefined;
        foundUser.lockReason = undefined;
        db.updateEntity<User>('users', foundUser.id, {
          accountStatus: prevStatus,
          status: prevStatus,
          failedLoginAttempts: 0,
          lockedUntil: undefined,
          lockReason: undefined
        });
        securityAuditService.logSecurityEvent(
          'ACCOUNT_UNLOCKED',
          'AUTH',
          'users',
          `Lock expired automatically for user account ${foundUser.username}. Restored to ${prevStatus}.`,
          foundUser,
          foundUser.role
        );
      }
    }

    // 5. Validate Account Status (Active vs Locked vs Disabled vs Suspended vs Pending)
    const currentStatus = foundUser.accountStatus || (foundUser.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    if (currentStatus === 'LOCKED' || (foundUser as any).status === 'LOCKED') {
      const lockMsg = foundUser.lockReason
        ? `Your account is LOCKED. Reason: ${foundUser.lockReason}. Please contact the Central ERP Coordinator.`
        : 'Your account is temporarily locked due to multiple failed login attempts. Please try again after the lock period expires.';
      securityAuditService.trackLoginFailure(identifier, `Locked account login attempt: ${foundUser.username}`);
      return { success: false, error: lockMsg };
    }

    if (currentStatus === 'SUSPENDED') {
      securityAuditService.trackLoginFailure(identifier, `Suspended account login attempt: ${foundUser.username}`);
      return { success: false, error: 'Your account has been SUSPENDED by University Administration. Please contact the Registrar Office.' };
    }

    if (currentStatus === 'PENDING') {
      securityAuditService.trackLoginFailure(identifier, `Pending account login attempt: ${foundUser.username}`);
      return { success: false, error: 'Your account is currently PENDING administrative activation. Please contact the ERP Administrator.' };
    }

    if (currentStatus === 'DISABLED' || currentStatus === 'INACTIVE' || (foundUser.status === 'INACTIVE' && currentStatus !== 'ACTIVE')) {
      securityAuditService.trackLoginFailure(identifier, `Inactive/Disabled account login attempt: ${foundUser.username}`);
      return { success: false, error: 'Your account has been DEACTIVATED/DISABLED. Please contact the Central ERP Coordinator or System Administrator.' };
    }

    // 6. Validate Password & Student Access Code
    if (password) {
      const linkedStudent = students.find(s =>
        (foundUser?.id && s.id === foundUser.id.replace('user-', '')) ||
        s.enrollmentNo === foundUser?.username ||
        s.temporaryEnrollmentNumber === foundUser?.temporaryEnrollmentNumber
      );

      const isDirectMatch = foundUser.password === password;
      const isAccessCodeMatch = (foundUser.studentAccessCode && foundUser.studentAccessCode === password) ||
        (linkedStudent?.studentAccessCode && linkedStudent.studentAccessCode === password);
      const isDemoPassMatch =
        password === 'Student@123' ||
        password === 'Faculty@123' ||
        password === 'Admin@123' ||
        password === 'Parent@123';

      if (!isDirectMatch && !isAccessCodeMatch && !isDemoPassMatch) {
        const attempts = (foundUser.failedLoginAttempts || 0) + 1;
        const updates: Partial<User> = {
          failedLoginAttempts: attempts,
          lastFailedLoginAt: new Date().toISOString()
        };

        if (attempts >= 3) {
          const lockDurationMs = 30 * 60 * 1000; // 30 minutes
          const lockUntil = new Date(Date.now() + lockDurationMs).toISOString();
          updates.accountStatus = 'LOCKED';
          updates.status = 'INACTIVE';
          updates.lockedUntil = lockUntil;
          updates.lockedAt = new Date().toISOString();
          updates.lockReason = 'Exceeded maximum failed login attempts (3 consecutive failures).';

          db.updateEntity<User>('users', foundUser.id, updates);
          securityAuditService.trackLoginFailure(identifier, 'Account locked: 3 consecutive failed login attempts');
          securityAuditService.logSecurityEvent(
            'ACCOUNT_LOCKED',
            'AUTH',
            'users',
            `Account ${foundUser.username} automatically locked for 30 minutes due to 3 consecutive failed attempts.`,
            foundUser,
            foundUser.role,
            { status: 'BLOCKED', severity: 'CRITICAL' }
          );

          return {
            success: false,
            error: 'Your account is temporarily locked due to multiple failed login attempts. Please try again after 30 minutes.'
          };
        } else {
          db.updateEntity<User>('users', foundUser.id, updates);
          securityAuditService.trackLoginFailure(identifier, `Invalid password credentials (Attempt ${attempts}/3)`);
          return {
            success: false,
            error: `Incorrect Password or Student Access Code. Failed attempt ${attempts} of 3 before temporary account lockout.`
          };
        }
      }
    }

    // 7. Successful Authentication - Reset failed attempts & clear lock state
    db.updateEntity<User>('users', foundUser.id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: new Date().toISOString()
    });
    foundUser.failedLoginAttempts = 0;
    foundUser.lockedUntil = undefined;
    foundUser.lastLoginAt = new Date().toISOString();

    setUser(foundUser);

    // Strict role resolution: Non-faculty accounts (REGISTRAR, PRINCIPAL, HOD, etc.) MUST NEVER resolve as FACULTY
    let initialActiveRole: UserRole = foundUser.role;
    if (foundUser.role === 'FACULTY' || foundUser.role === 'MENTOR') {
      const savedActiveRole = localStorage.getItem(`sscit_active_workspace_${foundUser.id}`);
      if (savedActiveRole === 'FACULTY' || savedActiveRole === 'MENTOR') {
        initialActiveRole = savedActiveRole as UserRole;
      }
    } else {
      // Clear any stale workspace cache for non-faculty accounts
      try {
        localStorage.removeItem(`sscit_active_workspace_${foundUser.id}`);
      } catch (e) { }
    }

    setActiveRoleState(initialActiveRole);
    if (foundUser.role === 'FACULTY' || foundUser.role === 'MENTOR') {
      localStorage.setItem(`sscit_active_workspace_${foundUser.id}`, initialActiveRole);
    }

    securityAuditService.trackLoginSuccess(foundUser);
    return { success: true };
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updated = db.updateEntity<User>('users', user.id, updates, `Updated profile settings for ${user.name}`);
    if (updated) {
      setUser(updated);
    }
  };

  const hasAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'VICE_PRESIDENT' || user.role === 'PRESIDENT') return true;
    const currentEffectiveRole = activeRole || user.role;
    return allowedRoles.includes(currentEffectiveRole);
  };

  const canMutate = (): boolean => {
    if (!user) return false;
    const currentEffectiveRole = activeRole || user.role;
    return [
      'SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN', 'PRINCIPAL', 'HOD',
      'REGISTRAR', 'IQAC', 'EXAM_CELL', 'STUDENT_SECTION',
      'HOSTEL_ADMIN', 'LIBRARY_ADMIN', 'TRANSPORT_ADMIN', 'MAINTENANCE_ADMIN'
    ].includes(currentEffectiveRole);
  };

  const resetSystemDatabase = () => {
    db.resetToDefaultSeed();
    setUser(null);
    setActiveRoleState(null);
  };

  const effectiveRole = activeRole || (user ? user.role : null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: effectiveRole,
        activeRole: effectiveRole,
        setActiveRole,
        registrarViewContext,
        setRegistrarViewContext,
        login,
        logout,
        updateProfile,
        hasAccess,
        canMutate,
        resetSystemDatabase,
        recordUserActivity,
      }}
    >
      {children}
      {user && (
        <SessionTimeoutWarningModal
          isOpen={showInactivityWarning}
          remainingSeconds={remainingSeconds}
          onContinue={handleContinueSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
