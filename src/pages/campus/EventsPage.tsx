import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { Modal } from '../../components/common/Modal';
import { 
  Calendar, MapPin, Users, Plus, CheckCircle, Clock, 
  Building, Sparkles, Trophy, Eye, Check, ExternalLink, FileText, Shield
} from 'lucide-react';
import { openEventCircularPDF } from '../../services/eventPdfService';

export interface EventItem {
  id: string;
  title: string;
  category: 'HACKATHON' | 'WORKSHOP' | 'TECHFEST' | 'SEMINAR' | 'CULTURAL' | 'SPORTS' | 'CONFERENCE';
  date: string;
  time: string;
  venue: string;
  organizer: string;
  registeredCount: number;
  isRegistered?: boolean;
  description?: string;
  officialCircularUrl?: string;
  officialDocumentUrl?: string;
  fileUrl?: string;
}

const initialEvents: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Swarrnim National Startup Hackathon 2024',
    category: 'HACKATHON',
    date: '2024-04-10',
    time: '09:00 AM - 06:00 PM',
    venue: 'Swarrnim Innovation Incubation Center, Main Block',
    organizer: 'SSCIT Innovation Cell & AI Society',
    registeredCount: 142,
    isRegistered: true,
    description: '36-hour national hackathon bringing innovative student founders to prototype AI, clean-tech, and Web3 solutions with seed funding opportunities.',
    officialCircularUrl: '/event-circulars/hackathon-2024.pdf'
  },
  {
    id: 'evt-2',
    title: 'Cloud Computing & AWS Architecture Hands-on Workshop',
    category: 'WORKSHOP',
    date: '2024-04-18',
    time: '10:00 AM - 01:00 PM',
    venue: 'Computer Lab 3, SSCIT Block',
    organizer: 'Dept. of Computer Engineering',
    registeredCount: 85,
    isRegistered: false,
    description: 'Deep dive into AWS serverless architecture, EC2 orchestration, VPC networking, and cloud security with hands-on lab deployments.',
    officialCircularUrl: '/event-circulars/aws-cloud-workshop.pdf'
  },
  {
    id: 'evt-3',
    title: 'Annual TechFest Innovista 2024: Robotics & Coding Arena',
    category: 'TECHFEST',
    date: '2024-04-25',
    time: '09:30 AM - 05:30 PM',
    venue: 'University Central Auditorium & Quadrangle',
    organizer: 'Student Activity Council & IEEE Student Branch',
    registeredCount: 320,
    isRegistered: false,
    description: 'Grand annual technical festival featuring RoboWars, competitive speed debugging, drone race, and tech exhibitions.',
    officialCircularUrl: '/event-circulars/innovista-techfest.pdf'
  },
  {
    id: 'evt-4',
    title: 'Generative AI & Machine Learning Industry Masterclass',
    category: 'SEMINAR',
    date: '2024-05-02',
    time: '02:00 PM - 04:30 PM',
    venue: 'Seminar Hall 1, Academic Block A',
    organizer: 'AI & Data Science Department',
    registeredCount: 195,
    isRegistered: true,
    description: 'Interactive seminar with industry leaders from leading AI labs on building LLM agents, RAG architectures, and fine-tuning.',
    officialCircularUrl: '/event-circulars/generative-ai-masterclass.pdf'
  }
];

