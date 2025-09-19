import type { XMRigConfig } from './types';

// Sorted for better UX in the dropdown
export const ALGORITHMS = [
  'argon2/chukwav2',
  'astrobwt',
  'cn-heavy/0',
  'cn-pico',
  'cn/gpu',
  'cn/r',
  'gr',
  'rx/0',
  'rx/tari',
  'rx/wow',
];

// Sorted for better UX in the dropdown
export const COINS = [
  'dero',
  'monero',
  'raptoreum',
  'tari',
  'wownero',
  'zephyr',
  'custom', // Added custom option
];

export const BLOCK_REWARDS: { [key: string]: { amount: number | null; unit: string } } = {
  monero: { amount: 0.6, unit: 'XMR' },
  zephyr: { amount: 3.5, unit: 'ZEPH' },
  wownero: { amount: 6.5, unit: 'WOW' },
  tari: { amount: null, unit: 'XTR' },
  raptoreum: { amount: null, unit: 'RTM' },
  dero: { amount: 0.5, unit: 'DERO' },
};

export const COIN_DETAILS: { [key: string]: { algorithm: string; poolUrl: string; tls: boolean } } = {
  monero: { algorithm: 'rx/0', poolUrl: 'pool.supportxmr.com:443', tls: true },
  zephyr: { algorithm: 'rx/0', poolUrl: 'zephyr.miningocean.org:5566', tls: true },
  wownero: { algorithm: 'rx/wow', poolUrl: 'pool.wownero.com:4445', tls: true },
  tari: { algorithm: 'rx/tari', poolUrl: 'pool.tari.herominers.com:10161', tls: false },
  raptoreum: { algorithm: 'gr', poolUrl: 'raptoreum.miningocean.org:5657', tls: true },
  dero: { algorithm: 'astrobwt', poolUrl: 'dero.rabidmining.com:10300', tls: true },
  // When 'custom' is selected, fields are cleared for manual input
  custom: { algorithm: 'rx/0', poolUrl: '', tls: false },
};


export const DEFAULT_CONFIG: XMRigConfig = {
  algorithm: COIN_DETAILS.monero.algorithm,
  coin: 'monero',
  poolUrl: COIN_DETAILS.monero.poolUrl,
  walletAddress: '',
  workerName: '',
  password: 'x',
  tls: COIN_DETAILS.monero.tls,
  threads: null,
  logFile: '',
  autoStart: false,
};