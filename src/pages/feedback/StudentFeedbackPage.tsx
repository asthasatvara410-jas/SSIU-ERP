import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feedbackService } from '../../services/feedbackService';
import { 
  DetailedStudentFeedback, FeedbackCategoryType, 
  CampusFacilityCategory, SuggestionCategory 
} from '../../types/feedback';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { 
  MessageSquare, Star, Send, CheckCircle2, AlertCircle, 
  FileText, ShieldCheck, Sparkles, Eye, Search, UserX,
  Copy, Check, X, ShieldAlert, Building2, HelpCircle, Lock, Info, Plus
} from 'lucide-react';

interface StudentFeedbackPageProps {
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

type TabType = 'GIVE_FEEDBACK' | 'ANONYMOUS_GRIEVANCE' | 'TRACK_GRIEVANCE' | 'MY_FEEDBACK' | 'SUGGESTIONS';

export const StudentFeedbackPage: React.FC<StudentFeedbackPageProps> = ({ activeSubTab, onTabChange }) => {
  const { user } = useAuth();
  
  const mapSubTabToInternal = (tab?: string): TabType => {
    if (tab === 'feedback-anonymous' || tab === 'feedback-anonymous-grievance' || tab === 'grievance-anonymous') return 'ANONYMOUS_GRIEVANCE';
    if (tab === 'feedback-track' || tab === 'grievance-track') return 'TRACK_GRIEVANCE';
    if (tab === 'feedback-my') return 'MY_FEEDBACK';
    if (tab === 'feedback-suggestions') return 'SUGGESTIONS';
    return 'GIVE_FEEDBACK';
  };

  const [activeTab, setActiveTabInternal] = useState<TabType>(() => {
    if (activeSubTab) return mapSubTabToInternal(activeSubTab);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam) return mapSubTabToInternal(tabParam);
    }
    return 'GIVE_FEEDBACK';
  });

  // Sync internal tab whenever activeSubTab prop changes
  useEffect(() => {
    if (activeSubTab) {
      setActiveTabInternal(mapSubTabToInternal(activeSubTab));
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: TabType) => {
    setActiveTabInternal(tab);
    let targetRoute = 'feedback-give';
    if (tab === 'ANONYMOUS_GRIEVANCE') targetRoute = 'feedback-anonymous-grievance';
    else if (tab === 'TRACK_GRIEVANCE') targetRoute = 'feedback-track';
    else if (tab === 'MY_FEEDBACK') targetRoute = 'feedback-my';
    else if (tab === 'SUGGESTIONS') targetRoute = 'feedback-suggestions';

    if (onTabChange) {
      onTabChange(targetRoute);
    } else if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ tab: targetRoute }, '', `?tab=${targetRoute}`);
    }
  };

  // Feedback Form State
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategoryType>('SUBJECT');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedCampusFacility, setSelectedCampusFacility] = useState<CampusFacilityCategory>('CAMPUS_INFRASTRUCTURE');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Grievance Form State
  const [grvCategory, setGrvCategory] = useState<FeedbackCategoryType>('ACADEMIC');
  const [grvSubject, setGrvSubject] = useState<string>('');
  const [grvDescription, setGrvDescription] = useState<string>('');
  const [grvPriority, setGrvPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [grvDepartment, setGrvDepartment] = useState<string>('Department of Computer Science & Engineering');
  const [grvLocation, setGrvLocation] = useState<string>('');
  const [grvAllowContact, setGrvAllowContact] = useState<boolean>(false);
  const [grvContactEmail, setGrvContactEmail] = useState<string>('');
  const [grvContactPhone, setGrvContactPhone] = useState<string>('');
  const [grvAttachmentName, setGrvAttachmentName] = useState<string>('');
  const [grvSubmissionResult, setGrvSubmissionResult] = useState<{ publicReference: string; trackingToken?: string; status?: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [isSubmittingGrievance, setIsSubmittingGrievance] = useState<boolean>(false);

  // Anonymous Tracking Search State
  const [trackSearchRef, setTrackSearchRef] = useState<string>('');
  const [trackSearchToken, setTrackSearchToken] = useState<string>('');
  const [trackedGrievanceItem, setTrackedGrievanceItem] = useState<DetailedStudentFeedback | null>(null);
  const [trackSearchError, setTrackSearchError] = useState<string | null>(null);
  const [isTrackingSearching, setIsTrackingSearching] = useState<boolean>(false);

  // Suggestion Form State
  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory>('ACADEMIC');
  const [suggestionTitle, setSuggestionTitle] = useState<string>('');
  const [suggestionDescription, setSuggestionDescription] = useState<string>('');
  const [expectedImprovement, setExpectedImprovement] = useState<string>('');
  const [suggestionAnonymous, setSuggestionAnonymous] = useState<boolean>(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState<boolean>(false);

  // Modals & Details View
  const [viewingFeedback, setViewingFeedback] = useState<DetailedStudentFeedback | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Resolved Targets for student
  const targets = useMemo(() => {
    if (!user) return null;
    try {
      return feedbackService.getStudentFeedbackTargets(user.id || (user as any).enrollmentNo || (user as any).email);
    } catch {
      return null;
    }
  }, [user, refreshKey]);

  // Student's Feedbacks & Suggestions
  const myFeedbacks = useMemo(() => {
    if (!user) return [];
    return feedbackService.getMyFeedbacks(user);
  }, [user, refreshKey]);

  const mySuggestions = useMemo(() => {
    if (!user) return [];
    return feedbackService.getMySuggestions(user);
  }, [user, refreshKey]);

  // Handle Criteria Definitions per Category
  const criteriaList = useMemo(() => {
    switch (selectedCategory) {
      case 'SUBJECT':
        return [
          { key: 'Teaching Quality', label: 'Teaching Quality & Concept Delivery', desc: 'Clarity of presentation, pace and explanation' },
          { key: 'Course Coverage', label: 'Course Coverage & Syllabus Completion', desc: 'Timely completion of planned syllabus units' },
          { key: 'Clarity of Teaching', label: 'Clarity of Practical Examples', desc: 'Real-world illustrations and code demos' },
          { key: 'Study Material', label: 'Quality of Study Materials & LMS Notes', desc: 'Availability of lecture slides, question banks and notes' },
          { key: 'Punctuality', label: 'Lecture Punctuality & Discipline', desc: 'Regularity in conducting classes and lab sessions' }
        ];
      case 'FACULTY':
        return [
          { key: 'Teaching Clarity', label: 'Teaching Clarity & Presentation', desc: 'Structured communication and voice clarity' },
          { key: 'Communication', label: 'Communication & Interactivity', desc: 'Encouraging student questions and discussions' },
          { key: 'Subject Knowledge', label: 'Subject Expertise & Depth', desc: 'Command over curriculum and recent industry trends' },
          { key: 'Doubt Resolution', label: 'Approachability & Doubt Clearing', desc: 'Availability to resolve doubts inside and outside class' },
          { key: 'Student Engagement', label: 'Classroom Engagement & Motivation', desc: 'Inspiring active learning and practical interest' }
        ];
      default:
        return [
          { key: 'Overall Quality', label: 'Overall Quality & Service Delivery', desc: 'General excellence in support operations' },
          { key: 'Responsiveness', label: 'Responsiveness & Timely Assistance', desc: 'Prompt resolution of student administrative requests' },
          { key: 'Infrastructure & Support', label: 'Cleanliness & Maintenance', desc: 'Hygiene, working equipment and infrastructure state' },
          { key: 'Transparency', label: 'Administrative Transparency & Governance', desc: 'Clear guidelines and helpful communication' }
        ];
    }
  }, [selectedCategory]);

  // Handle Submit Normal Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmittingFeedback(true);
    try {
      const overallAvg = Object.values(ratings).length > 0
        ? Number((Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1))
        : 5;

      feedbackService.submitFeedback({
        category: selectedCategory,
        campusFacilityCategory: selectedCategory === 'CAMPUS' ? selectedCampusFacility : undefined,
        subjectId: selectedCategory === 'SUBJECT' ? selectedSubjectId : undefined,
        facultyId: selectedCategory === 'FACULTY' ? selectedFacultyId : undefined,
        ratings,
        overallRating: overallAvg,
        comments,
        suggestions,
        isAnonymous
      }, user);

      setComments('');
      setSuggestions('');
      setRatings({});
      setRefreshKey(k => k + 1);
      showToast('success', `${selectedCategory.replace(/_/g, ' ')} Feedback submitted successfully.`);
      handleTabSwitch('MY_FEEDBACK');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Handle Submit Anonymous Grievance
  const handleSubmitAnonymousGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grvSubject.trim() || !grvDescription.trim()) {
      showToast('error', 'Please enter a subject and detailed description.');
      return;
    }

    setIsSubmittingGrievance(true);
    try {
      const res = feedbackService.submitGrievance({
        category: grvCategory,
        subjectTitle: grvSubject.trim(),
        description: grvDescription.trim(),
        priority: grvPriority,
        departmentContext: grvDepartment,
        incidentLocation: grvLocation.trim() || undefined,
        isAnonymous: true,
        optionalContactEmail: grvAllowContact && grvContactEmail.trim() ? grvContactEmail.trim() : undefined,
        optionalContactPhone: grvAllowContact && grvContactPhone.trim() ? grvContactPhone.trim() : undefined,
        attachmentUrls: grvAttachmentName.trim() ? [grvAttachmentName.trim()] : undefined,
      });

      setGrvSubmissionResult({
        publicReference: res.feedback.publicReference || res.feedback.feedbackNo,
        trackingToken: res.trackingToken,
        status: res.feedback.status,
      });

      setGrvSubject('');
      setGrvDescription('');
      setGrvLocation('');
      setGrvAttachmentName('');
      setGrvContactEmail('');
      setGrvContactPhone('');
      setGrvAllowContact(false);
      setRefreshKey(k => k + 1);
      showToast('success', 'Anonymous grievance registered with zero identity exposure.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit grievance.');
    } finally {
      setIsSubmittingGrievance(false);
    }
  };

  // Handle Anonymous Status Tracking Lookup
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackSearchRef.trim() || !trackSearchToken.trim()) {
      setTrackSearchError('Please provide both the Grievance Reference (GRV-...) and Tracking Token.');
      return;
    }

    setIsTrackingSearching(true);
    setTrackSearchError(null);
    try {
      const match = feedbackService.trackAnonymousGrievance(trackSearchRef.trim(), trackSearchToken.trim());
      if (match) {
        setTrackedGrievanceItem(match);
      } else {
        setTrackSearchError('Invalid Grievance Reference or Tracking Token. Please check your credentials.');
        setTrackedGrievanceItem(null);
      }
    } catch {
      setTrackSearchError('Unable to locate grievance with provided credentials.');
      setTrackedGrievanceItem(null);
    } finally {
      setIsTrackingSearching(false);
    }
  };

  // Handle Submit Suggestion
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!suggestionTitle.trim() || !suggestionDescription.trim()) {
      showToast('error', 'Please provide both title and description.');
      return;
    }

    setIsSubmittingSuggestion(true);
    try {
      feedbackService.submitSuggestion({
        category: suggestionCategory,
        title: suggestionTitle.trim(),
        description: suggestionDescription.trim(),
        expectedImprovement: expectedImprovement.trim() || undefined,
        isAnonymous: suggestionAnonymous
      }, user);

      setSuggestionTitle('');
      setSuggestionDescription('');
      setExpectedImprovement('');
      setRefreshKey(k => k + 1);
      showToast('success', 'Your improvement suggestion has been recorded.');
      handleTabSwitch('SUGGESTIONS');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit suggestion.');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Badge variant="navy">SUBMITTED</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="gold">UNDER REVIEW</Badge>;
      case 'ASSIGNED': return <Badge variant="navy">ASSIGNED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="navy">IN PROGRESS</Badge>;
      case 'ACKNOWLEDGED': return <Badge variant="orange">ACKNOWLEDGED</Badge>;
      case 'RESOLVED':
      case 'CLOSED': return <Badge variant="active">RESOLVED</Badge>;
      default: return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#059669' : '#DC2626',
          color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)', fontWeight: 600, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toastMessage.text}
        </div>
      )}

      {/* ─── 1. COMPACT & BALANCED MODULE HEADER ──────────────────────────── */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, var(--brand-navy) 0%, #1e3a8a 100%)',
        color: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 16px rgba(26, 54, 93, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93C5FD', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck size={15} /> Student Voice, Feedback &amp; Grievance Redressal Desk
            </div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0 0.25rem 0', letterSpacing: '-0.01em' }}>
              Feedback &amp; Grievance Redressal Portal
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', maxWidth: '800px', margin: 0, lineHeight: 1.4 }}>
              Submit course evaluations, faculty feedback, campus improvement suggestions, or confidential grievances.
            </p>
          </div>
        </div>

        {/* Clean Responsive Navigation Tabs (Horizontal Scrollable on Mobile) */}
        <div style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          overflowX: 'auto',
          paddingBottom: '2px',
          paddingTop: '0.75rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'GIVE_FEEDBACK', label: 'Course & Faculty Feedback', icon: MessageSquare },
            { id: 'ANONYMOUS_GRIEVANCE', label: 'Anonymous Grievance', icon: UserX },
            { id: 'TRACK_GRIEVANCE', label: 'Track Grievance Status', icon: Search },
            { id: 'MY_FEEDBACK', label: `My Feedback & Cases (${myFeedbacks.length})`, icon: FileText },
            { id: 'SUGGESTIONS', label: `Suggestions (${mySuggestions.length})`, icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'ANONYMOUS_GRIEVANCE') setGrvSubmissionResult(null);
                  handleTabSwitch(tab.id as TabType);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.12)',
                  color: isActive ? '#0F172A' : '#F8FAFC',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: GIVE STUDENT FEEDBACK ─────────────────────────────────── */}
      {activeTab === 'GIVE_FEEDBACK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Feedback Category Selector Grid */}
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              1. Select Feedback Domain / Category
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
              {[
                { id: 'SUBJECT', label: 'Subject Feedback', desc: 'Enrolled subjects' },
                { id: 'FACULTY', label: 'Faculty / Teaching', desc: 'Teaching quality' },
                { id: 'MENTOR', label: 'Mentor Feedback', desc: 'Faculty mentor' },
                { id: 'HOD', label: 'HOD Feedback', desc: 'Department head' },
                { id: 'HOI', label: 'HOI Feedback', desc: 'Institute principal' },
                { id: 'CAMPUS', label: 'Campus Feedback', desc: 'Campus facilities' },
                { id: 'GENERAL_UNIVERSITY', label: 'University', desc: 'General operations' }
              ].map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as FeedbackCategoryType)}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      textAlign: 'left',
                      border: isSelected ? '2px solid var(--brand-navy)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(26, 54, 93, 0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: isSelected ? 'var(--brand-navy)' : 'var(--text-main)' }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {cat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Structured Feedback Form */}
          <form onSubmit={handleSubmitFeedback} className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Form Section Header: Evaluation Details */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Evaluation Details &amp; Target Information
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0 0' }}>
                Evaluating: {selectedCategory.replace(/_/g, ' ')}
              </h3>
            </div>

            {/* Target Selector Dropdowns in 2-Column Responsive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {selectedCategory === 'SUBJECT' && targets?.subjects && (
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    Select Enrolled Subject *
                  </label>
                  <select 
                    className="form-control" 
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                  >
                    <option value="">-- Choose Enrolled Subject --</option>
                    {targets.subjects.map(s => (
                      <option key={s.subject.id} value={s.subject.id}>[{s.subject.code}] {s.subject.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCategory === 'FACULTY' && targets?.teachingFaculty && (
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    Select Faculty Member *
                  </label>
                  <select 
                    className="form-control" 
                    value={selectedFacultyId}
                    onChange={(e) => setSelectedFacultyId(e.target.value)}
                    required
                    style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                  >
                    <option value="">-- Choose Faculty Member --</option>
                    {targets.teachingFaculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Faculty Member'})</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCategory === 'CAMPUS' && (
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    Campus Facility Domain *
                  </label>
                  <select 
                    className="form-control" 
                    value={selectedCampusFacility}
                    onChange={(e: any) => setSelectedCampusFacility(e.target.value)}
                    required
                    style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                  >
                    <option value="CAMPUS_INFRASTRUCTURE">Campus Infrastructure &amp; Classrooms</option>
                    <option value="LABORATORIES">Laboratories &amp; Computing Facilities</option>
                    <option value="LIBRARY">Central Library &amp; Reading Hall</option>
                    <option value="CANTEEN">Canteen &amp; Food Hygiene</option>
                    <option value="SPORTS_COMPLEX">Sports Complex &amp; Gym</option>
                    <option value="SANITATION">Sanitation &amp; Drinking Water</option>
                    <option value="ADMIN_SERVICES">Administrative Office &amp; Student Section</option>
                  </select>
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Academic Term &amp; Department
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value="Academic Year 2025-26 • Department of Computer Engineering" 
                  className="form-control" 
                  style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem', backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            {/* Section 3: Criteria Star Ratings Card */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              padding: '1.25rem', 
              backgroundColor: 'var(--bg-surface-hover)', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    3. Rate Performance Across Evaluation Criteria
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Scale: 1 = Poor · 2 = Fair · 3 = Good · 4 = Very Good · 5 = Excellent
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {criteriaList.map((cr) => {
                  const curVal = ratings[cr.key] || 5;
                  return (
                    <div 
                      key={cr.key} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.6rem 0.5rem',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: '1 1 240px' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {cr.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {cr.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatings(prev => ({ ...prev, [cr.key]: star }))}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'transform 0.1s ease'
                              }}
                              title={`${star} Star`}
                              aria-label={`Rate ${star} Star for ${cr.label}`}
                            >
                              <Star 
                                size={20} 
                                fill={star <= curVal ? '#F59E0B' : 'none'} 
                                color={star <= curVal ? '#F59E0B' : '#94A3B8'} 
                              />
                            </button>
                          ))}
                        </div>
                        <span style={{ minWidth: '32px', textAlign: 'right', fontWeight: 800, color: '#D97706', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {curVal}.0
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Written Comments & Suggestions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                4. Written Comments &amp; Constructive Recommendations
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Positive Aspects &amp; Strengths
                </label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share key strengths, effective teaching methods, or positive experiences..."
                  style={{ width: '100%', minHeight: '90px', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Improvement Recommendations
                </label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Constructive suggestions for continuous quality improvement..."
                  style={{ width: '100%', minHeight: '90px', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            {/* Section 5: Privacy Box & Submission Action */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand-navy)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Lock size={13} /> Submit Anonymously
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Your name and enrollment number will be hidden from the faculty and department report.
                    </div>
                  </div>
                </label>

                <button 
                  type="submit" 
                  disabled={isSubmittingFeedback}
                  className="btn btn-primary" 
                  style={{ 
                    backgroundColor: 'var(--brand-navy)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    padding: '0.55rem 1.4rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: isSubmittingFeedback ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={15} /> {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 2: ANONYMOUS GRIEVANCE FORM ─────────────────────────────── */}
      {activeTab === 'ANONYMOUS_GRIEVANCE' && (
        <div style={{ width: '100%' }}>
          {grvSubmissionResult ? (
            /* Confirmation Receipt */
            <div className="card" style={{ 
              padding: '2rem', 
              maxWidth: '680px', 
              margin: '0 auto', 
              textAlign: 'center', 
              border: '2px solid #10B981', 
              borderRadius: '10px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem' 
            }}>
              <div style={{ width: '52px', height: '52px', backgroundColor: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', margin: '0 auto' }}>
                <CheckCircle2 size={30} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 0.35rem 0' }}>
                  Anonymous Grievance Registered Successfully
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  Your grievance is recorded with zero identity linkage under the UGC Zero-Retaliation Protocol.
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-hover)', padding: '1.25rem', borderRadius: '8px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Public Grievance Reference
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.95rem' }}>
                      {grvSubmissionResult.publicReference}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(grvSubmissionResult.publicReference);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      {copiedRef ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                      {copiedRef ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {grvSubmissionResult.trackingToken && (
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Secret Tracking Token (Keep Private)
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8125rem', wordBreak: 'break-all' }}>
                        {grvSubmissionResult.trackingToken}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(grvSubmissionResult.trackingToken || '');
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem', marginLeft: '0.5rem' }}
                      >
                        {copiedToken ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                        {copiedToken ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setTrackSearchRef(grvSubmissionResult.publicReference);
                    setTrackSearchToken(grvSubmissionResult.trackingToken || '');
                    handleTabSwitch('TRACK_GRIEVANCE');
                  }}
                  style={{ backgroundColor: 'var(--brand-navy)', fontSize: '0.8125rem' }}
                >
                  <Search size={15} /> Track Grievance Status
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setGrvSubmissionResult(null)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  Submit Another Grievance
                </button>
              </div>
            </div>
          ) : (
            /* Structured 2-Column Desktop Form */
            <form onSubmit={handleSubmitAnonymousGrievance} className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-navy)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <UserX size={15} /> Anonymous &amp; Protected Redressal Framework
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.2rem 0' }}>
                  File Anonymous Grievance / Complaint
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  Your student identity is strictly shielded. Do not type your personal name or enrollment number in the description.
                </p>
              </div>

              {/* Section 1: Classification & Priority (2 Columns) */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  1. Grievance Classification &amp; Urgency
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Grievance Category *
                    </label>
                    <select 
                      className="form-control"
                      value={grvCategory}
                      onChange={(e: any) => setGrvCategory(e.target.value)}
                      required
                      style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    >
                      <option value="ACADEMIC">Academic &amp; Evaluation</option>
                      <option value="EXAMINATION">Examination &amp; Results</option>
                      <option value="FACILITY">Campus Facilities &amp; Infrastructure</option>
                      <option value="HOSTEL">Hostel &amp; Food Quality</option>
                      <option value="TRANSPORT">University Transport</option>
                      <option value="ANTI_RAGGING">Anti-Ragging Incident</option>
                      <option value="HARASSMENT">Harassment &amp; ICC Cell</option>
                      <option value="OTHER">General Grievance</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Urgency / Priority Level
                    </label>
                    <select 
                      className="form-control"
                      value={grvPriority}
                      onChange={(e: any) => setGrvPriority(e.target.value)}
                      style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    >
                      <option value="LOW">Low (Routine Concern)</option>
                      <option value="MEDIUM">Medium (Standard Redressal)</option>
                      <option value="HIGH">High (Urgent Attention)</option>
                      <option value="CRITICAL">Critical (Immediate Redressal Required)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Routing & Location (2 Columns) */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  2. Institutional Routing &amp; Incident Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Department / Responsible Unit
                    </label>
                    <select 
                      className="form-control"
                      value={grvDepartment}
                      onChange={(e) => setGrvDepartment(e.target.value)}
                      style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    >
                      <option value="Department of Computer Science & Engineering">Department of Computer Science &amp; Engineering</option>
                      <option value="Department of Information Technology">Department of Information Technology</option>
                      <option value="Department of Mechanical Engineering">Department of Mechanical Engineering</option>
                      <option value="Department of Civil Engineering">Department of Civil Engineering</option>
                      <option value="Hostel Administration & Mess">Hostel Administration &amp; Mess</option>
                      <option value="Examination Section">Examination Section</option>
                      <option value="General University Administration">General University Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Incident Location (Optional)
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={grvLocation}
                      onChange={(e) => setGrvLocation(e.target.value)}
                      placeholder="e.g. Lab 402, Block B, or Canteen"
                      style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Grievance Details */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  3. Grievance Subject &amp; Comprehensive Description
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Grievance Subject / Title *
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      required
                      value={grvSubject}
                      onChange={(e) => setGrvSubject(e.target.value)}
                      placeholder="Clear, concise summary of the issue..."
                      style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                      Detailed Description *
                    </label>
                    <textarea 
                      className="form-control"
                      rows={4}
                      required
                      value={grvDescription}
                      onChange={(e) => setGrvDescription(e.target.value)}
                      placeholder="Provide specific facts, context, and details..."
                      style={{ width: '100%', minHeight: '110px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Supporting Information & Notification Opt-in */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                    Attachment Reference (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={grvAttachmentName}
                    onChange={(e) => setGrvAttachmentName(e.target.value)}
                    placeholder="e.g. evidence_document.pdf or proof_image.png"
                    style={{ width: '100%', height: '38px', borderRadius: '6px', fontSize: '0.8125rem' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox"
                    checked={grvAllowContact}
                    onChange={(e) => setGrvAllowContact(e.target.checked)}
                    style={{ accentColor: 'var(--brand-navy)' }}
                  />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Provide optional notification contact (Never disclosed to grievance committee)
                  </span>
                </label>

                {grvAllowContact && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    <input 
                      type="email" 
                      className="form-control"
                      value={grvContactEmail}
                      onChange={(e) => setGrvContactEmail(e.target.value)}
                      placeholder="Notification email address..."
                      style={{ height: '38px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                    <input 
                      type="tel" 
                      className="form-control"
                      value={grvContactPhone}
                      onChange={(e) => setGrvContactPhone(e.target.value)}
                      placeholder="Notification mobile number..."
                      style={{ height: '38px', borderRadius: '6px', fontSize: '0.8125rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="submit" 
                  disabled={isSubmittingGrievance}
                  className="btn btn-primary" 
                  style={{ 
                    backgroundColor: 'var(--brand-navy)', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    padding: '0.55rem 1.4rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: isSubmittingGrievance ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={15} /> {isSubmittingGrievance ? 'Submitting...' : 'Submit Anonymous Grievance'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 3: TRACK GRIEVANCE STATUS ───────────────────────────────── */}
      {activeTab === 'TRACK_GRIEVANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '850px', margin: '0 auto' }}>
          <form onSubmit={handleTrackSearch} className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Confidential Tracking Portal
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.2rem 0' }}>
                Track Anonymous Grievance Status
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Enter the Reference Number (GRV-...) and your Secret Tracking Token to check live resolution progress.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Grievance Reference Number *
                </label>
                <input 
                  type="text" 
                  required
                  className="form-control"
                  value={trackSearchRef}
                  onChange={(e) => setTrackSearchRef(e.target.value)}
                  placeholder="e.g. GRV-2026-B1DAA5"
                  style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Secret Tracking Token *
                </label>
                <input 
                  type="text" 
                  required
                  className="form-control"
                  value={trackSearchToken}
                  onChange={(e) => setTrackSearchToken(e.target.value)}
                  placeholder="Paste 32-character tracking token..."
                  style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {trackSearchError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={16} /> {trackSearchError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.35rem' }}>
              <button 
                type="submit" 
                disabled={isTrackingSearching}
                className="btn btn-primary" 
                style={{ 
                  backgroundColor: 'var(--brand-navy)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  padding: '0.55rem 1.4rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: isTrackingSearching ? 'not-allowed' : 'pointer'
                }}
              >
                <Search size={15} /> {isTrackingSearching ? 'Searching...' : 'Track Status'}
              </button>
            </div>
          </form>

          {/* Tracked Grievance Output Card */}
          {trackedGrievanceItem && (
            <div className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1.05rem' }}>
                      {trackedGrievanceItem.publicReference || trackedGrievanceItem.feedbackNo}
                    </span>
                    <Badge variant="navy">{trackedGrievanceItem.category}</Badge>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: 0 }}>
                    {trackedGrievanceItem.subjectTitle || trackedGrievanceItem.comments?.slice(0, 60)}
                  </h3>
                </div>
                <div>
                  {getStatusBadge(trackedGrievanceItem.status)}
                </div>
              </div>

              {trackedGrievanceItem.resolutionSummary && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#D1FAE5', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={15} /> Resolution Summary
                  </div>
                  <p style={{ fontSize: '0.8125rem', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                    {trackedGrievanceItem.resolutionSummary}
                  </p>
                </div>
              )}

              {/* Lifecycle Progression */}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.65rem' }}>
                  Lifecycle &amp; Redressal Progression
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderLeft: '2px solid var(--brand-navy)', paddingLeft: '1rem', marginLeft: '0.35rem' }}>
                  {(trackedGrievanceItem.timelineEvents || [
                    { eventType: 'SUBMITTED', title: 'Grievance Registered', details: 'Confidential submission received.', createdAt: trackedGrievanceItem.createdAt }
                  ]).map((evt, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.35rem', top: '0.25rem', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--brand-navy)' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{evt.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.details}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(evt.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: MY SUBMITTED FEEDBACK & GRIEVANCES ────────────────────── */}
      {activeTab === 'MY_FEEDBACK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  My Submitted Feedback Records ({myFeedbacks.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleTabSwitch('GIVE_FEEDBACK')}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--brand-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
              >
                <Plus size={13} /> Give Feedback
              </button>
            </div>

            {myFeedbacks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem 1rem', 
                color: 'var(--text-muted)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <FileText size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  No submitted feedback records yet
                </div>
                <div style={{ fontSize: '0.8125rem', maxWidth: '400px' }}>
                  Your submitted teaching evaluations and grievance cases will appear here.
                </div>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('GIVE_FEEDBACK')}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}
                >
                  Give Feedback Now
                </button>
              </div>
            ) : (
              <ExcelTableContainer>
                <ExcelTable>
                  <thead>
                    <tr>
                      <ExcelTh align="center">Ref No</ExcelTh>
                      <ExcelTh align="center">Type</ExcelTh>
                      <ExcelTh align="center">Category</ExcelTh>
                      <ExcelTh align="left">Details / Target</ExcelTh>
                      <ExcelTh align="center">Status</ExcelTh>
                      <ExcelTh align="center">Submitted Date</ExcelTh>
                      <ExcelTh align="center">Action</ExcelTh>
                    </tr>
                  </thead>
                  <tbody>
                    {myFeedbacks.map((f) => (
                      <tr key={f.id}>
                        <ExcelTd align="center">
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.8125rem' }}>{f.feedbackNo}</span>
                        </ExcelTd>
                        <ExcelTd align="center">
                          <Badge variant={f.itemType === 'GRIEVANCE' ? 'orange' : 'navy'}>
                            {f.itemType || 'FEEDBACK'}
                          </Badge>
                        </ExcelTd>
                        <ExcelTd align="center">
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{f.category.replace(/_/g, ' ')}</span>
                        </ExcelTd>
                        <ExcelTd align="left">
                          <div style={{ fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.8125rem' }}>
                            {f.subjectTitle || f.subjectName || f.facultyName || 'General Feedback'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {f.comments?.slice(0, 55)}...
                          </div>
                        </ExcelTd>
                        <ExcelTd align="center">{getStatusBadge(f.status)}</ExcelTd>
                        <ExcelTd align="center">
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                        </ExcelTd>
                        <ExcelTd align="center">
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setViewingFeedback(f)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </ExcelTd>
                      </tr>
                    ))}
                  </tbody>
                </ExcelTable>
              </ExcelTableContainer>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: STUDENT SUGGESTIONS ──────────────────────────────────── */}
      {activeTab === 'SUGGESTIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSubmitSuggestion} className="card" style={{ padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Improvement Portal
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.2rem 0' }}>
                Submit Campus Improvement Suggestion
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                Propose constructive ideas for academic, digital, infrastructural or campus welfare enhancement.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Suggestion Category *
                </label>
                <select 
                  className="form-control"
                  value={suggestionCategory}
                  onChange={(e: any) => setSuggestionCategory(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="ACADEMIC">Academic &amp; Learning</option>
                  <option value="CAMPUS">Campus Environment &amp; Greens</option>
                  <option value="INFRASTRUCTURE">Infrastructure &amp; Classroom Tech</option>
                  <option value="TECHNOLOGY">Technology, WiFi &amp; ERP</option>
                  <option value="STUDENT_SERVICES">Student Services &amp; Canteen</option>
                  <option value="LIBRARY">Library Resources &amp; Study Zones</option>
                  <option value="SPORTS">Sports &amp; Cultural Clubs</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                  Suggestion Title *
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  value={suggestionTitle}
                  onChange={(e) => setSuggestionTitle(e.target.value)}
                  placeholder="e.g. 24/7 Digital Library Terminal Access"
                  style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            {/* Description (Wide textarea) */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                Detailed Suggestion Description *
              </label>
              <textarea 
                className="form-control" 
                rows={4}
                required
                value={suggestionDescription}
                onChange={(e) => setSuggestionDescription(e.target.value)}
                placeholder="Elaborate on the proposed idea, specific areas of benefit, and rationale..."
                style={{ width: '100%', minHeight: '100px', borderRadius: '6px', fontSize: '0.8125rem' }}
              />
            </div>

            {/* Expected Impact (Full-width) */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                Expected Impact / Benefits (Optional)
              </label>
              <input 
                type="text" 
                className="form-control"
                value={expectedImprovement}
                onChange={(e) => setExpectedImprovement(e.target.value)}
                placeholder="e.g. Better student exam preparation flexibility"
                style={{ width: '100%', height: '42px', borderRadius: '6px', fontSize: '0.8125rem' }}
              />
            </div>

            {/* Footer and Submit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={suggestionAnonymous}
                  onChange={(e) => setSuggestionAnonymous(e.target.checked)}
                  style={{ accentColor: 'var(--brand-navy)' }}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Submit idea anonymously
                </span>
              </label>

              <button 
                type="submit" 
                disabled={isSubmittingSuggestion}
                className="btn btn-primary" 
                style={{ 
                  backgroundColor: 'var(--brand-navy)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  padding: '0.55rem 1.4rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: isSubmittingSuggestion ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={15} /> {isSubmittingSuggestion ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: VIEW FEEDBACK / GRIEVANCE DETAILS ─────────────────────── */}
      {viewingFeedback && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(3px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 300, 
          padding: '1rem' 
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  {viewingFeedback.itemType === 'GRIEVANCE' ? 'Grievance Record Details' : 'Feedback Record Details'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {viewingFeedback.feedbackNo}
                </span>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setViewingFeedback(null)}
                style={{ padding: '0.35rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Category</div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.875rem' }}>{viewingFeedback.category.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  {getStatusBadge(viewingFeedback.status)}
                </div>
              </div>

              {viewingFeedback.subjectTitle && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Title / Subject</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.875rem', marginTop: '0.15rem' }}>{viewingFeedback.subjectTitle}</div>
                </div>
              )}

              {viewingFeedback.comments && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Comments / Description</div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface-hover)', fontSize: '0.8125rem', lineHeight: 1.5, marginTop: '0.2rem', border: '1px solid var(--border-color)' }}>
                    {viewingFeedback.comments}
                  </div>
                </div>
              )}

              {viewingFeedback.resolutionSummary && (
                <div style={{ padding: '0.75rem 0.85rem', backgroundColor: '#D1FAE5', borderRadius: '6px', color: '#065F46', border: '1px solid #10B981' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>Resolution Summary</div>
                  <p style={{ fontSize: '0.8125rem', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>{viewingFeedback.resolutionSummary}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setViewingFeedback(null)} style={{ fontSize: '0.8125rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeedbackPage;
