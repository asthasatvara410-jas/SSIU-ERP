import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { 
  CreditCard, Download, Printer, ShieldCheck, QrCode, 
  Sparkles, CheckCircle2, UserCheck, Calendar, Phone, Mail, Award
} from 'lucide-react';

export const DigitalIdCardPage: React.FC = () => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const student = db.getStudents().find(
    s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo || s.email === user?.email
  ) || db.getStudents()[0];

  const dept = db.getDepartmentById(student?.departmentId || 'dept-1');
  const inst = db.getInstituteById(student?.instituteId || 'inst-1');
  const prog = db.getProgramById(student?.programId || 'prog-1');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
      {/* Top Action Header */}
      <div className="card" style={{
        width: '100%',
        maxWidth: '800px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={24} color="var(--brand-orange)" /> Official Digital Student ID Card
          </h2>
          <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Government DigiLocker &amp; University QR-Verified Smart Identification Card
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Card
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Download size={16} /> Download ID Card
          </button>
        </div>
      </div>

      {/* ID Card Front & Back Preview */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* ─── FRONT SIDE ─── */}
        <div 
          ref={cardRef}
          style={{
            width: '380px',
            minHeight: '560px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(11, 25, 44, 0.2)',
            background: 'linear-gradient(180deg, #0B192C 0%, #1E3E62 100%)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            border: '2px solid var(--brand-gold)'
          }}
        >
          {/* Top Header */}
          <div style={{
            padding: '1.25rem 1rem',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '2px solid rgba(245, 166, 35, 0.5)'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-gold)', letterSpacing: '1px' }}>
              SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.2rem' }}>
              {inst?.name || 'Swarrnim Institute of Technology'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#CBD5E1', marginTop: '0.1rem' }}>
              Bhoyan Rathod, Gandhinagar, Gujarat - 382420
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            {/* Student Photo */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={student.name}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--brand-orange)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
                }}
              />
              <div style={{
                position: 'absolute', bottom: '2px', right: '2px',
                backgroundColor: '#10B981', color: '#FFF', borderRadius: '50%',
                padding: '4px', border: '2px solid #0B192C'
              }}>
                <CheckCircle2 size={16} />
              </div>
            </div>

            {/* Name & Enrollment */}
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', textAlign: 'center' }}>
              {student.name}
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-gold)',
              backgroundColor: 'rgba(245, 166, 35, 0.15)', padding: '0.25rem 0.75rem',
              borderRadius: '20px', marginTop: '0.35rem', border: '1px solid rgba(245, 166, 35, 0.4)'
            }}>
              ENR: {student.enrollmentNo}
            </div>

            {/* Details Grid */}
            <div style={{ width: '100%', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#94A3B8' }}>Program:</span>
                <strong>{prog?.name || 'B.Tech Computer Engineering'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#94A3B8' }}>Department:</span>
                <strong>{dept?.name || 'Computer Engineering'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#94A3B8' }}>Semester / Batch:</span>
                <strong>Semester 4 • 2024-2028</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#94A3B8' }}>Blood Group:</span>
                <strong style={{ color: '#EF4444' }}>O+ Positive</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Valid Till:</span>
                <strong style={{ color: '#10B981' }}>July 2028</strong>
              </div>
            </div>
          </div>

          {/* Bottom Barcode Strip */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#050D18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10B981', fontSize: '0.7rem', fontWeight: 700 }}>
              <ShieldCheck size={16} /> Verified by DigiLocker
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--brand-gold)', fontWeight: 800 }}>
              DIGITAL ID #SSIU-2026
            </div>
          </div>
        </div>

        {/* ─── BACK SIDE ─── */}
        <div style={{
          width: '380px',
          minHeight: '560px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(11, 25, 44, 0.2)',
          background: 'linear-gradient(180deg, #1E3E62 0%, #0B192C 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '2px solid var(--brand-gold)',
          padding: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-gold)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.5rem' }}>
              TERMS &amp; UNIVERSITY REGULATIONS
            </div>

            <ul style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.75rem', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>This card is non-transferable and remains property of Swarrnim University.</li>
              <li>Must be presented on demand for Examinations, Library &amp; Laboratory access.</li>
              <li>Loss of card must be reported immediately to Student Section office.</li>
              <li>Emergency Contact: +91 98250 11000 / registrar@swarrnim.edu.in</li>
            </ul>

            {/* QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.25rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '12px' }}>
                <QrCode size={100} color="#0B192C" />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.4rem' }}>
                Scan to verify authentic student record
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF' }}>REGISTRAR / CONTROLLER OF EXAMINATIONS</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--brand-gold)', marginTop: '0.1rem' }}>Swarrnim Startup &amp; Innovation University</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DigitalIdCardPage;
