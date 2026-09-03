import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { StudentFeeRecord, StudentFeeItem, FeeInvoiceStatus } from '../../types';
import { X, Plus, Calendar, DollarSign, Layers, CheckCircle2, AlertTriangle, UserCheck, Info } from 'lucide-react';
import { Badge } from '../common/Badge';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: any) => void;
  initialFeeAccountId?: string;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFeeAccountId,
}) => {
  const feeRecords = useMemo(() => db.getStudentFeeRecords(), []);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return initialFeeAccountId || feeRecords[0]?.id || '';
  });

  const selectedAccount = useMemo(() => {
    return feeRecords.find(r => r.id === selectedAccountId) || feeRecords[0] || null;
  }, [feeRecords, selectedAccountId]);

  // Selected fee item IDs (defaults to all items with outstanding > 0)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Update selected item IDs when account changes
  React.useEffect(() => {
    if (selectedAccount?.items && selectedAccount.items.length > 0) {
      setSelectedItemIds(selectedAccount.items.filter(i => (i.outstandingAmount ?? i.amount) > 0).map(i => i.id));
    } else {
      setSelectedItemIds([]);
    }
  }, [selectedAccount]);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [status, setStatus] = useState<FeeInvoiceStatus>('ISSUED');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    if (selectedAccount?.items) {
      setSelectedItemIds(selectedAccount.items.map(i => i.id));
    }
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };

  // Calculate live total
  const items = selectedAccount?.items || [];
  const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
  const subtotal = selectedItems.reduce((sum, i) => sum + (i.outstandingAmount ?? i.amount), 0);
  const totalPayable = subtotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccount) {
      setError('Please select a student fee account.');
      return;
    }

    if (selectedItemIds.length === 0) {
      setError('Please select at least one fee head item to include in the invoice.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDate < todayStr) {
      setError('Due Date cannot be earlier than today.');
      return;
    }

    const result = db.generateFeeInvoice({
      studentFeeAccountId: selectedAccount.id,
      dueDate,
      status,
      feeItemIds: selectedItemIds,
      remarks: remarks.trim() || undefined,
      createdBy: 'admin',
    });

    if (result.success && result.invoice) {
      onSuccess(result.invoice);
      onClose();
    } else {
      setError(result.error || 'Failed to generate fee invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Generate Student Fee Demand / Invoice
              </h3>
              <p className="text-xs text-blue-100 opacity-90">
                Official Fee Demand Generation Engine
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Account Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Select Student Fee Account *
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            >
              {feeRecords.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.enrollmentNo} — {acc.studentName} ({acc.feeStructureName || 'Academic Fee'} • ₹{Number(acc.totalAmount).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Account Summary */}
          {selectedAccount && (
            <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Student: </span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedAccount.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500">Enrollment: </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedAccount.enrollmentNo}</span>
              </div>
              <div>
                <span className="text-slate-500">Academic Term: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAccount.academicYearCode || 'AY 2026-27'}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Tariff: </span>
                <span className="font-bold text-slate-900 dark:text-white">₹{Number(selectedAccount.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Fee Items Selection (Partial selection support) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>Select Fee Items for this Demand ({selectedItems.length}/{items.length})</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllItems}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllItems}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700 max-h-48 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No line items found on this fee account.
                </div>
              ) : (
                items.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.feeHeadName || item.feeHeadId}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {item.feeHeadCode || 'FEE_ITEM'} • {item.feeHeadCategory || 'ACADEMIC'}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{Number(item.outstandingAmount ?? item.amount).toLocaleString('en-IN')}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Form Fields: Due Date, Status, Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Payment Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Initial Demand Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="ISSUED">ISSUED (Official Demand)</option>
                <option value="DRAFT">DRAFT (Review pending)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Administrative Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Regular Semester 5 Fee Demand"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Total Calculated Amount Card */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex justify-between items-center">
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                Total Invoiced Amount
              </span>
              <span className="text-xs text-slate-300">{selectedItems.length} fee heads selected</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">
                ₹{totalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              Generate Demand / Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
