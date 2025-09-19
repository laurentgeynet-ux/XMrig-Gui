
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Configurator from './components/Configurator';
import Dashboard from './components/Dashboard';
import Tabs from './components/Tabs';
import type { XMRigConfig, MinerStatus } from './types';
import { DEFAULT_CONFIG } from './constants';
import AboutModal from './components/AboutModal';
import packageJson from '../package.json';
import metadata from '../metadata.json';

export type Tab = 'config' | 'dashboard';

const App: React.FC = () => {
  const [config, setConfig] = useState<XMRigConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [minerStatus, setMinerStatus] = useState<MinerStatus>('stopped');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Load config on initial mount
  useEffect(() => {
    const loadConfig = async () => {
      if (window.electronAPI?.loadAppConfig) {
        const loadedConfig = await window.electronAPI.loadAppConfig();
        if (loadedConfig) {
          // Merge with defaults to ensure all keys are present
          setConfig({ ...DEFAULT_CONFIG, ...loadedConfig });
        }
      }
    };
    loadConfig();
  }, []);

  // Save config whenever it changes
  useEffect(() => {
    if (window.electronAPI?.saveAppConfig) {
      window.electronAPI.saveAppConfig(config);
    }
  }, [config]);

  // Subscribe to miner status and log updates from the main process
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribeStatus = window.electronAPI.onStatusUpdate((status) => {
      setMinerStatus(status);
    });
    
    const unsubscribeLogs = window.electronAPI.onLog((log) => {
        // Miner process can send multiple lines in one chunk.
        const logLines = log.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        setLogs(prev => [...prev, ...logLines]);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeLogs();
    };
  }, []);
  
  useEffect(() => {
    if (minerStatus === 'mining') {
      setActiveTab('dashboard');
    }
    // On 'error' or 'stopped', we intentionally don't switch tabs automatically,
    // allowing the user to view logs on the dashboard or return to config manually.
  }, [minerStatus]);

  const handleStartMining = () => {
    if (window.electronAPI) {
      // Clear logs and provide immediate feedback that the process is starting.
      setLogs(['[SYSTEM] Starting miner...']);
      window.electronAPI.startMining(config);
    }
  };

  const handleStopMining = () => {
    if (window.electronAPI) {
      window.electronAPI.stopMining();
    }
  };

  return (
    <>
      <div className="min-h-screen font-sans bg-slate-900 text-slate-300 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl mx-auto">
          <Header onAboutClick={() => setIsAboutModalOpen(true)} />
          <main className="mt-8">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} minerStatus={minerStatus} />
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
                  minerStatus={minerStatus}
                  logs={logs}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        name={metadata.name}
        version={packageJson.version}
        description={metadata.description}
      />
    </>
  );
};

export default App;
