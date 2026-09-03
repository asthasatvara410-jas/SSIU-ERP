import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { db } from '../../services/db';
import { hrmsService } from '../../services/hrmsService';
import { User as UserType } from '../../types';
import { useModalScrollLock } from '../../utils/modalScrollLock';

interface TransferEmployeeModalProps {
  currentUser: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferEmployeeModal: React.FC<TransferEmployeeModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  useModalScrollLock(true, onClose);

  const employees = db.getEmployees().filter(e => e.status === 'ACTIVE');
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();

  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const selectedEmp = employees.find(e => e.id === employeeId);

  const [toInstituteId, setToInstituteId] = useState<string>(institutes[0]?.id || 'inst-1');
  const [toDepartmentId, setToDepartmentId] = useState<string>(departments[0]?.id || 'dept-1');
  const [toDesignation, setToDesignation] = useState<string>(selectedEmp?.designation || '');
  const [transferType, setTransferType] = useState<'DEPARTMENT' | 'INSTITUTE' | 'ROLE' | 'LOCATION'>('DEPARTMENT');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('Administrative realignment and departmental resource optimization.');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = hrmsService.transferEmployee({
      employeeId,
      toInstituteId,
      toDepartmentId,
      toDesignation,
      transferType,
      effectiveDate,
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
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-700 to-cyan-800 text-white">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5" />
            <h3 className="font-bold text-base">Transfer Employee</h3>
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
                const emp = employees.find(x => x.id === e.target.value);
                if (emp) setToDesignation(emp.designation);
              }} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId}) • {emp.departmentName || 'Admin'}</option>
              ))}
            </select>
          </div>

          {selectedEmp && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
              <span className="text-slate-500">Current Deployment:</span>
              <p className="font-semibold">{selectedEmp.departmentName || 'General Administration'} ({selectedEmp.instituteName || 'SSIU Campus'})</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Institute *</label>
              <select 
                value={toInstituteId} 
                onChange={e => setToInstituteId(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Target Department *</label>
              <select 
                value={toDepartmentId} 
                onChange={e => setToDepartmentId(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Transfer Type *</label>
              <select 
                value={transferType} 
                onChange={e => setTransferType(e.target.value as any)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="DEPARTMENT">Department Transfer</option>
                <option value="INSTITUTE">Institute Transfer</option>
                <option value="ROLE">Role / Designation Transfer</option>
                <option value="LOCATION">Campus Location Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Effective Date *</label>
              <input 
                type="date" 
                value={effectiveDate} 
                onChange={e => setEffectiveDate(e.target.value)} 
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Designation</label>
            <input 
              type="text" 
              value={toDesignation} 
              onChange={e => setToDesignation(e.target.value)} 
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" 
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Transfer Reason *</label>
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
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Execute Transfer
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
