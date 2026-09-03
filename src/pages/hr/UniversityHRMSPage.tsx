import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import * as XLSX from 'xlsx';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Users, UserCheck, CreditCard, Calendar, Award, FileSpreadsheet, 
  Plus, Search, Filter, Download, CheckCircle2, XCircle, Clock, FileText, 
  Building2, Briefcase, GraduationCap, ShieldCheck, DollarSign, Laptop, 
  ArrowRightLeft, UserMinus, TrendingUp, Layers, Activity, AlertCircle, Eye,
  RefreshCw, Check, X, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { Employee, User as UserType, EmployeeType, EmployeeStatus } from '../../types';

// Modals
import { EmployeeProfileModal } from '../../components/hr/EmployeeProfileModal';
import { OnboardEmployeeModal } from '../../components/hr/OnboardEmployeeModal';
import { ApplyLeaveModal } from '../../components/hr/ApplyLeaveModal';
import { ProcessPayrollModal } from '../../components/hr/ProcessPayrollModal';
import { PromotionIncrementModal } from '../../components/hr/PromotionIncrementModal';
import { TransferEmployeeModal } from '../../components/hr/TransferEmployeeModal';
import { SeparationExitModal } from '../../components/hr/SeparationExitModal';
import { BulkEmployeeImportModal } from '../../components/hr/BulkEmployeeImportModal';

