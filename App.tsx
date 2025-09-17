
import React, { useState } from 'react';
import Header from './components/Header';
// FIX: Corrected the import path for the Configurator component.
import Configurator from './components/Configurator';
import Dashboard from './components/Dashboard';
import Tabs from './components/Tabs';
import type { XMRigConfig } from './types';
import { ALGORITHMS, COINS, DEFAULT_CONFIG } from './constants';

export type Tab = 'config' | 'dashboard';

const App: React.FC = () => {
  const [config, setConfig] = useState<XMRigConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleStartMining = () => {
    setIsRunning(true);
    setActiveTab('dashboard');
  };

  const handleStopMining = () => {
    setIsRunning(false);
    setActiveTab('config');
  };

  return (
    <div className="min-h-screen font-sans bg-slate-900 text-slate-300 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Header />
        <main className="mt-8">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} isRunning={isRunning} />
          <div className="mt-6 p-6 bg-slate-800/50 rounded-lg shadow-2xl border border-slate-700">
            {activeTab === 'config' ? (
              <Configurator
                config={config}
                setConfig={setConfig}
                onStart={handleStartMining}
              />
            ) : (
              <Dashboard
                config={config}
                onStop={handleStopMining}
                isRunning={isRunning}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;