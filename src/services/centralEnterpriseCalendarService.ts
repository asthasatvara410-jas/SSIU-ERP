import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';
import { centralPortalPlatformService } from './centralPortalPlatformService';
import { centralServiceOperationsService } from './centralServiceOperationsService';
import { centralAdvancedCaseIncidentManagementService } from './centralAdvancedCaseIncidentManagementService';
import { centralEnterpriseNotificationService } from './centralEnterpriseNotificationService';

export type CalendarType = 'ACADEMIC' | 'BUSINESS' | 'HOLIDAY' | 'RESOURCE' | 'DEPARTMENT' | 'ORGANIZATION';
export type EventStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export interface CalendarRecord {
  id: string;
  calendar_code: string;
  name: string;
  calendar_type: CalendarType;
  organization_id: string;
  campus_id: string;
  timezone: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
}

export interface HolidayRecord {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'NATIONAL' | 'STATE' | 'UNIVERSITY' | 'CAMPUS';
  organization_id: string;
}

export interface ResourceMasterRecord {
  id: string;
  resource_code: string;
  name: string;
  resource_type: 'ROOM' | 'LAB' | 'AUDITORIUM' | 'HALL';
  capacity: number;
  building: string;
  campus_id: string;
  is_active: boolean;
}

export interface ResourceBookingRecord {
  id: string;
  event_id: string;
  resource_id: string;
  requested_by: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  is_maintenance_block?: boolean;
  maintenance_reason?: string;
  created_at: string;
}

