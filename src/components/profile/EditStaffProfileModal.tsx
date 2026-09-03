import React, { useState } from 'react';
import { X, User, Phone, MapPin, HeartHandshake, BookOpen, Lock, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StaffNormalizedProfile } from '../../services/staffProfileService';

interface EditStaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StaffNormalizedProfile;
  onSave: (updates: {
    phone?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    specialization?: string;
    avatar?: string;
  }) => void;
}

export const EditStaffProfileModal: React.FC<EditStaffProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [phone, setPhone] = useState(profile.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(profile.alternatePhone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [city, setCity] = useState(profile.city || '');
  const [state, setState] = useState(profile.state || 'Gujarat');
  const [pincode, setPincode] = useState(profile.pincode || '');
  const [bloodGroup, setBloodGroup] = useState(profile.bloodGroup || 'B+');
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone || '');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(profile.emergencyContactRelation || '');
  const [specialization, setSpecialization] = useState(profile.specialization || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');

  const [activeSubTab, setActiveSubTab] = useState<'CONTACT' | 'ADDRESS' | 'EMERGENCY' | 'ACADEMIC'>('CONTACT');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Official mobile phone number is required.');
      return;
    }

    onSave({
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      bloodGroup,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      specialization: specialization.trim(),
      avatar: avatar.trim()
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(243, 112, 35, 0.15)',
                border: '1px solid var(--brand-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-orange)'
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>
                Edit Employee Profile
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                {profile.name} • {profile.employeeId} ({profile.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Read-Only Governance Notice */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            fontSize: '0.75rem',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Institutional RBAC Notice:</strong> Employee ID, Role, Department, Institute, and Reporting Line are statutory read-only fields managed by the Central Registrar &amp; HR Office.
          </span>
        </div>

        {/* Sub-Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem 0 1.5rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          {[
            { id: 'CONTACT', label: 'Contact & Phone', icon: Phone },
            { id: 'ADDRESS', label: 'Residential Address', icon: MapPin },
            { id: 'EMERGENCY', label: 'Emergency Contact', icon: HeartHandshake },
            { id: 'ACADEMIC', label: 'Specialization & Avatar', icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 800 : 600,
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--brand-orange)' : '3px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--brand-navy)' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Icon size={15} color={isActive ? 'var(--brand-orange)' : '#64748B'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div
                style={{
                  padding: '0.65rem 0.9rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Sub-tab 1: Contact */}
            {activeSubTab === 'CONTACT' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Primary Mobile Phone *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98250 10001"
                    required
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Alternate Mobile Phone
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={alternatePhone}
                    onChange={e => setAlternatePhone(e.target.value)}
                    placeholder="+91 98250 99881"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Blood Group
                  </label>
                  <select
                    className="form-control"
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Official Institutional Email (Read-Only)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.officialEmail}
                    disabled
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem', backgroundColor: '#F1F5F9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            )}

            {/* Sub-tab 2: Address */}
            {activeSubTab === 'ADDRESS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Permanent / Residential Address
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Quarters / Street, Society, Landmark"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Gandhinagar / Ahmedabad"
                      style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="Gujarat"
                      style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      placeholder="382420"
                      style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Emergency Contact */}
            {activeSubTab === 'EMERGENCY' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Emergency Contact Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={emergencyContactName}
                    onChange={e => setEmergencyContactName(e.target.value)}
                    placeholder="Contact person name"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={emergencyContactPhone}
                    onChange={e => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98250 99999"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Relationship
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={emergencyContactRelation}
                    onChange={e => setEmergencyContactRelation(e.target.value)}
                    placeholder="Spouse / Parent / Sibling"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            )}

            {/* Sub-tab 4: Academic & Avatar */}
            {activeSubTab === 'ACADEMIC' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Academic / Research Specialization
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder="e.g. Distributed Systems, Cloud Computing, AI Architectures"
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    Profile Photo / Avatar URL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
