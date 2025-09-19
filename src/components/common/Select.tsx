import React from 'react';
import TooltipIcon from './TooltipIcon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  tooltip?: string;
}

const Select: React.FC<SelectProps> = ({
  name,
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  placeholder,
  label,
  tooltip
}) => {
  const baseClasses = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className={label ? 'relative min-h-20' : 'relative'}>
      {label && (
        <div className="flex items-center mb-2">
          <label htmlFor={name} className="block text-sm font-medium text-slate-400">
            {label}
          </label>
          {tooltip && <TooltipIcon tooltip={tooltip} />}
        </div>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseClasses} ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;