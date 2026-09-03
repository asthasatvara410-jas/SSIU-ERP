import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService } from '../../services/assetManagementService';
import { AssetCategory } from '../../types';

interface CreateAssetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateAssetRequestModal: React.FC<CreateAssetRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const departments = db.getDepartments();

  const [departmentId, setDepartmentId] = useState(user?.departmentId && user.departmentId !== 'ALL' ? user.departmentId : departments[0]?.id || 'dept-cse');
  const [category, setCategory] = useState<AssetCategory>('IT_ELECTRONICS');
  const [subCategory, setSubCategory] = useState('Desktop PC');
  const [requestedQuantity, setRequestedQuantity] = useState(5);
  const [specifications, setSpecifications] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [targetLocation, setTargetLocation] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetDept = departments.find(d => d.id === departmentId);
  const instId = targetDept?.instituteId || 'inst-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!justification.trim()) {
      setError('Please provide a justification for this asset request.');
      return;
    }

    const res = assetManagementService.createAllocationRequest({
      departmentId,
      instituteId: instId,
      category,
      subCategory,
      requestedQuantity: Number(requestedQuantity) || 1,
      specifications: specifications.trim() || undefined,
      justification: justification.trim(),
      priority,
      targetLocation: targetLocation.trim() || undefined
    }, user || { id: 'hod', name: 'Department HOD', role: 'HOD' } as any);

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
        maxWidth: '600px',
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
              Submit Department Asset Requisition
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              Direct Submission to University Central Administration
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Requesting Department *</label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="IT_ELECTRONICS">IT & Electronics</option>
                <option value="FURNITURE">Furniture</option>
                <option value="CLASSROOM">Classroom Assets</option>
                <option value="LABORATORY">Laboratory Assets</option>
                <option value="OFFICE">Office Equipment</option>
                <option value="NETWORKING">Networking Equipment</option>
                <option value="SPORTS">Sports Assets</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Item / Sub-Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Desktop PC, Mesh Chairs, Projector"
                value={subCategory}
                onChange={e => setSubCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Requested Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={requestedQuantity}
                onChange={e => setRequestedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Urgency / Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="LOW">Low (Routine Requirement)</option>
                <option value="MEDIUM">Medium (Upcoming Semester)</option>
                <option value="HIGH">High (Immediate Need)</option>
                <option value="URGENT">Urgent (Exam / Accreditation Critical)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Target Location / Lab</label>
              <input
                type="text"
                placeholder="e.g. Block A Room 204"
                value={targetLocation}
                onChange={e => setTargetLocation(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Technical Specifications (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Core i7, 16GB RAM, 512GB NVMe SSD"
              value={specifications}
              onChange={e => setSpecifications(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Academic / Operational Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="State the academic purpose, syllabus requirement, or facility upgrade need..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
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
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={16} />
              <span>Submit Requisition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
