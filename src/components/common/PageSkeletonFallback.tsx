import React from 'react';

interface PageSkeletonFallbackProps {
  title?: string;
}

export const PageSkeletonFallback: React.FC<PageSkeletonFallbackProps> = ({ title = 'Loading Module...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        width: '100%',
        minHeight: '60vh',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header Bar Skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div
            style={{
              width: '240px',
              height: '24px',
              background: '#e2e8f0',
              borderRadius: '6px',
            }}
          />
          <div
            style={{
              width: '380px',
              height: '14px',
              background: '#f1f5f9',
              borderRadius: '4px',
            }}
          />
        </div>
        <div
          style={{
            width: '120px',
            height: '36px',
            background: '#e2e8f0',
            borderRadius: '6px',
          }}
        />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '96px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ width: '40%', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ width: '70%', height: '28px', background: '#cbd5e1', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div
        style={{
          flex: 1,
          height: '320px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '200px', height: '32px', background: '#e2e8f0', borderRadius: '6px' }} />
          <div style={{ width: '120px', height: '32px', background: '#e2e8f0', borderRadius: '6px' }} />
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            style={{
              width: '100%',
              height: '36px',
              background: row % 2 === 0 ? '#f1f5f9' : '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    </div>
  );
};
