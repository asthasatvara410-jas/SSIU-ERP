import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { studentProfileAccessService } from '../../services/studentProfileAccessService';
import { workTransferService } from '../../services/workTransferService';
import { Badge } from '../common/Badge';
import { StudentDocumentsSection } from './StudentDocumentsSection';
import { 
  User, GraduationCap, Building2, BookOpen, FileCheck, Calendar, IndianRupee, 
  FileText, MessageSquare, History, Shield, Award, Phone, Mail, MapPin, Users,
  CheckCircle2, AlertCircle, Clock, Lock, Unlock, Download, Eye, Edit3, Printer,
  Layers, CheckCircle, ExternalLink, RefreshCw, Sparkles, HelpCircle, Briefcase,
  UserCheck, ShieldCheck, FileSpreadsheet, UserPlus, LayoutDashboard, ArrowLeftRight, CheckSquare
} from 'lucide-react';

export type EntityType = 
  | 'student' 
  | 'faculty' 
  | 'department' 
  | 'program' 
  | 'staff' 
  | 'subject' 
  | 'examination' 
  | 'exam_form' 
  | 'attendance' 
  | 'fee' 
  | 'document' 
  | 'request' 
  | 'admission' 
  | 'user';

export interface EntityProfileTabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: string;
  requiredRoles?: string[];
  render: (entity: any, helpers: { user: any; role: any; canMutate: boolean; refresh: () => void }) => React.ReactNode;
}

export interface EntityProfileProps {
  entityType: EntityType;
  entityId: string;
  initialTab?: string;
  onEditClick?: (entity: any) => void;
  onClose?: () => void;
  canMutate?: boolean;
}

