import React, { useState } from 'react';
import { 
  X, QrCode, ShieldCheck, MapPin, UserCheck, Wrench, 
  Calendar, Layers, FileText, Printer, ArrowRightLeft, 
  History, Clock, CheckCircle2, AlertTriangle, Box
} from 'lucide-react';
import { UniversityAsset } from '../../types';
import { db } from '../../services/db';

interface AssetDetailModalProps {
  isOpen: boolean;
  asset: UniversityAsset | null;
  onClose: () => void;
  onAllocate?: () => void;
  onTransfer?: () => void;
  onReturn?: () => void;
  onMaintenance?: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  asset,
  onClose,
  onAllocate,
  onTransfer,
  onReturn,
  onMaintenance
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QR' | 'MAINTENANCE' | 'HISTORY'>('OVERVIEW');

  if (!isOpen || !asset) return null;

  const departments = db.getDepartments();
  const currentDept = asset.currentDepartmentId ? departments.find(d => d.id === asset.currentDepartmentId) : undefined;
  const maintenanceLogs = db.getAssetMaintenanceRecords().filter(m => m.assetMasterId === asset.id || m.assetId === asset.assetId);
  const historyEvents = db.getAssetHistoryEvents().filter(h => h.assetMasterId === asset.id || h.assetId === asset.assetId);
  const transfers = db.getAssetTransferRecords().filter(t => t.assetMasterId === asset.id || t.assetId === asset.assetId);

