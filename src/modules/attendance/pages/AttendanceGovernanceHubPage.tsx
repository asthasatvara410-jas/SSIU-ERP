/**
 * SSIU ERP — Attendance Intelligence Hub Page
 * File: src/modules/attendance/pages/AttendanceGovernanceHubPage.tsx
 */

import React, { useState } from 'react';
import { UserCheck, AlertTriangle, ClipboardList, BarChart3 } from 'lucide-react';
import { attendanceGovernanceAggregatorService } from '../services/attendanceGovernanceAggregatorService';
import { AttendanceShortageAlertCard } from '../components/AttendanceShortageAlertCard';
import { AttendanceCorrectionDesk } from '../components/AttendanceCorrectionDesk';
import { Badge } from '../../../components/common/Badge';

export const AttendanceGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CORRECTIONS'>('OVERVIEW');

  const overview = attendanceGovernanceAggregatorService.getAttendanceAnalyticsOverview();
  const students = attendanceGovernanceAggregatorService.getStudentsWithAttendanceShortage();
  const corrections = attendanceGovernanceAggregatorService.getAttendanceCorrectionRecords();

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Operations &amp; Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={28} color="var(--brand-orange)" /> Attendance Intelligence Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Multi-Department Attendance Averages, Shortage Warnings (&lt;75%) &amp; Exam Debarment Pre-Flight Audits.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-light)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={14} /> Shortage &amp; Exam Readiness
          </button>

          <button
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`btn ${activeTab === 'CORRECTIONS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ClipboardList size={14} /> Exemption &amp; On-Duty Audit
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Shortage Alerts */}
      {activeTab === 'OVERVIEW' && (
        <AttendanceShortageAlertCard overview={overview} students={students} />
      )}

      {/* Tab 2: Exemption Audit */}
      {activeTab === 'CORRECTIONS' && (
        <AttendanceCorrectionDesk corrections={corrections} />
      )}
    </div>
  );
};