export interface CalendarEventRecord {
  id: string;
  event_number: string;
  calendar_id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  timezone: string;
  status: EventStatus;
  organizer_id: string;
  resource_id?: string;
  expected_participants: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarDashboardMetrics {
  totalCalendarsCount: number;
  todayEventsCount: number;
  upcomingEventsCount: number;
  totalBookableResourcesCount: number;
  roomUtilizationPercent: number;
  activeConflictsBlockedCount: number;
  calendarPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseCalendarService {
  private static instance: CentralEnterpriseCalendarService;

  private calendars: CalendarRecord[] = [];
  private holidays: HolidayRecord[] = [];
  private resources: ResourceMasterRecord[] = [];
  private bookings: ResourceBookingRecord[] = [];
  private events: CalendarEventRecord[] = [];

  private eventCounter = 100;
  private blockedConflictsCount = 0;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseCalendarService {
    if (!CentralEnterpriseCalendarService.instance) {
      CentralEnterpriseCalendarService.instance = new CentralEnterpriseCalendarService();
    }
    return CentralEnterpriseCalendarService.instance;
  }

  private seedDemoData(): void {
    // Seed Academic Calendar
    this.calendars.push({
      id: 'cal-acad-001',
      calendar_code: 'CAL-ACAD-2026',
      name: 'SSIU Academic Year 2026-27 Official Calendar',
      calendar_type: 'ACADEMIC',
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00Z'
    });

    // Seed Resources
    this.resources.push({
      id: 'res-auditorium-001',
      resource_code: 'RES-AUD-MAIN',
      name: 'Central University Main Auditorium',
      resource_type: 'AUDITORIUM',
      capacity: 500,
      building: 'APJ Abdul Kalam Block',
      campus_id: 'campus-main',
      is_active: true
    });

    this.resources.push({
      id: 'res-seminar-hall-001',
      resource_code: 'RES-SEM-HALL-A',
      name: 'Computer Science Seminar Hall A',
      resource_type: 'HALL',
      capacity: 60,
      building: 'Aryabhata Technology Wing',
      campus_id: 'campus-main',
      is_active: true
    });

    // Seed Sample Holiday
    this.holidays.push({
      id: 'hol-001',
      name: 'Independence Day',
      date: '2026-08-15',
      type: 'NATIONAL',
      organization_id: 'inst-sit'
    });
  }

  // ─── CONFLICT DETECTION & CAPACITY CHECK ─────────────────────────────

  public validateResourceCapacity(resourceId: string, expectedParticipants: number): void {
    const resource = this.resources.find(r => r.id === resourceId || r.resource_code === resourceId);
    if (!resource) throw new Error(`Resource ${resourceId} not found`);

    if (expectedParticipants > resource.capacity) {
      this.blockedConflictsCount += 1;
      throw new Error(
        `Capacity Conflict: Expected participants (${expectedParticipants}) exceed room maximum capacity (${resource.capacity}) for ${resource.name}`
      );
    }
  }

  public checkResourceAvailability(resourceId: string, startAt: string, endAt: string): void {
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();

    const conflictingBooking = this.bookings.find(b => {
      if (b.resource_id !== resourceId || b.status !== 'CONFIRMED') return false;
      const bStart = new Date(b.start_at).getTime();
      const bEnd = new Date(b.end_at).getTime();
      return start < bEnd && end > bStart;
    });

    if (conflictingBooking) {
      this.blockedConflictsCount += 1;
      if (conflictingBooking.is_maintenance_block) {
        throw new Error(`Resource Unavailable: Blocked for scheduled maintenance (${conflictingBooking.maintenance_reason})`);
      }
      throw new Error(`Room Conflict Blocked: Resource is already booked for overlapping schedule from ${conflictingBooking.start_at} to ${conflictingBooking.end_at}`);
    }
  }

  // ─── EVENT SCHEDULING & RESOURCE BOOKING ─────────────────────────────

  public scheduleEvent(params: {
    calendarId: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    organizerId: string;
    resourceId?: string;
    expectedParticipants: number;
  }): { event: CalendarEventRecord; booking?: ResourceBookingRecord } {
    this.eventCounter += 1;
    const eventNumber = `EVT-2026-${String(this.eventCounter).padStart(6, '0')}`;
    const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let booking: ResourceBookingRecord | undefined;

    if (params.resourceId) {
      // 1. Validate Capacity
      this.validateResourceCapacity(params.resourceId, params.expectedParticipants);

      // 2. Validate Overlap Conflict
      this.checkResourceAvailability(params.resourceId, params.startAt, params.endAt);

      // 3. Create Confirmed Booking
      booking = {
        id: `bkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        event_id: eventId,
        resource_id: params.resourceId,
        requested_by: params.organizerId,
        start_at: params.startAt,
        end_at: params.endAt,
        status: 'CONFIRMED',
        created_at: new Date().toISOString()
      };
      this.bookings.push(booking);
    }

    const event: CalendarEventRecord = {
      id: eventId,
      event_number: eventNumber,
      calendar_id: params.calendarId,
      title: params.title,
      description: params.description,
      start_at: params.startAt,
      end_at: params.endAt,
      timezone: 'Asia/Kolkata',
      status: 'CONFIRMED',
      organizer_id: params.organizerId,
      resource_id: params.resourceId,
      expected_participants: params.expectedParticipants,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.events.push(event);
    return { event, booking };
  }

  // ─── MAINTENANCE BLACKOUT & CANCELLATION ─────────────────────────────

  public blockResourceForMaintenance(params: {
    resourceId: string;
    startAt: string;
    endAt: string;
    reason: string;
    authorizedBy: string;
  }): ResourceBookingRecord {
    // Check if already booked
    this.checkResourceAvailability(params.resourceId, params.startAt, params.endAt);

    const block: ResourceBookingRecord = {
      id: `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event_id: 'SYSTEM_MAINTENANCE',
      resource_id: params.resourceId,
      requested_by: params.authorizedBy,
      start_at: params.startAt,
      end_at: params.endAt,
      status: 'CONFIRMED',
      is_maintenance_block: true,
      maintenance_reason: params.reason,
      created_at: new Date().toISOString()
    };

    this.bookings.push(block);
    return block;
  }

  public cancelEvent(eventId: string, reason: string): CalendarEventRecord {
    const event = this.events.find(e => e.id === eventId || e.event_number === eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);

    event.status = 'CANCELLED';
    event.updated_at = new Date().toISOString();

    // Release any associated booking
    const booking = this.bookings.find(b => b.event_id === event.id);
    if (booking) {
      booking.status = 'CANCELLED';
    }

    return event;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getCalendarDashboardMetrics(context?: UserAuthorizationContext): CalendarDashboardMetrics {
    const totalCalendarsCount = this.calendars.length;
    const todayEventsCount = this.events.filter(e => e.status === 'CONFIRMED').length;
    const upcomingEventsCount = this.events.length;
    const totalBookableResourcesCount = this.resources.length;

    return {
      totalCalendarsCount,
      todayEventsCount,
      upcomingEventsCount,
      totalBookableResourcesCount,
      roomUtilizationPercent: 78.5,
      activeConflictsBlockedCount: this.blockedConflictsCount,
      calendarPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseCalendarService = CentralEnterpriseCalendarService.getInstance();
