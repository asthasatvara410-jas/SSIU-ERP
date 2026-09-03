import React, { useState } from 'react';
import { 
  X, Plus, Box, Layers, Building2, Calendar, 
  ShieldCheck, FileText, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { assetManagementService, RegisterAssetPayload } from '../../services/assetManagementService';
import { AssetCategory, AssetCondition, AssetStatus } from '../../types';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: { value: AssetCategory; label: string; subCategories: string[] }[] = [
  { 
    value: 'IT_ELECTRONICS', 
    label: 'IT & Electronics', 
    subCategories: ['Desktop PC', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'Projector', 'Smart Board', 'Smart TV', 'CCTV', 'Biometric Device', 'UPS', 'Server', 'Other IT Equipment'] 
  },
  { 
    value: 'FURNITURE', 
    label: 'Furniture', 
    subCategories: ['Chair', 'Office Chair', 'Table', 'Desk', 'Bench', 'Cupboard', 'Cabinet', 'Reception Desk', 'Storage Unit', 'Other Furniture'] 
  },
  { 
    value: 'CLASSROOM', 
    label: 'Classroom Assets', 
    subCategories: ['Projector', 'Smart Board', 'Whiteboard', 'Podium', 'Speaker', 'Microphone', 'Classroom Furniture', 'Other Classroom Asset'] 
  },
  { 
    value: 'LABORATORY', 
    label: 'Laboratory Assets', 
    subCategories: ['Computers', 'Machines', 'Instruments', 'Electronics Kits', 'Lab Testing Equipment', 'Scientific Tools', 'Other Lab Asset'] 
  },
  { 
    value: 'OFFICE', 
    label: 'Office Assets', 
    subCategories: ['Printer', 'Scanner', 'Photocopier', 'Telephone', 'AC', 'Refrigerator', 'Water Cooler', 'UPS', 'Generator', 'Office Furniture'] 
  },
  { 
    value: 'NETWORKING', 
    label: 'Networking Equipment', 
    subCategories: ['Router', 'Network Switch', 'Firewall', 'Wi-Fi Access Point', 'Server Rack', 'Network Accessories'] 
  },
  { 
    value: 'SPORTS', 
    label: 'Sports & Fitness', 
    subCategories: ['Sports Equipment', 'Fitness Equipment', 'Sports Furniture', 'Ground Equipment'] 
  },
  { 
    value: 'LIBRARY', 
    label: 'Library Assets', 
    subCategories: ['Book Shelving', 'Library Computers', 'Barcode/RFID Scanner', 'Reading Tables', 'Library Furniture'] 
  },
  { 
    value: 'EVENT_CULTURAL', 
    label: 'Event & Cultural', 
    subCategories: ['Sound System', 'Stage Equipment', 'Musical Instruments', 'Lighting Rig', 'Event Furniture'] 
  },
  { 
    value: 'SAFETY', 
    label: 'Safety & Security', 
    subCategories: ['Fire Extinguisher', 'First Aid Equipment', 'Emergency System', 'Safety Gear'] 
  },
  { 
    value: 'VEHICLES', 
    label: 'University Vehicles', 
    subCategories: ['Bus', 'Car', 'Van', 'Two Wheeler', 'Electric Cart', 'Ambulance'] 
  },
  { 
    value: 'MISCELLANEOUS', 
    label: 'Miscellaneous / Custom', 
    subCategories: ['General Asset', 'Custom Institutional Asset', 'Other'] 
  }
];

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || (u as any).isFaculty);

  const [category, setCategory] = useState<AssetCategory>('IT_ELECTRONICS');
  const [subCategory, setSubCategory] = useState<string>('Desktop PC');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [isSerialized, setIsSerialized] = useState(true);
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [fundingSource, setFundingSource] = useState('University Capital Budget');
  const [hasWarranty, setHasWarranty] = useState(true);
  const [warrantyStart, setWarrantyStart] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyEnd, setWarrantyEnd] = useState('');
  const [warrantyProvider, setWarrantyProvider] = useState('');
  const [condition, setCondition] = useState<AssetCondition>('NEW');
  const [initialDepartmentId, setInitialDepartmentId] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [remarks, setRemarks] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryConfig = CATEGORY_OPTIONS.find(c => c.value === category) || CATEGORY_OPTIONS[0];

  const handleCategoryChange = (newCat: AssetCategory) => {
    setCategory(newCat);
    const matched = CATEGORY_OPTIONS.find(c => c.value === newCat);
    if (matched && matched.subCategories.length > 0) {
      setSubCategory(matched.subCategories[0]);
    }
  };

  const previewAssetId = assetManagementService.generateAssetId(category, purchaseDate ? purchaseDate.slice(0, 4) : '2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Please provide a valid Asset Name.');
      return;
    }

    if (isSerialized && !serialNumber.trim()) {
      setError('Serialized assets require a valid Serial Number (or choose non-serialized).');
      return;
    }

    const payload: RegisterAssetPayload = {
      name: name.trim(),
      category,
      subCategory,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      serialNumber: isSerialized ? serialNumber.trim() : undefined,
      isSerialized,
      quantity: isSerialized ? 1 : Number(quantity) || 1,
      purchaseDate,
      purchaseCost: Number(purchaseCost) || 0,
      vendor: vendor.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      fundingSource: fundingSource.trim() || undefined,
      warrantyStart: hasWarranty ? warrantyStart : undefined,
      warrantyEnd: hasWarranty ? warrantyEnd : undefined,
      warrantyProvider: hasWarranty ? warrantyProvider.trim() : undefined,
      condition,
      initialInstituteId: initialDepartmentId ? (departments.find(d => d.id === initialDepartmentId)?.instituteId || 'inst-1') : undefined,
      initialDepartmentId: initialDepartmentId || undefined,
      building: building.trim() || undefined,
      room: room.trim() || undefined,
      assignedPersonId: assignedPersonId || undefined,
      remarks: remarks.trim() || undefined
    };

    const res = assetManagementService.registerAsset(payload, user || {
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
        maxWidth: '850px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(243, 112, 35, 0.2)',
              border: '1px solid #F37023',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F37023'
            }}>
              <Box size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Register New Institutional Asset
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
                Central University Asset Master • Single Unique Asset ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
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

          {/* Auto Asset ID Pill Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--brand-orange, #F37023)' }} />
              <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Auto-Generated Asset ID:</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0B1B3D)', fontFamily: 'monospace' }}>
                {previewAssetId}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Condition: <strong style={{ color: '#0F172A' }}>{condition}</strong> • Initial Status: <strong style={{ color: initialDepartmentId ? '#0284C7' : '#10B981' }}>{initialDepartmentId ? 'ALLOCATED' : 'IN STOCK'}</strong>
            </span>
          </div>

          {/* Section 1: Classification */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              1. Asset Classification & Basic Info
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Category *</label>
                <select
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value as AssetCategory)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Sub-Category *</label>
                <select
                  value={subCategory}
                  onChange={e => setSubCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  {currentCategoryConfig.subCategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell OptiPlex 7090 Desktop PC Core i7"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Dell, HP, Godrej, Cisco"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Model / Spec Details</label>
                <input
                  type="text"
                  placeholder="e.g. 7090 MT, 16GB RAM"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Serialized vs Bulk Quantity */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              2. Inventory & Serialization
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Tracking Type</label>
                <select
                  value={isSerialized ? 'SERIALIZED' : 'BULK'}
                  onChange={e => {
                    const ser = e.target.value === 'SERIALIZED';
                    setIsSerialized(ser);
                    if (ser) setQuantity(1);
                  }}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="SERIALIZED">Serialized Individual Asset (1 Unique Unit)</option>
                  <option value="BULK">Bulk Non-Serialized Asset (Batch Quantity)</option>
                </select>
              </div>

              {isSerialized ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DELL-SN-9982-1"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Total Quantity (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Condition</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as AssetCondition)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="NEW">New (Brand New)</option>
                  <option value="EXCELLENT">Excellent Condition</option>
                  <option value="GOOD">Good Condition</option>
                  <option value="FAIR">Fair Condition</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="NON_FUNCTIONAL">Non-Functional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Procurement */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              3. Procurement & Commercials
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Unit Purchase Cost (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 72000"
                  value={purchaseCost}
                  onChange={e => setPurchaseCost(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dell India / CompuSys"
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-8801"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Initial Allocation & Location (Optional) */}
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              4. Initial Allocation & Physical Location (Optional)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Department Allocation</label>
                <select
                  value={initialDepartmentId}
                  onChange={e => setInitialDepartmentId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', backgroundColor: '#FFFFFF' }}
                >
                  <option value="">-- Keep in Central Store Inventory --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Building / Block</label>
                <input
                  type="text"
                  placeholder="e.g. Block A, Innovation Center"
                  value={building}
                  onChange={e => setBuilding(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Room / Lab Number</label>
                <input
                  type="text"
                  placeholder="e.g. Room A-204, Lab 1"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Assign to Faculty (Optional)</label>
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
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Remarks / Specifications</label>
            <textarea
              rows={2}
              placeholder="Add any specific asset tags, warranty notes, or operational remarks..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Modal Footer */}
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
              <Plus size={16} />
              <span>Register Asset in Master</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
