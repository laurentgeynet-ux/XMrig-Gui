import React from 'react';
import TooltipIcon from './TooltipIcon';

interface ToggleProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  tooltip?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  name,
  checked,
  onChange,
  disabled = false,
  className = '',
  label,
  tooltip
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        {label && (
          <span className="text-sm font-medium text-slate-400 mr-2">
            {label}
          </span>
        )}
        {tooltip && <TooltipIcon tooltip={tooltip} />}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
    </div>
  );
};

export default Toggle;