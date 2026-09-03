import React, { useRef } from 'react';
import { StudentGatePass } from '../../types';
import { Badge } from '../common/Badge';
import { 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Phone, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  FileText
} from 'lucide-react';
import swarrnimLogo from '../../assets/swarrnim-university-logo.png';

interface StudentGatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  gatePass: StudentGatePass;
  onCancelPass?: (id: string) => void;
  canApprove?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  canRecordGate?: boolean;
  onMarkOut?: (id: string) => void;
  onMarkIn?: (id: string) => void;
}

export const StudentGatePassModal: React.FC<StudentGatePassModalProps> = ({
  isOpen,
  onClose,
  gatePass,
  onCancelPass,
  canApprove,
  onApprove,
  onReject,
  canRecordGate,
  onMarkOut,
  onMarkIn
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !gatePass) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'APPROVED' || s === 'ACTIVE') return <Badge variant="active">APPROVED / ACTIVE</Badge>;
    if (s === 'OUT') return <Badge variant="orange">OUT OF CAMPUS</Badge>;
    if (s === 'RETURNED') return <Badge variant="active">RETURNED / CLOSED</Badge>;
    if (s === 'PENDING') return <Badge variant="gold">PENDING WARDEN APPROVAL</Badge>;
    if (s === 'REJECTED') return <Badge variant="danger">REJECTED</Badge>;
    if (s === 'CANCELLED') return <Badge variant="inactive">CANCELLED</Badge>;
    return <Badge variant="navy">{s}</Badge>;
  };

  // Generate SVG QR Code representation
  const renderQRCode = (text: string) => {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '2px solid #0F2C59',
        padding: '8px',
        borderRadius: '6px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Frame */}
          <rect x="5" y="5" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
          <rect x="11" y="11" width="18" height="18" fill="#0F2C59" />
          
          <rect x="65" y="5" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
          <rect x="71" y="11" width="18" height="18" fill="#0F2C59" />
          
          <rect x="5" y="65" width="30" height="30" rx="2" stroke="#0F2C59" strokeWidth="4" fill="white" />
          <rect x="11" y="71" width="18" height="18" fill="#0F2C59" />
          
          {/* Inner Matrix Patterns */}
          <rect x="42" y="12" width="6" height="16" fill="#F37023" />
          <rect x="52" y="8" width="6" height="8" fill="#0F2C59" />
          <rect x="12" y="42" width="16" height="6" fill="#0F2C59" />
          <rect x="8" y="52" width="8" height="6" fill="#F37023" />
          
          {/* Center Data Modules */}
          <rect x="36" y="36" width="28" height="28" fill="#0F2C59" rx="2" />
          <rect x="42" y="42" width="16" height="16" fill="white" />
          <rect x="46" y="46" width="8" height="8" fill="#F37023" />
          
          <rect x="70" y="42" width="8" height="14" fill="#0F2C59" />
          <rect x="82" y="48" width="10" height="6" fill="#0F2C59" />
          <rect x="42" y="70" width="14" height="8" fill="#0F2C59" />
          <rect x="48" y="82" width="6" height="10" fill="#0F2C59" />
          <rect x="68" y="68" width="10" height="10" fill="#F37023" />
          <rect x="82" y="82" width="12" height="12" fill="#0F2C59" />
        </svg>
        <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', fontWeight: 800, color: '#0F2C59', marginTop: '4px' }}>
          {gatePass.gatePassNo}
        </span>
      </div>
    );
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
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      {/* ── PRINT MEDIA STYLES ──────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-printable-gate-pass, #official-printable-gate-pass * {
            visibility: visible !important;
          }
          #official-printable-gate-pass {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
          }
          .no-print-modal-actions {
            display: none !important;
          }
        }
      `}</style>

      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: '820px',
        borderRadius: '6px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        
        {/* Modal Top Bar */}
        <div className="no-print-modal-actions" style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#F37023" />
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', letterSpacing: '0.5px' }}>
              OFFICIAL UNIVERSITY STUDENT GATE PASS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', height: '30px', background: '#FFFFFF', color: '#0F2C59', border: 'none', fontWeight: 700 }}
            >
              <Printer size={14} /> Print Gate Pass
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div
            id="official-printable-gate-pass"
            ref={printAreaRef}
            style={{
              background: '#FFFFFF',
              border: '2px solid #0F2C59',
              padding: '1.5rem',
              position: 'relative'
            }}
          >
            {/* Watermark */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '5rem',
              fontWeight: 900,
              color: 'rgba(15, 44, 89, 0.04)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase'
            }}>
              SSIU GATE PASS
            </div>

            {/* Document Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #0F2C59',
              paddingBottom: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={swarrnimLogo} alt="Swarrnim Startup &amp; Innovation University" style={{ height: '54px', width: 'auto', objectFit: 'contain' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2C59', letterSpacing: '0.5px' }}>
                    SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                  </h2>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#F37023', marginTop: '2px' }}>
                    DIRECTORATE OF CAMPUS LIFE &amp; STUDENT RESIDENCY
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Bhoyan Rathod, Opp. IFFCO, Gandhinagar, Gujarat - 382420 • www.swarrnim.edu.in
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>DOCUMENT NUMBER</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 900, fontFamily: 'monospace', color: '#0F2C59' }}>
                  {gatePass.gatePassNo}
                </div>
                <div style={{ marginTop: '4px' }}>
                  {getStatusBadge(gatePass.status)}
                </div>
              </div>
            </div>

            {/* Title Banner */}
            <div style={{
              background: '#0F2C59',
              color: '#FFFFFF',
              textAlign: 'center',
              padding: '0.4rem',
              fontWeight: 900,
              fontSize: '0.9375rem',
              letterSpacing: '1px',
              marginBottom: '1.25rem'
            }}>
              OFFICIAL HOSTEL STUDENT OUTPASS / GATE PASS
            </div>

            {/* Student & Outing Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {/* Photo */}
              <div style={{ textAlign: 'center' }}>
                <img
                  src={gatePass.studentPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={gatePass.studentName}
                  style={{ width: '105px', height: '125px', objectFit: 'cover', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                />
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                  ENROLLMENT NO.
                </div>
              </div>

              {/* Information Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#64748B', width: '28%' }}>STUDENT NAME:</td>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#0F2C59' }}>{gatePass.studentName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#64748B' }}>ENROLLMENT NO:</td>
                    <td style={{ padding: '4px 8px', fontWeight: 800, fontFamily: 'monospace', color: '#F37023' }}>{gatePass.enrollmentNo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#64748B' }}>PROGRAM &amp; SEMESTER:</td>
                    <td style={{ padding: '4px 8px', color: '#334155' }}>{gatePass.programName} (Semester {gatePass.semester})</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#64748B' }}>HOSTEL &amp; ROOM:</td>
                    <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0F2C59' }}>{gatePass.hostelName} • Room {gatePass.roomNo} ({gatePass.bedNo})</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', fontWeight: 800, color: '#64748B' }}>PARENT / GUARDIAN:</td>
                    <td style={{ padding: '4px 8px', color: '#334155' }}>{gatePass.parentGuardianName} (Ph: {gatePass.parentGuardianMobile})</td>
                  </tr>
                </tbody>
              </table>

              {/* QR Code */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {renderQRCode(gatePass.qrCodeData || gatePass.gatePassNo)}
                <span style={{ fontSize: '0.625rem', color: '#64748B', marginTop: '4px' }}>
                  Scan at Gate Security
                </span>
              </div>
            </div>

            {/* Outing Schedule & Destination Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', color: '#0F2C59' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'left' }}>Purpose of Leaving</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'left' }}>Destination / Visiting Place</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Outing Date</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Expected Out</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Expected Return</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', fontWeight: 700, color: '#0F2C59' }}>
                    {gatePass.purpose}
                  </td>
                  <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', color: '#334155' }}>
                    {gatePass.destination}
                  </td>
                  <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 700 }}>
                    {gatePass.outingDate}
                  </td>
                  <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                    {gatePass.expectedOutTime}
                  </td>
                  <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>
                    {gatePass.expectedReturnTime}
                  </td>
                </tr>
                {gatePass.studentRemarks && (
                  <tr>
                    <td colSpan={5} style={{ padding: '6px 8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '0.75rem' }}>
                      <strong>Student Remarks:</strong> {gatePass.studentRemarks} • Mode of Travel: {gatePass.modeOfTravel || 'Public Transport'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Warden Approval & Verification Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              border: '1px solid #CBD5E1',
              padding: '0.85rem 1rem',
              background: '#F8FAFC',
              marginBottom: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B' }}>WARDEN APPROVAL STATUS:</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: gatePass.approvedBy ? '#047857' : '#D97706', marginTop: '2px' }}>
                  {gatePass.approvedByName ? `Approved by ${gatePass.approvedByName}` : gatePass.status === 'REJECTED' ? `Rejected (${gatePass.rejectedReason})` : 'Pending Chief Warden Review'}
                </div>
                {gatePass.approvedAt && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Approved On: {new Date(gatePass.approvedAt).toLocaleString('en-IN')}
                  </div>
                )}
                {gatePass.wardenRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '2px', fontStyle: 'italic' }}>
                    "{gatePass.wardenRemarks}"
                  </div>
                )}
              </div>

              {/* Security Gate Checkpoint Status */}
              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B' }}>MAIN GATE SECURITY VERIFICATION:</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '2px', color: '#334155' }}>
                  <div>
                    Actual Out Time: <strong style={{ color: gatePass.actualOutDateTime ? '#047857' : '#64748B' }}>
                      {gatePass.actualOutDateTime ? new Date(gatePass.actualOutDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Exit'}
                    </strong>
                  </div>
                  <div>
                    Actual Return Time: <strong style={{ color: gatePass.actualInDateTime ? '#047857' : '#64748B' }}>
                      {gatePass.actualInDateTime ? new Date(gatePass.actualInDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Return'}
                    </strong>
                    {gatePass.isLateReturn && <span style={{ marginLeft: '6px', color: '#DC2626', fontWeight: 800 }}>(LATE RETURN)</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Signatures Area */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '1.75rem',
              paddingTop: '1rem',
              borderTop: '1px dashed #CBD5E1',
              fontSize: '0.75rem'
            }}>
              <div style={{ textAlign: 'center', minWidth: '140px' }}>
                <div style={{ height: '28px' }} />
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700 }}>
                  Student Signature
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div style={{ height: '28px', color: '#047857', fontWeight: 800, fontSize: '0.8125rem' }}>
                  {gatePass.approvedByName ? 'DIGITALLY VERIFIED' : ''}
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 800 }}>
                  Chief Hostel Warden
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div style={{ height: '28px', color: '#0F2C59', fontWeight: 800, fontSize: '0.8125rem' }}>
                  {gatePass.actualOutDateTime ? 'GATE OFFICER STAMP' : ''}
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 800 }}>
                  Campus Security Officer
                </div>
              </div>
            </div>

            {/* Official Rules Footer */}
            <div style={{
              marginTop: '1.25rem',
              borderTop: '1px solid #0F2C59',
              paddingTop: '0.5rem',
              fontSize: '0.6875rem',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              <div>
                <strong>IMPORTANT NOTICE:</strong> Valid only for the date and time specified above. Gate entry/exit must be recorded by authorized university security personnel.
              </div>
              <div>
                Students returning after curfew or without security clearance are liable for hostel disciplinary action under SSIU University Regulations.
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="no-print-modal-actions" style={{
          background: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Status Specific Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {gatePass.status === 'PENDING' && onCancelPass && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onCancelPass(gatePass.id)}
                style={{ fontSize: '0.75rem', color: '#DC2626', borderColor: '#FCA5A5' }}
              >
                Cancel Gate Pass Request
              </button>
            )}

            {/* Warden Approval Actions */}
            {canApprove && gatePass.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onApprove?.(gatePass.id)}
                  style={{ fontSize: '0.75rem', background: '#047857', borderColor: '#047857' }}
                >
                  <CheckCircle2 size={14} /> Approve Gate Pass
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onReject?.(gatePass.id)}
                  style={{ fontSize: '0.75rem', color: '#DC2626', borderColor: '#DC2626' }}
                >
                  <X size={14} /> Reject Request
                </button>
              </>
            )}

            {/* Security Checkpoint Actions */}
            {canRecordGate && (gatePass.status === 'APPROVED' || gatePass.status === 'ACTIVE') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onMarkOut?.(gatePass.id)}
                style={{ fontSize: '0.75rem', background: '#D97706', borderColor: '#D97706' }}
              >
                <Clock size={14} /> Record Student OUT
              </button>
            )}

            {canRecordGate && gatePass.status === 'OUT' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onMarkIn?.(gatePass.id)}
                style={{ fontSize: '0.75rem', background: '#047857', borderColor: '#047857' }}
              >
                <CheckCircle2 size={14} /> Record Student RETURN (IN)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ fontSize: '0.75rem' }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ fontSize: '0.75rem', background: '#0F2C59', borderColor: '#0F2C59' }}
            >
              <Printer size={14} /> Print Document
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
