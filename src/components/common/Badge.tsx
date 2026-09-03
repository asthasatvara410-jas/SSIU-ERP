import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'warning' | 'navy' | 'orange' | 'gold' | 'success' | 'danger' | 'purple';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'active', icon, className = '', style }) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
