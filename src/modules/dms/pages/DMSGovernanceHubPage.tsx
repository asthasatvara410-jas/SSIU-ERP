import React, { useState } from 'react';
import { FileText, Scan, ShieldCheck, Layers } from 'lucide-react';
import { DocumentVerificationDesk } from '../components/DocumentVerificationDesk';
import { OcrExtractionSandbox } from '../components/OcrExtractionSandbox';

export const DMSGovernanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VERIFICATION_DESK' | 'OCR_SANDBOX'>('VERIFICATION_DESK');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Document Management System (DMS & OCR)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Institutional document compliance repository, automated OCR field extraction, and master discrepancy detection.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('VERIFICATION_DESK')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'VERIFICATION_DESK'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Document Compliance & Verification Desk
        </button>

        <button
          onClick={() => setActiveTab('OCR_SANDBOX')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'OCR_SANDBOX'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scan className="w-4 h-4" />
          OCR Text Extraction Sandbox
        </button>
      </div>

      {/* Content */}
      {activeTab === 'VERIFICATION_DESK' && <DocumentVerificationDesk />}
      {activeTab === 'OCR_SANDBOX' && <OcrExtractionSandbox />}
    </div>
  );
};
