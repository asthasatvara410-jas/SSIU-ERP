import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  Activity, 
  Settings2, 
  FileText, 
  CreditCard, 
  Calendar, 
  Sliders, 
  ArrowRight,
  UserCheck,
  Zap,
  Check,
  X,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Lock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AgentCardData {
  id: string;
  code: string;
  name: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ERROR';
  autonomyLevel: 'ASSISTED' | 'APPROVAL_REQUIRED' | 'SEMI_AUTONOMOUS' | 'AUTONOMOUS';
  version: string;
  lastRun: string;
  pendingApprovals: number;
  icon: any;
  description: string;
}

export const AIControlCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'runs' | 'approvals' | 'activity' | 'policies' | 'settings'>('agents');
  const [selectedAgentCode, setSelectedAgentCode] = useState<string>('ALL');

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    AGENTS_ENABLED: false,
    TIMETABLE_AGENT_ENABLED: false,
    DOCUMENT_AGENT_ENABLED: false,
    FEE_AGENT_ENABLED: false,
    DRY_RUN_DEFAULT: true,
  });

  // Planned Agents in Stage 6.1: Foundation Ready / Approval Required
  const [agents, setAgents] = useState<AgentCardData[]>([
    {
      id: 'agent-tt-01',
      code: 'TIMETABLE_SUBSTITUTION_AGENT',
      name: 'Autonomous Timetable & Faculty Substitution Agent',
      category: 'ACADEMIC_OPERATIONS',
      status: 'DRAFT',
      autonomyLevel: 'APPROVAL_REQUIRED',
      version: 'v1.0.0',
      lastRun: 'Never',
      pendingApprovals: 0,
      icon: Calendar,
      description: 'Autonomous resolution of faculty absence, peer workload ranking, and lecture schedule substitution (Foundation Ready).',
    },
    {
      id: 'agent-doc-02',
      code: 'DOCUMENT_VERIFICATION_AGENT',
      name: 'Smart Document Verifier & Processor',
      category: 'DMS_OPERATIONS',
      status: 'DRAFT',
      autonomyLevel: 'APPROVAL_REQUIRED',
      version: 'v1.0.0',
      lastRun: 'Never',
      pendingApprovals: 0,
      icon: FileText,
      description: 'Autonomous OCR extraction, student entity cross-matching, and verification confidence evaluation (Foundation Ready).',
    },
    {
      id: 'agent-fee-03',
      code: 'FEE_RECOVERY_AGENT',
      name: 'Proactive Fee Recovery Agent',
      category: 'FINANCE_OPERATIONS',
      status: 'DRAFT',
      autonomyLevel: 'APPROVAL_REQUIRED',
      version: 'v1.0.0',
      lastRun: 'Never',
      pendingApprovals: 0,
      icon: CreditCard,
      description: 'Autonomous fee recovery monitoring, conversational payment negotiation, and compliant installment plan management (Foundation Ready).',
    },
  ]);

  // Approval Request Center
  const [approvalRequests, setApprovalRequests] = useState([
    {
      approvalId: 'app-req-501',
      executionId: 'exec-tt-991',
      agentName: 'Timetable Substitution Agent',
      action: 'UPDATE_TIMETABLE',
      entityType: 'TIMETABLE_SLOT',
      entityId: 'SLOT-DBMS-DIV-A',
      riskLevel: 'HIGH_RISK',
      requestedByAgent: 'TIMETABLE_SUBSTITUTION_AGENT',
      assignedTo: 'HOD_COMPUTER_ENGINEERING',
      reason: 'Faculty Dr. S. K. Patel reported absence. Peer candidate Prof. R. M. Joshi ranked with 84.5% matching score.',
      proposedChanges: {
        originalFaculty: 'Dr. S. K. Patel',
        proposedSubstitute: 'Prof. R. M. Joshi',
        date: 'Today (Period 3: 11:00 - 12:00)',
        subject: 'DBMS Theory (Sem 4)',
      },
      status: 'PENDING',
      expiresAt: 'In 2 hours',
    },
    {
      approvalId: 'app-req-502',
      executionId: 'exec-doc-882',
      agentName: 'Smart Document Verifier',
      action: 'MARK_DOCUMENT_VERIFIED',
      entityType: 'STUDENT_DOCUMENT',
      entityId: 'DOC-LC-ENR2026042',
      riskLevel: 'HIGH_RISK',
      requestedByAgent: 'DOCUMENT_VERIFICATION_AGENT',
      assignedTo: 'STUDENT_SECTION_OFFICER',
      reason: 'Leaving Certificate OCR extracted 89.2% confidence (requires human sign-off for slight date blur).',
      proposedChanges: {
        studentName: 'Rahul Verma (ENR2026042)',
        documentType: 'Leaving Certificate',
        ocrConfidence: '89.2%',
      },
      status: 'PENDING',
      expiresAt: 'In 24 hours',
    },
    {
      approvalId: 'app-req-503',
      executionId: 'exec-fee-773',
      agentName: 'Fee Recovery Agent',
      action: 'CREATE_PAYMENT_PLAN',
      entityType: 'FEE_EMI_PLAN',
      entityId: 'PLAN-FEE-60K',
      riskLevel: 'MEDIUM_RISK',
      requestedByAgent: 'FEE_RECOVERY_AGENT',
      assignedTo: 'FINANCE_OFFICER',
      reason: 'Student requested 3-part installment plan for ₹60,000 (35% down payment).',
      proposedChanges: {
        student: 'Pooja Shah',
        totalAmount: '₹60,000',
        downPayment: '₹21,000 (35%)',
        installments: '3 Parts',
      },
      status: 'PENDING',
      expiresAt: 'In 48 hours',
    },
  ]);

  const handleResolveApproval = (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setApprovalRequests(prev => prev.map(a => a.approvalId === approvalId ? { ...a, status: decision } : a));
  };

  const toggleFeatureFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border border-white/20 shadow-md">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Agent Center & Autonomous Operations Core
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  STAGE 6.1 — FOUNDATION READY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/90 mt-1">
                Centralized Agent Registry • Policy & Permission Sandbox • Human-in-the-Loop Approval Queue • Idempotent Execution
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 border border-slate-700 text-slate-300">
              Feature Flag: {featureFlags.AGENTS_ENABLED ? 'ENABLED' : 'DISABLED (SAFE DEFAULT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubTab('agents')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'agents'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          🤖 Agent Center
        </button>
        <button
          onClick={() => setActiveSubTab('runs')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'runs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ⚡ Agent Runs
        </button>
        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeSubTab === 'approvals'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>Approvals</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold">
            {approvalRequests.filter(a => a.status === 'PENDING').length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'activity'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📈 Agent Activity
        </button>
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'policies'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          🛡️ Policies
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ⚙️ Agent Settings
        </button>
      </div>

      {/* Tab 1: Agent Center (Cards) */}
      {activeSubTab === 'agents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        ● {agent.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4">
                      {agent.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                        {agent.code}
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        ● {agent.autonomyLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Last Run</span>
                      <span className="font-bold text-slate-800 dark:text-white">{agent.lastRun}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Pending Approvals</span>
                      <span className="font-bold text-purple-600">{agent.pendingApprovals}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Agent Runs (Execution Status List) */}
      {activeSubTab === 'runs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Agent Execution Runs
            </h3>
            <span className="text-xs text-slate-400">Traceable correlation IDs • Idempotent Protection</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Execution ID</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Trigger Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Initiated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-600">exec-tt-99120</td>
                  <td className="py-2.5 px-3 font-semibold">TIMETABLE_SUBSTITUTION_AGENT</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">FACULTY_ABSENCE_REPORTED</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      WAITING_APPROVAL
                    </span>
                  </td>
                  <td className="py-2.5 px-3">28ms</td>
                  <td className="py-2.5 px-3 text-slate-400">EVENT_DISPATCHER</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-600">exec-doc-88124</td>
                  <td className="py-2.5 px-3 font-semibold">DOCUMENT_VERIFICATION_AGENT</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">DOCUMENT_UPLOADED</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      WAITING_APPROVAL
                    </span>
                  </td>
                  <td className="py-2.5 px-3">42ms</td>
                  <td className="py-2.5 px-3 text-slate-400">DMS_MODULE</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-indigo-600">exec-fee-77112</td>
                  <td className="py-2.5 px-3 font-semibold">FEE_RECOVERY_AGENT</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">FEE_OVERDUE</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      WAITING_APPROVAL
                    </span>
                  </td>
                  <td className="py-2.5 px-3">35ms</td>
                  <td className="py-2.5 px-3 text-slate-400">FEE_SCHEDULER</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Approval Center UI */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          {approvalRequests.map((req) => (
            <div
              key={req.approvalId}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                req.status === 'APPROVED'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : req.status === 'REJECTED'
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200">
                    Assigned: {req.assignedTo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200">
                    {req.riskLevel}
                  </span>
                  <span className="text-xs text-slate-400">• Expires {req.expiresAt}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Action Requires Approval: <span className="text-indigo-600">{req.action}</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Reason:</strong> {req.reason}
                </p>

                {/* Proposed Changes Preview */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Proposed Changes:</span>
                  <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(req.proposedChanges, null, 2)}
                  </pre>
                </div>
              </div>

              {req.status === 'PENDING' ? (
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleResolveApproval(req.approvalId, 'APPROVED')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleResolveApproval(req.approvalId, 'REJECTED')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {req.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Agent Activity (Execution Timeline) */}
      {activeSubTab === 'activity' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Autonomous Pipeline Execution Timeline
          </h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                'Event Received',
                'Context Loaded',
                'Policy Checked',
                'Tool Selected',
                'Approval Requested',
                'Approval Granted',
                'Action Executed',
                'Notification Sent',
                'Completed',
              ].map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{step}</span>
                  </span>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Policies */}
      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                TIMETABLE_SUBSTITUTION_POLICY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ENFORCED
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Faculty Workload & Conflict Limits
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              High-risk action UPDATE_TIMETABLE requires HOD authorization when match score &lt; 85% or daily workload exceeds 360 minutes.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                FEE_EMI_POLICY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ENFORCED
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Fee Recovery & EMI Hard Constraints
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Maximum 3 installments, minimum 30% down payment. Strict zero discount or fee waiver policy enforced prior to tool execution.
            </p>
          </div>
        </div>
      )}

      {/* Tab 6: Agent Settings & Feature Flags */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Autonomous Agent Feature Flags & Safety Controls
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">AGENTS_ENABLED (Global Master Switch)</p>
                <p className="text-slate-400">Controls whether any autonomous ERP agent execution is permitted.</p>
              </div>
              <button
                onClick={() => toggleFeatureFlag('AGENTS_ENABLED')}
                className="cursor-pointer"
              >
                {featureFlags.AGENTS_ENABLED ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">TIMETABLE_AGENT_ENABLED</p>
                <p className="text-slate-400">Enables autonomous timetable absence detection and peer ranking.</p>
              </div>
              <button
                onClick={() => toggleFeatureFlag('TIMETABLE_AGENT_ENABLED')}
                className="cursor-pointer"
              >
                {featureFlags.TIMETABLE_AGENT_ENABLED ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">DOCUMENT_AGENT_ENABLED</p>
                <p className="text-slate-400">Enables smart OCR extraction and auto-verification processing.</p>
              </div>
              <button
                onClick={() => toggleFeatureFlag('DOCUMENT_AGENT_ENABLED')}
                className="cursor-pointer"
              >
                {featureFlags.DOCUMENT_AGENT_ENABLED ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">FEE_AGENT_ENABLED</p>
                <p className="text-slate-400">Enables proactive overdue fee recovery and conversational negotiation.</p>
              </div>
              <button
                onClick={() => toggleFeatureFlag('FEE_AGENT_ENABLED')}
                className="cursor-pointer"
              >
                {featureFlags.FEE_AGENT_ENABLED ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIControlCenterPage;
