import React, { useState } from 'react';
import { StudentGatePass, GatePassPurpose } from '../../types';
import { studentGatePassService } from '../../services/studentGatePassService';
import { X, User, MapPin, Calendar, Clock, Phone, AlertCircle, FileText, Send } from 'lucide-react';

interface StudentGatePassRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  hostel: any;
  allotment: any;
  user: any;
  onSuccess: (newPass: StudentGatePass) => void;
}

export const StudentGatePassRequestModal: React.FC<StudentGatePassRequestModalProps> = ({
  isOpen,
  onClose,
  student,
  hostel,
  allotment,
  user,
  onSuccess
}) => {
  // Form fields
  const [parentName, setParentName] = useState(student?.parentName || 'Mr. Rameshchandra Sharma');
  const [parentPhone, setParentPhone] = useState(student?.parentPhone || '+91 98250 11223');
  const [purpose, setPurpose] = useState<GatePassPurpose>('Personal');
  const [destination, setDestination] = useState('');
  const [outingDate, setOutingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedOutTime, setExpectedOutTime] = useState('17:00');
  const [expectedReturnTime, setExpectedReturnTime] = useState('20:30');
  const [modeOfTravel, setModeOfTravel] = useState('Campus Bus / Public Transport');
  const [emergencyContact, setEmergencyContact] = useState(student?.parentPhone || '+91 98250 11223');
  const [studentRemarks, setStudentRemarks] = useState('');
  const [supportingDocName, setSupportingDocName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please provide destination / visiting place.');
      return;
    }
    if (!parentName.trim() || !parentPhone.trim()) {
      setError('Parent / Guardian name and contact are mandatory.');
      return;
    }

    try {
      const newPass = studentGatePassService.createGatePass(
        {
          studentId: student?.id,
          studentName: student?.name || user?.name,
          enrollmentNo: student?.enrollmentNo || user?.username,
          studentPhoto: student?.photo,
          instituteName: 'SSIT - Institute of Technology',
          departmentName: 'Computer Science & Engineering',
          programName: 'B.Tech CSE',
          semester: 4,
          hostelId: hostel?.id,
          hostelName: hostel?.name,
          roomNo: allotment?.roomNumber || 'A-204',
          bedNo: allotment?.bedNumber || 'Bed-1',
          parentGuardianName: parentName.trim(),
          parentGuardianMobile: parentPhone.trim(),
          purpose,
          destination: destination.trim(),
          outingDate,
          expectedOutTime,
          expectedReturnTime,
          modeOfTravel,
          emergencyContact: emergencyContact.trim() || parentPhone.trim(),
          studentRemarks: studentRemarks.trim(),
          supportingDocument: supportingDocName ? `doc-${Date.now()}.pdf` : undefined
        },
        user
      );

      onSuccess(newPass);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit gate pass request.');
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
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: '680px',
        borderRadius: '6px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
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
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
              Request Student Hostel Gate Pass / Outpass
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
              Submit official outing pass for Chief Warden clearance
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, padding: '1.25rem', gap: '1rem' }}>
          
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Read-Only Academic & Residency Strip */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 1rem', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#64748B', marginBottom: '6px' }}>
              AUTO-FILLED STUDENT &amp; RESIDENCY IDENTIFICATION (VERIFIED)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Student Name:</span>
                <div style={{ fontWeight: 800, color: '#0F2C59' }}>{student?.name || user?.name}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Enrollment No:</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#F37023' }}>{student?.enrollmentNo || user?.username}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Hostel:</span>
                <div style={{ fontWeight: 700, color: '#0F2C59' }}>{hostel?.name || 'Vivekananda Boys Hostel (Block A)'}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.71875rem' }}>Room &amp; Bed:</span>
                <div style={{ fontWeight: 700, color: '#0F2C59' }}>Room {allotment?.roomNumber || 'A-204'} ({allotment?.bedNumber || 'Bed-1'})</div>
              </div>
            </div>
          </div>

          {/* Section 1: Parent & Emergency Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Parent / Guardian Full Name *
              </label>
              <input
                className="form-control"
                placeholder="Parent Name"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Parent / Guardian Contact Mobile *
              </label>
              <input
                className="form-control"
                placeholder="+91 98250 XXXXX"
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Section 2: Outing Purpose & Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Purpose of Leaving Campus *
              </label>
              <select
                className="form-control"
                value={purpose}
                onChange={e => setPurpose(e.target.value as GatePassPurpose)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="Personal">Personal / City Outing</option>
                <option value="Medical">Medical Checkup / Hospital Visit</option>
                <option value="Family Visit">Family Visit (Home / Hometown)</option>
                <option value="Academic">Academic / Library / Seminar</option>
                <option value="Emergency">Urgent Emergency</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Destination / Visiting Location *
              </label>
              <input
                className="form-control"
                placeholder="e.g. Gandhinagar Sector 21 / Apollo Clinic"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Section 3: Date & Expected Timings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Outing Date *
              </label>
              <input
                type="date"
                className="form-control"
                value={outingDate}
                onChange={e => setOutingDate(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Expected Out Time *
              </label>
              <input
                type="time"
                className="form-control"
                value={expectedOutTime}
                onChange={e => setExpectedOutTime(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Expected Return Time *
              </label>
              <input
                type="time"
                className="form-control"
                value={expectedReturnTime}
                onChange={e => setExpectedReturnTime(e.target.value)}
                required
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Section 4: Mode of Travel & Emergency Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Mode of Travel
              </label>
              <select
                className="form-control"
                value={modeOfTravel}
                onChange={e => setModeOfTravel(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="Campus Bus / Public Transport">Campus Bus / GSRTC Bus</option>
                <option value="Personal Vehicle">Personal Two-Wheeler / Car</option>
                <option value="Cab / Auto Rickshaw">Cab / Auto Rickshaw</option>
                <option value="Parent Vehicle">Picked up by Parent / Guardian</option>
                <option value="Train / Metro">Train / Metro Rail</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                Emergency Local Contact
              </label>
              <input
                className="form-control"
                placeholder="+91 XXXXX XXXXX"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Section 5: Student Remarks & Supporting Doc */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
              Student Remarks / Additional Outing Details
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="State any specific details or doctor's appointment schedule..."
              value={studentRemarks}
              onChange={e => setStudentRemarks(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
              Supporting Document (Optional for medical/leave proof)
            </label>
            <input
              type="file"
              className="form-control"
              onChange={e => setSupportingDocName(e.target.files?.[0]?.name || '')}
              style={{ fontSize: '0.75rem' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ background: '#0F2C59', borderColor: '#0F2C59', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> Submit Gate Pass Request
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
