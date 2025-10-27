export interface FeeDetails {
  extrinsic: string;
  amount: string;
  fee: string;
  tokenSymbol: string;
  partialFee: bigint;
  decimals?: number;
}

export interface TransactionDetails {
  from: string;
  to: string;
  token: string;
  amount: bigint;
  extrinsic: string;
  assetId?: string;
  estimatedFee: FeeDetails;
  symbol?: string;
  recipient?: string;
  usdValue?: number;
}

export interface TransactionData {
  balance: any;
  recipientAddress: string;
  amount: number;
  currentWallet: any;
  currentWalletPublicAddress: string;
  networkId: number;
}

export interface FeeEstimate {
  fee: string;
  feeUSD: string;
  partialFee: bigint;
  tokenSymbol: string;
  tokenDecimals: number;
}

export type ExtrinsicCategory = 'transfer' | 'staking' | 'assets' | 'xcm' | 'swap' | 'governance' | 'unknown';

export interface ExtrinsicInfo {
  category: ExtrinsicCategory;
  title: string;
  subtitle: string;
  requiredFields: string[];
}