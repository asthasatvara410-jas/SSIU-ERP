import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { NoteSheetVerificationResult } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Calendar, 
  Hash, 
  ArrowRight,
  Printer,
  ExternalLink
} from 'lucide-react';

interface NoteSheetVerificationPageProps {
  initialQuery?: string;
  onNavigateToNotesheet?: (notesheetId: string) => void;
}

export const NoteSheetVerificationPage: React.FC<NoteSheetVerificationPageProps> = ({
  initialQuery,
  onNavigateToNotesheet
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (initialQuery) return initialQuery;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const idParam = searchParams.get('id') || searchParams.get('token') || searchParams.get('ref');
      if (idParam) return idParam;

      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const verifyIdx = pathParts.findIndex(p => p === 'verify' || p === 'notesheet-verify');
      if (verifyIdx !== -1 && pathParts[verifyIdx + 1] === 'notesheet' && pathParts[verifyIdx + 2]) {
        return decodeURIComponent(pathParts[verifyIdx + 2]);
      }
      if (pathParts[0] === 'notesheet-verify' && pathParts[1]) {
        return decodeURIComponent(pathParts[1]);
      }
    }
    return '';
  });
  const [result, setResult] = useState<NoteSheetVerificationResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryToUse = initialQuery || searchQuery;
    if (queryToUse) {
      handleVerify(queryToUse);
    }
  }, [initialQuery]);

  const handleVerify = (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    setTimeout(() => {
      const res = db.verifyNoteSheetIntegrity(q);
      setResult(res);
      setLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start text-slate-800 dark:text-slate-100">
      {/* Header Emblem & Title */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-800 mb-4 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-blue-700 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Swarrnim Startup &amp; Innovation University
        </h1>
        <p className="text-sm font-semibold tracking-wider uppercase text-blue-800 dark:text-blue-300 mt-1">
          Official Electronic Notesheet Verification Portal
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Scan QR code or enter Verification ID / Notesheet Number to verify document authenticity and approval integrity.
        </p>
      </div>

      {/* Search Box */}
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. NSV-2026-000001, SIT-NOTESHEET-0826-001, REG-IN-2026-000001"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="py-3 px-6 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Verifying...' : 'Verify Record'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Result Display */}
      {searched && (
        <div className="max-w-2xl w-full">
          {result && result.valid ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/40 shadow-lg overflow-hidden transition-all animate-fadeIn">
              {/* Authenticity Banner */}
              <div className="bg-emerald-600 text-white p-4 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-100 shrink-0" />
                  <div>
                    <h3 className="font-black text-base uppercase tracking-wider">
                      Authentic Electronic Record
                    </h3>
                    <p className="text-xs text-emerald-100">
                      Verified against Swarrnim University Central ERP Registry
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/30">
                  {result.integrityStatus}
                </span>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      Notesheet Number
                    </span>
                    <p className="font-mono font-bold text-base text-blue-900 dark:text-blue-300">
                      {result.notesheetNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      Verification ID
                    </span>
                    <p className="font-mono font-bold text-base text-slate-800 dark:text-slate-200">
                      {result.verificationId}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      Document Version
                    </span>
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      v{result.version || '1.0'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      Approval Status
                    </span>
                    <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 uppercase">
                      {result.status} (Final Sanction Granted)
                    </p>
                  </div>
                </div>

                {/* Tracking & Office Details */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Originating Institute:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{result.instituteName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Department:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{result.departmentName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Subject / Title:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{result.subject}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Final Sanction Date:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{result.finalApprovalDate}</span>
                  </div>
                  {result.inwardNumber && (
                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Registrar Inward No.:</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{result.inwardNumber} ({result.inwardDate || 'Received'})</span>
                    </div>
                  )}
                  {result.outwardNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Registrar Outward No.:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{result.outwardNumber} ({result.outwardDate || 'Dispatched'})</span>
                    </div>
                  )}
                </div>

                {/* Official Statutory Disclaimer */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300 italic text-center">
                  &ldquo;This electronic verification confirms that the specified document is registered in the official central registry of Swarrnim Startup &amp; Innovation University. The cryptographic audit trail is legally valid and binding.&rdquo;
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    Verified on {new Date().toLocaleString()}
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Certificate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-400/40 p-6 text-center shadow-md">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/60 rounded-2xl border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-base text-red-700 dark:text-red-400 uppercase">
                Verification Record Not Found
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {result?.message || `No authentic university record matching identifier "${searchQuery}". Please check the ID or QR code and try again.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
