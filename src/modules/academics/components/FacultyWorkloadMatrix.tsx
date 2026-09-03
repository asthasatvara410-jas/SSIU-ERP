import React, { useState } from 'react';
import { Users, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { academicsTimetableService } from '../services/academicsTimetableService';
import { FacultyWorkloadSummary } from '../types';

interface FacultyWorkloadMatrixProps {
  departmentId?: string;
}

export const FacultyWorkloadMatrix: React.FC<FacultyWorkloadMatrixProps> = ({ departmentId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const workloads: FacultyWorkloadSummary[] = academicsTimetableService.getFacultyWorkloadSummaries(departmentId);

  const filteredWorkloads = workloads.filter(f =>
    f.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Faculty Teaching Workload & Allocation Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Weekly teaching hours and lecture caps evaluated against UGC and AICTE workload standards.
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter faculty..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Faculty Member</th>
              <th className="py-3 px-4">Department & Role</th>
              <th className="py-3 px-4">Assigned Subjects</th>
              <th className="py-3 px-4">Weekly Teaching Hours</th>
              <th className="py-3 px-4">Workload Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredWorkloads.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No faculty workload records match query.
                </td>
              </tr>
            ) : (
              filteredWorkloads.map(f => (
                <tr key={f.facultyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{f.facultyName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{f.facultyId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-700 font-medium">{f.departmentName}</div>
                    <div className="text-[11px] text-slate-400">{f.designation}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {f.assignedSubjects.length === 0 ? (
                        <span className="text-slate-400 italic">No assigned subjects</span>
                      ) : (
                        f.assignedSubjects.map(s => (
                          <Badge key={s.subjectId} variant="navy">
                            {s.subjectCode} ({s.weeklyHours}h)
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{f.totalAssignedWeeklyHours}</span>
                      <span className="text-slate-400">/ {f.maxAllowedWeeklyHours} hrs/wk</span>
                    </div>
                    <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          f.isOverloaded ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, f.workloadPercentage)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={f.isOverloaded ? 'danger' : 'success'}>
                      {f.isOverloaded ? 'Workload Cap Exceeded' : 'Optimal Capacity'}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
