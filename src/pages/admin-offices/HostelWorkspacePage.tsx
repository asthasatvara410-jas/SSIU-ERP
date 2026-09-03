import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  HostelVisitorEntry,
  HostelMaster,
  HostelRoomDetail,
  HostelAllotmentDetail,
  HostelMaintenanceRequestItem,
  HostelMaintenanceCategory,
  HostelMaintenancePriority,
  HostelMaintenanceStatus,
  ApprovalRequest,
  Student,
  NoteSheet,
  StudentGatePass,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { studentGatePassService } from '../../services/studentGatePassService';
import { StudentGatePassModal } from '../../components/hostel/StudentGatePassModal';
import { WardenGatePassReviewModal } from '../../components/hostel/WardenGatePassReviewModal';
import { SecurityGatePassScannerModal } from '../../components/hostel/SecurityGatePassScannerModal';
import { GatePassAuditModal } from '../../components/hostel/GatePassAuditModal';
import {
  Building,
  Home,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  LogOut,
  LogIn,
  Upload,
  Paperclip,
  RefreshCw,
  BarChart3,
  UserCheck,
  XCircle,
  ShieldAlert,
  Tag,
  User as UserIcon,
  Wrench,
  AlertTriangle,
  Send,
  Star,
  RotateCcw,
  PauseCircle,
  CheckSquare,
  HelpCircle,
  Layers,
  ArrowRightLeft,
  Bed,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';

type TabType =
  | 'DASHBOARD'
  | 'STUDENTS'
  | 'HOSTELS'
  | 'ROOMS'
  | 'ALLOCATION'
  | 'VISITORS'
  | 'OUTPASS'
  | 'MAINTENANCE'
  | 'NOTESHEET'
  | 'REPORTS';

export interface HostelWorkspacePageProps {
  initialTab?: TabType;
  initialRecordId?: string;
}

export const HostelWorkspacePage: React.FC<HostelWorkspacePageProps> = ({ initialTab = 'DASHBOARD', initialRecordId }) => {
  const { user, role, canMutate } = useAuth();

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Master Data States
  const [hostels, setHostels] = useState<HostelMaster[]>([]);
  const [rooms, setRooms] = useState<HostelRoomDetail[]>([]);
  const [allotments, setAllotments] = useState<HostelAllotmentDetail[]>([]);
  const [visitors, setVisitors] = useState<HostelVisitorEntry[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<HostelMaintenanceRequestItem[]>([]);
  const [outpassRequests, setOutpassRequests] = useState<any[]>([]);
  const [notesheets, setNotesheets] = useState<NoteSheet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHostel, setFilterHostel] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals States
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HostelMaintenanceRequestItem | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<HostelVisitorEntry | null>(null);
  const [selectedAllotment, setSelectedAllotment] = useState<HostelAllotmentDetail | null>(null);

  // Student Gate Pass States
  const [selectedGatePassForDoc, setSelectedGatePassForDoc] = useState<StudentGatePass | null>(null);
  const [selectedGatePassForReview, setSelectedGatePassForReview] = useState<{ pass: StudentGatePass; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [selectedGatePassForAudit, setSelectedGatePassForAudit] = useState<StudentGatePass | null>(null);
  const [showSecurityScannerModal, setShowSecurityScannerModal] = useState(false);
  const [gatePassRefreshKey, setGatePassRefreshKey] = useState(0);

  // Forms
  const [hostelForm, setHostelForm] = useState({
    code: '',
    name: '',
    hostelType: 'STANDARD' as 'STANDARD' | 'DELUXE' | 'INTERNATIONAL',
    gender: 'BOYS' as 'BOYS' | 'GIRLS' | 'CO_ED',
    building: '',
    address: '',
    capacity: 100,
    wardenName: '',
    wardenPhone: '',
    wardenEmail: '',
  });

  const [roomForm, setRoomForm] = useState({
    hostelId: '',
    block: '',
    floor: 1,
    roomNumber: '',
    roomType: 'DOUBLE' as 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SEATER',
    capacity: 2,
    facilities: 'Attached Washroom, Fan, Study Desk',
  });

  const [allotForm, setAllotForm] = useState({
    studentId: '',
    hostelId: '',
    roomId: '',
    bedNumber: '',
    remarks: '',
  });

  const [transferForm, setTransferForm] = useState({
    toRoomId: '',
    toBedNumber: '',
    reason: '',
  });

  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    mobileNumber: '',
    idProofType: 'AADHAAR',
    idProofNumber: '',
    studentId: '',
    hostelBlock: '',
    roomNo: '',
    purpose: 'Family Visit',
    expectedExitTime: '18:00',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    studentId: '',
    hostelId: '',
    roomId: '',
    roomNumber: '',
    category: 'ELECTRICAL' as HostelMaintenanceCategory,
    title: '',
    description: '',
    priority: 'MEDIUM' as HostelMaintenancePriority,
    photoUrl: '',
  });

  const [assignForm, setAssignForm] = useState({
    staffId: 'staff-01',
    staffName: 'Ramesh Sharma (Senior Electrician)',
    priority: 'MEDIUM' as HostelMaintenancePriority,
    remarks: '',
  });

  const [holdReason, setHoldReason] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // Report Modal / Type
  const [selectedReportType, setSelectedReportType] = useState('HOSTEL_OCCUPANCY');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      setHostels(db.getHostels());
      setRooms(db.getHostelRoomDetails());
      setAllotments(db.getHostelAllotments());
      setVisitors(db.getHostelVisitorEntries(undefined, user, role));
      setMaintenanceRequests(db.getHostelMaintenanceRequests(undefined, user, role));
      setStudents(db.getStudents());
      setNotesheets(db.getNoteSheets({ department: 'HOSTEL' } as any));
      // Outpasses mock
      setOutpassRequests([
        {
          id: 'out-1',
          outpassNo: 'OUT-2026-001092',
          studentName: 'Aarav Patel',
          enrollmentNo: '24SSIU01001',
          hostelName: 'Vivekananda Boys Hostel',
          roomNo: '101',
          fromDate: '2026-08-20',
          toDate: '2026-08-22',
          destination: 'Ahmedabad (Home Visit)',
          purpose: 'Sister Marriage Ceremony',
          guardianContact: '+91 9825012345',
          status: 'PENDING',
        },
        {
          id: 'out-2',
          outpassNo: 'OUT-2026-001093',
          studentName: 'Priya Mehta',
          enrollmentNo: '24SSIU01002',
          hostelName: 'Gargi Girls Hostel',
          roomNo: '201',
          fromDate: '2026-08-18',
          toDate: '2026-08-19',
          destination: 'Vadodara',
          purpose: 'Family Weekend Function',
          guardianContact: '+91 9825067890',
          status: 'APPROVED',
        },
      ]);
    } catch (err: any) {
      console.error('Failed to load hostel data', err);
    }
  };

  // Deep-link Auto-Open Exact Hostel Record
  useEffect(() => {
    if (initialRecordId) {
      const ticketMatch = maintenanceRequests.find(m => m.id === initialRecordId || m.requestNo === initialRecordId);
      if (ticketMatch) {
        setSelectedTicket(ticketMatch);
        setActiveTab('MAINTENANCE');
        return;
      }
      const allotMatch = allotments.find(a => a.id === initialRecordId || a.enrollmentNo === initialRecordId);
      if (allotMatch) {
        setSelectedAllotment(allotMatch);
        setActiveTab('ALLOCATION');
        return;
      }
      const visitorMatch = visitors.find(v => v.id === initialRecordId || v.passNumber === initialRecordId);
      if (visitorMatch) {
        setSelectedVisitor(visitorMatch);
        setActiveTab('VISITORS');
        return;
      }
    }
  }, [initialRecordId, maintenanceRequests, allotments, visitors]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // KPIs
  const kpis = useMemo(() => {
    return db.getHostelDashboardKPIs();
  }, [hostels, rooms, allotments, maintenanceRequests, visitors]);

  // Handlers for Hostel Master
  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.createHostel(hostelForm, user);
      showToast('success', `Hostel ${hostelForm.name} registered successfully!`);
      setShowHostelModal(false);
      setHostelForm({
        code: '',
        name: '',
        hostelType: 'STANDARD',
        gender: 'BOYS',
        building: '',
        address: '',
        capacity: 100,
        wardenName: '',
        wardenPhone: '',
        wardenEmail: '',
      });
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create hostel.');
    }
  };

  // Handlers for Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.createHostelRoomDetail(roomForm, user);
      showToast('success', `Room ${roomForm.roomNumber} added successfully!`);
      setShowRoomModal(false);
      setRoomForm({
        hostelId: '',
        block: '',
        floor: 1,
        roomNumber: '',
        roomType: 'DOUBLE',
        capacity: 2,
        facilities: 'Attached Washroom, Fan, Study Desk',
      });
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add room.');
    }
  };

  // Handlers for Allocation
  const handleAllotBed = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.allocateHostelBed(
        {
          studentId: allotForm.studentId,
          hostelId: allotForm.hostelId,
          roomId: allotForm.roomId,
          bedNumber: allotForm.bedNumber,
          remarks: allotForm.remarks,
        },
        user
      );
      showToast('success', 'Bed allocated successfully!');
      setShowAllotModal(false);
      setAllotForm({ studentId: '', hostelId: '', roomId: '', bedNumber: '', remarks: '' });
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Allocation failed.');
    }
  };

  const handleVacateBed = (allotmentId: string) => {
    if (!window.confirm('Are you sure you want to vacate this bed allocation?')) return;
    try {
      db.vacateHostelBed(allotmentId, 'Vacated at end of semester/request', user);
      showToast('success', 'Bed vacated and status updated.');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to vacate bed.');
    }
  };

  // Handlers for Maintenance Workflow
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentId = maintenanceForm.studentId || user?.id || students[0]?.id;
      db.createHostelMaintenanceRequest(
        {
          ...maintenanceForm,
          studentId,
        },
        user
      );
      showToast('success', 'Maintenance request lodged successfully!');
      setShowMaintenanceModal(false);
      setMaintenanceForm({
        studentId: '',
        hostelId: '',
        roomId: '',
        roomNumber: '',
        category: 'ELECTRICAL',
        title: '',
        description: '',
        priority: 'MEDIUM',
        photoUrl: '',
      });
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit request.');
    }
  };

  const handleAssignStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      db.assignHostelMaintenanceRequest(selectedTicket.id, assignForm, user);
      showToast('success', `Ticket assigned to ${assignForm.staffName}.`);
      setShowAssignModal(false);
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Assignment failed.');
    }
  };

  const handleStartWork = (ticketId: string) => {
    try {
      db.startHostelMaintenanceWork(ticketId, user);
      showToast('success', 'Work started on maintenance request.');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to start work.');
    }
  };

  const handleHoldTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !holdReason.trim()) return;
    try {
      db.holdHostelMaintenanceRequest(selectedTicket.id, holdReason, user);
      showToast('success', 'Ticket placed on hold.');
      setShowHoldModal(false);
      setHoldReason('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Action failed.');
    }
  };

  const handleResolveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !resolutionDetails.trim()) return;
    try {
      db.resolveHostelMaintenanceRequest(
        selectedTicket.id,
        {
          resolutionDetails,
          resolvedPhotoUrl,
        },
        user
      );
      showToast('success', 'Ticket marked as resolved. Student notified.');
      setShowResolveModal(false);
      setResolutionDetails('');
      setResolvedPhotoUrl('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to resolve ticket.');
    }
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      db.confirmHostelMaintenanceResolution(
        selectedTicket.id,
        {
          rating: feedbackRating,
          feedback: feedbackComments,
        },
        user
      );
      showToast('success', 'Resolution confirmed and ticket closed. Thank you for your feedback!');
      setShowConfirmModal(false);
      setFeedbackComments('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Confirmation failed.');
    }
  };

  const handleReopenTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reopenReason.trim()) return;
    try {
      db.reopenHostelMaintenanceRequest(selectedTicket.id, reopenReason, user);
      showToast('success', 'Ticket reopened and routed back to Maintenance Head.');
      setShowReopenModal(false);
      setReopenReason('');
      loadAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reopen ticket.');
    }
  };

  // Visitor Quick Actions
  const handleVisitorCheckIn = (id: string) => {
    db.markVisitorInside(id, user);
    showToast('success', 'Visitor checked in successfully.');
    loadAllData();
  };

  const handleVisitorCheckOut = (id: string) => {
    db.markVisitorExit(id, user);
    showToast('success', 'Visitor checked out successfully.');
    loadAllData();
  };

  // Report Export
  const handleExportReport = () => {
    const reportData = db.getHostelReportData(selectedReportType, { hostelId: filterHostel }, user);
    if (!reportData || reportData.length === 0) {
      showToast('error', 'No data found to export.');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const rows = reportData.map((item: any) => headers.map((h) => item[h]));
    exportToExcel(
      `Hostel_${selectedReportType}_Report`,
      headers.map((h) => h.toUpperCase()),
      rows,
      { instituteName: 'SSIU University', departmentName: 'Hostel & Residence Services' },
      { name: user?.name, role: role || 'HOSTEL_ADMIN' }
    );
    showToast('success', 'Report downloaded successfully!');
  };

  // Filtered maintenance list
  const filteredMaintenance = useMemo(() => {
    let list = [...maintenanceRequests];
    if (filterHostel !== 'ALL') list = list.filter((m) => m.hostelId === filterHostel);
    if (filterCategory !== 'ALL') list = list.filter((m) => m.category === filterCategory);
    if (filterPriority !== 'ALL') list = list.filter((m) => m.priority === filterPriority);
    if (filterStatus !== 'ALL') list = list.filter((m) => m.status === filterStatus);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.requestNo.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.studentName.toLowerCase().includes(q) ||
          m.enrollmentNo.toLowerCase().includes(q) ||
          (m.assignedToStaffName && m.assignedToStaffName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [maintenanceRequests, filterHostel, filterCategory, filterPriority, filterStatus, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-indigo-950/40 p-6 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Hostel Administration & Residence Workspace
              </h1>
              <p className="text-sm text-slate-400">
                Centralized Hostel Operations, Room Allocation, Visitor Desk, Notesheet & Maintenance SLA Engine
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-600/20 transition-all"
          >
            <Wrench className="w-4 h-4" />
            Log Maintenance
          </button>
          <button
            onClick={() => setShowAllotModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Allocate Bed
          </button>
          <button
            onClick={() => setShowVisitorModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium border border-slate-600/80 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            Visitor Pass
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
          { id: 'STUDENTS', label: 'Students', icon: Users },
          { id: 'HOSTELS', label: 'Hostels', icon: Building },
          { id: 'ROOMS', label: 'Rooms', icon: Home },
          { id: 'ALLOCATION', label: 'Room Allocation', icon: Bed },
          { id: 'VISITORS', label: 'Visitors', icon: UserCheck },
          { id: 'OUTPASS', label: 'Leave/Outpass', icon: LogOut },
          { id: 'MAINTENANCE', label: 'Maintenance Requests', icon: Wrench, count: kpis.pendingMaintenance },
          { id: 'NOTESHEET', label: 'Notesheet', icon: FileText },
          { id: 'REPORTS', label: 'Reports', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Hostels</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">{kpis.totalHostels}</span>
                <Building className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-500">{kpis.totalRooms} Rooms Total</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bed Capacity</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400">{kpis.totalCapacity}</span>
                <Bed className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500">{kpis.availableBeds} Available Beds</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-cyan-400">{kpis.occupancyRate}</span>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500">{kpis.occupiedBeds} Students Active</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Visitors</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-violet-400">{kpis.currentlyInside}</span>
                <UserCheck className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-xs text-slate-500">{kpis.visitorsToday} Today Total</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending MNT</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-400">{kpis.pendingMaintenance}</span>
                <Wrench className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-xs text-amber-400/80">{kpis.urgentMaintenance} Urgent Priority</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue SLA</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${kpis.overdueMaintenance > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {kpis.overdueMaintenance}
                </span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-xs text-rose-400/80">Requires Immediate Action</p>
            </div>
          </div>

          {/* Quick Overdue Alert Panel */}
          {kpis.overdueMaintenance > 0 && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-200">
                    {kpis.overdueMaintenance} Maintenance Ticket(s) Exceeded Resolution SLA!
                  </h4>
                  <p className="text-xs text-rose-300/80">
                    Overdue tickets have breached standard university turn-around times.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFilterStatus('ALL');
                  setActiveTab('MAINTENANCE');
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-all"
              >
                Inspect Overdue
              </button>
            </div>
          )}

          {/* Overview Grids: Recent Maintenance & Active Visitors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Maintenance Requests */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Active Maintenance Tickets
                </h3>
                <button
                  onClick={() => setActiveTab('MAINTENANCE')}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  View All ({maintenanceRequests.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {maintenanceRequests.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-300 font-bold">{ticket.requestNo}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                            ticket.priority === 'URGENT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : ticket.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-slate-400">· {ticket.category}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200">{ticket.title}</p>
                      <p className="text-xs text-slate-500">
                        {ticket.hostelName} (Room {ticket.roomNumber}) · {ticket.studentName}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {ticket.status}
                      </span>
                      {ticket.assignedToStaffName && (
                        <p className="text-[11px] text-slate-400">👤 {ticket.assignedToStaffName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Visitors */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Recent Visitor Entries
                </h3>
                <button
                  onClick={() => setActiveTab('VISITORS')}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  View All ({visitors.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {visitors.slice(0, 4).map((vis) => (
                  <div
                    key={vis.id}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-300 font-bold">{vis.passNumber}</span>
                        <span className="text-xs font-semibold text-slate-200">{vis.visitorName}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Visiting: <span className="text-slate-200">{vis.studentName}</span> ({vis.hostelBlock} - {vis.roomNo})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        In: {vis.entryDate} {vis.entryTime} · {vis.purpose}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          vis.status === 'INSIDE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {vis.status}
                      </span>
                      {vis.status === 'INSIDE' && (
                        <div>
                          <button
                            onClick={() => handleVisitorCheckOut(vis.id)}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Mark Exit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search resident student by name, enrollment no, room or hostel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterHostel}
                onChange={(e) => setFilterHostel(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              >
                <option value="ALL">All Hostels</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Enrollment No</th>
                  <th className="px-4 py-3.5">Department / Program</th>
                  <th className="px-4 py-3.5">Hostel & Room</th>
                  <th className="px-4 py-3.5">Bed No</th>
                  <th className="px-4 py-3.5">Allotted Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allotments
                  .filter((a) => filterHostel === 'ALL' || a.hostelId === filterHostel)
                  .filter(
                    (a) =>
                      !searchTerm ||
                      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/60 transition-all">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {a.studentName[0]}
                        </div>
                        {a.studentName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{a.enrollmentNo}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {a.departmentName} · {a.programName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200">{a.hostelName}</span>
                        <p className="text-xs text-slate-400">Room {a.roomNumber}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{a.bedNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{a.allottedDate.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleVacateBed(a.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all"
                          >
                            Vacate Bed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. HOSTELS */}
      {activeTab === 'HOSTELS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">University Hostel Master List</h3>
            <button
              onClick={() => setShowHostelModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add New Hostel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {hostels.map((h) => {
              const hRooms = rooms.filter((r) => r.hostelId === h.id);
              const hAllotments = allotments.filter((a) => a.hostelId === h.id && a.status === 'ACTIVE');
              return (
                <div
                  key={h.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4 hover:border-indigo-500/40 transition-all shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-400 font-mono font-bold">
                      {h.code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        h.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{h.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {h.building || 'Main Block'} · {h.gender}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 rounded-xl text-center">
                    <div>
                      <p className="text-xs text-slate-400">Rooms</p>
                      <p className="text-sm font-bold text-white">{hRooms.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Capacity</p>
                      <p className="text-sm font-bold text-emerald-400">{h.capacity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Occupied</p>
                      <p className="text-sm font-bold text-cyan-400">{hAllotments.length}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-700/60 pt-3">
                    <p className="text-slate-300 font-medium">👤 Warden: {h.wardenName || 'Not Assigned'}</p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {h.wardenPhone || 'N/A'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {h.wardenEmail || 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. ROOMS */}
      {activeTab === 'ROOMS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <select
                value={filterHostel}
                onChange={(e) => setFilterHostel(e.target.value)}
                className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              >
                <option value="ALL">All Hostels ({hostels.length})</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setRoomForm((prev) => ({ ...prev, hostelId: hostels[0]?.id || '' }));
                setShowRoomModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rooms
              .filter((r) => filterHostel === 'ALL' || r.hostelId === filterHostel)
              .map((room) => {
                const isFull = room.occupiedBeds >= room.capacity;
                return (
                  <div
                    key={room.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isFull
                        ? 'bg-slate-800/40 border-slate-700/60'
                        : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white">Room {room.roomNumber}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isFull
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isFull ? 'FULL' : 'AVAILABLE'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-0.5">
                      <p>{room.hostelName}</p>
                      <p>
                        {room.block} · Floor {room.floor} · {room.roomType}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-slate-400">Beds:</span>
                      <span className="font-semibold text-slate-200">
                        {room.occupiedBeds} / {room.capacity} Occupied
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate" title={room.facilities}>
                      {room.facilities}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ROOM ALLOCATION */}
      {activeTab === 'ALLOCATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Student Bed Allotment & Room Register</h3>
            <button
              onClick={() => {
                setAllotForm({
                  studentId: students[0]?.id || '',
                  hostelId: hostels[0]?.id || '',
                  roomId: rooms[0]?.id || '',
                  bedNumber: '',
                  remarks: '',
                });
                setShowAllotModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              New Bed Allotment
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Allotment No</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Enrollment No</th>
                  <th className="px-4 py-3.5">Hostel</th>
                  <th className="px-4 py-3.5">Room</th>
                  <th className="px-4 py-3.5">Bed</th>
                  <th className="px-4 py-3.5">Allotted Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allotments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/60 transition-all">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300 font-bold">{a.allotmentNo}</td>
                    <td className="px-4 py-3 font-medium text-white">{a.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{a.enrollmentNo}</td>
                    <td className="px-4 py-3 text-slate-200">{a.hostelName}</td>
                    <td className="px-4 py-3 text-slate-300">Room {a.roomNumber}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{a.bedNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{a.allottedDate.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleVacateBed(a.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all"
                        >
                          Vacate Bed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. VISITORS */}
      {activeTab === 'VISITORS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search visitor pass, visitor name, phone, student host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowVisitorModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Register Visitor
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Pass Number</th>
                  <th className="px-4 py-3.5">Visitor</th>
                  <th className="px-4 py-3.5">Student Host</th>
                  <th className="px-4 py-3.5">Hostel & Room</th>
                  <th className="px-4 py-3.5">Entry Time</th>
                  <th className="px-4 py-3.5">Exit Time</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visitors
                  .filter(
                    (v) =>
                      !searchTerm ||
                      v.passNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.studentName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/60 transition-all">
                      <td className="px-4 py-3 font-mono text-xs text-emerald-300 font-bold">{v.passNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{v.visitorName}</div>
                        <p className="text-xs text-slate-400">{v.mobileNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">{v.studentName}</div>
                        <p className="text-xs text-slate-400">{v.enrollmentNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300">{v.hostelBlock}</span>
                        <p className="text-xs text-slate-400">Room {v.roomNo}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {v.entryDate} {v.entryTime}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {v.actualExitTime ? `${v.actualExitDate || v.entryDate} ${v.actualExitTime}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            v.status === 'INSIDE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.status === 'INSIDE' && (
                          <button
                            onClick={() => handleVisitorCheckOut(v.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all"
                          >
                            Mark Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. LEAVE/OUTPASS & STUDENT GATE PASSES */}
      {activeTab === 'OUTPASS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-400" />
                Student Gate Pass &amp; Campus Outpass Requests
              </h3>
              <p className="text-xs text-slate-400">Chief Warden clearance &amp; Main Gate security authorization ledger</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSecurityScannerModal(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all"
              >
                <ShieldCheck size={15} /> Campus Gate Security Checkpoint
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Gate Pass No</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Hostel &amp; Room</th>
                  <th className="px-4 py-3.5">Outing Date</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5">Purpose &amp; Destination</th>
                  <th className="px-4 py-3.5">Guardian Contact</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Warden Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studentGatePassService.getGatePasses().map((out) => (
                  <tr key={out.id} className="hover:bg-slate-800/60 transition-all">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300 font-bold">{out.gatePassNo}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{out.studentName}</div>
                      <div className="text-xs font-mono text-slate-400">{out.enrollmentNo}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {out.hostelName} (Room {out.roomNo}, {out.bedNo})
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{out.outingDate}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <div>Out: <strong className="text-emerald-400">{out.expectedOutTime}</strong></div>
                      <div>Return: <strong className="text-rose-400">{out.expectedReturnTime}</strong></div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium">{out.purpose}</p>
                      <p className="text-xs text-slate-400">📍 {out.destination}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <div>{out.parentGuardianName}</div>
                      <div className="text-slate-400">{out.parentGuardianMobile}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          out.status === 'APPROVED' || out.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : out.status === 'OUT'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : out.status === 'RETURNED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : out.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {out.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setSelectedGatePassForDoc(out)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all"
                          title="View Official Gate Pass & QR Code"
                        >
                          View Pass
                        </button>

                        {out.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setSelectedGatePassForReview({ pass: out, action: 'APPROVE' })}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedGatePassForReview({ pass: out, action: 'REJECT' })}
                              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedGatePassForAudit(out)}
                          className="text-xs text-slate-400 hover:text-slate-300 px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg"
                          title="View Audit Trail"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. MAINTENANCE REQUESTS */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-4">
          {/* Maintenance Filters & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket number, title, student, room, assigned technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="ALL">All Categories</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="FURNITURE">Furniture</option>
                <option value="AC_FAN">AC / Fan</option>
                <option value="WATER">Water</option>
                <option value="CLEANING">Cleaning</option>
                <option value="INTERNET">Internet</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent (4h SLA)</option>
                <option value="HIGH">High (24h SLA)</option>
                <option value="MEDIUM">Medium (48h SLA)</option>
                <option value="LOW">Low (72h SLA)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
              </select>

              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Log Ticket
              </button>
            </div>
          </div>

          {/* Maintenance Ticket List */}
          <div className="space-y-3">
            {filteredMaintenance.map((ticket) => {
              const isOverdue =
                !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status) &&
                ticket.slaDueDate &&
                new Date(ticket.slaDueDate) < new Date();

              return (
                <div
                  key={ticket.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isOverdue
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 shadow-xl'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-indigo-400">{ticket.requestNo}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          ticket.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : ticket.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}
                      >
                        {ticket.priority} Priority ({ticket.slaHours}h SLA)
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {ticket.category}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                          ticket.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : ticket.status === 'ON_HOLD'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : ticket.status === 'REOPENED'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : ticket.status === 'CLOSED'
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{ticket.title}</h4>
                    <p className="text-sm text-slate-300">{ticket.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-500">Student Host:</span>
                      <p className="font-semibold text-slate-200">
                        {ticket.studentName} ({ticket.enrollmentNo})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Location:</span>
                      <p className="font-semibold text-slate-200">
                        {ticket.hostelName} · Room {ticket.roomNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned Technician:</span>
                      <p className="font-semibold text-indigo-300">
                        {ticket.assignedToStaffName || 'Unassigned (Awaiting Head)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">SLA Due Date:</span>
                      <p className={`font-semibold ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                        {ticket.slaDueDate ? ticket.slaDueDate.slice(0, 16).replace('T', ' ') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {ticket.holdReason && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                      <strong>Hold Reason:</strong> {ticket.holdReason}
                    </div>
                  )}

                  {ticket.resolutionDetails && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1">
                      <strong>Resolution Details:</strong> {ticket.resolutionDetails}
                      {ticket.studentRating && (
                        <div className="flex items-center gap-1 mt-1 text-amber-400">
                          <span>Student Rating:</span>
                          {[...Array(ticket.studentRating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                          <span className="text-slate-400 ml-2">({ticket.studentFeedback})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar for Ticket Workflow */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Reported: {ticket.createdAt.slice(0, 10)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Maintenance Head: Assign Staff */}
                      {['SUBMITTED', 'REOPENED'].includes(ticket.status) && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowAssignModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Assign Staff
                        </button>
                      )}

                      {/* Maintenance Staff: Start Work */}
                      {ticket.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleStartWork(ticket.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Start Work
                        </button>
                      )}

                      {/* Maintenance Staff: Put on Hold */}
                      {ticket.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowHoldModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          Put On Hold
                        </button>
                      )}

                      {/* Maintenance Staff: Resolve */}
                      {['IN_PROGRESS', 'ON_HOLD', 'ASSIGNED'].includes(ticket.status) && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowResolveModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                      )}

                      {/* Student: Confirm or Reopen */}
                      {ticket.status === 'RESOLVED' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowConfirmModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm Resolution
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowReopenModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reopen Ticket
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. NOTESHEET */}
      {activeTab === 'NOTESHEET' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Hostel Office Notesheet Workflows</h3>
              <p className="text-xs text-slate-400">
                Official institutional Notesheets for Hostel maintenance, infrastructure procurement & wardenship
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60 bg-slate-800/40 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Note Sheet No</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Created By</th>
                  <th className="px-4 py-3.5">Current Office</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {notesheets.map((ns) => (
                  <tr key={ns.id} className="hover:bg-slate-800/60 transition-all">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300 font-bold">{ns.noteSheetNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{ns.subject}</td>
                    <td className="px-4 py-3 text-slate-300">{ns.creatorName}</td>
                    <td className="px-4 py-3 text-indigo-400 font-medium">{ns.currentOffice}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          ns.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ns.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{ns.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 10. REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Hostel Management & Maintenance Reports</h3>
              <p className="text-xs text-slate-400">
                Generate formatted reports for institutional auditing, UGC/NAAC compliance, and warden oversight
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 font-medium"
              >
                <option value="HOSTEL_OCCUPANCY">Hostel Occupancy Report</option>
                <option value="ROOM_OCCUPANCY">Room Occupancy & Capacity Report</option>
                <option value="STUDENT_ALLOCATION">Student Bed Allocation Report</option>
                <option value="MAINTENANCE_REQUEST_REPORT">Maintenance Requests Master Report</option>
                <option value="OVERDUE_REQUESTS">Overdue Maintenance SLA Report</option>
                <option value="VISITOR_REPORT">Hostel Visitor Log Report</option>
              </select>

              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Live Preview of Selected Report */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-5 space-y-4">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Report Live Data Preview ({selectedReportType.replace(/_/g, ' ')})
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/60">
              {(() => {
                const previewData = db.getHostelReportData(selectedReportType, { hostelId: filterHostel }, user);
                if (!previewData || previewData.length === 0) {
                  return <div className="p-8 text-center text-slate-500">No records found for this report.</div>;
                }
                const headers = Object.keys(previewData[0]);
                return (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase font-semibold border-b border-slate-700">
                      <tr>
                        {headers.map((h) => (
                          <th key={h} className="px-3.5 py-3">
                            {h.replace(/([A-Z])/g, ' $1').toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {previewData.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          {headers.map((h) => (
                            <td key={h} className="px-3.5 py-2.5 text-slate-300">
                              {String(row[h])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Modal: Add Hostel */}
      {showHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Hostel Master</h3>
              <button onClick={() => setShowHostelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHostel} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Hostel Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BH-2"
                    value={hostelForm.code}
                    onChange={(e) => setHostelForm({ ...hostelForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Gender / Category *</label>
                  <select
                    value={hostelForm.gender}
                    onChange={(e: any) => setHostelForm({ ...hostelForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  >
                    <option value="BOYS">Boys Hostel</option>
                    <option value="GIRLS">Girls Hostel</option>
                    <option value="CO_ED">Co-Ed / International</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Hostel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sardar Patel Boys Hostel"
                  value={hostelForm.name}
                  onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Building / Block</label>
                  <input
                    type="text"
                    placeholder="Block D"
                    value={hostelForm.building}
                    onChange={(e) => setHostelForm({ ...hostelForm, building: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Total Capacity (Beds) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hostelForm.capacity}
                    onChange={(e) => setHostelForm({ ...hostelForm, capacity: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Warden Name</label>
                  <input
                    type="text"
                    placeholder="Dr. Rajesh Patel"
                    value={hostelForm.wardenName}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Warden Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={hostelForm.wardenPhone}
                    onChange={(e) => setHostelForm({ ...hostelForm, wardenPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHostelModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Create Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Add Room */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Room to Hostel</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Hostel *</label>
                <select
                  required
                  value={roomForm.hostelId}
                  onChange={(e) => setRoomForm({ ...roomForm, hostelId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Room No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 105"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Floor</label>
                  <input
                    type="number"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Capacity (Beds) *</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Facilities</label>
                <input
                  type="text"
                  placeholder="Attached Washroom, Study Table, AC, Balcony"
                  value={roomForm.facilities}
                  onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Allocate Bed */}
      {showAllotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Allot Bed to Student</h3>
              <button onClick={() => setShowAllotModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllotBed} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Select Student *</label>
                <select
                  required
                  value={allotForm.studentId}
                  onChange={(e) => setAllotForm({ ...allotForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollmentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Hostel *</label>
                <select
                  required
                  value={allotForm.hostelId}
                  onChange={(e) => {
                    const hId = e.target.value;
                    const r = rooms.find((rm) => rm.hostelId === hId);
                    setAllotForm({ ...allotForm, hostelId: hId, roomId: r?.id || '' });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Room *</label>
                <select
                  required
                  value={allotForm.roomId}
                  onChange={(e) => setAllotForm({ ...allotForm, roomId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  {rooms
                    .filter((r) => r.hostelId === allotForm.hostelId)
                    .map((r) => (
                      <option key={r.id} value={r.id} disabled={r.occupiedBeds >= r.capacity}>
                        Room {r.roomNumber} ({r.occupiedBeds}/{r.capacity} beds occupied){' '}
                        {r.occupiedBeds >= r.capacity ? '— FULL' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Remarks</label>
                <input
                  type="text"
                  placeholder="Semester 4 Regular Allotment"
                  value={allotForm.remarks}
                  onChange={(e) => setAllotForm({ ...allotForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAllotModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm Allotment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Log Maintenance Request */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Log Hostel Maintenance Request
              </h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Hostel *</label>
                  <select
                    required
                    value={maintenanceForm.hostelId}
                    onChange={(e) => {
                      const hId = e.target.value;
                      const r = rooms.find((rm) => rm.hostelId === hId);
                      setMaintenanceForm({
                        ...maintenanceForm,
                        hostelId: hId,
                        roomId: r?.id || '',
                        roomNumber: r?.roomNumber || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  >
                    <option value="">Select Hostel</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101"
                    value={maintenanceForm.roomNumber}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Category *</label>
                  <select
                    value={maintenanceForm.category}
                    onChange={(e: any) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  >
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="AC_FAN">AC / Fan</option>
                    <option value="WATER">Water</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="INTERNET">Internet</option>
                    <option value="ROOM">Room</option>
                    <option value="WASHROOM">Washroom</option>
                    <option value="COMMON_AREA">Common Area</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Priority & SLA *</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e: any) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  >
                    <option value="URGENT">Urgent (4 Hours SLA)</option>
                    <option value="HIGH">High (24 Hours SLA)</option>
                    <option value="MEDIUM">Medium (48 Hours SLA)</option>
                    <option value="LOW">Low (72 Hours SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceiling Fan Regulator Broken"
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide precise details of the issue..."
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Photo Proof / Attachment URL</label>
                <input
                  type="text"
                  placeholder="https://storage.university.edu/photos/broken-fan.jpg"
                  value={maintenanceForm.photoUrl}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-600/20"
                >
                  Submit Maintenance Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Assign Maintenance Staff */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Assign Maintenance Staff</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Technician / Staff Member *</label>
                <select
                  value={assignForm.staffName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const id = name.includes('Plumber') ? 'staff-02' : 'staff-01';
                    setAssignForm({ ...assignForm, staffName: name, staffId: id });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  <option value="Ramesh Sharma (Senior Electrician)">Ramesh Sharma (Senior Electrician)</option>
                  <option value="Mohan Lal (Plumbing Technician)">Mohan Lal (Plumbing Technician)</option>
                  <option value="Sunil Verma (HVAC & AC Technician)">Sunil Verma (HVAC & AC Technician)</option>
                  <option value="Kishore Dave (Carpenter & Furniture)">Kishore Dave (Carpenter & Furniture)</option>
                  <option value="Prakash Jadhav (Network & Internet)">Prakash Jadhav (Network & Internet)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Review Priority & SLA</label>
                <select
                  value={assignForm.priority}
                  onChange={(e: any) => setAssignForm({ ...assignForm, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  <option value="URGENT">Urgent (4 Hours)</option>
                  <option value="HIGH">High (24 Hours)</option>
                  <option value="MEDIUM">Medium (48 Hours)</option>
                  <option value="LOW">Low (72 Hours)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Head Remarks / Instructions</label>
                <input
                  type="text"
                  placeholder="Inspect today before 4 PM"
                  value={assignForm.remarks}
                  onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
                >
                  Assign Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Put On Hold */}
      {showHoldModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                Put Request On Hold
              </h3>
              <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHoldTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Mandatory Hold Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Awaiting spare parts from store / Vendor technician scheduled tomorrow"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Resolve Ticket */}
      {showResolveModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Resolve Maintenance Request
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Resolution Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Replaced fan capacitor and balanced blades. Tested working fine."
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Completion Proof Photo URL</label>
                <input
                  type="text"
                  placeholder="https://storage.university.edu/photos/fixed-fan.jpg"
                  value={resolvedPhotoUrl}
                  onChange={(e) => setResolvedPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Student Confirm Resolution */}
      {showConfirmModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Confirm Resolution & Rate Service</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Satisfaction Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1.5 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating ? 'text-amber-400 fill-current' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Feedback / Comments</label>
                <input
                  type="text"
                  placeholder="Quick response and excellent work."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal: Reopen Ticket */}
      {showReopenModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-300 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                Reopen Unresolved Ticket
              </h3>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopenTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Mandatory Reopen Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. The fan stopped working again after 2 hours / Noise still present"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: Register Visitor Pass */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Issue Visitor Gate Pass
              </h3>
              <button onClick={() => setShowVisitorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const st = students.find((s) => s.id === visitorForm.studentId);
                db.createHostelVisitorEntry(
                  {
                    visitorName: visitorForm.visitorName,
                    mobileNumber: visitorForm.mobileNumber,
                    idProofType: visitorForm.idProofType as any,
                    idProofNumber: visitorForm.idProofNumber,
                    studentId: visitorForm.studentId,
                    studentName: st?.name || 'Student Host',
                    enrollmentNumber: st?.enrollmentNo || '26SSIU001',
                    hostelBlock: visitorForm.hostelBlock || 'Block A (Boys Hostel)',
                    roomNo: visitorForm.roomNo || '101',
                    purpose: visitorForm.purpose,
                    expectedExitTime: visitorForm.expectedExitTime,
                    status: 'INSIDE',
                  },
                  user
                );
                showToast('success', 'Visitor pass generated and recorded inside hostel!');
                setShowVisitorModal(false);
                setVisitorForm({
                  visitorName: '',
                  mobileNumber: '',
                  idProofType: 'AADHAAR',
                  idProofNumber: '',
                  studentId: '',
                  hostelBlock: '',
                  roomNo: '',
                  purpose: 'Family Visit',
                  expectedExitTime: '18:00',
                });
                loadAllData();
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Visitor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Mehta"
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9825012345"
                    value={visitorForm.mobileNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">ID Proof Type *</label>
                  <select
                    value={visitorForm.idProofType}
                    onChange={(e) => setVisitorForm({ ...visitorForm, idProofType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">ID Proof Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876-5432-1098"
                    value={visitorForm.idProofNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, idProofNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Student Host *</label>
                <select
                  required
                  value={visitorForm.studentId}
                  onChange={(e) => setVisitorForm({ ...visitorForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollmentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Hostel Block</label>
                  <input
                    type="text"
                    placeholder="Block A (Boys Hostel)"
                    value={visitorForm.hostelBlock}
                    onChange={(e) => setVisitorForm({ ...visitorForm, hostelBlock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Room Number</label>
                  <input
                    type="text"
                    placeholder="101"
                    value={visitorForm.roomNo}
                    onChange={(e) => setVisitorForm({ ...visitorForm, roomNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVisitorModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Issue Pass & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFICIAL STUDENT GATE PASS DOCUMENT VIEW ── */}
      {selectedGatePassForDoc && (
        <StudentGatePassModal
          isOpen={Boolean(selectedGatePassForDoc)}
          onClose={() => setSelectedGatePassForDoc(null)}
          gatePass={selectedGatePassForDoc}
          canApprove={true}
          onApprove={(id) => {
            setSelectedGatePassForReview({ pass: selectedGatePassForDoc, action: 'APPROVE' });
            setSelectedGatePassForDoc(null);
          }}
          onReject={(id) => {
            setSelectedGatePassForReview({ pass: selectedGatePassForDoc, action: 'REJECT' });
            setSelectedGatePassForDoc(null);
          }}
          canRecordGate={true}
          onMarkOut={(id) => {
            try {
              const updated = studentGatePassService.recordGatePassOut(id, user);
              setSelectedGatePassForDoc(updated);
              setGatePassRefreshKey(prev => prev + 1);
              showToast('success', `Student OUT recorded at Gate.`);
            } catch (err: any) {
              showToast('error', err.message);
            }
          }}
          onMarkIn={(id) => {
            try {
              const updated = studentGatePassService.recordGatePassIn(id, user);
              setSelectedGatePassForDoc(updated);
              setGatePassRefreshKey(prev => prev + 1);
              showToast('success', `Student RETURN (IN) recorded at Gate.`);
            } catch (err: any) {
              showToast('error', err.message);
            }
          }}
        />
      )}

      {/* ── MODAL: WARDEN APPROVAL / REJECTION ── */}
      {selectedGatePassForReview && (
        <WardenGatePassReviewModal
          isOpen={Boolean(selectedGatePassForReview)}
          onClose={() => setSelectedGatePassForReview(null)}
          gatePass={selectedGatePassForReview.pass}
          action={selectedGatePassForReview.action}
          user={user}
          onSuccess={(updatedPass) => {
            setGatePassRefreshKey(prev => prev + 1);
            showToast('success', `Gate Pass ${updatedPass.gatePassNo} has been marked as ${updatedPass.status}.`);
          }}
        />
      )}

      {/* ── MODAL: MAIN GATE SECURITY SCANNER & CHECKPOINT ── */}
      {showSecurityScannerModal && (
        <SecurityGatePassScannerModal
          isOpen={showSecurityScannerModal}
          onClose={() => setShowSecurityScannerModal(false)}
          user={user}
          onUpdated={(updated) => {
            setGatePassRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* ── MODAL: GATE PASS AUDIT TRAIL ── */}
      {selectedGatePassForAudit && (
        <GatePassAuditModal
          isOpen={Boolean(selectedGatePassForAudit)}
          onClose={() => setSelectedGatePassForAudit(null)}
          gatePass={selectedGatePassForAudit}
        />
      )}

    </div>
  );
};
