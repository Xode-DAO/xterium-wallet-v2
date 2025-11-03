import { Injectable } from '@angular/core';

import { Network } from "src/models/network.model"

@Injectable({
  providedIn: 'root'
})
export class NetworksService {

  private readonly networks: Network[] = [
    {
      id: 0,
      name: "All Networks",
      description: "Includes every supported blockchain network for selection.",
      unit: "-",
      decimal: 10,
      category: "All",
      address_prefix: null,
      image: "all-networks.png"
    },
    {
      id: 1,
      name: "AssetHub - Polkadot",
      description: "Manage your assets easily on the AssetHub parachain.",
      unit: "DOT",
      decimal: 10,
      category: "Live",
      address_prefix: 0,
      image: "assethub.png"
    },
    {
      id: 2,
      name: "Xode - Polkadot",
      description: "Experience smooth and fast transactions with Xode.",
      unit: "XON",
      decimal: 12,
      category: "Live",
      address_prefix: 280,
      image: "xode.png"
    },
    {
      id: 3,
      name: "Hydration",
      description: "Participate in decentralized trading and liquidity on the Hydration network.",
      unit: "HDX",
      decimal: 12,
      category: "Live",
      address_prefix: 0,
      image: "hydration.png"
    },
    {
      id: 4,
      name: "Solana - Mainnet",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      unit: "SOL",
      decimal: 9,
      category: "Live",
      address_prefix: null,
      image: "solana.png"
    },
    {
      id: 5,
      name: "AssetHub - Paseo",
      description: "Manage your assets easily on the Paseo AssetHub parachain.",
      unit: "PAS",
      decimal: 10,
      category: "Testnet",
      address_prefix: 0,
      image: "paseo.png"
    },
    {
      id: 6,
      name: "Xode - Paseo",
      description: "Experience smooth and fast transactions with Xode.",
      unit: "XON",
      decimal: 12,
      category: "Testnet",
      address_prefix: null,
      image: "xode.png"
    },
    {
      id: 7,
      name: "Hydration - Paseo",
      description: "Test decentralized trading and liquidity features on Hydration’s Paseo test network.",
      unit: "HDX",
      decimal: 12,
      category: "Testnet",
      address_prefix: 0,
      image: "hydration-paseo.png"
    },
    {
      id: 8,
      name: "Solana - Testnet",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      unit: "SOL",
      decimal: 9,
      category: "Testnet",
      address_prefix: null,
      image: "solana.png"
    },
    {
      id: 9,
      name: "Solana - Devnet",
      description: "Make low-cost transactions on the high-performance Solana blockchain.",
      unit: "SOL",
      decimal: 9,
      category: "Testnet",
      address_prefix: null,
      image: "solana.png"
    },
  ];

  constructor() { }

  getAllNetworks(): Network[] {
    return [...this.networks];
  }

  getNetworksByCategory(category: string): Network[] {
    return this.networks.filter(
      net => net.category.toLowerCase() === category.toLowerCase()
    );
  }

  getNetworkById(id: number): Network | undefined {
    return this.networks.find(network => network.id === id);
  }
}