export const EventsPage: React.FC = () => {
  const { role } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [viewEvent, setViewEvent] = useState<EventItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventItem['category']>('WORKSHOP');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM - 01:00 PM');
  const [newVenue, setNewVenue] = useState('University Auditorium');
  const [newOrganizer, setNewOrganizer] = useState('Student Activity Council');
  const [newCircularUrl, setNewCircularUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newEvt: EventItem = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: newDate,
      time: newTime.trim() || '10:00 AM - 01:00 PM',
      venue: newVenue.trim() || 'University Campus',
      organizer: newOrganizer.trim() || 'University Department',
      registeredCount: 0,
      isRegistered: false,
      officialCircularUrl: newCircularUrl.trim() || undefined,
      description: newDescription.trim() || undefined
    };

    setEvents([newEvt, ...events]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDate('');
    setNewCircularUrl('');
    setNewDescription('');
  };

  const handleRSVP = (id: string) => {
    setEvents(events.map(e => {
      if (e.id === id) {
        const nextReg = !e.isRegistered;
        return {
          ...e,
          isRegistered: nextReg,
          registeredCount: nextReg ? e.registeredCount + 1 : e.registeredCount - 1
        };
      }
      return e;
    }));
  };

  const handleOpenCircular = async (evt: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const docUrl = evt.officialCircularUrl || evt.officialDocumentUrl || evt.fileUrl;
    
    // If it's a real static path hosted on the app, open directly in a new tab
    if (docUrl && typeof docUrl === 'string' && docUrl.startsWith('/')) {
      window.open(docUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // If it's an external URL, open it
    if (docUrl && typeof docUrl === 'string' && (docUrl.startsWith('http://') || docUrl.startsWith('https://'))) {
      window.open(docUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Dynamic fallback: generate the official PDF in memory and open in a new tab with zero 404
    try {
      await openEventCircularPDF(evt);
    } catch (err) {
      console.error('Failed to open event PDF:', err);
    }
  };

  const getCategoryBadge = (cat: EventItem['category']) => {
    switch (cat) {
      case 'HACKATHON': return <Badge variant="orange">HACKATHON</Badge>;
      case 'WORKSHOP': return <Badge variant="navy">WORKSHOP</Badge>;
      case 'TECHFEST': return <Badge variant="gold">TECHFEST</Badge>;
      case 'SEMINAR': return <Badge variant="active">SEMINAR</Badge>;
      case 'CULTURAL': return <Badge variant="danger">CULTURAL</Badge>;
      case 'SPORTS': return <Badge variant="warning">SPORTS</Badge>;
      case 'CONFERENCE': return <Badge variant="navy">CONFERENCE</Badge>;
      default: return <Badge variant="inactive">{cat}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Swarrnim University Events &amp; TechFest Portal
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Discover upcoming Hackathons, Guest Seminars, Workshops, and Cultural Fests at Swarrnim Campus
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'student-council' }));
            }} 
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}
          >
            <Shield size={15} /> Student Council Desk
          </button>

          {(role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL') && (
            <button 
              type="button"
              onClick={() => setShowCreateModal(true)} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
            >
              <Plus size={15} /> Add New Event
            </button>
          )}
        </div>
      </div>

      {/* Excel-Style Events Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <ExcelTableContainer minWidth="100%">
          <ExcelTable>
            <thead>
              <tr>
                <ExcelTh align="center" style={{ width: '80px', minWidth: '80px' }}>SR. NO.</ExcelTh>
                <ExcelTh align="center" style={{ width: '130px', minWidth: '130px' }}>EVENT DATE</ExcelTh>
                <ExcelTh align="center" style={{ width: '140px', minWidth: '140px' }}>EVENT TYPE</ExcelTh>
                <ExcelTh align="left" style={{ minWidth: '280px' }}>EVENT NAME</ExcelTh>
                <ExcelTh align="center" style={{ width: '170px', minWidth: '170px' }}>REGISTRATION STATUS</ExcelTh>
                <ExcelTh align="center" style={{ width: '140px', minWidth: '140px' }}>ACTION</ExcelTh>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <ExcelTd colSpan={6} align="center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Calendar size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--border-color)', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand-navy)' }}>No upcoming campus events</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78125rem' }}>Scheduled university workshops and techfests will appear here</p>
                  </ExcelTd>
                </tr>
              ) : (
                events.map((evt, idx) => {
                  const docUrl = evt.officialCircularUrl || evt.officialDocumentUrl || evt.fileUrl;
                  const hasDoc = Boolean(docUrl && typeof docUrl === 'string' && docUrl.trim().length > 0);

                  return (
                    <tr key={evt.id}>
                      <ExcelTd align="center" mono color="var(--brand-navy)">
                        <span style={{ fontWeight: 700 }}>{idx + 1}</span>
                      </ExcelTd>

                      <ExcelTd align="center">
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{evt.date}</span>
                      </ExcelTd>

                      <ExcelTd align="center">
                        {getCategoryBadge(evt.category)}
                      </ExcelTd>

                      <ExcelTd align="left">
                        {hasDoc ? (
                          <div 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontWeight: 600, 
                              color: 'var(--brand-navy)',
                              lineHeight: 1.35,
                              fontSize: '0.84375rem',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => handleOpenCircular(evt, e)}
                            className="hover:underline hover:text-amber-600"
                            title={`Click to open official circular for "${evt.title}" in a new tab`}
                          >
                            <span>{evt.title}</span>
                            <ExternalLink size={12} style={{ opacity: 0.6, flexShrink: 0, color: 'var(--brand-orange, #F37023)' }} />
                          </div>
                        ) : (
                          <div 
                            style={{ 
                              fontWeight: 600, 
                              color: 'var(--brand-navy)',
                              lineHeight: 1.35,
                              fontSize: '0.84375rem'
                            }}
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        )}
                      </ExcelTd>

                      <ExcelTd align="center">
                        {evt.isRegistered ? (
                          <Badge variant="active">REGISTERED</Badge>
                        ) : (
                          <Badge variant="navy">REGISTRATION OPEN</Badge>
                        )}
                      </ExcelTd>

                      <ExcelTd align="center">
                        {role === 'STUDENT' ? (
                          <button 
                            type="button"
                            onClick={() => handleRSVP(evt.id)} 
                            className={evt.isRegistered ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                            style={{ 
                              padding: '0.35rem 0.75rem', 
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              background: evt.isRegistered ? undefined : 'var(--brand-orange, #F37023)',
                              borderColor: evt.isRegistered ? undefined : 'var(--brand-orange, #F37023)',
                              fontWeight: 700
                            }}
                          >
                            {evt.isRegistered ? 'Cancel RSVP' : 'Register Now'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewEvent(evt)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={13} /> View Details
                          </button>
                        )}
                      </ExcelTd>
                    </tr>
                  );
                })
              )}
            </tbody>
          </ExcelTable>
        </ExcelTableContainer>

        <div style={{ marginTop: '0.85rem', fontSize: '0.78125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Showing {events.length} Records • Click Event Name to open official circular
        </div>
      </div>

      {/* EVENT DETAILS MODAL */}
      {viewEvent && (
        <Modal
          isOpen={Boolean(viewEvent)}
          onClose={() => setViewEvent(null)}
          title={viewEvent.title}
          subtitle={`Organized by ${viewEvent.organizer}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <button
                type="button"
                onClick={(e) => handleOpenCircular(viewEvent, e)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
              >
                <ExternalLink size={13} /> Open Official Circular PDF
              </button>
              <button 
                type="button" 
                onClick={() => setViewEvent(null)} 
                className="btn btn-secondary"
                style={{ minWidth: '90px' }}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {getCategoryBadge(viewEvent.category)}
              <Badge variant={viewEvent.isRegistered ? 'active' : 'navy'}>
                {viewEvent.isRegistered ? 'REGISTERED' : 'REGISTRATION OPEN'}
              </Badge>
            </div>

            {viewEvent.description && (
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem', lineHeight: 1.6, color: '#1E293B' }}>
                {viewEvent.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div><strong>Date &amp; Time:</strong> {viewEvent.date} ({viewEvent.time})</div>
              <div><strong>Venue:</strong> {viewEvent.venue}</div>
              <div><strong>Total Attendees:</strong> {viewEvent.registeredCount}</div>
              <div><strong>Organizing Cell:</strong> {viewEvent.organizer}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Publish New University Event / TechFest"
          subtitle="Add an upcoming campus event, hackathon, workshop, or festival"
          maxWidth="640px"
        >
          <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                Event Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. National Robotics Championship 2024"
                className="form-control"
                style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                  Event Category *
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
                >
                  <option value="HACKATHON">HACKATHON</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="TECHFEST">TECHFEST</option>
                  <option value="SEMINAR">SEMINAR</option>
                  <option value="CULTURAL">CULTURAL</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="CONFERENCE">CONFERENCE</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                  Time / Schedule
                </label>
                <input
                  type="text"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 04:00 PM"
                  className="form-control"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                  Venue
                </label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={e => setNewVenue(e.target.value)}
                  placeholder="e.g. Central Auditorium"
                  className="form-control"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                Official Circular / Document PDF URL
              </label>
              <input
                type="text"
                value={newCircularUrl}
                onChange={e => setNewCircularUrl(e.target.value)}
                placeholder="e.g. /event-circulars/robotics-2024.pdf"
                className="form-control"
                style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
              />
              <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Clicking the event title on the portal will directly open this document in a new tab.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', marginBottom: '0.35rem' }}>
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Brief summary and highlights of the event..."
                className="form-control"
                style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.84375rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
              >
                Publish Event
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
export default EventsPage;

