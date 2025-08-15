import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import {
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-networks',
  templateUrl: './networks.component.html',
  styleUrls: ['./networks.component.scss'],
  imports: [
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
  @Output() onSelectedNetwork = new EventEmitter<string>();

  constructor() { }

  selectNetwork(network: string) {
    this.onSelectedNetwork.emit(network);
  }

  ngOnInit() { }
}
