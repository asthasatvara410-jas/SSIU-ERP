/**
 * SSIU ERP — Attendance Shortage Alerts & Exam Eligibility Component
 * File: src/modules/attendance/components/AttendanceShortageAlertCard.tsx
 */

import React, { useState } from 'react';
import { UserCheck, AlertTriangle, AlertOctagon, CheckCircle2, Search, Filter } from 'lucide-react';
import { AttendanceAnalyticsOverviewDTO, StudentAttendanceShortageDTO } from '../types';
import { Badge } from '../../../components/common/Badge';

interface AttendanceShortageAlertCardProps {
  overview: AttendanceAnalyticsOverviewDTO;
  students: StudentAttendanceShortageDTO[];
}

export const AttendanceShortageAlertCard: React.FC<AttendanceShortageAlertCardProps> = ({ overview, students }) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = severityFilter === 'ALL' || s.shortageSeverity === severityFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(30, 62, 98, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-navy)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Campus Average Attendance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{overview.averageAttendancePercentage}%</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{overview.totalSessionsRecorded} Total Class Sessions</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Eligible for Final Exams</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{overview.eligibleForExamsCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance &gt;= 75% Norm</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Attendance Shortage Warning</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{overview.studentsWithShortage}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Between 60% and 74.9%</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Critical Debarment Risk</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>{overview.criticalShortageCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>Below 60% Attendance</div>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--brand-orange)" /> Student Attendance &amp; Exam Debarment Registry
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Live threshold analysis evaluating hall-ticket generation eligibility based on UGC 75% attendance criteria.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search student, enrollment..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', minWidth: '220px' }}
              />
            </div>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Categories</option>
              <option value="CRITICAL">Critical Debarment (&lt;60%)</option>
              <option value="WARNING">Shortage Warning (60-75%)</option>
              <option value="ELIGIBLE">Exam Eligible (&gt;=75%)</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th>Enrollment No</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Classes Attended</th>
                <th>Attendance %</th>
                <th>Exam Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.slice(0, 20).map(s => (
                <tr key={s.studentId}>
                  <td style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{s.enrollmentNumber}</td>
                  <td style={{ fontWeight: 700 }}>{s.studentName}</td>
                  <td>{s.departmentName}</td>
                  <td>Sem {s.semester}</td>
                  <td>{s.classesAttended} / {s.totalClassesHeld}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', minWidth: '50px' }}>
                        <div style={{ width: `${s.attendancePercentage}%`, height: '100%', background: s.attendancePercentage >= 75 ? '#10B981' : s.attendancePercentage >= 60 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{s.attendancePercentage}%</span>
                    </div>
                  </td>
                  <td>
                    {s.isDebarredFromExams ? (
                      <Badge variant="danger">Debarred (&lt;60%)</Badge>
                    ) : s.shortageSeverity === 'WARNING' ? (
                      <Badge variant="warning">Shortage Notice</Badge>
                    ) : (
                      <Badge variant="success">Eligible</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
