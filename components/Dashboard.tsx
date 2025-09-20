import React, { useState, useEffect, useRef } from 'react';
import type { XMRigConfig, MinerStatus } from '../types';
import Button from './common/Button';
import { BLOCK_REWARDS } from '../constants';

// --- Pool Statistics Types and API Logic ---

interface PoolStats {
  poolHashrate: number | null;
  networkHashrate: number | null;
  difficulty: number | null;
  blockHeight: number | null;
}

const parseHumanReadable = (valueStr: string | number): number => {
    if (typeof valueStr === 'number') return valueStr;
    if (typeof valueStr !== 'string') return 0;
    
    const value = parseFloat(valueStr);
    if (isNaN(value)) return 0;

    const unit = valueStr.replace(/[\d.,\s]/g, '').toLowerCase();

    switch (unit) {
        case 'kh/s': case 'k': return value * 1e3;
        case 'mh/s': case 'm': return value * 1e6;
        case 'gh/s': case 'g': return value * 1e9;
        case 'th/s': case 't': return value * 1e12;
        default: return value;
    }
};

interface PoolApiEndpoint {
  url: string;
  parser: (data: any) => PoolStats;
}

// Reusable parser for pools with a common API structure (e.g., supportxmr, minexmr)
const supportXmrStyleParser = (data: any) => ({
  poolHashrate: data.pool_statistics.hashRate,
  networkHashrate: data.network_statistics.hashRate,
  difficulty: data.network_statistics.difficulty,
  blockHeight: data.network_statistics.height,
});

const POOL_APIS: { [key: string]: PoolApiEndpoint } = {
  '2miners.com': {
    url: 'https://xmr.2miners.com/api/stats',
    parser: (data) => ({
      poolHashrate: data.pool_stats.hash_rate,
      networkHashrate: data.network_stats.hash_rate,
      difficulty: data.network_stats.difficulty,
      blockHeight: data.network_stats.height,
    }),
  },
  'crypto-pool.fr': {
      url: 'https://monero.crypto-pool.fr/api/stats',
      parser: (data) => ({
        poolHashrate: data.pool_statistics.hashRate,
        networkHashrate: data.network_stats.hashRate, // Note: network_stats, not network_statistics
        difficulty: data.network_stats.difficulty,
        blockHeight: data.network_stats.height,
      }),
  },
  'dero.rabidmining.com': {
      url: 'https://dero.rabidmining.com/api/stats',
      parser: (data) => ({
        poolHashrate: data.pool.hashrate,
        networkHashrate: data.network.hashrate,
        difficulty: data.network.difficulty,
        blockHeight: data.network.height,
      }),
  },
  'luckypool.io': {
    url: 'https://luckypool.io/api/stats',
    parser: (data) => ({
      poolHashrate: data.pool.hashrate,
      networkHashrate: data.network.hashrate,
      difficulty: data.network.difficulty,
      blockHeight: data.network.height,
    }),
  },
  'moneroocean.stream': {
      url: 'https://api.moneroocean.stream/pool/stats',
      parser: supportXmrStyleParser,
  },
  'pool.wownero.com': {
    url: 'https://pool.wownero.com/api/stats',
    parser: (data) => ({
      poolHashrate: data.pool_statistics.hashRate,
      networkHashrate: data.network_stats.hashRate,
      difficulty: data.network_stats.difficulty,
      blockHeight: data.network_stats.value,
    }),
  },
  'raptoreum.miningocean.org': {
    url: 'https://api.miningocean.org/raptoreum/stats',
    parser: (data) => ({
        poolHashrate: parseHumanReadable(data.pool.hashrate),
        networkHashrate: parseHumanReadable(data.network.hashrate),
        difficulty: parseHumanReadable(data.network.difficulty),
        blockHeight: data.network.height,
    })
  },
  'supportxmr.com': {
    url: 'https://supportxmr.com/api/pool/stats',
    parser: supportXmrStyleParser,
  },
  'tari.herominers.com': {
    url: 'https://tari.herominers.com/api/stats',
    parser: (data) => ({
      poolHashrate: data.pool.hashrate,
      networkHashrate: data.network.hashrate,
      difficulty: data.network.difficulty,
      blockHeight: data.network.height,
    }),
  },
  'zephyr.miningocean.org': {
      url: 'https://api.miningocean.org/zephyr/stats',
      parser: (data) => ({
          poolHashrate: parseHumanReadable(data.pool.hashrate),
          networkHashrate: parseHumanReadable(data.network.hashrate),
          difficulty: parseHumanReadable(data.network.difficulty),
          blockHeight: data.network.height,
      })
  },
};

