import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SystemSettingsPage } from '../settings/SystemSettingsPage';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Database,
  Search,
  Sliders,
  LogOut,
  UserCheck,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Building2,
  FileSpreadsheet,
  Printer,
  ChevronRight
} from 'lucide-react';
import { db } from '../../services/db';

export const AdminPortalPage: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [adminActiveTab, setAdminActiveTab] = useState<
    'DASHBOARD' | 'USERS' | 'ROLES' | 'MATRIX' | 'OVERRIDES' | 'SCOPES' | 'SECURITY' | 'AUDIT' | 'SETTINGS'
  >('DASHBOARD');

  // Verify authorization: strictly administrative roles
  const ADMIN_ROLES = [
    'SUPER_ADMIN',
    'UNIVERSITY_ADMIN',
    'ERP_COORDINATOR',
    'REGISTRAR',
    'DEPUTY_REGISTRAR',
    'VICE_PRESIDENT',
    'PRESIDENT',
    'PROVOST',
    'PRINCIPAL',
    'HOD'
  ];

  const isAuthorized = user && role && ADMIN_ROLES.includes(role);

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Access Denied — Administrative privileges required.
        </h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Your current authenticated user account does not possess the necessary administrative authority to view or mutate ERP Access Governance controls.
        </p>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl bg-[#001F3F] text-white font-bold text-xs hover:bg-slate-800 transition"
        >
          Return to Standard Portal
        </a>
      </div>
    );
  }

  const allUsers = db.getUsers();
  const activeCount = allUsers.filter(u => (u.accountStatus || u.status) === 'ACTIVE').length;
  const inactiveCount = allUsers.filter(u => (u.accountStatus || u.status) === 'INACTIVE' || u.status === 'INACTIVE').length;
  const suspendedCount = allUsers.filter(u => u.accountStatus === 'SUSPENDED').length;
  const lockedCount = allUsers.filter(u => u.accountStatus === 'LOCKED' || (u.status as any) === 'LOCKED').length;
  const studentCount = allUsers.filter(u => u.role === 'STUDENT').length;
  const facultyCount = allUsers.filter(u => u.role === 'FACULTY' || u.role === 'MENTOR').length;
  const staffCount = allUsers.filter(u => u.role === 'STAFF' || u.role === 'STUDENT_SECTION' || u.role === 'EXAM_CELL' || u.role === 'ACCOUNTS_ADMIN').length;
  const pendingCount = allUsers.filter(u => u.accountStatus === 'PENDING').length;
  const auditLogs = db.getAuditLogs();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── OFFICIAL ERP ADMIN CONTROL BANNER ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#001F3F] via-[#002B59] to-[#0A3663] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950">
              SSIU CENTRAL ADMINISTRATION
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/15">
              Role: {role}
            </span>
            {user?.username === 'demo.admin' && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                DEVELOPMENT DEMO SESSION
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>ERP Administration &amp; Access Governance</span>
          </h1>
          <p className="text-xs text-blue-100/80 max-w-2xl">
            Centralized administrative control center for Swarrnim Startup &amp; Innovation University. Manage user lifecycle, role hierarchies, granular permission matrices, departmental scopes, and security audits.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-right">
            <div className="text-[10px] text-blue-200 uppercase font-black tracking-wider">Active System Users</div>
            <div className="text-xl font-mono font-black text-amber-300">
              {activeCount} / {allUsers.length}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUB-NAVIGATION PILL TABS ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setAdminActiveTab('DASHBOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            adminActiveTab === 'DASHBOARD'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Admin Overview</span>
        </button>

        <button
          onClick={() => setAdminActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            adminActiveTab === 'USERS'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
        </button>

        <button
          onClick={() => setAdminActiveTab('ROLES')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            adminActiveTab === 'ROLES'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Role Templates</span>
        </button>

        <button
          onClick={() => setAdminActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            adminActiveTab === 'AUDIT'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Audit Trails</span>
        </button>

        <button
          onClick={() => setAdminActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
            adminActiveTab === 'SETTINGS'
              ? 'bg-[#FF6B00] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master Configuration</span>
        </button>
      </div>

      {/* ─── TAB 1: ADMIN DASHBOARD EXECUTIVE OVERVIEW ─────────────────────── */}
      {adminActiveTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-slate-500">Total Users</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{allUsers.length}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">All accounts</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-emerald-600">Active</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enabled logins</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-slate-500">Inactive</div>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{inactiveCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Deactivated</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-rose-600">Suspended</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{suspendedCount}</div>
              <div className="text-[10px] text-rose-500 font-semibold mt-0.5">Blocked access</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-amber-600">Locked</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{lockedCount}</div>
              <div className="text-[10px] text-amber-500 font-semibold mt-0.5">Security locks</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-indigo-600">Students</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{studentCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enrollment link</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-teal-600">Faculty</div>
              <div className="text-2xl font-black text-teal-600 mt-1">{facultyCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Teaching staff</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[10px] font-black uppercase text-purple-600">Pending</div>
              <div className="text-2xl font-black text-purple-600 mt-1">{pendingCount}</div>
              <div className="text-[10px] text-purple-500 font-semibold mt-0.5">Awaiting activation</div>
            </div>
          </div>

          {/* Quick Actions & Recent Security Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Administrative Shortcuts */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Quick Administration Actions</span>
              </h2>

              <div className="space-y-2.5">
                <button
                  onClick={() => setAdminActiveTab('USERS')}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-slate-200 dark:border-slate-700/60 text-left flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 transition">
                        Provision New User Account
                      </div>
                      <div className="text-[11px] text-slate-400">Add Staff, Faculty or Student with credentials</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition" />
                </button>

                <button
                  onClick={() => setAdminActiveTab('ROLES')}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-700/60 text-left flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                        20-Action Permission Matrix
                      </div>
                      <div className="text-[11px] text-slate-400">Configure role templates &amp; module authorizations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                <button
                  onClick={() => setAdminActiveTab('AUDIT')}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-200 dark:border-slate-700/60 text-left flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                        View Security Audit Logs
                      </div>
                      <div className="text-[11px] text-slate-400">Inspect logins, lockouts, and mutations</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </button>
              </div>
            </div>

            {/* Real-time Security & Access Alerts */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>Recent Security &amp; Access Events</span>
                </h2>
                <span className="text-[11px] font-bold text-slate-400">Immutable Trail</span>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 6).map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          <span className="font-mono text-orange-600 dark:text-orange-400 font-black mr-1.5">
                            {log.action}
                          </span>
                          <span>by {log.userName || 'Administrator'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {log.details || `Administrative mutation performed on entity ${log.entity || 'system'}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: USER MANAGEMENT & CREDENTIALS ───────────────────────────── */}
      {adminActiveTab === 'USERS' && <SystemSettingsPage initialAdminTab="USERS" />}

      {/* ─── TAB 3: ROLE PERMISSION MATRIX ─────────────────────────────────── */}
      {adminActiveTab === 'ROLES' && <SystemSettingsPage initialAdminTab="ROLES" />}

      {/* ─── TAB 4: SECURITY AUDIT TRAILS ───────────────────────────────────── */}
      {adminActiveTab === 'AUDIT' && <SystemSettingsPage initialAdminTab="AUDIT" />}

      {/* ─── TAB 5: MASTER CONFIGURATION ────────────────────────────────────── */}
      {adminActiveTab === 'SETTINGS' && <SystemSettingsPage initialAdminTab="MASTER" />}
    </div>
  );
};
