import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { FeeStructure } from '../../types';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import {
  UserCheck, Users, DollarSign, CheckCircle2, AlertTriangle, Search,
  Check, ArrowRight, ShieldAlert, Sparkles, Layers, Info, Filter
} from 'lucide-react';

export const FeeAssignmentTab: React.FC = () => {
  const activeFeeStructures = useMemo(() => {
    return db.getFeeStructures().filter(f => f.status === 'ACTIVE');
  }, []);

  const [selectedStructureId, setSelectedStructureId] = useState<string>(() => {
    return activeFeeStructures[0]?.id || '';
  });

  const selectedStructure = useMemo(() => {
    return activeFeeStructures.find(f => f.id === selectedStructureId) || activeFeeStructures[0] || null;
  }, [activeFeeStructures, selectedStructureId]);

  // Search and filter in students list
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNASSIGNED_ONLY'>('UNASSIGNED_ONLY');

  // Selected student IDs for assignment
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Feedback Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: string[];
  } | null>(null);

  // Eligible students for the chosen structure
  const eligibleStudents = useMemo(() => {
    if (!selectedStructure) return [];
    return db.getEligibleStudentsForFeeStructure(selectedStructure.id);
  }, [selectedStructure]);

  // Filtered students for display
  const displayedStudents = useMemo(() => {
    return eligibleStudents.filter((s) => {
      const matchesSearch =
        searchTerm === '' ||
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.erpId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterMode === 'ALL' || (!s.isAlreadyAssigned && filterMode === 'UNASSIGNED_ONLY');

      return matchesSearch && matchesFilter;
    });
  }, [eligibleStudents, searchTerm, filterMode]);

  // Select all unassigned students in displayed list
  const handleSelectAllUnassigned = () => {
    const unassignedIds = displayedStudents.filter(s => !s.isAlreadyAssigned).map(s => s.id);
    setSelectedStudentIds(unassignedIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  // Calculations for Step 3 Summary
  const selectedCount = selectedStudentIds.length;
  const feePerStudent = selectedStructure ? Number(selectedStructure.totalAmount || 0) : 0;
  const totalAssignedAmount = selectedCount * feePerStudent;

  const handleAssignFees = () => {
    setNotification(null);

    if (!selectedStructure) {
      setNotification({ type: 'error', message: 'Please select an Active Fee Structure.' });
      return;
    }
    if (selectedCount === 0) {
      setNotification({ type: 'error', message: 'Please select at least one eligible student to assign fees.' });
      return;
    }

    const result = db.assignFeeStructureToStudents(selectedStructure.id, selectedStudentIds);

    if (result.success) {
      setNotification({
        type: 'success',
        message: `Successfully created Student Fee Accounts for ${result.assignedCount} student(s). Total Ledger: ₹${(result.assignedCount * feePerStudent).toLocaleString('en-IN')}`,
        details: result.duplicateStudents && result.duplicateStudents.length > 0 ? [
          `Skipped ${result.alreadyAssignedCount} student(s) who already have this fee assigned:`,
          ...result.duplicateStudents.slice(0, 5),
        ] : undefined,
      });
      // Clear selection
      setSelectedStudentIds([]);
    } else {
      setNotification({
        type: 'error',
        message: result.errors?.join(', ') || 'Failed to assign fee structure.',
      });
    }
  };

  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const selectedProg = programs.find(p => p.id === selectedStructure?.programId);
  const selectedSem = semesters.find(s => s.id === selectedStructure?.semesterId);

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-sm animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-bold">{notification.message}</p>
            {notification.details && (
              <ul className="text-xs list-disc list-inside space-y-0.5 opacity-90">
                {notification.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: SELECT ACTIVE FEE STRUCTURE */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 1 of 4
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.2rem 0 0 0' }}>
              Select Active University Fee Structure
            </h3>
          </div>
          <Badge variant="success">Active Tariffs Only</Badge>
        </div>

        {activeFeeStructures.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
            No active fee structures found. Please create and activate a fee structure in the "Fee Structures" tab first.
          </div>
        ) : (
          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Fee Structure Tariff Schedule *</label>
              <select
                value={selectedStructureId}
                onChange={(e) => {
                  setSelectedStructureId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="form-select"
                style={{ fontWeight: 600 }}
              >
                {activeFeeStructures.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.structureCode || 'FS'} — {fs.name} (₹{Number(fs.totalAmount).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {selectedStructure && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Program &amp; Term:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedProg?.code || selectedStructure.programId} • {selectedSem?.code || selectedStructure.semesterId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStructure.academicYearCode || '2026-27'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee per Student:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{Number(selectedStructure.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: ELIGIBLE STUDENTS SELECTION TABLE */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 2 of 4
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0.2rem 0 0 0' }}>
              Select Eligible Students for Fee Assignment
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Filtered automatically by program: <strong>{selectedProg?.name || selectedStructure?.programId}</strong>
            </p>
          </div>

          {/* Quick Select & Filter Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleSelectAllUnassigned}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Check size={14} />
              Select All Unassigned
            </button>
            <button
              onClick={handleDeselectAll}
              className="btn btn-secondary btn-sm"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by student name or enrollment no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} style={{ color: '#64748b' }} />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem' }}
            >
              <option value="UNASSIGNED_ONLY">Unassigned Students Only</option>
              <option value="ALL">All Eligible Students</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', width: '40px', textAlign: 'center' }}>Select</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Enrollment No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Program &amp; Term</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Academic Year</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Assignment Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    <Users size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No students found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((stu) => {
                  const isChecked = selectedStudentIds.includes(stu.id);
                  const isAssigned = stu.isAlreadyAssigned;

                  return (
                    <tr
                      key={stu.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isChecked ? 'rgba(37, 99, 235, 0.05)' : isAssigned ? '#fcfcfd' : 'transparent',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={isAssigned}
                          checked={isChecked}
                          onChange={() => handleToggleStudent(stu.id)}
                          style={{ cursor: isAssigned ? 'not-allowed' : 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>

                      {/* Enrollment */}
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {stu.enrollmentNo}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                        {stu.studentName}
                      </td>

                      {/* Program */}
                      <td style={{ padding: '0.75rem', color: '#475569' }}>
                        {selectedProg?.code || stu.programId} • {selectedSem?.code || `Sem ${stu.currentSemester || 5}`}
                      </td>

                      {/* Year */}
                      <td style={{ padding: '0.75rem' }}>
                        <Badge variant="navy">{stu.academicYear || '2026-27'}</Badge>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {isAssigned ? (
                          <Badge variant="gold">Already Assigned (Pending)</Badge>
                        ) : (
                          <Badge variant="success">Eligible</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STEP 3 & 4: ASSIGNMENT SUMMARY & ACTION BUTTON */}
      <div className="card" style={{ padding: '1.5rem', background: '#0f172a', color: '#ffffff', borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Summary Info */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 3: Assignment Summary
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#60a5fa', marginTop: '0.2rem' }}>
                {selectedCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#cbd5e1' }}>Students Selected</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tariff per Student
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: '#ffffff', marginTop: '0.2rem' }}>
                ₹{feePerStudent.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expected Total Assigned Amount
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: '#34d399', marginTop: '0.2rem' }}>
                ₹{totalAssignedAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              onClick={handleAssignFees}
              disabled={selectedCount === 0}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: selectedCount > 0 ? 'var(--brand-orange)' : '#475569',
                borderColor: selectedCount > 0 ? 'var(--brand-orange)' : '#475569',
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedCount > 0 ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)' : 'none',
              }}
            >
              <UserCheck size={18} />
              Assign Fees ({selectedCount})
            </button>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={14} style={{ color: '#38bdf8' }} />
          <span>
            This is an academic fee assignment ledger creation. Duplicate assignments for the same semester are automatically blocked by the transactional engine.
          </span>
        </div>
      </div>
    </div>
  );
};