export const UniversityHRMSPage: React.FC = () => {
  const { user } = useAuth();
  const currentUser: UserType = user || {
    id: 'user-admin',
    name: 'Chief HR Officer',
    email: 'hr.director@ssiu.edu.in',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'EMPLOYEE_MASTER' | 'RECRUITMENT' | 'ATTENDANCE' | 'LEAVE_MANAGEMENT' | 
    'PAYROLL' | 'FACULTY_MANAGEMENT' | 'PERFORMANCE' | 'TRAINING_FDP' | 'PROMOTIONS_INCREMENTS' | 
    'TRANSFERS' | 'WORKLOAD_TRANSFER' | 'EMPLOYEE_REQUESTS' | 'ASSET_ASSIGNMENTS' | 
    'SEPARATION_EXIT' | 'EMPLOYEE_SELF_SERVICE' | 'REPORTS_ANALYTICS' | 'HR_AUDIT'
  >('DASHBOARD');

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  // Search & Filter State for Employee Master
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstituteId, setFilterInstituteId] = useState('ALL');
  const [filterDepartmentId, setFilterDepartmentId] = useState('ALL');
  const [filterEmployeeType, setFilterEmployeeType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showProcessPayrollModal, setShowProcessPayrollModal] = useState(false);
  const [promoModalMode, setPromoModalMode] = useState<'PROMOTION' | 'INCREMENT' | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSeparationModal, setShowSeparationModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Toast / Notification State
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Data Loading
  const employees = useMemo(() => {
    return hrmsService.getEmployees({
      instituteId: filterInstituteId,
      departmentId: filterDepartmentId,
      employeeType: filterEmployeeType,
      status: filterStatus,
      searchQuery
    });
  }, [filterInstituteId, filterDepartmentId, filterEmployeeType, filterStatus, searchQuery, refreshKey]);

  const kpis = useMemo(() => hrmsService.getDashboardKPIs(), [refreshKey]);
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const vacancies = useMemo(() => hrmsService.getVacancies(), [refreshKey]);
  const leaveApplications = useMemo(() => db.getEmployeeLeaveApplications(), [refreshKey]);
  const payrolls = useMemo(() => db.getPayrollRecords(), [refreshKey]);
  const attendanceRecords = useMemo(() => hrmsService.getAttendanceRecords(), [refreshKey]);
  const corrections = useMemo(() => hrmsService.getAttendanceCorrectionRequests(), [refreshKey]);
  const promotions = useMemo(() => hrmsService.getPromotions(), [refreshKey]);
  const increments = useMemo(() => hrmsService.getSalaryIncrements(), [refreshKey]);
  const transfers = useMemo(() => hrmsService.getTransfers(), [refreshKey]);
  const separations = useMemo(() => hrmsService.getSeparations(), [refreshKey]);
  const auditLogs = useMemo(() => hrmsService.getHRAuditLogs(), [refreshKey]);

  // Quick Action Handlers
  const handleApproveLeave = (leaveId: string, role: 'MANAGER' | 'HOD' | 'HR') => {
    const res = hrmsService.reviewLeaveApplication(leaveId, role, 'APPROVED', 'Approved by University Authority', currentUser);
    if (res.success) {
      showToast('success', res.message);
      handleRefresh();
    }
  };

  const handleRejectLeave = (leaveId: string, role: 'MANAGER' | 'HOD' | 'HR') => {
    const res = hrmsService.reviewLeaveApplication(leaveId, role, 'REJECTED', 'Rejected by University Authority', currentUser);
    if (res.success) {
      showToast('error', res.message);
      handleRefresh();
    }
  };

  const handleApprovePayroll = (month: string, year: number) => {
    const res = hrmsService.approveMonthlyPayroll(month, year, currentUser);
    if (res.success) {
      showToast('success', res.message);
      handleRefresh();
    }
  };

  const handleExportEmployeesExcel = () => {
    const data = employees.map(e => ({
      'Employee ID': e.employeeId,
      'Name': e.name,
      'Email': e.email,
      'Phone': e.phone,
      'Designation': e.designation,
      'Category': e.employeeType,
      'Employment Type': e.employmentType || 'Permanent',
      'Department': e.departmentName || 'Admin',
      'Institute': e.instituteName || 'Campus',
      'Joining Date': e.joiningDate,
      'Gross Salary': e.salary,
      'PAN': e.panNo,
      'Aadhaar': e.aadhaarNo,
      'Status': e.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'SSIU_University_Employee_Master_Register.xlsx');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="text-xs font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 backdrop-blur">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">University Human Resource Management System (HRMS)</h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Centralized Enterprise Employee Master, Recruitment, Attendance, Leaves, Workload, Payroll, Appraisals & Clearances
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 z-10">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs flex items-center gap-1.5 backdrop-blur transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Bulk Excel Import
          </button>
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 text-white font-semibold text-xs flex items-center gap-1.5 backdrop-blur transition shadow-md shadow-blue-900/30"
          >
            <Calendar className="w-4 h-4" /> Apply Leave
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 transition"
          >
            <Plus className="w-4 h-4" /> Onboard Employee
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm overflow-x-auto">
        {[
          { id: 'DASHBOARD', label: 'HR Dashboard', icon: Activity },
          { id: 'EMPLOYEE_MASTER', label: 'Employee Master', icon: Users },
          { id: 'RECRUITMENT', label: 'Recruitment & Jobs', icon: Briefcase },
          { id: 'ATTENDANCE', label: 'Attendance & Bio', icon: Clock },
          { id: 'LEAVE_MANAGEMENT', label: 'Leave Management', icon: Calendar },
          { id: 'PAYROLL', label: 'Payroll & Payslips', icon: DollarSign },
          { id: 'FACULTY_MANAGEMENT', label: 'Faculty Matrix', icon: GraduationCap },
          { id: 'PERFORMANCE', label: 'Performance & KRA', icon: Award },
          { id: 'TRAINING_FDP', label: 'Training / FDP', icon: Award },
          { id: 'PROMOTIONS_INCREMENTS', label: 'Promotions & Increments', icon: TrendingUp },
          { id: 'TRANSFERS', label: 'Transfers & Workload', icon: ArrowRightLeft },
          { id: 'ASSET_ASSIGNMENTS', label: 'Assigned Assets', icon: Laptop },
          { id: 'SEPARATION_EXIT', label: 'Separation & Exit', icon: UserMinus },
          { id: 'EMPLOYEE_SELF_SERVICE', label: 'Self Service (ESS)', icon: UserCheck },
          { id: 'REPORTS_ANALYTICS', label: 'Reports Center', icon: FileText },
          { id: 'HR_AUDIT', label: 'HR Audit Log', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. DASHBOARD TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total University Employees"
              value={kpis.totalEmployees}
              subtitle={`${kpis.activeEmployees} Active Master Records`}
              icon={Users}
              colorScheme="navy"
            />
            <StatCard
              title="Faculty vs Non-Teaching"
              value={`${kpis.facultyCount} / ${kpis.nonTeachingCount}`}
              subtitle="Teaching to Support Ratio"
              icon={GraduationCap}
              colorScheme="blue"
            />
            <StatCard
              title="Today's Attendance Rate"
              value={`${kpis.attendanceRate}%`}
              subtitle={`${kpis.presentToday} Present on Campus`}
              icon={Clock}
              colorScheme="green"
            />
            <StatCard
              title="Monthly Salary Outlay"
              value={`₹${kpis.totalMonthlySalary.toLocaleString()}`}
              subtitle="Gross Compensation / Month"
              icon={DollarSign}
              colorScheme="orange"
            />
          </div>

          {/* Quick Metrics & Pending Queues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Open Vacancies & Recruitment */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Active Job Vacancies
                </h3>
                <Badge variant="active">{vacancies.length} Openings</Badge>
              </div>
              <div className="space-y-2.5">
                {vacancies.map(v => (
                  <div key={v.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{v.positionTitle}</p>
                      <span className="text-slate-500">{v.departmentName} • {v.vacanciesCount} Post(s)</span>
                    </div>
                    <span className="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                      {v.applicantCount} Candidates
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Leave Requests */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" /> Pending Leave Approvals
                </h3>
                <Badge variant="orange">{leaveApplications.filter(l => l.status === 'SUBMITTED').length} Pending</Badge>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {leaveApplications.filter(l => l.status === 'SUBMITTED').slice(0, 5).map(l => (
                  <div key={l.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{l.employeeName}</span>
                      <span className="text-amber-600 font-semibold uppercase">{l.leaveType} ({l.totalDays}d)</span>
                    </div>
                    <p className="text-slate-500">{l.startDate} to {l.endDate} • {l.reason}</p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleRejectLeave(l.id, 'HR')}
                        className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-semibold hover:bg-rose-100 text-[11px]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveLeave(l.id, 'HR')}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-[11px]"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Corrections & Clearances */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Attendance Corrections
                </h3>
                <Badge variant="active">{corrections.filter(c => c.status === 'SUBMITTED').length} Pending</Badge>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {corrections.filter(c => c.status === 'SUBMITTED').map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{c.employeeName}</span>
                      <span className="text-slate-400">{c.date}</span>
                    </div>
                    <p className="text-slate-500">Change from <strong>{c.currentStatus}</strong> to <strong className="text-emerald-600">{c.requestedStatus}</strong> ({c.reason})</p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => {
                          hrmsService.reviewAttendanceCorrection(c.id, 'REJECTED', 'Rejected', currentUser);
                          handleRefresh();
                        }}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 text-[11px]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          hrmsService.reviewAttendanceCorrection(c.id, 'APPROVED', 'Approved', currentUser);
                          handleRefresh();
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-[11px]"
                      >
                        Approve & Sync
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. EMPLOYEE MASTER TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'EMPLOYEE_MASTER' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, code, role..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <select
                value={filterEmployeeType}
                onChange={e => setFilterEmployeeType(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Employee Categories</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="TECHNICAL">Technical</option>
                <option value="LAB_STAFF">Lab Staff</option>
                <option value="LIBRARY">Library</option>
                <option value="IT">IT & Systems</option>
                <option value="SUPPORT">Support Staff</option>
                <option value="SECURITY">Security</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="DRIVER">Drivers</option>
              </select>
            </div>
            <div>
              <select
                value={filterDepartmentId}
                onChange={e => setFilterDepartmentId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PROBATION">Probation</option>
                <option value="RESIGNED">Resigned</option>
                <option value="RELIEVED">Relieved</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportEmployeesExcel}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export .xlsx
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Employee ID & Code</th>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Department & Institute</th>
                  <th className="p-3.5">Designation & Role</th>
                  <th className="p-3.5">Gross Pay</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {employees.length > 0 ? (
                  employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {emp.employeeId}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                            <span className="text-[11px] text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.departmentName || 'Admin'}</p>
                        <span className="text-[11px] text-slate-400">{emp.instituteName || 'Campus'}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{emp.designation}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                          {emp.employeeType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        ₹{Number(emp.salary).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={emp.status === 'ACTIVE' ? 'active' : emp.status === 'ON_LEAVE' ? 'orange' : 'danger'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1"
                            title="View 15-Tab Profile Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No employee records found matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. PAYROLL TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Monthly Payroll Processing & Payslips</h3>
              <p className="text-xs text-slate-500">Itemized compensation architecture linking verified attendance & approved leave deductions</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprovePayroll('August', 2026)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approve All August 2026
              </button>
              <button
                onClick={() => setShowProcessPayrollModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <DollarSign className="w-4 h-4" /> Run Payroll Engine
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Payroll Slip #</th>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Basic (50%)</th>
                  <th className="p-3.5">Allowances</th>
                  <th className="p-3.5">Gross Pay</th>
                  <th className="p-3.5">PF & Taxes</th>
                  <th className="p-3.5">Net Pay</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {payrolls.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 font-mono font-bold text-blue-600">{p.payrollNumber || p.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.employeeName}</td>
                    <td className="p-3.5">{p.month} {p.year}</td>
                    <td className="p-3.5">₹{p.basicPay.toLocaleString()}</td>
                    <td className="p-3.5">₹{(p.hra + p.da + p.specialAllowance).toLocaleString()}</td>
                    <td className="p-3.5 font-bold">₹{p.grossSalary.toLocaleString()}</td>
                    <td className="p-3.5 text-rose-600 font-semibold">-₹{p.totalDeductions.toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-emerald-600 text-sm">₹{p.netSalary.toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant={p.status === 'PAID' ? 'active' : p.status === 'APPROVED' ? 'gold' : 'orange'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. PROMOTIONS & INCREMENTS TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PROMOTIONS_INCREMENTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Promotion & Salary Increment Governance</h3>
              <p className="text-xs text-slate-500">Maintain permanent historical records of designations and compensation revisions</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPromoModalMode('INCREMENT')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp className="w-4 h-4" /> Process Salary Increment
              </button>
              <button
                onClick={() => setPromoModalMode('PROMOTION')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Award className="w-4 h-4" /> Propose Promotion
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Promotions History */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Executed Staff Promotions
              </h4>
              <div className="space-y-3">
                {promotions.map(prom => (
                  <div key={prom.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{prom.employeeName}</span>
                      <Badge variant="active">{prom.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span>{prom.currentDesignation}</span>
                      <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                      <strong className="text-indigo-600">{prom.proposedDesignation}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400">Effective: {prom.effectiveDate} • Reason: {prom.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Increments History */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Salary Increment Revisions
              </h4>
              <div className="space-y-3">
                {increments.map(incr => (
                  <div key={incr.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{incr.employeeName}</span>
                      <span className="font-bold text-purple-600">+{incr.incrementValue}{incr.incrementType === 'PERCENTAGE' ? '%' : ' INR'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Previous: ₹{incr.currentSalary.toLocaleString()}</span>
                      <span>Revised: <strong className="text-emerald-600">₹{incr.newSalary.toLocaleString()}</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-400">Effective: {incr.effectiveDate} • {incr.reason}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. HR AUDIT LOG TAB */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'HR_AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Immutable University HR Audit Trail</h3>
              <p className="text-xs text-slate-500">Complete chronological ledger of all sensitive employee, salary, promotion, and clearance actions</p>
            </div>
            <Badge variant="active">{auditLogs.length} Audit Entries</Badge>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm divide-y divide-slate-200 dark:divide-slate-800">
            {auditLogs.length > 0 ? (
              auditLogs.map(log => (
                <div key={log.id} className="p-4 flex items-start gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{log.actionType}</span>
                      <span className="text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{log.details}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5">
                      <span><strong>Actor:</strong> {log.performedByName} ({log.performedByRole})</span>
                      <span>•</span>
                      <span><strong>Entity:</strong> {log.entityName}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No HR audit logs recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          currentUser={currentUser}
          onClose={() => setSelectedEmployee(null)}
          onRefresh={handleRefresh}
        />
      )}

      {showOnboardModal && (
        <OnboardEmployeeModal
          currentUser={currentUser}
          onClose={() => setShowOnboardModal(false)}
          onSuccess={(newEmpId) => {
            setShowOnboardModal(false);
            showToast('success', 'Employee onboarded successfully with active login credentials!');
            handleRefresh();
          }}
        />
      )}

      {showApplyLeaveModal && (
        <ApplyLeaveModal
          currentUser={currentUser}
          onClose={() => setShowApplyLeaveModal(false)}
          onSuccess={() => {
            setShowApplyLeaveModal(false);
            showToast('success', 'Leave application submitted successfully.');
            handleRefresh();
          }}
        />
      )}

      {showProcessPayrollModal && (
        <ProcessPayrollModal
          currentUser={currentUser}
          onClose={() => setShowProcessPayrollModal(false)}
          onSuccess={() => {
            setShowProcessPayrollModal(false);
            showToast('success', 'Monthly payroll calculated & payslips generated successfully!');
            handleRefresh();
          }}
        />
      )}

      {promoModalMode && (
        <PromotionIncrementModal
          currentUser={currentUser}
          mode={promoModalMode}
          onClose={() => setPromoModalMode(null)}
          onSuccess={() => {
            setPromoModalMode(null);
            showToast('success', `${promoModalMode === 'PROMOTION' ? 'Promotion' : 'Salary Increment'} executed successfully!`);
            handleRefresh();
          }}
        />
      )}

      {showTransferModal && (
        <TransferEmployeeModal
          currentUser={currentUser}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            showToast('success', 'Employee transferred successfully.');
            handleRefresh();
          }}
        />
      )}

      {showSeparationModal && (
        <SeparationExitModal
          currentUser={currentUser}
          onClose={() => setShowSeparationModal(false)}
          onSuccess={() => {
            setShowSeparationModal(false);
            showToast('success', 'Employee separation initiated.');
            handleRefresh();
          }}
        />
      )}

      {showBulkImportModal && (
        <BulkEmployeeImportModal
          currentUser={currentUser}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={(count) => {
            setShowBulkImportModal(false);
            showToast('success', `Bulk import completed! ${count} employees added.`);
            handleRefresh();
          }}
        />
      )}

    </div>
  );
};
