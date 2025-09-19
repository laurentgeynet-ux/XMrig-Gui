import React from 'react';

interface HeaderProps {
  onAboutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAboutClick }) => {
  return (
    <header className="relative text-center py-4">
      <div className="flex justify-center items-center">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            XMRig GUI Configurator
          </h1>
          <p className="mt-2 text-slate-400">
            Easily configure your XMRig miner and generate the launch command.
          </p>
        </div>
      </div>
      <button
        onClick={onAboutClick}
        className="absolute top-1/2 right-0 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors duration-200 p-2"
        aria-label="About this application"
      >
        <i className="fas fa-info-circle fa-2x"></i>
      </button>
    </header>
  );
};

export default Header;
