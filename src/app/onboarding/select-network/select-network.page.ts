import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonAvatar,
  IonButton,
  IonCheckbox,
} from '@ionic/angular/standalone';

import { HeaderComponent } from "../shared/header/header.component";

@Component({
  selector: 'app-select-network',
  templateUrl: './select-network.page.html',
  styleUrls: ['./select-network.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonAvatar,
    IonButton,
    IonCheckbox,
    HeaderComponent
  ]
})
export class SelectNetworkPage implements OnInit {

  constructor() { }

  selectedNetwork = 'assethub';

  selectNetwork(network: string) {
    this.selectedNetwork = network;
  }

  ngOnInit() {
  }

}
