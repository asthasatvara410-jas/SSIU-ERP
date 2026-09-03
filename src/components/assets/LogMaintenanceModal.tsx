import React, { useState } from 'react';
import { X, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assetManagementService, MaintenancePayload } from '../../services/assetManagementService';
import { UniversityAsset } from '../../types';

interface LogMaintenanceModalProps {
  isOpen: boolean;
  asset: UniversityAsset | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LogMaintenanceModal: React.FC<LogMaintenanceModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();

  const [issueDescription, setIssueDescription] = useState('');
  const [serviceType, setServiceType] = useState<MaintenancePayload['serviceType']>('CORRECTIVE');
  const [vendor, setVendor] = useState('');
  const [cost, setCost] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [isUnderWarranty, setIsUnderWarranty] = useState(Boolean(asset?.warrantyEnd && new Date(asset.warrantyEnd) >= new Date()));
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!issueDescription.trim()) {
      setError('Please describe the maintenance issue or service requirement.');
      return;
    }

    const payload: MaintenancePayload = {
      assetMasterId: asset.id,
      issueDescription: issueDescription.trim(),
      serviceType,
      vendor: vendor.trim() || undefined,
      cost: Number(cost) || 0,
      maintenanceDate,
      nextServiceDate: nextServiceDate || undefined,
      isUnderWarranty,
      remarks: remarks.trim() || undefined
    };

    const res = assetManagementService.logMaintenance(payload, user || {
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
        maxWidth: '580px',
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
              Log Maintenance / Repair Ticket
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

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Service Type *</label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value as any)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
            >
              <option value="CORRECTIVE">Corrective Repair (Breakdown / Malfunction)</option>
              <option value="PREVENTIVE">Preventive Maintenance (Periodic Servicing)</option>
              <option value="UPGRADE">Hardware / Software Upgrade</option>
              <option value="WARRANTY_SERVICE">OEM Warranty Service Call</option>
              <option value="REPAIR">General Calibration & Testing</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Issue Description *</label>
            <textarea
              required
              rows={2}
              placeholder="Describe the issue, failure symptom, or maintenance required..."
              value={issueDescription}
              onChange={e => setIssueDescription(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Service Vendor / Technician</label>
              <input
                type="text"
                placeholder="e.g. Dell Authorized Service / Campus IT"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Estimated / Actual Cost (₹)</label>
              <input
                type="number"
                placeholder="e.g. 4500"
                value={cost}
                onChange={e => setCost(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Maintenance Date</label>
              <input
                type="date"
                value={maintenanceDate}
                onChange={e => setMaintenanceDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Next Scheduled Service (Optional)</label>
              <input
                type="date"
                value={nextServiceDate}
                onChange={e => setNextServiceDate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isUnderWarranty"
              checked={isUnderWarranty}
              onChange={e => setIsUnderWarranty(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#F37023' }}
            />
            <label htmlFor="isUnderWarranty" style={{ fontSize: '0.8125rem', color: '#334155', cursor: 'pointer' }}>
              Covered under active Manufacturer / Vendor Warranty
            </label>
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
                background: '#D97706',
                borderColor: '#D97706',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Wrench size={16} />
              <span>Log Maintenance Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
