import React from 'react';
import logoSvg from '../../assets/SSIUlogo.png';
import collapsedLogoImg from '../../assets/ssiu-collapsed-logo.png';

interface HeaderLogoProps {
  collapsed?: boolean;
  lightMode?: boolean;
  onClick?: () => void;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({ collapsed = false, lightMode = false, onClick }) => {
  if (collapsed) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          cursor: onClick ? 'pointer' : 'default'
        }}
        title="Swarrnim Startup & Innovation University - Go to Dashboard"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <img
            src={collapsedLogoImg}
            alt="SSIU"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.2rem 0',
        minWidth: 0,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
      title="Swarrnim Startup & Innovation University - Go to Dashboard"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src={logoSvg}
        alt="Swarrnim Startup & Innovation University"
        style={{
          height: '42px',
          width: 'auto',
          objectFit: 'contain',
          filter: lightMode ? 'none' : 'brightness(1.05)',
          flexShrink: 0
        }}
      />
    </div>
  );
};
