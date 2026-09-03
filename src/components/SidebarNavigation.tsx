import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderCheck,
  FileSignature,
  Award,
  TrendingUp,
  ShieldAlert,
  Rocket,
  ChevronRight,
  Sparkles,
  Building2,
  HelpCircle,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  category?: 'Core' | 'Academic & Compliance' | 'Governance & Innovation';
}

interface SidebarNavigationProps {
  activeTab?: string;
  onTabSelect?: (tabId: string) => void;
  className?: string;
}

const NAV_ITEMS: NavMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '#dashboard',
    icon: LayoutDashboard,
    category: 'Core',
  },
  {
    id: 'student-staff-mgmt',
    label: 'Student & Staff Mgmt',
    href: '#student-staff-mgmt',
    icon: Users,
    badge: '360°',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    category: 'Core',
  },
  {
    id: 'dms',
    label: 'Document Management (DMS)',
    href: '#dms',
    icon: FolderCheck,
    category: 'Core',
  },
  {
    id: 'notesheet-approvals',
    label: 'Notesheet Approvals',
    href: '#notesheet-approvals',
    icon: FileSignature,
    badge: 'Workflow',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    category: 'Core',
  },
  {
    id: 'govt-compliance-abc',
    label: 'Govt Compliance (ABC ID)',
    href: '#govt-compliance-abc',
    icon: Award,
    badge: 'NEP 2020',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    category: 'Academic & Compliance',
  },
  {
    id: 'obe-copo-matrix',
    label: 'OBE (CO-PO Matrix)',
    href: '#obe-copo-matrix',
    icon: TrendingUp,
    badge: 'NBA/NAAC',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    category: 'Academic & Compliance',
  },
  {
    id: 'grievance-redressal',
    label: 'Grievance Redressal',
    href: '#grievance-redressal',
    icon: ShieldAlert,
    badge: 'UGC/ICC',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    category: 'Governance & Innovation',
  },
  {
    id: 'startup-grants',
    label: 'Startup & Grants',
    href: '#startup-grants',
    icon: Rocket,
    badge: 'SSIP',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    category: 'Governance & Innovation',
  },
];

/**
 * SSIU ERP — Main Navigation Sidebar Component
 * File: src/components/SidebarNavigation.tsx
 *
 * Standalone, responsive vertical sidebar navigation connecting
 * core enterprise modules, compliance engines, and governance portals.
 */
export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab = 'dashboard',
  onTabSelect,
  className = '',
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeTab);

  const handleNavClick = (e: React.MouseEvent, item: NavMenuItem) => {
    e.preventDefault();
    setCurrentTab(item.id);
    if (onTabSelect) {
      onTabSelect(item.id);
    }
  };

  // Group items by category
  const categories = ['Core', 'Academic & Compliance', 'Governance & Innovation'] as const;

  return (
    <aside
      className={`w-72 bg-slate-950 text-slate-100 flex flex-col h-screen border-r border-slate-800/80 shadow-2xl select-none font-sans ${className}`}
    >
      {/* 1. Header / Branding */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30 flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white">SSIU ERP</h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                v7.10
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Swarrnim Startup & Innovation University
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Menu Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {categories.map((cat) => {
          const groupItems = NAV_ITEMS.filter((item) => item.category === cat);
          if (groupItems.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {cat}
              </div>

              {groupItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-300 hover:bg-slate-900/90 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-900 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isActive
                            ? 'text-white translate-x-0.5'
                            : 'text-slate-400 group-hover:text-slate-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>
                  </a>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 3. Footer / User & System Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0">
              JA
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Prof. Jigar Ahir</p>
              <p className="text-[10px] text-slate-400 truncate">System Administrator</p>
            </div>
          </div>

          <button
            type="button"
            title="Help & Documentation"
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNavigation;
