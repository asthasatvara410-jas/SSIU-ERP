import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Student } from '../../types';
import { StudentProfileModal, StudentProfileTabType } from '../../components/profile/StudentProfileModal';
import { studentProfileAccessService } from '../../services/studentProfileAccessService';
import { Search, UserCheck, ArrowLeft, ShieldAlert } from 'lucide-react';

interface StudentProfilePageProps {
  studentId?: string;
  onBack?: () => void;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  studentId,
  onBack
}) => {
  const { user, role, canMutate } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (studentId) {
      const s = db.getStudentById(studentId);
      if (s && user && role && studentProfileAccessService.isUserAuthorizedForStudent(user, role, s)) {
        setSelectedStudent(s);
      }
    } else if (role === 'STUDENT' && user) {
      const s = db.getStudents().find(st => st.id === user.id || st.enrollmentNo === user.enrollmentNo || st.email === user.email);
      if (s) setSelectedStudent(s);
    }
  }, [studentId, user, role]);

  const studentsList = db.getStudents().filter(s => {
    if (!user || !role) return false;
    if (!studentProfileAccessService.isUserAuthorizedForStudent(user, role, s)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner / Breadcrumb */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Official Student Profile &amp; Institutional Record
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Centralized university student dossier with comprehensive academic, attendance, fee, document, and examination credentials
            </p>
          </div>

          {onBack && (
            <button className="btn btn-secondary btn-sm" onClick={onBack}>
              <ArrowLeft size={14} /> Back to Directory
            </button>
          )}
        </div>

        {/* Quick Search Selector if no student selected */}
        {!selectedStudent && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search student by name or enrollment number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '36px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Student List Selector if not yet chosen */}
      {!selectedStudent && (
        <div className="grid-3">
          {studentsList.slice(0, 12).map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className="card"
              style={{
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <img
                src={s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'}
                alt={s.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-navy)' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>{s.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', fontWeight: 700, fontFamily: 'monospace' }}>{s.enrollmentNo}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Status: {s.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Profile Viewer Modal / View */}
      {selectedStudent && (
        <StudentProfileModal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          canMutate={canMutate()}
        />
      )}
    </div>
  );
};
