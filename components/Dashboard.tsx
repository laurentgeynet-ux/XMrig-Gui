import React, { useState, useEffect, useRef } from 'react';
import type { XMRigConfig } from '../types';
import Button from './common/Button';

interface DashboardProps {
  config: XMRigConfig;
  onStop: () => void;
  isRunning: boolean;
}

const generateCommand = (config: XMRigConfig): string => {
  let cmd = 'xmrig';
  if (config.algorithm) cmd += ` --algo=${config.algorithm}`;
  if (config.coin) cmd += ` --coin=${config.coin}`;
  if (config.poolUrl) cmd += ` -o ${config.poolUrl}`;
  if (config.walletAddress) cmd += ` -u ${config.walletAddress}`;
  if (config.password) cmd += ` -p ${config.password}`;
  if (config.tls) cmd += ` --tls`;
  if (config.threads) cmd += ` -t ${config.threads}`;
  if (config.donateLevel) cmd += ` --donate-level=${config.donateLevel}`;
  if (config.logFile) cmd += ` -l ${config.logFile}`;
  if (config.background) cmd += ` -B`;
  return cmd;
};

const Dashboard: React.FC<DashboardProps> = ({ config, onStop, isRunning }) => {
  const command = generateCommand(config);
  const [logs, setLogs] = useState<string[]>([]);
  const [hashrate, setHashrate] = useState<string>('0.0 H/s');
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const logIntervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (isRunning) {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);

      // Initial startup log sequence
      const startupLogs = [
        '[SYSTEM] Initialisation du mineur...',
        ' * ABOUT        XMRig/6.21.0',
        ' * LIBS         libuv/1.44.2 OpenSSL/1.1.1q',
        ' * HUGE PAGES   supported',
        ' * CPU          Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz',
        ` * THREADS      ${config.threads || 'auto'}`,
        ` * ALGO         ${config.algorithm}`,
        ` * POOL #1      ${config.poolUrl} algo ${config.algorithm}`,
        `[NET]            use pool ${config.poolUrl}${config.tls ? ' TLS' : ''}`,
        `[NET]            connecting to ${config.poolUrl}...`,
        `[NET]            connected to ${config.poolUrl}`,
        `[NET]            new job from ${config.poolUrl}, diff 10000`,
      ];
      
      let logIndex = 0;
      setLogs([]);

      const runStartupSequence = () => {
        if (logIndex < startupLogs.length) {
          setLogs(prev => [...prev, startupLogs[logIndex]]);
          logIndex++;
        } else {
          // End startup sequence and switch to mining loop
          clearInterval(logIntervalRef.current!);
          logIntervalRef.current = setInterval(generateMiningLog, 2500);
        }
      };
      
      const generateMiningLog = () => {
         const randomChoice = Math.random();
         let newLogLine = '';
         
         if (randomChoice < 0.6) { // 60% chance for hashrate report
            const baseRate = 8450;
            const rate10s = baseRate + (Math.random() * 40 - 20);
            const rate60s = baseRate + (Math.random() * 20 - 10);
            const rateMax = baseRate + 50 + (Math.random() * 20);
            newLogLine = `[CPU] speed 10s/60s/15m ${rate10s.toFixed(1)} ${rate60s.toFixed(1)} ${baseRate.toFixed(1)} H/s max ${rateMax.toFixed(1)} H/s`;
         } else if (randomChoice < 0.85) { // 25% chance for an accepted share
            const ms = Math.floor(Math.random() * 20 + 40);
            newLogLine = `[CPU] accepted (1/0) diff 10000 (${ms} ms)`;
         } else if (randomChoice < 0.95) { // 10% chance for a new job
            newLogLine = `[NET]            new job from ${config.poolUrl}, diff 10000`;
         } else { // 5% chance for a rejected share or error
            newLogLine = '[CPU]            rejected (0/1) diff 10000 "Low difficulty share"';
         }
         
         setLogs(prev => [...prev, newLogLine]);
         parseHashrate(newLogLine);
      };

      logIntervalRef.current = setInterval(runStartupSequence, 600);

    } else {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = null;
      }
      setHashrate('0.0 H/s'); // Reset hashrate when not running
    }

    // Cleanup on unmount
    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, [isRunning, config]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Hashrate Actuel</h4>
        <p className="text-4xl font-bold text-cyan-400 mt-2 animate-pulse">{hashrate}</p>
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
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Sortie du Terminal (Simulation)</h3>
        <div
          ref={terminalRef}
          className="bg-black p-4 rounded-md font-mono text-xs text-slate-300 h-64 overflow-y-auto border border-slate-700"
        >
          {logs.map((log, index) => (
            <p key={index}><span className="text-cyan-400 mr-2">{`[${new Date().toLocaleTimeString()}]`}</span>{log}</p>
          ))}
        </div>
      </div>
      <div className="flex justify-center pt-4">
        <Button onClick={onStop} variant="danger">
          Arrêter le Minage <i className="fas fa-stop ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;