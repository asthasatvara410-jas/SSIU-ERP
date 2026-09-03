import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  ArrowRight,
  CheckCheck,
  Calendar,
  BookOpen,
  FileText,
  Award,
  DollarSign,
  Clock,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sparkles,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ERPNotification, NotificationModule } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { notificationService } from '../../services/notificationService';
import { useModalScrollLock } from '../../utils/modalScrollLock';

export interface PostLoginUpdateModalProps {
  notifications: ERPNotification[];
  onClose: () => void;
  onNavigateTab?: (tab: string, params?: any) => void;
}

export const PostLoginUpdateModal: React.FC<PostLoginUpdateModalProps> = ({
  notifications,
  onClose,
  onNavigateTab
}) => {
  const { user, role } = useAuth();
  const [unreadList, setUnreadList] = useState<ERPNotification[]>(notifications);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'URGENT' | 'ACADEMIC' | 'EXAM' | 'FEES' | 'NOTICE'>('ALL');

  useModalScrollLock(unreadList.length > 0, onClose);

  // Sync if prop notifications change
  React.useEffect(() => {
    setUnreadList(notifications);
  }, [notifications]);

  // Sort: URGENT first, then HIGH, then others by date
  const sortedNotifications = useMemo(() => {
    return [...unreadList].sort((a, b) => {
      const priorityWeight: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        NORMAL: 1,
        LOW: 0
      };
      const pA = priorityWeight[(a.priority || 'NORMAL').toUpperCase()] ?? 1;
      const pB = priorityWeight[(b.priority || 'NORMAL').toUpperCase()] ?? 1;
      if (pA !== pB) return pB - pA;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [unreadList]);

  // Filtered by selected category chip
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'ALL') return sortedNotifications;
    if (selectedFilter === 'URGENT') {
      return sortedNotifications.filter(
        n => (n.priority || '').toUpperCase() === 'URGENT' || (n.priority || '').toUpperCase() === 'HIGH'
      );
    }
    if (selectedFilter === 'EXAM') {
      return sortedNotifications.filter(n => (n.module || '').toUpperCase() === 'EXAM');
    }
    if (selectedFilter === 'FEES') {
      return sortedNotifications.filter(n => (n.module || '').toUpperCase() === 'FEES');
    }
    if (selectedFilter === 'ACADEMIC') {
      return sortedNotifications.filter(
        n => ['ASSIGNMENT', 'MATERIAL', 'TIMETABLE', 'ATTENDANCE', 'ACADEMIC'].includes((n.module || '').toUpperCase())
      );
    }
    if (selectedFilter === 'NOTICE') {
      return sortedNotifications.filter(
        n => ['NOTICE', 'EVENT', 'SYSTEM', 'ANNOUNCEMENT'].includes((n.module || '').toUpperCase())
      );
    }
    return sortedNotifications;
  }, [sortedNotifications, selectedFilter]);

  const urgentCount = unreadList.filter(
    n => (n.priority || '').toUpperCase() === 'URGENT' || (n.priority || '').toUpperCase() === 'HIGH'
  ).length;

  const handleMarkRead = (notifId: string) => {
    if (user?.id) {
      db.markNotificationAsRead(notifId, user.id);
    }
    const updated = unreadList.filter(n => n.id !== notifId);
    setUnreadList(updated);
    if (updated.length === 0) {
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead(user, role);
    setUnreadList([]);
    onClose();
  };

  const handleActionClick = (n: ERPNotification) => {
    if (user?.id) {
      db.markNotificationAsRead(n.id, user.id);
    }
    const target = notificationService.resolveNotificationTarget(n, user, role);
    onClose();
    if (onNavigateTab) {
      if (target.tab) {
        onNavigateTab(target.tab, target.params);
      } else if (n.linkTab) {
        onNavigateTab(n.linkTab);
      } else {
        onNavigateTab('dashboard');
      }
    }
  };

  const getModuleBadge = (module: string | NotificationModule) => {
    const mod = (module || '').toUpperCase();
    switch (mod) {
      case 'EXAM':
        return <Badge variant="orange">EXAMINATION</Badge>;
      case 'FEES':
        return <Badge variant="gold">FEE UPDATE</Badge>;
      case 'ASSIGNMENT':
        return <Badge variant="navy">ASSIGNMENT</Badge>;
      case 'MATERIAL':
        return <Badge variant="navy">STUDY MATERIAL</Badge>;
      case 'TIMETABLE':
        return <Badge variant="navy">TIMETABLE</Badge>;
      case 'ATTENDANCE':
        return <Badge variant="orange">ATTENDANCE</Badge>;
      case 'NOTICE':
        return <Badge variant="orange">NOTICE</Badge>;
      case 'EVENT':
        return <Badge variant="gold">EVENT</Badge>;
      case 'APPROVAL':
        return <Badge variant="active">APPROVAL</Badge>;
      case 'HOSTEL':
        return <Badge variant="navy">HOSTEL</Badge>;
      case 'REQUEST':
        return <Badge variant="navy">REQUEST</Badge>;
      default:
        return <Badge variant="navy">SYSTEM NOTICE</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'URGENT') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.4px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }}
        >
          <Flame size={12} className="animate-pulse" /> URGENT
        </span>
      );
    }
    if (p === 'HIGH') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            border: '1px solid #FDE68A'
          }}
        >
          <AlertTriangle size={12} /> HIGH PRIORITY
        </span>
      );
    }
    return null;
  };

  if (unreadList.length === 0) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-container"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Post-Login Updates & Announcements"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(18, 54, 107, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          overflow: 'hidden',
          animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* ── Modal Header Banner ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A2244 0%, #12366B 65%, #F58220 130%)',
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={22} color="#F5A623" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    margin: 0,
                    color: '#FFFFFF',
                    letterSpacing: '-0.2px'
                  }}
                >
                  University Updates &amp; Notices
                </h3>
                {urgentCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Flame size={11} /> {urgentCount} Urgent
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  margin: '0.2rem 0 0 0',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500
                }}
              >
                Welcome back, {user?.name || 'User'}! You have {unreadList.length} relevant update
                {unreadList.length > 1 ? 's' : ''} to review.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close update popup"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Category Filter Bar (If multiple updates) ── */}
        {unreadList.length > 2 && (
          <div
            style={{
              padding: '0.65rem 1.5rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              overflowX: 'auto',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginRight: '0.25rem'
              }}
            >
              <Filter size={12} /> Filter:
            </span>

            {[
              { key: 'ALL', label: `All (${unreadList.length})` },
              ...(urgentCount > 0 ? [{ key: 'URGENT', label: `Urgent (${urgentCount})` }] : []),
              { key: 'ACADEMIC', label: 'Academic' },
              { key: 'EXAM', label: 'Exams' },
              { key: 'FEES', label: 'Fees' },
              { key: 'NOTICE', label: 'Notices' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key as any)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: selectedFilter === tab.key ? 700 : 500,
                  backgroundColor: selectedFilter === tab.key ? '#12366B' : '#FFFFFF',
                  color: selectedFilter === tab.key ? '#FFFFFF' : '#475569',
                  border: selectedFilter === tab.key ? '1px solid #12366B' : '1px solid #CBD5E1',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Updates List Body ── */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            backgroundColor: '#F8FAFD'
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: '#64748B',
                fontSize: '0.875rem'
              }}
            >
              No updates found for the selected category.
            </div>
          ) : (
            filteredNotifications.map(n => {
              const isUrgent = (n.priority || '').toUpperCase() === 'URGENT';
              const isHigh = (n.priority || '').toUpperCase() === 'HIGH';

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '1.05rem 1.25rem',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: isUrgent
                      ? '1.5px solid #FECACA'
                      : isHigh
                      ? '1.5px solid #FDE68A'
                      : '1px solid #E2E8F0',
                    borderLeft: isUrgent
                      ? '5px solid #DC2626'
                      : isHigh
                      ? '5px solid #F58220'
                      : '5px solid #12366B',
                    boxShadow: isUrgent
                      ? '0 4px 12px rgba(220, 38, 38, 0.08)'
                      : '0 2px 6px rgba(18, 54, 107, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                    position: 'relative'
                  }}
                >
                  {/* Top Badges & Meta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {getModuleBadge(n.module as NotificationModule)}
                      {getPriorityBadge(n.priority)}
                      <span
                        style={{
                          fontSize: '0.725rem',
                          color: '#64748B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Clock size={12} /> {n.timestamp || 'Recent'}
                      </span>
                    </div>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        fontSize: '0.725rem',
                        padding: '0.2rem 0.5rem',
                        color: '#64748B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Dismiss notification"
                    >
                      <Check size={13} /> Dismiss
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h4
                    style={{
                      fontSize: '0.965rem',
                      fontWeight: 800,
                      color: isUrgent ? '#991B1B' : '#0F2C59',
                      margin: 0,
                      lineHeight: 1.35
                    }}
                  >
                    {n.title}
                  </h4>

                  <p
                    style={{
                      fontSize: '0.84375rem',
                      color: '#334155',
                      margin: 0,
                      lineHeight: 1.5
                    }}
                  >
                    {n.message}
                  </p>

                  {/* Attachment if present */}
                  {n.attachmentName && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: '#0284C7',
                        fontWeight: 600
                      }}
                    >
                      <Paperclip size={13} /> Attached: {n.attachmentName}
                    </div>
                  )}

                  {/* Item Footer: Deep link / details */}
                  {(n.linkTab || n.targetRoute || onNavigateTab) && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.75rem',
                          fontWeight: 600,
                          gap: '0.35rem'
                        }}
                        onClick={() => handleActionClick(n)}
                      >
                        {n.actionLabel || 'View Details'} <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer Controls ── */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAllRead}
            style={{
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#059669',
              borderColor: '#A7F3D0',
              backgroundColor: '#ECFDF5'
            }}
          >
            <CheckCheck size={15} color="#059669" /> Mark All as Read
          </button>

          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              fontSize: '0.875rem',
              padding: '0.55rem 1.45rem',
              fontWeight: 700,
              backgroundColor: '#12366B',
              borderColor: '#12366B',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 12px rgba(18, 54, 107, 0.25)'
            }}
          >
            Continue to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
