import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Bus, MapPin, Clock, User, Phone, CheckCircle2, 
  AlertCircle, Plus, FileText, Send, ShieldCheck, ArrowRightLeft, XCircle
} from 'lucide-react';
import { StudentTransportAllocation, BusRoute, TransportVehicle, TransportDriver } from '../../types';

export const StudentTransportPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ROUTE' | 'REQUESTS'>('ROUTE');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Request form state
  const [requestType, setRequestType] = useState<'NEW_ALLOCATION' | 'ROUTE_CHANGE' | 'STOP_CHANGE' | 'CANCELLATION'>('STOP_CHANGE');
  const [targetRouteId, setTargetRouteId] = useState('');
  const [targetStopName, setTargetStopName] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const student = useMemo(() => {
    const students = db.getStudents();
    return students.find(s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo) || students[0];
  }, [user]);

  const routes: BusRoute[] = db.getBusRoutes?.() || [];
  const allocations: StudentTransportAllocation[] = db.getStudentTransportAllocations?.() || [];
  const transportRequests = db.getTransportRequests?.() || [];

  // Scoped student transport allocation
  const myAllocation: StudentTransportAllocation = allocations.find(a => a.studentId === student.id || a.enrollmentNo === student.enrollmentNo) || {
    id: 'alloc-stu-1',
    allotmentNo: 'TR-ALLOT-2026-001',
    studentId: student.id,
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    routeId: 'route-1',
    routeName: 'Route 1: Gandhinagar Sector 21 - Campus',
    routeNumber: 'GJ-01-R1',
    stopId: 'stop-1',
    stopName: 'Sector 21 Circle (Akshardham Crossroad)',
    pickupTime: '07:30 AM',
    dropTime: '05:30 PM',
    vehicleId: 'veh-1',
    vehicleNumber: 'GJ-18-AZ-4521',
    driverName: 'Mr. Jagdishbhai Solanki',
    driverPhone: '+91 98795 44321',
    passNumber: 'TP-2026-0842',
    academicYear: '2026-2027',
    allocatedDate: '2026-07-15',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const myRequests = transportRequests.filter((r: any) => r.studentId === student.id || r.enrollmentNo === student.enrollmentNo);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      showToast('error', 'Please provide justification for the transport request.');
      return;
    }

    if (db.createTransportRequest) {
      db.createTransportRequest({
        studentId: student.id,
        routeId: targetRouteId || myAllocation.routeId,
        stopId: myAllocation.stopId,
        requestType,
        remarks: `${requestReason.trim()} (Requested stop: ${targetStopName.trim() || myAllocation.stopName})`
      }, user);
    }

    setIsRequestModalOpen(false);
    setRequestReason('');
    setTargetStopName('');
    showToast('success', `Transport request (${requestType.replace(/_/g, ' ')}) submitted to Transport Directorate.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
          color: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontWeight: 600
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #6B21A8 0%, #4C1D95 100%)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
        borderRadius: 'var(--radius-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Badge variant="gold">University Transport Service</Badge>
            <span style={{ fontSize: '0.71875rem', opacity: 0.9 }}>Daily Fleet Management</span>
          </div>
          <h2 style={{ fontSize: '1.3125rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.35rem', letterSpacing: '-0.01em' }}>
            {myAllocation.routeName}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#E9D5FF', marginTop: '0.2rem' }}>
            Pickup: <strong>{myAllocation.stopName}</strong> at <strong>{myAllocation.pickupTime}</strong> • Bus: <strong>{myAllocation.vehicleNumber}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn" style={{ backgroundColor: '#FFFFFF', color: '#6B21A8', fontWeight: 700, fontSize: '0.78125rem', padding: '0.45rem 0.85rem' }} onClick={() => setIsRequestModalOpen(true)}>
            <ArrowRightLeft size={14} /> Request Route / Stop Change
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Transport Status" value="ACTIVE PASS" subtitle={`Pass: ${myAllocation.passNumber || 'TP-ACTIVE'}`} icon={Bus} colorScheme="green" />
        <StatCard title="Pickup Time" value={myAllocation.pickupTime || '07:30 AM'} subtitle={myAllocation.stopName || 'Campus Stop'} icon={Clock} colorScheme="navy" />
        <StatCard title="Bus Vehicle" value={myAllocation.vehicleNumber || 'Campus Bus'} subtitle={myAllocation.routeNumber || 'Main Fleet'} icon={Bus} colorScheme="gold" />
        <StatCard title="Assigned Driver" value={myAllocation.driverName || 'Fleet Operator'} subtitle={myAllocation.driverPhone || '+91 98795 00000'} icon={User} colorScheme="orange" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'ROUTE' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('ROUTE')}>
          <Bus size={15} /> Route &amp; Driver Schedule
        </button>
        <button className={`btn ${activeTab === 'REQUESTS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('REQUESTS')}>
          <FileText size={15} /> Transport Change Requests ({myRequests.length})
        </button>
      </div>

      {/* Tab 1: ROUTE */}
      {activeTab === 'ROUTE' && (
        <div className="grid-2">
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <MapPin size={17} color="var(--brand-orange)" /> My Boarding &amp; Schedule Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Route:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{myAllocation.routeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Boarding Stop:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{myAllocation.stopName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Morning Pickup Time:</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{myAllocation.pickupTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Evening Return Departure:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myAllocation.dropTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Digital Pass Number:</span>
                <code style={{ fontWeight: 700, color: 'var(--brand-orange)', fontSize: '0.78125rem' }}>{myAllocation.passNumber}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transport Fee Status:</span>
                <Badge variant="active">PAID (ANNUAL 2026-27)</Badge>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={17} color="var(--brand-orange)" /> Vehicle &amp; Driver Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle Reg. Number:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{myAllocation.vehicleNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Route Code:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{myAllocation.routeNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Driver Name:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{myAllocation.driverName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Driver Mobile:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{myAllocation.driverPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transport Control Room:</span>
                <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>+91 98795 00000 / Ext. 108</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.78125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>GPS Tracking Status:</span>
                <Badge variant="active">LIVE ON FLEET GPS</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
              My Transport Change &amp; Allocation Requests
            </h3>
            <button className="btn btn-primary" onClick={() => setIsRequestModalOpen(true)}>
              <Plus size={15} /> New Transport Request
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bus size={42} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>No transport requests submitted.</p>
              <p style={{ fontSize: '0.78125rem' }}>If you need to change your boarding stop, switch bus route or request cancellation, apply above.</p>
            </div>
          ) : (
            <div className="erp-excel-table-container">
              <table className="erp-excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Request No</th>
                    <th style={{ width: '160px' }}>Type</th>
                    <th>Reason / Details</th>
                    <th style={{ width: '130px' }}>Date</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r: any) => (
                    <tr key={r.id}>
                      <td><code style={{ fontWeight: 700, color: 'var(--brand-orange)', fontSize: '0.78125rem' }}>{r.applicationNo || r.id}</code></td>
                      <td><Badge variant="navy">{r.requestType?.replace(/_/g, ' ') || 'CHANGE'}</Badge></td>
                      <td style={{ fontSize: '0.78125rem' }}>{r.remarks || r.reason || 'Transport adjustment request'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={r.status === 'APPROVED' ? 'active' : r.status === 'REJECTED' ? 'danger' : 'gold'}>
                          {r.status?.replace(/_/g, ' ') || 'SUBMITTED'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Transport Request */}
      {isRequestModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Submit Transport Request
            </h3>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Request Type *</label>
                <select className="form-control" value={requestType} onChange={e => setRequestType(e.target.value as any)}>
                  <option value="STOP_CHANGE">Change Pickup / Drop Stop</option>
                  <option value="ROUTE_CHANGE">Change Bus Route</option>
                  <option value="NEW_ALLOCATION">New Bus Seat Allocation</option>
                  <option value="CANCELLATION">Cancel Transport Subscription</option>
                </select>
              </div>

              {requestType !== 'CANCELLATION' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Route</label>
                  <select className="form-control" value={targetRouteId} onChange={e => setTargetRouteId(e.target.value)}>
                    <option value="">-- Keep Current Route ({myAllocation.routeName}) --</option>
                    {routes.map((r: BusRoute) => (
                      <option key={r.id} value={r.id}>{r.routeName}</option>
                    ))}
                  </select>
                </div>
              )}

              {requestType !== 'CANCELLATION' && (
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Pickup / Drop Stop *</label>
                  <input className="form-control" placeholder="e.g. Infocity Circle, Gandhinagar" value={targetStopName} onChange={e => setTargetStopName(e.target.value)} required={requestType === 'STOP_CHANGE'} />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Reason / Justification *</label>
                <textarea className="form-control" rows={3} placeholder="Please explain reason for route/stop change or cancellation..." value={requestReason} onChange={e => setRequestReason(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Send size={16} /> Submit to Transport Desk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
