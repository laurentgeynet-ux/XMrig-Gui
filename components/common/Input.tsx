import React from 'react';
import TooltipIcon from './TooltipIcon';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  buttonIcon?: string;
  onButtonClick?: () => void;
}

const Input: React.FC<InputProps> = ({ label, name, tooltip, className, error, buttonIcon, onButtonClick, ...props }) => {
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const defaultClasses = 'border-slate-600 focus:ring-indigo-500 focus:border-indigo-500';
  const hasButton = buttonIcon && onButtonClick;

  return (
    <div className={label ? 'h-24' : ''}>
      {label && (
        <div className="flex items-center mb-2">
          <label htmlFor={name} className="block text-sm font-medium text-slate-400">
            {label}
          </label>
          {tooltip && <TooltipIcon text={tooltip} />}
        </div>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${error ? errorClasses : defaultClasses} ${hasButton ? 'pr-10' : ''} ${className || ''}`}
          {...props}
        />
        {hasButton && (
           <button
            type="button"
            onClick={onButtonClick}
            disabled={props.disabled}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-indigo-400 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition"
            aria-label="Auto-detect threads"
           >
            <i className={`fas ${buttonIcon}`}></i>
           </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;