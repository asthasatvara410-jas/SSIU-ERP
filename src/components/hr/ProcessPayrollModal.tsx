import React, { useState } from 'react';
import { X, DollarSign, Calculator, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface ProcessPayrollModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessPayrollModal: React.FC<ProcessPayrollModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const [month, setMonth] = useState<string>(months[currentMonthIdx]);
  const [year, setYear] = useState<number>(currentYear);
  const [workingDays, setWorkingDays] = useState<number>(26);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeEmployees = db.getEmployees().filter(e => e.status === 'ACTIVE');
  const totalEstimatedGross = activeEmployees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = hrmsService.calculateMonthlyPayroll(month, Number(year), Number(workingDays), currentUser);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing payroll calculation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5" />
            <h3 className="font-bold text-base">Calculate Monthly Payroll</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCalculate} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Active Staff Headcount:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {activeEmployees.length} Staff Members
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Estimated Monthly Gross:</span>
              <span className="font-bold text-emerald-600 text-sm">₹{totalEstimatedGross.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Select Month *</label>
              <select 
                value={month} 
                onChange={e => setMonth(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Calendar Year *</label>
              <input 
                type="number" 
                value={year} 
                onChange={e => setYear(Number(e.target.value))} 
                min={2020} 
                max={2030}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold" 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Standard Working Days in Month *</label>
            <input 
              type="number" 
              value={workingDays} 
              onChange={e => setWorkingDays(Number(e.target.value))} 
              min={20} 
              max={31}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold" 
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500 text-[11px] leading-relaxed">
            Automatic calculation links verified attendance rosters, approved leave balances, PF (12% of Basic), Professional Tax, and TDS brackets to generate itemized payslips.
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> {isProcessing ? 'Processing...' : 'Run Payroll Engine'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
