import React, { useState } from 'react';
import type { XMRigConfig } from '../types';
import { ALGORITHMS, COINS } from '../constants';
import Input from './common/Input';
import Select from './common/Select';
import Toggle from './common/Toggle';
import Button from './common/Button';
import Card from './common/Card';

interface ConfiguratorProps {
  config: XMRigConfig;
  setConfig: React.Dispatch<React.SetStateAction<XMRigConfig>>;
  onStart: () => void;
}

const Configurator: React.FC<ConfiguratorProps> = ({ config, setConfig, onStart }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setConfig(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setConfig(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
        setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateConfig = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!config.poolUrl) {
      newErrors.poolUrl = 'Pool URL is required.';
    } else if (!config.poolUrl.includes(':')) {
        newErrors.poolUrl = 'Pool URL must include a port (e.g., domain:port).';
    }
    if (!config.walletAddress) {
      newErrors.walletAddress = 'Wallet address is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = () => {
    if (validateConfig()) {
      onStart();
    }
  };
  
  // FIX: Implemented auto-detection for CPU threads, using Electron API if available.
  const handleAutoThreads = async () => {
    if (window.electronAPI) {
      try {
        const threadCount = await window.electronAPI.getHardwareConcurrency();
        setConfig(prev => ({...prev, threads: threadCount}));
      } catch (err) {
        console.error("Error getting hardware concurrency:", err);
        // Fallback if API fails
        const threadCount = navigator.hardwareConcurrency || 4;
        setConfig(prev => ({...prev, threads: threadCount}));
      }
    } else {
      // Fallback for browser environment
      const threadCount = navigator.hardwareConcurrency || 4;
      setConfig(prev => ({...prev, threads: threadCount}));
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Pool Connection" icon="fa-server">
          <Select
            label="Coin"
            name="coin"
            value={config.coin}
            onChange={handleChange}
            options={COINS.map(c => ({ value: c, label: c }))}
            tooltip="Select the coin you want to mine."
          />
          <Input
            label="Pool URL"
            name="poolUrl"
            value={config.poolUrl}
            onChange={handleChange}
            placeholder="e.g., pool.supportxmr.com:443"
            tooltip="The URL of your mining pool, including the port."
            error={errors.poolUrl}
          />
          <Input
            label="Wallet Address"
            name="walletAddress"
            value={config.walletAddress}
            onChange={handleChange}
            placeholder="Your wallet address"
            tooltip="The public address of your wallet where rewards will be sent."
            error={errors.walletAddress}
          />
          <Input
            label="Password"
            name="password"
            value={config.password}
            onChange={handleChange}
            placeholder="Usually 'x' or worker name"
            tooltip="Pool password, often used for worker identification. 'x' is common."
          />
          <Toggle
            label="Use TLS/SSL"
            name="tls"
            checked={config.tls}
            onChange={handleChange}
            tooltip="Enable encrypted connection to the pool. Recommended."
          />
        </Card>

        <Card title="Miner Settings" icon="fa-cogs">
          <Select
            label="Algorithm"
            name="algorithm"
            value={config.algorithm}
            onChange={handleChange}
            options={ALGORITHMS.map(a => ({ value: a, label: a }))}
            tooltip="The mining algorithm to use. Must match the coin and pool."
          />
          <Input
            label="Threads"
            name="threads"
            type="number"
            value={config.threads ?? ''}
            onChange={handleChange}
            placeholder="Auto"
            tooltip="Number of CPU threads to use. Leave blank for auto."
            min="1"
            buttonIcon="fa-microchip"
            onButtonClick={handleAutoThreads}
          />
          <Input
            label="Donate Level"
            name="donateLevel"
            type="number"
            value={config.donateLevel}
            onChange={handleChange}
            min="1"
            max="100"
            tooltip="Percentage of mining time to donate to XMRig devs (min 1%)."
          />
          <Input
            label="Log File"
            name="logFile"
            value={config.logFile}
            onChange={handleChange}
            placeholder="e.g., /path/to/xmrig.log"
            tooltip="Path to a file to store miner logs. Leave blank to disable."
          />
           <Toggle
            label="Run in Background"
            name="background"
            checked={config.background}
            onChange={handleChange}
            tooltip="Run the miner as a background process."
          />
        </Card>
      </div>
      <div className="flex justify-center pt-6">
        <Button onClick={handleStart} variant="primary">
            Start Mining <i className="fas fa-play ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Configurator;
