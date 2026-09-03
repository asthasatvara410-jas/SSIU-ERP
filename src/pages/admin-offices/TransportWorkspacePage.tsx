import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import {
  TransportVehicle,
  VehicleType,
  VehicleStatus,
  VehicleDocument,
  VehicleDocumentType,
  BusRoute,
  RouteStop,
  RouteStatus,
  TransportDriver,
  DriverLicenseType,
  DriverStatus,
  DriverDocument,
  DriverDocumentType,
  StudentTransportAllocation,
  TransportRequestItem,
  VehicleMaintenanceItem,
  TransportTripScheduleItem,
  NoteSheet,
  Student,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Bus,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  Edit2,
  Trash2,
  Upload,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Wrench,
  Clock,
  Navigation,
  CheckSquare,
  TrendingUp,
  Activity,
  Layers,
  Phone,
  FileCheck,
  UserCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { exportToExcel } from '../../services/exportService';

export const TransportWorkspacePage: React.FC = () => {
  const { user, role } = useAuth();

  // Active Workspace Tab (12 Modules)
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'VEHICLES'
    | 'DRIVERS'
    | 'VEHICLE_DOCS'
    | 'DRIVER_DOCS'
    | 'ROUTES'
    | 'STOPS'
    | 'STUDENT_ALLOCATION'
    | 'TRIPS'
    | 'MAINTENANCE'
    | 'NOTESHEETS'
    | 'REPORTS'
  >('DASHBOARD');

  // Master Data State
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [allocations, setAllocations] = useState<StudentTransportAllocation[]>([]);
  const [requests, setRequests] = useState<TransportRequestItem[]>([]);
  const [maintenances, setMaintenances] = useState<VehicleMaintenanceItem[]>([]);
  const [trips, setTrips] = useState<TransportTripScheduleItem[]>([]);
  const [notesheets, setNotesheets] = useState<NoteSheet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // ─── FILTERS ───
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilterDays, setDocFilterDays] = useState<'ALL' | '30' | '15' | '7' | 'EXPIRED'>('30');
  const [selectedReportType, setSelectedReportType] = useState<string>('VEHICLE_LIST');

  // ─── MODAL STATES ───
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<TransportVehicle> | null>(null);

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Partial<TransportDriver> | null>(null);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Partial<BusRoute> | null>(null);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    studentId: '',
    routeId: '',
    stopId: '',
    vehicleId: '',
    academicYear: '2026-27',
    remarks: '',
  });

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<VehicleMaintenanceItem>>({
    vehicleId: '',
    issue: '',
    category: 'ENGINE',
    description: '',
    priority: 'NORMAL',
    assignedStaff: 'Vikrambhai Vaghela (Chief Mechanic)',
    estimatedCost: 0,
    notesheetId: '',
    status: 'REPORTED',
  });

  const [showTripModal, setShowTripModal] = useState(false);
  const [tripForm, setTripForm] = useState<Partial<TransportTripScheduleItem>>({
    vehicleId: '',
    routeId: '',
    driverId: '',
    tripDate: new Date().toISOString().split('T')[0],
    shift: 'MORNING',
    startTime: '07:00 AM',
    endTime: '08:30 AM',
    tripType: 'PICKUP',
    status: 'SCHEDULED',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = () => {
    setVehicles(db.getTransportVehicles());
    setDrivers(db.getTransportDrivers());
    setRoutes(db.getBusRoutes());
    setAllocations(db.getStudentTransportAllocations());
    setRequests(db.getTransportRequests());
    setMaintenances(db.getVehicleMaintenances());
    setTrips(db.getTransportTrips());
    setNotesheets(db.getNoteSheets({ department: 'TRANSPORT' } as any));
    setStudents(db.getStudents());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ─── DASHBOARD STATS ───
  const dashboardStats = useMemo(() => {
    return db.getTransportExecutiveDashboardStats();
  }, [vehicles, drivers, routes, allocations]);

  // Expiry counts
  const expirySummary = useMemo(() => {
    let vehDocsExpiring = 0;
    let drvDocsExpiring = 0;
    let expiredTotal = 0;

    const now = new Date().getTime();
    const days30 = 30 * 24 * 60 * 60 * 1000;

    vehicles.forEach((v) => {
      [v.insuranceExpiry, v.fitnessExpiry, v.pollutionExpiry, v.permitExpiry].forEach((dt) => {
        if (dt) {
          const t = new Date(dt).getTime();
          if (t < now) expiredTotal++;
          else if (t <= now + days30) vehDocsExpiring++;
        }
      });
    });

    drivers.forEach((d) => {
      if (d.licenseExpiry) {
        const t = new Date(d.licenseExpiry).getTime();
        if (t < now) expiredTotal++;
        else if (t <= now + days30) drvDocsExpiring++;
      }
    });

    return { vehDocsExpiring, drvDocsExpiring, expiredTotal };
  }, [vehicles, drivers]);

  // ─── HANDLERS ───

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle?.vehicleNumber || !editingVehicle?.makeModel) {
      showToast('error', 'Please provide vehicle registration number and model.');
      return;
    }

    if (editingVehicle.id) {
      db.updateTransportVehicle(editingVehicle.id, editingVehicle, user || undefined);
      showToast('success', 'Vehicle updated successfully.');
    } else {
      db.createTransportVehicle(editingVehicle, user || undefined);
      showToast('success', 'Vehicle registered successfully.');
    }
    setShowVehicleModal(false);
    setEditingVehicle(null);
    loadAllData();
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver?.name || !editingDriver?.licenseNumber) {
      showToast('error', 'Please provide driver name and driving license number.');
      return;
    }

    if (editingDriver.id) {
      db.updateTransportDriver(editingDriver.id, editingDriver, user || undefined);
      showToast('success', 'Driver profile updated.');
    } else {
      db.createTransportDriver(editingDriver, user || undefined);
      showToast('success', 'Driver profile registered.');
    }
    setShowDriverModal(false);
    setEditingDriver(null);
    loadAllData();
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute?.routeNo || !editingRoute?.routeName) {
      showToast('error', 'Please provide Route code and Route name.');
      return;
    }

    if (editingRoute.id) {
      db.updateBusRoute(editingRoute.id, editingRoute, user || undefined);
      showToast('success', 'Route updated.');
    } else {
      db.createBusRoute(editingRoute, user || undefined);
      showToast('success', 'New route registered.');
    }
    setShowRouteModal(false);
    setEditingRoute(null);
    loadAllData();
  };

  const handleAllocateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.studentId || !allocateForm.routeId || !allocateForm.vehicleId) {
      showToast('error', 'Please select student, route, stop, and vehicle.');
      return;
    }

    const res = db.allocateStudentTransport(allocateForm, user || undefined);
    if (!res.success) {
      showToast('error', res.message);
      return;
    }

    showToast('success', res.message);
    setShowAllocateModal(false);
    setAllocateForm({ studentId: '', routeId: '', stopId: '', vehicleId: '', academicYear: '2026-27', remarks: '' });
    loadAllData();
  };

  const handleVacateStudent = (id: string) => {
    if (!window.confirm('Are you sure you want to vacate/cancel this student transport seat?')) return;
    const res = db.vacateStudentTransport(id, 'Seat cancelled by Transport Admin', user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadAllData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.vehicleId || !maintenanceForm.issue) {
      showToast('error', 'Please select vehicle and specify maintenance issue.');
      return;
    }

    db.createVehicleMaintenance(maintenanceForm, user || undefined);
    showToast('success', 'Maintenance record created.');
    setShowMaintenanceModal(false);
    loadAllData();
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.vehicleId || !tripForm.routeId) {
      showToast('error', 'Please select vehicle and route.');
      return;
    }

    db.createTransportTrip(tripForm, user || undefined);
    showToast('success', 'Trip schedule created.');
    setShowTripModal(false);
    loadAllData();
  };

  const handleApproveRequest = (id: string, vehicleId?: string) => {
    const res = db.updateTransportRequestStatus(id, { status: 'APPROVED', vehicleId }, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadAllData();
    }
  };

  const handleRejectRequest = (id: string) => {
    const res = db.updateTransportRequestStatus(id, { status: 'REJECTED' }, user || undefined);
    if (res.success) {
      showToast('success', res.message);
      loadAllData();
    }
  };

  // ─── EXCEL EXPORT HANDLER ───
  const handleExportReports = () => {
    const reportData = (db as any).getTransportReports ? (db as any).getTransportReports(selectedReportType) : [];
    const dateStr = new Date().toISOString().split('T')[0];

    let headers: string[] = [];
    let rows: any[][] = [];

    if (selectedReportType === 'VEHICLE_LIST') {
      headers = ['Vehicle Number', 'Type', 'Model', 'Capacity', 'Insurance Expiry', 'Fitness Expiry', 'Status'];
      rows = vehicles.map((v) => [
        v.vehicleNumber,
        v.vehicleType,
        v.makeModel,
        v.capacity,
        v.insuranceExpiry || 'N/A',
        v.fitnessExpiry || 'N/A',
        v.status,
      ]);
    } else if (selectedReportType === 'DRIVER_LIST') {
      headers = ['Driver Name', 'Mobile', 'License Number', 'License Type', 'Expiry Date', 'Assigned Bus', 'Status'];
      rows = drivers.map((d) => [
        d.name,
        d.mobile,
        d.licenseNumber,
        d.licenseType,
        d.licenseExpiry,
        d.assignedVehicleNumber || 'N/A',
        d.status,
      ]);
    } else if (selectedReportType === 'STUDENT_ALLOCATION') {
      headers = ['Allotment No', 'Student Name', 'Enrollment No', 'Route', 'Stop', 'Bus No', 'Pass No', 'Status'];
      rows = allocations.map((a) => [
        a.allotmentNo,
        a.studentName,
        a.enrollmentNo,
        a.routeName,
        a.stopName,
        a.vehicleNumber,
        a.passNumber,
        a.status,
      ]);
    } else if (selectedReportType === 'VEHICLE_CAPACITY') {
      headers = ['Vehicle Number', 'Capacity', 'Allocated Students', 'Available Seats', 'Load %'];
      rows = vehicles.map((v) => {
        const count = allocations.filter((a) => a.vehicleNumber === v.vehicleNumber && a.status === 'ACTIVE').length;
        const avail = Math.max(0, v.capacity - count);
        const pct = v.capacity > 0 ? ((count / v.capacity) * 100).toFixed(1) + '%' : '0%';
        return [v.vehicleNumber, v.capacity, count, avail, pct];
      });
    } else if (selectedReportType === 'MAINTENANCE_REPORT') {
      headers = ['Maintenance No', 'Vehicle', 'Issue', 'Category', 'Priority', 'Reported Date', 'Cost (₹)', 'Status'];
      rows = maintenances.map((m) => [
        m.maintenanceNo,
        m.vehicleNumber,
        m.issue,
        m.category,
        m.priority,
        m.reportedDate,
        m.actualCost || m.estimatedCost || 0,
        m.status,
      ]);
    } else {
      headers = ['Item', 'Details', 'Status'];
      rows = routes.map((r) => [r.routeNo, r.routeName, r.status]);
    }

    exportToExcel(
      `Transport_Report_${selectedReportType}_${dateStr}`,
      headers,
      rows,
      { departmentName: 'Transport & Fleet Logistics Directorate' },
      {
        name: user?.name || 'Transport Officer',
        role: (role as any) || 'TRANSPORT_ADMIN',
      }
    );
    showToast('success', `Exported ${selectedReportType} to Excel (.xlsx) successfully.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-md border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-7 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                <Bus size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  University Transport &amp; Fleet Operations
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Centralized Fleet Management, Document Compliance, Route Allocation &amp; Maintenance Directory
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setAllocateForm({
                  studentId: '',
                  routeId: '',
                  stopId: '',
                  vehicleId: '',
                  academicYear: '2026-27',
                  remarks: '',
                });
                setShowAllocateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus size={16} /> Allocate Transport Seat
            </button>
            <button
              onClick={() => {
                setEditingVehicle({
                  vehicleNumber: '',
                  vehicleType: 'BUS',
                  makeModel: '',
                  capacity: 40,
                  registrationNumber: '',
                  status: 'ACTIVE',
                  fuelType: 'DIESEL',
                });
                setShowVehicleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Truck size={16} /> Add Vehicle
            </button>
            <button
              onClick={() => {
                setEditingDriver({
                  name: '',
                  mobile: '',
                  licenseNumber: '',
                  licenseType: 'HMV',
                  status: 'ACTIVE',
                });
                setShowDriverModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <UserCheck size={16} /> Register Driver
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (12 Modules) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none text-xs font-semibold">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: BarChart3 },
          { id: 'VEHICLES', label: 'Vehicles', icon: Truck, count: vehicles.length },
          { id: 'DRIVERS', label: 'Drivers', icon: UserCheck, count: drivers.length },
          { id: 'VEHICLE_DOCS', label: 'Vehicle Documents', icon: FileCheck },
          { id: 'DRIVER_DOCS', label: 'Driver Documents', icon: ShieldCheck },
          { id: 'ROUTES', label: 'Routes', icon: Navigation, count: routes.length },
          { id: 'STOPS', label: 'Stops', icon: MapPin },
          { id: 'STUDENT_ALLOCATION', label: 'Student Allocation', icon: Users, count: allocations.length },
          { id: 'TRIPS', label: 'Trip Schedule', icon: Clock, count: trips.length },
          { id: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, count: maintenances.length },
          { id: 'NOTESHEETS', label: 'Notesheet', icon: FileText, count: notesheets.length },
          { id: 'REPORTS', label: 'Reports', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: DASHBOARD ─── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Expiry Alerts Banner if documents expiring */}
          {expirySummary.expiredTotal + expirySummary.vehDocsExpiring + expirySummary.drvDocsExpiring > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" size={24} />
                <div>
                  <div className="text-sm font-bold text-amber-300">Fleet Compliance Expiry Alerts Detected</div>
                  <div className="text-xs text-slate-300">
                    {expirySummary.expiredTotal > 0 && (
                      <span className="text-rose-400 font-bold mr-2">{expirySummary.expiredTotal} Expired documents!</span>
                    )}
                    {expirySummary.vehDocsExpiring} Vehicle docs &amp; {expirySummary.drvDocsExpiring} Driver licenses
                    expiring within 30 days.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('VEHICLE_DOCS')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all"
              >
                Inspect Expiries
              </button>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Active Fleet Vehicles</div>
              <div className="text-2xl font-black text-white">{dashboardStats.activeVehicles} / {dashboardStats.totalVehicles}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">Operational across routes</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Active Drivers</div>
              <div className="text-2xl font-black text-amber-400">{dashboardStats.activeDrivers} / {dashboardStats.totalDrivers}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Licensed heavy transport staff</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Students Allocated</div>
              <div className="text-2xl font-black text-indigo-400">{allocations.filter(a => a.status === 'ACTIVE').length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Daily commuters on active passes</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold mb-1">Active Routes</div>
              <div className="text-2xl font-black text-emerald-400">{dashboardStats.activeRoutes}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">{routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)} scheduled stops</div>
            </div>
          </div>

          {/* Quick Overview Table */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Bus size={18} className="text-amber-400" /> Real-Time Fleet Route Utilization
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Route No</th>
                    <th className="px-4 py-3">Route Name</th>
                    <th className="px-4 py-3">Assigned Vehicle</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Allocated Seats</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{r.routeNo}</td>
                      <td className="px-4 py-3 font-medium text-white">{r.routeName}</td>
                      <td className="px-4 py-3 text-slate-300">{r.assignedVehicleNumber || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-slate-300">{r.assignedDriverName || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">
                          {allocations.filter((a) => (a.routeId === r.id || a.routeNumber === r.routeNo) && a.status === 'ACTIVE').length}
                        </span>{' '}
                        / {r.capacity} seats
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === 'ACTIVE' ? 'success' : 'inactive'}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: VEHICLES ─── */}
      {activeTab === 'VEHICLES' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search vehicles by number, model, reg..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                setEditingVehicle({
                  vehicleNumber: '',
                  vehicleType: 'BUS',
                  makeModel: '',
                  capacity: 40,
                  registrationNumber: '',
                  status: 'ACTIVE',
                  fuelType: 'DIESEL',
                });
                setShowVehicleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Vehicle No</th>
                  <th className="px-4 py-3">Type &amp; Model</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Insurance Expiry</th>
                  <th className="px-4 py-3">Fitness Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vehicles
                  .filter(
                    (v) =>
                      !searchTerm ||
                      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{v.vehicleNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{v.makeModel}</div>
                        <div className="text-xs text-slate-400">{v.vehicleType} • {v.fuelType || 'DIESEL'}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{v.capacity} Seats</td>
                      <td className="px-4 py-3 text-slate-400">{v.insuranceExpiry || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-400">{v.fitnessExpiry || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.status === 'ACTIVE' ? 'success' : v.status === 'MAINTENANCE' ? 'warning' : 'inactive'}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingVehicle(v);
                            setShowVehicleModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DRIVERS ─── */}
      {activeTab === 'DRIVERS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search drivers by name, phone, license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                setEditingDriver({
                  name: '',
                  mobile: '',
                  licenseNumber: '',
                  licenseType: 'HMV',
                  status: 'ACTIVE',
                });
                setShowDriverModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Register Driver
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Mobile Contact</th>
                  <th className="px-4 py-3">License Number</th>
                  <th className="px-4 py-3">License Type</th>
                  <th className="px-4 py-3">License Expiry</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drivers
                  .filter(
                    (d) =>
                      !searchTerm ||
                      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.mobile.includes(searchTerm) ||
                      d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-semibold text-white">{d.name}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{d.mobile}</td>
                      <td className="px-4 py-3 font-mono text-amber-400">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{d.licenseType}</td>
                      <td className="px-4 py-3 text-slate-400">{d.licenseExpiry}</td>
                      <td className="px-4 py-3 text-slate-300">{d.assignedVehicleNumber || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={d.status === 'ACTIVE' ? 'success' : 'inactive'}>{d.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingDriver(d);
                            setShowDriverModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: VEHICLE DOCUMENTS ─── */}
      {activeTab === 'VEHICLE_DOCS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Vehicle Compliance &amp; Regulatory Documents</h3>
              <p className="text-xs text-slate-400">Insurance policies, RTO fitness certificates, PUC and Road permits</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Expiry:</span>
              <select
                value={docFilterDays}
                onChange={(e) => setDocFilterDays(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                <option value="ALL">All Documents</option>
                <option value="30">Expiring in 30 Days</option>
                <option value="15">Expiring in 15 Days</option>
                <option value="7">Expiring in 7 Days</option>
                <option value="EXPIRED">Already Expired</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Vehicle No</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Document No / Policy</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vehicles.flatMap((v) =>
                  [
                    { type: 'INSURANCE', num: v.insuranceNumber, exp: v.insuranceExpiry },
                    { type: 'FITNESS', num: v.fitnessCertificate, exp: v.fitnessExpiry },
                    { type: 'POLLUTION (PUC)', num: v.pollutionCertificate, exp: v.pollutionExpiry },
                    { type: 'ROAD PERMIT', num: v.permitNumber, exp: v.permitExpiry },
                  ].map((doc, idx) => {
                    const isExp = doc.exp && new Date(doc.exp).getTime() < new Date().getTime();
                    return (
                      <tr key={`${v.id}-${idx}`} className="hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">{v.vehicleNumber}</td>
                        <td className="px-4 py-3 font-semibold text-white">{doc.type}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{doc.num || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-400">{doc.exp || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isExp
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isExp ? 'EXPIRED' : 'VALID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: DRIVER DOCUMENTS ─── */}
      {activeTab === 'DRIVER_DOCS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Driver Licenses &amp; Background Verifications</h3>
            <p className="text-xs text-slate-400">Commercial transport endorsements, medical certificates, and ID proof records</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">License Number</th>
                  <th className="px-4 py-3">License Category</th>
                  <th className="px-4 py-3">License Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drivers.map((d) => {
                  const isExp = d.licenseExpiry && new Date(d.licenseExpiry).getTime() < new Date().getTime();
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-semibold text-white">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-amber-400">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-slate-300">{d.licenseType}</td>
                      <td className="px-4 py-3 text-slate-400">{d.licenseExpiry}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isExp
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isExp ? 'EXPIRED' : 'VALID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: ROUTES ─── */}
      {activeTab === 'ROUTES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-bold text-white">Campus Transport Route Network</h3>
            <button
              onClick={() => {
                setEditingRoute({
                  routeNo: '',
                  routeName: '',
                  startPoint: '',
                  endPoint: '',
                  pickupTime: '07:00 AM',
                  dropTime: '05:30 PM',
                  capacity: 50,
                  status: 'ACTIVE',
                  stops: [],
                });
                setShowRouteModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Create Route
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Route No</th>
                  <th className="px-4 py-3">Route Name</th>
                  <th className="px-4 py-3">Start &rarr; End Point</th>
                  <th className="px-4 py-3">Stops Count</th>
                  <th className="px-4 py-3">Timings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{r.routeNo}</td>
                    <td className="px-4 py-3 font-semibold text-white">{r.routeName}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {r.startPoint} &rarr; {r.endPoint}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.stops?.length || 0} stops</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {r.pickupTime} - {r.dropTime}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === 'ACTIVE' ? 'success' : 'inactive'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingRoute(r);
                          setShowRouteModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 7: STOPS ─── */}
      {activeTab === 'STOPS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Sequential Bus Stops Directory</h3>
            <p className="text-xs text-slate-400">Detailed boarding stops mapped to routes in strict pick-up sequence</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Seq #</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Stop Name</th>
                  <th className="px-4 py-3">Pickup Time</th>
                  <th className="px-4 py-3">Drop Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {routes.flatMap((r) =>
                  (r.stops || []).map((s, idx) => (
                    <tr key={`${r.id}-${s.id || idx}`} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{s.sequence || idx + 1}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{r.routeNo} - {r.routeName}</td>
                      <td className="px-4 py-3 font-semibold text-white">{s.stopName}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 font-mono">{s.pickupTime}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 font-mono">{s.dropTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 8: STUDENT ALLOCATION ─── */}
      {activeTab === 'STUDENT_ALLOCATION' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search allocations by name, enrollment, bus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                setAllocateForm({
                  studentId: '',
                  routeId: '',
                  stopId: '',
                  vehicleId: '',
                  academicYear: '2026-27',
                  remarks: '',
                });
                setShowAllocateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              <Plus size={16} /> Allocate Student Seat
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Allotment No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Route &amp; Stop</th>
                  <th className="px-4 py-3">Assigned Bus</th>
                  <th className="px-4 py-3">Pass No</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allocations
                  .filter(
                    (a) =>
                      !searchTerm ||
                      a.allotmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (a.studentName && a.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (a.enrollmentNo && a.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (a.vehicleNumber && a.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{a.allotmentNo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{a.studentName}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 text-xs">{a.enrollmentNo}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-300 font-medium">{a.routeName}</div>
                        <div className="text-[11px] text-amber-400/80">{a.stopName} ({a.pickupTime})</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-200 text-xs">{a.vehicleNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400">{a.passNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant={a.status === 'ACTIVE' ? 'success' : 'inactive'}>{a.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleVacateStudent(a.id)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg transition-all"
                          >
                            Vacate Seat
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

      {/* ─── TAB 9: TRIPS & DUTY SCHEDULE ─── */}
      {activeTab === 'TRIPS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-bold text-white">Daily Fleet Trips &amp; Duty Roster</h3>
            <button
              onClick={() => {
                setTripForm({
                  vehicleId: vehicles[0]?.id || '',
                  routeId: routes[0]?.id || '',
                  driverId: drivers[0]?.id || '',
                  tripDate: new Date().toISOString().split('T')[0],
                  shift: 'MORNING',
                  startTime: '07:00 AM',
                  endTime: '08:30 AM',
                  tripType: 'PICKUP',
                  status: 'SCHEDULED',
                });
                setShowTripModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus size={16} /> Schedule Trip
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Trip No</th>
                  <th className="px-4 py-3">Date &amp; Shift</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{t.tripNo}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      <div>{t.tripDate}</div>
                      <div className="text-[11px] text-slate-400 font-semibold">{t.shift} • {t.tripType}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white text-xs">{t.routeName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs">{t.vehicleNumber}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{t.driverName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.startTime} - {t.endTime}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status === 'SCHEDULED' ? 'navy' : 'success'}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 10: MAINTENANCE ─── */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Vehicle Maintenance Logs &amp; Work Orders</h3>
              <p className="text-xs text-slate-400">Preventive servicing, breakdown overhauls and Notesheet financial approvals</p>
            </div>
            <button
              onClick={() => {
                setMaintenanceForm({
                  vehicleId: vehicles[0]?.id || '',
                  issue: '',
                  category: 'ENGINE',
                  description: '',
                  priority: 'NORMAL',
                  assignedStaff: 'Vikrambhai Vaghela (Chief Mechanic)',
                  estimatedCost: 0,
                  notesheetId: '',
                  status: 'REPORTED',
                });
                setShowMaintenanceModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Wrench size={16} /> Log Maintenance
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Maintenance No</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Issue &amp; Category</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Cost (₹)</th>
                  <th className="px-4 py-3">Notesheet Ref</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{m.maintenanceNo}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">{m.vehicleNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{m.issue}</div>
                      <div className="text-[11px] text-slate-400">{m.category} • Priority: {m.priority}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{m.assignedStaff || 'Unassigned'}</td>
                    <td className="px-4 py-3 font-mono text-slate-200">
                      ₹{m.actualCost || m.estimatedCost || 0}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{m.notesheetId || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.status === 'COMPLETED' ? 'success' : 'warning'}>{m.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 11: NOTESHEETS ─── */}
      {activeTab === 'NOTESHEETS' && (
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white">Transport Directorate Notesheet Approvals</h3>
            <p className="text-xs text-slate-400">Official institutional Notesheets for Fleet procurement, major repairs &amp; transport policy</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Note Sheet No</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Initiated By</th>
                  <th className="px-4 py-3">Current Office</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {notesheets.map((ns) => (
                  <tr key={ns.id} className="hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{ns.noteSheetNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{ns.subject}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{ns.creatorName}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{ns.currentOffice}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ns.status === 'APPROVED' ? 'success' : 'warning'}>{ns.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ns.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 12: REPORTS ─── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Transport &amp; Logistics Reporting Center</h3>
              <p className="text-xs text-slate-400">Generate and export official formatted reports in .xlsx format</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-semibold"
              >
                <option value="VEHICLE_LIST">1. Vehicle Master Roster</option>
                <option value="DRIVER_LIST">2. Driver Profile Directory</option>
                <option value="VEHICLE_DOC_EXPIRY">3. Vehicle Document Expiries</option>
                <option value="DRIVER_DOC_EXPIRY">4. Driver License Expiries</option>
                <option value="ROUTE_LIST">5. Route Network Overview</option>
                <option value="ROUTE_STOPS">6. Sequential Stops Listing</option>
                <option value="STUDENT_ALLOCATION">7. Student Transport Allocation</option>
                <option value="VEHICLE_CAPACITY">8. Vehicle Capacity &amp; Load</option>
                <option value="MAINTENANCE_REPORT">9. Vehicle Maintenance History</option>
                <option value="TRIP_SCHEDULE">10. Daily Trip Duty Schedule</option>
              </select>
              <button
                onClick={handleExportReports}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                <Download size={15} /> Export Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ALLOCATE STUDENT MODAL ─── */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="text-amber-400" size={20} /> Allocate Transport Seat
              </h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAllocateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Student</label>
                <select
                  value={allocateForm.studentId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollmentNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Route</label>
                <select
                  value={allocateForm.routeId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const r = routes.find((x) => x.id === rId);
                    setAllocateForm({
                      ...allocateForm,
                      routeId: rId,
                      stopId: r?.stops?.[0]?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeNo} - {r.routeName}
                    </option>
                  ))}
                </select>
              </div>

              {allocateForm.routeId && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Boarding Stop</label>
                  <select
                    value={allocateForm.stopId}
                    onChange={(e) => setAllocateForm({ ...allocateForm, stopId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  >
                    <option value="">-- Select Stop --</option>
                    {routes
                      .find((r) => r.id === allocateForm.routeId)
                      ?.stops?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sequence}. {s.stopName} (Pickup: {s.pickupTime})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Vehicle (Checks Capacity)</label>
                <select
                  value={allocateForm.vehicleId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => {
                    const currentCount = allocations.filter((a) => a.vehicleNumber === v.vehicleNumber && a.status === 'ACTIVE').length;
                    const isFull = currentCount >= v.capacity;
                    return (
                      <option key={v.id} value={v.id} disabled={isFull}>
                        {v.vehicleNumber} ({v.makeModel}) - {currentCount}/{v.capacity} Seats {isFull ? '(FULL)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VEHICLE MODAL ─── */}
      {showVehicleModal && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingVehicle.id ? 'Edit Vehicle' : 'Add Fleet Vehicle'}
              </h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration / Vehicle No</label>
                  <input
                    type="text"
                    value={editingVehicle.vehicleNumber || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleNumber: e.target.value, registrationNumber: e.target.value })}
                    placeholder="GJ-01-AB-1234"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={editingVehicle.vehicleType || 'BUS'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="BUS">Bus</option>
                    <option value="MINI_BUS">Mini Bus</option>
                    <option value="VAN">Van</option>
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="CAR">Car</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Make / Model</label>
                  <input
                    type="text"
                    value={editingVehicle.makeModel || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, makeModel: e.target.value })}
                    placeholder="Tata Starbus Ultra"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    value={editingVehicle.capacity || 40}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={editingVehicle.insuranceExpiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fitness Expiry</label>
                  <input
                    type="date"
                    value={editingVehicle.fitnessExpiry || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fitnessExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DRIVER MODAL ─── */}
      {showDriverModal && editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingDriver.id ? 'Edit Driver' : 'Register Driver'}
              </h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={editingDriver.name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                    placeholder="Rameshwar Yadav"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    value={editingDriver.mobile || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, mobile: e.target.value })}
                    placeholder="9825123456"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driving License Number</label>
                  <input
                    type="text"
                    value={editingDriver.licenseNumber || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, licenseNumber: e.target.value })}
                    placeholder="GJ01-20150045678"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={editingDriver.licenseExpiry || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ROUTE MODAL ─── */}
      {showRouteModal && editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingRoute.id ? 'Edit Route' : 'Create Route'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Route Number / Code</label>
                  <input
                    type="text"
                    value={editingRoute.routeNo || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, routeNo: e.target.value })}
                    placeholder="R-101"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Route Name</label>
                  <input
                    type="text"
                    value={editingRoute.routeName || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, routeName: e.target.value })}
                    placeholder="Ahmedabad ISKCON — SSIU Campus"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Point</label>
                  <input
                    type="text"
                    value={editingRoute.startPoint || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, startPoint: e.target.value })}
                    placeholder="ISKCON Cross Roads"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Point</label>
                  <input
                    type="text"
                    value={editingRoute.endPoint || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, endPoint: e.target.value })}
                    placeholder="SSIU Campus, Gandhinagar"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MAINTENANCE MODAL ─── */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" size={20} /> Log Vehicle Maintenance
              </h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Vehicle</label>
                <select
                  value={maintenanceForm.vehicleId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue Headline</label>
                  <input
                    type="text"
                    value={maintenanceForm.issue || ''}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue: e.target.value })}
                    placeholder="Brake pad replacement"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={maintenanceForm.category || 'ENGINE'}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="ENGINE">Engine</option>
                    <option value="BRAKES">Brakes</option>
                    <option value="TYRES">Tyres</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="AC_COOLING">AC / Cooling</option>
                    <option value="SERVICE_ROUTINE">Routine Service</option>
                    <option value="BODY_WORK">Body Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Description</label>
                <textarea
                  value={maintenanceForm.description || ''}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  placeholder="Details of required repair or parts replacement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={maintenanceForm.estimatedCost || 0}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notesheet Ref No (Optional)</label>
                  <input
                    type="text"
                    value={maintenanceForm.notesheetId || ''}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notesheetId: e.target.value })}
                    placeholder="NS/TRANSPORT/2026/0014"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TRIP MODAL ─── */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-amber-400" size={20} /> Schedule Trip Run
              </h3>
              <button onClick={() => setShowTripModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Vehicle</label>
                <select
                  value={tripForm.vehicleId}
                  onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Route</label>
                <select
                  value={tripForm.routeId}
                  onChange={(e) => setTripForm({ ...tripForm, routeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  required
                >
                  <option value="">-- Select Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeNo} - {r.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trip Date</label>
                  <input
                    type="date"
                    value={tripForm.tripDate || ''}
                    onChange={(e) => setTripForm({ ...tripForm, tripDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                  <select
                    value={tripForm.shift || 'MORNING'}
                    onChange={(e) => setTripForm({ ...tripForm, shift: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="SPECIAL">Special Run</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={tripForm.startTime || '07:00 AM'}
                    onChange={(e) => setTripForm({ ...tripForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="text"
                    value={tripForm.endTime || '08:30 AM'}
                    onChange={(e) => setTripForm({ ...tripForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
