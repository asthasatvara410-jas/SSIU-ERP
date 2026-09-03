import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import { Modal } from '../../components/common/Modal';
import { 
  Bell, Plus, Pin, Calendar, FileText, Download, Eye, 
  CheckCircle, Building, User, Info, Loader2, Search,
  Filter, ChevronLeft, ChevronRight, AlertTriangle, Paperclip
} from 'lucide-react';
import { downloadNoticePdf } from '../../services/noticePdfService';
import { noticeService, ServerNotice } from '../../services/noticeService';

interface NoticeItem {
  id: string;
  noticeNo?: string;
  title: string;
  category: 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'FEES' | 'EVENT' | 'ADMINISTRATIVE' | 'GENERAL' | string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' | string;
  publishedDate: string;
  content: string;
  isPinned: boolean;
  publishedBy: string;
  scopeType?: string;
  targetRole?: string;
  fileUrl?: string;
  expiresAt?: string | null;
  status?: string;
}

const initialNotices: NoticeItem[] = [
  {
    id: 'not-1',
    noticeNo: 'NOT-2026-000001',
    title: 'Mid-Semester Examination Schedule & Time Table Announcement',
    category: 'EXAM',
    priority: 'HIGH',
    publishedDate: '2026-03-01',
    content: 'All B.Tech Computer Engineering students are informed that Mid-Semester Examinations will commence from 25th March 2026. Detailed timetable has been published on portal.',
    isPinned: true,
    publishedBy: 'Controller of Examinations',
    scopeType: 'UNIVERSITY_WIDE',
    targetRole: 'STUDENT',
    fileUrl: 'https://swarrnim.edu.in/docs/exam-notice.pdf'
  },
  {
    id: 'not-2',
    noticeNo: 'NOT-2026-000002',
    title: 'Holi Festival Holiday Announcement & Hostel Timings',
    category: 'HOLIDAY',
    priority: 'NORMAL',
    publishedDate: '2026-03-05',
    content: 'University will remain closed on 25th and 26th March 2026 on account of Holi festival. Normal academic schedule resumes on 27th March.',
    isPinned: false,
    publishedBy: 'Registrar Office',
    scopeType: 'UNIVERSITY_WIDE',
    targetRole: 'ALL'
  },
  {
    id: 'not-3',
    noticeNo: 'NOT-2026-000003',
    title: 'Final Year Major Project Submission Guidelines & Review Dates',
    category: 'ACADEMIC',
    priority: 'URGENT',
    publishedDate: '2026-03-10',
    content: 'Final year students must submit their complete thesis documentation and GitHub repository links before 15th April 2026. Departmental viva voce will follow.',
    isPinned: false,
    publishedBy: 'Dean of Academic Affairs',
    scopeType: 'DEPARTMENT_WIDE',
    targetRole: 'STUDENT'
  },
  {
    id: 'not-4',
    noticeNo: 'NOT-2026-000004',
    title: 'Even Semester Fee Payment Deadline & Online Receipt Verification',
    category: 'FEES',
    priority: 'HIGH',
    publishedDate: '2026-03-12',
    content: 'Students who have pending fee dues for Semester 4/6/8 are advised to clear them before 20th March to avoid examination registration hold.',
    isPinned: false,
    publishedBy: 'Accounts Department',
    scopeType: 'UNIVERSITY_WIDE',
    targetRole: 'STUDENT'
  }
];

