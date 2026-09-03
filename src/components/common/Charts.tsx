import React, { useState } from 'react';

export interface PieChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  title: string;
  data: PieChartItem[];
  unit?: string;
  summaryText?: string;
  badgeLabel?: string;
  color?: string;
}

const GOOGLE_FORMS_PALETTE = [
  '#4285F4', // Blue
  '#EA4335', // Red
  '#F59E0B', // Gold
  '#34A853', // Green
  '#8E24AA', // Purple
  '#06B6D4', // teal
  '#FF6D00', // Orange
  '#46BDC6'  // Teal
];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  unit = '',
  summaryText,
  badgeLabel = 'RESPONSES'
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalValue = data.reduce((acc, item) => acc + item.value, 0);

  // Assign Google Forms default colors if not provided
  const itemsWithColor = data.map((item, idx) => ({
    ...item,
    color: item.color || GOOGLE_FORMS_PALETTE[idx % GOOGLE_FORMS_PALETTE.length]
  }));

  // Calculate SVG Pie/Donut Slices
  let cumulativeAngle = 0;

  const slices = itemsWithColor.map((item, idx) => {
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    const angle = (item.value / (totalValue || 1)) * 360;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const radius = 72;
    const innerRadius = 42;
    const center = 90;

    const x1 = center + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = center + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = center + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = center + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const ix1 = center + innerRadius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const iy1 = center + innerRadius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const ix2 = center + innerRadius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const iy2 = center + innerRadius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;

    // SVG arc path formula
    const pathData = angle >= 359.9
      ? `M ${center - radius} ${center} A ${radius} ${radius} 0 1 0 ${center + radius} ${center} A ${radius} ${radius} 0 1 0 ${center - radius} ${center} M ${center - innerRadius} ${center} A ${innerRadius} ${innerRadius} 0 1 1 ${center + innerRadius} ${center} A ${innerRadius} ${innerRadius} 0 1 1 ${center - innerRadius} ${center}`
      : `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix2} ${iy2}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
        Z
      `;

    return {
      ...item,
      percentage: Math.round(percentage * 10) / 10,
      pathData,
      idx
    };
  });

  const dominantItem = [...slices].sort((a, b) => b.value - a.value)[0];

  const totalFormatted = `${unit}${totalValue.toLocaleString()}`;

  const getScaledFontSize = (str: string): string => {
    const len = str.length;
    if (len <= 4) return '1.25rem';
    if (len <= 6) return '1.05rem';
    if (len <= 8) return '0.88rem';
    return '0.75rem';
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.15rem', height: '100%', boxSizing: 'border-box' }}>
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          {title}
        </h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4', background: '#E8F0FE', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
          {badgeLabel}
        </span>
      </div>

      {/* Donut Chart + Legend Container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Google Forms Round Donut Visual */}
        <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0, margin: '0 auto' }}>
          <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;

              return (
                <g key={slice.idx}>
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                      transformOrigin: '90px 90px',
                      cursor: 'pointer',
                      opacity: hoveredIdx !== null && !isHovered ? 0.65 : 1,
                      filter: isHovered ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))' : 'none'
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center Total Count Label (Strictly bounded inside inner circle) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '78px',
              height: '78px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              padding: '4px',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                fontSize: getScaledFontSize(totalFormatted),
                fontWeight: 900,
                color: 'var(--brand-navy)',
                lineHeight: 1.1,
                maxWidth: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {totalFormatted}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginTop: '0.15rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap'
              }}
            >
              TOTAL
            </span>
          </div>
        </div>

        {/* Google Forms Category Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '170px' }}>
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;

            return (
              <div
                key={slice.idx}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
                  border: isHovered ? '1px solid var(--border-color)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0 }}></span>
                  <span style={{ fontWeight: isHovered ? 800 : 600, color: 'var(--brand-navy)' }}>{slice.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{slice.percentage}%</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({unit}{slice.value.toLocaleString()})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytical Summary & Explanation Below Chart */}
      <div style={{ background: 'var(--bg-surface-hover)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
        <div style={{ fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
          📊 Data Summary &amp; Category Breakdown
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
          {summaryText || `Distribution analysis highlights '${dominantItem?.label || 'N/A'}' as the largest response segment with ${dominantItem?.percentage || 0}% (${unit}${dominantItem?.value.toLocaleString()}) out of ${totalValue.toLocaleString()} total recorded entries.`}
        </p>
      </div>
    </div>
  );
};

// Aliases for compatibility
export const BarChart = PieChart;
export const LineChart = PieChart;
