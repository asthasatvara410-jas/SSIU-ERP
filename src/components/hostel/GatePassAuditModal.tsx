import React from 'react';
import { StudentGatePass } from '../../types';
import { X, Clock, CheckCircle2, AlertTriangle, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

interface GatePassAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatePass: StudentGatePass;
}

export const GatePassAuditModal: React.FC<GatePassAuditModalProps> = ({
  isOpen,
  onClose,
  gatePass
}) => {
  if (!isOpen || !gatePass) return null;

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
        maxWidth: '580px',
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
            <Clock size={18} color="#F37023" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Gate Pass Lifecycle Audit Trail • {gatePass.gatePassNo}
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Audit Body */}
        <div style={{ padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Student: <strong>{gatePass.studentName}</strong> ({gatePass.enrollmentNo})</span>
              <span>Status: <strong>{gatePass.status}</strong></span>
            </div>
            <div style={{ marginTop: '2px', color: '#64748B' }}>
              Outing: {gatePass.outingDate} ({gatePass.expectedOutTime} - {gatePass.expectedReturnTime}) • {gatePass.destination}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
            
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '7px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: '#CBD5E1'
            }} />

            {gatePass.history?.map((entry, idx) => {
              const isLatest = idx === gatePass.history.length - 1;
              return (
                <div key={entry.id || idx} style={{ position: 'relative' }}>
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-1.5rem',
                    top: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: isLatest ? '#F37023' : '#0F2C59',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 0 2px #CBD5E1'
                  }} />

                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.84375rem', color: '#0F2C59' }}>{entry.action?.replace(/_/g, ' ')}</strong>
                      <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
                        {new Date(entry.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>By: <strong>{entry.userName}</strong> ({entry.userRole})</span>
                    </div>

                    {entry.remarks && (
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', background: '#F8FAFC', padding: '4px 6px', borderRadius: '2px' }}>
                        {entry.remarks}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

        </div>

        {/* Footer */}
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
