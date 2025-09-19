import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title
}) => {
  const baseClasses = 'bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 p-6';

  return (
    <div className={`${baseClasses} ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-slate-200 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;