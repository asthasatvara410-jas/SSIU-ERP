import React, { useState } from 'react';
import { X, UserMinus, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface SeparationExitModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const SeparationExitModal: React.FC<SeparationExitModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const employees = db.getEmployees().filter(e => e.status === 'ACTIVE');
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const [separationType, setSeparationType] = useState<'RESIGNATION' | 'RETIREMENT' | 'TERMINATION' | 'CONTRACT_END' | 'TRANSFERRED_OUT' | 'OTHER'>('RESIGNATION');
  const [resignationDate, setResignationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [lastWorkingDay, setLastWorkingDay] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('Pursuing higher studies / Career advancement outside university.');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = hrmsService.initiateSeparation({
      employeeId,
      separationType,
      resignationDate,
      noticePeriodDays: Number(noticePeriodDays),
      lastWorkingDay,
      reason
    }, currentUser);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1050, padding: '1rem'
    }}>
      <div className="modal-container bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-700 to-red-800 text-white">
          <div className="flex items-center gap-3">
            <UserMinus className="w-5 h-5" />
            <h3 className="font-bold text-base">Initiate Employee Separation & Exit</h3>
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

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Full Audit & Clearance Lifecycle</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Initiating separation starts the mandatory departmental, library, asset return, finance, and HR clearance checklist. Employee history is permanently retained.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Select Employee *</label>
            <select 
              value={employeeId} 
              onChange={e => setEmployeeId(e.target.value)} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId}) • {emp.designation}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Separation Type *</label>
              <select 
                value={separationType} 
                onChange={e => setSeparationType(e.target.value as any)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="RESIGNATION">Voluntary Resignation</option>
                <option value="RETIREMENT">Superannuation / Retirement</option>
                <option value="CONTRACT_END">Contract Expiration</option>
                <option value="TERMINATION">Administrative Termination</option>
                <option value="TRANSFERRED_OUT">Transferred Out to Sister Campus</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Notice Period (Days) *</label>
              <input 
                type="number" 
                value={noticePeriodDays} 
                onChange={e => {
                  setNoticePeriodDays(Number(e.target.value));
                  const newLastDay = new Date(Date.now() + Number(e.target.value) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setLastWorkingDay(newLastDay);
                }} 
                min={0}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Resignation Date *</label>
              <input 
                type="date" 
                value={resignationDate} 
                onChange={e => setResignationDate(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Last Working Day *</label>
              <input 
                type="date" 
                value={lastWorkingDay} 
                onChange={e => setLastWorkingDay(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600" 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason for Separation *</label>
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
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 flex items-center gap-1.5 shadow-md shadow-rose-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Initiate Separation
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