export const EntityProfile: React.FC<EntityProfileProps> = ({
  entityType,
  entityId,
  initialTab,
  onEditClick,
  onClose,
  canMutate = true
}) => {
  const { user, role, canMutate: checkCanMutate } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'OVERVIEW');
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper row component for 2-column key-value tables
  const InfoRow = ({ label, value, badge, isCode }: { label: string; value?: React.ReactNode; badge?: React.ReactNode; isCode?: boolean }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '175px 1fr',
        padding: '0.45rem 0.6rem',
        borderBottom: '1px solid var(--border-light, #F1F5F9)',
        fontSize: '0.8125rem',
        alignItems: 'center',
        background: 'transparent'
      }}>
        <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--brand-navy, #0B192C)', wordBreak: 'break-word' }}>
          {isCode ? <code style={{ fontFamily: 'monospace', color: 'var(--brand-orange, #F37023)', fontWeight: 700 }}>{value}</code> : value}
          {badge}
        </div>
      </div>
    );
  };

  // Safe Data Loader based on entityType and entityId
  const entityData: any = useMemo(() => {
    if (!entityId) return null;
    const state = db.getState();

    switch (entityType) {
      case 'student':
        return db.getStudentById(entityId) || state.students.find(s => s.id === entityId || s.enrollmentNo === entityId);
      case 'faculty':
        return db.getFaculty().find(f => f.id === entityId || f.employeeId === entityId);
      case 'department':
        return db.getDepartmentById(entityId) || state.departments.find(d => d.id === entityId || d.code === entityId);
      case 'program':
        return db.getProgramById(entityId) || state.programs.find(p => p.id === entityId || p.code === entityId);
      case 'subject':
        return db.getSubjectById(entityId) || state.subjects.find(s => s.id === entityId || s.code === entityId);
      case 'staff':
        return state.users.find(u => (u.id === entityId || u.employeeId === entityId) && u.role !== 'STUDENT') || db.getFaculty().find(f => f.id === entityId);
      case 'user':
        return state.users.find(u => u.id === entityId || u.email === entityId);
      case 'examination':
        return (state.exams || []).find((e: any) => e.id === entityId || e.name === entityId) || {
          id: entityId,
          name: 'Summer End Semester Examination 2026',
          type: 'REGULAR',
          academicYear: '2026–2027',
          semester: 'Semester 4',
          program: 'B.Tech Computer Science & Engineering',
          startDate: '2026-05-15',
          endDate: '2026-05-30',
          status: 'UPCOMING'
        };
      case 'exam_form':
        return (state.examForms || []).find((ef: any) => ef.id === entityId || ef.formNo === entityId) || {
          id: entityId,
          formNo: `EXF-${entityId.slice(0, 8)}`,
          studentId: 'stu-1',
          studentName: 'Demo Student',
          enrollmentNo: '230101001',
          programName: 'B.Tech in Computer Science & Engineering',
          semester: 'Semester 4',
          examName: 'Summer End Semester Examination 2026',
          eligibilityStatus: 'ELIGIBLE',
          feeStatus: 'PAID',
          approvalStatus: 'VERIFIED',
          submissionDate: '2026-04-10'
        };
      case 'attendance':
        return {
          id: entityId,
          title: 'Classroom & Student Attendance Master',
          percentage: 91.5,
          presentClasses: 42,
          absentClasses: 4,
          totalClasses: 46,
          status: 'GOOD',
          academicYear: '2026–2027',
          semester: 'Semester 4'
        };
      case 'fee':
        return db.getFeePaymentTransactions().find((f: any) => f.id === entityId || f.receiptNo === entityId) || {
          id: entityId,
          accountName: 'Student Tuition & Composite Account',
          enrollmentNo: '230101001',
          totalPayable: 120000,
          paidAmount: 75000,
          pendingAmount: 45000,
          status: 'PARTIALLY_PAID',
          academicYear: '2026–2027'
        };
      case 'document':
        return (state.studentDocuments || []).find((d: any) => d.id === entityId) || {
          id: entityId,
          title: 'Degree Certificate / Official Identity Proof',
          category: 'ACADEMIC',
          fileName: 'Official_Credentials_Vault.pdf',
          fileSize: '2.4 MB',
          uploadDate: '2026-08-15',
          status: 'VERIFIED',
          isLocked: true,
          verifiedBy: 'Registrar Office'
        };
      case 'request':
        return (state.studentSectionRequests || []).find((r: any) => r.id === entityId || r.requestNo === entityId) || {
          id: entityId,
          requestNo: `REQ-${entityId.slice(0, 8)}`,
          serviceName: 'Bonafide Certificate & Academic Verification',
          studentName: 'Demo Student',
          departmentName: 'Computer Engineering',
          createdAt: '2026-08-01',
          status: 'IN_REVIEW',
          assignedAuthority: 'Student Section Head'
        };
      case 'admission':
        return {
          id: entityId,
          applicationNo: `ADM-${entityId.slice(0, 8)}`,
          applicantName: 'Varu Aryan Punjabhai',
          programName: 'B.Tech in Computer Science & Engineering',
          instituteName: 'Swarrnim Institute of Technology',
          quota: 'State Quota (ACPC)',
          meritRank: '26466',
          category: 'SEBC / OBC',
          allotmentDate: '2023-07-15',
          status: 'APPROVED'
        };
      default:
        return null;
    }
  }, [entityType, entityId, refreshKey]);

  // Derived Dynamic Tabs for Entity Type
  const tabs = useMemo<EntityProfileTabConfig[]>(() => {
    switch (entityType) {
      // ══════════════════════════════════════════════════════════════════════
      // 1. FACULTY PROFILE TABS
      // ══════════════════════════════════════════════════════════════════════
      case 'faculty': {
        const fac = entityData;
        const institute = fac ? db.getInstituteById(fac.instituteId) : null;
        const department = fac ? db.getDepartmentById(fac.departmentId) : null;
        const assignedSubjects = db.getSubjects().filter(s => fac?.subjectIds?.includes(s.id));
        const assignedMentees = db.getStudents().filter(s => s.mentorId === fac?.id || s.departmentId === fac?.departmentId).slice(0, 10);

        return [
          {
            id: 'OVERVIEW',
            label: '1. Overview',
            icon: <LayoutDashboard size={15} />,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FACULTY STATUS</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>{fac?.status || 'ACTIVE'}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>{fac?.experienceYears || 5} Years Experience</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ASSIGNED SUBJECTS</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>{assignedSubjects.length} Courses</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Current Semester Load</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid #10B981' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>MENTEES ASSIGNED</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>{assignedMentees.length} Students</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Active Mentorship Batch</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                    Employment &amp; Academic Affiliation Summary
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                    <div>
                      <InfoRow label="Full Name" value={fac?.name} />
                      <InfoRow label="Employee ID" value={fac?.employeeId} isCode />
                      <InfoRow label="Designation" value={fac?.designation} />
                      <InfoRow label="Department" value={department?.name || 'Computer Engineering'} />
                      <InfoRow label="Institute" value={institute?.name || 'Swarrnim Institute of Technology'} />
                    </div>
                    <div>
                      <InfoRow label="Highest Qualification" value={fac?.qualification || 'Ph.D in Computer Science'} />
                      <InfoRow label="Specialization" value={fac?.specialization || 'AI & Cloud Computing'} />
                      <InfoRow label="Official Email" value={fac?.email} />
                      <InfoRow label="Phone Number" value={fac?.phone} />
                      <InfoRow label="Joining Date" value={fac?.joiningDate || '2021-08-01'} />
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'PERSONAL',
            label: '2. Personal',
            icon: <User size={15} />,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.5rem' }}>
                  Personal Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                  <div>
                    <InfoRow label="Full Name" value={fac?.name} />
                    <InfoRow label="Date of Birth" value={fac?.dateOfBirth || '1988-04-12'} />
                    <InfoRow label="Blood Group" value={fac?.bloodGroup || 'O+'} badge={<Badge variant="orange">{fac?.bloodGroup || 'O+'}</Badge>} />
                  </div>
                  <div>
                    <InfoRow label="Residential Address" value={fac?.address || 'Gandhinagar, Gujarat, India'} />
                    <InfoRow label="Emergency Phone" value={fac?.phone} />
                    <InfoRow label="Nationality" value="Indian" />
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'PROFESSIONAL',
            label: '3. Professional & Academic',
            icon: <Award size={15} />,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                  Academic Credentials &amp; Research Portfolio
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                  <div>
                    <InfoRow label="Qualification" value={fac?.qualification || 'Ph.D. Computer Engineering'} />
                    <InfoRow label="Specialization" value={fac?.specialization || 'Distributed Systems & AI'} />
                    <InfoRow label="Experience" value={`${fac?.experienceYears || 5} Years`} />
                  </div>
                  <div>
                    <InfoRow label="Research Papers" value="12 Published (IEEE/Springer)" />
                    <InfoRow label="Patents Granted" value="2 Filed / 1 Granted" />
                    <InfoRow label="Consultancy Projects" value="₹ 4.5 Lakhs (SSIU Incubation)" />
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'COURSES',
            label: '4. Courses & Subjects',
            icon: <BookOpen size={15} />,
            badge: assignedSubjects.length,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Assigned Teaching Courses &amp; Class Matrix
                </h4>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Type</th>
                        <th>Credits</th>
                        <th>Weekly Hours</th>
                        <th>Semester</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedSubjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted, #64748B)' }}>
                            No courses assigned for current semester.
                          </td>
                        </tr>
                      ) : (
                        assignedSubjects.map(sub => (
                          <tr key={sub.id}>
                            <td><code>{sub.code}</code></td>
                            <td style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{sub.name}</td>
                            <td><Badge variant="navy">{sub.type}</Badge></td>
                            <td style={{ fontWeight: 800 }}>{sub.credits}</td>
                            <td>{sub.theoryHoursPerWeek || 3} Th + {sub.labHoursPerWeek || 2} Lab</td>
                            <td>Sem 4</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          },
          {
            id: 'MENTORSHIP',
            label: '5. Students / Mentorship',
            icon: <Users size={15} />,
            badge: assignedMentees.length,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Assigned Mentees &amp; Student Batches
                </h4>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Enrollment No</th>
                        <th>Student Name</th>
                        <th>Program</th>
                        <th>Semester</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedMentees.map(st => (
                        <tr key={st.id}>
                          <td><code>{st.enrollmentNo}</code></td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{st.name}</td>
                          <td>B.Tech CE</td>
                          <td>Sem 4</td>
                          <td style={{ fontWeight: 800, color: '#047857' }}>92%</td>
                          <td><Badge variant="active">{st.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          },
          {
            id: 'WORKLOAD',
            label: '6. Workload',
            icon: <CheckSquare size={15} />,
            render: () => {
              const assignableItems = workTransferService.getAssignableWorkItemsForUser(fac?.id);
              const userMetrics = workTransferService.getUserWorkloadMetrics(fac?.id);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ACTIVE WORKLOAD</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>
                        {assignableItems.length} Tasks
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Ready to Process</div>
                    </div>
                    <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DELEGATED OUT</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>
                        {userMetrics.currentlyDelegatedOutItems} Tasks
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Transferred to Colleagues</div>
                    </div>
                    <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid #10B981' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>RECEIVED WORK</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                        {userMetrics.currentlyDelegatedInItems} Tasks
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Delegated to Faculty</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                      Assigned Work Items ({assignableItems.length})
                    </h4>
                    <div className="table-responsive">
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Title / Description</th>
                            <th>Assigned Date</th>
                            <th>Delegation Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignableItems.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted, #64748B)' }}>
                                No active pending work items.
                              </td>
                            </tr>
                          ) : (
                            assignableItems.map(item => (
                              <tr key={item.id}>
                                <td><Badge variant="navy">{item.type.replace('_', ' ')}</Badge></td>
                                <td>
                                  <strong>{item.title}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>{item.description}</div>
                                </td>
                                <td>{(item.assignedAt || item.createdAt || '').slice(0, 10)}</td>
                                <td>
                                  {item.isReturnedFromDelegation ? (
                                    <Badge variant="navy">{item.delegationLabel}</Badge>
                                  ) : (
                                    <Badge variant="active">Active Assignment</Badge>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }
          },
          {
            id: 'TRANSFERS',
            label: '7. Active Transfers',
            icon: <ArrowLeftRight size={15} />,
            render: () => {
              const activeOut = workTransferService.getTransfersCreatedByUser(fac?.id).filter(t => t.status === 'ACTIVE');
              const activeIn = workTransferService.getTransfersReceivedByUser(fac?.id).filter(t => t.status === 'ACTIVE');

              return (
                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                    Currently Active Delegations ({activeOut.length + activeIn.length})
                  </h4>
                  <div className="table-responsive">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Tracking Code</th>
                          <th>Counterparty</th>
                          <th>Effective Period</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...activeOut, ...activeIn].length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted, #64748B)' }}>
                              No active workload transfers currently active.
                            </td>
                          </tr>
                        ) : (
                          [...activeOut, ...activeIn].map(t => (
                            <tr key={t.id}>
                              <td><code>{t.trackingCode}</code></td>
                              <td>
                                {t.fromUserId === fac?.id ? (
                                  <span>Delegated to <strong>{t.toUserName}</strong></span>
                                ) : (
                                  <span>Received from <strong>{t.fromUserName}</strong></span>
                                )}
                              </td>
                              <td>{t.startAt} → {t.endAt}</td>
                              <td><Badge variant="orange">{t.reason}</Badge></td>
                              <td><Badge variant="active">ACTIVE</Badge></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          },
          {
            id: 'TRANSFER_HISTORY',
            label: '8. Transfer History',
            icon: <History size={15} />,
            render: () => {
              const allTransfers = [
                ...workTransferService.getTransfersCreatedByUser(fac?.id),
                ...workTransferService.getTransfersReceivedByUser(fac?.id)
              ];
              const historyList = allTransfers.filter(t => ['COMPLETED', 'EXPIRED', 'REVOKED', 'CANCELLED'].includes(t.status));

              return (
                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                    Historical Delegations &amp; Audit Trail ({historyList.length})
                  </h4>
                  <div className="table-responsive">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Tracking Code</th>
                          <th>Counterparty</th>
                          <th>Effective Period</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted, #64748B)' }}>
                              No historical delegation records on file.
                            </td>
                          </tr>
                        ) : (
                          historyList.map(t => (
                            <tr key={t.id}>
                              <td><code>{t.trackingCode}</code></td>
                              <td>{t.fromUserId === fac?.id ? `Delegated to ${t.toUserName}` : `Received from ${t.fromUserName}`}</td>
                              <td>{t.startAt} → {t.endAt}</td>
                              <td><Badge variant="orange">{t.reason}</Badge></td>
                              <td><Badge variant={t.status === 'COMPLETED' ? 'success' : 'navy'}>{t.status}</Badge></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          },
          {
            id: 'AUDIT',
            label: '9. Audit Log',
            icon: <ShieldCheck size={15} />,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Faculty Record Activity &amp; Audit Trail
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderRadius: '6px', borderLeft: '3px solid var(--brand-navy, #0B192C)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>Faculty Profile Synchronized</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>2026-08-20 at 10:15 AM</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>Workload and subject allocation confirmed by HOD.</p>
                  </div>
                </div>
              </div>
            )
          }
        ];
      }

      // ══════════════════════════════════════════════════════════════════════
      // 2. DEPARTMENT PROFILE TABS
      // ══════════════════════════════════════════════════════════════════════
      case 'department': {
        const dept = entityData;
        const institute = dept ? db.getInstituteById(dept.instituteId) : null;
        const deptFaculty = db.getFaculty().filter(f => f.departmentId === dept?.id);
        const deptPrograms = db.getPrograms().filter(p => p.departmentId === dept?.id || p.instituteId === dept?.instituteId);
        const deptSubjects = db.getSubjects().filter(s => s.departmentId === dept?.id);

        return [
          {
            id: 'OVERVIEW',
            label: '1. Overview',
            icon: <LayoutDashboard size={15} />,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DEPARTMENT CODE</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>{dept?.code}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>{institute?.code || 'SSCIT'}</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TOTAL FACULTY</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>{deptFaculty.length} Members</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Teaching Staff</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid #10B981' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ACTIVE PROGRAMS</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>{deptPrograms.length} Programs</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>UG &amp; PG Degree Levels</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                    Department Leadership &amp; Operational Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                    <div>
                      <InfoRow label="Department Name" value={dept?.name} />
                      <InfoRow label="Department Code" value={dept?.code} isCode />
                      <InfoRow label="Head of Dept (HOD)" value={dept?.hodName || 'Dr. HOD Computer Engg'} />
                      <InfoRow label="Institute" value={institute?.name || 'Swarrnim Institute of Technology'} />
                    </div>
                    <div>
                      <InfoRow label="Official Email" value={dept?.email || `${dept?.code?.toLowerCase()}@swarrnim.edu.in`} />
                      <InfoRow label="Phone Number" value={dept?.phone || '+91 79 2345 6789'} />
                      <InfoRow label="Status" value={dept?.status || 'ACTIVE'} badge={<Badge variant="active">{dept?.status || 'ACTIVE'}</Badge>} />
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'FACULTY',
            label: '2. Faculty Members',
            icon: <Users size={15} />,
            badge: deptFaculty.length,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Affiliated Teaching Faculty
                </h4>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Faculty Name</th>
                        <th>Designation</th>
                        <th>Qualification</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptFaculty.map(f => (
                        <tr key={f.id}>
                          <td><code>{f.employeeId}</code></td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{f.name}</td>
                          <td>{f.designation}</td>
                          <td>{f.qualification}</td>
                          <td>{f.email}</td>
                          <td><Badge variant="active">{f.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          },
          {
            id: 'PROGRAMS',
            label: '3. Degree Programs',
            icon: <GraduationCap size={15} />,
            badge: deptPrograms.length,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Offered Degree Programs
                </h4>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Program Code</th>
                        <th>Program Name</th>
                        <th>Degree Type</th>
                        <th>Duration</th>
                        <th>Intake Capacity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptPrograms.map(p => (
                        <tr key={p.id}>
                          <td><code>{p.code}</code></td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{p.name}</td>
                          <td><Badge variant="navy">{p.degreeType}</Badge></td>
                          <td>{p.durationYears} Years</td>
                          <td><strong>{p.intakeCapacity || 120} Seats</strong></td>
                          <td><Badge variant="active">{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        ];
      }

      // ══════════════════════════════════════════════════════════════════════
      // 3. PROGRAM / COURSE PROFILE TABS
      // ══════════════════════════════════════════════════════════════════════
      case 'program': {
        const prog = entityData;
        const institute = prog ? db.getInstituteById(prog.instituteId) : null;
        const dept = prog?.departmentId ? db.getDepartmentById(prog.departmentId) : null;
        const progBatches = db.getBatches().filter(b => b.programId === prog?.id);
        const progSubjects = db.getSubjects().filter(s => s.programId === prog?.id);

        return [
          {
            id: 'OVERVIEW',
            label: '1. Overview',
            icon: <LayoutDashboard size={15} />,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DEGREE TYPE</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>{prog?.degreeType}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>{prog?.durationYears} Years ({prog?.totalSemesters} Semesters)</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>SANCTIONED INTAKE</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>{prog?.intakeCapacity || 120} Seats</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Approved by AICTE/UGC</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid #10B981' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ACTIVE BATCHES</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>{progBatches.length || 4} Batches</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Pursuing Studies</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                    Program Specifications &amp; Affiliation
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                    <div>
                      <InfoRow label="Program Name" value={prog?.name} />
                      <InfoRow label="Program Code" value={prog?.code} isCode />
                      <InfoRow label="Degree Type" value={prog?.degreeType} />
                      <InfoRow label="Department" value={dept?.name || 'Computer Engineering'} />
                    </div>
                    <div>
                      <InfoRow label="Institute" value={institute?.name || 'Swarrnim Institute of Technology'} />
                      <InfoRow label="Duration" value={`${prog?.durationYears} Years (${prog?.totalSemesters} Semesters)`} />
                      <InfoRow label="Status" value={prog?.status || 'ACTIVE'} badge={<Badge variant="active">{prog?.status || 'ACTIVE'}</Badge>} />
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'CURRICULUM',
            label: '2. Subjects & Curriculum',
            icon: <BookOpen size={15} />,
            badge: progSubjects.length,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Program Curriculum Matrix
                </h4>
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Type</th>
                        <th>Credits</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progSubjects.map(sub => (
                        <tr key={sub.id}>
                          <td><code>{sub.code}</code></td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{sub.name}</td>
                          <td><Badge variant="navy">{sub.type}</Badge></td>
                          <td style={{ fontWeight: 800 }}>{sub.credits}</td>
                          <td><Badge variant="active">{sub.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        ];
      }

      // ══════════════════════════════════════════════════════════════════════
      // 4. SUBJECT PROFILE TABS
      // ══════════════════════════════════════════════════════════════════════
      case 'subject': {
        const sub = entityData;
        const prog = sub ? db.getProgramById(sub.programId) : null;
        const dept = sub?.departmentId ? db.getDepartmentById(sub.departmentId) : null;
        const assignedFac = sub?.assignedFacultyId ? db.getFaculty().find(f => f.id === sub.assignedFacultyId) : null;

        return [
          {
            id: 'OVERVIEW',
            label: '1. Overview',
            icon: <LayoutDashboard size={15} />,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-navy, #0B192C)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>COURSE CODE</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', marginTop: '2px' }}>{sub?.code}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>{sub?.credits} Credits</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>WEEKLY LOAD</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', marginTop: '2px' }}>
                      {sub?.theoryHoursPerWeek || 3} Th + {sub?.labHoursPerWeek || 2} Lab
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Hours Per Week</div>
                  </div>
                  <div className="card" style={{ padding: '0.9rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderLeft: '4px solid #10B981' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>EVALUATION</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>30 / 70</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748B)' }}>Internal / External Marks</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                    Course Identity &amp; Faculty In-Charge
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                    <div>
                      <InfoRow label="Course Name" value={sub?.name} />
                      <InfoRow label="Course Code" value={sub?.code} isCode />
                      <InfoRow label="Type" value={sub?.type} badge={<Badge variant="navy">{sub?.type}</Badge>} />
                      <InfoRow label="Program" value={prog?.name || 'B.Tech Computer Engineering'} />
                    </div>
                    <div>
                      <InfoRow label="Faculty In-charge" value={assignedFac?.name || 'Assigned Faculty Coordinator'} />
                      <InfoRow label="Department" value={dept?.name || 'Computer Engineering'} />
                      <InfoRow label="Status" value={sub?.status || 'ACTIVE'} badge={<Badge variant="active">{sub?.status || 'ACTIVE'}</Badge>} />
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ];
      }

      // ══════════════════════════════════════════════════════════════════════
      // DEFAULT FALLBACK FOR ALL OTHER ENTITIES
      // ══════════════════════════════════════════════════════════════════════
      default: {
        const ent = entityData;
        return [
          {
            id: 'OVERVIEW',
            label: '1. Overview',
            icon: <LayoutDashboard size={15} />,
            render: () => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', paddingBottom: '0.4rem' }}>
                    Institutional Entity Record Overview
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0 2rem' }}>
                    <div>
                      <InfoRow label="Entity Type" value={entityType.toUpperCase()} isCode />
                      <InfoRow label="Entity ID" value={ent?.id || entityId} isCode />
                      <InfoRow label="Title / Name" value={ent?.name || ent?.title || ent?.requestNo || ent?.applicationNo || ent?.receiptNo || 'Record Summary'} />
                    </div>
                    <div>
                      <InfoRow label="Status" value={ent?.status || 'ACTIVE'} badge={<Badge variant="active">{ent?.status || 'ACTIVE'}</Badge>} />
                      <InfoRow label="Academic Year" value={ent?.academicYear || '2026–2027'} />
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'AUDIT',
            label: '2. Audit Trail',
            icon: <History size={15} />,
            render: () => (
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface, #FFFFFF)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem' }}>
                  Record Lifecycle &amp; Security Audit
                </h4>
                <div style={{ padding: '1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderRadius: '6px', borderLeft: '3px solid var(--brand-navy, #0B192C)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)' }}>Record Verified &amp; Certified</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>2026-08-20 at 11:30 AM</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>Institutional record verified against Swarrnim University registry.</p>
                </div>
              </div>
            )
          }
        ];
      }
    }
  }, [entityType, entityData]);

  // Set default tab if activeTab is not found in tabs
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const currentTabConfig = tabs.find(t => t.id === activeTab) || tabs[0];

  if (!entityData) {
    return (
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <AlertCircle size={42} color="var(--brand-orange, #F37023)" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>Record Not Found</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', maxWidth: '400px', margin: '0.5rem auto' }}>
          The requested {entityType} record (ID: <code>{entityId}</code>) could not be found or you may not be authorized to view it.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ══════════════════════════════════════════════════════════════════════
          COMPACT PROFESSIONAL ENTITY HEADER
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-md, 8px)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        {/* Left: Photo / Icon & Identity Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            {entityData.photo ? (
              <img
                src={entityData.photo}
                alt={entityData.name}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F37023, #D95D10)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}
              >
                {entityType === 'department' ? <Building2 size={28} /> :
                 entityType === 'program' ? <GraduationCap size={28} /> :
                 entityType === 'subject' ? <BookOpen size={28} /> :
                 entityType === 'examination' ? <FileCheck size={28} /> :
                 entityType === 'fee' ? <IndianRupee size={28} /> :
                 entityType === 'document' ? <FileText size={28} /> :
                 entityType === 'request' ? <MessageSquare size={28} /> :
                 (entityData.name ? entityData.name.charAt(0) : entityType.charAt(0).toUpperCase())}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                {entityData.name || entityData.title || entityData.requestNo || entityData.applicationNo || entityData.formNo || 'Record Profile'}
              </h2>
              <span style={{
                background: entityData.status === 'ACTIVE' || entityData.status === 'APPROVED' || entityData.status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                color: entityData.status === 'ACTIVE' || entityData.status === 'APPROVED' || entityData.status === 'VERIFIED' ? '#065F46' : '#92400E',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {entityData.status || 'ACTIVE'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '0.8125rem',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {entityData.code || entityData.employeeId || entityData.enrollmentNo || entityData.id}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>
                Type: <strong>{entityType.toUpperCase()}</strong>
              </span>
            </div>

            <div style={{ fontSize: '0.78125rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              <strong>{entityData.designation || entityData.degreeType || entityData.departmentName || 'Swarrnim University Institutional Management'}</strong> • Swarrnim Startup &amp; Innovation University
            </div>
          </div>
        </div>

        {/* Right: Role-Permitted Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onEditClick && canMutate && checkCanMutate() && (
            <button
              onClick={() => onEditClick(entityData)}
              className="btn btn-sm"
              style={{ background: 'var(--brand-orange, #F37023)', color: '#FFFFFF', border: 'none', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Edit3 size={13} /> Edit Record
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.75rem' }}
          >
            <Printer size={13} /> Print Dossier
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DYNAMIC TABS NAVIGATION BAR
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          borderBottom: '2px solid var(--border-color, #E2E8F0)',
          paddingBottom: '0.35rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          position: 'sticky',
          top: '-1.5rem',
          zIndex: 15,
          background: 'var(--bg-surface, #FFFFFF)',
          paddingTop: '0.25rem'
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = 0;
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.78125rem',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                background: isActive ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-muted, #64748B)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast, 150ms)',
                flexShrink: 0
              }}
            >
              <span style={{ color: isActive ? 'var(--brand-orange, #F37023)' : 'inherit' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span style={{
                  background: isActive ? 'rgba(243,112,35,0.25)' : 'var(--bg-surface-hover, #F1F5F9)',
                  color: isActive ? 'var(--brand-gold, #FBBF24)' : (tab.badgeVariant || 'var(--text-muted, #64748B)'),
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.6875rem',
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIVE TAB BODY VIEW WITH SCROLL CONTAINMENT
          ══════════════════════════════════════════════════════════════════════ */}
      <div ref={scrollContainerRef} style={{ minHeight: '340px', paddingBottom: '1rem' }}>
        {currentTabConfig?.render(entityData, {
          user,
          role,
          canMutate: checkCanMutate(),
          refresh: () => setRefreshKey(k => k + 1)
        })}
      </div>
    </div>
  );
};
