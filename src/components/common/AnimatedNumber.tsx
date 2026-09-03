import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState<string | number>(value);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const strVal = String(value).trim();
    // Match numeric formats like "1,280", "1280", "92.4%", "₹24.5L", "36"
    const match = strVal.match(/^([^\d.-]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const rawNumStr = match[2].replace(/,/g, '');
    const targetNum = parseFloat(rawNumStr);
    const suffix = match[3];
    const hasCommas = match[2].includes(',');
    const decimals = match[2].includes('.') ? (match[2].split('.')[1]?.length || 0) : 0;

    if (isNaN(targetNum) || targetNum === 0) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Smooth easeOutCubic (standard enterprise ease)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = targetNum * easeOut;

      let formattedNum = decimals > 0 ? currentVal.toFixed(decimals) : Math.round(currentVal).toString();
      if (hasCommas) {
        const parts = formattedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formattedNum = parts.join('.');
      }

      setDisplayValue(`${prefix}${formattedNum}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <>{displayValue}</>;
};
