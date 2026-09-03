import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, AlertTriangle, Search, Filter, ShieldCheck, Eye } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { dmsOcrVerificationService } from '../services/dmsOcrVerificationService';
import { DMSDocumentAuditRecord, VerificationState } from '../types';

export const DocumentVerificationDesk: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationState>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DMSDocumentAuditRecord | null>(null);

  const documents = dmsOcrVerificationService.getDocuments();
  const metrics = dmsOcrVerificationService.getOverviewMetrics();

  const filteredDocs = documents.filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.verificationStatus === statusFilter;
    const matchesSearch = d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.enrollmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAction = (docId: string, status: VerificationState) => {
    dmsOcrVerificationService.updateVerificationStatus(docId, status);
    // Refresh selected doc
    const updated = dmsOcrVerificationService.getDocuments().find(d => d.documentId === docId);
    if (updated) setSelectedDoc(updated);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Digital Documents</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{metrics.totalArchivedDocuments}</p>
          <span className="text-[11px] text-slate-500 font-medium">Archived in Repository</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Verified & Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{metrics.verifiedCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Clearance Certified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{metrics.pendingReviewCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting Inspection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>OCR Anomalies</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1">{metrics.suspiciousAnomalyCount}</p>
          <span className="text-[11px] text-rose-600 font-medium">Mismatch Flagged</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['ALL', 'VERIFIED', 'PENDING_REVIEW', 'SUSPICIOUS_ANOMALY', 'REJECTED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter document or student..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Documents Table and Inspection Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student & Document</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">OCR Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocs.map(doc => (
                  <tr
                    key={doc.documentId}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      selectedDoc?.documentId === doc.documentId ? 'bg-indigo-50/40' : ''
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{doc.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{doc.fileName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="navy">{doc.documentCategory.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700">
                        {doc.ocrExtraction?.confidence.overallConfidence || 90}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          doc.verificationStatus === 'VERIFIED'
                            ? 'success'
                            : doc.verificationStatus === 'SUSPICIOUS_ANOMALY'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {doc.verificationStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Document Audit Drawer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Document Verification Dossier
                </h4>
                <Badge variant={selectedDoc.verificationStatus === 'VERIFIED' ? 'success' : 'danger'}>
                  {selectedDoc.verificationStatus.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Candidate:</span>
                  <span className="font-bold text-slate-900">{selectedDoc.studentName} ({selectedDoc.enrollmentNo})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">File Name:</span>
                  <span className="font-mono text-slate-700">{selectedDoc.fileName}</span>
                </div>
              </div>

              {/* OCR Cross-Validation Analysis */}
              {selectedDoc.ocrExtraction && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Automated Cross-Validation:</span>
                  {selectedDoc.ocrExtraction.crossValidationMatches.map(m => (
                    <div key={m.fieldKey} className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                      <div>
                        <span className="text-slate-500 font-medium">{m.fieldLabel}:</span>
                        <div className="text-[11px] text-slate-700">OCR: {m.extractedValue}</div>
                      </div>
                      <Badge variant={m.isMatch ? 'success' : 'danger'}>
                        {m.isMatch ? 'Match' : 'Mismatch'}
                      </Badge>
                    </div>
                  ))}

                  {selectedDoc.ocrExtraction.anomalyDetected && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-medium">
                      {selectedDoc.ocrExtraction.anomalySummary}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleAction(selectedDoc.documentId, 'VERIFIED')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Approve Document
                </button>
                <button
                  onClick={() => handleAction(selectedDoc.documentId, 'REJECTED')}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Reject Document
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a document from the left table to inspect OCR extracted metadata and verification audit logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