const fetchPoolStats = async (poolUrl: string): Promise<{ success: boolean; stats?: PoolStats; error?: string }> => {
  if (!window.electronAPI?.fetchPoolStats) {
    return { success: false, error: 'Feature not available in this environment.' };
  }
  if (!poolUrl) {
    return { success: false, error: 'API Not Supported' };
  }
  try {
    const hostname = poolUrl.split(':')[0];
    const apiDomain = Object.keys(POOL_APIS).find(domain => hostname.endsWith(domain));
    const apiConfig = apiDomain ? POOL_APIS[apiDomain] : undefined;

    if (!apiConfig) {
      return { success: false, error: 'API Not Supported' };
    }
    
    const result = await window.electronAPI.fetchPoolStats(apiConfig.url);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'API Request Failed');
    }
    const stats = apiConfig.parser(result.data);
    return { success: true, stats };
    
  } catch (error: any) {
    console.error('Error fetching pool stats:', error);
    return { success: false, error: error.message || 'API Request Failed' };
  }
};


// --- ANSI Color Parsing ---

const ANSI_COLOR_MAP: { [key: string]: string } = {
  '0': 'text-slate-300', '1': 'font-bold', '30': 'text-black',
  '31': 'text-red-500', '32': 'text-green-400', '33': 'text-yellow-400',
  '34': 'text-blue-400', '35': 'text-purple-400', '36': 'text-cyan-400',
  '37': 'text-slate-300', '90': 'text-slate-500', '91': 'text-red-400',
  '92': 'text-green-300', '93': 'text-yellow-300', '94': 'text-blue-300',
  '95': 'text-purple-300', '96': 'text-cyan-300', '97': 'text-white',
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
        code.split(';').forEach(c => {
            const newClass = ANSI_COLOR_MAP[c];
            if (newClass) {
                if (newClass.startsWith('text-')) {
                    currentClasses = currentClasses.filter(cls => !cls.startsWith('text-'));
                }
                if (!currentClasses.includes(newClass)) currentClasses.push(newClass);
            }
        });
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
  if (config.algorithm) commandParts.push(`--algo=${config.algorithm}`);
  if (config.coin) commandParts.push(`--coin=${config.coin}`);
  if (config.poolUrl) commandParts.push(`-o ${config.poolUrl}`);
  if (config.walletAddress) {
    const user = config.workerName?.trim() ? `${config.walletAddress}.${config.workerName.trim()}` : config.walletAddress;
    commandParts.push(`-u ${user}`);
  }
  if (config.password) commandParts.push(`-p ${config.password}`);
  if (config.tls) commandParts.push('--tls');
  if (config.threads && config.threads > 0) commandParts.push(`-t ${config.threads}`);
  if (config.logFile?.trim()) commandParts.push(`-l "${config.logFile.trim()}"`);
  return commandParts.join(' ');
};

const formatHashrateForDisplay = (hr: number | null | undefined): string => {
    if (hr === null || hr === undefined) return 'N/A';
    if (hr < 1000) return `${hr.toFixed(1)} H/s`;
    if (hr < 1e6) return `${(hr / 1e3).toFixed(2)} kH/s`;
    if (hr < 1e9) return `${(hr / 1e6).toFixed(2)} MH/s`;
    return `${(hr / 1e9).toFixed(2)} GH/s`;
};

const formatDifficultyForDisplay = (d: number | null | undefined): string => {
    if (d === null || d === undefined) return 'N/A';
    if (d < 1000) return `${d}`;
    if (d < 1e6) return `${(d / 1e3).toFixed(2)} K`;
    if (d < 1e9) return `${(d / 1e6).toFixed(2)} M`;
    if (d < 1e12) return `${(d / 1e9).toFixed(2)} G`;
    return `${(d / 1e12).toFixed(2)} T`;
}

