import { Injectable } from '@angular/core';

import { Network, NetworkMetadata } from 'src/models/network.model';

@Injectable({
  providedIn: 'root',
})
export class NetworkMetadataService {

  private readonly networkMetadatas: NetworkMetadata[] = [
    {
      network: Network.AllNetworks,
      image: "all-networks.png",
      description: "Includes every supported network for chain selection."
    },
    {
      network: Network.Polkadot,
      image: "polkadot.png",
      description: "A sharded multichain network built for cross-chain data and asset transfers."
    },
    {
      network: Network.Paseo,
      image: "paseo.png",
      description: "Privacy-focused blockchain for anonymous transactions and smart contracts."
    },
    {
      network: Network.Rococo,
      image: "rococo.png",
      description: "The testnet for Polkadot, used for testing parachains and network upgrades."
    },
  ];

  getAllNetworkMetadatas(): NetworkMetadata[] {
    return [...this.networkMetadatas];
  }

  getNetworkMetadataByNetwork(network: Network): NetworkMetadata | undefined {
    return this.networkMetadatas.find(metadata => metadata.network === network);
  }
}
