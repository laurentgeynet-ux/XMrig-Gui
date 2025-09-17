import React from 'react';
import TooltipIcon from './TooltipIcon';

interface ToggleProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltip?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, name, checked, onChange, tooltip }) => {
  return (
    <label htmlFor={name} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          id={name}
          name={name}
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-full bg-indigo-400' : ''}`}></div>
      </div>
      <div className="ml-3 text-slate-300 text-sm font-medium">{label}</div>
      {tooltip && <TooltipIcon text={tooltip} />}
    </label>
  );
};

export default Toggle;
