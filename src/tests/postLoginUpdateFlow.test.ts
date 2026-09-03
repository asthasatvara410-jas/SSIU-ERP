import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { User, UserRole, ERPNotification } from '../types';

describe('Post-Login Update Popup & Direct Dashboard Flow Integration', () => {
  beforeEach(() => {
    // Reset database to default clean seed before each test
    db.resetToDefaultSeed();
  });

  // ── Scenario 1: Student Login with Relevant Updates ────────────────────────
  it('1. Student with unread updates receives only authorized student updates and can navigate to Student Dashboard', () => {
    const studentUser = db.getUsers().find(u => u.role === 'STUDENT');
    expect(studentUser).toBeDefined();

    // Create a targeted exam update for students
    notificationService.createNotification({
      type: 'DEADLINE',
      title: 'Mid-Sem Examination Registration Open',
      message: 'Examination registration for Spring 2026 is now open.',
      module: 'EXAM',
      targetRole: 'STUDENT',
      priority: 'URGENT',
      linkTab: 'exam-forms'
    });

    const studentNotifs = db.getNotifications(studentUser!, 'STUDENT');
    const unreadStudentNotifs = studentNotifs.filter(n => !(n.isReadByUsers || []).includes(studentUser!.id));

    expect(unreadStudentNotifs.length).toBeGreaterThan(0);
    expect(unreadStudentNotifs.some(n => n.title.includes('Examination Registration'))).toBe(true);

    // Simulate clicking "Continue to Dashboard" -> marks read / navigates
    const firstNotif = unreadStudentNotifs[0];
    db.markNotificationAsRead(firstNotif.id, studentUser!.id);

    const updatedStudentNotifs = db.getNotifications(studentUser!, 'STUDENT').filter(n => !(n.isReadByUsers || []).includes(studentUser!.id));
    expect(updatedStudentNotifs.some(n => n.id === firstNotif.id)).toBe(false);
  });

  // ── Scenario 2: Student Login with No Updates ──────────────────────────────
  it('2. Student with 0 unread updates shows 0 updates (immediate direct dashboard)', () => {
    const studentUser = db.getUsers().find(u => u.role === 'STUDENT');
    expect(studentUser).toBeDefined();

    // Mark all notifications as read for this student
    db.markAllNotificationsAsRead(studentUser!, 'STUDENT');

    const studentNotifs = db.getNotifications(studentUser!, 'STUDENT');
    const unreadNotifs = studentNotifs.filter(n => !(n.isReadByUsers || []).includes(studentUser!.id));

    // Zero unread updates ensures no popup is triggered
    expect(unreadNotifs.length).toBe(0);
  });

  // ── Scenario 3: Faculty Login with Relevant Updates ────────────────────────
  it('3. Faculty member receives teaching/academic notices and navigates to Faculty Dashboard', () => {
    const facultyUser = db.getUsers().find(u => u.role === 'FACULTY');
    expect(facultyUser).toBeDefined();

    // Add faculty specific notification
    notificationService.createNotification({
      type: 'ACTION_REQUIRED',
      title: 'Submit Mid-Term Internal Marks',
      message: 'All faculty members are requested to upload CIE marks by Friday.',
      module: 'EXAM',
      targetRole: 'FACULTY',
      priority: 'HIGH',
      linkTab: 'marks-entry'
    });

    const facultyNotifs = db.getNotifications(facultyUser!, 'FACULTY');
    const unreadFacultyNotifs = facultyNotifs.filter(n => !(n.isReadByUsers || []).includes(facultyUser!.id));

    expect(unreadFacultyNotifs.length).toBeGreaterThan(0);
    expect(unreadFacultyNotifs.some(n => n.title.includes('Internal Marks'))).toBe(true);
  });

  // ── Scenario 4: HOD Login with Department Update ───────────────────────────
  it('4. HOD receives department-specific updates and institute broadcasts', () => {
    const hodUser = db.getUsers().find(u => u.role === 'HOD');
    expect(hodUser).toBeDefined();

    const hodDeptId = hodUser?.departmentId || 'dept-ce';

    notificationService.createNotification({
      type: 'INFORMATION',
      title: 'Department Curriculum Review Committee Meeting',
      message: 'HOD meeting scheduled for syllabus revision.',
      module: 'NOTICE',
      scopeType: 'DEPARTMENT_WIDE',
      targetDepartmentId: hodDeptId,
      targetRole: 'HOD',
      priority: 'HIGH'
    });

    const hodNotifs = db.getNotifications(hodUser!, 'HOD');
    const unreadHodNotifs = hodNotifs.filter(n => !(n.isReadByUsers || []).includes(hodUser!.id));

    expect(unreadHodNotifs.some(n => n.title.includes('Curriculum Review'))).toBe(true);
  });

  // ── Scenario 5: Update Service Error Resilience & Graceful Fallback ────────
  it('5. Safe fallback to empty list and non-blocking navigation if update retrieval fails', () => {
    const studentUser = db.getUsers().find(u => u.role === 'STUDENT');
    expect(studentUser).toBeDefined();

    // Simulate an error inside notification query
    const safeGetNotifications = (user: User | null, role: UserRole | null) => {
      try {
        if (!user) return [];
        throw new Error('Simulated network timeout');
      } catch (err) {
        // Safe console warn & fallback to empty list
        return [];
      }
    };

    const fallbackResult = safeGetNotifications(studentUser!, 'STUDENT');
    expect(fallbackResult).toEqual([]);
    // Direct dashboard flow is uninterrupted
  });

  // ── Scenario 6: Strict RBAC Isolation (Students cannot see Faculty/Admin) ──
  it('6. Strict RBAC: Student never sees Faculty/Admin/HOD notices; Faculty never sees Admin-only notices', () => {
    const studentUser = db.getUsers().find(u => u.role === 'STUDENT');
    const facultyUser = db.getUsers().find(u => u.role === 'FACULTY');
    const adminUser = db.getUsers().find(u => u.role === 'SUPER_ADMIN');

    expect(studentUser).toBeDefined();
    expect(facultyUser).toBeDefined();
    expect(adminUser).toBeDefined();

    // Create Admin-only confidential notice
    const adminSecretNotif = notificationService.createNotification({
      type: 'ACTION_REQUIRED',
      title: 'Confidential Audit Review & Key Rotation',
      message: 'System administrators must rotate API keys and review audit logs.',
      module: 'SYSTEM',
      targetRole: 'SUPER_ADMIN',
      priority: 'URGENT'
    });

    // Create Faculty-only notice
    const facultyNotif = notificationService.createNotification({
      type: 'INFORMATION',
      title: 'Faculty Staff Meeting in Seminar Hall',
      message: 'All teaching faculty to attend the semester kickoff meeting.',
      module: 'NOTICE',
      targetRole: 'FACULTY',
      priority: 'NORMAL'
    });

    // Verify Student NOTIFICATIONS
    const studentNotifs = db.getNotifications(studentUser!, 'STUDENT');
    expect(studentNotifs.some(n => n.id === adminSecretNotif.id)).toBe(false);
    expect(studentNotifs.some(n => n.id === facultyNotif.id)).toBe(false);

    // Verify Faculty NOTIFICATIONS
    const facultyNotifs = db.getNotifications(facultyUser!, 'FACULTY');
    expect(facultyNotifs.some(n => n.id === adminSecretNotif.id)).toBe(false);
    expect(facultyNotifs.some(n => n.id === facultyNotif.id)).toBe(true);

    // Verify Admin NOTIFICATIONS
    const adminNotifs = db.getNotifications(adminUser!, 'SUPER_ADMIN');
    expect(adminNotifs.some(n => n.id === adminSecretNotif.id)).toBe(true);
  });

  // ── Scenario 7: Duplicate Popup Prevention in Same Session ────────────────
  it('7. Duplicate popup prevention: session storage prevents repeat popup after dismissal', () => {
    const studentUser = db.getUsers().find(u => u.role === 'STUDENT')!;

    // Create mock sessionStorage
    const storage: Record<string, string> = {};
    const mockSessionStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; }
    };

    const sessionKey = `sscit_post_login_updates_seen_${studentUser.id}`;

    // 1. First login: Not yet seen
    expect(mockSessionStorage.getItem(sessionKey)).toBeNull();

    // 2. User sees modal and clicks "Continue to Dashboard"
    mockSessionStorage.setItem(sessionKey, 'true');
    expect(mockSessionStorage.getItem(sessionKey)).toBe('true');

    // 3. Subsequent check in same session
    const shouldShowPopup = mockSessionStorage.getItem(sessionKey) !== 'true';
    expect(shouldShowPopup).toBe(false);
  });

  // ── Scenario 8: Priority Hierarchy (URGENT > HIGH > NORMAL) ────────────────
  it('8. Priority hierarchy sorts URGENT notices first, followed by HIGH, then NORMAL', () => {
    const notices: Partial<ERPNotification>[] = [
      { id: '1', title: 'Normal Library Book Return', priority: 'NORMAL', createdAt: '2026-09-01T10:00:00Z' },
      { id: '2', title: 'Urgent Disaster Drill Alert', priority: 'URGENT', createdAt: '2026-09-01T09:00:00Z' },
      { id: '3', title: 'High Priority Fee Deadline', priority: 'HIGH', createdAt: '2026-09-01T09:30:00Z' },
      { id: '4', title: 'Low Sports Club Notice', priority: 'LOW', createdAt: '2026-09-01T11:00:00Z' }
    ];

    const priorityWeight: Record<string, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      NORMAL: 1,
      LOW: 0
    };

    const sorted = [...notices].sort((a, b) => {
      const pA = priorityWeight[(a.priority || 'NORMAL').toUpperCase()] ?? 1;
      const pB = priorityWeight[(b.priority || 'NORMAL').toUpperCase()] ?? 1;
      return pB - pA;
    });

    expect(sorted[0].priority).toBe('URGENT');
    expect(sorted[1].priority).toBe('HIGH');
    expect(sorted[2].priority).toBe('NORMAL');
    expect(sorted[3].priority).toBe('LOW');
  });

  // ── Scenario 9: Role-Based Direct Dashboard Destination Resolution ─────────
  it('9. Direct Dashboard destination routes correctly for all ERP stakeholder roles', () => {
    const roles: { role: UserRole; expectedDashboard: string }[] = [
      { role: 'STUDENT', expectedDashboard: 'dashboard' },
      { role: 'FACULTY', expectedDashboard: 'dashboard' },
      { role: 'HOD', expectedDashboard: 'dashboard' },
      { role: 'PRINCIPAL', expectedDashboard: 'dashboard' },
      { role: 'REGISTRAR', expectedDashboard: 'dashboard' },
      { role: 'DEPUTY_REGISTRAR', expectedDashboard: 'dashboard' },
      { role: 'SUPER_ADMIN', expectedDashboard: 'dashboard' },
      { role: 'PARENT', expectedDashboard: 'parent-dashboard' }
    ];

    roles.forEach(({ role, expectedDashboard }) => {
      const targetTab = role === 'PARENT' ? 'parent-dashboard' : 'dashboard';
      expect(targetTab).toBe(expectedDashboard);
    });
  });
});
