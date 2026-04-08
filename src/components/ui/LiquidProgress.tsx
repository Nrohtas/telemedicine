"use client";

import React, { useState, useEffect } from "react";

interface LiquidProgressProps {
  value: number;
  size?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

const LiquidProgress = ({
  value,
  size = 100,
  color = "#059669",
  bgColor = "#E1EFEA",
  children,
}: LiquidProgressProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(Math.min(Math.max(value, 0), 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  // Calculate the y-coordinate for the water level.
  // 100 is at the bottom (empty), 0 is at the top (full).
  const y = 100 - displayValue;

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-full border-4 border-white shadow-[inset_0_4px_12px_rgba(0,0,0,0.1),0_8px_16px_-4px_rgba(0,0,0,0.1)] ring-8 ring-gray-50/30"
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <clipPath id="liquidCircleClip">
            <circle cx="50" cy="50" r="50" />
          </clipPath>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        <g clipPath="url(#liquidCircleClip)">
          {/* Background Wave (Deeper/Slower) */}
          <path
            fill="url(#liquidGradient)"
            opacity="0.25"
            className="animate-wave-slow transition-all duration-[3000ms] cubic-bezier(0.4, 0, 0.2, 1)"
            d={`M 0 100 V ${y} Q 25 ${y - 5} 50 ${y} T 100 ${y} T 150 ${y} T 200 ${y} V 100 H 0 Z`}
            style={{ width: '200%' }}
          />
          {/* Foreground Wave (Main/Faster) */}
          <path
            fill="url(#liquidGradient)"
            className="animate-wave-fast transition-all duration-[3000ms] cubic-bezier(0.4, 0, 0.2, 1)"
            d={`M 0 100 V ${y} Q 25 ${y + 5} 50 ${y} T 100 ${y} T 150 ${y} T 200 ${y} V 100 H 0 Z`}
            style={{ width: '200%' }}
          />
          
          {/* Glass Reflection / Shimmer */}
          <ellipse cx="35" cy="25" rx="15" ry="8" fill="white" opacity="0.15" transform="rotate(-20 35 25)" />
          <circle cx="20" cy="40" r="3" fill="white" opacity="0.1" />
        </g>
      </svg>
      
      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none drop-shadow-sm">
        {children}
      </div>
    </div>
  );
};

export default LiquidProgress;
