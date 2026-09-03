import React, { useState } from 'react';
import { Award, AlertTriangle, CheckCircle2, XCircle, Clock, Filter, ShieldAlert } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { examinationResultsService } from '../services/examinationResultsService';
import { ExamEligibilityResult } from '../types';

export const ExamEligibilityEvaluationDesk: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(75);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PROVISIONAL_HOLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const eligibilityList: ExamEligibilityResult[] = examinationResultsService.evaluateAllStudentsEligibility(
    undefined,
    threshold
  );

  const filteredList = eligibilityList.filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const eligibleCount = eligibilityList.filter(i => i.status === 'ELIGIBLE').length;
  const debarredCount = eligibilityList.filter(i => i.status === 'NOT_ELIGIBLE').length;
  const holdCount = eligibilityList.filter(i => i.status === 'PROVISIONAL_HOLD').length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Candidates Evaluated</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{eligibilityList.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Registered Examinees</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hall Ticket Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{eligibleCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">100% Clearance Approved</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Attendance Debarred</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1">{debarredCount}</p>
          <span className="text-[11px] text-rose-600 font-medium">&lt; {threshold}% Shortage Debarred</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Financial / Fee Holds</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{holdCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Provisional Pending Dues</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Debarment Threshold:</span>
            <select
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
            >
              <option value={75}>75% (Mandatory University Rule)</option>
              <option value={70}>70% (Special Concession)</option>
              <option value={65}>65% (Medical Exemption)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'ELIGIBLE', 'NOT_ELIGIBLE', 'PROVISIONAL_HOLD'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Search student or enrollment..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Eligibility Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student Name & Enrollment</th>
                <th className="py-3 px-4">Attendance Metric</th>
                <th className="py-3 px-4">Fee Clearance Status</th>
                <th className="py-3 px-4">Evaluation Audit Reasons</th>
                <th className="py-3 px-4">Final Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No student eligibility records found for criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.enrollmentNo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${item.hasAttendanceShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.attendancePercentage.toFixed(1)}%
                        </span>
                        <span className="text-slate-400">/ {item.attendanceThreshold}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.hasOverdueFeeHold ? (
                        <span className="text-rose-600 font-medium">₹{item.overdueFeeAmount.toLocaleString('en-IN')} Due</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Cleared</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-[11px] text-slate-600 truncate" title={item.reasons.join('; ')}>
                        {item.reasons[0]}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          item.status === 'ELIGIBLE'
                            ? 'success'
                            : item.status === 'NOT_ELIGIBLE'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {item.status === 'ELIGIBLE'
                          ? 'Hall Ticket Approved'
                          : item.status === 'NOT_ELIGIBLE'
                          ? 'Debarred'
                          : 'Provisional Hold'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
