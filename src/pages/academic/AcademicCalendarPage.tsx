import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { AcademicCalendarEvent } from '../../types';
import { 
  Calendar as CalendarIcon, Plus, Trash2,
  ChevronLeft, ChevronRight, Search, LayoutGrid, List,
  X, CheckCircle, CalendarPlus
} from 'lucide-react';
import { ExcelTableContainer, ExcelTable } from '../../components/common/ExcelTable';

type ViewMode = 'CALENDAR' | 'LIST';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const AcademicCalendarPage: React.FC = () => {
  const { user, role } = useAuth();

  // Load events from database
  const [events, setEvents] = useState<AcademicCalendarEvent[]>(() => db.getAcademicCalendarEvents());

  // Navigation & View state - default to October 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // October (0-indexed)
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('2026-27');

  // Modals & Panels
  const [selectedEvent, setSelectedEvent] = useState<AcademicCalendarEvent | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Event Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'HOLIDAY' | 'EXAM' | 'EVENT' | 'SEMINAR' | 'IMPORTANT' | 'WORKSHOP'>('EVENT');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [eventTime, setEventTime] = useState('10:00 AM - 01:00 PM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Swarrnim Auditorium');
  const [organizedBy, setOrganizedBy] = useState('Academic Council');
  const [isImportant, setIsImportant] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    // Navigate to current active semester demo focus (October 2026)
    setCurrentYear(2026);
    setCurrentMonth(9); // October
    setSelectedMonthFilter('ALL');
    showToast('Navigated to current academic term (October 2026)');
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Category filter
      if (selectedCategory !== 'ALL' && e.eventType !== selectedCategory) {
        return false;
      }

      // Month dropdown filter (if explicitly chosen)
      if (selectedMonthFilter !== 'ALL') {
        const monthNum = parseInt(selectedMonthFilter, 10);
        const eMonth = new Date(e.startDate).getMonth();
        if (eMonth !== monthNum) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesLoc = (e.location || e.venue || '').toLowerCase().includes(q);
        const matchesCat = e.eventType.toLowerCase().includes(q);
        const matchesDesc = e.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesCat && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedCategory, selectedMonthFilter, searchQuery]);

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday-based indexing: Sunday=6, Monday=0 ... Saturday=5
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDate = prevMonthLastDay - i;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(pMonth + 1).padStart(2, '0');
      const dStr = String(pDate).padStart(2, '0');
      days.push({
        date: pDate,
        month: pMonth,
        year: pYear,
        isCurrentMonth: false,
        dateStr: `${pYear}-${mStr}-${dStr}`
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        date: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${mStr}-${dStr}`
      });
    }

    // Next month filler days (fill up to 35 or 42 grid cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nMonth + 1).padStart(2, '0');
      const dStr = String(n).padStart(2, '0');
      days.push({
        date: n,
        month: nMonth,
        year: nYear,
        isCurrentMonth: false,
        dateStr: `${nYear}-${mStr}-${dStr}`
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Color & badge styling for Event Chips
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'EXAM':
        return {
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          badgeBg: '#DC2626',
          badgeText: '#FFFFFF',
          tag: 'EXAM'
        };
      case 'HOLIDAY':
        return {
          background: '#FFEDD5',
          border: '1px solid #FED7AA',
          color: '#C2410C',
          badgeBg: '#F37023',
          badgeText: '#FFFFFF',
          tag: 'HOLIDAY'
        };
      case 'SEMINAR':
        return {
          background: '#DCFCE7',
          border: '1px solid #BBF7D0',
          color: '#15803D',
          badgeBg: '#10B981',
          badgeText: '#FFFFFF',
          tag: 'SEMINAR'
        };
      case 'WORKSHOP':
        return {
          background: '#DBEAFE',
          border: '1px solid #BFDBFE',
          color: '#1D4ED8',
          badgeBg: '#2563EB',
          badgeText: '#FFFFFF',
          tag: 'WORKSHOP'
        };
      case 'EVENT':
        return {
          background: '#F3E8FF',
          border: '1px solid #E9D5FF',
          color: '#7E22CE',
          badgeBg: '#9333EA',
          badgeText: '#FFFFFF',
          tag: 'EVENT'
        };
      default:
        return {
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          color: '#334155',
          badgeBg: '#64748B',
          badgeText: '#FFFFFF',
          tag: 'ACADEMIC'
        };
    }
  };

  // Check if an event spans a specific dateStr (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(e => {
      return dateStr >= e.startDate && dateStr <= e.endDate;
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Omit<AcademicCalendarEvent, 'id'> = {
      title,
      eventType,
      startDate,
      endDate,
      time: eventTime,
      description,
      location,
      venue: location,
      organizedBy,
      isImportant,
      status: 'SCHEDULED',
      createdBy: user?.name || 'Academic Office'
    };

    db.addEntity<AcademicCalendarEvent>('academicCalendarEvents', newEvent, `Added calendar event: ${title}`);
    setEvents(db.getAcademicCalendarEvents());
    setIsAddEventModalOpen(false);
    setTitle('');
    setDescription('');
    showToast(`Event "${title}" added to academic calendar!`);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Delete this academic calendar event?')) {
      db.deleteEntity('academicCalendarEvents', id, 'Deleted calendar event');
      setEvents(db.getAcademicCalendarEvents());
      setSelectedEvent(null);
      showToast('Event removed from academic calendar.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, padding: '0.85rem 1.25rem',
          background: '#0B192C', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px', color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <CheckCircle size={16} color="#10B981" /> {toastMessage}
        </div>
      )}

      {/* ─── 1. Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <CalendarIcon size={24} color="var(--brand-orange, #F37023)" />
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.3px' }}>
              Academic Calendar &amp; University Events
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Track upcoming exams, academic holidays, workshops &amp; university events
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoToToday}
            style={{ fontWeight: 700, fontSize: '0.825rem', padding: '0.5rem 0.95rem' }}
          >
            Today
          </button>

          {role !== 'STUDENT' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddEventModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontWeight: 700, fontSize: '0.825rem', padding: '0.5rem 1.15rem',
                background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)'
              }}
            >
              <Plus size={16} /> Add Event
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Compact Filter Toolbar ──────────────────────────────────────── */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Left Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', flex: 1, minWidth: '300px' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '340px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search events, venues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '36px', borderRadius: '6px' }}
              />
            </div>

            {/* Category Dropdown */}
            <select
              className="form-control"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: 'auto', minWidth: '140px', fontSize: '0.8125rem', height: '36px', borderRadius: '6px', fontWeight: 600 }}
            >
              <option value="ALL">All Categories</option>
              <option value="EXAM">Exam (Exams &amp; Tests)</option>
              <option value="HOLIDAY">Holiday (Vacations)</option>
              <option value="SEMINAR">Seminar (Conferences)</option>
              <option value="WORKSHOP">Workshop (Hands-on)</option>
              <option value="EVENT">Event (University/Sports)</option>
            </select>

            {/* Month Dropdown */}
            <select
              className="form-control"
              value={selectedMonthFilter}
              onChange={e => {
                setSelectedMonthFilter(e.target.value);
                if (e.target.value !== 'ALL') {
                  setCurrentMonth(parseInt(e.target.value, 10));
                }
              }}
              style={{ width: 'auto', minWidth: '130px', fontSize: '0.8125rem', height: '36px', borderRadius: '6px', fontWeight: 600 }}
            >
              <option value="ALL">All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            {/* Academic Year Dropdown */}
            <select
              className="form-control"
              value={selectedYearFilter}
              onChange={e => setSelectedYearFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '110px', fontSize: '0.8125rem', height: '36px', borderRadius: '6px', fontWeight: 700, color: 'var(--brand-navy)' }}
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          {/* Right View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '3px', borderRadius: '7px', border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setViewMode('CALENDAR')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.85rem', fontSize: '0.78125rem', fontWeight: 700,
                border: 'none', borderRadius: '5px', cursor: 'pointer',
                background: viewMode === 'CALENDAR' ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: viewMode === 'CALENDAR' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} /> Calendar View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.85rem', fontSize: '0.78125rem', fontWeight: 700,
                border: 'none', borderRadius: '5px', cursor: 'pointer',
                background: viewMode === 'LIST' ? 'var(--brand-navy, #0B192C)' : 'transparent',
                color: viewMode === 'LIST' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={14} /> List View
            </button>
          </div>

        </div>
      </div>

      {/* ─── 3. CALENDAR VIEW ──────────────────────────────────────────────── */}
      {viewMode === 'CALENDAR' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', overflow: 'hidden' }}>
          
          {/* Calendar Month Header & Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'inline-flex', border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{ background: '#FFFFFF', border: 'none', padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRight: '1px solid #E2E8F0' }}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} color="var(--brand-navy)" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{ background: '#FFFFFF', border: 'none', padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Next Month"
                >
                  <ChevronRight size={16} color="var(--brand-navy)" />
                </button>
              </div>

              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-navy)', letterSpacing: '-0.2px' }}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
            </div>

            {/* Category Color Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.725rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#DC2626' }} /> Exam
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#F37023' }} /> Holiday
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10B981' }} /> Seminar
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#2563EB' }} /> Workshop
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#9333EA' }} /> Event
              </span>
            </div>
          </div>

          {/* 7-Column Calendar Grid */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '850px', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
              
              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                {WEEKDAY_NAMES.map((day, idx) => (
                  <div
                    key={day}
                    style={{
                      padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800,
                      fontSize: '0.75rem', color: idx >= 5 ? '#9A3412' : 'var(--brand-navy)',
                      borderRight: idx < 6 ? '1px solid #E2E8F0' : 'none',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Grid Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#E2E8F0', gap: '1px' }}>
                {calendarDays.map((calDay, idx) => {
                  const dayEvents = getEventsForDate(calDay.dateStr);
                  const isToday = calDay.dateStr === '2026-10-15'; // Demo current active date focus

                  return (
                    <div
                      key={idx}
                      style={{
                        minHeight: '105px',
                        background: calDay.isCurrentMonth ? '#FFFFFF' : '#F8FAFC',
                        padding: '0.45rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        position: 'relative',
                        transition: 'background 0.15s ease'
                      }}
                      className="calendar-cell"
                    >
                      {/* Date Indicator */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: calDay.isCurrentMonth ? 800 : 500,
                          color: isToday ? '#FFFFFF' : calDay.isCurrentMonth ? 'var(--brand-navy)' : '#94A3B8',
                          background: isToday ? 'var(--brand-orange, #F37023)' : 'transparent',
                          width: isToday ? '22px' : 'auto',
                          height: isToday ? '22px' : 'auto',
                          borderRadius: isToday ? '50%' : '0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {calDay.date}
                        </span>

                        {isToday && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase' }}>
                            Today
                          </span>
                        )}
                      </div>

                      {/* Event Chips List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.15rem' }}>
                        {dayEvents.map(evt => {
                          const style = getEventStyle(evt.eventType);

                          return (
                            <button
                              key={evt.id}
                              type="button"
                              onClick={() => setSelectedEvent(evt)}
                              style={{
                                background: style.background,
                                border: style.border,
                                color: style.color,
                                padding: '0.25rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1px',
                                width: '100%',
                                transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                              }}
                              className="event-chip-hover"
                              title={`${evt.eventType}: ${evt.title}`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.2rem' }}>
                                <span style={{
                                  fontSize: '0.6rem', fontWeight: 900,
                                  background: style.badgeBg, color: style.badgeText,
                                  padding: '0 4px', borderRadius: '3px', textTransform: 'uppercase'
                                }}>
                                  {style.tag}
                                </span>
                                {evt.isImportant && (
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} title="High Priority" />
                                )}
                              </div>

                              <span style={{
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2
                              }}>
                                {evt.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. LIST VIEW (Alternative structured list) ────────────────────── */}
      {viewMode === 'LIST' && (
        <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Academic Calendar Master List
            </h3>
            <Badge variant="navy">{filteredEvents.length} Events</Badge>
          </div>

          <ExcelTableContainer minWidth="950px">
            <ExcelTable>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ width: '160px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Date Range</th>
                  <th style={{ minWidth: '240px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Event Title</th>
                  <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Category</th>
                  <th style={{ width: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Venue</th>
                  <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Priority</th>
                  <th style={{ width: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt, idx) => (
                  <tr key={evt.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                      {evt.startDate} {evt.endDate !== evt.startDate && `to ${evt.endDate}`}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9' }}>
                      {evt.title}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                      <Badge variant={evt.eventType === 'EXAM' ? 'inactive' : evt.eventType === 'HOLIDAY' ? 'orange' : evt.eventType === 'SEMINAR' ? 'active' : 'navy'}>
                        {evt.eventType}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderRight: '1px solid #F1F5F9' }}>
                      {evt.location || evt.venue || 'Swarrnim Campus'}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 800,
                        background: evt.isImportant ? '#FEE2E2' : '#F1F5F9',
                        color: evt.isImportant ? '#991B1B' : '#475569'
                      }}>
                        {evt.isImportant ? 'High Priority' : 'Normal'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                      <Badge variant="active">{evt.status || 'SCHEDULED'}</Badge>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ExcelTable>
          </ExcelTableContainer>
        </div>
      )}

      {/* ─── 5. Upcoming Academic Events Section (Below Calendar) ──────────── */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Upcoming Academic Events &amp; Key Deadlines
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Summary schedule for Examinations, Hackathons, FDPs, and University Holidays.
            </p>
          </div>
          <Badge variant="orange">AY 2026-27</Badge>
        </div>

        <ExcelTableContainer minWidth="950px">
          <ExcelTable>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ width: '150px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Date</th>
                <th style={{ minWidth: '260px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Event</th>
                <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Category</th>
                <th style={{ width: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Venue</th>
                <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Priority</th>
                <th style={{ width: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Status</th>
                <th style={{ width: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((evt, idx) => (
                <tr key={evt.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: '#1E40AF', borderRight: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                    {evt.startDate}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #F1F5F9' }}>
                    {evt.title}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                    <Badge variant={evt.eventType === 'EXAM' ? 'inactive' : evt.eventType === 'HOLIDAY' ? 'orange' : evt.eventType === 'SEMINAR' ? 'active' : 'navy'}>
                      {evt.eventType}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderRight: '1px solid #F1F5F9' }}>
                    {evt.location || evt.venue || 'Swarrnim Campus'}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 800,
                      background: evt.isImportant ? '#FEE2E2' : '#F1F5F9',
                      color: evt.isImportant ? '#991B1B' : '#475569'
                    }}>
                      {evt.isImportant ? 'High' : 'Normal'}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
                    <Badge variant="active">{evt.status || 'Scheduled'}</Badge>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(evt)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ExcelTable>
        </ExcelTableContainer>
      </div>

      {/* ─── 6. Event Details Panel / Modal ─────────────────────────────────── */}
      {selectedEvent && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Badge variant={selectedEvent.eventType === 'EXAM' ? 'inactive' : selectedEvent.eventType === 'HOLIDAY' ? 'orange' : selectedEvent.eventType === 'SEMINAR' ? 'active' : 'navy'}>
                    {selectedEvent.eventType}
                  </Badge>
                  <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    AY 2026-27
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  {selectedEvent.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Event Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Schedule Date
                </span>
                <strong style={{ color: 'var(--brand-navy)' }}>
                  {selectedEvent.startDate} {selectedEvent.endDate !== selectedEvent.startDate && `to ${selectedEvent.endDate}`}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Time
                </span>
                <strong style={{ color: '#1E40AF' }}>
                  {selectedEvent.time || 'Full Day Schedule'}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Venue
                </span>
                <strong style={{ color: 'var(--brand-navy)' }}>
                  {selectedEvent.location || selectedEvent.venue || 'Swarrnim Campus'}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Priority / Status
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span style={{
                    padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                    background: selectedEvent.isImportant ? '#FEE2E2' : '#F1F5F9',
                    color: selectedEvent.isImportant ? '#991B1B' : '#475569'
                  }}>
                    {selectedEvent.isImportant ? 'High Priority' : 'Normal'}
                  </span>
                  <Badge variant="active">{selectedEvent.status || 'Scheduled'}</Badge>
                </div>
              </div>
            </div>

            {/* Description Area */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--brand-navy)', lineHeight: 1.5 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Event Description &amp; Scope
              </div>
              {selectedEvent.description}
            </div>

            {selectedEvent.organizedBy && (
              <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Organized By: <strong style={{ color: 'var(--brand-navy)' }}>{selectedEvent.organizedBy}</strong>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              {role !== 'STUDENT' && role !== 'FACULTY' ? (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FECACA' }}
                >
                  <Trash2 size={14} /> Remove Event
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast(`Event "${selectedEvent.title}" added to your personal schedule!`);
                    setSelectedEvent(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                    fontWeight: 700
                  }}
                >
                  <CalendarPlus size={14} /> Add to My Calendar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── 7. Add Event Modal ────────────────────────────────────────────── */}
      {isAddEventModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Add Academic Calendar Event
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Event Category *</label>
                  <select className="form-select" value={eventType} onChange={e => setEventType(e.target.value as any)}>
                    <option value="EXAM">Exam (Examinations &amp; Tests)</option>
                    <option value="HOLIDAY">Holiday (Festivals &amp; Vacations)</option>
                    <option value="SEMINAR">Seminar (Conferences &amp; Hackathons)</option>
                    <option value="WORKSHOP">Workshop (Hands-on Training)</option>
                    <option value="EVENT">Event (University &amp; Sports)</option>
                    <option value="IMPORTANT">Important Notice</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Organized By</label>
                  <input type="text" className="form-input" placeholder="e.g. Department of CSE" value={organizedBy} onChange={e => setOrganizedBy(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Mid-Semester Examinations AY 2026-27" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Time Schedule</label>
                  <input type="text" className="form-input" placeholder="e.g. 10:00 AM - 01:00 PM" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Location</label>
                  <input type="text" className="form-input" placeholder="Swarrnim Auditorium, Block B" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Event Description *</label>
                <textarea className="form-input" rows={3} placeholder="Brief summary of event schedule and candidate guidelines..." value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isImportant" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} />
                <label htmlFor="isImportant" style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--brand-navy)', cursor: 'pointer' }}>
                  Mark as High Priority Event (Red highlight)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddEventModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700 }}>
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicCalendarPage;
