import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: LucideIcon | React.ReactNode;
  colorScheme?: 'orange' | 'navy' | 'gold' | 'green' | 'blue';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  description,
  icon,
  colorScheme = 'orange',
  trend,
  onClick
}) => {
  const schemeMap: Record<string, { bg: string; color: string; border: string }> = {
    orange: { bg: '#FFF4ED', color: '#EA580C', border: 'rgba(234, 88, 12, 0.18)' },
    navy: { bg: '#F0F4F8', color: '#0F2C59', border: 'rgba(15, 44, 89, 0.16)' },
    gold: { bg: '#FEF9C3', color: '#D97706', border: 'rgba(217, 119, 6, 0.2)' },
    green: { bg: '#ECFDF5', color: '#059669', border: 'rgba(5, 150, 105, 0.2)' },
    blue: { bg: '#EFF6FF', color: '#2563EB', border: 'rgba(37, 99, 235, 0.2)' }
  };

  const schemeStyles = schemeMap[colorScheme] || schemeMap.orange;
  const subText = subtitle || description;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent size={19} strokeWidth={2} />;
  };

  return (
    <div
      className={`card stat-card-compact card-hover ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #E2E8F0)',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        minHeight: '92px',
        maxHeight: '108px',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1, paddingRight: '0.65rem' }}>
        <span 
          style={{ 
            fontSize: '0.6875rem', 
            fontWeight: 700, 
            color: 'var(--text-muted, #64748B)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2
          }}
          title={title}
        >
          {title}
        </span>
        
        <div 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--text-main, #0F172A)', 
            marginTop: '0.15rem', 
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <AnimatedNumber value={value} />
        </div>

        {subText && (
          <div 
            style={{ 
              fontSize: '0.65625rem', 
              color: 'var(--text-muted, #64748B)', 
              marginTop: '0.15rem', 
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={subText}
          >
            {subText}
          </div>
        )}

        {trend && (
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#059669', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>↑</span> {trend}
          </div>
        )}
      </div>

      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          backgroundColor: schemeStyles.bg,
          color: schemeStyles.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${schemeStyles.border}`,
          flexShrink: 0
        }}
      >
        {renderIcon()}
      </div>
    </div>
  );
};

