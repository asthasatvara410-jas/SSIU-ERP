import React, { useState, useEffect } from 'react';
import { FeeHead, FeeHeadCategory } from '../../types';
import { X, Check, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

interface FeeHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feeHeadData: Omit<FeeHead, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  initialData?: FeeHead | null;
  mode: 'ADD' | 'EDIT' | 'VIEW';
  categories: { code: FeeHeadCategory; label: string }[];
}

export const FeeHeadModal: React.FC<FeeHeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  categories,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeeHeadCategory>('ACADEMIC');
  const [defaultAmount, setDefaultAmount] = useState<number>(0);
  const [isMandatory, setIsMandatory] = useState(true);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setDefaultAmount(initialData.defaultAmount || 0);
      setIsMandatory(initialData.isMandatory !== undefined ? initialData.isMandatory : true);
      setStatus(initialData.status);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setCategory('ACADEMIC');
      setDefaultAmount(0);
      setIsMandatory(true);
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) {
      setErrorMessage('Fee Code is required.');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Fee Name is required.');
      return;
    }
    if (!category) {
      setErrorMessage('Fee Category is required.');
      return;
    }
    if (defaultAmount < 0) {
      setErrorMessage('Default amount cannot be negative.');
      return;
    }

    const payload: Omit<FeeHead, 'id' | 'createdAt' | 'updatedAt'> = {
      code: cleanCode,
      name: cleanName,
      description: description.trim() || undefined,
      category,
      defaultAmount: Number(defaultAmount),
      isMandatory,
      isOptional: !isMandatory,
      isActive: status === 'ACTIVE',
      status,
      createdBy: 'University Accounts Admin',
    };

    const res = onSave(payload);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save Fee Head. Duplicate code?');
    } else {
      onClose();
    }
  };

  const isReadOnly = mode === 'VIEW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-200" />
            <h3 className="font-bold text-lg">
              {mode === 'ADD' && 'Add University Fee Head Master'}
              {mode === 'EDIT' && `Edit Fee Head: ${initialData?.code}`}
              {mode === 'VIEW' && `Fee Head Details: ${initialData?.code}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fee Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Fee Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={mode !== 'ADD'}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TUITION, EXAM, HOSTEL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono disabled:opacity-60"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Unique identifier for this fee master</span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={category}
                onChange={(e) => setCategory(e.target.value as FeeHeadCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Fee Head Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Academic Tuition & Instruction Fee"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Description / Financial Notes
            </label>
            <textarea
              disabled={isReadOnly}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of coverage, terms, and applicable university rules..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Default Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Default Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  disabled={isReadOnly}
                  min={0}
                  step="0.01"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Mandatory / Optional */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                disabled={isReadOnly}
                value={isMandatory ? 'MANDATORY' : 'OPTIONAL'}
                onChange={(e) => setIsMandatory(e.target.value === 'MANDATORY')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              >
                <option value="MANDATORY">Mandatory Fee</option>
                <option value="OPTIONAL">Optional / Add-on</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                disabled={isReadOnly}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 font-medium"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          {mode === 'VIEW' && initialData && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="font-semibold">{new Date(initialData.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-semibold">{new Date(initialData.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Created By:</span>
                <span className="font-semibold">{initialData.createdBy || 'System Administrator'}</span>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {mode === 'VIEW' ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {mode === 'ADD' ? 'Save Fee Head' : 'Update Fee Head'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