  // Warranty status calculation
  const isWarrantyActive = asset.warrantyEnd && new Date(asset.warrantyEnd) >= new Date();
  let warrantyDaysRemaining = 0;
  if (asset.warrantyEnd) {
    const diff = new Date(asset.warrantyEnd).getTime() - new Date().getTime();
    warrantyDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
      case 'AVAILABLE': return '#10B981';
      case 'ALLOCATED':
      case 'IN_USE': return '#0284C7';
      case 'ASSIGNED': return '#8B5CF6';
      case 'UNDER_MAINTENANCE':
      case 'REPAIR': return '#D97706';
      case 'DAMAGED':
      case 'MISSING': return '#EF4444';
      default: return '#64748B';
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    JSON.stringify({
      assetId: asset.assetId,
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      serial: asset.serialNumber || 'N/A',
      location: `${asset.building || 'Store'} ${asset.room || ''}`,
      department: currentDept?.name || 'Central Store'
    })
  )}`;

  const handlePrintQR = () => {
    window.print();
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
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0B1B3D 0%, #1E293B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                {asset.name}
              </h2>
              <span style={{
                background: getStatusColor(asset.status),
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                {asset.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>Asset ID: <strong style={{ color: '#F37023', fontFamily: 'monospace' }}>{asset.assetId}</strong></span>
              <span>•</span>
              <span>Category: <strong>{asset.category}</strong> ({asset.subCategory})</span>
              <span>•</span>
              <span>Serial: <strong style={{ fontFamily: 'monospace' }}>{asset.serialNumber || 'N/A'}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.35rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '0 1.5rem' }}>
          {[
            { id: 'OVERVIEW', label: 'Asset Dossier', icon: FileText },
            { id: 'QR', label: 'QR Code & Tag', icon: QrCode },
            { id: 'MAINTENANCE', label: `Maintenance Logs (${maintenanceLogs.length})`, icon: Wrench },
            { id: 'HISTORY', label: `Lifecycle History (${historyEvents.length + transfers.length})`, icon: History }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--brand-orange, #F37023)' : '2px solid transparent',
                  background: 'transparent',
                  color: active ? 'var(--brand-orange, #F37023)' : '#64748B',
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'OVERVIEW' && (
            <>
              {/* Location & Custody Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} style={{ color: 'var(--brand-orange, #F37023)' }} />
                  <span>Current Physical Placement & Custody</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Allocated Department</span>
                    <strong style={{ color: '#0F172A' }}>{currentDept?.name || 'Central Store (Unallocated)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Building & Room</span>
                    <strong style={{ color: '#0F172A' }}>{asset.building || 'Main Facility'} {asset.room ? `• ${asset.room}` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Assigned Person / Faculty</span>
                    <strong style={{ color: asset.assignedPersonName ? '#0284C7' : '#64748B' }}>
                      {asset.assignedPersonName || 'Department-Wide Asset'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Stock Distribution</span>
                    <strong style={{ color: '#0F172A' }}>
                      {asset.allocatedQuantity} Allocated / {asset.availableQuantity} In-Stock (Total: {asset.totalQuantity})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Commercials & Procurement */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.65rem' }}>
                    Procurement Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Purchase Date:</span>
                      <strong style={{ color: '#0F172A' }}>{asset.purchaseDate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Unit Cost:</span>
                      <strong style={{ color: '#16A34A' }}>₹{asset.purchaseCost.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Vendor:</span>
                      <strong style={{ color: '#0F172A' }}>{asset.vendor || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Invoice No:</span>
                      <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{asset.invoiceNumber || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Funding Source:</span>
                      <strong style={{ color: '#0F172A' }}>{asset.fundingSource || 'University Budget'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.65rem' }}>
                    Warranty & Maintenance Protection
                  </h4>
                  {asset.warrantyEnd ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Warranty Status:</span>
                        <strong style={{ color: isWarrantyActive ? '#16A34A' : '#DC2626' }}>
                          {isWarrantyActive ? `Active (${warrantyDaysRemaining} days remaining)` : 'Expired'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Valid Until:</span>
                        <strong style={{ color: '#0F172A' }}>{asset.warrantyEnd}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Provider:</span>
                        <strong style={{ color: '#0F172A' }}>{asset.warrantyProvider || 'OEM Direct'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Warranty No:</span>
                        <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{asset.warrantyNumber || '—'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      No manufacturer warranty configured for this asset.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'QR' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#FFFFFF', border: '2px dashed #CBD5E1', borderRadius: '12px', display: 'inline-block' }}>
                <img src={qrImageUrl} alt="Asset QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy, #0B1B3D)', fontFamily: 'monospace' }}>
                  {asset.assetId}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {asset.name} • {asset.category}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                  Location: {asset.building || 'Central Store'} {asset.room || ''}
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrintQR}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 700 }}
              >
                <Printer size={16} />
                <span>Print QR Asset Tag Sticker</span>
              </button>
            </div>
          )}

          {activeTab === 'MAINTENANCE' && (
            <div>
              {maintenanceLogs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  No maintenance tickets or repair logs recorded for this asset.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {maintenanceLogs.map(m => (
                    <div key={m.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#0F172A' }}>{m.issueDescription}</strong>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>₹{(m.cost || m.actualCost || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'flex', gap: '0.75rem' }}>
                        <span>Type: <strong>{m.serviceType}</strong></span>
                        <span>•</span>
                        <span>Date: {m.maintenanceDate}</span>
                        <span>•</span>
                        <span>Vendor: {m.vendor || 'In-House'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div>
              {historyEvents.length === 0 && transfers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                  No historical lifecycle movements recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {historyEvents.map(evt => (
                    <div key={evt.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-orange, #F37023)', marginTop: '0.4rem' }} />
                      <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{evt.actionType}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                          By {evt.actorName} ({evt.actorRole}): {evt.remarks || evt.reason || 'Lifecycle action logged.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onAllocate && asset.availableQuantity > 0 && (
              <button
                type="button"
                onClick={() => { onClose(); onAllocate(); }}
                className="btn btn-sm"
                style={{ background: 'var(--brand-orange, #F37023)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.75rem' }}
              >
                Allocate to Dept
              </button>
            )}
            {onTransfer && asset.currentDepartmentId && (
              <button
                type="button"
                onClick={() => { onClose(); onTransfer(); }}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Transfer Asset
              </button>
            )}
            {onReturn && asset.currentDepartmentId && (
              <button
                type="button"
                onClick={() => { onClose(); onReturn(); }}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Return to Store
              </button>
            )}
            {onMaintenance && (
              <button
                type="button"
                onClick={() => { onClose(); onMaintenance(); }}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Log Maintenance
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
