import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { Award, FileText, Download, Plus, CheckCircle, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { fileStorage } from '../../services/fileStorage';

interface CertificateRequest {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  departmentName: string;
  type: 'BONAFIDE' | 'CHARACTER' | 'TRANSCRIPT' | 'PROVISIONAL_DEGREE' | 'TRANSFER';
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  requestedDate: string;
  issuedDate?: string;
  certificateNo?: string;
  fileUrl?: string;
  rejectionReason?: string;
}

const initialCertificates: CertificateRequest[] = [
  {
    id: 'cert-1',
    studentId: 'stu-1',
    studentName: 'ABC Student 1',
    enrollmentNo: 'STUDENT-001',
    departmentName: 'Computer Engineering',
    type: 'BONAFIDE',
    purpose: 'Passport Application & Bank Account Verification',
    status: 'ISSUED',
    requestedDate: '2024-02-15',
    issuedDate: '2024-02-17',
    certificateNo: 'SSIU/CERT/2024/0481',
    fileUrl: 'https://swarrnim.edu.in/docs/bonafide-sample.pdf'
  },
  {
    id: 'cert-2',
    studentId: 'stu-2',
    studentName: 'ABC Student 2',
    enrollmentNo: 'STUDENT-002',
    departmentName: 'Computer Engineering',
    type: 'TRANSCRIPT',
    purpose: 'Higher Studies & Internship Application',
    status: 'PENDING',
    requestedDate: '2024-03-01'
  }
];

export const CertificatesPage: React.FC = () => {
  const { user, role } = useAuth();
  const [certificates, setCertificates] = useState<CertificateRequest[]>(initialCertificates);
  const [showModal, setShowModal] = useState(false);
  
  // New Request State
  const [certType, setCertType] = useState<CertificateRequest['type']>('BONAFIDE');
  const [purpose, setPurpose] = useState('');

  const currentStudent = role === 'STUDENT' ? db.getStudents().find(s => s.id === user?.id || s.email === user?.email) : null;

  const displayedCerts = role === 'STUDENT'
    ? certificates.filter(c => c.studentId === (currentStudent?.id || 'stu-1'))
    : certificates;

  const handleApplyCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) return;

    const newReq: CertificateRequest = {
      id: `cert-${Date.now()}`,
      studentId: currentStudent?.id || 'stu-1',
      studentName: currentStudent?.name || user?.name || 'ABC Student 1',
      enrollmentNo: currentStudent?.enrollmentNo || 'STUDENT-001',
      departmentName: 'Computer Engineering',
      type: certType,
      purpose,
      status: 'PENDING',
      requestedDate: new Date().toISOString().split('T')[0]
    };

    setCertificates([newReq, ...certificates]);
    setShowModal(false);
    setPurpose('');
  };

  const handleApproveAndIssue = (id: string) => {
    setCertificates(certificates.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: 'ISSUED',
          issuedDate: new Date().toISOString().split('T')[0],
          certificateNo: `SSIU/CERT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
          fileUrl: 'https://swarrnim.edu.in/docs/official-certificate.pdf'
        };
      }
      return c;
    }));
  };

  const handleDownload = (cert: CertificateRequest) => {
    const content = `SWARRNIM STARTUP & INNOVATION UNIVERSITY
OFFICIAL ${cert.type} CERTIFICATE
Certificate No: ${cert.certificateNo || 'SSIU/TEMP/001'}
Student Name: ${cert.studentName}
Enrollment No: ${cert.enrollmentNo}
Department: ${cert.departmentName}
Purpose: ${cert.purpose}
Status: VERIFIED & ISSUED
Issued Date: ${cert.issuedDate || new Date().toISOString().split('T')[0]}

This document is electronically verified by Swarrnim University Academic Registrar.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cert.type}_${cert.enrollmentNo}.txt`;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Official University Certificates &amp; Bonafide Portal
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {role === 'STUDENT' 
              ? 'Request official Bonafide, Character, and Transcript certificates with instant verification' 
              : 'Approve student certificate applications and generate official University e-certificates'}
          </p>
        </div>

        {role === 'STUDENT' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Apply for New Certificate
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
          Certificate Applications Register ({displayedCerts.length})
        </h3>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Cert No / ID</th>
                <th>Student Candidate</th>
                <th>Certificate Type</th>
                <th>Purpose</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedCerts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No certificate requests found.</td></tr>
              ) : (
                displayedCerts.map(cert => (
                  <tr key={cert.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{cert.certificateNo || cert.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{cert.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cert.enrollmentNo}</div>
                    </td>
                    <td>
                      <Badge variant="navy">{cert.type}</Badge>
                    </td>
                    <td style={{ fontSize: '0.8125rem', maxWidth: '240px' }}>{cert.purpose}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{cert.requestedDate}</td>
                    <td>
                      <Badge variant={cert.status === 'ISSUED' ? 'active' : cert.status === 'PENDING' ? 'orange' : 'inactive'}>
                        {cert.status}
                      </Badge>
                    </td>
                    <td>
                      {cert.status === 'ISSUED' ? (
                        <button onClick={() => handleDownload(cert)} className="btn btn-primary btn-sm">
                          <Download size={14} /> Download Certificate
                        </button>
                      ) : (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'REGISTRAR' || role === 'STUDENT_SECTION' || role === 'EXAM_CELL' || role === 'PRINCIPAL') ? (
                        <button onClick={() => handleApproveAndIssue(cert.id)} className="btn btn-active btn-sm">
                          <CheckCircle size={14} /> Approve &amp; Issue
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Under Processing</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Apply for Official Certificate
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleApplyCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label">Certificate Type *</label>
                <select className="form-select" value={certType} onChange={e => setCertType(e.target.value as any)}>
                  <option value="BONAFIDE">Bonafide Certificate</option>
                  <option value="CHARACTER">Character Certificate</option>
                  <option value="TRANSCRIPT">Official Marksheet Transcript</option>
                  <option value="PROVISIONAL_DEGREE">Provisional Degree Certificate</option>
                  <option value="TRANSFER">College Transfer Certificate (TC)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Purpose of Application *</label>
                <textarea required className="form-input" rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Specify reason (e.g., Passport application, Bank education loan, Higher studies)..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
