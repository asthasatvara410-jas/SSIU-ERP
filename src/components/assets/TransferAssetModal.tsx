import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, AlertCircle, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService, TransferAssetPayload } from '../../services/assetManagementService';
import { UniversityAsset } from '../../types';

interface TransferAssetModalProps {
  isOpen: boolean;
  asset: UniversityAsset | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransferAssetModal: React.FC<TransferAssetModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const departments = db.getDepartments();
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || (u as any).isFaculty);

  const [toDepartmentId, setToDepartmentId] = useState(departments[0]?.id || 'dept-me');
  const [toLocation, setToLocation] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const targetDept = departments.find(d => d.id === toDepartmentId);
  const instId = targetDept?.instituteId || 'inst-1';
  const currentDeptName = asset.currentDepartmentId ? departments.find(d => d.id === asset.currentDepartmentId)?.name || 'Store' : 'Store';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!reason.trim()) {
      setError('Please provide a transfer reason or sanction note.');
      return;
    }

    const payload: TransferAssetPayload = {
      assetMasterId: asset.id,
      quantity: asset.isSerialized ? 1 : Number(quantity) || 1,
      toInstituteId: instId,
      toDepartmentId,
      toLocation: toLocation.trim() || undefined,
      toPersonId: toPersonId || undefined,
      reason: reason.trim()
    };

    const res = assetManagementService.transferAsset(payload, user || {
      id: 'admin',
      name: 'Central Admin',
      role: 'STUDENT_ADMIN'
    } as any);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Transfer Institutional Asset
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              Asset: {asset.name} ({asset.assetId})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.35rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#991B1B', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '6px', color: '#065F46', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Transfer Visual Route */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Current Department / Location</span>
              <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{currentDeptName}</strong>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{asset.assignedPersonName || asset.building || 'Main Facility'}</div>
            </div>
            <ArrowRightLeft size={20} style={{ color: 'var(--brand-orange, #F37023)' }} />
            <div style={{ flex: 1, textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Destination Department</span>
              <strong style={{ fontSize: '0.9rem', color: '#0284C7' }}>{targetDept?.name || 'Selected Department'}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>New Department *</label>
              <select
                required
                value={toDepartmentId}
                onChange={e => setToDepartmentId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>New Physical Location</label>
              <input
                type="text"
                placeholder="e.g. Block B, Room 102"
                value={toLocation}
                onChange={e => setToLocation(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Reassign to Faculty Member (Optional)</label>
              <select
                value={toPersonId}
                onChange={e => setToPersonId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="">-- No Individual Person Assigned --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Reason for Transfer *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Workload reorganization, new semester lab requirements..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                background: 'var(--brand-navy, #0B1B3D)',
                borderColor: 'var(--brand-navy, #0B1B3D)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ArrowRightLeft size={16} />
              <span>Execute Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
