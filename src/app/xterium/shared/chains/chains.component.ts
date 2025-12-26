import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonAvatar,
  IonIcon
} from '@ionic/angular/standalone';

import { Network, NetworkMetadata } from 'src/models/network.model';
import { Chain } from 'src/models/chain.model';

import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';
import { ChainsService } from 'src/app/api/chains/chains.service';

import { NetworksComponent } from 'src/app/xterium/shared/networks/networks.component';

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
    IonModal,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonAvatar,
    IonIcon,
    NetworksComponent
  ]
})
export class ChainsComponent implements OnInit {
  @Output() onSelectedChain = new EventEmitter<Chain>();

  @ViewChild('selectNetworkMetadataModal', { read: IonModal }) selectNetworkMetadataModal!: IonModal;

  constructor(
    private networkMetadataService: NetworkMetadataService,
    private chainsService: ChainsService,
  ) { }

  networkMetadatas: NetworkMetadata[] = [];
  chains: Chain[] = [];

  networkMetadatasByNetwork: Record<string, NetworkMetadata[]> = {};
  chainsByNetwork: Record<string, Chain[]> = {};

  selectedNetworkMetadata: NetworkMetadata = new NetworkMetadata();

  getNetworkMetadatas(): void {
    const allNetworkMetadatas = this.networkMetadataService.getAllNetworkMetadatas();

    this.networkMetadatas = [...allNetworkMetadatas];
    this.selectedNetworkMetadata = this.networkMetadatas[0];

    this.loadNetworkMetadataByNetwork();
  }

  loadNetworkMetadataByNetwork(): void {
    this.networkMetadatasByNetwork = {};

    if (this.selectedNetworkMetadata.network === Network.AllNetworks) {
      this.networkMetadatasByNetwork["All Networks"] = this.networkMetadatas;
    } else {
      const mapped = this.networkMetadatas.filter(metadata => metadata.network.toLowerCase() === this.selectedNetworkMetadata.network.toLowerCase());
      this.networkMetadatasByNetwork[this.selectedNetworkMetadata.network] = mapped;
    }
  }

  getChains(): void {
    this.chains = this.chainsService.getAllChains();
    this.loadChainsByNetwork();
  }

  async loadChainsByNetwork(): Promise<void> {
    this.chainsByNetwork = {};

    for (const networkMetadata of this.networkMetadatas) {
      const filtered = this.chains.filter(
        n => n.network === networkMetadata.network
      );

      const mapped = await Promise.all(
        filtered.map(async network => ({
          ...network,
        }))
      );

      this.chainsByNetwork[networkMetadata.network] = mapped;
    }
  }

  selectChain(chain: Chain) {
    this.onSelectedChain.emit(chain);
  }

  openSelectNetworkMetadataModal() {
    this.selectNetworkMetadataModal.present();
  }

  onSelectedNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.selectedNetworkMetadata = networkMetadata;

    this.loadNetworkMetadataByNetwork();
    this.loadChainsByNetwork();

    this.selectNetworkMetadataModal.dismiss();
  }

  ngOnInit() {
    this.getNetworkMetadatas();
    this.getChains();
  }
}
