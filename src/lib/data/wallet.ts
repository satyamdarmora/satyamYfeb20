// ---------------------------------------------------------------------------
// Wallet -- seed data & helpers
// ---------------------------------------------------------------------------

import type { WalletState, WalletTransaction } from '../types';
import { iso, DAY } from './helpers';

// ---- Wallet seed data -------------------------------------------------------

const walletState: WalletState = {
  balance: 14200,
  pending_settlement: 14200,
  frozen: false,
  transactions: [
    {
      id: 'TXN-001',
      date: iso(-2 * DAY),
      type: 'SETTLEMENT',
      amount: 13800,
      description: 'January 2026 settlement credit',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-002',
      date: iso(-5 * DAY),
      type: 'BONUS',
      amount: 500,
      description: 'Activation bonus -- 5 installs in week',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-003',
      date: iso(-10 * DAY),
      type: 'WITHDRAWAL',
      amount: -10000,
      description: 'Bank transfer to HDFC ***4421',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-004',
      date: iso(-15 * DAY),
      type: 'SETTLEMENT',
      amount: 12200,
      description: 'December 2025 settlement credit',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-005',
      date: iso(-18 * DAY),
      type: 'BONUS',
      amount: 750,
      description: 'Restore SLA bonus -- 100% compliance',
      status: 'COMPLETED',
    },
    {
      id: 'TXN-006',
      date: iso(0),
      type: 'SETTLEMENT',
      amount: 14200,
      description: 'February 2026 settlement -- pending',
      status: 'PENDING',
    },
  ],
};

// ---- Helpers ----------------------------------------------------------------

export function getWalletState(): WalletState {
  return walletState;
}

export function updateWalletState(updates: Partial<WalletState>): void {
  Object.assign(walletState, updates);
}

export function addWalletTransaction(txn: WalletTransaction): void {
  walletState.transactions.unshift(txn);
}
