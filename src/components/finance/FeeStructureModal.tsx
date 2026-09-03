import React, { useState, useEffect } from 'react';
import { FeeStructure, FeeStructureItem, FeeHead, FeeFrequency, FeeStructureStatus } from '../../types';
import { db } from '../../services/db';
import { X, Check, Plus, Trash2, AlertTriangle, Printer, Layers, DollarSign, Calendar, Copy } from 'lucide-react';
import { Badge } from '../common/Badge';

interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  onDuplicate?: (id: string, targetYear: string, name?: string) => { success: boolean; error?: string };
  initialData?: FeeStructure | null;
  mode: 'ADD' | 'EDIT' | 'VIEW' | 'DUPLICATE' | 'PRINT';
}

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDuplicate,
  initialData,
  mode,
}) => {
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const academicYears = db.getAcademicYears();
  const feeHeads = db.getFeeHeads().filter(f => f.status === 'ACTIVE');

  // Form State
  const [instituteId, setInstituteId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [academicYearCode, setAcademicYearCode] = useState('2026-27');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [status, setStatus] = useState<FeeStructureStatus>('DRAFT');

  // Duplicate Target Year
  const [duplicateTargetYear, setDuplicateTargetYear] = useState('2027-28');
  const [duplicateName, setDuplicateName] = useState('');

  // Dynamic Fee Items
  const [items, setItems] = useState<Omit<FeeStructureItem, 'id' | 'feeStructureId'>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Fee Item draft row
  const [selectedFeeHeadId, setSelectedFeeHeadId] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number>(0);
  const [newItemMandatory, setNewItemMandatory] = useState<boolean>(true);
  const [newItemFrequency, setNewItemFrequency] = useState<FeeFrequency>('PER_SEMESTER');

  useEffect(() => {
    if (initialData && (mode === 'EDIT' || mode === 'VIEW' || mode === 'PRINT')) {
      setInstituteId(initialData.instituteId || institutes[0]?.id || '');
      setDepartmentId(initialData.departmentId || departments[0]?.id || '');
      setProgramId(initialData.programId);
      setSemesterId(initialData.semesterId);
      setAcademicYearCode(initialData.academicYearCode || '2026-27');
      setName(initialData.name);
      setDescription(initialData.description || '');
      setDueDate(initialData.dueDate || '');
      setEffectiveFrom(initialData.effectiveFrom || '');
      setEffectiveTo(initialData.effectiveTo || '');
      setStatus(initialData.status);

      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items.map(i => ({
          feeHeadId: i.feeHeadId,
          amount: i.amount,
          isMandatory: i.isMandatory !== undefined ? i.isMandatory : !i.isOptional,
          isOptional: i.isOptional !== undefined ? i.isOptional : !i.isMandatory,
          frequency: i.frequency || 'PER_SEMESTER',
          sequence: i.sequence || 1,
          description: i.description,
        })));
      } else {
        // Fallback for old records
        const fallbackItems: Omit<FeeStructureItem, 'id' | 'feeStructureId'>[] = [];
        if (initialData.tuitionFee) {
          const fh = feeHeads.find(f => f.code === 'TUITION') || feeHeads[0];
          if (fh) fallbackItems.push({ feeHeadId: fh.id, amount: initialData.tuitionFee, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 1 });
        }
        if (initialData.labFee) {
          const fh = feeHeads.find(f => f.code === 'LAB') || feeHeads[1];
          if (fh) fallbackItems.push({ feeHeadId: fh.id, amount: initialData.labFee, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 2 });
        }
        if (initialData.developmentFee) {
          const fh = feeHeads.find(f => f.code === 'EXAM') || feeHeads[2];
          if (fh) fallbackItems.push({ feeHeadId: fh.id, amount: initialData.developmentFee, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 3 });
        }
        setItems(fallbackItems);
      }
    } else if (initialData && mode === 'DUPLICATE') {
      setDuplicateTargetYear('2027-28');
      setDuplicateName(`${initialData.name} (2027-28)`);
    } else {
      // ADD Mode defaults
      const defaultProg = programs[0]?.id || '';
      const defaultSem = semesters[0]?.id || '';
      const defaultInst = institutes[0]?.id || '';
      const defaultDept = departments[0]?.id || '';

      setInstituteId(defaultInst);
      setDepartmentId(defaultDept);
      setProgramId(defaultProg);
      setSemesterId(defaultSem);
      setAcademicYearCode('2026-27');
      setName('B.Tech CSE Semester 5 Fee Structure (AY 2026-27)');
      setDescription('Standard academic and laboratory fee schedule');
      setDueDate('2026-08-31');
      setEffectiveFrom('2026-07-01');
      setEffectiveTo('2027-06-30');
      setStatus('DRAFT');

      // Preload standard default items
      const defaultTuition = feeHeads.find(f => f.code === 'TUITION');
      const defaultExam = feeHeads.find(f => f.code === 'EXAM');
      const defaultLab = feeHeads.find(f => f.code === 'LAB');

      const initialRows: Omit<FeeStructureItem, 'id' | 'feeStructureId'>[] = [];
      if (defaultTuition) initialRows.push({ feeHeadId: defaultTuition.id, amount: defaultTuition.defaultAmount || 45000, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 1 });
      if (defaultLab) initialRows.push({ feeHeadId: defaultLab.id, amount: defaultLab.defaultAmount || 8000, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 2 });
      if (defaultExam) initialRows.push({ feeHeadId: defaultExam.id, amount: defaultExam.defaultAmount || 2500, isMandatory: true, isOptional: false, frequency: 'PER_SEMESTER', sequence: 3 });

      setItems(initialRows);
    }
    setErrorMessage(null);
  }, [initialData, mode, isOpen]);

  // When Fee Head selection in Add Row changes, auto-set default amount
  const handleSelectFeeHead = (fhId: string) => {
    setSelectedFeeHeadId(fhId);
    const fh = feeHeads.find(f => f.id === fhId);
    if (fh) {
      setNewItemAmount(fh.defaultAmount || 0);
      setNewItemMandatory(fh.isMandatory !== undefined ? fh.isMandatory : true);
    }
  };

  const handleAddItem = () => {
    if (!selectedFeeHeadId) {
      setErrorMessage('Please select a Fee Head.');
      return;
    }
    if (items.some(i => i.feeHeadId === selectedFeeHeadId)) {
      setErrorMessage('This Fee Head is already added in the structure.');
      return;
    }
    if (newItemAmount < 0) {
      setErrorMessage('Amount cannot be negative.');
      return;
    }

    setItems([
      ...items,
      {
        feeHeadId: selectedFeeHeadId,
        amount: Number(newItemAmount),
        isMandatory: newItemMandatory,
        isOptional: !newItemMandatory,
        frequency: newItemFrequency,
        sequence: items.length + 1,
      },
    ]);

    setSelectedFeeHeadId('');
    setNewItemAmount(0);
    setErrorMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemAmountChange = (index: number, newAmount: number) => {
    const updated = [...items];
    updated[index].amount = Math.max(0, newAmount);
    setItems(updated);
  };

  const handleItemMandatoryToggle = (index: number) => {
    const updated = [...items];
    updated[index].isMandatory = !updated[index].isMandatory;
    updated[index].isOptional = !updated[index].isMandatory;
    setItems(updated);
  };

  // Calculations
  const mandatorySubtotal = items.filter(i => i.isMandatory).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const optionalSubtotal = items.filter(i => !i.isMandatory).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalAmount = mandatorySubtotal + optionalSubtotal;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'DUPLICATE' && initialData && onDuplicate) {
      if (!duplicateTargetYear.trim()) {
        setErrorMessage('Target Academic Year is required.');
        return;
      }
      const res = onDuplicate(initialData.id, duplicateTargetYear.trim(), duplicateName.trim() || undefined);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to duplicate structure.');
      } else {
        onClose();
      }
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Fee Structure Name is required.');
      return;
    }
    if (!programId) {
      setErrorMessage('Academic Program is required.');
      return;
    }
    if (!semesterId) {
      setErrorMessage('Semester is required.');
      return;
    }
    if (!academicYearCode.trim()) {
      setErrorMessage('Academic Year Code is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('At least one Fee Head item must be configured in the structure.');
      return;
    }

    const payload: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'> = {
      structureCode: initialData?.structureCode || `FS-${programId}-${semesterId}-${academicYearCode.replace(/\s+/g, '')}-V1`.toUpperCase(),
      instituteId: instituteId || undefined,
      departmentId: departmentId || undefined,
      programId,
      semesterId,
      academicYearCode: academicYearCode.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      totalAmount,
      dueDate: dueDate || undefined,
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: effectiveTo || undefined,
      status,
      version: initialData?.version || 1,
      items: items.map((i, idx) => ({
        id: `fsi-${idx}`,
        feeStructureId: initialData?.id || '',
        feeHeadId: i.feeHeadId,
        amount: Number(i.amount),
        isMandatory: i.isMandatory,
        isOptional: !i.isMandatory,
        frequency: i.frequency || 'PER_SEMESTER',
        sequence: idx + 1,
        description: i.description,
      })),
      createdBy: 'University Accounts Administrator',
    };

    const res = onSave(payload);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save Fee Structure.');
    } else {
      onClose();
    }
  };

  const isReadOnly = mode === 'VIEW' || mode === 'PRINT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-700 via-indigo-700 to-navy-800 text-white">
          <div className="flex items-center gap-2.5">
            {mode === 'DUPLICATE' ? <Copy className="w-6 h-6 text-amber-300" /> : <Layers className="w-6 h-6 text-blue-200" />}
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {mode === 'ADD' && 'Create University Fee Structure'}
                {mode === 'EDIT' && `Edit Fee Structure: ${initialData?.name}`}
                {mode === 'VIEW' && `Fee Structure: ${initialData?.name}`}
                {mode === 'DUPLICATE' && `Duplicate Fee Structure: ${initialData?.name}`}
                {mode === 'PRINT' && 'Official Fee Structure Preview'}
              </h3>
              <p className="text-xs text-blue-100 opacity-90">
                {mode === 'DUPLICATE'
                  ? 'Clone structure to next academic term as a new DRAFT copy'
                  : 'Define program, term fees, mandatory/optional breakdown & financial amounts'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* DUPLICATE MODE BODY */}
          {mode === 'DUPLICATE' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <p className="font-bold">Source Fee Structure: {initialData?.name}</p>
                <p>Program: {programs.find(p => p.id === initialData?.programId)?.name || initialData?.programId}</p>
                <p>Semester: {semesters.find(s => s.id === initialData?.semesterId)?.code || semesters.find(s => s.id === initialData?.semesterId)?.number || initialData?.semesterId}</p>
                <p>Current Total: <strong>₹{Number(initialData?.totalAmount || 0).toLocaleString('en-IN')}</strong> ({initialData?.items?.length || 0} items configured)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Target Academic Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={duplicateTargetYear}
                  onChange={(e) => setDuplicateTargetYear(e.target.value)}
                  placeholder="e.g. 2027-28"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  New Structure Name
                </label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="e.g. B.Tech CSE Semester 5 Fee Structure (AY 2027-28)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Creates a new DRAFT structure. The original structure will remain unchanged.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: MASTER MAPPING */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Program */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Academic Program <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code || `Semester ${s.number}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    required
                    value={academicYearCode}
                    onChange={(e) => setAcademicYearCode(e.target.value)}
                    placeholder="2026-27"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: NAME & METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Structure Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science Sem 5 Regular Fee"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FeeStructureStatus)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="DRAFT">DRAFT (Under Preparation)</option>
                      <option value="ACTIVE">ACTIVE (Ready for Billing)</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DYNAMIC FEE ITEMS TABLE */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">
                      Fee Heads & Financial Item Breakdown
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Configured items: <strong>{items.length}</strong>
                  </span>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Fee Head Name & Code</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 w-36">Amount (₹)</th>
                        <th className="py-2.5 px-3 w-28">Type</th>
                        <th className="py-2.5 px-3 w-32">Frequency</th>
                        {!isReadOnly && <th className="py-2.5 px-3 w-16 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                            No fee items configured. Click "+ Add Fee Head" below.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => {
                          const fh = feeHeads.find(f => f.id === item.feeHeadId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {fh?.name || item.feeHeadId}
                                </div>
                                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                                  {fh?.code || 'FEE_HEAD'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="navy">{fh?.category || 'ACADEMIC'}</Badge>
                              </td>
                              <td className="py-2.5 px-3">
                                {isReadOnly ? (
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    ₹{Number(item.amount).toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.amount}
                                    onChange={(e) => handleItemAmountChange(idx, parseFloat(e.target.value) || 0)}
                                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono font-bold text-right text-xs"
                                  />
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {isReadOnly ? (
                                  item.isMandatory ? <Badge variant="warning">Mandatory</Badge> : <Badge variant="inactive">Optional</Badge>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleItemMandatoryToggle(idx)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${
                                      item.isMandatory
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {item.isMandatory ? 'Mandatory' : 'Optional'}
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                                {item.frequency || 'PER_SEMESTER'}
                              </td>
                              {!isReadOnly && (
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ADD NEW ITEM ROW FORM (When not read-only) */}
                {!isReadOnly && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={selectedFeeHeadId}
                        onChange={(e) => handleSelectFeeHead(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                      >
                        <option value="">-- Select Fee Head to Add --</option>
                        {feeHeads.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.code} - {f.name} (₹{f.defaultAmount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min={0}
                        placeholder="Amount"
                        value={newItemAmount || ''}
                        onChange={(e) => setNewItemAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono text-right text-xs"
                      />
                    </div>

                    <div>
                      <select
                        value={newItemMandatory ? 'YES' : 'NO'}
                        onChange={(e) => setNewItemMandatory(e.target.value === 'YES')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                      >
                        <option value="YES">Mandatory</option>
                        <option value="NO">Optional</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={newItemFrequency}
                        onChange={(e) => setNewItemFrequency(e.target.value as FeeFrequency)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                      >
                        <option value="PER_SEMESTER">Per Semester</option>
                        <option value="ONE_TIME">One Time</option>
                        <option value="PER_YEAR">Per Year</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Fee
                    </button>
                  </div>
                )}

                {/* AUTOMATIC TOTAL BAR */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap justify-between items-center gap-4 shadow-inner">
                  <div className="flex gap-6 text-xs text-slate-300">
                    <div>
                      <span>Mandatory Subtotal:</span>{' '}
                      <strong className="text-white font-mono text-sm">₹{mandatorySubtotal.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>Optional / Add-ons:</span>{' '}
                      <strong className="text-amber-300 font-mono text-sm">₹{optionalSubtotal.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Total Fee Structure:</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3">
            <div>
              {mode === 'PRINT' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Schedule
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>

              {!isReadOnly && (
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {mode === 'ADD' && 'Save Fee Structure'}
                  {mode === 'EDIT' && 'Update Fee Structure'}
                  {mode === 'DUPLICATE' && 'Duplicate to New Term'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
