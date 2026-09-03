import { describe, it, expect } from 'vitest';
import { centralEnterpriseCalendarService } from '../services/centralEnterpriseCalendarService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.43: Enterprise Calendar, Resource Booking & Scheduling Engine', () => {

  const eventOrganizer: UserAuthorizationContext = {
    userId: 'emp-dean-acad-001',
    userName: 'Dean of Academic Affairs',
    email: 'dean.acad@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY', 'DEAN'],
    permissions: [
      'CALENDAR_VIEW',
      'CALENDAR_CREATE',
      'EVENT_CREATE',
      'EVENT_CANCEL',
      'BOOKING_CREATE',
      'RESOURCE_VIEW'
    ]
  };

  it('TEST 1: Event Scheduling & Resource Booking: Schedules campus event and provisions room booking', () => {
    const { event, booking } = centralEnterpriseCalendarService.scheduleEvent({
      calendarId: 'cal-acad-001',
      title: 'University Annual Convocation & Academic Orientation 2026',
      description: 'Orientation for incoming undergraduate and postgraduate engineering batches',
      startAt: '2026-09-01T10:00:00Z',
      endAt: '2026-09-01T13:00:00Z',
      organizerId: 'emp-dean-acad-001',
      resourceId: 'res-auditorium-001',
      expectedParticipants: 350
    });

    expect(event.id).toBeDefined();
    expect(event.event_number).toMatch(/^EVT-2026-\d{6}$/);
    expect(event.status).toBe('CONFIRMED');

    expect(booking).toBeDefined();
    expect(booking?.status).toBe('CONFIRMED');
    expect(booking?.resource_id).toBe('res-auditorium-001');
  });

  it('TEST 2: Hard Room Conflict Detection: Blocks overlapping bookings for the same room and schedule', () => {
    // Attempting to schedule another event in the same auditorium during the exact same time window must throw
    expect(() => {
      centralEnterpriseCalendarService.scheduleEvent({
        calendarId: 'cal-acad-001',
        title: 'Inter-College Cultural Dance Festival Rehearsal',
        description: 'Dance rehearsal slot',
        startAt: '2026-09-01T11:00:00Z', // Overlaps with 10:00-13:00
        endAt: '2026-09-01T14:00:00Z',
        organizerId: 'emp-fac-cult-001',
        resourceId: 'res-auditorium-001',
        expectedParticipants: 100
      });
    }).toThrow(/Room Conflict Blocked: Resource is already booked for overlapping schedule/);
  });

  it('TEST 3: Room Capacity Validation Gate: Rejects bookings where expected participants exceed room capacity', () => {
    // Seminar Hall A capacity is 60; attempting 150 participants must throw
    expect(() => {
      centralEnterpriseCalendarService.scheduleEvent({
        calendarId: 'cal-acad-001',
        title: 'Cloud Computing & AI Workshop',
        description: 'Hands-on practical session',
        startAt: '2026-09-02T14:00:00Z',
        endAt: '2026-09-02T16:00:00Z',
        organizerId: 'emp-dean-acad-001',
        resourceId: 'res-seminar-hall-001',
        expectedParticipants: 150
      });
    }).toThrow(/Capacity Conflict: Expected participants \(150\) exceed room maximum capacity \(60\)/);
  });

  it('TEST 4: Maintenance Blackout Periods & Cancellation: Enforces blackout blocks and releases cancelled bookings', () => {
    // 1. Block Seminar Hall A for audio-visual equipment maintenance
    const block = centralEnterpriseCalendarService.blockResourceForMaintenance({
      resourceId: 'res-seminar-hall-001',
      startAt: '2026-09-03T09:00:00Z',
      endAt: '2026-09-03T18:00:00Z',
      reason: 'Replacement of overhead 4K laser projector and acoustic soundproofing calibration',
      authorizedBy: 'emp-admin-head-001'
    });

    expect(block.is_maintenance_block).toBe(true);
    expect(block.status).toBe('CONFIRMED');

    // Attempting booking during maintenance window must throw
    expect(() => {
      centralEnterpriseCalendarService.scheduleEvent({
        calendarId: 'cal-acad-001',
        title: 'Faculty Committee Meeting',
        description: 'Meeting during maintenance',
        startAt: '2026-09-03T10:00:00Z',
        endAt: '2026-09-03T12:00:00Z',
        organizerId: 'emp-dean-acad-001',
        resourceId: 'res-seminar-hall-001',
        expectedParticipants: 20
      });
    }).toThrow(/Resource Unavailable: Blocked for scheduled maintenance/);

    // 2. Schedule and cancel another event
    const { event } = centralEnterpriseCalendarService.scheduleEvent({
      calendarId: 'cal-acad-001',
      title: 'Postponable Department Seminar',
      description: 'Department seminar',
      startAt: '2026-09-05T10:00:00Z',
      endAt: '2026-09-05T12:00:00Z',
      organizerId: 'emp-dean-acad-001',
      resourceId: 'res-seminar-hall-001',
      expectedParticipants: 30
    });

    const cancelled = centralEnterpriseCalendarService.cancelEvent(event.id, 'Speaker unavailable due to medical emergency');
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('TEST 5: Calendar Dashboard Telemetry: Validates metrics, room utilization, and calendar posture', () => {
    const metrics = centralEnterpriseCalendarService.getCalendarDashboardMetrics(eventOrganizer);

    expect(metrics.totalCalendarsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalBookableResourcesCount).toBeGreaterThanOrEqual(2);
    expect(metrics.roomUtilizationPercent).toBeGreaterThanOrEqual(70);
    expect(metrics.activeConflictsBlockedCount).toBeGreaterThanOrEqual(3);
    expect(metrics.calendarPosture).toBe('HEALTHY');
  });
});
