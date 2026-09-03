import React, { useState } from 'react';
import { Calendar, Users, Building2, Layers, BookOpen } from 'lucide-react';
import { TimetableGeneratorWorkspace } from '../components/TimetableGeneratorWorkspace';
import { FacultyWorkloadMatrix } from '../components/FacultyWorkloadMatrix';
import { academicsTimetableService } from '../services/academicsTimetableService';
import { Badge } from '../../../components/common/Badge';

export const AcademicsGovernancePage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'GENERATOR' | 'WORKLOAD' | 'ROOMS'>('GENERATOR');
  const [selectedDept, setSelectedDept] = useState<string>('dept-cse');

  const roomMetrics = academicsTimetableService.getRoomOccupancyMetrics(selectedDept);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Academics & Timetable Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized academic structure, automated draft timetable scheduling, and faculty teaching workload optimization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="dept-cse">Computer Science & Engineering</option>
            <option value="dept-me">Mechanical Engineering</option>
            <option value="dept-pharm">Pharmacy</option>
            <option value="dept-mgmt">Management Studies</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('GENERATOR')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'GENERATOR'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Timetable Generator (Draft Preview)
        </button>

        <button
          onClick={() => setActiveSubTab('WORKLOAD')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'WORKLOAD'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Faculty Workload Allocation
        </button>

        <button
          onClick={() => setActiveSubTab('ROOMS')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'ROOMS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Room & Lab Occupancy
        </button>
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'GENERATOR' && (
        <TimetableGeneratorWorkspace departmentId={selectedDept} />
      )}

      {activeSubTab === 'WORKLOAD' && (
        <FacultyWorkloadMatrix departmentId={selectedDept} />
      )}

      {activeSubTab === 'ROOMS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Classroom & Laboratory Utilization Index
            </h3>
            <span className="text-xs text-slate-500">Department: {selectedDept}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roomMetrics.map(r => (
              <div key={r.roomNumber} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">{r.roomNumber}</span>
                  <Badge variant={r.roomType === 'LABORATORY' ? 'purple' : 'navy'}>
                    {r.roomType === 'LABORATORY' ? 'Laboratory' : 'Lecture Hall'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Capacity:</span>
                  <span className="font-semibold">{r.capacity} Students</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Weekly Occupancy:</span>
                  <span className="font-semibold">{r.occupiedSlots} / {r.totalSlots} slots</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${r.occupancyPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
