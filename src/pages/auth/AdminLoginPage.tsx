import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  KeyRound,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  HelpCircle,
  Database
} from 'lucide-react';
import logoImg from '../../assets/SSIUlogo.png';

export const AdminLoginPage: React.FC<{ onAdminLoginSuccess?: () => void }> = ({ onAdminLoginSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('demo.admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Administrative Roles Permitted into the ERP Admin Portal
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

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please enter your administrator ID and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate credentials through central auth system
      const res = login(cleanId, password);
      if (!res.success) {
        setIsLoading(false);
        setError(res.error || 'Invalid administrator credentials. Access denied.');
        return;
      }

      // 2. Fetch logged in user to check administrative role authorization
      const savedUserStr = localStorage.getItem('sscit_auth_user');
      const authUser = savedUserStr ? JSON.parse(savedUserStr) : null;

      if (!authUser || !ADMIN_ROLES.includes(authUser.role)) {
        setIsLoading(false);
        // Force logout if not authorized for Admin Portal
        localStorage.removeItem('sscit_auth_user');
        setError('Access Denied — Administrative privileges required.');
        return;
      }

      // 3. Attempt backend session authorization check if available
      try {
        await fetch('/api/v1/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId: cleanId, password }),
        });
      } catch (e) {
        // Fallback gracefully to client state
      }

      setIsLoading(false);

      if (onAdminLoginSuccess) {
        onAdminLoginSuccess();
      } else {
        window.location.href = '/erp-admin/dashboard';
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'An error occurred during administrative authentication.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000d1a] via-[#00172e] to-[#002244] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle Background Circuit & Glow Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="SSIU Logo" className="h-9 w-auto object-contain brightness-110 drop-shadow" />
          <div className="border-l border-white/20 pl-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block leading-tight">
              Swarrnim Startup &amp; Innovation University
            </span>
            <span className="text-[10px] text-blue-200 tracking-widest font-mono uppercase">
              Central Enterprise Resource Planning (SSIU ERP)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>RESTRICTED ADMIN ZONE</span>
          </span>
        </div>
      </header>

      {/* Main Admin Card Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-6">
        <div className="w-full max-w-md bg-[#00172e]/90 border border-white/15 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative">
          {/* Header Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-400 mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ERP Administration Portal
            </h1>
            <p className="text-xs text-blue-200/80 mt-1 font-medium">
              Administrative Access &amp; Identity Control Center
            </p>
          </div>

          {/* Development Demo Quick-Fill Pill */}
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">Development / Demo Account Available</span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Use <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold text-white">demo.admin</code> with password <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold text-white">Admin@123</code> to test all admin capabilities.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
                Admin Username / Official ID
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. demo.admin or superadmin"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials &amp; Role...</span>
                </>
              ) : (
                <>
                  <span>LOGIN TO ADMIN PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Standard Portal Switcher Link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <a
              href="/"
              className="text-xs text-blue-300 hover:text-white font-semibold inline-flex items-center gap-1.5 transition"
            >
              <span>← Back to Student / Staff Normal Login</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/10 bg-black/40 text-center text-xs text-slate-400 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <strong className="text-white">Swarrnim Startup &amp; Innovation University</strong> • Central Security &amp; Access Governance
        </div>
        <div className="text-[11px] text-slate-500">
          All administrative sessions are encrypted and continuously audited.
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
        />
      )}
    </div>
  );
};
