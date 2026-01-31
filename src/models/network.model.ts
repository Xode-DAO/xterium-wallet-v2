export enum Network {
  AllNetworks = 'All Networks',
  Polkadot = 'Polkadot',
  Paseo = 'Paseo',
  Rococo = 'Rococo',
  Solana = 'Solana',
  SolanaTestnet = 'Solana Testnet',
  SolanaDevnet = 'Solana Devnet',
  UnknownNetwork = 'Unknown Network',
}

export class NetworkMetadata {
  network: Network = Network.Polkadot;
  image: string = "polkadot.png";
  description: string = "Polkadot is a sharded blockchain protocol that enables cross-chain transfers of any type of data or asset.";
}
