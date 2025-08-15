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

import { Network } from './../../../../models/network.model';

import { PolkadotjsService } from '../../../api/polkadotjs/polkadotjs.service';
import { NetworksService } from './../../../api/networks/networks.service';

@Component({
  selector: 'app-networks',
  templateUrl: './networks.component.html',
  styleUrls: ['./networks.component.scss'],
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
export class NetworksComponent implements OnInit {
  @Input() isAllNetworkIncluded: boolean = false;
  @Output() onSelectedNetwork = new EventEmitter<Network>();

  constructor(
    private polkadotjsService: PolkadotjsService,
    private networksService: NetworksService,
  ) { }

  networks: Network[] = [];

  getNetworks(): void {
    if (this.isAllNetworkIncluded) {
      this.networks = this.networksService.getNetworksByCategory('All');

      const liveNetworks = this.networksService.getNetworksByCategory('Live');
      if (liveNetworks.length > 0) {
        this.networks.push(...liveNetworks);
      }
    } else {
      this.networks = this.networksService.getNetworksByCategory('Live');
    }
  }

  selectNetwork(network: Network) {
    this.onSelectedNetwork.emit(network);
  }

  ngOnInit() {
    this.getNetworks();
  }
}
