import React, { useState } from 'react';

interface TooltipIconProps {
  tooltip: string;
  className?: string;
}

const TooltipIcon: React.FC<TooltipIconProps> = ({
  tooltip,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="w-4 h-4 rounded-full bg-slate-600 text-slate-300 text-xs flex items-center justify-center cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        ?
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-sm rounded-lg shadow-lg border border-slate-600 whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

export default TooltipIcon;