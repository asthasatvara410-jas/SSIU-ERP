import React, { useState } from 'react';
import { StudentGatePass } from '../../types';
import { studentGatePassService } from '../../services/studentGatePassService';
import { Badge } from '../common/Badge';
import { X, Search, ShieldCheck, QrCode, Clock, CheckCircle2, AlertTriangle, User, MapPin } from 'lucide-react';

interface SecurityGatePassScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdated: (pass: StudentGatePass) => void;
}

export const SecurityGatePassScannerModal: React.FC<SecurityGatePassScannerModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdated
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchedPass, setSearchedPass] = useState<StudentGatePass | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchOrScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setActionSuccessMessage(null);
    const result = studentGatePassService.verifyGatePassQR(searchInput);
    setVerificationResult(result);
    setSearchedPass(result.pass || null);
  };

  const handleMarkOut = () => {
    if (!searchedPass) return;
    try {
      const updated = studentGatePassService.recordGatePassOut(searchedPass.id, user);
      setSearchedPass(updated);
      setActionSuccessMessage(`Student OUT recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record OUT.');
    }
  };

  const handleMarkIn = () => {
    if (!searchedPass) return;
    try {
      const updated = studentGatePassService.recordGatePassIn(searchedPass.id, user);
      setSearchedPass(updated);
      setActionSuccessMessage(`Student RETURN (IN) recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${updated.isLateReturn ? ' - LATE RETURN FLAGGED' : ''}`);
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record IN.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: '650px',
        borderRadius: '6px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        
        {/* Header */}
        <div style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #F37023'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#F37023" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
              Campus Main Gate Security • Gate Pass Verification &amp; Checkpoint
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Search / Scan Box */}
          <form onSubmit={handleSearchOrScan} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Scan QR Code or enter Gate Pass No / Enrollment No (e.g. GP/2026/0001)..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.875rem' }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#0F2C59', borderColor: '#0F2C59', fontWeight: 800 }}>
              Verify Pass
            </button>
          </form>

          {/* Verification Status Banner */}
          {verificationResult && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: verificationResult.valid ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${verificationResult.valid ? '#10B981' : '#EF4444'}`,
              color: verificationResult.valid ? '#065F46' : '#991B1B'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                {verificationResult.valid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{verificationResult.message}</span>
              </div>
              <Badge variant={verificationResult.valid ? 'active' : 'danger'}>
                {verificationResult.valid ? 'CLEARANCE GRANTED' : 'ACCESS DENIED'}
              </Badge>
            </div>
          )}

          {/* Action Success Notification */}
          {actionSuccessMessage && (
            <div style={{ background: '#EFF6FF', border: '1px solid #3B82F6', color: '#1E40AF', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 700 }}>
              ✓ {actionSuccessMessage}
            </div>
          )}

          {/* Searched Gate Pass Details */}
          {searchedPass && (
            <div style={{ border: '1px solid #CBD5E1', padding: '1rem', borderRadius: '4px', background: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <img
                  src={searchedPass.studentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={searchedPass.studentName}
                  style={{ width: '85px', height: '105px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                />
                <div style={{ fontSize: '0.8125rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F2C59' }}>{searchedPass.studentName}</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>{searchedPass.enrollmentNo}</div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>{searchedPass.hostelName} • Room {searchedPass.roomNo} ({searchedPass.bedNo})</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Purpose:</strong> {searchedPass.purpose} • <strong>Destination:</strong> {searchedPass.destination}
                  </div>
                  <div style={{ marginTop: '2px', color: '#64748B' }}>
                    Schedule: {searchedPass.outingDate} ({searchedPass.expectedOutTime} to {searchedPass.expectedReturnTime})
                  </div>
                </div>
              </div>

              {/* Status & Timings */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8125rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Current Status:</span>
                  <div><strong style={{ color: '#0F2C59' }}>{searchedPass.status}</strong></div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Warden Approval:</span>
                  <div style={{ color: '#047857', fontWeight: 700 }}>{searchedPass.approvedByName || 'Approved'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Recorded OUT:</span>
                  <div>{searchedPass.actualOutDateTime ? new Date(searchedPass.actualOutDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not yet exited'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Recorded RETURN:</span>
                  <div>{searchedPass.actualInDateTime ? new Date(searchedPass.actualInDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not yet returned'}</div>
                </div>
              </div>

              {/* Security Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {(searchedPass.status === 'APPROVED' || searchedPass.status === 'ACTIVE') && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleMarkOut}
                    style={{ background: '#D97706', borderColor: '#D97706', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Clock size={16} /> Mark Student OUT (Exit Gate)
                  </button>
                )}

                {searchedPass.status === 'OUT' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleMarkIn}
                    style={{ background: '#047857', borderColor: '#047857', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> Mark Student IN (Return to Hostel)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick instructions */}
          <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
            <strong>Security Rule:</strong> Only APPROVED gate passes can be allowed to exit. Expired, pending, or rejected passes must be stopped at the gate.
          </div>

        </div>

      </div>
    </div>
  );
};
