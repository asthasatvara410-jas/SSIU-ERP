/**
 * SSIU ERP — Staff & Faculty Login Account Provisioning & Status Modal
 * File: src/modules/staff/components/StaffFacultyAccountModal.tsx
 *
 * Integrates directly with existing Central User Management Service & Auth Context.
 */

import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  X,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import { userAccountManagementService } from '../../../services/userAccountManagementService';
import { db } from '../../../services/db';
import { useAuth } from '../../../context/AuthContext';
import { User, AccountStatus, UserRole } from '../../../types';

export interface TargetFacultyAccountInfo {
  facultyId: string;
  name: string;
  employeeId?: string;
  email?: string;
  designation?: string;
  departmentName?: string;
  departmentId?: string;
  instituteId?: string;
  role?: string;
}

interface StaffFacultyAccountModalProps {
  target: TargetFacultyAccountInfo;
  onClose: () => void;
  onAccountUpdated?: () => void;
}

export const StaffFacultyAccountModal: React.FC<StaffFacultyAccountModalProps> = ({
  target,
  onClose,
  onAccountUpdated,
}) => {
  const { user: currentUser } = useAuth();
  
  // Find existing login account
  const allUsers = db.getUsers();
  const existingUser = allUsers.find(
    u => (target.employeeId && (u.employeeId === target.employeeId || u.username === target.employeeId)) ||
         (target.email && u.email?.toLowerCase() === target.email.toLowerCase()) ||
         u.id === target.facultyId
  );

  // Modal Subtab / View State
  const [viewState, setViewState] = useState<'DETAILS' | 'CREATE' | 'RESET_PASSWORD' | 'SUCCESS_SLIP'>(
    existingUser ? 'DETAILS' : 'CREATE'
  );

  // Form State for Creation
  const loginId = target.employeeId || `EMP-${target.facultyId.slice(-4)}`;
  const [formFullName, setFormFullName] = useState(target.name || '');
  const [formEmail, setFormEmail] = useState(target.email || `${loginId.toLowerCase()}@swarrnim.edu.in`);
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(
    (target.role as UserRole) || (target.designation?.toUpperCase().includes('HOD') ? 'HOD' : 'FACULTY')
  );
  const [formAccountStatus, setFormAccountStatus] = useState<AccountStatus>('ACTIVE');
  const [formForcePasswordReset, setFormForcePasswordReset] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Reset Password State
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [forceResetOnNextLogin, setForceResetOnNextLogin] = useState(true);

  // Created Slip State
  const [createdSlip, setCreatedSlip] = useState<{
    loginId: string;
    temporaryPassword?: string;
    fullName: string;
    role: string;
    status: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Password Generation Helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let gen = '';
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(gen);
    setFormConfirmPassword(gen);
  };

  const handleGenerateResetPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let gen = '';
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewResetPassword(gen);
    setConfirmResetPassword(gen);
  };

  // Create User Account Handler
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formPassword) {
      setErrorMessage('Please generate or enter a temporary password.');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const created = userAccountManagementService.createUser(
        {
          username: loginId.trim(),
          name: formFullName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          employeeId: loginId.trim(),
          departmentId: target.departmentId,
          instituteId: target.instituteId,
          designation: target.designation,
          accountStatus: formAccountStatus,
          forcePasswordReset: formForcePasswordReset,
        },
        currentUser
      );

      setCreatedSlip({
        loginId: created.username || loginId,
        temporaryPassword: formPassword,
        fullName: created.name,
        role: created.role,
        status: created.accountStatus || 'ACTIVE',
      });
      setViewState('SUCCESS_SLIP');
      onAccountUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user account.');
    }
  };

  // Reset Password Handler
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingUser) return;
    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      userAccountManagementService.resetPassword(
        existingUser.id,
        newResetPassword,
        forceResetOnNextLogin,
        currentUser
      );
      setCreatedSlip({
        loginId: existingUser.username || loginId,
        temporaryPassword: newResetPassword,
        fullName: existingUser.name || target.name,
        role: existingUser.role,
        status: existingUser.accountStatus || 'ACTIVE',
      });
      setViewState('SUCCESS_SLIP');
      onAccountUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    }
  };

  // Toggle Account Active / Inactive
  const handleToggleStatus = () => {
    if (!existingUser) return;
    const current = existingUser.accountStatus || (existingUser.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    const targetStatus: AccountStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      userAccountManagementService.toggleAccountStatus(existingUser.id, targetStatus, currentUser);
      showToast(`Account status updated to ${targetStatus}`);
      onAccountUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update account status.');
    }
  };

  // Toggle Lock / Unlock
  const handleToggleLock = () => {
    if (!existingUser) return;
    const isLocked = existingUser.accountStatus === 'LOCKED' || (existingUser.status as any) === 'LOCKED';
    try {
      if (isLocked) {
        userAccountManagementService.unlockUser(existingUser.id, currentUser);
        showToast('Account unlocked successfully.');
      } else {
        userAccountManagementService.lockUser(existingUser.id, 'Administrative security lock from Staff Hub', currentUser);
        showToast('Account locked.');
      }
      onAccountUpdated?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle account lock.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '1.25rem',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--brand-navy, #001F3F)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={22} color="var(--brand-orange, #FF6B00)" />
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {existingUser ? 'Faculty / Staff ERP Login Account' : 'Provision ERP Login Account'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#93C5FD', margin: 0 }}>
                {target.name} ({loginId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
          {/* Toast / Notification */}
          {notification && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} /> {notification}
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          {/* VIEW: DETAILS (When account exists) */}
          {viewState === 'DETAILS' && existingUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Login ID / Username:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-navy, #001F3F)' }}>
                    {existingUser.username}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Account Status:</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background:
                        existingUser.accountStatus === 'ACTIVE' || (existingUser.status === 'ACTIVE' && !existingUser.accountStatus)
                          ? '#D1FAE5'
                          : existingUser.accountStatus === 'LOCKED'
                          ? '#FEE2E2'
                          : '#F3F4F6',
                      color:
                        existingUser.accountStatus === 'ACTIVE' || (existingUser.status === 'ACTIVE' && !existingUser.accountStatus)
                          ? '#065F46'
                          : existingUser.accountStatus === 'LOCKED'
                          ? '#991B1B'
                          : '#374151',
                    }}
                  >
                    {existingUser.accountStatus || existingUser.status || 'ACTIVE'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Assigned Role:</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-orange, #FF6B00)' }}>{existingUser.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Registered Email:</span>
                  <span style={{ fontFamily: 'monospace', color: '#334155' }}>{existingUser.email}</span>
                </div>
              </div>

              {/* Action Buttons for Existing User */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {existingUser.accountStatus === 'ACTIVE' || existingUser.status === 'ACTIVE' ? (
                    <>
                      <UserX size={14} color="#EF4444" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} color="#10B981" /> Activate
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {existingUser.accountStatus === 'LOCKED' ? (
                    <>
                      <Unlock size={14} color="#10B981" /> Unlock Account
                    </>
                  ) : (
                    <>
                      <Lock size={14} color="#EF4444" /> Lock Account
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setViewState('RESET_PASSWORD');
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Key size={14} /> Reset Password
                </button>
              </div>
            </div>
          )}

          {/* VIEW: CREATE ACCOUNT */}
          {viewState === 'CREATE' && (
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Login ID (Employee Code) *
                  </label>
                  <input
                    type="text"
                    value={loginId}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#F1F5F9',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: 'var(--brand-navy, #001F3F)',
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Read-only official identifier</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Official Email *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Password Generator Area */}
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontWeight: 700, color: '#334155' }}>Temporary Password *</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-orange, #FF6B00)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={14} /> Generate Secure Password
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Temporary password"
                    value={formPassword}
                    onChange={e => {
                      setFormPassword(e.target.value);
                      setFormConfirmPassword(e.target.value);
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Confirm password"
                    value={formConfirmPassword}
                    onChange={e => setFormConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={formForcePasswordReset}
                    onChange={e => setFormForcePasswordReset(e.target.checked)}
                  />
                  Force Password Change on First Login (Recommended)
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                >
                  <Check size={14} /> Create Login Account
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {viewState === 'RESET_PASSWORD' && existingUser && (
            <form onSubmit={handleSaveResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 700, color: '#334155' }}>New Temporary Password *</label>
                <button
                  type="button"
                  onClick={handleGenerateResetPassword}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-orange, #FF6B00)',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={14} /> Generate Password
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="New password"
                  value={newResetPassword}
                  onChange={e => {
                    setNewResetPassword(e.target.value);
                    setConfirmResetPassword(e.target.value);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                />
                <input
                  type="text"
                  placeholder="Confirm password"
                  value={confirmResetPassword}
                  onChange={e => setConfirmResetPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={forceResetOnNextLogin}
                  onChange={e => setForceResetOnNextLogin(e.target.checked)}
                />
                Force Password Change on Next Login
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setViewState('DETAILS');
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                >
                  <Key size={14} /> Update Password
                </button>
              </div>
            </form>
          )}

          {/* VIEW: SUCCESS SLIP */}
          {viewState === 'SUCCESS_SLIP' && createdSlip && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <CheckCircle2 size={24} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Login Account Successfully Provisioned</div>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                    Share these credentials securely with {createdSlip.fullName}.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Login ID:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--brand-navy, #001F3F)' }}>
                      {createdSlip.loginId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSlip.loginId);
                        showToast('Login ID copied to clipboard.');
                      }}
                      style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}
                      title="Copy Login ID"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Temporary Password:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--brand-orange, #FF6B00)' }}>
                      {createdSlip.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSlip.temporaryPassword || '');
                        showToast('Temporary Password copied to clipboard.');
                      }}
                      style={{ background: '#E2E8F0', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}
                      title="Copy Password"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.4' }}>
                Note: The user will be required to create a new secure password upon their first login attempt.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1.5rem', fontWeight: 800 }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
