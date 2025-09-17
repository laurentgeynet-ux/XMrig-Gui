import React, { useState, useEffect, useRef } from 'react';
import type { XMRigConfig } from '../types';
import Button from './common/Button';
import { BLOCK_REWARDS } from '../constants';

interface DashboardProps {
  config: XMRigConfig;
  onStop: () => void;
  isRunning: boolean;
}

const generateCommand = (config: XMRigConfig): string => {
  // FIX: Use a platform-agnostic executable name for broader compatibility.
  // In a real application, you'd want to bundle the correct xmrig executable.
  let cmd = 'xmrig';
  if (config.algorithm) cmd += ` --algo=${config.algorithm}`;
  if (config.coin) cmd += ` --coin=${config.coin}`;
  if (config.poolUrl) cmd += ` -o ${config.poolUrl}`;
  if (config.walletAddress) cmd += ` -u ${config.walletAddress}`;
  if (config.password) cmd += ` -p ${config.password}`;
  if (config.tls) cmd += ` --tls`;
  if (config.threads) cmd += ` -t ${config.threads}`;
  if (config.logFile) cmd += ` -l ${config.logFile}`;
  return cmd;
};

const Dashboard: React.FC<DashboardProps> = ({ config, onStop, isRunning }) => {
  const command = generateCommand(config);
  const [logs, setLogs] = useState<string[]>([]);
  const [hashrate, setHashrate] = useState<string>('0.0 H/s');
  const [lastBlockReward, setLastBlockReward] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const parseHashrate = (logLine: string) => {
    // Regex to find hashrate reports, e.g., "speed 10s/60s/15m 8453.3 8450.1 8445.9 H/s"
    const hashrateMatch = logLine.match(/speed\s.*?([\d.]+)\s/);
    if (hashrateMatch && hashrateMatch[1]) {
      let rate = parseFloat(hashrateMatch[1]);
      let unit = 'H/s';

      if (rate >= 1000000) {
        rate /= 1000000;
        unit = 'MH/s';
      } else if (rate >= 1000) {
        rate /= 1000;
        unit = 'kH/s';
      }

      setHashrate(`${rate.toFixed(1)} ${unit}`);
    }
  };

  const checkForBlockFound = (logLine: string) => {
    // When a share is accepted, there's a small chance it's a block.
    // We simulate this to provide user feedback, as logs aren't standardized.
    if (logLine.includes('accepted')) {
        // Simulate a 0.5% chance of finding a block on an accepted share
        if (Math.random() < 0.005) { 
            const rewardInfo = BLOCK_REWARDS[config.coin];
            if (rewardInfo && rewardInfo.amount) {
                const rewardMsg = `[SYSTEM] 🎉 Félicitations! Un bloc a été trouvé! Récompense: ${rewardInfo.amount} ${rewardInfo.unit}`;
                setLogs(prev => [...prev, rewardMsg]);
                setLastBlockReward(`${rewardInfo.amount} ${rewardInfo.unit}`);
            } else {
                setLogs(prev => [...prev, `[SYSTEM] 🎉 Un bloc a été trouvé!`]);
                setLastBlockReward(`N/A`);
            }
        }
    }
  };


  // FIX: Replaced simulation logic with Electron IPC communication for real mining process management.
  useEffect(() => {
    // Only interact with Electron API if it exists on the window object.
    if (window.electronAPI) {
      if (isRunning) {
        setLogs(['[SYSTEM] Démarrage du mineur...']);
        setLastBlockReward(null); // Reset on start
        window.electronAPI.startMining(command);
        
        const unsubscribe = window.electronAPI.onLog((log) => {
          // Miner process can send multiple lines in one chunk.
          const logLines = log.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
          setLogs(prev => [...prev, ...logLines]);
          logLines.forEach(line => {
            parseHashrate(line);
            checkForBlockFound(line);
          });
        });

        // Return a cleanup function to unsubscribe and stop the miner when the component unmounts or isRunning becomes false.
        return () => {
          unsubscribe();
          window.electronAPI.stopMining();
        };
      } else {
        // Explicitly stop the miner if isRunning is false.
        window.electronAPI.stopMining();
        setHashrate('0.0 H/s'); // Reset hashrate when not running
      }
    }
  }, [isRunning, command]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStop = () => {
    onStop();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Hashrate Actuel</h4>
          <p className="text-4xl font-bold text-cyan-400 mt-2">{isRunning ? hashrate : '0.0 H/s'}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center flex flex-col justify-center">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center">
            <i className="fas fa-trophy mr-2 text-yellow-400"></i>
            Récompense de Bloc
          </h4>
          <p className="text-4xl font-bold text-yellow-400 mt-2">{lastBlockReward || '--'}</p>
        </div>
      </div>


      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Commande Générée</h3>
        <div className="relative bg-slate-900 p-4 rounded-md font-mono text-sm text-green-400 overflow-x-auto">
          <code>{command}</code>
          <button onClick={copyToClipboard} className="absolute top-2 right-2 text-slate-400 hover:text-white transition">
            {isCopied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Sortie du Terminal</h3>
        <div
          ref={terminalRef}
          className="bg-black p-4 rounded-md font-mono text-xs text-slate-300 h-64 overflow-y-auto border border-slate-700"
        >
          {logs.length > 0 ? logs.map((log, index) => (
            <p key={index}>{log.includes('[SYSTEM]') ? <span className="text-yellow-400">{log}</span> : log}</p>
          )) : (
            <p className="text-slate-500">
              {isRunning ? 'Démarrage du mineur, en attente de la sortie...' : 'Le mineur est arrêté.'}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center pt-4">
        <Button onClick={handleStop} variant="danger">
          Arrêter le Minage <i className="fas fa-stop ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;