import React from 'react';
import { FeeInvoice } from '../../types';
import { db } from '../../services/db';
import { X, Printer, User, DollarSign, Calendar, ShieldCheck, CheckCircle2, Layers, AlertTriangle, FileText, Info } from 'lucide-react';
import { Badge } from '../common/Badge';

interface FeeInvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
  onPayNow?: (invoice: FeeInvoice) => void;
}

export const FeeInvoiceViewModal: React.FC<FeeInvoiceViewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPayNow,
}) => {
  if (!isOpen || !invoice) return null;

  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const feeHeads = db.getFeeHeads();

  const prog = programs.find(p => p.id === invoice.programId);
  const sem = semesters.find(s => s.id === invoice.semesterId);

  const items = invoice.items || [];
  const isPayable = invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-900 via-navy-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-300" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Fee Demand / Invoice Notice
              </h3>
              <p className="text-xs text-blue-200 font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Official Letterhead layout) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm bg-white dark:bg-slate-800">
          {/* University Letterhead */}
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-3">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
              Swarrnim Startup &amp; Innovation University
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bhoyan Rathod, Opp. IFFCO, Near Gandhinagar, Gujarat 382420
            </p>
            <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider">
              Official University Fee Demand Notice
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{invoice.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrollment No:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{invoice.enrollmentNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{prog?.name || invoice.programId || 'B.Tech'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Semester &amp; AY:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sem?.code || `Sem ${invoice.semesterId}`} • {invoice.academicYearCode}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Due Date:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{invoice.dueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Demand Status:</span>
                <div>
                  {invoice.status === 'ISSUED' && <Badge variant="success">ISSUED</Badge>}
                  {invoice.status === 'DRAFT' && <Badge variant="gold">DRAFT</Badge>}
                  {invoice.status === 'CANCELLED' && <Badge variant="danger">CANCELLED</Badge>}
                  {invoice.status === 'PAID' && <Badge variant="success">PAID</Badge>}
                  {invoice.status === 'OVERDUE' && <Badge variant="danger">OVERDUE</Badge>}
                  {invoice.status === 'PARTIALLY_PAID' && <Badge variant="orange">PARTIALLY PAID</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Notice if applicable */}
          {invoice.status === 'CANCELLED' && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>This Fee Demand has been CANCELLED.</strong>
                {invoice.cancellationReason && (
                  <p className="mt-0.5">Reason: {invoice.cancellationReason}</p>
                )}
                {invoice.cancelledAt && (
                  <p className="text-[10px] text-rose-600 mt-0.5">
                    Cancelled on {new Date(invoice.cancelledAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Fee Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Invoiced Fee Items
            </h4>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Fee Head Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Invoiced Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {items.map((item, idx) => {
                    const fh = feeHeads.find(f => f.id === item.feeHeadId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.feeHeadName || fh?.name || item.description || item.feeHeadId}
                          </div>
                          <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                            {item.feeHeadCode || fh?.code || 'FEE_HEAD'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="navy">{item.feeHeadCategory || fh?.category || 'ACADEMIC'}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary Calculation Box */}
          <div className="w-full md:w-80 ml-auto p-3.5 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount:</span>
              <span className="font-mono">- ₹{Number(invoice.discountAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Waiver:</span>
              <span className="font-mono">- ₹{Number(invoice.waiverAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Late Fee:</span>
              <span className="font-mono">+ ₹{Number(invoice.lateFeeAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-slate-300 dark:border-slate-600 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
              <span>TOTAL PAYABLE:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl text-center text-[11px] text-slate-500 border border-slate-200 dark:border-slate-700">
            This is a computer-generated official Fee Demand document issued by Swarrnim Startup &amp; Innovation University. Please remit before the due date to avoid late fee penalties.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Download Demand Notice
            </button>
            {isPayable && onPayNow && (
              <button
                type="button"
                onClick={() => { onClose(); onPayNow(invoice); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <DollarSign className="w-4 h-4" />
                Pay Online Now
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
