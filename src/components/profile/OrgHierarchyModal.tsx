import React from 'react';
import { X, Network, ShieldCheck, UserCheck, ChevronDown, Building, Award, CheckCircle2 } from 'lucide-react';
import { HierarchyNode } from '../../services/staffProfileService';
import { Badge } from '../common/Badge';

interface OrgHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchyChain: HierarchyNode[];
  currentUserName: string;
  currentUserRole: string;
  departmentName: string;
  instituteName: string;
}

export const OrgHierarchyModal: React.FC<OrgHierarchyModalProps> = ({
  isOpen,
  onClose,
  hierarchyChain,
  currentUserName,
  currentUserRole,
  departmentName,
  instituteName
}) => {
  if (!isOpen) return null;

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
          maxWidth: '850px',
          maxHeight: '90vh',
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
        {/* Modal Header */}
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
              <Network size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF' }}>
                University Organizational &amp; Reporting Hierarchy
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Statutory Governance Tree • {instituteName}
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
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Scrollable Hierarchy */}
        <div
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#F8FAFC'
          }}
        >
          {/* Legend Banner */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <span style={{ color: '#1E40AF', fontWeight: 600 }}>
              Institutional reporting lines from Governing Body down to Faculty &amp; Mentee Students.
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-navy)', fontWeight: 800 }}>
              <CheckCircle2 size={16} color="var(--brand-orange)" /> Current Role: {currentUserRole}
            </span>
          </div>

          {/* Node Tree */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            {hierarchyChain.map((node, index) => {
              const isCurrent = node.isCurrentUser;
              return (
                <React.Fragment key={node.id}>
                  {/* Node Box */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '680px',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      backgroundColor: isCurrent ? '#0B192C' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : 'var(--text-color)',
                      border: isCurrent ? '2px solid var(--brand-orange)' : '1px solid #E2E8F0',
                      boxShadow: isCurrent 
                        ? '0 10px 25px -5px rgba(243, 112, 35, 0.25), 0 8px 10px -6px rgba(11, 25, 44, 0.3)' 
                        : '0 2px 6px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isCurrent && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '16px',
                          background: 'var(--brand-orange)',
                          color: '#FFFFFF',
                          fontSize: '0.6875rem',
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}
                      >
                        YOU ARE HERE
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: isCurrent ? 'var(--brand-orange)' : '#F1F5F9',
                          color: isCurrent ? '#FFFFFF' : 'var(--brand-navy)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.9375rem',
                          border: isCurrent ? '2px solid rgba(255,255,255,0.4)' : '1px solid #CBD5E1',
                          flexShrink: 0
                        }}
                      >
                        {node.level}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isCurrent ? 'var(--brand-gold)' : '#64748B', letterSpacing: '0.5px' }}>
                            {node.title}
                          </span>
                          <Badge variant={isCurrent ? 'orange' : 'navy'}>
                            {node.role}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isCurrent ? '#FFFFFF' : 'var(--brand-navy)' }}>
                          {isCurrent ? currentUserName : node.name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: isCurrent ? '#CBD5E1' : '#64748B' }}>
                          {node.designation} {node.departmentName ? `• ${node.departmentName}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Down Arrow Connector */}
                  {index < hierarchyChain.length - 1 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'var(--brand-orange)',
                        margin: '-4px 0'
                      }}
                    >
                      <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--brand-orange)' }}></div>
                      <ChevronDown size={18} style={{ marginTop: '-4px' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
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
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 800, minWidth: '100px' }}
          >
            Close Hierarchy
          </button>
        </div>
      </div>
    </div>
  );
};
