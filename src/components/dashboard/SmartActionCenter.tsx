import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { smartActionCenterService } from '../../services/actionCenterService';
import { SmartActionItem, SmartActionPriority, UserRole } from '../../types';
import { 
  AlertOctagon, AlertTriangle, ArrowRight, BookOpen, Camera, 
  CheckCircle2, CheckSquare, ClipboardCheck, Clock, CornerDownLeft, 
  FileCheck, FileText, IndianRupee, Layers, ShieldAlert, ShieldCheck, 
  Sparkles, UserCheck, UserPlus, Wrench, Award, HelpCircle, Building2,
  BellRing, Filter, Flame
} from 'lucide-react';

interface SmartActionCenterProps {
  setActiveTab: (tab: string, params?: any) => void;
  className?: string;
}

export const SmartActionCenter: React.FC<SmartActionCenterProps> = ({ setActiveTab, className = '' }) => {
  const { user, role } = useAuth();
  const effectiveRole = (role || user?.role) as UserRole;

  const [filterPriority, setFilterPriority] = useState<'ALL' | SmartActionPriority>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Load authorized actionable items
  const actionItems: SmartActionItem[] = useMemo(() => {
    return smartActionCenterService.getSmartActionItems(user, effectiveRole);
  }, [user, effectiveRole]);

  // Priority Breakdown Counts
  const criticalCount = useMemo(() => actionItems.filter(a => a.priority === 'CRITICAL').length, [actionItems]);
  const highCount = useMemo(() => actionItems.filter(a => a.priority === 'HIGH').length, [actionItems]);
  const mediumCount = useMemo(() => actionItems.filter(a => a.priority === 'MEDIUM').length, [actionItems]);
  const lowCount = useMemo(() => actionItems.filter(a => a.priority === 'LOW').length, [actionItems]);

  // Filtered List
  const filteredActions = useMemo(() => {
    return actionItems.filter(item => {
      if (filterPriority !== 'ALL' && item.priority !== filterPriority) return false;
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      return true;
    });
  }, [actionItems, filterPriority, filterCategory]);

  const handleActionClick = (action: SmartActionItem) => {
    if (!action) return;
    const params = action.targetParams || {
      recordId: action.targetRecordId,
      actionType: action.actionType,
      category: action.category
    };
    setActiveTab(action.targetTab, params);
  };

  // Helper to map icon name to Lucide component
  const renderActionIcon = (iconName: string, priority: SmartActionPriority) => {
    const size = 20;
    const color = 
      priority === 'CRITICAL' ? '#EF4444' :
      priority === 'HIGH' ? '#F97316' :
      priority === 'MEDIUM' ? '#3B82F6' : '#10B981';

    switch (iconName) {
      case 'IndianRupee': return <IndianRupee size={size} color={color} />;
      case 'ClipboardCheck': return <ClipboardCheck size={size} color={color} />;
      case 'BookOpen': return <BookOpen size={size} color={color} />;
      case 'Camera': return <Camera size={size} color={color} />;
      case 'CheckSquare': return <CheckSquare size={size} color={color} />;
      case 'FileCheck': return <FileCheck size={size} color={color} />;
      case 'CornerDownLeft': return <CornerDownLeft size={size} color={color} />;
      case 'UserPlus': return <UserPlus size={size} color={color} />;
      case 'Wrench': return <Wrench size={size} color={color} />;
      case 'Layers': return <Layers size={size} color={color} />;
      case 'Award': return <Award size={size} color={color} />;
      case 'Building2': return <Building2 size={size} color={color} />;
      case 'UserCheck': return <UserCheck size={size} color={color} />;
      case 'HelpCircle': return <HelpCircle size={size} color={color} />;
      default: return <AlertTriangle size={size} color={color} />;
    }
  };

  const getPriorityStyle = (priority: SmartActionPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          borderColor: '#EF4444',
          badgeBg: '#FEE2E2',
          badgeColor: '#991B1B',
          cardBg: '#FFFDFD',
          leftBar: '4px solid #EF4444'
        };
      case 'HIGH':
        return {
          borderColor: '#F97316',
          badgeBg: '#FFEDD5',
          badgeColor: '#9A3412',
          cardBg: '#FFFDFB',
          leftBar: '4px solid #F97316'
        };
      case 'MEDIUM':
        return {
          borderColor: '#3B82F6',
          badgeBg: '#DBEAFE',
          badgeColor: '#1E40AF',
          cardBg: '#F8FAFC',
          leftBar: '4px solid #3B82F6'
        };
      case 'LOW':
      default:
        return {
          borderColor: '#10B981',
          badgeBg: '#D1FAE5',
          badgeColor: '#065F46',
          cardBg: '#F8FAFC',
          leftBar: '4px solid #10B981'
        };
    }
  };

  return (
    <div 
      className={`card ${className}`} 
      style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid #E2E8F0',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 20px -2px rgba(15, 44, 89, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      {/* ─── ACTION CENTER HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F37023 0%, #EA580C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(243, 112, 35, 0.35)'
          }}>
            <BellRing size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.2px' }}>
                WHAT NEEDS MY ATTENTION?
              </h3>
              {criticalCount > 0 && (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: '#FEE2E2', 
                  color: '#991B1B', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.72rem', 
                  fontWeight: 800,
                  border: '1px solid #FCA5A5',
                  animation: 'pulse 2s infinite'
                }}>
                  <Flame size={12} color="#DC2626" />
                  {criticalCount} CRITICAL
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Real-time actionable alerts, pending digital approvals, and statutory deadlines for <strong>{user?.name}</strong> ({effectiveRole})
            </p>
          </div>
        </div>

        {/* Priority Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setFilterPriority('ALL')}
            className={`btn btn-sm ${filterPriority === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            All Actions ({actionItems.length})
          </button>

          {criticalCount > 0 && (
            <button
              onClick={() => setFilterPriority('CRITICAL')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                border: filterPriority === 'CRITICAL' ? '2px solid #EF4444' : '1px solid #FCA5A5',
                background: filterPriority === 'CRITICAL' ? '#EF4444' : '#FEE2E2',
                color: filterPriority === 'CRITICAL' ? '#FFFFFF' : '#991B1B',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Critical ({criticalCount})
            </button>
          )}

          {highCount > 0 && (
            <button
              onClick={() => setFilterPriority('HIGH')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                border: filterPriority === 'HIGH' ? '2px solid #F97316' : '1px solid #FDBA74',
                background: filterPriority === 'HIGH' ? '#F97316' : '#FFEDD5',
                color: filterPriority === 'HIGH' ? '#FFFFFF' : '#9A3412',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              High ({highCount})
            </button>
          )}

          {mediumCount > 0 && (
            <button
              onClick={() => setFilterPriority('MEDIUM')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                border: filterPriority === 'MEDIUM' ? '2px solid #3B82F6' : '1px solid #BFDBFE',
                background: filterPriority === 'MEDIUM' ? '#3B82F6' : '#DBEAFE',
                color: filterPriority === 'MEDIUM' ? '#FFFFFF' : '#1E40AF',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Medium ({mediumCount})
            </button>
          )}
        </div>
      </div>

      {/* ─── ACTION CARDS GRID ─── */}
      {filteredActions.length === 0 ? (
        <div style={{ 
          padding: '2.5rem 1.5rem', 
          textAlign: 'center', 
          background: '#F0FDF4', 
          border: '1px solid #BBF7D0', 
          borderRadius: 'var(--radius-md)' 
        }}>
          <ShieldCheck size={36} color="#16A34A" style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#166534' }}>
            All Clear! No Pending Actions Required
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#15803D', marginTop: '4px' }}>
            There are no pending approvals, overdue tasks, or unresolved alerts matching your current filter.
          </div>
        </div>
      ) : (
        <div 
          className="dashboard-attention-cards-grid"
          style={{ 
            '--action-count': Math.max(1, filteredActions.length)
          } as React.CSSProperties}
        >
          {filteredActions.map(action => {
            const pStyle = getPriorityStyle(action.priority);

            return (
              <div
                key={action.id}
                onClick={() => handleActionClick(action)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActionClick(action); } }}
                style={{
                  background: pStyle.cardBg,
                  border: '1px solid #E2E8F0',
                  borderLeft: pStyle.leftBar,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem 0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  cursor: 'pointer',
                  minWidth: 0,
                  height: '100%'
                }}
                className="dashboard-action-card action-card-hover"
              >
                <div>
                  {/* Top Bar: Icon + Source Module + Priority Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        background: '#FFFFFF', 
                        border: '1px solid #E2E8F0',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}>
                        {renderActionIcon(action.iconName, action.priority)}
                      </div>

                      {action.sourceModule && (
                        <span style={{ 
                          fontSize: '0.65625rem', 
                          fontWeight: 800, 
                          color: 'var(--text-muted)', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {action.sourceModule}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                      {action.countLabel && (
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          background: '#FFFFFF',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          color: 'var(--brand-navy)'
                        }}>
                          {action.countLabel}
                        </span>
                      )}

                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        background: pStyle.badgeBg,
                        color: pStyle.badgeColor,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        {action.priority}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 800, 
                    color: 'var(--brand-navy)', 
                    margin: '0 0 0.25rem 0',
                    lineHeight: 1.3
                  }}>
                    {action.title}
                  </h4>

                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    margin: 0, 
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {action.shortDescription}
                  </p>
                </div>

                {/* Footer: Due Date + Action Button */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderTop: '1px dashed #E2E8F0', 
                  paddingTop: '0.55rem',
                  marginTop: '0.2rem',
                  gap: '0.35rem'
                }}>
                  {action.dueDate ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6875rem', color: '#DC2626', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <Clock size={12} />
                      <span>Due: {action.dueDate}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Authorized Queue
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(action);
                    }}
                    className="btn btn-sm"
                    style={{
                      background: action.priority === 'CRITICAL' ? '#EF4444' : action.priority === 'HIGH' ? '#F37023' : 'var(--brand-navy)',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{action.takeActionText}</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
