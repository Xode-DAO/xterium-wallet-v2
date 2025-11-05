export enum Network {
  All = 'All',
  Polkadot = 'Polkadot',
  Paseo = 'Paseo',
  Solana = 'Solana',
  SolanaTestnet = 'Solana Testnet',
  SolanaDevnet = 'Solana Devnet',
}

export enum ScannerType {
  Subscan = 'Subscan',
  Subsquid = 'Subsquid',
  Solscan = 'Solscan',
}

export class Scanner {
  url: string = "https://polkadot.subscan.io";
  type: ScannerType = ScannerType.Subscan;
}

export class Chain {
  id: number = 2;
  network: Network = Network.Polkadot;
  name: string = "Xode - Polkadot";
  description: string = "Experience smooth and fast transactions with Xode."
  chain_id: number = 3417;
  unit: string = "XON";
  decimal: number = 12;
  address_prefix: string | number | null = 280;
  image: string = "src/assets/images/networks/xode.png";
  scanner?: Scanner = {
    url: "https://xode.subscan.io",
    type: ScannerType.Subsquid,
  }
}
