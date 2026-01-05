import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonChip,
} from '@ionic/angular/standalone';

import { Network } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';

import { ChainsService } from 'src/app/api/chains/chains.service';
import { SettingsService } from 'src/app/api/settings/settings.service';

@Component({
  selector: 'app-chains',
  templateUrl: './chains.component.html',
  styleUrls: ['./chains.component.scss'],
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonChip,
  ]
})
export class ChainsComponent implements OnInit {
  @Output() onSelectedChain = new EventEmitter<Chain>();

  constructor(
    private chainsService: ChainsService,
    private settingsService: SettingsService
  ) { }

  chains: Chain[] = [];

  async getChains(): Promise<void> {
    const allChains = this.chainsService.getChainsByNetwork(Network.AllNetworks);
    const polkadotChains = this.chainsService.getChainsByNetwork(Network.Polkadot);

    this.chains = [
      ...allChains,
      ...polkadotChains,
    ];

    const settings = await this.settingsService.get();
    if (settings) {
      const developerMode = settings.user_preferences.testnet_enabled;
      if (developerMode) {
        const paseoChains = this.chainsService.getChainsByNetwork(Network.Paseo);
        const rococoChains = this.chainsService.getChainsByNetwork(Network.Rococo);

        this.chains = [
          ...allChains,
          ...polkadotChains,
          ...paseoChains,
          ...rococoChains,
        ];
      }
    }
  }

  selectChain(chain: Chain) {
    this.onSelectedChain.emit(chain);
  }

  ngOnInit() {
    this.getChains();
  }
}
