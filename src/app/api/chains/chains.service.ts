import { Injectable } from '@angular/core';

import { Network } from "src/models/network.model"
import { Chain, ChainType, ScannerType } from "src/models/chain.model"

@Injectable({
  providedIn: 'root'
})
export class ChainsService {

  private readonly chains: Chain[] = [
    {
      id: 1,
      network: Network.AllNetworks,
      name: "All Chains",
      description: "Includes every supported chains.",
      chain_id: 0,
      unit: "DOT",
      decimal: 10,
      chain_type: ChainType.Substrate,
      address_prefix: 0,
      image: "all-chains.png",
      scanner: undefined
    },
    {
      id: 2,
      network: Network.UnknownNetwork,
      name: "Polkadot",
      description: "The heart of Web3, connecting multiple specialized blockchains into a unified network.",
      chain_id: 0,
      unit: "DOT",
      decimal: 10,
      chain_type: ChainType.Substrate,
      address_prefix: 0,
      image: "polkadot.png",
      scanner: undefined
    },
    {
      id: 3,
      network: Network.Polkadot,
      name: "Polkadot Hub",
      description: "Manage your assets easily on the AssetHub parachain.",
      chain_id: 1000,
      unit: "DOT",
      decimal: 10,
      chain_type: ChainType.Substrate,
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
      name: "Xode",
      description: "Experience smooth and fast transactions with Xode.",
      chain_id: 3417,
      unit: "XON",
      decimal: 12,
      chain_type: ChainType.Substrate,
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
      chain_type: ChainType.Substrate,
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
      description: "Test and experience Xode on the Paseo test network.",
      chain_id: 5109,
      unit: "XON",
      decimal: 12,
      chain_type: ChainType.Substrate,
      address_prefix: 280,
      image: "paseo.png",
      scanner: undefined
    },
    {
      id: 7,
      network: Network.Rococo,
      name: "Polaris",
      description: "Xode's devnet parachain on Rococo for testing purposes.",
      chain_id: 2000,
      unit: "POL",
      decimal: 12,
      chain_type: ChainType.Substrate,
      address_prefix: 280,
      image: "polaris.png",
      scanner: undefined
    }
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
