import { Injectable } from '@angular/core';

import { Network, NetworkMetadata } from 'src/models/network.model';

@Injectable({
  providedIn: 'root',
})
export class NetworkMetadataService {

  private readonly networkMetadatas: NetworkMetadata[] = [
    {
      network: Network.Polkadot,
      image: "polkadot.png",
      description: "Polkadot is a sharded blockchain protocol that enables cross-chain transfers of any type of data or asset."
    },
  ];

  getAllNetworkMetadatas(): NetworkMetadata[] {
    return [...this.networkMetadatas];
  }

  getNetworkMetadataByNetwork(network: Network): NetworkMetadata | undefined {
    return this.networkMetadatas.find(metadata => metadata.network === network);
  }
}
