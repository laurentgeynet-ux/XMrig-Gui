
import React from 'react';

interface CardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 h-full">
      <h3 className="text-xl font-semibold mb-6 text-indigo-400 flex items-center">
        <i className={`fas ${icon} mr-3`}></i>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
