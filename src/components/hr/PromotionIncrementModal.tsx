import React, { useState } from 'react';
import { X, Award, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface PromotionIncrementModalProps {
  currentUser: UserType;
  mode: 'PROMOTION' | 'INCREMENT';
  onClose: () => void;
  onSuccess: () => void;
}

export const PromotionIncrementModal: React.FC<PromotionIncrementModalProps> = ({
  currentUser,
  mode,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const employees = db.getEmployees().filter(e => e.status === 'ACTIVE');
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const selectedEmp = employees.find(e => e.id === employeeId);

  // Promotion state
  const [proposedDesignation, setProposedDesignation] = useState('');
  const [proposedSalary, setProposedSalary] = useState<number>(selectedEmp ? Math.round(selectedEmp.salary * 1.2) : 90000);
  
  // Increment state
  const [incrementType, setIncrementType] = useState<'PERCENTAGE' | 'FLAT_AMOUNT'>('PERCENTAGE');
  const [incrementValue, setIncrementValue] = useState<number>(10);

  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('Annual appraisal performance excellence and institutional leadership.');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const calculatedNewSalary = selectedEmp 
    ? (incrementType === 'PERCENTAGE' 
        ? Math.round(selectedEmp.salary * (1 + incrementValue / 100))
        : selectedEmp.salary + incrementValue)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'PROMOTION') {
      if (!proposedDesignation.trim()) {
        setErrorMsg('Please specify proposed designation.');
        return;
      }
      const res = hrmsService.proposePromotion({
        employeeId,
        proposedDesignation,
        proposedSalary: Number(proposedSalary),
        effectiveDate,
        reason
      }, currentUser);

      if (res.success && res.promotion) {
        // Auto-approve if Super Admin / University Admin
        hrmsService.executePromotion(res.promotion.id, 'APPROVED', 'Approved by University Leadership', currentUser);
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = hrmsService.processSalaryIncrement({
        employeeId,
        incrementType,
        incrementValue: Number(incrementValue),
        effectiveDate,
        reason
      }, currentUser);

      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            {mode === 'PROMOTION' ? <Award className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            <h3 className="font-bold text-base">{mode === 'PROMOTION' ? 'Process Staff Promotion' : 'Process Salary Increment'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1">Select Employee *</label>
            <select 
              value={employeeId} 
              onChange={e => {
                setEmployeeId(e.target.value);
                const emp = employees.find(emp => emp.id === e.target.value);
                if (emp) {
                  setProposedSalary(Math.round(emp.salary * 1.2));
                }
              }} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId}) • {emp.designation}</option>
              ))}
            </select>
          </div>

          {selectedEmp && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Current Role:</span> <p className="font-semibold">{selectedEmp.designation}</p></div>
              <div><span className="text-slate-500">Current Salary:</span> <p className="font-bold text-blue-600">₹{selectedEmp.salary.toLocaleString()}/mo</p></div>
            </div>
          )}

          {mode === 'PROMOTION' ? (
            <>
              <div>
                <label className="block font-semibold mb-1">Proposed Designation *</label>
                <input 
                  type="text" 
                  value={proposedDesignation} 
                  onChange={e => setProposedDesignation(e.target.value)} 
                  placeholder="e.g. Professor & Head of Department" 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Proposed New Monthly Gross Salary (INR) *</label>
                <input 
                  type="number" 
                  value={proposedSalary} 
                  onChange={e => setProposedSalary(Number(e.target.value))} 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-purple-600" 
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Increment Type *</label>
                  <select 
                    value={incrementType} 
                    onChange={e => setIncrementType(e.target.value as any)} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT_AMOUNT">Flat Amount (INR)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Increment Value *</label>
                  <input 
                    type="number" 
                    value={incrementValue} 
                    onChange={e => setIncrementValue(Number(e.target.value))} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold" 
                  />
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Revised Monthly Salary:</span>
                <span className="font-bold text-purple-600 text-sm">₹{calculatedNewSalary.toLocaleString()}/mo</span>
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold mb-1">Effective Date *</label>
            <input 
              type="date" 
              value={effectiveDate} 
              onChange={e => setEffectiveDate(e.target.value)} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Sanction Remarks & Reason *</label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              rows={2} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
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
              className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 flex items-center gap-1.5 shadow-md shadow-purple-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Sanction {mode === 'PROMOTION' ? 'Promotion' : 'Increment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
