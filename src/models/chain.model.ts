import { Network } from "./network.model";

export enum ChainType {
  Substrate = 'Substrate',
}

export enum ScannerType {
  Subscan = 'Subscan',
  Subsquid = 'Subsquid',
  Solscan = 'Solscan',
}

export class Scanner {
  type: ScannerType = ScannerType.Subscan;
  transfers_url?: string = "https://subsquid-v2.xode.net/graphql";
  extrinsics_url?: string = "https://subsquid-v2.xode.net/graphql";
}

export class Chain {
  id: number = 2;
  network: Network = Network.Polkadot;
  name: string = "Xode - Polkadot";
  description: string = "Experience smooth and fast transactions with Xode."
  chain_id: number = 3417;
  unit: string = "XON";
  decimal: number = 12;
  chain_type: ChainType = ChainType.Substrate;
  address_prefix: string | number | null = 280;
  image: string = "src/assets/images/networks/xode.png";
  scanner?: Scanner = {
    type: ScannerType.Subsquid,
    transfers_url: "https://subsquid-v2.xode.net/graphql",
    extrinsics_url: "https://subsquid-v2.xode.net/graphql"
  }
}
