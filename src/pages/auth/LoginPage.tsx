import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Users,
  Building2,
  Sliders,
  KeyRound,
  X,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import logoImg from '../../assets/SSIUlogo.png';

interface DemoRoleAccount {
  role: string;
  title: string;
  userId: string;
  pass: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
}

interface InstituteShowcase {
  id: string;
  code: string;
  name: string;
  category: string;
  established: number;
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please enter your university email or username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(cleanId, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid username or password. Please check your credentials and try again.');
      }
    }, 300);
  };

  const demoAccounts: DemoRoleAccount[] = [
    {
      role: 'STUDENT',
      title: 'Student Candidate',
      userId: 'student',
      pass: 'Student@123',
      badge: 'Academic Portal',
      icon: GraduationCap,
      accentColor: '#F58220'
    },
    {
      role: 'PARENT',
      title: 'Parent / Guardian',
      userId: 'parent',
      pass: 'Parent@123',
      badge: 'Ward Academic Portal',
      icon: Users,
      accentColor: '#0D9488'
    },
    {
      role: 'FACULTY',
      title: 'Faculty / Mentor',
      userId: 'faculty',
      pass: 'Faculty@123',
      badge: 'Teaching & Mentorship',
      icon: Users,
      accentColor: '#12366B'
    },
    {
      role: 'HOD',
      title: 'Department HOD',
      userId: 'hod',
      pass: 'Faculty@123',
      badge: 'Departmental Head',
      icon: Building2,
      accentColor: '#059669'
    },
    {
      role: 'PRINCIPAL',
      title: 'Principal / HOI',
      userId: 'principal',
      pass: 'Admin@123',
      badge: 'Institute Leadership',
      icon: Building2,
      accentColor: '#DC2626'
    },
    {
      role: 'REGISTRAR',
      title: 'Registrar Office',
      userId: 'registrar',
      pass: 'Admin@123',
      badge: 'University Secretariat',
      icon: ShieldCheck,
      accentColor: '#EA580C'
    },
    {
      role: 'DEPUTY_REGISTRAR',
      title: 'Deputy Registrar',
      userId: 'deputyregistrar',
      pass: 'Admin@123',
      badge: 'Academic Administration',
      icon: ShieldCheck,
      accentColor: '#4F46E5'
    },
    {
      role: 'VICE_PRESIDENT',
      title: 'Vice President',
      userId: 'vp',
      pass: 'Admin@123',
      badge: 'Executive Governance',
      icon: Sparkles,
      accentColor: '#7C3AED'
    },
    {
      role: 'SUPER_ADMIN',
      title: 'Demo ERP Administrator',
      userId: 'demo.admin',
      pass: 'Admin@123',
      badge: 'Admin Control Center',
      icon: KeyRound,
      accentColor: '#F58220'
    },
    {
      role: 'SUPER_ADMIN',
      title: 'Super Admin',
      userId: 'admin',
      pass: 'Admin@123',
      badge: 'System Controller',
      icon: KeyRound,
      accentColor: '#0F2C59'
    },
    {
      role: 'ERP_COORDINATOR',
      title: 'Central ERP Coordinator',
      userId: 'erpcoordinator',
      pass: 'Admin@123',
      badge: 'Central ERP Coordinator',
      icon: ShieldCheck,
      accentColor: '#D97706'
    },
    {
      role: 'EXAM_CELL',
      title: 'Exam Controller',
      userId: 'examcell',
      pass: 'Admin@123',
      badge: 'Examination Wing',
      icon: Sliders,
      accentColor: '#1E3A8A'
    },
    {
      role: 'STUDENT_SECTION',
      title: 'Student Section',
      userId: 'studentsection',
      pass: 'Admin@123',
      badge: 'Student Services',
      icon: Users,
      accentColor: '#0284C7'
    }
  ];

  const handleDemoLogin = (userId: string, pass: string) => {
    setIdentifier(userId);
    setPassword(pass);
    setError('');
    setIsDemoModalOpen(false);
    setIsLoading(true);

    setTimeout(() => {
      login(userId, pass);
      setIsLoading(false);
    }, 200);
  };

  const universityInstitutes: InstituteShowcase[] = [
    {
      id: 'inst-1',
      code: 'SSCIT',
      name: 'Swarrnim School of Computing & IT',
      category: 'Computer Applications & AI',
      established: 2017
    },
    {
      id: 'inst-sit',
      code: 'SIT',
      name: 'Swarrnim Institute of Technology',
      category: 'Engineering & Technology',
      established: 2017
    },
    {
      id: 'inst-sid',
      code: 'SID',
      name: 'Swarrnim Institute of Design',
      category: 'Design, Planning & Architecture',
      established: 2018
    },
    {
      id: 'inst-ssmcla',
      code: 'SSMCLA',
      name: 'Swarrnim School of Commerce & Liberal Arts',
      category: 'Management & Commerce',
      established: 2017
    },
    {
      id: 'inst-sss',
      code: 'SSS',
      name: 'Swarrnim Science College',
      category: 'Applied & Pure Sciences',
      established: 2019
    },
    {
      id: 'inst-ssp',
      code: 'SSP',
      name: 'Swarrnim Institute of Health Sciences',
      category: 'Pharmacy & Healthcare',
      established: 2018
    },
    {
      id: 'inst-ahmcri',
      code: 'AHMCRI',
      name: 'Aarihant Homeopathic Medical College & Research Institute',
      category: 'Medical & Homoeopathy',
      established: 2017
    },
    {
      id: 'inst-ain',
      code: 'AIN',
      name: 'Aarihant Institute of Nursing',
      category: 'Nursing & Patient Care',
      established: 2018
    },
    {
      id: 'inst-aamcri',
      code: 'AAMCRI',
      name: 'Aarihant Ayurvedic Medical College & Research Institute',
      category: 'Ayurveda & Integrative Medicine',
      established: 2017
    },
    {
      id: 'inst-vip',
      code: 'VIP',
      name: 'Venus Institute of Physiotherapy',
      category: 'Physiotherapy & Rehabilitation',
      established: 2019
    },
    {
      id: 'inst-ssjmc',
      code: 'SSJMC',
      name: 'Swarrnim School of Journalism & Mass Communication',
      category: 'Media & Mass Communication',
      established: 2020
    },
    {
      id: 'inst-ssa',
      code: 'SSA',
      name: 'Swarrnim School of Agriculture',
      category: 'Agriculture & Agribusiness',
      established: 2019
    }
  ];

  return (
    <>
      <style>{`
        /* ═════════════════════════════════════════════════════════════════
           SWARRNIM UNIVERSITY ERP — INSTITUTIONAL LOGIN PAGE
           Official Colors: Navy #12366B | Orange #F58220 | Light BG #F8FAFD
           Balanced Equal-Height Two-Column Grid: Left Institutes | Right Login
           ═════════════════════════════════════════════════════════════════ */

        :root {
          --swarrnim-navy: #12366B;
          --swarrnim-navy-dark: #0A2244;
          --swarrnim-navy-deep: #07172E;
          --swarrnim-orange: #F58220;
          --swarrnim-orange-hover: #DC6F13;
          --swarrnim-gold: #F5A623;
          --swarrnim-bg-light: #F8FAFD;
          --swarrnim-border: #E2E8F0;
        }

        .swarrnim-login-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          background-color: #F8FAFC;
          background-image: 
            radial-gradient(circle at 12% 18%, rgba(18, 54, 107, 0.035) 0%, transparent 45%),
            radial-gradient(circle at 88% 82%, rgba(245, 130, 32, 0.03) 0%, transparent 40%),
            linear-gradient(135deg, #FAFBFD 0%, #F1F5F9 50%, #E9EFF6 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0F172A;
          overflow-x: hidden;
          position: relative;
        }

        /* Subtle background grid */
        .swarrnim-login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#CBD5E1 0.75px, transparent 0.75px);
          background-size: 24px 24px;
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Official Header with Single University Logo ── */
        .swarrnim-topbar {
          position: relative;
          z-index: 10;
          height: 60px;
          padding: 0 2.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 1px 4px rgba(18, 54, 107, 0.03);
          flex-shrink: 0;
        }

        .swarrnim-topbar-brand {
          display: flex;
          align-items: center;
          gap: 0.95rem;
        }

        .swarrnim-topbar-logo {
          height: 42px;
          width: auto;
          object-fit: contain;
        }

        .swarrnim-topbar-brand-texts {
          display: flex;
          flex-direction: column;
        }

        .swarrnim-topbar-uni-name {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--swarrnim-navy);
          letter-spacing: -0.2px;
          line-height: 1.25;
        }

        .swarrnim-topbar-uni-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--swarrnim-orange);
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .swarrnim-topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .swarrnim-topbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.95rem;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .swarrnim-topbar-btn:hover {
          color: var(--swarrnim-navy);
          border-color: #CBD5E1;
          background: #F8FAFC;
        }

        .swarrnim-topbar-demo-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1.05rem;
          background: rgba(245, 130, 32, 0.08);
          border: 1px solid rgba(245, 130, 32, 0.3);
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--swarrnim-orange);
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .swarrnim-topbar-demo-btn:hover {
          background: var(--swarrnim-orange);
          color: #FFFFFF;
          border-color: var(--swarrnim-orange);
          box-shadow: 0 2px 8px rgba(245, 130, 32, 0.25);
        }

        /* ── Main Layout Container ── */
        .swarrnim-main-layout {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 1.15rem 2.25rem;
          gap: 0.95rem;
          box-sizing: border-box;
        }

        /* ── Header & Hero Micro-Animations ── */
        .swarrnim-header-left {
          animation: heroLogoFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── Hero Headline (Across Top) ── */
        .swarrnim-hero-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .swarrnim-headline {
          font-size: 2.15rem;
          font-weight: 900;
          line-height: 1.16;
          color: var(--swarrnim-navy);
          letter-spacing: -0.5px;
          margin: 0 0 0.25rem 0;
          animation: heroHeadlineFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .swarrnim-headline-orange {
          color: var(--swarrnim-orange);
        }

        .swarrnim-subheadline {
          font-size: 0.9375rem;
          line-height: 1.45;
          color: #475569;
          margin: 0;
          max-width: 850px;
          animation: heroSubheadlineFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }

        /* ── Two-Column Equal Height Row ── */
        .swarrnim-panels-row {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 1.5rem;
          width: 100%;
          animation: heroPanelsFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }

        @keyframes heroLogoFade {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes heroHeadlineFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroSubheadlineFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroPanelsFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Left Column: Our Institutes Panel (~58%) ── */
        .swarrnim-institutes-panel {
          flex: 1 1 58%;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 1.35rem 1.5rem 1.15rem 1.5rem;
          box-shadow: 0 14px 40px -4px rgba(18, 54, 107, 0.06), 0 4px 14px -2px rgba(18, 54, 107, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          position: relative;
        }

        /* Top accent line for Left panel to match right card */
        .swarrnim-institutes-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 3.5px;
          background: linear-gradient(90deg, var(--swarrnim-orange) 0%, var(--swarrnim-navy) 100%);
          border-radius: 3px 3px 0 0;
        }

        .swarrnim-institutes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.65rem;
          padding-bottom: 0.45rem;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.9);
        }

        .swarrnim-institutes-title-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .swarrnim-institutes-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--swarrnim-navy);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin: 0;
        }

        .swarrnim-institutes-count {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--swarrnim-orange);
          background: rgba(245, 130, 32, 0.1);
          border: 1px solid rgba(245, 130, 32, 0.25);
          padding: 0.12rem 0.45rem;
          border-radius: 6px;
        }

        .swarrnim-institutes-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748B;
          margin: 0;
        }

        /* Responsive Institutes Grid (3 cols on desktop) */
        .swarrnim-institutes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.55rem;
          width: 100%;
          flex: 1;
        }

        .swarrnim-institute-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 0.5rem 0.65rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.2rem;
          box-shadow: 0 1px 2px rgba(18, 54, 107, 0.02);
          transition: all 0.18s ease;
          position: relative;
          box-sizing: border-box;
        }

        .swarrnim-institute-card:hover {
          border-color: rgba(245, 130, 32, 0.6);
          box-shadow: 0 4px 12px rgba(18, 54, 107, 0.08);
          transform: translateY(-1px);
          background: #FFFFFF;
        }

        .swarrnim-institute-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
        }

        .swarrnim-institute-logo-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
          border-radius: 6px;
          background: rgba(18, 54, 107, 0.05);
          flex-shrink: 0;
          padding: 1px;
        }

        .swarrnim-institute-logo-badge img {
          max-height: 22px;
          max-width: 22px;
          object-fit: contain;
        }

        .swarrnim-institute-code {
          font-family: monospace;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--swarrnim-navy);
          background: #E2E8F0;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }

        .swarrnim-institute-card-body {
          flex: 1;
        }

        .swarrnim-institute-name {
          font-size: 0.775rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.22;
          margin-bottom: 0.15rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .swarrnim-institute-category {
          font-size: 0.66rem;
          color: #64748B;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Right Column: Login Card Panel (~42%) ── */
        .swarrnim-login-panel {
          flex: 0 0 42%;
          max-width: 470px;
          min-width: 380px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .swarrnim-card {
          width: 100%;
          height: 100%;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          box-shadow: 0 14px 40px -4px rgba(18, 54, 107, 0.08), 0 4px 14px -2px rgba(18, 54, 107, 0.02);
          padding: 1.35rem 1.85rem 1.15rem 1.85rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        /* Card top brand stripe */
        .swarrnim-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 3.5px;
          background: linear-gradient(90deg, var(--swarrnim-navy) 0%, var(--swarrnim-orange) 100%);
          border-radius: 3px 3px 0 0;
        }

        .swarrnim-card-header {
          text-align: center;
          margin-bottom: 0.85rem;
        }

        .swarrnim-card-title {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--swarrnim-navy);
          letter-spacing: -0.3px;
          margin: 0 0 0.25rem 0;
        }

        .swarrnim-card-subtitle {
          font-size: 0.84375rem;
          color: #64748B;
          line-height: 1.35;
          margin: 0;
        }

        /* Error banner */
        .swarrnim-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          color: #991B1B;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.35;
          margin-bottom: 0.85rem;
        }

        .swarrnim-error-banner svg {
          flex-shrink: 0;
          color: #DC2626;
          margin-top: 1px;
        }

        /* Form groups & inputs */
        .swarrnim-form-group {
          margin-bottom: 0.85rem;
          text-align: left;
        }

        .swarrnim-label {
          display: block;
          font-size: 0.785rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 0.35rem;
          letter-spacing: 0.2px;
        }

        .swarrnim-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .swarrnim-input-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .swarrnim-input {
          width: 100%;
          height: 44px;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 1rem 0 2.75rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: #0F172A;
          outline: none;
          transition: all 0.18s ease;
          box-sizing: border-box;
        }

        .swarrnim-input:hover {
          border-color: #94A3B8;
        }

        .swarrnim-input:focus {
          border-color: var(--swarrnim-navy);
          box-shadow: 0 0 0 3.5px rgba(18, 54, 107, 0.12);
        }

        .swarrnim-input:focus + .swarrnim-input-icon,
        .swarrnim-input-container:focus-within .swarrnim-input-icon {
          color: var(--swarrnim-navy);
        }

        .swarrnim-input::placeholder {
          color: #94A3B8;
        }

        .swarrnim-password-toggle {
          position: absolute;
          right: 6px;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: none;
          border: none;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .swarrnim-password-toggle:hover {
          color: #334155;
          background: #F1F5F9;
        }

        /* Checkbox + Forgot row */
        .swarrnim-form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.95rem;
        }

        .swarrnim-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }

        .swarrnim-checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          accent-color: var(--swarrnim-navy);
          cursor: pointer;
        }

        .swarrnim-forgot-btn {
          background: none;
          border: none;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--swarrnim-orange);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }

        .swarrnim-forgot-btn:hover {
          color: var(--swarrnim-orange-hover);
          text-decoration: underline;
        }

        /* Sign In Button */
        .swarrnim-submit-btn {
          width: 100%;
          height: 46px;
          background: var(--swarrnim-navy);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 12px rgba(18, 54, 107, 0.2);
        }

        .swarrnim-submit-btn:hover:not(:disabled) {
          background: var(--swarrnim-navy-dark);
          box-shadow: 0 6px 16px rgba(18, 54, 107, 0.3);
          transform: translateY(-1px);
        }

        .swarrnim-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .swarrnim-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        /* Spinner */
        .swarrnim-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: swarrnim-spin 0.6s linear infinite;
        }

        @keyframes swarrnim-spin {
          to { transform: rotate(360deg); }
        }

        /* Security Indicator */
        .swarrnim-security-indicator {
          margin-top: 0.85rem;
          padding-top: 0.75rem;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          color: #64748B;
        }

        .swarrnim-security-icon {
          color: var(--swarrnim-navy);
        }

        .swarrnim-security-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .swarrnim-security-title {
          font-size: 0.785rem;
          font-weight: 700;
          color: #334155;
          line-height: 1.2;
        }

        .swarrnim-security-sub {
          font-size: 0.66rem;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          line-height: 1.2;
        }

        /* Demo access compact button inside card */
        .swarrnim-demo-trigger-box {
          margin-top: 0.65rem;
          text-align: center;
        }

        .swarrnim-demo-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          background: #F8FAFC;
          border: 1px dashed #CBD5E1;
          border-radius: 8px;
          font-size: 0.775rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .swarrnim-demo-trigger-btn:hover {
          background: #FFF7ED;
          border-color: #FDBA74;
          color: var(--swarrnim-orange);
        }

        /* ── Clean Institutional Footer ── */
        .swarrnim-footer {
          position: relative;
          z-index: 10;
          height: 40px;
          padding: 0 2.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-top: 1px solid #E2E8F0;
          font-size: 0.775rem;
          color: #64748B;
          flex-shrink: 0;
        }

        .swarrnim-footer-left {
          font-weight: 500;
        }

        .swarrnim-footer-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .swarrnim-footer-link {
          color: #64748B;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .swarrnim-footer-link:hover {
          color: var(--swarrnim-navy);
          text-decoration: underline;
        }

        /* ── Demo Credentials Modal / Drawer ── */
        .swarrnim-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: swarrnim-fade-in 0.18s ease-out;
        }

        @keyframes swarrnim-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .swarrnim-modal-dialog {
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 20px 48px rgba(15, 44, 89, 0.2);
          width: 100%;
          max-width: 720px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: swarrnim-scale-up 0.18s ease-out;
        }

        @keyframes swarrnim-scale-up {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .swarrnim-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #E2E8F0;
          background: linear-gradient(135deg, var(--swarrnim-navy) 0%, var(--swarrnim-navy-dark) 100%);
          color: #FFFFFF;
        }

        .swarrnim-modal-header-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .swarrnim-modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .swarrnim-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .swarrnim-modal-body {
          padding: 1.25rem 1.5rem;
          overflow-y: auto;
        }

        .swarrnim-demo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
        }

        .swarrnim-demo-role-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }

        .swarrnim-demo-role-card:hover {
          border-color: var(--swarrnim-navy);
          box-shadow: 0 4px 14px rgba(18, 54, 107, 0.08);
          transform: translateY(-1px);
          background: #F8FAFD;
        }

        .swarrnim-demo-card-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .swarrnim-demo-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .swarrnim-demo-card-info h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 2px 0;
        }

        .swarrnim-demo-card-info span {
          font-size: 0.725rem;
          color: #64748B;
          display: block;
        }

        .swarrnim-demo-quick-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--swarrnim-navy);
          background: rgba(18, 54, 107, 0.06);
          padding: 0.3rem 0.55rem;
          border-radius: 6px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .swarrnim-demo-role-card:hover .swarrnim-demo-quick-badge {
          background: var(--swarrnim-navy);
          color: #FFFFFF;
        }

        /* ── Support Info Modal ── */
        .swarrnim-support-box {
          padding: 1rem;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          margin-bottom: 1rem;
        }

        .swarrnim-support-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.8125rem;
          border-bottom: 1px dashed #E2E8F0;
        }

        .swarrnim-support-row:last-child {
          border-bottom: none;
        }

        /* ── Responsive Rules ── */
        @media (max-width: 1200px) {
          .swarrnim-main-layout {
            padding: 1rem 1.5rem;
          }
          .swarrnim-panels-row {
            gap: 1.25rem;
          }
          .swarrnim-institutes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .swarrnim-headline {
            font-size: 1.95rem;
          }
          .swarrnim-login-panel {
            flex: 0 0 400px;
          }
        }

        @media (max-width: 960px) {
          .swarrnim-panels-row {
            flex-direction: column-reverse;
            gap: 1.75rem;
          }
          .swarrnim-institutes-panel {
            flex: 1 1 auto;
            width: 100%;
          }
          .swarrnim-institutes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .swarrnim-login-panel {
            flex: 1 1 auto;
            max-width: 100%;
            width: 100%;
          }
          .swarrnim-card {
            padding: 1.75rem 1.5rem;
          }
        }

        @media (max-width: 600px) {
          .swarrnim-topbar {
            padding: 0 1rem;
          }
          .swarrnim-topbar-brand-texts {
            display: none;
          }
          .swarrnim-headline {
            font-size: 1.75rem;
          }
          .swarrnim-institutes-grid {
            grid-template-columns: 1fr;
          }
          .swarrnim-card {
            padding: 1.5rem 1.15rem;
          }
          .swarrnim-demo-grid {
            grid-template-columns: 1fr;
          }
          .swarrnim-footer {
            flex-direction: column;
            height: auto;
            padding: 0.85rem 1rem;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>

      <div className="swarrnim-login-root">
        {/* ═══ 1. Official Header with Single University Logo ═══ */}
        <header className="swarrnim-topbar">
          <div className="swarrnim-topbar-brand">
            <img
              src={logoImg}
              alt="Swarrnim Startup & Innovation University Logo"
              className="swarrnim-topbar-logo"
            />
            <div className="swarrnim-topbar-brand-texts">
              <span className="swarrnim-topbar-uni-name">SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY</span>
              <span className="swarrnim-topbar-uni-tag">UNIVERSITY MANAGEMENT SYSTEM</span>
            </div>
          </div>

          <div className="swarrnim-topbar-actions">
            <button
              type="button"
              className="swarrnim-topbar-demo-btn"
              onClick={() => setIsDemoModalOpen(true)}
              title="Quickly test with demo university roles"
            >
              <KeyRound size={14} />
              <span>Demo Access</span>
            </button>
            <button
              type="button"
              className="swarrnim-topbar-btn"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <HelpCircle size={14} />
              <span>IT Support</span>
            </button>
          </div>
        </header>

        {/* ═══ 2. Main Content ═══ */}
        <main className="swarrnim-main-layout">
          {/* ── Top Hero Headline Section ── */}
          <div className="swarrnim-hero-section">
            <h1 className="swarrnim-headline">
              One Platform. <span className="swarrnim-headline-orange">Smarter University Management.</span>
            </h1>
            <p className="swarrnim-subheadline">
              A unified digital platform for academic, administrative and campus operations.
            </p>
          </div>

          {/* ── Balanced Two-Column Panels Row (Equal Height & Top-Aligned) ── */}
          <div className="swarrnim-panels-row">
            {/* ── Left Column: Our Institutes Panel (~58%) ── */}
            <section className="swarrnim-institutes-panel" aria-label="Our Institutes Showcase">
              <div className="swarrnim-institutes-header">
                <div className="swarrnim-institutes-title-row">
                  <Building2 size={18} color="var(--swarrnim-orange)" />
                  <h2 className="swarrnim-institutes-title">OUR INSTITUTES</h2>
                  <span className="swarrnim-institutes-count">12 INSTITUTES</span>
                </div>
                <p className="swarrnim-institutes-subtitle">
                  One University. Multiple Institutes. One Digital Ecosystem.
                </p>
              </div>

              <div className="swarrnim-institutes-grid">
                {universityInstitutes.map((inst) => (
                  <div className="swarrnim-institute-card" key={inst.id}>
                    <div className="swarrnim-institute-card-top">
                      <div className="swarrnim-institute-logo-badge">
                        <img
                          src={logoImg}
                          alt={`${inst.name} Emblem`}
                        />
                      </div>
                      <span className="swarrnim-institute-code">{inst.code}</span>
                    </div>
                    <div className="swarrnim-institute-card-body">
                      <div className="swarrnim-institute-name" title={inst.name}>
                        {inst.name}
                      </div>
                      <div className="swarrnim-institute-category">
                        {inst.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Right Column: Login Card Panel (~42%) ── */}
            <section className="swarrnim-login-panel" aria-label="Sign In Authentication">
              <div className="swarrnim-card">
                <div>
                  <div className="swarrnim-card-header">
                    <h2 className="swarrnim-card-title">Welcome Back</h2>
                    <p className="swarrnim-card-subtitle">
                      Sign in to access the Swarrnim University ERP
                    </p>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="swarrnim-error-banner" role="alert">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} autoComplete="on">
                    {/* Username / Email */}
                    <div className="swarrnim-form-group">
                      <label className="swarrnim-label" htmlFor="swarrnim-identifier">
                        University Email / Username
                      </label>
                      <div className="swarrnim-input-container">
                        <Mail size={17} className="swarrnim-input-icon" />
                        <input
                          id="swarrnim-identifier"
                          type="text"
                          className="swarrnim-input"
                          placeholder="Enter university email or username"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            if (error) setError('');
                          }}
                          required
                          autoComplete="username"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="swarrnim-form-group">
                      <label className="swarrnim-label" htmlFor="swarrnim-password">
                        Password
                      </label>
                      <div className="swarrnim-input-container">
                        <Lock size={17} className="swarrnim-input-icon" />
                        <input
                          id="swarrnim-password"
                          type={showPassword ? 'text' : 'password'}
                          className="swarrnim-input"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError('');
                          }}
                          required
                          autoComplete="current-password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="swarrnim-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Options Row */}
                    <div className="swarrnim-form-options">
                      <label className="swarrnim-checkbox-label">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          disabled={isLoading}
                        />
                        <span>Remember Me</span>
                      </label>

                      <button
                        type="button"
                        className="swarrnim-forgot-btn"
                        onClick={() => setIsForgotModalOpen(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* Submit Action */}
                    <button
                      type="submit"
                      className="swarrnim-submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="swarrnim-spinner" />
                          <span>Checking latest updates...</span>
                        </>
                      ) : (
                        <>
                          <span>SIGN IN</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div>
                  {/* Security Badge */}
                  <div className="swarrnim-security-indicator">
                    <ShieldCheck size={17} className="swarrnim-security-icon" />
                    <div className="swarrnim-security-text">
                      <span className="swarrnim-security-title">Secure University Access</span>
                      <span className="swarrnim-security-sub">Authorized Users Only</span>
                    </div>
                  </div>

                  {/* Quick Demo Login Trigger & Admin Portal Link */}
                  <div className="swarrnim-demo-trigger-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="swarrnim-demo-trigger-btn"
                      onClick={() => setIsDemoModalOpen(true)}
                    >
                      <KeyRound size={13} color="var(--swarrnim-orange)" />
                      <span>Quick Demo Login (Faculty, Student, HOD...)</span>
                    </button>
                    <a
                      href="/erp-admin/login"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #001F3F 0%, #001122 100%)',
                        color: '#FDBA74',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ShieldCheck size={14} color="#F58220" />
                      <span>ERP Admin Portal Login →</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* ═══ 3. Institutional Footer ═══ */}
        <footer className="swarrnim-footer">
          <div className="swarrnim-footer-left">
            &copy; 2026 Swarrnim Startup &amp; Innovation University. All rights reserved.
          </div>
          <div className="swarrnim-footer-right">
            <span className="swarrnim-footer-link" onClick={() => setIsSupportModalOpen(true)}>Privacy Policy</span>
            <span className="swarrnim-footer-link" onClick={() => setIsSupportModalOpen(true)}>Security</span>
            <span className="swarrnim-footer-link" onClick={() => setIsSupportModalOpen(true)}>IT Support</span>
          </div>
        </footer>
      </div>

      {/* ═══ 4. Demo Accounts Selection Modal ═══ */}
      {isDemoModalOpen && (
        <div className="swarrnim-modal-overlay" onClick={() => setIsDemoModalOpen(false)}>
          <div className="swarrnim-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="swarrnim-modal-header">
              <div className="swarrnim-modal-header-title">
                <KeyRound size={20} color="#F58220" />
                <span>Select Demo Account</span>
              </div>
              <button
                type="button"
                className="swarrnim-modal-close-btn"
                onClick={() => setIsDemoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="swarrnim-modal-body">
              <p style={{ fontSize: '0.84375rem', color: '#64748B', margin: '0 0 1.15rem 0', lineHeight: 1.5 }}>
                Click any pre-configured institutional role to test the Swarrnim University ERP:
              </p>

              <div className="swarrnim-demo-grid">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <div
                      key={account.role}
                      className="swarrnim-demo-role-card"
                      onClick={() => handleDemoLogin(account.userId, account.pass)}
                    >
                      <div className="swarrnim-demo-card-left">
                        <div
                          className="swarrnim-demo-card-icon"
                          style={{
                            background: `${account.accentColor}15`,
                            color: account.accentColor
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="swarrnim-demo-card-info">
                          <h4>{account.title}</h4>
                          <span>{account.badge}</span>
                        </div>
                      </div>

                      <div className="swarrnim-demo-quick-badge">
                        <span>Sign In</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 5. IT Support Modal ═══ */}
      {isSupportModalOpen && (
        <div className="swarrnim-modal-overlay" onClick={() => setIsSupportModalOpen(false)}>
          <div className="swarrnim-modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="swarrnim-modal-header">
              <div className="swarrnim-modal-header-title">
                <HelpCircle size={20} color="#F58220" />
                <span>IT Helpdesk &amp; Technical Support</span>
              </div>
              <button
                type="button"
                className="swarrnim-modal-close-btn"
                onClick={() => setIsSupportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="swarrnim-modal-body">
              <div className="swarrnim-support-box">
                <div className="swarrnim-support-row">
                  <span style={{ color: '#64748B' }}>Helpdesk Phone:</span>
                  <strong style={{ color: '#12366B' }}>+91 79 2328 1000 / Ext 104</strong>
                </div>
                <div className="swarrnim-support-row">
                  <span style={{ color: '#64748B' }}>Email Support:</span>
                  <strong style={{ color: '#12366B' }}>erp.support@swarrnim.edu.in</strong>
                </div>
                <div className="swarrnim-support-row">
                  <span style={{ color: '#64748B' }}>Portal Hours:</span>
                  <strong style={{ color: '#12366B' }}>24 × 7 Operational</strong>
                </div>
                <div className="swarrnim-support-row">
                  <span style={{ color: '#64748B' }}>Physical Location:</span>
                  <strong style={{ color: '#12366B' }}>Server Room, Admin Block, Gandhinagar</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="swarrnim-topbar-demo-btn"
                  onClick={() => setIsSupportModalOpen(false)}
                  style={{ width: '100%', justifyContent: 'center', height: '40px' }}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 6. Forgot Password Modal ═══ */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </>
  );
};
