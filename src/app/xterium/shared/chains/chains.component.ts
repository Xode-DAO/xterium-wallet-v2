import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
  @Input() isAllChainIncluded: boolean = false;
  @Output() onSelectedChain = new EventEmitter<Chain>();

  constructor(
    private chainsService: ChainsService,
    private settingsService: SettingsService
  ) { }

  chains: Chain[] = [];

  async getChains(): Promise<void> {
    const [allChains, polkadotChains, paseoChains, rococoChains] = [
      this.chainsService.getChainsByNetwork(Network.AllNetworks),
      this.chainsService.getChainsByNetwork(Network.Polkadot),
      this.chainsService.getChainsByNetwork(Network.Paseo),
      this.chainsService.getChainsByNetwork(Network.Rococo),
    ];

    let chains: Chain[] = this.isAllChainIncluded
      ? [...allChains, ...polkadotChains]
      : [...polkadotChains];

    const settings = await this.settingsService.get();
    const isTestnetEnabled = settings?.user_preferences?.testnet_enabled;

    if (isTestnetEnabled) {
      chains = this.isAllChainIncluded
        ? [
          ...allChains,
          ...polkadotChains,
          ...paseoChains,
          ...rococoChains
        ]
        : [
          ...polkadotChains,
          ...paseoChains,
          ...rococoChains
        ];
    }

    this.chains = chains;
  }

  selectChain(chain: Chain) {
    this.onSelectedChain.emit(chain);
  }

  ngOnInit() {
    this.getChains();
  }
}
