import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonAvatar,
  IonButton
} from '@ionic/angular/standalone';

import { HeaderComponent } from "./../../onboarding/shared/header/header.component";

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
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonAvatar,
    IonButton,
    HeaderComponent
  ]
})
export class SelectNetworkPage implements OnInit {

  constructor() { }

  selectedNetwork = ''; // holds chosen network

  selectNetwork(network: string) {
    this.selectedNetwork = network;
    // next action: navigate / open create wallet modal / save choice etc.
  }

  ngOnInit() {
  }

}
