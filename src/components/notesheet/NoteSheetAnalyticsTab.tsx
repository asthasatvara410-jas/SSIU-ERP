import React, { useMemo } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { NoteSheet } from '../../types';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  CornerUpLeft,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/numberFormat';

interface NoteSheetAnalyticsTabProps {
  notesheets?: NoteSheet[];
}

export const NoteSheetAnalyticsTab: React.FC<NoteSheetAnalyticsTabProps> = () => {
  const { user, role } = useAuth();
  const analytics = useMemo(() => db.getNoteSheetAnalytics(user, role || undefined), [user, role]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Turnaround</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {analytics.avgTurnaroundHours} <span className="text-sm font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Creation to final executive sanction</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Clearance</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatIndianCurrency(analytics.totalApprovedAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sanctioned of {formatIndianCurrency(analytics.totalRequestedAmount)} requested
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Workflow Volume</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {analytics.pendingCount} <span className="text-sm font-semibold text-slate-500">/ {analytics.totalNotesheets}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{analytics.approvedCount} approved • {analytics.rejectedCount} rejected</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Rates</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs text-slate-500 block">Return Rate</span>
                <span className="text-lg font-black text-amber-600">{analytics.returnRate}%</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-xs text-slate-500 block">Rejection Rate</span>
                <span className="text-lg font-black text-rose-600">{analytics.rejectionRate}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">First-pass review efficiency</p>
          </div>
        </div>
      </div>

      {/* Second Row: Pending Ageing & Stage Durations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Ageing */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Pending Ageing Analysis
            </h3>
            <span className="text-xs text-slate-400 font-bold">{analytics.pendingCount} Total Pending</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                <span className="text-emerald-700 dark:text-emerald-400">Under 48 Hours (Fresh)</span>
                <span>{analytics.pendingAgeing.under2Days} Notesheets</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${analytics.pendingCount > 0 ? (analytics.pendingAgeing.under2Days / analytics.pendingCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                <span className="text-amber-700 dark:text-amber-400">2 to 5 Days (In Progress)</span>
                <span>{analytics.pendingAgeing.twoToFiveDays} Notesheets</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${analytics.pendingCount > 0 ? (analytics.pendingAgeing.twoToFiveDays / analytics.pendingCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                <span className="text-rose-700 dark:text-rose-400">Over 5 Days (Bottleneck / Overdue)</span>
                <span>{analytics.pendingAgeing.above5Days} Notesheets</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${analytics.pendingCount > 0 ? (analytics.pendingAgeing.above5Days / analytics.pendingCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Average Duration Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Stage-wise Average Clearance Time
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Normalized SLA Target: 24h/stage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-2.5">Workflow Stage / Office</th>
                  <th className="p-2.5">Processed Count</th>
                  <th className="p-2.5">Average Duration</th>
                  <th className="p-2.5">SLA Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.stageAvgHours.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{st.stage}</td>
                    <td className="p-2.5 font-mono">{st.count} movements</td>
                    <td className="p-2.5 font-bold font-mono">{st.avgHours} hrs</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        st.avgHours <= 24 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {st.avgHours <= 24 ? 'Within SLA' : 'Slight Delay'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Third Row: Department & Approver Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Department Workload Distribution
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {analytics.departmentWorkload.map((dept, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{dept.department}</span>
                  <span className="text-slate-400">{dept.count} Total Notesheets</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-600 block">{dept.pending} Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approver Workload */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" />
              Authority Clearance Breakdown
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {analytics.approverWorkload.map((appr, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{appr.role}</span>
                  <span className="text-slate-400">{appr.processed} Endorsements Committed</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${appr.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {appr.pending} in Queue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
