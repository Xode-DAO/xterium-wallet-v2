import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
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
    IonCardContent,
    IonCard,
    IonAvatar,
    IonLabel,
    IonItem,
    IonList,
  ]
})
export class NetworksComponent implements OnInit {
  @Input() showAllNetworks: boolean = true;
  @Output() onSelectedNetworkMetadata = new EventEmitter<NetworkMetadata>();

  constructor(
    private networkMetadataService: NetworkMetadataService,
  ) { }

  networkMetadatas: NetworkMetadata[] = [];

  getNetworks(): void {
    this.networkMetadatas = this.networkMetadataService.getAllNetworkMetadatas();
  }

  selectNetworkMetadata(networkMetadata: NetworkMetadata) {
    this.onSelectedNetworkMetadata.emit(networkMetadata);
  }

  ngOnInit() {
    this.getNetworks();
  }
}
