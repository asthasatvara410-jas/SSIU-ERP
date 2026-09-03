import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Phone, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  History,
  QrCode,
  FileText,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { StudentGatePass } from '../../types';
import { Badge } from '../common/Badge';
import { downloadGatePassPDF } from '../../services/hostelGatePassPdfService';
import { studentGatePassService } from '../../services/studentGatePassService';

interface StudentGatePassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatePass: StudentGatePass;
  onRefresh?: () => void;
  canCancel?: boolean;
}

export const StudentGatePassDetailsModal: React.FC<StudentGatePassDetailsModalProps> = ({
  isOpen,
  onClose,
  gatePass,
  onRefresh,
  canCancel = true
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !gatePass) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadGatePassPDF(gatePass);
    } catch (e) {
      console.error('PDF error', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling this request.');
      return;
    }
    try {
      studentGatePassService.cancelGatePass(gatePass.id, cancelReason, { id: gatePass.studentId, name: gatePass.studentName, role: 'STUDENT' });
      setIsCancelling(false);
      onRefresh?.();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel pass.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">APPROVED &amp; ACTIVE</span>;
      case 'CHECKED_OUT':
      case 'OUT':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">CHECKED OUT (OUTSIDE)</span>;
      case 'COMPLETED':
      case 'CHECKED_IN':
      case 'RETURNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">COMPLETED &amp; RETURNED</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse">OVERDUE</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">REJECTED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-700 text-slate-400 border border-slate-600">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">PENDING WARDEN REVIEW</span>;
    }
  };

  // Stepper logic
  const steps = [
    { label: 'Submitted', key: 'SUBMITTED', done: true },
    { label: 'Warden Review', key: 'REVIEW', done: gatePass.status !== 'DRAFT' },
    { 
      label: gatePass.status === 'REJECTED' ? 'Rejected' : 'Approved', 
      key: 'APPROVAL', 
      done: gatePass.status === 'APPROVED' || gatePass.status === 'CHECKED_OUT' || gatePass.status === 'OUT' || gatePass.status === 'COMPLETED' || gatePass.status === 'OVERDUE' || gatePass.status === 'REJECTED',
      isError: gatePass.status === 'REJECTED'
    },
    { label: 'Checked Out', key: 'OUT', done: gatePass.status === 'CHECKED_OUT' || gatePass.status === 'OUT' || gatePass.status === 'COMPLETED' || gatePass.status === 'OVERDUE' },
    { label: 'Checked In / Completed', key: 'COMPLETED', done: gatePass.status === 'COMPLETED' || gatePass.status === 'RETURNED' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{gatePass.requestNo}</h2>
                {getStatusBadge(gatePass.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono">Digital Hostel Gate Pass Permit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Download Official PDF"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>{isDownloading ? 'Exporting...' : 'PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Print Gate Pass"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">

          {/* Workflow Stepper */}
          <div className="p-4 bg-slate-850/60 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Workflow Status Lifecycle
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {steps.map((step, idx) => (
                <div 
                  key={step.key} 
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    step.isError
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : step.done 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {step.isError ? (
                      <Ban className="w-4 h-4 text-rose-400" />
                    ) : step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium block leading-tight">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Alert Banner if applicable */}
          {gatePass.status === 'OVERDUE' && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <strong className="font-bold text-rose-300 block">GATE PASS IS OVERDUE!</strong>
                The student has exceeded the authorized Expected Return Time ({gatePass.expectedReturnDate} at {gatePass.expectedReturnTime}). Please report immediately to the Hostel Office.
              </div>
            </div>
          )}

          {/* Student Profile Card (Enrollment Number Official Identity) */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                Candidate Identity Record
              </span>
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {gatePass.enrollmentNo}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Student Name</span>
                <p className="font-bold text-white text-sm truncate">{gatePass.studentName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Program / Dept</span>
                <p className="font-medium text-slate-200 truncate">{gatePass.programName || 'B.Tech CSE'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Hostel &amp; Block</span>
                <p className="font-medium text-slate-200 truncate">{gatePass.hostelName} ({gatePass.block || 'Block A'})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Room &amp; Bed</span>
                <p className="font-mono font-bold text-orange-300">Room {gatePass.roomNo} ({gatePass.bedNo})</p>
              </div>
            </div>
          </div>

          {/* Schedule & Movement Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Movement Schedule Box */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-700/50">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Leave &amp; Return Schedule
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Pass Type:</span>
                  <span className="font-bold text-orange-300">{gatePass.passType || 'Day Out'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Leaving Time:</span>
                  <span className="font-semibold text-emerald-400">{gatePass.leavingDate || gatePass.outingDate} at {gatePass.leavingTime || gatePass.expectedOutTime}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Expected Return:</span>
                  <span className="font-semibold text-rose-400">{gatePass.expectedReturnDate || gatePass.leavingDate} at {gatePass.expectedReturnTime || '21:00'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Travel Mode:</span>
                  <span className="text-slate-200">{gatePass.travelMode || gatePass.modeOfTravel || 'Public Transport'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Traveling With:</span>
                  <span className="text-slate-200">{gatePass.travelingWith || 'Alone'}</span>
                </div>
              </div>
            </div>

            {/* Destination & Contact Box */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-700/50">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Destination &amp; Contact
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Destination Location</span>
                  <p className="font-semibold text-slate-200">{gatePass.destination}</p>
                  {gatePass.destinationAddress && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{gatePass.destinationAddress}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Reason</span>
                  <p className="text-slate-300 italic">{gatePass.reason || gatePass.purpose}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-mono text-slate-200 font-bold">{gatePass.emergencyContact || gatePass.parentGuardianMobile}</span>
                </div>
              </div>
            </div>

          </div>

          {/* QR Code & Digital Token Area (When Approved) */}
          {(gatePass.status === 'APPROVED' || gatePass.status === 'ACTIVE' || gatePass.status === 'CHECKED_OUT' || gatePass.status === 'COMPLETED' || gatePass.status === 'OVERDUE') && (
            <div className="p-4 bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-700 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Digital Gate Pass Activated
                </span>
                <p className="text-xs text-slate-300">
                  Present this QR permit to university security at the Main Gate during exit and re-entry.
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Verification Token: <strong className="text-white font-bold">{gatePass.qrToken || 'GP_TOKEN_ACTIVE'}</strong>
                </p>
              </div>

              {/* QR Code Graphic */}
              <div className="p-2.5 bg-white rounded-xl shadow-lg border-2 border-orange-500 shrink-0 text-center">
                <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="5" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
                  <rect x="11" y="11" width="18" height="18" fill="#0F2C59" />
                  <rect x="65" y="5" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
                  <rect x="71" y="11" width="18" height="18" fill="#0F2C59" />
                  <rect x="5" y="65" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
                  <rect x="11" y="71" width="18" height="18" fill="#0F2C59" />
                  <rect x="42" y="12" width="6" height="16" fill="#EA580C" />
                  <rect x="52" y="8" width="6" height="8" fill="#0F2C59" />
                  <rect x="12" y="42" width="16" height="6" fill="#0F2C59" />
                  <rect x="8" y="52" width="8" height="6" fill="#EA580C" />
                  <rect x="36" y="36" width="28" height="28" fill="#0F2C59" rx="2" />
                  <rect x="42" y="42" width="16" height="16" fill="white" />
                  <rect x="46" y="46" width="8" height="8" fill="#EA580C" />
                  <rect x="70" y="42" width="8" height="14" fill="#0F2C59" />
                  <rect x="82" y="48" width="10" height="6" fill="#0F2C59" />
                  <rect x="42" y="70" width="14" height="8" fill="#0F2C59" />
                  <rect x="48" y="82" width="6" height="10" fill="#0F2C59" />
                  <rect x="68" y="68" width="10" height="10" fill="#EA580C" />
                  <rect x="82" y="82" width="12" height="12" fill="#0F2C59" />
                </svg>
                <span className="text-[9px] font-mono font-bold text-slate-800 block mt-1">
                  {gatePass.requestNo}
                </span>
              </div>
            </div>
          )}

          {/* Warden Remarks & Gate Records */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Warden Authorization</span>
              <p className="font-semibold text-slate-200 mt-1">{gatePass.approvedByName || 'Pending Review'}</p>
              {gatePass.wardenRemarks && (
                <p className="text-slate-400 text-[11px] mt-0.5">Remarks: {gatePass.wardenRemarks}</p>
              )}
              {gatePass.rejectedReason && (
                <p className="text-rose-400 text-[11px] mt-0.5">Rejection Reason: {gatePass.rejectedReason}</p>
              )}
            </div>

            <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-medium block">Gate Security Check Logs</span>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Exit (OUT):</span>
                  <span className="font-mono text-slate-200">{gatePass.actualCheckOutTime ? new Date(gatePass.actualCheckOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Exit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Return (IN):</span>
                  <span className="font-mono text-slate-200">{gatePass.actualCheckInTime ? new Date(gatePass.actualCheckInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Return'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          {gatePass.history && gatePass.history.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Audit Trail Log
              </span>
              <div className="space-y-1.5">
                {gatePass.history.map(entry => (
                  <div key={entry.id} className="text-xs p-2 bg-slate-850/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-300 mr-2">[{entry.action}]</span>
                      <span className="text-slate-400">{entry.remarks || 'Status update'}</span>
                      <span className="text-[10px] text-slate-500 ml-2">by {entry.userName} ({entry.userRole})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Request Dialog */}
          {isCancelling && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
              <span className="text-xs font-bold text-rose-400 block">Confirm Request Cancellation</span>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancelling this request..."
                rows={2}
                className="w-full p-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelling(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-850 border-t border-slate-800">
          <div>
            {canCancel && (gatePass.status === 'SUBMITTED' || gatePass.status === 'PENDING' || gatePass.status === 'DRAFT') && !isCancelling && (
              <button
                type="button"
                onClick={() => setIsCancelling(true)}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                Cancel Request
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
