import React from 'react';
import type { Tab } from '../App';
import type { MinerStatus } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  minerStatus: MinerStatus;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, minerStatus }) => {
  const getTabClass = (tabName: Tab) => {
    return `px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-slate-300 hover:bg-slate-700'
    }`;
  };

  return (
    <div className="flex justify-center space-x-4">
      <button
        className={getTabClass('config')}
        onClick={() => setActiveTab('config')}
        disabled={minerStatus === 'mining'}
      >
        <i className="fas fa-cogs mr-2"></i>
        Configurator
      </button>
      <button
        className={getTabClass('dashboard')}
        onClick={() => setActiveTab('dashboard')}
      >
        <i className="fas fa-th-large mr-2"></i>
        Dashboard
      </button>
    </div>
  );
};

export default Tabs;