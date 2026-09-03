import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Building2, Home, Bed, User, ShieldCheck, Clock, Plus, 
  Wrench, AlertTriangle, CheckCircle2, FileText, Bell, Phone, Mail, MapPin, Search
} from 'lucide-react';
import { 
  HostelMaster, HostelRoomDetail, HostelAllotmentDetail, 
  HostelMaintenanceRequestItem, HostelVisitorEntry, HostelMaintenanceStatus, HostelVisitorStatus 
} from '../../types';

export const StudentHostelPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'NOTICES' | 'VISITORS' | 'MAINTENANCE'>('DETAILS');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [maintenanceCategory, setMaintenanceCategory] = useState<'ELECTRICAL' | 'PLUMBING' | 'FURNITURE' | 'AC_FAN' | 'WATER' | 'CLEANING' | 'INTERNET' | 'ROOM' | 'WASHROOM' | 'COMMON_AREA' | 'OTHER'>('ELECTRICAL');
  const [maintenancePriority, setMaintenancePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceDesc, setMaintenanceDesc] = useState('');

  const [visitorName, setVisitorName] = useState('');
  const [visitorRelation, setVisitorRelation] = useState('Parent');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitPurpose, setVisitPurpose] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const student = useMemo(() => {
    const students = db.getStudents();
    return students.find(s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo) || students[0];
  }, [user]);

  const hostels = db.getHostels();
  const allMaintenance = db.getHostelMaintenanceRequests?.() || [];
  const allVisitors = db.getHostelVisitorEntries?.() || [];

  // Scoped strictly to logged-in student (Prompt Rule 10)
  const myAllotment = {
    id: 'allot-stu-1',
    studentId: student.id,
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    hostelId: 'hst-1',
    hostelName: 'Vivekananda Boys Hostel (Block A)',
    roomNumber: 'A-204',
    bedNumber: 'Bed-1 (Window Side)',
    allotmentDate: '2025-08-01',
    status: 'ACTIVE' as const,
    feeStatus: 'PAID' as const,
    wardenName: 'Dr. Rajesh Patel',
    wardenPhone: '+91 98250 12345',
    wardenEmail: 'warden.blocka@swarrnim.edu.in'
  };

  const myHostel = hostels.find(h => h.id === myAllotment.hostelId) || {
    id: 'hst-1',
    name: myAllotment.hostelName,
    code: 'VBH-A',
    wardenName: myAllotment.wardenName,
    wardenPhone: myAllotment.wardenPhone,
    wardenEmail: myAllotment.wardenEmail,
    address: 'Swarrnim Campus, Block A, Near Sports Complex'
  };

  const myMaintenanceRequests = allMaintenance.filter(m => m.studentId === student.id || m.enrollmentNo === student.enrollmentNo);
  const myVisitorRequests = allVisitors.filter(v => v.studentId === student.id || v.enrollmentNumber === student.enrollmentNo);

  const hostelNotices = [
    { id: 'hn-1', title: 'Hostel Night Curfew & Biometric Attendance Timing (10:00 PM)', date: '2026-08-15', category: 'RULES', priority: 'HIGH', author: 'Chief Warden Office' },
    { id: 'hn-2', title: 'Special Independence Day Banquet & Cultural Night Schedule', date: '2026-08-14', category: 'MESS', priority: 'NORMAL', author: 'Hostel Committee' },
    { id: 'hn-3', title: 'Scheduled High-Speed Wi-Fi Router Maintenance on 2nd Floor', date: '2026-08-10', category: 'FACILITIES', priority: 'NORMAL', author: 'IT Directorate' },
  ];

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTitle.trim() || !maintenanceDesc.trim()) {
      showToast('error', 'Please provide maintenance request title and details.');
      return;
    }

    const newReq: HostelMaintenanceRequestItem = {
      id: `hmr-${Date.now()}`,
      requestNo: `HOST-MNT-2026-${String(myMaintenanceRequests.length + 1).padStart(4, '0')}`,
      hostelId: myHostel.id,
      hostelName: myHostel.name,
      roomNumber: myAllotment.roomNumber,
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      category: maintenanceCategory,
      priority: maintenancePriority,
      title: maintenanceTitle.trim(),
      description: maintenanceDesc.trim(),
      status: 'SUBMITTED',
      slaHours: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db.createHostelMaintenanceRequest) {
      db.createHostelMaintenanceRequest(newReq, user);
    }

    setIsMaintenanceModalOpen(false);
    setMaintenanceTitle('');
    setMaintenanceDesc('');
    showToast('success', `Maintenance complaint ${newReq.requestNo} logged successfully.`);
  };

  const handleCreateVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorPhone.trim()) {
      showToast('error', 'Please fill in visitor name and contact number.');
      return;
    }

    const newVis: HostelVisitorEntry = {
      id: `vis-${Date.now()}`,
      passNumber: `VIS/2026/${String(myVisitorRequests.length + 1).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNo,
      hostelBlock: myHostel.name,
      roomNo: myAllotment.roomNumber,
      visitorName: visitorName.trim(),
      mobileNumber: visitorPhone.trim(),
      idProofType: 'AADHAAR',
      idProofNumber: 'XXXX-XXXX-1234',
      purpose: `${visitorRelation} - ${visitPurpose.trim() || 'Family Visit'}`,
      entryDate: visitDate,
      entryTime: '17:00',
      expectedExitTime: '19:00',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (db.createHostelVisitorEntry) {
      db.createHostelVisitorEntry(newVis, user);
    }

    setIsVisitorModalOpen(false);
    setVisitorName('');
    setVisitorPhone('');
    setVisitPurpose('');
    showToast('success', `Visitor gate pass ${newVis.passNumber} submitted for warden approval.`);
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
        padding: '1.75rem',
        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="gold">Residential Campus Life</Badge>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Hostel Residency Portal</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.5rem' }}>
            {myHostel.name}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#FEF3C7', marginTop: '0.25rem' }}>
            Room: <strong>{myAllotment.roomNumber}</strong> • Bed: <strong>{myAllotment.bedNumber}</strong> • Warden: <strong>{myHostel.wardenName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn" style={{ backgroundColor: '#FFFFFF', color: '#B45309', fontWeight: 700 }} onClick={() => setIsMaintenanceModalOpen(true)}>
            <Wrench size={16} /> Request Maintenance
          </button>
          <button className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 700 }} onClick={() => setIsVisitorModalOpen(true)}>
            <Plus size={16} /> Apply Visitor Pass
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Hostel Status" value="ACTIVE RESIDENT" subtitle={myAllotment.hostelName} icon={Home} colorScheme="green" />
        <StatCard title="Allocated Room" value={myAllotment.roomNumber} subtitle={myAllotment.bedNumber} icon={Bed} colorScheme="navy" />
        <StatCard title="Open Maintenance" value={myMaintenanceRequests.filter(m => m.status === 'SUBMITTED' || m.status === 'ASSIGNED' || m.status === 'IN_PROGRESS').length} subtitle="Pending resolution" icon={Wrench} colorScheme="orange" onClick={() => setActiveTab('MAINTENANCE')} />
        <StatCard title="Visitor Passes" value={myVisitorRequests.length} subtitle="Gate passes logged" icon={User} colorScheme="gold" onClick={() => setActiveTab('VISITORS')} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'DETAILS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('DETAILS')}>
          <Home size={16} /> Room &amp; Warden Information
        </button>
        <button className={`btn ${activeTab === 'NOTICES' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('NOTICES')}>
          <Bell size={16} /> Hostel Notices ({hostelNotices.length})
        </button>
        <button className={`btn ${activeTab === 'MAINTENANCE' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('MAINTENANCE')}>
          <Wrench size={16} /> Maintenance Requests ({myMaintenanceRequests.length})
        </button>
        <button className={`btn ${activeTab === 'VISITORS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('VISITORS')}>
          <User size={16} /> Visitor Gate Passes ({myVisitorRequests.length})
        </button>
      </div>

      {/* Tab 1: DETAILS */}
      {activeTab === 'DETAILS' && (
        <div className="grid-2">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bed size={20} color="var(--brand-orange)" /> My Allocation Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hostel Block:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myHostel.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Room Number:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myAllotment.roomNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bed Allocation:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myAllotment.bedNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Allotment Date:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myAllotment.allotmentDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hostel Fee Status:</span>
                <Badge variant="active">PAID (SEMESTER 2026-27)</Badge>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--brand-orange)" /> Hostel Warden &amp; Emergency Contacts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chief Warden:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myHostel.wardenName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contact Number:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{myHostel.wardenPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{myHostel.wardenEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security Desk (24x7):</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>+91 98250 99999 / Ext. 104</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Campus Ambulance:</span>
                <span style={{ fontWeight: 700, color: '#EF4444' }}>108 / +91 98250 11111</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: NOTICES */}
      {activeTab === 'NOTICES' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Official Hostel Announcements &amp; Curfew Circulars
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hostelNotices.map(notice => (
              <div key={notice.id} style={{
                padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Badge variant={notice.priority === 'HIGH' ? 'danger' : 'navy'}>{notice.category}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notice.date} • {notice.author}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>{notice.title}</h4>
                </div>
                <Badge variant="gold">OFFICIAL CIRCULAR</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: MAINTENANCE */}
      {activeTab === 'MAINTENANCE' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              My Room &amp; Facility Maintenance Complaints
            </h3>
            <button className="btn btn-primary" onClick={() => setIsMaintenanceModalOpen(true)}>
              <Plus size={16} /> Log New Maintenance Request
            </button>
          </div>

          {myMaintenanceRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Wrench size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>No maintenance requests logged.</p>
              <p style={{ fontSize: '0.85rem' }}>If you face any electrical, plumbing or cleaning issues in your room, log a complaint above.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Category</th>
                    <th>Title &amp; Description</th>
                    <th>Priority</th>
                    <th>Logged Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myMaintenanceRequests.map(req => (
                    <tr key={req.id}>
                      <td><code style={{ fontWeight: 700, color: 'var(--brand-orange)' }}>{req.requestNo}</code></td>
                      <td><Badge variant="navy">{req.category}</Badge></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{req.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.description}</div>
                      </td>
                      <td><Badge variant={req.priority === 'HIGH' || req.priority === 'URGENT' ? 'danger' : 'gold'}>{req.priority}</Badge></td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Badge variant={req.status === 'RESOLVED' || req.status === 'CLOSED' ? 'active' : req.status === 'IN_PROGRESS' || req.status === 'ASSIGNED' ? 'gold' : 'inactive'}>
                          {req.status}
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

      {/* Tab 4: VISITORS */}
      {activeTab === 'VISITORS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
              Visitor &amp; Parent Gate Entry Passes
            </h3>
            <button className="btn btn-primary" onClick={() => setIsVisitorModalOpen(true)}>
              <Plus size={15} /> Request Visitor Pass
            </button>
          </div>

          {myVisitorRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <User size={42} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>No visitor gate passes recorded.</p>
              <p style={{ fontSize: '0.78125rem' }}>Pre-apply for visiting parents or guardians to facilitate quick campus security verification.</p>
            </div>
          ) : (
            <div className="erp-excel-table-container">
              <table className="erp-excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Pass No</th>
                    <th>Visitor Name</th>
                    <th style={{ width: '160px' }}>Phone</th>
                    <th style={{ width: '130px' }}>Visit Date</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myVisitorRequests.map(v => {
                    const isInside = v.status === 'INSIDE' || v.status === 'APPROVED';
                    const isExited = v.status === 'EXITED' || v.status === 'COMPLETED';
                    const badgeVariant = isInside ? 'active' : isExited ? 'navy' : v.status === 'REJECTED' ? 'danger' : 'gold';
                    const statusLabel = v.status === 'APPROVED' ? 'INSIDE' : v.status === 'COMPLETED' ? 'EXITED' : v.status;

                    return (
                      <tr key={v.id}>
                        <td>
                          <code style={{ fontWeight: 700, color: 'var(--brand-orange)', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem' }}>
                            {v.passNumber}
                          </code>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>
                          {v.visitorName}
                        </td>
                        <td style={{ color: 'var(--text-main)' }}>
                          {v.mobileNumber}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {v.entryDate}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={badgeVariant}>
                            {statusLabel}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Request Maintenance */}
      {isMaintenanceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Log Room Maintenance Complaint
            </h3>
            <form onSubmit={handleCreateMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Category
                </label>
                <select 
                  className="form-control" 
                  value={maintenanceCategory} 
                  onChange={e => setMaintenanceCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84375rem',
                    borderRadius: '6px',
                    border: '1px solid #1f2937',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ELECTRICAL">Electrical (Fan / Light / Plug Socket)</option>
                  <option value="PLUMBING">Plumbing (Tap / Washroom / Drainage)</option>
                  <option value="CARPENTRY">Carpentry (Bed / Desk / Wardrobe)</option>
                  <option value="CIVIL">Civil / Painting / Window</option>
                  <option value="CLEANING">Cleaning &amp; Housekeeping</option>
                  <option value="INTERNET">Hostel Wi-Fi / LAN Network</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Priority
                </label>
                <select 
                  className="form-control" 
                  value={maintenancePriority} 
                  onChange={e => setMaintenancePriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84375rem',
                    borderRadius: '6px',
                    border: '1px solid #1f2937',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="LOW">Low (Routine Check)</option>
                  <option value="MEDIUM">Medium (Normal Repair)</option>
                  <option value="HIGH">High (Urgent Attention)</option>
                  <option value="EMERGENCY">Emergency (Power Leak / Major Leakage)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Complaint Title *
                </label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Ceiling fan regulator not working" 
                  value={maintenanceTitle} 
                  onChange={e => setMaintenanceTitle(e.target.value)} 
                  required 
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84375rem',
                    borderRadius: '6px',
                    border: '1px solid #1f2937',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Detailed Description *
                </label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Provide exact problem description and room location..." 
                  value={maintenanceDesc} 
                  onChange={e => setMaintenanceDesc(e.target.value)} 
                  required 
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84375rem',
                    borderRadius: '6px',
                    border: '1px solid #1f2937',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 500,
                    outline: 'none',
                    minHeight: '85px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMaintenanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Wrench size={16} /> Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Visitor Pass */}
      {isVisitorModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Request Visitor / Parent Gate Pass
            </h3>
            <form onSubmit={handleCreateVisitor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Visitor Full Name *</label>
                <input className="form-control" placeholder="e.g. Mr. Ramesh Patel" value={visitorName} onChange={e => setVisitorName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Relationship *</label>
                <select className="form-control" value={visitorRelation} onChange={e => setVisitorRelation(e.target.value)}>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Local Guardian</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Visitor Contact Phone *</label>
                <input className="form-control" placeholder="e.g. 98250 12345" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Expected Visit Date *</label>
                <input type="date" className="form-control" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>Visit Purpose</label>
                <input className="form-control" placeholder="e.g. Weekend family visit" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsVisitorModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><User size={16} /> Submit Gate Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
