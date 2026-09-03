import React, { useState } from 'react';
import { Award, FileText, CheckCircle2, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { ExamEligibilityEvaluationDesk } from '../components/ExamEligibilityEvaluationDesk';
import { MarksheetCertificateViewer } from '../components/MarksheetCertificateViewer';
import { Badge } from '../../../components/common/Badge';

export const ExaminationGovernancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ELIGIBILITY' | 'RESULTS_CREDENTIALS'>('ELIGIBILITY');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-indigo-600" />
            Examination & Results Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated exam eligibility enforcement, deterministic UGC-compliant grading, and tamper-evident credential payloads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="navy">UGC 10-Point Scale Active</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ELIGIBILITY')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'ELIGIBILITY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Exam Eligibility & Debarment Desk
        </button>

        <button
          onClick={() => setActiveTab('RESULTS_CREDENTIALS')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'RESULTS_CREDENTIALS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Marksheet & Degree Credentials
        </button>
      </div>

      {/* Content */}
      {activeTab === 'ELIGIBILITY' && <ExamEligibilityEvaluationDesk />}
      {activeTab === 'RESULTS_CREDENTIALS' && <MarksheetCertificateViewer />}
    </div>
  );
};
