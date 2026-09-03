import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Building2, Briefcase, GraduationCap, 
  Calendar, ShieldCheck, DollarSign, FileText, Award, Layers, Clock, 
  CheckCircle2, AlertTriangle, Download, ArrowRight, Laptop, Activity, Plus
} from 'lucide-react';
import { Employee, User as UserType } from '../../types';
import { hrmsService } from '../../services/hrmsService';
import { useModalScrollLock } from '../../utils/modalScrollLock';
import { Badge } from '../common/Badge';

interface EmployeeProfileModalProps {
  employee: Employee;
  currentUser: UserType;
  onClose: () => void;
  onRefresh: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  currentUser,
  onClose,
  onRefresh
}) => {
  useModalScrollLock(true, onClose);

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'PERSONAL' | 'EMPLOYMENT' | 'ACADEMIC' | 'EXPERIENCE' | 
    'ATTENDANCE' | 'LEAVE' | 'PAYROLL' | 'DOCUMENTS' | 'PERFORMANCE' | 
    'TRAINING' | 'ASSETS' | 'WORKLOAD' | 'REQUESTS' | 'AUDIT'
  >('OVERVIEW');

  // Sub-data retrieval
  const attendanceRecords = hrmsService.getAttendanceRecords({ employeeId: employee.id });
  const leaveBalances = hrmsService.getLeaveBalances(employee.id);
  const leaveApplications = hrmsService.getLeaveBalances(employee.id); // Or leave applications
  const payslips = hrmsService.getEmployeePayslips(employee.id);
  const documents = hrmsService.getEmployeeDocuments(employee.id);
  const appraisals = hrmsService.getAppraisals(employee.id);
  const trainings = hrmsService.getTrainingRecords(employee.id);
  const assets = hrmsService.getEmployeeAssets(employee.id);
  const promotions = hrmsService.getPromotions(employee.id);
  const transfers = hrmsService.getTransfers(employee.id);
  const auditLogs = hrmsService.getHRAuditLogs().filter(a => a.entityId === employee.id);

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: User },
    { id: 'PERSONAL', label: 'Personal', icon: MapPin },
    { id: 'EMPLOYMENT', label: 'Employment', icon: Briefcase },
    { id: 'ACADEMIC', label: 'Academic & Faculty', icon: GraduationCap },
    { id: 'ATTENDANCE', label: 'Attendance', icon: Clock },
    { id: 'LEAVE', label: 'Leave Balances', icon: Calendar },
    { id: 'PAYROLL', label: 'Payroll & Salary', icon: DollarSign },
    { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
    { id: 'PERFORMANCE', label: 'Performance & KRA', icon: Award },
    { id: 'TRAINING', label: 'Training / FDP', icon: Award },
    { id: 'ASSETS', label: 'Assigned Assets', icon: Laptop },
    { id: 'WORKLOAD', label: 'Workload & Transfers', icon: Layers },
    { id: 'AUDIT', label: 'Audit History', icon: Activity },
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Header Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="flex items-center gap-5 z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/30 flex items-center justify-center text-3xl font-bold uppercase shadow-inner text-white">
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <Badge variant={employee.status === 'ACTIVE' ? 'active' : employee.status === 'ON_LEAVE' ? 'orange' : 'danger'}>
                  {employee.status}
                </Badge>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20">
                  {employee.employeeType}
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-4">
                <span><strong>ID:</strong> {employee.employeeId}</span>
                <span>•</span>
                <span><strong>Designation:</strong> {employee.designation}</span>
                <span>•</span>
                <span><strong>Dept:</strong> {employee.departmentName || 'Administration'}</span>
              </p>
              <p className="text-xs text-blue-200 mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {employee.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {employee.joiningDate}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-200 text-sm">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Gross Pay</span>
                  <h4 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">₹{Number(employee.salary).toLocaleString()}</h4>
                  <p className="text-xs text-slate-500 mt-1">Per Month</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Employment Type</span>
                  <h4 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{employee.employmentType || 'Permanent'}</h4>
                  <p className="text-xs text-slate-500 mt-1">Status: {employee.status}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Total Experience</span>
                  <h4 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{employee.experienceYears || 0} Years</h4>
                  <p className="text-xs text-slate-500 mt-1">{employee.qualification}</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Assigned Assets</span>
                  <h4 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{assets.length} Item(s)</h4>
                  <p className="text-xs text-slate-500 mt-1">Hardware & IT</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> Organizational Placement
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Institute:</span> <p className="font-semibold">{employee.instituteName || 'SSIU Campus'}</p></div>
                    <div><span className="text-slate-500">Department:</span> <p className="font-semibold">{employee.departmentName || 'General Administration'}</p></div>
                    <div><span className="text-slate-500">Designation:</span> <p className="font-semibold">{employee.designation}</p></div>
                    <div><span className="text-slate-500">Employee Type:</span> <p className="font-semibold">{employee.employeeType}</p></div>
                    <div><span className="text-slate-500">Reporting Manager:</span> <p className="font-semibold">{employee.reportingManagerName || 'Dr. HOD / Dean'}</p></div>
                    <div><span className="text-slate-500">Work Location:</span> <p className="font-semibold">{employee.workLocation || 'Main Block, Floor 2'}</p></div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity & Bank Accounts
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">PAN Number:</span> <p className="font-semibold font-mono">{employee.panNo || 'N/A'}</p></div>
                    <div><span className="text-slate-500">Aadhaar Number:</span> <p className="font-semibold font-mono">{employee.aadhaarNo || 'N/A'}</p></div>
                    <div><span className="text-slate-500">Bank Account:</span> <p className="font-semibold font-mono">{employee.bankAccountNo || 'N/A'}</p></div>
                    <div><span className="text-slate-500">Bank Name:</span> <p className="font-semibold">{employee.bankName || 'State Bank of India'}</p></div>
                    <div><span className="text-slate-500">PF Number:</span> <p className="font-semibold font-mono">{employee.pfNumber || 'PF-SSIU-0029'}</p></div>
                    <div><span className="text-slate-500">User Login:</span> <p className="font-semibold text-emerald-600">{employee.username || employee.email}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PERSONAL TAB */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Personal & Contact Dossier</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-500">Full Name:</span> <p className="font-semibold text-sm">{employee.name}</p></div>
                  <div><span className="text-slate-500">Gender:</span> <p className="font-semibold">{employee.gender || 'Not Specified'}</p></div>
                  <div><span className="text-slate-500">Date of Birth:</span> <p className="font-semibold">{employee.dob || '1985-05-14'}</p></div>
                  <div><span className="text-slate-500">Official Email:</span> <p className="font-semibold">{employee.email}</p></div>
                  <div><span className="text-slate-500">Mobile Phone:</span> <p className="font-semibold">{employee.phone}</p></div>
                  <div><span className="text-slate-500">Blood Group:</span> <p className="font-semibold">{employee.bloodGroup || 'B+'}</p></div>
                  <div className="md:col-span-2"><span className="text-slate-500">Residential Address:</span> <p className="font-semibold">{employee.address || 'Swarrnim University Staff Quarters, Gandhinagar'}</p></div>
                  <div><span className="text-slate-500">Emergency Contact:</span> <p className="font-semibold">{employee.emergencyContactName || 'Family Member'} ({employee.emergencyContactPhone || employee.phone})</p></div>
                </div>
              </div>
            </div>
          )}

          {/* 3. EMPLOYMENT TAB */}
          {activeTab === 'EMPLOYMENT' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Employment Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-500">Employee ID:</span> <p className="font-semibold font-mono">{employee.employeeId}</p></div>
                  <div><span className="text-slate-500">Designation:</span> <p className="font-semibold">{employee.designation}</p></div>
                  <div><span className="text-slate-500">Employee Category:</span> <p className="font-semibold">{employee.employeeType}</p></div>
                  <div><span className="text-slate-500">Employment Contract:</span> <p className="font-semibold">{employee.employmentType || 'Permanent'}</p></div>
                  <div><span className="text-slate-500">Joining Date:</span> <p className="font-semibold">{employee.joiningDate}</p></div>
                  <div><span className="text-slate-500">Confirmation Date:</span> <p className="font-semibold">{employee.confirmationDate || 'Confirmed'}</p></div>
                  <div><span className="text-slate-500">Shift Timing:</span> <p className="font-semibold">{employee.shift || 'General Shift (09:00 AM - 05:00 PM)'}</p></div>
                  <div><span className="text-slate-500">Work Location:</span> <p className="font-semibold">{employee.workLocation || 'Main Academic Block'}</p></div>
                  <div><span className="text-slate-500">Reporting Authority:</span> <p className="font-semibold">{employee.reportingManagerName || 'Dean of Academics'}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* 4. ACADEMIC & FACULTY TAB */}
          {activeTab === 'ACADEMIC' && (
            <div className="space-y-4">
              {employee.employeeType === 'FACULTY' ? (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 bg-blue-50/20 dark:bg-blue-950/10">
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" /> Faculty Academic & Research Matrix
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-medium">Teaching Load</span>
                      <p className="text-lg font-bold mt-0.5 text-blue-600">{employee.teachingLoadHours || 14} hrs/week</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-medium">Publications</span>
                      <p className="text-lg font-bold mt-0.5 text-indigo-600">{employee.publicationsCount || 8} Scopus/IEEE</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-medium">FDPs Conducted</span>
                      <p className="text-lg font-bold mt-0.5 text-emerald-600">{employee.fdpConductedCount || 4}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 font-medium">Mentee Students</span>
                      <p className="text-lg font-bold mt-0.5 text-purple-600">{employee.menteeStudentsCount || 25} Students</p>
                    </div>
                  </div>
                  <div className="text-xs space-y-2 mt-3">
                    <p><strong>Highest Qualification:</strong> {employee.qualification}</p>
                    <p><strong>Specialization:</strong> {employee.specialization || 'Distributed Systems, Cloud & AI'}</p>
                    <p><strong>Previous Institute:</strong> {employee.previousInstitute || 'Gujarat Technological University (5 Years)'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                  <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">Not Applicable for Non-Teaching Roles</h4>
                  <p className="text-xs text-slate-500 mt-1">Academic research and teaching metrics apply exclusively to Faculty positions.</p>
                  <div className="mt-4 p-3 max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left text-xs">
                    <p><strong>Qualification:</strong> {employee.qualification}</p>
                    <p className="mt-1"><strong>Experience:</strong> {employee.experienceYears || 0} Years</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. ATTENDANCE TAB */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Recent Attendance Logs</h4>
                <Badge variant="active">{attendanceRecords.length} Record(s)</Badge>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">In Time</th>
                      <th className="p-3">Out Time</th>
                      <th className="p-3">Work Hours</th>
                      <th className="p-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-medium">{r.date}</td>
                          <td className="p-3">
                            <Badge variant={r.status === 'PRESENT' ? 'active' : r.status === 'LATE' ? 'orange' : r.status === 'HALF_DAY' ? 'gold' : 'danger'}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3">{r.inTime || '--'}</td>
                          <td className="p-3">{r.outTime || '--'}</td>
                          <td className="p-3">{r.workHours || 8} hrs</td>
                          <td className="p-3 text-slate-500">{r.source}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No recent attendance logs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. LEAVE TAB */}
          {activeTab === 'LEAVE' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Annual Leave Quota & Balances</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {leaveBalances.map(b => (
                  <div key={b.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{b.leaveType}</span>
                    <h4 className="text-xl font-bold mt-1">{b.remaining} <span className="text-xs text-slate-400 font-normal">/ {b.openingBalance}</span></h4>
                    <p className="text-xs text-slate-500 mt-1">Used: {b.used} | Pending: {b.pending}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. PAYROLL TAB */}
          {activeTab === 'PAYROLL' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Approved Monthly Compensation</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-slate-500">Basic Pay (50%):</span> <p className="font-bold text-sm">₹{(employee.basicSalary || employee.salary * 0.5).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">HRA (20%):</span> <p className="font-bold text-sm">₹{(employee.hra || employee.salary * 0.2).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">DA (15%):</span> <p className="font-bold text-sm">₹{(employee.da || employee.salary * 0.15).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">Special Allowance (15%):</span> <p className="font-bold text-sm">₹{(employee.specialAllowance || employee.salary * 0.15).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">Gross Monthly Pay:</span> <p className="font-bold text-base text-blue-600">₹{Number(employee.salary).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">PF Deduction (12%):</span> <p className="font-semibold text-rose-600">₹{Math.round((employee.basicSalary || employee.salary * 0.5) * 0.12).toLocaleString()}</p></div>
                  <div><span className="text-slate-500">Professional Tax:</span> <p className="font-semibold text-rose-600">₹200</p></div>
                  <div><span className="text-slate-500">Estimated Net Pay:</span> <p className="font-bold text-base text-emerald-600">₹{Math.round(employee.salary - ((employee.basicSalary || employee.salary * 0.5) * 0.12) - 200).toLocaleString()}</p></div>
                </div>
              </div>

              <h4 className="font-semibold text-slate-900 dark:text-white mt-6">Generated Payslips</h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Slip #</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Gross Salary</th>
                      <th className="p-3">Deductions</th>
                      <th className="p-3">Net Pay</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {payslips.length > 0 ? (
                      payslips.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-semibold text-blue-600">{p.payrollNumber || p.id}</td>
                          <td className="p-3 font-medium">{p.month} {p.year}</td>
                          <td className="p-3">₹{p.grossSalary.toLocaleString()}</td>
                          <td className="p-3 text-rose-600">-₹{p.totalDeductions.toLocaleString()}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{p.netSalary.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant={p.status === 'PAID' ? 'active' : p.status === 'APPROVED' ? 'gold' : 'orange'}>
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No payslips generated for this employee yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. DOCUMENTS TAB */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Uploaded Verification Documents</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documents.length > 0 ? (
                  documents.map(d => (
                    <div key={d.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <Badge variant={d.verificationStatus === 'VERIFIED' ? 'active' : d.verificationStatus === 'PENDING' ? 'orange' : 'danger'}>
                            {d.verificationStatus}
                          </Badge>
                          <span className="text-xs text-slate-400">{d.uploadedDate}</span>
                        </div>
                        <h5 className="font-bold text-sm mt-2 text-slate-900 dark:text-white">{d.documentTitle}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{d.documentType}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-400">By: {d.uploadedBy}</span>
                        <a href={d.fileUrl || '#'} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> View
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. ASSETS TAB */}
          {activeTab === 'ASSETS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Assigned Institutional Assets (University Asset Master)</h4>
                <Badge variant="active">{assets.length} Assets</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.length > 0 ? (
                  assets.map(a => (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-600">{a.assetId}</span>
                          <Badge variant="active">{a.condition}</Badge>
                        </div>
                        <h5 className="font-bold text-sm mt-1">{a.name}</h5>
                        <p className="text-xs text-slate-500">{a.category} • S/N: {a.serialNumber || 'N/A'}</p>
                        <p className="text-xs text-slate-400 mt-2">Allocated on: {a.allottedDate || 'Active'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500">
                    <Laptop className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    No institutional assets assigned to this employee.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 10. AUDIT TAB */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Chronological HR Audit Trail</h4>
              <div className="space-y-3">
                {auditLogs.length > 0 ? (
                  auditLogs.map(log => (
                    <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{log.actionType}</span>
                          <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>
                        <span className="text-[11px] text-slate-400 mt-1 block">By: {log.performedByName} ({log.performedByRole})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl">
                    No audit records logged yet for this employee.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
