
import React from 'react';
import type { Tab } from '../App';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isRunning: boolean;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, isRunning }) => {
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
        disabled={isRunning}
      >
        <i className="fas fa-cogs mr-2"></i>
        Configuration
      </button>
      <button
        className={getTabClass('dashboard')}
        onClick={() => setActiveTab('dashboard')}
        disabled={!isRunning && activeTab !== 'dashboard'}
      >
        <i className="fas fa-th-large mr-2"></i>
        Tableau de Bord
      </button>
    </div>
  );
};

export default Tabs;
