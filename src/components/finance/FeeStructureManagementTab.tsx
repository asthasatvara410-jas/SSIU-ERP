import React, { useState } from 'react';
import { FeeStructure, FeeStructureStatus } from '../../types';
import { db } from '../../services/db';
import { FeeStructureModal } from './FeeStructureModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import {
  DollarSign, Plus, Search, Eye, Edit2, Power, Copy,
  CheckCircle2, AlertCircle, Layers, Printer, Sparkles, FileText
} from 'lucide-react';

export const FeeStructureManagementTab: React.FC = () => {
  const [structures, setStructures] = useState<FeeStructure[]>(() => db.getFeeStructures());
  const programs = db.getPrograms();
  const semesters = db.getSemesters();

  const [searchTerm, setSearchTerm] = useState('');
  const [progFilter, setProgFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | 'VIEW' | 'DUPLICATE' | 'PRINT'>('ADD');
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  // Status Change Dialog State
  const [togglingStructure, setTogglingStructure] = useState<FeeStructure | null>(null);

  const refreshList = () => {
    setStructures(db.getFeeStructures());
  };

  const handleOpenAdd = () => {
    setSelectedStructure(null);
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fs: FeeStructure) => {
    setSelectedStructure(fs);
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  const handleOpenView = (fs: FeeStructure) => {
    setSelectedStructure(fs);
    setModalMode('VIEW');
    setIsModalOpen(true);
  };

  const handleOpenDuplicate = (fs: FeeStructure) => {
    setSelectedStructure(fs);
    setModalMode('DUPLICATE');
    setIsModalOpen(true);
  };

  const handleOpenPrint = (fs: FeeStructure) => {
    setSelectedStructure(fs);
    setModalMode('PRINT');
    setIsModalOpen(true);
  };

  const handleSaveStructure = (data: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modalMode === 'ADD') {
      db.addFeeStructure(data);
    } else if (modalMode === 'EDIT' && selectedStructure) {
      db.updateFeeStructure(selectedStructure.id, data);
    }
    refreshList();
    return { success: true };
  };

  const handleDuplicateStructure = (id: string, targetYear: string, name?: string) => {
    const res = db.duplicateFeeStructure(id, targetYear, name);
    if (!res) return { success: false, error: 'Failed to duplicate fee structure.' };
    refreshList();
    return { success: true };
  };

  const handleConfirmToggleStatus = () => {
    if (togglingStructure) {
      if (togglingStructure.status === 'ACTIVE') {
        db.deactivateFeeStructure(togglingStructure.id);
      } else {
        db.activateFeeStructure(togglingStructure.id);
      }
      refreshList();
      setTogglingStructure(null);
    }
  };

  // Filtered List
  const filteredStructures = structures.filter((item) => {
    const pName = programs.find(p => p.id === item.programId)?.name || '';
    const pCode = programs.find(p => p.id === item.programId)?.code || '';

    const matchesSearch =
      searchTerm === '' ||
      (item.structureCode && item.structureCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProg = progFilter === 'ALL' || item.programId === progFilter;
    const matchesSem = semFilter === 'ALL' || item.semesterId === semFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesProg && matchesSem && matchesStatus;
  });

  // KPI calculations
  const totalCount = structures.length;
  const activeCount = structures.filter(f => f.status === 'ACTIVE').length;
  const draftCount = structures.filter(f => f.status === 'DRAFT').length;
  const totalDemand = structures.reduce((sum, f) => sum + Number(f.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard
          icon={Layers}
          title="Total Fee Structures"
          value={totalCount}
          subtitle="Program & Semester Schedules"
          colorScheme="navy"
        />
        <StatCard
          icon={CheckCircle2}
          title="Active Structures"
          value={activeCount}
          subtitle="Active for Student Fee Billing"
          colorScheme="green"
        />
        <StatCard
          icon={Sparkles}
          title="Draft / Planning"
          value={draftCount}
          subtitle="Under Review for Upcoming Terms"
          colorScheme="gold"
        />
        <StatCard
          icon={DollarSign}
          title="Total Schedule Value"
          value={`₹${(totalDemand / 100000).toFixed(2)} L`}
          subtitle="Combined Program Term Tariffs"
          colorScheme="orange"
        />
      </div>

      {/* Action & Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by structure code, name, or program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Filters & Action */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {/* Program Filter */}
            <select
              value={progFilter}
              onChange={(e) => setProgFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Semesters</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.code || `Semester ${s.number}`}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Create Button */}
            <button
              onClick={handleOpenAdd}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={16} />
              Create Fee Structure
            </button>
          </div>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Structure Code</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Program & Semester</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Academic Year</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Items</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Total Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Created Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
                    <p style={{ fontWeight: 500, margin: 0 }}>No Fee Structures match your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStructures.map((fs) => {
                  const prog = programs.find(p => p.id === fs.programId);
                  const sem = semesters.find(s => s.id === fs.semesterId);
                  const semName = sem?.code || (sem ? `Semester ${sem.number}` : fs.semesterId);
                  return (
                    <tr key={fs.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Structure Code */}
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {fs.structureCode || `FS-${prog?.code || 'PRG'}-${semName}`}
                      </td>

                      {/* Program & Semester */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{fs.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {prog?.name || fs.programId} • {semName}
                        </div>
                      </td>

                      {/* Academic Year */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="navy">{fs.academicYearCode || '2026-27'}</Badge>
                      </td>

                      {/* Items Count */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                        <strong>{fs.items?.length || 4}</strong> fee heads
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', fontSize: '0.9rem' }}>
                        ₹{Number(fs.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {fs.status === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                        {fs.status === 'DRAFT' && <Badge variant="gold">Draft</Badge>}
                        {fs.status === 'INACTIVE' && <Badge variant="inactive">Inactive</Badge>}
                        {fs.status === 'ARCHIVED' && <Badge variant="navy">Archived</Badge>}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {fs.createdAt ? new Date(fs.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jan 2026'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Preview / Print */}
                          <button
                            title="Print / Preview Structure"
                            onClick={() => handleOpenPrint(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Printer size={14} />
                          </button>

                          {/* View */}
                          <button
                            title="View Details"
                            onClick={() => handleOpenView(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Fee Structure"
                            onClick={() => handleOpenEdit(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Duplicate */}
                          <button
                            title="Duplicate to Next Academic Year"
                            onClick={() => handleOpenDuplicate(fs)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.5rem', color: '#d97706' }}
                          >
                            <Copy size={14} />
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            title={fs.status === 'ACTIVE' ? 'Deactivate Structure' : 'Activate Structure'}
                            onClick={() => setTogglingStructure(fs)}
                            className={`btn btn-sm ${fs.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            Showing <strong>{filteredStructures.length}</strong> of <strong>{totalCount}</strong> Fee Structures
          </span>
          <span style={{ fontStyle: 'italic' }}>
            * Active fee structures are locked for historical consistency once assigned to enrolled students.
          </span>
        </div>
      </div>

      {/* Add / Edit / View / Duplicate / Print Modal */}
      <FeeStructureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStructure}
        onDuplicate={handleDuplicateStructure}
        initialData={selectedStructure}
        mode={modalMode}
      />

      {/* Activate / Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!togglingStructure}
        title={togglingStructure?.status === 'ACTIVE' ? 'Deactivate Fee Structure' : 'Activate Fee Structure'}
        message={
          togglingStructure?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate "${togglingStructure?.name}"? New student fee assignments will be blocked.`
            : `Are you sure you want to activate "${togglingStructure?.name}"? It will become available for semester student fee assignments.`
        }
        confirmLabel={togglingStructure?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setTogglingStructure(null)}
      />
    </div>
  );
};
