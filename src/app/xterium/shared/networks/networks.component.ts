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

import { NetworkMetadata } from 'src/models/network.model';

import { NetworkMetadataService } from 'src/app/api/network-metadata/network-metadata.service';

@Component({
  selector: 'app-networks',
  templateUrl: './networks.component.html',
  styleUrls: ['./networks.component.scss'],
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonLabel,
    IonItem,
    IonList,
  ]
})
export class NetworksComponent implements OnInit {
  @Output() onSelectedNetworkMetadata = new EventEmitter<NetworkMetadata>();

  constructor(
    private networkMetadataService: NetworkMetadataService,
  ) { }

  networkMetadatas: NetworkMetadata[] = [];

  async getNetworks(): Promise<void> {
    this.networkMetadatas = await this.networkMetadataService.getAllNetworkMetadatas();
  }

  selectNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.onSelectedNetworkMetadata.emit(networkMetadata);
  }

  ngOnInit() {
    this.getNetworks();
  }
}
