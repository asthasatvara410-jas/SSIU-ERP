import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bell, LogOut, User, RefreshCw, 
  CheckCircle2, ChevronDown, Menu
} from 'lucide-react';
import { UserRole } from '../../types';
import { db } from '../../services/db';
import { notificationService } from '../../services/notificationService';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string, params?: any) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ activeTab, setActiveTab, mobileOpen = false, setMobileOpen }) => {
  const { user, role, logout, resetSystemDatabase } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const rolesList: { role: UserRole; label: string; bg: string; text: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', bg: '#0F2C59', text: '#FFFFFF' },
    { role: 'VICE_PRESIDENT', label: 'Vice President', bg: '#7C3AED', text: '#FFFFFF' },
    { role: 'UNIVERSITY_ADMIN', label: 'University Admin', bg: '#0F2C59', text: '#FFFFFF' },
    { role: 'REGISTRAR', label: 'Registrar', bg: '#F37023', text: '#FFFFFF' },
    { role: 'IQAC', label: 'IQAC Director', bg: '#7CB342', text: '#FFFFFF' },
    { role: 'EXAM_CELL', label: 'Exam Controller', bg: '#183B70', text: '#FFFFFF' },
    { role: 'STUDENT_SECTION', label: 'Student Section', bg: '#0097D7', text: '#FFFFFF' },
    { role: 'HOSTEL_ADMIN', label: 'Hostel Warden', bg: '#D97706', text: '#FFFFFF' },
    { role: 'LIBRARY_ADMIN', label: 'Librarian', bg: '#0284C7', text: '#FFFFFF' },
    { role: 'TRANSPORT_ADMIN', label: 'Transport Admin', bg: '#6B21A8', text: '#FFFFFF' },
    { role: 'MAINTENANCE_ADMIN', label: 'Maintenance Officer', bg: '#475569', text: '#FFFFFF' },
    { role: 'PRINCIPAL', label: 'Principal', bg: '#183B70', text: '#FFFFFF' },
    { role: 'HOD', label: 'HOD', bg: '#0097D7', text: '#FFFFFF' },
    { role: 'FACULTY', label: 'Faculty', bg: '#10B981', text: '#FFFFFF' },
    { role: 'STUDENT', label: 'Student', bg: '#8B5CF6', text: '#FFFFFF' }
  ];

  const currentRoleInfo = rolesList.find(r => r.role === role) || rolesList[0];
  const auditLogs = db.getAuditLogs().slice(0, 5);

  const getBreadcrumbTitle = (tab: string) => {
    const map: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      settings: 'Settings • User Account Management & Access Governance',
      'inventory-assets': 'Inventory & Asset Management',
      'faculty-assets': 'Faculty My Assets & Custody',
      feedback: 'Student Feedback & Suggestions Management',
      'feedback-give': 'Give Student Feedback',
      'feedback-my': 'My Submitted Feedback',
      'feedback-suggestions': 'Student Suggestions Portal',
      'student-search': 'Student Directory & Profile Search',
      'my-students': 'My Assigned Mentee Students',
      'student-academics': 'Student Academic Details',
      'student-requests': 'Student Service Requests',
      'security-audit': 'Central Security Audit Center',
      'note-sheets': 'University NoteSheet Management',
      institutes: 'Institutes Master',
      departments: 'Departments Master',
      programs: 'Academic Programs Master',
      'academic-years': 'Academic Years Master',
      batches: 'Batches Master',
      semesters: 'Semesters Master',
      divisions: 'Divisions Master',
      subjects: 'Subjects Master',
      faculty: 'Faculty Directory',
      students: 'Student Directory',
      attendance: 'Attendance Management',
      timetable: 'Academic Timetable',
      'session-plan': 'Session Plan & Course Outline',
      materials: 'Study Materials & Unit Notes',
      assignments: 'Assignments & Evaluations',
      quiz: 'Online Quiz & Assessments',
      calendar: 'University Academic Calendar',
      'exam-dashboard': 'Examination & Results Directorate',
      fees: 'Fees & Financial Accounts',
      hr: 'Human Resource Management System (HRMS)',
      crm: 'Admissions & CRM Inquiries',
      reports: 'Central Reports & Analytics Hub',
      tickets: 'Service Desk & Support Tickets',
      mentor: 'Mentorship & Student Counseling',
      notices: 'Official University Notices',
      events: 'Campus Events & Activities',
      library: 'Central Library Management',
      notifications: 'System Notifications & Alerts',
      profile: 'User Profile & Security Governance',
      'id-card': 'Digital Student & Staff Identity Card'
    };
    return map[tab] || 'University Management';
  };

  useEffect(() => {
    const title = getBreadcrumbTitle(activeTab);
    document.title = `SSIU ERP | ${title}`;
  }, [activeTab]);

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-topbar)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="btn btn-secondary btn-icon topbar-mobile-btn"
          onClick={() => setMobileOpen?.(!mobileOpen)}
          title="Toggle Mobile Navigation"
          style={{ padding: '0.4rem', border: 'none', background: 'rgba(15,44,89,0.08)', color: 'var(--brand-navy)' }}
        >
          <Menu size={20} />
        </button>

        <div className="topbar-header-text">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SSIU ERP • University Management System
          </div>
          <h1 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
            {getBreadcrumbTitle(activeTab)}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Academic Year Session Badge */}
        <div
          className="btn-hide-mobile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--brand-navy-subtle, #F0F4F8)',
            border: '1px solid var(--border-color, #E2E8F0)',
            color: 'var(--brand-navy, #0B192C)',
            fontSize: '0.71875rem',
            fontWeight: 700,
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.2px'
          }}
          title="Current University Academic Session"
        >
          <span>AY: <strong>2026–27</strong></span>
        </div>

        {/* DEMO MODE Indicator Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'rgba(245, 166, 35, 0.12)',
            border: '1px solid rgba(245, 166, 35, 0.4)',
            color: '#D97706',
            fontSize: '0.71875rem',
            fontWeight: 800,
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }}
          title="DEMO MODE ACTIVE — Isolated Dummy Sandbox Data"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F5A623', boxShadow: '0 0 6px #F5A623' }}></span>
          <span>⚡ DEMO MODE</span>
        </div>

        {/* Static Read-Only Active Role Indicator */}
        <div
          className="topbar-role-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: currentRoleInfo.bg,
            color: currentRoleInfo.text,
            fontSize: '0.78125rem',
            fontWeight: 600,
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}
          title="Role is fixed by your login credentials. Logout to switch accounts."
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5EEAD4' }}></span>
          <span>Role: <strong>{currentRoleInfo.label}</strong></span>
        </div>

        <button
          className="btn btn-secondary btn-sm btn-hide-mobile"
          style={{ borderRadius: 'var(--radius-full)' }}
          onClick={() => {
            if (window.confirm('Reset database back to original Swarrnim University seed data?')) {
              resetSystemDatabase();
              alert('Database reset successfully!');
            }
          }}
          title="Reset database to default seed state"
        >
          <RefreshCw size={14} /> Reset Seed Data
        </button>

        {/* Centralized ERP Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); }}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', position: 'relative' }}
            title="System & Academic Notifications"
          >
            <Bell size={18} />
            {db.getUnreadNotificationCount(user, role) > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: 'var(--brand-orange)',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(243, 112, 35, 0.4)'
                }}
              >
                {db.getUnreadNotificationCount(user, role)}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '340px',
                padding: '0.85rem',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', padding: '0 0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>
                  Notifications ({db.getUnreadNotificationCount(user, role)} Unread)
                </span>
                {db.getUnreadNotificationCount(user, role) > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', color: 'var(--brand-orange)' }}
                    onClick={() => {
                      db.markAllNotificationsAsRead(user, role);
                      setShowNotifications(false);
                    }}
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '310px', overflowY: 'auto' }}>
                {db.getNotifications(user, role).length === 0 ? (
                  <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    No notifications for your account.
                  </div>
                ) : (
                  db.getNotifications(user, role).slice(0, 5).map(notif => {
                    const isRead = (notif.isReadByUsers || []).includes(user?.id || 'guest');
                    return (
                      <div
                        key={notif.id}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isRead ? 'var(--bg-surface-hover)' : '#FFF9E6',
                          borderLeft: isRead ? '3px solid var(--brand-navy)' : '3px solid var(--brand-orange)',
                          fontSize: '0.78125rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (user?.id) db.markNotificationAsRead(notif.id, user.id);
                          const target = notificationService.resolveNotificationTarget(notif, user, role);
                          if (target.tab) {
                            setActiveTab(target.tab, target.params);
                            setShowNotifications(false);
                          } else if (notif.linkTab) {
                            setActiveTab(notif.linkTab);
                            setShowNotifications(false);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{notif.title}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{notif.timestamp}</span>
                        </div>
                        <div style={{ color: 'var(--text-main)', fontSize: '0.75rem', lineHeight: 1.35 }}>
                          {notif.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', fontSize: '0.8125rem', justifyContent: 'center' }}
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifications(false);
                  }}
                >
                  View All Notifications Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.name}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-orange)' }}
            />
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {showUserDropdown && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '220px',
                padding: '0.5rem',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>

              <button
                onClick={() => { setActiveTab('profile'); setShowUserDropdown(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)'
                }}
              >
                <User size={16} /> My Profile
              </button>

              <button
                onClick={() => { logout(); setShowUserDropdown(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-danger)',
                  marginTop: '0.25rem',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
