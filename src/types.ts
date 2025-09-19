export type MinerStatus = 'stopped' | 'mining' | 'error';

export interface XMRigConfig {
  algorithm: string;
  coin: string;
  poolUrl: string;
  walletAddress: string;
  workerName: string;
  password: string;
  tls: boolean;
  threads: number | null;
  logFile: string;
  autoStart: boolean;
}