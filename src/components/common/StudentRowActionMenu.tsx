import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { 
  Pencil, Eye, FolderCheck, Award, Clock, 
  ShieldCheck, MessageSquare 
} from 'lucide-react';

export interface StudentRowActionMenuProps {
  student: Student | { id: string; name: string; enrollmentNo: string; [key: string]: any };
  statusLevel?: 'good' | 'warning' | 'critical' | 'none';
  onViewProfile?: () => void;
  onViewDocuments?: () => void;
  onViewAcademic?: () => void;
  onViewAttendance?: () => void;
  onViewExamination?: () => void;
  onViewRequests?: () => void;
  align?: 'right' | 'left';
}

export const StudentRowActionMenu: React.FC<StudentRowActionMenuProps> = ({
  student,
  statusLevel = 'none',
  onViewProfile,
  onViewDocuments,
  onViewAcademic,
  onViewAttendance,
  onViewExamination,
  onViewRequests,
  align = 'right'
}) => {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Do not render staff action menu for student role
  if (role === 'STUDENT') {
    return null;
  }

  // Permission checks
  const canViewDocuments = Boolean(onViewDocuments);
  const canViewAcademic = Boolean(onViewAcademic);
  const canViewAttendance = Boolean(onViewAttendance);
  const canViewExamination = Boolean(onViewExamination);
  const canViewRequests = Boolean(onViewRequests);

  const handleAction = (callback?: () => void) => {
    setIsOpen(false);
    if (callback) {
      callback();
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="student-row-action-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title={`Student Actions${statusLevel === 'critical' ? ' • Critical Attention Required' : statusLevel === 'warning' ? ' • Attention Required' : ''}`}
        aria-label="Student Actions"
        aria-expanded={isOpen}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '6px',
          border: isOpen ? '1.5px solid var(--brand-orange)' : '1px solid #CBD5E1',
          background: isOpen ? '#FFF7ED' : '#FFFFFF',
          color: isOpen ? 'var(--brand-orange)' : 'var(--brand-navy)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(245, 130, 32, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
          padding: 0,
          position: 'relative'
        }}
      >
        <Pencil size={15} />

        {/* Small Action Status Dot Indicator */}
        {statusLevel === 'critical' && (
          <span 
            title="Critical Action / Issue Pending"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.4)'
            }} 
          />
        )}
        {statusLevel === 'warning' && (
          <span 
            title="Action / Attention Required"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.4)'
            }} 
          />
        )}
      </button>

      {isOpen && (
        <div
          className="student-action-popover"
          style={{
            position: 'absolute',
            [align]: 0,
            top: 'calc(100% + 4px)',
            minWidth: '200px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            padding: '0.35rem',
            zIndex: 9999,
            textAlign: 'left',
            animation: 'fadeIn 0.12s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '0.35rem 0.5rem 0.25rem 0.5rem', borderBottom: '1px solid #F1F5F9', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.name}
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--brand-orange)', fontFamily: 'monospace', fontWeight: 700 }}>
              {student.enrollmentNo}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {/* 1. View Profile */}
            {onViewProfile && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewProfile)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Eye size={14} color="#2563EB" />
                <span>View Profile</span>
              </button>
            )}

            {/* 2. Documents */}
            {canViewDocuments && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewDocuments)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FolderCheck size={14} color="#D97706" />
                <span>Documents</span>
              </button>
            )}

            {/* 3. Academic Overview */}
            {canViewAcademic && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewAcademic)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Award size={14} color="#059669" />
                <span>Academic Overview</span>
              </button>
            )}

            {/* 4. Attendance */}
            {canViewAttendance && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewAttendance)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Clock size={14} color="#4F46E5" />
                <span>Attendance</span>
              </button>
            )}

            {/* 5. Examination / Marks */}
            {canViewExamination && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewExamination)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ShieldCheck size={14} color="#7C3AED" />
                <span>Examination / Marks</span>
              </button>
            )}

            {/* 6. Student Requests */}
            {canViewRequests && (
              <button
                type="button"
                className="student-action-item"
                onClick={() => handleAction(onViewRequests)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  background: 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <MessageSquare size={14} color="#DB2777" />
                <span>Student Requests</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
