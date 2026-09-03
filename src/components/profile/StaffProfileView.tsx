import React, { useState, useMemo } from 'react';
import { 
  User as UserIcon, ShieldCheck, Mail, Phone, Lock, Save, CheckCircle2, 
  Award, FileText, Check, XCircle, AlertCircle, RefreshCw, 
  Building, MapPin, Users, HeartHandshake, Calendar, BookOpen, 
  Clock, FileCheck, Layers, Sparkles, Printer, Download, 
  ExternalLink, Activity, Briefcase, Trophy, Globe, Heart, 
  Bell, Eye, AlertTriangle, KeyRound, Network, CheckSquare, 
  UserCheck, Shield, ChevronRight, Edit3, ArrowUpRight,
  HelpCircle, Compass, Cpu, Server, HardDrive
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { staffProfileService, StaffNormalizedProfile } from '../../services/staffProfileService';
import { EditStaffProfileModal } from './EditStaffProfileModal';
import { OrgHierarchyModal } from './OrgHierarchyModal';
import { db } from '../../services/db';

interface StaffProfileViewProps {
  user: User;
  role: UserRole;
  onUpdateProfile?: (updates: Partial<User>) => void;
}

export const StaffProfileView: React.FC<StaffProfileViewProps> = ({
  user,
  role,
  onUpdateProfile
}) => {
  // Primary Tabs: OVERVIEW, HIERARCHY, RESPONSIBILITIES, PERMISSIONS, SECURITY_AUDIT
  type StaffTab = 'OVERVIEW' | 'HIERARCHY' | 'RESPONSIBILITIES' | 'PERMISSIONS' | 'SECURITY_AUDIT';
  const [activeTab, setActiveTab] = useState<StaffTab>('OVERVIEW');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);

  // Security password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Search in direct reports / permissions
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [permissionFilterCategory, setPermissionFilterCategory] = useState<string>('ALL');

  // Load Normalized Profile Data
  const profile: StaffNormalizedProfile = useMemo(() => {
    return staffProfileService.getStaffProfile(user, role);
  }, [user, role]);

  // Load Recent Audit Logs for User
  const recentAuditLogs = useMemo(() => {
    const logs = db.getAuditLogs();
    return logs
      .filter(l => 
        (l.userName && l.userName.toLowerCase().includes(user.name.toLowerCase())) ||
        (l.details && l.details.toLowerCase().includes(user.name.toLowerCase())) ||
        l.userRole === role ||
        l.module === 'PROFILE_GOVERNANCE' ||
        l.module === 'AUTH' ||
        l.module === 'SECURITY'
      )
      .slice(0, 8);
  }, [user, role]);

  // Handle Edit Profile Save
  const handleSaveProfileUpdates = (updates: any) => {
    setErrorMessage('');
    setSaveSuccessMessage('');

    const updatedUser = staffProfileService.updateStaffPersonalDetails(user, updates);
    if (updatedUser && onUpdateProfile) {
      onUpdateProfile(updates);
    }
    setSaveSuccessMessage('Personal profile and contact details updated successfully.');
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (onUpdateProfile) {
      onUpdateProfile({ password });
    }
    setPassword('');
    setConfirmPassword('');
    setSaveSuccessMessage('Security password updated successfully.');
  };

  // Filtered direct reports
  const filteredDirectReports = useMemo(() => {
    if (!reportSearchQuery.trim()) return profile.directReports;
    const q = reportSearchQuery.toLowerCase();
    return profile.directReports.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.designation.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  }, [profile.directReports, reportSearchQuery]);

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    if (permissionFilterCategory === 'ALL') return profile.modulePermissions;
    return profile.modulePermissions.filter(p => p.category === permissionFilterCategory);
  }, [profile.modulePermissions, permissionFilterCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO PROFILE HEADER BANNER
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(11, 25, 44, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decorative watermark */}
        <Building
          size={260}
          style={{
            position: 'absolute',
            right: '-30px',
            bottom: '-40px',
            color: 'rgba(255, 255, 255, 0.03)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={profile.avatar}
                alt={profile.name}
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--brand-orange)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  backgroundColor: '#0B192C'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#10B981',
                  border: '2px solid #0B192C',
                  borderRadius: '50%'
                }}
                title="Active Account"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
                  {profile.name}
                </h2>
                <Badge variant="orange">{profile.role}</Badge>
                <Badge variant="active">{profile.employmentStatus}</Badge>
              </div>

              <div style={{ fontSize: '0.9375rem', color: 'var(--brand-gold)', fontWeight: 700, marginTop: '0.25rem' }}>
                {profile.designation}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.5rem', fontSize: '0.8125rem', color: '#94A3B8' }}>
                <span>Employee ID: <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{profile.employeeId}</strong></span>
                <span>•</span>
                <span>Username: <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{profile.username}</strong></span>
                <span>•</span>
                <span>Dept: <strong style={{ color: '#FFFFFF' }}>{profile.departmentName}</strong></span>
                <span>•</span>
                <span>School: <strong style={{ color: '#FFFFFF' }}>{profile.instituteName}</strong></span>
                <span>•</span>
                <span>Term: <strong style={{ color: '#A7F3D0' }}>{profile.academicYear}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsHierarchyModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Network size={15} color="var(--brand-orange)" /> View Reporting Structure
            </button>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{
                backgroundColor: 'var(--brand-orange)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. PRIMARY TABS BAR
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-color, #E2E8F0)',
          paddingBottom: '0.25rem',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'OVERVIEW', label: '1. Profile Overview & Scope', icon: UserIcon },
          { id: 'HIERARCHY', label: '2. Reporting & Hierarchy', icon: Network },
          { id: 'RESPONSIBILITIES', label: '3. Role & Responsibilities', icon: Briefcase },
          { id: 'PERMISSIONS', label: '4. Access & Permissions', icon: ShieldCheck },
          { id: 'SECURITY_AUDIT', label: '5. Security & Account Activity', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id as StaffTab)}
              style={{
                fontSize: '0.8125rem',
                fontWeight: isActive ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-color, #334155)'
              }}
            >
              <Icon size={15} color={isActive ? 'var(--brand-orange)' : undefined} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {saveSuccessMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: PROFILE OVERVIEW & SCOPE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Responsibility Scope KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.1rem', background: '#FFFFFF', borderLeft: '4px solid var(--brand-navy)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supervised Students</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', margin: '0.25rem 0' }}>{profile.scopeKPIs.totalSupervisedStudents}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active in Department</div>
            </div>

            <div className="card" style={{ padding: '1.1rem', background: '#FFFFFF', borderLeft: '4px solid var(--brand-orange)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supervised Faculty</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-orange)', margin: '0.25rem 0' }}>{profile.scopeKPIs.totalSupervisedFaculty}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Permanent Professors</div>
            </div>

            <div className="card" style={{ padding: '1.1rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weekly Teaching Hours</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', margin: '0.25rem 0' }}>{profile.scopeKPIs.weeklyTeachingHours}h / wk</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{profile.scopeKPIs.theoryTeachingHours}h Theory + {profile.scopeKPIs.labTeachingHours}h Lab</div>
            </div>

            <div className="card" style={{ padding: '1.1rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department Assets</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', margin: '0.25rem 0' }}>{profile.scopeKPIs.departmentAssetsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Fixed Assets in Register</div>
            </div>

            <div className="card" style={{ padding: '1.1rem', background: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6', margin: '0.25rem 0' }}>{profile.scopeKPIs.pendingApprovalsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>In Review Queue</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {/* Personal Information */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserIcon size={16} color="var(--brand-orange)" /> Personal Information
                </h4>
                <Badge variant="navy">Official Master</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ReadOnlyField label="Full Name" value={profile.name} />
                <ReadOnlyField label="Preferred Name" value={profile.preferredName} />
                <ReadOnlyField label="Gender" value={profile.gender} />
                <ReadOnlyField label="Date of Birth" value={profile.dateOfBirth} />
                <ReadOnlyField label="Blood Group" value={profile.bloodGroup} badge={<Badge variant="orange">{profile.bloodGroup}</Badge>} />
                <ReadOnlyField label="Mobile Number" value={profile.phone} />
                <ReadOnlyField label="Alternate Mobile" value={profile.alternatePhone} />
                <ReadOnlyField label="Official Email" value={profile.officialEmail} />
                <ReadOnlyField label="Personal Email" value={profile.personalEmail} />
                <ReadOnlyField label="Residential Address" value={profile.address} />
                <ReadOnlyField label="City & State" value={`${profile.city}, ${profile.state} - ${profile.pincode}`} />
                <ReadOnlyField label="Country" value={profile.country} />
                <ReadOnlyField label="Emergency Contact" value={`${profile.emergencyContactName} (${profile.emergencyContactRelation}) • ${profile.emergencyContactPhone}`} />
              </div>
            </div>

            {/* Professional Information */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={16} color="var(--brand-orange)" /> Professional &amp; Institutional Profile
                </h4>
                <Badge variant="active">{profile.role}</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ReadOnlyField label="Employee ID" value={profile.employeeId} isCode />
                <ReadOnlyField label="Designation" value={profile.designation} />
                <ReadOnlyField label="Role" value={profile.roleDisplayName} />
                <ReadOnlyField label="Joining Date" value={profile.joiningDate} />
                <ReadOnlyField label="Confirmation Date" value={profile.confirmationDate} />
                <ReadOnlyField label="Employment Type" value={profile.employmentType} />
                <ReadOnlyField label="Employment Status" value={profile.employmentStatus} />
                <ReadOnlyField label="Institution" value={profile.instituteName} />
                <ReadOnlyField label="Department" value={profile.departmentName} />
                <ReadOnlyField label="Qualification" value={profile.qualification} />
                <ReadOnlyField label="Highest Degree" value={profile.highestDegree} />
                <ReadOnlyField label="Total Experience" value={`${profile.experienceYears} Years`} />
                <ReadOnlyField label="Specialization" value={profile.specialization} />
                <ReadOnlyField label="Office Location" value={profile.officeLocation} />
                <ReadOnlyField label="Extension" value={profile.officeExtension} />
              </div>
            </div>
          </div>

          {/* Reporting Authority Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--brand-orange)" /> Immediate Reporting Authority
              </h4>
              <button
                type="button"
                onClick={() => setIsHierarchyModalOpen(true)}
                className="btn btn-ghost btn-xs"
                style={{ color: 'var(--brand-orange)', fontWeight: 800 }}
              >
                View Full Hierarchy →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-navy)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.125rem'
                  }}
                >
                  {profile.reportsTo.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {profile.reportsTo.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--brand-orange)', fontWeight: 700 }}>
                    {profile.reportsTo.designation}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {profile.reportsTo.instituteName}
                  </div>
                </div>
              </div>

              <div>
                <ReadOnlyField label="Reporting Role" value={profile.roleAbove} />
                <ReadOnlyField label="Official Email" value={profile.reportsTo.email} />
              </div>

              <div>
                <ReadOnlyField label="Office Contact" value={profile.reportsTo.phone} />
                <ReadOnlyField label="Department" value={profile.reportsTo.departmentName} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: REPORTING & HIERARCHY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'HIERARCHY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Hierarchy Tree Card */}
          <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Institutional Governance &amp; Reporting Lines
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                  Statutory University chain of command from Leadership down to Department Faculty &amp; Mentees
                </p>
              </div>
              <Badge variant="navy">6 Echelons</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.hierarchyChain.map(node => {
                const isCurrent = node.isCurrentUser;
                return (
                  <div
                    key={node.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '8px',
                      backgroundColor: isCurrent ? '#0B192C' : '#F8FAFC',
                      color: isCurrent ? '#FFFFFF' : 'var(--text-color)',
                      border: isCurrent ? '2px solid var(--brand-orange)' : '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isCurrent ? 'var(--brand-orange)' : '#E2E8F0',
                          color: isCurrent ? '#FFFFFF' : 'var(--brand-navy)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.875rem'
                        }}
                      >
                        {node.level}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: isCurrent ? 'var(--brand-gold)' : '#64748B', textTransform: 'uppercase' }}>
                          {node.title}
                        </div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: isCurrent ? '#FFFFFF' : 'var(--brand-navy)' }}>
                          {isCurrent ? profile.name : node.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isCurrent ? '#CBD5E1' : '#64748B' }}>
                          {node.designation} {node.departmentName ? `• ${node.departmentName}` : ''}
                        </div>
                      </div>
                    </div>

                    <Badge variant={isCurrent ? 'orange' : 'navy'}>
                      {isCurrent ? 'CURRENT USER' : node.role}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Reports Table */}
          <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Direct Reports Under Supervision ({profile.directReports.length})
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                  Employees, faculty members, and administrative staff reporting directly to {profile.name}
                </p>
              </div>

              <input
                type="text"
                placeholder="Search direct reports..."
                value={reportSearchQuery}
                onChange={e => setReportSearchQuery(e.target.value)}
                className="form-control"
                style={{ width: '220px', fontSize: '0.8125rem' }}
              />
            </div>

            {filteredDirectReports.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                No direct reports found matching "{reportSearchQuery}".
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '0.65rem' }}>Employee ID</th>
                      <th style={{ padding: '0.65rem' }}>Staff Name</th>
                      <th style={{ padding: '0.65rem' }}>Designation</th>
                      <th style={{ padding: '0.65rem' }}>Department</th>
                      <th style={{ padding: '0.65rem' }}>Teaching / Workload</th>
                      <th style={{ padding: '0.65rem' }}>Email &amp; Contact</th>
                      <th style={{ padding: '0.65rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDirectReports.map(rep => (
                      <tr key={rep.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem', fontFamily: 'monospace', fontWeight: 700 }}>
                          {rep.employeeId}
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {rep.name}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {rep.designation}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {rep.departmentName}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {rep.workloadHours ? (
                            <Badge variant="navy">{rep.workloadHours}h / wk ({rep.assignedSubjectsCount} Sub)</Badge>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Operational</span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <div style={{ fontSize: '0.75rem' }}>{rep.email}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{rep.phone}</div>
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <Badge variant="active">{rep.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: ROLE & RESPONSIBILITIES
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'RESPONSIBILITIES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {/* Statutory Responsibilities */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <div style={{ marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} color="var(--brand-orange)" /> Statutory Academic &amp; Regulatory Duties
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Defined by University Statute, UGC, and AICTE Regulations
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profile.statutoryResponsibilities.map((resp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                    <CheckSquare size={16} color="var(--brand-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-color)', lineHeight: 1.4 }}>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Responsibilities */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <div style={{ marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={16} color="var(--brand-orange)" /> Operational &amp; Portfolio Duties
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Day-to-day department workflows, approval queues, and teaching
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profile.operationalResponsibilities.map((resp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-color)', lineHeight: 1.4 }}>{resp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assigned Subjects & Course Portfolio */}
          {profile.assignedSubjects.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    Assigned Course Portfolio &amp; Teaching Load ({profile.assignedSubjects.length} Courses)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    Curriculum subjects currently instructed for Academic Year {profile.academicYear}
                  </p>
                </div>
                <Badge variant="navy">Total: {profile.scopeKPIs.weeklyTeachingHours} Hrs / Wk</Badge>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '0.65rem' }}>Course Code</th>
                      <th style={{ padding: '0.65rem' }}>Subject Name</th>
                      <th style={{ padding: '0.65rem' }}>Type</th>
                      <th style={{ padding: '0.65rem' }}>Semester</th>
                      <th style={{ padding: '0.65rem' }}>Credits</th>
                      <th style={{ padding: '0.65rem' }}>Weekly Hours</th>
                      <th style={{ padding: '0.65rem' }}>Enrolled Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.assignedSubjects.map(sub => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {sub.code}
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 800 }}>
                          {sub.name}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <Badge variant="orange">{sub.type}</Badge>
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 700 }}>
                          Sem {sub.semesterNumber}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {sub.credits} Credits
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {sub.hoursPerWeek}h / week
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {sub.enrolledStudents} Students
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: ACCESS & PERMISSIONS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PERMISSIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Enterprise RBAC Module Access &amp; Permission Matrix
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                  Permission Tier: <strong style={{ color: 'var(--brand-orange)' }}>{profile.permissionLevel}</strong>
                </p>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['ALL', 'ACADEMIC', 'GOVERNANCE', 'STUDENT_SERVICES', 'ADMINISTRATION', 'CAMPUS_OPERATIONS'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPermissionFilterCategory(cat)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: permissionFilterCategory === cat ? 'var(--brand-navy)' : '#F1F5F9',
                      color: permissionFilterCategory === cat ? '#FFFFFF' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '0.65rem' }}>ERP Module</th>
                    <th style={{ padding: '0.65rem' }}>Category</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>View</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Create</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Edit</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Delete</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Approve</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Export</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Allocate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map(p => (
                    <tr key={p.moduleKey} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                        {p.moduleLabel}
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>{p.category}</span>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canView ? <Check size={16} color="#10B981" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canCreate ? <Check size={16} color="#10B981" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canEdit ? <Check size={16} color="#10B981" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canDelete ? <Check size={16} color="#EF4444" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canApprove ? <Check size={16} color="#F59E0B" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canExport ? <Check size={16} color="#3B82F6" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        {p.canAllocate ? <Check size={16} color="#8B5CF6" /> : <XCircle size={15} color="#CBD5E1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: SECURITY & ACCOUNT ACTIVITY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SECURITY_AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Account Credentials & Security Info */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="var(--brand-orange)" /> Account Governance &amp; Session Info
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
                <ReadOnlyField label="ERP Username" value={profile.username} isCode />
                <ReadOnlyField label="Official Email" value={profile.officialEmail} />
                <ReadOnlyField label="Account Status" value={profile.status} badge={<Badge variant="active">{profile.status}</Badge>} />
                <ReadOnlyField label="Last Login" value={new Date(profile.lastLoginAt).toLocaleString('en-IN')} />
                <ReadOnlyField label="Last Login IP" value={profile.lastLoginIp} />
                <ReadOnlyField label="Account Created" value={new Date(profile.accountCreatedAt).toLocaleDateString('en-IN')} />
                <ReadOnlyField label="Two-Factor Auth (2FA)" value={profile.twoFactorEnabled ? 'Enabled' : 'Disabled (Optional)'} />
                <ReadOnlyField label="Session Security" value={profile.activeSessionStatus} />
              </div>
            </div>

            {/* Change Password Form */}
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={18} color="var(--brand-orange)" /> Change Password
              </h4>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800, width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={14} /> Update Security Password
                </button>
              </form>
            </div>
          </div>

          {/* Recent Account Activity Audit Log */}
          <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Recent Account Activity &amp; Audit Trail
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                  Immutable audit records captured for security compliance and session actions
                </p>
              </div>
              <Badge variant="navy">Live Audit Logs</Badge>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.8125rem' }}>
                No recent security actions logged for this session.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                      <th style={{ padding: '0.65rem' }}>Action</th>
                      <th style={{ padding: '0.65rem' }}>Module</th>
                      <th style={{ padding: '0.65rem' }}>Details</th>
                      <th style={{ padding: '0.65rem' }}>Date &amp; Time</th>
                      <th style={{ padding: '0.65rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAuditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {log.action}
                        </td>
                        <td style={{ padding: '0.65rem', fontSize: '0.75rem', color: '#64748B' }}>
                          {log.module}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {log.details}
                        </td>
                        <td style={{ padding: '0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          <Badge variant="active">{log.status || 'SUCCESS'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EditStaffProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfileUpdates}
      />

      <OrgHierarchyModal
        isOpen={isHierarchyModalOpen}
        onClose={() => setIsHierarchyModalOpen(false)}
        hierarchyChain={profile.hierarchyChain}
        currentUserName={profile.name}
        currentUserRole={profile.role}
        departmentName={profile.departmentName}
        instituteName={profile.instituteName}
      />
    </div>
  );
};

// Helper read-only row
const ReadOnlyField: React.FC<{
  label: string;
  value: string | number | undefined | null;
  badge?: React.ReactNode;
  isCode?: boolean;
}> = ({ label, value, badge, isCode = false }) => {
  const displayVal = (value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '—') ? String(value) : 'Not Provided';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.55rem 0.75rem',
        borderBottom: '1px solid #F1F5F9',
        fontSize: '0.8125rem',
        background: '#FFFFFF',
        gap: '0.5rem'
      }}
    >
      <span style={{ color: '#64748B', fontWeight: 600, minWidth: '140px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <span
          style={{
            fontWeight: 700,
            color: displayVal === 'Not Provided' ? '#94A3B8' : 'var(--brand-navy, #0B192C)',
            fontFamily: isCode && displayVal !== 'Not Provided' ? 'monospace' : 'inherit',
            fontStyle: displayVal === 'Not Provided' ? 'italic' : 'normal',
            wordBreak: 'break-word',
            textAlign: 'right'
          }}
        >
          {displayVal}
        </span>
        {badge}
      </div>
    </div>
  );
};
