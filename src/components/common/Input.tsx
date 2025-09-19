
import React, { useState, useEffect, useRef } from 'react';
import TooltipIcon from './TooltipIcon';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string;
  error?: string;
  buttonIcon?: string;
  onButtonClick?: () => void;
  dataListOptions?: string[];
}

const Input: React.FC<InputProps> = ({ label, name, tooltip, className, error, buttonIcon, onButtonClick, dataListOptions, onChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const defaultClasses = 'border-slate-600 focus:ring-indigo-500 focus:border-indigo-500';
  const hasButton = buttonIcon && onButtonClick;
  const hasHistory = dataListOptions && dataListOptions.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleOptionClick = (option: string) => {
    if (onChange) {
      const event = {
        target: { name, value: option, type: 'text' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={label ? 'relative min-h-24' : 'relative'}>
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
          className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 transition disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed ${error ? errorClasses : defaultClasses} ${(hasButton || hasHistory) ? 'pr-10' : ''} ${className || ''}`}
          onFocus={() => hasHistory && !hasButton && setIsOpen(true)}
          onChange={onChange}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center justify-center w-10">
          {hasButton ? (
            <button
              type="button"
              onClick={onButtonClick}
              disabled={props.disabled}
              className="text-slate-400 hover:text-indigo-400 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition"
              aria-label="Action button"
            >
              <i className={`fas ${buttonIcon}`}></i>
            </button>
          ) : hasHistory ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-indigo-400"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-label="Toggle history"
            >
              <i className={`fas fa-chevron-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
          ) : null}
        </div>
        
        {isOpen && hasHistory && (
          <ul
            className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {dataListOptions.map((option) => (
              <li
                key={option}
                className="px-4 py-2 text-sm text-slate-200 cursor-pointer hover:bg-indigo-600 hover:text-white"
                onClick={() => handleOptionClick(option)}
                role="option"
                aria-selected={props.value === option}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
