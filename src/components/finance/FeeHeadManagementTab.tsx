import React, { useState } from 'react';
import { FeeHead, FeeHeadCategory } from '../../types';
import { db } from '../../services/db';
import { FeeHeadModal } from './FeeHeadModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import {
  DollarSign, Plus, Search, Eye, Edit2, Power,
  CheckCircle2, AlertCircle, Sparkles, Layers
} from 'lucide-react';

const CATEGORIES: { code: FeeHeadCategory; label: string }[] = [
  { code: 'ACADEMIC', label: 'Academic / Tuition' },
  { code: 'ADMISSION', label: 'Admission & Enrollment' },
  { code: 'EXAMINATION', label: 'Examination & Results' },
  { code: 'HOSTEL', label: 'Hostel & Residence' },
  { code: 'TRANSPORT', label: 'Transport & Transit' },
  { code: 'CERTIFICATE', label: 'Certificates & Documents' },
  { code: 'LIBRARY', label: 'Library & Book Bank' },
  { code: 'LABORATORY', label: 'Laboratory & Practical' },
  { code: 'STUDENT_ACTIVITY', label: 'Sports & Student Activities' },
  { code: 'OTHER', label: 'Other Miscellaneous' },
];

export const FeeHeadManagementTab: React.FC = () => {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(() => db.getFeeHeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | 'VIEW'>('ADD');
  const [selectedFeeHead, setSelectedFeeHead] = useState<FeeHead | null>(null);

  // Status Toggle Dialog State
  const [togglingHead, setTogglingHead] = useState<FeeHead | null>(null);

  const refreshList = () => {
    setFeeHeads(db.getFeeHeads());
  };

  const handleOpenAdd = () => {
    setSelectedFeeHead(null);
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (feeHead: FeeHead) => {
    setSelectedFeeHead(feeHead);
    setModalMode('EDIT');
    setIsModalOpen(true);
  };

  const handleOpenView = (feeHead: FeeHead) => {
    setSelectedFeeHead(feeHead);
    setModalMode('VIEW');
    setIsModalOpen(true);
  };

  const handleSaveFeeHead = (data: Omit<FeeHead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modalMode === 'ADD') {
      // Check for code uniqueness
      const existing = feeHeads.find(f => f.code.toUpperCase() === data.code.toUpperCase());
      if (existing) {
        return { success: false, error: `Fee code '${data.code}' is already registered.` };
      }
      db.addFeeHead(data);
    } else if (modalMode === 'EDIT' && selectedFeeHead) {
      db.updateFeeHead(selectedFeeHead.id, data);
    }
    refreshList();
    return { success: true };
  };

  const handleConfirmToggleStatus = () => {
    if (togglingHead) {
      db.toggleFeeHeadStatus(togglingHead.id);
      refreshList();
      setTogglingHead(null);
    }
  };

  // Filtered List
  const filteredFeeHeads = feeHeads.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'MANDATORY' && item.isMandatory) ||
      (typeFilter === 'OPTIONAL' && !item.isMandatory);

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  // KPI calculations
  const totalCount = feeHeads.length;
  const activeCount = feeHeads.filter(f => f.status === 'ACTIVE').length;
  const mandatoryCount = feeHeads.filter(f => f.isMandatory && f.status === 'ACTIVE').length;
  const optionalCount = feeHeads.filter(f => !f.isMandatory && f.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard
          icon={Layers}
          title="Total Fee Heads"
          value={totalCount}
          subtitle="Configured University Fee Masters"
          colorScheme="navy"
        />
        <StatCard
          icon={CheckCircle2}
          title="Active Fee Heads"
          value={activeCount}
          subtitle="Available for Fee Structure Mapping"
          colorScheme="green"
        />
        <StatCard
          icon={DollarSign}
          title="Mandatory Fee Heads"
          value={mandatoryCount}
          subtitle="Compulsory Course & Term Fees"
          colorScheme="orange"
        />
        <StatCard
          icon={Sparkles}
          title="Optional / Add-on"
          value={optionalCount}
          subtitle="Hostel, Bus & Certificate Fees"
          colorScheme="gold"
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
              placeholder="Search by fee code (e.g. TUITION) or fee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Filters & Action */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
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
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Types</option>
              <option value="MANDATORY">Mandatory</option>
              <option value="OPTIONAL">Optional / Add-on</option>
            </select>

            {/* Add Button */}
            <button
              onClick={handleOpenAdd}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={16} />
              Add Fee Head
            </button>
          </div>
        </div>
      </div>

      {/* Fee Heads Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Fee Code</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Fee Head Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Default Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Created Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeHeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
                    <p style={{ fontWeight: 500, margin: 0 }}>No Fee Heads match your search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredFeeHeads.map((head) => (
                  <tr key={head.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Fee Code */}
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {head.code}
                    </td>

                    {/* Fee Name */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{head.name}</div>
                      {head.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {head.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant="navy">
                        {head.category.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    {/* Mandatory / Optional */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {head.isMandatory ? (
                        <Badge variant="warning">Mandatory</Badge>
                      ) : (
                        <Badge variant="inactive">Optional</Badge>
                      )}
                    </td>

                    {/* Default Amount */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      ₹{Number(head.defaultAmount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {head.status === 'ACTIVE' ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="inactive">Inactive</Badge>
                      )}
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {new Date(head.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          title="View Details"
                          onClick={() => handleOpenView(head)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          title="Edit Fee Head"
                          onClick={() => handleOpenEdit(head)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          title={head.status === 'ACTIVE' ? 'Deactivate Fee Head' : 'Activate Fee Head'}
                          onClick={() => setTogglingHead(head)}
                          className={`btn btn-sm ${head.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            Showing <strong>{filteredFeeHeads.length}</strong> of <strong>{totalCount}</strong> Fee Heads
          </span>
          <span style={{ fontStyle: 'italic' }}>
            * Deactivated fee heads are preserved for historical ledgers and cannot be assigned to new fee structures.
          </span>
        </div>
      </div>

      {/* Add / Edit / View Modal */}
      <FeeHeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFeeHead}
        initialData={selectedFeeHead}
        mode={modalMode}
        categories={CATEGORIES}
      />

      {/* Activate / Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!togglingHead}
        title={togglingHead?.status === 'ACTIVE' ? 'Deactivate Fee Head' : 'Activate Fee Head'}
        message={
          togglingHead?.status === 'ACTIVE'
            ? `Are you sure you want to deactivate Fee Head "${togglingHead?.code} - ${togglingHead?.name}"? It will no longer be available for new semester fee structures.`
            : `Are you sure you want to activate Fee Head "${togglingHead?.code} - ${togglingHead?.name}"?`
        }
        confirmLabel={togglingHead?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setTogglingHead(null)}
      />
    </div>
  );
};
