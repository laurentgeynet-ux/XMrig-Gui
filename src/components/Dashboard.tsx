

import React, { useState, useEffect, useRef } from 'react';
import type { XMRigConfig, MinerStatus } from '../types';
import Button from './common/Button';
import { BLOCK_REWARDS } from '../constants';

const ANSI_COLOR_MAP: { [key: string]: string } = {
  '0': 'text-slate-300', // Reset
  '1': 'font-bold',
  '30': 'text-black',
  '31': 'text-red-500',
  '32': 'text-green-400',
  '33': 'text-yellow-400',
  '34': 'text-blue-400',
  '35': 'text-purple-400',
  '36': 'text-cyan-400',
  '37': 'text-slate-300', // White
  '90': 'text-slate-500', // Bright Black (Gray)
  '91': 'text-red-400',
  '92': 'text-green-300',
  '93': 'text-yellow-300',
  '94': 'text-blue-300',
  '95': 'text-purple-300',
  '96': 'text-cyan-300',
  '97': 'text-white',
};

const parseAnsiToReact = (text: string): React.ReactNode => {
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentClasses: string[] = [ANSI_COLOR_MAP['0']];
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('\x1b[')) {
      const code = part.substring(2, part.length - 1);
      
      if (code === '0' || code === '') {
        currentClasses = [ANSI_COLOR_MAP['0']];
      } else {
        const codes = code.split(';');
        for (const c of codes) {
            const newClass = ANSI_COLOR_MAP[c];
            if (newClass) {
                if (newClass.startsWith('text-')) {
                    currentClasses = currentClasses.filter(cls => !cls.startsWith('text-'));
                }
                if (!currentClasses.includes(newClass)) {
                    currentClasses.push(newClass);
                }
            }
        }
      }
    } else {
      elements.push(<span key={key++} className={currentClasses.join(' ')}>{part}</span>);
    }
  }
  return elements;
};

interface DashboardProps {
  config: XMRigConfig;
  onStop: () => void;
  minerStatus: MinerStatus;
  logs: string[];
}

const generateCommand = (config: XMRigConfig): string => {
  const commandParts: string[] = ['xmrig'];

  if (config.algorithm) {
    commandParts.push(`--algo=${config.algorithm}`);
  }
  if (config.coin) {
    commandParts.push(`--coin=${config.coin}`);
  }
  if (config.poolUrl) {
    commandParts.push(`-o ${config.poolUrl}`);
  }

  if (config.walletAddress) {
    const worker = config.workerName?.trim();
    const user = worker ? `${config.walletAddress}.${worker}` : config.walletAddress;
    commandParts.push(`-u ${user}`);
  }

  if (config.password) {
    commandParts.push(`-p ${config.password}`);
  }

  if (config.tls) {
    commandParts.push('--tls');
  }

  // Ensure threads is a positive number before adding
  if (config.threads && config.threads > 0) {
    commandParts.push(`-t ${config.threads}`);
  }

  const logFile = config.logFile?.trim();
  if (logFile) {
    // Quote the path to handle potential spaces, crucial for validity.
    commandParts.push(`-l "${logFile}"`);
  }

  return commandParts.join(' ');
};

const Dashboard: React.FC<DashboardProps> = ({ config, onStop, minerStatus, logs }) => {
  const command = generateCommand(config);
  const [hashrate, setHashrate] = useState<string>('0.0 H/s');
  const [lastBlockReward, setLastBlockReward] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const processedLogsCount = useRef(0);

  const isRunning = minerStatus === 'mining';

  const statusInfo: { [key in MinerStatus]: { text: string; icon: string; color: string } } = {
    mining: { text: 'Mining', icon: 'fa-cogs fa-spin', color: 'text-green-400' },
    stopped: { text: 'Stopped', icon: 'fa-stop-circle', color: 'text-slate-400' },
    error: { text: 'Error', icon: 'fa-exclamation-triangle', color: 'text-red-500' },
  };

  const currentStatus = statusInfo[minerStatus];

  // Effect to handle state resets when miner status changes.
  useEffect(() => {
    if (!isRunning) {
      setHashrate('0.0 H/s');
      processedLogsCount.current = 0; // Reset log processing on stop/error
    } else {
      setLastBlockReward(null); // Reset block reward on start
    }
  }, [isRunning]);

  // Effect to process new logs for hashrate and other data.
  useEffect(() => {
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
      // Using toLowerCase() for a case-insensitive match to improve reliability.
      if (logLine.toLowerCase().includes('accepted')) {
          // Simulate a 0.5% chance of finding a block on an accepted share
          if (Math.random() < 0.005) { 
              const rewardInfo = BLOCK_REWARDS[config.coin];
              // Use a more robust check for the reward amount.
              if (rewardInfo && rewardInfo.amount !== null) {
                  const reward = `${rewardInfo.amount} ${rewardInfo.unit}`;
                  setLastBlockReward(reward);
              } else {
                  setLastBlockReward('N/A');
              }
          }
      }
    };

    // If the logs array has been reset from the parent, reset our counter
    if (logs.length < processedLogsCount.current) {
      processedLogsCount.current = 0;
    }
    
    if (logs.length > processedLogsCount.current) {
      const newLogs = logs.slice(processedLogsCount.current);
      newLogs.forEach(line => {
        parseHashrate(line);
        checkForBlockFound(line);
      });
      processedLogsCount.current = logs.length;
    }
  }, [logs, config.coin]);
  
  // Effect to scroll the terminal to the bottom on new logs.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Miner Status</h4>
            <div className={`text-4xl font-bold mt-2 flex items-center justify-center ${currentStatus.color}`}>
              <i className={`fas ${currentStatus.icon} mr-3`}></i>
              <span>{currentStatus.text}</span>
            </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Hashrate</h4>
          <p className="text-4xl font-bold text-cyan-400 mt-2">{hashrate}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center flex flex-col justify-center">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center">
            <i className="fas fa-trophy mr-2 text-yellow-400"></i>
            Last Block Reward
          </h4>
          <p className="text-4xl font-bold text-yellow-400 mt-2">{lastBlockReward || '--'}</p>
        </div>
      </div>


      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Generated Command</h3>
        <div className="relative bg-slate-900 p-4 rounded-md font-mono text-sm text-green-400 overflow-x-auto">
          <code>{command}</code>
          <button onClick={copyToClipboard} className="absolute top-2 right-2 text-slate-400 hover:text-white transition">
            {isCopied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Terminal Output</h3>
        <div
          ref={terminalRef}
          className="bg-black p-4 rounded-md font-mono text-xs text-slate-300 h-64 overflow-y-auto border border-slate-700"
        >
          {logs.length > 0 ? logs.map((log, index) => (
            <p key={index}>
              {log.includes('[SYSTEM]')
                ? <span className="text-yellow-400">{log}</span>
                : parseAnsiToReact(log)
              }
            </p>
          )) : (
            <p className="text-slate-500">
              {`Miner is ${minerStatus}.`}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center pt-4">
        <Button onClick={handleStop} variant="danger" disabled={!isRunning}>
          Stop Mining <i className="fas fa-stop ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