export const NoticesPage: React.FC = () => {
  const { user, role } = useAuth();
  const [notices, setNotices] = useState<NoticeItem[]>(initialNotices);
  const [showModal, setShowModal] = useState(false);
  const [viewNotice, setViewNotice] = useState<NoticeItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(initialNotices.length);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoticeItem['category']>('ACADEMIC');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT' | 'LOW'>('NORMAL');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [scopeType, setScopeType] = useState<string>('UNIVERSITY_WIDE');
  const [targetRole, setTargetRole] = useState<string>('ALL');
  const [publishAt, setPublishAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await noticeService.getNoticesServer({
        page: currentPage,
        limit: pageSize,
        category: filterCategory,
        priority: filterPriority,
        search: searchTerm,
        status: filterStatus === 'ACTIVE' ? 'PUBLISHED' : filterStatus,
      });

      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: NoticeItem[] = res.data.map((n: ServerNotice) => ({
          id: n.id,
          noticeNo: n.noticeNo,
          title: n.title,
          category: n.category,
          priority: n.priority,
          publishedDate: n.publishedDate || (n.createdAt ? n.createdAt.split('T')[0] : ''),
          content: n.content,
          isPinned: Boolean(n.isPinned),
          publishedBy: n.publishedBy || 'University Administration',
          scopeType: n.scopeType,
          targetRole: n.targetRole,
          fileUrl: n.attachmentUrl || undefined,
          expiresAt: n.expiresAt,
          status: n.status,
        }));
        setNotices(mapped);
        setTotalRecords(res.total || mapped.length);
      } else {
        setNotices(initialNotices);
        setTotalRecords(initialNotices.length);
      }
    } catch (err) {
      setNotices(initialNotices);
      setTotalRecords(initialNotices.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, filterCategory, filterPriority, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterPriority, filterStatus, pageSize]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
      showToast('error', 'Expiry date must be after publication date.');
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      priority,
      content: content.trim(),
      isPinned,
      scopeType,
      targetRole,
      publishAt: publishAt || undefined,
      expiresAt: expiresAt || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
      publishedBy: user?.name || user?.username || 'University Authority',
    };

    try {
      const created = await noticeService.createNoticeServer(payload);
      showToast('success', `Notice "${created.title}" published successfully.`);
      setShowModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setAttachmentUrl('');
      setPublishAt('');
      setExpiresAt('');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to publish notice.');
      // Local fallback
      const localNew: NoticeItem = {
        id: `not-${Date.now()}`,
        noticeNo: `NOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        category,
        priority,
        publishedDate: new Date().toISOString().split('T')[0],
        content: content.trim(),
        isPinned,
        publishedBy: user?.name || 'University Administration',
        scopeType,
        targetRole,
        fileUrl: attachmentUrl || undefined,
      };
      setNotices([localNew, ...notices]);
      setShowModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setAttachmentUrl('');
    }
  };

  const handleDownloadNotice = async (n: NoticeItem, index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (downloadingId) return;

    setDownloadingId(n.id);
    showToast('info', `Generating PDF for "${n.title}"...`);

    try {
      const success = await downloadNoticePdf({
        ...n,
        serialNo: (currentPage - 1) * pageSize + index + 1,
      });

      if (success) {
        showToast('success', 'Official Notice PDF downloaded.');
      } else {
        showToast('error', 'Unable to generate PDF. Please try again.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'An error occurred during PDF generation.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getCategoryBadge = (cat: NoticeItem['category']) => {
    switch (cat) {
      case 'EXAM': return <Badge variant="orange">EXAM</Badge>;
      case 'HOLIDAY': return <Badge variant="danger">HOLIDAY</Badge>;
      case 'ACADEMIC': return <Badge variant="navy">ACADEMIC</Badge>;
      case 'FEES': return <Badge variant="active">FEES</Badge>;
      case 'EVENT': return <Badge variant="gold">EVENT</Badge>;
      case 'ADMINISTRATIVE': return <Badge variant="inactive">ADMIN</Badge>;
      default: return <Badge variant="navy">GENERAL</Badge>;
    }
  };

  const getPriorityBadge = (prio?: string) => {
    switch (prio) {
      case 'URGENT': return <Badge variant="danger">URGENT</Badge>;
      case 'HIGH': return <Badge variant="warning">HIGH</Badge>;
      case 'LOW': return <Badge variant="active">LOW</Badge>;
      default: return <Badge variant="navy">NORMAL</Badge>;
    }
  };

  const isNoticeCreatorRole = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRINCIPAL', 'HOD', 'REGISTRAR', 'DEAN'].includes(role || '');

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          backgroundColor: toastMessage.type === 'success' ? '#10B981' : toastMessage.type === 'error' ? '#EF4444' : 'var(--brand-navy)',
          color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '0.8125rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toastMessage.type === 'info' && <Loader2 size={15} className="animate-spin" />}
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Official Notice Board &amp; Campus Circulars
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Swarrnim Startup &amp; Innovation University Official Circulars, Exam Notices &amp; Administrative Bulletins
          </p>
        </div>

        {isNoticeCreatorRole && (
          <button 
            type="button"
            onClick={() => setShowModal(true)} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
          >
            <Plus size={15} /> Post New Notice
          </button>
        )}
      </div>

      {/* Search & Parameterized Filters Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', minWidth: '200px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search notices by title or content..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') loadData(); }}
                style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '0.8125rem', borderColor: '#CBD5E1' }}
              />
            </div>
            <button 
              type="button" 
              onClick={loadData} 
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.75rem', height: '36px', whiteSpace: 'nowrap' }}
            >
              Search
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Category:</span>
              <select
                className="form-select"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', borderColor: '#CBD5E1', height: '36px' }}
              >
                <option value="ALL">All Categories</option>
                <option value="ACADEMIC">ACADEMIC</option>
                <option value="EXAM">EXAMINATION</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="FEES">FEES &amp; FINANCE</option>
                <option value="EVENT">CAMPUS EVENT</option>
                <option value="ADMINISTRATIVE">ADMINISTRATIVE</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Priority:</span>
              <select
                className="form-select"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', borderColor: '#CBD5E1', height: '36px' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="NORMAL">NORMAL</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Status Filter (Active vs Archived for staff) */}
            {isNoticeCreatorRole && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Status:</span>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem', borderColor: '#CBD5E1', height: '36px' }}
                >
                  <option value="ACTIVE">Active Notices</option>
                  <option value="ALL">All Lifecycle States</option>
                  <option value="DRAFT">Drafts</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excel-Style Notice Board Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <ExcelTableContainer minWidth="100%">
          <ExcelTable>
            <thead>
              <tr>
                <ExcelTh align="center" style={{ width: '80px', minWidth: '80px' }}>SR. NO.</ExcelTh>
                <ExcelTh align="center" style={{ width: '130px', minWidth: '130px' }}>NOTICE DATE</ExcelTh>
                <ExcelTh align="center" style={{ width: '130px', minWidth: '130px' }}>NOTICE TYPE</ExcelTh>
                <ExcelTh align="center" style={{ width: '100px', minWidth: '100px' }}>PRIORITY</ExcelTh>
                <ExcelTh align="left" style={{ minWidth: '280px' }}>NOTICE TITLE</ExcelTh>
                <ExcelTh align="center" style={{ width: '110px', minWidth: '110px' }}>ACTION</ExcelTh>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <ExcelTd colSpan={6} align="center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Bell size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--border-color)', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand-navy)' }}>No notices found</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78125rem' }}>Official campus circulars matching your criteria will appear here</p>
                  </ExcelTd>
                </tr>
              ) : (
                notices.map((n, idx) => {
                  const isDownloading = downloadingId === n.id;
                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr 
                      key={n.id} 
                      style={{ 
                        background: n.isPinned ? 'rgba(243, 112, 35, 0.03)' : undefined,
                        cursor: 'pointer'
                      }}
                      onClick={() => setViewNotice(n)}
                      title="Click to view full notice details"
                    >
                      <ExcelTd align="center" mono color="var(--brand-navy)">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                          {n.isPinned && <Pin size={13} color="var(--brand-orange, #F37023)" />}
                          <span>{serialNumber}</span>
                        </div>
                      </ExcelTd>

                      <ExcelTd align="center">
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{n.publishedDate}</span>
                      </ExcelTd>

                      <ExcelTd align="center">
                        {getCategoryBadge(n.category)}
                      </ExcelTd>

                      <ExcelTd align="center">
                        {getPriorityBadge(n.priority)}
                      </ExcelTd>

                      <ExcelTd align="left">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span 
                            style={{ 
                              fontWeight: 600, 
                              color: 'var(--brand-navy)',
                              lineHeight: 1.35,
                              fontSize: '0.84375rem'
                            }}
                            className="hover:underline"
                          >
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                            Issued by: <strong>{n.publishedBy}</strong>
                            {n.noticeNo && ` • Ref: ${n.noticeNo}`}
                          </span>
                        </div>
                      </ExcelTd>

                      <ExcelTd align="center">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadNotice(n, idx, e)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Download official circular PDF"
                          >
                            {isDownloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                            <span>PDF</span>
                          </button>
                        </div>
                      </ExcelTd>
                    </tr>
                  );
                })
              )}
            </tbody>
          </ExcelTable>
        </ExcelTableContainer>

        {/* Server-Side Pagination Bar */}
        {totalRecords > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{(currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{Math.min(currentPage * pageSize, totalRecords)}</span> of <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{totalRecords}</span> notices
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Rows per page:</span>
                <select 
                  className="form-select" 
                  value={pageSize} 
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ width: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.85rem' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-navy)', padding: '0 0.5rem' }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW NOTICE MODAL */}
      {viewNotice && (
        <Modal
          isOpen={Boolean(viewNotice)}
          onClose={() => setViewNotice(null)}
          title="Official Notice Details"
          subtitle={`Published on ${viewNotice.publishedDate} • Issued by ${viewNotice.publishedBy}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadNotice(viewNotice, 0)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
                >
                  <Download size={14} /> Generate Circular PDF
                </button>
                {viewNotice.fileUrl && (
                  <a
                    href={viewNotice.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
                  >
                    <Paperclip size={14} /> View Attachment
                  </a>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setViewNotice(null)} 
                className="btn btn-secondary"
                style={{ minWidth: '90px' }}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {viewNotice.isPinned && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand-orange, #F37023)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Pin size={13} /> PINNED NOTICE
                </span>
              )}
              {getCategoryBadge(viewNotice.category)}
              {getPriorityBadge(viewNotice.priority)}
              {viewNotice.scopeType && (
                <Badge variant="navy">{viewNotice.scopeType.replace('_', ' ')}</Badge>
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, lineHeight: 1.4 }}>
              {viewNotice.title}
            </h3>

            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem', lineHeight: 1.6, color: '#1E293B', whiteSpace: 'pre-line' }}>
              {viewNotice.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div><strong>Authority:</strong> {viewNotice.publishedBy}</div>
              {viewNotice.expiresAt && (
                <div><strong>Valid Until:</strong> {viewNotice.expiresAt.split('T')[0]}</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* POST NEW NOTICE MODAL */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Post Official Notice"
          subtitle="Publish or schedule a formal circular with targeted audience scoping"
          maxWidth="640px"
        >
          <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Notice Title *
              </label>
              <input 
                type="text" 
                required 
                className="input-field" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Mid-Sem Exam Schedule Announcement" 
                style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Category *
                </label>
                <select 
                  className="input-field" 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                  style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
                >
                  <option value="ACADEMIC">ACADEMIC</option>
                  <option value="EXAM">EXAMINATION</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                  <option value="FEES">FEES &amp; FINANCE</option>
                  <option value="EVENT">CAMPUS EVENT</option>
                  <option value="ADMINISTRATIVE">ADMINISTRATIVE</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Priority *
                </label>
                <select 
                  className="input-field" 
                  value={priority} 
                  onChange={e => setPriority(e.target.value as any)}
                  style={{ width: '100%', height: '40px', fontSize: '0.85rem', borderColor: '#CBD5E1' }}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            {/* Target Audience Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Target Audience Scope *
                </label>
                <select 
                  className="form-select" 
                  value={scopeType} 
                  onChange={e => setScopeType(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="UNIVERSITY_WIDE">University-Wide (All Campus)</option>
                  <option value="INSTITUTE_WIDE">Institute-Wide (My College)</option>
                  <option value="DEPARTMENT_WIDE">Department-Wide</option>
                  <option value="ROLE_BASED">Role/Cadre Targeted</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Target Role / Cadre
                </label>
                <select 
                  className="form-select" 
                  value={targetRole} 
                  onChange={e => setTargetRole(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                  <option value="STAFF">Administrative Staff Only</option>
                </select>
              </div>
            </div>

            {/* Schedule & Expiry Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Publish Date / Schedule
                </label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={publishAt} 
                  onChange={e => setPublishAt(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem', borderColor: '#CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Expiry Date (Auto-archive)
                </label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={expiresAt} 
                  onChange={e => setExpiresAt(e.target.value)}
                  style={{ width: '100%', height: '36px', fontSize: '0.82rem', borderColor: '#CBD5E1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Notice Details / Circular Content *
              </label>
              <textarea 
                required 
                className="input-field" 
                rows={5} 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Type circular content in full detail..." 
                style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontSize: '0.85rem', padding: '0.75rem', borderColor: '#CBD5E1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Attachment URL (Optional PDF/Document Link)
              </label>
              <input 
                type="url" 
                className="input-field" 
                value={attachmentUrl} 
                onChange={e => setAttachmentUrl(e.target.value)} 
                placeholder="https://swarrnim.edu.in/docs/circular.pdf" 
                style={{ width: '100%', height: '36px', fontSize: '0.82rem', borderColor: '#CBD5E1' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <input 
                type="checkbox" 
                id="pin-notice" 
                checked={isPinned} 
                onChange={e => setIsPinned(e.target.checked)} 
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-orange, #F37023)' }}
              />
              <label htmlFor="pin-notice" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer' }}>
                Pin as Important Notice at Top of Register
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700 }}
              >
                Publish Notice
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default NoticesPage;
