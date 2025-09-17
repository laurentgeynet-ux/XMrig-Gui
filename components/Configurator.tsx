import React, { useState, useEffect } from 'react';
import type { XMRigConfig } from '../types';
import { ALGORITHMS, COINS, DEFAULT_CONFIG } from '../constants';
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
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (config.coin === 'tari' && config.tls) {
      setConfig(prev => ({ ...prev, tls: false }));
    }
  }, [config.coin, config.tls, setConfig]);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => {
        setFeedback(null);
    }, 3000);
  };

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
  
  const handleAutoThreads = async () => {
    if (window.electronAPI) {
      try {
        const threadCount = await window.electronAPI.getHardwareConcurrency();
        setConfig(prev => ({...prev, threads: threadCount}));
      } catch (err) {
        console.error("Error getting hardware concurrency:", err);
        const threadCount = navigator.hardwareConcurrency || 4;
        setConfig(prev => ({...prev, threads: threadCount}));
      }
    } else {
      const threadCount = navigator.hardwareConcurrency || 4;
      setConfig(prev => ({...prev, threads: threadCount}));
    }
  }

  const handleSave = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveConfig(JSON.stringify(config, null, 2));
        showFeedback(result.message, result.success ? 'success' : 'error');
      } catch (err) {
        console.error("Save failed:", err);
        showFeedback("An unexpected error occurred while saving.", 'error');
      }
    } else {
      showFeedback('Save feature is only available in the desktop app.', 'error');
    }
  };

  const handleLoad = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.loadConfig();
        if (result.success && result.config) {
          // Merge with defaults to ensure all keys are present if loading an old config
          const loadedConfig = { ...DEFAULT_CONFIG, ...result.config };
          setConfig(loadedConfig);
          showFeedback('Configuration loaded successfully.', 'success');
        } else if (result.message !== 'Load canceled.') {
          showFeedback(result.message || 'Failed to load configuration.', 'error');
        }
      } catch (err) {
        console.error("Load failed:", err);
        showFeedback("An unexpected error occurred while loading.", 'error');
      }
    } else {
      showFeedback('Load feature is only available in the desktop app.', 'error');
    }
  };

  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.coin || 'xmrig'}-config.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showFeedback('Configuration downloaded.', 'success');
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-end items-center gap-4 -mb-4">
        {feedback && (
          <span className={`text-sm transition-opacity duration-300 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.message}
          </span>
        )}
        <Button onClick={handleSave} variant="secondary">
          <i className="fas fa-save mr-2"></i> Save
        </Button>
        <Button onClick={handleDownloadJson} variant="secondary">
          <i className="fas fa-download mr-2"></i> Download JSON
        </Button>
        <Button onClick={handleLoad} variant="secondary">
          <i className="fas fa-folder-open mr-2"></i> Load
        </Button>
      </div>

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
            tooltip="Enable encrypted connection to the pool. Recommended. Not compatible with Tari."
            disabled={config.coin === 'tari'}
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
            label="Log File"
            name="logFile"
            value={config.logFile}
            onChange={handleChange}
            placeholder="e.g., /path/to/xmrig.log"
            tooltip="Path to a file to store miner logs. Leave blank to disable."
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
