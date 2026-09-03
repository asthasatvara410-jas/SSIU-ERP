import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ExamSeatAllocation, ExamCentre, ExamRoom } from '../../types';
import {
  Users,
  Grid,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  DoorOpen,
  ArrowRightLeft,
  Printer,
  Download,
  Filter,
  Search,
  Sparkles,
  History,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const SeatingArrangementPage: React.FC = () => {
  const { user, role } = useAuth();
  const exams = db.getExams();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedCentreId, setSelectedCentreId] = useState<string>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modals
  const [isAutoAllocateModalOpen, setIsAutoAllocateModalOpen] = useState(false);
  const [seatPattern, setSeatPattern] = useState<'ROW_COLUMN' | 'ALTERNATE' | 'SEQUENTIAL'>('ROW_COLUMN');
  const [seatPrefix, setSeatPrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);

  const [isManualChangeModalOpen, setIsManualChangeModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<ExamSeatAllocation | null>(null);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetSeatNumber, setTargetSeatNumber] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyAllocation, setHistoryAllocation] = useState<ExamSeatAllocation | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const canManage = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'EXAM_CELL' || role === 'PRINCIPAL';

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const centres = db.getExamCentres();
  const allRooms = db.getExamRooms();

  const eligibleStudents = useMemo(() => {
    if (!selectedExamId) return [];
    return db.getEligibleStudentsForSeating(selectedExamId);
  }, [selectedExamId, notification]);

  const seatingData = useMemo(() => {
    if (!selectedExamId) return { examId: '', totalAllocated: 0, allocations: [] };
    return db.getExamSeating(selectedExamId, {}, user);
  }, [selectedExamId, notification, user]);

  const totalEligible = eligibleStudents.length;
  const totalAllocated = seatingData.totalAllocated;
  const unallocatedCount = Math.max(0, totalEligible - totalAllocated);

  const totalCapacity = centres.reduce((acc, c) => {
    const cRooms = allRooms.filter(r => r.centreId === c.id && (r.status === 'AVAILABLE' || r.status === 'ACTIVE'));
    return acc + cRooms.reduce((rAcc, r) => rAcc + (r.capacity || 0), 0);
  }, 0);

  const availableRooms = allRooms.filter(r => r.status === 'AVAILABLE' || r.status === 'ACTIVE');

  const filteredAllocations = useMemo(() => {
    return seatingData.allocations.filter(a => {
      const matchesCentre = selectedCentreId === 'ALL' || a.centreId === selectedCentreId;
      const matchesRoom = selectedRoomId === 'ALL' || a.roomId === selectedRoomId;
      const q = searchQuery.toLowerCase();
      const studentName = a.student?.name || '';
      const enrollmentNo = a.student?.enrollmentNo || '';
      const seatNo = a.seatNumber || '';
      const matchesSearch = !searchQuery ||
        studentName.toLowerCase().includes(q) ||
        enrollmentNo.toLowerCase().includes(q) ||
        seatNo.toLowerCase().includes(q);
      return matchesCentre && matchesRoom && matchesSearch;
    });
  }, [seatingData, selectedCentreId, selectedRoomId, searchQuery]);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAutoAllocate = () => {
    try {
      if (!selectedExamId) {
        showNotification('error', 'Please select an examination.');
        return;
      }

      if (totalEligible === 0) {
        showNotification('error', 'No verified and paid students found for this examination.');
        return;
      }

      if (totalEligible > totalCapacity) {
        const shortfall = totalEligible - totalCapacity;
        showNotification('error', `Insufficient examination capacity. Total eligible students: ${totalEligible}, Total available capacity: ${totalCapacity}. Shortfall: ${shortfall} seat(s).`);
        return;
      }

      const res = db.autoAllocateSeating(selectedExamId, {
        seatPattern,
        prefix: seatPrefix,
        startNumber,
      }, user);

      setIsAutoAllocateModalOpen(false);
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to auto allocate seats.');
    }
  };

  const handleOpenManualChange = (alloc: ExamSeatAllocation) => {
    setSelectedAllocation(alloc);
    setTargetRoomId(alloc.roomId);
    setTargetSeatNumber(alloc.seatNumber);
    setChangeReason('');
    setIsManualChangeModalOpen(true);
  };

  const handleSaveManualChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;

    if (!changeReason || !changeReason.trim()) {
      showNotification('error', 'Mandatory reason is required to change a student seat.');
      return;
    }

    try {
      const res = db.manualChangeSeat(
        selectedAllocation.id,
        targetRoomId,
        targetSeatNumber,
        changeReason.trim(),
        undefined,
        user
      );
      setIsManualChangeModalOpen(false);
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update seat.');
    }
  };

  const handleViewHistory = (alloc: ExamSeatAllocation) => {
    setHistoryAllocation(alloc);
    setIsHistoryModalOpen(true);
  };

  const handlePrintDoorChart = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredAllocations.length === 0) {
      showNotification('warning', 'No seating records available to export.');
      return;
    }

    const headers = ['Seat Number', 'Enrollment No', 'Student Name', 'Department', 'Centre', 'Room', 'Row', 'Column', 'Status'];
    const departments = db.getDepartments();
    const rows = filteredAllocations.map(a => [
      a.seatNumber,
      a.student?.enrollmentNo || '',
      a.student?.name || '',
      departments.find(d => d.id === a.student?.departmentId)?.name || 'Computer Engineering',
      a.centre?.name || '',
      a.room?.roomNumber || '',
      a.row || '',
      a.column || '',
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Seating_Plan_${selectedExam?.code || 'EXAM'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Seating arrangement exported to CSV successfully.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--brand-navy)', color: '#fff' }}>
              <Grid size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Seating Arrangement &amp; Allocation
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                Automated seat allocation for verified candidates, door chart generation, and manual reallocation
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handlePrintDoorChart} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Printer size={15} /> Print Door Chart
          </button>
          <button onClick={handleExportCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={15} /> Export CSV
          </button>
          {canManage && (
            <button onClick={() => setIsAutoAllocateModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} /> Auto Allocate Seating
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? '#ECFDF5' : notification.type === 'warning' ? '#FFFBEB' : '#FEF2F2',
          border: `1px solid ${notification.type === 'success' ? '#10B981' : notification.type === 'warning' ? '#F59E0B' : '#EF4444'}`,
          color: notification.type === 'success' ? '#065F46' : notification.type === 'warning' ? '#92400E' : '#991B1B',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Exam Selector Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: '#F8FAFC' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.3rem' }}>
            SELECT EXAMINATION SESSION *
          </label>
          <select
            className="form-control"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code}) — {e.session || 'Summer 2026'} [{e.status}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.3rem' }}>
            EXAM STATUS
          </label>
          <Badge variant={selectedExam?.status === 'ONGOING' ? 'active' : 'navy'}>
            {selectedExam?.status || 'DRAFT'}
          </Badge>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Eligible Candidates"
          value={totalEligible}
          icon={Users}
          colorScheme="navy"
          trend="Verified & Paid Forms"
        />
        <StatCard
          title="Available Capacity"
          value={totalCapacity}
          icon={Building2}
          colorScheme="blue"
          trend="Configured Rooms"
        />
        <StatCard
          title="Allocated Seats"
          value={totalAllocated}
          icon={CheckCircle2}
          colorScheme="green"
          trend={`${totalEligible > 0 ? Math.round((totalAllocated / totalEligible) * 100) : 0}% Allocated`}
        />
        <StatCard
          title="Unallocated Students"
          value={unallocatedCount}
          icon={AlertTriangle}
          colorScheme={unallocatedCount > 0 ? 'orange' : 'green'}
          trend={unallocatedCount > 0 ? 'Action Required' : 'All Students Seated'}
        />
      </div>

      {/* Filter Row & View Mode */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search candidate, enrollment no, seat no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="form-control"
            value={selectedCentreId}
            onChange={(e) => setSelectedCentreId(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="ALL">All Exam Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="ALL">All Rooms</option>
            {allRooms
              .filter(r => selectedCentreId === 'ALL' || r.centreId === selectedCentreId)
              .map(r => (
                <option key={r.id} value={r.id}>{r.roomNumber} ({r.capacity} seats)</option>
              ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setViewMode('GRID')}
            className={`btn btn-sm ${viewMode === 'GRID' ? 'btn-navy' : 'btn-outline'}`}
          >
            <Grid size={14} /> Door Chart Grid
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            className={`btn btn-sm ${viewMode === 'TABLE' ? 'btn-navy' : 'btn-outline'}`}
          >
            <FileText size={14} /> Table Roster
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {filteredAllocations.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Grid size={48} style={{ color: '#9CA3AF', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
            No Seating Allocations Found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            {totalEligible > 0
              ? `There are ${totalEligible} verified candidate(s) awaiting seating. Click "Auto Allocate Seating" to assign seats.`
              : 'No verified & fee-cleared candidates found for this examination.'}
          </p>
          {canManage && totalEligible > 0 && (
            <button onClick={() => setIsAutoAllocateModalOpen(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
              <Sparkles size={16} /> Auto Allocate Now
            </button>
          )}
        </div>
      ) : viewMode === 'GRID' ? (
        /* Door Chart / Seating Grid View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Array.from(new Set(filteredAllocations.map(a => a.roomId))).map(roomId => {
            const room = allRooms.find(r => r.id === roomId);
            const roomAllocations = filteredAllocations.filter(a => a.roomId === roomId);
            const centre = centres.find(c => c.id === room?.centreId);

            return (
              <div key={roomId} className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--brand-navy)' }}>
                {/* Room Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                      {room?.roomNumber || 'Room'} — {centre?.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      Building: {room?.building || centre?.building} | Floor: {room?.floor} | Type: {room?.roomType} | Seated: {roomAllocations.length} / {room?.capacity}
                    </p>
                  </div>
                  <Badge variant="navy">Door Chart Active</Badge>
                </div>

                {/* Desk/Seat Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem' }}>
                  {roomAllocations.map(alloc => (
                    <div
                      key={alloc.id}
                      style={{
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        background: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--brand-orange)', background: 'var(--brand-orange-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {alloc.seatNumber}
                        </span>
                        {alloc.history && alloc.history.length > 0 && (
                          <button
                            onClick={() => handleViewHistory(alloc)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', padding: 0 }}
                            title="View Seat Change History"
                          >
                            <History size={13} />
                          </button>
                        )}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alloc.student?.name || 'Student Name'}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {alloc.student?.enrollmentNo || 'EN2024CSE001'}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {db.getDepartments().find(d => d.id === alloc.student?.departmentId)?.name || 'Computer Engineering'}
                      </div>

                      {canManage && (
                        <div style={{ marginTop: '0.3rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.3rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenManualChange(alloc)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <ArrowRightLeft size={10} /> Change Seat
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Roster View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', fontSize: '0.8rem', color: 'var(--brand-navy)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>SEAT NO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ENROLLMENT NO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STUDENT NAME</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DEPARTMENT</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CENTRE &amp; ROOM</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ROW / COL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                  {canManage && <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.85rem' }}>
                {filteredAllocations.map(alloc => (
                  <tr key={alloc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--brand-orange)' }}>
                        {alloc.seatNumber}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{alloc.student?.enrollmentNo}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>{alloc.student?.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {db.getDepartments().find(d => d.id === alloc.student?.departmentId)?.name || 'Computer Engineering'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{alloc.room?.roomNumber}</strong> ({alloc.centre?.name})
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {alloc.row || '-'} / Col {alloc.column || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Badge variant="active">{alloc.status}</Badge>
                    </td>
                    {canManage && (
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenManualChange(alloc)}
                            className="btn btn-outline btn-sm"
                            title="Re-allocate Seat"
                          >
                            <ArrowRightLeft size={13} /> Re-allocate
                          </button>
                          {alloc.history && alloc.history.length > 0 && (
                            <button
                              onClick={() => handleViewHistory(alloc)}
                              className="btn btn-outline btn-sm"
                              title="Audit History"
                            >
                              <History size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auto Allocate Modal */}
      {isAutoAllocateModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '540px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Automatic Seating Allocation Wizard
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Generate sequential, alternate, or row/column seat arrangements across active rooms for verified candidates.
            </p>

            {/* Validation Alert Box */}
            <div style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: totalEligible <= totalCapacity ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${totalEligible <= totalCapacity ? '#86EFAC' : '#FCA5A5'}`,
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span>Eligible Candidates: <strong>{totalEligible}</strong></span>
                <span>Total Room Capacity: <strong>{totalCapacity}</strong></span>
              </div>
              {totalEligible > totalCapacity ? (
                <div style={{ color: '#991B1B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle size={15} /> Insufficient examination capacity (Shortfall: {totalEligible - totalCapacity} seats).
                </div>
              ) : (
                <div style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle2 size={15} /> Examination capacity is sufficient for all candidates.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Seating Pattern *</label>
                <select
                  className="form-control"
                  value={seatPattern}
                  onChange={(e) => setSeatPattern(e.target.value as any)}
                >
                  <option value="ROW_COLUMN">Row / Column Pattern (A01, A02, B01, B02...)</option>
                  <option value="SEQUENTIAL">Sequential Numbering (01, 02, 03, 04...)</option>
                  <option value="ALTERNATE">Alternate Anti-Malpractice Spacing (01, 03, 05...)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Seat Prefix (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={seatPrefix}
                    onChange={(e) => setSeatPrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. S- or A-"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Start Number</label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAutoAllocateModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={totalEligible === 0 || totalEligible > totalCapacity}
                  onClick={handleAutoAllocate}
                >
                  Confirm &amp; Allocate ({totalEligible} Students)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Change Seat Modal */}
      {isManualChangeModalOpen && selectedAllocation && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
              Manual Seat Re-allocation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Modify student seat allocation with mandatory audit justification. Hall ticket will be updated.
            </p>

            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>Student: <strong>{selectedAllocation.student?.name}</strong> ({selectedAllocation.student?.enrollmentNo})</div>
              <div>Current Seat: <strong style={{ color: 'var(--brand-orange)' }}>{selectedAllocation.seatNumber}</strong> in {selectedAllocation.room?.roomNumber}</div>
            </div>

            <form onSubmit={handleSaveManualChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>New Room *</label>
                  <select
                    className="form-control"
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    required
                  >
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} ({r.capacity} cap)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>New Seat Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={targetSeatNumber}
                    onChange={(e) => setTargetSeatNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. B04"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Mandatory Justification / Reason *
                </label>
                <textarea
                  required
                  className="form-control"
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="State clear operational or medical reason (e.g. Disability accessibility ground floor accommodation request)"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsManualChangeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Seat Re-allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {isHistoryModalOpen && historyAllocation && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '550px', width: '90%', padding: '1.75rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Seat Allocation Audit Trail
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>Student: <strong>{historyAllocation.student?.name}</strong> ({historyAllocation.student?.enrollmentNo})</div>
              <div>Current Active Seat: <strong>{historyAllocation.seatNumber}</strong> in {historyAllocation.room?.roomNumber}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(!historyAllocation.history || historyAllocation.history.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No historical re-allocations recorded for this student.
                </p>
              ) : (
                historyAllocation.history.map((h, i) => (
                  <div key={h.id || i} style={{ border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-navy)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      <span>From {h.fromSeatNumber || 'Init'} &rarr; {h.toSeatNumber}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.changedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#4B5563', marginBottom: '0.2rem' }}>
                      <strong>Reason:</strong> {h.reason}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Changed By: {h.changedByName || h.changedByUserId}
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
