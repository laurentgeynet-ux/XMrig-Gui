import React from 'react';
import TooltipIcon from './TooltipIcon';

interface ToggleProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ label, name, checked, onChange, tooltip, disabled = false }) => {
  return (
    <label htmlFor={name} className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={name}
          name={name}
          className="sr-only"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div className={`block w-14 h-8 rounded-full transition-colors ${checked && !disabled ? 'bg-indigo-600' : 'bg-slate-600'}`}></div>
        <div className={`dot absolute left-1 top-1 w-6 h-6 rounded-full transition-transform ${
          checked 
            ? 'transform translate-x-full ' + (disabled ? 'bg-slate-500' : 'bg-indigo-400') 
            : (disabled ? 'bg-slate-400' : 'bg-white')
        }`}></div>
      </div>
      <div className="ml-3 text-slate-300 text-sm font-medium">{label}</div>
      {tooltip && <TooltipIcon text={tooltip} />}
    </label>
  );
};

export default Toggle;
