import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService, ReturnAssetPayload } from '../../services/assetManagementService';
import { UniversityAsset, AssetCondition } from '../../types';

interface ReturnAssetModalProps {
  isOpen: boolean;
  asset: UniversityAsset | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReturnAssetModal: React.FC<ReturnAssetModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const departments = db.getDepartments();

  const [condition, setCondition] = useState<AssetCondition>('GOOD');
  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const currentDeptId = asset.currentDepartmentId || 'dept-cse';
  const currentDeptName = departments.find(d => d.id === currentDeptId)?.name || 'Department';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const payload: ReturnAssetPayload = {
      assetMasterId: asset.id,
      fromDepartmentId: currentDeptId,
      quantity: asset.isSerialized ? 1 : Number(quantity) || 1,
      condition,
      remarks: remarks.trim() || undefined
    };

    const res = assetManagementService.returnAssetToStore(payload, user || {
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
        maxWidth: '560px',
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
              Return Asset to University Store
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

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Returning From Department:</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{currentDeptName}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
              Allocated Location: {asset.building || 'Department'} {asset.room || ''}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Condition on Return *</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value as AssetCondition)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
            >
              <option value="EXCELLENT">Excellent (Good as New)</option>
              <option value="GOOD">Good (Normal Wear & Tear)</option>
              <option value="FAIR">Fair (Minor cosmetic issues)</option>
              <option value="DAMAGED">Damaged (Requires Repair)</option>
              <option value="NON_FUNCTIONAL">Non-Functional (Needs Servicing / Write-off)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Return Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Faculty retired, project completed, returned in operational state..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
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
                background: '#10B981',
                borderColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RotateCcw size={16} />
              <span>Accept Return to Store</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
