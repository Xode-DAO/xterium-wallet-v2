import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonAvatar
} from '@ionic/angular/standalone';

import { Network, NetworkMetadata } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';

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
    IonChip,
    IonAvatar
  ]
})
export class ChainsComponent implements OnInit {
  @Input() selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();

  @Output() onSelectedChain = new EventEmitter<Chain>();

  constructor(
    private chainsService: ChainsService,
  ) { }

  chains: Chain[] = [];

  getChains(): void {
    const allChains = this.chainsService.getChainsByNetwork(Network.AllNetworks);
    const filteredChains = this.chainsService.getChainsByNetwork(this.selectedNetworkMetadata.network);

    this.chains = [
      ...allChains,
      ...filteredChains
    ];
  }

  selectChain(chain: Chain) {
    this.onSelectedChain.emit(chain);
  }

  ngOnInit() {
    this.getChains();
  }
}
