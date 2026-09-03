import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { StatCard } from '../common/StatCard';
import { PieChart } from '../common/Charts';
import { Badge } from '../common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../common/ExcelTable';
import {
  managementAnalyticsService,
  ManagementSummaryPayload,
  ManagementNotesheetsPayload,
  ManagementExpensesPayload,
  ManagementGatePassPayload,
  AnalyticsFilterParams,
} from '../../services/managementAnalyticsService';
import {
  GraduationCap, Users, Clock, CheckCircle2, IndianRupee,
  Home, AlertTriangle, HelpCircle, Filter, RefreshCw,
  Search, Calendar, Building2, Layers, Loader2, FileText,
  TrendingUp, ArrowRight, ShieldCheck, Download
} from 'lucide-react';

interface ManagementAnalyticsDashboardProps {
  onNavigateTab?: (tab: string, params?: any) => void;
}

export const ManagementAnalyticsDashboard: React.FC<ManagementAnalyticsDashboardProps> = ({ onNavigateTab }) => {
  const { user, role } = useAuth();

  // Filters State
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedInstitute, setSelectedInstitute] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  // Master Data
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();

  // Scope Restrictions
  const isPrincipal = role === 'PRINCIPAL';
  const isHod = role === 'HOD';
  const canFilterInstitute = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'REGISTRAR'].includes(role || '');
  const canFilterDepartment = canFilterInstitute || isPrincipal;

  // Initialize scope defaults
  useEffect(() => {
    if (isPrincipal && user?.instituteId) {
      setSelectedInstitute(user.instituteId);
    }
    if (isHod) {
      if (user?.instituteId) setSelectedInstitute(user.instituteId);
      if (user?.departmentId) setSelectedDepartment(user.departmentId);
    }
  }, [user, isPrincipal, isHod]);

  // Analytics Payload States
  const [summary, setSummary] = useState<ManagementSummaryPayload | null>(null);
  const [notesheets, setNotesheets] = useState<ManagementNotesheetsPayload | null>(null);
  const [expenses, setExpenses] = useState<ManagementExpensesPayload | null>(null);
  const [gatePass, setGatePass] = useState<ManagementGatePassPayload | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all management analytics concurrently
  const loadAnalytics = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const filterParams: AnalyticsFilterParams = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      instituteId: selectedInstitute !== 'ALL' ? selectedInstitute : undefined,
      departmentId: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
    };

    try {
      const [sumRes, nsRes, expRes, gpRes] = await Promise.all([
        managementAnalyticsService.getSummary(filterParams),
        managementAnalyticsService.getNotesheets(filterParams),
        managementAnalyticsService.getExpenses(filterParams),
        managementAnalyticsService.getGatePass(filterParams),
      ]);

      setSummary(sumRes);
      setNotesheets(nsRes);
      setExpenses(expRes);
      setGatePass(gpRes);
    } catch (err: any) {
      console.error('Failed to load management analytics:', err);
      setErrorMessage(err.message || 'Failed to fetch management analytics from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedInstitute, selectedDepartment]);

  const handleApplyDateFilters = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setErrorMessage('Invalid date range: Start Date cannot be after End Date.');
      return;
    }
    loadAnalytics();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    if (canFilterInstitute) setSelectedInstitute('ALL');
    if (canFilterDepartment) setSelectedDepartment('ALL');
  };

  // 1. Chart: Notesheet Status Breakdown
  const notesheetStatusChartData = [
    { label: 'Approved', value: notesheets?.approvedCount || 0, color: '#10B981' },
    { label: 'Pending Approval', value: notesheets?.pendingCount || 0, color: '#F59E0B' },
    { label: 'Under Review / In Progress', value: notesheets?.inProgressCount || 0, color: '#3B82F6' },
    { label: 'Rejected', value: notesheets?.rejectedCount || 0, color: '#EF4444' },
  ];

  // 2. Chart: Department-wise Pending Notesheets
  const deptPendingChartData = (notesheets?.departmentWisePending || []).slice(0, 6).map((item, idx) => {
    const colors = ['#F59E0B', '#F97316', '#EF4444', '#8B5CF6', '#3B82F6', '#14B8A6'];
    return {
      label: item.department,
      value: item.count,
      color: colors[idx % colors.length],
    };
  });

  // 3. Chart: Monthly Approved Expense Breakdown
  const monthlyExpenseChartData = (expenses?.monthlyApprovedExpenseTrend || []).slice(-5).map((item, idx) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return {
      label: item.month,
      value: item.amount,
      color: colors[idx % colors.length],
    };
  });

  // 4. Chart: Hostel-wise Gate Pass Outings
  const hostelOutingsChartData = (gatePass?.hostelWiseOutings || []).slice(0, 5).map((item, idx) => {
    const colors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6'];
    return {
      label: item.hostel,
      value: item.count,
      color: colors[idx % colors.length],
    };
  });

  // 5. Chart: Financial Approved vs. Pending Value
  const financePipelineChartData = [
    { label: 'Sanctioned & Approved', value: expenses?.approvedVsPendingValue?.approvedValue || 0, color: '#10B981' },
    { label: 'Pending Approval Pipeline', value: expenses?.approvedVsPendingValue?.pendingValue || 0, color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
              University Management &amp; Operational Analytics
            </h2>
            <Badge variant="navy">EXECUTIVE KPI SUITE</Badge>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Real-time database analytics across Notesheets, Sanctioned Expenses, Hostel Outings, and Campus Operations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          title="Reload analytics data"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Parameterized Server-Side Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
        <form onSubmit={handleApplyDateFilters} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Institute Filter */}
            {canFilterInstitute && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                  Institute
                </label>
                <select
                  className="form-select"
                  value={selectedInstitute}
                  onChange={e => setSelectedInstitute(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8125rem', borderColor: '#CBD5E1', minWidth: '160px' }}
                >
                  <option value="ALL">All Institutes</option>
                  {institutes.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter */}
            {canFilterDepartment && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                  Department
                </label>
                <select
                  className="form-select"
                  value={selectedDepartment}
                  onChange={e => setSelectedDepartment(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8125rem', borderColor: '#CBD5E1', minWidth: '160px' }}
                >
                  <option value="ALL">All Departments</option>
                  {departments
                    .filter(d => selectedInstitute === 'ALL' || d.instituteId === selectedInstitute)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                </select>
              </div>
            )}

            {/* Date Range: From */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                From Date
              </label>
              <input
                type="date"
                className="input-field"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ height: '36px', fontSize: '0.8125rem', borderColor: '#CBD5E1' }}
              />
            </div>

            {/* Date Range: To */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
                To Date
              </label>
              <input
                type="date"
                className="input-field"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{ height: '36px', fontSize: '0.8125rem', borderColor: '#CBD5E1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: '36px', padding: '0 1rem', fontWeight: 700, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ height: '36px', padding: '0 0.85rem' }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '6px', color: '#991B1B', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} color="#DC2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !summary && (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--brand-orange, #F37023)' }} />
          <p style={{ fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>Computing University Management Metrics...</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Aggregating notesheet approvals, sanctioned budgets, and gate pass outings</p>
        </div>
      )}

      {/* 8 MANAGEMENT KPI STAT CARDS */}
      {summary && (
        <div className="grid-4" style={{ gap: '1rem' }}>
          {/* 1. Total Enrolled Students */}
          <StatCard
            title="Total Students"
            value={summary.totalStudents.toLocaleString()}
            subtitle="Campus-wide Enrolled"
            trend="+5.2% YoY"
            icon={GraduationCap}
            colorScheme="orange"
            onClick={() => onNavigateTab && onNavigateTab('students')}
          />

          {/* 2. Total Faculty & Staff */}
          <StatCard
            title="Faculty & Staff"
            value={summary.totalFacultyStaff.toLocaleString()}
            subtitle="Academic & Non-Teaching"
            trend="Active Roster"
            icon={Users}
            colorScheme="blue"
            onClick={() => onNavigateTab && onNavigateTab('faculty')}
          />

          {/* 3. Pending Notesheets */}
          <StatCard
            title="Pending Notesheets"
            value={summary.pendingNotesheets.toLocaleString()}
            subtitle="Awaiting Administrative Approval"
            trend={summary.pendingNotesheets > 5 ? 'Action Required' : 'On Track'}
            icon={Clock}
            colorScheme={summary.pendingNotesheets > 10 ? 'gold' : 'orange'}
            onClick={() => onNavigateTab && onNavigateTab('notesheet')}
          />

          {/* 4. Approved Notesheets */}
          <StatCard
            title="Approved Notesheets"
            value={summary.approvedNotesheets.toLocaleString()}
            subtitle="Formally Sanctioned"
            trend="100% Verified"
            icon={CheckCircle2}
            colorScheme="green"
            onClick={() => onNavigateTab && onNavigateTab('notesheet')}
          />

          {/* 5. Monthly Approved Expense */}
          <StatCard
            title="Monthly Expense"
            value={`₹${(summary.monthlyApprovedExpense / 100000).toFixed(2)}L`}
            subtitle="Current Month Sanctioned"
            trend="Authoritative Sanctions"
            icon={IndianRupee}
            colorScheme="blue"
          />

          {/* 6. Today's Gate Pass Outings */}
          <StatCard
            title="Today's Outings"
            value={summary.todayGatePassOutings.toLocaleString()}
            subtitle="Actual Scanned Departures"
            trend="Security Gate Scans"
            icon={Home}
            colorScheme="orange"
            onClick={() => onNavigateTab && onNavigateTab('hostel')}
          />

          {/* 7. Currently Outside Students */}
          <StatCard
            title="Currently Outside"
            value={summary.currentlyOutsideStudents.toLocaleString()}
            subtitle="Checked Out • In-Campus Pending"
            trend={summary.currentlyOutsideStudents > 0 ? 'Active Off-Campus' : 'All Returned'}
            icon={AlertTriangle}
            colorScheme={summary.currentlyOutsideStudents > 20 ? 'gold' : 'green'}
            onClick={() => onNavigateTab && onNavigateTab('hostel')}
          />

          {/* 8. Open Helpdesk Tickets */}
          <StatCard
            title="Open Tickets"
            value={summary.openHelpdeskTickets.toLocaleString()}
            subtitle="Active Support Queue"
            trend="Helpdesk SLA"
            icon={HelpCircle}
            colorScheme={summary.openHelpdeskTickets > 10 ? 'gold' : 'blue'}
            onClick={() => onNavigateTab && onNavigateTab('serviceDesk')}
          />
        </div>
      )}

      {/* 5 VISUAL ANALYTICS CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Notesheet Status Breakdown */}
        <PieChart
          title="Notesheet Status Distribution"
          data={notesheetStatusChartData}
          badgeLabel="LIFECYCLE"
          summaryText={`Total ${notesheets?.totalNotesheets || 0} recorded notesheets. Average administrative turnaround duration: ${notesheets?.averageProcessingTimeHours || 0} hours.`}
        />

        {/* Chart 2: Department-wise Pending Notesheets */}
        <PieChart
          title="Department Pending Notesheets"
          data={deptPendingChartData.length > 0 ? deptPendingChartData : [{ label: 'All Cleared', value: 1, color: '#10B981' }]}
          badgeLabel="PENDING QUEUE"
          summaryText={`Departments with actionable notesheets awaiting clearance. Top load is currently observed in ${deptPendingChartData[0]?.label || 'General'}.`}
        />

        {/* Chart 3: Monthly Approved Expense Trend */}
        <PieChart
          title="Monthly Sanctioned Expense"
          data={monthlyExpenseChartData.length > 0 ? monthlyExpenseChartData : [{ label: 'Current Term', value: expenses?.totalApprovedAmount || 0, color: '#3B82F6' }]}
          unit="₹"
          badgeLabel="SANCTIONS"
          summaryText={`Cumulative sanctioned expenses: ₹${(expenses?.totalApprovedAmount || 0).toLocaleString()}. Based exclusively on sealed Notesheet.approvedAmount.`}
        />

        {/* Chart 4: Hostel-wise Gate Pass Outings */}
        <PieChart
          title="Hostel Outings Breakdown"
          data={hostelOutingsChartData.length > 0 ? hostelOutingsChartData : [{ label: 'General Hostels', value: 1, color: '#6366F1' }]}
          badgeLabel="CAMPUS SECURITY"
          summaryText={`Average daily campus departures: ${gatePass?.averageDailyOutings || 0} outings/day. Total ${gatePass?.dateRangeTotalOutings || 0} outings in selected period.`}
        />

        {/* Chart 5: Financial Approved vs. Pending Value */}
        <PieChart
          title="Financial Pipeline (Approved vs. Pending)"
          data={financePipelineChartData}
          unit="₹"
          badgeLabel="BUDGET PIPELINE"
          summaryText={`Total financial pipeline under review: ₹${(expenses?.approvedVsPendingValue?.totalPipelineValue || 0).toLocaleString()} with ${expenses?.approvedVsPendingValue?.approvedPercentage || 0}% sanctioned.`}
        />
      </div>

      {/* EXCEL TABLE: OLDEST PENDING NOTESHEETS (SLA ATTENTION REGISTER) */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Oldest Pending Notesheets (Action SLA Attention)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Requires immediate administrative review or syndication sign-off
            </p>
          </div>
          <Badge variant="warning">OLDEST 5 PENDING</Badge>
        </div>

        <ExcelTableContainer minWidth="100%">
          <ExcelTable>
            <thead>
              <tr>
                <ExcelTh align="center" style={{ width: '60px' }}>SR.</ExcelTh>
                <ExcelTh align="center" style={{ width: '170px' }}>NOTESHEET NO.</ExcelTh>
                <ExcelTh align="left" style={{ minWidth: '220px' }}>SUBJECT / TITLE</ExcelTh>
                <ExcelTh align="center" style={{ width: '130px' }}>DEPARTMENT</ExcelTh>
                <ExcelTh align="center" style={{ width: '100px' }}>PRIORITY</ExcelTh>
                <ExcelTh align="center" style={{ width: '90px' }}>AGE</ExcelTh>
                <ExcelTh align="right" style={{ width: '120px' }}>EST. COST</ExcelTh>
                <ExcelTh align="center" style={{ width: '110px' }}>STATUS</ExcelTh>
              </tr>
            </thead>
            <tbody>
              {!notesheets?.oldestPendingNotesheets || notesheets.oldestPendingNotesheets.length === 0 ? (
                <tr>
                  <ExcelTd colSpan={8} align="center" style={{ padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto', color: '#10B981' }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--brand-navy)' }}>No pending notesheets</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem' }}>All administrative notesheets have been acted upon</p>
                  </ExcelTd>
                </tr>
              ) : (
                notesheets.oldestPendingNotesheets.map((ns, idx) => (
                  <tr key={ns.id}>
                    <ExcelTd align="center" mono color="var(--brand-navy)">
                      {idx + 1}
                    </ExcelTd>
                    <ExcelTd align="center" mono>
                      <strong>{ns.notesheetNumber}</strong>
                    </ExcelTd>
                    <ExcelTd align="left">
                      <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{ns.title}</span>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant="navy">{ns.department || 'GENERAL'}</Badge>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant={ns.priority === 'URGENT' ? 'danger' : ns.priority === 'IMPORTANT' ? 'orange' : 'navy'}>
                        {ns.priority}
                      </Badge>
                    </ExcelTd>
                    <ExcelTd align="center">
                      <span style={{ fontWeight: 700, color: ns.ageDays > 7 ? '#DC2626' : 'var(--brand-navy)' }}>
                        {ns.ageDays} days
                      </span>
                    </ExcelTd>
                    <ExcelTd align="right" mono>
                      ₹{ns.estimatedCost.toLocaleString()}
                    </ExcelTd>
                    <ExcelTd align="center">
                      <Badge variant="orange">{ns.status.replace('_', ' ')}</Badge>
                    </ExcelTd>
                  </tr>
                ))
              )}
            </tbody>
          </ExcelTable>
        </ExcelTableContainer>
      </div>
    </div>
  );
};

export default ManagementAnalyticsDashboard;
