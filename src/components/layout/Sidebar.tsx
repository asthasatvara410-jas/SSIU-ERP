import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeaderLogo } from './HeaderLogo';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  LogOut,
  Star,
  AlertCircle,
  Menu
} from 'lucide-react';
import { 
  getRoleNavigationItems, NavItemConfig, 
  STUDENT_NAVIGATION_STRUCTURE, STUDENT_ADMIN_NAVIGATION_STRUCTURE, FACULTY_NAVIGATION_STRUCTURE, MENTOR_NAVIGATION_STRUCTURE, 
  HOD_NAVIGATION_STRUCTURE, PRINCIPAL_NAVIGATION_STRUCTURE, STUDENT_SECTION_NAVIGATION_STRUCTURE, 
  REGISTRAR_NAVIGATION_STRUCTURE, DEPUTY_REGISTRAR_NAVIGATION_STRUCTURE, VICE_PRESIDENT_NAVIGATION_STRUCTURE,
  PARENT_NAVIGATION_STRUCTURE, ERP_COORDINATOR_NAVIGATION_STRUCTURE
} from '../../constants/navigationConfig';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { quickAccessService, QuickAccessItem } from '../../services/quickAccessService';
import { db } from '../../services/db';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

interface SearchableMenuItem {
  id: string;
  label: string;
  parentLabel?: string;
  icon: any;
  targetTab: string;
  parentGroupId?: string;
  isPinnable?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user, role, activeRole, setActiveRole, registrarViewContext, setRegistrarViewContext, logout } = useAuth();
  const userId = user?.id || (user as any)?.username || 'default_user';

  const isERPCoordinator = role === 'ERP_COORDINATOR';
  const isParent = role === 'PARENT';
  const isStudent = role === 'STUDENT';
  const isStudentAdmin = role === 'STUDENT_ADMIN';
  const isFaculty = role === 'FACULTY';
  const isMentor = role === 'MENTOR';
  const isHOD = role === 'HOD';
  const isPrincipal = role === 'PRINCIPAL';
  const isStudentSection = role === 'STUDENT_SECTION';
  const isRegistrar = role === 'REGISTRAR';
  const isDeputyRegistrar = role === 'DEPUTY_REGISTRAR';
  const isVicePresident = role === 'VICE_PRESIDENT';

  // Check if user has dual Faculty / Mentor authority - strictly for authentic FACULTY/MENTOR accounts
  const isFacultyUser = useMemo(() => {
    if (!user) return false;
    if (user.role !== 'FACULTY' && user.role !== 'MENTOR') return false;
    return true;
  }, [user]);

  // Dynamic context-aware Registrar Navigation structure (Academic vs Non-Academic view switch)
  const registrarNavigationStructure = useMemo(() => {
    if (registrarViewContext === 'NON_ACADEMIC') {
      return REGISTRAR_NAVIGATION_STRUCTURE.filter(
        item => item.category === 'QUICK ACCESS' || item.category === '🏢 NON-ACADEMIC / REGISTRAR OFFICE'
      );
    }
    return REGISTRAR_NAVIGATION_STRUCTURE.filter(
      item => item.category === 'QUICK ACCESS' || item.category === '🎓 ACADEMIC'
    );
  }, [registrarViewContext]);

  // Single sidebar accordion expansion state — all parent menus COLLAPSED (null) by default
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Search & Quick Access state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickAccessVersion, setQuickAccessVersion] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Floating Tooltip state for unclipped, pixel-perfect collapsed sidebar tooltips
  const [activeTooltip, setActiveTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const handleTooltipEnter = (label: string, e: React.MouseEvent<HTMLElement>) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12
    });
  };

  const handleTooltipLeave = () => {
    setActiveTooltip(null);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => (prev === groupId ? null : groupId));
  };

  // Auto-expand the parent group when activeTab matches any of its child submenus
  useEffect(() => {
    if (!activeTab) return;
    const isStructured = isERPCoordinator || isParent || isVicePresident || isStudent || isStudentAdmin || isFaculty || isMentor || isHOD || isPrincipal || isRegistrar || isDeputyRegistrar || isStudentSection;
    if (isStructured) {
      const navStructure = isERPCoordinator
        ? ERP_COORDINATOR_NAVIGATION_STRUCTURE
        : (isParent
          ? PARENT_NAVIGATION_STRUCTURE
          : (isVicePresident
              ? VICE_PRESIDENT_NAVIGATION_STRUCTURE
              : (isStudent 
                  ? STUDENT_NAVIGATION_STRUCTURE 
                  : (isStudentAdmin
                      ? STUDENT_ADMIN_NAVIGATION_STRUCTURE
                      : (isRegistrar
                          ? registrarNavigationStructure
                          : (isDeputyRegistrar
                              ? DEPUTY_REGISTRAR_NAVIGATION_STRUCTURE
                              : (isStudentSection
                                  ? STUDENT_SECTION_NAVIGATION_STRUCTURE
                                  : (isPrincipal
                                      ? PRINCIPAL_NAVIGATION_STRUCTURE
                                      : (isHOD
                                          ? HOD_NAVIGATION_STRUCTURE
                                          : (isMentor
                                              ? MENTOR_NAVIGATION_STRUCTURE
                                              : (isFaculty ? FACULTY_NAVIGATION_STRUCTURE : [])))))))))));

      for (const group of navStructure) {
        if (group.id === 'obe-group' && (activeTab === 'obe' || activeTab.startsWith('obe-') || activeTab === 'course-outcomes' || activeTab === 'program-outcomes' || activeTab === 'program-specific-outcomes' || activeTab === 'co-po-mapping' || activeTab === 'co-pso-mapping' || activeTab === 'assessment-mapping' || activeTab === 'attainment')) {
          setExpandedGroup(group.id);
          break;
        }
        if (group.children && group.children.some(c => c.targetTab === activeTab || c.id === activeTab)) {
          setExpandedGroup(group.id);
          break;
        }
      }
    }
  }, [activeTab, isERPCoordinator, isParent, isVicePresident, isStudent, isStudentAdmin, isFaculty, isMentor, isHOD, isPrincipal, isRegistrar, isDeputyRegistrar, isStudentSection, registrarNavigationStructure]);

  const canAccessPending = db.hasPendingWithMeAccess(user, role);
  const canCreateNotesheet = db.hasNoteSheetPermission(user, role, 'NOTESHEET_CREATE');
  const canViewNotesheet = db.hasNoteSheetPermission(user, role, 'NOTESHEET_VIEW');

  const visibleItems: NavItemConfig[] = getRoleNavigationItems(role).filter(i => {
    if (i.id === 'notesheet-pending') return canAccessPending;
    if (i.id === 'notesheet-create') return canCreateNotesheet;
    if (i.id.startsWith('notesheet-')) return canViewNotesheet;
    return true;
  });
  const categories = Array.from(new Set(visibleItems.map(i => i.category || 'General')));

  // Build searchable index from authorized navigation structures only
  const searchableItems: SearchableMenuItem[] = useMemo(() => {
    const isStructured = isERPCoordinator || isParent || isVicePresident || isStudent || isStudentAdmin || isFaculty || isMentor || isHOD || isPrincipal || isRegistrar || isDeputyRegistrar || isStudentSection;

    if (isStructured) {
      const navStructure = isERPCoordinator
        ? ERP_COORDINATOR_NAVIGATION_STRUCTURE
        : (isParent
          ? PARENT_NAVIGATION_STRUCTURE
          : (isVicePresident
              ? VICE_PRESIDENT_NAVIGATION_STRUCTURE
              : (isStudent 
                  ? STUDENT_NAVIGATION_STRUCTURE 
                  : (isStudentAdmin
                      ? STUDENT_ADMIN_NAVIGATION_STRUCTURE
                      : (isRegistrar
                          ? REGISTRAR_NAVIGATION_STRUCTURE
                          : (isDeputyRegistrar
                              ? DEPUTY_REGISTRAR_NAVIGATION_STRUCTURE
                              : (isStudentSection
                                  ? STUDENT_SECTION_NAVIGATION_STRUCTURE
                                  : (isPrincipal
                                      ? PRINCIPAL_NAVIGATION_STRUCTURE
                                      : (isHOD
                                          ? HOD_NAVIGATION_STRUCTURE
                                          : (isMentor
                                              ? MENTOR_NAVIGATION_STRUCTURE
                                              : (isFaculty ? FACULTY_NAVIGATION_STRUCTURE : [])))))))))));

      const items: SearchableMenuItem[] = [];

      navStructure.forEach(rawGroup => {
        let group = rawGroup;

        const hasChildren = group.children && group.children.length > 0;

        if (!hasChildren) {
          // Direct Top-Level Link (e.g. Dashboard) - not pinnable as parent
          items.push({
            id: group.id,
            label: group.label,
            icon: group.icon,
            targetTab: group.defaultTab,
            isPinnable: false
          });
        } else {
          // Parent Category Group for search discovery (not pinnable)
          items.push({
            id: group.id,
            label: group.label,
            icon: group.icon,
            targetTab: group.defaultTab || group.children![0].targetTab,
            parentGroupId: group.id,
            isPinnable: false
          });

          // Submenu Items (PINNABLE)
          const filteredChildren = group.children!.filter(sub => {
            if (sub.id === 'notesheet-pending' || sub.targetTab === 'notesheet-pending') {
              return canAccessPending;
            }
            if (sub.id === 'notesheet-create' || sub.targetTab === 'notesheet-create') {
              return canCreateNotesheet;
            }
            if (sub.id.startsWith('notesheet-') || sub.targetTab.startsWith('notesheet-')) {
              return canViewNotesheet;
            }
            return true;
          });

          filteredChildren.forEach(sub => {
            items.push({
              id: sub.id,
              label: sub.label,
              parentLabel: group.label,
              icon: group.icon,
              targetTab: sub.targetTab,
              parentGroupId: group.id,
              isPinnable: true
            });
          });
        }
      });

      return items;
    }

    // Category based roles (SUPER_ADMIN, EXAM_CELL, etc.)
    return visibleItems.map(item => ({
      id: item.id,
      label: item.label,
      parentLabel: item.category,
      icon: item.icon,
      targetTab: item.id,
      isPinnable: true
    }));
  }, [
    isVicePresident, isStudent, isFaculty, isMentor, isHOD, isPrincipal, isRegistrar, isDeputyRegistrar, isStudentSection,
    canAccessPending, canCreateNotesheet, canViewNotesheet, visibleItems
  ]);

  // Set of pinned tab IDs for quick lookup (workspace-aware)
  const pinnedIdsSet = useMemo(() => {
    return new Set(quickAccessService.getPinnedIds(userId, role || 'DEFAULT'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, quickAccessVersion, role]);

  // Quick access items (Max 5: Pinned first [max 3], then Frequent, workspace-aware)
  const quickAccessList = useMemo(() => {
    return quickAccessService.getQuickAccessItems(userId, searchableItems, role || 'DEFAULT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, searchableItems, quickAccessVersion, role]);

  const pinnedCount = useMemo(() => {
    return quickAccessList.filter(i => i.isPinned).length;
  }, [quickAccessList]);

  // Case-insensitive, trimmed, partial match across label, parentLabel, id & targetTab
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchableItems.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchParent = item.parentLabel ? item.parentLabel.toLowerCase().includes(q) : false;
      const matchId = item.id.toLowerCase().includes(q) || item.targetTab.toLowerCase().includes(q);
      return matchLabel || matchParent || matchId;
    });
  }, [searchQuery, searchableItems]);

  // Reset selected index on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        if (collapsed) {
          setCollapsed(false);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [collapsed, setCollapsed]);

  const handleNavClick = (id: string) => {
    setActiveTooltip(null);
    if (id === 'logout') {
      logout();
      return;
    }
    quickAccessService.recordUsage(userId, id, role || 'DEFAULT');
    setQuickAccessVersion(v => v + 1);
    setActiveTab(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleTogglePin = (targetTab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = quickAccessService.togglePin(userId, targetTab, role || 'DEFAULT');
    if (!res.success && res.message) {
      setToastMessage(res.message);
      setTimeout(() => {
        setToastMessage(prev => (prev === res.message ? null : prev));
      }, 3500);
    } else {
      setToastMessage(null);
    }
    setQuickAccessVersion(v => v + 1);
  };

  const handleSelectSearchResult = (item: SearchableMenuItem) => {
    handleNavClick(item.targetTab);
    if (item.parentGroupId) {
      setExpandedGroup(item.parentGroupId);
    }
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchQuery('');
      searchInputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectSearchResult(filteredResults[selectedIndex]);
      }
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen?.(false)}
        />
      )}
      <aside
        className={`sidebar-mobile-drawer ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          backgroundColor: '#FFFFFF',
          color: '#0F2C59',
          borderRight: '1px solid #E2E8F0',
          height: '100vh',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-normal)',
          zIndex: 90,
          boxShadow: '2px 0 10px rgba(15, 44, 89, 0.04)',
          flexShrink: 0
        }}
      >
        {/* Toast Alert for Max Pin Limit */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '65px',
              left: '10px',
              right: '10px',
              zIndex: 100,
              backgroundColor: '#0F172A',
              border: '1px solid var(--brand-orange)',
              borderRadius: '8px',
              padding: '0.65rem 0.8rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              lineHeight: 1.35
            }}
          >
            <AlertCircle size={15} style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Sidebar Header & Toggle */}
        <div
          style={{
            padding: collapsed ? '1.1rem 0.5rem 0.85rem 0.5rem' : '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: collapsed ? '0.65rem' : '0',
            minHeight: 'var(--topbar-height)',
            boxSizing: 'border-box'
          }}
        >
          <HeaderLogo collapsed={collapsed} onClick={() => handleNavClick('dashboard')} />

          <button
            onClick={() => {
              setActiveTooltip(null);
              setCollapsed(!collapsed);
            }}
            onMouseEnter={(e) => handleTooltipEnter(collapsed ? "Expand Sidebar" : "Collapse Sidebar", e)}
            onMouseLeave={handleTooltipLeave}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: 'var(--brand-orange)',
              width: collapsed ? '34px' : '28px',
              height: collapsed ? '34px' : '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Search Field */}
        <div style={{ padding: collapsed ? '0.5rem 0 0.25rem 0' : '0.65rem 1rem 0.25rem 1rem', width: '100%', boxSizing: 'border-box' }}>
          {collapsed ? (
            <div className="collapsed-nav-item-wrapper">
              <button
                onClick={() => {
                  setActiveTooltip(null);
                  setCollapsed(false);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                onMouseEnter={(e) => handleTooltipEnter("Search Menu (/)", e)}
                onMouseLeave={handleTooltipLeave}
                className="collapsed-nav-btn"
                aria-label="Search menu (/)"
              >
                <Search size={17} className="collapsed-nav-icon" />
              </button>
              <span className="collapsed-nav-tooltip">Search Menu (/)</span>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  color: '#64748B',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search menu..."
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '7px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#0F2C59',
                  fontSize: '0.8125rem',
                  fontFamily: 'inherit',
                  padding: '0 2rem 0 2.15rem',
                  outline: 'none',
                  transition: 'all 0.18s ease',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#E2E8F0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Clear search (Esc)"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    right: '8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#64748B',
                    background: '#E2E8F0',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    fontFamily: 'monospace'
                  }}
                >
                  /
                </span>
              )}
            </div>
          )}
        </div>

        {!collapsed && (
          <div style={{ margin: '0.35rem 1rem 0.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div
              style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: 'var(--radius-full)',
                color: '#C2410C',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span>
              <span>⚡ {isStudentAdmin ? 'ONBOARDING OFFICER PORTAL' : (isStudent ? 'STUDENT PORTAL' : (isRegistrar ? 'REGISTRAR OFFICE PORTAL' : (isDeputyRegistrar ? 'DEPUTY REGISTRAR PORTAL' : (isStudentSection ? 'STUDENT SECTION PORTAL' : (isPrincipal ? 'PRINCIPAL / HOI PORTAL' : (isHOD ? 'HOD PORTAL' : (isMentor ? 'MENTOR PORTAL' : (isFaculty ? 'FACULTY PORTAL' : 'DEMO MODE ACTIVE'))))))))}</span>
            </div>

            {isFacultyUser && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={() => {
                    setActiveRole('FACULTY');
                    setActiveTab('dashboard');
                    setExpandedGroup(null);
                    setSearchQuery('');
                    setQuickAccessVersion(v => v + 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid ' + (role === 'FACULTY' ? 'var(--brand-orange)' : '#E2E8F0'),
                    backgroundColor: role === 'FACULTY' ? 'var(--brand-orange)' : '#F8FAFC',
                    color: role === 'FACULTY' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Faculty View
                </button>
                <button
                  onClick={() => {
                    setActiveRole('MENTOR');
                    setActiveTab('dashboard');
                    setExpandedGroup(null);
                    setSearchQuery('');
                    setQuickAccessVersion(v => v + 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid ' + (role === 'MENTOR' ? '#0F2C59' : '#E2E8F0'),
                    backgroundColor: role === 'MENTOR' ? '#0F2C59' : '#F8FAFC',
                    color: role === 'MENTOR' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Mentor View
                </button>
              </div>
            )}

            {isRegistrar && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={() => {
                    setRegistrarViewContext('ACADEMIC');
                    setExpandedGroup(null);
                    setSearchQuery('');
                    setQuickAccessVersion(v => v + 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid ' + (registrarViewContext === 'ACADEMIC' ? 'var(--brand-orange)' : '#E2E8F0'),
                    backgroundColor: registrarViewContext === 'ACADEMIC' ? 'var(--brand-orange)' : '#F8FAFC',
                    color: registrarViewContext === 'ACADEMIC' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>🎓</span> ACADEMIC
                </button>
                <button
                  onClick={() => {
                    setRegistrarViewContext('NON_ACADEMIC');
                    setExpandedGroup(null);
                    setSearchQuery('');
                    setQuickAccessVersion(v => v + 1);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid ' + (registrarViewContext === 'NON_ACADEMIC' ? '#0F2C59' : '#E2E8F0'),
                    backgroundColor: registrarViewContext === 'NON_ACADEMIC' ? '#0F2C59' : '#F8FAFC',
                    color: registrarViewContext === 'NON_ACADEMIC' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>🏢</span> NON-ACADEMIC
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items Container / Search Results View */}
        <div
          onScroll={() => setActiveTooltip(null)}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: collapsed ? '0.65rem 0' : '0.85rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: collapsed ? '8px' : '0.35rem',
            alignItems: collapsed ? 'center' : 'stretch',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {searchQuery.trim() ? (
            /* ─────────────────────────────────────────────────────────────
               SEARCH RESULTS LIST VIEW (PIN/UNPIN ON SUB-ITEMS ONLY)
               ───────────────────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#0F2C59',
                  marginBottom: '0.25rem',
                  paddingLeft: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Results ({filteredResults.length})</span>
                <span style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'none', fontWeight: 500 }}>
                  Esc to clear
                </span>
              </div>

              {filteredResults.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed #CBD5E1'
                  }}
                >
                  <Search size={22} style={{ color: 'var(--brand-orange)' }} />
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F2C59' }}>
                    No matching menu found
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: 1.4 }}>
                    Try another module or menu name.
                  </div>
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const ItemIcon = item.icon;
                  const isSelected = idx === selectedIndex;
                  const isActive = activeTab === item.targetTab || activeTab === item.id;
                  const isItemPinned = pinnedIdsSet.has(item.targetTab);
                  const isPinnable = item.isPinnable !== false;

                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        onClick={() => handleSelectSearchResult(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: isPinnable ? '0.6rem 2.25rem 0.6rem 0.75rem' : '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1px solid var(--brand-orange)' : '1px solid #E2E8F0',
                          background: isActive
                            ? 'var(--brand-orange)'
                            : isSelected
                            ? '#FFF7ED'
                            : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#0F2C59',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          textAlign: 'left',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <ItemIcon
                          size={17}
                          style={{
                            color: isActive ? '#FFFFFF' : 'var(--brand-orange)',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.label}
                          </div>
                          {item.parentLabel && (
                            <div
                              style={{
                                fontSize: '0.6875rem',
                                color: isActive ? 'rgba(255,255,255,0.85)' : '#64748B',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              in {item.parentLabel}
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Pin/Unpin Button ONLY for actual sub-items / leaf pages in search */}
                      {isPinnable && (
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(item.targetTab, e)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            background: 'none',
                            border: 'none',
                            color: isItemPinned ? '#F5A623' : '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title={isItemPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                          aria-label={isItemPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                        >
                          <Star
                            size={14}
                            fill={isItemPinned ? '#F5A623' : 'none'}
                            strokeWidth={isItemPinned ? 0 : 2}
                          />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
                 ⭐ QUICK ACCESS SECTION (MAX 3 PINNED + FREQUENT, TOTAL MAX 5)
                 ───────────────────────────────────────────────────────────── */}
              {!collapsed && (
                <div style={{ marginBottom: '1.15rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 0.5rem 0.4rem 0.5rem',
                      borderBottom: '1px solid #E2E8F0',
                      marginBottom: '0.45rem'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        letterSpacing: '0.8px',
                        color: '#0F2C59',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        textTransform: 'uppercase'
                      }}
                    >
                      <Star size={13} fill="#F37023" color="#F37023" />
                      <span>Quick Access</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: pinnedCount >= 3 ? '#C2410C' : '#64748B',
                        backgroundColor: pinnedCount >= 3 ? '#FFF7ED' : '#F1F5F9',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        border: '1px solid ' + (pinnedCount >= 3 ? '#FFEDD5' : '#E2E8F0')
                      }}
                      title="User can pin a maximum of 3 shortcuts"
                    >
                      {pinnedCount}/3
                    </span>
                  </div>

                  {quickAccessList.length === 0 ? (
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.72rem',
                        color: '#64748B',
                        fontStyle: 'italic',
                        lineHeight: 1.35
                      }}
                    >
                      Pin up to 3 submenu items using the ☆ icon.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {quickAccessList.map((qaItem) => {
                        const QAIcon = qaItem.icon || Star;
                        const isQAActive = activeTab === qaItem.targetTab || (activeTab === 'feedback' && qaItem.targetTab === 'feedback-give') || (activeTab === qaItem.id && qaItem.id !== 'feedback');

                        return (
                          <div
                            key={qaItem.targetTab}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <button
                              onClick={() => {
                                handleNavClick(qaItem.targetTab);
                                if (qaItem.parentGroupId) {
                                  setExpandedGroup(qaItem.parentGroupId);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.45rem 2rem 0.45rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: isQAActive
                                  ? 'var(--brand-orange)'
                                  : 'transparent',
                                color: isQAActive ? '#FFFFFF' : '#1E293B',
                                fontWeight: isQAActive ? 700 : 500,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                textAlign: 'left',
                                width: '100%',
                                boxShadow: isQAActive ? '0 2px 8px rgba(243, 112, 35, 0.25)' : 'none',
                                boxSizing: 'border-box'
                              }}
                            >
                              <QAIcon
                                size={15}
                                style={{
                                  color: isQAActive ? '#FFFFFF' : 'var(--brand-orange)',
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {qaItem.label}
                                </div>
                              </div>
                            </button>

                            {/* Pin / Unpin Action inside Quick Access */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(qaItem.targetTab, e)}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                background: 'none',
                                border: 'none',
                                color: qaItem.isPinned ? '#F5A623' : '#94A3B8',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              title={qaItem.isPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                              aria-label={qaItem.isPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                            >
                              <Star
                                size={13}
                                fill={qaItem.isPinned ? '#F5A623' : 'none'}
                                strokeWidth={qaItem.isPinned ? 0 : 2}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                 MAIN NAVIGATION MENUS (NO STAR ON PARENTS; STARS ON SUBMENUS ONLY)
                 ───────────────────────────────────────────────────────────── */}
              {(isERPCoordinator || isParent || isVicePresident || isStudent || isStudentAdmin || isFaculty || isMentor || isHOD || isPrincipal || isRegistrar || isDeputyRegistrar || isStudentSection) ? (
                /* ── STRUCTURED MENU WITH ACCORDIONS ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: collapsed ? '8px' : '0.35rem', width: '100%', alignItems: collapsed ? 'center' : 'stretch' }}>
                  {(isERPCoordinator ? ERP_COORDINATOR_NAVIGATION_STRUCTURE : (isParent ? PARENT_NAVIGATION_STRUCTURE : (isVicePresident ? VICE_PRESIDENT_NAVIGATION_STRUCTURE : (isStudent ? STUDENT_NAVIGATION_STRUCTURE : (isStudentAdmin ? STUDENT_ADMIN_NAVIGATION_STRUCTURE : (isRegistrar ? registrarNavigationStructure : (isDeputyRegistrar ? DEPUTY_REGISTRAR_NAVIGATION_STRUCTURE : (isStudentSection ? STUDENT_SECTION_NAVIGATION_STRUCTURE : (isPrincipal ? PRINCIPAL_NAVIGATION_STRUCTURE : (isHOD ? HOD_NAVIGATION_STRUCTURE : (isMentor ? MENTOR_NAVIGATION_STRUCTURE : FACULTY_NAVIGATION_STRUCTURE))))))))))).map((rawGroup, groupIndex, allGroups) => {
                    let group = rawGroup;

                    const Icon = group.icon;
                    const hasChildren = group.children && group.children.length > 0;
                    const isGroupExpanded = expandedGroup === group.id;
                    const showCategoryHeading = !collapsed && Boolean(group.category) && (groupIndex === 0 || allGroups[groupIndex - 1]?.category !== group.category);
                    
                    // Group is active if activeTab is equal to defaultTab OR any child targetTab
                    const isChildTabActive = hasChildren && group.children!.some(
                      sub => sub.targetTab === activeTab || sub.id === activeTab
                    );
                    const isNotesheetItem = group.id === 'note-sheets' || group.id === 'notesheet-group' || group.defaultTab === 'note-sheets' || group.defaultTab === 'reg-notesheets';
                    const isNotesheetTabActive = activeTab === 'note-sheets' || activeTab === 'reg-notesheets' || activeTab.startsWith('note-sheet') || activeTab.startsWith('notesheet-') || activeTab.startsWith('reg-notesheet');
                    const isRequestsItem = group.id === 'requests' || group.id === 'requests-group' || group.defaultTab === 'requests' || group.defaultTab === 'requests-my-requests' || group.defaultTab === 'mentee-requests-pending' || group.defaultTab === 'hod-requests-pending' || group.defaultTab === 'hoi-requests-pending' || group.defaultTab === 'section-services-all';
                    const isRequestsTabActive = activeTab === 'requests' || activeTab.startsWith('requests-') || activeTab.startsWith('mentee-requests') || activeTab.startsWith('hod-requests') || activeTab.startsWith('hoi-requests') || activeTab.startsWith('section-services') || activeTab === 'student-requests' || activeTab === 'faculty-student-requests';
                    const isAccreditationItem = group.id === 'accreditation-group' || group.id === 'accreditation-naac-nba' || group.id === 'accreditation' || group.defaultTab === 'accreditation';
                    const isAccreditationTabActive = activeTab === 'accreditation' || activeTab.startsWith('accreditation-') || activeTab === 'naac' || activeTab === 'nba' || activeTab === 'iqac-accreditation';
                    const isOBEItem = group.id === 'obe-group' || group.id === 'obe' || group.defaultTab === 'obe';
                    const isOBETabActive = activeTab === 'obe' || activeTab.startsWith('obe-') || activeTab === 'course-outcomes' || activeTab === 'program-outcomes' || activeTab === 'program-specific-outcomes' || activeTab === 'co-po-mapping' || activeTab === 'co-pso-mapping' || activeTab === 'assessment-mapping' || activeTab === 'attainment';
                    const isDirectActive = activeTab === group.id || activeTab === group.defaultTab || (isNotesheetItem && isNotesheetTabActive) || (isRequestsItem && isRequestsTabActive) || (isAccreditationItem && isAccreditationTabActive) || (isOBEItem && isOBETabActive);
                    const isParentActive = isChildTabActive || isDirectActive;

                    // ── COLLAPSED VIEW: UNIFORM CENTERED ICON CONTAINER ──
                    if (collapsed) {
                      return (
                        <div key={group.id} className="collapsed-nav-item-wrapper">
                          <button
                            onClick={() => handleNavClick(group.defaultTab || group.children?.[0]?.targetTab || group.id)}
                            onMouseEnter={(e) => handleTooltipEnter(group.label, e)}
                            onMouseLeave={handleTooltipLeave}
                            className={`collapsed-nav-btn ${isParentActive ? 'active' : ''}`}
                            aria-label={group.label}
                          >
                            <Icon size={17} className="collapsed-nav-icon" style={{ color: isParentActive ? '#FFFFFF' : '#0F2C59' }} />
                          </button>
                          <span className="collapsed-nav-tooltip">{group.label}</span>
                        </div>
                      );
                    }

                    return (
                      <React.Fragment key={group.id}>
                        {showCategoryHeading && (
                          <div
                            style={{
                              padding: groupIndex === 0 ? '0.2rem 0.65rem 0.35rem 0.65rem' : '0.85rem 0.65rem 0.35rem 0.65rem',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.8px',
                              color: '#0F2C59',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              marginTop: groupIndex > 0 ? '0.35rem' : 0,
                              borderTop: groupIndex > 0 ? '1px solid #F1F5F9' : 'none'
                            }}
                          >
                            <span>{group.category}</span>
                          </div>
                        )}

                        {!hasChildren ? (
                          // Direct Top-Level Link (NO STAR ICON)
                          <button
                            onClick={() => handleNavClick(group.defaultTab)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.625rem 0.75rem',
                              justifyContent: 'flex-start',
                              borderRadius: 'var(--radius-md)',
                              border: 'none',
                              background: isParentActive
                                ? 'var(--brand-orange)'
                                : 'transparent',
                              color: isParentActive ? '#FFFFFF' : '#1E293B',
                              fontWeight: isParentActive ? 700 : 500,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                              boxShadow: isParentActive ? '0 2px 8px rgba(243, 112, 35, 0.25)' : 'none',
                              width: '100%',
                              textAlign: 'left'
                            }}
                          >
                            <Icon size={18} style={{ color: isParentActive ? '#FFFFFF' : '#0F2C59', flexShrink: 0 }} />
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {group.label}
                            </span>
                          </button>
                        ) : (
                          // Accordion Parent Group (ONLY HAS EXPAND/COLLAPSE ARROW; NO STAR ICON)
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <button
                              onClick={() => toggleGroup(group.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.55rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: isParentActive && !isGroupExpanded
                                  ? '#FFF7ED'
                                  : 'transparent',
                                color: isParentActive ? '#C2410C' : '#1E293B',
                                fontWeight: isParentActive ? 700 : 600,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                width: '100%'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                <Icon size={17} style={{ color: isParentActive ? 'var(--brand-orange)' : '#0F2C59', flexShrink: 0 }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {group.label}
                                </span>
                              </div>
                              <span style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>
                                {isGroupExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </span>
                            </button>

                            {/* Sub-items List (EACH ELIGIBLE SUBMENU ITEM HAS ☆ / ★ PIN BUTTON) */}
                            {isGroupExpanded && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.15rem',
                                paddingLeft: '1.75rem',
                                borderLeft: '1.5px solid #E2E8F0',
                                marginLeft: '1.25rem',
                                marginTop: '0.15rem',
                                marginBottom: '0.35rem'
                              }}>
                                {group.children!
                                  .filter(sub => {
                                    if (sub.id === 'notesheet-pending' || sub.targetTab === 'notesheet-pending') {
                                      return canAccessPending;
                                    }
                                    if (sub.id === 'notesheet-create' || sub.targetTab === 'notesheet-create') {
                                      return canCreateNotesheet;
                                    }
                                    if (sub.id.startsWith('notesheet-') || sub.targetTab.startsWith('notesheet-')) {
                                      return canViewNotesheet;
                                    }
                                    return true;
                                  })
                                  .map(sub => {
                                  const isSubActive = activeTab === sub.targetTab || (activeTab === 'feedback' && sub.targetTab === 'feedback-give') || (activeTab === sub.id && sub.id !== 'feedback') || (sub.targetTab === 'obe' && isOBETabActive);
                                  const isSubPinned = pinnedIdsSet.has(sub.targetTab);

                                  return (
                                    <div key={sub.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                      <button
                                        onClick={() => handleNavClick(sub.targetTab)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.4rem 1.85rem 0.4rem 0.65rem',
                                          borderRadius: 'var(--radius-sm)',
                                          border: 'none',
                                          background: isSubActive
                                            ? 'var(--brand-orange)'
                                            : 'transparent',
                                          color: isSubActive ? '#FFFFFF' : '#475569',
                                          fontWeight: isSubActive ? 700 : 500,
                                          fontSize: '0.78125rem',
                                          cursor: 'pointer',
                                          transition: 'all var(--transition-fast)',
                                          textAlign: 'left',
                                          boxShadow: isSubActive ? '0 2px 6px rgba(243, 112, 35, 0.25)' : 'none',
                                          width: '100%'
                                        }}
                                      >
                                        <span style={{
                                          width: '5px',
                                          height: '5px',
                                          borderRadius: '50%',
                                          backgroundColor: isSubActive ? '#FFFFFF' : '#94A3B8'
                                        }}></span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {sub.label}
                                        </span>
                                      </button>

                                      {/* Sub-item Pin Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => handleTogglePin(sub.targetTab, e)}
                                        style={{
                                          position: 'absolute',
                                          right: '4px',
                                          background: 'none',
                                          border: 'none',
                                          color: isSubPinned ? '#F5A623' : '#94A3B8',
                                          cursor: 'pointer',
                                          padding: '3px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '3px',
                                          transition: 'all 0.15s ease'
                                        }}
                                        title={isSubPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                                        aria-label={isSubPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                                      >
                                        <Star
                                          size={12}
                                          fill={isSubPinned ? '#F5A623' : 'none'}
                                          strokeWidth={isSubPinned ? 0 : 2}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                /* ── OTHER ROLES: CATEGORY NAVIGATION (DIRECT ACTIONS) ── */
                collapsed ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
                    {visibleItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <div key={item.id} className="collapsed-nav-item-wrapper">
                          <button
                            onClick={() => handleNavClick(item.id)}
                            onMouseEnter={(e) => handleTooltipEnter(item.label, e)}
                            onMouseLeave={handleTooltipLeave}
                            className={`collapsed-nav-btn ${isActive ? 'active' : ''}`}
                            aria-label={item.label}
                          >
                            <Icon size={17} className="collapsed-nav-icon" style={{ color: isActive ? '#FFFFFF' : '#0F2C59' }} />
                          </button>
                          <span className="collapsed-nav-tooltip">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  categories.map(cat => {
                    const itemsInCat = visibleItems.filter(i => (i.category || 'General') === cat);
                    if (itemsInCat.length === 0) return null;

                    return (
                      <div key={cat} style={{ marginBottom: '1.5rem' }}>
                        {cat !== 'Main' && (
                          <div
                            style={{
                              fontSize: '0.65625rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '1.2px',
                              color: '#0F2C59',
                              marginBottom: '0.5rem',
                              paddingLeft: '0.75rem',
                              opacity: 0.9
                            }}
                          >
                            {cat}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {itemsInCat.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const isItemPinned = pinnedIdsSet.has(item.id);

                            return (
                              <div key={item.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleNavClick(item.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.55rem 2rem 0.55rem 0.75rem',
                                    justifyContent: 'flex-start',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: isActive
                                      ? 'var(--brand-orange)'
                                      : 'transparent',
                                    color: isActive ? '#FFFFFF' : '#1E293B',
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-fast)',
                                    boxShadow: isActive ? '0 2px 8px rgba(243, 112, 35, 0.25)' : 'none',
                                    width: '100%',
                                    textAlign: 'left'
                                  }}
                                >
                                  <Icon size={18} style={{ color: isActive ? '#FFFFFF' : '#0F2C59' }} />
                                  <span>{item.label}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePin(item.id, e)}
                                  style={{
                                    position: 'absolute',
                                    right: '6px',
                                    background: 'none',
                                    border: 'none',
                                    color: isItemPinned ? '#F5A623' : '#94A3B8',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={isItemPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                                  aria-label={isItemPinned ? "Unpin from Quick Access" : "Pin to Quick Access"}
                                >
                                  <Star
                                    size={13}
                                    fill={isItemPinned ? '#F5A623' : 'none'}
                                    strokeWidth={isItemPinned ? 0 : 2}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </>
          )}

          {/* Canonical Single Logout Action for All Roles */}
          {collapsed ? (
            <div className="collapsed-nav-item-wrapper" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => {
                  setActiveTooltip(null);
                  logout();
                }}
                onMouseEnter={(e) => handleTooltipEnter("Logout", e)}
                onMouseLeave={handleTooltipLeave}
                className="collapsed-nav-btn logout-btn"
                aria-label="Logout"
              >
                <LogOut size={17} />
              </button>
              <span className="collapsed-nav-tooltip">Logout</span>
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => logout()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  justifyContent: 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #FEE2E2',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  width: '100%',
                  textAlign: 'left'
                }}
                aria-label="Logout"
              >
                <LogOut size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── UNCLIPPED FLOATING TOOLTIP FOR COLLAPSED SIDEBAR ── */}
      {collapsed && activeTooltip && (
        <div
          className="erp-floating-sidebar-tooltip"
          style={{
            position: 'fixed',
            top: `${activeTooltip.top}px`,
            left: `${activeTooltip.left}px`,
            transform: 'translateY(-50%)',
            zIndex: 99999,
            pointerEvents: 'none',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            fontSize: '0.78125rem',
            fontWeight: 700,
            letterSpacing: '0.2px',
            padding: '6px 12px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '100%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '6px solid #0F172A'
            }}
          />
          {activeTooltip.label}
        </div>
      )}
    </>
  );
};
