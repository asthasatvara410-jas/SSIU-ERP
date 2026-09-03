import React, { useState } from 'react';
import { Calendar, Play, AlertTriangle, CheckCircle2, Clock, MapPin, Users, Layers } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { academicsTimetableService } from '../services/academicsTimetableService';
import { GeneratedTimetablePreview, DayOfWeek } from '../types';

interface TimetableGeneratorWorkspaceProps {
  departmentId?: string;
}

export const TimetableGeneratorWorkspace: React.FC<TimetableGeneratorWorkspaceProps> = ({ departmentId }) => {
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<number>(18);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewSchedule, setPreviewSchedule] = useState<GeneratedTimetablePreview | null>(null);

  const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const preview = academicsTimetableService.generateTimetablePreview({
        departmentId: departmentId || 'dept-cse',
        workingDays: days,
        periodSlots: academicsTimetableService.getDefaultPeriodSlots(),
        maxDailyHoursPerFaculty: 4,
        maxWeeklyHoursPerFaculty: maxWeeklyHours,
        allowConsecutiveLabs: true
      });
      setPreviewSchedule(preview);
      setIsGenerating(false);
    }, 400);
  };

  const filteredEntries = previewSchedule?.entries.filter(e => e.day === selectedDay) || [];

  return (
    <div className="space-y-6">
      {/* Top Generator Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Automated Timetable Generation Engine (Draft Preview)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Constraint-satisfaction scheduler matching course credits, faculty availability, and laboratory capacities without mutating live schedules.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Max Weekly Load:</span>
              <input
                type="number"
                value={maxWeeklyHours}
                onChange={e => setMaxWeeklyHours(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs"
                min={10}
                max={30}
              />
              <span>hrs</span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {isGenerating ? 'Computing Schedule...' : 'Generate Draft Preview'}
            </button>
          </div>
        </div>

        {/* Status Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Safe Non-Destructive Mode:</strong> This engine produces memory-isolated preview schedules. Live student and faculty timetables will not be altered.
          </span>
        </div>
      </div>

      {/* Preview Telemetry & Metrics */}
      {previewSchedule && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sessions Scheduled</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {previewSchedule.utilizationMetrics.totalSessionsScheduled}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">Weekly Lectures & Labs</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Room Occupancy Rate</span>
                <MapPin className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {previewSchedule.utilizationMetrics.roomOccupancyRate}%
              </p>
              <span className="text-[11px] text-slate-500 font-medium">Classrooms & Labs utilized</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Faculty Utilization</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {previewSchedule.utilizationMetrics.facultyUtilizationRate}%
              </p>
              <span className="text-[11px] text-indigo-600 font-medium">Optimal Workload Balance</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status & Integrity</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {previewSchedule.conflicts.length === 0 ? 'Optimal' : `${previewSchedule.conflicts.length} Notice(s)`}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">
                {previewSchedule.conflicts.filter(c => c.severity === 'CRITICAL').length} Critical Clashes
              </span>
            </div>
          </div>

          {/* Day Selector & Schedule Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      selectedDay === day
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <Badge variant="navy">
                Draft Schedule ID: {previewSchedule.scheduleId}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Period / Time</th>
                    <th className="py-3 px-4">Subject & Code</th>
                    <th className="py-3 px-4">Assigned Faculty</th>
                    <th className="py-3 px-4">Room / Lab</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No periods scheduled for {selectedDay}.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {entry.timeSlot}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{entry.subjectName}</div>
                          <div className="text-[11px] text-slate-400">{entry.subjectCode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {entry.facultyName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-medium text-slate-800">{entry.roomNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="navy">{entry.section}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={entry.roomType === 'LABORATORY' ? 'purple' : 'gold'}>
                            {entry.roomType === 'LABORATORY' ? 'Lab Practical' : 'Lecture'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
