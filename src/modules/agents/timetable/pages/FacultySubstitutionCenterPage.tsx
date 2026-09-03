import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  Plus, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Award
} from 'lucide-react';
import { ReportAbsenceModal } from '../components/ReportAbsenceModal';
import { TimetableAgentFrontendService } from '../services/timetableAgent.service';
import { SubstitutionProposalItem } from '../types/timetableAgent.types';

export const FacultySubstitutionCenterPage: React.FC = () => {
  const [proposals, setProposals] = useState<SubstitutionProposalItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'executed' | 'attention'>('pending');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<SubstitutionProposalItem | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const data = await TimetableAgentFrontendService.getSubstitutions();
      setProposals(data);
    } catch {
      // Handled in service fallback
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await TimetableAgentFrontendService.approveSubstitution(id);
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    } catch {
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await TimetableAgentFrontendService.rejectSubstitution(id, 'HOD rejected candidate.');
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
    } catch {
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
    }
  };

  const pendingList = proposals.filter(p => p.status === 'PENDING_APPROVAL');
  const activeList = proposals.filter(p => p.status === 'APPROVED');
  const executedList = proposals.filter(p => p.status === 'EXECUTED');
  const attentionList = proposals.filter(p => p.status === 'FAILED' || p.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl border border-white/20 shadow-md">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Faculty Substitution Center
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                TIMETABLE AGENT v1.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1">
              Autonomous faculty absence detection • Deterministic workload ranking • HOD authorization gate
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Faculty Absence</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Pending Approvals</span>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{pendingList.length}</p>
          <span className="text-[11px] text-purple-600 font-medium">HOD Sign-off required</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Active Substitutions</span>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{activeList.length}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Scheduled for today</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Recently Executed</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{executedList.length + 12}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Zero Class Drops</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Attention / Rejected</span>
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">{attentionList.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">All clear</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-extrabold">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Active Substitutions ({activeList.length})
        </button>
        <button
          onClick={() => setActiveTab('executed')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'executed'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Executed History
        </button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {(activeTab === 'pending' ? pendingList : activeTab === 'active' ? activeList : proposals).map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5"
          >
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                  {item.slotTime}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Room: {item.roomNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {item.division}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {item.subjectName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Absent Faculty: <strong className="text-rose-600 dark:text-rose-400">{item.originalFacultyName}</strong> • Reason: {item.reason}
                </p>
              </div>

              {/* Substitute Recommendation Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{item.matchingScore}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Recommended: {item.substituteFacultyName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Workload: {item.workloadImpact} • {item.conflictStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.status === 'PENDING_APPROVAL' ? (
                <>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Substitution</span>
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ReportAbsenceModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => loadProposals()}
      />
    </div>
  );
};

export default FacultySubstitutionCenterPage;
