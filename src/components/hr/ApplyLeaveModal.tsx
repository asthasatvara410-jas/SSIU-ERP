import React, { useState } from 'react';
import { X, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { LeaveType, User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface ApplyLeaveModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const employees = db.getEmployees().filter(e => e.status === 'ACTIVE');
  const [employeeId, setEmployeeId] = useState<string>(
    employees.find(e => e.userId === currentUser.id || e.email === currentUser.email)?.id || employees[0]?.id || ''
  );

  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const balances = employeeId ? hrmsService.getLeaveBalances(employeeId) : [];
  const currentBal = balances.find(b => b.leaveType === leaveType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Please specify the reason for taking leave.');
      return;
    }

    const res = hrmsService.applyLeave({
      employeeId,
      leaveType,
      startDate,
      endDate,
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
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-base">Apply Employee Leave Application</h3>
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
              onChange={e => setEmployeeId(e.target.value)} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId}) • {emp.designation}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Leave Category *</label>
            <select 
              value={leaveType} 
              onChange={e => setLeaveType(e.target.value as any)} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="SICK">Sick / Medical Leave (SL)</option>
              <option value="EARNED">Earned / Privilege Leave (EL)</option>
              <option value="DUTY_LEAVE">Duty Leave (On Official University Business)</option>
              <option value="SPECIAL_LEAVE">Special / Academic Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="STUDY_LEAVE">Study Leave (Ph.D / Research)</option>
              <option value="UNPAID">Leave Without Pay (LWP)</option>
            </select>
          </div>

          {currentBal && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Available <strong>{leaveType}</strong> Balance:</span>
              <span className="font-bold text-blue-600 text-sm">{currentBal.remaining} Day(s) Remaining</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Start Date *</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date *</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason for Leave *</label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              rows={3} 
              placeholder="Provide clear reason for absence..."
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
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Application
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
