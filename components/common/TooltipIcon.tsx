import React from 'react';

interface TooltipIconProps {
  text: string;
}

const TooltipIcon: React.FC<TooltipIconProps> = ({ text }) => {
  return (
    <div className="group relative flex items-center">
      <i className="fas fa-question-circle text-slate-500 ml-2 cursor-help"></i>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs
                       bg-slate-700 text-white text-xs rounded-md py-1.5 px-3 z-10
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {text}
        <svg className="absolute text-slate-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </span>
    </div>
  );
};

export default TooltipIcon;
