import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ExamEdpDuty } from '../../types';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  DoorOpen,
  Calendar,
  UserCheck,
  UserX,
  History,
  Printer,
  Download,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export interface ExamEdpDutyPageProps {
  initialRecordId?: string;
}

export const ExamEdpDutyPage: React.FC<ExamEdpDutyPageProps> = ({ initialRecordId }) => {
  const { user, role } = useAuth();
  const exams = db.getExams();
  const centres = db.getExamCentres();
  const rooms = db.getExamRooms();
  const staffList = db.getEdpStaffList();

  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignFormData, setAssignFormData] = useState<Partial<ExamEdpDuty>>({
    examId: exams[0]?.id || '',
    dutyDate: new Date().toISOString().split('T')[0],
    shift: 'MORNING',
    centreId: centres[0]?.id || '',
    roomId: '',
    dutyType: 'EDP_OPERATOR',
    staffUserId: staffList[0]?.id || '',
    remarks: '',
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<ExamEdpDuty | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDuty, setHistoryDuty] = useState<ExamEdpDuty | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManage = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'EXAM_CELL' || role === 'PRINCIPAL';

  const dutiesSummary = useMemo(() => {
    return db.getExamEdpDuties(
      {
        examId: selectedExamId === 'ALL' ? undefined : selectedExamId,
        status: selectedStatus === 'ALL' ? undefined : (selectedStatus as any),
        shift: selectedShift === 'ALL' ? undefined : (selectedShift as any),
      },
      user
    );
  }, [selectedExamId, selectedStatus, selectedShift, user]);

  // Deep-link Auto-Open Exact Duty
  React.useEffect(() => {
    if (initialRecordId && dutiesSummary.duties.length > 0) {
      const match = dutiesSummary.duties.find(d => d.id === initialRecordId);
      if (match) {
        setHistoryDuty(match);
        setIsHistoryModalOpen(true);
      }
    }
  }, [initialRecordId, dutiesSummary]);

  const filteredDuties = useMemo(() => {
    return dutiesSummary.duties.filter(d => {
      const matchesShift = selectedShift === 'ALL' || d.shift === selectedShift;
      const q = searchQuery.toLowerCase();
      const staffName = d.staffUser?.name || '';
      const dutyNo = d.dutyNo || '';
      const centreName = d.centre?.name || '';
      const matchesSearch = !searchQuery ||
        staffName.toLowerCase().includes(q) ||
        dutyNo.toLowerCase().includes(q) ||
        centreName.toLowerCase().includes(q);
      return matchesShift && matchesSearch;
    });
  }, [dutiesSummary, selectedShift, searchQuery]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAssignModal = () => {
    setAssignFormData({
      examId: exams[0]?.id || '',
      dutyDate: new Date().toISOString().split('T')[0],
      shift: 'MORNING',
      centreId: centres[0]?.id || '',
      roomId: '',
      dutyType: 'EDP_OPERATOR',
      staffUserId: staffList[0]?.id || '',
      remarks: '',
    });
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignDuty = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!assignFormData.examId || !assignFormData.dutyDate || !assignFormData.shift || !assignFormData.staffUserId || !assignFormData.centreId) {
        showNotification('error', 'Exam, Duty Date, Shift, Centre, and Staff Member are mandatory.');
        return;
      }

      const res = db.assignExamEdpDuty(assignFormData, user);
      setIsAssignModalOpen(false);
      showNotification('success', `EDP Duty ${res.dutyNo} assigned successfully.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to assign EDP Duty.');
    }
  };

  const handleConfirmDuty = (duty: ExamEdpDuty) => {
    try {
      db.updateExamEdpDutyStatus(duty.id, 'CONFIRMED', undefined, user);
      showNotification('success', `Duty ${duty.dutyNo} confirmed successfully.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to confirm duty.');
    }
  };

  const handleOpenRejectModal = (duty: ExamEdpDuty) => {
    setSelectedDuty(duty);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleSaveRejectDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty) return;

    if (!rejectionReason || !rejectionReason.trim()) {
      showNotification('error', 'Mandatory reason is required to decline examination duty.');
      return;
    }

    try {
      db.updateExamEdpDutyStatus(selectedDuty.id, 'REJECTED', rejectionReason.trim(), user);
      setIsRejectModalOpen(false);
      showNotification('success', `Duty ${selectedDuty.dutyNo} declined with justification.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to decline duty.');
    }
  };

  const handleCancelDuty = (duty: ExamEdpDuty) => {
    const reason = window.prompt('Enter mandatory reason for cancelling this examination duty:');
    if (!reason || !reason.trim()) return;

    try {
      db.updateExamEdpDutyStatus(duty.id, 'CANCELLED', reason.trim(), user);
      showNotification('success', `Duty ${duty.dutyNo} cancelled.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to cancel duty.');
    }
  };

  const handleCompleteDuty = (duty: ExamEdpDuty) => {
    try {
      db.updateExamEdpDutyStatus(duty.id, 'COMPLETED', undefined, user);
      showNotification('success', `Duty ${duty.dutyNo} marked as COMPLETED.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to complete duty.');
    }
  };

  const handleViewHistory = (duty: ExamEdpDuty) => {
    setHistoryDuty(duty);
    setIsHistoryModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--brand-navy)', color: '#fff' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                EDP &amp; Exam Duty Management
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                Faculty exam duty allocation, IT surveillance monitoring, shift confirmations, and overlap prevention
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handlePrint} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Printer size={15} /> Print Roster
          </button>
          {canManage && (
            <button onClick={handleOpenAssignModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Assign EDP Duty
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.message}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Total Assigned Duties"
          value={dutiesSummary.totalDuties}
          icon={FileCheck}
          colorScheme="navy"
          trend="Master Exam Roster"
        />
        <StatCard
          title="Today's Active Duties"
          value={dutiesSummary.todayCount}
          icon={Clock}
          colorScheme="orange"
          trend="Active Shifts"
        />
        <StatCard
          title="Upcoming Duties"
          value={dutiesSummary.upcomingCount}
          icon={Calendar}
          colorScheme="blue"
          trend="Scheduled Ahead"
        />
        <StatCard
          title="Completed Inspections"
          value={dutiesSummary.completedCount}
          icon={CheckCircle2}
          colorScheme="green"
          trend="Verified Roster"
        />
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search staff, duty no, centre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="form-control"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="ALL">All Examinations</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="ALL">All Shifts</option>
            <option value="MORNING">Morning Shift</option>
            <option value="AFTERNOON">Afternoon Shift</option>
            <option value="EVENING">Evening Shift</option>
          </select>

          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Duties Roster Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', fontSize: '0.8rem', color: 'var(--brand-navy)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>DUTY NO</th>
                <th style={{ padding: '0.75rem 1rem' }}>STAFF MEMBER</th>
                <th style={{ padding: '0.75rem 1rem' }}>DUTY TYPE</th>
                <th style={{ padding: '0.75rem 1rem' }}>DATE &amp; SHIFT</th>
                <th style={{ padding: '0.75rem 1rem' }}>CENTRE &amp; ROOM</th>
                <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.85rem' }}>
              {filteredDuties.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No EDP duties found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredDuties.map(duty => {
                  const isAssignedStaff = user?.id === duty.staffUserId || user?.email === duty.staffUser?.email;
                  const canAcknowledge = isAssignedStaff || canManage;

                  return (
                    <tr key={duty.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong style={{ color: 'var(--brand-orange)' }}>{duty.dutyNo}</strong>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{duty.staffUser?.name || 'Staff User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{duty.staffUser?.email}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 600, color: '#374151', background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {duty.dutyType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{new Date(duty.dutyDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{duty.shift}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{duty.centre?.name || 'Main Centre'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{duty.room?.roomNumber || duty.building || 'Full Block'}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge
                          variant={
                            duty.status === 'CONFIRMED' || duty.status === 'COMPLETED'
                              ? 'active'
                              : duty.status === 'ASSIGNED'
                              ? 'orange'
                              : 'inactive'
                          }
                        >
                          {duty.status}
                        </Badge>
                        {duty.rejectionReason && (
                          <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '0.2rem' }}>
                            Reason: {duty.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* Staff Acknowledgement */}
                          {canAcknowledge && duty.status === 'ASSIGNED' && (
                            <>
                              <button
                                onClick={() => handleConfirmDuty(duty)}
                                className="btn btn-outline-success btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                title="Accept & Confirm Duty"
                              >
                                <UserCheck size={13} /> Confirm
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(duty)}
                                className="btn btn-outline-danger btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                title="Decline Duty with Reason"
                              >
                                <UserX size={13} /> Decline
                              </button>
                            </>
                          )}

                          {/* Controller Complete or Cancel */}
                          {canManage && duty.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCompleteDuty(duty)}
                              className="btn btn-outline-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Mark Completed
                            </button>
                          )}

                          {canManage && (duty.status === 'ASSIGNED' || duty.status === 'CONFIRMED') && (
                            <button
                              onClick={() => handleCancelDuty(duty)}
                              className="btn btn-outline-danger btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => handleViewHistory(duty)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                            title="Audit Trail"
                          >
                            <History size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign EDP Duty Modal */}
      {isAssignModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '550px', width: '90%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Assign Examination EDP Duty
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Assign examination duty to authorized faculty/staff. System automatically prevents overlapping assignments.
            </p>

            <form onSubmit={handleSaveAssignDuty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Examination *</label>
                <select
                  className="form-control"
                  value={assignFormData.examId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, examId: e.target.value })}
                  required
                >
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Faculty / Staff Member *</label>
                <select
                  className="form-control"
                  value={assignFormData.staffUserId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, staffUserId: e.target.value })}
                  required
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.department} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Duty Date *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={assignFormData.dutyDate}
                    onChange={(e) => setAssignFormData({ ...assignFormData, dutyDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Shift *</label>
                  <select
                    className="form-control"
                    value={assignFormData.shift}
                    onChange={(e) => setAssignFormData({ ...assignFormData, shift: e.target.value })}
                  >
                    <option value="MORNING">MORNING (09:30 AM - 12:30 PM)</option>
                    <option value="AFTERNOON">AFTERNOON (02:00 PM - 05:00 PM)</option>
                    <option value="EVENING">EVENING (05:30 PM - 08:30 PM)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Centre *</label>
                  <select
                    className="form-control"
                    value={assignFormData.centreId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, centreId: e.target.value })}
                    required
                  >
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Duty Type *</label>
                  <select
                    className="form-control"
                    value={assignFormData.dutyType}
                    onChange={(e) => setAssignFormData({ ...assignFormData, dutyType: e.target.value as any })}
                  >
                    <option value="EDP_OPERATOR">EDP Operator</option>
                    <option value="EXAM_SUPPORT">Exam Support Staff</option>
                    <option value="TECHNICAL_SUPPORT">Technical &amp; CCTV Support</option>
                    <option value="CONTROL_ROOM">Exam Control Room</option>
                    <option value="OTHER">Other Assignment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Specific Room (Optional)</label>
                <select
                  className="form-control"
                  value={assignFormData.roomId || ''}
                  onChange={(e) => setAssignFormData({ ...assignFormData, roomId: e.target.value })}
                >
                  <option value="">Full Centre / Block Coverage</option>
                  {rooms
                    .filter(r => r.centreId === assignFormData.centreId)
                    .map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber} ({r.roomType})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Remarks / Instructions</label>
                <input
                  type="text"
                  className="form-control"
                  value={assignFormData.remarks || ''}
                  onChange={(e) => setAssignFormData({ ...assignFormData, remarks: e.target.value })}
                  placeholder="e.g. In-charge of CCTV surveillance and packet verification"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Duty Modal */}
      {isRejectModalOpen && selectedDuty && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Decline Examination Duty
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Declining duty requires a mandatory official justification that will be reviewed by the Controller of Examinations.
            </p>

            <form onSubmit={handleSaveRejectDuty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  className="form-control"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Pre-scheduled medical emergency / approved academic conference leave"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsRejectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Decline Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {isHistoryModalOpen && historyDuty && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '520px', width: '90%', padding: '1.75rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                EDP Duty History — {historyDuty.dutyNo}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(!historyDuty.history || historyDuty.history.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No historical logs recorded for this duty.</p>
              ) : (
                historyDuty.history.map((h, i) => (
                  <div key={h.id || i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--brand-navy)' }}>
                      <span>Action: {h.action}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                    {h.reason && <div style={{ color: '#4B5563', marginTop: '0.2rem' }}>Remarks: {h.reason}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Performed By: {h.performedByName || h.performedByUserId}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
