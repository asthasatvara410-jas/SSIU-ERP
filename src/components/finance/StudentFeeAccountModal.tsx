import React from 'react';
import { StudentFeeRecord } from '../../types';
import { db } from '../../services/db';
import { X, Printer, User, DollarSign, Calendar, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { Badge } from '../common/Badge';

interface StudentFeeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: StudentFeeRecord | null;
}

export const StudentFeeAccountModal: React.FC<StudentFeeAccountModalProps> = ({
  isOpen,
  onClose,
  feeRecord,
}) => {
  if (!isOpen || !feeRecord) return null;

  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const feeHeads = db.getFeeHeads();

  const prog = programs.find(p => p.id === feeRecord.programId);
  const sem = semesters.find(s => s.id === feeRecord.semesterId);

  // If items exist, use them. Otherwise, fallback from fields.
  const items = feeRecord.items && feeRecord.items.length > 0 ? feeRecord.items : [
    {
      id: 'item-1',
      studentFeeAccountId: feeRecord.id,
      feeHeadId: 'fh-tuition',
      feeHeadName: 'Tuition Fee',
      feeHeadCode: 'TUITION',
      feeHeadCategory: 'ACADEMIC',
      amount: feeRecord.tuitionFee || 45000,
      paidAmount: 0,
      outstandingAmount: feeRecord.tuitionFee || 45000,
      status: 'PENDING' as const,
    },
    {
      id: 'item-2',
      studentFeeAccountId: feeRecord.id,
      feeHeadId: 'fh-lab',
      feeHeadName: 'Laboratory Fee',
      feeHeadCode: 'LAB',
      feeHeadCategory: 'LABORATORY',
      amount: feeRecord.labFee || 8000,
      paidAmount: 0,
      outstandingAmount: feeRecord.labFee || 8000,
      status: 'PENDING' as const,
    },
    {
      id: 'item-3',
      studentFeeAccountId: feeRecord.id,
      feeHeadId: 'fh-dev',
      feeHeadName: 'Development Fee',
      feeHeadCode: 'DEV',
      feeHeadCategory: 'ACADEMIC',
      amount: feeRecord.developmentFee || 7000,
      paidAmount: 0,
      outstandingAmount: feeRecord.developmentFee || 7000,
      status: 'PENDING' as const,
    },
    ...(feeRecord.hostelFee ? [{
      id: 'item-4',
      studentFeeAccountId: feeRecord.id,
      feeHeadId: 'fh-hostel',
      feeHeadName: 'Hostel Accommodation',
      feeHeadCode: 'HOSTEL',
      feeHeadCategory: 'HOSTEL',
      amount: feeRecord.hostelFee,
      paidAmount: 0,
      outstandingAmount: feeRecord.hostelFee,
      status: 'PENDING' as const,
    }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-700 via-indigo-700 to-navy-800 text-white">
          <div className="flex items-center gap-2.5">
            <User className="w-6 h-6 text-blue-200" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Student Fee Account: {feeRecord.studentName}
              </h3>
              <p className="text-xs text-blue-100 opacity-90">
                Enrollment: {feeRecord.enrollmentNo} • {prog?.name || feeRecord.programId} • {sem?.code || feeRecord.semesterId}
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

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Tariff Due</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                ₹{Number(feeRecord.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Amount Paid</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{Number(feeRecord.paidAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">Outstanding Balance</span>
              <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                ₹{Number(feeRecord.pendingAmount || feeRecord.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">Account Status</span>
              <div className="mt-1">
                {feeRecord.status === 'PENDING' && <Badge variant="gold">Pending Payment</Badge>}
                {feeRecord.status === 'PAID' && <Badge variant="success">Paid in Full</Badge>}
                {feeRecord.status === 'PARTIALLY_PAID' && <Badge variant="warning">Partially Paid</Badge>}
                {feeRecord.status === 'OVERDUE' && <Badge variant="danger">Overdue</Badge>}
              </div>
            </div>
          </div>

          {/* Academic Context Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Fee Structure:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{feeRecord.feeStructureName || 'Annual Regular Structure'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Academic Term:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{feeRecord.academicYearCode || 'AY 2026-27'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Due Date:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{feeRecord.dueDate || '31 Aug 2026'}</span>
            </div>
          </div>

          {/* Fee Heads Breakdown Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Fee Head Item Breakdown
            </h4>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Fee Head</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Tariff Amount (₹)</th>
                    <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                    <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
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
                            {item.feeHeadName || fh?.name || item.feeHeadId}
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
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{Number(item.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          ₹{Number(item.outstandingAmount !== undefined ? item.outstandingAmount : item.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={item.status === 'PAID' ? 'success' : 'gold'}>
                            {item.status || 'PENDING'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-750 font-bold border-t border-slate-300 dark:border-slate-600">
                    <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Total Ledger Amount:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-slate-900 dark:text-white">
                      ₹{Number(feeRecord.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-emerald-600">
                      ₹{Number(feeRecord.paidAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-rose-600">
                      ₹{Number(feeRecord.pendingAmount || feeRecord.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Fee Account Statement
          </button>

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
