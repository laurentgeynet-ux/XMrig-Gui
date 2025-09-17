import type { XMRigConfig } from './types';

export const ALGORITHMS = [
  'rx/0', 'cn/r', 'cn/gpu', 'cn-heavy/0', 'cn-pico', 'argon2/chukwav2', 'astrobwt', 'rx/tari'
];

export const COINS = [
  'monero', 'zephyr', 'wowoneiro', 'tari'
];

export const TOR_PROXIES = [
  '127.0.0.1:9050', // Port standard pour le démon Tor
  '127.0.0.1:9150'  // Port standard pour le navigateur Tor
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
  useTor: false,
  torProxy: '127.0.0.1:9050',
};