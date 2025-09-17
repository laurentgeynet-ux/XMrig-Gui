import type { XMRigConfig } from './types';

export const ALGORITHMS = [
  'rx/0', 'cn/r', 'cn/gpu', 'cn-heavy/0', 'cn-pico', 'argon2/chukwav2', 'astrobwt'
];

export const COINS = [
  'monero', 'zephyr', 'wowoneiro'
];

export const DEFAULT_CONFIG: XMRigConfig = {
  algorithm: 'rx/0',
  coin: 'monero',
  poolUrl: 'pool.supportxmr.com:443',
  walletAddress: '',
  password: 'x',
  tls: true,
  threads: null,
  logFile: '',
};