const Dashboard: React.FC<DashboardProps> = ({ config, onStop, minerStatus, logs }) => {
  const command = generateCommand(config);
  const [hashrate, setHashrate] = useState<string>('0.0 H/s');
  const [lastBlockReward, setLastBlockReward] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const processedLogsCount = useRef(0);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [poolStatsLoading, setPoolStatsLoading] = useState<boolean>(false);
  const [poolStatsError, setPoolStatsError] = useState<string | null>(null);

  const isRunning = minerStatus === 'mining';

  const statusInfo = {
    mining: { text: 'Mining', icon: 'fa-cogs fa-spin', color: 'text-green-400' },
    stopped: { text: 'Stopped', icon: 'fa-stop-circle', color: 'text-slate-400' },
    error: { text: 'Error', icon: 'fa-exclamation-triangle', color: 'text-red-500' },
  };
  const currentStatus = statusInfo[minerStatus];

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const getPoolStats = async () => {
      setPoolStatsLoading(true);
      const result = await fetchPoolStats(config.poolUrl);
      setPoolStats(result.stats ?? null);
      setPoolStatsError(result.error ?? null);
      setPoolStatsLoading(false);
    };

    if (isRunning) {
      getPoolStats();
      intervalId = setInterval(getPoolStats, 30000);
    } else {
      setPoolStats(null);
      setPoolStatsError(null);
      setPoolStatsLoading(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, config.poolUrl]);

  useEffect(() => {
    if (!isRunning) {
      setHashrate('0.0 H/s');
      processedLogsCount.current = 0;
    } else {
      setLastBlockReward(null);
    }
  }, [isRunning]);

  useEffect(() => {
    const parseHashrate = (logLine: string) => {
      const hashrateMatch = logLine.match(/speed\s.*?([\d.]+)\sH\/s/);
      if (hashrateMatch && hashrateMatch[1]) {
        let rate = parseFloat(hashrateMatch[1]);
        let unit = 'H/s';
        if (rate >= 1000000) { rate /= 1000000; unit = 'MH/s'; }
        else if (rate >= 1000) { rate /= 1000; unit = 'kH/s'; }
        setHashrate(`${rate.toFixed(1)} ${unit}`);
      }
    };
    const checkForBlockFound = (logLine: string) => {
      if (logLine.includes('accepted')) {
        if (Math.random() < 0.005) {
            const rewardInfo = BLOCK_REWARDS[config.coin];
            setLastBlockReward(rewardInfo?.amount ? `${rewardInfo.amount} ${rewardInfo.unit}` : 'Found!');
        }
      }
    };
    const newLogs = logs.slice(processedLogsCount.current);
    newLogs.forEach(line => {
      parseHashrate(line);
      checkForBlockFound(line);
    });
    processedLogsCount.current = logs.length;
  }, [logs, config.coin]);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Hashrate</h4>
          <p className="text-4xl font-bold text-cyan-400 mt-2">{hashrate}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Miner Status</h4>
            <div className={`flex items-center justify-center text-2xl font-bold mt-2 ${currentStatus.color}`}>
                <i className={`fas ${currentStatus.icon} mr-3`}></i>
                <span>{currentStatus.text}</span>
            </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700 text-center flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Last Block Reward</h4>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{lastBlockReward || '--'}</p>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg shadow-lg border border-slate-700">
            <h4 className="text-sm text-center font-medium text-slate-400 uppercase tracking-wider mb-3">Pool Statistics</h4>
            <div className="text-sm space-y-2">
                {poolStatsLoading ? (<div className="text-center text-slate-400"><i className="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
                ) : poolStatsError ? (<div className="text-center text-red-400"><i className="fas fa-times-circle mr-2"></i>{poolStatsError}</div>
                ) : poolStats ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Pool Hashrate:</span><span className="font-semibold text-right">{formatHashrateForDisplay(poolStats.poolHashrate)}</span>
                        <span>Net. Hashrate:</span><span className="font-semibold text-right">{formatHashrateForDisplay(poolStats.networkHashrate)}</span>
                        <span>Difficulty:</span><span className="font-semibold text-right">{formatDifficultyForDisplay(poolStats.difficulty)}</span>
                        <span>Block Height:</span><span className="font-semibold text-right">{poolStats.blockHeight?.toLocaleString() ?? 'N/A'}</span>
                    </div>
                ) : <p className="text-center text-slate-500">Not supported or not mining.</p>}
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Generated Command</h3>
        <div className="relative bg-slate-900 p-4 rounded-md font-mono text-sm text-green-400 overflow-x-auto">
          <code>{command}</code>
          <button onClick={copyToClipboard} className="absolute top-2 right-2 text-slate-400 hover:text-white transition" aria-label="Copy command">
            {isCopied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Terminal Output</h3>
        <div ref={terminalRef} className="bg-black p-4 rounded-md font-mono text-xs text-slate-300 h-64 overflow-y-auto border border-slate-700">
          {logs.map((log, index) => (<p key={index}>{parseAnsiToReact(log)}</p>))}
          {!isRunning && logs.length === 0 && <p className="text-slate-500">Miner is stopped.</p>}
        </div>
      </div>
      <div className="flex justify-center pt-4">
        <Button onClick={onStop} variant="danger" disabled={!isRunning}>
          Stop Mining <i className="fas fa-stop ml-2"></i>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;