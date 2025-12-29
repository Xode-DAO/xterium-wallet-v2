import { Injectable } from '@angular/core';

import { Network, NetworkMetadata } from 'src/models/network.model';
import { SettingsService } from '../settings/settings.service';

@Injectable({
  providedIn: 'root',
})
export class NetworkMetadataService {

  constructor(
    private settingsService: SettingsService
  ) { }

  private readonly networkMetadatas: NetworkMetadata[] = [
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

  async getAllNetworkMetadatas(): Promise<NetworkMetadata[]> {
    const polkadotNetworkMetadata = this.networkMetadatas.find(metadata => metadata.network === Network.Polkadot);

    const settings = await this.settingsService.get();
    if (settings) {
      const developerMode = settings.user_preferences.developer_mode;
      if (developerMode) {
        return [...this.networkMetadatas];
      }

      if (polkadotNetworkMetadata) {
        return [polkadotNetworkMetadata].filter((metadata): metadata is NetworkMetadata => metadata !== undefined);
      }
    }

    return [polkadotNetworkMetadata].filter((metadata): metadata is NetworkMetadata => metadata !== undefined);
  }

  getNetworkMetadataByNetwork(network: Network): NetworkMetadata | undefined {
    return this.networkMetadatas.find(metadata => metadata.network === network);
  }
}
