export type MinerStatus = 'stopped' | 'mining' | 'error';
// Allow 'about' as a special, transient tab state to trigger the modal
export type Tab = 'config' | 'dashboard' | 'about';

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