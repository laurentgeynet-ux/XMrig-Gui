
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
        XMRig GUI Configurator
      </h1>
      <p className="mt-2 text-slate-400">
        Configurez facilement votre mineur XMRig et générez la commande de lancement.
      </p>
    </header>
  );
};

export default Header;
