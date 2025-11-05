import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

import { Chain, Network } from 'src/models/chain.model';

import { PolkadotJsService } from 'src/app/api/polkadot-js/polkadot-js.service';
import { ChainsService } from 'src/app/api/chains/chains.service';

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
    IonAvatar
  ]
})
export class ChainsComponent implements OnInit {
  @Input() isAllChainIncluded: boolean = false;
  @Output() onSelectedChain = new EventEmitter<Chain>();

  constructor(
    private polkadotJsService: PolkadotJsService,
    private chainsService: ChainsService,
  ) { }

  chains: Chain[] = [];

  getChains(): void {
    if (this.isAllChainIncluded) {
      this.chains = this.chainsService.getChainsByNetwork(Network.All);

      const liveChains = this.chainsService.getChainsByNetwork(Network.Polkadot);
      if (liveChains.length > 0) {
        this.chains.push(...liveChains);
      }
    } else {
      this.chains = this.chainsService.getChainsByNetwork(Network.Polkadot);
    }
  }

  selectChain(chain: Chain) {
    this.onSelectedChain.emit(chain);
  }

  ngOnInit() {
    this.getChains();
  }
}
