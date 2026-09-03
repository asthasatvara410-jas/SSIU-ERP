import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Student } from '../../types';
import { studentAdmissionRecordPdfService, AdmissionDocAttachment } from '../../services/studentAdmissionRecordPdfService';
import { 
  FileText, Download, Printer, ExternalLink, Sparkles, CheckCircle2, ShieldCheck 
} from 'lucide-react';

interface AdmissionRecordPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  documents?: AdmissionDocAttachment[];
}

export const AdmissionRecordPdfModal: React.FC<AdmissionRecordPdfModalProps> = ({
  isOpen,
  onClose,
  student,
  documents
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !student) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      return;
    }

    setIsLoading(true);
    try {
      const url = studentAdmissionRecordPdfService.getAdmissionRecordBlobUrl(student, documents);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error rendering Admission Record PDF:', err);
    } finally {
      setIsLoading(false);
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, student, documents]);

  if (!student) return null;

  const fileName = `${student.id}_Admission_Record.pdf`;

  const handleDownload = () => {
    studentAdmissionRecordPdfService.downloadAdmissionRecord(student, documents);
  };

  const handlePrint = () => {
    studentAdmissionRecordPdfService.printAdmissionRecord(student, documents);
  };

  const handleOpenExternal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Official Student Admission & Onboarding Record (${student.id})`}
      maxWidth="1100px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '75vh' }}>
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '8px',
          padding: '0.65rem 1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#059669" /> {fileName}
            </div>
            <div style={{ fontSize: '0.71875rem', color: '#64748B' }}>
              Student: {student.fullName || student.name} • Temp Enrollment: {student.temporaryEnrollmentNumber || student.enrollmentNo}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleOpenExternal}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
              title="Open in new browser tab"
            >
              <ExternalLink size={14} /> Open Full View
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <Printer size={14} /> Print PDF
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownload}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: 'var(--brand-orange, #F37023)', border: 'none' }}
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* PDF Frame / Viewer */}
        <div style={{
          flex: 1,
          height: '65vh',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-color, #E2E8F0)',
          background: '#525659',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isLoading ? (
            <div style={{ color: '#FFFFFF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--brand-orange, #F37023)" /> Generating High-Resolution Admission Dossier PDF...
            </div>
          ) : pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title="Student Admission Record PDF Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ color: '#F87171', fontSize: '0.875rem' }}>
              Unable to render PDF preview. Please click Download to view the document.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
