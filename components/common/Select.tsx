import React from 'react';
import TooltipIcon from './TooltipIcon';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  tooltip?: string;
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, name, options, tooltip, error, ...props }) => {
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const defaultClasses = 'border-slate-600 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div className="space-y-2 h-24">
      <div className="flex items-center">
        <label htmlFor={name} className="block text-sm font-medium text-slate-400">
          {label}
        </label>
        {tooltip && <TooltipIcon text={tooltip} />}
      </div>
      <select
        id={name}
        name={name}
        className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${error ? errorClasses : defaultClasses}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Select;