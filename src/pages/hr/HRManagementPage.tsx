import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { 
  Users, UserCheck, CreditCard, Calendar, Award, FileSpreadsheet, 
  Plus, Search, Filter, Download, CheckCircle2, XCircle, Clock, FileText, 
  Building2, Briefcase, GraduationCap, ShieldCheck, DollarSign
} from 'lucide-react';
import { Employee, PayrollRecord, EmployeeLeaveApplication, PerformanceAppraisal, TrainingFdpRecord, ApprovalStatus } from '../../types';
import { exportToExcel, exportToWord } from '../../services/exportService';

export const HRManagementPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PAYROLL' | 'LEAVE' | 'APPRAISAL' | 'FDP' | 'ONBOARDING'>('DIRECTORY');

  // Data state from db
  const [employees, setEmployees] = useState<Employee[]>(db.getEmployees());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(db.getPayrollRecords());
  const [leaves, setLeaves] = useState<EmployeeLeaveApplication[]>(db.getEmployeeLeaveApplications());
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>(db.getPerformanceAppraisals());
  const [fdpRecords, setFdpRecords] = useState<TrainingFdpRecord[]>(db.getTrainingFdpRecords());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterInstituteId, setFilterInstituteId] = useState<string>('ALL');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('ALL');
  const [filterEmployeeType, setFilterEmployeeType] = useState<string>('ALL');

  // Modals state
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form input state for New Employee
  const [empName, setEmpName] = useState<string>('');
  const [empEmail, setEmpEmail] = useState<string>('');
  const [empPhone, setEmpPhone] = useState<string>('');
  const [empDesignation, setEmpDesignation] = useState<string>('Assistant Professor');
  const [empType, setEmpType] = useState<Employee['employeeType']>('FACULTY');
  const [empInstId, setEmpInstId] = useState<string>('inst-1');
  const [empDeptId, setEmpDeptId] = useState<string>('dept-1');
  const [empSalary, setEmpSalary] = useState<number>(75000);
  const [empQual, setEmpQual] = useState<string>('Ph.D Computer Science');

  // Form input state for Leave Application
  const [leaveType, setLeaveType] = useState<EmployeeLeaveApplication['leaveType']>('CASUAL');
  const [startDate, setStartDate] = useState<string>('2026-08-25');
  const [endDate, setEndDate] = useState<string>('2026-08-26');
  const [leaveReason, setLeaveReason] = useState<string>('Attending Faculty Development Workshop');

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    if (filterInstituteId !== 'ALL' && emp.instituteId !== filterInstituteId) return false;
    if (filterDepartmentId !== 'ALL' && emp.departmentId !== filterDepartmentId) return false;
    if (filterEmployeeType !== 'ALL' && emp.employeeType !== filterEmployeeType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.employeeId.toLowerCase().includes(q) || emp.designation.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP-2024-00${employees.length + 1}`,
      name: empName,
      email: empEmail,
      phone: empPhone,
      designation: empDesignation,
      employeeType: empType,
      instituteId: empInstId,
      departmentId: empDeptId,
      joiningDate: new Date().toISOString().split('T')[0],
      salary: Number(empSalary),
      bankAccountNo: `SBIN000${Math.floor(100000 + Math.random() * 900000)}`,
      panNo: 'ABCDE1234F',
      aadhaarNo: '1234-5678-9012',
      qualification: empQual,
      experienceYears: 5,
      status: 'ACTIVE'
    };

    db.addEntity('employees', newEmp as any, `Onboarded new staff member ${newEmp.name}`);
    setEmployees(db.getEmployees());
    setShowAddEmpModal(false);
    setSuccessMsg(`Staff member ${newEmp.name} (${newEmp.employeeId}) onboarded successfully.`);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = db.submitEmployeeLeave({
      employeeId: user.id,
      employeeName: user.name,
      departmentId: user.departmentId || 'dept-1',
      leaveType,
      startDate,
      endDate,
      totalDays: totalDays > 0 ? totalDays : 1,
      reason: leaveReason
    }, user);

    setLeaves(db.getEmployeeLeaveApplications());
    setShowApplyLeaveModal(false);
    setSuccessMsg(`Leave application for ${newLeave.totalDays} day(s) submitted for HOD & HR approval.`);
  };

  const handleApproveLeave = (leaveId: string, status: ApprovalStatus) => {
    if (!user) return;
    db.approveEmployeeLeave(leaveId, user, status);
    setLeaves(db.getEmployeeLeaveApplications());
    setSuccessMsg(`Leave request status updated to ${status}.`);
  };

  const handleDownloadPayslip = (pay: PayrollRecord) => {
    const content = `===================================================================
SWARRNIM STARTUP & INNOVATION UNIVERSITY - OFFICIAL SALARY PAYSLIP
===================================================================
Payslip Month : ${pay.month}
Employee Name : ${pay.employeeName}
Employee ID   : ${pay.employeeId}
Status        : ${pay.status} (Paid Date: ${pay.paidDate || 'N/A'})
-------------------------------------------------------------------
EARNINGS BREAKDOWN:
-------------------------------------------------------------------
Basic Pay           : Rs. ${pay.basicPay.toLocaleString()}
HRA (House Rent)    : Rs. ${pay.hra.toLocaleString()}
DA (Dearness Allow) : Rs. ${pay.da.toLocaleString()}
Special Allowance   : Rs. ${pay.specialAllowance.toLocaleString()}
GROSS SALARY        : Rs. ${pay.grossSalary.toLocaleString()}
-------------------------------------------------------------------
DEDUCTIONS BREAKDOWN:
-------------------------------------------------------------------
Provident Fund (PF) : Rs. ${pay.pfDeduction.toLocaleString()}
Professional Tax    : Rs. ${pay.taxDeduction.toLocaleString()}
TOTAL DEDUCTIONS    : Rs. ${(pay.pfDeduction + pay.taxDeduction).toLocaleString()}
-------------------------------------------------------------------
NET SALARY PAYABLE  : Rs. ${pay.netSalary.toLocaleString()}
===================================================================
Human Resources Division, Swarrnim Startup & Innovation University
===================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${pay.employeeName.replace(/[^a-z0-9]/gi, '_')}_${pay.month.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Human Resources &amp; Staff Administration
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Faculty &amp; staff master directory, monthly payroll, leave workflows, performance appraisals &amp; FDP training
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowApplyLeaveModal(true)}>
            <Calendar size={16} /> Apply for Leave
          </button>
          {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddEmpModal(true)}>
              <Plus size={16} /> Onboard New Employee
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#059669" />
          {successMsg}
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${activeTab === 'DIRECTORY' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('DIRECTORY')}>
          <Users size={16} /> Employee Directory ({employees.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'PAYROLL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('PAYROLL')}>
          <CreditCard size={16} /> Payroll &amp; Payslips ({payrolls.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'LEAVE' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('LEAVE')}>
          <Calendar size={16} /> Leave Approvals ({leaves.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'APPRAISAL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('APPRAISAL')}>
          <Award size={16} /> PBAS Appraisals ({appraisals.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'FDP' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('FDP')}>
          <GraduationCap size={16} /> Training &amp; FDP Logs ({fdpRecords.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'ONBOARDING' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('ONBOARDING')}>
          <ShieldCheck size={16} /> Onboarding &amp; Relieving
        </button>
      </div>

      {/* ─── TAB 1: EMPLOYEE MASTER DIRECTORY ───────────────────────────────── */}
      {activeTab === 'DIRECTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Cards */}
          <div className="grid-4">
            <StatCard title="Total University Employees" value={String(employees.length)} icon={Users} subtitle="Active Staff &amp; Faculty" />
            <StatCard title="Full-Time Teaching Staff" value={String(employees.filter(e => e.employeeType === 'FACULTY').length)} icon={GraduationCap} subtitle="Professors &amp; Instructors" />
            <StatCard title="Monthly Payroll Outflow" value={`₹${(employees.reduce((acc, e) => acc + e.salary, 0) / 100000).toFixed(2)} L`} icon={DollarSign} subtitle="Gross Monthly Salary" />
            <StatCard title="Pending Leave Requests" value={String(leaves.filter(l => l.status === 'SUBMITTED' || l.status === 'PENDING').length)} icon={Clock} subtitle="Awaiting Approval" />
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--brand-orange)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Filter Employee Directory:</span>
            </div>

            <input type="text" className="form-input" style={{ maxWidth: '240px' }} placeholder="Search Name / Emp ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

            <select className="form-select" style={{ maxWidth: '220px' }} value={filterInstituteId} onChange={e => setFilterInstituteId(e.target.value)}>
              <option value="ALL">All Institutes</option>
              {institutes.map(i => <option key={i.id} value={i.id}>{i.code}</option>)}
            </select>

            <select className="form-select" style={{ maxWidth: '220px' }} value={filterDepartmentId} onChange={e => setFilterDepartmentId(e.target.value)}>
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <select className="form-select" style={{ maxWidth: '180px' }} value={filterEmployeeType} onChange={e => setFilterEmployeeType(e.target.value)}>
              <option value="ALL">All Staff Types</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN_STAFF">Admin Staff</option>
              <option value="TECHNICAL_STAFF">Technical Staff</option>
            </select>
          </div>

          {/* Employee Directory Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Employee Directory Master Register ({filteredEmployees.length})
              </h3>

              <button className="btn btn-secondary btn-sm" onClick={() => {
                exportToExcel(
                  'SSIU Employee Directory Master Register',
                  ['Emp ID', 'Name', 'Designation', 'Type', 'Joining Date', 'Gross Salary', 'Qualification', 'Status'],
                  filteredEmployees.map(e => [e.employeeId, e.name, e.designation, e.employeeType, e.joiningDate, e.salary, e.qualification, e.status]),
                  {},
                  { name: user?.name, role: user?.role }
                );
              }}>
                <FileSpreadsheet size={16} /> Export Directory (Excel)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th>Joining Date</th>
                    <th>Monthly Salary</th>
                    <th>Qualification</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td><strong>{emp.employeeId}</strong></td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </td>
                      <td>{emp.designation}</td>
                      <td><Badge variant="navy">{emp.employeeType}</Badge></td>
                      <td>{emp.joiningDate}</td>
                      <td><strong>₹{emp.salary.toLocaleString()}</strong></td>
                      <td style={{ fontSize: '0.8125rem' }}>{emp.qualification}</td>
                      <td><Badge variant={emp.status === 'ACTIVE' ? 'active' : 'orange'}>{emp.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PAYROLL & SALARY SLIPS ─────────────────────────────────── */}
      {activeTab === 'PAYROLL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Monthly Staff &amp; Faculty Payroll Ledger (August 2026)
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Detailed breakdown of Basic Pay, HRA, DA, PF deductions, Tax, and Net Pay
                </p>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => {
                exportToExcel(
                  'SSIU Monthly Payroll Disbursement Register - August 2026',
                  ['Employee ID', 'Name', 'Gross Salary', 'PF Deduction', 'Tax Deduction', 'Net Pay', 'Status'],
                  payrolls.map(p => [p.employeeId, p.employeeName, p.grossSalary, p.pfDeduction, p.taxDeduction, p.netSalary, p.status]),
                  {},
                  { name: user?.name, role: user?.role }
                );
              }}>
                <FileSpreadsheet size={16} /> Export Payroll Ledger (Excel)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Emp Name</th>
                    <th>Basic Pay</th>
                    <th>HRA</th>
                    <th>DA</th>
                    <th>Gross Pay</th>
                    <th>PF &amp; Tax</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(pay => (
                    <tr key={pay.id}>
                      <td><strong>{pay.employeeName}</strong></td>
                      <td>₹{pay.basicPay.toLocaleString()}</td>
                      <td>₹{pay.hra.toLocaleString()}</td>
                      <td>₹{pay.da.toLocaleString()}</td>
                      <td><strong>₹{pay.grossSalary.toLocaleString()}</strong></td>
                      <td><span style={{ color: '#EF4444' }}>-₹{(pay.pfDeduction + pay.taxDeduction).toLocaleString()}</span></td>
                      <td><strong style={{ color: '#10B981', fontSize: '0.95rem' }}>₹{pay.netSalary.toLocaleString()}</strong></td>
                      <td><Badge variant="active">{pay.status}</Badge></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPayslip(pay)}>
                          <Download size={14} /> Download Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LEAVE & ATTENDANCE APPROVALS ─────────────────────────────── */}
      {activeTab === 'LEAVE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              Employee Leave Applications &amp; Duty Leave Queue
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Applied Date</th>
                    <th>Employee Name</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leave applications in queue.</td></tr>
                  ) : (
                    leaves.map(lv => (
                      <tr key={lv.id}>
                        <td>{lv.appliedDate}</td>
                        <td><strong>{lv.employeeName}</strong></td>
                        <td><Badge variant="navy">{lv.leaveType}</Badge></td>
                        <td>{lv.startDate}</td>
                        <td>{lv.endDate}</td>
                        <td><strong>{lv.totalDays} Days</strong></td>
                        <td style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>{lv.reason}</td>
                        <td>
                          <Badge variant={lv.status === 'APPROVED' ? 'active' : lv.status === 'REJECTED' ? 'inactive' : 'orange'}>
                            {lv.status}
                          </Badge>
                        </td>
                        <td>
                          {(lv.status === 'SUBMITTED' || lv.status === 'PENDING') && (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR' || role === 'HOD') ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleApproveLeave(lv.id, 'APPROVED')}>Approve</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleApproveLeave(lv.id, 'REJECTED')}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Processed</span>
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
      )}

      {/* ─── TAB 4: PERFORMANCE APPRAISALS (PBAS & API SCORES) ───────────────── */}
      {activeTab === 'APPRAISAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              Faculty Performance Based Appraisal System (PBAS Scorecards)
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Academic Year</th>
                    <th>Teaching Score</th>
                    <th>Research Score</th>
                    <th>Admin Score</th>
                    <th>Overall PBAS Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisals.map(app => (
                    <tr key={app.id}>
                      <td><strong>{app.employeeName}</strong></td>
                      <td>2024-2025</td>
                      <td>{app.teachingRating} / 5.0</td>
                      <td>{app.researchRating} / 5.0</td>
                      <td>{app.administrativeRating} / 5.0</td>
                      <td><strong style={{ color: 'var(--brand-orange)', fontSize: '1rem' }}>{app.overallScore} / 5.0</strong></td>
                      <td><Badge variant="active">{app.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: TRAINING & FDP LOGS ───────────────────────────────────────── */}
      {activeTab === 'FDP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              Faculty Development Program (FDP) &amp; Workshop Logs
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>FDP Workshop Title</th>
                    <th>Organizing Body</th>
                    <th>Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fdpRecords.map(fdp => (
                    <tr key={fdp.id}>
                      <td><strong>{fdp.employeeName}</strong></td>
                      <td>{fdp.title}</td>
                      <td>{fdp.organizer}</td>
                      <td>{fdp.startDate} to {fdp.endDate}</td>
                      <td><Badge variant="active">{fdp.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: ONBOARDING & RELIEVING ───────────────────────────────────── */}
      {activeTab === 'ONBOARDING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Staff Onboarding &amp; Relieving Checklist
            </h3>

            <div className="grid-2">
              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Mandatory Document Checklist for New Faculty
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                  <div>✓ Ph.D Degree Certificate &amp; Marksheets</div>
                  <div>✓ Aadhaar &amp; PAN Card Verified</div>
                  <div>✓ Relieving Letter &amp; Service Certificate from Previous University</div>
                  <div>✓ Bank Account Details &amp; PF Transfer Forms</div>
                </div>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Relieving &amp; No-Dues Clearance Protocol
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                  <div>✓ Department Lab &amp; Asset No-Dues</div>
                  <div>✓ Central Library Book Return No-Dues</div>
                  <div>✓ Finance &amp; Accounts Advance Recovery Clearance</div>
                  <div>✓ Official Relieving Order Signed by Registrar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD NEW EMPLOYEE ────────────────────────────────────────── */}
      {showAddEmpModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Onboard New Faculty / University Staff Member
            </h3>

            <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={empName} onChange={e => setEmpName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email *</label>
                  <input type="email" className="form-input" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="text" className="form-input" value={empPhone} onChange={e => setEmpPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation *</label>
                  <input type="text" className="form-input" value={empDesignation} onChange={e => setEmpDesignation(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Staff Category *</label>
                  <select className="form-select" value={empType} onChange={e => setEmpType(e.target.value as any)}>
                    <option value="FACULTY">Faculty (Teaching)</option>
                    <option value="ADMIN_STAFF">Administrative Staff</option>
                    <option value="TECHNICAL_STAFF">Technical / Lab Staff</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gross Monthly Salary (₹) *</label>
                  <input type="number" className="form-input" value={empSalary} onChange={e => setEmpSalary(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Qualification *</label>
                <input type="text" className="form-input" value={empQual} onChange={e => setEmpQual(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Onboard Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: APPLY LEAVE ──────────────────────────────────────────────── */}
      {showApplyLeaveModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
              Apply for Employee Leave / Duty Leave
            </h3>

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value as any)}>
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="MEDICAL">Medical Leave (ML)</option>
                  <option value="DUTY_LEAVE">Academic Duty Leave (DL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Application *</label>
                <textarea className="form-input" rows={3} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Leave Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
