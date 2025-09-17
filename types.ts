export interface XMRigConfig {
  algorithm: string;
  coin: string;
  poolUrl: string;
  walletAddress: string;
  password: string;
  tls: boolean;
  threads: number | null;
  logFile: string;
}
