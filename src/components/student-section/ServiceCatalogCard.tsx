import React, { useState } from 'react';
import {
  StudentSectionService,
  StudentServiceCategory,
} from '../../types/studentSection';
import {
  FileText, Award, GraduationCap, CreditCard, Search,
  ArrowRightLeft, Layers, Stamp, Zap, Clock, IndianRupee,
  ChevronRight, ShieldCheck, BookOpen
} from 'lucide-react';

interface ServiceCatalogCardProps {
  service: StudentSectionService;
  onApply: (service: StudentSectionService) => void;
}

const categoryConfig: Record<
  StudentServiceCategory,
  { iconName: string; color: string; bg: string; label: string }
> = {
  CERTIFICATE: { iconName: 'ShieldCheck', color: '#0F2C59', bg: '#EEF4FB', label: 'Certificate' },
  TRANSCRIPT:  { iconName: 'FileText',    color: '#7C3AED', bg: '#EDE9FE', label: 'Transcript' },
  DEGREE:      { iconName: 'GraduationCap', color: '#0369A1', bg: '#E0F2FE', label: 'Degree' },
  DUPLICATE_ID:{ iconName: 'CreditCard',  color: '#B45309', bg: '#FEF3C7', label: 'Duplicate ID' },
  VERIFICATION:{ iconName: 'Search',      color: '#065F46', bg: '#D1FAE5', label: 'Verification' },
  MIGRATION:   { iconName: 'ArrowRightLeft', color: '#9A3412', bg: '#FFEDD5', label: 'Migration' },
  TRANSFER:    { iconName: 'Layers',      color: '#1E40AF', bg: '#DBEAFE', label: 'Transfer' },
  MARKSHEET:   { iconName: 'Stamp',       color: '#6B21A8', bg: '#F3E8FF', label: 'Marksheet' },
  OTHER:       { iconName: 'BookOpen',    color: '#374151', bg: '#F3F4F6', label: 'Other' },
};

const CategoryIcon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => {
  const props = { size, color };
  switch (name) {
    case 'ShieldCheck':    return <ShieldCheck {...props} />;
    case 'FileText':       return <FileText {...props} />;
    case 'GraduationCap': return <GraduationCap {...props} />;
    case 'CreditCard':     return <CreditCard {...props} />;
    case 'Search':         return <Search {...props} />;
    case 'ArrowRightLeft': return <ArrowRightLeft {...props} />;
    case 'Layers':         return <Layers {...props} />;
    case 'Stamp':          return <Stamp {...props} />;
    default:               return <BookOpen {...props} />;
  }
};

export const ServiceCatalogCard: React.FC<ServiceCatalogCardProps> = ({ service, onApply }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = categoryConfig[service.category] ?? categoryConfig.OTHER;

  const modeLabel = '📦 Physical Hardcopy';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: `1.5px solid ${hovered ? '#F37023' : '#E2E8F0'}`,
        boxShadow: hovered ? '0 8px 28px rgba(243,112,35,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Accent top strip */}
      <div style={{
        height: '4px',
        background: hovered
          ? 'linear-gradient(90deg, #F37023 0%, #0F2C59 100%)'
          : `linear-gradient(90deg, ${cfg.color}44 0%, ${cfg.color}11 100%)`,
        transition: 'background 0.2s',
      }} />

      {/* Body */}
      <div style={{ padding: '1.25rem 1.25rem 0 1.25rem', flex: 1 }}>
        {/* Icon + Category pill */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '10px',
            background: cfg.bg, color: cfg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CategoryIcon name={cfg.iconName} size={22} color={cfg.color} />
          </div>
          <span style={{
            fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase' as const,
            letterSpacing: '0.5px', padding: '3px 9px', borderRadius: '20px',
            backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Service Name */}
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#0F2C59', margin: '0 0 0.3rem 0', lineHeight: 1.3 }}>
          {service.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.875rem 0',
          lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {service.description}
        </p>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.375rem', marginBottom: '0.875rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.71875rem', fontWeight: 700, color: '#1E293B',
            backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            <Clock size={11} />
            {service.processingDays} {service.processingDays === 1 ? 'Working Day' : 'Working Days'}
          </span>

          {service.urgentProcessingDays > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.71875rem', fontWeight: 700, color: '#92400E',
              backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
              padding: '3px 8px', borderRadius: '20px',
            }}>
              <Zap size={11} />
              Urgent: {service.urgentProcessingDays}d
            </span>
          )}

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '0.6875rem', fontWeight: 600, color: '#64748B',
            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '0.75rem',
        background: '#FAFBFC',
      }}>
        <div>
          <div style={{
            fontSize: '1.125rem', fontWeight: 900,
            color: service.fee === 0 ? '#16A34A' : '#0F2C59',
            display: 'flex', alignItems: 'center', gap: '2px',
          }}>
            {service.fee === 0 ? 'FREE' : (<><IndianRupee size={13} strokeWidth={2.5} />{service.fee}</>)}
          </div>
          {service.urgentFee > 0 && (
            <div style={{ fontSize: '0.6875rem', color: '#D97706', fontWeight: 600 }}>
              +₹{service.urgentFee} urgent
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onApply(service)}
          disabled={!service.isActive}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 800,
            borderRadius: '8px', border: 'none',
            backgroundColor: service.isActive ? '#F37023' : '#94A3B8',
            color: '#FFFFFF',
            cursor: service.isActive ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s', whiteSpace: 'nowrap' as const, flexShrink: 0,
          }}
        >
          {service.isActive ? (<>Apply <ChevronRight size={14} /></>) : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};
