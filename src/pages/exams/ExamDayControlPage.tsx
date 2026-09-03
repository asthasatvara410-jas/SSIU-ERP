import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import {
  Activity,
  Calendar,
  Building2,
  Users,
  DoorOpen,
  ShieldCheck,
  FileCheck,
  Video,
  Printer,
  Grid,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export const ExamDayControlPage: React.FC = () => {
  const { user } = useAuth();
  const exams = db.getExams();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  const dayControlData = useMemo(() => {
    if (!selectedExamId) return null;
    return db.getExamDayControl(selectedExamId, selectedDate);
  }, [selectedExamId, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--brand-orange)', color: '#fff' }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Exam Day Operations &amp; Control
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                Real-time central dashboard for live exam day operations, centre capacities, seating coverage &amp; EDP staff
              </p>
            </div>
          </div>
        </div>

        <button onClick={handlePrint} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Printer size={15} /> Print Operational Summary
        </button>
      </div>

      {/* Exam & Date Selection Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: '#F8FAFC' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.3rem' }}>
            ACTIVE EXAMINATION SESSION *
          </label>
          <select
            className="form-control"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.code}) — {e.session || 'Summer 2026'}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '200px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.3rem' }}>
            OPERATIONAL DATE
          </label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontWeight: 600 }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)', display: 'block', marginBottom: '0.3rem' }}>
            EXAM STATUS
          </label>
          <Badge variant={selectedExam?.status === 'ONGOING' ? 'active' : 'navy'}>
            {selectedExam?.status || 'DRAFT'}
          </Badge>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Eligible Students"
          value={dayControlData?.totalEligible || 0}
          icon={Users}
          colorScheme="navy"
          trend="Verified Candidates"
        />
        <StatCard
          title="Seated Candidates"
          value={dayControlData?.totalAllocated || 0}
          icon={CheckCircle2}
          colorScheme="green"
          trend={`${dayControlData?.totalEligible ? Math.round((dayControlData.totalAllocated / dayControlData.totalEligible) * 100) : 0}% Covered`}
        />
        <StatCard
          title="Hall Tickets Issued"
          value={dayControlData?.totalHallTickets || 0}
          icon={FileCheck}
          colorScheme="blue"
          trend="Admit Cards Live"
        />
        <StatCard
          title="EDP Staff on Duty"
          value={dayControlData?.totalEdpStaffAssigned || 0}
          icon={ShieldCheck}
          colorScheme="orange"
          trend="Surveillance / IT"
        />
      </div>

      {/* Operational Table */}
      <div className="card" style={{ padding: '1.25rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#FFFFFF', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Live Centre &amp; Room Operational Control Grid
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time room occupancy, candidate seating density, EDP invigilator assignments and surveillance
            </span>
          </div>
        </div>

        {(!dayControlData?.centresSummary || dayControlData.centresSummary.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No examination centres or rooms configured for this session.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Centre</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Room</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Capacity</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Seated</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Free Seats</th>
                  <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', minWidth: '150px' }}>Occupancy %</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Status</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>EDP Staff</th>
                  <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>CCTV</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dayControlData.centresSummary.flatMap((centre: any) =>
                  (centre.rooms || []).map((room: any, rIdx: number) => {
                    const occupancy = room.capacity > 0 ? Math.round((room.allocatedSeats / room.capacity) * 100) : 0;
                    const freeSeats = room.remainingSeats !== undefined ? room.remainingSeats : Math.max(0, room.capacity - room.allocatedSeats);

                    return (
                      <tr key={`${centre.centreId}-${room.roomId || rIdx}`} style={{ borderBottom: '1px solid #E2E8F0', background: rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                          <strong style={{ color: '#0F2C59' }}>{centre.centreName}</strong>
                          <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>{centre.centreCode} • {centre.building}</div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                          <strong style={{ color: '#F37023', fontFamily: 'monospace' }}>{room.roomNumber}</strong>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>
                          {room.capacity}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 800, color: room.allocatedSeats > 0 ? '#047857' : '#64748B' }}>
                          {room.allocatedSeats}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: freeSeats > 0 ? '#047857' : '#DC2626' }}>
                          {freeSeats}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(occupancy, 100)}%`,
                                  height: '100%',
                                  background: occupancy >= 90 ? '#10B981' : occupancy > 0 ? '#3B82F6' : '#94A3B8'
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.75rem', minWidth: '36px', textAlign: 'right' }}>
                              {occupancy}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant={room.allocatedSeats > 0 ? 'active' : 'navy'}>
                            {room.allocatedSeats > 0 ? 'SEATED' : 'STANDBY'}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 600 }}>
                          {centre.edpStaffCount > 0 ? `${centre.edpStaffCount} Assigned` : 'EDP Central'}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#047857', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}>
                            <Video size={12} /> Active
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.71875rem', fontWeight: 700 }}
                            onClick={() => alert(`Operational details for Room ${room.roomNumber} in ${centre.centreName}. Seated: ${room.allocatedSeats}/${room.capacity}`)}
                          >
                            Roster
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
