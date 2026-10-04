import React from 'react';

interface CompassLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export const CompassLogo: React.FC<CompassLogoProps> = ({
  size = 28,
  className = '',
  showText = false,
  textColor = 'text-slate-900'
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:rotate-12"
      >
        <defs>
          <linearGradient id="fpCompassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="fpNeedleNorth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="url(#fpCompassGrad)"
          strokeWidth="2.2"
          className="fill-emerald-50/80"
        />

        {/* Cardinal Axis Markers */}
        <line x1="16" y1="3" x2="16" y2="5.5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="16" y1="26.5" x2="16" y2="29" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="3" y1="16" x2="5.5" y2="16" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="26.5" y1="16" x2="29" y2="16" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />

        {/* Dynamic 45-deg angled compass needle pointing forward */}
        <g transform="rotate(45 16 16)">
          {/* North needle tip */}
          <polygon points="16,4.5 19,16 16,14.5" fill="url(#fpNeedleNorth)" />
          <polygon points="16,4.5 13,16 16,14.5" fill="#34d399" />

          {/* South needle tip */}
          <polygon points="16,27.5 19,16 16,17.5" fill="#94a3b8" />
          <polygon points="16,27.5 13,16 16,17.5" fill="#cbd5e1" />

          {/* Center core */}
          <circle cx="16" cy="16" r="2.5" fill="#0f172a" />
          <circle cx="16" cy="16" r="1" fill="#ffffff" />
        </g>
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight text-base ${textColor}`}>
          FinPilot
        </span>
      )}
    </div>
  );
};
