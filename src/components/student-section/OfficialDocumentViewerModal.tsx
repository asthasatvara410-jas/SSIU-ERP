import React from 'react';
import { StudentSectionDocument, StudentSectionRequest } from '../../types/studentSection';

import { Badge } from '../common/Badge';
import swarrnimLogo from '../../assets/swarrnim-university-logo.png';
import { 
  Award, QrCode, Printer, Download, CheckCircle2, ShieldCheck, 
  ExternalLink, Building2, X
} from 'lucide-react';

import { useModalScrollLock } from '../../utils/modalScrollLock';

interface OfficialDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudentSectionDocument;
  request?: StudentSectionRequest;
}

export const OfficialDocumentViewerModal: React.FC<OfficialDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  request
}) => {
  const handlePrint = () => {
    window.print();
  };

  useModalScrollLock(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="student-section-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="student-section-doc-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Official Document Viewer"
      >
        {/* 1. Pinned Header */}
        <div style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1A365D 100%)',
          color: '#FFFFFF',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #F37023'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0' }}>
              Official Certificate Verification Viewer
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close viewer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Scrollable Certificate Body */}
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: '1.25rem',
          background: '#F1F5F9'
        }}>
          
          {/* Printable Official University Certificate Frame */}
          <div id="printable-certificate-frame" style={{
            border: '10px double #0F2C59',
            padding: '2rem',
            backgroundColor: '#FFFDF9',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
          {/* Watermark Logo Background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.04,
            pointerEvents: 'none'
          }}>
            <Award size={360} color="#0F2C59" />
          </div>

          {/* Top University Header Banner */}
          <div style={{ textAlign: 'center', borderBottom: '3px solid #F37023', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <img src={swarrnimLogo} alt="University Logo" style={{ height: '48px', objectFit: 'contain' }} />
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F2C59', margin: '4px 0 0 0', letterSpacing: '0.5px' }}>
              SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
            </h1>
            <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '2px' }}>
              (Established under Gujarat Private Universities Act No. 8 of 2017)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              At &amp; Post: Bhoyan Rathod, Near IFFCO, Gandhinagar - 382420, Gujarat, India • www.swarrnim.edu.in
            </div>

            <div style={{
              fontSize: '1.125rem',
              fontWeight: 900,
              color: '#F37023',
              marginTop: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              textDecoration: 'underline'
            }}>
              {document.serviceName}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#475569', borderTop: '1px dashed #CBD5E1', paddingTop: '0.4rem' }}>
              <span>Document Ref No: <strong>{document.documentNo}</strong></span>
              <span>Issue Date: <strong>{new Date(document.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
            </div>
          </div>

          {/* Certificate Main Body */}
          <div style={{ fontSize: '0.9375rem', lineHeight: 1.85, color: '#1E293B', marginBottom: '2rem', textAlign: 'justify' }}>
            <p>
              This is to officially certify that <strong>{document.studentName}</strong>, bearing University Enrollment Number <strong style={{ fontFamily: 'monospace' }}>{document.enrollmentNo}</strong>, is a registered bonafide student of the <strong>{document.departmentName}</strong> pursuing the program <strong>{document.programName}</strong> at Swarrnim Startup &amp; Innovation University.
            </p>

            {request?.purpose && (
              <p style={{ marginTop: '0.75rem' }}>
                This official university certificate / document has been issued upon the student's request for the specific purpose of: <em>"{request.purpose}"</em>.
              </p>
            )}

            <p style={{ marginTop: '0.75rem' }}>
              According to the institutional records, the student maintains good conduct and academic standing in the university.
            </p>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.78125rem',
              color: '#475569',
              marginTop: '1.25rem',
              lineHeight: 1.5
            }}>
              <strong>Security &amp; Digital Verification Notice:</strong> This document is generated through the Centralized Enterprise ERP System of Swarrnim Startup &amp; Innovation University and is cryptographically verified under Security Token <code style={{ color: '#0F2C59', fontWeight: 800 }}>{document.verificationCode}</code>. Authenticity can be verified by scanning the QR code or visiting the Registrar verification portal.
            </div>
          </div>

          {/* Footer Signatures & QR Code */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #CBD5E1' }}>
            
            {/* QR Code Verification Block */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '68px',
                height: '68px',
                margin: '0 auto',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}>
                <QrCode size={56} color="#0F2C59" />
              </div>
              <span style={{ fontSize: '0.625rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                Digital Verification QR
              </span>
            </div>

            {/* University Seal Stamp */}
            <div style={{
              border: '2px dashed #0F2C59',
              borderRadius: '50%',
              width: '80px',
              height: '80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#0F2C59',
              fontSize: '0.5625rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span>SSIU</span>
              <ShieldCheck size={18} />
              <span>OFFICIAL SEAL</span>
            </div>

            {/* Registrar Signature */}
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontWeight: 800, color: '#0F2C59', fontSize: '0.95rem' }}>
                Dr. K. N. Rao
              </div>
              <div style={{ borderTop: '1px solid #0F2C59', paddingTop: '4px', fontSize: '0.75rem', fontWeight: 800, color: '#0F2C59' }}>
                Registrar
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                Controller of Examinations &amp; Student Section
              </div>
            </div>

          </div>

        </div>

        </div>

        {/* 3. Fixed/Pinned Action Footer */}
        <div style={{
          flexShrink: 0,
          background: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          zIndex: 10
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Certificate
          </button>
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Download Official PDF
          </a>
        </div>

      </div>
    </div>
  );
};
