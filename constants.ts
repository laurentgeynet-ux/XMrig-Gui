import type { XMRigConfig } from './types';

export const ALGORITHMS = [
  'rx/0', 'cn/r', 'cn/gpu', 'cn-heavy/0', 'cn-pico', 'argon2/chukwav2', 'astrobwt', 'rx/tari'
];

export const COINS = [
  'monero', 'zephyr', 'wowoneiro', 'tari'
];

export const BLOCK_REWARDS: { [key: string]: { amount: number | null; unit: string } } = {
  monero: { amount: 0.6, unit: 'XMR' },
  zephyr: { amount: 3.5, unit: 'ZEPH' },
  wowoneiro: { amount: 6.5, unit: 'WOW' },
  tari: { amount: null, unit: 'XTR' },
};

export const DEFAULT_CONFIG: XMRigConfig = {
  algorithm: 'rx/0',
  coin: 'monero',
  poolUrl: 'pool.supportxmr.com:443',
  walletAddress: '',
  workerName: '',
  password: 'x',
  tls: true,
  threads: null,
  logFile: '',
  // FIX: Added 'autoStart' property to match the updated XMRigConfig interface.
  autoStart: false,
};