import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Send, Building2, 
  MapPin, UserCheck, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService, AllocateAssetPayload } from '../../services/assetManagementService';
import { UniversityAsset } from '../../types';

interface AllocateAssetModalProps {
  isOpen: boolean;
  asset: UniversityAsset | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AllocateAssetModal: React.FC<AllocateAssetModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || (u as any).isFaculty);
  const resources = db.getInstitutionalResources();

  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept-cse');
  const [allocatedQuantity, setAllocatedQuantity] = useState(1);
  const [building, setBuilding] = useState('Block A');
  const [floor, setFloor] = useState('1st Floor');
  const [room, setRoom] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const targetDept = departments.find(d => d.id === departmentId);
  const instId = targetDept?.instituteId || 'inst-1';
  const availableStock = asset.availableQuantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const qty = asset.isSerialized ? 1 : Number(allocatedQuantity) || 1;

    if (qty > availableStock) {
      setError(`Cannot allocate ${qty} units. Maximum available stock is ${availableStock}.`);
      return;
    }

    const payload: AllocateAssetPayload = {
      assetMasterId: asset.id,
      instituteId: instId,
      departmentId,
      allocatedQuantity: qty,
      building: building.trim() || undefined,
      floor: floor.trim() || undefined,
      room: room.trim() || undefined,
      labId: resourceId || undefined,
      assignedPersonId: assignedPersonId || undefined,
      effectiveFrom,
      remarks: remarks.trim() || undefined
    };

    const res = assetManagementService.allocateAssetToDepartment(payload, user || {
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
        maxWidth: '680px',
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
              Allocate Asset to Department
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
              {asset.name} • Asset ID: <strong style={{ color: '#F37023' }}>{asset.assetId}</strong>
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

          {/* Stock Summary Card */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>Total Stock</span>
              <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{asset.totalQuantity}</strong>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#16A34A', display: 'block' }}>Available to Allocate</span>
              <strong style={{ fontSize: '1.1rem', color: '#16A34A' }}>{availableStock}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#D97706', display: 'block' }}>Already Allocated</span>
              <strong style={{ fontSize: '1.1rem', color: '#D97706' }}>{asset.allocatedQuantity}</strong>
            </div>
          </div>

          {/* Allocation Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Target Department *</label>
              <select
                required
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                {asset.isSerialized ? 'Quantity (Fixed)' : `Quantity (Max: ${availableStock}) *`}
              </label>
              <input
                type="number"
                min="1"
                max={availableStock}
                disabled={asset.isSerialized}
                value={asset.isSerialized ? 1 : allocatedQuantity}
                onChange={e => setAllocatedQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: asset.isSerialized ? '#F1F5F9' : '#FFFFFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Building / Block</label>
              <input
                type="text"
                value={building}
                onChange={e => setBuilding(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Floor / Wing</label>
              <input
                type="text"
                value={floor}
                onChange={e => setFloor(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Room / Office / Location</label>
              <input
                type="text"
                placeholder="e.g. Room A-204, HOD Office"
                value={room}
                onChange={e => setRoom(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Lab / Classroom Linkage</label>
              <select
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="">-- General Department Asset --</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.roomNumber})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Assign to Faculty / Staff (Optional)</label>
              <select
                value={assignedPersonId}
                onChange={e => setAssignedPersonId(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="">-- Not Assigned to Individual Person --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Effective Date</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Allocation Remarks / Justification</label>
            <textarea
              rows={2}
              placeholder="e.g. Allocated for AI & Data Science practical sessions..."
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
              disabled={availableStock === 0}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.8125rem',
                fontWeight: 800,
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: availableStock === 0 ? 0.6 : 1
              }}
            >
              <Send size={16} />
              <span>Confirm Allocation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
