import { Injectable } from '@angular/core';

import { Network } from "src/models/network.model"
import { Chain, ScannerType } from "src/models/chain.model"

@Injectable({
  providedIn: 'root'
})
export class ChainsService {

  private readonly chains: Chain[] = [
    {
      id: 0,
      network: Network.All,
      name: "All Chains",
      description: "Includes every supported blockchain network for selection.",
      chain_id: 0,
      unit: "DOT",
      decimal: 10,
      address_prefix: 0,
      image: "all-networks.png",
      scanner: undefined
    },
    {
      id: 1,
      network: Network.Substrate,
      name: "Substrate",
      description: "Includes every supported Substrate-based blockchain network for selection.",
      chain_id: 0,
      unit: "UNIT",
      decimal: 10,
      address_prefix: 42,
      image: "substrate.png",
      scanner: undefined
    },
    {
      id: 2,
      network: Network.UnknownNetwork,
      name: "Polkadot",
      description: "Connect to the Polkadot mainnet and its ecosystem.",
      chain_id: 0,
      unit: "DOT",
      decimal: 10,
      address_prefix: 0,
      image: "polkadot.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://polkadot.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://assethub-polkadot.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 3,
      network: Network.Polkadot,
      name: "AssetHub - Polkadot",
      description: "Manage your assets easily on the AssetHub parachain.",
      chain_id: 1000,
      unit: "DOT",
      decimal: 10,
      address_prefix: 0,
      image: "assethub.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://assethub-polkadot.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://assethub-polkadot.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 4,
      network: Network.Polkadot,
      name: "Xode - Polkadot",
      description: "Experience smooth and fast transactions with Xode.",
      chain_id: 3417,
      unit: "XON",
      decimal: 12,
      address_prefix: 280,
      image: "xode.png",
      scanner: {
        type: ScannerType.Subsquid,
        transfers_url: "https://polkadot-indexer.staginglab.info",
        extrinsics_url: "https://polkadot-indexer.staginglab.info"
      }
    },
    {
      id: 5,
      network: Network.Polkadot,
      name: "Hydration",
      description: "Participate in decentralized trading and liquidity on the Hydration network.",
      chain_id: 2034,
      unit: "HDX",
      decimal: 12,
      address_prefix: 0,
      image: "hydration.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://hydration.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://hydration.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 6,
      network: Network.Paseo,
      name: "Paseo",
      description: "Connect to the Paseo mainnet and its ecosystem.",
      chain_id: 0,
      unit: "DOT",
      decimal: 10,
      address_prefix: 0,
      image: "paseo.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://paseo.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://paseo.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 7,
      network: Network.Paseo,
      name: "AssetHub - Paseo",
      description: "Manage your assets easily on the Paseo AssetHub parachain.",
      chain_id: 1000,
      unit: "PAS",
      decimal: 10,
      address_prefix: 0,
      image: "assethub.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://assethub-paseo.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://assethub-paseo.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 8,
      network: Network.Paseo,
      name: "Xode - Paseo",
      description: "Experience smooth and fast transactions with Xode.",
      chain_id: 4607,
      unit: "XON",
      decimal: 12,
      address_prefix: null,
      image: "xode.png",
      scanner: {
        type: ScannerType.Subsquid,
        transfers_url: "https://subsquid-v2.xode.net/graphql",
        extrinsics_url: "https://subsquid-v2.xode.net/graphql"
      }
    },
    {
      id: 9,
      network: Network.Paseo,
      name: "Hydration - Paseo",
      description: "Test decentralized trading and liquidity features on Hydration’s Paseo test network.",
      chain_id: 2034,
      unit: "HDX",
      decimal: 12,
      address_prefix: 0,
      image: "hydration-paseo.png",
      scanner: {
        type: ScannerType.Subscan,
        transfers_url: "https://hydration-paseo.api.subscan.io/api/v2/scan/transfers",
        extrinsics_url: "https://hydration-paseo.api.subscan.io/api/v2/scan/extrinsics"
      }
    },
    {
      id: 10,
      network: Network.Solana,
      name: "Solana",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      chain_id: 0,
      unit: "SOL",
      decimal: 9,
      address_prefix: null,
      image: "solana.png",
      scanner: undefined
    },
    {
      id: 11,
      network: Network.SolanaTestnet,
      name: "Solana - Testnet",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      chain_id: 0,
      unit: "SOL",
      decimal: 9,
      address_prefix: null,
      image: "solana.png",
      scanner: undefined
    },
    {
      id: 12,
      network: Network.SolanaDevnet,
      name: "Solana - Devnet",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      chain_id: 0,
      unit: "SOL",
      decimal: 9,
      address_prefix: null,
      image: "solana.png",
      scanner: undefined
    },
  ];

  constructor() { }

  getAllChains(): Chain[] {
    return [...this.chains];
  }

  getChainById(id: number): Chain | undefined {
    return this.chains.find(chain => chain.id === id);
  }

  getChainsByNetwork(network: Network): Chain[] {
    return this.chains.filter(chain => chain.network === network);
  }

  getChainByChainId(chainId: number): Chain | undefined {
    return this.chains.find(chain => chain.chain_id === chainId);
  }

  getChainByName(name: string): Chain | undefined {
    return this.chains.find(chain => chain.name.toLowerCase() === name.toLowerCase());
  }
}
