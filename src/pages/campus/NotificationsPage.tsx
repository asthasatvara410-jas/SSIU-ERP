import React, { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { 
  Bell, CheckCircle, Clock, Filter, Check, ArrowRight, Paperclip, 
  AlertCircle, ShieldAlert, CheckCircle2, FileText, Landmark, 
  GraduationCap, DollarSign, Home, FolderLock, FileSignature, 
  Settings2, Sparkles, Inbox, RefreshCw
} from 'lucide-react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { ERPNotification, NotificationType } from '../../types';
import { notificationService } from '../../services/notificationService';

interface NotificationsPageProps {
  setActiveTab?: (tab: string, params?: any) => void;
}

export type NotificationCategoryTab =
  | 'ALL'
  | 'UNREAD'
  | 'ACTION_REQUIRED'
  | 'REQUESTS'
  | 'APPROVALS'
  | 'EXAMINATION'
  | 'FEES'
  | 'HOSTEL'
  | 'DOCUMENTS'
  | 'NOTESHEET'
  | 'SYSTEM';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ setActiveTab }) => {
  const { user, role } = useAuth();
  const [activeCategory, setActiveCategory] = useState<NotificationCategoryTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [, setRefreshKey] = useState<number>(0);

  // Backend / Service delivers ONLY notifications targeted to authenticated user
  const userNotifs = db.getNotifications(user, role);

  const filteredNotifs = userNotifs.filter(n => {
    const isRead = (n.isReadByUsers || []).includes(user?.id || 'guest');
    const type = n.type || 'INFORMATION';
    const mod = (n.module || '').toUpperCase();

    // 1. Category Tab Filter
    if (activeCategory === 'UNREAD' && isRead) return false;
    if (activeCategory === 'ACTION_REQUIRED' && type !== 'ACTION_REQUIRED' && type !== 'APPROVAL_REQUIRED') return false;
    if (activeCategory === 'REQUESTS' && mod !== 'REQUEST' && mod !== 'STUDENT_SECTION') return false;
    if (activeCategory === 'APPROVALS' && mod !== 'APPROVAL' && mod !== 'NOTESHEET') return false;
    if (activeCategory === 'EXAMINATION' && mod !== 'EXAM') return false;
    if (activeCategory === 'FEES' && mod !== 'FEES') return false;
    if (activeCategory === 'HOSTEL' && mod !== 'HOSTEL') return false;
    if (activeCategory === 'DOCUMENTS' && mod !== 'DOCUMENT') return false;
    if (activeCategory === 'NOTESHEET' && mod !== 'NOTESHEET') return false;
    if (activeCategory === 'SYSTEM' && mod !== 'SYSTEM' && mod !== 'NOTICE' && mod !== 'EVENT') return false;

    // 2. Priority Filter
    if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchRef = n.referenceId?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchRef) return false;
    }

    return true;
  });

  const handleMarkRead = (id: string) => {
    if (user?.id) {
      db.markNotificationAsRead(id, user.id);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead(user, role);
    setRefreshKey(prev => prev + 1);
  };

  const handleActionClick = (n: ERPNotification) => {
    if (user?.id) {
      db.markNotificationAsRead(n.id, user.id);
      setRefreshKey(prev => prev + 1);
    }
    const target = notificationService.resolveNotificationTarget(n, user, role);
    if (target.tab && setActiveTab) {
      setActiveTab(target.tab, target.params);
    } else if (n.linkTab && setActiveTab) {
      setActiveTab(n.linkTab);
    }
  };

  const getTypeBadge = (type?: NotificationType) => {
    switch (type) {
      case 'ACTION_REQUIRED':
      case 'APPROVAL_REQUIRED':
        return <Badge variant="danger">⚡ ACTION REQUIRED</Badge>;
      case 'STATUS_UPDATE':
        return <Badge variant="navy">STATUS UPDATE</Badge>;
      case 'SUCCESS':
        return <Badge variant="success">✓ SUCCESS</Badge>;
      case 'REJECTION':
        return <Badge variant="danger">✕ REJECTED</Badge>;
      case 'DEADLINE':
        return <Badge variant="warning">⏳ DEADLINE</Badge>;
      case 'REMINDER':
        return <Badge variant="gold">🔔 REMINDER</Badge>;
      default:
        return <Badge variant="navy">INFO</Badge>;
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod?.toUpperCase()) {
      case 'EXAM': return <GraduationCap className="w-4 h-4 text-amber-500" />;
      case 'FEES': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'HOSTEL': return <Home className="w-4 h-4 text-blue-500" />;
      case 'DOCUMENT': return <FolderLock className="w-4 h-4 text-indigo-500" />;
      case 'NOTESHEET': return <FileSignature className="w-4 h-4 text-purple-500" />;
      case 'REQUEST':
      case 'STUDENT_SECTION': return <FileText className="w-4 h-4 text-cyan-500" />;
      case 'APPROVAL': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Landmark className="w-4 h-4 text-slate-500" />;
    }
  };

  const unreadCount = db.getUnreadNotificationCount(user, role);
  const actionRequiredCount = userNotifs.filter(n => (n.type === 'ACTION_REQUIRED' || n.type === 'APPROVAL_REQUIRED') && !(n.isReadByUsers || []).includes(user?.id || '')).length;

  const categoryTabs: { key: NotificationCategoryTab; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All Notifications', count: userNotifs.length },
    { key: 'UNREAD', label: 'Unread', count: unreadCount },
    { key: 'ACTION_REQUIRED', label: 'Action Required', count: actionRequiredCount },
    { key: 'REQUESTS', label: 'Requests' },
    { key: 'APPROVALS', label: 'Approvals' },
    { key: 'EXAMINATION', label: 'Examination' },
    { key: 'FEES', label: 'Fees & Finance' },
    { key: 'HOSTEL', label: 'Hostel' },
    { key: 'DOCUMENTS', label: 'Documents' },
    { key: 'NOTESHEET', label: 'Notesheets' },
    { key: 'SYSTEM', label: 'System & Notices' }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white">Central Notification Center</h1>
                <Badge variant="navy" className="bg-blue-500/30 text-blue-200 border-blue-400/40">
                  Targeted Recipient Delivery
                </Badge>
                {unreadCount > 0 && (
                  <Badge variant="warning" className="bg-amber-500/20 text-amber-300 border-amber-400/30">
                    {unreadCount} Unread Alerts
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Authenticated personal inbox for {user?.name || 'User'} ({role?.replace('_', ' ')}) • Zero unrelated cross-department leakage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition border border-white/10"
              title="Refresh Notifications"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 11 Filter Categories Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categoryTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeCategory === tab.key 
                    ? 'bg-white/20 text-white' 
                    : (tab.count > 0 && tab.key === 'ACTION_REQUIRED' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search notifications by title, details, reference #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Directory List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full w-fit mx-auto">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no notifications matching your current filter in your authenticated inbox.
            </p>
          </div>
        ) : (
          filteredNotifs.map(n => {
            const isRead = (n.isReadByUsers || []).includes(user?.id || 'guest');
            const isUrgent = n.priority === 'URGENT' || n.priority === 'HIGH';
            const isAction = n.type === 'ACTION_REQUIRED' || n.type === 'APPROVAL_REQUIRED';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !isRead
                    ? (isAction 
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' 
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50')
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${
                    !isRead
                      ? (isAction ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-800' : 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-800')
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    {getModuleIcon(n.module)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(n.type)}
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{n.module}</span>
                      {isUrgent && <Badge variant="danger">⚠️ {n.priority}</Badge>}
                      {n.scopeType && n.scopeType !== 'TARGETED' && (
                        <Badge variant="navy" className="text-[10px]">{n.scopeType.replace('_', ' ')}</Badge>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.timestamp || new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold truncate ${!isRead ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                      {n.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.referenceId && (
                      <p className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                        Ref: {n.referenceId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.linkTab && (
                    <button
                      onClick={() => handleActionClick(n)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span>{n.actionLabel || 'View Record'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Mark notification as read"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
